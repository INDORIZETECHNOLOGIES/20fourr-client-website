import type { Metadata } from "next";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { getSiteContacts } from "@/lib/marketing-data";

export const metadata: Metadata = {
  title: {
    default: "20fourr — licensed guards, documented shifts",
    template: "%s · 20fourr",
  },
};

export default async function MarketingLayout({ children }: LayoutProps<"/">) {
  const contacts = await getSiteContacts();

  return (
    <div data-theme="paper" className="min-h-screen bg-paper text-ink">
      <MarketingNav />
      {children}
      <MarketingFooter contacts={contacts} />
    </div>
  );
}
