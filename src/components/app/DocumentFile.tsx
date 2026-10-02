import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { type Row } from "@/lib/data";
import { useSession } from "@/hooks/use-session";

const BUCKET = "heg-documents";
const MAX_SIZE = 20 * 1024 * 1024;

export function DocumentFile({ document }: { document: Row }) {
  const { canEdit } = useSession();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const fileStatus = useQuery({
    queryKey: ["document-file", document.id, document.file_path],
    enabled: Boolean(document.file_path),
    queryFn: async () => {
      const result = await supabase.storage.from(BUCKET).exists(document.file_path);
      return result.data;
    },
    retry: false,
  });

  const upload = async (file: File) => {
    if (file.size > MAX_SIZE) {
      toast.error("Choose a file smaller than 20 MB.");
      return;
    }
    if (document.file_path && document.file_name !== file.name) {
      toast.error(`To finish the interrupted upload, choose ${document.file_name}.`);
      return;
    }
    setBusy(true);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100) || "file";
    const path = document.file_path || `${document.id}/${crypto.randomUUID()}-${safeName}`;
    try {
      if (!document.file_path) {
        const { data, error } = await supabase
          .from("documents")
          .update({ file_path: path, file_name: file.name })
          .eq("id", document.id)
          .is("file_path", null)
          .select("id")
          .maybeSingle();
        if (error) throw error;
        if (!data)
          throw new Error(
            "Another upload has started for this document. Refresh and review the attachment.",
          );
      }
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
        upsert: false,
        contentType: file.type || "application/octet-stream",
      });
      if (error) throw error;
      toast.success("File uploaded");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "File upload failed. You can retry it here.",
      );
    } finally {
      await queryClient.invalidateQueries({ queryKey: ["record", "documents", document.id] });
      await queryClient.invalidateQueries({ queryKey: ["document-file", document.id] });
      setBusy(false);
    }
  };

  const download = async () => {
    setBusy(true);
    try {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(document.file_path, 60, { download: document.file_name });
      if (error || !data?.signedUrl) throw error ?? new Error("Download unavailable.");
      const link = window.document.createElement("a");
      link.href = data.signedUrl;
      link.rel = "noopener noreferrer";
      window.document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Download unavailable.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="record-section record-section-wide" aria-label="Document file">
      <h2>File</h2>
      {document.file_path && fileStatus.data !== false ? (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-muted-foreground">{document.file_name}</span>
          <Button type="button" variant="outline" size="sm" disabled={busy} onClick={download}>
            <Download className="h-4 w-4" /> Download file
          </Button>
        </div>
      ) : canEdit("documents") ? (
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-primary hover:underline">
          <Upload className="h-4 w-4" />{" "}
          {busy
            ? "Uploading…"
            : document.file_path
              ? `Retry upload: ${document.file_name}`
              : "Upload file (up to 20 MB)"}
          <input
            type="file"
            className="sr-only"
            disabled={busy}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void upload(file);
              event.target.value = "";
            }}
          />
        </label>
      ) : (
        <p className="text-sm text-muted-foreground">No file uploaded.</p>
      )}
    </section>
  );
}
