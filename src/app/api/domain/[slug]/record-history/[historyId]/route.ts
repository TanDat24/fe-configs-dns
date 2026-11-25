import { recordHistoryResponse } from "@/lib/server/record-history";

export async function GET(request: Request, context: { params: Promise<{ slug: string; historyId: string }> }) {
  const { slug, historyId } = await context.params;
  return recordHistoryResponse(request, slug, historyId);
}
