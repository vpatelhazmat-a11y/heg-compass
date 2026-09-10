import { createFileRoute, redirect } from "@tanstack/react-router";

// The refused-load workflow now lives under the top-level Lost Loads section.
export const Route = createFileRoute("/_authenticated/refused-loads/")({
  beforeLoad: () => {
    throw redirect({ to: "/lost-loads" });
  },
  component: () => null,
});
