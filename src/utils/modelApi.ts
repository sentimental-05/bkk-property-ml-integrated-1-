// ชั้นเรียก API ไปยังบริการโมเดล (ผ่าน Express: /api/ml/* และ /api/admin/*)

export type PType = 'condo' | 'house';

export interface ModelMetricsInfo {
  version: string;
  r2: number | null;
  mae: number | null;
  rmse: number | null;
  n_rows: number | null;
  trained_at: string;
}

export interface PredictResponse {
  price_sqm: number;
  model: string;
  metrics: ModelMetricsInfo | null;
  defaulted_columns: string[];
  unmatched_inputs: string[];
}

export interface ColumnOption {
  name: string;
  kind: 'categorical' | 'numeric' | 'binary';
  values?: string[];
  min?: number | null;
  max?: number | null;
  default: number | string | null;
}

export interface OptionsResponse {
  property_type: PType;
  n_rows: number;
  columns: ColumnOption[];
  geo_by_category: Record<string, { latitude: number; longitude: number }>;
  target: { name: string; median: number | null; min: number | null; max: number | null };
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const resp = await fetch(url, init);
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new ApiError(resp.status, data?.detail || data?.error || `HTTP ${resp.status}`);
  return data as T;
}

const json = (body: unknown): RequestInit => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

export const predictModel = (ptype: PType, features: Record<string, unknown>, signal?: AbortSignal) =>
  request<PredictResponse>('/api/ml/predict', { ...json({ property_type: ptype, features }), signal });

export const fetchOptions = (ptype: PType) => request<OptionsResponse>(`/api/ml/options/${ptype}`);

export const fetchMlStatus = () =>
  request<{
    status: string;
    xgboost: boolean;
    types: Record<PType, { model_ready: boolean; master_rows: number | null; latest: ModelMetricsInfo | null; available_models: string[] }>;
  }>('/api/ml/status');

// ───────── Admin ─────────
const TOKEN_KEY = 'bkk_admin_token';
export const getAdminToken = () => sessionStorage.getItem(TOKEN_KEY) || '';
export const setAdminToken = (t: string) => (t ? sessionStorage.setItem(TOKEN_KEY, t) : sessionStorage.removeItem(TOKEN_KEY));

export function adminRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  return request<T>(`/api/admin${path}`, {
    ...init,
    headers: { ...(init.headers || {}), Authorization: `Bearer ${getAdminToken()}` },
  });
}

export const adminPost = <T,>(path: string, body: unknown) =>
  adminRequest<T>(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
