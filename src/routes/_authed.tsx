import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { ensureHouseholdForCurrentUser } from "@/server/household";

export const Route = createFileRoute("/_authed")({
  component: AuthenticatedLayout,
  beforeLoad: async ({ context, location }) => {
    if (!context.userId) {
      throw redirect({
        to: "/sign-in",
        search: {
          redirect: location.href,
        },
      });
    }

    await ensureHouseholdForCurrentUser();
  },
});

function AuthenticatedLayout() {
  return <Outlet />;
}
