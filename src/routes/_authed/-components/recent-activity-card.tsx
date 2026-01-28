import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { recentActivities } from "./dashboard-data";

export function RecentActivityCard() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-0">
        <CardTitle className="text-xl">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 flex-1 min-h-0 overflow-y-auto pr-1">
        {recentActivities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-3">
            <div
              className={`w-2 h-2 rounded-full mt-2 ${activity.dotClassName}`}
            />
            <div className="flex-1">
              <p className="text-sm text-foreground">{activity.description}</p>
              <p className="text-xs text-muted-foreground">
                {activity.timestamp}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
