import { marketingOgImage } from "@/lib/marketing-og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "20fourr for business — documented shifts";

export default function OpenGraphImage() {
  return marketingOgImage(
    "Security a procurement team can audit.",
    "Venues, events, offices, facilities, RWAs.",
  );
}
