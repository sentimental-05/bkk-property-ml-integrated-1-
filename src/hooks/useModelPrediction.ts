import { useEffect, useState } from 'react';
import { PType, PredictResponse, predictModel } from '../utils/modelApi';

interface State {
  result: PredictResponse | null;
  loading: boolean;
  error: string | null;
}

/** เรียกโมเดลจริงแบบ debounce เมื่อ features เปลี่ยน — ถ้าเรียกไม่ได้จะคืน error ให้หน้าจอ fallback เอง */
export function useModelPrediction(ptype: PType, features: Record<string, unknown>, enabled = true): State {
  const [state, setState] = useState<State>({ result: null, loading: false, error: null });
  const key = JSON.stringify(features);

  useEffect(() => {
    if (!enabled) return;
    const ctrl = new AbortController();
    setState((s) => ({ ...s, loading: true }));
    const timer = setTimeout(async () => {
      try {
        const result = await predictModel(ptype, JSON.parse(key), ctrl.signal);
        setState({ result, loading: false, error: null });
      } catch (e: any) {
        if (e?.name === 'AbortError') return;
        setState({ result: null, loading: false, error: e?.message || 'เรียกโมเดลไม่สำเร็จ' });
      }
    }, 350);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [ptype, key, enabled]);

  return state;
}
