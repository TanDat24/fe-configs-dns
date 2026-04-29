import "server-only";

type GraphqlBase = { errors?: Array<{ message: string }> };

type ProvinceNode = {
  id?: number | null;
  type?: string | null;
  name?: string | null;
  value?: string | null;
  priority?: number | null;
  status?: string | null;
  options?: string | null;
  parentId?: number | null;
};

type UserInfoNode = {
  id?: number | null;
  gender?: string | null;
  name?: string | null;
  birthday?: string | null;
  country?: string | null;
  province?: string | null;
  province_id?: number | null;
  ward?: string | null;
  ward_id?: number | null;
  phone?: string | null;
  zalo_account?: number | null;
  zalo_phone?: string | null;
  address?: string | null;
  id_number?: string | null;
  user_id?: number | null;
};

type OrderContactNode = {
  id?: number | null;
  name?: string | null;
  gender?: string | null;
  birthday?: string | null;
  country?: string | null;
  province?: string | null;
  province_id?: number | null;
  ward?: string | null;
  ward_id?: number | null;
  phone?: string | null;
  fax?: string | null;
  email?: string | null;
  address?: string | null;
  id_number?: string | null;
  tax_code?: string | null;
  type?: string | null;
  organization?: number | null;
  order_id?: number | null;
};

type OrderItemNode = {
  id?: number | null;
  cart_item_id?: string | null;
  item_key?: string | null;
  type?: string | null;
  json_type?: string | null;
  title?: string | null;
  year?: number | null;
  price?: number | null;
  price_renew?: number | null;
  total?: number | null;
  is_tax?: number | null;
  vat?: number | null;
  order_id?: number | null;
  status?: string | null;
};

type ProvinceConnectionResponse = GraphqlBase & {
  data?: {
    dnsProvincesV2?: {
      total?: number | null;
      nodes?: ProvinceNode[] | null;
      pageInfo?: { limit?: number | null; offset?: number | null; hasNextPage?: boolean | null } | null;
    } | null;
  };
};

type MyUserInfoResponse = GraphqlBase & {
  data?: { dnsMyUserInfoV2?: UserInfoNode | null };
};

type UpsertUserInfoResponse = GraphqlBase & {
  data?: {
    dnsUpsertMyUserInfoV2?: {
      ok?: boolean | null;
      code?: string | null;
      message?: string | null;
    } | null;
  };
};

type OrderContactConnectionResponse = GraphqlBase & {
  data?: {
    dnsOrderContactsByOrderIdV2?: {
      total?: number | null;
      nodes?: OrderContactNode[] | null;
      pageInfo?: { limit?: number | null; offset?: number | null; hasNextPage?: boolean | null } | null;
    } | null;
  };
};

type OrderItemConnectionResponse = GraphqlBase & {
  data?: {
    dnsOrderItemsByOrderIdV2?: {
      total?: number | null;
      nodes?: OrderItemNode[] | null;
      pageInfo?: { limit?: number | null; offset?: number | null; hasNextPage?: boolean | null } | null;
    } | null;
  };
};

type MutationResult = {
  ok?: boolean | null;
  code?: string | null;
  message?: string | null;
  id?: number | null;
};

type UpsertOrderContactResponse = GraphqlBase & {
  data?: { dnsUpsertOrderContactV2?: MutationResult | null };
};
type DeleteOrderContactResponse = GraphqlBase & {
  data?: { dnsDeleteOrderContactV2?: MutationResult | null };
};
type UpsertOrderItemResponse = GraphqlBase & {
  data?: { dnsUpsertOrderItemV2?: MutationResult | null };
};
type DeleteOrderItemResponse = GraphqlBase & {
  data?: { dnsDeleteOrderItemV2?: MutationResult | null };
};

const PROVINCES_QUERY = `
  query ProvincesV2($type: String, $parentId: Int, $status: String, $limit: Int, $offset: Int) {
    dnsProvincesV2(type: $type, parentId: $parentId, status: $status, limit: $limit, offset: $offset) {
      total
      nodes { id type name value priority status options parentId }
      pageInfo { limit offset hasNextPage }
    }
  }
`;

