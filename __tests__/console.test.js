const {allowConsole, setupConsole} = require("..");

describe("console method monitoring", function () {
    allowConsole("warn", ["expected warning from a third-party library"]);

    it("should pass when console.warn is called with an allowed message", function () {
        console.warn("expected warning from a third-party library");
    });

    describe("nested scopes", function () {
        allowConsole("error", ["expected error from a nested suite"]);

        it("should pass when both allowed messages are called", function () {
            console.warn("expected warning from a third-party library");
            console.error("expected error from a nested suite");
        });

        it("should pass when console.log is called with a globally allowed message", function () {
            console.log("globally allowed console.log");
        });
    });

    it("should pass when console.log is called with an inline allowed message", function () {
        allowConsole("info", ["unexpected inline info message"]);
        console.info("unexpected inline info message");
    });

    it.fails?.("should fail the test when an un-allowed console error occurs", function () {
        console.warn("completely unexpected warning");
    });

    it("should fail when trying to allow calls to the assert method", function () {
        expect(() => allowConsole("assert", "nope")).toThrow(
            'fail-on-console: One or more unsupported console methods provided: "assert". Supported console methods are: "error", "warn", "info", "log", "debug".'
        );
    });

    it("should fail when trying to allow calls to an unknown method", function () {
        expect(() => allowConsole("warning", "unknown")).toThrow(
            'fail-on-console: One or more unsupported console methods provided: "warning". Supported console methods are: "error", "warn", "info", "log", "debug".'
        );
    });

    describe("rule types", function () {
        it("should accept a single string matcher", function () {
            allowConsole("warn", "single string match");
            console.warn("some text with a single string match inside");
        });

        it("should accept a regular expression matcher", function () {
            allowConsole("warn", /regex \d+ match/);
            console.warn("regex 42 match");
        });

        it("should accept a custom predicate function", function () {
            allowConsole("warn", (message) => message.startsWith("predicate"));
            console.warn("predicate match at the start");
        });

        it("should accept a mixed array of matchers", function () {
            allowConsole("warn", ["string match", /regex match/, (message) => message.includes("predicate")]);
            console.warn("first string match");
            console.warn("second regex match");
            console.warn("third predicate match");
        });
    });

    describe("printf-style formatting", function () {
        it("should substitute a %s string specifier", function () {
            allowConsole("log", (message) => {
                expect(message).toBe("hello world");
                return true;
            });

            console.log("hello %s", "world");
        });

        it("should substitute %d and %i integer specifiers", function () {
            allowConsole("log", (message) => {
                expect(message).toBe("3 apples and 5 oranges");
                return true;
            });

            console.log("%d apples and %i oranges", 3, 5);
        });

        it("should substitute a %f float specifier", function () {
            allowConsole("log", (message) => {
                expect(message).toBe("pi is roughly 3.14");
                return true;
            });

            console.log("pi is roughly %f", 3.14);
        });

        it("should substitute multiple specifiers in positional order", function () {
            allowConsole("log", (message) => {
                expect(message).toBe("Ada is 36 years old");
                return true;
            });

            console.log("%s is %d years old", "Ada", 36);
        });

        it("should append extra primitive arguments beyond the specifiers, space-joined and unquoted", function () {
            allowConsole("log", (message) => {
                expect(message).toBe("Ada says hi extra 42");
                return true;
            });

            console.log("%s says hi", "Ada", "extra", 42);
        });

        it("should leave a specifier literal when there aren't enough arguments to fill it", function () {
            allowConsole("log", (message) => {
                expect(message).toBe("only one and %s");
                return true;
            });

            console.log("%s and %s", "only one");
        });

        it("should produce an empty string for a call with no arguments", function () {
            allowConsole("log", (message) => {
                expect(message).toBe("");
                return true;
            });

            console.log();
        });

        it.fails?.("should fail the test when the formatted message doesn't match what's expected", function () {
            allowConsole("log", (message) => {
                expect(message).toBe("this does not match");
                return true;
            });

            console.log("hello %s", "world");
        });
    });

    /**
     * This suite explicitly calls out the known console formatting limitations
     * covered by the README. Correct the tests before filling in the gaps in
     * red-green-refactor style.
     */
    describe("printf-style known gaps", function () {
        it("should stringify an object for a %o specifier instead of inspecting it", function () {
            allowConsole("log", (message) => {
                // Real console would be similar to "value: { a: 1 }"
                expect(message).toBe("value: [object Object]");
                expect(message).not.toBe("value: { a: 1 }");
                return true;
            });

            console.log("value: %o", {a: 1});
        });

        it("should ignore specifiers outside the supported set, like %% or %j", function () {
            allowConsole("log", (message) => {
                // Node console would be similar to "100% done, extra: [Circular]"
                expect(message).toBe("100%% done, extra: %j [object Object]");
                expect(message).not.toBe("100% done, extra: [Circular]");
                return true;
            });

            const circular = {};
            circular.self = circular;

            console.log("100%% done, extra: %j", circular);
        });

        it("should stringify and space-join all arguments, unquoted, when the first isn't a string", function () {
            allowConsole("log", (message) => {
                // Real console would be similar to "{ a: 1 } 'text' 42"
                expect(message).toBe("[object Object] text 42");
                expect(message).not.toBe("{ a: 1 } 'text' 42");
                return true;
            });

            console.log({a: 1}, "text", 42);
        });

        it("should consume the next positional argument as-is, regardless of whether it matches the specifier's type", function () {
            allowConsole("log", (message) => {
                // Real console would be similar to "NaN"
                expect(message).toBe("not a number");
                expect(message).not.toBe("NaN");
                return true;
            });

            console.log("%d", "not a number");
        });
    });

    describe("scope and isolation", function () {
        describe("describe block", function () {
            allowConsole("error", ["scoped error message"]);

            it("should allow the message within this explicit scope", function () {
                console.error("scoped error message");
            });
        });

        describe("sibling describe block", function () {
            it.fails?.("should fail because the sibling describe rule doesn't leak sideways", function () {
                console.error("scoped error message");
            });
        });

        it("should apply inline allow rules only to the current test", function () {
            allowConsole("warn", ["inline warn message"]);
            console.warn("inline warn message");
        });

        it.fails?.("should fail because the previous inline rule doesn't leak downward", function () {
            console.warn("inline warn message");
        });
    });

    /**
     * This suite simply proves why concurrency can't work. Test state is
     * mutated at module scope, much like fail-on-console handles allow rules.
     */
    describe("concurrent gap", function () {
        it.concurrent?.("should report the wrong test name given a slow timeout", async function () {
            await new Promise((resolve) => setTimeout(resolve, 50));
            expect(expect.getState().currentTestName).toMatch(/fast timeout$/);
        });

        it.concurrent?.("should report the correct test name given a fast timeout", async function () {
            await new Promise((resolve) => setTimeout(resolve, 10));
            expect(expect.getState().currentTestName).toMatch(/fast timeout$/);
        });
    });
});
