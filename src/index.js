export const zep = (target, eventName, options = {}) => ({
  use(...fns) {
    return {
      on(listener) {
        // Immediate return if signal is given but already aborted
        if (options?.signal?.aborted) return () => {};
        const teardowns = new Set();
        let unsubscribe = null;
        const stop = () => {
          teardowns.forEach((t) => t?.());
          teardowns.clear();
          unsubscribe?.();
          options?.signal?.removeEventListener("abort", stop);
        };
        const teardown = (tFn) => teardowns.add(tFn);
        // Here we pass teardown & stop functyions to the helpers/operators, so they are responsible for cleaning up themselves.
        const helpers = (fns || []).map((f) => f(teardown, stop));
        const pipe = helpers.reduceRight((next, fn) => fn(next), listener);

        if (options.signal && !options.signal.aborted) {
          options.signal.addEventListener("abort", stop);
        }

        target.addEventListener(eventName, pipe, options);
        // The cleanup/teardown function. Called when the .on() return function is called or when the egiven signal is aborted
        unsubscribe = () =>
          target.removeEventListener(eventName, pipe, options);

        return stop;
      },
    };
  },
});
