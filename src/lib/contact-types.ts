// Contact types for user-scoped domain registration info

export type ContactType = "owner" | "technical" | "management" | "billing";
export type ContactMode = "company" | "personal";
export type Gender = "male" | "female" | "other";

export const CONTACT_TYPE_ORDER: ContactType[] = ["owner", "technical", "management", "billing"];

export interface UserContact {
  id: number;
  userId: number;
  contactType: ContactType;
  contactMode: ContactMode;
  companyName: string;
  taxCode: string;
  fullName: string;
  gender: Gender | "";
  birthday: string;
  identityNumber: string;
  country: string;
  province: string;
  ward: string;
  email: string;
  phone: string;
  fax: string;
  address: string;
  postalCode: string;
}

export type ContactDraft = Omit<UserContact, "id" | "userId"> & {
  id?: number;
  userId?: number;
};

export function createEmptyContactDraft(
  contactType: ContactType = "owner",
  contactMode: ContactMode = "personal",
): ContactDraft {
  return {
    contactType,
    contactMode,
    fullName: "",
    gender: "",
    birthday: "",
    identityNumber: "",
    companyName: "",
    taxCode: "",
    country: "VN",
    province: "",
    ward: "",
    email: "",
    phone: "",
    fax: "",
    address: "",
    postalCode: "",
  };
}

export const EMPTY_CONTACT: ContactDraft = createEmptyContactDraft();

export const CONTACT_TYPE_LABELS: Record<ContactType, string> = {
  owner: "Chủ thể",
  technical: "Kỹ thuật",
  management: "Quản lý",
  billing: "Thanh toán",
};

export const CONTACT_MODE_LABELS: Record<ContactMode, string> = {
  company: "Tổ chức / Công ty",
  personal: "Cá nhân",
};
