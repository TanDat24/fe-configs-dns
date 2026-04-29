export type ApiSuccess<T> = T;

export type ApiErrorBody = {
  message: string;
  requestId?: string;
};

export type LoginRequestDto = {
  username: string;
  password: string;
};

export type LoginResponseDto = {
  authToken: string;
};

export type LoginDomainRequestDto = {
  domain: string;
  password?: string;
};

export type LoginDomainResponseDto = {
  authToken?: string;
  domainExists?: boolean;
  username?: string;
  domain?: string;
  message?: string;
};

export type ForgotPasswordRequestDto = {
  email: string;
};

export type ForgotPasswordResponseDto = {
  message: string;
  clientMutationId?: string;
};

export type ForgotPasswordDomainRequestDto = {
  domain: string;
  email: string;
};

export type ForgotPasswordDomainResponseDto = {
  message: string;
  domain: string;
  email: string;
};

export type ChangePasswordRequestDto = {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export type ChangePasswordResponseDto = {
  message: string;
};

export type UploadCccdResponseDto = {
  message: string;
  frontFileUrl: string;
  backFileUrl: string;
};

export type RegisterRequestDto = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type RegisterResponseDto = {
  message: string;
  authToken?: string;
};

export type SaveDomainTabRequestDto = {
  domainId: number;
  field: string;
  payload: unknown;
};

export type SaveDomainTabResponseDto = {
  message: string;
};

export type CustomerProvinceDto = {
  id?: number | null;
  type?: string | null;
  name?: string | null;
  value?: string | null;
  priority?: number | null;
  status?: string | null;
  options?: string | null;
  parentId?: number | null;
};

export type CustomerUserInfoDto = {
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

export type UpsertMyUserInfoRequestDto = Partial<Omit<CustomerUserInfoDto, "id" | "user_id">>;

export type UpsertMyUserInfoResponseDto = {
  ok: boolean;
  code: string;
  message: string;
  requestId?: string;
};

export type CustomerOrderContactDto = {
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

export type CustomerOrderItemDto = {
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

export type UpsertOrderContactRequestDto = Partial<Omit<CustomerOrderContactDto, "order_id">> & {
  order_id?: number;
};

export type UpsertOrderItemRequestDto = Partial<Omit<CustomerOrderItemDto, "order_id">> & {
  order_id?: number;
};

export type MutationResultWithIdDto = {
  ok: boolean;
  code: string;
  message: string;
  id?: number;
  requestId?: string;
};
