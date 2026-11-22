import {assertSupportedMethods, assertSupportedStreams, assertValidFormatter} from "./assertions";
import {ConsoleMethod} from "./ConsoleMethod";
import {currentAllowList} from "./currentAllowList";
import {currentTestApi} from "./currentTestApi";
import {defaultFormat} from "./defaultFormat";
import {ProcessStream} from "./ProcessStream";
import {SetupOptions} from "./SetupOptions";

type WriteCallback = (err?: Error | null) => void;

interface ConsoleCall {
    message: string;
    stack: string;
}

// Everything but console.debug and console.assert is monitored by default.
// Debug and assert logging in tests is usually intentional.
const defaultMethods: ConsoleMethod[] = ["error", "warn", "info", "log"];
// No streams are monitored by default.
const defaultStreams: ProcessStream[] = [];

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
    assertValidFormatter(format);
    assertSupportedMethods(methods);
    assertSupportedStreams(streams);

    currentTestApi.register({beforeEach, afterEach});

    beforeEach(function () {
        currentTestApi.enterTest();
        currentAllowList.reset();
    });

    afterEach(function () {
        currentTestApi.exitTest();
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

                if (currentAllowList.isConsoleAllowed(method, message)) {
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

                if (!currentAllowList.isStreamAllowed(streamName, message)) {
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
