import {allowConsole, allowStream, setupConsole} from "..";
import {format} from "util";

setupConsole({
    afterEach,
    beforeEach,
    format,
    streams: ["stdout", "stderr"]
});
allowConsole("log", ["globally allowed console.log"]);
allowStream("stdout", ["globally allowed process.stdout.write"]);
