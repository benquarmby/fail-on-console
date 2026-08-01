const {allowStream, setupConsole} = require("..");

describe("process stream monitoring", function () {
    allowStream("stdout", ["expected write from a third-party library"]);

    it("should pass when process.stdout.write is called with a globally allowed message", function () {
        process.stdout.write("globally allowed process.stdout.write");
    });

    it("should pass when process.stdout.write is called with an allowed message", function () {
        process.stdout.write("expected write from a third-party library");
    });

    it.fails?.("should fail the test when an un-allowed stdout write occurs", function () {
        process.stdout.write("completely unexpected output");
    });

    it.fails?.("should fail the test when an un-allowed stderr write occurs", function () {
        process.stderr.write("completely unexpected output");
    });

    it.fails?.("should not treat an allowed stderr message as allowed on stdout", function () {
        allowStream("stderr", ["only meant for stderr"]);
        process.stdout.write("only meant for stderr");
    });

    it("should fail when trying to allow writes to an unsupported stream", function () {
        expect(() => allowStream("stdin", "nope")).toThrow(
            'fail-on-console: One or more unsupported process streams provided: "stdin". Supported process streams are: "stderr", "stdout".'
        );
    });

    it("should fail when trying to allow writes to an unknown stream", function () {
        expect(() => allowStream("output", "unknown")).toThrow(
            'fail-on-console: One or more unsupported process streams provided: "output". Supported process streams are: "stderr", "stdout".'
        );
    });

    describe("rule types", function () {
        it("should accept a single string matcher", function () {
            allowStream("stdout", "single string match");
            process.stdout.write("some text with a single string match inside");
        });

        it("should accept a regular expression matcher", function () {
            allowStream("stdout", /progress: \d+%/);
            process.stdout.write("progress: 42%");
        });

        it("should accept a custom predicate function", function () {
            allowStream("stdout", (message) => message.startsWith("predicate"));
            process.stdout.write("predicate match at the start");
        });

        it("should accept a mixed array of matchers", function () {
            allowStream("stdout", ["string match", /regex match/, (message) => message.includes("predicate")]);
            process.stdout.write("first string match");
            process.stdout.write("second regex match");
            process.stdout.write("third predicate match");
        });
    });

    describe("scope and isolation", function () {
        describe("describe block", function () {
            allowStream("stderr", ["scoped stderr message"]);

            it("should allow the message within this explicit scope", function () {
                process.stderr.write("scoped stderr message");
            });
        });

        describe("sibling describe block", function () {
            it.fails?.("should fail because the sibling describe rule doesn't leak sideways", function () {
                process.stderr.write("scoped stderr message");
            });
        });

        it("should apply inline allow rules only to the current test", function () {
            allowStream("stdout", ["inline stdout message"]);
            process.stdout.write("inline stdout message");
        });

        it.fails?.("should fail because the previous inline rule doesn't leak downward", function () {
            process.stdout.write("inline stdout message");
        });
    });

    describe("buffer and encoding handling", function () {
        it("should decode a Buffer using the provided encoding", function () {
            let captured;
            allowStream("stdout", (message) => {
                captured = message;
                return true;
            });

            process.stdout.write(Buffer.from("hello"), "base64");

            expect(captured).toBe("aGVsbG8=");
        });

        it("should decode a Buffer as utf8 when no encoding is provided", function () {
            let captured;
            allowStream("stdout", (message) => {
                captured = message;
                return true;
            });

            process.stdout.write(Buffer.from("plain buffer text"));

            expect(captured).toBe("plain buffer text");
        });

        it("should decode a non-Buffer typed array view using TextDecoder", function () {
            let captured;
            allowStream("stdout", (message) => {
                captured = message;
                return true;
            });

            const chunk = new TextEncoder().encode("typed array text");
            process.stdout.write(chunk);

            expect(captured).toBe("typed array text");
        });

        it("should throw like Node's real write() when given a chunk that isn't a string or buffer", function () {
            expect(() => process.stdout.write(12345)).toThrow(
                expect.objectContaining({
                    name: "TypeError",
                    code: "ERR_INVALID_ARG_TYPE"
                })
            );
        });

        it("should invoke the callback and return true when the second argument is a callback", function () {
            allowStream("stdout", () => true);
            let callCount = 0;

            const result = process.stdout.write(Buffer.from("buffered"), () => {
                callCount += 1;
            });

            expect(result).toBe(true);
            expect(callCount).toBe(1);
        });

        it("should treat a function second argument as the callback rather than the encoding", function () {
            let captured;
            let callCount = 0;
            allowStream("stdout", (message) => {
                captured = message;
                return true;
            });

            process.stdout.write("two-arg form", () => {
                callCount += 1;
            });

            expect(captured).toBe("two-arg form");
            expect(callCount).toBe(1);
        });

        it("should support the (chunk, encoding, callback) signature without shifting the encoding", function () {
            let captured;
            let callCount = 0;
            allowStream("stdout", (message) => {
                captured = message;
                return true;
            });

            process.stdout.write(Buffer.from("hello"), "hex", () => {
                callCount += 1;
            });

            expect(captured).toBe(Buffer.from("hello").toString("hex"));
            expect(callCount).toBe(1);
        });

        it("should not throw when no callback is provided", function () {
            allowStream("stdout", () => true);

            expect(() => process.stdout.write("no callback here")).not.toThrow();
        });
    });
});
