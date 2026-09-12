import { marketingOgImage } from "@/lib/marketing-og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "20fourr pricing — itemized GST quotes";

export default function OpenGraphImage() {
  return marketingOgImage(
    "What a booking actually costs.",
    "Itemized lines. GST split. Cancellation published.",
  );
}
