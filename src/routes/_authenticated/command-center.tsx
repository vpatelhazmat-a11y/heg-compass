import { createFileRoute } from "@tanstack/react-router";
import { AppLauncher } from "@/components/app/AppLauncher";
export const Route = createFileRoute("/_authenticated/command-center")({
  head: () => ({ meta: [{ title: "Apps � HEG Compass" }] }),
  component: AppLauncher,
});
