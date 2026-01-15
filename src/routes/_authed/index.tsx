import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import {
  Calendar,
  ShoppingCart,
  CheckSquare,
  UtensilsCrossed,
  Users,
  Settings,
  ListTodo,
} from "lucide-react";
import { useHousehold } from "@/contexts/HouseholdContext";

export const Route = createFileRoute("/_authed/")({ component: Dashboard });

function Dashboard() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome Back! 👋
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening in your household today
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <DashboardCard
            title="Meals This Week"
            value="7 planned"
            icon={UtensilsCrossed}
            href="/meals"
            color="bg-chart-1"
          />
          <DashboardCard
            title="Shopping Items"
            value="12 items"
            icon={ShoppingCart}
            href="/shopping"
            color="bg-chart-2"
          />
          <DashboardCard
            title="Active Tasks"
            value="5 tasks"
            icon={CheckSquare}
            href="/tasks"
            color="bg-chart-3"
          />
          <DashboardCard
            title="Upcoming Events"
            value="3 this week"
            icon={Calendar}
            href="/calendar"
            color="bg-chart-4"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <QuickActionsCard />
          <HouseholdMembersCard />
          <RecentActivityCard />
        </div>
      </div>
    </div>
  );
}

function DashboardCard({
  title,
  value,
  icon: Icon,
  href,
  color,
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  href: string;
  color: string;
}) {
  return (
    <Link
      to={href}
      className="bg-card rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow border border-border"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold text-card-foreground">{value}</p>
        </div>
        <div className={`${color} p-3 rounded-lg`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </Link>
  );
}

function QuickActionsCard() {
  return (
    <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
      <h2 className="text-xl font-bold text-card-foreground mb-4">
        Quick Actions
      </h2>
      <div className="space-y-3">
        <Link
          to="/meals"
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
        >
          <UtensilsCrossed size={20} className="text-primary" />
          <span className="text-foreground">Plan this week's meals</span>
        </Link>
        <Link
          to="/shopping"
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
        >
          <ShoppingCart size={20} className="text-primary" />
          <span className="text-foreground">Create shopping list</span>
        </Link>
        <Link
          to="/tasks"
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
        >
          <CheckSquare size={20} className="text-primary" />
          <span className="text-foreground">Add new task</span>
        </Link>
        <Link
          to="/my-chores"
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
        >
          <ListTodo size={20} className="text-primary" />
          <span className="text-foreground">View my chores</span>
        </Link>
        <Link
          to="/calendar"
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
        >
          <Calendar size={20} className="text-primary" />
          <span className="text-foreground">View calendar</span>
        </Link>
      </div>
    </div>
  );
}

function HouseholdMembersCard() {
  const { members } = useHousehold();

  return (
    <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-card-foreground">
          Household Members
        </h2>
        <Link
          to="/settings"
          className="p-2 hover:bg-accent rounded-lg transition-colors text-muted-foreground"
          aria-label="Manage members"
        >
          <Settings size={18} />
        </Link>
      </div>
      {members.length === 0 ? (
        <div className="text-center py-4">
          <Users className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground mb-3">
            No members added yet
          </p>
          <Link
            to="/settings"
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Add Members
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {members.map((member) => (
            <div key={member.id} className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 ${member.color || "bg-muted"}`}
              >
                {member.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-card-foreground truncate">
                  {member.name}
                </p>
                {member.role && (
                  <p className="text-xs text-muted-foreground truncate">
                    {member.role}
                  </p>
                )}
              </div>
            </div>
          ))}
          <Link
            to="/settings"
            className="block mt-4 text-center text-sm text-primary hover:text-primary/80 font-medium"
          >
            Manage Members →
          </Link>
        </div>
      )}
    </div>
  );
}

function RecentActivityCard() {
  return (
    <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
      <h2 className="text-xl font-bold text-card-foreground mb-4">
        Recent Activity
      </h2>
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-2 h-2 bg-chart-2 rounded-full mt-2" />
          <div className="flex-1">
            <p className="text-sm text-foreground">Shopping list updated</p>
            <p className="text-xs text-muted-foreground">2 hours ago</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-2 h-2 bg-chart-1 rounded-full mt-2" />
          <div className="flex-1">
            <p className="text-sm text-foreground">
              Meal plan created for this week
            </p>
            <p className="text-xs text-muted-foreground">Yesterday</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-2 h-2 bg-chart-3 rounded-full mt-2" />
          <div className="flex-1">
            <p className="text-sm text-foreground">
              Task completed: Grocery shopping
            </p>
            <p className="text-xs text-muted-foreground">2 days ago</p>
          </div>
        </div>
      </div>
    </div>
  );
}
