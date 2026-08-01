const validationSuite = "<rootDir>/__tests__/validation.test.js";

export default {
    testEnvironment: "node",
    projects: [
        {
            displayName: "core",
            setupFilesAfterEnv: ["<rootDir>/test.setup.js"],
            testMatch: ["<rootDir>/__tests__/*.test.js"],
            testPathIgnorePatterns: [validationSuite]
        },
        {
            displayName: "validation",
            testMatch: [validationSuite]
        }
    ]
};
