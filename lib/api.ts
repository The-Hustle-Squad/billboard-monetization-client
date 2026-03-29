import axios, {
  AxiosHeaders,
  type InternalAxiosRequestConfig,
  type AxiosResponse,
  isAxiosError,
} from 'axios';
import type {
  AnalyticsSummary,
  ConfirmSlotResponse,
  CreateVendorDto,
  LockSlotResponse,
  PaginatedSlotsResponse,
  SlotPricing,
  SyncSlotsRequest,
  SyncSlotsResponse,
  UpdateRulesDto,
  VendorCreated,
  VendorRulesResponse,
} from './types';

/**
 * API root for `/vendors`, `/slots`, etc.
 * Set `NEXT_PUBLIC_API_URL` to the server origin (e.g. `https://api.example.com`) or to the
 * full prefix including `/api/v1`.
 */
function getApiV1Root(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!raw) {
    throw new Error('NEXT_PUBLIC_API_URL must be set');
  }
  const normalized = raw.replace(/\/$/, '');
  if (normalized.endsWith('/api/v1')) return normalized;
  return `${normalized}/api/v1`;
}

const apiClient = axios.create({
  baseURL: getApiV1Root(),
  headers: { 'Content-Type': 'application/json' },
  validateStatus: (status) => status >= 200 && status < 300,
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const skip = (config as InternalAxiosRequestConfig & { skipApiKey?: boolean }).skipApiKey;
  if (skip) return config;
  if (typeof window === 'undefined') return config;
  const key = getApiKey();
  if (key) {
    const headers = AxiosHeaders.from(config.headers ?? {});
    headers.set('x-api-key', key);
    config.headers = headers;
  }
  return config;
});

export type ApiResult<T> = {
  data: T | null;
  error: string | null;
  status?: number;
};

function formatErrorMessage(message: unknown): string {
  if (Array.isArray(message)) return message.join('; ');
  if (typeof message === 'string') return message;
  return 'Request failed';
}

// Get API key from localStorage
export function getApiKey(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('vendor_api_key');
}

function onUnauthorized(skipApiKey?: boolean) {
  if (skipApiKey || typeof window === 'undefined') return;
  clearApiKey();
  window.dispatchEvent(new CustomEvent('vacantslot:unauthorized'));
}

async function handleAxios<T>(
  fn: () => Promise<AxiosResponse<T>>,
  skipApiKey?: boolean
): Promise<ApiResult<T>> {
  try {
    const res = await fn();
    return { data: res.data, error: null, status: res.status };
  } catch (err) {
    if (isAxiosError(err)) {
      const status = err.response?.status;
      const body = err.response?.data as Record<string, unknown> | undefined;
      const message = formatErrorMessage(
        body?.message ?? body?.error ?? err.message ?? `HTTP ${status ?? 'error'}`
      );
      if (status === 401) onUnauthorized(skipApiKey);
      return { data: null, error: message, status };
    }
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

export async function apiGet<T>(path: string): Promise<ApiResult<T>> {
  return handleAxios(() => apiClient.get<T>(path));
}

export async function apiPost<T>(
  path: string,
  body?: object | null,
  skipApiKey?: boolean
): Promise<ApiResult<T>> {
  return handleAxios(
    () =>
      apiClient.post<T>(path, body === null ? undefined : body, {
        skipApiKey,
      } as InternalAxiosRequestConfig & { skipApiKey?: boolean }),
    skipApiKey
  );
}

// —— VacantSlot API ——

export function createVendor(body: CreateVendorDto) {
  return apiPost<VendorCreated>('/vendors', body, true);
}

export function updateVendorRules(body: UpdateRulesDto) {
  return apiPost<VendorRulesResponse>('/vendors/rules', body);
}

export function syncSlots(body: SyncSlotsRequest) {
  return apiPost<SyncSlotsResponse>('/slots/sync', body);
}

export function listSlots(page = 1, limit = 20) {
  const q = new URLSearchParams({ page: String(page), limit: String(limit) });
  return apiGet<PaginatedSlotsResponse>(`/slots?${q.toString()}`);
}

export function getSlotPricing(slotId: string) {
  const encoded = encodeURIComponent(slotId);
  return apiGet<SlotPricing>(`/slots/${encoded}/pricing`);
}

export function lockSlot(slotId: string) {
  const encoded = encodeURIComponent(slotId);
  return apiPost<LockSlotResponse>(`/slots/${encoded}/lock`, null);
}

export function confirmSlot(slotId: string, lockId: string) {
  const encoded = encodeURIComponent(slotId);
  return apiPost<ConfirmSlotResponse>(`/slots/${encoded}/confirm`, {
    lockId,
  });
}

export function getAnalyticsSummary() {
  return apiGet<AnalyticsSummary>('/analytics/summary');
}

/** Check credentials before saving to localStorage (authenticated route). */
export function verifyApiKey(key: string) {
  const trimmed = key.trim();
  if (!trimmed) {
    return Promise.resolve({
      data: null,
      error: 'API key is required',
    } satisfies ApiResult<AnalyticsSummary>);
  }
  const headers = new AxiosHeaders();
  headers.set('x-api-key', trimmed);

  return handleAxios(
    () =>
      apiClient.get<AnalyticsSummary>('/analytics/summary', {
        skipApiKey: true,
        headers,
      } as InternalAxiosRequestConfig & { skipApiKey?: boolean }),
    true
  );
}

// Utility: set API key in localStorage
export function setApiKey(key: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('vendor_api_key', key);
  }
}

// Utility: clear API key from localStorage
export function clearApiKey(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('vendor_api_key');
  }
}

// Utility: check if API key exists
export function hasApiKey(): boolean {
  return getApiKey() !== null;
}
