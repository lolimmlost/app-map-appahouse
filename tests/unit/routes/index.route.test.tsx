// @vitest-environment jsdom
/**
 * Regression test for React error #300 ("Rendered fewer hooks than expected").
 *
 * The dashboard route (`src/routes/index.tsx`) once called the `visibleApps`
 * useMemo *after* its auth guard early-return. When the session resolved from
 * `pending` to `unauthenticated`, the guard returned early and skipped that
 * hook, so the render ran fewer hooks than the previous render and React threw
 * #300, crashing the whole tree for signed-out visitors.
 *
 * This test renders the real route component through the exact
 * pending -> unauthenticated transition and asserts it does not throw. The
 * heavy child tree, custom hooks, and `.server` data modules are stubbed so the
 * test exercises hook ordering only (and never pulls in DB drivers).
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render } from "@testing-library/react";
import { createElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mutable auth state, read fresh on every render so a rerender can flip it.
const hoisted = vi.hoisted(() => ({
  auth: { current: { data: undefined as unknown, isPending: true } },
}));

vi.mock("@daveyplate/better-auth-ui", () => ({
  useAuthenticate: () => hoisted.auth.current,
}));

// Server data fns: never invoked (queries are `enabled: !!session?.user`), but
// mocked so importing the route doesn't drag in pg / the DB layer.
vi.mock("@/lib/server/apps.server", () => ({ getApps: vi.fn() }));
vi.mock("@/lib/server/categories.server", () => ({ getCategories: vi.fn() }));
vi.mock("@/lib/server/tags.server", () => ({ getTags: vi.fn() }));
vi.mock("@/lib/server/user-settings.server", () => ({ getUserSettings: vi.fn() }));
vi.mock("@/lib/server/analytics.server", () => ({ getAnalyticsSummary: vi.fn() }));

// Custom hooks — return the minimal shapes the component reads during render.
// `healthResults`/`healthStatuses` must be objects (Object.entries / index access).
vi.mock("@/hooks/use-health-status", () => ({
  useHealthStatus: () => ({
    healthStatuses: {},
    healthResults: {},
    isLoading: false,
    refreshHealth: vi.fn(),
  }),
}));
vi.mock("@/hooks/use-app-mutations", () => ({
  useAppMutations: () => ({
    createMutation: { mutate: vi.fn() },
    updateMutation: { mutate: vi.fn() },
    deleteMutation: { mutate: vi.fn() },
    pinMutation: { mutate: vi.fn() },
    reorderMutation: { mutate: vi.fn() },
    bulkDeleteMutation: { mutate: vi.fn() },
    bulkCategoryMutation: { mutate: vi.fn() },
    bulkHealthCheckMutation: { mutate: vi.fn() },
    bulkExportMutation: { mutate: vi.fn() },
    bulkTagsMutation: { mutate: vi.fn() },
    isFormLoading: false,
    isBulkLoading: false,
  }),
}));
vi.mock("@/hooks/use-dependency-status", () => ({
  useDependencyStatuses: () => ({ dependencyStatuses: {} }),
}));

// Heavy child trees are irrelevant to hook ordering — stub them to nothing.
// (Factories are hoisted, so helpers must be defined inside them, not above.)
vi.mock("@/components/apps", () => {
  const s = () => null;
  return {
    AppGrid: s,
    SortableAppGrid: s,
    AppForm: s,
    AppNotesDialog: s,
    QuickLinksBar: s,
    BulkActionsBar: s,
    ShareDialog: s,
    DependencyGraphView: s,
    OpsSidebar: s,
  };
});
vi.mock("@/components/widgets", () => ({ WidgetGrid: () => null }));
vi.mock("@/components/links", () => ({ LinksGrid: () => null }));
vi.mock("@/components/discovery", () => ({ ServiceDiscoveryDialog: () => null }));
// Radix dropdown needs browser APIs jsdom lacks; passthrough is enough here.
vi.mock("@/components/ui/dropdown-menu", async () => {
  const { createElement: ce } = await import("react");
  const pass = ({ children }: { children?: React.ReactNode }) =>
    ce("div", null, children);
  return {
    DropdownMenu: pass,
    DropdownMenuContent: pass,
    DropdownMenuTrigger: pass,
    DropdownMenuItem: pass,
    DropdownMenuCheckboxItem: pass,
    DropdownMenuLabel: pass,
    DropdownMenuSeparator: () => ce("div"),
  };
});

// Imported after the mocks are registered (vi.mock is hoisted regardless).
import { Route } from "@/routes/index";

const DashboardPage = Route.options.component as () => React.ReactElement;

function renderDashboard() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const ui = createElement(
    QueryClientProvider,
    { client },
    createElement(DashboardPage),
  );
  return render(ui);
}

beforeEach(() => {
  // jsdom has no matchMedia; the sidebar auto-open effect calls it.
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
  hoisted.auth.current = { data: undefined, isPending: true };
});

describe("dashboard route hook ordering", () => {
  it("does not throw React #300 when the session resolves pending -> unauthenticated", () => {
    // First render: session pending -> auth guard NOT taken -> full tree, all hooks run.
    hoisted.auth.current = { data: undefined, isPending: true };
    const { rerender, queryByText } = renderDashboard();

    // Session resolves to unauthenticated -> auth guard taken -> early return.
    // Before the fix this ran fewer hooks than the previous render and threw #300.
    hoisted.auth.current = { data: null, isPending: false };
    expect(() =>
      rerender(
        createElement(
          QueryClientProvider,
          { client: new QueryClient({ defaultOptions: { queries: { retry: false } } }) },
          createElement(DashboardPage),
        ),
      ),
    ).not.toThrow();

    // And the login prompt is what a signed-out visitor should see.
    expect(queryByText("Sign in to manage your apps")).not.toBeNull();
  });

  it("renders the login prompt directly for an unauthenticated session", () => {
    hoisted.auth.current = { data: null, isPending: false };
    const { queryByText } = renderDashboard();
    expect(queryByText("Sign in to manage your apps")).not.toBeNull();
  });
});
