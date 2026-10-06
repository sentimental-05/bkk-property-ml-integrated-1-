import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Download, Terminal, FileCode2, ExternalLink } from 'lucide-react';

interface StreamlitCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StreamlitCodeModal: React.FC<StreamlitCodeModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'app' | 'req'>('app');
  const [pythonCode, setPythonCode] = useState<string>('# Loading app.py...');
  const [copied, setCopied] = useState<boolean>(false);

  const requirementsText = `streamlit>=1.32.0\nfolium>=0.16.0\nstreamlit-folium>=0.19.0\npandas>=2.0.0\nnumpy>=1.24.0`;

  useEffect(() => {
    if (isOpen) {
      fetch('/app.py')
        .then((res) => {
          if (!res.ok) throw new Error('Failed to fetch app.py');
          return res.text();
        })
        .then((text) => setPythonCode(text))
        .catch(() => {
          setPythonCode('# ไม่สามารถโหลด app.py จากเซิร์ฟเวอร์ได้');
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentContent = activeTab === 'app' ? pythonCode : requirementsText;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const filename = activeTab === 'app' ? 'app.py' : 'requirements.txt';
    const blob = new Blob([currentContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600/10 text-emerald-700 flex items-center justify-center font-bold">
              <FileCode2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                Python Streamlit Source Code
              </h3>
              <p className="text-xs text-slate-500">
                โค้ดต้นฉบับสำหรับรันเป็น Streamlit Web Application บนเครื่องของคุณ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher & Action Bar */}
        <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setActiveTab('app')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeTab === 'app'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              app.py (Streamlit)
            </button>
            <button
              onClick={() => setActiveTab('req')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeTab === 'req'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              requirements.txt
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">คัดลอกแล้ว!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>คัดลอกโค้ด</span>
                </>
              )}
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ดาวน์โหลด {activeTab === 'app' ? 'app.py' : 'requirements.txt'}</span>
            </button>
          </div>
        </div>

        {/* Code Viewport */}
        <div className="flex-1 overflow-auto p-4 bg-slate-950 font-mono text-xs text-slate-300 leading-relaxed selection:bg-emerald-800">
          <pre className="overflow-x-auto whitespace-pre">{currentContent}</pre>
        </div>

        {/* Quick Instructions Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-slate-500" />
            <span>คำสั่งรัน: <code className="bg-slate-200 px-1.5 py-0.5 rounded text-slate-800 font-mono">pip install -r requirements.txt && streamlit run app.py</code></span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium bg-white border border-slate-300 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
