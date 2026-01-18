import React, { useState } from 'react';
import { AlertCircle, AlertTriangle, Info, Terminal, ChevronDown, ChevronUp, Activity, Layers, Hash } from 'lucide-react';
import { format } from 'date-fns';

interface LogCardProps {
  log: {
    log_id: number;
    timestamp: string;
    severity: string;
    message: string;
    thread_name?: string;
    thread_id?: string;
    project_name?: string;
    stack_trace?: string;
  };
}

export default function LogCard({ log }: LogCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Color Logic
  const getSeverityStyle = (severity: string) => {
    switch (severity?.toUpperCase()) {
      case 'HIGH': return 'text-red-400 border-red-900/50 bg-red-900/10';
      case 'MEDIUM': return 'text-amber-400 border-amber-900/50 bg-amber-900/10';
      default: return 'text-emerald-400 border-emerald-900/50 bg-emerald-900/10';
    }
  };

  const Icon = () => {
    switch (log.severity?.toUpperCase()) {
      case 'HIGH': return <AlertCircle size={16} />;
      case 'MEDIUM': return <AlertTriangle size={16} />;
      default: return <Info size={16} />;
    }
  };

  return (
    <div 
      className={`bg-surface border border-border rounded-lg mb-3 transition-all duration-200 overflow-hidden ${
        isExpanded ? 'ring-1 ring-indigo-500/50 shadow-lg shadow-black/40' : 'hover:border-slate-600'
      }`}
    >
      {/* --- HEADER (Always Visible) --- */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-4 cursor-pointer flex flex-col gap-2"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {/* Severity Badge */}
            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono border ${getSeverityStyle(log.severity)}`}>
              <Icon />
              <span className="font-bold tracking-wide">{log.severity}</span>
            </div>
            
            {/* Timestamp */}
            <span className="text-slate-500 text-xs font-mono ml-1">
              {format(new Date(log.timestamp), 'HH:mm:ss')}
            </span>
          </div>

          {/* Expand Toggle Icon */}
          <button className="text-slate-500 hover:text-slate-300 transition-colors">
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
        
        {/* Main Message (Truncated if closed, full if open) */}
        <p className={`text-slate-300 text-sm font-mono leading-relaxed ${!isExpanded && 'line-clamp-2'}`}>
          {log.message}
        </p>
      </div>
      
      {/* --- EXPANDED DETAILS --- */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-0 animate-in slide-in-from-top-2 duration-200">
          
          <div className="h-px bg-border my-3" />
          
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-1">
                <Terminal size={10} /> Project
              </span>
              <span className="text-slate-300 text-xs font-mono">{log.project_name || 'N/A'}</span>
            </div>
            
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-1">
                <Activity size={10} /> Thread
              </span>
              <span className="text-slate-300 text-xs font-mono truncate" title={log.thread_name}>
                {log.thread_name || 'Main'} <span className="text-slate-600">({log.thread_id || 'ID:?'})</span>
              </span>
            </div>
          </div>

          {/* Stack Trace Section */}
          {log.stack_trace && (
            <div className="mt-2">
               <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-1 mb-1.5">
                <Layers size={10} /> Stack Trace
              </span>
              <div className="bg-slate-950 rounded border border-slate-800 p-3 overflow-x-auto">
                <pre className="text-red-300/90 text-[10px] font-mono leading-5 whitespace-pre">
                  {log.stack_trace}
                </pre>
              </div>
            </div>
          )}
          
          {/* ID Footer */}
           <div className="mt-3 flex justify-end">
             <span className="text-[10px] text-slate-600 font-mono flex items-center gap-1">
               <Hash size={10} /> Log ID: {log.log_id}
             </span>
           </div>

        </div>
      )}
    </div>
  );
}