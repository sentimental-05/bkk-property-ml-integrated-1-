import React, { useEffect, useMemo, useState } from 'react';
import { Home, Sparkles, BedDouble, Bath, MapPin, ArrowRight, DollarSign, Info, AlertTriangle } from 'lucide-react';
import { OptionsResponse, fetchOptions } from '../utils/modelApi';
import { useModelPrediction } from '../hooks/useModelPrediction';

interface HouseFormProps {
  onSendToMortgage: (priceTHB: number) => void;
  onViewOnMap: (neighborhood: string) => void;
}

// ฟีเจอร์ตรงกับโมเดลบ้านใน notebook: city, latitude, longitude, bedroom_number,
// bathroom_number, usable_area, furnished, new_home  (เป้าหมาย = price_sqm)
interface HouseModelForm {
  city: string;
  furnished: string;
  bedroomNumber: number;
  bathroomNumber: number;
  usableArea: number; // ตร.ม. (สมมติหน่วย ตร.ม. ตามชื่อคอลัมน์ usable_area)
  newHome: boolean;
}

const fieldCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400';
const labelCls = 'text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5';

export const HouseForm: React.FC<HouseFormProps> = ({ onSendToMortgage, onViewOnMap }) => {
  const [opts, setOpts] = useState<OptionsResponse | null>(null);
  const [optsError, setOptsError] = useState<string | null>(null);
  const [form, setForm] = useState<HouseModelForm>({
    city: '', furnished: '', bedroomNumber: 3, bathroomNumber: 2, usableArea: 150, newHome: false,
  });

  useEffect(() => {
    fetchOptions('house')
      .then((o) => {
        setOpts(o);
        const col = (n: string) => o.columns.find((c) => c.name === n);
        setForm((f) => ({
          ...f,
          city: f.city || String(col('city')?.default ?? col('city')?.values?.[0] ?? ''),
          furnished: f.furnished || String(col('furnished')?.default ?? col('furnished')?.values?.[0] ?? ''),
        }));
      })
      .catch((e) => setOptsError(e.message));
  }, []);

  const cities = opts?.columns.find((c) => c.name === 'city')?.values ?? [];
  const furnishedValues = opts?.columns.find((c) => c.name === 'furnished')?.values ?? [];

  // พิกัดไม่ต้องกรอก — ฝั่งเซิร์ฟเวอร์เติมค่ากลางของเมืองที่เลือกให้
  const features = useMemo(() => ({ ...form }), [form]);
  const ready = !!opts && !!form.city;
  const { result, loading, error } = useModelPrediction('house', features, ready);

  const total = result ? Math.round((result.price_sqm * form.usableArea) / 5000) * 5000 : 0;
  const mae = result?.metrics?.mae ?? null;
  const low = result && mae != null ? Math.max(0, (result.price_sqm - mae) * form.usableArea) : null;
  const high = result && mae != null ? (result.price_sqm + mae) * form.usableArea : null;

  const set = <K extends keyof HouseModelForm>(k: K, v: HouseModelForm[K]) => setForm((f) => ({ ...f, [k]: v }));

  if (optsError) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-sm text-amber-800 flex gap-3">
        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">ยังเชื่อมต่อโมเดลบ้านไม่ได้</p>
          <p className="mt-1">{optsError}</p>
          <p className="mt-2 text-xs">
            ตรวจว่ารันบริการ Python แล้ว (<code>uvicorn ml_service.main:app --port 8000</code>) และมี{' '}
            <code>data/house_master.csv</code> กับ <code>models/model_latest_house.pkl</code> จาก notebook
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      <div className="lg:col-span-3 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center gap-2 text-blue-700 font-semibold text-sm">
          <Home className="w-4 h-4" />
          <span>แบบจำลองทำนายราคาบ้านเดี่ยว กรุงเทพฯ</span>
        </div>
        {opts && (
          <p className="text-xs text-slate-500">
            เรียนจากข้อมูล {opts.n_rows.toLocaleString()} รายการ · ทำนายราคาต่อ ตร.ม. แล้วคูณพื้นที่ใช้สอย
          </p>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}><MapPin className="w-3.5 h-3.5" /> เมือง/เขต (city)</label>
            <select id="house-city" className={fieldCls} value={form.city} onChange={(e) => set('city', e.target.value)}>
              {cities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>เฟอร์นิเจอร์ (furnished)</label>
            <select id="house-furnished" className={fieldCls} value={form.furnished} onChange={(e) => set('furnished', e.target.value)}>
              {furnishedValues.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>พื้นที่ใช้สอย (ตร.ม.)</label>
            <input id="house-area" type="number" min={20} max={2000} className={fieldCls} value={form.usableArea}
              onChange={(e) => set('usableArea', Math.max(0, Number(e.target.value)))} />
          </div>
          <div>
            <label className={labelCls}>บ้านใหม่ (new_home)</label>
            <label className="flex items-center gap-2 text-sm text-slate-700 py-2.5">
              <input id="house-new" type="checkbox" checked={form.newHome} onChange={(e) => set('newHome', e.target.checked)} />
              เป็นบ้านใหม่ / โครงการใหม่
            </label>
          </div>
          <div>
            <label className={labelCls}><BedDouble className="w-3.5 h-3.5" /> ห้องนอน</label>
            <input id="house-bed" type="number" min={1} max={12} className={fieldCls} value={form.bedroomNumber}
              onChange={(e) => set('bedroomNumber', Math.max(0, Number(e.target.value)))} />
          </div>
          <div>
            <label className={labelCls}><Bath className="w-3.5 h-3.5" /> ห้องน้ำ</label>
            <input id="house-bath" type="number" min={1} max={12} className={fieldCls} value={form.bathroomNumber}
              onChange={(e) => set('bathroomNumber', Math.max(0, Number(e.target.value)))} />
          </div>
        </div>

        <p className="text-[11px] text-slate-400 flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          พิกัด (latitude/longitude) ใช้ค่ากลางของเมืองที่เลือก — ความแม่นยำระดับซอย/ถนนต้องมีฟอร์มปักหมุดเพิ่ม
        </p>
      </div>

      <div className="lg:col-span-2 space-y-4">
        <div className="bg-gradient-to-br from-[#0F172A] via-[#1E3A8A] to-[#172554] rounded-3xl p-7 text-white shadow-xl shadow-blue-950/20">
          <div className="flex items-center justify-between mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 text-sky-100 border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              ราคาประเมินจากโมเดล ML
            </span>
            {result?.metrics?.r2 != null && (
              <span className="text-xs text-sky-200/90 font-medium">R² = {result.metrics.r2.toFixed(4)}</span>
            )}
          </div>

          {error && <p className="text-sm text-amber-300">ทำนายไม่สำเร็จ: {error}</p>}
          {!result && !error && <p className="text-sm text-sky-200">{loading ? 'กำลังคำนวณ…' : 'กรอกข้อมูลเพื่อดูราคาประเมิน'}</p>}

          {result && (
            <>
              <p className="text-xs text-sky-200 uppercase tracking-wider font-medium">ราคาประเมินที่คาดการณ์</p>
              <div className="flex items-baseline gap-2 mt-1">
                <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums">{total.toLocaleString()}</h3>
                <span className="text-lg font-bold text-sky-200">บาท</span>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-white/15">
                <div>
                  <p className="text-xs text-sky-200/80">เฉลี่ยต่อ ตร.ม.</p>
                  <p className="text-base font-bold mt-0.5 tabular-nums">{Math.round(result.price_sqm).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-sky-200/80">ช่วง ± MAE ของโมเดล</p>
                  <p className="text-xs font-medium text-white/90 mt-0.5 tabular-nums">
                    {low != null && high != null ? `${(low / 1e6).toFixed(2)}M - ${(high / 1e6).toFixed(2)}M บาท` : '—'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                id="house-send-mortgage-btn"
                onClick={() => onSendToMortgage(total)}
                className="mt-6 w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-full bg-white text-blue-950 font-bold text-xs sm:text-sm shadow-md hover:bg-sky-50 transition-all active:scale-[0.98]"
              >
                <DollarSign className="w-4 h-4 text-blue-700" />
                <span>ส่งราคานี้ไปคำนวณค่างวดผ่อนรายเดือน</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onViewOnMap(form.city)}
                className="mt-2 w-full text-center text-xs text-sky-200 hover:text-white underline underline-offset-2"
              >
                ดูย่านนี้บนแผนที่
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
