import { CircleDotDashedIcon } from "lucide-react";
import { cn } from "../../lib/utils";

export function Loading() {
  return (
    <div className="flex items-center gap-2.5">
      <LoadingSpinner className="text-muted-foreground size-5" />
      <p className="font-semibold">Loading</p>
    </div>
  );
}

export function LoadingSpinner(props: { className?: string }) {
  return (
    <CircleDotDashedIcon className={cn("animate-spin", props.className)} />
  );
}
