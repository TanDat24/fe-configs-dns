import { emailVerificationResponse } from "@/lib/server/email-verification";

export async function POST(request: Request) {
  return emailVerificationResponse(request, "verify");
}
