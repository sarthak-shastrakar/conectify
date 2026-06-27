import React, { useContext, useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, Plus, Search, Trash2, Edit2, Check, Menu, X, 
  Send, Paperclip, Mic, Bot, User, Sparkles, Bell, Sun, 
  ChevronLeft, ChevronRight, Copy, LogOut, Home, History, Compass, CheckCircle2
} from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';
import withAuth from '../utils/withAuth';
import api from '../utils/api';
import { API_ROUTES } from '../utils/constants';

function AIChat() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userData, logout } = useContext(AuthContext);
  const chatEndRef = useRef(null);

  const [chatQuery, setChatQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  
  // Sidebar state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  
  // Notification / Dropdown states
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState(null);

  // ChatGPT-style Chat Sessions state loaded from localStorage
  const [sessions, setSessions] = useState(() => {
    const saved = localStorage.getItem("conectify_ai_sessions");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return [
      {
        id: 'session_' + Date.now(),
        title: 'Meeting Code Help',
        createdAt: Date.now(),
        messages: [
          { sender: 'AI', text: 'Hello! I am Conectify AI, your premium product companion. Ask me about video calls, meeting code setups, troubleshoot devices, or general helper requests! 🤖' }
        ]
      }
    ];
  });

  const [activeSessionId, setActiveSessionId] = useState(sessions[0].id);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');

  // Sync sessions with localStorage
  useEffect(() => {
    localStorage.setItem("conectify_ai_sessions", JSON.stringify(sessions));
  }, [sessions]);

  // Compute active session history
  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
  const chatHistory = activeSession ? activeSession.messages : [];

  // Auto scroll to chat bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, aiLoading]);

  const selectSession = (id) => {
    setActiveSessionId(id);
    setMobileOpen(false);
  };

  const handleSendChatMessage = async () => {
    if (!chatQuery.trim()) return;
    const userMsg = { sender: 'User', text: chatQuery };

    // Optimistically push user query into active session
    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        return { ...s, messages: [...s.messages, userMsg] };
      }
      return s;
    }));

    const currentQuery = chatQuery;
    setChatQuery('');
    setAiLoading(true);

    try {
      const res = await api.post(API_ROUTES.CHATBOT, {
        message: currentQuery,
        chatHistory: chatHistory
      });
      const aiReply = { sender: 'AI', text: res.data.reply };

      setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
          let newTitle = s.title;
          if (s.title === "New Chat" && s.messages.length <= 2) {
            newTitle = currentQuery.slice(0, 24) + (currentQuery.length > 24 ? "..." : "");
          }
          return { ...s, title: newTitle, messages: [...s.messages, aiReply] };
        }
        return s;
      }));
    } catch (err) {
      console.error("AI companion chat failed:", err);
      setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
          return { ...s, messages: [...s.messages, { sender: 'AI', text: 'Sorry, I failed to reach the AI servers. Please try again! ⚠️' }] };
        }
        return s;
      }));
    } finally {
      setAiLoading(false);
    }
  };

  const handleNewChat = () => {
    const newSessId = 'session_' + Date.now();
    const newSess = {
      id: newSessId,
      title: 'New Chat',
      createdAt: Date.now(),
      messages: [
        { sender: 'AI', text: 'Started a fresh conversation! Ask me anything about Conectify. 🤖' }
      ]
    };
    setSessions(prev => [newSess, ...prev]);
    setActiveSessionId(newSessId);
    setSearchQuery('');
    setMobileOpen(false);
  };

  const handleDeleteSession = (idToDelete, e) => {
    e.stopPropagation();
    if (sessions.length === 1) {
      const freshId = 'session_' + Date.now();
      setSessions([
        {
          id: freshId,
          title: 'New Chat',
          createdAt: Date.now(),
          messages: [
            { sender: 'AI', text: 'Hello! Ask me anything about Conectify. 🤖' }
          ]
        }
      ]);
      setActiveSessionId(freshId);
      return;
    }

    const updated = sessions.filter(s => s.id !== idToDelete);
    setSessions(updated);
    if (activeSessionId === idToDelete) {
      setActiveSessionId(updated[0].id);
    }
  };

  const handleClearAllSessions = () => {
    if (window.confirm("Are you sure you want to delete all chat sessions? This cannot be undone.")) {
      const freshId = 'session_' + Date.now();
      setSessions([
        {
          id: freshId,
          title: 'New Chat',
          createdAt: Date.now(),
          messages: [
            { sender: 'AI', text: 'Hello! Ask me anything about Conectify. 🤖' }
          ]
        }
      ]);
      setActiveSessionId(freshId);
      setMobileOpen(false);
    }
  };

  const startEditing = (id, currentTitle, e) => {
    e.stopPropagation();
    setEditingSessionId(id);
    setEditingTitle(currentTitle);
  };

  const saveTitle = (id, e) => {
    if (e) e.stopPropagation();
    if (!editingTitle.trim()) {
      setEditingSessionId(null);
      return;
    }
    setSessions(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, title: editingTitle.trim() };
      }
      return s;
    }));
    setEditingSessionId(null);
  };

  const handleTitleKeyDown = (id, e) => {
    if (e.key === 'Enter') {
      saveTitle(id);
    } else if (e.key === 'Escape') {
      setEditingSessionId(null);
    }
  };

  const handleCopyMessage = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(idx);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  // Group and filter chat sessions temporally
  const getGroupedSessions = () => {
    const filtered = sessions.filter(s => 
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.messages.some(m => m.text.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const sevenDays = 7 * oneDay;

    const groups = {
      'Today': [],
      'Yesterday': [],
      'Previous 7 Days': [],
      'Older': []
    };

    filtered.forEach(session => {
      let time = session.createdAt;
      if (!time) {
        const idParts = session.id.split('_');
        if (idParts.length > 1 && !isNaN(idParts[1])) {
          time = parseInt(idParts[1]);
        } else {
          time = now;
        }
      }

      const diff = now - time;
      if (diff < oneDay) {
        groups['Today'].push(session);
      } else if (diff < 2 * oneDay) {
        groups['Yesterday'].push(session);
      } else if (diff < sevenDays) {
        groups['Previous 7 Days'].push(session);
      } else {
        groups['Older'].push(session);
      }
    });

    return groups;
  };

  const formatSessionDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const initials = userData?.name
    ? userData.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  const navItems = [
    { label: 'Home', icon: Home, path: '/home' },
    { label: 'AI Companion', icon: Sparkles, path: '/ai-assistant' },
    { label: 'History', icon: History, path: '/history' },
    { label: 'Profile', icon: User, path: '/profile' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans flex flex-col relative overflow-hidden selection:bg-purple-100 selection:text-purple-900">
      {/* Background Decorative Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-purple-200/30 to-blue-200/20 blur-[80px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-blue-200/20 to-purple-200/30 blur-[100px] pointer-events-none z-0" />

      {/* 🧭 Top Sticky Glassmorphic Navbar */}
      <header className="sticky top-0 z-40 w-full bg-white/70 backdrop-blur-md border-b border-slate-200/80 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/home')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-[#7C5CFF] to-[#5B8CFF] flex items-center justify-center text-white font-bold shadow-md shadow-purple-500/20">
              ⬡
            </div>
            <span className="text-lg font-extrabold bg-gradient-to-r from-[#7C5CFF] to-[#5B8CFF] bg-clip-text text-transparent tracking-tight">
              Conectify
            </span>
          </div>

          {/* Desktop Nav Tabs with sliding underline logic */}
          <nav className="hidden md:flex space-x-1 relative">
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`relative flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    active 
                      ? 'text-[#7C5CFF]' 
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <item.icon className={`w-4 h-4 ${active ? 'text-[#7C5CFF]' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {active && (
                    <motion.div 
                      layoutId="activeTabUnderline"
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#7C5CFF] rounded-full mx-4"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center space-x-3">
            {/* Theme Toggle Placeholder */}
            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors" title="Light Theme Active">
              <Sun className="w-5 h-5 text-amber-500" />
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors relative"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white" />
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50 origin-top-right"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-bold text-sm">Notifications</h4>
                      <span className="text-xs text-[#7C5CFF] cursor-pointer hover:underline">Mark all read</span>
                    </div>
                    <div className="space-y-2 mt-2">
                      <div className="p-2.5 bg-slate-50 rounded-xl text-xs hover:bg-slate-100 transition-colors">
                        <p className="font-semibold text-slate-800">New model added</p>
                        <p className="text-slate-500 mt-0.5">We now support the ultra-fast Gemini 2.5 Flash model.</p>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded-xl text-xs hover:bg-slate-100 transition-colors">
                        <p className="font-semibold text-slate-800">Connection optimized</p>
                        <p className="text-slate-500 mt-0.5">AI chat latency decreased by 40%.</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Dropdown */}
            {userData && (
              <div className="relative">
                <button 
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center space-x-2 focus:outline-none p-1 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#7C5CFF] to-[#5B8CFF] text-white flex items-center justify-center text-xs font-bold shadow-sm">
                    {userData.avatar ? (
                      <img src={userData.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                    ) : initials}
                  </div>
                </button>

                <AnimatePresence>
                  {showProfileMenu && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 origin-top-right"
                    >
                      <div className="px-3 py-2 border-b border-slate-100">
                        <p className="font-bold text-sm text-slate-800">{userData.name}</p>
                        <p className="text-xs text-slate-400 truncate">@{userData.username}</p>
                      </div>
                      <button 
                        onClick={() => { setShowProfileMenu(false); navigate('/profile'); }}
                        className="w-full text-left px-3 py-2 mt-1 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors flex items-center space-x-2"
                      >
                        <User className="w-4 h-4" />
                        <span>My Profile</span>
                      </button>
                      <button 
                        onClick={() => { setShowProfileMenu(false); logout(); }}
                        className="w-full text-left px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded-xl transition-colors flex items-center space-x-2"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Mobile Hamburger Menu button */}
            <button 
              onClick={() => setMobileOpen(true)}
              className="p-2 md:hidden text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

        </div>
      </header>

      {/* Main Container Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-stretch overflow-hidden z-10 relative">
        <div className="flex w-full bg-white/45 backdrop-blur-lg border border-slate-200/70 rounded-3xl overflow-hidden shadow-2xl shadow-slate-100/50">
          
          {/* 📂 Sidebar (Collapsible & Responsive) */}
          <motion.aside 
            animate={{ width: sidebarCollapsed ? 0 : 280 }}
            className={`hidden md:flex flex-col bg-white border-r border-slate-100 h-full overflow-hidden transition-all duration-300 relative`}
            style={{ width: sidebarCollapsed ? 0 : 280 }}
          >
            <div className="p-4 flex flex-col h-full space-y-4 w-[280px]">
              
              {/* New Chat Button */}
              <button
                onClick={handleNewChat}
                className="w-full bg-gradient-to-r from-[#7C5CFF] to-[#5B8CFF] text-white font-bold py-3.5 px-4 rounded-2xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/35 hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 text-sm"
              >
                <Plus className="w-5 h-5" />
                <span>New Chat Session</span>
              </button>

              {/* Search Box */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Search chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 text-slate-700 placeholder-slate-400 text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-100 focus:outline-none focus:border-purple-200 focus:bg-white transition-all"
                />
              </div>

              {/* Session lists */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
                {Object.entries(getGroupedSessions()).map(([groupName, groupSessions]) => {
                  if (groupSessions.length === 0) return null;
                  return (
                    <div key={groupName} className="space-y-1.5">
                      <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase px-2 block">
                        {groupName}
                      </span>
                      {groupSessions.map((sess) => {
                        const isActive = sess.id === activeSessionId;
                        const isEditing = sess.id === editingSessionId;
                        return (
                          <div 
                            key={sess.id}
                            onClick={() => !isEditing && selectSession(sess.id)}
                            className={`group w-full flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                              isActive 
                                ? 'bg-purple-50/70 border border-purple-100/80 text-[#7C5CFF]' 
                                : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                            }`}
                          >
                            <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                              <MessageSquare className={`w-4.5 h-4.5 flex-shrink-0 ${isActive ? 'text-[#7C5CFF]' : 'text-slate-400'}`} />
                              {isEditing ? (
                                <input 
                                  type="text"
                                  value={editingTitle}
                                  onChange={(e) => setEditingTitle(e.target.value)}
                                  onKeyDown={(e) => handleTitleKeyDown(sess.id, e)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="bg-transparent border-b border-[#7C5CFF] focus:outline-none text-xs font-semibold text-slate-800 w-full py-0.5"
                                  autoFocus
                                />
                              ) : (
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-semibold truncate leading-none mb-1">
                                    {sess.title}
                                  </p>
                                  <p className="text-[10px] text-slate-400 leading-none">
                                    {formatSessionDate(sess.createdAt)}
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center space-x-1 ml-2">
                              {isEditing ? (
                                <button 
                                  onClick={(e) => saveTitle(sess.id, e)}
                                  className="p-1 hover:bg-white rounded text-green-600"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <>
                                  <button 
                                    onClick={(e) => startEditing(sess.id, sess.title, e)}
                                    className="p-1 hover:bg-white rounded text-slate-400 hover:text-slate-600 md:opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button 
                                    onClick={(e) => handleDeleteSession(sess.id, e)}
                                    className="p-1 hover:bg-white rounded text-slate-400 hover:text-rose-600 md:opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </>
                              )}
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

              {/* Clear Sessions */}
              {sessions.length > 1 && (
                <button
                  onClick={handleClearAllSessions}
                  className="text-xs text-slate-400 hover:text-rose-500 py-2 border-t border-slate-100 flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All Sessions</span>
                </button>
              )}

            </div>
          </motion.aside>

          {/* Collapsible Trigger (Desktop Sidebar handle) */}
          <div className="hidden md:flex items-center justify-center w-4 bg-slate-50 hover:bg-slate-100 border-r border-slate-100 cursor-pointer text-slate-400 hover:text-slate-600"
               onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
            {sidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </div>

          {/* 💬 Main Chat Area */}
          <div className="flex-1 flex flex-col bg-[#F8FAFC]/50 h-full overflow-hidden">
            
            {/* Active Session Header */}
            <div className="px-6 py-4 bg-white border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-[#7C5CFF]">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-800">Conectify AI Assistant</h3>
                  <div className="flex items-center space-x-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-emerald-600">Active</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
                <span>Model:</span>
                <span className="bg-purple-50 text-[#7C5CFF] px-2.5 py-1 rounded-full border border-purple-100">
                  Gemini 2.5 Flash
                </span>
              </div>
            </div>

            {/* Chat History Logs */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              
              {chatHistory.length === 0 ? (
                // Clean SaaS Empty State
                <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#7C5CFF] to-[#5B8CFF] flex items-center justify-center text-white shadow-xl shadow-purple-200">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">How can I help you today?</h2>
                    <p className="text-slate-500 text-sm mt-1">Ask anything about creating virtual meetings, troubleshooting webcams, audio issues, or general guides.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 w-full mt-4">
                    {[
                      'How to start a meeting?',
                      'Troubleshoot microphone',
                      'Customize profile settings',
                      'Where is my call history?'
                    ].map((prompt, i) => (
                      <button 
                        key={i} 
                        onClick={() => setChatQuery(prompt)}
                        className="bg-white border border-slate-200/80 hover:border-[#7C5CFF]/30 p-3 rounded-xl text-left text-xs font-medium hover:bg-slate-50 transition-all text-slate-600"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {chatHistory.map((item, idx) => {
                    const isOwn = item.sender === 'User';
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className={`flex items-start space-x-3.5 ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}
                      >
                        {/* Avatar */}
                        <div className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center text-xs font-bold shadow-sm flex-shrink-0 ${
                          isOwn 
                            ? 'bg-gradient-to-tr from-[#7C5CFF] to-[#5B8CFF] text-white' 
                            : 'bg-white border border-slate-200 text-[#7C5CFF]'
                        }`}>
                          {isOwn ? initials : <Bot className="w-4.5 h-4.5" />}
                        </div>

                        {/* Content Card with Copy Button */}
                        <div className="group relative max-w-[75%]">
                          <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                            isOwn 
                              ? 'bg-[#7C5CFF] text-white rounded-tr-none shadow-md shadow-purple-500/10' 
                              : 'bg-white text-slate-700 border border-slate-200/70 rounded-tl-none shadow-sm'
                          }`}>
                            <p className="whitespace-pre-line font-medium">{item.text}</p>
                          </div>

                          {/* Float Options (Timestamp & Copy) */}
                          <div className={`flex items-center space-x-2 mt-1.5 text-[10px] text-slate-400 ${
                            isOwn ? 'justify-end' : 'justify-start'
                          }`}>
                            <span>{new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                            {!isOwn && (
                              <button 
                                onClick={() => handleCopyMessage(item.text, idx)}
                                className="opacity-0 group-hover:opacity-100 flex items-center space-x-1 hover:text-slate-600 transition-opacity p-0.5 rounded"
                                title="Copy response"
                              >
                                {copiedMessageId === idx ? (
                                  <>
                                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                    <span className="text-emerald-500">Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>

                      </motion.div>
                    );
                  })}

                  {/* Typing Indicator */}
                  {aiLoading && (
                    <div className="flex items-start space-x-3.5">
                      <div className="w-8.5 h-8.5 rounded-xl bg-white border border-slate-200 text-[#7C5CFF] flex items-center justify-center shadow-sm">
                        <Bot className="w-4.5 h-4.5" />
                      </div>
                      <div className="bg-white border border-slate-200/70 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center space-x-1.5">
                        <div className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </div>
              )}

            </div>

            {/* Premium Input Dock */}
            <div className="p-4 bg-white border-t border-slate-100">
              <div className="max-w-3xl mx-auto flex items-center bg-slate-50 border border-slate-200 rounded-[20px] px-3 py-2.5 shadow-sm focus-within:ring-2 focus-within:ring-purple-100 focus-within:border-[#7C5CFF] transition-all">
                
                {/* File attachment */}
                <button className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors" title="Attach files">
                  <Paperclip className="w-5 h-5" />
                </button>

                {/* Voice typing */}
                <button className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors" title="Voice dictation">
                  <Mic className="w-5 h-5" />
                </button>

                {/* Textarea Input */}
                <textarea 
                  rows="1"
                  placeholder="Message Conectify AI..."
                  value={chatQuery}
                  onChange={(e) => setChatQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendChatMessage();
                    }
                  }}
                  className="flex-1 bg-transparent text-slate-800 placeholder-slate-400 text-sm border-none focus:outline-none resize-none px-3.5 max-h-28 overflow-y-auto leading-relaxed self-center"
                />

                {/* Send Button */}
                <button 
                  onClick={handleSendChatMessage}
                  disabled={!chatQuery.trim() || aiLoading}
                  className="bg-gradient-to-r from-[#7C5CFF] to-[#5B8CFF] text-white p-2.5 rounded-xl hover:shadow-md hover:shadow-purple-500/20 disabled:opacity-40 disabled:hover:shadow-none transition-all active:scale-[0.96]"
                >
                  <Send className="w-4 h-4" />
                </button>

              </div>
              <p className="text-center text-[10px] text-slate-400 mt-2.5 font-medium">
                Conectify AI can make mistakes. Verify important details.
              </p>
            </div>

          </div>

        </div>
      </div>

      {/* 📱 Mobile Slide-out Drawer Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex justify-end">
            
            {/* Backdrop overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            />

            {/* Drawer body */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-80 max-w-xs bg-white h-full shadow-2xl flex flex-col p-4 z-10"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-r from-[#7C5CFF] to-[#5B8CFF] flex items-center justify-center text-white text-xs font-bold">
                    ⬡
                  </div>
                  <span className="text-sm font-bold bg-gradient-to-r from-[#7C5CFF] to-[#5B8CFF] bg-clip-text text-transparent">
                    Conectify
                  </span>
                </div>
                <button 
                  onClick={() => setMobileOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation inside Mobile drawer */}
              <div className="py-4 space-y-1">
                {navItems.map((item) => {
                  const active = location.pathname === item.path;
                  return (
                    <button
                      key={item.path}
                      onClick={() => { navigate(item.path); setMobileOpen(false); }}
                      className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        active 
                          ? 'bg-purple-50 text-[#7C5CFF]' 
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <item.icon className={`w-4.5 h-4.5 ${active ? 'text-[#7C5CFF]' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="border-t border-slate-100 my-2" />

              {/* Sidebar Content inside Mobile drawer */}
              <div className="flex-1 overflow-y-auto space-y-4 pt-2">
                <button
                  onClick={() => { handleNewChat(); setMobileOpen(false); }}
                  className="w-full bg-gradient-to-r from-[#7C5CFF] to-[#5B8CFF] text-white font-bold py-3 px-4 rounded-2xl shadow-lg shadow-purple-500/20 hover:brightness-105 transition-all flex items-center justify-center space-x-2 text-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Chat Session</span>
                </button>

                <div className="space-y-4">
                  {Object.entries(getGroupedSessions()).map(([groupName, groupSessions]) => {
                    if (groupSessions.length === 0) return null;
                    return (
                      <div key={groupName} className="space-y-1.5">
                        <span className="text-[9px] font-extrabold text-slate-400 tracking-wider uppercase px-2 block">
                          {groupName}
                        </span>
                        {groupSessions.map((sess) => {
                          const isActive = sess.id === activeSessionId;
                          return (
                            <div 
                              key={sess.id}
                              onClick={() => { selectSession(sess.id); setMobileOpen(false); }}
                              className={`w-full flex items-center space-x-2.5 p-2.5 rounded-xl cursor-pointer text-xs ${
                                isActive 
                                  ? 'bg-purple-50 text-[#7C5CFF] font-semibold' 
                                  : 'text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              <MessageSquare className="w-4 h-4 text-slate-400" />
                              <span className="truncate">{sess.title}</span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default withAuth(AIChat);
