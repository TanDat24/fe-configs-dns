import type { Metadata } from "next";
import { LogoutPageView } from "@/components/features/auth/logout-page-view";

export const metadata: Metadata = {
  title: "Đăng nhập | Config DNS",
  description: "Đăng nhập CONFIGGS DNS",
};

export default function LogoutPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      <LogoutPageView />
    </div>
  );
}
