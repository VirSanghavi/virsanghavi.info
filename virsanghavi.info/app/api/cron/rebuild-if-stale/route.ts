import { site, xHandleOn } from "@/lib/site";

/**
 * Daily Vercel cron (see `vercel.json`).
 *
 * Some values on this site depend on the calendar, and the site is
 * prerendered, so a build can go stale without a commit: the X handle moves
 * on `X_HANDLE_SWITCH_DATE`. Each day this compares what the live build baked
 * in against what today's answer is, and fires the project's deploy hook once
 * they differ. After the redeploy they match again, so it fires at most once
 * per change.
 *
 * Vercel sends `Authorization: Bearer <CRON_SECRET>` with cron invocations;
 * anything else gets a 401.
 */

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const today = new Date();
  const built = site.xHandle;
  const wanted = xHandleOn(today);
  const stale = built !== wanted;

  if (!stale) {
    return Response.json({ stale: false, xHandle: built, checkedAt: today.toISOString() });
  }

  const hook = process.env.DEPLOY_HOOK_URL;
  if (!hook) {
    return Response.json(
      { stale: true, redeployed: false, error: "DEPLOY_HOOK_URL is not set", built, wanted },
      { status: 500 },
    );
  }

  const response = await fetch(hook, { method: "POST" });
  const body = await response.text().catch(() => "");
  return Response.json(
    { stale: true, redeployed: response.ok, built, wanted, hookStatus: response.status, hook: body.slice(0, 200) },
    { status: response.ok ? 200 : 502 },
  );
}
