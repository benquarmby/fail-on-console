const {allowConsole, setupConsole} = require("..");

setupConsole({afterEach, beforeEach});

function expectFormattedMessage(level, expected) {
    allowConsole(level, function (actual) {
        expect(actual).toBe(expected);
        return true;
    });
}

/**
 * This suite covers the basic console formatter which is used when no custom
 * formatter is specified.
 */
describe("console formatting", function () {
    it("should substitute a %s string specifier", function () {
        expectFormattedMessage("log", "hello world");

        console.log("hello %s", "world");
    });

    it("should substitute %d and %i integer specifiers", function () {
        expectFormattedMessage("warn", "3 apples and 5 oranges");

        console.warn("%d apples and %i oranges", 3, 5);
    });

    it("should substitute a %f float specifier", function () {
        expectFormattedMessage("info", "pi is roughly 3.14");

        console.info("pi is roughly %f", 3.14);
    });

    it("should substitute multiple specifiers in positional order", function () {
        expectFormattedMessage("error", "Ada is 36 years old");

        console.error("%s is %d years old", "Ada", 36);
    });

    it("should append extra primitive arguments beyond the specifiers, space-joined and unquoted", function () {
        expectFormattedMessage("log", "Ada says hi extra 42");

        console.log("%s says hi", "Ada", "extra", 42);
    });

    it("should leave a specifier literal when there aren't enough arguments to fill it", function () {
        expectFormattedMessage("info", "only one and %s");

        console.info("%s and %s", "only one");
    });

    it("should produce an empty string for a call with no arguments", function () {
        expectFormattedMessage("warn", "");

        console.warn();
    });

    it.fails?.("should fail the test when the formatted message doesn't match what's expected", function () {
        expectFormattedMessage("error", "this does not match");

        console.error("hello %s", "world");
    });
});
