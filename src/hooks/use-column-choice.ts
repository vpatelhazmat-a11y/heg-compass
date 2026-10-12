import { useEffect, useMemo, useState } from "react";
import {
  normalizeColumnChoice,
  readColumnChoice,
  writeColumnChoice,
} from "@/lib/column-preferences";

export function useColumnChoice(
  userId: string | null | undefined,
  scope: string | undefined,
  keys: string[],
) {
  const signature = JSON.stringify(keys);
  const available = useMemo(() => JSON.parse(signature) as string[], [signature]);
  const owner = JSON.stringify([userId ?? null, scope ?? null]);
  const [choice, setChoice] = useState<{ owner: string; keys: string[] } | null>(null);
  const [failure, setFailure] = useState<{ owner: string; message: string } | null>(null);
  useEffect(() => {
    setChoice({
      owner,
      keys: userId && scope ? (readColumnChoice(userId, scope, available) ?? available) : available,
    });
    setFailure(null);
  }, [owner, userId, scope, available]);
  const visibleKeys =
    choice?.owner === owner
      ? (normalizeColumnChoice(choice.keys, available) ?? available)
      : available;
  const select = (keys: string[]) => {
    const next = normalizeColumnChoice(keys, available) ?? available;
    setChoice({ owner, keys: next });
    setFailure(null);
    if (userId && scope) {
      try {
        writeColumnChoice(userId, scope, next, available);
      } catch {
        setFailure({
          owner,
          message: "Your column choice applies here, but could not be saved on this device.",
        });
      }
    }
  };
  return { visibleKeys, select, error: failure?.owner === owner ? failure.message : null };
}
