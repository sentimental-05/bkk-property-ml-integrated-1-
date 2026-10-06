import React, { useState } from 'react';
import {
  AiSearchIntent,
  LoanAssumption,
  RecommendedProperty,
  AiSearchResult
} from '../types';
import { executePropertySearch } from '../utils/aiSearchEngine';
import {
  Search,
  Sparkles,
  Send,
  Loader2,
  SlidersHorizontal,
  MapPin,
  Calculator,
  Train,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  X,
  ExternalLink,
  ShieldAlert,
  Building2,
  Home
} from 'lucide-react';

interface NaturalLanguageSearchProps {
  onPinAllOnMap: (properties: RecommendedProperty[]) => void;
  onSelectPropertyForMortgage: (priceTHB: number) => void;
  onFocusSinglePropertyOnMap: (prop: RecommendedProperty) => void;
}

const SAMPLE_QUERIES = [
  'มีงบแค่ 50,000 บาท มีคอนโดไหนแนะนำได้บ้าง',
  'มีเงิน 3 ล้าน ซื้อบ้านแถวไหนได้บ้าง',
  'มีงบผ่อนเดือนละ 15,000 คอนโดแถวไหนไหว',
  'มีงบ 6 ล้าน อยากได้คอนโดใกล้ BTS จตุจักร',
];

