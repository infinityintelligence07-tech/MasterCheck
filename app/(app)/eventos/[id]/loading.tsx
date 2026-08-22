import { Skeleton } from "@/components/ui/skeleton";

export default function EventDetailLoading() {
  return (
    <div className="space-y-6" aria-busy aria-label="Carregando evento">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-7 w-64 max-w-full" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-16 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Skeleton className="h-44 rounded-lg lg:col-span-1" />
            <Skeleton className="h-44 rounded-lg lg:col-span-2" />
          </div>
          <Skeleton className="h-96 w-full rounded-lg" />
        </div>
        <Skeleton className="hidden h-72 rounded-lg xl:block" />
      </div>
    </div>
  );
}
