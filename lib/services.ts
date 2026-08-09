/**
 * The service catalogue — the API's real categories, not an invented list.
 *
 * THIS REPLACED EIGHT MADE-UP SERVICES. The earlier catalogue carried "Event
 * Security", "Personal Guard" and "Corporate Security", which exist nowhere on
 * the server: `serviceCategory` is a four-value enum, and both provider search
 * and booking creation reject anything else. Those cards could be browsed but
 * never booked.
 *
 * **Ex-Serviceman is not a service.** The client app is explicit about it —
 * "Ex-Serviceman is NOT a bookable service category — it's a provider attribute
 * (verified ex-serviceman certificate)". Search takes it as `exServiceman=true`,
 * a flag that combines with any category. It appears here as a filter, never as
 * something you can book on its own.
 *
 * (Providers *can* price ex-serviceman staff — the pricing enum has five values
 * — but a client books one of the four categories and optionally requires the
 * certificate.)
 */

import type { ServiceIcon } from "@/lib/dashboard-data";

/** The four values `category` accepts on search, and `serviceCategory` on a booking. */
export type ServiceCategory = "guard" | "bouncer" | "gunman" | "pso";

export type ServiceDefinition = {
  id: ServiceCategory;
  name: string;
  desc: string;
  icon: ServiceIcon;
  /** Tailwind text-color class for the glyph, and the tinted tile behind it. */
  color: string;
  iconBg: string;
  /** Border tint used on hover. */
  hover: string;
};

export const SERVICE_CATALOGUE: ServiceDefinition[] = [
  {
    id: "guard",
    name: "Security Guard",
    desc: "Professional trained security personnel for premises and perimeter protection",
    icon: "shield",
    color: "text-app-gold",
    iconBg: "bg-app-gold/12",
    hover: "hover:border-app-gold/20",
  },
  {
    id: "bouncer",
    name: "Bouncer",
    desc: "Crowd control and access management for events, clubs and venues",
    icon: "crowd",
    color: "text-app-info",
    iconBg: "bg-app-info/12",
    hover: "hover:border-app-info/20",
  },
  {
    id: "gunman",
    name: "Gunman",
    desc: "Licensed armed security personnel for high-risk environments",
    icon: "pistol",
    color: "text-red-500",
    iconBg: "bg-red-500/12",
    hover: "hover:border-red-500/20",
  },
  {
    id: "pso",
    name: "PSO",
    desc: "Personal Security Officer for close protection of individuals and families",
    icon: "guard",
    color: "text-green-500",
    iconBg: "bg-green-500/12",
    hover: "hover:border-green-500/20",
  },
];

/**
 * The ex-serviceman filter, presented alongside the categories because that is
 * how the client app's home screen presents it — as a fifth tile — even though
 * it resolves to a query flag rather than a category.
 */
export const EX_SERVICEMAN_FILTER = {
  name: "Ex-Serviceman",
  desc: "Any category, restricted to providers with a verified ex-serviceman certificate",
  icon: "medal" as ServiceIcon,
  color: "text-violet-400",
  iconBg: "bg-violet-400/12",
  hover: "hover:border-violet-400/20",
};

export function serviceById(id: string): ServiceDefinition | undefined {
  return SERVICE_CATALOGUE.find((s) => s.id === id);
}

export function isServiceCategory(value: string): value is ServiceCategory {
  return SERVICE_CATALOGUE.some((s) => s.id === value);
}
