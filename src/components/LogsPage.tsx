import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { LogEntry } from '../types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const LogsPage = () => {
  const { id } = useParams();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch initial logs
    fetch(`/api/apps/${id}/logs`)
      .then(res => res.json())
      .then(setLogs)
      .catch(err => console.error("Failed to fetch logs:", err));

    // Setup WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}`);

    socket.onopen = () => {
      console.log("WebSocket connected");
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'log' && message.data.appId === id) {
          setLogs(prev => [...prev, message.data]);
        }
      } catch (e) {
        console.error("Failed to parse socket message:", e);
      }
    };

    socket.onerror = (err) => {
      console.error("WebSocket error:", err);
    };

    socket.onclose = () => {
      console.log("WebSocket disconnected");
    };

    return () => socket.close();
  }, [id]);

  useEffect(() => {
    if (autoScroll && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  return (
    <div className="flex-1 flex flex-col bg-[#1a1a1a] text-gray-300 font-mono text-sm h-screen overflow-hidden">
      <header className="h-14 bg-[#2a2a2a] border-b border-white/5 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          {/* Removed the script tag - it doesn't belong here */}
          <Link to={`/apps/${id}`} className="text-gray-400 hover:text-white transition-colors flex items-center gap-1">
            <ChevronRight className="rotate-180" size={18} /> Back to App
          </Link>
          <div className="h-4 w-px bg-white/10 mx-2"/>
          <span className="text-white font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/>
            Real-time Logs
          </span>
        </div>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={autoScroll} 
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="rounded border-white/10 bg-white/5 text-[#79589F] focus:ring-0" 
            />
            <span className="text-xs text-gray-400">Auto-scroll</span>
          </label>
          <button 
            onClick={() => setLogs([])}
            className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1"
          >
            Clear Logs
          </button>
        </div>
      </header>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-1 custom-scrollbar">
        {logs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-600 italic">
            Waiting for logs...
          </div>
        ) : (
          logs.map((log, i) => (
            <div key={i} className="flex gap-4 group hover:bg-white/5 py-0.5 px-2 -mx-2 rounded transition-colors">
              <span className="text-gray-600 shrink-0 select-none w-20">
                {format(new Date(log.timestamp), 'HH:mm:ss')}
              </span>
              <span className={cn(
                "shrink-0 font-bold uppercase text-[9px] px-1.5 rounded h-4 flex items-center tracking-wider",
                log.source === 'build' 
                  ? "bg-blue-900/40 text-blue-400 border border-blue-400/20" 
                  : log.source === 'app' 
                    ? "bg-emerald-900/40 text-emerald-400 border border-emerald-400/20" 
                    : "bg-gray-800 text-gray-400 border border-white/5"
              )}>
                {log.source}
              </span>
              <span className="break-all leading-relaxed">{log.content}</span>
            </div>
          ))
        )}
        <div ref={logEndRef}/>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          .custom-scrollbar::-webkit-scrollbar {
            width: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #1a1a1a;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #333;
            border-radius: 5px;
            border: 2px solid #1a1a1a;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #444;
          }
        `
      }} />
    </div>
  );
};
