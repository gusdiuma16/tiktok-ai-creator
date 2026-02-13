import React, { useState, useRef, useEffect } from 'react';
import { generateStoryContent } from './services/geminiService';
import { syncToGoogleSheet, fetchHistoryFromGoogleSheet } from './services/googleSheetService';
import { StoryCard, HistorySession } from './types';
import StoryCardComponent from './components/StoryCardComponent';
import { toJpeg } from 'html-to-image';
import { Loader2, Download, Send, RefreshCw, Layers, History, FileSpreadsheet, ArrowLeft, Trash2, CheckCircle2, CloudLightning } from 'lucide-react';

const GOOGLE_SCRIPT_URL: string = "https://script.google.com/macros/s/AKfycbz-ttPSV5HwN1ix5s3HioIDWEs_IGcohYB-2cxBRIb6CB9SIu_n2VO0z1MKL9jDi3xt/exec"; 

const App: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [cards, setCards] = useState<StoryCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [view, setView] = useState<'generator' | 'archive'>('generator');
  const [history, setHistory] = useState<HistorySession[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const savedHistory = localStorage.getItem('instaGenHistory');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to load local history", e);
      }
    }
  }, []);

  useEffect(() => {
    const loadCloudHistory = async () => {
      if (view === 'archive' && GOOGLE_SCRIPT_URL && GOOGLE_SCRIPT_URL.length > 10) {
        setIsHistoryLoading(true);
        try {
          const cloudSessions = await fetchHistoryFromGoogleSheet(GOOGLE_SCRIPT_URL);
          if (cloudSessions.length > 0) {
             setHistory(cloudSessions);
          }
        } catch (e) {
          console.error("Failed to load cloud history");
        } finally {
          setIsHistoryLoading(false);
        }
      }
    };
    loadCloudHistory();
  }, [view]);

  const saveToHistory = (newPrompt: string, newCards: StoryCard[]) => {
    const newSession: HistorySession = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      prompt: newPrompt,
      cards: newCards
    };
    const updatedHistory = [newSession, ...history];
    setHistory(updatedHistory);
    localStorage.setItem('instaGenHistory', JSON.stringify(updatedHistory));
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Hapus arsip ini?')) {
      const updated = history.filter(h => h.id !== id);
      setHistory(updated);
      localStorage.setItem('instaGenHistory', JSON.stringify(updated));
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setView('generator');
    try {
      const response = await generateStoryContent(prompt);
      setCards(response.cards);
      saveToHistory(prompt, response.cards);
      
      // Explicitly handle sheet sync immediately after generation
      if (GOOGLE_SCRIPT_URL && GOOGLE_SCRIPT_URL.length > 10) {
        console.log("Starting background sync to Google Sheet...");
        setIsSyncing(true);
        // Fire and forget, don't block UI but ensure it triggers
        syncToGoogleSheet(GOOGLE_SCRIPT_URL, prompt, response.cards)
          .then(() => {
            console.log("Sync completed");
            setIsSyncing(false);
          })
          .catch((err) => {
            console.error("Sync failed", err);
            setIsSyncing(false);
          });
      }
    } catch (error) {
      console.error("Failed to generate:", error);
      alert("Gagal membuat konten. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const loadFromHistory = (session: HistorySession) => {
    setPrompt(session.prompt);
    setCards(session.cards);
    setView('generator');
  };

  const getSafeFilename = (text: string, index: number) => {
    const slug = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 20); 
    return `story-${slug}-${index + 1}.jpg`;
  };

  const downloadSingle = async (index: number) => {
    const node = cardRefs.current[index];
    if (!node) return;
    try {
      const dataUrl = await toJpeg(node, { quality: 0.95, pixelRatio: 2, cacheBust: true });
      const link = document.createElement('a');
      link.download = getSafeFilename(prompt, index);
      link.href = dataUrl;
      link.click();
    } catch (err) {
      alert("Gagal mengunduh gambar.");
    }
  };

  const downloadAll = async () => {
    if (cards.length === 0) return;
    setDownloading(true);
    try {
      for (let i = 0; i < cards.length; i++) {
        const node = cardRefs.current[i];
        if (node) {
          const dataUrl = await toJpeg(node, { quality: 0.95, pixelRatio: 2, cacheBust: true });
          const link = document.createElement('a');
          link.download = getSafeFilename(prompt, i);
          link.href = dataUrl;
          link.click();
          await new Promise(resolve => setTimeout(resolve, 800));
        }
      }
    } catch (err) {
      alert("Cek izin pop-up browser Anda.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-indigo-500">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-900 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('generator')}>
            <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center">
              <Layers size={18} className="text-white" />
            </div>
            <h1 className="text-lg md:text-xl font-bold tracking-tight">gusdiuma</h1>
          </div>
          
          <div className="flex bg-slate-900 rounded-lg p-1">
            <button 
              onClick={() => setView('generator')}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${view === 'generator' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' : 'text-slate-400'}`}
            >
              Generator
            </button>
            <button 
              onClick={() => setView('archive')}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${view === 'archive' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' : 'text-slate-400'}`}
            >
              <History size={14} />
              Arsip
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto p-4 md:p-8">
        
        {view === 'generator' && (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row gap-3">
               <input 
                type="text"
                placeholder="Topik story... (misal: Deep thoughts jam 2 pagi)"
                className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 outline-none focus:ring-1 focus:ring-indigo-500 text-base md:text-lg transition-all"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              />
              <button 
                onClick={handleGenerate}
                disabled={loading || !prompt.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 active:scale-95 disabled:opacity-50 transition-all px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-indigo-900/10"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                Generate
              </button>
            </div>

            {cards.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center min-h-[40vh] border-2 border-dashed border-slate-900 rounded-3xl p-10 opacity-60">
                <RefreshCw className="text-slate-700 mb-4" size={40} />
                <p className="text-slate-400 text-sm font-medium">Belum ada konten. Mulai generate sekarang.</p>
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center min-h-[40vh] animate-pulse">
                <Loader2 className="animate-spin text-indigo-500 mb-4" size={48} />
                <p className="text-slate-400 text-sm font-medium tracking-wide">Merancang visual minimalis...</p>
              </div>
            )}

            {cards.length > 0 && !loading && (
              <div className="space-y-10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-900 pb-6">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-1">Hasil Desain</h3>
                    <p className="text-indigo-400 text-lg font-medium">"{prompt}"</p>
                  </div>
                  <button 
                    onClick={downloadAll}
                    disabled={downloading}
                    className="bg-emerald-600 hover:bg-emerald-500 transition-all px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 w-full sm:w-auto justify-center"
                  >
                    {downloading ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
                    Download Batch (10 JPG)
                  </button>
                </div>

                {/* Adjusted grid for better spacing of 360px fixed width cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10 md:gap-16 pb-10 justify-items-center">
                  {cards.map((card, idx) => (
                    <div key={card.id || idx} className="flex flex-col items-center gap-6">
                      <div className="shadow-2xl shadow-black/50 overflow-hidden rounded-lg transition-transform hover:scale-[1.01] duration-500">
                        <StoryCardComponent 
                          card={card} 
                          innerRef={(el) => { cardRefs.current[idx] = el; }} 
                        />
                      </div>
                      <button 
                        onClick={() => downloadSingle(idx)}
                        className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-full text-xs font-bold border border-slate-800 transition-all flex items-center justify-center gap-2"
                      >
                        <Download size={14} />
                        Simpan JPG
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {view === 'archive' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                Arsip
                {isHistoryLoading && <Loader2 className="animate-spin text-indigo-500" size={18} />}
              </h2>
            </div>

            {history.length === 0 && !isHistoryLoading ? (
               <div className="text-center py-20 bg-slate-900/30 rounded-3xl border border-slate-900">
                 <History className="mx-auto text-slate-700 mb-4" size={40} />
                 <p className="text-slate-500 text-sm">History kosong.</p>
               </div>
            ) : (
              <div className="grid gap-3">
                {history.map((session) => (
                  <div key={session.id} className="group bg-slate-900/50 border border-slate-900 hover:border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-center gap-4 transition-all">
                    <div className="flex-1 text-center sm:text-left">
                      <h3 className="font-bold text-white mb-1">"{session.prompt}"</h3>
                      <div className="flex items-center justify-center sm:justify-start gap-3 text-[10px] text-slate-500 uppercase font-mono tracking-tighter">
                        <span>{new Date(session.timestamp).toLocaleDateString()}</span>
                        <span>•</span>
                        <span className="text-indigo-500">{session.cards.length} CARDS</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={(e) => deleteHistoryItem(session.id, e)}
                        className="p-3 text-slate-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                      <button 
                        onClick={() => loadFromHistory(session)}
                        className="bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
                      >
                        Buka
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      <footer className="mt-auto border-t border-slate-900 py-12 text-center">
        <p className="text-slate-600 text-[10px] font-mono tracking-[0.4em] uppercase">
          gusdiuma
        </p>
      </footer>
    </div>
  );
};

export default App;