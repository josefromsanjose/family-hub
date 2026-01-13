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
import { useHousehold } from "../contexts/HouseholdContext";

export const Route = createFileRoute("/")({ component: Dashboard });

function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome Back! 👋
          </h1>
          <p className="text-gray-600">
            Here's what's happening in your household today
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <DashboardCard
            title="Meals This Week"
            value="7 planned"
            icon={UtensilsCrossed}
            href="/meals"
            color="bg-blue-500"
          />
          <DashboardCard
            title="Shopping Items"
            value="12 items"
            icon={ShoppingCart}
            href="/shopping"
            color="bg-green-500"
          />
          <DashboardCard
            title="Active Tasks"
            value="5 tasks"
            icon={CheckSquare}
            href="/tasks"
            color="bg-purple-500"
          />
          <DashboardCard
            title="Upcoming Events"
            value="3 this week"
            icon={Calendar}
            href="/calendar"
            color="bg-orange-500"
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
      className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow border border-gray-200"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
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
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
      <div className="space-y-3">
        <Link
          to="/meals"
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <UtensilsCrossed size={20} className="text-blue-500" />
          <span className="text-gray-700">Plan this week's meals</span>
        </Link>
        <Link
          to="/shopping"
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ShoppingCart size={20} className="text-green-500" />
          <span className="text-gray-700">Create shopping list</span>
        </Link>
        <Link
          to="/tasks"
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <CheckSquare size={20} className="text-purple-500" />
          <span className="text-gray-700">Add new task</span>
        </Link>
        <Link
          to="/my-chores"
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ListTodo size={20} className="text-purple-500" />
          <span className="text-gray-700">View my chores</span>
        </Link>
        <Link
          to="/calendar"
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Calendar size={20} className="text-orange-500" />
          <span className="text-gray-700">View calendar</span>
        </Link>
      </div>
    </div>
  );
}

function HouseholdMembersCard() {
  const { members } = useHousehold();

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Household Members</h2>
        <Link
          to="/settings"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
          aria-label="Manage members"
        >
          <Settings size={18} />
        </Link>
      </div>
      {members.length === 0 ? (
        <div className="text-center py-4">
          <Users className="mx-auto h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-600 mb-3">No members added yet</p>
          <Link
            to="/settings"
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Members
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {members.map((member) => (
            <div key={member.id} className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 ${member.color || "bg-gray-500"}`}
              >
                {member.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {member.name}
                </p>
                {member.role && (
                  <p className="text-xs text-gray-600 truncate">
                    {member.role}
                  </p>
                )}
              </div>
            </div>
          ))}
          <Link
            to="/settings"
            className="block mt-4 text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
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
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
          <div className="flex-1">
            <p className="text-sm text-gray-900">Shopping list updated</p>
            <p className="text-xs text-gray-500">2 hours ago</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
          <div className="flex-1">
            <p className="text-sm text-gray-900">
              Meal plan created for this week
            </p>
            <p className="text-xs text-gray-500">Yesterday</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-2 h-2 bg-purple-500 rounded-full mt-2" />
          <div className="flex-1">
            <p className="text-sm text-gray-900">
              Task completed: Grocery shopping
            </p>
            <p className="text-xs text-gray-500">2 days ago</p>
          </div>
        </div>
      </div>
    </div>
  );
}
