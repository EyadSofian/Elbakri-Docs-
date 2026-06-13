import { lazy } from "react";
import { createBrowserRouter, Link, useRouteError } from "react-router-dom";
import { Layout } from "@/components/Layout";

// Route-level code splitting: every page is its own chunk, so the initial
// bundle stays small and heavy editors only load when their route is visited.
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Clients = lazy(() => import("@/pages/Clients"));
const Suppliers = lazy(() => import("@/pages/Suppliers"));
const Templates = lazy(() => import("@/pages/Templates"));
const Documents = lazy(() => import("@/pages/Documents"));
const InvoiceNew = lazy(() => import("@/pages/InvoiceNew"));
const InvoiceEdit = lazy(() => import("@/pages/InvoiceEdit"));
const InvoiceBalanceDue = lazy(() => import("@/pages/InvoiceBalanceDue"));
const VoucherNew = lazy(() => import("@/pages/VoucherNew"));
const VoucherEdit = lazy(() => import("@/pages/VoucherEdit"));
const StatementNew = lazy(() => import("@/pages/StatementNew"));
const StatementEdit = lazy(() => import("@/pages/StatementEdit"));
const Accounts = lazy(() => import("@/pages/Accounts"));
const AccountDetail = lazy(() => import("@/pages/AccountDetail"));
const AccountConsolidated = lazy(() => import("@/pages/AccountConsolidated"));
const BulkExport = lazy(() => import("@/pages/BulkExport"));
const Settings = lazy(() => import("@/pages/Settings"));

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "clients", element: <Clients /> },
      { path: "suppliers", element: <Suppliers /> },
      { path: "templates", element: <Templates /> },
      { path: "documents", element: <Documents /> },
      { path: "invoices/new", element: <InvoiceNew /> },
      { path: "invoices/:id", element: <InvoiceEdit /> },
      { path: "invoices/:id/balance-due", element: <InvoiceBalanceDue /> },
      { path: "vouchers/new", element: <VoucherNew /> },
      { path: "vouchers/:id", element: <VoucherEdit /> },
      { path: "statements/new", element: <StatementNew /> },
      { path: "statements/:id", element: <StatementEdit /> },
      { path: "accounts", element: <Accounts /> },
      { path: "accounts/:id", element: <AccountDetail /> },
      { path: "accounts/:id/consolidated", element: <AccountConsolidated /> },
      { path: "bulk-export", element: <BulkExport /> },
      { path: "settings", element: <Settings /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-navy">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">That document or page doesn't exist.</p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-md bg-navy px-4 py-2 text-sm font-medium text-navy-foreground hover:opacity-90"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}

function RouteErrorPage() {
  const error = useRouteError();
  console.error(error);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong. Try reloading or head back to the dashboard.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => window.location.reload()}
            className="rounded-md bg-navy px-4 py-2 text-sm font-medium text-navy-foreground"
          >
            Reload
          </button>
          <a href="/" className="rounded-md border px-4 py-2 text-sm font-medium">
            Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
