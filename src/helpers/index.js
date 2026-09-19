/*

Helper signature:
const fn = (cfg) => (onDestroy, stop) => next => value

onDestroy: called when the event listener is removed (manually or via signal)
stop: removes the eventlistener and triggers onDestroy on each helper.

next: the next helper in the chain (or the subscriber/listener if its the last one)
Skip the chain by not calling next.

value: The event passed from the eventlistener.

*/

export const debounce = (ms) => (onDestroy) => (next) => {
  let timerId = null;
  //cleanup timer
  onDestroy(() => {
    clearTimeout(timerId);
  });
  return (value) => {
    if (timerId !== null) {
      clearTimeout(timerId);
    }
    timerId = setTimeout(() => {
      timerId = null;
      next(value);
    }, ms);
  };
};

export const throttle = (ms) => (onDestroy) => (next) => {
  let timerId = null;
  let isThrottled = false;
  //  Cleanup timer
  onDestroy(() => {
    isThrottled = false;
    if (timerId) clearTimeout(timerId);
  });

  return (value) => {
    if (!isThrottled) {
      next(value);
      isThrottled = true;
      timerId = setTimeout(() => {
        isThrottled = false;
        timerId = null;
      }, ms);
    }
  };
};

export const raf = () => (onDestroy) => (next) => {
  let rafId = null;
  let latest = null;
  //Cleanup raf
  onDestroy(() => {
    if (rafId != null) cancelAnimationFrame(rafId);
  });

  return (value) => {
    latest = value;

    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        next(latest);
        rafId = null;
      });
    }
  };
};

export const map = (fn) => () => (next) => (val) => next(fn(val));
export const filter = (predicate) => () => (next) => (val) =>
  predicate(val) && next(val);

export const take = (maxCount) => (_, stop) => (next) => {
  let count = 0;

  return (value) => {
    if (count < maxCount) {
      count++;
      next(value);
      if (count >= maxCount) stop(); // stop the event listener entirely
    }
  };
};

const UNSET = Symbol("UNSET");
export const distinct = (compareFn) => () => (next) => {
  let prevValue = UNSET;
  return (value) => {
    const same =
      prevValue !== UNSET &&
      (typeof compareFn === "function"
        ? Boolean(compareFn(prevValue, value))
        : prevValue === value);

    if (!same) {
      prevValue = value;
      next(value);
    }
  };
};

export const latest = (cb) => (onDestroy) => (next) => {
  let ctrl = null;
  //cleanup: abort
  onDestroy(() => {
    ctrl?.abort();
  });

  return async (value) => {
    if (ctrl) {
      ctrl.abort();
    }
    ctrl = new AbortController();
    const { signal } = ctrl;
    try {
      const res = await cb(value, signal);
      // check if signal was not aborted during the task
      if (!signal.aborted) {
        next(res);
      }
    } catch (e) {
      if (e.name !== "AbortError") {
        throw e;
      }
    }
  };
};
