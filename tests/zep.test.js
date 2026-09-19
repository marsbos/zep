import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { zep } from "../src/index.js";
import {
  debounce,
  throttle,
  map,
  filter,
  take,
  distinct,
  latest,
} from "../src/helpers";

describe("Zep Core & Lifecycle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("is lazy and attaches listener only when .on() is called", () => {
    const target = { addEventListener: vi.fn(), removeEventListener: vi.fn() };
    const stream = zep(target, "click");

    expect(target.addEventListener).not.toHaveBeenCalled();

    const stop = stream.use().on(() => {});
    expect(target.addEventListener).toHaveBeenCalledTimes(1);

    stop();
    expect(target.removeEventListener).toHaveBeenCalledTimes(1);
  });

  it("cleans up resources and unsubscribes when stop() is called", () => {
    const listener = vi.fn();
    const target = new EventTarget();

    const stop = zep(target, "click").use(debounce(100)).on(listener);

    target.dispatchEvent(new Event("click"));

    // Stop before debounce
    stop();

    vi.advanceTimersByTime(150);
    expect(listener).not.toHaveBeenCalled();
  });
});

describe("Operators", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("debounce: delays execution and cleans up previous timers", () => {
    const listener = vi.fn();
    const target = new EventTarget();

    zep(target, "input").use(debounce(200)).on(listener);

    target.dispatchEvent(new Event("input"));
    target.dispatchEvent(new Event("input"));

    vi.advanceTimersByTime(150);
    expect(listener).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("throttle: fires immediately and blocks subsequent calls during window", () => {
    const listener = vi.fn();
    const target = new EventTarget();

    zep(target, "scroll").use(throttle(200)).on(listener);

    target.dispatchEvent(new Event("scroll")); // Fired (1)
    target.dispatchEvent(new Event("scroll")); // Blocked

    expect(listener).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(250);
    target.dispatchEvent(new Event("scroll")); // Fired (2)

    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("take: limits executions and automatically triggers teardown", () => {
    const listener = vi.fn();
    const target = new EventTarget();

    const removeSpy = vi.spyOn(target, "removeEventListener");

    zep(target, "click").use(take(2)).on(listener);

    target.dispatchEvent(new Event("click"));
    target.dispatchEvent(new Event("click"));
    target.dispatchEvent(new Event("click"));

    expect(listener).toHaveBeenCalledTimes(2);
    // Verify stop has been called
    expect(removeSpy).toHaveBeenCalledTimes(1);
  });

  it("map & filter: correctly transform and block values", () => {
    const listener = vi.fn();
    const target = new EventTarget();

    zep(target, "custom")
      .use(
        map((e) => e.detail),
        filter((val) => val > 10),
      )
      .on(listener);

    target.dispatchEvent(new CustomEvent("custom", { detail: 5 }));
    target.dispatchEvent(new CustomEvent("custom", { detail: 20 }));

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(20);
  });

  it("distinct: filters out consecutive duplicate values", () => {
    const listener = vi.fn();
    const target = new EventTarget();

    zep(target, "change")
      .use(
        map((e) => e.detail),
        distinct(),
      )
      .on(listener);

    target.dispatchEvent(new CustomEvent("change", { detail: "A" }));
    target.dispatchEvent(new CustomEvent("change", { detail: "A" }));
    target.dispatchEvent(new CustomEvent("change", { detail: "B" }));
    target.dispatchEvent(new CustomEvent("change", { detail: "A" }));

    expect(listener).toHaveBeenCalledTimes(3);
    expect(listener.mock.calls).toEqual([["A"], ["B"], ["A"]]);
  });

  it("latest: cancels previous async requests with AbortSignal", async () => {
    const listener = vi.fn();
    const target = new EventTarget();

    const mockFetch = vi.fn((val, signal) => {
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          if (signal.aborted) {
            reject(new DOMException("Aborted", "AbortError"));
          } else {
            resolve(`Result: ${val}`);
          }
        }, 100);

        signal.addEventListener("abort", () => clearTimeout(timer));
      });
    });

    zep(target, "input")
      .use(
        map((e) => e.detail),
        latest(mockFetch),
      )
      .on(listener);

    // Fire firtst event
    target.dispatchEvent(new CustomEvent("input", { detail: "query 1" }));

    // Trigger next event
    vi.advanceTimersByTime(50);
    target.dispatchEvent(new CustomEvent("input", { detail: "query 2" }));

    // Timer
    await vi.advanceTimersByTimeAsync(150);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith("Result: query 2");
  });
});
