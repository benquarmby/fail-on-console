let testApi;
const defaultMethods = ["error", "warn", "info", "log"];
const allowed = new Map();
// %s string, %d/%i integer, %o object, %f float
const printfPattern = /%[sdiof]/g;

/**
 * Basic implementation of node:util/format for console message formatting.
 * Covers only the most common uses. Does not handle all specifiers (such as
 * object expansion) or other edge cases.
 * @param {...*} args The list of arguments passed to the console method.
 * @returns {string} The formatted message string.
 */
function format(...args) {
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

function setupConsole({beforeEach, afterEach, expect, methods = defaultMethods}) {
    if (testApi) {
        throw new Error("fail-on-console: Call setupConsole() only once.");
    }

    testApi = {beforeEach, afterEach, expect};

    beforeEach(() => allowed.clear());

    methods.forEach(function (method) {
        const original = console[method];
        const calls = [];

        beforeEach(function () {
            calls.length = 0;

            console[method] = function consoleOverride(...args) {
                const message = format(...args);
                const rules = allowed.get(method);

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
}

function allowConsole(method, rules) {
    if (!testApi) {
        throw new Error("fail-on-console: Call setupConsole() before using allowConsole().");
    }

    const normalized = Array.isArray(rules) ? rules : [rules];
    const isInsideTest = !!testApi.expect.getState().currentTestName;

    function addRules() {
        const existing = allowed.get(method) ?? [];
        allowed.set(method, [...existing, ...normalized]);
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
