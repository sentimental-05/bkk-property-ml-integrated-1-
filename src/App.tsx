/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PropertyMode, MainTab, RecommendedProperty } from './types';
import { Header } from './components/Header';
import { PropertyExplorer } from './components/PropertyExplorer';
import { NaturalLanguageSearch } from './components/NaturalLanguageSearch';
import { HouseForm } from './components/HouseForm';
import { CondoForm } from './components/CondoForm';
import { MortgageCalculator } from './components/MortgageCalculator';
import { ModelDashboard } from './components/ModelDashboard';
import { StreamlitCodeModal } from './components/StreamlitCodeModal';
import { FloatingBottomDock } from './components/FloatingBottomDock';
import { RegistrationBanner } from './components/RegistrationBanner';
import { AdminPanel } from './components/AdminPanel';

export default function App() {
  const [mode, setMode] = useState<PropertyMode>('condo'); // Default to Bangkok condos
  const [activeTab, setActiveTab] = useState<MainTab>(() => (window.location.hash === '#admin' ? 'admin' : 'explore'));
  const [mortgagePrice, setMortgagePrice] = useState<number>(3500000);
  const [targetLocation, setTargetLocation] = useState<string>('');
  const [showCodeModal, setShowCodeModal] = useState<boolean>(false);

  const handleSendToMortgage = (priceTHB: number) => {
    setMortgagePrice(priceTHB);
    setActiveTab('mortgage');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSendToValuation = (locationName: string) => {
    setTargetLocation(locationName);
    setActiveTab('valuation');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewOnMap = (locationName: string) => {
    setTargetLocation(locationName);
    setActiveTab('explore');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePinAllOnMap = (properties: RecommendedProperty[]) => {
    if (properties.length > 0) {
      setMode(properties[0].type);
    }
    setActiveTab('explore');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFocusSinglePropertyOnMap = (prop: RecommendedProperty) => {
    setMode(prop.type);
    setTargetLocation(prop.districtOrNeighborhood || prop.location || prop.title);
    setActiveTab('explore');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col text-slate-800 selection:bg-blue-100 selection:text-blue-900 relative pb-24 sm:pb-16">
      {/* Top Main & Sub-Nav Header - White & Blue Theme */}
      <Header
        mode={mode}
        onModeChange={setMode}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenCodeModal={() => setShowCodeModal(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tab 1: Explore & Interactive Map */}
        {activeTab === 'explore' && (
          <PropertyExplorer
            mode={mode}
            onModeChange={setMode}
            onSendToMortgage={handleSendToMortgage}
            onSendToValuation={handleSendToValuation}
            targetFocusLocation={targetLocation}
          />
        )}

        {/* Tab 2: AI & ML Price Valuation */}
        {activeTab === 'valuation' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-slate-200 pb-4">
              <span className="text-xs font-bold text-blue-600 tracking-wider uppercase">
                MACHINE LEARNING VALUATION
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                ระบบทำนายราคาอสังหาริมทรัพย์ด้วย Machine Learning
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {mode === 'condo'
                  ? 'วิเคราะห์ราคาต่อตารางเมตรของคอนโดมิเนียมในกรุงเทพฯ จากสถิติจริง 1,019 โครงการ อิงตามระยะทางรถไฟฟ้า ปีที่สร้าง และสิ่งอำนวยความสะดวก'
                  : 'ประเมินราคาขายบ้านเดี่ยวด้วยโมเดล Multiple Linear Regression คำนวณจากพื้นที่ใช้สอย คุณภาพวัสดุ และจำนวนห้อง'}
              </p>
            </div>

            {mode === 'house' ? (
              <HouseForm
                onSendToMortgage={handleSendToMortgage}
                onViewOnMap={handleViewOnMap}
              />
            ) : (
              <CondoForm
                onSendToMortgage={handleSendToMortgage}
                onViewOnMap={handleViewOnMap}
              />
            )}
          </div>
        )}

        {/* Tab 3: Natural Language AI Search */}
        {activeTab === 'ai_search' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-slate-200 pb-4">
              <span className="text-xs font-bold text-blue-600 tracking-wider uppercase">
                AI SEARCH ASSISTANT
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                ค้นหาอสังหาริมทรัพย์ด้วยภาษาธรรมชาติ
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                พิมพ์ประโยคความต้องการด้วยภาษาไทยปกติ เช่น "มีงบผ่อนเดือนละ 15,000 อยากได้คอนโดใกล้ BTS"
                ระบบจะวิเคราะห์เงื่อนไขและคัดกรองจากข้อมูลจริง 1,019 โครงการทันที
              </p>
            </div>

            <NaturalLanguageSearch
              onPinAllOnMap={handlePinAllOnMap}
              onSelectPropertyForMortgage={handleSendToMortgage}
              onFocusSinglePropertyOnMap={handleFocusSinglePropertyOnMap}
            />
          </div>
        )}

        {/* Tab 4: Mortgage & DSR Calculator */}
        {activeTab === 'mortgage' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-slate-200 pb-4">
              <span className="text-xs font-bold text-blue-600 tracking-wider uppercase">
                FINANCIAL & MORTGAGE SIMULATION
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                เครื่องคำนวณค่างวดเงินกู้และประเมินภาระหนี้ (DSR 40%)
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                คำนวณตารางผ่อนชำระ ดอกเบี้ยแท้จริง และเกณฑ์ปลอดภัยทางการเงินตามข้อกำหนดธนาคารแห่งประเทศไทย
              </p>
            </div>

            <MortgageCalculator
              initialPrice={mortgagePrice}
              onViewOnMap={handleViewOnMap}
            />
          </div>
        )}

        {/* Admin: เพิ่มข้อมูล + เทรนโมเดลใหม่ (ต้องใช้ ADMIN_TOKEN) */}
        {activeTab === 'admin' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-slate-200 pb-4">
              <span className="text-xs font-bold text-blue-600 tracking-wider uppercase">ADMIN</span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                หลังบ้าน: เพิ่มข้อมูลและเทรนโมเดล
              </h1>
            </div>
            <AdminPanel />
          </div>
        )}

        {/* Tab 5: ML Model Evaluation Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-slate-200 pb-4">
              <span className="text-xs font-bold text-blue-600 tracking-wider uppercase">
                CRISP-DM MODEL EVALUATION
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                รายงานการประเมินประสิทธิภาพโมเดล Machine Learning
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                เปรียบเทียบค่าความถูกต้องของโมเดล R², Mean Absolute Error (MAE), Root Mean Squared Error (RMSE)
                และระดับความสำคัญของตัวแปร (Feature Importance)
              </p>
            </div>

            <ModelDashboard currentMode={mode} onModeChange={setMode} />
          </div>
        )}
      </main>

      {/* Registration & Consultation Section - Deep Blue Theme */}
      <RegistrationBanner
        mode={mode}
        onValuationClick={() => {
          setActiveTab('valuation');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onMortgageClick={() => {
          setActiveTab('mortgage');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Modern Minimalist Developer Footer */}
      <footer className="bg-white border-t border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
            <span className="font-bold text-slate-800">
              BKK PropTech Platform • Real Estate Intelligence
            </span>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <span>ฐานข้อมูลคอนโด กทม. 1,019 แห่ง</span>
            <span aria-hidden="true">·</span>
            <span>บ้านเดี่ยว 1,460 ยูนิต</span>
            <span aria-hidden="true">·</span>
            <button type="button" onClick={() => { window.location.hash = 'admin'; setActiveTab('admin'); window.scrollTo({ top: 0 }); }} className="text-slate-400 hover:text-blue-600 underline underline-offset-2">สำหรับผู้ดูแล</button>
          </div>
        </div>
      </footer>

      {/* Floating Bottom Quick Action Dock - Blue Theme */}
      <FloatingBottomDock
        mode={mode}
        onModeChange={setMode}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Streamlit Python Code Modal */}
      <StreamlitCodeModal
        isOpen={showCodeModal}
        onClose={() => setShowCodeModal(false)}
      />
    </div>
  );
}
