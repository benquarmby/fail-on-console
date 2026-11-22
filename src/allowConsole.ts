import {AllowRule} from "./AllowRule";
import {assertSupportedMethods} from "./assertions";
import {ConsoleMethod} from "./ConsoleMethod";
import {currentAllowList} from "./currentAllowList";
import {currentTestApi} from "./currentTestApi";

export function allowConsole(method: ConsoleMethod, rules: AllowRule | AllowRule[]): void {
    const {beforeEach} = currentTestApi.getFor(allowConsole.name);

    assertSupportedMethods([method]);

    const normalized = Array.isArray(rules) ? rules : [rules];

    function addRules(): void {
        currentAllowList.registerConsoleRule(method, normalized);
    }

    if (currentTestApi.isInsideTest) {
        addRules();
    } else {
        beforeEach(addRules);
    }
}
