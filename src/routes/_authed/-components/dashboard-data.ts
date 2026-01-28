import type { LucideIcon } from "lucide-react";
import {
  Calendar,
  CheckSquare,
  ListTodo,
  ShoppingCart,
  UtensilsCrossed,
} from "lucide-react";

export interface QuickAction {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface RecentActivity {
  id: string;
  description: string;
  timestamp: string;
  dotClassName: string;
}

export const quickActions: QuickAction[] = [
  {
    label: "Plan this week's meals",
    href: "/meals",
    icon: UtensilsCrossed,
  },
  {
    label: "Create shopping list",
    href: "/shopping",
    icon: ShoppingCart,
  },
  {
    label: "Add new task",
    href: "/tasks",
    icon: CheckSquare,
  },
  {
    label: "View my tasks",
    href: "/tasks",
    icon: ListTodo,
  },
  {
    label: "View calendar",
    href: "/calendar",
    icon: Calendar,
  },
];

export const recentActivities: RecentActivity[] = [
  {
    id: "shopping-updated",
    description: "Shopping list updated",
    timestamp: "2 hours ago",
    dotClassName: "bg-chart-2",
  },
  {
    id: "meal-plan-created",
    description: "Meal plan created for this week",
    timestamp: "Yesterday",
    dotClassName: "bg-chart-1",
  },
  {
    id: "task-completed",
    description: "Task completed: Grocery shopping",
    timestamp: "2 days ago",
    dotClassName: "bg-chart-3",
  },
];
