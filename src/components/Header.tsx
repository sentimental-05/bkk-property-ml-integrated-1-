import React, { useState } from 'react';
import { PropertyMode, MainTab } from '../types';
import {
  Menu,
  ChevronRight,
  Sparkles,
  Building2,
  Home,
  FileCode2,
  Calculator,
  Compass,
  TrendingUp,
  BarChart3,
  X,
  MessageCircle,
  ExternalLink
} from 'lucide-react';

interface HeaderProps {
  mode: PropertyMode;
  onModeChange: (mode: PropertyMode) => void;
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
  onOpenCodeModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  mode,
  onModeChange,
  activeTab,
  onTabChange,
  onOpenCodeModal,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: MainTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'explore', label: 'สำรวจ & แผนที่', icon: Compass },
    { id: 'valuation', label: 'ทำนายราคา ML', icon: TrendingUp },
    { id: 'ai_search', label: 'ค้นหา AI', icon: Sparkles },
    { id: 'mortgage', label: 'คำนวณค่างวด', icon: Calculator },
    { id: 'dashboard', label: 'ข้อมูลโมเดล', icon: BarChart3 },
  ];

  const handleNavClick = (tabId: MainTab) => {
    onTabChange(tabId);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getBreadcrumbTitle = () => {
    switch (activeTab) {
      case 'explore':
        return mode === 'condo' ? 'สำรวจคอนโด กทม.' : 'สำรวจบ้านเดี่ยว';
      case 'valuation':
        return 'ระบบประเมินราคา ML';
      case 'ai_search':
        return 'ค้นหาด้วย AI';
      case 'mortgage':
        return 'คำนวณค่างวด & DSR';
      case 'dashboard':
        return 'รายงานโมเดล ML';
      default:
        return 'หน้าแรก';
    }
  };

  return (
    <div className="sticky top-0 z-40 bg-white shadow-xs">
      {/* Upper Main Navigation Bar */}
      <header className="border-b border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="h-14 sm:h-16 flex items-center justify-between gap-2">
            {/* Left: Mobile Hamburger or Brand Wordmark */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 -ml-1 text-slate-700 hover:text-blue-600 rounded-xl hover:bg-blue-50 active:scale-95 transition-all"
                aria-label="เมนูหลัก"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              <button
                onClick={() => {
                  onTabChange('explore');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="flex items-center gap-2 text-left group"
              >
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-blue-500/20 group-hover:bg-blue-700 transition-colors">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 block leading-tight">
                    BKK PROPTECH
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-blue-600 font-bold block leading-none">
                    ASSET INTELLIGENCE
                  </span>
                </div>
              </button>
            </div>

            {/* Center Navigation Links (Desktop) */}
            <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`relative py-5 px-3.5 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
                      isActive
                        ? 'text-blue-600 font-bold'
                        : 'text-slate-600 hover:text-blue-600'
                    }`}
                  >
                    <span>{item.label}</span>
                    {isActive && (
                      <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-blue-600 rounded-t-full shadow-xs" />
                    )}
                  </button>
                );
              })}
              <div className="text-slate-300 px-1">
                <ChevronRight className="w-4 h-4" />
              </div>
            </nav>

            {/* Right Action Items */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Property Mode Toggle (Compact on Mobile) */}
              <div className="flex items-center p-0.5 bg-slate-100 rounded-full border border-slate-200 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => onModeChange('condo')}
                  className={`flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-full transition-all text-xs ${
                    mode === 'condo'
                      ? 'bg-white text-blue-900 font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="โหมดคอนโดมิเนียม"
                >
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>คอนโด</span>
                </button>
                <button
                  type="button"
                  onClick={() => onModeChange('house')}
                  className={`flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-full transition-all text-xs ${
                    mode === 'house'
                      ? 'bg-white text-blue-900 font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="โหมดบ้านเดี่ยว"
                >
                  <Home className="w-3.5 h-3.5 text-sky-600" />
                  <span>บ้าน</span>
                </button>
              </div>

              {/* Add LINE Pill (Hidden on Mobile) */}
              <a
                href="https://line.me"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#06C755] hover:bg-[#05b34c] text-white text-xs font-bold shadow-xs transition-all"
              >
                <MessageCircle className="w-3.5 h-3.5 fill-current" />
                <span>Add LINE</span>
              </a>

              {/* Blue Pill: ประเมินราคา (Desktop only) */}
              <button
                type="button"
                onClick={() => {
                  onTabChange('valuation');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="hidden sm:inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all active:scale-95"
              >
                <span>ประเมินราคา</span>
              </button>

              {/* Streamlit Code Button */}
              <button
                type="button"
                onClick={onOpenCodeModal}
                className="p-1.5 sm:p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="ดูโค้ด Streamlit (app.py)"
              >
                <FileCode2 className="w-4 h-4 text-slate-500 hover:text-blue-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-100 px-4 py-3 bg-white space-y-1.5 animate-in slide-in-from-top-2 duration-150 shadow-lg">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 pt-1">
              เมนูการใช้งาน
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full text-left py-2.5 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-between ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-bold border border-blue-100'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-blue-600'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </button>
              );
            })}
            <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
              <a
                href="https://line.me"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#06C755] text-white text-xs font-bold"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
                <span>ติดต่อผ่าน LINE</span>
              </a>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenCodeModal();
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium"
              >
                โค้ด Streamlit
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Breadcrumb Bar */}
      <div className="bg-slate-50/90 border-b border-slate-200/70 text-[11px] sm:text-xs text-slate-500 py-1.5 sm:py-2 px-3 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => {
              onTabChange('explore');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="hover:text-blue-600 flex items-center gap-1 shrink-0"
          >
            <Home className="w-3 h-3 text-slate-400" />
          </button>
          <span className="text-slate-300">/</span>
          <span className="hover:text-blue-600 shrink-0 font-medium">
            {mode === 'condo' ? 'คอนโด' : 'บ้านเดี่ยว'}
          </span>
          <span className="text-slate-300">/</span>
          <span className="text-blue-700 font-semibold truncate">
            {getBreadcrumbTitle()}
          </span>
        </div>
      </div>
    </div>
  );
};
