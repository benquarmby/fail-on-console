import {defineConfig} from "vitest/config";

const baseConfig = {
    environment: "node",
    globals: true
};
const formattingSuite = "./__tests__/formatting.test.js";
const validationSuite = "./__tests__/validation.test.js";

export default defineConfig({
    test: {
        coverage: {
            provider: "v8",
            reporter: ["html", "json-summary", "json", "text"],
            reportOnFailure: true
        },
        projects: [
            {
                test: {
                    ...baseConfig,
                    include: ["./__tests__/*.test.js"],
                    exclude: [formattingSuite, validationSuite],
                    setupFiles: ["./test.setup.js"],
                    name: "core"
                }
            },
            {
                test: {
                    ...baseConfig,
                    include: [formattingSuite],
                    name: "formatting"
                }
            },
            {
                test: {
                    ...baseConfig,
                    include: [validationSuite],
                    name: "validation"
                }
            }
        ],
        reporters: ["default", "github-actions"]
    }
});
