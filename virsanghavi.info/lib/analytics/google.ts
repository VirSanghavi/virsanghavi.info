import "server-only";
import { createSign } from "node:crypto";
import { COLUMNS, type Row } from "./policy";

/**
 * The smallest possible Google Sheets client: a service-account JWT swapped
 * for an access token, and the three calls this site needs (append rows,
 * read a tab, add a tab). No SDK, so the function stays small and cold
 * starts stay short.
 *
 * Configuration (Vercel env):
 *   ANALYTICS_SHEET_ID        the spreadsheet in Drive
 *   GOOGLE_SA_EMAIL           service account that the sheet is shared with
 *   GOOGLE_SA_PRIVATE_KEY     its PEM private key (newlines escaped as \n)
 */

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SHEETS = "https://sheets.googleapis.com/v4/spreadsheets";
const SCOPE = "https://www.googleapis.com/auth/spreadsheets";

export type GoogleConfig = { sheetId: string; email: string; privateKey: string };

export function googleConfig(env: Record<string, string | undefined> = process.env): GoogleConfig | null {
  const sheetId = env.ANALYTICS_SHEET_ID;
  const email = env.GOOGLE_SA_EMAIL;
  const privateKey = env.GOOGLE_SA_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!sheetId || !email || !privateKey) return null;
  return { sheetId, email, privateKey };
}

const b64url = (v: string | Buffer) => Buffer.from(v).toString("base64url");

let cachedToken: { value: string; expiresAt: number } | null = null;

/** An access token for the service account, cached until a minute before it expires. */
export async function accessToken(cfg: GoogleConfig, now = Date.now()): Promise<string> {
  if (cachedToken && cachedToken.expiresAt - 60_000 > now) return cachedToken.value;
  const iat = Math.floor(now / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(JSON.stringify({ iss: cfg.email, scope: SCOPE, aud: TOKEN_URL, iat, exp: iat + 3600 }));
  const signature = createSign("RSA-SHA256").update(`${header}.${claims}`).sign(cfg.privateKey);
  const assertion = `${header}.${claims}.${b64url(signature)}`;
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
  });
  if (!res.ok) throw new Error(`Google token request failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
  const body = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: body.access_token, expiresAt: now + body.expires_in * 1000 };
  return cachedToken.value;
}

async function api(cfg: GoogleConfig, path: string, init: RequestInit & { query?: Record<string, string> } = {}): Promise<Response> {
  const token = await accessToken(cfg);
  const url = new URL(`${SHEETS}/${cfg.sheetId}${path}`);
  for (const [k, v] of Object.entries(init.query ?? {})) url.searchParams.set(k, v);
  return fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
}

/** A1 range for a whole tab; tab names with a dash need quoting. */
const tabRange = (tab: string, cells = "A:L") => `'${tab}'!${cells}`;

/** Tabs that exist right now. */
export async function listTabs(cfg: GoogleConfig): Promise<string[]> {
  const res = await api(cfg, "", { query: { fields: "sheets.properties.title" } });
  if (!res.ok) throw new Error(`Sheets metadata failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
  const body = (await res.json()) as { sheets?: { properties?: { title?: string } }[] };
  return (body.sheets ?? []).map((s) => s.properties?.title ?? "").filter(Boolean);
}

/** Create a month tab with the header row, if it is not there already. */
export async function ensureTab(cfg: GoogleConfig, tab: string): Promise<void> {
  const tabs = await listTabs(cfg);
  if (tabs.includes(tab)) return;
  const add = await api(cfg, ":batchUpdate", {
    method: "POST",
    body: JSON.stringify({ requests: [{ addSheet: { properties: { title: tab, gridProperties: { frozenRowCount: 1 } } } }] }),
  });
  // Another instance may have created it between the list and the add: that is fine.
  if (!add.ok && add.status !== 400) throw new Error(`Add tab failed (${add.status}): ${(await add.text()).slice(0, 200)}`);
  const header = await api(cfg, `/values/${encodeURIComponent(tabRange(tab, "A1:L1"))}`, {
    method: "PUT",
    query: { valueInputOption: "RAW" },
    body: JSON.stringify({ values: [[...COLUMNS]] }),
  });
  if (!header.ok) throw new Error(`Header write failed (${header.status}): ${(await header.text()).slice(0, 200)}`);
}

/** Append rows to a month tab. Creates the tab on a 400 (tab missing) and retries once. */
export async function appendRows(cfg: GoogleConfig, tab: string, rows: Row[]): Promise<void> {
  if (!rows.length) return;
  const values = rows.map((r) => COLUMNS.map((c) => r[c] ?? ""));
  const send = () =>
    api(cfg, `/values/${encodeURIComponent(tabRange(tab))}:append`, {
      method: "POST",
      query: { valueInputOption: "RAW", insertDataOption: "INSERT_ROWS" },
      body: JSON.stringify({ values }),
    });
  let res = await send();
  if (res.status === 400) {
    await ensureTab(cfg, tab);
    res = await send();
  }
  if (!res.ok) throw new Error(`Append failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
}

/** Every row of a month tab as objects; an absent tab is an empty month. */
export async function readTab(cfg: GoogleConfig, tab: string): Promise<Row[]> {
  const res = await api(cfg, `/values/${encodeURIComponent(tabRange(tab))}`, {
    query: { majorDimension: "ROWS", valueRenderOption: "UNFORMATTED_VALUE" },
  });
  if (res.status === 400) return [];
  if (!res.ok) throw new Error(`Read failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
  const body = (await res.json()) as { values?: unknown[][] };
  const values = body.values ?? [];
  const rows: Row[] = [];
  for (const line of values.slice(1)) {
    if (!Array.isArray(line)) continue;
    const row = {} as Row;
    COLUMNS.forEach((c, i) => {
      const v = line[i];
      row[c] = v === undefined || v === null ? "" : String(v);
    });
    if (row.ts) rows.push(row);
  }
  return rows;
}
