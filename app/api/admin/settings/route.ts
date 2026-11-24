import { NextResponse } from "next/server";
import { adminOrError } from "@/lib/admin";
import { getQuotaSetting, setQuotaEnforced } from "@/lib/app-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/admin/settings — current feature switches. */
export async function GET() {
  const guard = await adminOrError();
  if (!guard.ok) return guard.response;

  return NextResponse.json({ quotaEnforcement: await getQuotaSetting() });
}

/** PUT /api/admin/settings — body: { quotaEnforcement: boolean }. */
export async function PUT(req: Request) {
  const guard = await adminOrError();
  if (!guard.ok) return guard.response;

  const body = await req.json().catch(() => null);
  if (typeof body?.quotaEnforcement !== "boolean") {
    return NextResponse.json({ error: "quotaEnforcement must be a boolean." }, { status: 400 });
  }

  const error = await setQuotaEnforced(body.quotaEnforcement, guard.email);
  if (error) return NextResponse.json({ error }, { status: 500 });

  return NextResponse.json({ quotaEnforcement: await getQuotaSetting() });
}
