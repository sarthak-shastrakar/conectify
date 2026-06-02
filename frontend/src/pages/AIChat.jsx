import React, { useContext, useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import SendIcon from '@mui/icons-material/Send';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import SecurityIcon from '@mui/icons-material/Security';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ChatIcon from '@mui/icons-material/Chat';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import SearchIcon from '@mui/icons-material/Search';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import InputAdornment from '@mui/material/InputAdornment';
import Divider from '@mui/material/Divider';
import { useTheme } from '@mui/material/styles';
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
        chatHistory: [...chatHistory, userMsg]
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

  const handleQuickPrompt = (promptText) => {
    setChatQuery(promptText);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: theme.palette.background.default }}>
      <AppSidebar />

      {/* Main Container */}
      <Box 
        component="main" 
        sx={{ 
          flex: 1, 
          p: { xs: 2, sm: 3, md: 5 }, 
          pt: { xs: 11, sm: 12, md: 14 }, 
          pb: { xs: 5, md: 5 },
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'stretch'
        }}
      >
        <Grid container spacing={4} sx={{ maxWidth: '1200px', width: '100%', mx: 'auto' }}>
          
          {/* Left panel: New Chat + Chat History Session Sidebar */}
          <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            
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
                }
              }}
            >
              New Chat Session
            </Button>
            
            {/* Chat Sessions History list */}
            <GlassCard sx={{ p: 2.5, borderRadius: '24px', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
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
                          <Box
                            key={sess.id}
                            onClick={() => !isEditing && setActiveSessionId(sess.id)}
                            sx={{
                              p: 1.5,
                              borderRadius: '14px',
                              cursor: isEditing ? 'default' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: isActive 
                                ? 'rgba(124,58,237,0.1)' 
                                : 'transparent',
                              border: `1px solid ${isActive ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.05)'}`,
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                background: isEditing ? 'transparent' : 'rgba(255,255,255,0.03)',
                                borderColor: isActive ? 'rgba(124,58,237,0.35)' : 'rgba(255,255,255,0.1)'
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
                                      opacity: 0.3,
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
                                      opacity: 0.3,
                                      '&:hover': { opacity: 1, color: 'error.light' } 
                                    }}
                                  >
                                    <DeleteIcon sx={{ fontSize: 14 }} />
                                  </IconButton>
                                </>
                              )}
                            </Stack>
                          </Box>
                        );
                      })}
                    </Box>
                  );
                })}
              </Box>

              <Divider sx={{ my: 2, opacity: 0.5 }} />

              {/* Bot Meta Info */}
              <Stack direction="row" alignItems="center" spacing={1.2} sx={{ opacity: 0.8 }}>
                <SecurityIcon sx={{ color: 'success.main', fontSize: 16 }} />
                <Typography variant="caption" fontWeight={700} color="success.main">NSFW & Privacy Shield Active</Typography>
              </Stack>
            </GlassCard>
          </Grid>

          {/* Right panel: Main Chat Window */}
          <Grid item xs={12} md={8} sx={{ display: 'flex', flexDirection: 'column' }}>
            <GlassCard 
              sx={{ 
                flex: 1, 
                borderRadius: '28px', 
                p: 0, 
                display: 'flex', 
                flexDirection: 'column', 
                height: { xs: '500px', md: '100%' },
                background: isDark ? 'rgba(5,8,16,0.5)' : '#ffffff',
                overflow: 'hidden'
              }}
            >
              {/* Header */}
              <Box sx={{ p: 2.5, borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Avatar sx={{ background: 'linear-gradient(135deg, #7C3AED, #3B82F6)', width: 36, height: 36 }}>
                    <SmartToyIcon sx={{ fontSize: 20 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={800}>Product AI bot</Typography>
                    <Typography variant="caption" color="success.main" fontWeight={700}>System Active</Typography>
                  </Box>
                </Stack>
                <Chip icon={<InfoOutlinedIcon sx={{ fontSize: '14px !important' }} />} label="Mistral Low Token Mode" size="small" sx={{ fontWeight: 700, background: 'rgba(124,58,237,0.12)', color: '#7C3AED' }} />
              </Box>

              {/* Chat history logs */}
              <Box sx={{ flex: 1, overflowY: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                {chatHistory.map((item, idx) => {
                  const isOwn = item.sender === 'User';
                  return (
                    <Box
                      key={idx}
                      sx={{
                        alignSelf: isOwn ? 'flex-end' : 'flex-start',
                        maxWidth: '80%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isOwn ? 'flex-end' : 'flex-start'
                      }}
                    >
                      <Typography variant="caption" sx={{ color: isOwn ? '#A78BFA' : '#7C3AED', fontWeight: 800, mb: 0.5, fontSize: '0.72rem' }}>
                        {isOwn ? 'You' : 'Conectify Product AI'}
                      </Typography>
                      <Box
                        sx={{
                          background: isOwn 
                            ? 'linear-gradient(135deg, #7C3AED, #3B82F6)' 
                            : isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc',
                          color: isOwn ? 'white' : 'text.primary',
                          p: 2.2,
                          borderRadius: isOwn ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                          border: isOwn ? 'none' : `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`,
                          boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                        }}
                      >
                        <Typography variant="body2" sx={{ lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                          {item.text}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })}

                {aiLoading && (
                  <Box sx={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <CircularProgress size={16} sx={{ color: '#7C3AED' }} />
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>AI is processing your query...</Typography>
                  </Box>
                )}
                <div ref={chatEndRef} />
              </Box>

              {/* Input Area */}
              <Box sx={{ p: 2.5, borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`, background: isDark ? 'rgba(0,0,0,0.1)' : '#f8fafc' }}>
                <Stack direction="row" spacing={2}>
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
    </Box>
  );
}

export default withAuth(AIChat);
