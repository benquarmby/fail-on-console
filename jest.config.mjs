const validationSuite = "<rootDir>/__tests__/validation.test.js";
const formattingSuite = "<rootDir>/__tests__/formatting.test.js";

export default {
    testEnvironment: "node",
    projects: [
        {
            displayName: "core",
            setupFilesAfterEnv: ["<rootDir>/test.setup.js"],
            testMatch: ["<rootDir>/__tests__/*.test.js"],
            testPathIgnorePatterns: [formattingSuite, validationSuite]
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
