import React, { useState } from 'react';
import { Sparkles, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';
import { PropertyMode } from '../types';

interface RegistrationBannerProps {
  mode: PropertyMode;
  onValuationClick: () => void;
  onMortgageClick: () => void;
}

export const RegistrationBanner: React.FC<RegistrationBannerProps> = ({
  mode,
  onValuationClick,
  onMortgageClick,
}) => {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    setSubmitted(true);
  };

  return (
    <section className="bg-gradient-to-b from-[#0B1E38] via-[#0F284E] to-[#071326] text-white py-8 sm:py-14 mt-8 sm:mt-12 transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4 sm:space-y-6">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-[10px] sm:text-xs font-semibold mb-2 sm:mb-3 border border-sky-400/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>EXCLUSIVE PRIVILEGE</span>
          </span>
          <h2 className="text-xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
            ลงทะเบียนเพื่อรับสิทธิพิเศษ
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
            ลงทะเบียนรับข้อเสนอราคาพิเศษ ประเมินราคาฟรีด้วยระบบ Machine Learning และรับรายงานวิเคราะห์ภาระหนี้ DSR 40% เฉพาะคุณ
          </p>
        </div>

        {submitted ? (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 sm:p-6 max-w-md mx-auto border border-sky-400/40 text-center space-y-3 animate-in fade-in">
            <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-blue-500/30">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white">ลงทะเบียนสำเร็จเรียบร้อย</h4>
            <p className="text-xs text-slate-200">
              เจ้าหน้าที่ผู้เชี่ยวชาญจะติดต่อกลับเพื่อให้คำแนะนำ พร้อมส่งรายงานวิเคราะห์ราคาให้ท่าน
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <button
                type="button"
                onClick={onValuationClick}
                className="px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md active:scale-95"
              >
                เริ่มประเมินราคา ML ทันที
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white text-slate-900 rounded-2xl sm:rounded-3xl p-5 sm:p-8 max-w-2xl mx-auto shadow-2xl space-y-3 sm:space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ชื่อ - นามสกุล *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="เช่น คุณสมชาย ใจดี"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  เบอร์โทรศัพท์ติดต่อ *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="เช่น 081-234-5678"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-500 text-left">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                <span>ข้อมูลของท่านจะถูกเก็บเป็นความลับตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล</span>
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-7 py-2.5 sm:py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2 active:scale-95 shrink-0"
              >
                <span>ลงทะเบียนรับสิทธิ์</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        <div className="pt-2 flex items-center justify-center gap-6 text-xs text-slate-300">
          <button
            type="button"
            onClick={onValuationClick}
            className="hover:text-white underline underline-offset-4"
          >
            เปิดเครื่องมือทำนายราคา ML
          </button>
          <span>&bull;</span>
          <button
            type="button"
            onClick={onMortgageClick}
            className="hover:text-white underline underline-offset-4"
          >
            คำนวณค่างวดเงินกู้
          </button>
        </div>
      </div>
    </section>
  );
};
