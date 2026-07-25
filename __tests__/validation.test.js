const {setupConsole, allowConsole} = require("..");
const testApi = {beforeEach, afterEach};

// Setup validation must run in a separate suite because setupConsole can only
// be run successfully once per global scope.
describe("fail-on-console setup validation", function () {
    it("should disallow calling allowConsole before setupConsole", function () {
        expect(() => allowConsole("warn", ["order of operations"])).toThrow(
            "fail-on-console: Call setupConsole() before using allowConsole()."
        );
    });

    it("should throw given non array methods", function () {
        expect(() =>
            setupConsole({
                ...testApi,
                methods: null
            })
        ).toThrow("fail-on-console: Expected an array of console methods.");
    });

    it("should explicitly dissallow the assert method", function () {
        expect(() =>
            setupConsole({
                ...testApi,
                methods: ["assert", "info", "debug"]
            })
        ).toThrow(
            'fail-on-console: Unsupported console method provided: "assert". Supported methods are: "error", "warn", "info", "log", "debug".'
        );
    });

    it("should dissalow multiple invalid methods", function () {
        expect(() =>
            setupConsole({
                ...testApi,
                methods: ["nope", "info", "yep", "error"]
            })
        ).toThrow(
            'fail-on-console: Unsupported console methods provided: "nope", "yep". Supported methods are: "error", "warn", "info", "log", "debug".'
        );
    });
});
