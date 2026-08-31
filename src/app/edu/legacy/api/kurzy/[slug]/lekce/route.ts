export { GET, OPTIONS } from "../route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Port of edu/legacy/api/kurzy.php path handling: /api/kurzy/{slug}/lekce
// resolves the slug segment and renders the same course detail
// (the PHP parser never looks past the slug) — so /lekce suffix is ignored,
// exactly like in PHP.