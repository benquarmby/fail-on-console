const {setupConsole, allowConsole, allowStream} = require("..");
const testApi = {beforeEach, afterEach};

// Setup validation must run in a separate suite because setupConsole can only
// be run successfully once per global scope.
describe("fail-on-console setup validation", function () {
    it("should disallow calling allowConsole before setupConsole", function () {
        expect(() => allowConsole("warn", ["order of console operations"])).toThrow(
            "fail-on-console: Call setupConsole() before using allowConsole()."
        );
    });

    it("should throw given non array methods", function () {
        const methods = null;

        expect(() => setupConsole({...testApi, methods})).toThrow(
            "fail-on-console: Expected an array of console methods."
        );
    });

    it("should explicitly dissallow the assert method", function () {
        const methods = ["assert", "info", "debug"];

        expect(() => setupConsole({...testApi, methods})).toThrow(
            'fail-on-console: One or more unsupported console methods provided: "assert". Supported console methods are: "error", "warn", "info", "log", "debug".'
        );
    });

    it("should dissalow multiple invalid methods", function () {
        const methods = ["nope", "info", "yep", "error"];

        expect(() => setupConsole({...testApi, methods})).toThrow(
            'fail-on-console: One or more unsupported console methods provided: "nope", "yep". Supported console methods are: "error", "warn", "info", "log", "debug".'
        );
    });

    it("should disallow calling allowStream before setupConsole", function () {
        expect(() => allowStream("stdout", ["order of stream operations"])).toThrow(
            "fail-on-console: Call setupConsole() before using allowStream()."
        );
    });

    it("should throw given non array streams", function () {
        const streams = null;

        expect(() => setupConsole({...testApi, streams})).toThrow(
            "fail-on-console: Expected an array of process streams."
        );
    });

    it("should explicitly dissallow the stdin stream", function () {
        const streams = ["stdin"];

        expect(() => setupConsole({...testApi, streams})).toThrow(
            'fail-on-console: One or more unsupported process streams provided: "stdin". Supported process streams are: "stderr", "stdout".'
        );
    });

    it("should dissalow multiple invalid streams", function () {
        const streams = ["nope", "stdout", "yep", "stderr"];

        expect(() => setupConsole({...testApi, streams})).toThrow(
            'fail-on-console: One or more unsupported process streams provided: "nope", "yep". Supported process streams are: "stderr", "stdout".'
        );
    });
});
