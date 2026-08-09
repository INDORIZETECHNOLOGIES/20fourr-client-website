import { SessionProvider } from "@/components/session/SessionProvider";
import { BookingProvider } from "./BookingContext";
import { BookingShell } from "./BookingShell";

export default function BookLayout({ children }: LayoutProps<"/book">) {
  return (
    <SessionProvider>
      <BookingProvider>
        <BookingShell>{children}</BookingShell>
      </BookingProvider>
    </SessionProvider>
  );
}
