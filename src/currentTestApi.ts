import {TestApi} from "./TestApi";

// Module scoped variables to manage test state. Not safe for concurrent tests.
// Test frameworks run tests serially by default.
let testApi: TestApi | undefined;
let insideTest = false;

export const currentTestApi = {
    register(api: TestApi): void {
        if (testApi) {
            throw new Error("fail-on-console: Call setupConsole() only once.");
        }

        if (typeof api.beforeEach !== "function" || typeof api.afterEach !== "function") {
            throw new Error("fail-on-console: beforeEach and afterEach hooks must be provided.");
        }

        testApi = api;
    },

    getFor(callerName: string): TestApi {
        if (!testApi) {
            throw new Error(`fail-on-console: Call setupConsole() before using ${callerName}().`);
        }

        return testApi;
    },

    enterTest(): void {
        insideTest = true;
    },

    exitTest(): void {
        insideTest = false;
    },

    get isInsideTest(): boolean {
        return insideTest;
    }
};