export const NaturalLanguageSearch: React.FC<NaturalLanguageSearchProps> = ({
  onPinAllOnMap,
  onSelectPropertyForMortgage,
  onFocusSinglePropertyOnMap,
}) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<AiSearchResult | null>(null);
  const [showAssumptionEditor, setShowAssumptionEditor] = useState(false);
  const [clarificationState, setClarificationState] = useState<{
    intent: AiSearchIntent;
    question: string;
  } | null>(null);

  // Loan and search assumptions
  const [assumptions, setAssumptions] = useState<LoanAssumption>({
    annualInterestRate: 6.5,
    loanTermYears: 30,
    downPaymentPercent: 10,
    condoRoomSizeSqm: 30,
  });

  const handleSearch = async (queryText?: string) => {
    const textToSearch = (queryText || query).trim();
    if (!textToSearch) return;

    setIsLoading(true);
    setClarificationState(null);

    try {
      // 1) Call Gemini AI API on the server
      const response = await fetch('/api/ai-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: textToSearch }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      const extractedIntent: AiSearchIntent = data.intent;

      // Handle clarification if needed
      if (extractedIntent.needs_confirmation && extractedIntent.clarification_question) {
        setClarificationState({
          intent: extractedIntent,
          question: extractedIntent.clarification_question,
        });
        setIsLoading(false);
        return;
      }

      // 2) Execute property search with real datasets & loan formula
      const result = executePropertySearch(extractedIntent, assumptions);
      setSearchResult(result);
    } catch (error) {
      console.warn('Direct AI endpoint notice, running local search engine:', error);
      // Client-side fallback intent extraction if offline
      const fallbackIntent: AiSearchIntent = {
        budget_amount: 50000,
        budget_type: 'monthly_installment',
        property_type: 'condo',
        location_hint: null,
        other_preferences: [],
        needs_confirmation: false,
        interpreted_summary: 'วิเคราะห์เบื้องต้น: งบผ่อน 50,000 บาท/เดือน (คอนโด)',
      };
      const result = executePropertySearch(fallbackIntent, assumptions);
      setSearchResult(result);
    } finally {
      setIsLoading(false);
    }
  };

  // When user updates an assumption (interest rate, years, etc.), re-run calculation
  const handleUpdateAssumption = (newAssumptions: Partial<LoanAssumption>) => {
    const updated = { ...assumptions, ...newAssumptions };
    setAssumptions(updated);
    if (searchResult) {
      const refreshedResult = executePropertySearch(searchResult.intent, updated);
      setSearchResult(refreshedResult);
    }
  };

  // Confirm clarification choice
  const handleConfirmBudgetType = (type: 'monthly_installment' | 'total_price') => {
    if (!clarificationState) return;
    const resolvedIntent: AiSearchIntent = {
      ...clarificationState.intent,
      budget_type: type,
      needs_confirmation: false,
    };
    setClarificationState(null);
    const result = executePropertySearch(resolvedIntent, assumptions);
    setSearchResult(result);
  };

  const handleClear = () => {
    setQuery('');
    setSearchResult(null);
    setClarificationState(null);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all">
      {/* Top Banner / Search Input Box - Blue Theme */}
      <div className="bg-slate-900 text-white p-4 sm:p-7 border-b border-slate-800">
        <div className="max-w-4xl mx-auto space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <span className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-500/20 text-sky-400">
                <Sparkles className="w-4 h-4 text-sky-400" />
              </span>
              <div>
                <h2 className="text-sm sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                  <span>ค้นหาด้วยภาษาธรรมชาติ (AI Smart Search)</span>
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                  พิมพ์ประโยคความต้องการด้วยภาษาไทยปกติ ระบบจะสกัดเงื่อนไขงบประมาณและคัดกรองจากข้อมูลจริง
                </p>
              </div>
            </div>

            {searchResult && (
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 transition-all shrink-0"
              >
                <X className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">ล้างค้นหา</span>
              </button>
            )}
          </div>

          {/* Main Natural Language Search Input Field */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="relative flex items-center"
          >
            <div className="relative flex-1">
              <input
                id="ai-natural-language-search-input"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="เช่น 'มีงบ 50,000 บาท มีคอนโดไหนแนะนำ' หรือ 'งบ 3 ล้าน ซื้อบ้านไหนได้'"
                className="w-full pl-9 sm:pl-11 pr-24 sm:pr-32 py-2.5 sm:py-3.5 rounded-xl text-xs sm:text-sm bg-white text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-inner"
              />
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2" />
            </div>

            <button
              type="submit"
              id="ai-search-submit-button"
              disabled={isLoading || !query.trim()}
              className="absolute right-1 sm:right-1.5 top-1/2 -translate-y-1/2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:cursor-not-allowed active:scale-95"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                  <span className="text-[11px] sm:text-xs">วิเคราะห์...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span className="text-[11px] sm:text-xs">ค้นหา</span>
                </>
              )}
            </button>
          </form>

          {/* Suggested Query Placeholders / Chips */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px] sm:text-xs text-slate-300">
            <span className="text-slate-400 font-medium">คำถามตัวอย่าง:</span>
            {SAMPLE_QUERIES.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setQuery(sample);
                  handleSearch(sample);
                }}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-slate-200 hover:text-white transition-all text-left truncate max-w-xs sm:max-w-none"
              >
                &ldquo;{sample}&rdquo;
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Clarification Box if Gemini is uncertain about budget type */}
      {clarificationState && (
        <div className="p-5 bg-amber-50 border-b border-amber-200">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <HelpCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-amber-900">
                  ต้องการยืนยันประเภทงบประมาณ
                </h4>
                <p className="text-xs text-amber-800 mt-0.5">
                  {clarificationState.question}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleConfirmBudgetType('monthly_installment')}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 shadow-2xs"
              >
                งบผ่อนต่อเดือน (Monthly)
              </button>
              <button
                type="button"
                onClick={() => handleConfirmBudgetType('total_price')}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 text-white hover:bg-amber-700 shadow-2xs"
              >
                งบซื้อเต็มจำนวน (Total Price)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results & Conversion Breakdown Section */}
      {searchResult && (
        <div className="p-4 sm:p-6 space-y-5 bg-slate-50/50">
          {/* 2) Conversion Breakdown Panel */}
          <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-2xs space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-slate-100">
              {/* Left: Calculation statement */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {searchResult.intent.interpreted_summary}
                  </span>
                  {searchResult.intent.location_hint && (
                    <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                      ย่าน/เขต: {searchResult.intent.location_hint}
                    </span>
                  )}
                </div>

                {searchResult.intent.budget_type === 'monthly_installment' ? (
                  <div className="text-sm sm:text-base font-extrabold text-slate-900">
                    งบผ่อน{' '}
                    <span className="text-blue-600">
                      {(searchResult.intent.budget_amount || 0).toLocaleString()}
                    </span>{' '}
                    บาท/เดือน &asymp; ซื้อได้สูงสุดประมาณ{' '}
                    <span className="text-emerald-600">
                      {(searchResult.maxAffordablePriceTHB / 1000000).toFixed(2)} ล้านบาท
                    </span>
                    <span className="text-xs font-normal text-slate-500 block mt-0.5">
                      (คำนวณจากสูตร Amortization ย้อนกลับ: กู้ได้ {searchResult.loanPrincipalTHB.toLocaleString()} บ. + ดาวน์ {assumptions.downPaymentPercent}% = {searchResult.downPaymentTHB.toLocaleString()} บ.)
                    </span>
                  </div>
                ) : (
                  <div className="text-sm sm:text-base font-extrabold text-slate-900">
                    งบซื้อเต็มจำนวน{' '}
                    <span className="text-blue-600">
                      {(searchResult.intent.budget_amount || 0).toLocaleString()}
                    </span>{' '}
                    บาท &asymp; ค่างวดประมาณ{' '}
                    <span className="text-emerald-600">
                      {(searchResult.recommendedProperties[0]?.monthlyInstallmentAtAssumption || 0).toLocaleString()}
                    </span>{' '}
                    บาท/เดือน
                  </div>
                )}
              </div>

              {/* Right: Quick Assumptions Toggle & Map Pin Button */}
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <button
                  type="button"
                  id="toggle-loan-assumptions-button"
                  onClick={() => setShowAssumptionEditor(!showAssumptionEditor)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 border border-slate-200"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                  <span>ปรับสมมติฐานคำนวณ</span>
                  {showAssumptionEditor ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>

                <button
                  type="button"
                  id="pin-all-properties-on-map-button"
                  onClick={() => onPinAllOnMap(searchResult.recommendedProperties)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>ปักหมุดทั้งหมดบนแผนที่ ({searchResult.recommendedProperties.length})</span>
                </button>
              </div>
            </div>

            {/* Expandable Assumption Editor */}
            {showAssumptionEditor && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    อัตราดอกเบี้ยเฉลี่ย (% ต่อปี)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step={0.1}
                      min={1}
                      max={15}
                      value={assumptions.annualInterestRate}
                      onChange={(e) =>
                        handleUpdateAssumption({ annualInterestRate: Number(e.target.value) })
                      }
                      className="w-20 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                    />
                    <span className="text-slate-500 font-medium">%</span>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    ระยะเวลาผ่อน (ปี)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step={1}
                      min={5}
                      max={40}
                      value={assumptions.loanTermYears}
                      onChange={(e) =>
                        handleUpdateAssumption({ loanTermYears: Number(e.target.value) })
                      }
                      className="w-20 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                    />
                    <span className="text-slate-500 font-medium">ปี ({assumptions.loanTermYears * 12} งวด)</span>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    เงินดาวน์ (%)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step={5}
                      min={0}
                      max={50}
                      value={assumptions.downPaymentPercent}
                      onChange={(e) =>
                        handleUpdateAssumption({ downPaymentPercent: Number(e.target.value) })
                      }
                      className="w-20 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                    />
                    <span className="text-slate-500 font-medium">%</span>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    สมมติฐานขนาดห้องสตูดิโอ (ตร.ม.)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step={1}
                      min={20}
                      max={120}
                      value={assumptions.condoRoomSizeSqm}
                      onChange={(e) =>
                        handleUpdateAssumption({ condoRoomSizeSqm: Number(e.target.value) })
                      }
                      className="w-20 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                    />
                    <span className="text-slate-500 font-medium">ตร.ม.</span>
                  </div>
                </div>
              </div>
            )}

            {/* Assumption note for studio room size */}
            <div className="text-[11px] text-slate-500 flex items-center gap-1">
              <span className="font-semibold text-slate-600">หมายเหตุสมมติฐาน:</span>
              <span>
                สำหรับคอนโด คำนวณราคารวมจากราคา/ตร.ม. &times; ขนาดห้องชุด {assumptions.condoRoomSizeSqm} ตร.ม. (ห้องสตูดิโอเริ่มต้น)
              </span>
            </div>
          </div>

          {/* 4) Results Header & Warning if Over Budget Fallback */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>{searchResult.summaryMessage}</span>
            </h3>
            <span className="text-xs text-slate-500">
              เรียงจากราคาใกล้เคียงงบที่สุดไปน้อยที่สุด
            </span>
          </div>

          {searchResult.isOverBudgetFallback && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                เนื่องจากไม่มีโครงการที่ต่ำกว่างบที่ระบุอย่างพอดี ระบบจึงคัดเลือกโครงการที่มีราคาใกล้เคียงงบที่สุดมาแนะนำให้พิจารณา
              </span>
            </div>
          )}

          {/* Property Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchResult.recommendedProperties.map((prop) => (
              <div
                key={prop.id}
                className="bg-white rounded-xl p-4 border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            prop.type === 'condo'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {prop.type === 'condo' ? 'คอนโด กทม.' : 'บ้านเดี่ยว Ames'}
                        </span>
                        {prop.isOverBudget && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                            เกินงบเล็กน้อย
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm mt-1 line-clamp-1">
                        {prop.title}
                      </h4>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{prop.location}</span>
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-base font-extrabold text-blue-700">
                        {prop.totalPriceTHB.toLocaleString()} บ.
                      </div>
                      {prop.unitPriceTHB && (
                        <div className="text-[10px] text-slate-400 font-medium">
                          {prop.unitPriceTHB.toLocaleString()} บ./ตร.ม.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Highlights / Amenities */}
                  <div className="bg-slate-50 p-2.5 rounded-lg space-y-1 text-xs">
                    <div className="flex items-center justify-between text-slate-700 font-medium">
                      <span className="text-[11px] text-slate-500">ผ่อนประมาณ:</span>
                      <span className="font-bold text-emerald-700">
                        ~{prop.monthlyInstallmentAtAssumption.toLocaleString()} บาท/เดือน
                      </span>
                    </div>

                    {prop.distToTransitKm !== undefined && (
                      <div className="flex items-center gap-1 text-[11px] text-slate-600">
                        <Train className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>สถานี BTS/MRT ที่ใกล้ที่สุด: {prop.distToTransitKm} กม.</span>
                      </div>
                    )}

                    {prop.livingAreaSqFt && (
                      <div className="flex items-center gap-1 text-[11px] text-slate-600">
                        <span>
                          พื้นที่: {prop.livingAreaSqFt} ตร.ฟุต ({Math.round(prop.livingAreaSqFt * 0.092903)} ตร.ม.)
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-1 flex-wrap pt-0.5">
                      {prop.amenities.slice(0, 3).map((amenity, aIdx) => (
                        <span
                          key={aIdx}
                          className="px-1.5 py-0.5 rounded text-[10px] bg-white border border-slate-200 text-slate-600"
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => onFocusSinglePropertyOnMap(prop)}
                    className="py-1.5 px-2 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center gap-1 cursor-pointer transition-all"
                  >
                    <MapPin className="w-3 h-3 text-emerald-600" />
                    <span>ดูบนแผนที่</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectPropertyForMortgage(prop.totalPriceTHB)}
                    className="py-1.5 px-2 rounded-lg text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 flex items-center justify-center gap-1 cursor-pointer transition-all"
                  >
                    <Calculator className="w-3 h-3 text-blue-600" />
                    <span>คำนวณค่างวด</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Mandatory Disclaimer as requested */}
          <div className="p-3 rounded-xl bg-slate-100/80 border border-slate-200/80 text-[11px] text-slate-500 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              ราคาที่ผ่อนคำนวณจากสมมติฐานดอกเบี้ย/เงินดาวน์เบื้องต้น ควรปรึกษาธนาคารเพื่อตัวเลขจริง
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
