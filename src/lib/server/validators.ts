import { z } from "zod";
import type { DomainJsonField, DomainOverviewField } from "@/lib/domain-types";

const USER_CONTACT_TYPES = ["owner", "technical", "management", "billing"] as const;
const USER_CONTACT_MODES = ["company", "personal"] as const;
const USER_CONTACT_GENDERS = ["male", "female", "other"] as const;

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
  password: z.string().min(1, "Vui long nhap mat khau.").optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().min(1, "Vui long nhap email hoac ten nguoi dung."),
});

export const forgotPasswordDomainSchema = z.object({
  domain: z
    .string()
    .trim()
    .min(3, "Vui long nhap ten mien.")
    .regex(
      /^(?:https?:\/\/)?(?:www\.)?[a-z0-9][a-z0-9.\-]*\.[a-z]{2,}(?:\/.*)?$/i,
      "Ten mien khong hop le.",
    ),
  email: z.string().trim().email("Email khong hop le."),
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

export const saveUserContactSchema = z
  .object({
    id: z.number().int().positive().optional(),
    domainId: z.number().int().positive().optional(),
    contactType: z.enum(USER_CONTACT_TYPES),
    contactMode: z.enum(USER_CONTACT_MODES).optional(),
    fullName: z.string().trim().optional(),
    gender: z.enum(USER_CONTACT_GENDERS).optional().or(z.literal("")),
    birthday: z.string().trim().optional(),
    identityNumber: z.string().trim().optional(),
    companyName: z.string().trim().optional(),
    taxCode: z.string().trim().optional(),
    country: z.string().trim().optional(),
    province: z.string().trim().optional(),
    ward: z.string().trim().optional(),
    email: z.string().trim().optional(),
    phone: z.string().trim().optional(),
    fax: z.string().trim().optional(),
    address: z.string().trim().optional(),
    postalCode: z.string().trim().optional(),
  })
  .passthrough()
  .superRefine((data, ctx) => {
    if (data.contactType !== "owner" && data.contactMode === "company") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Technical, management va billing phai la contact ca nhan", path: ["contactMode"] });
    }

    if (data.contactMode === "company") {
      if (!data.companyName) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Vui long nhap ten cong ty", path: ["companyName"] });
      }
      if (!data.taxCode) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Vui long nhap ma so thue", path: ["taxCode"] });
      }
    } else if (!data.fullName) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Vui long nhap ho ten chu the", path: ["fullName"] });
    }

    if (data.birthday && !/^\d{4}-\d{2}-\d{2}$/.test(data.birthday)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Ngay sinh khong hop le", path: ["birthday"] });
    }

    if (data.email && !/^\S+@\S+\.\S+$/.test(data.email)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Email khong hop le", path: ["email"] });
    }
  });

export const deleteUserContactSchema = z.object({
  id: z.number().int().positive(),
});

export function parseBodyOrThrow<T>(schema: z.ZodSchema<T>, body: unknown): T {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    throw new Error(firstIssue?.message || "Du lieu khong hop le.");
  }
  return parsed.data;
}
