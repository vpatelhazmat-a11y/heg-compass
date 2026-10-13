import { useState, type ComponentProps } from "react";
import { RecordListPage } from "@/components/app/RecordWorkspace";
export default function Customers() {
  const [state, setState] = useState<NonNullable<ComponentProps<typeof RecordListPage>["state"]>>(
    {},
  );
  return (
    <RecordListPage
      table="customers"
      state={state}
      onChange={(patch) =>
        setState((previous) => ({
          ...previous,
          ...patch,
          ...(patch.q !== undefined ? { search: patch.q } : {}),
        }))
      }
    />
  );
}
