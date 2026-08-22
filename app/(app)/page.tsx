import { DashboardView } from "@/components/dashboard/dashboard-view";
import { getCurrentProfile } from "@/lib/auth";
import { listDashboardEvents, listOperators } from "@/lib/events";

export default async function HomePage() {
  const [profile, events, operators] = await Promise.all([
    getCurrentProfile(),
    listDashboardEvents(),
    listOperators(),
  ]);

  const canWrite = profile?.role === "admin" || profile?.role === "operador";

  return (
    <DashboardView
      events={events}
      operators={operators}
      canWrite={canWrite}
    />
  );
}
