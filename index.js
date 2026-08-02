const supportedMethods = ["error", "warn", "info", "log", "debug"];
const supportedStreams = ["stderr", "stdout"];
// Everything but console.debug is monitored by default. Debug logging in tests
// is usually intentional.
const defaultMethods = supportedMethods.slice(0, -1);
// No streams are monitored by default.
const defaultStreams = [];
// %s string, %d/%i integer, %o object, %f float
const printfPattern = /%[sdiof]/g;

// Module scoped variables to manage test state. Not safe for concurrent tests.
// Test frameworks run tests serially by default.
let testApi;
let isInsideTest = false;
const allowedMethods = new Map();
const allowedStreams = new Map();

function quoteString(value) {
    return `"${value}"`;
}

function assertSupportedValues(pluralName, supportedValues, values) {
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

function assertSupportedMethods(methods) {
    return assertSupportedValues("console methods", supportedMethods, methods);
}

function assertSupportedStreams(streams) {
    return assertSupportedValues("process streams", supportedStreams, streams);
}

/**
 * Basic implementation of node:util/format for console message formatting.
 * Covers only the most common uses. Does not handle all specifiers (such as
 * object expansion) or other edge cases.
 * @param {...*} args The list of arguments passed to the console method.
 * @returns {string} The formatted message string.
 */
function basicFormat(...args) {
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

function isAllowed(message, rule) {
    if (typeof rule === "string") {
        return message.includes(rule);
    }

    if (typeof rule === "function") {
        return rule(message);
    }

    return rule.test(message);
}

function chunkToString(chunk, encoding = "utf8") {
    if (typeof chunk === "string") {
        return chunk;
    }

    if (ArrayBuffer.isView(chunk)) {
        if (Buffer.isBuffer(chunk)) {
            return chunk.toString(encoding);
        }

        return new TextDecoder(encoding).decode(chunk);
    }

    return Buffer.from(chunk).toString(encoding);
}

function setupConsole({
    beforeEach,
    afterEach,
    format = basicFormat,
    methods = defaultMethods,
    streams = defaultStreams
}) {
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
        const calls = [];

        beforeEach(function () {
            calls.length = 0;

            console[method] = function consoleOverride(...args) {
                const message = format(...args);
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
        const calls = [];

        beforeEach(function () {
            calls.length = 0;

            stream.write = function streamOverride(chunk, encoding, cb) {
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
            };
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

function allowConsole(method, rules) {
    if (!testApi) {
        throw new Error("fail-on-console: Call setupConsole() before using allowConsole().");
    }

    assertSupportedMethods([method]);

    const normalized = Array.isArray(rules) ? rules : [rules];

    function addRules() {
        const existing = allowedMethods.get(method) ?? [];
        allowedMethods.set(method, [...existing, ...normalized]);
    }

    if (isInsideTest) {
        addRules();
    } else {
        testApi.beforeEach(addRules);
    }
}

function allowStream(stream, rules) {
    if (!testApi) {
        throw new Error("fail-on-console: Call setupConsole() before using allowStream().");
    }

    assertSupportedStreams([stream]);

    const normalized = Array.isArray(rules) ? rules : [rules];

    function addRules() {
        const existing = allowedStreams.get(stream) ?? [];
        allowedStreams.set(stream, [...existing, ...normalized]);
    }

    if (isInsideTest) {
        addRules();
    } else {
        testApi.beforeEach(addRules);
    }
}

exports.setup = setupConsole;
exports.setupConsole = setupConsole;
exports.allowConsole = allowConsole;
exports.allowStream = allowStream;
