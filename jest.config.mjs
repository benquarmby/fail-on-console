export default {
    testEnvironment: "node",
    projects: [
        {
            displayName: "core",
            setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
            testMatch: ["<rootDir>/__tests__/core.test.js"]
        },
        {
            displayName: "validation",
            testMatch: ["<rootDir>/__tests__/validation.test.js"]
        }
    ]
};
