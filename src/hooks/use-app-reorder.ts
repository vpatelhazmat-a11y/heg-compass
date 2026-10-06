import { useEffect, useRef, useState, type PointerEvent } from "react";

type Press = {
  id: string;
  pointerId: number;
  tile: HTMLElement;
  x: number;
  y: number;
  offsetX: number;
  offsetY: number;
  width: number;
  active: boolean;
  target: string | null;
};

export function useAppReorder(onMove: (id: string, target: string) => void) {
  const move = useRef(onMove);
  move.current = onMove;
  const press = useRef<Press | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressUntil = useRef(0);
  const [drag, setDrag] = useState<{
    id: string;
    target: string | null;
    x: number;
    y: number;
    width: number;
  } | null>(null);

  const finish = (commit: boolean) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const current = press.current;
    press.current = null;
    if (current?.active) {
      suppressUntil.current = Date.now() + 400;
      if (current.tile.hasPointerCapture?.(current.pointerId))
        current.tile.releasePointerCapture(current.pointerId);
      if (commit && current.target && current.target !== current.id)
        move.current(current.id, current.target);
    }
    setDrag(null);
  };

  useEffect(() => {
    const cancel = (event: KeyboardEvent | Event) => {
      if ((event.type === "blur" || ("key" in event && event.key === "Escape")) && press.current) {
        if (timer.current) clearTimeout(timer.current);
        timer.current = null;
        const current = press.current;
        press.current = null;
        if (current.active) {
          event.preventDefault();
          suppressUntil.current = Date.now() + 400;
          if (current.tile.hasPointerCapture?.(current.pointerId))
            current.tile.releasePointerCapture(current.pointerId);
        }
        setDrag(null);
      }
    };
    window.addEventListener("keydown", cancel);
    window.addEventListener("blur", cancel);
    return () => {
      window.removeEventListener("keydown", cancel);
      window.removeEventListener("blur", cancel);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return {
    drag,
    suppressClick: () => Date.now() < suppressUntil.current,
    onPointerDown: (id: string, event: PointerEvent<HTMLElement>) => {
      if (event.button !== 0 || event.isPrimary === false) return;
      finish(false);
      suppressUntil.current = 0;
      const rect = event.currentTarget.getBoundingClientRect();
      const current: Press = {
        id,
        pointerId: event.pointerId,
        tile: event.currentTarget,
        x: event.clientX,
        y: event.clientY,
        offsetX: event.clientX - rect.left,
        offsetY: event.clientY - rect.top,
        width: rect.width,
        active: false,
        target: null,
      };
      press.current = current;
      timer.current = setTimeout(() => {
        if (press.current !== current) return;
        current.active = true;
        current.tile.setPointerCapture(current.pointerId);
        setDrag({
          id,
          target: null,
          x: current.x - current.offsetX,
          y: current.y - current.offsetY,
          width: current.width,
        });
      }, 280);
    },
    onPointerMove: (event: PointerEvent<HTMLElement>) => {
      const current = press.current;
      if (!current || current.pointerId !== event.pointerId) return;
      if (!current.active) {
        if (Math.hypot(event.clientX - current.x, event.clientY - current.y) > 8) {
          finish(false);
          suppressUntil.current = Date.now() + 400;
        }
        return;
      }
      event.preventDefault();
      const target =
        document
          .elementFromPoint(event.clientX, event.clientY)
          ?.closest<HTMLElement>("[data-app-id]")?.dataset["appId"] ?? null;
      current.target = target;
      setDrag({
        id: current.id,
        target,
        x: event.clientX - current.offsetX,
        y: event.clientY - current.offsetY,
        width: current.width,
      });
      if (event.clientY < 70) window.scrollBy(0, -12);
      else if (event.clientY > window.innerHeight - 70) window.scrollBy(0, 12);
    },
    onPointerUp: (event: PointerEvent<HTMLElement>) => {
      if (press.current?.pointerId === event.pointerId) finish(true);
    },
    onPointerCancel: (event: PointerEvent<HTMLElement>) => {
      if (press.current?.pointerId === event.pointerId) finish(false);
    },
    onLostPointerCapture: (event: PointerEvent<HTMLElement>) => {
      if (press.current?.pointerId === event.pointerId) finish(false);
    },
  };
}
