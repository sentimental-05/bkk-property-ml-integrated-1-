import React, { useState } from 'react';
import { PropertyMode } from '../types';
import { HOUSE_MODEL_METRICS, CONDO_MODEL_METRICS } from '../data/modelEvaluation';
import {
  BarChart3,
  CheckCircle2,
  TrendingUp,
  Cpu,
  Database,
  Layers,
  Sparkles,
  ArrowUpRight,
  HelpCircle,
  BarChart2,
  FileSpreadsheet
} from 'lucide-react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
  Line
} from 'recharts';

interface ModelDashboardProps {
  currentMode: PropertyMode;
  onModeChange: (mode: PropertyMode) => void;
}

export const ModelDashboard: React.FC<ModelDashboardProps> = ({
  currentMode,
  onModeChange,
}) => {
  const [activeModelTab, setActiveModelTab] = useState<PropertyMode>(currentMode);

  const metrics = activeModelTab === 'house' ? HOUSE_MODEL_METRICS : CONDO_MODEL_METRICS;

  const scatterData = metrics.validationPoints.map((pt) => ({
    actual: Math.round(pt.actual),
    predicted: Math.round(pt.predicted),
    name: pt.name || 'Sample',
  }));

  const maxVal = Math.max(
    ...scatterData.map((d) => Math.max(d.actual, d.predicted))
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-violet-700 font-semibold text-sm mb-1">
            <Cpu className="w-4 h-4" />
            <span>กระบวนการ CRISP-DM & การประเมินผลโมเดล Machine Learning</span>
          </div>
          <p className="text-slate-600 text-sm">
            การวัดประสิทธิภาพโมเดล Random Forest และ Regression Ensemble ตามมาตรฐาน Cross-Industry Standard Process for Data Mining
          </p>
        </div>

        {/* Model Selector Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            type="button"
            id="dashboard-switch-house"
            onClick={() => setActiveModelTab('house')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeModelTab === 'house'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            โมเดลบ้านเดี่ยว (1,460 หลัง)
          </button>
          <button
            type="button"
            id="dashboard-switch-condo"
            onClick={() => setActiveModelTab('condo')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeModelTab === 'condo'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            โมเดลคอนโด กทม. (1,019 โครงการ)
          </button>
        </div>
      </div>

      {/* 4 Performance Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* R-Squared */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
            <span>สัมประสิทธิ์การตัดสินใจ (R²)</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              {(metrics.r2 * 100).toFixed(1)}%
            </span>
            <span className="text-xs font-semibold text-emerald-600">
              (R² = {metrics.r2})
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            อธิบายความแปรปรวนของราคาได้ถึง {(metrics.r2 * 100).toFixed(1)}% แสดงถึงความแม่นยำสูง
          </p>
        </div>

        {/* MAE */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
            <span>ค่าความคลาดเคลื่อนเฉลี่ย (MAE)</span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-slate-900">
              {metrics.mae.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-slate-500">
              {metrics.unit}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Mean Absolute Error บนชุดข้อมูลทดสอบ 20% (Test Set)
          </p>
        </div>

        {/* RMSE */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
            <span>Root Mean Squared Error (RMSE)</span>
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <BarChart3 className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-slate-900">
              {metrics.rmse.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-slate-500">
              {metrics.unit}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            ความคลาดเคลื่อนกำลังสองเฉลี่ย สะท้อน Outlier ได้ดี
          </p>
        </div>

        {/* Train / Test Split */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
            <span>สัดส่วนชุดข้อมูล (Data Split)</span>
            <span className="p-1.5 rounded-lg bg-violet-50 text-violet-600">
              <Database className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              80% / 20%
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-600 mt-2">
            <span>Train: <b>{metrics.trainCount}</b></span>
            <span>&bull;</span>
            <span>Test: <b>{metrics.testCount}</b></span>
          </div>
        </div>
      </div>

      {/* Two Analytical Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Actual vs Predicted Scatter Chart */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-violet-600" />
                กราฟเปรียบเทียบราคาจริง vs ราคาทำนาย (Actual vs Predicted)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                จุดยิ่งเกาะแนวเส้นทแยงมุม ยิ่งสะท้อนความแม่นยำของโมเดล
              </p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
              100 จุดทดสอบ
            </span>
          </div>

          <div className="h-[320px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  type="number"
                  dataKey="actual"
                  name="ราคาจริง"
                  tickFormatter={(v) =>
                    activeModelTab === 'house'
                      ? `${(v / 1000000).toFixed(1)}M`
                      : `${Math.round(v / 1000)}k`
                  }
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  label={{
                    value: `ราคาจริง (${metrics.unit})`,
                    position: 'insideBottom',
                    offset: -10,
                    fontSize: 11,
                    fill: '#64748b',
                  }}
                />
                <YAxis
                  type="number"
                  dataKey="predicted"
                  name="ราคาทำนาย"
                  tickFormatter={(v) =>
                    activeModelTab === 'house'
                      ? `${(v / 1000000).toFixed(1)}M`
                      : `${Math.round(v / 1000)}k`
                  }
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  label={{
                    value: `ราคาทำนาย (${metrics.unit})`,
                    angle: -90,
                    position: 'insideLeft',
                    fontSize: 11,
                    fill: '#64748b',
                  }}
                />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ payload }) => {
                    if (!payload || !payload[0]) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-white p-3 rounded-xl shadow-lg border border-slate-200 text-xs space-y-1">
                        <p className="font-bold text-slate-800">{d.name}</p>
                        <p className="text-slate-600">
                          ราคาจริง: <span className="font-semibold text-slate-900">{d.actual.toLocaleString()} {metrics.unit}</span>
                        </p>
                        <p className="text-slate-600">
                          ราคาทำนาย: <span className="font-semibold text-blue-600">{d.predicted.toLocaleString()} {metrics.unit}</span>
                        </p>
                        <p className="text-slate-400 text-[10px]">
                          ส่วนต่าง: {Math.abs(d.actual - d.predicted).toLocaleString()} {metrics.unit}
                        </p>
                      </div>
                    );
                  }}
                />
                <Scatter
                  name="Validation Samples"
                  data={scatterData}
                  fill={activeModelTab === 'house' ? '#2563eb' : '#4f46e5'}
                  fillOpacity={0.7}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Feature Importance Ranking */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                การจัดอันดับความสำคัญของตัวแปร (Feature Importance)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                สัดส่วนอิทธิพลที่ส่งผลต่อการกำหนดราคาในโมเดล
              </p>
            </div>
            <span className="text-xs text-slate-400">Random Forest Weights</span>
          </div>

          <div className="h-[320px] w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={metrics.featureImportances}
                margin={{ top: 10, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis
                  type="number"
                  tickFormatter={(v) => `${Math.round(v * 100)}%`}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                />
                <YAxis
                  type="category"
                  dataKey="feature"
                  tick={{ fontSize: 11, fill: '#475569' }}
                  width={90}
                />
                <Tooltip
                  formatter={(val: number, _, item) => [
                    `${(val * 100).toFixed(1)}%`,
                    item.payload.thaiName,
                  ]}
                  contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="importance" radius={[0, 6, 6, 0]}>
                  {metrics.featureImportances.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        index === 0
                          ? '#2563eb'
                          : index === 1
                          ? '#3b82f6'
                          : index === 2
                          ? '#60a5fa'
                          : '#93c5fd'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* CRISP-DM Methodology Walkthrough Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-violet-600" />
            ขั้นตอนการพัฒนาโมเดลตามกรอบ CRISP-DM Framework
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Cross-Industry Standard Process for Data Mining ครบทั้ง 6 ขั้นตอน
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          {/* 1. Business Understanding */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px]">1</span>
              <span>1. Business Understanding</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              กำหนดเป้าหมายเพื่อสร้างเครื่องมือประเมินราคากลางอสังหาริมทรัพย์ที่โปร่งใสและแม่นยำ ให้ผู้ซื้อ ผู้ขาย และนักลงทุนสามารถประเมินมูลค่าบ้านเดี่ยวและคอนโดมิเนียมได้ทันที
            </p>
          </div>

          {/* 2. Data Understanding */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px]">2</span>
              <span>2. Data Understanding</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              สำรวจสถิติราคา: ข้อมูลบ้าน 1,460 หลัง (SalePrice_THB ค่าเฉลี่ย ~5.9 ล้านบาท) และคอนโด กทม. 1,019 โครงการ 42 เขต (price_sqm ค่าเฉลี่ย ~96,500 บาท/ตร.ม.) พร้อมพิกัดจริง
            </p>
          </div>

          {/* 3. Data Preparation */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px]">3</span>
              <span>3. Data Preparation</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              จัดการ Missing Values: ตัวแปรกลุ่ม NA แทนด้วย 'None' และตัวเลขแทนด้วย Median ทำ One-Hot Encoding ให้กับ Neighborhood และ District พร้อมปรับสเกลข้อมูลตัวแปรระยะทาง
            </p>
          </div>

          {/* 4. Modeling */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px]">4</span>
              <span>4. Modeling</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              ใช้ Random Forest Regression และ Ensemble Learning แบ่งชุดข้อมูล Training 80% และ Test 20% เพื่อป้องกัน Overfitting และจับความสัมพันธ์แบบ Non-linear ของตัวแปรสิ่งอำนวยความสะดวก
            </p>
          </div>

          {/* 5. Evaluation */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px]">5</span>
              <span>5. Evaluation</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              วัดผลด้วย MAE, RMSE และ R-Squared: โมเดลบ้านได้ R² = 93.3% (MAE 580,455 บาท) และโมเดลคอนโดได้ R² = 83.1% (MAE 16,621 บาท/ตร.ม.) พร้อมวิเคราะห์จุดตกบนกราฟ Scatter
            </p>
          </div>

          {/* 6. Deployment */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px]">6</span>
              <span>6. Deployment</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Deploy บน Web Application ด้วย React และ Tailwind CSS รองรับการทำนายราคาแบบเรียลไทม์ แผนที่ Interactive ปักหมุดตามพิกัดจริง และเครื่องคำนวณค่างวดผ่อนรายเดือน
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
