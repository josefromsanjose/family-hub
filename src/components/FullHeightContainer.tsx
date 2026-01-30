import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FullHeightContainerProps {
  children: ReactNode;
  className?: string;
}

export function FullHeightContainer({
  children,
  className,
}: FullHeightContainerProps) {
  return (
    <div
      className={cn(
        "h-[calc(100vh-64px)] h-[calc(100svh-64px)]",
        className
      )}
    >
      {children}
    </div>
  );
}
