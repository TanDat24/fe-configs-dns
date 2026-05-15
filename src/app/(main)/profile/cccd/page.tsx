"use client";

import { CccdUploadForm } from "@/components/features/cccd/cccd-upload-form";
import { DashboardDomainShell } from "@/components/features/dashboard/dashboard-domain-shell";

export default function UploadCccdPage() {
  return (
    <DashboardDomainShell activeTab="overview">
      <div className="space-y-4 px-6 py-5">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Upload CCCD</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Tải ảnh CCCD để bộ phận quản trị xác minh chủ sở hữu tên miền.
          </p>
        </div>
        <CccdUploadForm />
      </div>
    </DashboardDomainShell>
  );
}
