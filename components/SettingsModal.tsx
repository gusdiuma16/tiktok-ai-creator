import React, { useState, useEffect } from 'react';
import { X, Save, Link, Code, Copy, Check } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (url: string) => void;
  initialUrl: string;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave, initialUrl }) => {
  const [url, setUrl] = useState(initialUrl);
  const [activeTab, setActiveTab] = useState<'connection' | 'script'>('connection');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setUrl(initialUrl);
  }, [initialUrl, isOpen]);

  if (!isOpen) return null;

  const scriptCode = `function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var rawData = e.postData.contents;
  var data = JSON.parse(rawData);
  
  var prompt = data.prompt;
  var cards = data.cards;
  var rows = [];
  var timestamp = new Date();
  
  for (var i = 0; i < cards.length; i++) {
    var card = cards[i];
    // Pastikan urutan kolom sesuai dengan header Sheet
    // A: Timestamp, B: Prompt, C: Card ID, D: Text, E: Vibe, F: Gradient, G: Color
    rows.push([
      timestamp,
      prompt,
      "'" + card.id, // Tambah kutip agar tidak jadi angka ilmiah
      card.text,
      card.vibe,
      card.bgGradient,
      card.textColor
    ]);
  }
  
  if (rows.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
  }
  
  return ContentService.createTextOutput(JSON.stringify({status: "success"}))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  data.shift();
  
  var jsonOutput = data.map(function(row) {
    var rowObject = {};
    headers.forEach(function(header, index) {
      rowObject[header] = row[index];
    });
    return rowObject;
  });
  
  return ContentService.createTextOutput(JSON.stringify(jsonOutput))
    .setMimeType(ContentService.MimeType.JSON);
}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(scriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950">
          <h2 className="text-xl font-bold text-white">Pengaturan Google Sheet</h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900">
          <button 
            onClick={() => setActiveTab('connection')}
            className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${activeTab === 'connection' ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Link size={16} />
            Koneksi URL
          </button>
          <button 
            onClick={() => setActiveTab('script')}
            className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${activeTab === 'script' ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Code size={16} />
            Kode Script (Wajib)
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          
          {activeTab === 'connection' && (
            <div className="space-y-6">
              <div className="bg-indigo-900/20 border border-indigo-900/50 p-4 rounded-xl flex gap-3">
                <div className="mt-1 text-indigo-400"><Link size={20} /></div>
                <div>
                  <h3 className="text-indigo-300 font-semibold text-sm mb-1">Cara Mendapatkan URL:</h3>
                  <p className="text-indigo-200/70 text-xs leading-relaxed">
                    1. Di Google Apps Script, Klik tombol biru <b>"Deploy"</b> {'>'} <b>"New deployment"</b>.<br/>
                    2. Pilih type <b>"Web app"</b>.<br/>
                    3. Execute as: <b>"Me"</b>.<br/>
                    4. Who has access: <b>"Anyone"</b> (Penting!).<br/>
                    5. Klik Deploy dan copy <b>"Web App URL"</b>.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Web App URL
                </label>
                <input 
                  type="text" 
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>

              <button 
                onClick={() => {
                  onSave(url);
                  onClose();
                }}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <Save size={18} />
                Simpan & Tutup
              </button>
            </div>
          )}

          {activeTab === 'script' && (
            <div className="space-y-4">
              <p className="text-sm text-slate-400">
                Copy kode di bawah ini dan paste ke dalam editor <b>Google Apps Script</b> Anda (ganti semua kode lama). Kode ini menangani penyimpanan data (doPost) dan pembacaan history (doGet).
              </p>
              
              <div className="relative group">
                <div className="absolute top-3 right-3 opacity-100 transition-opacity">
                  <button 
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-white px-3 py-1.5 rounded-md border border-slate-700 transition-all shadow-lg"
                  >
                    {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                    {copied ? 'Tersalin' : 'Copy Kode'}
                  </button>
                </div>
                <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 pt-12 text-xs text-slate-300 font-mono overflow-x-auto whitespace-pre leading-relaxed h-[300px]">
                  {scriptCode}
                </pre>
              </div>
              
              <div className="bg-yellow-900/20 border border-yellow-900/50 p-3 rounded-lg">
                <p className="text-yellow-500/80 text-xs">
                  ⚠️ <b>Penting:</b> Setelah update kode di Apps Script, Anda <b>WAJIB</b> melakukan "New Deployment" agar perubahan kode aktif.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;