const MY_USER_INFO_QUERY = `
  query MyUserInfoV2 {
    dnsMyUserInfoV2 {
      id gender name birthday country province province_id ward ward_id phone zalo_account zalo_phone address id_number user_id
    }
  }
`;

const UPSERT_MY_USER_INFO_MUTATION = `
  mutation UpsertMyUserInfoV2(
    $gender: String
    $name: String
    $birthday: String
    $country: String
    $province: String
    $province_id: Int
    $ward: String
    $ward_id: Int
    $phone: String
    $zalo_account: Int
    $zalo_phone: String
    $address: String
    $id_number: String
  ) {
    dnsUpsertMyUserInfoV2(input: {
      gender: $gender
      name: $name
      birthday: $birthday
      country: $country
      province: $province
      province_id: $province_id
      ward: $ward
      ward_id: $ward_id
      phone: $phone
      zalo_account: $zalo_account
      zalo_phone: $zalo_phone
      address: $address
      id_number: $id_number
    }) {
      ok
      code
      message
    }
  }
`;

const ORDER_CONTACTS_QUERY = `
  query OrderContactsV2($orderId: Int!, $limit: Int, $offset: Int) {
    dnsOrderContactsByOrderIdV2(orderId: $orderId, limit: $limit, offset: $offset) {
      total
      nodes {
        id name gender birthday country province province_id ward ward_id phone fax email address id_number tax_code type organization order_id
      }
      pageInfo { limit offset hasNextPage }
    }
  }
`;

const ORDER_ITEMS_QUERY = `
  query OrderItemsV2($orderId: Int!, $limit: Int, $offset: Int) {
    dnsOrderItemsByOrderIdV2(orderId: $orderId, limit: $limit, offset: $offset) {
      total
      nodes {
        id cart_item_id item_key type json_type title year price price_renew total is_tax vat order_id status
      }
      pageInfo { limit offset hasNextPage }
    }
  }
`;

const UPSERT_ORDER_CONTACT_MUTATION = `
  mutation UpsertOrderContactV2(
    $id: Int
    $name: String
    $gender: String
    $birthday: String
    $country: String
    $province: String
    $province_id: Int
    $ward: String
    $ward_id: Int
    $phone: String
    $fax: String
    $email: String
    $address: String
    $id_number: String
    $tax_code: String
    $type: String
    $organization: Int
    $order_id: Int!
  ) {
    dnsUpsertOrderContactV2(input: {
      id: $id
      name: $name
      gender: $gender
      birthday: $birthday
      country: $country
      province: $province
      province_id: $province_id
      ward: $ward
      ward_id: $ward_id
      phone: $phone
      fax: $fax
      email: $email
      address: $address
      id_number: $id_number
      tax_code: $tax_code
      type: $type
      organization: $organization
      order_id: $order_id
    }) { ok code message id }
  }
`;

const DELETE_ORDER_CONTACT_MUTATION = `
  mutation DeleteOrderContactV2($id: Int!) {
    dnsDeleteOrderContactV2(input: { id: $id }) { ok code message }
  }
`;

const UPSERT_ORDER_ITEM_MUTATION = `
  mutation UpsertOrderItemV2(
    $id: Int
    $cart_item_id: String
    $item_key: String
    $type: String
    $json_type: String
    $title: String
    $year: Float
    $price: Float
    $price_renew: Float
    $total: Float
    $is_tax: Int
    $vat: Float
    $order_id: Int!
    $status: String
  ) {
    dnsUpsertOrderItemV2(input: {
      id: $id
      cart_item_id: $cart_item_id
      item_key: $item_key
      type: $type
      json_type: $json_type
      title: $title
      year: $year
      price: $price
      price_renew: $price_renew
      total: $total
      is_tax: $is_tax
      vat: $vat
      order_id: $order_id
      status: $status
    }) { ok code message id }
  }
`;

const DELETE_ORDER_ITEM_MUTATION = `
  mutation DeleteOrderItemV2($id: Int!) {
    dnsDeleteOrderItemV2(input: { id: $id }) { ok code message }
  }
`;

