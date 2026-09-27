"use client";

import { useCallback, useEffect, useState } from "react";
import { RANKS } from "@/lib/ranks";
import { AccountApiError, useAccountApi } from "../api";
import { useSession } from "../session";
import { SectionSkeleton, StateError } from "../ui";

/**
 * Owner / staff console: dashboard numbers, user search with rank grants,
 * blocking, XP and tier changes, rank permissions, XP rules, tier benefits
 * and prices, Platinum organizations and the audit log. Every rule is
 * enforced by /account/api/admin/*; this UI only hides what cannot work.
 */

type Tab = "overview" | "users" | "ranks" | "xp" | "tiers" | "orgs" | "audit";

const TABS: [Tab, string][] = [
  ["overview", "Přehled"],
  ["users", "Uživatelé"],
  ["ranks", "Ranky a práva"],
  ["xp", "XP pravidla"],
  ["tiers", "Tarify a ceny"],
  ["orgs", "Organizace"],
  ["audit", "Audit"],
];

type Actor = { is_owner: boolean; is_admin: boolean; ranks: string[] };

type Overview = {
  actor: Actor;
  users_total: number;
  users_new_7d: number;
  users_blocked: number;
  subscriptions_active: number;
  organizations_active: number;
  xp_24h: number;
  xp_7d: number;
  paid_users_by_tier: Record<string, number>;
};

type ConsoleUser = {
  id: string;
  email: string | null;
  nickname: string | null;
  full_name: string | null;
  status: string;
  tier: string;
  tier_expires: string | null;
  level: number;
  xp: number;
  created_at: string;
  ranks: string[];
  effective_tier?: string;
};

type UserDetail = {
  user: ConsoleUser;
  grants: { rank_key: string; granted_at: string; expires_at: string | null; revoked_at: string | null }[];
  ledger: { source: string; ref_key: string; base_amount: number; bonus_amount: number; created_at: string }[];
};

type Config = {
  ranks: { key: string; kind: string; min_level: number | null; priority: number; color: string | null; permissions: string[] }[];
  xp_rules: { source: string; amount: number | null; max_amount: number | null; daily_cap: number | null; bonus_applies: boolean; active: boolean }[];
  tiers: { key: string; xp_bonus_pct: number; ai_daily_limit: number | null; store_discount_pct: number; is_public: boolean }[];
  prices: { tier: string; billing_cycle: string; price_czk: number }[];
  stripe_catalog: { tier: string; billing_cycle: string; amount_minor: number; active: boolean }[];
};

type Org = {
  id: string;
  name: string;
  kind: string;
  ico: string | null;
  contract_end: string | null;
  seat_limit: number | null;
  modules: string[];
  status: string;
  members: { user_id: string; role: string; nickname: string | null; email: string | null }[];
};

type AuditEntry = { id: number; action: string; actor: string | null; target: string | null; detail: Record<string, unknown>; created_at: string };

const GRANTABLE_RANKS = ["betatester", "partner", "moderator", "admin", "owner"];

function fmtDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("cs-CZ", { dateStyle: "short", timeStyle: "short" });
}

function RankChip({ rank }: { rank: string }) {
  return (
    <span className="rank-chip" style={{ "--rank-color": RANKS[rank]?.color ?? "#9aa4b2" } as React.CSSProperties}>
      {rank}
    </span>
  );
}

function useConsoleAction() {
  const run = useAccountApi();
  const { showToast } = useSession();
  return useCallback(
    async (path: string, body: Record<string, unknown>, success = "Uloženo.") => {
      try {
        const result = await run<Record<string, unknown>>(path, { method: "POST", body });
        showToast(typeof result.note === "string" ? `${success} ${result.note}` : success);
        return true;
      } catch (error) {
        showToast(error instanceof AccountApiError && error.message ? error.message : "Akce se nezdařila.", "error");
        return false;
      }
    },
    [run, showToast],
  );
}

