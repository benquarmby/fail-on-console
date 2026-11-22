import {ConsoleMethod} from "./ConsoleMethod";
import {FormatLike} from "./FormatLike";
import {ProcessStream} from "./ProcessStream";
import {TestApi} from "./TestApi";

export interface SetupOptions extends TestApi {
    methods?: ConsoleMethod[];
    streams?: ProcessStream[];
    format?: FormatLike;
}
