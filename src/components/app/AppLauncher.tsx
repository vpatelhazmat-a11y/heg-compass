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
import { RotateCcw } from "lucide-react";
import { useAppReorder } from "@/hooks/use-app-reorder";

export function AppLauncher() {
  const { session } = useSession();
  const userId = session?.userId;
  const [order, setOrder] = useState(() => normalizeAppOrder(null));
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

  const reorder = useAppReorder((id, target) => updateOrder(moveApp(order, id, target)));
  const draggedModule = HUB_MODULES.find((module) => module.id === reorder.drag?.id);

  return (
    <section aria-label="Applications" className="app-desktop">
      <div className="launcher-actions">
        <span id="launcher-reorder-help" className="sr-only">
          Click and hold an app to drag it. Escape cancels. Alt and arrow keys rearrange apps with
          the keyboard.
        </span>
        <button
          type="button"
          aria-label="Reset app order"
          title="Reset app order"
          disabled={!userId}
          onClick={() => updateOrder(userId ? resetAppOrder(userId) : normalizeAppOrder(null))}
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
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
            className={`app-position ${reorder.drag?.id === id ? "is-dragging" : ""} ${reorder.drag?.target === id ? "is-drop-target" : ""}`}
            onDragStart={(event) => event.preventDefault()}
            onPointerDown={(event) => reorder.onPointerDown(id, event)}
            onPointerMove={reorder.onPointerMove}
            onPointerUp={reorder.onPointerUp}
            onPointerCancel={reorder.onPointerCancel}
            onLostPointerCapture={reorder.onLostPointerCapture}
          >
            <Link
              to={to}
              className="app-tile"
              title={description}
              draggable={false}
              aria-describedby="launcher-reorder-help"
              onClick={(event) => {
                if (reorder.suppressClick()) event.preventDefault();
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
      {reorder.drag && draggedModule && (
        <div
          className="launcher-drag-preview"
          aria-hidden
          style={{ left: reorder.drag.x, top: reorder.drag.y, width: reorder.drag.width }}
        >
          <span className="app-icon" data-app={draggedModule.label}>
            <CompassIcon name={draggedModule.label} />
          </span>
          <span className="app-label">{draggedModule.label}</span>
        </div>
      )}
    </section>
  );
}
