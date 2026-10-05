import { createContext, useCallback, useContext, useEffect, useId } from "react";
export const DraftContext = createContext<{
  register: (id: string, label: string | null) => void;
  dirty: boolean;
} | null>(null);
export function useDraftProtection(dirty: boolean, label: string) {
  const register = useContext(DraftContext)?.register;
  const id = useId();
  useEffect(() => {
    register?.(id, dirty ? label : null);
    return () => register?.(id, null);
  }, [register, id, dirty, label]);
  return useCallback(() => register?.(id, null), [register, id]);
}

export function useHasDrafts() {
  return useContext(DraftContext)?.dirty ?? false;
}
