"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  BriefcaseIcon,
  CalendarIcon,
  CameraIcon,
  CheckCircleFill,
  PinFill,
} from "@/components/dashboard/icons";
import { useSession } from "@/components/session/SessionProvider";
import { useApiQuery } from "@/hooks/useApiQuery";
import type { BookingListResponse } from "@/lib/api/types";

export function ProfileHero() {
  const { profile, loading } = useSession();
  const [photoFailed, setPhotoFailed] = useState(false);
  const { data: bookings } = useApiQuery<BookingListResponse>("client/bookings", {
    query: { limit: 1 },
  });

  useEffect(() => {
    setPhotoFailed(false);
  }, [profile?.avatarUrl]);

  const bookingCount = bookings?.pagination?.total ?? profile?.totalBookings ?? 0;
  const showPhoto = Boolean(profile?.avatarUrl) && !photoFailed;

  return (
    <div className="rounded-lg border border-hairline bg-panel px-6 py-8 text-center sm:px-8">
      <div className="relative mx-auto mb-4 h-24 w-24">
        <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full border border-hairline bg-panel-raised text-h2 text-fg">
          {showPhoto ? (
            // A presigned S3 URL that rotates, so next/image's optimiser would
            // cache a link that stops resolving. Plain <img> is correct here.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile!.avatarUrl!}
              alt=""
              onError={() => setPhotoFailed(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            (profile?.initial ?? "·")
          )}
        </div>
        <Link
          href="/dashboard/profile/edit"
          aria-label="Change profile photo"
          className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border border-hairline bg-panel text-fg"
        >
          <CameraIcon size={16} />
        </Link>
      </div>

      <h2 className="text-h2 text-fg">
        {profile?.fullName || (loading ? "…" : "Your account")}
      </h2>
      <p className="mt-1.5 break-words text-body text-fg-mid">{profile?.email ?? ""}</p>
      <p className="text-body text-fg-mid">{profile?.phone ?? ""}</p>

      {profile?.verified ? (
        <p className="mt-4 inline-flex items-center gap-2 rounded-sm border border-live px-3 py-1.5 text-body-sm text-live">
          <CheckCircleFill size={16} />
          Verified
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Chip icon={<BriefcaseIcon size={15} />}>{bookingCount} bookings</Chip>
        {profile?.memberSince ? (
          <Chip icon={<CalendarIcon size={15} />}>Member since {profile.memberSince}</Chip>
        ) : null}
        {profile?.city ? <Chip icon={<PinFill size={15} />}>{profile.city}</Chip> : null}
      </div>
    </div>
  );
}

function Chip({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-sm border border-hairline px-3 py-2 text-body-sm text-fg">
      {icon}
      {children}
    </span>
  );
}
