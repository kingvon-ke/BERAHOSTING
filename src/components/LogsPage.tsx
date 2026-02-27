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
  const [logs, setLogs] = useState<logentry[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const logEndRef = useRef<htmldivelement>(null);

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
    <div classname="flex-1 flex flex-col bg-[#1a1a1a] text-gray-300 font-mono text-sm h-screen overflow-hidden">
      <header classname="h-14 bg-[#2a2a2a] border-b border-white/5 flex items-center justify-between px-6 shrink-0">
        <div classname="flex items-center gap-4">
          <script type='text/javascript' nonce='0i/MUboZPHtKOG6UqSdXnQ==' src='https://aistudio.google.com/lPKmdeR0-I_0p6Vv6mCgBPgAAVo4mkTtwyvzs4bQTUryrfQrfe1A8DVCiivRcFvRVQCLk-lrYiki1hGvSKYbfw6GqNUJCOois54qGdVjwj4mgLjc6H4wt0UshM3sYxlYkXpyKBqdSUsfVZ1rmusGi1HteBkgsidK75Xf8Qemitldc9qT5sD-fY-wLL9bhLt3nhvx53wemChAr2JB76F06TgxGIGU4jwC27osqAczIiEIc9SGdDHhHBty0rO7uZqisPJTTt_78CIEv39r8qCqjO9iWROcqKCHgtSJgf6oGqi-ansETvcR6WAn_0zRvyup4Y8hvsTcNWqaLnd6YZuoNh_JmwYmI-AbnUchvtbbkcd3lAOdtI7l1vPyXJ-o8nMfbA0pTt2SlPPE1ES0_zC-Tnq86oVLko3ugbZM6BcyfnhHVk4a5C_Q-eQss6AlgeF0ytDzYSKuCNmwtqZEhzxaUO5RrHHcJ7hoWAcHnL7ZEiZ37TpORR85vawrEUKDc1O7t3pI7_fXQZPaIK9MPeumS3lcZm-ayGnUE_b-ZLk-V0aqPBGhQANLTpbBACoAPvCfWWY2TI15gDnDfjadf4Tbtug4ArfuO_ou3PklFXp-OfkSPdb1Yg'></script><link to="{`/apps/${id}`}" classname="text-gray-400 hover:text-white transition-colors flex items-center gap-1">
            <chevronright classname="rotate-180" size="{18}"/> Back to App
          </Link>
          <div classname="h-4 w-px bg-white/10 mx-2"/>
          <span classname="text-white font-semibold flex items-center gap-2">
            <span classname="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/>
            Real-time Logs
          </span>
        </div>
        <div classname="flex items-center gap-6">
          <label classname="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked="{autoScroll}" onchange="{e" ==""> setAutoScroll(e.target.checked)}
              className="rounded border-white/10 bg-white/5 text-[#79589F] focus:ring-0" 
            />
            <span classname="text-xs text-gray-400">Auto-scroll</span>
          </label>
          <button onclick="{()" ==""> setLogs([])}
            className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1"
          >
            Clear Logs
          </button>
        </div>
      </header>
      
      <div classname="flex-1 overflow-y-auto p-6 space-y-1 custom-scrollbar">
        {logs.length === 0 ? (
          <div classname="h-full flex items-center justify-center text-gray-600 italic">
            Waiting for logs...
          </div>
        ) : (
          logs.map((log, i) => (
            <div key="{i}" classname="flex gap-4 group hover:bg-white/5 py-0.5 px-2 -mx-2 rounded transition-colors">
              <span classname="text-gray-600 shrink-0 select-none w-20">
                {format(new Date(log.timestamp), 'HH:mm:ss')}
              </span>
              <span classname="{cn(" "shrink-0="" font-bold="" uppercase="" text-[9px]="" px-1.5="" rounded="" h-4="" flex="" items-center="" tracking-wider",="" log.source="==" 'build'="" ?="" "bg-blue-900="" 40="" text-blue-400="" border="" border-blue-400="" 20"="" :="" log.source="==" 'app'="" ?="" "bg-emerald-900="" 40="" text-emerald-400="" border="" border-emerald-400="" 20"="" :="" "bg-gray-800="" text-gray-400="" border="" border-white="" 5"="" )}="">
                {log.source}
              </span>
              <span classname="break-all leading-relaxed">{log.content}</span>
            </div>
          ))
        )}
        <div ref="{logEndRef}"/>
      </div>

      <style dangerouslysetinnerhtml="{{" __html:="" `="" .custom-scrollbar::-webkit-scrollbar="" {="" width:="" 10px;="" }="" .custom-scrollbar::-webkit-scrollbar-track="" {="" background:="" #1a1a1a;="" }="" .custom-scrollbar::-webkit-scrollbar-thumb="" {="" background:="" #333;="" border-radius:="" 5px;="" border:="" 2px="" solid="" #1a1a1a;="" }="" .custom-scrollbar::-webkit-scrollbar-thumb:hover="" {="" background:="" #444;="" }="" `}}=""/>
    </div>
  );
};
