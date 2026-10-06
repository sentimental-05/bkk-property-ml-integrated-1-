import React from 'react';
import { MainTab, PropertyMode } from '../types';
import {
  Compass,
  TrendingUp,
  Sparkles,
  Calculator,
  BarChart3,
  MessageCircle,
  MapPin,
  Globe
} from 'lucide-react';

interface FloatingBottomDockProps {
  mode: PropertyMode;
  onModeChange: (mode: PropertyMode) => void;
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
}

export const FloatingBottomDock: React.FC<FloatingBottomDockProps> = ({
  mode,
  onModeChange,
  activeTab,
  onTabChange,
}) => {
  const mobileNavTabs: {
    id: MainTab;
    label: string;
    icon: React.FC<{ className?: string }>;
    isHighlight?: boolean;
  }[] = [
    { id: 'explore', label: 'สำรวจ', icon: Compass },
    { id: 'valuation', label: 'ทำนายราคา', icon: TrendingUp },
    { id: 'ai_search', label: 'ถาม AI', icon: Sparkles, isHighlight: true },
    { id: 'mortgage', label: 'คำนวณผ่อน', icon: Calculator },
    { id: 'dashboard', label: 'โมเดล', icon: BarChart3 },
  ];

  const handleTabClick = (tab: MainTab) => {
    onTabChange(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* 1. MOBILE NATIVE APP BOTTOM BAR (Displays on screens < sm) */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom,0px)]">
        <div className="grid grid-cols-5 h-15 items-center px-1">
          {mobileNavTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            if (tab.isHighlight) {
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className="flex flex-col items-center justify-center -mt-4 relative group"
                  aria-label={tab.label}
                >
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
                      isActive
                        ? 'bg-gradient-to-tr from-blue-600 to-sky-400 text-white ring-3 ring-blue-100 shadow-blue-500/30'
                        : 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-blue-600/30'
                    }`}
                  >
                    <Icon className="w-5 h-5 animate-pulse" />
                  </div>
                  <span
                    className={`text-[10px] font-bold mt-1 tracking-tight ${
                      isActive ? 'text-blue-600' : 'text-slate-600'
                    }`}
                  >
                    {tab.label}
                  </span>
                </button>
              );
            }

            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`flex flex-col items-center justify-center py-1.5 transition-colors active:scale-95 ${
                  isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                  {isActive && (
                    <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-blue-600 ring-2 ring-white" />
                  )}
                </div>
                <span className={`text-[10px] mt-1 ${isActive ? 'font-bold text-blue-600' : 'font-medium'}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* 2. TABLET / DESKTOP FLOATING DOCK (Displays on screens >= sm) */}
      <div className="hidden sm:flex fixed bottom-4 inset-x-0 z-40 pointer-events-none justify-center px-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-md p-1.5 rounded-full border border-blue-400/30 shadow-2xl shadow-blue-900/20 flex items-center gap-2">
          {/* Mode Switcher */}
          <button
            onClick={() => onModeChange(mode === 'condo' ? 'house' : 'condo')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all"
            title={`สลับเป็นโหมด ${mode === 'condo' ? 'บ้านเดี่ยว' : 'คอนโดมิเนียม'}`}
          >
            <Globe className="w-3.5 h-3.5 text-sky-300" />
            <span>{mode === 'condo' ? 'คอนโด' : 'บ้านเดี่ยว'}</span>
          </button>

          {/* LINE shortcut */}
          <a
            href="https://line.me"
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-full bg-[#06C755] hover:bg-[#05b34c] text-white flex items-center justify-center transition-transform hover:scale-105 shadow-xs"
            title="ติดต่อทาง LINE"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
          </a>

          {/* Calculator shortcut */}
          <button
            onClick={() => handleTabClick('mortgage')}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              activeTab === 'mortgage'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
            title="คำนวณค่างวดผ่อนชำระ DSR"
          >
            <Calculator className="w-4 h-4" />
          </button>

          {/* Map shortcut */}
          <button
            onClick={() => handleTabClick('explore')}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              activeTab === 'explore'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
            title="สำรวจโครงการและแผนที่พิกัดจริง"
          >
            <MapPin className="w-4 h-4" />
          </button>

          {/* Blue Pill: ประเมินราคา ML */}
          <button
            onClick={() => handleTabClick('valuation')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold text-white transition-all shadow-md ${
              activeTab === 'valuation'
                ? 'bg-blue-600 ring-2 ring-blue-300'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            ประเมินราคา
          </button>

          {/* Sky / Royal Blue Gradient Pill: ✨ ถามมาได้เลย */}
          <button
            onClick={() => handleTabClick('ai_search')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold text-white transition-all shadow-lg ${
              activeTab === 'ai_search'
                ? 'bg-gradient-to-r from-sky-500 to-blue-700 ring-2 ring-white/60'
                : 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>ถามมาได้เลย</span>
          </button>
        </div>
      </div>
    </>
  );
};
