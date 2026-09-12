import { marketingOgImage } from "@/lib/marketing-og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "20fourr coverage — verified providers by city";

export default function OpenGraphImage() {
  return marketingOgImage(
    "Verified supply, by city.",
    "Not a map. Counts from the public provider index.",
  );
}
