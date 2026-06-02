import React, { useContext, useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Avatar from '@mui/material/Avatar';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Drawer from '@mui/material/Drawer';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import SendIcon from '@mui/icons-material/Send';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ChatIcon from '@mui/icons-material/Chat';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import SearchIcon from '@mui/icons-material/Search';
import MenuIcon from '@mui/icons-material/Menu';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import InputAdornment from '@mui/material/InputAdornment';
import Divider from '@mui/material/Divider';
import { useTheme } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../contexts/AuthContext';
import AppSidebar from './Navbar';
import GlassCard from '../components/ui/GlassCard';
import withAuth from '../utils/withAuth';
import api from '../utils/api';
import { API_ROUTES } from '../utils/constants';

function AIChat() {
  const theme = useTheme();
  const { userData } = useContext(AuthContext);
  const isDark = theme.palette.mode === 'dark';
  const chatEndRef = useRef(null);

  const [chatQuery, setChatQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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
          { sender: 'AI', text: 'Hello! I am Conectify AI, the official product companion. Ask me about video calls, meeting code setups, troubleshoot devices, or general helper requests! 🤖' }
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

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const selectSession = (id) => {
    setActiveSessionId(id);
    setMobileOpen(false); // Close drawer on mobile selection
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
          // If first message in a default "New Chat" session, auto-rename the title
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
    setSearchQuery(''); // clear search filter on new chat
    setMobileOpen(false); // Close drawer on mobile
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
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // Render Sidebar content for reusability on mobile/desktop
  const renderSidebarContent = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 2.5 }}>
      {/* New Chat Button Launcher */}
      <Button
        variant="contained"
        onClick={handleNewChat}
        startIcon={<AddIcon />}
        sx={{
          py: 1.8,
          borderRadius: '16px',
          fontWeight: 700,
          textTransform: 'none',
          background: 'linear-gradient(135deg, #7C3AED 0%, #3B82F6 100%)',
          boxShadow: '0 8px 24px rgba(124,58,237,0.3)',
          '&:hover': {
            background: 'linear-gradient(135deg, #6D28D9 0%, #2563EB 100%)',
            boxShadow: '0 12px 32px rgba(124,58,237,0.45)',
          }
        }}
      >
        New Chat Session
      </Button>

      {/* Chat Sessions History Container */}
      <GlassCard 
        sx={{ 
          p: 2.5, 
          borderRadius: '24px', 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          overflow: 'hidden',
          background: isDark ? 'rgba(10, 15, 30, 0.45)' : 'rgba(255, 255, 255, 0.45)',
          border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
          boxShadow: isDark 
            ? '0 12px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)' 
            : '0 12px 40px rgba(100,80,200,0.06), inset 0 1px 0 rgba(255,255,255,0.8)',
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="subtitle2" fontWeight={800} sx={{ fontFamily: '"Space Grotesk", sans-serif', color: 'text.secondary' }}>
            Chat History
          </Typography>
          {sessions.length > 1 && (
            <IconButton 
              size="small" 
              onClick={handleClearAllSessions}
              title="Clear All Chats"
              sx={{ 
                color: 'text.secondary', 
                '&:hover': { color: 'error.light', background: 'rgba(239, 68, 68, 0.08)' } 
              }}
            >
              <DeleteSweepIcon fontSize="small" />
            </IconButton>
          )}
        </Stack>

        {/* Search Box */}
        <TextField
          placeholder="Search conversations..."
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
              </InputAdornment>
            ),
            sx: {
              borderRadius: '12px',
              fontSize: '0.85rem',
              mb: 2,
              background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
            }
          }}
          fullWidth
        />
        
        <Box sx={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2, pr: 0.5 }}>
          {Object.entries(getGroupedSessions()).map(([groupName, groupSessions]) => {
            if (groupSessions.length === 0) return null;
            return (
              <Box key={groupName} sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                <Typography 
                  variant="caption" 
                  fontWeight={750} 
                  sx={{ 
                    fontSize: '0.7rem', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.5px', 
                    color: 'text.secondary', 
                    opacity: 0.7, 
                    mb: 0.5,
                    pl: 1
                  }}
                >
                  {groupName}
                </Typography>
                {groupSessions.map((sess) => {
                  const isActive = sess.id === activeSessionId;
                  const isEditing = sess.id === editingSessionId;
                  return (
                    <motion.div
                      key={sess.id}
                      whileHover={{ scale: isEditing ? 1 : 1.02 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      <Box
                        onClick={() => !isEditing && selectSession(sess.id)}
                        sx={{
                          p: 1.5,
                          borderRadius: '14px',
                          cursor: isEditing ? 'default' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: isActive 
                            ? 'rgba(124,58,237,0.12)' 
                            : 'transparent',
                          border: `1px solid ${isActive ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.03)'}`,
                          transition: 'background 0.2s ease, border-color 0.2s ease',
                          '&:hover': {
                            background: isEditing ? 'transparent' : 'rgba(255,255,255,0.05)',
                            borderColor: isActive ? 'rgba(124,58,237,0.45)' : 'rgba(255,255,255,0.1)'
                          }
                        }}
                      >
                        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0, flex: 1 }}>
                          <ChatIcon sx={{ color: isActive ? '#7C3AED' : 'text.secondary', fontSize: 18 }} />
                          {isEditing ? (
                            <TextField
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              onKeyDown={(e) => handleTitleKeyDown(sess.id, e)}
                              autoFocus
                              size="small"
                              variant="standard"
                              onClick={(e) => e.stopPropagation()}
                              InputProps={{
                                disableUnderline: false,
                                sx: { 
                                  fontSize: '0.85rem', 
                                  fontWeight: 800, 
                                  color: 'text.primary',
                                }
                              }}
                              sx={{ flex: 1 }}
                            />
                          ) : (
                            <Stack direction="column" sx={{ minWidth: 0, flex: 1, spacing: 0.3 }}>
                              <Typography 
                                variant="body2" 
                                fontWeight={isActive ? 800 : 500} 
                                color={isActive ? 'text.primary' : 'text.secondary'}
                                noWrap 
                                sx={{ fontSize: '0.85rem' }}
                              >
                                {sess.title}
                              </Typography>
                              <Typography 
                                variant="caption" 
                                color="text.secondary" 
                                sx={{ fontSize: '0.68rem', opacity: 0.65 }}
                              >
                                {formatSessionDate(sess.createdAt || (sess.id.startsWith('session_') ? parseInt(sess.id.split('_')[1]) : Date.now()))}
                              </Typography>
                            </Stack>
                          )}
                        </Stack>

                        {/* Session item action triggers */}
                        <Stack direction="row" spacing={0.5} sx={{ ml: 1 }}>
                          {isEditing ? (
                            <IconButton 
                              size="small" 
                              onClick={(e) => saveTitle(sess.id, e)}
                              sx={{ color: 'success.main' }}
                            >
                              <CheckIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          ) : (
                            <>
                              <IconButton 
                                size="small" 
                                className="edit-session-btn"
                                onClick={(e) => startEditing(sess.id, sess.title, e)}
                                sx={{ 
                                  color: 'text.secondary', 
                                  opacity: 0.4,
                                  '&:hover': { opacity: 1, color: 'primary.light' } 
                                }}
                              >
                                <EditIcon sx={{ fontSize: 14 }} />
                              </IconButton>
                              <IconButton 
                                size="small" 
                                onClick={(e) => handleDeleteSession(sess.id, e)}
                                sx={{ 
                                  color: 'text.secondary', 
                                  opacity: 0.4,
                                  '&:hover': { opacity: 1, color: 'error.light' } 
                                }}
                              >
                                <DeleteIcon sx={{ fontSize: 14 }} />
                              </IconButton>
                            </>
                          )}
                        </Stack>
                      </Box>
                    </motion.div>
                  );
                })}
              </Box>
            );
          })}
        </Box>
      </GlassCard>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: theme.palette.background.default, position: 'relative', overflow: 'hidden' }}>
      <AppSidebar />

      {/* Decorative Blur Spheres for deep glassmorphism overlay */}
      <Box sx={{
        position: 'absolute',
        top: '15%',
        left: '8%',
        width: '320px',
        height: '320px',
        background: 'radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)',
        filter: 'blur(60px)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />
      <Box sx={{
        position: 'absolute',
        bottom: '15%',
        right: '12%',
        width: '380px',
        height: '380px',
        background: 'radial-gradient(circle, rgba(37,99,235,0.14) 0%, transparent 70%)',
        filter: 'blur(70px)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />

      {/* Main Container */}
      <Box 
        component="main" 
        sx={{ 
          flex: 1, 
          p: { xs: 2, sm: 3, md: 4 }, 
          pt: { xs: 11, sm: 12, md: 14 }, 
          pb: { xs: 4, md: 4 },
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'stretch',
          position: 'relative',
          zIndex: 1
        }}
      >
        <Grid container spacing={3} sx={{ maxWidth: '1280px', width: '100%', mx: 'auto', alignItems: 'stretch' }}>
          
          {/* Left panel (Desktop Only): Sessions List */}
          <Grid item xs={0} md={4} sx={{ display: { xs: 'none', md: 'flex' }, flexDirection: 'column' }}>
            {renderSidebarContent()}
          </Grid>

          {/* Right panel: Main Chat Window */}
          <Grid item xs={12} md={8} sx={{ display: 'flex', flexDirection: 'column', height: { xs: 'calc(100vh - 120px)', md: 'auto' } }}>
            <GlassCard 
              sx={{ 
                flex: 1, 
                borderRadius: '28px', 
                p: 0, 
                display: 'flex', 
                flexDirection: 'column', 
                height: '100%',
                background: isDark ? 'rgba(5, 8, 16, 0.45)' : 'rgba(255, 255, 255, 0.55)',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                boxShadow: isDark 
                  ? '0 16px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)' 
                  : '0 16px 48px rgba(100,80,200,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
                overflow: 'hidden'
              }}
            >
              {/* Header */}
              <Box sx={{ p: 2.5, borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  {/* Mobile Sidebar Toggle Trigger Button */}
                  <IconButton
                    color="inherit"
                    aria-label="open drawer"
                    edge="start"
                    onClick={handleDrawerToggle}
                    sx={{ mr: 0.5, display: { md: 'none' }, color: 'text.secondary' }}
                  >
                    <MenuIcon />
                  </IconButton>

                  <Avatar sx={{ background: 'linear-gradient(135deg, #7C3AED, #3B82F6)', width: 38, height: 38, boxShadow: '0 4px 12px rgba(124,58,237,0.3)' }}>
                    <SmartToyIcon sx={{ fontSize: 21 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={800} sx={{ fontFamily: '"Space Grotesk", sans-serif' }}>Product AI Companion</Typography>
                    <Stack direction="row" alignItems="center" spacing={0.8}>
                      <Box sx={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px #10B981', animation: 'drift 2.5s infinite ease-in-out' }} />
                      <Typography variant="caption" color="success.main" fontWeight={750}>Active</Typography>
                    </Stack>
                  </Box>
                </Stack>
              </Box>

              {/* Chat history logs */}
              <Box sx={{ flex: 1, overflowY: 'auto', p: { xs: 2.2, sm: 3 }, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <AnimatePresence initial={false}>
                  {chatHistory.map((item, idx) => {
                    const isOwn = item.sender === 'User';
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ type: "spring", stiffness: 350, damping: 24 }}
                        style={{
                          alignSelf: isOwn ? 'flex-end' : 'flex-start',
                          maxWidth: '85%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: isOwn ? 'flex-end' : 'flex-start'
                        }}
                      >
                        <Typography variant="caption" sx={{ color: isOwn ? '#A78BFA' : '#7C3AED', fontWeight: 800, mb: 0.6, fontSize: '0.72rem', letterSpacing: '0.3px' }}>
                          {isOwn ? 'You' : 'Conectify Assistant'}
                        </Typography>
                        <Box
                          sx={{
                            background: isOwn 
                              ? 'linear-gradient(135deg, #7C3AED, #3B82F6)' 
                              : isDark ? 'rgba(255,255,255,0.03)' : '#f3f4f6',
                            color: isOwn ? 'white' : 'text.primary',
                            p: { xs: 1.8, sm: 2.2 },
                            borderRadius: isOwn ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                            border: isOwn ? 'none' : `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}`,
                            boxShadow: isDark 
                              ? '0 6px 20px rgba(0,0,0,0.2)' 
                              : '0 6px 20px rgba(100,80,200,0.03)',
                            backdropFilter: isOwn ? 'none' : 'blur(10px)',
                          }}
                        >
                          <Typography variant="body2" sx={{ lineHeight: 1.6, whiteSpace: 'pre-line', fontSize: { xs: '0.85rem', sm: '0.88rem' } }}>
                            {item.text}
                          </Typography>
                        </Box>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {aiLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 1.5 }}
                  >
                    <CircularProgress size={16} sx={{ color: '#7C3AED' }} />
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>AI is crafting a response...</Typography>
                  </motion.div>
                )}
                <div ref={chatEndRef} />
              </Box>

              {/* Input Area */}
              <Box sx={{ p: 2.5, borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`, background: isDark ? 'rgba(5, 8, 16, 0.3)' : 'rgba(240, 242, 255, 0.4)' }}>
                <Stack direction="row" spacing={1.5}>
                  <TextField
                    placeholder="Ask Conectify AI product helper..."
                    fullWidth
                    value={chatQuery}
                    onChange={(e) => setChatQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && chatQuery.trim() && !aiLoading) {
                        handleSendChatMessage();
                      }
                    }}
                    InputProps={{
                      sx: {
                        borderRadius: '16px',
                        background: isDark ? 'rgba(255,255,255,0.02)' : '#ffffff',
                      }
                    }}
                  />
                  <IconButton
                    onClick={handleSendChatMessage}
                    disabled={aiLoading || !chatQuery.trim()}
                    sx={{
                      width: 56,
                      height: 56,
                      background: 'linear-gradient(135deg, #7C3AED 0%, #3B82F6 100%)',
                      color: 'white',
                      boxShadow: '0 4px 16px rgba(124,58,237,0.3)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #6D28D9 0%, #1D4ED8 100%)',
                        boxShadow: '0 6px 20px rgba(124,58,237,0.45)',
                      }
                    }}
                  >
                    <SendIcon />
                  </IconButton>
                </Stack>
              </Box>

            </GlassCard>
          </Grid>

        </Grid>
      </Box>

      {/* Slide-out off-canvas Drawer for Mobile/Tablet Screens */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: 290,
            p: 2.5,
            pt: 4,
            background: isDark ? 'rgba(10, 12, 22, 0.85)' : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(20px)',
            borderRight: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
          },
        }}
      >
        {renderSidebarContent()}
      </Drawer>
    </Box>
  );
}

export default withAuth(AIChat);
