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
  /** Arms licence is checked before a booking in this category is accepted. */
  licenceRequired: boolean;
};

export const SERVICE_CATALOGUE: ServiceDefinition[] = [
  {
    id: "guard",
    name: "Security guard",
    desc: "Trained personnel for premises and perimeter",
    icon: "shield",
    licenceRequired: false,
  },
  {
    id: "bouncer",
    name: "Bouncer",
    desc: "Crowd control and access for events, clubs and venues",
    icon: "crowd",
    licenceRequired: false,
  },
  {
    id: "gunman",
    name: "Gunman",
    desc: "Armed personnel for high-risk sites. Arms licence verified before the booking is accepted.",
    icon: "pistol",
    licenceRequired: true,
  },
  {
    id: "pso",
    name: "PSO",
    desc: "Close protection for individuals. Arms licence verified before the booking is accepted.",
    icon: "guard",
    licenceRequired: true,
  },
];

/**
 * The ex-serviceman filter, presented alongside the categories because that is
 * how the client app's home screen presents it — as a fifth tile — even though
 * it resolves to a query flag rather than a category.
 */
export const EX_SERVICEMAN_FILTER = {
  name: "Ex-serviceman",
  desc: "A filter, not a category: any of the four services, restricted to providers with a verified ex-serviceman certificate",
  icon: "medal" as ServiceIcon,
  licenceRequired: false,
};

export function serviceById(id: string): ServiceDefinition | undefined {
  return SERVICE_CATALOGUE.find((s) => s.id === id);
}

export function isServiceCategory(value: string): value is ServiceCategory {
  return SERVICE_CATALOGUE.some((s) => s.id === value);
}
