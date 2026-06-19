import React, { useMemo } from 'react';
import { NeuralLog } from '../types';

interface LogsPanelProps {
  logs: NeuralLog[];
  showLogs: boolean;
  setShowLogs: (v: boolean) => void;
}

export const LogsPanel: React.FC<LogsPanelProps> = ({ logs, showLogs, setShowLogs }) => {
  const stats = useMemo(() => {
    const total = logs.length;
    const success = logs.filter((l) => l.status === 'SUCCESS').length;
    const errorCount = logs.filter((l) => l.status === 'ERROR').length;
    return { total, success, errorCount, rate: total > 0 ? Math.round((success / total) * 100) : 0 };
  }, [logs]);

  return (
    <div
      className={`fixed top-[73px] right-0 bottom-0 w-80 bg-slate-950/98 backdrop-blur-3xl border-l border-white/5 z-40 transition-transform duration-500 shadow-2xl ${
        showLogs ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="p-6 h-full flex flex-col">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xs font-black text-white uppercase tracking-widest">
            Neural Logistics Monitor
          </h3>
          <button onClick={() => setShowLogs(false)} className="text-slate-500 hover:text-white transition-colors">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="p-4 bg-blue-600/5 border border-blue-500/10 rounded-xl space-y-1">
            <p className="text-[8px] text-blue-400 font-black uppercase tracking-widest">Efficiency</p>
            <p className="text-xl font-mono font-black text-white">{stats.rate}%</p>
          </div>
          <div className="p-4 bg-emerald-600/5 border border-emerald-500/10 rounded-xl space-y-1">
            <p className="text-[8px] text-emerald-400 font-black uppercase tracking-widest">Total Ops</p>
            <p className="text-xl font-mono font-black text-white">{stats.total}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 font-mono text-[10px]">
          {logs.length === 0 ? (
            <div className="text-center mt-20 space-y-4 opacity-30">
              <i className="fa-solid fa-terminal text-2xl"></i>
              <p className="text-slate-700 uppercase tracking-widest">Waiting for Input...</p>
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-3 hover:border-white/10 transition-colors">
                <div className="flex justify-between items-center">
                  <span className="text-emerald-500 font-black">NODE_{log.id}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[8px] font-black ${
                      log.status === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {log.status}
                  </span>
                </div>
                <div className="space-y-1 text-slate-500">
                  <p className="flex justify-between">
                    <span>PROJECT:</span> <span className="text-slate-300">{log.projectId}</span>
                  </p>
                  <p className="flex justify-between">
                    <span>MODEL:</span> <span className="text-slate-300">{log.model}</span>
                  </p>
                  <p className="flex justify-between">
                    <span>TYPE:</span> <span className="text-slate-300">{log.operation}</span>
                  </p>
                  <p className="flex justify-between">
                    <span>TIME:</span>{' '}
                    <span className="text-slate-300">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
