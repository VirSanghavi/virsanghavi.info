import type { Metadata } from "next";
import Link from "next/link";
import { isAdmin } from "@/lib/admin/auth";
import { loadOverview } from "@/lib/analytics/read";
import type { Range } from "@/lib/analytics/aggregate";
import { Dashboard } from "./dashboard";
import { LoginForm } from "./login-form";
import { logout } from "./actions";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

const RANGES = [
  ["24h", 1, "24 hours"],
  ["7d", 7, "7 days"],
  ["30d", 30, "30 days"],
  ["90d", 90, "90 days"],
] as const;
type RangeKey = (typeof RANGES)[number][0];

type Props = { searchParams: Promise<{ range?: string | string[] }> };

export default async function AdminPage({ searchParams }: Props) {
  const authed = await isAdmin();

  if (!authed) {
    return (
      <main>
        <section>
          <article className="article admin">
            <h1>Admin</h1>
            <p className="admin-lede">This page is for the site owner.</p>
            <LoginForm />
          </article>
        </section>
      </main>
    );
  }

  const q = await searchParams;
  const requested = Array.isArray(q.range) ? q.range[0] : q.range;
  const picked = RANGES.find(([key]) => key === requested) ?? RANGES[1];
  const to = new Date();
  const range: Range = { from: new Date(to.getTime() - picked[1] * 86_400_000), to };
  const loaded = await loadOverview(range, to).catch((error: unknown) => ({ error: error instanceof Error ? error.message : String(error) }));

  return (
    <main>
      <section>
        <article className="article admin">
          <div className="admin-head">
            <h1>Analytics</h1>
            <form action={logout}>
              <button type="submit" className="admin-link-btn">
                Sign out
              </button>
            </form>
          </div>
          <nav className="admin-ranges" aria-label="Date range">
            {RANGES.map(([key, , label]) => (
              <Link key={key} href={`/admin?range=${key}`} aria-current={key === picked[0] ? "page" : undefined} className={key === picked[0] ? "active" : undefined}>
                {label}
              </Link>
            ))}
          </nav>
          {"error" in loaded ? (
            <p className="admin-error" role="alert">
              The analytics sheet could not be read: {loaded.error}
            </p>
          ) : (
            <Dashboard data={loaded.overview} configured={loaded.configured} rangeKey={picked[0] as RangeKey} />
          )}
        </article>
      </section>
    </main>
  );
}
