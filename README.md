# Fail on Console

Prevent console noise from obscuring test results.

This utility fails tests whenever unexpected `console` logs, warnings, or errors are triggered. It is compatible with Vitest and Jest.

## Features

- **Framework Agnostic**: Integrates with Vitest, Jest, or any framework exposing standard lifecycle hooks and `expect.getState()`.
- **Zero Dependencies**: Pure, lightweight JavaScript with a minimal footprint.
- **Browser Ready**: Contains no Node.js API dependencies, allowing it to run inside Vitest Browser Mode.
- **Configurable Targets**: Allows explicit selection of which console methods to monitor.
- **Flexible Allowlist**: Suppresses known or expected console outputs globally, per suite, or per individual test. Exceptions can be matched against strings, regular expressions, or custom predicate functions.

## Installation

```sh
# pnpm
pnpm add --save-dev fail-on-console

# npm
npm install --save-dev fail-on-console

# yarn
yarn add --dev fail-on-console
```

## Setup

`setup` should be called once in a global setup file, accepting the lifecycle hooks and `expect` utility from the testing framework.

### With Vitest

```ts
import {beforeEach, afterEach, expect} from "vitest";
import {setup} from "fail-on-console";

setup({beforeEach, afterEach, expect});
```

### With Jest

```ts
import {beforeEach, afterEach, expect} from "@jest/globals";
import {setup} from "fail-on-console";

setup({beforeEach, afterEach, expect});
```

### Customizing Monitored Methods

By default, `debug` is not monitored but `error`, `warn`, `info`, and `log` are. This can be customized by passing a `methods` array:

```ts
setup({
    beforeEach,
    afterEach,
    expect,
    // Fail on console.error, console.warn and console.debug.
    methods: ["error", "warn", "debug"]
});
```

## Suppressing Expected Logs

If a specific test or third-party dependency intentionally logs to the console, `allowConsole` can be used to allow the test to pass.

`allowConsole` can be invoked globally, inside a `describe` block, or inside a specific `test`/`it` block.

```javascript
import {allowConsole} from "fail-on-console";

// Allow a substring.
allowConsole("warn", "third-party library warning");

// Allow a Regular Expression.
allowConsole("error", /^Warning: Each child in a list/);

// Allow with a custom predicate function
allowConsole("log", (message) => message.startsWith("[analytics]"));

// An array of mixed matchers
allowConsole("error", ["known warning", /deprecated/, (msg) => msg.includes("third-party")]);
```

## API Reference

### `setup(options)`

Initializes console spies that monitor active tests.

- `options.beforeEach`: The framework's `beforeEach` hook.
- `options.afterEach`: The framework's `afterEach` hook.
- `options.expect`: The framework's `expect` object (must expose `getState()`).
- `options.methods`: _(Optional)_ Array of `console` methods to track. Defaults to `["error", "warn", "info", "log"]`.

### `allowConsole(method, rules)`

Registers a temporary or global allowlist rule for a monitored console method.

- `method`: `"error" | "warn" | "info" | "log" | "debug"`
- `rules`: A single rule or an array of rules. A rule can be:
    - `string`: Allowed if the console message contains this substring.
    - `RegExp`: Allowed if the regex tests true against the message.
    - `Function`: A predicate `(message: string) => boolean` returning `true` to allow the message.

## Limitations

`fail-on-console` is not compatible with concurrent asynchronous tests (e.g., `test.concurrent`). Because concurrent tests execute simultaneously within the same environment context, console logs cannot be isolated reliably per individual test. For suites requiring specific log suppression, tests must be run sequentially.

## Credits & Prior Art

This package is inspired by and builds on the excellent foundation laid by:

- [jest-fail-on-console](https://github.com/ValentinH/jest-fail-on-console) by Valentin Hervieu
- [vitest-fail-on-console](https://github.com/thomasbrodusch/vitest-fail-on-console) by Thomas Brodusch

## License

MIT
