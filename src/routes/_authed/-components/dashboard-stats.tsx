import { Calendar, ShoppingCart } from "lucide-react";
import { DashboardCard } from "./dashboard-card";
import { DashboardMealStats } from "./dashboard-meals";

export function DashboardStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <DashboardMealStats />
      <DashboardCard
        title="Shopping Items"
        value="12 items"
        icon={ShoppingCart}
        href="/shopping"
      />
      <DashboardCard
        title="Upcoming Events"
        value="3 this week"
        icon={Calendar}
        href="/calendar"
      />
    </div>
  );
}
