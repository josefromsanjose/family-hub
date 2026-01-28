import type { ComponentType } from "react";
import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { quickActions } from "./dashboard-data";

export function QuickActionsCard() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-0">
        <CardTitle className="text-xl">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 flex-1 min-h-0 overflow-y-auto pr-1">
        {quickActions.map((action) => (
          <QuickActionLink
            key={action.href + action.label}
            href={action.href}
            label={action.label}
            icon={action.icon}
          />
        ))}
      </CardContent>
    </Card>
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
