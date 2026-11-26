export interface MethodCaptor {
    capture(): void;
    release(): string[];
}
