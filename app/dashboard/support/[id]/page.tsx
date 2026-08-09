import type { Metadata } from "next";
import { TicketThread } from "./TicketThread";

export const metadata: Metadata = { title: "Ticket" };

/**
 * A shell. The thread is fetched client-side so replying and closing can
 * re-read the ticket without a full navigation — and because ticket ids are
 * per-user Mongo ids, there is no path set to prerender.
 */
export default async function TicketPage({
  params,
}: PageProps<"/dashboard/support/[id]">) {
  const { id } = await params;
  return <TicketThread id={id} />;
}
