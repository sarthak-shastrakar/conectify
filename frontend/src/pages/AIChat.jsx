import React, { useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Plus, Search, Trash2, Edit2, Check, Menu, X,
  Send, Bot, User, Sparkles, Bell,
  Copy, LogOut, Home, History, CheckCircle2, Mic, Paperclip,
  PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';
import withAuth from '../utils/withAuth';
import api from '../utils/api';
import { API_ROUTES } from '../utils/constants';

/* ─── Colour tokens ─────────────────────────────────────────────────────── */
const C = {
  bg:        '#070B14',
  surface:   'rgba(12,16,30,0.80)',
  surfaceHov:'rgba(255,255,255,0.05)',
  border:    'rgba(255,255,255,0.08)',
  borderHov: 'rgba(124,92,255,0.40)',
  purple:    '#7C5CFF',
  purpleL:   '#9D7FFF',
  purpleGlass:'rgba(124,92,255,0.12)',
  blue:      '#3B82F6',
  text:      '#E8ECF4',
  muted:     'rgba(232,236,244,0.45)',
  danger:    '#EF4444',
};

/* ─── Dot-bounce typing indicator ───────────────────────────────────────── */
const TypingDots = () => (
  <div style={{ display:'flex', alignItems:'center', gap:5, padding:'10px 14px' }}>
    {[0,1,2].map(i => (
      <span key={i} style={{
        width:8, height:8, borderRadius:'50%',
        background: C.purpleL,
        display:'inline-block',
        animation:'typingBounce 1.1s infinite ease-in-out',
        animationDelay: `${i * 0.18}s`,
      }} />
    ))}
    <style>{`
      @keyframes typingBounce {
        0%,80%,100%{transform:translateY(0);opacity:.5}
        40%{transform:translateY(-6px);opacity:1}
      }
    `}</style>
  </div>
);

/* ─── Single message bubble ─────────────────────────────────────────────── */
const Bubble = React.memo(({ item, idx, initials, copiedId, onCopy }) => {
  const isUser = item.sender === 'User';
  return (
    <motion.div
      initial={{ opacity:0, y:12 }}
      animate={{ opacity:1, y:0 }}
      transition={{ duration:0.28, ease:'easeOut' }}
      style={{
        display:'flex', alignItems:'flex-start', gap:10,
        flexDirection: isUser ? 'row-reverse' : 'row',
      }}
    >
      {/* Avatar */}
      <div style={{
        width:34, height:34, borderRadius:10, flexShrink:0,
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:12, fontWeight:700, color:'#fff',
        background: isUser
          ? `linear-gradient(135deg,${C.purple},${C.blue})`
          : 'rgba(124,92,255,0.18)',
        border: `1.5px solid ${isUser ? 'transparent' : C.border}`,
        backdropFilter:'blur(10px)',
      }}>
        {isUser ? initials : <Bot size={16} color={C.purpleL} />}
      </div>

      {/* Bubble */}
      <div style={{ maxWidth:'72%', position:'relative' }} className="msg-group">
        <div style={{
          padding:'11px 15px',
          borderRadius: isUser ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
          fontSize:14, lineHeight:1.65,
          background: isUser
            ? `linear-gradient(135deg,${C.purple},${C.blue})`
            : 'rgba(255,255,255,0.06)',
          border: isUser ? 'none' : `1px solid ${C.border}`,
          backdropFilter: isUser ? 'none' : 'blur(16px)',
          color: '#fff',
          boxShadow: isUser ? `0 4px 20px rgba(124,92,255,0.25)` : 'none',
          whiteSpace:'pre-wrap', wordBreak:'break-word',
        }}>
          {item.text}
        </div>

        {/* Meta row */}
        <div style={{
          display:'flex', alignItems:'center', gap:6,
          marginTop:4, paddingLeft:2, paddingRight:2,
          flexDirection: isUser ? 'row-reverse' : 'row',
        }}>
          <span style={{ fontSize:10, color:C.muted }}>
            {item.ts
              ? new Date(item.ts).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })
              : new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })
            }
          </span>
          {!isUser && (
            <button
              onClick={() => onCopy(item.text, idx)}
              className="copy-btn"
              title="Copy"
              style={{
                background:'none', border:'none', cursor:'pointer',
                display:'flex', alignItems:'center', gap:3,
                color: copiedId === idx ? '#34D399' : C.muted,
                fontSize:10, padding:'2px 4px', borderRadius:4,
                transition:'color .2s',
              }}
            >
              {copiedId === idx
                ? <><CheckCircle2 size={11}/><span>Copied!</span></>
                : <><Copy size={11}/><span>Copy</span></>
              }
            </button>
          )}
        </div>
      </div>

      {/* Hover-reveal copy for desktop — handled via CSS */}
      <style>{`.copy-btn{opacity:.35}.copy-btn:hover{opacity:1}`}</style>
    </motion.div>
  );
});

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
function AIChat() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { userData, logout } = useContext(AuthContext);
  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);

  const [chatQuery,   setChatQuery]   = useState('');
  const [aiLoading,   setAiLoading]   = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);   // desktop
  const [mobileOpen,  setMobileOpen]  = useState(false);  // mobile drawer
  const [showProfile, setShowProfile] = useState(false);
  const [showBell,    setShowBell]    = useState(false);
  const [copiedId,    setCopiedId]    = useState(null);
  const [searchQ,     setSearchQ]     = useState('');
  const [editingId,   setEditingId]   = useState(null);
  const [editTitle,   setEditTitle]   = useState('');

  /* ── Sessions ── */
  const [sessions, setSessions] = useState(() => {
    try {
      const s = JSON.parse(localStorage.getItem('conectify_ai_sessions') || 'null');
      if (s && s.length) return s;
    } catch {}
    const id = 'session_' + Date.now();
    return [{
      id, title: 'Welcome Chat', createdAt: Date.now(),
      messages: [{ sender:'AI', text:'Hello! 👋 I\'m Conectify AI. Ask me anything about video calls, meeting codes, troubleshooting, or general help!', ts: Date.now() }],
    }];
  });

  const [activeId, setActiveId] = useState(sessions[0].id);
  const activeSession  = sessions.find(s => s.id === activeId) || sessions[0];
  const chatHistory    = activeSession?.messages || [];

  /* persist */
  useEffect(() => {
    localStorage.setItem('conectify_ai_sessions', JSON.stringify(sessions));
  }, [sessions]);

  /* scroll to bottom */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior:'smooth' });
  }, [chatHistory, aiLoading]);

  /* auto-resize textarea */
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [chatQuery]);

  /* close dropdowns on outside click */
  useEffect(() => {
    const handler = () => { setShowProfile(false); setShowBell(false); };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  /* ── Helpers ── */
  const initials = userData?.name
    ? userData.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()
    : 'U';

  const selectSession = useCallback((id) => {
    setActiveId(id); setMobileOpen(false);
  }, []);

  const newSession = useCallback(() => {
    const id = 'session_' + Date.now();
    setSessions(prev => [{
      id, title:'New Chat', createdAt: Date.now(),
      messages:[{ sender:'AI', text:'Fresh start! Ask me anything. 🤖', ts: Date.now() }],
    }, ...prev]);
    setActiveId(id); setSearchQ(''); setMobileOpen(false);
  }, []);

  const deleteSession = useCallback((id, e) => {
    e.stopPropagation();
    setSessions(prev => {
      const updated = prev.filter(s => s.id !== id);
      if (!updated.length) {
        const freshId = 'session_' + Date.now();
        const fresh = [{
          id: freshId, title:'New Chat', createdAt: Date.now(),
          messages:[{ sender:'AI', text:'Hello! Ask me anything about Conectify. 🤖', ts: Date.now() }],
        }];
        setActiveId(freshId);
        return fresh;
      }
      if (id === activeId) setActiveId(updated[0].id);
      return updated;
    });
  }, [activeId]);

  const clearAll = useCallback(() => {
    if (!window.confirm('Delete all chat sessions?')) return;
    const freshId = 'session_' + Date.now();
    setSessions([{
      id: freshId, title:'New Chat', createdAt: Date.now(),
      messages:[{ sender:'AI', text:'All cleared. Fresh start! 🤖', ts: Date.now() }],
    }]);
    setActiveId(freshId); setMobileOpen(false);
  }, []);

  const startEdit = (id, title, e) => {
    e.stopPropagation(); setEditingId(id); setEditTitle(title);
  };
  const saveEdit = (id, e) => {
    if (e) e.stopPropagation();
    if (editTitle.trim()) {
      setSessions(prev => prev.map(s => s.id === id ? { ...s, title: editTitle.trim() } : s));
    }
    setEditingId(null);
  };

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedId(idx);
    setTimeout(() => setCopiedId(null), 2000);
  };

  /* ── Send ── */
  const sendMessage = async () => {
    if (!chatQuery.trim() || aiLoading) return;
    const userMsg = { sender:'User', text: chatQuery.trim(), ts: Date.now() };
    const currentQ = chatQuery.trim();
    setSessions(prev => prev.map(s =>
      s.id === activeId ? { ...s, messages:[...s.messages, userMsg] } : s
    ));
    setChatQuery('');
    setAiLoading(true);
    try {
      const res = await api.post(API_ROUTES.CHATBOT, {
        message: currentQ, chatHistory,
      });
      const aiMsg = { sender:'AI', text: res.data.reply, ts: Date.now() };
      setSessions(prev => prev.map(s => {
        if (s.id !== activeId) return s;
        const title = (s.title === 'New Chat' && s.messages.length <= 2)
          ? currentQ.slice(0,28) + (currentQ.length > 28 ? '…' : '')
          : s.title;
        return { ...s, title, messages:[...s.messages, aiMsg] };
      }));
    } catch {
      const errMsg = { sender:'AI', text:'⚠️ Could not reach AI servers. Please try again.', ts: Date.now() };
      setSessions(prev => prev.map(s =>
        s.id === activeId ? { ...s, messages:[...s.messages, errMsg] } : s
      ));
    } finally { setAiLoading(false); }
  };

  /* ── Grouped sessions ── */
  const groupedSessions = (() => {
    const now = Date.now();
    const D = 86_400_000;
    const filtered = sessions.filter(s =>
      s.title.toLowerCase().includes(searchQ.toLowerCase()) ||
      s.messages.some(m => m.text.toLowerCase().includes(searchQ.toLowerCase()))
    );
    const g = { Today:[], Yesterday:[], 'Last 7 Days':[], Older:[] };
    filtered.forEach(s => {
      const diff = now - (s.createdAt || now);
      if (diff < D)       g.Today.push(s);
      else if (diff < 2*D) g.Yesterday.push(s);
      else if (diff < 7*D) g['Last 7 Days'].push(s);
      else                 g.Older.push(s);
    });
    return g;
  })();

  const fmtDate = ts => ts ? new Date(ts).toLocaleDateString([], { month:'short', day:'numeric' }) : '';

  const navItems = [
    { label:'Home',         icon:Home,     path:'/home' },
    { label:'AI Companion', icon:Sparkles, path:'/ai-assistant' },
    { label:'History',      icon:History,  path:'/history' },
    { label:'Profile',      icon:User,     path:'/profile' },
  ];

  const SIDEBAR_W = 268;

  /* ════════════════════════ Sidebar Content ══════════════════════════════ */
  const SidebarContent = ({ mobile = false }) => (
    <div style={{
      display:'flex', flexDirection:'column', height:'100%',
      padding:'16px 12px', gap:12,
    }}>
      {/* New chat */}
      <button
        onClick={newSession}
        style={{
          display:'flex', alignItems:'center', justifyContent:'center', gap:8,
          background:`linear-gradient(135deg,${C.purple},${C.blue})`,
          border:'none', borderRadius:14, padding:'11px 16px',
          color:'#fff', fontWeight:700, fontSize:13.5, cursor:'pointer',
          boxShadow:`0 4px 20px rgba(124,92,255,0.30)`,
          transition:'filter .2s, transform .15s',
        }}
        onMouseEnter={e => e.currentTarget.style.filter='brightness(1.1)'}
        onMouseLeave={e => e.currentTarget.style.filter='brightness(1)'}
      >
        <Plus size={16}/>
        New Chat
      </button>

      {/* Search */}
      <div style={{ position:'relative' }}>
        <Search size={13} style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:C.muted }} />
        <input
          type="text"
          placeholder="Search chats…"
          value={searchQ}
          onChange={e => setSearchQ(e.target.value)}
          style={{
            width:'100%', boxSizing:'border-box',
            background:'rgba(255,255,255,0.05)',
            border:`1px solid ${C.border}`,
            borderRadius:10, padding:'8px 12px 8px 32px',
            color:C.text, fontSize:12.5, outline:'none',
            transition:'border .2s',
          }}
          onFocus={e => e.target.style.borderColor = C.purple}
          onBlur={e  => e.target.style.borderColor = C.border}
        />
      </div>

      {/* Session groups */}
      <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:8 }}>
        {Object.entries(groupedSessions).map(([grp, list]) => {
          if (!list.length) return null;
          return (
            <div key={grp}>
              <div style={{ fontSize:10, fontWeight:800, color:C.muted, letterSpacing:1, textTransform:'uppercase', padding:'4px 6px 6px' }}>
                {grp}
              </div>
              {list.map(sess => {
                const isActive = sess.id === activeId;
                const isEditing = sess.id === editingId;
                return (
                  <div
                    key={sess.id}
                    onClick={() => !isEditing && selectSession(sess.id)}
                    style={{
                      display:'flex', alignItems:'center', gap:8,
                      padding:'9px 10px', borderRadius:11, cursor:'pointer',
                      marginBottom:2,
                      background: isActive ? C.purpleGlass : 'transparent',
                      border: `1px solid ${isActive ? C.borderHov : 'transparent'}`,
                      transition:'background .18s, border .18s',
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = C.surfaceHov; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                    className="sess-row"
                  >
                    <MessageSquare size={13} style={{ flexShrink:0, color: isActive ? C.purpleL : C.muted }} />

                    {isEditing ? (
                      <input
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                        onKeyDown={e => { if (e.key==='Enter') saveEdit(sess.id); if (e.key==='Escape') setEditingId(null); }}
                        onClick={e => e.stopPropagation()}
                        autoFocus
                        style={{
                          flex:1, background:'transparent', border:'none',
                          borderBottom:`1px solid ${C.purple}`, color:C.text,
                          fontSize:12, outline:'none', padding:'0 2px',
                        }}
                      />
                    ) : (
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:12.5, fontWeight: isActive ? 600 : 400, color: isActive ? C.text : C.muted, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {sess.title}
                        </div>
                        <div style={{ fontSize:10, color:'rgba(232,236,244,0.28)', marginTop:1 }}>
                          {fmtDate(sess.createdAt)}
                        </div>
                      </div>
                    )}

                    {/* Actions — directly visible without requiring hover */}
                    <div className="sess-actions" style={{ display:'flex', gap:3, flexShrink:0, opacity:1 }}>
                      {isEditing ? (
                        <button onClick={e => saveEdit(sess.id, e)} title="Save" style={iconBtnStyle('#34D399')}>
                          <Check size={13}/>
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={e => startEdit(sess.id, sess.title, e)}
                            title="Rename"
                            style={iconBtnStyle('rgba(232,236,244,0.55)')}
                            onMouseEnter={e => { e.currentTarget.style.color = C.purpleL; e.currentTarget.style.background = 'rgba(124,92,255,0.15)'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(232,236,244,0.55)'; e.currentTarget.style.background = 'none'; }}
                          >
                            <Edit2 size={13}/>
                          </button>
                          <button
                            onClick={e => deleteSession(sess.id, e)}
                            title="Delete"
                            style={iconBtnStyle('rgba(239,68,68,0.7)')}
                            onMouseEnter={e => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(239,68,68,0.7)'; e.currentTarget.style.background = 'none'; }}
                          >
                            <Trash2 size={13}/>
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

      {/* Clear all */}
      {sessions.length > 1 && (
        <button
          onClick={clearAll}
          style={{
            display:'flex', alignItems:'center', justifyContent:'center', gap:6,
            background:'none', border:`1px solid rgba(239,68,68,0.20)`,
            borderRadius:10, padding:'8px', color:'rgba(239,68,68,0.65)',
            fontSize:11.5, fontWeight:600, cursor:'pointer',
            transition:'all .2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background='rgba(239,68,68,0.08)'; e.currentTarget.style.color='#EF4444'; }}
          onMouseLeave={e => { e.currentTarget.style.background='none'; e.currentTarget.style.color='rgba(239,68,68,0.65)'; }}
        >
          <Trash2 size={12}/> Clear all sessions
        </button>
      )}


    </div>
  );

  /* ════════════════════════ RENDER ═══════════════════════════════════════ */
  return (
    <div style={{
      width:'100vw', height:'100vh', display:'flex', flexDirection:'column',
      background: C.bg, color: C.text, fontFamily:'system-ui,-apple-system,sans-serif',
      overflow:'hidden', position:'relative',
    }}>

      {/* ── Background glow ── */}
      <div style={{
        position:'absolute', inset:0, pointerEvents:'none', zIndex:0,
        background:`
          radial-gradient(ellipse 60% 40% at 10% 20%, rgba(124,92,255,0.12) 0%, transparent 70%),
          radial-gradient(ellipse 50% 35% at 85% 75%, rgba(59,130,246,0.09) 0%, transparent 70%)
        `,
      }}/>

      {/* ══════════════════ TOP NAVBAR ══════════════════════════════════ */}
      <header style={{
        position:'relative', zIndex:50, flexShrink:0,
        height:60, display:'flex', alignItems:'center',
        padding:'0 20px', justifyContent:'space-between',
        background:'rgba(7,11,20,0.90)',
        borderBottom:`1px solid ${C.border}`,
        backdropFilter:'blur(20px)',
      }}>
        {/* Logo + mobile hamburger */}
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            style={{ ...ghostBtn, display:'none' }}
            className="mobile-menu-btn"
          >
            <Menu size={20}/>
          </button>

          {/* Logo */}
          <div
            onClick={() => navigate('/home')}
            style={{ display:'flex', alignItems:'center', gap:9, cursor:'pointer' }}
          >
            <div style={{
              width:34, height:34, borderRadius:10,
              background:`linear-gradient(135deg,${C.purple},${C.blue})`,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:16, boxShadow:`0 4px 14px rgba(124,92,255,0.35)`,
            }}>⬡</div>
            <span style={{
              fontSize:17, fontWeight:800,
              background:`linear-gradient(135deg,${C.purpleL},${C.blue})`,
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
              letterSpacing:'-0.5px',
            }}>Conectify</span>
          </div>
        </div>

        {/* Desktop nav */}
        <nav style={{ display:'flex', gap:4 }} className="desktop-nav">
          {navItems.map(item => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  display:'flex', alignItems:'center', gap:7,
                  padding:'7px 14px', borderRadius:10, border:'none',
                  background: active ? C.purpleGlass : 'transparent',
                  color: active ? C.purpleL : C.muted,
                  fontWeight: active ? 700 : 500, fontSize:13.5,
                  cursor:'pointer', transition:'all .18s',
                  outline: active ? `1px solid ${C.borderHov}` : '1px solid transparent',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.color = C.text; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.color = C.muted; }}
              >
                <item.icon size={15}/> {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right controls */}
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>

          {/* Bell */}
          <div style={{ position:'relative' }}>
            <button
              onClick={e => { e.stopPropagation(); setShowBell(v => !v); setShowProfile(false); }}
              style={ghostBtn}
            >
              <Bell size={18}/>
              <span style={{
                position:'absolute', top:5, right:5,
                width:7, height:7, borderRadius:'50%',
                background:'#EF4444', border:`2px solid ${C.bg}`,
              }}/>
            </button>
            <AnimatePresence>
              {showBell && (
                <motion.div
                  initial={{ opacity:0, y:8, scale:.95 }}
                  animate={{ opacity:1, y:0, scale:1 }}
                  exit={{ opacity:0, y:8, scale:.95 }}
                  onClick={e => e.stopPropagation()}
                  style={{
                    position:'absolute', right:0, top:'calc(100% + 8px)',
                    width:300, background:'rgba(12,16,30,0.98)',
                    border:`1px solid ${C.border}`, borderRadius:16,
                    padding:16, zIndex:200, backdropFilter:'blur(20px)',
                    boxShadow:'0 20px 60px rgba(0,0,0,0.5)',
                  }}
                >
                  <div style={{ fontSize:13, fontWeight:700, marginBottom:10, color:C.text }}>Notifications</div>
                  {[
                    { title:'Model updated', desc:'Gemini 2.0 Flash — faster & more accurate.' },
                    { title:'Latency improved', desc:'AI response time improved by 40%.' },
                  ].map((n,i) => (
                    <div key={i} style={{
                      padding:'10px 12px', borderRadius:10, marginBottom:6,
                      background:'rgba(255,255,255,0.04)', border:`1px solid ${C.border}`,
                    }}>
                      <div style={{ fontSize:12.5, fontWeight:600, color:C.text }}>{n.title}</div>
                      <div style={{ fontSize:11.5, color:C.muted, marginTop:3 }}>{n.desc}</div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Profile */}
          {userData && (
            <div style={{ position:'relative' }}>
              <button
                onClick={e => { e.stopPropagation(); setShowProfile(v => !v); setShowBell(false); }}
                style={{
                  width:34, height:34, borderRadius:'50%', border:'none', cursor:'pointer',
                  background:`linear-gradient(135deg,${C.purple},${C.blue})`,
                  color:'#fff', fontWeight:700, fontSize:12,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  boxShadow:`0 0 0 2px ${showProfile ? C.purple : 'transparent'}`,
                  transition:'box-shadow .2s',
                }}
              >
                {userData.avatar
                  ? <img src={userData.avatar} alt="av" style={{ width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover' }}/>
                  : initials
                }
              </button>
              <AnimatePresence>
                {showProfile && (
                  <motion.div
                    initial={{ opacity:0, y:8, scale:.95 }}
                    animate={{ opacity:1, y:0, scale:1 }}
                    exit={{ opacity:0, y:8, scale:.95 }}
                    onClick={e => e.stopPropagation()}
                    style={{
                      position:'absolute', right:0, top:'calc(100% + 8px)',
                      width:220, background:'rgba(12,16,30,0.98)',
                      border:`1px solid ${C.border}`, borderRadius:14,
                      padding:8, zIndex:200, backdropFilter:'blur(20px)',
                      boxShadow:'0 20px 60px rgba(0,0,0,0.5)',
                    }}
                  >
                    <div style={{ padding:'10px 12px', borderBottom:`1px solid ${C.border}`, marginBottom:4 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{userData.name}</div>
                      <div style={{ fontSize:11.5, color:C.muted, marginTop:2 }}>@{userData.username}</div>
                    </div>
                    {[
                      { label:'My Profile', icon:User, action:() => navigate('/profile') },
                      { label:'Sign Out',   icon:LogOut, action:logout, danger:true },
                    ].map(item => (
                      <button key={item.label} onClick={() => { setShowProfile(false); item.action(); }}
                        style={{
                          width:'100%', display:'flex', alignItems:'center', gap:9,
                          padding:'9px 12px', borderRadius:10, border:'none',
                          background:'transparent', cursor:'pointer', fontSize:13,
                          color: item.danger ? C.danger : C.text,
                          transition:'background .15s',
                          textAlign:'left',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = item.danger ? 'rgba(239,68,68,0.10)' : C.surfaceHov}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <item.icon size={14}/> {item.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </header>

      {/* ══════════════════ BODY (Sidebar + Chat) ═══════════════════════ */}
      <div style={{ flex:1, display:'flex', overflow:'hidden', position:'relative', zIndex:1 }}>

        {/* ── Desktop Sidebar ── */}
        <motion.aside
          animate={{ width: sidebarOpen ? SIDEBAR_W : 0 }}
          transition={{ duration:.28, ease:[.4,0,.2,1] }}
          style={{
            flexShrink:0, overflow:'hidden',
            background:'rgba(7,11,20,0.75)',
            borderRight:`1px solid ${C.border}`,
            backdropFilter:'blur(20px)',
          }}
          className="desktop-sidebar"
        >
          <div style={{ width: SIDEBAR_W, height:'100%' }}>
            <SidebarContent />
          </div>
        </motion.aside>

        {/* Sidebar toggle handle — desktop */}
        <button
          onClick={() => setSidebarOpen(v => !v)}
          title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          style={{
            flexShrink:0, width:28, background:'rgba(255,255,255,0.03)',
            border:'none', borderRight:`1px solid ${C.border}`,
            cursor:'pointer', color:C.muted, display:'flex',
            alignItems:'center', justifyContent:'center',
            transition:'background .18s, color .18s',
          }}
          className="sidebar-toggle"
          onMouseEnter={e => { e.currentTarget.style.background=C.surfaceHov; e.currentTarget.style.color=C.text; }}
          onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.03)'; e.currentTarget.style.color=C.muted; }}
        >
          {sidebarOpen ? <PanelLeftClose size={14}/> : <PanelLeftOpen size={14}/>}
        </button>

        {/* ── Chat Area ── */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

          {/* Chat header bar */}
          <div style={{
            flexShrink:0, height:52,
            display:'flex', alignItems:'center', justifyContent:'space-between',
            padding:'0 20px',
            background:'rgba(7,11,20,0.60)',
            borderBottom:`1px solid ${C.border}`,
            backdropFilter:'blur(10px)',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{
                width:32, height:32, borderRadius:9,
                background:C.purpleGlass,
                border:`1px solid ${C.borderHov}`,
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                <Bot size={16} color={C.purpleL}/>
              </div>
              <div style={{ fontSize:13.5, fontWeight:700, color:C.text }}>Conectify AI</div>
            </div>
          </div>

          {/* Messages scroll area */}
          <div style={{ flex:1, overflowY:'auto', padding:'24px 20px', display:'flex', flexDirection:'column', gap:18 }}
            className="chat-scroll"
          >
            {chatHistory.length === 0 ? (
              /* Empty state */
              <div style={{
                height:'100%', display:'flex', flexDirection:'column',
                alignItems:'center', justifyContent:'center', textAlign:'center',
                gap:16, maxWidth:420, margin:'0 auto',
              }}>
                <div style={{
                  width:68, height:68, borderRadius:20,
                  background:`linear-gradient(135deg,${C.purple},${C.blue})`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  boxShadow:`0 8px 32px rgba(124,92,255,0.40)`,
                }}>
                  <Sparkles size={30} color="#fff"/>
                </div>
                <div>
                  <h2 style={{ fontSize:22, fontWeight:800, color:C.text, margin:0 }}>How can I help you?</h2>
                  <p style={{ fontSize:13.5, color:C.muted, marginTop:8, lineHeight:1.6 }}>
                    Ask anything about Conectify — video calls, troubleshooting, settings, or general help.
                  </p>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, width:'100%', marginTop:4 }}>
                  {[
                    '🎥 How to start a meeting?',
                    '🎙️ Microphone not working',
                    '⚙️ Customize my profile',
                    '📋 Find my call history',
                  ].map((p, i) => (
                    <button key={i} onClick={() => setChatQuery(p.slice(3))}
                      style={{
                        background:'rgba(255,255,255,0.04)',
                        border:`1px solid ${C.border}`,
                        borderRadius:12, padding:'11px 13px',
                        color:C.muted, fontSize:12.5, textAlign:'left',
                        cursor:'pointer', transition:'all .18s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background=C.purpleGlass; e.currentTarget.style.borderColor=C.borderHov; e.currentTarget.style.color=C.text; }}
                      onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor=C.border; e.currentTarget.style.color=C.muted; }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {chatHistory.map((msg, idx) => (
                  <Bubble
                    key={idx} item={msg} idx={idx}
                    initials={initials} copiedId={copiedId} onCopy={handleCopy}
                  />
                ))}

                {aiLoading && (
                  <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                    <div style={{
                      width:34, height:34, borderRadius:10, flexShrink:0,
                      background:'rgba(124,92,255,0.18)', border:`1.5px solid ${C.border}`,
                      display:'flex', alignItems:'center', justifyContent:'center',
                    }}>
                      <Bot size={16} color={C.purpleL}/>
                    </div>
                    <div style={{
                      background:'rgba(255,255,255,0.06)',
                      border:`1px solid ${C.border}`,
                      borderRadius:'4px 18px 18px 18px',
                      backdropFilter:'blur(16px)',
                    }}>
                      <TypingDots/>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef}/>
              </>
            )}
          </div>

          {/* Input dock */}
          <div style={{
            flexShrink:0, padding:'14px 20px 18px',
            background:'rgba(7,11,20,0.80)',
            borderTop:`1px solid ${C.border}`,
            backdropFilter:'blur(20px)',
          }}>
            <div style={{
              maxWidth:780, margin:'0 auto',
              display:'flex', alignItems:'flex-end', gap:8,
              background:'rgba(255,255,255,0.05)',
              border:`1px solid ${C.border}`,
              borderRadius:18, padding:'10px 10px 10px 14px',
              transition:'border .2s, box-shadow .2s',
            }}
              onFocusCapture={e => { e.currentTarget.style.borderColor=C.purple; e.currentTarget.style.boxShadow=`0 0 0 3px rgba(124,92,255,0.15)`; }}
              onBlurCapture={e  => { e.currentTarget.style.borderColor=C.border;  e.currentTarget.style.boxShadow='none'; }}
            >
              {/* Attachment (decorative) */}
              <button style={{ ...ghostBtn, padding:6, alignSelf:'flex-end', marginBottom:1 }} title="Attach">
                <Paperclip size={16}/>
              </button>

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                rows={1}
                value={chatQuery}
                onChange={e => setChatQuery(e.target.value)}
                onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Message Conectify AI…"
                style={{
                  flex:1, background:'transparent', border:'none', outline:'none',
                  resize:'none', color:C.text, fontSize:14, lineHeight:1.5,
                  padding:'4px 8px', minHeight:24, maxHeight:120,
                  fontFamily:'inherit', overflowY:'auto',
                }}
              />

              {/* Voice (decorative) */}
              <button style={{ ...ghostBtn, padding:6, alignSelf:'flex-end', marginBottom:1 }} title="Voice">
                <Mic size={16}/>
              </button>

              {/* Send */}
              <button
                onClick={sendMessage}
                disabled={!chatQuery.trim() || aiLoading}
                style={{
                  width:36, height:36, borderRadius:11, border:'none', flexShrink:0,
                  background: chatQuery.trim() && !aiLoading
                    ? `linear-gradient(135deg,${C.purple},${C.blue})`
                    : 'rgba(255,255,255,0.08)',
                  color: chatQuery.trim() && !aiLoading ? '#fff' : C.muted,
                  cursor: chatQuery.trim() && !aiLoading ? 'pointer' : 'not-allowed',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  transition:'all .2s', alignSelf:'flex-end',
                  boxShadow: chatQuery.trim() && !aiLoading ? `0 4px 14px rgba(124,92,255,0.35)` : 'none',
                }}
              >
                <Send size={15}/>
              </button>
            </div>
            <p style={{ textAlign:'center', fontSize:10.5, color:'rgba(232,236,244,0.28)', marginTop:8 }}>
              Conectify AI may make mistakes — please verify important information.
            </p>
          </div>
        </div>
      </div>

      {/* ══════════════════ MOBILE DRAWER ══════════════════════════════ */}
      <AnimatePresence>
        {mobileOpen && (
          <div style={{ position:'fixed', inset:0, zIndex:200 }}>
            <motion.div
              initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              onClick={() => setMobileOpen(false)}
              style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.60)', backdropFilter:'blur(4px)' }}
            />
            <motion.div
              initial={{ x:'-100%' }} animate={{ x:0 }} exit={{ x:'-100%' }}
              transition={{ type:'spring', damping:28, stiffness:240 }}
              style={{
                position:'absolute', left:0, top:0, bottom:0, width:280,
                background:'rgba(10,14,26,0.98)',
                border:`1px solid ${C.border}`,
                backdropFilter:'blur(24px)',
                display:'flex', flexDirection:'column',
              }}
            >
              {/* Drawer header */}
              <div style={{
                display:'flex', alignItems:'center', justifyContent:'space-between',
                padding:'14px 16px', borderBottom:`1px solid ${C.border}`,
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{
                    width:28, height:28, borderRadius:8,
                    background:`linear-gradient(135deg,${C.purple},${C.blue})`,
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:13,
                  }}>⬡</div>
                  <span style={{ fontSize:15, fontWeight:800, background:`linear-gradient(135deg,${C.purpleL},${C.blue})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Conectify</span>
                </div>
                <button onClick={() => setMobileOpen(false)} style={ghostBtn}><X size={18}/></button>
              </div>

              {/* Mobile nav links */}
              <div style={{ padding:'10px 10px 0', borderBottom:`1px solid ${C.border}`, paddingBottom:10 }}>
                {navItems.map(item => {
                  const active = location.pathname === item.path;
                  return (
                    <button key={item.path}
                      onClick={() => { navigate(item.path); setMobileOpen(false); }}
                      style={{
                        width:'100%', display:'flex', alignItems:'center', gap:10,
                        padding:'9px 12px', borderRadius:10, border:'none', marginBottom:2,
                        background: active ? C.purpleGlass : 'transparent',
                        color: active ? C.purpleL : C.muted,
                        fontWeight: active ? 700 : 500, fontSize:13.5,
                        cursor:'pointer', transition:'all .18s', textAlign:'left',
                      }}
                    >
                      <item.icon size={15}/> {item.label}
                    </button>
                  );
                })}
              </div>

              {/* Sidebar content */}
              <div style={{ flex:1, overflow:'hidden' }}>
                <SidebarContent mobile />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Responsive CSS ── */}
      <style>{`
        * { scrollbar-width:thin; scrollbar-color:rgba(124,92,255,0.25) transparent; }
        *::-webkit-scrollbar { width:4px; }
        *::-webkit-scrollbar-thumb { background:rgba(124,92,255,0.25); border-radius:4px; }

        .desktop-sidebar { display:flex !important; }
        .sidebar-toggle  { display:flex !important; }
        .desktop-nav     { display:flex !important; }
        .mobile-menu-btn { display:none !important; }

        @media (max-width: 768px) {
          .desktop-sidebar { display:none !important; }
          .sidebar-toggle  { display:none !important; }
          .desktop-nav     { display:none !important; }
          .mobile-menu-btn { display:flex !important; }
        }

        .chat-scroll { scrollbar-gutter: stable; }
      `}</style>
    </div>
  );
}

/* ── Shared style helpers ── */
const ghostBtn = {
  background:'transparent', border:'none',
  cursor:'pointer', color:'rgba(232,236,244,0.45)',
  display:'flex', alignItems:'center', justifyContent:'center',
  borderRadius:8, padding:7, transition:'background .15s, color .15s',
};
const iconBtnStyle = (color) => ({
  background:'none', border:'none', cursor:'pointer',
  color: color, padding:'3px 4px', borderRadius:5,
  display:'flex', alignItems:'center', justifyContent:'center',
  transition:'all .15s',
});

export default withAuth(AIChat);
