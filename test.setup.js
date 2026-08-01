const {allowConsole, allowStream, setupConsole} = require(".");

setupConsole({
    afterEach,
    beforeEach,
    streams: ["stdout", "stderr"]
});
allowConsole("log", ["globally allowed console.log"]);
allowStream("stdout", ["globally allowed process.stdout.write"]);
