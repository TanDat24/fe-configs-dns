import type { Metadata } from "next";
import { ForgotPasswordPageView } from "@/components/features/auth/forgot-password-page-view";

export const metadata: Metadata = {
  title: "Quên mật khẩu | Config DNS",
  description: "Khôi phục mật khẩu CONFIGGS DNS",
};

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-zinc-100">
      <ForgotPasswordPageView />
    </div>
  );
}
