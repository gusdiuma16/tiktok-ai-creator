
import React, { useState, useEffect } from 'react';
import { X, Save, Link } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (url: string) => void;
  initialUrl: string;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave, initialUrl }) => {
  const [url, setUrl] = useState(initialUrl);

  useEffect(() => {
    setUrl(initialUrl);
  }, [initialUrl, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
        
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-green-900/30 rounded-full flex items-center justify-center text-green-500">
            <Link size={20} />
          </div>
          <h2 className="text-xl font-bold text-white">Hubungkan Google Sheet</h2>
        </div>

        <div className="space-y-4">
          <p className="text-slate-400 text-sm leading-relaxed">
            Data generate akan otomatis masuk ke Spreadsheet Anda.
            <br />
            <span className="text-xs opacity-70">
              Paste URL "Web App" dari Google Apps Script Deployment di sini.
            </span>
          </p>
          
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Script Web App URL
            </label>
            <input 
              type="text" 
              placeholder="https://script.google.com/macros/s/.../exec"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-sm text-white focus:ring-2 focus:ring-green-500 outline-none transition-all"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          <button 
            onClick={() => {
              onSave(url);
              onClose();
            }}
            className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors mt-2"
          >
            <Save size={18} />
            Simpan Koneksi
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
