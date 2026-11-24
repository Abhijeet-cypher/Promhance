import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/admin";
import { getEntitlements } from "@/lib/entitlements";
import { getUsage } from "@/lib/quota";
import { parseAnonId, resolveUserId } from "@/lib/supabase/identity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/usage?anon_id=<uuid>
 *
 * What the caller's plan allows and how much of it is used this period, so the
 * UI can lock/unlock Deep Research and show "n left". Display only: every
 * limit is enforced again server-side on the action itself.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const anonId = parseAnonId(searchParams.get("anon_id"));
  const userId = await resolveUserId();

  const [ent, admin] = await Promise.all([getEntitlements(userId), getAdmin()]);
  const used = await getUsage(userId, anonId, ent);

  const researchLimit = ent.limits.researchPerMonth;
  return NextResponse.json(
    {
      tier: ent.tier,
      signedIn: Boolean(userId),
      resetsAt: ent.resetsAt,
      research: {
        // Open to every tier (beta); a tier with a 0 limit would be locked.
        allowed: admin.admin || researchLimit > 0,
        unlimited: admin.admin,
        limit: researchLimit,
        used: used.research,
      },
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
