export type ConsoleMethod = "error" | "warn" | "info" | "log" | "debug";
export type ProcessStream = "stderr" | "stdout";

export interface ExpectStateLike {
    currentTestName?: string;
}

export interface ExpectLike {
    getState(): ExpectStateLike;
}

export interface LifecycleHookLike {
    (fn: () => void): void;
}

export interface FormatLike {
    (format?: any, ...args: any[]): string;
}

export interface TestApi {
    beforeEach: LifecycleHookLike;
    afterEach: LifecycleHookLike;
    /**
     * @deprecated No longer needed. This option can be omitted.
     */
    expect?: ExpectLike;
}

export interface SetupOptions extends TestApi {
    methods?: ConsoleMethod[];
    streams?: ProcessStream[];
    format?: FormatLike;
}

export interface AllowPredicate {
    (message: string): boolean;
}

export type AllowRule = string | RegExp | AllowPredicate;

/**
 * @deprecated Use setupConsole() instead. This function will be removed in a
 * future major version.
 */
export function setup(options: SetupOptions): void;

/**
 * Installs console spies that fail the current test if any monitored console
 * method is called. Call once at the top of the test setup file, passing the
 * lifecycle hooks from the test framework. Compatible with any Jest-like API
 * (Vitest, Jest, etc.).
 * @param {Object} options
 * @param {Function} options.beforeEach The beforeEach hook from the test framework.
 * @param {Function} options.afterEach The afterEach hook from the test framework.
 * @param {Function} [options.format] Optional function to format console messages. Uses a basic shim by default.
 * @param {string[]} [options.methods=["error","warn","info","log"]] Console methods to monitor.
 * @param {string[]} [options.streams=[]] Process streams to monitor. None by default.
 * @example
 * // Vitest
 * import {beforeEach, afterEach} from "vitest";
 * import {setup} from "fail-on-console";
 *
 * setup({beforeEach, afterEach});
 * @example
 * // Jest
 * import {beforeEach, afterEach} from "@jest/globals";
 * import {setup} from "fail-on-console";
 *
 * setup({beforeEach, afterEach});
 */
export function setupConsole(options: SetupOptions): void;

/**
 * Allows specific console calls to pass. Console exceptions can be configured
 * globally, within a describe block or inside a single test.
 * @param {string} method The console method to allow: "error", "warn", "info",
 * "log" or "debug".
 * @param {string|RegExp|Function|Array<string|RegExp|Function>} rules One or
 * more rules. A message is allowed if any rule finds a match. A string matches
 * when the message contains it. A RegExp matches when it tests true against
 * the message. A function receives the message and returns true to allow it.
 * @example
 * // String - allow any warn containing this substring
 * allowConsole("warn", "third-party library warning");
 * @example
 * // RegExp - allow errors matching a pattern
 * allowConsole("error", /^Warning: Each child in a list/);
 * @example
 * // Predicate - allow logs from a specific source
 * allowConsole("log", (message) => message.startsWith("[analytics]"));
 * @example
 * // Mixed array - allow multiple rules at once
 * allowConsole("error", ["known warning", /deprecated/, (m) => m.includes("third-party")]);
 */
export function allowConsole(method: ConsoleMethod, rules: AllowRule | AllowRule[]): void;

/**
 * Allows specific writes to `process.stdout` or `process.stderr` to pass.
 * Stream exceptions can be configured globally, within a describe block or
 * inside a single test. No-op in environments where `globalThis.process` does
 * not exist.
 * @param {string} stream The target process stream to allow: "stdout" or "stderr".
 * @param {string|RegExp|Function|Array<string|RegExp|Function>} rules One or
 * more rules. A message is allowed if any rule finds a match. A string matches
 * when the message contains it. A RegExp matches when it tests true against
 * the message. A function receives the message and returns true to allow it.
 * @example
 * // String - allow standard output containing this substring
 * allowStream("stdout", "unavoidable log message");]);
 * @example
 * // Mixed array - allow standard errors using multiple rules at once
 * allowStream("stderr", ["known warning", /deprecated/, (m) => m.includes("third-party")]);
 */
export function allowStream(stream: ProcessStream, rules: AllowRule | AllowRule[]): void;
