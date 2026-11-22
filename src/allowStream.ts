import {AllowRule} from "./AllowRule";
import {assertSupportedStreams} from "./assertions";
import {currentAllowList} from "./currentAllowList";
import {currentTestApi} from "./currentTestApi";
import {ProcessStream} from "./ProcessStream";

export function allowStream(stream: ProcessStream, rules: AllowRule | AllowRule[]): void {
    const {beforeEach} = currentTestApi.getFor(allowStream.name);

    assertSupportedStreams([stream]);

    const normalized = Array.isArray(rules) ? rules : [rules];

    function addRules(): void {
        currentAllowList.registerStreamRule(stream, normalized);
    }

    if (currentTestApi.isInsideTest) {
        addRules();
    } else {
        beforeEach(addRules);
    }
}
