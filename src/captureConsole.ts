import {ConsoleMethod} from "./ConsoleMethod";
import {FormatLike} from "./FormatLike";
import {MethodCall} from "./MethodCall";
import {MethodCaptor} from "./MethodCaptor";
import {currentAllowList} from "./currentAllowList";

export function captureConsole(method: ConsoleMethod, format: FormatLike): MethodCaptor {
    const originalDescriptor = Object.getOwnPropertyDescriptor(console, method);
    const calls: MethodCall[] = [];

    function consoleOverride(...args: any[]) {
        let message: string;

        if (method === "assert") {
            const [condition, ...data] = args;

            if (condition) {
                // Passing assertion, nothing would be logged.
                return;
            }

            message = data.length ? `Assertion failed: ${format(...data)}` : "Assertion failed";
        } else {
            message = format(...args);
        }

        if (currentAllowList.isConsoleAllowed(method, message)) {
            return;
        }

        const call = {message, stack: ""};
        Error.captureStackTrace?.(call, consoleOverride);

        calls.push(call);
    }

    return {
        enterTest() {
            calls.length = 0;

            console[method] = consoleOverride;
        },

        exitTest() {
            if (originalDescriptor) {
                Object.defineProperty(console, method, originalDescriptor);
            } else {
                // If there was no "own" descriptor, the method lives on the
                // prototype. Remove the instance override.
                Reflect.deleteProperty(console, method);
            }

            if (!calls.length) {
                return [];
            }

            const detail = calls.map(({message, stack}) => `${message}\n${stack}`).join("\n\n");

            return [
                `Expected test not to call console.${method}().\n\n${detail}\n\nIf expected, use allowConsole("${method}", ...) to add an exception.`
            ];
        }
    };
}
