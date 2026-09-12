import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };

export function marketingOgImage(title: string, sub: string) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#FBFAF8",
          color: "#12100E",
          padding: "72px",
          fontFamily: "IBM Plex Sans, Helvetica, sans-serif",
        }}
      >
        <div style={{ fontSize: 22, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          20fourr
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              display: "flex",
              fontSize: 56,
              fontWeight: 600,
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              maxWidth: 980,
            }}
          >
            {title}
          </div>
          <div style={{ fontSize: 26, color: "#5C5852", maxWidth: 760 }}>
            {sub}
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE },
  );
}
