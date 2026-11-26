import {currentAllowList} from "./currentAllowList";
import {MethodCall} from "./MethodCall";
import {MethodCaptor} from "./MethodCaptor";
import {ProcessStream} from "./ProcessStream";

type WriteCallback = (err?: Error | null) => void;

const stubCaptor: MethodCaptor = {
    capture() {},
    release() {
        return [];
    }
};

function chunkToString(chunk: unknown, encoding: BufferEncoding = "utf8"): string {
    if (typeof chunk === "string") {
        return chunk;
    }

    if (ArrayBuffer.isView(chunk)) {
        if (Buffer.isBuffer(chunk)) {
            return chunk.toString(encoding);
        }

        const intArray = new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength);

        return new TextDecoder(encoding).decode(intArray);
    }

    // Deliberately pass unknown values to Buffer.from so invalid inputs throw
    // ERR_INVALID_ARG_TYPE. This is the same behavior as WriteStream#write().
    const anyChunk: any = chunk;

    return Buffer.from(anyChunk).toString(encoding);
}

export function captureStream(streamName: ProcessStream): MethodCaptor {
    const stream = globalThis.process?.[streamName];

    if (!stream) {
        return stubCaptor;
    }

    const originalDescriptor = Object.getOwnPropertyDescriptor(stream, "write");
    const calls: MethodCall[] = [];

    function streamOverride(chunk: Uint8Array | string, cb?: WriteCallback): boolean;
    function streamOverride(chunk: Uint8Array | string, encoding?: BufferEncoding, cb?: WriteCallback): boolean;
    function streamOverride(
        chunk: Uint8Array | string,
        encoding?: BufferEncoding | WriteCallback,
        cb?: WriteCallback
    ): boolean {
        if (typeof encoding === "function") {
            cb = encoding;
            encoding = undefined;
        }

        const message = chunkToString(chunk, encoding);

        if (!currentAllowList.isStreamAllowed(streamName, message)) {
            const call = {message, stack: ""};
            Error.captureStackTrace?.(call, streamOverride);

            calls.push(call);
        }

        cb?.();

        return true;
    }

    return {
        capture() {
            calls.length = 0;

            stream.write = streamOverride;
        },

        release() {
            if (originalDescriptor) {
                Object.defineProperty(stream, "write", originalDescriptor);
            } else {
                // If there was no "own" descriptor, the method lives on the
                // prototype. Remove the instance override.
                Reflect.deleteProperty(stream, "write");
            }

            if (!calls.length) {
                return [];
            }

            return [
                `Expected test not to write to process.${streamName}.`,
                ...calls.map(({message, stack}) => `${message}\n${stack}`),
                `If expected, use allowStream("${streamName}", ...) to add an exception.`
            ];
        }
    };
}
