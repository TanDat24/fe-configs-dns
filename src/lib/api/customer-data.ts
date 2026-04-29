import { apiJson } from "./client";
import type {
  CustomerOrderContactDto,
  CustomerOrderItemDto,
  CustomerProvinceDto,
  CustomerUserInfoDto,
  MutationResultWithIdDto,
  UpsertMyUserInfoRequestDto,
  UpsertMyUserInfoResponseDto,
  UpsertOrderContactRequestDto,
  UpsertOrderItemRequestDto,
} from "@/lib/contracts/api";

export async function getCustomerProvinces(input?: {
  type?: string;
  parentId?: number;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<{ total: number; items: CustomerProvinceDto[] }> {
  const search = new URLSearchParams();
  if (input?.type) search.set("type", input.type);
  if (typeof input?.parentId === "number") search.set("parentId", String(input.parentId));
  if (input?.status) search.set("status", input.status);
  if (typeof input?.limit === "number") search.set("limit", String(input.limit));
  if (typeof input?.offset === "number") search.set("offset", String(input.offset));
  const query = search.toString();

  return apiJson<{ total: number; items: CustomerProvinceDto[] }>(
    `/api/customer-data/provinces${query ? `?${query}` : ""}`,
    { method: "GET" },
  );
}

export async function getMyUserInfo(): Promise<CustomerUserInfoDto | null> {
  const data = await apiJson<{ item: CustomerUserInfoDto | null }>("/api/customer-data/my-user-info", {
    method: "GET",
  });
  return data.item;
}

export async function upsertMyUserInfo(input: UpsertMyUserInfoRequestDto): Promise<UpsertMyUserInfoResponseDto> {
  return apiJson<UpsertMyUserInfoResponseDto>("/api/customer-data/my-user-info", {
    method: "POST",
    json: input,
  });
}

export async function getOrderContacts(
  orderId: number,
  input?: { limit?: number; offset?: number },
): Promise<{ total: number; items: CustomerOrderContactDto[] }> {
  const search = new URLSearchParams();
  if (typeof input?.limit === "number") search.set("limit", String(input.limit));
  if (typeof input?.offset === "number") search.set("offset", String(input.offset));
  const query = search.toString();

  return apiJson<{ total: number; items: CustomerOrderContactDto[] }>(
    `/api/customer-data/orders/${orderId}/contacts${query ? `?${query}` : ""}`,
    { method: "GET" },
  );
}

export async function upsertOrderContact(
  orderId: number,
  input: UpsertOrderContactRequestDto,
): Promise<MutationResultWithIdDto> {
  return apiJson<MutationResultWithIdDto>(`/api/customer-data/orders/${orderId}/contacts`, {
    method: "POST",
    json: input,
  });
}

export async function deleteOrderContact(id: number): Promise<MutationResultWithIdDto> {
  return apiJson<MutationResultWithIdDto>(`/api/customer-data/orders/contacts/${id}`, {
    method: "DELETE",
  });
}

export async function getOrderItems(
  orderId: number,
  input?: { limit?: number; offset?: number },
): Promise<{ total: number; items: CustomerOrderItemDto[] }> {
  const search = new URLSearchParams();
  if (typeof input?.limit === "number") search.set("limit", String(input.limit));
  if (typeof input?.offset === "number") search.set("offset", String(input.offset));
  const query = search.toString();

  return apiJson<{ total: number; items: CustomerOrderItemDto[] }>(
    `/api/customer-data/orders/${orderId}/items${query ? `?${query}` : ""}`,
    { method: "GET" },
  );
}

export async function upsertOrderItem(
  orderId: number,
  input: UpsertOrderItemRequestDto,
): Promise<MutationResultWithIdDto> {
  return apiJson<MutationResultWithIdDto>(`/api/customer-data/orders/${orderId}/items`, {
    method: "POST",
    json: input,
  });
}

export async function deleteOrderItem(id: number): Promise<MutationResultWithIdDto> {
  return apiJson<MutationResultWithIdDto>(`/api/customer-data/orders/items/${id}`, {
    method: "DELETE",
  });
}
