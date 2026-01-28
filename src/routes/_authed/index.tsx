import { createFileRoute } from "@tanstack/react-router";
import { DashboardContentGrid, DashboardLayout } from "./-components/dashboard-layout";
import { DashboardStats } from "./-components/dashboard-stats";
import { HouseholdMembersCard } from "./-components/household-members-card";
import { QuickActionsCard } from "./-components/quick-actions-card";
import { RecentActivityCard } from "./-components/recent-activity-card";

export const Route = createFileRoute("/_authed/")({ component: Dashboard });

export function Dashboard() {
  return (
    <DashboardLayout>
      <DashboardStats />
      <DashboardContentGrid>
        <QuickActionsCard />
        <HouseholdMembersCard />
        <RecentActivityCard />
      </DashboardContentGrid>
    </DashboardLayout>
  );
}
