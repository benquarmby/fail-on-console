const {allowConsole, setup} = require("..");

setup({afterEach, beforeEach, expect});

allowConsole("log", ["globally allowed message"]);

describe("fail-on-console", function () {
    allowConsole("warn", ["unexpected warning from a third-party library"]);

    it("should pass when console.warn is called with a allowed message", function () {
        console.warn("unexpected warning from a third-party library");
    });

    describe("nested", function () {
        allowConsole("error", ["expected error from a nested suite"]);

        it("should pass when both allowed messages are called", function () {
            console.warn("unexpected warning from a third-party library");
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
});
