import { useState } from "react";
import { MasterRecordList } from "@/components/app/MasterRecordList";
import { parseRecordListSearch } from "@/lib/record-lists";
export default function Customers() {
  const [search, setSearch] = useState(() =>
    parseRecordListSearch({} as Parameters<typeof parseRecordListSearch>[0]),
  );
  return (
    <MasterRecordList
      table="customers"
      search={search}
      onChange={(patch) =>
        setSearch((previous) => ({
          ...previous,
          ...patch,
        }))
      }
    />
  );
}
