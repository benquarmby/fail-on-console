const assertSuite = "<rootDir>/__tests__/assert.test.js";
const formattingSuite = "<rootDir>/__tests__/formatting.test.js";
const validationSuite = "<rootDir>/__tests__/validation.test.js";

export default {
    testEnvironment: "node",
    projects: [
        {
            displayName: "core",
            setupFilesAfterEnv: ["<rootDir>/test.setup.js"],
            testMatch: ["<rootDir>/__tests__/*.test.js"],
            testPathIgnorePatterns: [assertSuite, formattingSuite, validationSuite]
        },
        {
            displayName: "assert",
            testMatch: [assertSuite]
        },
        {
            displayName: "formatting",
            testMatch: [formattingSuite]
        },
        {
            displayName: "validation",
            testMatch: [validationSuite]
        }
    ]
};
