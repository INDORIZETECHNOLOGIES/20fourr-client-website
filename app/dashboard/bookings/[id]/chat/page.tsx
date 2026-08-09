import type { Metadata } from "next";
import { ChatThread } from "./ChatThread";

export const metadata: Metadata = { title: "Chat" };

export default async function ChatPage({
  params,
}: PageProps<"/dashboard/bookings/[id]/chat">) {
  const { id } = await params;
  return <ChatThread bookingId={id} />;
}
