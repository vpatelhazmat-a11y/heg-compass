import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { GripVertical } from "lucide-react";
import { useSession } from "@/hooks/use-session";
import { HUB_MODULES } from "@/lib/modules";
import {
  moveApp,
  normalizeAppOrder,
  readAppOrder,
  resetAppOrder,
  saveAppOrder,
  shiftApp,
} from "@/lib/launcher-order";
import { CompassIcon } from "./CompassIcon";

export function AppLauncher() {
  const { session } = useSession();
  const userId = session?.userId;
  const [order, setOrder] = useState(() => normalizeAppOrder(null));
  const [arranging, setArranging] = useState(false);
  const [dragging, setDragging] = useState<string | null>(null);

  useEffect(() => {
    if (userId) setOrder(readAppOrder(userId));
  }, [userId]);

  const orderedModules = useMemo(
    () => order.map((id) => HUB_MODULES.find((module) => module.id === id)!).filter(Boolean),
    [order],
  );

  const updateOrder = (next: string[]) => {
    setOrder(next);
    if (userId) saveAppOrder(userId, next);
  };

  return (
    <section aria-label="Applications" className="app-desktop">
      <div className="launcher-actions">
        {arranging ? (
          <>
            <button
              type="button"
              onClick={() => {
                setOrder(userId ? resetAppOrder(userId) : normalizeAppOrder(null));
                setDragging(null);
              }}
            >
              Reset order
            </button>
            <button type="button" onClick={() => setArranging(false)}>
              Done
            </button>
          </>
        ) : (
          <button type="button" disabled={!userId} onClick={() => setArranging(true)}>
            Arrange apps
          </button>
        )}
      </div>
      <div className="app-grid">
        {orderedModules.map(({ id, label, description, to }, index) => (
          <div
            key={id}
            className={`app-position ${arranging ? "is-arranging" : ""} ${dragging === id ? "is-dragging" : ""}`}
            draggable={arranging}
            onDragStart={(event) => {
              if (!arranging) return;
              setDragging(id);
              event.dataTransfer.effectAllowed = "move";
              event.dataTransfer.setData("text/plain", id);
            }}
            onDragOver={(event) => {
              if (arranging && dragging && dragging !== id) event.preventDefault();
            }}
            onDrop={(event) => {
              event.preventDefault();
              if (arranging && dragging) updateOrder(moveApp(order, dragging, id));
              setDragging(null);
            }}
            onDragEnd={() => setDragging(null)}
          >
            <Link
              to={to}
              className="app-tile"
              title={description}
              aria-disabled={arranging}
              tabIndex={arranging ? -1 : undefined}
              onClick={(event) => {
                if (arranging) event.preventDefault();
              }}
            >
              <span className="app-icon" data-app={label}>
                <CompassIcon name={label} />
              </span>
              <span className="app-label">{label}</span>
              <span className="sr-only">{description}</span>
            </Link>
            {arranging && (
              <div className="app-order-controls">
                <button
                  type="button"
                  aria-label={`Move ${label} earlier`}
                  disabled={index === 0}
                  onClick={() => updateOrder(shiftApp(order, id, -1))}
                >
                  ←
                </button>
                <GripVertical aria-hidden="true" className="h-4 w-4" />
                <button
                  type="button"
                  aria-label={`Move ${label} later`}
                  disabled={index === order.length - 1}
                  onClick={() => updateOrder(shiftApp(order, id, 1))}
                >
                  →
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
