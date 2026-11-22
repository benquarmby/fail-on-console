import {format} from "util";
import {allowConsole, allowStream, setupConsole} from "..";

setupConsole({
    afterEach,
    beforeEach,
    format,
    streams: ["stdout", "stderr"]
});
allowConsole("log", ["globally allowed console.log"]);
allowStream("stdout", ["globally allowed process.stdout.write"]);
