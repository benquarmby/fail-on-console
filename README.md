# Fail on Console

Fail Vitest or Jest tests when unexpected console logs, warnings or errors occur.

[![npm version](https://img.shields.io/npm/v/fail-on-console.svg)](https://www.npmjs.com/package/fail-on-console)
[![license](https://img.shields.io/npm/l/fail-on-console.svg)](https://github.com/benquarmby/fail-on-console/blob/main/LICENSE)

The `fail-on-console` utility fails test suites whenever unexpected `console` output or `process` writes are triggered, keeping test results clear and easy to read.

## Features

- **⚡ Vitest and Jest Native**: Seamless integration with Vitest (including Browser Mode) and Jest using standard lifecycle hooks.
- **📡 Raw Stream Monitoring:** Fails on unexpected writes to `process.stdout` or `process.stderr` on top of standard console calls. Output from libraries that write directly to the stream doesn't slip through.
- **🪶 Zero Dependencies**: Pure, lightweight JavaScript with a tiny footprint.
- **🎯 Configurable Targets**: Choose exactly which console methods and / or process streams to monitor.
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
import {beforeEach, afterEach} from "vitest";
import {setupConsole} from "fail-on-console";

setupConsole({beforeEach, afterEach});
```

### With Jest

Initialize `setupConsole` inside a configured [`setupFilesAfterEnv`](https://jestjs.io/docs/configuration#setupfilesafterenv-array) module (e.g., `jest.setup.js`).

```js
// jest.setup.js
import {beforeEach, afterEach} from "@jest/globals";
import {setupConsole} from "fail-on-console";

setupConsole({beforeEach, afterEach});
```

### Customizing Monitored Methods and Streams

By default, `console.debug` is not monitored but `error`, `warn`, `info`, and `log` are. This can be customized by passing a `methods` array. Similarly, `process.stdout` and `process.stderr` are not monitored by default, but can be configured with a `streams` array:

```js
setupConsole({
    beforeEach,
    afterEach,
    // Fail on console.error, console.warn, and console.debug.
    methods: ["error", "warn", "debug"],
    // Fail when libraries like Bunyan write straight to process.stdout,
    // bypassing console entirely.
    streams: ["stdout", "stderr"]
});
```

### Using a Custom Formatter

By default, a lightweight and browser compatible equivalent of the Node.js [`util.format()`](https://nodejs.org/api/util.html#utilformatformat-args) function is used for `printf`-like formatting of console messages. It covers the most common use cases but has limitations. If a more accurate and complete implementation is required, pass it as the `format` option:

```js
import util from "node:util";

setupConsole({
    beforeEach,
    afterEach,
    format: util.format
});
```

## Suppressing Expected Logs

If a specific test or third-party dependency intentionally logs to the console, `allowConsole` and `allowStream` can be used to allow the test to pass.

These functions can be invoked globally, inside a `describe` block, or inside a specific `test`/`it` block.

```js
import {allowConsole, allowStream} from "fail-on-console";

// Allow a substring.
allowConsole("warn", "third-party library warning");

// Allow a Regular Expression.
allowStream("stderr", /^Warning: Each child in a list/);

// Allow with a custom predicate function
allowConsole("log", (message) => message.startsWith("[analytics]"));

// An array of mixed matchers
allowStream("stdout", ["known warning", /deprecated/, (msg) => msg.includes("third-party")]);
```

## API Reference

### `setupConsole(options)`

Initializes console spies that monitor active tests.

- `options.beforeEach`: The framework's `beforeEach` hook.
- `options.afterEach`: The framework's `afterEach` hook.
- `options.format`: _(Optional)_ A custom `printf`-like console message formatter. Defaults to a basic implementation.
- `options.methods`: _(Optional)_ Array of `console` methods to track. Defaults to `["error", "warn", "info", "log"]`.
- `options.streams`: _(Optional)_ Array of `process` streams to track. Defaults to `[]` (no streams monitored).

### `allowConsole(method, rules)`

Registers a temporary or global allowlist rule for a monitored console method.

- `method`: `"error" | "warn" | "info" | "log" | "debug"`
- `rules`: A single rule or an array of rules. A rule can be:
    - `string`: Allowed if the console message contains this substring.
    - `RegExp`: Allowed if the regex tests true against the message.
    - `Function`: A predicate `(message: string) => boolean` returning `true` to allow the message.

### `allowStream(stream, rules)`

Registers a temporary or global allowlist rule for a monitored process stream.

- `stream`: `"stdout" | "stderr"`
- `rules`: A single rule or an array of rules. A rule can be:
    - `string`: Allowed if the written message contains this substring.
    - `RegExp`: Allowed if the regex tests true against the message.
    - `Function`: A predicate `(message: string) => boolean` returning `true` to allow the message.

## Limitations

### Concurrency

`fail-on-console` is not compatible with concurrent asynchronous tests (e.g., `test.concurrent`). Because concurrent tests execute simultaneously within the same environment context, console logs cannot be isolated reliably per individual test. For suites requiring specific log suppression, tests must be run sequentially.

### Assert

Monitoring `console.assert` is currently unsupported. It has a distinct signature and unique assertion mechanics compared to standard logging methods.

### Mocha

Mocha is unsupported due to API incompatibilities related to test context. There are no clean or reliable workarounds for integration.

### Browser Mode

`process.stdout` and `process.stderr` don't exist in a real browser environment, so the `streams` option has no effect under Vitest Browser Mode. `setupConsole` detects this and silently skips stream monitoring rather than throwing. `methods` monitoring is unaffected and works normally.

## Credits & Prior Art

This package is inspired by and builds on the excellent foundation laid by:

- [jest-fail-on-console](https://github.com/ValentinH/jest-fail-on-console) by Valentin Hervieu
- [vitest-fail-on-console](https://github.com/thomasbrodusch/vitest-fail-on-console) by Thomas Brodusch

## License

MIT