function useLoad<T>(path: string) {
  const run = useAccountApi();
  const [data, setData] = useState<T | null>(null);
  const [failed, setFailed] = useState(false);
  const load = useCallback(() => {
    run<T>(path).then(
      (result) => {
        setData(result);
        setFailed(false);
      },
      () => setFailed(true),
    );
  }, [run, path]);
  useEffect(() => {
    load();
  }, [load]);
  return { data, failed, load };
}

/* ── Přehled ─────────────────────────────────────────────────────────── */

function OverviewTab({ data }: { data: Overview }) {
  const stats: [string, string][] = [
    ["Uživatelé", data.users_total.toLocaleString("cs-CZ")],
    ["Noví za 7 dní", data.users_new_7d.toLocaleString("cs-CZ")],
    ["Zablokovaní", data.users_blocked.toLocaleString("cs-CZ")],
    ["Aktivní předplatná", data.subscriptions_active.toLocaleString("cs-CZ")],
    ["Organizace", data.organizations_active.toLocaleString("cs-CZ")],
    ["XP za 24 h", data.xp_24h.toLocaleString("cs-CZ")],
    ["XP za 7 dní", data.xp_7d.toLocaleString("cs-CZ")],
  ];
  const tiers = Object.entries(data.paid_users_by_tier);
  return (
    <>
      <div className="admin-stats">
        {stats.map(([label, value]) => (
          <div key={label} className="admin-stat">
            <span className="metric-label">{label}</span>
            <strong className="metric-value">{value}</strong>
          </div>
        ))}
      </div>
      <p className="overview-detail">
        Placené tarify: {tiers.length ? tiers.map(([tier, n]) => `${tier} ${n}`).join(", ") : "zatím nikdo"}.
        {" "}Vaše ranky: {data.actor.ranks.join(", ")}.
      </p>
    </>
  );
}

/* ── Uživatelé ───────────────────────────────────────────────────────── */

