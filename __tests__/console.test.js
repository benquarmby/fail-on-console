const {allowConsole} = require("..");

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

    it("should fail when trying to allow calls to an unknown method", function () {
        expect(() => allowConsole("warning", "unknown")).toThrow(
            'fail-on-console: One or more unsupported console methods provided: "warning". Supported console methods are: "error", "warn", "info", "log", "debug", "assert".'
        );
    });

    it("should pretty print and space-join all arguments using the configured formatter", function () {
        allowConsole("log", (message) => {
            // This is not possible with the basic formatter.
            expect(message).toBe("{ a: 1 } text 42");
            return true;
        });

        console.log({a: 1}, "text", 42);
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
});
