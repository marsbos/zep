# zep.js - events for slackers 🦥

![Tests](https://img.shields.io/badge/tests-passing-brightgreen?style=flat-square)
[![npm version](https://img.shields.io/npm/v/@marsbos/zep?style=flat-square&color=black)](https://www.npmjs.com/package/@marsbos/zep)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@marsbos/zep?style=flat-square&color=black)](https://bundlephobia.com/package/@marsbos/zep)
[![license](https://img.shields.io/badge/license-MIT-black?style=flat-square)](https://github.com/marsbos/zep/blob/main/LICENSE)

#### **Z**ero **E**vent **P**lumbing.

zep:

- is a very small event pipeline library.
- turns every addEventListener into a composable, self-cleaning pipeline.
- is framework agnostic (vanilla js), so it should fit every frontend.

## Why zep.js?

> Events are great, until they are not. Like when you need to debounce inputs, handle scroll spam, or fetch async data out-of-order.

**zep was built for exactly those moments**.

No more loose let variables, no more memory leaks, no event handling boilerplate.
Just clean, composable event handling logic.

## Quick start

> Zep is a bit of a slacker 🦥 as well- it does zero work and attaches no DOM listeners until you actually call `.on()`.

_Without AbortSignal: use the returned cleanup function._

```js
import { zep } from "@marsbos/zep";
import { map, filter, debounce, latest } from "@marsbos/zep/helpers";

const cleanup = zep(queryEl, "input")
  .use(
    map((e) => e.target.value.trim()), // <= transform input to string value
    filter((query) => query.length > 2), // <= only pass if min length = 3
    debounce(300), // <= wait 300 ms
    latest(
      (query, signal) =>
        fetch(`https://dummyjson.com/products/search?q=${query}`, {
          signal,
        }).then((res) => res.json()), // <= auto abort previous or pending requests
    ),
  )
  .on((results) => {
    console.log(results);
  });

// Whenever you're ready, just call 'cleanup()'
```

_With AbortSignal passed to zep._

```js
zep(queryEl, "input", { signal }) // <= Pass a signal to zep
  .use(
    map((e) => e.target.value.trim()),
    filter((query) => query.length > 2),
    debounce(300),
    latest((query, signal) =>
      fetch(`https://dummyjson.com/products/search?q=${query}`, {
        signal,
      }).then((res) => res.json()),
    ),
  )
  .on((results) => {
    console.log(results);
  });

// controller.abort() will do the cleanup via the signal passed to zep.
```

## Synchronous by Default

Everything in Zep execution pipelines is **100% synchronous**. When an event fires, it passes through `filter`, `map`, `take`, and your `.on()` listener instantly within the very same callstack. No microtask queues, no hidden schedulers.

The **only exception** is `latest()` (and timing operators like `debounce` / `throttle` / `raf` which delay execution):

- **`latest()`** introduces an asynchronous boundary because it handles Promises and async operations. It passes an `AbortSignal` to your async callback and automatically cancels pending executions when a new event arrives.

## Builtin helpers (_aka 'operators'_)

- **debounce**: waits until `ms` have passed.
- **distinct**: ignores values if they match the previous value.
- **filter**: only passes values that meet a `condition`.
- **latest**: `automatically aborts` previous/pending async tasks on new events.
- **map**: transforms the value before passing it on.
- **raf**: limits execution to `requestAnimationFrame` for smooth UI updates.
- **take**: stops listening after n events have fired.
- **throttle**: limits execution to once every `ms`.

## Crafting your own helper/operator

```javascript
export const log = (eventName) => (onDestroy, stop) => (next) => {
  let count = 0;
  return (value) => {
    console.log(new Date().toISOString(), `${++count} events for ${eventName}`);
    next(value);
  };
};

// Usage: zep(myButton, 'click').use(map(...), log("myEvent")).on(...);
```

## Examples

### Smooth scroll handler (requestAnimationFrame)

Keep UI animations butter smooth by decoupling scroll events from rendering.

```js
import { zep } from "@marsbos/zep";
import { raf } from "@marsbos/zep/helpers";

zep(window, "scroll")
  .use(raf())
  .on(() => {
    const scrolled = window.scrollY;
    // Perform smooth layout/UI updates here
  });
```

### Keyboard events

Unsubscribe after 1 successfull event

```js
import { zep } from "@marsbos/zep";
import { take, filter } from "@marsbos/zep/helpers";

zep(document, "keydown")
  .use(
    filter((e) => e.key === "Escape"), // <= We only want to act on the Escape key
    take(1), // <= Stop and unsubscribe
  )
  .on(() => closeModal());
```

### Throttled window resize (requestAnimationFrame)

Avoid layout thrashing when measuring window bounds.

```js
import { zep } from "@marsbos/zep";
import { throttle, map } from "@marsbos/zep/helpers";

zep(window, "resize")
  .use(
    throttle(200),
    map(() => ({ width: window.innerWidth, height: window.innerHeight })),
  )
  .on(({ width, height }) => {
    console.log(`Window resized to: ${width}x${height}`);
  });
```

## Size & usage

zep.js is extremely lightweight and distributed as an ES module with zero dependencies:

- `Core`: ~417 bytes minified (**265 bytes** gzipped)
- `Helpers`: ~922 bytes minified (**484 bytes** gzipped)

```js
import { zep } from "@marsbos/zep";
import { filter, etc... } from "@marsbos/zep/helpers";
```

## Author

Marcel Bos

bosmarcel@live.nl

## License

MIT

## Acknowledgments

- **Concept, architecture & core logic:** Built by [Marcel Bos](mailto:bosmarcel@live.nl).
- **Tooling & Quality:** AI was used to help me with the TypeScript definitions and the Vitest test suite.
  > I hate testing and TypeScript. So yeah, I am a bit of a slacker 🦥.
