import {ExpectLike} from "./ExpectLike";
import {LifecycleHookLike} from "./LifecycleHookLike";

export interface TestApi {
    beforeEach: LifecycleHookLike;
    afterEach: LifecycleHookLike;
    /**
     * @deprecated No longer needed. This option can be omitted.
     */
    expect?: ExpectLike;
}
