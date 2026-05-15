"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/client";
import {
  deleteMyUserContact,
  getMyUserContacts,
  upsertMyUserContact,
} from "@/lib/api/customer-data";
import {
  CONTACT_TYPE_ORDER,
  createEmptyContactDraft,
  type ContactDraft,
  type ContactType,
  type UserContact,
} from "@/lib/contact-types";

export const userContactsQueryKey = (domainId?: number) =>
  ["user-contacts", domainId ?? "default"] as const;

function createInitialContacts(): Record<ContactType, ContactDraft> {
  return Object.fromEntries(
    CONTACT_TYPE_ORDER.map((type) => [type, createEmptyContactDraft(type)]),
  ) as Record<ContactType, ContactDraft>;
}

function mapApiContact(contact: UserContact): ContactDraft {
  return {
    id: contact.id,
    userId: contact.userId,
    contactType: contact.contactType,
    contactMode: contact.contactMode,
    companyName: contact.companyName,
    taxCode: contact.taxCode,
    fullName: contact.fullName,
    gender: contact.gender,
    birthday: contact.birthday,
    identityNumber: contact.identityNumber,
    country: contact.country || "VN",
    province: contact.province,
    ward: contact.ward,
    email: contact.email,
    phone: contact.phone,
    fax: contact.fax,
    address: contact.address,
    postalCode: contact.postalCode,
  };
}

function mapContacts(items: UserContact[]): Record<ContactType, ContactDraft> {
  const next = createInitialContacts();
  for (const item of items) {
    if (item.contactType in next) {
      next[item.contactType] = mapApiContact(item);
    }
  }
  return next;
}

export function useUserContacts(domainId?: number) {
  const queryKey = userContactsQueryKey(domainId);

  return useQuery({
    queryKey,
    queryFn: async () => {
      const items = await getMyUserContacts(typeof domainId === "number" ? { domainId } : undefined);
      return mapContacts(items);
    },
  });
}

export function useUserContactMutations(domainId?: number) {
  const queryClient = useQueryClient();
  const queryKey = userContactsQueryKey(domainId);

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const saveMutation = useMutation({
    mutationFn: async (draft: ContactDraft) => {
      const result = await upsertMyUserContact(
        draft,
        typeof domainId === "number" ? { domainId } : undefined,
      );
      if (!result.ok) {
        throw new Error(result.message || "Luu contact that bai.");
      }
      return result;
    },
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id }: { id: number; contactType: ContactType }) => {
      const result = await deleteMyUserContact(id);
      if (!result.ok) {
        throw new Error(result.message || "Xoa contact that bai.");
      }
      return result;
    },
    onSuccess: invalidate,
  });

  return { saveMutation, deleteMutation };
}

export function getUserContactsErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    return err.message;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return "Khong tai duoc contact.";
}
