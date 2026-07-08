export default {
    defaultIgnores: false,
    extends: ["@commitlint/config-conventional"],
    rules: {
        "scope-empty": [2, "always"]
    }
};
