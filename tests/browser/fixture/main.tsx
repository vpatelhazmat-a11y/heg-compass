import { createRoot } from "react-dom/client";
import type { ReactNode } from "react";
import { QueryClient } from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { routeTree } from "@/routeTree.gen";
import { Route as rootRoute } from "@/routes/__root";
import { userId } from "./data";
import "@/styles.css";

const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
client.setQueryData(["session"], {
  userId,
  fullName: "Sample User",
  email: "sample@example.test",
  roles: ["admin"],
  title: "UI review",
});
// The fixture document already owns html/head/body. All application routes,
// guards, query providers, navigation and record components remain real.
Object.assign(rootRoute.options, {
  shellComponent: ({ children }: { children: ReactNode }) => <>{children}</>,
});
const router = createRouter({ routeTree, context: { queryClient: client } });
createRoot(document.getElementById("root")!).render(<RouterProvider router={router} />);
