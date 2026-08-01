const {allowConsole, setupConsole} = require("..");

describe("fail-on-console", function () {
    it("should disallow calling setup twice", function () {
        expect(() => setupConsole({afterEach, beforeEach})).toThrow(/Call setupConsole\(\) only once./);
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
