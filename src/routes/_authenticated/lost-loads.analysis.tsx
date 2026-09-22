import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/_authenticated/lost-loads/analysis")({
  beforeLoad: () => {
    throw redirect({ to: "/lost-loads" });
  },
});
