import { useEffect, useState } from "react";
import { Star, X } from "lucide-react";
import {
  readSavedViews,
  removeView,
  saveView,
  type SavedView,
  type SavedViewState,
} from "@/lib/saved-views";

export function SavedViews({
  userId,
  scope,
  value,
  onApply,
}: {
  userId?: string | null | undefined;
  scope: string;
  value: SavedViewState;
  onApply: (state: SavedViewState) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [views, setViews] = useState<SavedView[]>([]);
  useEffect(() => setViews(userId ? readSavedViews(userId, scope) : []), [userId, scope]);
  if (!userId) return null;
  return (
    <div className="saved-views">
      <button
        type="button"
        aria-label="Saved views"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="saved-views-trigger"
      >
        <Star className="h-4 w-4" aria-hidden />
      </button>
      {open && (
        <div
          className="saved-views-menu"
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpen(false);
          }}
        >
          <h3>Personal views</h3>
          {views.length ? (
            <ul>
              {views.map((item) => (
                <li key={item.name}>
                  <button
                    type="button"
                    onClick={() => {
                      onApply(item.state);
                      setOpen(false);
                    }}
                  >
                    {item.name}
                  </button>
                  <button
                    type="button"
                    aria-label={`Remove saved view ${item.name}`}
                    onClick={() => setViews(removeView(userId, scope, item.name))}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>No saved views yet.</p>
          )}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (!name.trim()) return;
              setViews(saveView(userId, scope, name, value));
              setName("");
            }}
          >
            <input
              aria-label="View name"
              placeholder="Name this view"
              maxLength={40}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <button type="submit" disabled={!name.trim()}>
              Save
            </button>
          </form>
          <small>Saved for this account on this device.</small>
        </div>
      )}
    </div>
  );
}
