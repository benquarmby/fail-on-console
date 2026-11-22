import {AllowRule} from "./AllowRule";
import {ConsoleMethod} from "./ConsoleMethod";
import {ProcessStream} from "./ProcessStream";

const consoleAllowList = new Map<ConsoleMethod, AllowRule[]>();
const streamAllowList = new Map<ProcessStream, AllowRule[]>();

function isAllowed(message: string, rule: AllowRule): boolean {
    if (typeof rule === "string") {
        return message.includes(rule);
    }

    if (typeof rule === "function") {
        return rule(message);
    }

    return rule.test(message);
}

export const currentAllowList = {
    registerConsoleRule(method: ConsoleMethod, rules: AllowRule[]): void {
        const existing = consoleAllowList.get(method) ?? [];
        consoleAllowList.set(method, [...existing, ...rules]);
    },

    registerStreamRule(stream: ProcessStream, rules: AllowRule[]): void {
        const existing = streamAllowList.get(stream) ?? [];
        streamAllowList.set(stream, [...existing, ...rules]);
    },

    reset(): void {
        consoleAllowList.clear();
        streamAllowList.clear();
    },

    isConsoleAllowed(method: ConsoleMethod, message: string): boolean {
        return consoleAllowList.get(method)?.some((rule) => isAllowed(message, rule)) ?? false;
    },

    isStreamAllowed(stream: ProcessStream, message: string): boolean {
        return streamAllowList.get(stream)?.some((rule) => isAllowed(message, rule)) ?? false;
    }
};
