import { recordHistoryResponse } from "@/lib/server/record-history";

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  return recordHistoryResponse(request, slug);
}
