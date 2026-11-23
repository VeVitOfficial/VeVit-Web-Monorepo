import {
  AccountBackendUnavailableError,
  accountSupabase,
  json,
  registerNicknameLookupKey,
  registerNicknameIsValid,
} from "@/lib/account-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Nickname availability lookup, migrated off the legacy Supabase `auth` Edge
// Function. Ports account/api/nickname-availability.php faithfully: it returns
// only whether a syntactically valid nickname can be registered — user
// records, IDs and e-mail addresses are deliberately never exposed.

async function availability(request: Request): Promise<Response> {
  const raw = new URL(request.url).searchParams.get("nickname") ?? "";
  const normalized = registerNicknameLookupKey(raw);
  if (!registerNicknameIsValid(raw) || normalized === null) {
    return json({ available: false });
  }

  const { data, error } = await accountSupabase()
    .from("users")
    .select("id")
    .eq("nickname_normalized", normalized)
    .limit(1)
    .maybeSingle();
  if (error) return json({ error: "Chyba serveru." }, 500);

  return json({ available: data === null });
}

export async function GET(request: Request): Promise<Response> {
  try {
    return await availability(request);
  } catch (error) {
    if (error instanceof AccountBackendUnavailableError) {
      return json({ error: "Service temporarily unavailable" }, 503);
    }
    console.error("Nickname availability endpoint failed", error);
    return json({ error: "Chyba serveru." }, 500);
  }
}

export async function POST(): Promise<Response> {
  return json({ error: "Method not allowed" }, 405, { Allow: "GET" });
}