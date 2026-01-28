import type { ComponentType } from "react";
import { Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";

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
    <Card asChild className="hover:shadow-md transition-shadow">
      <Link to={href}>
        <CardContent>
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
        </CardContent>
      </Link>
    </Card>
  );
}
