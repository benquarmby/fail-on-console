const {allowConsole, setupConsole, setup} = require("..");

// Jest doesn't include `afterEach` failures within `it.failing`. Only vitest
// can be used to cover true positive assertion failures.
const itFails = globalThis.vitest ? it.fails : it.skip;

setupConsole({afterEach, beforeEach, expect});

allowConsole("log", ["globally allowed message"]);

describe("fail-on-console core behavior", function () {
    allowConsole("warn", ["expected warning from a third-party library"]);

    it("should pass when console.warn is called with an allowed message", function () {
        console.warn("expected warning from a third-party library");
    });

    it("should disallow calling setup twice", function () {
        expect(() => setupConsole({afterEach, beforeEach, expect})).toThrow(/Call setupConsole\(\) only once./);
    });

    describe("nested scopes", function () {
        allowConsole("error", ["expected error from a nested suite"]);

        it("should pass when both allowed messages are called", function () {
            console.warn("expected warning from a third-party library");
            console.error("expected error from a nested suite");
        });

        it("should pass when console.log is called with a globally allowed message", function () {
            console.log("globally allowed message");
        });
    });

    it("should pass when console.log is called with a globally allowed message", function () {
        allowConsole("info", ["unexpected inline info message"]);
        console.info("unexpected inline info message");
    });

    itFails("should fail the test when an un-allowed console error occurs", function () {
        console.warn("completely unexpected warning");
    });

    it("should fail when trying to allow calls to the assert method", function () {
        expect(() => allowConsole("assert", "nope")).toThrow(
            'fail-on-console: Unsupported console method provided: "assert". Supported methods are: "error", "warn", "info", "log", "debug".'
        );
    });

    it("should fail when trying to allow calls to an unknown method", function () {
        expect(() => allowConsole("warning", "unknown")).toThrow(
            'fail-on-console: Unsupported console method provided: "warning". Supported methods are: "error", "warn", "info", "log", "debug".'
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

    describe("scope and isolation", function () {
        describe("describe block", function () {
            allowConsole("error", ["scoped error message"]);

            it("should allow the message within this explicit scope", function () {
                console.error("scoped error message");
            });
        });

        describe("sibling describe block", function () {
            itFails("should fail because the sibling describe rule doesn't leak sideways", function () {
                console.error("scoped error message");
            });
        });

        it("should apply inline allow rules only to the current test", function () {
            allowConsole("warn", ["inline warn message"]);
            console.warn("inline warn message");
        });

        itFails("should fail because the previous inline rule doesn't leak downward", function () {
            console.warn("inline warn message");
        });
    });

    /**
     * This suite simply proves why concurrency can't work. Test state is
     * mutated at module scope, much like fail-on-console handles allow rules.
     */
    describe("concurrent gap", function () {
        it.concurrent("should report the wrong test name given a slow timeout", async function () {
            await new Promise((resolve) => setTimeout(resolve, 50));
            expect(expect.getState().currentTestName).toMatch(/fast timeout$/);
        });

        it.concurrent("should report the correct test name given a fast timeout", async function () {
            await new Promise((resolve) => setTimeout(resolve, 10));
            expect(expect.getState().currentTestName).toMatch(/fast timeout$/);
        });
    });
});
