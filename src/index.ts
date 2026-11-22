import {setupConsole} from "./setupConsole";

export {allowConsole} from "./allowConsole";
export {allowStream} from "./allowStream";
export {setupConsole};
/**
 * @deprecated Use setupConsole() instead. This function will be removed in a
 * future major version.
 */
export const setup = setupConsole;

export type {AllowPredicate, AllowRule} from "./AllowRule";
export type {ConsoleMethod} from "./ConsoleMethod";
export type {ExpectLike, ExpectStateLike} from "./ExpectLike";
export type {FormatLike} from "./FormatLike";
export type {LifecycleHookLike} from "./LifecycleHookLike";
export type {ProcessStream} from "./ProcessStream";
export type {SetupOptions} from "./SetupOptions";
export type {TestApi} from "./TestApi";
