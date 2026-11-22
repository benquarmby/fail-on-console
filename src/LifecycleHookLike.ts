export interface LifecycleHookLike {
    (fn: () => void): void;
}
