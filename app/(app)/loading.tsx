import { Skeleton } from "@/components/ui/skeleton";

export default function AppLoading() {
  return (
    <div className="mx-auto max-w-[1240px] px-4 py-6 sm:px-6 lg:px-8 lg:py-9">
      <div className="flex items-end justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="hidden h-12 w-40 rounded-full sm:block" />
      </div>

      <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-[118px] rounded-2xl" />
        ))}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Skeleton className="h-[300px] rounded-2xl" />
        <Skeleton className="h-[300px] rounded-2xl" />
      </div>

      <Skeleton className="mt-8 h-6 w-40" />
      <div className="mt-4 space-y-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-[74px] rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
