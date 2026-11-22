export interface AllowPredicate {
    (message: string): boolean;
}

export type AllowRule = string | RegExp | AllowPredicate;
