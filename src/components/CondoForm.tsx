import React, { useState, useMemo } from 'react';
import { CondoInputForm } from '../types';
import { BANGKOK_DISTRICTS, DISTRICT_PRICE_STATS } from '../data/condosData';
import { predictCondoPrice } from '../utils/mlEngine';
import { useModelPrediction } from '../hooks/useModelPrediction';
import {
  Building2,
  Sparkles,
  Train,
  Clock,
  Layers,
  ShoppingBag,
  GraduationCap,
  HeartPulse,
  DollarSign,
  ArrowRight,
  TrendingUp,
  Info,
  RotateCcw,
  Sliders,
  CheckCircle2,
  Maximize2
} from 'lucide-react';

interface CondoFormProps {
  onSendToMortgage: (priceTHB: number) => void;
  onViewOnMap: (district: string) => void;
}

const DEFAULT_CONDO: CondoInputForm = {
  district: 'Watthana',
  roomSizeSqm: 35,
  bldAge: 5,
  projArea: 18000,
  nbrFloors: 32,
  units: 480,
  distTran1: 0.45,
  distShop1: 0.6,
  distSchool1: 0.8,
  hospital: 1.2,
  elevator: true,
  parking: true,
  pool: true,
  gym: true,
  sauna: true,
  garden: true,
  playground: false,
  security: true,
  cctv: true,
  shop: true,
  restaurant: false,
  wifi: true,
};

