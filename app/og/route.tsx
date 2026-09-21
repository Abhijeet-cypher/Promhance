import { ImageResponse } from "next/og";
import { LOGO_DATA_URI } from "./logo";

export const runtime = "nodejs";
export const alt = "Promhance — Your AI Prompt & Productivity Workspace";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0a0a",
          backgroundImage:
            "radial-gradient(circle at 50% 35%, rgba(59,130,246,0.22), transparent 60%)",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 40,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO_DATA_URI} width={150} height={150} alt="" />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                fontSize: 104,
                fontWeight: 700,
                letterSpacing: -2.6,
                lineHeight: 1,
              }}
            >
              <span style={{ color: "#ffffff" }}>Prom</span>
              <span style={{ color: "#60a5fa" }}>hance</span>
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 18,
                fontSize: 38,
                color: "#a1a1a1",
              }}
            >
              Your AI Prompt &amp; Productivity Workspace
            </div>
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 56,
            display: "flex",
            fontSize: 30,
            fontWeight: 600,
            color: "#60a5fa",
          }}
        >
          www.promhance.com
        </div>
      </div>
    ),
    size
  );
}
