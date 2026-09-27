import { ImageResponse } from "next/og";
import { LOGO_DATA_URI } from "./og/logo";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
        }}
      >
        <img src={LOGO_DATA_URI} width={140} height={140} alt="" />
      </div>
    ),
    size
  );
}