async function parseWpJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    const jsonStart = text.indexOf("{");
    if (jsonStart >= 0) {
      return JSON.parse(text.slice(jsonStart)) as T;
    }
    throw new Error("invalid_json");
  }
}

async function wpGraphql<T>(
  endpoint: string,
  authToken: string,
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });
  return parseWpJson<T>(res);
}

export async function wpGetProvincesV2(
  endpoint: string,
  authToken: string,
  input: { type?: string; parentId?: number; status?: string; limit?: number; offset?: number },
): Promise<{ ok: true; total: number; nodes: ProvinceNode[] } | { ok: false; status: number; message: string }> {
  try {
    const json = await wpGraphql<ProvinceConnectionResponse>(endpoint, authToken, PROVINCES_QUERY, input);
    if (json.errors?.length) {
      return { ok: false, status: 400, message: json.errors.map((e) => e.message).join(" ") };
    }
    const payload = json.data?.dnsProvincesV2;
    return { ok: true, total: payload?.total ?? 0, nodes: payload?.nodes ?? [] };
  } catch {
    return { ok: false, status: 502, message: "Loi goi WordPress GraphQL." };
  }
}

export async function wpGetMyUserInfoV2(
  endpoint: string,
  authToken: string,
): Promise<{ ok: true; item: UserInfoNode | null } | { ok: false; status: number; message: string }> {
  try {
    const json = await wpGraphql<MyUserInfoResponse>(endpoint, authToken, MY_USER_INFO_QUERY);
    if (json.errors?.length) {
      return { ok: false, status: 400, message: json.errors.map((e) => e.message).join(" ") };
    }
    return { ok: true, item: json.data?.dnsMyUserInfoV2 ?? null };
  } catch {
    return { ok: false, status: 502, message: "Loi goi WordPress GraphQL." };
  }
}

export async function wpUpsertMyUserInfoV2(
  endpoint: string,
  authToken: string,
  input: Record<string, unknown>,
): Promise<{ ok: true; code: string; message: string } | { ok: false; status: number; code?: string; message: string }> {
  try {
    const json = await wpGraphql<UpsertUserInfoResponse>(endpoint, authToken, UPSERT_MY_USER_INFO_MUTATION, input);
    if (json.errors?.length) {
      return { ok: false, status: 400, message: json.errors.map((e) => e.message).join(" ") };
    }
    const payload = json.data?.dnsUpsertMyUserInfoV2;
    if (!payload?.ok) {
      return {
        ok: false,
        status: 400,
        code: payload?.code ?? "UNKNOWN",
        message: payload?.message ?? "Luu that bai.",
      };
    }
    return { ok: true, code: payload.code ?? "OK", message: payload.message ?? "Da luu." };
  } catch {
    return { ok: false, status: 502, message: "Loi goi WordPress GraphQL." };
  }
}

function extractMutationResult(payload: MutationResult | null | undefined): { ok: true; code: string; message: string; id?: number } | { ok: false; status: number; code?: string; message: string } {
  if (!payload?.ok) {
    return {
      ok: false,
      status: 400,
      code: payload?.code ?? "UNKNOWN",
      message: payload?.message ?? "Thuc hien that bai.",
    };
  }
  return {
    ok: true,
    code: payload.code ?? "OK",
    message: payload.message ?? "Thanh cong.",
    id: typeof payload.id === "number" ? payload.id : undefined,
  };
}

export async function wpGetOrderContactsV2(
  endpoint: string,
  authToken: string,
  input: { orderId: number; limit?: number; offset?: number },
): Promise<{ ok: true; total: number; nodes: OrderContactNode[] } | { ok: false; status: number; message: string }> {
  try {
    const json = await wpGraphql<OrderContactConnectionResponse>(endpoint, authToken, ORDER_CONTACTS_QUERY, input);
    if (json.errors?.length) {
      return { ok: false, status: 400, message: json.errors.map((e) => e.message).join(" ") };
    }
    const payload = json.data?.dnsOrderContactsByOrderIdV2;
    return { ok: true, total: payload?.total ?? 0, nodes: payload?.nodes ?? [] };
  } catch {
    return { ok: false, status: 502, message: "Loi goi WordPress GraphQL." };
  }
}

