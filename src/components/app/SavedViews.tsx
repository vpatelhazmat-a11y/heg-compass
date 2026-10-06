import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  const [error, setError] = useState<string | null>(null);
  useEffect(() => setViews(userId ? readSavedViews(userId, scope) : []), [userId, scope]);
  if (!userId) return null;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Saved views"
          aria-expanded={open}
          className="saved-views-trigger"
        >
          <Star className="h-4 w-4" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="saved-views-menu" aria-label="Saved views">
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
                  onClick={() => {
                    setError(null);
                    try {
                      setViews(removeView(userId, scope, item.name));
                    } catch {
                      setError("This view could not be removed on this device. Try again.");
                    }
                  }}
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
            setError(null);
            try {
              setViews(saveView(userId, scope, name, value));
              setName("");
            } catch {
              setError("This view could not be saved on this device. Try again.");
            }
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
        {error && (
          <p role="alert" className="text-destructive">
            {error}
          </p>
        )}
        <small>Saved for this account on this device.</small>
      </PopoverContent>
    </Popover>
  );
}
