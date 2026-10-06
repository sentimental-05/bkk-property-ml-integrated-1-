import React, { useState, useMemo, useEffect } from 'react';
import {
  calculateMortgage,
  calculateAffordabilityFromBudget,
  calculatePayoffFromCustomMonthly,
} from '../utils/mlEngine';
import { CONDOS_DATA } from '../data/condosData';
import {
  Calculator,
  DollarSign,
  Percent,
  Calendar,
  Wallet,
  ShieldCheck,
  TrendingDown,
  PieChart as PieIcon,
  RotateCcw,
  Sparkles,
  Search,
  Building2,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Zap,
  Clock,
  ChevronRight,
  MapPin,
  TrendingUp,
  Tag
} from 'lucide-react';

interface MortgageCalculatorProps {
  initialPrice?: number;
  onViewOnMap?: (district: string) => void;
}

export const MortgageCalculator: React.FC<MortgageCalculatorProps> = ({
  initialPrice = 3500000,
  onViewOnMap,
}) => {
  // Main Tab in Calculator: 'standard' | 'budget_finder' | 'early_payoff'
  const [activeSubTab, setActiveSubTab] = useState<'standard' | 'budget_finder' | 'early_payoff'>('budget_finder');

  // --- Standard Parameters (Free-text editable) ---
  const [propertyPrice, setPropertyPrice] = useState<number>(initialPrice);
  const [downPaymentAmount, setDownPaymentAmount] = useState<number>(() => Math.round(initialPrice * 0.2));
  const [interestRate, setInterestRate] = useState<number>(3.5);
  const [loanYears, setLoanYears] = useState<number>(30);

  // Sync if initialPrice changes externally
  useEffect(() => {
    if (initialPrice > 0) {
      setPropertyPrice(initialPrice);
      setDownPaymentAmount(Math.round(initialPrice * 0.2));
    }
  }, [initialPrice]);

  // Down payment percentage calculated from amount
  const downPaymentPercent = propertyPrice > 0
    ? Number(((downPaymentAmount / propertyPrice) * 100).toFixed(1))
    : 20;

  // Handle when user edits down payment %
  const handleDownPercentChange = (pct: number) => {
    setDownPaymentAmount(Math.round((propertyPrice * pct) / 100));
  };

  // Handle when user edits down payment amount in Baht directly
  const handleDownAmountChange = (amt: number) => {
    setDownPaymentAmount(Math.max(0, Math.min(amt, propertyPrice)));
  };

  const loanAmount = Math.max(0, propertyPrice - downPaymentAmount);

  // Standard Loan Amortization
  const standardMortgage = useMemo(() => {
    return calculateMortgage(loanAmount, Math.max(0.01, interestRate), Math.max(1, loanYears));
}, [loanAmount, interestRate, loanYears]);

  // Recommended minimum income (DSR <= 40%)
  const minRequiredIncome = Math.round(standardMortgage.monthlyPayment / 0.4);

  const principalPercent = standardMortgage.totalPayment > 0
    ? Math.round((loanAmount / standardMortgage.totalPayment) * 100)
    : 100;
  const interestPercent = 100 - principalPercent;

  // --- Budget Finder State (e.g. 50,000 Baht/month or 50,000 Baht/sqm) ---
  const [budgetType, setBudgetType] = useState<'monthly' | 'sqm' | 'total'>('monthly');
  const [customerBudget, setCustomerBudget] = useState<number>(50000); // Default 50,000 THB as requested!
  const [budgetDownPercent, setBudgetDownPercent] = useState<number>(20);
  const [budgetYears, setBudgetYears] = useState<number>(30);
  const [budgetInterest, setBudgetInterest] = useState<number>(3.5);
  const [roomSizeEstimate, setRoomSizeEstimate] = useState<number>(35); // standard 35 sq.m.

  // Affordability calculation
  const affordability = useMemo(() => {
    if (budgetType === 'monthly') {
      return calculateAffordabilityFromBudget(customerBudget, budgetInterest, budgetYears, budgetDownPercent);
    } else if (budgetType === 'sqm') {
      // Budget is price per sqm (e.g. 50,000 THB/sqm)
      const maxPrice = customerBudget * roomSizeEstimate;
      const loan = Math.round(maxPrice * (1 - budgetDownPercent / 100));
      return {
        maxLoan: loan,
        maxPropertyPrice: maxPrice,
        requiredDownPayment: maxPrice - loan,
        totalMonths: budgetYears * 12,
        monthlyBudget: calculateMortgage(loan, budgetInterest, budgetYears).monthlyPayment,
      };
    } else {
      // Total price budget
      const loan = Math.round(customerBudget * (1 - budgetDownPercent / 100));
      return {
        maxLoan: loan,
        maxPropertyPrice: customerBudget,
        requiredDownPayment: customerBudget - loan,
        totalMonths: budgetYears * 12,
        monthlyBudget: calculateMortgage(loan, budgetInterest, budgetYears).monthlyPayment,
      };
    }
  }, [budgetType, customerBudget, budgetInterest, budgetYears, budgetDownPercent, roomSizeEstimate]);

  // Condos matching this budget
  const matchingCondos = useMemo(() => {
    const targetMaxTotal = affordability.maxPropertyPrice;
    const targetMaxSqm = budgetType === 'sqm'
      ? customerBudget
      : Math.round(targetMaxTotal / roomSizeEstimate);

    return CONDOS_DATA.filter((c) => {
      if (budgetType === 'sqm') {
        return c.priceSqm <= customerBudget * 1.1; // allow up to 10% tolerance for options
      }
      const roomTotal = c.priceSqm * roomSizeEstimate;
      return roomTotal <= targetMaxTotal;
    })
      .sort((a, b) => b.priceSqm - a.priceSqm) // highest quality within budget
      .slice(0, 12);
  }, [affordability.maxPropertyPrice, budgetType, customerBudget, roomSizeEstimate]);

  // --- Early Payoff State (e.g. Customer pays 50,000 THB/month on loan) ---
  const [customMonthlyPayment, setCustomMonthlyPayment] = useState<number>(50000);
  const payoffResult = useMemo(() => {
    return calculatePayoffFromCustomMonthly(loanAmount, interestRate, customMonthlyPayment);
  }, [loanAmount, interestRate, customMonthlyPayment]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Sub Tabs */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-700 font-semibold text-sm mb-1">
            <Calculator className="w-4 h-4" />
            <span>ระบบคำนวณสินเชื่อและค้นหาตามงบประมาณ (Smart Mortgage & Budget Planner)</span>
          </div>
          <p className="text-slate-600 text-sm">
            แก้ไขตัวเลขงบประมาณได้อย่างอิสระ ค้นหาคอนโดที่ซื้อได้ และจำลองแผนผ่อนจบกี่งวด งวดละกี่บาท
          </p>
        </div>

        {/* Sub-Tabs Switcher - Mobile Optimized */}
        <div className="flex overflow-x-auto no-scrollbar bg-slate-100 p-1 rounded-xl border border-slate-200 w-full md:w-auto shrink-0">
          <button
            type="button"
            id="subtab-budget-finder"
            onClick={() => setActiveSubTab('budget_finder')}
            className={`flex-1 md:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
              activeSubTab === 'budget_finder'
                ? 'bg-white text-blue-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>ค้นหาตามงบ (Budget)</span>
          </button>
          <button
            type="button"
            id="subtab-standard"
            onClick={() => setActiveSubTab('standard')}
            className={`flex-1 md:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
              activeSubTab === 'standard'
                ? 'bg-white text-blue-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5 text-blue-600" />
            <span>คำนวณค่างวด</span>
          </button>
          <button
            type="button"
            id="subtab-early-payoff"
            onClick={() => setActiveSubTab('early_payoff')}
            className={`flex-1 md:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
              activeSubTab === 'early_payoff'
                ? 'bg-white text-emerald-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-emerald-600" />
            <span>แผนโปะจบเร็ว</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: BUDGET FINDER (ลูกค้ามีงบ X บาท จะมีคอนโดที่ไหนบ้าง ผ่อนกี่งวด งวดละกี่บาท) */}
      {/* ========================================================================= */}
      {activeSubTab === 'budget_finder' && (
        <div className="space-y-6">
          {/* Main Budget Input & Summary Hero */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Box: Budget Input Controls (5 cols) */}
            <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <Tag className="w-5 h-5 text-amber-600" />
                  ระบุงบประมาณของลูกค้า (Custom Budget Input)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  พิมพ์ตัวเลขได้อย่างอิสระ เช่น 50,000 บาท/เดือน หรือ 50,000 บาท/ตร.ม.
                </p>
              </div>

              {/* Budget Type Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">รูปแบบงบประมาณ:</label>
                <div className="grid grid-cols-3 gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setBudgetType('monthly');
                      setCustomerBudget(50000);
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                      budgetType === 'monthly'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    งบผ่อน/เดือน
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBudgetType('sqm');
                      setCustomerBudget(65000);
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                      budgetType === 'sqm'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    งบ/ตร.ม.
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBudgetType('total');
                      setCustomerBudget(3500000);
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                      budgetType === 'total'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    งบราคารวม
                  </button>
                </div>
              </div>

              {/* Free-text Numeric Budget Input */}
              <div className="space-y-2 bg-amber-50/50 p-4 rounded-xl border border-amber-200">
                <div className="flex items-center justify-between">
                  <label htmlFor="budget-amount-input" className="text-xs font-bold text-slate-800">
                    {budgetType === 'monthly'
                      ? 'งบผ่อนต่อเดือนที่สะดวก (บาท/เดือน)'
                      : budgetType === 'sqm'
                      ? 'งบประมาณราคาต่อตารางเมตร (บาท/ตร.ม.)'
                      : 'งบประมาณซื้ออสังหาฯ รวม (บาท)'}
                  </label>
                  <span className="text-xs font-black text-amber-800">
                    {customerBudget.toLocaleString()} บาท
                  </span>
                </div>

                <div className="relative">
                  <input
                    id="budget-amount-input"
                    type="number"
                    min={1000}
                    step={1000}
                    value={customerBudget}
                    onChange={(e) => setCustomerBudget(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3.5 py-2.5 rounded-xl border-2 border-amber-300 bg-white text-slate-900 font-black text-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden pr-20"
                    placeholder="พิมพ์ตัวเลขงบ เช่น 50000"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-700">
                    {budgetType === 'monthly' ? 'บ./เดือน' : budgetType === 'sqm' ? 'บ./ตร.ม.' : 'บาท'}
                  </span>
                </div>

                {/* Quick Budget Presets */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[11px] text-slate-500">เลือกเร็ว:</span>
                  {budgetType === 'monthly' ? (
                    <>
                      {[15000, 25000, 35000, 50000, 80000].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setCustomerBudget(val)}
                          className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border transition-colors ${
                            customerBudget === val
                              ? 'bg-amber-600 text-white border-amber-700'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {val.toLocaleString()} บ.
                        </button>
                      ))}
                    </>
                  ) : budgetType === 'sqm' ? (
                    <>
                      {[45000, 60000, 80000, 100000, 150000].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setCustomerBudget(val)}
                          className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border transition-colors ${
                            customerBudget === val
                              ? 'bg-amber-600 text-white border-amber-700'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {val.toLocaleString()} บ.
                        </button>
                      ))}
                    </>
                  ) : (
                    <>
                      {[2000000, 3500000, 5000000, 7500000, 10000000].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setCustomerBudget(val)}
                          className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border transition-colors ${
                            customerBudget === val
                              ? 'bg-amber-600 text-white border-amber-700'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {(val / 1000000).toFixed(1)}M
                        </button>
                      ))}
                    </>
                  )}
                </div>
              </div>

              {/* Secondary Parameters (Freely Editable) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Loan Term */}
                <div className="space-y-1">
                  <label htmlFor="budget-term-input" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    ระยะเวลาผ่อน (ปี)
                  </label>
                  <input
                    id="budget-term-input"
                    type="number"
                    min={5}
                    max={40}
                    value={budgetYears}
                    onChange={(e) => setBudgetYears(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-800"
                  />
                  <span className="text-[11px] text-slate-400">
                    = {budgetYears * 12} งวด
                  </span>
                </div>

                {/* Interest Rate */}
                <div className="space-y-1">
                  <label htmlFor="budget-rate-input" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Percent className="w-3.5 h-3.5 text-slate-400" />
                    ดอกเบี้ยต่อปี (%)
                  </label>
                  <input
                    id="budget-rate-input"
                    type="number"
                    min={0.1}
                    max={15}
                    step={0.1}
                    value={budgetInterest}
                    onChange={(e) => setBudgetInterest(Math.max(0.1, Number(e.target.value)))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-800"
                  />
                  <span className="text-[11px] text-slate-400">
                    อัตราดอกเบี้ยเฉลี่ยธนาคาร
                  </span>
                </div>

                {/* Down Payment % */}
                <div className="space-y-1">
                  <label htmlFor="budget-down-input" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Wallet className="w-3.5 h-3.5 text-slate-400" />
                    เงินดาวน์ (%)
                  </label>
                  <input
                    id="budget-down-input"
                    type="number"
                    min={0}
                    max={80}
                    value={budgetDownPercent}
                    onChange={(e) => setBudgetDownPercent(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-800"
                  />
                  <span className="text-[11px] text-slate-400">
                    กู้ {100 - budgetDownPercent}%
                  </span>
                </div>

                {/* Sample Room Size */}
                <div className="space-y-1">
                  <label htmlFor="budget-room-size-input" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    ขนาดห้องตัวอย่าง (ตร.ม.)
                  </label>
                  <input
                    id="budget-room-size-input"
                    type="number"
                    min={20}
                    max={200}
                    value={roomSizeEstimate}
                    onChange={(e) => setRoomSizeEstimate(Math.max(10, Number(e.target.value)))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-800"
                  />
                  <span className="text-[11px] text-slate-400">
                    คำนวณห้อง 1-2 Bed
                  </span>
                </div>
              </div>
            </div>

            {/* Right Box: Affordability & Installment Plan Result (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              {/* Hero Result Banner: ผ่อนกี่งวด งวดละกี่บาท */}
              <div className="bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900 rounded-2xl p-6 text-white shadow-xl shadow-amber-950/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 translate-x-4 -translate-y-4 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none" />

                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-amber-100 backdrop-blur-xs border border-white/25">
                    <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                    แผนการผ่อนและวงเงินที่ซื้อได้ (Affordability Summary)
                  </span>
                  <span className="text-xs text-amber-200">ดอกเบี้ย {budgetInterest}%</span>
                </div>

                {/* Main Q&A Answer: ผ่อนจบกี่งวด งวดละกี่บาท */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-2">
                  <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/15">
                    <p className="text-xs text-amber-200 font-medium">ผ่อนชำระทั้งหมด:</p>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="text-3xl sm:text-4xl font-black text-white">
                        {affordability.totalMonths}
                      </span>
                      <span className="text-lg font-bold text-amber-200">งวด ({budgetYears} ปี)</span>
                    </div>
                    <p className="text-[11px] text-amber-200/80 mt-1">
                      ผ่อนสม่ำเสมอทุกสิ้นเดือนตามสัญญา
                    </p>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/15">
                    <p className="text-xs text-amber-200 font-medium">ค่างวดต่อเดือน:</p>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="text-3xl sm:text-4xl font-black text-amber-300">
                        {affordability.monthlyBudget.toLocaleString()}
                      </span>
                      <span className="text-lg font-bold text-amber-200">บาท / งวด</span>
                    </div>
                    <p className="text-[11px] text-amber-200/80 mt-1">
                      (แนะนำรายได้ขั้นต่ำ ~{Math.round(affordability.monthlyBudget / 0.4).toLocaleString()} บ./ด.)
                    </p>
                  </div>
                </div>

                {/* Max Property Price */}
                <div className="mt-4 pt-4 border-t border-white/15 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                  <div>
                    <span className="text-xs text-amber-200">วงเงินราคาคอนโด/อสังหาฯ สูงสุดที่ซื้อได้:</span>
                    <div className="text-2xl sm:text-3xl font-extrabold text-white">
                      {affordability.maxPropertyPrice.toLocaleString()} บาท
                      <span className="text-xs text-amber-200 font-normal ml-2">
                        (~{(affordability.maxPropertyPrice / 1000000).toFixed(2)} ล้านบาท)
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-amber-200/90 text-left sm:text-right">
                    <div>วงเงินกู้ธนาคาร: <b>{affordability.maxLoan.toLocaleString()} บ.</b></div>
                    <div>เงินดาวน์ ({budgetDownPercent}%): <b>{affordability.requiredDownPayment.toLocaleString()} บ.</b></div>
                  </div>
                </div>
              </div>

              {/* Direct List: "จะมีคอนโดที่ไหนบ้าง" */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-amber-600" />
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">
                        คอนโดที่ซื้อได้ในงบประมาณนี้ ({matchingCondos.length} โครงการแนะนำ)
                      </h4>
                      <p className="text-xs text-slate-500">
                        คัดเลือกจากฐานข้อมูลจริง 1,019 โครงการในกรุงเทพฯ
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                    ในงบ {affordability.maxPropertyPrice.toLocaleString()} บ.
                  </span>
                </div>

                {matchingCondos.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-xs">
                    ไม่พบโครงการในงบที่เลือก กรุณาลองเพิ่มงบประมาณ หรือขยายระยะเวลาผ่อน
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
                    {matchingCondos.map((c) => {
                      const estimatedTotal = c.priceSqm * roomSizeEstimate;
                      const cLoan = Math.round(estimatedTotal * (1 - budgetDownPercent / 100));
                      const cInstallment = calculateMortgage(cLoan, budgetInterest, budgetYears).monthlyPayment;

                      return (
                        <div
                          key={c.name}
                          className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-amber-300 hover:shadow-md transition-all flex flex-col justify-between space-y-2 text-xs"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-1">
                              <h5 className="font-bold text-slate-900 leading-snug">{c.name}</h5>
                              <span className="font-bold text-amber-700 whitespace-nowrap">
                                {c.priceSqm.toLocaleString()} บ./ตร.ม.
                              </span>
                            </div>
                            <p className="text-slate-500 text-[11px] flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              เขต{c.district} &bull; BTS {c.distTran1} กม.
                            </p>
                          </div>

                          <div className="pt-2 border-t border-slate-200/80 space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-500">ราคารวม ({roomSizeEstimate} ตร.ม.):</span>
                              <span className="font-bold text-slate-800">{estimatedTotal.toLocaleString()} บ.</span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md">
                              <span>ผ่อนเดือนละ:</span>
                              <span>~{cInstallment.toLocaleString()} บ./งวด</span>
                            </div>
                          </div>

                          {/* Quick Actions */}
                          <div className="flex items-center justify-between pt-1 text-[11px]">
                            <button
                              type="button"
                              onClick={() => {
                                setPropertyPrice(estimatedTotal);
                                setDownPaymentAmount(Math.round(estimatedTotal * (budgetDownPercent / 100)));
                                setActiveSubTab('standard');
                              }}
                              className="text-indigo-600 hover:text-indigo-800 font-semibold hover:underline flex items-center gap-0.5"
                            >
                              คำนวณละเอียด <ChevronRight className="w-3 h-3" />
                            </button>
                            {onViewOnMap && (
                              <button
                                type="button"
                                onClick={() => onViewOnMap(c.district)}
                                className="text-slate-500 hover:text-slate-800 font-medium hover:underline flex items-center gap-0.5"
                              >
                                ดูบนแผนที่ <ExternalLink className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: STANDARD LOAN CALCULATOR WITH FREE-TEXT NUMERIC INPUTS */}
      {/* ========================================================================= */}
      {activeSubTab === 'standard' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Inputs (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-blue-600" />
                เงื่อนไขสินเชื่อที่ต้องการกู้ (พิมพ์แก้ไขตัวเลขได้อย่างอิสระ)
              </h3>
              <button
                type="button"
                onClick={() => {
                  setPropertyPrice(3500000);
                  setDownPaymentAmount(700000);
                  setInterestRate(3.5);
                  setLoanYears(30);
                }}
                title="คืนค่ามาตรฐาน"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* 1. Property Price (Free editable input) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="std-price-input" className="text-sm font-semibold text-slate-700">
                  ราคาประเมิน / ราคาซื้อขายอสังหาฯ (บาท)
                </label>
                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
                  {(propertyPrice / 1000000).toFixed(2)} ล้านบาท
                </span>
              </div>
              <div className="relative">
                <input
                  id="std-price-input"
                  type="number"
                  min={100000}
                  step={10000}
                  value={propertyPrice}
                  onChange={(e) => {
                    const newPrice = Math.max(0, Number(e.target.value));
                    setPropertyPrice(newPrice);
                    setDownPaymentAmount(Math.round((newPrice * downPaymentPercent) / 100));
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-300 text-slate-900 font-bold text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden pr-16"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium">
                  บาท
                </span>
              </div>
              <input
                type="range"
                min={500000}
                max={25000000}
                step={50000}
                value={propertyPrice}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setPropertyPrice(val);
                  setDownPaymentAmount(Math.round((val * downPaymentPercent) / 100));
                }}
                className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />
            </div>

            {/* 2. Down Payment (Editable in BOTH Baht and %) */}
            <div className="space-y-2 pt-1 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700">
                  เงินดาวน์ (Down Payment) - แก้ไขได้ทั้งจำนวนเงินและเปอร์เซ็นต์
                </label>
                <span className="text-xs font-bold text-blue-700 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                  {downPaymentPercent}%
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Down Payment in Baht */}
                <div className="space-y-1">
                  <span className="text-xs text-slate-500">จำนวนเงินดาวน์ (บาท):</span>
                  <div className="relative">
                    <input
                      id="std-down-amt-input"
                      type="number"
                      min={0}
                      max={propertyPrice}
                      step={5000}
                      value={downPaymentAmount}
                      onChange={(e) => handleDownAmountChange(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm font-bold text-slate-900"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">บาท</span>
                  </div>
                </div>

                {/* Down Payment in % */}
                <div className="space-y-1">
                  <span className="text-xs text-slate-500">สัดส่วนเงินดาวน์ (%):</span>
                  <div className="relative">
                    <input
                      id="std-down-pct-input"
                      type="number"
                      min={0}
                      max={100}
                      step={1}
                      value={downPaymentPercent}
                      onChange={(e) => handleDownPercentChange(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm font-bold text-slate-900"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span>ยอดเงินขอกู้สุทธิ (Principal):</span>
                <span className="font-bold text-blue-700">{loanAmount.toLocaleString()} บาท</span>
              </div>
            </div>

            {/* 3. Interest Rate & Loan Term (Free Inputs) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Interest Rate */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="std-interest-input" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Percent className="w-3.5 h-3.5 text-blue-600" />
                    อัตราดอกเบี้ยต่อปี (%)
                  </label>
                  <span className="text-xs font-bold text-blue-700 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                    {interestRate}%
                  </span>
                </div>
                <input
                  id="std-interest-input"
                  type="number"
                  min={0.1}
                  max={15}
                  step={0.05}
                  value={interestRate}
                  onChange={(e) => setInterestRate(Number(e.target.value))}
                  onBlur={() => interestRate < 0.01 && setInterestRate(0.01)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-sm font-semibold bg-white"
                />
              </div>

              {/* Loan Term */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="std-term-input" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    ระยะเวลาผ่อน (ปี)
                  </label>
                  <span className="text-xs font-bold text-blue-700 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                    {loanYears} ปี ({loanYears * 12} งวด)
                  </span>
                </div>
                <input
                  id="std-term-input"
                  type="number"
                  min={1}
                  max={40}
                  value={loanYears}
                  onChange={(e) => setLoanYears(Number(e.target.value))}
                  onBlur={() => loanYears < 1 && setLoanYears(1)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-sm font-semibold bg-white"
                />
              </div>
            </div>
          </div>

          {/* Right Results Card (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Monthly Payment Hero Card */}
            <div className="bg-gradient-to-br from-blue-700 via-blue-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl shadow-blue-900/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 translate-x-4 -translate-y-4 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />

              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/15 text-blue-100 backdrop-blur-xs border border-white/20">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                ค่างวดที่ต้องผ่อนชำระ
              </span>

              <div className="mt-3">
                <p className="text-xs text-blue-200 uppercase tracking-wider font-medium">ค่างวดต่อเดือน (ผ่อน {loanYears * 12} งวด)</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <h3 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                    {standardMortgage.monthlyPayment.toLocaleString()}
                  </h3>
                  <span className="text-lg font-bold text-blue-200">บาท / งวด</span>
                </div>
              </div>

              {/* Income qualification recommendation */}
              <div className="mt-4 pt-4 border-t border-white/15 bg-white/10 -mx-6 -mb-6 p-5 rounded-b-2xl">
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-blue-300 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="text-blue-100 font-semibold">
                      แนะนำรายได้ขั้นต่ำของผู้กู้: <span className="text-white font-bold text-sm">~{minRequiredIncome.toLocaleString()} บาท/เดือน</span>
                    </p>
                    <p className="text-blue-200/80 text-[11px] mt-0.5">
                      คำนวณตามเกณฑ์ภาระหนี้ DSR (Debt Service Ratio) ไม่เกิน 40% ของรายได้รวม
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Breakdown Summary Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <PieIcon className="w-4 h-4 text-blue-600" />
                สัดส่วนเงินต้นและดอกเบี้ยรวมตลอดสัญญา
              </h4>

              {/* Stacked Bar */}
              <div className="space-y-1.5">
                <div className="h-3.5 rounded-full overflow-hidden flex bg-slate-100">
                  <div
                    style={{ width: `${principalPercent}%` }}
                    className="bg-blue-600 h-full transition-all duration-300"
                    title={`เงินต้น ${principalPercent}%`}
                  />
                  <div
                    style={{ width: `${interestPercent}%` }}
                    className="bg-amber-500 h-full transition-all duration-300"
                    title={`ดอกเบี้ย ${interestPercent}%`}
                  />
                </div>
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-blue-600 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
                    เงินต้น {principalPercent}%
                  </span>
                  <span className="text-amber-600 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                    ดอกเบี้ย {interestPercent}%
                  </span>
                </div>
              </div>

              {/* Summary details */}
              <div className="space-y-2 text-xs pt-1">
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">ยอดเงินที่ขอกู้ (Principal):</span>
                  <span className="font-bold text-slate-800">{loanAmount.toLocaleString()} บาท</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">เงินดาวน์ที่เตรียมไว้:</span>
                  <span className="font-bold text-slate-800">{downPaymentAmount.toLocaleString()} บาท</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">ดอกเบี้ยรวมตลอด {loanYears} ปี:</span>
                  <span className="font-bold text-amber-600">+{standardMortgage.totalInterest.toLocaleString()} บาท</span>
                </div>
                <div className="flex items-center justify-between py-1.5 text-sm font-bold bg-slate-50 p-2.5 rounded-xl">
                  <span className="text-slate-700">ยอดเงินผ่อนชำระรวมทั้งสิ้น:</span>
                  <span className="text-slate-900">{standardMortgage.totalPayment.toLocaleString()} บาท</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: EARLY PAYOFF CALCULATOR (ถ้าผ่อนเดือนละ X บาท จะผ่อนจบกี่งวด) */}
      {/* ========================================================================= */}
      {activeSubTab === 'early_payoff' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Zap className="w-5 h-5 text-emerald-600" />
                จำลองการผ่อนต่อเดือนแบบโปะ (Early Payoff Simulation)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                เช่น ยอดกู้ {loanAmount.toLocaleString()} บาท หากจ่ายเดือนละ 50,000 บาท จะผ่อนจบในกี่งวด
              </p>
            </div>

            {/* Custom Payment Input */}
            <div className="space-y-1.5 bg-emerald-50/50 p-4 rounded-xl border border-emerald-200">
              <label htmlFor="custom-pay-input" className="text-xs font-bold text-slate-800">
                ยอดที่ต้องการผ่อนต่อเดือน (บาท/งวด):
              </label>
              <div className="relative">
                <input
                  id="custom-pay-input"
                  type="number"
                  min={1000}
                  step={1000}
                  value={customMonthlyPayment}
                  onChange={(e) => setCustomMonthlyPayment(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-emerald-400 bg-white text-slate-900 font-black text-lg focus:ring-2 focus:ring-emerald-500 outline-hidden pr-20"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-700">
                  บาท/งวด
                </span>
              </div>

              {/* Presets */}
              <div className="flex items-center gap-1.5 flex-wrap pt-2">
                <span className="text-[11px] text-slate-400">เลือกเร็ว:</span>
                {[standardMortgage.monthlyPayment, 25000, 35000, 50000, 75000, 100000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setCustomMonthlyPayment(val)}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border transition-colors ${
                      customMonthlyPayment === val
                        ? 'bg-emerald-600 text-white border-emerald-700'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {val.toLocaleString()} บ.
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>ยอดเงินกู้ปัจจุบัน:</span>
                <span className="font-bold text-slate-900">{loanAmount.toLocaleString()} บาท</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>อัตราดอกเบี้ย:</span>
                <span className="font-bold text-slate-900">{interestRate}% ต่อปี</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>ค่างวดปกติ (30 ปี):</span>
                <span className="font-semibold text-slate-700">{standardMortgage.monthlyPayment.toLocaleString()} บ./งวด</span>
              </div>
            </div>
          </div>

          {/* Payoff Results */}
          <div className="lg:col-span-6 space-y-4">
            {payoffResult.canPayoff ? (
              <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-900 rounded-2xl p-6 text-white shadow-xl shadow-emerald-900/10 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-emerald-100 border border-white/20">
                    ผลลัพธ์การผ่อนจบเร็ว
                  </span>
                  <span className="text-xs text-emerald-200">งวดละ {customMonthlyPayment.toLocaleString()} บาท</span>
                </div>

                <div>
                  <p className="text-xs text-emerald-200 uppercase tracking-wider font-medium">
                    จะผ่อนจบทั้งหมดในเวลา:
                  </p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-4xl font-black text-white">
                      {payoffResult.totalMonths}
                    </span>
                    <span className="text-xl font-bold text-emerald-200">
                      งวด ({payoffResult.years} ปี {payoffResult.months > 0 ? `${payoffResult.months} เดือน` : ''})
                    </span>
                  </div>
                </div>

                {/* Savings comparison */}
                <div className="pt-4 border-t border-white/15 grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-white/10 p-3 rounded-xl">
                    <p className="text-emerald-200">ผ่อนหมดเร็วขึ้น:</p>
                    <p className="text-base font-bold text-white mt-0.5">
                      {Math.max(0, loanYears * 12 - payoffResult.totalMonths)} งวด
                    </p>
                    <p className="text-[11px] text-emerald-200/80">
                      (เร็วขึ้น ~{((loanYears * 12 - payoffResult.totalMonths) / 12).toFixed(1)} ปี)
                    </p>
                  </div>

                  <div className="bg-white/10 p-3 rounded-xl">
                    <p className="text-emerald-200">ประหยัดดอกเบี้ยได้ถึง:</p>
                    <p className="text-base font-bold text-yellow-300 mt-0.5">
                      {payoffResult.savingsVs30Yr.toLocaleString()} บาท
                    </p>
                    <p className="text-[11px] text-emerald-200/80">
                      เทียบกับสัญญา 30 ปีเดิม
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl text-xs space-y-2 text-amber-900">
                <p className="font-bold text-sm">ยอดผ่อนต่อเดือนน้อยเกินไป</p>
                <p>
                  ยอดผ่อน {customMonthlyPayment.toLocaleString()} บาท/เดือน ไม่เพียงพอต่อการชำระดอกเบี้ยรายเดือน (ดอกเบี้ยขั้นต่ำประมาณ {payoffResult.minRequiredMonthly?.toLocaleString()} บาท)
                </p>
                <p className="text-slate-600">กรุณาปรับเพิ่มยอดผ่อนต่อเดือนใหม่อีกครั้ง</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
