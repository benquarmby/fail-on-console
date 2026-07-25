const {allowConsole, setupConsole} = require(".");

setupConsole({afterEach, beforeEach});
allowConsole("log", ["globally allowed message"]);
