export const runtime = "nodejs";

// Every account endpoint now has its own Next.js route. Unknown paths used to
// be proxied to the legacy `auth` edge function, whose login built a PostgREST
// filter from user input and issued an unsigned vevit_auth cookie; that
// function is retired, so anything unmatched is simply 404.
const notFound = () =>
  Response.json({ error: "Not found" }, { status: 404, headers: { "Cache-Control": "no-store" } });

export { notFound as GET, notFound as POST, notFound as PUT, notFound as PATCH, notFound as DELETE, notFound as OPTIONS };
