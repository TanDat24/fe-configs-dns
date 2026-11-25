import { emailVerificationStatusResponse } from "@/lib/server/email-verification";

export async function GET() {
  return emailVerificationStatusResponse();
}
