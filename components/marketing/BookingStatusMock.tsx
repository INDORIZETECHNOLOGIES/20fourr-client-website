import { productSurface, type ProductSurface } from "@/components/marketing/product-surface";

const ROWS = [
  { dt: "Start OTP", dd: "Pending on site" },
  { dt: "End OTP", dd: "After duty starts" },
  { dt: "Timestamp", dd: "Recorded, not self-reported" },
] as const;

/** Same booking-status chrome as the product Track frame. Visual tone only. */
export function BookingStatusMock({
  surface = "paper",
  framed = false,
}: {
  surface?: ProductSurface;
  framed?: boolean;
}) {
  const t = productSurface[surface];

  const body = (
    <dl className="flex flex-col gap-3">
      {ROWS.map((row, i) => (
        <div
          key={row.dt}
          className={[
            "flex items-baseline justify-between gap-3",
            i < ROWS.length - 1 ? `${t.row} pb-3` : "",
          ].join(" ")}
        >
          <dt className={t.sm}>{row.dt}</dt>
          <dd className={t.monoMid}>{row.dd}</dd>
        </div>
      ))}
    </dl>
  );

  if (!framed) return body;

  return (
    <article className={`flex flex-col ${t.shell}`}>
      <header className={t.header}>
        <h3 className={t.title}>Track</h3>
        <p className={t.caption}>Duty starts and ends with an OTP shown in person.</p>
      </header>
      <div className={t.well}>{body}</div>
    </article>
  );
}
