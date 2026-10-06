import type { ReactNode } from "react";
import { RecordChatter } from "./RecordChatter";
import { RelatedRecords } from "./RelatedRecords";
import { cn } from "@/lib/utils";

/** Shared record structure: record content and related work remain in one column. */
export function RecordLayout({
  table,
  id,
  children,
  master = false,
  links,
}: {
  table: string;
  id: string;
  children: ReactNode;
  master?: boolean;
  links?: ReactNode;
}) {
  return (
    <div className="record-workspace-layout">
      <div className={cn("record-workspace-main", master && "master-record")}>
        {links}
        {children}
        <RelatedRecords table={table} id={id} />
      </div>
      <RecordChatter table={table} id={id} />
    </div>
  );
}
