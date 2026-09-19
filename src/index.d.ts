// Core types
export type OnDestroy = (cb: () => void) => void;
export type StopFn = () => void;

export type Operator<TIn, TOut = TIn> = (
  onDestroy: OnDestroy,
  stop: StopFn,
) => (next: (value: TOut) => void) => (value: TIn) => void;

export type Listener<T> = (value: T) => void;
export type SubscribeFn<T> = (pipe: Listener<T>) => StopFn;

// Stream Interface
export interface Stream<TIn> {
  use(): {
    on(listener: Listener<TIn>): StopFn;
  };
  use<A>(fn1: Operator<TIn, A>): {
    on(listener: Listener<A>): StopFn;
  };
  use<A, B>(
    fn1: Operator<TIn, A>,
    fn2: Operator<A, B>,
  ): {
    on(listener: Listener<B>): StopFn;
  };
  use<A, B, C>(
    fn1: Operator<TIn, A>,
    fn2: Operator<A, B>,
    fn3: Operator<B, C>,
  ): {
    on(listener: Listener<C>): StopFn;
  };
  use<A, B, C, D>(
    fn1: Operator<TIn, A>,
    fn2: Operator<A, B>,
    fn3: Operator<B, C>,
    fn4: Operator<C, D>,
  ): {
    on(listener: Listener<D>): StopFn;
  };
  use(...fns: Operator<any, any>[]): {
    on(listener: Listener<any>): StopFn;
  };
}

// Function Declarations
export declare const createStream: <T>(subscribe: SubscribeFn<T>) => Stream<T>;

export declare const zep: <
  TTarget extends EventTarget,
  K extends keyof HTMLElementEventMap,
>(
  target: TTarget,
  eventName: K,
  options?: AddEventListenerOptions,
) => Stream<HTMLElementEventMap[K]>;

export declare const zepCustom: <T = Event>(
  target: EventTarget,
  eventName: string,
  options?: AddEventListenerOptions,
) => Stream<T>;
