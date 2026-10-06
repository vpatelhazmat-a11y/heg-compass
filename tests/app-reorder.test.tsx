// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { useAppReorder } from "../src/hooks/use-app-reorder";

const move = vi.fn();
function Harness() {
  const reorder = useAppReorder(move);
  return (
    <>
      <div
        data-testid="tile"
        data-app-id="tasks"
        onPointerDown={(event) => reorder.onPointerDown("tasks", event)}
        onPointerMove={reorder.onPointerMove}
        onPointerUp={reorder.onPointerUp}
        onPointerCancel={reorder.onPointerCancel}
      >
        <button
          onClick={() => {
            if (!reorder.suppressClick()) move("open");
          }}
        >
          Tasks
        </button>
      </div>
      <div data-testid="target" data-app-id="customers" />
      {reorder.drag && <span role="status">Picked up</span>}
    </>
  );
}
beforeEach(() => {
  vi.useFakeTimers();
  move.mockReset();
  // jsdom has no native PointerEvent or pointer capture.
  class TestPointerEvent extends MouseEvent {
    pointerId: number;
    pointerType: string;
    isPrimary: boolean;
    constructor(type: string, options: PointerEventInit = {}) {
      super(type, options);
      this.pointerId = options.pointerId ?? 1;
      this.pointerType = options.pointerType ?? "mouse";
      this.isPrimary = options.isPrimary ?? true;
    }
  }
  vi.stubGlobal("PointerEvent", TestPointerEvent);
  HTMLElement.prototype.setPointerCapture = vi.fn();
  HTMLElement.prototype.hasPointerCapture = () => false;
  HTMLElement.prototype.releasePointerCapture = vi.fn();
  document.elementFromPoint = vi.fn(() => screen.getByTestId("target"));
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

test("ordinary click opens an app and does not reorder", () => {
  render(<Harness />);
  fireEvent.pointerDown(screen.getByTestId("tile"), { pointerId: 1, button: 0 });
  fireEvent.pointerUp(screen.getByTestId("tile"), { pointerId: 1 });
  fireEvent.click(screen.getByRole("button", { name: "Tasks" }));
  expect(move).toHaveBeenCalledWith("open");
  expect(screen.queryByRole("status")).toBeNull();
});

test.each(["mouse", "touch", "pen"])(
  "%s hold then drag places an app and suppresses accidental opening",
  (pointerType) => {
    render(<Harness />);
    fireEvent.pointerDown(screen.getByTestId("tile"), {
      pointerId: 1,
      button: 0,
      pointerType,
      clientX: 20,
      clientY: 120,
    });
    act(() => vi.advanceTimersByTime(280));
    expect(screen.getByRole("status")).toBeTruthy();
    fireEvent.pointerMove(screen.getByTestId("tile"), { pointerId: 1, clientX: 180, clientY: 200 });
    fireEvent.pointerUp(screen.getByTestId("tile"), { pointerId: 1 });
    fireEvent.click(screen.getByRole("button", { name: "Tasks" }));
    expect(move).toHaveBeenCalledExactlyOnceWith("tasks", "customers");
  },
);

test.each(["pointerCancel", "escape"])("%s cancels a held drag without saving", (action) => {
  render(<Harness />);
  fireEvent.pointerDown(screen.getByTestId("tile"), { pointerId: 1, button: 0 });
  act(() => vi.advanceTimersByTime(280));
  fireEvent.pointerMove(screen.getByTestId("tile"), { pointerId: 1, clientX: 180, clientY: 200 });
  if (action === "escape") fireEvent.keyDown(window, { key: "Escape" });
  else fireEvent.pointerCancel(screen.getByTestId("tile"), { pointerId: 1 });
  fireEvent.pointerUp(screen.getByTestId("tile"), { pointerId: 1 });
  expect(move).not.toHaveBeenCalled();
  expect(screen.queryByRole("status")).toBeNull();
});

test("movement before pickup cancels without accidentally opening the app", () => {
  render(<Harness />);
  fireEvent.pointerDown(screen.getByTestId("tile"), {
    pointerId: 1,
    button: 0,
    clientX: 20,
    clientY: 120,
  });
  fireEvent.pointerMove(screen.getByTestId("tile"), { pointerId: 1, clientX: 90, clientY: 120 });
  act(() => vi.advanceTimersByTime(280));
  fireEvent.pointerUp(screen.getByTestId("tile"), { pointerId: 1 });
  fireEvent.click(screen.getByRole("button", { name: "Tasks" }));
  expect(move).not.toHaveBeenCalled();
  expect(screen.queryByRole("status")).toBeNull();
});
