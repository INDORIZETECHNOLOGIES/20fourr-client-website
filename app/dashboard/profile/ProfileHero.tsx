"use client";

import type { ReactNode } from "react";
import {
  BriefcaseIcon,
  CalendarIcon,
  CameraIcon,
  CheckCircleFill,
  PinFill,
} from "@/components/dashboard/icons";
import { useSession } from "@/components/session/SessionProvider";

/**
 * The app's gradient header: warm gold falling off into blue, with the identity
 * block centred over it.
 *
 * A client component because the identity comes from the session — it is spread
 * across the User document (name, email, phone, avatar) and the ClientProfile
 * (city, booking count), which SessionProvider has already merged.
 */
export function ProfileHero() {
  const { profile, loading } = useSession();

  return (
    <div
      className="relative overflow-hidden rounded-2xl px-6 pb-8 pt-9 text-center sm:px-8"
      style={{
        backgroundColor: "#1b3f86",
        backgroundImage: [
          "radial-gradient(circle at 6% 8%, rgba(232,160,32,0.95) 0%, rgba(232,160,32,0) 46%)",
          "radial-gradient(circle at 82% 34%, rgba(59,130,246,0.7) 0%, rgba(59,130,246,0) 55%)",
          "radial-gradient(circle at 62% 108%, rgba(8,18,48,0.92) 0%, rgba(8,18,48,0) 62%)",
          "linear-gradient(118deg, #b9821f 0%, #2c5cb6 44%, #16357a 100%)",
        ].join(", "),
      }}
    >
      <div className="relative mx-auto mb-4 h-[112px] w-[112px]">
        <div className="h-full w-full rounded-full bg-gradient-to-br from-app-gold to-app-info p-[3px]">
          <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-app-card text-[38px] font-extrabold text-app-gold">
            {profile?.avatarUrl ? (
              // A presigned S3 URL that rotates, so next/image's optimiser would
              // cache a link that stops resolving. Plain <img> is correct here.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatarUrl}
                alt={profile.fullName}
                className="h-full w-full object-cover"
              />
            ) : (
              (profile?.initial ?? "·")
            )}
          </div>
        </div>

        <button
          type="button"
          aria-label="Change profile photo"
          className="absolute bottom-0.5 right-0.5 flex h-9 w-9 items-center justify-center rounded-full border-[3px] border-[#16357a] bg-app-gold-gradient text-black transition-transform hover:scale-105"
        >
          <CameraIcon size={16} />
        </button>
      </div>

      <h2 className="font-display text-[26px] font-extrabold tracking-[-0.4px] text-white">
        {profile?.fullName || (loading ? "…" : "Your account")}
      </h2>
      <p className="mt-1.5 break-words text-[15px] text-white/70">{profile?.email ?? ""}</p>
      <p className="text-[15px] text-white/70">{profile?.phone ?? ""}</p>

      {profile?.verified ? (
        <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-green-500/20 px-4 py-2 text-[14px] font-bold text-green-400 ring-1 ring-inset ring-green-400/30">
          <CheckCircleFill size={17} />
          Verified
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap justify-center gap-2.5">
        <Chip icon={<BriefcaseIcon size={15} />}>
          {profile?.totalBookings ?? 0} Bookings
        </Chip>
        {profile?.memberSince ? (
          <Chip icon={<CalendarIcon size={15} />}>Member since {profile.memberSince}</Chip>
        ) : null}
        {/* Only shown once a city is on file — an empty pin chip reads as a bug. */}
        {profile?.city ? <Chip icon={<PinFill size={15} />}>{profile.city}</Chip> : null}
      </div>
    </div>
  );
}

function Chip({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3.5 py-2 text-[13.5px] font-semibold text-white ring-1 ring-inset ring-white/15">
      {icon}
      {children}
    </span>
  );
}
