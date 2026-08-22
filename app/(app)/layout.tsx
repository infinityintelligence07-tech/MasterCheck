import { redirect } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { getCurrentProfile } from "@/lib/auth";
import { listEventSearchItems } from "@/lib/events";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [profile, searchEvents] = await Promise.all([
    getCurrentProfile(),
    listEventSearchItems(),
  ]);

  if (!profile) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader profile={profile} searchEvents={searchEvents} />
      <main id="main-content" className="mx-auto max-w-[1400px] px-4 py-4">
        {children}
      </main>
    </div>
  );
}
