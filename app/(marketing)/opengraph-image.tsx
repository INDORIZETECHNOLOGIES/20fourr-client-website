import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "20fourr — licensed guards, documented shifts";

export default function OpenGraphImage() {
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
          <div style={{ display: "flex", fontSize: 64, fontWeight: 600, lineHeight: 1.05, letterSpacing: "-0.03em" }}>
            Licensed guards. Documented shifts.
          </div>
          <div style={{ fontSize: 28, color: "#5C5852", maxWidth: 760 }}>
            PSARA-checked providers. OTP-gated duty. GST invoice per shift.
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
