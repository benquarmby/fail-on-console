export type ConsoleMethod = "error" | "warn" | "info" | "log" | "debug";

export interface ExpectStateLike {
    currentTestName?: string;
}

export interface ExpectLike {
    getState(): ExpectStateLike;
}

export interface LifecycleHookLike {
    (fn: () => void): void;
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
 * @param {string[]} [options.methods=["error","warn","info","log"]] Console methods to monitor.
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
 * "log", "debug", or "assert".
 * @param {string|RegExp|Function|Array<string|RegExp|Function>} rules One or
 * more matchers. A message is allowed if any matcher matches it. A string
 * matches when the message contains it. A RegExp matches when it tests true
 * against the message. A function receives the message and returns true to
 * allow it.
 * @example
 * // Single string - allow any warn containing this substring
 * allowConsole("warn", "third-party library warning");
 * @example
 * // RegExp - allow errors matching a pattern
 * allowConsole("error", /^Warning: Each child in a list/);
 * @example
 * // Predicate - allow logs from a specific source
 * allowConsole("log", (message) => message.startsWith("[analytics]"));
 * @example
 * // Mixed array - allow multiple matchers at once
 * allowConsole("error", ["known warning", /deprecated/, (m) => m.includes("third-party")]);
 */
export function allowConsole(method: ConsoleMethod, rules: AllowRule | AllowRule[]): void;
