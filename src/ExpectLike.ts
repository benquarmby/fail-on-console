export interface ExpectStateLike {
    currentTestName?: string;
}

export interface ExpectLike {
    getState(): ExpectStateLike;
}