export const CondoForm: React.FC<CondoFormProps> = ({
  onSendToMortgage,
  onViewOnMap,
}) => {
  const [form, setForm] = useState<CondoInputForm>(DEFAULT_CONDO);

  const localPrediction = useMemo(() => {
    return predictCondoPrice(form, form.roomSizeSqm);
  }, [form]);

  // เรียกโมเดลจริงจาก notebook (ผ่าน /api/ml/predict) — ขนาดห้องไม่ใช่ฟีเจอร์ของโมเดล (เป้าหมายคือ ราคา/ตร.ม.)
  const modelFeatures = useMemo(() => {
    const { roomSizeSqm: _ignored, ...rest } = form;
    return rest as Record<string, unknown>;
  }, [form]);
  const { result: modelResult, error: modelError } = useModelPrediction('condo', modelFeatures);

  // ถ้าโมเดลตอบ ใช้ค่าจากโมเดล (ช่วงราคา = ± MAE ของโมเดลชุดล่าสุด) ถ้าไม่ตอบ ใช้สูตรสำรองเดิม
  const prediction = useMemo(() => {
    if (!modelResult) return localPrediction;
    const sqm = Math.max(0, Math.round(modelResult.price_sqm / 100) * 100);
    const mae = modelResult.metrics?.mae ?? sqm * 0.12;
    return {
      ...localPrediction,
      predictedPricePerSqm: sqm,
      totalPriceForSize: Math.round(sqm * form.roomSizeSqm),
      lowBound: Math.max(0, Math.round(sqm - mae)),
      highBound: Math.round(sqm + mae),
    };
  }, [localPrediction, modelResult, form.roomSizeSqm]);

  const handlePreset = (type: 'cbd' | 'urban' | 'budget') => {
    if (type === 'cbd') {
      setForm({
        district: 'Pathum Wan',
        roomSizeSqm: 52,
        bldAge: 3,
        projArea: 25000,
        nbrFloors: 42,
        units: 350,
        distTran1: 0.2,
        distShop1: 0.3,
        distSchool1: 0.9,
        hospital: 0.8,
        elevator: true,
        parking: true,
        pool: true,
        gym: true,
        sauna: true,
        garden: true,
        playground: true,
        security: true,
        cctv: true,
        shop: true,
        restaurant: true,
        wifi: true,
      });
    } else if (type === 'urban') {
      setForm({
        district: 'Chatuchak',
        roomSizeSqm: 35,
        bldAge: 6,
        projArea: 15000,
        nbrFloors: 28,
        units: 620,
        distTran1: 0.5,
        distShop1: 0.8,
        distSchool1: 1.2,
        hospital: 1.5,
        elevator: true,
        parking: true,
        pool: true,
        gym: true,
        sauna: false,
        garden: true,
        playground: false,
        security: true,
        cctv: true,
        shop: true,
        restaurant: false,
        wifi: true,
      });
    } else {
      setForm({
        district: 'Bang Kapi',
        roomSizeSqm: 28,
        bldAge: 12,
        projArea: 8000,
        nbrFloors: 8,
        units: 320,
        distTran1: 2.5,
        distShop1: 1.2,
        distSchool1: 1.0,
        hospital: 2.2,
        elevator: true,
        parking: true,
        pool: false,
        gym: false,
        sauna: false,
        garden: true,
        playground: false,
        security: true,
        cctv: true,
        shop: false,
        restaurant: false,
        wifi: false,
      });
    }
  };

  const toggleAmenity = (key: keyof CondoInputForm) => {
    setForm((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const selectedDistrictStat = DISTRICT_PRICE_STATS[form.district];

  return (
    <div className="space-y-6">
      {/* Top Banner with Presets */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-700 font-semibold text-sm mb-1">
            <Building2 className="w-4 h-4" />
            <span>แบบจำลองทำนายราคาคอนโดมิเนียม กทม. (Random Forest / XGBoost)</span>
          </div>
          <p className="text-slate-600 text-sm">
            ทำนายราคาต่อตารางเมตร (price_sqm) และราคารวมห้อง จากข้อมูลจริง 1,019 โครงการ 42 เขตในกรุงเทพมหานคร
          </p>
        </div>

        {/* Presets */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400 font-medium mr-1">ชุดข้อมูลตัวอย่าง:</span>
          <button
            type="button"
            id="condo-preset-cbd"
            onClick={() => handlePreset('cbd')}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors"
          >
            CBD หรูติดรถไฟฟ้า
          </button>
          <button
            type="button"
            id="condo-preset-urban"
            onClick={() => handlePreset('urban')}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors"
          >
            ย่านคนทำงาน (Urban)
          </button>
          <button
            type="button"
            id="condo-preset-budget"
            onClick={() => handlePreset('budget')}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
          >
            ราคาประหยัด (Eco)
          </button>
          <button
            type="button"
            id="condo-reset-default"
            onClick={() => setForm(DEFAULT_CONDO)}
            title="รีเซ็ตค่าเริ่มต้น"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
        {/* Left Form: Inputs (7 cols) */}
        <div className="lg:col-span-7 space-y-4 sm:space-y-5 bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="font-bold text-slate-800 flex items-center gap-2 text-base">
              <Sliders className="w-5 h-5 text-indigo-600" />
              กำหนดคุณลักษณะคอนโด (Project & Unit Specs)
            </h2>
            <span className="text-xs text-slate-400">42 เขต กทม.</span>
          </div>

          {/* 1. District Selection */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="condo-district-select" className="text-sm font-semibold text-slate-700">
                เขตที่ตั้งโครงการในกรุงเทพฯ (District)
              </label>
              <button
                type="button"
                id="condo-view-district-map"
                onClick={() => onViewOnMap(form.district)}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium hover:underline flex items-center gap-1"
              >
                ดูพิกัดบนแผนที่ <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <select
              id="condo-district-select"
              value={form.district}
              onChange={(e) => setForm({ ...form, district: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden font-medium"
            >
              {BANGKOK_DISTRICTS.map((d) => {
                const stat = DISTRICT_PRICE_STATS[d];
                return (
                  <option key={d} value={d}>
                    เขต{d} — ค่าเฉลี่ย {stat ? stat.mean.toLocaleString() : '-'} บ./ตร.ม. ({stat?.count || 0} โครงการ)
                  </option>
                );
              })}
            </select>
            {selectedDistrictStat && (
              <p className="text-xs text-slate-500">
                สถิติราคาเขต{form.district}: ต่ำสุด {selectedDistrictStat.min.toLocaleString()} บ. | สูงสุด {selectedDistrictStat.max.toLocaleString()} บ./ตร.ม.
              </p>
            )}
          </div>

          {/* 2. Room Size & Building Age */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Room Size */}
            <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <div className="flex items-center justify-between">
                <label htmlFor="condo-room-size" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
                  ขนาดห้องชุด (ตร.ม.)
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={15}
                    max={300}
                    step={1}
                    value={form.roomSizeSqm}
                    onChange={(e) => setForm({ ...form, roomSizeSqm: Math.max(1, Number(e.target.value)) })}
                    className="w-16 px-1.5 py-0.5 text-xs font-bold text-indigo-700 bg-white border border-slate-300 rounded text-right"
                  />
                  <span className="text-xs font-bold text-indigo-700">ตร.ม.</span>
                </div>
              </div>
              <input
                id="condo-room-size"
                type="range"
                min={20}
                max={150}
                step={1}
                value={form.roomSizeSqm}
                onChange={(e) => setForm({ ...form, roomSizeSqm: Number(e.target.value) })}
                className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>สตูดิโอ 20 ตร.ม.</span>
                <span>1 ห้องนอน 35 ตร.ม.</span>
                <span>2+ ห้องนอน 80+ ตร.ม.</span>
              </div>
            </div>

            {/* Building Age */}
            <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <div className="flex items-center justify-between">
                <label htmlFor="condo-bld-age" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  อายุอาคาร (bld_age)
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={form.bldAge}
                    onChange={(e) => setForm({ ...form, bldAge: Math.max(0, Number(e.target.value)) })}
                    className="w-14 px-1.5 py-0.5 text-xs font-bold text-indigo-700 bg-white border border-slate-300 rounded text-right"
                  />
                  <span className="text-xs font-bold text-indigo-700">ปี</span>
                </div>
              </div>
              <input
                id="condo-bld-age"
                type="range"
                min={0}
                max={30}
                step={1}
                value={form.bldAge}
                onChange={(e) => setForm({ ...form, bldAge: Number(e.target.value) })}
                className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />
              <p className="text-[11px] text-slate-500">
                {form.bldAge <= 3 ? 'อาคารสร้างใหม่ สภาพโมเดิร์นทันสมัย' : form.bldAge <= 10 ? 'อาคารสภาพดี พร้อมเข้าอยู่' : 'อาคารมือสอง มีความคุ้มค่าด้านพื้นที่'}
              </p>
            </div>
          </div>

          {/* 3. Distance Metrics */}
          <div className="space-y-2 pt-1">
            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              ระยะทางถึงสิ่งอำนวยความสะดวกภายนอก (พิมพ์ตัวเลขหรือเลื่อนสเกลได้อิสระ)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Distance to BTS/MRT */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-700 flex items-center gap-1">
                    <Train className="w-3.5 h-3.5 text-emerald-600" />
                    สถานีรถไฟฟ้า (BTS/MRT)
                  </span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0.01}
                      max={15}
                      step={0.05}
                      value={form.distTran1}
                      onChange={(e) => setForm({ ...form, distTran1: Math.max(0.01, Number(e.target.value)) })}
                      className="w-16 px-1.5 py-0.5 text-xs font-bold text-emerald-700 bg-white border border-slate-300 rounded text-right"
                    />
                    <span className="text-xs font-bold text-emerald-700">กม.</span>
                  </div>
                </div>
                <input
                  id="condo-dist-tran"
                  type="range"
                  min={0.05}
                  max={5.0}
                  step={0.05}
                  value={form.distTran1}
                  onChange={(e) => setForm({ ...form, distTran1: Number(e.target.value) })}
                  className="w-full accent-emerald-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
              </div>

              {/* Distance to Mall/Shop */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-700 flex items-center gap-1">
                    <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />
                    ห้าง / ร้านค้า (dist_shop_1)
                  </span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0.05}
                      max={15}
                      step={0.1}
                      value={form.distShop1}
                      onChange={(e) => setForm({ ...form, distShop1: Math.max(0.01, Number(e.target.value)) })}
                      className="w-16 px-1.5 py-0.5 text-xs font-bold text-amber-700 bg-white border border-slate-300 rounded text-right"
                    />
                    <span className="text-xs font-bold text-slate-700">กม.</span>
                  </div>
                </div>
                <input
                  id="condo-dist-shop"
                  type="range"
                  min={0.1}
                  max={4.0}
                  step={0.1}
                  value={form.distShop1}
                  onChange={(e) => setForm({ ...form, distShop1: Number(e.target.value) })}
                  className="w-full accent-amber-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
              </div>

              {/* Distance to School */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-700 flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                    สถานศึกษา (dist_school_1)
                  </span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0.05}
                      max={15}
                      step={0.1}
                      value={form.distSchool1}
                      onChange={(e) => setForm({ ...form, distSchool1: Math.max(0.01, Number(e.target.value)) })}
                      className="w-16 px-1.5 py-0.5 text-xs font-bold text-blue-700 bg-white border border-slate-300 rounded text-right"
                    />
                    <span className="text-xs font-bold text-slate-700">กม.</span>
                  </div>
                </div>
                <input
                  id="condo-dist-school"
                  type="range"
                  min={0.1}
                  max={5.0}
                  step={0.1}
                  value={form.distSchool1}
                  onChange={(e) => setForm({ ...form, distSchool1: Number(e.target.value) })}
                  className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
              </div>

              {/* Distance to Hospital */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-700 flex items-center gap-1">
                    <HeartPulse className="w-3.5 h-3.5 text-rose-500" />
                    โรงพยาบาล (hospital)
                  </span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0.05}
                      max={20}
                      step={0.1}
                      value={form.hospital}
                      onChange={(e) => setForm({ ...form, hospital: Math.max(0.01, Number(e.target.value)) })}
                      className="w-16 px-1.5 py-0.5 text-xs font-bold text-rose-700 bg-white border border-slate-300 rounded text-right"
                    />
                    <span className="text-xs font-bold text-slate-700">กม.</span>
                  </div>
                </div>
                <input
                  id="condo-dist-hospital"
                  type="range"
                  min={0.2}
                  max={6.0}
                  step={0.1}
                  value={form.hospital}
                  onChange={(e) => setForm({ ...form, hospital: Number(e.target.value) })}
                  className="w-full accent-rose-500 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* 4. Project Scale: Floors & Units */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <label htmlFor="condo-floors-input" className="text-xs font-medium text-slate-600 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                จำนวนชั้นอาคาร (nbr_floors)
              </label>
              <input
                id="condo-floors-input"
                type="number"
                min={4}
                max={60}
                value={form.nbrFloors}
                onChange={(e) => setForm({ ...form, nbrFloors: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium"
              />
              <span className="text-[11px] text-slate-400">
                {form.nbrFloors <= 8 ? 'Low-Rise (ไม่เกิน 8 ชั้น)' : 'High-Rise อาคารสูง'}
              </span>
            </div>

            <div className="space-y-1">
              <label htmlFor="condo-units-input" className="text-xs font-medium text-slate-600 flex items-center gap-1">
                จำนวนยูนิตรวม (units)
              </label>
              <input
                id="condo-units-input"
                type="number"
                min={50}
                max={2500}
                step={10}
                value={form.units}
                onChange={(e) => setForm({ ...form, units: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium"
              />
              <span className="text-[11px] text-slate-400">
                {form.units <= 300 ? 'ยูนิตน้อย มีความเป็นส่วนตัว' : 'โครงการขนาดใหญ่ ค่าส่วนกลางเฉลี่ยประหยัด'}
              </span>
            </div>
          </div>

          {/* 5. Amenities Toggles */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                สิ่งอำนวยความสะดวกในโครงการ (Amenities)
              </span>
              <span className="text-xs text-slate-400">คลิกเพื่อเปิด/ปิด</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { key: 'pool', label: 'สระว่ายน้ำ' },
                { key: 'gym', label: 'ฟิตเนส' },
                { key: 'sauna', label: 'ซาวน่า' },
                { key: 'garden', label: 'สวนหย่อม' },
                { key: 'parking', label: 'ที่จอดรถ' },
                { key: 'elevator', label: 'ลิฟต์โดยสาร' },
                { key: 'security', label: 'รปภ. 24 ชม.' },
                { key: 'cctv', label: 'กล้อง CCTV' },
                { key: 'playground', label: 'สนามเด็กเล่น' },
                { key: 'shop', label: 'ร้านค้าใต้ตึก' },
                { key: 'restaurant', label: 'ร้านอาหาร' },
                { key: 'wifi', label: 'Wifi ส่วนกลาง' },
              ].map(({ key, label }) => {
                const k = key as keyof CondoInputForm;
                const isChecked = !!form[k];
                return (
                  <button
                    key={key}
                    type="button"
                    id={`condo-amenity-${key}`}
                    onClick={() => toggleAmenity(k)}
                    className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium border transition-all ${
                      isChecked
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-800'
                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <span>{label}</span>
                    <CheckCircle2 className={`w-3.5 h-3.5 ${isChecked ? 'text-indigo-600' : 'text-slate-200'}`} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Prediction Result (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Main Price Card - Blue & Navy Theme */}
          <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-slate-900 rounded-3xl p-7 text-white shadow-xl shadow-blue-900/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 translate-x-4 -translate-y-4 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 text-sky-100 backdrop-blur-xs border border-white/20">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                ราคาประเมิน AI (Condo Regression)
              </span>
              <span className="text-xs text-sky-200/90 font-medium">
                {modelResult?.metrics?.r2 != null ? `R² = ${modelResult.metrics.r2.toFixed(4)}` : modelResult ? 'โมเดล ML' : 'สูตรสำรอง'}
              </span>
            </div>

            {/* Price Per Sq.M. */}
            <div>
              <p className="text-xs text-sky-200 uppercase tracking-wider font-medium">ราคาประเมินต่อตารางเมตร</p>
              {!modelResult && modelError && (
                <p className="text-[11px] text-amber-300 mt-1">เชื่อมต่อโมเดล ML ไม่ได้ — กำลังแสดงผลจากสูตรสำรอง</p>
              )}
              {modelResult && modelResult.defaulted_columns.length > 0 && (
                <p className="text-[11px] text-sky-200/80 mt-1">
                  ตัวแปร {modelResult.defaulted_columns.length} ตัวที่ฟอร์มไม่ได้ถาม ใช้ค่ากลางจากข้อมูลจริง
                </p>
              )}
              <div className="flex items-baseline gap-2 mt-1">
                <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white tabular-nums">
                  {prediction.predictedPricePerSqm.toLocaleString()}
                </h3>
                <span className="text-sm font-bold text-sky-200">บาท / ตร.ม.</span>
              </div>
            </div>

            {/* Total Room Price */}
            <div className="mt-4 pt-4 border-t border-white/15">
              <p className="text-xs text-sky-200">
                ราคารวมทั้งห้องชุด (ขนาด <span className="font-bold text-white tabular-nums">{form.roomSizeSqm} ตร.ม.</span>)
              </p>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl sm:text-3xl font-extrabold text-amber-300 tabular-nums">
                  {prediction.totalPriceForSize.toLocaleString()}
                </span>
                <span className="text-sm font-medium text-sky-100">บาท</span>
              </div>
              <p className="text-[11px] text-sky-200/80 mt-1">
                ช่วงราคาโดยประมาณ: {(prediction.lowBound * form.roomSizeSqm / 1000000).toFixed(2)}M - {(prediction.highBound * form.roomSizeSqm / 1000000).toFixed(2)}M บาท
              </p>
            </div>

            {/* Action: Send to Mortgage */}
            <button
              type="button"
              id="condo-send-mortgage-btn"
              onClick={() => onSendToMortgage(prediction.totalPriceForSize)}
              className="mt-6 w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-full bg-white text-blue-900 font-bold text-xs sm:text-sm shadow-md hover:bg-blue-50 transition-all active:scale-[0.98]"
            >
              <DollarSign className="w-4 h-4 text-blue-700" />
              <span>ส่งราคานี้ไปคำนวณค่างวดผ่อนรายเดือน</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Feature Breakdown */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                อิทธิพลของแต่ละปัจจัย (Feature Contribution)
              </h4>
              <span className="text-xs text-slate-400">บาท/ตร.ม.</span>
            </div>
            {modelResult && (
              <p className="text-[11px] text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5">
                รายการนี้เป็นการประมาณคร่าว ๆ จากสูตรเดิมของเว็บ ไม่ใช่การแตกผลจากโมเดลจริง (ราคาด้านบนมาจากโมเดลจริง)
              </p>
            )}

            <div className="space-y-2.5 pt-1">
              {prediction.featureContributions.map((fc) => {
                const isPositive = fc.impact >= 0;
                return (
                  <div key={fc.name} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 last:border-0">
                    <div className="space-y-0.5 pr-2">
                      <p className="font-medium text-slate-700">{fc.name}</p>
                      <p className="text-[11px] text-slate-400">{fc.description}</p>
                    </div>
                    <div className="text-right whitespace-nowrap">
                      <span className={`font-bold ${isPositive ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {isPositive ? '+' : ''}{fc.impact.toLocaleString()} บ./ตร.ม.
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-start gap-1.5 text-[11px] text-slate-400">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
              <span>โมเดลผ่านการเทรนบนชุดข้อมูลคอนโด กทม. 1,019 โครงการ ด้วยอัลกอริทึม Regression Ensemble</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
