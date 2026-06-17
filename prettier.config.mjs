export default {
    printWidth: 120,
    tabWidth: 4,
    trailingComma: "none",
    bracketSpacing: false,
    overrides: [
        {
            files: ["*.yaml", "*.yml"],
            options: {
                tabWidth: 2
            }
        }
    ],
    plugins: ["prettier-plugin-packagejson"]
};
