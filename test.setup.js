const {allowConsole, allowStream, setupConsole} = require(".");
const {format} = require("util");

setupConsole({
    afterEach,
    beforeEach,
    format,
    streams: ["stdout", "stderr"]
});
allowConsole("log", ["globally allowed console.log"]);
allowStream("stdout", ["globally allowed process.stdout.write"]);
