import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  Trash2,
  Plus,
  Instagram,
  Activity,
  Compass,
  Fingerprint,
  ArrowUpRight,
  BarChart3,
  Target,
  Cpu,
  Github,
  Linkedin,
  FileText,
  Table,
  Image as ImageIcon,
  ChevronDown,
  AlertTriangle,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const CURRENCIES = {
  USD: { symbol: '$', code: 'USD' },
  BDT: { symbol: '৳', code: 'BDT' },
  EUR: { symbol: '€', code: 'EUR' },
  GBP: { symbol: '£', code: 'GBP' },
};

const generateColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - c.length) + c;
};

export default function App() {
  const [currency, setCurrency] = useState(
    () => localStorage.getItem('bb_curr') || 'USD'
  );

  // UPDATED: Budget now starts at 0 and does not pull from localStorage
  const [budget, setBudget] = useState(0);

  const [expenses, setExpenses] = useState(
    () => JSON.parse(localStorage.getItem('bb_expenses')) || []
  );
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [isEdit, setIsEdit] = useState(false);
  const [showDownload, setShowDownload] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    localStorage.setItem('bb_curr', currency);
    // REMOVED: budget is no longer saved to localStorage to ensure it resets on refresh
    localStorage.setItem('bb_expenses', JSON.stringify(expenses));
  }, [currency, expenses]);

  const total = expenses.reduce((s, i) => s + i.amount, 0);
  const ratio = budget > 0 ? total / budget : 0;
  const curr = CURRENCIES[currency];

  const chartData = useMemo(() => {
    if (expenses.length === 0)
      return [{ name: 'EMPTY', value: 1, fill: '#18181b', budgetPerc: 0 }];
    return expenses.map((e) => ({
      name: e.name,
      value: e.amount,
      fill: generateColor(e.name),
      budgetPerc: budget > 0 ? ((e.amount / budget) * 100).toFixed(1) : 0,
    }));
  }, [expenses, budget]);

  const addExpense = (e) => {
    e.preventDefault();
    if (!name || !price) return;
    setExpenses([
      { id: Date.now(), name: name.toUpperCase(), amount: Number(price) },
      ...expenses,
    ]);
    setName('');
    setPrice('');
  };

  const handleClearAll = () => {
    setExpenses([]);
    setShowClearConfirm(false);
  };

  // Download logic...
  const downloadCSV = () => {
    const headers = [
      'Date',
      'Item',
      `Amount (${currency})`,
      '% of Budget',
    ].join(',');
    const rows = expenses.map(
      (e) =>
        `${new Date(e.id).toLocaleDateString()},${e.name},${e.amount},${
          budget > 0 ? ((e.amount / budget) * 100).toFixed(2) : 0
        }%`
    );
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'budget-report.csv';
    link.click();
  };

  const downloadPNG = async () => {
    const element = document.body;
    const canvas = await html2canvas(element, {
      backgroundColor: '#000',
      scale: 2,
    });
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = 'budget-snapshot.png';
    link.click();
  };

  const downloadPDF = async () => {
    const element = document.body;
    const canvas = await html2canvas(element, {
      backgroundColor: '#000',
      scale: 2,
    });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save('budget-statement.pdf');
  };

  const handleDownload = (type) => {
    if (type === 'csv') downloadCSV();
    if (type === 'png') downloadPNG();
    if (type === 'pdf') downloadPDF();
    setShowDownload(false);
  };

  return (
    <div className="relative min-h-screen bg-black text-zinc-300 font-sans selection:bg-indigo-500/30">
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-50 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      {/* POPUP MENU FOR CLEAR ALL */}
      <AnimatePresence>
        {showClearConfirm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 backdrop-blur-sm bg-black/60">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4 text-rose-500">
                <AlertTriangle size={24} />
                <h3 className="text-lg font-bold uppercase tracking-tighter">
                  Confirm Reset
                </h3>
              </div>
              <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
                Are you sure you want to delete all transactions? This action is
                permanent.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="py-3 rounded-xl border border-zinc-800 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearAll}
                  className="py-3 rounded-xl bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 transition-colors shadow-lg shadow-rose-600/20"
                >
                  Clear All
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <nav className="border-b border-zinc-800/50 bg-black/80 backdrop-blur-xl sticky top-0 z-[100]">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu size={18} className="text-indigo-500" />
            <span className="font-black text-xs md:text-sm tracking-[0.3em] text-white uppercase">
              Budget<span className="text-indigo-500">.</span>Bite
            </span>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            <div className="hidden sm:flex items-center gap-1 border border-zinc-800 rounded-full px-2 py-1">
              {Object.keys(CURRENCIES).map((c) => (
                <button
                  key={c}
                  onClick={() => setCurrency(c)}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-all ${
                    currency === c
                      ? 'bg-zinc-800 text-indigo-400'
                      : 'text-zinc-600 hover:text-zinc-400'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            <div
              className="relative"
              onMouseLeave={() => setShowDownload(false)}
            >
              <button
                onMouseEnter={() => setShowDownload(true)}
                onClick={() => setShowDownload(!showDownload)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white transition-all rounded-md shadow-lg shadow-indigo-600/20 group"
              >
                <span className="text-[11px] font-bold uppercase tracking-widest">
                  Download
                </span>
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-300 ${
                    showDownload ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <AnimatePresence>
                {showDownload && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 pt-2 w-48 z-[110]"
                  >
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl overflow-hidden">
                      <button
                        onClick={() => handleDownload('png')}
                        className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors border-b border-zinc-800/50 uppercase"
                      >
                        <ImageIcon size={14} className="text-indigo-400" /> Save
                        Image
                      </button>
                      <button
                        onClick={() => handleDownload('csv')}
                        className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors border-b border-zinc-800/50 uppercase"
                      >
                        <Table size={14} className="text-emerald-400" /> Export
                        CSV
                      </button>
                      <button
                        onClick={() => handleDownload('pdf')}
                        className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors uppercase"
                      >
                        <FileText size={14} className="text-rose-400" />{' '}
                        Download PDF
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-[1400px] mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="mb-10">
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-white uppercase leading-none">
            Master your <span className="text-indigo-500 italic">Wallet.</span>
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-5">
          <div className="lg:col-span-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/50 p-8 flex flex-col justify-between min-h-[240px]">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black text-zinc-500 tracking-widest uppercase">
                  Total Spent
                </span>
                <Activity size={18} className="text-indigo-500" />
              </div>
              <h2 className="text-5xl md:text-6xl font-light text-white tracking-tighter">
                <span className="text-2xl opacity-30 mr-2">{curr.symbol}</span>
                {total.toLocaleString()}
              </h2>
            </div>
            <div className="mt-8">
              <div className="flex justify-between mb-2">
                <span className="text-[10px] font-mono text-zinc-500 uppercase">
                  Usage
                </span>
                <span className="text-[10px] font-mono text-zinc-500">
                  {(ratio * 100).toFixed(1)}%
                </span>
              </div>
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(ratio * 100, 100)}%` }}
                  className={`h-full transition-colors duration-500 ${
                    ratio > 1 ? 'bg-rose-500' : 'bg-indigo-500'
                  }`}
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-5">
            <div
              className="rounded-2xl bg-zinc-900/40 border border-zinc-800/50 p-6 flex justify-between items-center group cursor-pointer hover:border-indigo-500/30 transition-all"
              onClick={() => setIsEdit(true)}
            >
              <div>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">
                  Budget Limit
                </p>
                {isEdit ? (
                  <input
                    autoFocus
                    className="bg-transparent text-2xl font-light text-white outline-none border-b border-indigo-500 w-full"
                    type="number"
                    defaultValue={budget}
                    onKeyDown={(e) =>
                      e.key === 'Enter' &&
                      (setBudget(Number(e.target.value)), setIsEdit(false))
                    }
                    onBlur={(e) => (
                      setBudget(Number(e.target.value)), setIsEdit(false)
                    )}
                  />
                ) : (
                  <h3 className="text-2xl font-light text-white">
                    {curr.symbol}
                    {budget.toLocaleString()}
                  </h3>
                )}
              </div>
              <Target
                size={20}
                className="text-zinc-700 group-hover:text-indigo-500 transition-colors"
              />
            </div>

            <div className="rounded-2xl bg-zinc-900/40 border border-zinc-800/50 p-6 flex justify-between items-center">
              <div>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">
                  Safe to Spend
                </p>
                <h3
                  className={`text-2xl font-light ${
                    total > budget ? 'text-rose-500' : 'text-emerald-400'
                  }`}
                >
                  {curr.symbol}
                  {(budget - total).toLocaleString()}
                </h3>
              </div>
              <Fingerprint size={20} className="text-zinc-700" />
            </div>
          </div>

          <div className="lg:col-span-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/50 p-6 flex flex-col min-h-[300px]">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">
              Allocation vs Budget
            </span>
            <div className="flex-1 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                    label={({ payload }) =>
                      expenses.length > 0 ? `${payload.budgetPerc}%` : ''
                    }
                  >
                    {chartData.map((e, i) => (
                      <Cell key={i} fill={e.fill} className="outline-none" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      border: '1px solid #3f3f46',
                      borderRadius: '8px',
                      fontSize: '11px',
                    }}
                    formatter={(val, name, props) => [
                      `${curr.symbol}${val} (${props.payload.budgetPerc}% of budget)`,
                      name,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/50 p-8 order-2 lg:order-1">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400 mb-8 flex items-center gap-2">
              <Plus size={16} /> New Transaction
            </h3>
            <form onSubmit={addExpense} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                  Description
                </label>
                <input
                  required
                  className="w-full bg-black/40 border border-zinc-800 rounded-lg p-4 text-sm focus:border-indigo-500 outline-none text-white transition-all"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                  Amount ({currency})
                </label>
                <input
                  required
                  type="number"
                  className="w-full bg-black/40 border border-zinc-800 rounded-lg p-4 text-sm focus:border-indigo-500 outline-none text-white transition-all"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
              <button className="w-full py-4 bg-white text-black hover:bg-indigo-500 hover:text-white text-[11px] font-black uppercase tracking-[0.2em] transition-all rounded-lg flex items-center justify-center gap-2 group">
                Add Entry{' '}
                <ArrowUpRight
                  size={16}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </button>
            </form>
          </div>

          <div className="lg:col-span-8 rounded-2xl bg-zinc-900/40 border border-zinc-800/50 overflow-hidden order-1 lg:order-2 flex flex-col">
            <div className="p-5 border-b border-zinc-800/50 flex justify-between items-center bg-zinc-900/20">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                History Log
              </span>
              {expenses.length > 0 && (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-rose-900/50 bg-rose-500/5 text-rose-500 hover:bg-rose-500 hover:text-white transition-all text-[9px] font-black uppercase tracking-tighter"
                >
                  <Trash2 size={12} /> Clear All
                </button>
              )}
            </div>
            <div className="flex-1 max-h-[450px] overflow-y-auto custom-scroll">
              <AnimatePresence mode="popLayout">
                {expenses.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-zinc-800">
                    <Compass size={40} className="mb-4 opacity-20" />
                    <p className="text-xs font-bold uppercase tracking-widest opacity-20">
                      Clear Workspace
                    </p>
                  </div>
                ) : (
                  expenses.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="p-5 border-b border-zinc-800/30 flex justify-between items-center hover:bg-white/[0.02] transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="w-1.5 h-10 rounded-full"
                          style={{ backgroundColor: generateColor(item.name) }}
                        />
                        <div>
                          <p className="text-sm font-bold text-zinc-100 uppercase">
                            {item.name}
                          </p>
                          <p className="text-[9px] font-mono text-zinc-600 uppercase">
                            {new Date(item.id).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <span className="text-sm font-mono font-bold text-white">
                          -{curr.symbol}
                          {item.amount.toLocaleString()}
                        </span>
                        <button
                          onClick={() =>
                            setExpenses(
                              expenses.filter((e) => e.id !== item.id)
                            )
                          }
                          className="text-zinc-700 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-20 border-t border-zinc-900 p-10 text-center bg-black">
        <div className="flex justify-center gap-10 mb-8">
          <a
            href="https://github.com/Lonerhermit"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-700 hover:text-white transition-colors"
          >
            <Github size={20} />
          </a>
          <a
            href="https://www.instagram.com/lone_rhermit"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-700 hover:text-white transition-colors"
          >
            <Instagram size={20} />
          </a>
          <a
            href="https://www.linkedin.com/in/arefin-al-mahi-4ba524307"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-700 hover:text-white transition-colors"
          >
            <Linkedin size={20} />
          </a>
        </div>
        <p className="text-[10px] font-black text-zinc-800 uppercase tracking-[0.5em]">
          &copy; Build for responsibility // {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
