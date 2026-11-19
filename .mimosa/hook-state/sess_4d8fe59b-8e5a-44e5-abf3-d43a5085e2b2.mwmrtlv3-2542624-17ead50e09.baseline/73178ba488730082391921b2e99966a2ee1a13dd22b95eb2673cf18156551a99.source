import { proxyEdgeFunction } from "@/lib/edge-proxy";

export const runtime = "nodejs";
type Context = { params: Promise<{ path: string[] }> };
const handler = async (request: Request, context: Context) =>
  proxyEdgeFunction(request, (await context.params).path, "api");

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE, handler as OPTIONS };