export async function wpGetOrderItemsV2(
  endpoint: string,
  authToken: string,
  input: { orderId: number; limit?: number; offset?: number },
): Promise<{ ok: true; total: number; nodes: OrderItemNode[] } | { ok: false; status: number; message: string }> {
  try {
    const json = await wpGraphql<OrderItemConnectionResponse>(endpoint, authToken, ORDER_ITEMS_QUERY, input);
    if (json.errors?.length) {
      return { ok: false, status: 400, message: json.errors.map((e) => e.message).join(" ") };
    }
    const payload = json.data?.dnsOrderItemsByOrderIdV2;
    return { ok: true, total: payload?.total ?? 0, nodes: payload?.nodes ?? [] };
  } catch {
    return { ok: false, status: 502, message: "Loi goi WordPress GraphQL." };
  }
}

export async function wpUpsertOrderContactV2(
  endpoint: string,
  authToken: string,
  input: Record<string, unknown>,
): Promise<{ ok: true; code: string; message: string; id?: number } | { ok: false; status: number; code?: string; message: string }> {
  try {
    const json = await wpGraphql<UpsertOrderContactResponse>(endpoint, authToken, UPSERT_ORDER_CONTACT_MUTATION, input);
    if (json.errors?.length) {
      return { ok: false, status: 400, message: json.errors.map((e) => e.message).join(" ") };
    }
    return extractMutationResult(json.data?.dnsUpsertOrderContactV2);
  } catch {
    return { ok: false, status: 502, message: "Loi goi WordPress GraphQL." };
  }
}

export async function wpDeleteOrderContactV2(
  endpoint: string,
  authToken: string,
  id: number,
): Promise<{ ok: true; code: string; message: string } | { ok: false; status: number; code?: string; message: string }> {
  try {
    const json = await wpGraphql<DeleteOrderContactResponse>(endpoint, authToken, DELETE_ORDER_CONTACT_MUTATION, { id });
    if (json.errors?.length) {
      return { ok: false, status: 400, message: json.errors.map((e) => e.message).join(" ") };
    }
    const result = extractMutationResult(json.data?.dnsDeleteOrderContactV2);
    if (!result.ok) return result;
    return { ok: true, code: result.code, message: result.message };
  } catch {
    return { ok: false, status: 502, message: "Loi goi WordPress GraphQL." };
  }
}

export async function wpUpsertOrderItemV2(
  endpoint: string,
  authToken: string,
  input: Record<string, unknown>,
): Promise<{ ok: true; code: string; message: string; id?: number } | { ok: false; status: number; code?: string; message: string }> {
  try {
    const json = await wpGraphql<UpsertOrderItemResponse>(endpoint, authToken, UPSERT_ORDER_ITEM_MUTATION, input);
    if (json.errors?.length) {
      return { ok: false, status: 400, message: json.errors.map((e) => e.message).join(" ") };
    }
    return extractMutationResult(json.data?.dnsUpsertOrderItemV2);
  } catch {
    return { ok: false, status: 502, message: "Loi goi WordPress GraphQL." };
  }
}

export async function wpDeleteOrderItemV2(
  endpoint: string,
  authToken: string,
  id: number,
): Promise<{ ok: true; code: string; message: string } | { ok: false; status: number; code?: string; message: string }> {
  try {
    const json = await wpGraphql<DeleteOrderItemResponse>(endpoint, authToken, DELETE_ORDER_ITEM_MUTATION, { id });
    if (json.errors?.length) {
      return { ok: false, status: 400, message: json.errors.map((e) => e.message).join(" ") };
    }
    const result = extractMutationResult(json.data?.dnsDeleteOrderItemV2);
    if (!result.ok) return result;
    return { ok: true, code: result.code, message: result.message };
  } catch {
    return { ok: false, status: 502, message: "Loi goi WordPress GraphQL." };
  }
}
