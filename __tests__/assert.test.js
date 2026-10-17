const {allowConsole, setupConsole} = require("..");

setupConsole({
    afterEach,
    beforeEach,
    methods: ["assert", "warn"]
});

function allowWarnRoute() {
    allowConsole("warn", /^Assertion failed/);
}

/**
 * console.assert() only logs when its condition is falsy, so only those
 * calls count. Node's own console.assert() reports through console.warn(),
 * which is monitored here too, so the failure tests first allow that route.
 * A failure can then only come from the assert monitoring itself.
 */
describe("console.assert monitoring", function () {
    it("should pass when the condition is truthy", function () {
        console.assert(true);
        console.assert(1, "a truthy condition never logs");
        console.assert("yes", "%s", "not even with a message");
        console.assert({}, "or an object");
    });

    it("should not evaluate allow rules for a passing assertion", function () {
        let callCount = 0;
        allowConsole("assert", () => {
            callCount += 1;
            return true;
        });

        console.assert(true, "passes");

        expect(callCount).toBe(0);
    });

    it.fails?.("should fail the test when the condition is false", function () {
        allowWarnRoute();
        console.assert(false, "completely unexpected assertion");
    });

    it.fails?.("should fail the test when the condition is falsy but not false", function () {
        allowWarnRoute();
        console.assert(0, "completely unexpected assertion");
    });

    it.fails?.("should fail the test when called without arguments", function () {
        allowWarnRoute();
        console.assert();
    });

    it("should match allow rules against the printed message, without the condition", function () {
        let captured;
        allowConsole("assert", (message) => {
            captured = message;
            return true;
        });

        console.assert(false, "%s has %d items", "cart", 3);

        expect(captured).toBe("Assertion failed: cart has 3 items");
    });

    it("should print only the prefix when there is no message", function () {
        let captured;
        allowConsole("assert", (message) => {
            captured = message;
            return true;
        });

        console.assert(false);

        expect(captured).toBe("Assertion failed");
    });

    it("should accept a string matcher", function () {
        allowConsole("assert", "single string match");
        console.assert(false, "some text with a single string match inside");
    });

    it("should accept a regular expression matcher", function () {
        allowConsole("assert", /^Assertion failed: expected \d+ items$/);
        console.assert(false, "expected %d items", 42);
    });

    it("should pass an allowed failing assertion without also allowing console.warn", function () {
        allowConsole("assert", "allowed on its own");
        console.assert(false, "allowed on its own");
    });

    it.fails?.("should not let an allowed assertion message allow the same console.warn", function () {
        allowConsole("assert", "shared message");
        console.warn("shared message");
    });
});
