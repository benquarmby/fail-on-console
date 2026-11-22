export type ConsoleMethod = "error" | "warn" | "info" | "log" | "debug" | "assert";
export type ProcessStream = "stderr" | "stdout";

export interface ExpectStateLike {
    currentTestName?: string;
}

export interface ExpectLike {
    getState(): ExpectStateLike;
}

export interface LifecycleHookLike {
    (fn: () => void): void;
}

export interface FormatLike {
    (format?: any, ...args: any[]): string;
}

export interface TestApi {
    beforeEach: LifecycleHookLike;
    afterEach: LifecycleHookLike;
    /**
     * @deprecated No longer needed. This option can be omitted.
     */
    expect?: ExpectLike;
}

export interface SetupOptions extends TestApi {
    methods?: ConsoleMethod[];
    streams?: ProcessStream[];
    format?: FormatLike;
}

export interface AllowPredicate {
    (message: string): boolean;
}

export type AllowRule = string | RegExp | AllowPredicate;

interface ConsoleCall {
    message: string;
    stack: string;
}

type WriteCallback = (err?: Error | null) => void;

const supportedMethods: ConsoleMethod[] = ["error", "warn", "info", "log", "debug", "assert"];
const supportedStreams: ProcessStream[] = ["stderr", "stdout"];
// Everything but console.debug and console.assert is monitored by default.
// Debug and assert logging in tests is usually intentional.
const defaultMethods: ConsoleMethod[] = supportedMethods.slice(0, 4);
// No streams are monitored by default.
const defaultStreams: ProcessStream[] = [];
// %s string, %d/%i integer, %o object, %f float
const printfPattern = /%[sdiof]/g;

// Module scoped variables to manage test state. Not safe for concurrent tests.
// Test frameworks run tests serially by default.
let testApi: TestApi | undefined;
let isInsideTest = false;
const allowedMethods = new Map<ConsoleMethod, AllowRule[]>();
const allowedStreams = new Map<ProcessStream, AllowRule[]>();

function quoteString(value: string): string {
    return `"${value}"`;
}

function assertSupportedValues(pluralName: string, supportedValues: readonly string[], values: unknown): void {
    if (!Array.isArray(values)) {
        throw new Error(`fail-on-console: Expected an array of ${pluralName}.`);
    }

    const unsupported = values.filter((value) => !supportedValues.includes(value));

    if (!unsupported.length) {
        return;
    }

    const invalidList = unsupported.map(quoteString).join(", ");
    const validList = supportedValues.map(quoteString).join(", ");

    throw new Error(
        `fail-on-console: One or more unsupported ${pluralName} provided: ${invalidList}. Supported ${pluralName} are: ${validList}.`
    );
}

function assertSupportedMethods(methods: unknown): void {
    return assertSupportedValues("console methods", supportedMethods, methods);
}

function assertSupportedStreams(streams: unknown): void {
    return assertSupportedValues("process streams", supportedStreams, streams);
}

/**
 * Basic implementation of node:util/format for console message formatting.
 * Covers only the most common uses. Does not handle all specifiers (such as
 * object expansion) or other edge cases.
 * @param {...*} args The list of arguments passed to the console method.
 * @returns {string} The formatted message string.
 */
function defaultFormat(...args: any[]): string {
    const [format, ...values] = args;

    if (typeof format !== "string") {
        return args.map(String).join(" ");
    }

    let valueIndex = 0;
    const result = format.replace(printfPattern, function (match) {
        const value = values[valueIndex];
        const formatted = valueIndex < values.length ? String(value) : match;
        valueIndex += 1;

        return formatted;
    });

    if (valueIndex < values.length) {
        return result + " " + values.slice(valueIndex).map(String).join(" ");
    }

    return result;
}

function isAllowed(message: string, rule: AllowRule): boolean {
    if (typeof rule === "string") {
        return message.includes(rule);
    }

    if (typeof rule === "function") {
        return rule(message);
    }

    return rule.test(message);
}

function chunkToString(chunk: unknown, encoding: BufferEncoding = "utf8"): string {
    if (typeof chunk === "string") {
        return chunk;
    }

    if (ArrayBuffer.isView(chunk)) {
        if (Buffer.isBuffer(chunk)) {
            return chunk.toString(encoding);
        }

        const intArray = new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength);

        return new TextDecoder(encoding).decode(intArray);
    }

    // Deliberately pass unknown values to Buffer.from so invalid inputs throw
    // ERR_INVALID_ARG_TYPE. This is the same behavior as WriteStream#write().
    const anyChunk: any = chunk;

    return Buffer.from(anyChunk).toString(encoding);
}

