import {ConsoleMethod} from "./ConsoleMethod";
import {ProcessStream} from "./ProcessStream";

const supportedMethods: ConsoleMethod[] = ["error", "warn", "info", "log", "debug", "assert"];
const supportedStreams: ProcessStream[] = ["stderr", "stdout"];

function quoteString(value: string): string {
    return `"${value}"`;
}

function assertSupportedValues(pluralName: string, supportedValues: readonly string[], values: unknown): void {
    if (!Array.isArray(values)) {
        throw new Error(`fail-on-console: Expected an array of ${pluralName}.`);
    }

    const unsupported = values.filter((value) => !supportedValues.includes(value));

    if (!unsupported.length) {
        return;
    }

    const invalidList = unsupported.map(quoteString).join(", ");
    const validList = supportedValues.map(quoteString).join(", ");

    throw new Error(
        `fail-on-console: One or more unsupported ${pluralName} provided: ${invalidList}. Supported ${pluralName} are: ${validList}.`
    );
}

export function assertSupportedMethods(methods: unknown): void {
    assertSupportedValues("console methods", supportedMethods, methods);
}

export function assertSupportedStreams(streams: unknown): void {
    assertSupportedValues("process streams", supportedStreams, streams);
}

export function assertValidFormatter(format: unknown): void {
    if (typeof format !== "function") {
        throw new Error("fail-on-console: A custom formatter must be a function.");
    }
}
