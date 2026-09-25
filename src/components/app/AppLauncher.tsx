import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useSession } from "@/hooks/use-session";
import { HUB_MODULES } from "@/lib/modules";
import {
  moveApp,
  normalizeAppOrder,
  readAppOrder,
  readSyncedAppOrder,
  resetAppOrder,
  saveAppOrder,
  saveSyncedAppOrder,
  shiftApp,
} from "@/lib/launcher-order";
import { CompassIcon } from "./CompassIcon";

export function AppLauncher() {
  const { session } = useSession();
  const userId = session?.userId;
  const [order, setOrder] = useState(() => normalizeAppOrder(null));
  const [dragging, setDragging] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const touchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchDrag = useRef<string | null>(null);
  const touchTarget = useRef<string | null>(null);
  const suppressClick = useRef(false);
  const [syncError, setSyncError] = useState(false);
  const changeNumber = useRef(0);
  const saveQueue = useRef(Promise.resolve());

  useEffect(() => {
    if (!userId) return;
    let active = true;
    const initialChange = changeNumber.current;
    const localOrder = readAppOrder(userId);
    setOrder(localOrder);
    setSyncError(false);
    readSyncedAppOrder(userId)
      .then((remoteOrder) => {
        if (!active || changeNumber.current !== initialChange) return;
        if (remoteOrder) {
          setOrder(remoteOrder);
          saveAppOrder(userId, remoteOrder);
        } else {
          saveQueue.current = saveQueue.current.then(() => saveSyncedAppOrder(userId, localOrder));
          saveQueue.current.catch(() => {
            if (active) setSyncError(true);
          });
        }
      })
      .catch(() => {
        if (active) setSyncError(true);
      });
    return () => {
      active = false;
    };
  }, [userId]);

  const orderedModules = useMemo(
    () => order.map((id) => HUB_MODULES.find((module) => module.id === id)!).filter(Boolean),
    [order],
  );

  const updateOrder = (next: string[]) => {
    setOrder(next);
    if (userId) {
      changeNumber.current += 1;
      saveAppOrder(userId, next);
      setSyncError(false);
      saveQueue.current = saveQueue.current
        .catch(() => undefined)
        .then(() => saveSyncedAppOrder(userId, next));
      saveQueue.current.catch(() => setSyncError(true));
    }
  };

  const stopTouch = () => {
    if (touchTimer.current) clearTimeout(touchTimer.current);
    touchTimer.current = null;
  };

  const endTouch = () => {
    stopTouch();
    if (touchDrag.current && touchTarget.current && touchDrag.current !== touchTarget.current) {
      updateOrder(moveApp(order, touchDrag.current, touchTarget.current));
    }
    if (touchDrag.current) {
      suppressClick.current = true;
      window.setTimeout(() => {
        suppressClick.current = false;
      }, 350);
    }
    touchDrag.current = null;
    touchTarget.current = null;
    setDragging(null);
    setDropTarget(null);
  };

  return (
    <section aria-label="Applications" className="app-desktop">
      <div className="launcher-actions">
        <span>Hold and drag an app to move it</span>
        <button
          type="button"
          disabled={!userId}
          onClick={() => updateOrder(userId ? resetAppOrder(userId) : normalizeAppOrder(null))}
        >
          Reset order
        </button>
      </div>
      {syncError && (
        <p role="status" className="text-sm text-destructive">
          App order is saved on this device but could not sync. Move an app to retry.
        </p>
      )}
      <div className="app-grid">
        {orderedModules.map(({ id, label, description, to }) => (
          <div
            key={id}
            data-app-id={id}
            className={`app-position ${dragging === id ? "is-dragging" : ""} ${dropTarget === id ? "is-drop-target" : ""}`}
            draggable
            onDragStart={(event) => {
              setDragging(id);
              event.dataTransfer.effectAllowed = "move";
              event.dataTransfer.setData("text/plain", id);
            }}
            onDragOver={(event) => {
              if (dragging && dragging !== id) {
                event.preventDefault();
                setDropTarget(id);
              }
            }}
            onDrop={(event) => {
              event.preventDefault();
              if (dragging) updateOrder(moveApp(order, dragging, id));
              setDragging(null);
              setDropTarget(null);
            }}
            onDragEnd={() => {
              setDragging(null);
              setDropTarget(null);
            }}
            onPointerDown={(event) => {
              if (event.pointerType === "mouse") return;
              stopTouch();
              const tile = event.currentTarget;
              const pointerId = event.pointerId;
              touchTimer.current = setTimeout(() => {
                touchDrag.current = id;
                setDragging(id);
                tile.setPointerCapture(pointerId);
              }, 280);
            }}
            onPointerMove={(event) => {
              if (!touchDrag.current) return;
              const target =
                document
                  .elementFromPoint(event.clientX, event.clientY)
                  ?.closest<HTMLElement>("[data-app-id]")?.dataset["appId"] ?? null;
              touchTarget.current = target;
              setDropTarget(target);
            }}
            onPointerUp={endTouch}
            onPointerCancel={endTouch}
          >
            <Link
              to={to}
              className="app-tile"
              title={description}
              onClick={(event) => {
                if (suppressClick.current) event.preventDefault();
              }}
              onKeyDown={(event) => {
                if (
                  !event.altKey ||
                  !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)
                )
                  return;
                event.preventDefault();
                const direction = event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1;
                updateOrder(shiftApp(order, id, direction));
              }}
              aria-keyshortcuts="Alt+ArrowLeft Alt+ArrowRight Alt+ArrowUp Alt+ArrowDown"
            >
              <span className="app-icon" data-app={label}>
                <CompassIcon name={label} />
              </span>
              <span className="app-label">{label}</span>
              <span className="sr-only">{description}</span>
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
