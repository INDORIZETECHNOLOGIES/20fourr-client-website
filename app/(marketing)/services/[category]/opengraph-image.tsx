import { marketingOgImage } from "@/lib/marketing-og";
import { SERVICE_CATALOGUE, serviceById } from "@/lib/services";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "20fourr service category";

export function generateStaticParams() {
  return SERVICE_CATALOGUE.map((s) => ({ category: s.id }));
}

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const svc = serviceById(category);
  return marketingOgImage(
    svc?.name ?? "Service",
    svc?.desc ?? "PSARA-checked. OTP-gated. GST invoice per shift.",
  );
}
