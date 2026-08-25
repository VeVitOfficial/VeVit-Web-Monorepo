import { proxyEdgeFunction } from "@/lib/edge-proxy";

export const runtime = "nodejs";
export async function POST(request: Request) {
  return proxyEdgeFunction(request, [], "stripe");
}
