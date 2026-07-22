const {allowConsole, setupConsole} = require("..");

setupConsole({afterEach, beforeEach});
allowConsole("log", ["globally allowed message"]);

describe("fail-on-console core behavior", function () {
    allowConsole("warn", ["expected warning from a third-party library"]);

    it("should pass when console.warn is called with an allowed message", function () {
        console.warn("expected warning from a third-party library");
    });

    it("should disallow calling setup twice", function () {
        expect(() => setupConsole({afterEach, beforeEach})).toThrow(/Call setupConsole\(\) only once./);
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
     * This suite simply proves why concurrency can't work. Allow rules are
     * mutated at module scope.
     */
    describe("concurrent gap", function () {
        it.concurrent?.("should correctly allow a warning given a slow timeout", async function () {
            allowConsole("warn", ["slow timeout"]);
            await new Promise((resolve) => setTimeout(resolve, 50));
            console.warn("slow timeout");
        });

        it.concurrent?.("should incorrectly allow the same warning given a fast timeout", async function () {
            await new Promise((resolve) => setTimeout(resolve, 10));
            // Allow rule from slow test leaked into the fast one.
            console.warn("slow timeout");
        });
    });
});
