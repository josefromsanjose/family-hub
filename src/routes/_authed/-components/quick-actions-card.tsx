import type { ComponentType } from "react";
import { Link } from "@tanstack/react-router";
import { quickActions } from "./dashboard-data";

export function QuickActionsCard() {
  return (
    <div className="bg-card rounded-lg shadow-sm p-6 border border-border h-full flex flex-col">
      <h2 className="text-xl font-bold text-card-foreground mb-4">
        Quick Actions
      </h2>
      <div className="space-y-3 flex-1 min-h-0 overflow-y-auto pr-1">
        {quickActions.map((action) => (
          <QuickActionLink
            key={action.href + action.label}
            href={action.href}
            label={action.label}
            icon={action.icon}
          />
        ))}
      </div>
    </div>
  );
}

function QuickActionLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
}) {
  return (
    <Link
      to={href}
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
    >
      <Icon size={20} className="text-primary" />
      <span className="text-foreground">{label}</span>
    </Link>
  );
}
