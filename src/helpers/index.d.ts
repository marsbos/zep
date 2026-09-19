// Helpers/operators
export type OnDestroy = (callback: () => void) => void;
export type StopFn = () => void;

export type Operator<TIn, TOut = TIn> = (
  onDestroy: OnDestroy,
  stop: StopFn,
) => (next: (value: TOut) => void) => (value: TIn) => void;

// ------------------------------------------------------------------
// Operators
// ------------------------------------------------------------------

export declare const debounce: <T>(ms: number) => Operator<T, T>;

export declare const throttle: <T>(ms: number) => Operator<T, T>;

export declare const raf: <T>() => Operator<T, T>;

export declare const map: <TIn, TOut>(
  fn: (value: TIn) => TOut,
) => Operator<TIn, TOut>;

export declare const filter: <T>(
  predicate: (value: T) => boolean,
) => Operator<T, T>;

export declare const take: <T>(maxCount: number) => Operator<T, T>;

export declare const distinct: <T>(
  compareFn?: (prev: T, current: T) => boolean,
) => Operator<T, T>;

export declare const latest: <TIn, TOut>(
  cb: (value: TIn, signal: AbortSignal) => Promise<TOut>,
) => Operator<TIn, TOut>;
