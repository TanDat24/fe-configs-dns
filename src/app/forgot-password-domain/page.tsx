import type { Metadata } from "next";
import { ForgotPasswordDomainPageView } from "@/components/features/auth/forgot-password-domain-page-view";

export const metadata: Metadata = {
  title: "Khôi phục mật khẩu tên miền | Config DNS",
  description: "Khôi phục mật khẩu theo tên miền và Gmail",
};

export default function ForgotPasswordDomainPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-gradient-to-b from-zinc-50 to-white">
      <ForgotPasswordDomainPageView />
    </div>
  );
}
