import type { Metadata } from "next";
import { SubPage } from "@/components/dashboard/SubPage";
import { NotificationList } from "./NotificationList";

export const metadata: Metadata = { title: "Notifications" };

export default function NotificationsPage() {
  return (
    <SubPage
      title="Notifications"
      subtitle="Booking updates, payments and safety alerts."
      backHref="/dashboard"
      backLabel="Dashboard"
    >
      <NotificationList />
    </SubPage>
  );
}
