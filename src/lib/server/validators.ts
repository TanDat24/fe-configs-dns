import { z } from "zod";
import type { DomainJsonField, DomainOverviewField } from "@/lib/domain-types";

const DOMAIN_FIELDS: Array<DomainJsonField | DomainOverviewField> = [
  "dns_records_json",
  "name_servers_json",
  "child_dns_json",
  "email_forwards_json",
  "security_services_json",
  "two_factor_enabled",
  "owner_name",
  "owner_address",
  "owner_phone",
  "owner_email",
  "owner_postcode",
  "registration_date",
  "expiry_date",
  "estimated_value",
  "domain_status",
  "protection_level",
  "profile_cccd_verified",
  "profile_declaration_verified",
  "profile_owner_verified",
  "profile_domain_verified",
  "redemption_days",
  "pending_delete_days",
];

export const loginSchema = z.object({
  username: z.string().trim().min(1, "Vui long nhap ten nguoi dung."),
  password: z.string().min(1, "Vui long nhap mat khau."),
});

export const loginDomainSchema = z.object({
  domain: z
    .string()
    .trim()
    .min(3, "Vui long nhap ten mien.")
    .regex(
      /^(?:https?:\/\/)?(?:www\.)?[a-z0-9][a-z0-9.\-]*\.[a-z]{2,}(?:\/.*)?$/i,
      "Ten mien khong hop le.",
    ),
  password: z.string().min(1, "Vui long nhap mat khau."),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().min(1, "Vui long nhap email hoac ten nguoi dung."),
});

export const registerSchema = z
  .object({
    username: z.string().trim().min(3, "Ten nguoi dung toi thieu 3 ky tu."),
    email: z.string().trim().email("Email khong hop le."),
    password: z.string().min(8, "Mat khau toi thieu 8 ky tu."),
    confirmPassword: z.string().min(1, "Vui long xac nhan mat khau."),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Mat khau xac nhan khong khop.",
    path: ["confirmPassword"],
  });

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, "Vui long nhap mat khau cu."),
  newPassword: z.string().min(1, "Vui long nhap mat khau moi."),
  confirmPassword: z.string().min(1, "Vui long nhap xac nhan mat khau."),
});

export const saveDomainTabSchema = z.object({
  domainId: z.number().int().positive(),
  field: z.enum(DOMAIN_FIELDS as [string, ...string[]]),
  payload: z.unknown(),
});

export function parseBodyOrThrow<T>(schema: z.ZodSchema<T>, body: unknown): T {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    throw new Error(firstIssue?.message || "Du lieu khong hop le.");
  }
  return parsed.data;
}