export function setupConsole({
    beforeEach,
    afterEach,
    format = defaultFormat,
    methods = defaultMethods,
    streams = defaultStreams
}: SetupOptions): void {
    if (testApi) {
        throw new Error("fail-on-console: Call setupConsole() only once.");
    }

    if (typeof beforeEach !== "function" || typeof afterEach !== "function") {
        throw new Error("fail-on-console: beforeEach and afterEach hooks must be provided.");
    }

    if (typeof format !== "function") {
        throw new Error("fail-on-console: A custom formatter must be a function.");
    }

    assertSupportedMethods(methods);
    assertSupportedStreams(streams);

    testApi = {beforeEach, afterEach};

    beforeEach(function () {
        isInsideTest = true;
        allowedMethods.clear();
        allowedStreams.clear();
    });

    afterEach(function () {
        isInsideTest = false;
    });

    methods.forEach(function (method) {
        const original = console[method];
        const calls: ConsoleCall[] = [];

        beforeEach(function () {
            calls.length = 0;

            console[method] = function consoleOverride(...args: any[]) {
                let message: string;

                if (method === "assert") {
                    const [condition, ...data] = args;

                    if (condition) {
                        // Passing assertion, nothing would be logged.
                        return;
                    }

                    message = data.length ? `Assertion failed: ${format(...data)}` : "Assertion failed";
                } else {
                    message = format(...args);
                }

                const rules = allowedMethods.get(method);

                if (rules?.some((rule) => isAllowed(message, rule))) {
                    return;
                }

                const call = {message, stack: ""};
                Error.captureStackTrace?.(call, consoleOverride);

                calls.push(call);
            };
        });

        afterEach(function () {
            console[method] = original;

            if (!calls.length) {
                return;
            }

            const detail = calls.map(({message, stack}) => `${message}\n${stack}`).join("\n\n");

            throw new Error(
                `Expected test not to call console.${method}().\n\n${detail}\n\nIf expected, use allowConsole("${method}", ...) to add an exception.`
            );
        });
    });

    streams.forEach(function (streamName) {
        const stream = globalThis.process?.[streamName];

        if (!stream) {
            return;
        }

        const originalWrite = stream.write;
        const calls: ConsoleCall[] = [];

        beforeEach(function () {
            calls.length = 0;

            function streamOverride(chunk: Uint8Array | string, cb?: WriteCallback): boolean;
            function streamOverride(chunk: Uint8Array | string, encoding?: BufferEncoding, cb?: WriteCallback): boolean;
            function streamOverride(
                chunk: Uint8Array | string,
                encoding?: BufferEncoding | WriteCallback,
                cb?: WriteCallback
            ): boolean {
                if (typeof encoding === "function") {
                    cb = encoding;
                    encoding = undefined;
                }

                const message = chunkToString(chunk, encoding);
                const rules = allowedStreams.get(streamName);

                if (!rules?.some((rule) => isAllowed(message, rule))) {
                    const call = {message, stack: ""};
                    Error.captureStackTrace?.(call, streamOverride);

                    calls.push(call);
                }

                cb?.();

                return true;
            }

            stream.write = streamOverride;
        });

        afterEach(function () {
            stream.write = originalWrite;

            if (!calls.length) {
                return;
            }

            const detail = calls.map(({message, stack}) => `${message}\n${stack}`).join("\n\n");

            throw new Error(
                `Expected test not to write to process.${streamName}.\n\n${detail}\n\nIf expected, use allowStream("${streamName}", ...) to add an exception.`
            );
        });
    });
}

/**
 * @deprecated Use setupConsole() instead. This function will be removed in a
 * future major version.
 */
export const setup: typeof setupConsole = setupConsole;

export function allowConsole(method: ConsoleMethod, rules: AllowRule | AllowRule[]): void {
    if (!testApi) {
        throw new Error("fail-on-console: Call setupConsole() before using allowConsole().");
    }

    assertSupportedMethods([method]);

    const normalized = Array.isArray(rules) ? rules : [rules];

    function addRules(): void {
        const existing = allowedMethods.get(method) ?? [];
        allowedMethods.set(method, [...existing, ...normalized]);
    }

    if (isInsideTest) {
        addRules();
    } else {
        testApi.beforeEach(addRules);
    }
}

export function allowStream(stream: ProcessStream, rules: AllowRule | AllowRule[]): void {
    if (!testApi) {
        throw new Error("fail-on-console: Call setupConsole() before using allowStream().");
    }

    assertSupportedStreams([stream]);

    const normalized = Array.isArray(rules) ? rules : [rules];

    function addRules(): void {
        const existing = allowedStreams.get(stream) ?? [];
        allowedStreams.set(stream, [...existing, ...normalized]);
    }

    if (isInsideTest) {
        addRules();
    } else {
        testApi.beforeEach(addRules);
    }
}
