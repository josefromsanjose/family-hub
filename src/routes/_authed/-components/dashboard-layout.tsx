import type { ReactNode } from "react";
import { FullHeightContainer } from "@/components/FullHeightContainer";

export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <FullHeightContainer className="p-6">
      <div className="max-w-7xl mx-auto h-full flex flex-col">{children}</div>
    </FullHeightContainer>
  );
}

export function DashboardContentGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0 auto-rows-fr">
      {children}
    </div>
  );
}