function UserDetailPanel({ id, actor, onChanged }: { id: string; actor: Actor; onChanged: () => void }) {
  const { data, failed, load } = useLoad<UserDetail>(`admin/users.php?id=${encodeURIComponent(id)}`);
  const act = useConsoleAction();
  const [rank, setRank] = useState("betatester");
  const [rankExpires, setRankExpires] = useState("");
  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState("");
  const [tier, setTier] = useState("gold");
  const [tierExpires, setTierExpires] = useState("");

  if (failed) return <StateError message="Uživatele se nepodařilo načíst." onRetry={load} retryLabel="Zkusit znovu" />;
  if (!data) return <SectionSkeleton lines={3} />;
  const u = data.user;

  async function run(body: Record<string, unknown>, message?: string) {
    if (await act("admin/user-action.php", { user_id: id, ...body }, message)) {
      load();
      onChanged();
    }
  }

  const canGrant = (key: string) => (key === "owner" || key === "admin" ? actor.is_owner : actor.is_admin);

  return (
    <div className="admin-detail">
      <div className="admin-detail__head">
        <div>
          <strong>{u.nickname ?? "(bez přezdívky)"}</strong> · {u.full_name ?? "—"}
          <div className="metric-label">{u.email ?? "bez e-mailu"} · {u.id}</div>
        </div>
        <div className="rank-chips">{u.ranks.map((r) => <RankChip key={r} rank={r} />)}</div>
      </div>
      <p className="overview-detail">
        Stav <b>{u.status}</b> · level {u.level} · {u.xp.toLocaleString("cs-CZ")} XP · tarif {u.effective_tier ?? u.tier}
        {u.tier_expires ? ` do ${fmtDate(u.tier_expires)}` : ""} · registrace {fmtDate(u.created_at)}
      </p>

      <div className="admin-actions">
        <fieldset>
          <legend>Ranky</legend>
          <select className="input" value={rank} onChange={(e) => setRank(e.target.value)}>
            {GRANTABLE_RANKS.filter(canGrant).map((key) => <option key={key} value={key}>{key}</option>)}
          </select>
          <input className="input" type="date" value={rankExpires} onChange={(e) => setRankExpires(e.target.value)} aria-label="Platnost do (volitelné)" />
          <button className="btn btn--primary btn--sm" type="button" disabled={!canGrant(rank)}
            onClick={() => run({ action: "grant_rank", rank_key: rank, expires_at: rankExpires || null }, "Rank přidělen.")}>
            Přidělit
          </button>
          <button className="btn btn--ghost btn--sm" type="button" disabled={!canGrant(rank) || !u.ranks.includes(rank)}
            onClick={() => run({ action: "revoke_rank", rank_key: rank }, "Rank odebrán.")}>
            Odebrat
          </button>
        </fieldset>

        {actor.is_admin && (
          <fieldset>
            <legend>XP</legend>
            <input className="input" type="number" placeholder="+500 nebo -200" value={delta} onChange={(e) => setDelta(e.target.value)} />
            <input className="input" type="text" placeholder="Důvod" maxLength={200} value={reason} onChange={(e) => setReason(e.target.value)} />
            <button className="btn btn--primary btn--sm" type="button" disabled={!delta}
              onClick={() => run({ action: "adjust_xp", delta: Number(delta), reason }, "XP upraveno.").then(() => setDelta(""))}>
              Upravit XP
            </button>
          </fieldset>
        )}

        {actor.is_admin && (
          <fieldset>
            <legend>Tarif (ručně, bez platby)</legend>
            <select className="input" value={tier} onChange={(e) => setTier(e.target.value)}>
              {["free", "bronze", "silver", "gold"].map((key) => <option key={key} value={key}>{key}</option>)}
            </select>
            {tier !== "free" && (
              <input className="input" type="date" value={tierExpires} onChange={(e) => setTierExpires(e.target.value)} aria-label="Platnost do" />
            )}
            <button className="btn btn--primary btn--sm" type="button"
              onClick={() => run({ action: "set_tier", tier, expires_at: tierExpires || null }, "Tarif nastaven.")}>
              Nastavit
            </button>
          </fieldset>
        )}

        <fieldset>
          <legend>Účet</legend>
          {u.status === "blocked" ? (
            <button className="btn btn--primary btn--sm" type="button" onClick={() => run({ action: "set_status", status: "active" }, "Účet odblokován.")}>
              Odblokovat
            </button>
          ) : (
            <button className="btn btn--warn btn--sm" type="button"
              onClick={() => window.confirm(`Zablokovat ${u.nickname ?? u.id}? Odhlásí se ze všech zařízení.`) && run({ action: "set_status", status: "blocked" }, "Účet zablokován.")}>
              Zablokovat
            </button>
          )}
          <button className="btn btn--ghost btn--sm" type="button" onClick={() => run({ action: "revoke_sessions" }, "Relace ukončeny.")}>
            Odhlásit všude
          </button>
        </fieldset>
      </div>

      <h3 className="admin-subhead">Poslední XP</h3>
      <table className="admin-table">
        <thead><tr><th>Kdy</th><th>Zdroj</th><th>XP</th><th>Bonus</th></tr></thead>
        <tbody>
          {data.ledger.length === 0 && <tr><td colSpan={4}>Zatím žádné XP.</td></tr>}
          {data.ledger.map((row) => (
            <tr key={`${row.source}-${row.ref_key}`}>
              <td>{fmtDate(row.created_at)}</td><td>{row.source}</td><td>{row.base_amount}</td><td>{row.bonus_amount || ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UsersTab({ actor }: { actor: Actor }) {
  const run = useAccountApi();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<ConsoleUser[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const search = useCallback((q: string) => {
    run<{ users: ConsoleUser[] }>(`admin/users.php?q=${encodeURIComponent(q)}`).then(
      (result) => {
        setUsers(result.users);
        setFailed(false);
      },
      () => setFailed(true),
    );
  }, [run]);

  useEffect(() => {
    search("");
  }, [search]);

  return (
    <>
      <form className="admin-search" onSubmit={(e) => { e.preventDefault(); search(query); }}>
        <input className="input" type="search" placeholder="Přezdívka, e-mail, jméno nebo ID" value={query} onChange={(e) => setQuery(e.target.value)} />
        <button className="btn btn--primary btn--sm" type="submit">Hledat</button>
      </form>
      {failed && <StateError message="Hledání selhalo." onRetry={() => search(query)} retryLabel="Zkusit znovu" />}
      {!users && !failed && <SectionSkeleton lines={3} />}
      {users && (
        <table className="admin-table admin-table--click">
          <thead><tr><th>Uživatel</th><th>Stav</th><th>Level</th><th>Tarif</th><th>Ranky</th></tr></thead>
          <tbody>
            {users.length === 0 && <tr><td colSpan={5}>Nic nenalezeno.</td></tr>}
            {users.map((u) => (
              <tr key={u.id} className={selected === u.id ? "is-selected" : ""} onClick={() => setSelected(selected === u.id ? null : u.id)}>
                <td><strong>{u.nickname ?? "—"}</strong><div className="metric-label">{u.email ?? u.id}</div></td>
                <td>{u.status}</td>
                <td>{u.level} <span className="metric-label">({u.xp} XP)</span></td>
                <td>{u.tier}</td>
                <td><div className="rank-chips">{u.ranks.map((r) => <RankChip key={r} rank={r} />)}</div></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {selected && <UserDetailPanel key={selected} id={selected} actor={actor} onChanged={() => search(query)} />}
    </>
  );
}

/* ── Ranky, XP pravidla, tarify ──────────────────────────────────────── */

function RanksTab({ config, actor, reload }: { config: Config; actor: Actor; reload: () => void }) {
  const act = useConsoleAction();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  return (
    <table className="admin-table">
      <thead><tr><th>Rank</th><th>Druh</th><th>Od levelu</th><th>Práva (oddělená čárkou)</th><th /></tr></thead>
      <tbody>
        {config.ranks.map((rank) => {
          const editable = actor.is_admin && (rank.kind !== "staff" || actor.is_owner);
          const value = drafts[rank.key] ?? rank.permissions.join(", ");
          return (
            <tr key={rank.key}>
              <td><RankChip rank={rank.key} /></td>
              <td>{rank.kind}</td>
              <td>{rank.min_level ?? ""}</td>
              <td>
                <input className="input" value={value} disabled={!editable}
                  onChange={(e) => setDrafts({ ...drafts, [rank.key]: e.target.value })} />
              </td>
              <td>
                <button className="btn btn--ghost btn--sm" type="button" disabled={!editable || drafts[rank.key] === undefined}
                  onClick={async () => {
                    const permissions = value.split(",").map((p) => p.trim()).filter(Boolean);
                    if (await act("admin/config.php", { kind: "rank", key: rank.key, permissions }, "Práva uložena.")) {
                      setDrafts((current) => {
                        const next = { ...current };
                        delete next[rank.key];
                        return next;
                      });
                      reload();
                    }
                  }}>
                  Uložit
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function XpRulesTab({ config, actor, reload }: { config: Config; actor: Actor; reload: () => void }) {
  const act = useConsoleAction();
  return (
    <table className="admin-table">
      <thead><tr><th>Zdroj</th><th>XP</th><th>Denní strop</th><th>Bonus tarifu</th><th>Aktivní</th><th /></tr></thead>
      <tbody>
        {config.xp_rules.map((rule) => (
          <RuleRow key={rule.source} rule={rule} disabled={!actor.is_admin} onSave={async (next) => {
            if (await act("admin/config.php", { kind: "xp_rule", source: rule.source, ...next }, "Pravidlo uloženo.")) reload();
          }} />
        ))}
      </tbody>
    </table>
  );
}

function RuleRow({ rule, disabled, onSave }: {
  rule: Config["xp_rules"][number];
  disabled: boolean;
  onSave: (next: { amount: number | null; daily_cap: number | null; active: boolean }) => void;
}) {
  const [amount, setAmount] = useState(rule.amount === null ? "" : String(rule.amount));
  const [cap, setCap] = useState(rule.daily_cap === null ? "" : String(rule.daily_cap));
  const [active, setActive] = useState(rule.active);
  return (
    <tr>
      <td>{rule.source}</td>
      <td><input className="input input--narrow" type="number" min={1} placeholder="podle akce" value={amount} disabled={disabled} onChange={(e) => setAmount(e.target.value)} /></td>
      <td><input className="input input--narrow" type="number" min={1} placeholder="bez stropu" value={cap} disabled={disabled} onChange={(e) => setCap(e.target.value)} /></td>
      <td>{rule.bonus_applies ? "ano" : "ne"}</td>
      <td><input type="checkbox" checked={active} disabled={disabled} onChange={(e) => setActive(e.target.checked)} /></td>
      <td>
        <button className="btn btn--ghost btn--sm" type="button" disabled={disabled}
          onClick={() => onSave({ amount: amount === "" ? null : Number(amount), daily_cap: cap === "" ? null : Number(cap), active })}>
          Uložit
        </button>
      </td>
    </tr>
  );
}

function TiersTab({ config, actor, reload }: { config: Config; actor: Actor; reload: () => void }) {
  const act = useConsoleAction();
  const price = (tier: string, cycle: string) => config.prices.find((p) => p.tier === tier && p.billing_cycle === cycle)?.price_czk ?? "";
  const inStripe = (tier: string, cycle: string) => config.stripe_catalog.some((c) => c.tier === tier && c.billing_cycle === cycle && c.active);
  return (
    <>
      <table className="admin-table">
        <thead><tr><th>Tarif</th><th>Bonus XP %</th><th>AI denně</th><th>Sleva Store %</th><th>Kč / měsíc</th><th>Kč / rok</th><th /></tr></thead>
        <tbody>
          {config.tiers.map((tier) => (
            <TierRow key={tier.key} tier={tier} monthly={price(tier.key, "monthly")} yearly={price(tier.key, "yearly")}
              stripe={{ monthly: inStripe(tier.key, "monthly"), yearly: inStripe(tier.key, "yearly") }}
              disabled={!actor.is_admin}
              onSave={async (next) => {
                const ok = await act("admin/config.php", { kind: "tier", key: tier.key, ...next.tier }, "Tarif uložen.");
                if (ok && next.monthly !== null) await act("admin/config.php", { kind: "price", tier: tier.key, billing_cycle: "monthly", price_czk: next.monthly }, "Cena uložena.");
                if (ok && next.yearly !== null) await act("admin/config.php", { kind: "price", tier: tier.key, billing_cycle: "yearly", price_czk: next.yearly }, "Cena uložena.");
                reload();
              }} />
          ))}
        </tbody>
      </table>
      <p className="overview-detail">
        Ceny v tabulce se zobrazují na webu. Online platba funguje jen u tarifů označených „Stripe ✓“ (ceny v <code>premium_price_catalog</code>).
      </p>
    </>
  );
}

function TierRow({ tier, monthly, yearly, stripe, disabled, onSave }: {
  tier: Config["tiers"][number];
  monthly: number | string;
  yearly: number | string;
  stripe: { monthly: boolean; yearly: boolean };
  disabled: boolean;
  onSave: (next: {
    tier: { xp_bonus_pct: number; ai_daily_limit: number | null; store_discount_pct: number };
    monthly: number | null;
    yearly: number | null;
  }) => void;
}) {
  const [bonus, setBonus] = useState(String(tier.xp_bonus_pct));
  const [ai, setAi] = useState(tier.ai_daily_limit === null ? "" : String(tier.ai_daily_limit));
  const [discount, setDiscount] = useState(String(tier.store_discount_pct));
  const [m, setM] = useState(String(monthly));
  const [y, setY] = useState(String(yearly));
  const priced = ["bronze", "silver", "gold"].includes(tier.key);
  return (
    <tr>
      <td>{tier.key}{!tier.is_public && <span className="metric-label"> (neveřejný)</span>}</td>
      <td><input className="input input--narrow" type="number" value={bonus} disabled={disabled} onChange={(e) => setBonus(e.target.value)} /></td>
      <td><input className="input input--narrow" type="number" placeholder="bez limitu" value={ai} disabled={disabled} onChange={(e) => setAi(e.target.value)} /></td>
      <td><input className="input input--narrow" type="number" value={discount} disabled={disabled} onChange={(e) => setDiscount(e.target.value)} /></td>
      <td>{priced ? <><input className="input input--narrow" type="number" value={m} disabled={disabled} onChange={(e) => setM(e.target.value)} />{stripe.monthly && <span className="metric-label"> Stripe ✓</span>}</> : "—"}</td>
      <td>{priced ? <><input className="input input--narrow" type="number" value={y} disabled={disabled} onChange={(e) => setY(e.target.value)} />{stripe.yearly && <span className="metric-label"> Stripe ✓</span>}</> : "—"}</td>
      <td>
        <button className="btn btn--ghost btn--sm" type="button" disabled={disabled}
          onClick={() => onSave({
            tier: { xp_bonus_pct: Number(bonus), ai_daily_limit: ai === "" ? null : Number(ai), store_discount_pct: Number(discount) },
            monthly: priced && m !== String(monthly) && m !== "" ? Number(m) : null,
            yearly: priced && y !== String(yearly) && y !== "" ? Number(y) : null,
          })}>
          Uložit
        </button>
      </td>
    </tr>
  );
}

/* ── Organizace ──────────────────────────────────────────────────────── */

function OrgsTab({ actor }: { actor: Actor }) {
  const { data, failed, load } = useLoad<{ organizations: Org[] }>("admin/orgs.php");
  const act = useConsoleAction();
  const [form, setForm] = useState({ name: "", kind: "school", ico: "", seat_limit: "", contract_end: "", modules: "" });
  const [member, setMember] = useState<Record<string, { user: string; role: string }>>({});

  if (failed) return <StateError message="Organizace se nepodařilo načíst." onRetry={load} retryLabel="Zkusit znovu" />;
  if (!data) return <SectionSkeleton lines={3} />;

  async function orgAction(body: Record<string, unknown>, message: string) {
    if (await act("admin/orgs.php", body, message)) load();
  }

  return (
    <>
      {actor.is_admin && (
        <form className="admin-actions" onSubmit={(e) => {
          e.preventDefault();
          void orgAction({
            action: "create", ...form,
            modules: form.modules.split(",").map((m) => m.trim()).filter(Boolean),
          }, "Organizace založena.").then(() => setForm({ name: "", kind: "school", ico: "", seat_limit: "", contract_end: "", modules: "" }));
        }}>
          <fieldset>
            <legend>Nová organizace (Platinum)</legend>
            <input className="input" required minLength={2} placeholder="Název" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <select className="input" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
              <option value="school">škola</option><option value="company">firma</option><option value="other">jiné</option>
            </select>
            <input className="input" placeholder="IČO" value={form.ico} onChange={(e) => setForm({ ...form, ico: e.target.value })} />
            <input className="input input--narrow" type="number" min={1} placeholder="Licencí" value={form.seat_limit} onChange={(e) => setForm({ ...form, seat_limit: e.target.value })} />
            <input className="input" type="date" aria-label="Konec smlouvy" value={form.contract_end} onChange={(e) => setForm({ ...form, contract_end: e.target.value })} />
            <input className="input" placeholder="Moduly: classes, custom_content, reports" value={form.modules} onChange={(e) => setForm({ ...form, modules: e.target.value })} />
            <button className="btn btn--primary btn--sm" type="submit">Založit</button>
          </fieldset>
        </form>
      )}
      {data.organizations.length === 0 && <p className="overview-detail">Zatím žádné organizace.</p>}
      {data.organizations.map((org) => {
        const m = member[org.id] ?? { user: "", role: "member" };
        return (
          <div key={org.id} className="admin-detail">
            <div className="admin-detail__head">
              <div>
                <strong>{org.name}</strong> · {org.kind} · {org.status}
                <div className="metric-label">
                  {org.members.length}{org.seat_limit ? ` / ${org.seat_limit}` : ""} členů · smlouva do {org.contract_end ?? "neurčito"}
                  {org.modules.length ? ` · moduly ${org.modules.join(", ")}` : ""}
                </div>
              </div>
              {actor.is_admin && (
                <select className="input input--narrow" value={org.status} onChange={(e) => orgAction({ action: "set_status", org_id: org.id, status: e.target.value }, "Stav změněn.")}>
                  <option value="active">aktivní</option><option value="suspended">pozastavená</option><option value="ended">ukončená</option>
                </select>
              )}
            </div>
            <table className="admin-table">
              <tbody>
                {org.members.map((mem) => (
                  <tr key={mem.user_id}>
                    <td>{mem.nickname ?? mem.user_id}</td><td>{mem.email ?? ""}</td><td>{mem.role}</td>
                    <td>{actor.is_admin && (
                      <button className="btn btn--ghost btn--sm" type="button" onClick={() => orgAction({ action: "remove_member", org_id: org.id, user_id: mem.user_id }, "Člen odebrán.")}>Odebrat</button>
                    )}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {actor.is_admin && (
              <div className="admin-search">
                <input className="input" placeholder="E-mail nebo přezdívka" value={m.user} onChange={(e) => setMember({ ...member, [org.id]: { ...m, user: e.target.value } })} />
                <select className="input input--narrow" value={m.role} onChange={(e) => setMember({ ...member, [org.id]: { ...m, role: e.target.value } })}>
                  <option value="member">člen</option><option value="teacher">učitel</option><option value="admin">správce</option>
                </select>
                <button className="btn btn--primary btn--sm" type="button" disabled={!m.user}
                  onClick={() => orgAction({ action: "add_member", org_id: org.id, user: m.user, role: m.role }, "Člen přidán.").then(() => setMember({ ...member, [org.id]: { user: "", role: "member" } }))}>
                  Přidat člena
                </button>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

/* ── Audit ───────────────────────────────────────────────────────────── */

function AuditTab() {
  const { data, failed, load } = useLoad<{ entries: AuditEntry[] }>("admin/audit.php");
  if (failed) return <StateError message="Audit se nepodařilo načíst." onRetry={load} retryLabel="Zkusit znovu" />;
  if (!data) return <SectionSkeleton lines={3} />;
  return (
    <table className="admin-table">
      <thead><tr><th>Kdy</th><th>Kdo</th><th>Akce</th><th>Komu</th><th>Detail</th></tr></thead>
      <tbody>
        {data.entries.length === 0 && <tr><td colSpan={5}>Zatím žádné akce.</td></tr>}
        {data.entries.map((e) => (
          <tr key={e.id}>
            <td>{fmtDate(e.created_at)}</td><td>{e.actor ?? "—"}</td><td>{e.action}</td><td>{e.target ?? ""}</td>
            <td className="admin-mono">{JSON.stringify(e.detail)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ── Shell ───────────────────────────────────────────────────────────── */

export function AdminConsole() {
  const [tab, setTab] = useState<Tab>("overview");
  const overview = useLoad<Overview>("admin/overview.php");
  const config = useLoad<Config>("admin/config.php");
  const actor = overview.data?.actor;

  return (
    <section className="account-panel">
      <nav className="admin-tabs" aria-label="Sekce konzole">
        {TABS.map(([key, label]) => (
          <button key={key} type="button" className={`btn btn--sm ${tab === key ? "btn--primary" : "btn--ghost"}`}
            aria-pressed={tab === key} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </nav>
      <article className="card">
        {overview.failed ? (
          <StateError message="Konzoli se nepodařilo načíst." onRetry={overview.load} retryLabel="Zkusit znovu" />
        ) : !overview.data || !actor ? (
          <SectionSkeleton lines={3} />
        ) : tab === "overview" ? (
          <OverviewTab data={overview.data} />
        ) : tab === "users" ? (
          <UsersTab actor={actor} />
        ) : tab === "orgs" ? (
          <OrgsTab actor={actor} />
        ) : tab === "audit" ? (
          <AuditTab />
        ) : config.failed ? (
          <StateError message="Nastavení se nepodařilo načíst." onRetry={config.load} retryLabel="Zkusit znovu" />
        ) : !config.data ? (
          <SectionSkeleton lines={3} />
        ) : tab === "ranks" ? (
          <RanksTab config={config.data} actor={actor} reload={config.load} />
        ) : tab === "xp" ? (
          <XpRulesTab config={config.data} actor={actor} reload={config.load} />
        ) : (
          <TiersTab config={config.data} actor={actor} reload={config.load} />
        )}
      </article>
    </section>
  );
}
