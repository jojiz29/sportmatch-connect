import React from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/shared/ui/skeleton";

interface SkeletonLoaderProps {
  type: "match-card" | "squad-slot" | "post-feed" | "dashboard-stat";
  count?: number;
  className?: string;
}

export function SkeletonLoader({ type, count = 1, className }: SkeletonLoaderProps) {
  const renderSkeleton = () => {
    switch (type) {
      case "match-card":
        return (
          <div
            className={cn(
              "bg-gradient-card border border-border/40 rounded-3xl p-5 shadow-card space-y-4 animate-pulse",
              className,
            )}
          >
            <div className="flex justify-between items-center">
              <Skeleton className="h-6 w-32 bg-muted/30 rounded-xl" />
              <Skeleton className="h-4 w-16 bg-muted/30 rounded-lg" />
            </div>
            <div className="space-y-2.5 pt-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-6 bg-muted/30 rounded-md" />
                  <Skeleton className="h-4 w-40 bg-muted/30 rounded-lg" />
                </div>
                <Skeleton className="h-4 w-6 bg-muted/30 rounded-md" />
              </div>
              <div className="h-px bg-border/20" />
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-6 bg-muted/30 rounded-md" />
                  <Skeleton className="h-4 w-36 bg-muted/30 rounded-lg" />
                </div>
                <Skeleton className="h-4 w-6 bg-muted/30 rounded-md" />
              </div>
            </div>
          </div>
        );
      case "squad-slot":
        return (
          <div
            className={cn(
              "flex flex-col items-center justify-center p-3 rounded-2xl w-24 border border-dashed border-border/50 bg-background/15 animate-pulse",
              className,
            )}
          >
            <Skeleton className="h-10 w-10 bg-muted/30 rounded-full" />
            <Skeleton className="h-3 w-16 bg-muted/30 rounded mt-2.5" />
            <Skeleton className="h-2 w-10 bg-muted/30 rounded mt-1" />
          </div>
        );
      case "post-feed":
        return (
          <div
            className={cn(
              "bg-gradient-card border border-border/50 rounded-3xl p-5 shadow-card space-y-4 animate-pulse",
              className,
            )}
          >
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 bg-muted/30 rounded-full" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-28 bg-muted/30 rounded" />
                <Skeleton className="h-3 w-16 bg-muted/30 rounded" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-full bg-muted/30 rounded" />
              <Skeleton className="h-3.5 w-4/5 bg-muted/30 rounded" />
            </div>
            <Skeleton className="h-40 w-full bg-muted/20 rounded-xl" />
          </div>
        );
      case "dashboard-stat":
        return (
          <div
            className={cn(
              "bg-background/45 border border-border/60 rounded-2xl p-4 flex flex-col items-center justify-center text-center animate-pulse",
              className,
            )}
          >
            <Skeleton className="h-3 w-16 bg-muted/30 rounded" />
            <Skeleton className="h-6 w-16 bg-muted/30 rounded mt-2" />
          </div>
        );
      default:
        return <Skeleton className={cn("h-4 w-full bg-muted/30 rounded", className)} />;
    }
  };

  return (
    <>
      {Array.from({ length: count }).map((_, idx) => (
        <React.Fragment key={idx}>{renderSkeleton()}</React.Fragment>
      ))}
    </>
  );
}

export default SkeletonLoader;
