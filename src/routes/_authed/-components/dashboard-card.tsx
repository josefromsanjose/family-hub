import type { ComponentType } from "react";
import { Link } from "@tanstack/react-router";

type IconProps = { size?: number; className?: string };

interface DashboardCardProps {
  title: string;
  value: string;
  icon: ComponentType<IconProps>;
  href: string;
  color?: string;
}

export function DashboardCard({
  title,
  value,
  icon: Icon,
  href,
  color = "bg-chart-2",
}: DashboardCardProps) {
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
