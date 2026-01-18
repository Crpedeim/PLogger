import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import LogCard from '../components/LogCard';
import { Send, LogOut, Cpu, Search, Trash2, Bot, User as UserIcon, Terminal } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid'; 
import { Key, X, Copy, Check } from 'lucide-react'; 

interface Message {
  role: 'user' | 'ai';
  content: string;
}

interface LogSource {
  log_id: number;
  timestamp: string;
  severity: string;
  message: string;
  thread_name?: string;
  project_name?: string;
}

export default function Dashboard() {
  const { logout } = useAuth();
  
  // 1. INITIALIZE STATE FROM LOCAL STORAGE
  const [query, setQuery] = useState('');

  const [showKeyModal, setShowKeyModal] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [copied, setCopied] = useState(false);
  
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('chat_messages');
    return saved ? JSON.parse(saved) : [
      { role: 'ai', content: 'Hello! I am your Log Assistant. Ask me anything about your system logs.' }
    ];
  });

  const [evidenceLogs, setEvidenceLogs] = useState<LogSource[]>(() => {
    const saved = localStorage.getItem('chat_evidence');
    return saved ? JSON.parse(saved) : [];
  });

  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 2. SESSION ID LOGIC (Keep using sessionStorage or localStorage)
  useEffect(() => {
    let sid = localStorage.getItem('chat_session_id'); // Changed to localStorage
    if (!sid) {
      sid = uuidv4();
      localStorage.setItem('chat_session_id', sid);
    }
    setSessionId(sid);
  }, []);

  // 3. PERSISTENCE EFFECT (Save whenever state changes)
  useEffect(() => {
    localStorage.setItem('chat_messages', JSON.stringify(messages));
    localStorage.setItem('chat_evidence', JSON.stringify(evidenceLogs));
  }, [messages, evidenceLogs]);

  // Scroll logic
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 3. Handle Send
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userText = query;
    setQuery('');
    
    // Add User Message
    setMessages(prev => [...prev, { role: 'user', content: userText }]);
    setLoading(true);

    try {
      // Call Python Backend
      const response = await api.post('/chat/query', {
        session_id: sessionId,
        query: userText
      });

      // Add AI Response
      setMessages(prev => [...prev, { role: 'ai', content: response.data.answer }]);
      
      // Update Evidence Panel (Right Side)
      // Note: We access the 'content' field because of how we structured the backend return
      const rawSources = response.data.sources.map((s: any) => s.content);
      setEvidenceLogs(rawSources);

    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', content: 'Sorry, I encountered an error connecting to the server.' }]);
    } finally {
      setLoading(false);
    }
  };


  const fetchApiKey = async () => {
    try {
      const res = await api.get('/auth/me');
      setApiKey(res.data.user_id);
      setShowKeyModal(true);
    } catch (e) {
      alert("Failed to load API Key");
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 4. Clear Session
  const clearSession = async () => {
    // Optional: Tell backend to delete history
    if (sessionId) {
        try { await api.delete(`/chat/session/${sessionId}`); } catch(e) {}
    }
    
    // Wipe Local Data
    const newSid = uuidv4();
    localStorage.setItem('chat_session_id', newSid);
    localStorage.removeItem('chat_messages');
    localStorage.removeItem('chat_evidence');
    
    // Reset State
    setSessionId(newSid);
    setMessages([{ role: 'ai', content: 'Context cleared. Starting new session.' }]);
    setEvidenceLogs([]);
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="w-16 md:w-20 bg-surface border-r border-border flex flex-col items-center py-6 gap-6 z-10">
        {/* ... Logo ... */}
        
        <div className="flex-1 w-full flex flex-col items-center gap-4 mt-8">
           {/* NEW: API Key Button */}
           <button 
             onClick={fetchApiKey}
             className="p-3 text-slate-500 hover:text-indigo-400 hover:bg-slate-800 rounded-xl transition-all relative group"
           >
             <Key size={20} />
             {/* Tooltip */}
             <span className="absolute left-14 bg-slate-800 text-xs text-slate-200 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
               View API Key
             </span>
           </button>
        </div>

        <button 
          onClick={logout}
          className="p-3 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-xl transition-all"
          title="Logout"
        >
          <LogOut size={20} />
        </button>
      </aside>

      {/* MAIN CONTENT SPLIT */}
      <main className="flex-1 flex flex-col md:flex-row h-full relative">
        
        {/* LEFT: CHAT AREA */}
        <div className="flex-1 flex flex-col h-full relative">
          
          {/* Header */}
          <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-background/50 backdrop-blur-sm z-10">
            <h2 className="font-semibold text-slate-200">Log Assistant</h2>
            <button 
              onClick={clearSession}
              className="text-xs text-slate-500 hover:text-indigo-400 flex items-center gap-2 border border-border px-3 py-1.5 rounded hover:border-indigo-500/50 transition-colors"
            >
              <Trash2 size={12} /> Clear Context
            </button>
          </header>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                
                {/* AI Avatar */}
                {msg.role === 'ai' && (
                  <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0 mt-1">
                    <Bot size={16} className="text-indigo-400" />
                  </div>
                )}

                {/* Bubble */}
                <div className={`
                  max-w-[80%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm
                  ${msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-sm' 
                    : 'bg-surface border border-border text-slate-300 rounded-tl-sm'}
                `}>
                  {msg.content}
                </div>

                {/* User Avatar */}
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-border flex items-center justify-center shrink-0 mt-1">
                    <UserIcon size={16} className="text-slate-400" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-4">
                 <div className="w-8 h-8 rounded-full bg-indigo-600/20 flex items-center justify-center shrink-0">
                    <Bot size={16} className="text-indigo-400 animate-pulse" />
                  </div>
                  <div className="bg-surface border border-border px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1 items-center">
                    <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-75"></div>
                    <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-150"></div>
                  </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-border bg-background">
            <form onSubmit={handleSend} className="relative max-w-3xl mx-auto">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask about errors, threads, or timestamps..."
                className="w-full bg-surface border border-border rounded-xl py-3.5 pl-5 pr-12 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-slate-600 shadow-lg"
              />
              <button 
                type="submit"
                disabled={!query.trim() || loading}
                className="absolute right-2 top-2 p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg disabled:opacity-50 disabled:bg-slate-700 transition-colors"
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT: EVIDENCE PANEL */}
        <div className="w-full md:w-[400px] border-l border-border bg-background/50 flex flex-col h-[40vh] md:h-full">
          <div className="p-4 border-b border-border flex items-center gap-2">
            <Search size={16} className="text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Retrieval Evidence</h3>
            <span className="ml-auto text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
              {evidenceLogs.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 bg-slate-950/30">
            {evidenceLogs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-3">
                <Terminal size={32} className="opacity-20" />
                <p className="text-sm">No logs retrieved yet.</p>
              </div>
            ) : (
              evidenceLogs.map((log) => (
                <LogCard key={log.log_id} log={log} />
              ))
            )}
          </div>
        </div>

      </main>



      {/* --- NEW: API KEY MODAL --- */}
      {showKeyModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-surface border border-border p-6 rounded-lg w-full max-w-md shadow-2xl transform scale-100 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Key className="text-indigo-500" size={18} /> API Configuration
              </h3>
              <button onClick={() => setShowKeyModal(false)} className="text-slate-500 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <p className="text-slate-400 text-sm mb-4">
              Use this ID to initialize the Java Logger SDK.
            </p>

            <div className="bg-background border border-border rounded p-3 flex items-center gap-3">
              <code className="flex-1 font-mono text-indigo-300 text-sm truncate">
                {apiKey}
              </code>
              <button 
                onClick={copyToClipboard}
                className="p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
                title="Copy"
              >
                {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
              </button>
            </div>
          </div>
        </div>
      )}

      
    </div>
  );
}