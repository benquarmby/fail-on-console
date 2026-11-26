import {assertSupportedMethods, assertSupportedStreams, assertValidFormatter} from "./assertions";
import {captureConsole} from "./captureConsole";
import {captureStream} from "./captureStream";
import {ConsoleMethod} from "./ConsoleMethod";
import {currentAllowList} from "./currentAllowList";
import {currentTestApi} from "./currentTestApi";
import {defaultFormat} from "./defaultFormat";
import {ProcessStream} from "./ProcessStream";
import {SetupOptions} from "./SetupOptions";

// Everything but console.debug and console.assert is monitored by default.
// Debug and assert logging in tests is usually intentional.
const defaultMethods: ConsoleMethod[] = ["error", "warn", "info", "log"];
// No streams are monitored by default.
const defaultStreams: ProcessStream[] = [];

export function setupConsole({
    beforeEach,
    afterEach,
    format = defaultFormat,
    methods = defaultMethods,
    streams = defaultStreams
}: SetupOptions): void {
    assertValidFormatter(format);
    assertSupportedMethods(methods);
    assertSupportedStreams(streams);

    currentTestApi.register({beforeEach, afterEach});

    const captors = methods.map((method) => captureConsole(method, format)).concat(streams.map(captureStream));

    beforeEach(function () {
        currentTestApi.enterTest();
        currentAllowList.reset();
        captors.forEach((captor) => captor.capture());
    });

    afterEach(function () {
        currentTestApi.exitTest();
        const failures = captors.flatMap((captor) => captor.release());

        if (failures.length) {
            throw new Error(failures.join("\n\n"));
        }
    });
}
