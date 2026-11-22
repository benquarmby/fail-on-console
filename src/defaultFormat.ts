// %s string, %d/%i integer, %o object, %f float
const printfPattern = /%[sdiof]/g;

/**
 * Basic implementation of node:util/format for console message formatting.
 * Covers only the most common uses. Does not handle all specifiers (such as
 * object expansion) or other edge cases.
 * @param {...*} args The list of arguments passed to the console method.
 * @returns {string} The formatted message string.
 */
export function defaultFormat(...args: any[]): string {
    const [format, ...values] = args;

    if (typeof format !== "string") {
        return args.map(String).join(" ");
    }

    let valueIndex = 0;
    const result = format.replace(printfPattern, function (match) {
        const value = values[valueIndex];
        const formatted = valueIndex < values.length ? String(value) : match;
        valueIndex += 1;

        return formatted;
    });

    if (valueIndex < values.length) {
        return result + " " + values.slice(valueIndex).map(String).join(" ");
    }

    return result;
}
