# Fail on Console

Fail Vitest or Jest tests when unexpected console logs, warnings or errors occur.

[![npm version](https://img.shields.io/npm/v/fail-on-console.svg)](https://www.npmjs.com/package/fail-on-console)
[![license](https://img.shields.io/npm/l/fail-on-console.svg)](https://github.com/benquarmby/fail-on-console/blob/main/LICENSE)

The `fail-on-console` utility fails test suites whenever unexpected `console` logs, warnings, or errors are triggered, keeping test results clear and easy to read.

## Features

- **⚡ Vitest and Jest Native**: Seamless integration with Vitest (including Browser Mode) and Jest using standard lifecycle hooks.
- **🪶 Zero Dependencies**: Pure, lightweight JavaScript with a tiny footprint.
- **🎯 Configurable Targets**: Choose exactly which console methods to monitor (`log`, `warn`, `error`, `info`, `debug`).
- **📋 Flexible Allowlist**: Easily suppress expected console noise globally, per suite, or per test using strings, regular expressions, or custom predicates.

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

### With Vitest

Initialize `setupConsole` inside a configured [`setupFiles`](https://vitest.dev/config/setupfiles) module (e.g., `vitest.setup.js`).

```js
// vitest.setup.js
import {beforeEach, afterEach, expect} from "vitest";
import {setupConsole} from "fail-on-console";

setupConsole({beforeEach, afterEach, expect});
```

### With Jest

Initialize `setupConsole` inside a configured [`setupFilesAfterEnv`](https://jestjs.io/docs/configuration#setupfilesafterenv-array) module (e.g., `jest.setup.js`).

```js
// jest.setup.js
import {beforeEach, afterEach, expect} from "@jest/globals";
import {setupConsole} from "fail-on-console";

setupConsole({beforeEach, afterEach, expect});
```

### Customizing Monitored Methods

By default, `debug` is not monitored but `error`, `warn`, `info`, and `log` are. This can be customized by passing a `methods` array:

```ts
setupConsole({
    beforeEach,
    afterEach,
    expect,
    // Fail on console.error, console.warn, and console.debug.
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

### `setupConsole(options)`

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
