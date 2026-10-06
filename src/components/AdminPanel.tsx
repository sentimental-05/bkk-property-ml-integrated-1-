import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Database, Upload, RefreshCw, LogOut, Plus, Cpu, ShieldCheck, AlertTriangle, CheckCircle2 } from 'lucide-react';
import {
  ApiError, ColumnOption, OptionsResponse, PType, adminPost, adminRequest, fetchMlStatus,
  fetchOptions, getAdminToken, setAdminToken,
} from '../utils/modelApi';

const card = 'bg-white rounded-2xl border border-slate-200 shadow-xs p-5';
const inputCls = 'w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200';
const btn = 'inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all disabled:opacity-50';
const TYPE_LABEL: Record<PType, string> = { condo: 'คอนโด', house: 'บ้านเดี่ยว' };

type Status = Awaited<ReturnType<typeof fetchMlStatus>>;
interface IngestResult { received: number; added: number; duplicates_skipped: number; rejected: { row: number; reason: string }[]; ignored_extra_columns: string[]; total_rows: number; note: string }
interface Job { state: 'idle' | 'running' | 'done' | 'error'; property_type: string | null; log: string[]; result: any; error: string | null }

// ───────────── Login ─────────────
const Login: React.FC<{ onOk: () => void }> = ({ onOk }) => {
  const [token, setToken] = useState('');
  const [err, setErr] = useState('');
  const submit = async () => {
    setAdminToken(token.trim());
    try {
      await adminRequest('/check');
      onOk();
    } catch (e: any) {
      setAdminToken('');
      setErr(e instanceof ApiError ? e.message : 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้');
    }
  };
  return (
    <div className={`${card} max-w-md mx-auto space-y-3`}>
      <div className="flex items-center gap-2 font-bold text-slate-800"><ShieldCheck className="w-5 h-5 text-blue-600" /> เข้าสู่ระบบผู้ดูแล</div>
      <input id="admin-token" type="password" className={inputCls} placeholder="ADMIN_TOKEN" value={token}
        onChange={(e) => setToken(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} />
      {err && <p className="text-xs text-rose-600">{err}</p>}
      <button className={`${btn} bg-blue-600 text-white hover:bg-blue-700`} onClick={submit} disabled={!token}>เข้าสู่ระบบ</button>
      <p className="text-[11px] text-slate-400">ค่า token ตั้งในไฟล์ .env ฝั่งเซิร์ฟเวอร์ (ADMIN_TOKEN)</p>
    </div>
  );
};

// ───────────── ฟอร์มเพิ่มข้อมูลทีละรายการ (สร้างจาก schema ของ master จริง) ─────────────
const RecordForm: React.FC<{ ptype: PType; opts: OptionsResponse; onDone: (r: IngestResult) => void; onError: (m: string) => void }> = ({ ptype, opts, onDone, onError }) => {
  const [vals, setVals] = useState<Record<string, string | boolean>>({});
  const [busy, setBusy] = useState(false);
  useEffect(() => setVals({}), [ptype]);

  const columns: ColumnOption[] = [
    ...opts.columns,
    { name: opts.target.name, kind: 'numeric', default: opts.target.median, min: opts.target.min, max: opts.target.max },
  ];

  const submit = async () => {
    const rec: Record<string, unknown> = {};
    for (const c of columns) {
      const v = vals[c.name];
      if (c.kind === 'binary') rec[c.name] = v ? 1 : 0;
      else if (c.kind === 'numeric') rec[c.name] = v === undefined || v === '' ? null : Number(v);
      else rec[c.name] = v === undefined || v === '' ? null : String(v);
    }
    if (rec[opts.target.name] == null) return onError(`ต้องกรอก ${opts.target.name} (ราคา/ตร.ม.)`);
    setBusy(true);
    try {
      onDone(await adminPost<IngestResult>('/records', { property_type: ptype, records: [rec] }));
      setVals({});
    } catch (e: any) { onError(e.message); }
    setBusy(false);
  };

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {columns.map((c) => {
          const isTarget = c.name === opts.target.name;
          return (
            <div key={c.name}>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                {c.name}{isTarget && <span className="text-rose-500"> *</span>}
              </label>
              {c.kind === 'binary' ? (
                <label className="flex items-center gap-2 text-sm py-1.5">
                  <input type="checkbox" checked={!!vals[c.name]} onChange={(e) => setVals({ ...vals, [c.name]: e.target.checked })} /> มี / ใช่
                </label>
              ) : c.kind === 'categorical' ? (
                <>
                  <input list={`dl-${c.name}`} className={inputCls} value={String(vals[c.name] ?? '')}
                    onChange={(e) => setVals({ ...vals, [c.name]: e.target.value })} placeholder={c.default != null ? `เช่น ${c.default}` : ''} />
                  <datalist id={`dl-${c.name}`}>{c.values?.map((v) => <option key={v} value={v} />)}</datalist>
                </>
              ) : (
                <input type="number" step="any" className={inputCls} value={String(vals[c.name] ?? '')}
                  onChange={(e) => setVals({ ...vals, [c.name]: e.target.value })}
                  placeholder={c.min != null && c.max != null ? `${c.min} – ${c.max}` : ''} />
              )}
            </div>
          );
        })}
      </div>
      <button className={`${btn} bg-blue-600 text-white hover:bg-blue-700`} onClick={submit} disabled={busy}>
        <Plus className="w-4 h-4" /> เพิ่มรายการ
      </button>
      <p className="text-[11px] text-slate-400">ช่องตัวเลขที่เว้นว่างจะบันทึกเป็นค่าว่าง (โมเดลเติมค่ากลางให้ตอนเทรน) ยกเว้น {opts.target.name} ที่จำเป็นต้องกรอก</p>
    </div>
  );
};

// ───────────── Main ─────────────
export const AdminPanel: React.FC = () => {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(!!getAdminToken());
  const [ptype, setPtype] = useState<PType>('condo');
  const [status, setStatus] = useState<Status | null>(null);
  const [opts, setOpts] = useState<OptionsResponse | null>(null);
  const [mode, setMode] = useState<'form' | 'csv'>('form');
  const [result, setResult] = useState<IngestResult | null>(null);
  const [error, setError] = useState('');
  const [job, setJob] = useState<Job | null>(null);
  const [registry, setRegistry] = useState<any[]>([]);
  const [ingestLog, setIngestLog] = useState<any[]>([]);
  const [preview, setPreview] = useState<{ columns: string[]; rows: any[]; n_rows: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const logout = () => { setAdminToken(''); setAuthed(false); };
  const guard = (e: any) => { if (e instanceof ApiError && e.status === 401) logout(); setError(e.message || String(e)); };

  useEffect(() => {
    if (!getAdminToken()) return;
    adminRequest('/check').then(() => setAuthed(true)).catch(() => setAdminToken('')).finally(() => setChecking(false));
  }, []);

  const refresh = useCallback(async () => {
    try {
      setStatus(await fetchMlStatus());
      const [reg, log] = await Promise.all([
        fetch('/api/ml/registry').then((r) => r.json()),
        adminRequest<{ items: any[] }>('/ingest-log'),
      ]);
      setRegistry(reg.items || []);
      setIngestLog(log.items || []);
    } catch (e) { guard(e); }
  }, []);

  const loadType = useCallback(async () => {
    setOpts(null); setPreview(null);
    try {
      setOpts(await fetchOptions(ptype));
      setPreview(await adminRequest(`/preview/${ptype}?n=8`));
    } catch (e: any) { setError(e.message); }
  }, [ptype]);

  useEffect(() => { if (authed) refresh(); }, [authed, refresh]);
  useEffect(() => { if (authed) loadType(); }, [authed, loadType]);

  // poll สถานะเทรน
  useEffect(() => {
    if (!authed || job?.state !== 'running') return;
    const t = setInterval(async () => {
      try {
        const j = await adminRequest<Job>('/retrain-status');
        setJob(j);
        if (j.state !== 'running') { refresh(); loadType(); }
      } catch (e) { guard(e); }
    }, 2000);
    return () => clearInterval(t);
  }, [authed, job?.state, refresh, loadType]);

  const onResult = (r: IngestResult) => { setError(''); setResult(r); refresh(); loadType(); };

  const uploadCsv = async (file: File) => {
    setError(''); setResult(null);
    try { onResult(await adminPost<IngestResult>('/upload-csv', { property_type: ptype, csv: await file.text() })); }
    catch (e) { guard(e); }
    if (fileRef.current) fileRef.current.value = '';
  };

  const retrain = async () => {
    if (!confirm(`เทรนโมเดล${TYPE_LABEL[ptype]}ใหม่จากข้อมูล master ทั้งหมด? (ใช้เวลาหลายนาที โมเดลชุดเก่าจะถูกย้ายไป models/archive)`)) return;
    setError('');
    try {
      await adminPost('/retrain', { property_type: ptype });
      setJob(await adminRequest<Job>('/retrain-status'));
    } catch (e) { guard(e); }
  };

  if (checking) return <p className="text-sm text-slate-500">กำลังตรวจสอบสิทธิ์…</p>;
  if (!authed) return <Login onOk={() => setAuthed(true)} />;

  const t = status?.types[ptype];
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {(['condo', 'house'] as PType[]).map((p) => (
            <button key={p} onClick={() => { setPtype(p); setResult(null); }}
              className={`${btn} ${ptype === p ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-700'}`}>{TYPE_LABEL[p]}</button>
          ))}
        </div>
        <div className="flex gap-2">
          <button className={`${btn} bg-white border border-slate-200`} onClick={refresh}><RefreshCw className="w-4 h-4" /> รีเฟรช</button>
          <button className={`${btn} bg-white border border-slate-200`} onClick={logout}><LogOut className="w-4 h-4" /> ออกจากระบบ</button>
        </div>
      </div>

      {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl p-3 flex gap-2"><AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />{error}</div>}

      {/* สถานะ */}
      <div className="grid sm:grid-cols-4 gap-3">
        <div className={card}><p className="text-xs text-slate-500">ข้อมูลใน master</p><p className="text-2xl font-extrabold">{t?.master_rows?.toLocaleString() ?? '—'}</p></div>
        <div className={card}><p className="text-xs text-slate-500">R² โมเดลล่าสุด</p><p className="text-2xl font-extrabold">{t?.latest?.r2 != null ? t.latest.r2.toFixed(4) : '—'}</p></div>
        <div className={card}><p className="text-xs text-slate-500">MAE (บาท/ตร.ม.)</p><p className="text-2xl font-extrabold">{t?.latest?.mae != null ? Math.round(t.latest.mae).toLocaleString() : '—'}</p></div>
        <div className={card}><p className="text-xs text-slate-500">เวอร์ชัน</p><p className="text-sm font-bold break-all">{t?.latest?.version ?? 'ยังไม่มีโมเดล'}</p></div>
      </div>

      {/* เพิ่มข้อมูล */}
      <div className={`${card} space-y-4`}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="font-bold text-slate-800 flex items-center gap-2"><Database className="w-4 h-4 text-blue-600" /> เพิ่มข้อมูล{TYPE_LABEL[ptype]}</h2>
          <div className="flex gap-1 text-xs">
            {(['form', 'csv'] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)} className={`px-3 py-1.5 rounded-full ${mode === m ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {m === 'form' ? 'กรอกทีละรายการ' : 'อัปโหลด CSV'}
              </button>
            ))}
          </div>
        </div>

        {!opts ? <p className="text-sm text-slate-500">กำลังโหลด schema… (ต้องมี data/{ptype}_master.csv)</p> : mode === 'form' ? (
          <RecordForm ptype={ptype} opts={opts} onDone={onResult} onError={setError} />
        ) : (
          <div className="space-y-2">
            <input ref={fileRef} type="file" accept=".csv,text/csv" className="text-sm" onChange={(e) => e.target.files?.[0] && uploadCsv(e.target.files[0])} />
            <p className="text-[11px] text-slate-500">
              ต้องมีคอลัมน์ครบเหมือน master: <code className="break-all">{[...opts.columns.map((c) => c.name), opts.target.name].join(', ')}</code>
              {ptype === 'condo' && ' (หรือไฟล์ดิบที่มี dist_shop_1… ระบบจะแปลงเป็น mean/min ให้เหมือน notebook)'}
            </p>
          </div>
        )}

        {result && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm text-emerald-800 space-y-1">
            <p className="font-bold flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> เพิ่ม {result.added} จาก {result.received} แถว · master รวม {result.total_rows.toLocaleString()} แถว</p>
            {result.duplicates_skipped > 0 && <p>ข้าม {result.duplicates_skipped} แถวที่ซ้ำกับข้อมูลเดิม</p>}
            {result.ignored_extra_columns.length > 0 && <p>ไม่ใช้คอลัมน์: {result.ignored_extra_columns.join(', ')}</p>}
            {result.rejected.length > 0 && <p className="text-rose-700">ปฏิเสธ {result.rejected.length} แถว: {result.rejected.slice(0, 5).map((r) => `แถว ${r.row} (${r.reason})`).join('; ')}</p>}
            <p className="text-xs">{result.note}</p>
          </div>
        )}
      </div>

      {/* เทรนใหม่ */}
      <div className={`${card} space-y-3`}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="font-bold text-slate-800 flex items-center gap-2"><Cpu className="w-4 h-4 text-blue-600" /> เทรนโมเดล{TYPE_LABEL[ptype]}ใหม่</h2>
          <button className={`${btn} bg-blue-600 text-white hover:bg-blue-700`} onClick={retrain} disabled={job?.state === 'running'}>
            {job?.state === 'running' ? 'กำลังเทรน…' : 'เทรนใหม่จากข้อมูลทั้งหมด'}
          </button>
        </div>
        {status && !status.xgboost && <p className="text-xs text-amber-700 bg-amber-50 rounded-lg p-2">เซิร์ฟเวอร์ Python ยังไม่ได้ติดตั้ง xgboost — จะเทรนเฉพาะ RandomForest/KNN/DecisionTree/ANN</p>}
        {job && job.property_type === ptype && job.state !== 'idle' && (
          <>
            <pre className="bg-slate-900 text-slate-100 text-xs rounded-xl p-3 max-h-48 overflow-auto whitespace-pre-wrap">{job.log.join('\n') || '…'}</pre>
            {job.state === 'error' && <p className="text-sm text-rose-600">ล้มเหลว: {job.error}</p>}
            {job.state === 'done' && job.result && (
              <div className="overflow-x-auto">
                <p className="text-sm font-bold text-emerald-700 mb-2">ใช้ {job.result.best_model} (R² {job.result.r2.toFixed(4)}) เวอร์ชัน {job.result.version}</p>
                <table className="text-xs w-full"><thead><tr className="text-left text-slate-500"><th>โมเดล</th><th>R²</th><th>MAE</th><th>RMSE</th></tr></thead>
                  <tbody>{Object.entries<any>(job.result.comparison).sort((a, b) => b[1].r2 - a[1].r2).map(([n, m]) => (
                    <tr key={n} className="border-t border-slate-100"><td className="py-1 font-medium">{n}</td><td>{m.r2.toFixed(4)}</td><td>{Math.round(m.mae).toLocaleString()}</td><td>{Math.round(m.rmse).toLocaleString()}</td></tr>))}</tbody></table>
              </div>
            )}
          </>
        )}
        <p className="text-[11px] text-slate-400">เว็บจะใช้โมเดลชุดใหม่ทันทีเมื่อเทรนเสร็จ — ชุดเก่าถูกย้ายไป models/archive/ และ master เดิมสำรองไว้ใน data/backup/ ทุกครั้งที่เพิ่มข้อมูล</p>
      </div>

      {/* ตัวอย่างข้อมูล + ประวัติ */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className={`${card} overflow-x-auto`}>
          <h3 className="font-bold text-sm mb-2">ข้อมูลล่าสุดใน master ({preview?.n_rows.toLocaleString() ?? '…'} แถว)</h3>
          {preview && (
            <table className="text-[11px] w-full whitespace-nowrap"><thead><tr className="text-left text-slate-500">{preview.columns.map((c) => <th key={c} className="pr-3">{c}</th>)}</tr></thead>
              <tbody>{preview.rows.map((r, i) => <tr key={i} className="border-t border-slate-100">{preview.columns.map((c) => <td key={c} className="pr-3 py-1">{r[c] == null ? '' : typeof r[c] === 'number' ? Math.round(r[c] * 1000) / 1000 : String(r[c])}</td>)}</tr>)}</tbody></table>
          )}
        </div>
        <div className="space-y-6">
          <div className={`${card} overflow-x-auto`}>
            <h3 className="font-bold text-sm mb-2">ประวัติเวอร์ชันโมเดล</h3>
            <table className="text-[11px] w-full"><thead><tr className="text-left text-slate-500"><th>เวอร์ชัน</th><th>แถว</th><th>R²</th><th>MAE</th></tr></thead>
              <tbody>{registry.slice(0, 8).map((r) => <tr key={r.version} className="border-t border-slate-100"><td className="py-1">{r.version}</td><td>{r.n_rows}</td><td>{r.r2 != null ? Number(r.r2).toFixed(4) : ''}</td><td>{r.mae != null ? Math.round(r.mae).toLocaleString() : ''}</td></tr>)}</tbody></table>
          </div>
          <div className={`${card} overflow-x-auto`}>
            <h3 className="font-bold text-sm mb-2">ประวัติการเพิ่มข้อมูล</h3>
            {ingestLog.length === 0 ? <p className="text-xs text-slate-400">ยังไม่มี</p> : (
              <table className="text-[11px] w-full"><tbody>{ingestLog.slice(0, 8).map((r, i) => <tr key={i} className="border-t border-slate-100"><td className="py-1">{String(r.timestamp).replace('T', ' ')}</td><td>{TYPE_LABEL[r.property_type as PType]}</td><td>+{r.rows_added}</td><td className="text-slate-400">{r.source}</td></tr>)}</tbody></table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
