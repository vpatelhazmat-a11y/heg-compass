import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
  Outlet,
} from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { AppLauncher } from "@/components/app/AppLauncher";
import { RecordDetailPage } from "@/components/app/RecordWorkspace";
import { customerId, userId } from "./data";
import Customers from "./Customers";
import "@/styles.css";

const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
client.setQueryData(["session"], {
  userId,
  fullName: "Sample User",
  email: "sample@example.test",
  roles: ["admin"],
  title: "UI review",
});
const rootRoute = createRootRoute({
  component: () => (
    <QueryClientProvider client={client}>
      <AppShell>
        <Outlet />
      </AppShell>
    </QueryClientProvider>
  ),
});
const launcher = createRoute({
  getParentRoute: () => rootRoute,
  path: "/command-center",
  component: AppLauncher,
});
const customers = createRoute({
  getParentRoute: () => rootRoute,
  path: "/customers",
  component: Customers,
});
const record = createRoute({
  getParentRoute: () => rootRoute,
  path: "/customers/$customerId",
  component: () => <RecordDetailPage table="customers" id={customerId} returnTo="/customers" />,
});
const router = createRouter({ routeTree: rootRoute.addChildren([launcher, customers, record]) });
createRoot(document.getElementById("root")!).render(<RouterProvider router={router} />);
