import {defineConfig} from "vitest/config";

const baseConfig = {
    environment: "node",
    globals: true
};

export default defineConfig({
    test: {
        projects: [
            {
                test: {
                    ...baseConfig,
                    include: ["./__tests__/core.test.js"],
                    setupFiles: ["./vitest.setup.js"],
                    name: "core"
                }
            },
            {
                test: {
                    ...baseConfig,
                    include: ["./__tests__/validation.test.js"],
                    name: "validation"
                }
            }
        ]
    }
});
