import type { Metadata } from "next";
import { RecurringList } from "./RecurringList";

export const metadata: Metadata = { title: "Recurring Bookings" };

export default function RecurringPage() {
  return <RecurringList />;
}
