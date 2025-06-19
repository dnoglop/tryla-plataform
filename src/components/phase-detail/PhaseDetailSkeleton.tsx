
import { Skeleton } from "@/components/ui/skeleton";

export const PhaseDetailSkeleton = () => (
    <div className="min-h-screen bg-background animate-pulse">
        <header className="p-4 sm:p-6">
            <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full bg-muted" />
                <Skeleton className="h-7 w-48 bg-muted" />
            </div>
        </header>
        <main className="container px-4 sm:px-6 lg:px-8 py-6 space-y-6">
            <Skeleton className="h-28 w-full rounded-2xl bg-muted" />
            <Skeleton className="aspect-video w-full rounded-2xl bg-muted" />
        </main>
    </div>
);
