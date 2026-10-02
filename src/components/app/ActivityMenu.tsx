import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession } from "@/hooks/use-session";
import { listRows } from "@/lib/data";
import { buildActivityFeed } from "@/lib/activity-feed";
import { formatDate } from "@/lib/format";

export function ActivityMenu() {
  const { session } = useSession();
  const userId = session?.userId;
  const [enabled, setEnabled] = useState(true);
  useEffect(() => {
    const read = () => {
      try {
        setEnabled(!userId || localStorage.getItem(`heg-task-alerts:${userId}`) !== "off");
      } catch {
        setEnabled(true);
      }
    };
    read();
    window.addEventListener("storage", read);
    window.addEventListener("heg:preference-changed", read);
    return () => {
      window.removeEventListener("storage", read);
      window.removeEventListener("heg:preference-changed", read);
    };
  }, [userId]);
  const feed = useQuery({
    queryKey: ["activity-feed", userId],
    enabled: Boolean(userId && enabled),
    staleTime: 60_000,
    refetchInterval: 120_000,
    queryFn: async () => {
      if (!userId) return [];
      const [tasks, bids, documents, contracts] = await Promise.all([
        listRows("tasks", {
          filters: { owner: userId },
          select: "id,title,due_date,status,created_at",
        }),
        listRows("bids", { select: "id,bid_name,due_date,status,created_at" }),
        listRows("documents", { select: "id,document_name,expiration_date,status,created_at" }),
        listRows("contracts", { select: "id,contract_name,expiration_date,status,created_at" }),
      ]);
      const today = new Date();
      const localToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      return buildActivityFeed({ tasks, bids, documents, contracts }, localToday);
    },
  });
  const items = enabled ? (feed.data ?? []) : [];
  const urgent = items.filter((item) => item.daysAway <= 0).length;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="activity-trigger"
          aria-label={`Activity${urgent ? `, ${urgent} due or overdue` : ""}`}
        >
          <Bell className="h-4 w-4" aria-hidden />
          {urgent > 0 && (
            <span className="activity-count" aria-hidden>
              {urgent > 9 ? "9+" : urgent}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="activity-menu-content">
        <DropdownMenuLabel>Activity</DropdownMenuLabel>
        {!enabled ? (
          <p className="activity-empty">Activity alerts are turned off in Settings.</p>
        ) : feed.isLoading ? (
          <p className="activity-empty">Checking deadlines…</p>
        ) : feed.error ? (
          <p role="alert" className="activity-empty">
            Activity could not be loaded.
          </p>
        ) : items.length === 0 ? (
          <p className="activity-empty">Nothing due soon.</p>
        ) : (
          <div className="activity-items">
            {items.map((item) => (
              <a key={item.id} href={item.href} className="activity-item">
                <span>
                  <strong>{item.title}</strong>
                  <small>
                    {item.kind} · {formatDate(item.dueDate)}
                  </small>
                </span>
                <em className={item.daysAway <= 0 ? "is-urgent" : ""}>
                  {item.daysAway < 0
                    ? "Overdue"
                    : item.daysAway === 0
                      ? "Today"
                      : `${item.daysAway}d`}
                </em>
              </a>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
