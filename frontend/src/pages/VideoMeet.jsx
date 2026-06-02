import React, { useEffect, useRef, useState, useContext } from "react";
import io from "socket.io-client";
import {
  Badge,
  IconButton,
  TextField,
  Button,
  Box,
  Typography,
  Drawer,
  Stack,
  Divider,
  Tooltip,
  Snackbar,
  Grid,
  Avatar,
  CircularProgress,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import CallEndIcon from "@mui/icons-material/CallEnd";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import StopScreenShareIcon from "@mui/icons-material/StopScreenShare";
import ChatIcon from "@mui/icons-material/Chat";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import SecurityIcon from "@mui/icons-material/Security";
import PeopleIcon from "@mui/icons-material/People";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
import PanToolIcon from "@mui/icons-material/PanTool";
import SmartToyIcon from "@mui/icons-material/SmartToy";

import server from "../environment";
import GlassCard from "../components/ui/GlassCard";
import GradientText from "../components/ui/GradientText";
import OrbitalDecor from "../components/ui/OrbitalDecor";
import { AuthContext } from "../contexts/AuthContext";
import api from "../utils/api";
import { API_ROUTES } from "../utils/constants";

const server_url = server;

var connections = {};

const peerConfigConnections = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export default function VideoMeetComponent() {
  var socketRef = useRef();
  let socketIdRef = useRef();
  let localVideoref = useRef();
  const { userData, isLoading } = useContext(AuthContext);

  let [videoAvailable, setVideoAvailable] = useState(true);
  let [audioAvailable, setAudioAvailable] = useState(true);
  let [video, setVideo] = useState([]);
  let [audio, setAudio] = useState();
  let [screen, setScreen] = useState();
  let [showModal, setModal] = useState(false);
  let [screenAvailable, setScreenAvailable] = useState();
  let [messages, setMessages] = useState([]);
  let [message, setMessage] = useState("");
  let [newMessages, setNewMessages] = useState(0);
  let [askForUsername, setAskForUsername] = useState(true);
  let [username, setUsername] = useState("");

  useEffect(() => {
    if (!isLoading && userData) {
      setUsername(userData.name || userData.username || "");
    }
  }, [isLoading, userData]);



  const videoRef = useRef([]);
  let [videos, setVideos] = useState([]);
  let [snackbarOpen, setSnackbarOpen] = useState(false);
  let [editingIndex, setEditingIndex] = useState(null);
  let [editText, setEditText] = useState("");
  
  // Real-time clock for the header
  let [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  // Emoji reactions
  let [floatingEmojis, setFloatingEmojis] = useState([]);
  let [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Raise hand
  let [handRaised, setHandRaised] = useState(false);
  let [raisedHands, setRaisedHands] = useState({});
  let [handSnackbar, setHandSnackbar] = useState("");

  // Join/Leave Notifications
  let [joinLeaveToast, setJoinLeaveToast] = useState({ open: false, message: "", isJoin: true });

  // AI Assistant Chatbot state inside VideoMeet
  let [aiActive, setAiActive] = useState(false);
  let [aiQuery, setAiQuery] = useState("");
  let [aiHistory, setAiHistory] = useState([
    { sender: 'AI', text: 'Hello! I am Conectify AI, your meeting assistant. Ask me anything! 🤖' }
  ]);
  let [aiMeetLoading, setAiMeetLoading] = useState(false);

  const handleSendAiMessage = async () => {
    if (!aiQuery.trim()) return;
    const userMsg = { sender: 'User', text: aiQuery };
    setAiHistory((prev) => [...prev, userMsg]);
    const currentQuery = aiQuery;
    setAiQuery('');
    setAiMeetLoading(true);

    try {
      const res = await api.post(API_ROUTES.CHATBOT, {
        message: currentQuery,
        chatHistory: aiHistory
      });
      setAiHistory((prev) => [...prev, { sender: 'AI', text: res.data.reply }]);
    } catch (err) {
      console.error("AI chat failed inside meeting:", err);
      setAiHistory((prev) => [...prev, { sender: 'AI', text: 'Failed to connect. Please try again! ⚠️' }]);
    } finally {
      setAiMeetLoading(false);
    }
  };

  const copyMeetingLink = () => {
    const url = window.location.href;
    const code = url.substring(url.lastIndexOf('/') + 1);
    const inviteText = `Join my Conectify-Call video meeting!\n\nMeeting Code: ${code}\nMeeting Link: ${url}`;
    navigator.clipboard.writeText(inviteText);
    setSnackbarOpen(true);
  };

  useEffect(() => {
    getPermissions();
  }, []);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  let getDislayMedia = () => {
    if (screen) {
      if (navigator.mediaDevices.getDisplayMedia) {
        navigator.mediaDevices
          .getDisplayMedia({ video: true, audio: true })
          .then(getDislayMediaSuccess)
          .then((stream) => {})
          .catch((e) => console.error(e));
      }
    }
  };

  const getPermissions = async () => {
    try {
      const videoPermission = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      if (videoPermission) {
        setVideoAvailable(true);
      } else {
        setVideoAvailable(false);
      }

      const audioPermission = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      if (audioPermission) {
        setAudioAvailable(true);
      } else {
        setAudioAvailable(false);
      }

      if (navigator.mediaDevices.getDisplayMedia) {
        setScreenAvailable(true);
      } else {
        setScreenAvailable(false);
      }

      if (videoAvailable || audioAvailable) {
        const userMediaStream = await navigator.mediaDevices.getUserMedia({
          video: videoAvailable,
          audio: audioAvailable,
        });
        if (userMediaStream) {
          window.localStream = userMediaStream;
          if (localVideoref.current) {
            localVideoref.current.srcObject = userMediaStream;
          }
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (video !== undefined && audio !== undefined) {
      getUserMedia();
    }
  }, [video, audio]);

  let getMedia = () => {
    setVideo(videoAvailable);
    setAudio(audioAvailable);
    connectToSocketServer();
  };

  let getUserMediaSuccess = (stream) => {
    try {
      window.localStream.getTracks().forEach((track) => track.stop());
    } catch (e) {
      console.log(e);
    }

    window.localStream = stream;
    localVideoref.current.srcObject = stream;

    for (let id in connections) {
      if (id === socketIdRef.current) continue;

      connections[id].addStream(window.localStream);

      connections[id].createOffer().then((description) => {
        connections[id]
          .setLocalDescription(description)
          .then(() => {
            socketRef.current.emit(
              "signal",
              id,
              JSON.stringify({ sdp: connections[id].localDescription })
            );
          })
          .catch((e) => console.error(e));
      });
    }

    stream.getTracks().forEach(
      (track) =>
        (track.onended = () => {
          setVideo(false);
          setAudio(false);

          try {
            let tracks = localVideoref.current.srcObject.getTracks();
            tracks.forEach((track) => track.stop());
          } catch (e) {
            console.error(e);
          }

          let blackSilence = (...args) =>
            new MediaStream([black(...args), silence()]);
          window.localStream = blackSilence();
          localVideoref.current.srcObject = window.localStream;

          for (let id in connections) {
            connections[id].addStream(window.localStream);

            connections[id].createOffer().then((description) => {
              connections[id]
                .setLocalDescription(description)
                .then(() => {
                  socketRef.current.emit(
                    "signal",
                    id,
                    JSON.stringify({ sdp: connections[id].localDescription })
                  );
                })
                .catch((e) => console.log(e));
            });
          }
        })
    );
  };

  let getUserMedia = () => {
    if ((video && videoAvailable) || (audio && audioAvailable)) {
      navigator.mediaDevices
        .getUserMedia({ video: video, audio: audio })
        .then(getUserMediaSuccess)
        .then((stream) => {})
        .catch((e) => console.error(e));
    } else {
      try {
        let tracks = localVideoref.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      } catch (e) {}
    }
  };

  let getDislayMediaSuccess = (stream) => {
    try {
      window.localStream.getTracks().forEach((track) => track.stop());
    } catch (e) {
      console.error(e);
    }

    window.localStream = stream;
    localVideoref.current.srcObject = stream;

    for (let id in connections) {
      if (id === socketIdRef.current) continue;

      connections[id].addStream(window.localStream);

      connections[id].createOffer().then((description) => {
        connections[id]
          .setLocalDescription(description)
          .then(() => {
            socketRef.current.emit(
              "signal",
              id,
              JSON.stringify({ sdp: connections[id].localDescription })
            );
          })
          .catch((e) => console.error(e));
      });
    }

    stream.getTracks().forEach(
      (track) =>
        (track.onended = () => {
          setScreen(false);

          try {
            let tracks = localVideoref.current.srcObject.getTracks();
            tracks.forEach((track) => track.stop());
          } catch (e) {
            console.error(e);
          }

          let blackSilence = (...args) =>
            new MediaStream([black(...args), silence()]);
          window.localStream = blackSilence();
          localVideoref.current.srcObject = window.localStream;

          getUserMedia();
        })
    );
  };

  let gotMessageFromServer = (fromId, message) => {
    var signal = JSON.parse(message);

    if (fromId !== socketIdRef.current) {
      if (signal.sdp) {
        connections[fromId]
          .setRemoteDescription(new RTCSessionDescription(signal.sdp))
          .then(() => {
            if (signal.sdp.type === "offer") {
              connections[fromId]
                .createAnswer()
                .then((description) => {
                  connections[fromId]
                    .setLocalDescription(description)
                    .then(() => {
                      socketRef.current.emit(
                        "signal",
                        fromId,
                        JSON.stringify({
                          sdp: connections[fromId].localDescription,
                        })
                      );
                    })
                    .catch((e) => console.error(e));
                })
                .catch((e) => console.error(e));
            }
          })
          .catch((e) => console.error(e));
      }

      if (signal.ice) {
        connections[fromId]
          .addIceCandidate(new RTCIceCandidate(signal.ice))
          .catch((e) => console.error(e));
      }
    }
  };

  let connectToSocketServer = () => {
    socketRef.current = io.connect(server_url, { secure: false });

    socketRef.current.on("signal", gotMessageFromServer);

    socketRef.current.on("connect", () => {
      const userInfo = userData
        ? { username: userData.username, name: userData.name, avatar: userData.avatar }
        : { username: username, name: username, avatar: null };

      socketRef.current.emit("join-call", window.location.href, userInfo);
      socketIdRef.current = socketRef.current.id;

      socketRef.current.on("chat-message", addMessage);

      socketRef.current.on("edit-chat-message", (index, newData) => {
        setMessages((prevMessages) => {
          const updated = [...prevMessages];
          if (updated[index]) {
            updated[index].data = newData;
          }
          return updated;
        });
      });

      socketRef.current.on("user-left", (id, leavingUserName) => {
        setVideos((videos) => videos.filter((video) => video.socketId !== id));
        // Clear raised hand when user leaves
        setRaisedHands((prev) => {
          const updated = { ...prev };
          delete updated[id];
          return updated;
        });
        if (leavingUserName) {
          setJoinLeaveToast({
            open: true,
            message: `${leavingUserName} left the call 🚪`,
            isJoin: false
          });
        }
      });

      socketRef.current.on("emoji-reaction", (emoji, sender) => {
        const id = Date.now() + Math.random();
        const x = 12 + Math.random() * 70;
        setFloatingEmojis((prev) => [...prev, { id, emoji, x, sender }]);
        setTimeout(() => {
          setFloatingEmojis((prev) => prev.filter((e) => e.id !== id));
        }, 3000);
      });

      socketRef.current.on("raise-hand", (socketId, sender) => {
        setRaisedHands((prev) => ({ ...prev, [socketId]: sender }));
        if (socketId !== socketIdRef.current) {
          setHandSnackbar(`${sender} raised their hand ✋`);
        }
      });

      socketRef.current.on("lower-hand", (socketId) => {
        setRaisedHands((prev) => {
          const updated = { ...prev };
          delete updated[socketId];
          return updated;
        });
      });

      socketRef.current.on("user-joined", (id, clients, joiningUserName) => {
        if (joiningUserName) {
          setJoinLeaveToast({
            open: true,
            message: `${joiningUserName} joined the call 👋`,
            isJoin: true
          });
        }
        clients.forEach((socketListId) => {
          connections[socketListId] = new RTCPeerConnection(
            peerConfigConnections
          );
          connections[socketListId].onicecandidate = function (event) {
            if (event.candidate != null) {
              socketRef.current.emit(
                "signal",
                socketListId,
                JSON.stringify({ ice: event.candidate })
              );
            }
          };

          connections[socketListId].onaddstream = (event) => {
            let videoExists = videoRef.current.find(
              (video) => video.socketId === socketListId
            );

            if (videoExists) {
              setVideos((videos) => {
                const updatedVideos = videos.map((video) =>
                  video.socketId === socketListId
                    ? { ...video, stream: event.stream }
                    : video
                );
                videoRef.current = updatedVideos;
                return updatedVideos;
              });
            } else {
              let newVideo = {
                socketId: socketListId,
                stream: event.stream,
                autoplay: true,
                playsinline: true,
              };

              setVideos((videos) => {
                const updatedVideos = [...videos, newVideo];
                videoRef.current = updatedVideos;
                return updatedVideos;
              });
            }
          };

          if (window.localStream !== undefined && window.localStream !== null) {
            connections[socketListId].addStream(window.localStream);
          } else {
            let blackSilence = (...args) =>
              new MediaStream([black(...args), silence()]);
            window.localStream = blackSilence();
            connections[socketListId].addStream(window.localStream);
          }
        });

        if (id === socketIdRef.current) {
          for (let id2 in connections) {
            if (id2 === socketIdRef.current) continue;

            try {
              connections[id2].addStream(window.localStream);
            } catch (e) {}

            connections[id2].createOffer().then((description) => {
              connections[id2]
                .setLocalDescription(description)
                .then(() => {
                  socketRef.current.emit(
                    "signal",
                    id2,
                    JSON.stringify({ sdp: connections[id2].localDescription })
                  );
                })
                .catch((e) => console.error(e));
            });
          }
        }
      });
    });
  };

  let silence = () => {
    let ctx = new AudioContext();
    let oscillator = ctx.createOscillator();
    let dst = oscillator.connect(ctx.createMediaStreamDestination());
    oscillator.start();
    ctx.resume();
    return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
  };
  let black = ({ width = 640, height = 480 } = {}) => {
    let canvas = Object.assign(document.createElement("canvas"), {
      width,
      height,
    });
    canvas.getContext("2d").fillRect(0, 0, width, height);
    let stream = canvas.captureStream();
    return Object.assign(stream.getVideoTracks()[0], { enabled: false });
  };

  let handleVideo = () => {
    setVideo(!video);
  };
  let handleAudio = () => {
    setAudio(!audio);
  };

  useEffect(() => {
    if (screen !== undefined) {
      getDislayMedia();
    }
  }, [screen]);
  let handleScreen = () => {
    setScreen(!screen);
  };

  let handleEndCall = () => {
    try {
      let tracks = localVideoref.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
    } catch (e) {}
    window.location.href = "/home";
  };

  let openChat = () => {
    setModal(true);
    setNewMessages(0);
  };
  let closeChat = () => {
    setModal(false);
  };
  let handleMessage = (e) => {
    setMessage(e.target.value);
  };

  const addMessage = (data, sender, socketIdSender) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      { sender: sender, data: data, socketIdSender: socketIdSender },
    ]);
    if (socketIdSender !== socketIdRef.current) {
      setNewMessages((prevNewMessages) => prevNewMessages + 1);
    }
  };

  let sendMessage = () => {
    socketRef.current.emit("chat-message", message, username);
    setMessage("");
  };

  const editMessage = (index, newText) => {
    if (socketRef.current) {
      socketRef.current.emit("edit-chat-message", index, newText);
    }
  };

  const addFloatingEmoji = (emoji, sender) => {
    const id = Date.now() + Math.random();
    const x = 12 + Math.random() * 70;
    setFloatingEmojis((prev) => [...prev, { id, emoji, x, sender }]);
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((e) => e.id !== id));
    }, 3000);
  };

  const sendEmojiReaction = (emoji) => {
    addFloatingEmoji(emoji, username);
    if (socketRef.current) {
      socketRef.current.emit("emoji-reaction", emoji, username);
    }
    setShowEmojiPicker(false);
  };

  const toggleRaiseHand = () => {
    const newState = !handRaised;
    setHandRaised(newState);
    if (socketRef.current) {
      if (newState) {
        socketRef.current.emit("raise-hand", username);
        setRaisedHands((prev) => ({ ...prev, [socketIdRef.current]: username }));
      } else {
        socketRef.current.emit("lower-hand");
        setRaisedHands((prev) => {
          const updated = { ...prev };
          delete updated[socketIdRef.current];
          return updated;
        });
      }
    }
  };

  let connect = () => {
    setAskForUsername(false);
    getMedia();
  };

  // Pre-join lobby device preview control functions
  const toggleLobbyVideo = async () => {
    if (videoAvailable) {
      setVideoAvailable(false);
      try {
        let tracks = localVideoref.current.srcObject.getVideoTracks();
        tracks.forEach((track) => track.stop());
      } catch (e) {}
    } else {
      setVideoAvailable(true);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: audioAvailable,
        });
        window.localStream = stream;
        if (localVideoref.current) {
          localVideoref.current.srcObject = stream;
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const toggleLobbyAudio = () => {
    setAudioAvailable(!audioAvailable);
  };

  const currentRoomId = window.location.pathname.split("/").pop();

  if (isLoading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050810' }}>
        <CircularProgress sx={{ color: '#7C3AED' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", position: "relative", overflow: "hidden" }}>
      <style>{`
        @keyframes floatUpEmoji {
          0%   { transform: translateY(0) scale(1);    opacity: 1; }
          80%  { opacity: 0.85; }
          100% { transform: translateY(-310px) scale(1.35); opacity: 0; }
        }
        @keyframes handPulse {
          0%, 100% { transform: translateX(-50%) scale(1); }
          50%       { transform: translateX(-50%) scale(1.12); }
        }
      `}</style>
      
      {/* Drifting Ambient Neon Glow Blobs */}
      <Box 
        sx={{
          position: 'absolute',
          top: '10%',
          left: '5%',
          width: { xs: 200, md: 450 },
          height: { xs: 200, md: 450 },
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 75%)',
          filter: 'blur(60px)',
          animation: 'drift 10s ease-in-out infinite',
          zIndex: 0,
          pointerEvents: 'none'
        }}
      />
      <Box 
        sx={{
          position: 'absolute',
          bottom: '10%',
          right: '5%',
          width: { xs: 250, md: 500 },
          height: { xs: 250, md: 500 },
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37,99,235,0.08) 0%, transparent 75%)',
          filter: 'blur(70px)',
          animation: 'drift 12s ease-in-out 2s infinite reverse',
          zIndex: 0,
          pointerEvents: 'none'
        }}
      />

      {askForUsername === true ? (
        /* LOBBY / PRE-JOIN PREVIEW SCREEN */
        <Box
          sx={{
            display: "flex",
            minHeight: "100vh",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            zIndex: 1,
            p: 3,
            background: "radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.05) 0%, transparent 60%), #050810",
            animation: "fadeInUp 0.5s ease both",
          }}
        >
          {/* Orbital background decoration */}
          <Box sx={{ position: "absolute", zIndex: 0, opacity: 0.35, pointerEvents: 'none' }}>
            <OrbitalDecor size="lg" />
          </Box>

          <GlassCard
            float
            floatDelay="0s"
            sx={{
              maxWidth: 540,
              width: "100%",
              zIndex: 1,
              textAlign: "center",
              p: { xs: 3, md: 5 },
              borderRadius: "32px",
              boxShadow: "0 24px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
              background: "rgba(10, 15, 30, 0.65)",
            }}
          >
            <GradientText variant="h4" sx={{ mb: 1, fontWeight: 800, letterSpacing: '-1px' }}>
              Lobby Preview
            </GradientText>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4, fontWeight: 500 }}>
              Adjust your equipment and choose your display name before joining
            </Typography>

            {/* Video preview container */}
            <Box
              sx={{
                width: "100%",
                height: 280,
                borderRadius: "24px",
                overflow: "hidden",
                mb: 4,
                background: "#080c16",
                border: "1px solid rgba(255,255,255,0.08)",
                position: "relative",
                boxShadow: "0 12px 32px rgba(0,0,0,0.4)"
              }}
            >
              {videoAvailable ? (
                <video
                  ref={localVideoref}
                  autoPlay
                  muted
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <Box 
                  sx={{ 
                    width: '100%', 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: 1.5
                  }}
                >
                  <Avatar sx={{ width: 68, height: 68, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'text.secondary' }}>
                    <VideocamOffIcon sx={{ fontSize: 32 }} />
                  </Avatar>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Camera is turned off
                  </Typography>
                </Box>
              )}

              {/* Float pre-join control buttons over preview */}
              <Stack
                direction="row"
                spacing={2}
                sx={{
                  position: "absolute",
                  bottom: 16,
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "rgba(5, 8, 16, 0.75)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "100px",
                  p: 0.8,
                  zIndex: 4
                }}
              >
                <IconButton
                  onClick={toggleLobbyAudio}
                  sx={{
                    color: audioAvailable ? "#a78bfa" : "#ef4444",
                    background: audioAvailable ? "rgba(124,58,237,0.12)" : "rgba(239,68,68,0.12)",
                    border: `1px solid ${audioAvailable ? "rgba(124,58,237,0.2)" : "rgba(239,68,68,0.2)"}`,
                    "&:hover": { transform: "scale(1.1)", background: audioAvailable ? "rgba(124,58,237,0.2)" : "rgba(239,68,68,0.2)" }
                  }}
                >
                  {audioAvailable ? <MicIcon fontSize="small" /> : <MicOffIcon fontSize="small" />}
                </IconButton>
                <IconButton
                  onClick={toggleLobbyVideo}
                  sx={{
                    color: videoAvailable ? "#a78bfa" : "#ef4444",
                    background: videoAvailable ? "rgba(124,58,237,0.12)" : "rgba(239,68,68,0.12)",
                    border: `1px solid ${videoAvailable ? "rgba(124,58,237,0.2)" : "rgba(239,68,68,0.2)"}`,
                    "&:hover": { transform: "scale(1.1)", background: videoAvailable ? "rgba(124,58,237,0.2)" : "rgba(239,68,68,0.2)" }
                  }}
                >
                  {videoAvailable ? <VideocamIcon fontSize="small" /> : <VideocamOffIcon fontSize="small" />}
                </IconButton>
              </Stack>
            </Box>

            <Stack spacing={3}>
              <TextField
                label="Your Display Name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                variant="outlined"
                fullWidth
                autoFocus
                sx={{
                  input: { color: "white" },
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "14px",
                    background: "rgba(255,255,255,0.03)",
                    border: "none",
                  }
                }}
              />
              <Button
                variant="contained"
                color="primary"
                size="large"
                fullWidth
                onClick={connect}
                disabled={!username.trim()}
                sx={{
                  borderRadius: "14px",
                  py: 1.8,
                  fontWeight: 700,
                  fontSize: "1rem"
                }}
              >
                Join Secure Meeting
              </Button>
            </Stack>
          </GlassCard>
        </Box>
      ) : (
        /* ACTIVE CALL SCREEN WITH PREMIUM CINEMATIC LAYOUT */
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            background: "#050810",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            zIndex: 1,
            animation: "fadeInUp 0.5s ease both",
          }}
        >
          {/* Top Header Bar */}
          <Box
            sx={{
              height: 70,
              width: "100%",
              background: "rgba(5, 8, 16, 0.45)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: { xs: 2, md: 4 },
              zIndex: 15,
            }}
          >
            {/* Left: Brand Identity */}
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Typography sx={{ fontSize: '24px', color: '#a78bfa' }}>⬡</Typography>
              <Box>
                <GradientText variant="h6" sx={{ fontSize: '1rem', fontWeight: 800, mb: 0 }}>
                  Conectify Call
                </GradientText>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: { xs: 'none', sm: 'block' } }}>
                  Room: {currentRoomId}
                </Typography>
              </Box>
            </Stack>

            {/* Center: Secure Room Badge */}
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{
                background: "rgba(16, 185, 129, 0.08)",
                border: "1px solid rgba(16, 185, 129, 0.2)",
                px: 2,
                py: 0.6,
                borderRadius: "100px",
                display: { xs: "none", sm: "flex" }
              }}
            >
              <SecurityIcon sx={{ color: "#10b981", fontSize: 16 }} />
              <Typography variant="caption" sx={{ color: "#34d399", fontWeight: 700, letterSpacing: 0.5 }}>
                SECURED END-TO-END
              </Typography>
            </Stack>

            {/* Right: Live stats & indicators */}
            <Stack direction="row" alignItems="center" spacing={2.5}>
              {/* Participant counter */}
              <Stack direction="row" alignItems="center" spacing={0.8} sx={{ background: 'rgba(255,255,255,0.04)', px: 1.8, py: 0.6, borderRadius: '100px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <PeopleIcon sx={{ fontSize: 16, color: '#a78bfa' }} />
                <Typography variant="caption" sx={{ color: 'white', fontWeight: 700 }}>
                  {videos.length + 1}
                </Typography>
              </Stack>

              {/* Real-time Clock */}
              <Typography
                variant="body2"
                sx={{
                  color: "text.primary",
                  fontWeight: 600,
                  fontFamily: "monospace",
                  background: 'rgba(255,255,255,0.03)',
                  px: 1.5,
                  py: 0.6,
                  borderRadius: '100px',
                  display: { xs: 'none', md: 'block' }
                }}
              >
                {currentTime}
              </Typography>
            </Stack>
          </Box>

          {/* Main Call Workspace */}
          <Box
            sx={{
              flex: 1,
              position: "relative",
              p: { xs: 2, md: 4 },
              pt: { xs: 3, md: 4 },
              pb: { xs: 14, md: 12 }, // extra padding for bottom control bar
              overflowY: "auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {videos.length === 0 ? (
              /* SINGLE USER: CINEMATIC WORKSPACE WITH ROOM LOBBY INFO PANEL */
              <Box sx={{ width: "100%", maxWidth: 1100, mx: "auto" }}>
                <Grid container spacing={4} alignItems="center">
                  
                  {/* Left Column: Local Video Frame */}
                  <Grid item xs={12} md={7.5}>
                    <Box
                      sx={{
                        position: "relative",
                        width: "100%",
                        aspectRatio: "16/9",
                        borderRadius: "24px",
                        overflow: "hidden",
                        border: "1px solid rgba(255,255,255,0.08)",
                        background: "linear-gradient(135deg, #090d16 0%, #0c1220 100%)",
                        boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
                        transition: "all 0.3s ease",
                        "&:hover": {
                          borderColor: "rgba(124,58,237,0.3)",
                        },
                      }}
                    >
                      {video ? (
                        <video
                          ref={localVideoref}
                          autoPlay
                          muted
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        /* GORGEOUS PULSING AVATAR FALLBACK IF CAMERA DISABLED */
                        <Box
                          sx={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "linear-gradient(135deg, #080c16 0%, #0c1122 100%)",
                          }}
                        >
                          <Box sx={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Box 
                              sx={{ 
                                position: "absolute", 
                                width: 150, 
                                height: 150, 
                                borderRadius: "50%", 
                                border: "1px solid rgba(124,58,237,0.15)",
                                animation: "pulseGlow 2s infinite" 
                              }} 
                            />
                            <Box 
                              sx={{ 
                                position: "absolute", 
                                width: 200, 
                                height: 200, 
                                borderRadius: "50%", 
                                border: "1px dashed rgba(99,102,241,0.08)", 
                                animation: "pulseGlow 3s infinite" 
                              }} 
                            />
                            <Avatar
                              sx={{
                                width: 96,
                                height: 96,
                                background: "linear-gradient(135deg, #7C3AED 0%, #2563EB 100%)",
                                fontSize: "2.2rem",
                                fontWeight: 800,
                                zIndex: 1,
                                boxShadow: "0 8px 32px rgba(124,58,237,0.3)"
                              }}
                            >
                              {username ? username.charAt(0).toUpperCase() : "?"}
                            </Avatar>
                          </Box>
                          <Typography variant="body2" sx={{ color: "text.secondary", mt: 3, fontWeight: 500 }}>
                            Your camera is turned off
                          </Typography>
                        </Box>
                      )}

                      {/* Info Overlays */}
                      <Box
                        sx={{
                          position: "absolute",
                          bottom: 16,
                          left: 16,
                          background: "rgba(10, 15, 30, 0.65)",
                          backdropFilter: "blur(12px)",
                          px: 2,
                          py: 0.8,
                          borderRadius: "100px",
                          border: "1px solid rgba(255,255,255,0.08)",
                          zIndex: 5
                        }}
                      >
                        <Typography variant="body2" sx={{ color: "white", fontWeight: 600 }}>
                          {username} (You)
                        </Typography>
                      </Box>
                      
                      <Box sx={{ position: "absolute", bottom: 16, right: 16, zIndex: 5 }}>
                        {audio ? (
                          <Box sx={{ background: 'rgba(16,185,129,0.15)', p: 1, borderRadius: '50%', border: '1px solid rgba(16,185,129,0.3)' }}>
                            <MicIcon sx={{ color: "#34D399", fontSize: 18 }} />
                          </Box>
                        ) : (
                          <Box sx={{ background: 'rgba(239,68,68,0.15)', p: 1, borderRadius: '50%', border: '1px solid rgba(239,68,68,0.3)' }}>
                            <MicOffIcon sx={{ color: "#EF4444", fontSize: 18 }} />
                          </Box>
                        )}
                      </Box>

                      {/* Hand Raised Indicator – single user view */}
                      {raisedHands[socketIdRef.current] && (
                        <Box sx={{ position: "absolute", top: 14, left: "50%", transform: "translateX(-50%)", zIndex: 5, background: "rgba(251,191,36,0.18)", border: "1px solid rgba(251,191,36,0.5)", borderRadius: "100px", px: 2, py: 0.7, display: "flex", alignItems: "center", gap: 0.8, animation: "handPulse 1.6s ease-in-out infinite", whiteSpace: "nowrap" }}>
                          <Typography sx={{ fontSize: "1.1rem", lineHeight: 1 }}>✋</Typography>
                          <Typography variant="caption" sx={{ color: "#fbbf24", fontWeight: 800, fontSize: "0.76rem" }}>Hand Raised</Typography>
                        </Box>
                      )}
                    </Box>
                  </Grid>

                  {/* Right Column: Room Lobby Info Panel */}
                  <Grid item xs={12} md={4.5}>
                    <Box
                      sx={{
                        background: "rgba(255,255,255,0.01)",
                        border: "1px solid rgba(255,255,255,0.04)",
                        borderRadius: "24px",
                        p: 4,
                        backdropFilter: "blur(20px)",
                        color: "white",
                        boxShadow: "0 10px 30px rgba(0,0,0,0.3)"
                      }}
                    >
                      <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, letterSpacing: '-0.5px' }}>
                        Waiting for Others
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 4, lineHeight: 1.6 }}>
                        You're the first one here! Invite colleagues or friends using the link below to start sharing ideas.
                      </Typography>

                      <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mb: 3 }} />

                      {/* Invite Link copy box */}
                      <Stack spacing={2}>
                        <Typography variant="caption" sx={{ color: "#a78bfa", fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                          Invite Link
                        </Typography>
                        
                        <Box 
                          sx={{ 
                            background: 'rgba(255,255,255,0.03)', 
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '16px',
                            p: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 2
                          }}
                        >
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {window.location.href}
                          </Typography>
                          <IconButton onClick={copyMeetingLink} sx={{ color: '#a78bfa', background: 'rgba(124,58,237,0.1)', '&:hover': { background: 'rgba(124,58,237,0.2)' } }}>
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </Box>

                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 2 }}>
                          <InfoOutlinedIcon sx={{ color: '#60a5fa', fontSize: 18 }} />
                          <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.4 }}>
                            Encryption active. Audio, video, and screen-sharing flows are isolated and private.
                          </Typography>
                        </Stack>
                      </Stack>
                    </Box>
                  </Grid>

                </Grid>
              </Box>
            ) : (
              /* MULTIPLE USERS: BALANCED RESPONSIVE GRID */
              <Box
                sx={{
                  width: "100%",
                  maxWidth: 1200,
                  mx: "auto",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
                  gap: 3,
                }}
              >
                {/* Local Video */}
                <Box
                  sx={{
                    position: "relative",
                    aspectRatio: "16/9",
                    borderRadius: "24px",
                    overflow: "hidden",
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.02)",
                    boxShadow: "0 12px 36px rgba(0,0,0,0.5)",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      borderColor: "rgba(124,58,237,0.4)",
                      transform: "scale(1.01)"
                    },
                  }}
                >
                  {video ? (
                    <video
                      ref={localVideoref}
                      autoPlay
                      muted
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    /* Fallback Local */
                    <Box
                      sx={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "linear-gradient(135deg, #080c16 0%, #0c1122 100%)",
                      }}
                    >
                      <Box sx={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Box sx={{ position: "absolute", width: 110, height: 110, borderRadius: "50%", border: "1px solid rgba(124,58,237,0.15)", animation: "pulseGlow 2s infinite" }} />
                        <Avatar
                          sx={{
                            width: 72,
                            height: 72,
                            background: "linear-gradient(135deg, #7C3AED 0%, #2563EB 100%)",
                            fontSize: "1.8rem",
                            fontWeight: 800,
                            boxShadow: "0 8px 24px rgba(124,58,237,0.3)"
                          }}
                        >
                          {username ? username.charAt(0).toUpperCase() : "?"}
                        </Avatar>
                      </Box>
                    </Box>
                  )}

                  {/* Overlays */}
                  <Box
                    sx={{
                      position: "absolute",
                      bottom: 12,
                      left: 12,
                      background: "rgba(10, 15, 30, 0.65)",
                      backdropFilter: "blur(10px)",
                      px: 1.8,
                      py: 0.6,
                      borderRadius: "100px",
                      border: "1px solid rgba(255,255,255,0.08)",
                      zIndex: 5
                    }}
                  >
                    <Typography variant="caption" sx={{ color: "white", fontWeight: 700 }}>
                      {username} (You)
                    </Typography>
                  </Box>

                  <Box sx={{ position: "absolute", bottom: 12, right: 12, zIndex: 5 }}>
                    {audio ? (
                      <Box sx={{ background: 'rgba(16,185,129,0.15)', p: 0.8, borderRadius: '50%', border: '1px solid rgba(16,185,129,0.3)' }}>
                        <MicIcon sx={{ color: "#34D399", fontSize: 16 }} />
                      </Box>
                    ) : (
                      <Box sx={{ background: 'rgba(239,68,68,0.15)', p: 0.8, borderRadius: '50%', border: '1px solid rgba(239,68,68,0.3)' }}>
                        <MicOffIcon sx={{ color: "#EF4444", fontSize: 16 }} />
                      </Box>
                    )}
                  </Box>

                  {/* Hand Raised Indicator – local tile (multi-user) */}
                  {raisedHands[socketIdRef.current] && (
                    <Box sx={{ position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)", zIndex: 5, background: "rgba(251,191,36,0.18)", border: "1px solid rgba(251,191,36,0.5)", borderRadius: "100px", px: 1.5, py: 0.5, display: "flex", alignItems: "center", gap: 0.5, animation: "handPulse 1.6s ease-in-out infinite", whiteSpace: "nowrap" }}>
                      <Typography sx={{ fontSize: "0.9rem", lineHeight: 1 }}>✋</Typography>
                      <Typography variant="caption" sx={{ color: "#fbbf24", fontWeight: 800, fontSize: "0.66rem" }}>Raised</Typography>
                    </Box>
                  )}
                </Box>

                {/* Remote Videos */}
                {videos.map((vid) => (
                  <Box
                    key={vid.socketId}
                    sx={{
                      position: "relative",
                      aspectRatio: "16/9",
                      borderRadius: "24px",
                      overflow: "hidden",
                      border: "1px solid rgba(255,255,255,0.08)",
                      background: "rgba(255,255,255,0.02)",
                      boxShadow: "0 12px 36px rgba(0,0,0,0.5)",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        borderColor: "rgba(124,58,237,0.4)",
                        transform: "scale(1.01)"
                      },
                    }}
                  >
                    <video
                      data-socket={vid.socketId}
                      ref={(ref) => {
                        if (ref && vid.stream) {
                          ref.srcObject = vid.stream;
                        }
                      }}
                      autoPlay
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    
                    {/* Overlays */}
                    <Box
                      sx={{
                        position: "absolute",
                        bottom: 12,
                        left: 12,
                        background: "rgba(10, 15, 30, 0.65)",
                        backdropFilter: "blur(10px)",
                        px: 1.8,
                        py: 0.6,
                        borderRadius: "100px",
                        border: "1px solid rgba(255,255,255,0.08)",
                        zIndex: 5
                      }}
                    >
                      <Typography variant="caption" sx={{ color: "white", fontWeight: 700 }}>
                        Participant
                      </Typography>
                    </Box>

                    {/* Hand Raised Indicator – remote participant tile */}
                    {raisedHands[vid.socketId] && (
                      <Box sx={{ position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)", zIndex: 5, background: "rgba(251,191,36,0.18)", border: "1px solid rgba(251,191,36,0.5)", borderRadius: "100px", px: 1.5, py: 0.5, display: "flex", alignItems: "center", gap: 0.5, animation: "handPulse 1.6s ease-in-out infinite", whiteSpace: "nowrap" }}>
                        <Typography sx={{ fontSize: "0.9rem", lineHeight: 1 }}>✋</Typography>
                        <Typography variant="caption" sx={{ color: "#fbbf24", fontWeight: 800, fontSize: "0.66rem" }}>{raisedHands[vid.socketId]}</Typography>
                      </Box>
                    )}
                  </Box>
                ))}
              </Box>
            )}
          </Box>

          {/* Re-engineered Bottom Control Bar */}
          <Box
            sx={{
              position: "fixed",
              bottom: { xs: 20, md: 30 },
              left: "50%",
              transform: "translateX(-50%)",
              background: "rgba(10, 15, 30, 0.75)",
              backdropFilter: "blur(30px)",
              WebkitBackdropFilter: "blur(30px)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "30px",
              px: { xs: 2, sm: 3.5 },
              py: 1.8,
              display: "flex",
              gap: { xs: 1.5, sm: 2.2 },
              alignItems: "center",
              boxShadow: "0 24px 60px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.05)",
              zIndex: 20,
              transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
              "&:hover": {
                background: "rgba(10, 15, 30, 0.85)",
                borderColor: "rgba(124,58,237,0.25)"
              }
            }}
          >
            {/* Audio Toggle (Microphone) */}
            <Tooltip title={audio ? "Mute Microphone" : "Unmute Microphone"}>
              <IconButton
                onClick={handleAudio}
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: audio ? "rgba(124,58,237,0.12)" : "rgba(239,68,68,0.12)",
                  border: `1px solid ${audio ? "rgba(124,58,237,0.3)" : "rgba(239,68,68,0.3)"}`,
                  color: audio ? "#a78bfa" : "#ef4444",
                  boxShadow: audio ? "0 0 15px rgba(124,58,237,0.15)" : "0 0 15px rgba(239,68,68,0.15)",
                  "&:hover": {
                    background: audio ? "rgba(124,58,237,0.22)" : "rgba(239,68,68,0.22)",
                    transform: "scale(1.1)",
                  },
                  transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                {audio ? <MicIcon /> : <MicOffIcon />}
              </IconButton>
            </Tooltip>

            {/* Video Toggle (Camera) */}
            <Tooltip title={video ? "Disable Camera" : "Enable Camera"}>
              <IconButton
                onClick={handleVideo}
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: video ? "rgba(124,58,237,0.12)" : "rgba(239,68,68,0.12)",
                  border: `1px solid ${video ? "rgba(124,58,237,0.3)" : "rgba(239,68,68,0.3)"}`,
                  color: video ? "#a78bfa" : "#ef4444",
                  boxShadow: video ? "0 0 15px rgba(124,58,237,0.15)" : "0 0 15px rgba(239,68,68,0.15)",
                  "&:hover": {
                    background: video ? "rgba(124,58,237,0.22)" : "rgba(239,68,68,0.22)",
                    transform: "scale(1.1)",
                  },
                  transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                {video ? <VideocamIcon /> : <VideocamOffIcon />}
              </IconButton>
            </Tooltip>

            {/* Screen Share Control */}
            {screenAvailable && (
              <Tooltip title={screen ? "Stop Sharing Screen" : "Share Screen"}>
                <IconButton
                  onClick={handleScreen}
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: screen ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${screen ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.08)"}`,
                    color: screen ? "#34d399" : "white",
                    boxShadow: screen ? "0 0 15px rgba(16,185,129,0.2)" : "none",
                    "&:hover": {
                      background: screen ? "rgba(16,185,129,0.22)" : "rgba(255,255,255,0.1)",
                      transform: "scale(1.1)",
                    },
                    transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                >
                  {/* Corrected Screen Share logic: Show stop icon when screen sharing is active */}
                  {screen ? <StopScreenShareIcon /> : <ScreenShareIcon />}
                </IconButton>
              </Tooltip>
            )}

            {/* Raise Hand */}
            <Tooltip title={handRaised ? "Lower Hand" : "Raise Hand"}>
              <IconButton
                onClick={toggleRaiseHand}
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: handRaised ? "rgba(251,191,36,0.18)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${handRaised ? "rgba(251,191,36,0.5)" : "rgba(255,255,255,0.08)"}`,
                  color: handRaised ? "#fbbf24" : "white",
                  boxShadow: handRaised ? "0 0 20px rgba(251,191,36,0.35)" : "none",
                  "&:hover": {
                    background: handRaised ? "rgba(251,191,36,0.28)" : "rgba(255,255,255,0.1)",
                    transform: "scale(1.1)",
                  },
                  transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                <PanToolIcon />
              </IconButton>
            </Tooltip>

            {/* Emoji Reactions */}
            <Tooltip title="Send Reaction">
              <IconButton
                onClick={() => setShowEmojiPicker((v) => !v)}
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: showEmojiPicker ? "rgba(124,58,237,0.18)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${showEmojiPicker ? "rgba(124,58,237,0.35)" : "rgba(255,255,255,0.08)"}`,
                  color: showEmojiPicker ? "#a78bfa" : "white",
                  boxShadow: showEmojiPicker ? "0 0 18px rgba(124,58,237,0.3)" : "none",
                  "&:hover": {
                    background: showEmojiPicker ? "rgba(124,58,237,0.28)" : "rgba(255,255,255,0.1)",
                    transform: "scale(1.1)",
                  },
                  transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                <EmojiEmotionsIcon />
              </IconButton>
            </Tooltip>

            {/* Copy Meeting Invite Link */}
            <Tooltip title="Copy Invite Link">
              <IconButton
                onClick={copyMeetingLink}
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "white",
                  "&:hover": {
                    background: "rgba(255,255,255,0.1)",
                    transform: "scale(1.1)",
                  },
                  transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                <ContentCopyIcon />
              </IconButton>
            </Tooltip>

            {/* Chat Drawer Toggle */}
            <Tooltip title="Open Chat">
              <Badge badgeContent={newMessages} color="error">
                <IconButton
                  onClick={() => {
                    if (!showModal) setNewMessages(0);
                    setModal(!showModal);
                  }}
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: showModal ? "rgba(124,58,237,0.12)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${showModal ? "rgba(124,58,237,0.3)" : "rgba(255,255,255,0.08)"}`,
                    color: showModal ? "#a78bfa" : "white",
                    boxShadow: showModal ? "0 0 15px rgba(124,58,237,0.15)" : "none",
                    "&:hover": {
                      background: showModal ? "rgba(124,58,237,0.22)" : "rgba(255,255,255,0.1)",
                      transform: "scale(1.1)",
                    },
                    transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                >
                  <ChatIcon />
                </IconButton>
              </Badge>
            </Tooltip>

            <Divider
              orientation="vertical"
              sx={{
                borderColor: "rgba(255,255,255,0.08)",
                height: 28,
                mx: 0.5,
              }}
            />

            {/* End Call Button */}
            <Tooltip title="End Meeting">
              <Button
                onClick={handleEndCall}
                sx={{
                  background: "linear-gradient(135deg, #DC2626, #991B1B)",
                  boxShadow: "0 0 20px rgba(220,38,38,0.3)",
                  borderRadius: "100px",
                  px: 3.5,
                  py: 1.2,
                  minWidth: "auto",
                  color: "white",
                  "&:hover": {
                    boxShadow: "0 0 32px rgba(220,38,38,0.55)",
                    transform: "scale(1.05)",
                    background: "linear-gradient(135deg, #EF4444, #B91C1C)",
                  },
                  transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                <CallEndIcon sx={{ mr: { xs: 0, sm: 1.2 }, fontSize: 20 }} />
                <Typography
                  sx={{ display: { xs: "none", sm: "block" }, fontWeight: 700, letterSpacing: 0.5, fontSize: '0.9rem' }}
                >
                  End Call
                </Typography>
              </Button>
            </Tooltip>
          </Box>

          {/* Floating Emoji Reactions Overlay */}
          {floatingEmojis.map((fe) => (
            <Box
              key={fe.id}
              sx={{
                position: "fixed",
                bottom: "130px",
                left: `${fe.x}%`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 0.3,
                animation: "floatUpEmoji 3s ease-out forwards",
                pointerEvents: "none",
                zIndex: 60,
              }}
            >
              <Typography sx={{ fontSize: "2.6rem", lineHeight: 1, filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.6))" }}>
                {fe.emoji}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "rgba(255,255,255,0.9)",
                  fontWeight: 700,
                  fontSize: "0.62rem",
                  background: "rgba(0,0,0,0.45)",
                  px: 0.9,
                  py: 0.2,
                  borderRadius: "100px",
                  textShadow: "0 1px 3px rgba(0,0,0,0.8)",
                  whiteSpace: "nowrap",
                }}
              >
                {fe.sender}
              </Typography>
            </Box>
          ))}

          {/* Emoji Picker Panel */}
          {showEmojiPicker && (
            <>
              {/* Invisible backdrop — click outside to close */}
              <Box
                onClick={() => setShowEmojiPicker(false)}
                sx={{ position: "fixed", inset: 0, zIndex: 24 }}
              />
              <Box
                sx={{
                  position: "fixed",
                  bottom: { xs: 88, md: 98 },
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "rgba(8, 12, 24, 0.96)",
                  backdropFilter: "blur(24px)",
                  WebkitBackdropFilter: "blur(24px)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "22px",
                  p: 1.5,
                  display: "flex",
                  gap: 0.6,
                  zIndex: 25,
                  boxShadow: "0 -8px 40px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.06)",
                  animation: "fadeInUp 0.18s ease both",
                }}
              >
                {["👍", "❤️", "😂", "🎉", "😮", "👏", "🔥", "🤔"].map((emoji) => (
                  <IconButton
                    key={emoji}
                    onClick={() => sendEmojiReaction(emoji)}
                    sx={{
                      width: 50,
                      height: 50,
                      borderRadius: "14px",
                      fontSize: "1.65rem",
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      "&:hover": {
                        background: "rgba(124,58,237,0.18)",
                        border: "1px solid rgba(124,58,237,0.35)",
                        transform: "scale(1.28) translateY(-5px)",
                      },
                      transition: "all 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
                    }}
                  >
                    {emoji}
                  </IconButton>
                ))}
              </Box>
            </>
          )}

          {/* Chat Side Drawer */}
          <Drawer
            anchor="right"
            open={showModal}
            onClose={closeChat}
            PaperProps={{
              sx: {
                width: { xs: "100%", sm: 360 },
                background: "rgba(8,12,24,0.95)",
                backdropFilter: "blur(30px)",
                borderLeft: "1px solid rgba(255,255,255,0.06)",
                color: "white",
                boxShadow: "-10px 0 40px rgba(0,0,0,0.5)"
              },
            }}
          >
            <Stack sx={{ height: "100%" }}>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ p: 2, borderBottom: "1px solid rgba(255,255,255,0.06)" }}
              >
                <Stack direction="row" spacing={1} sx={{ background: 'rgba(255,255,255,0.02)', p: 0.5, borderRadius: '100px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <Button
                    size="small"
                    onClick={() => setAiActive(false)}
                    sx={{
                      borderRadius: '100px',
                      textTransform: 'none',
                      fontWeight: 700,
                      px: 2,
                      py: 0.5,
                      color: !aiActive ? 'white' : 'text.secondary',
                      background: !aiActive ? 'linear-gradient(135deg, #7C3AED, #3B82F6)' : 'transparent',
                      '&:hover': {
                        background: !aiActive ? 'linear-gradient(135deg, #7C3AED, #3B82F6)' : 'rgba(255,255,255,0.05)',
                      }
                    }}
                  >
                    Chat
                  </Button>
                  <Button
                    size="small"
                    onClick={() => setAiActive(true)}
                    startIcon={<SmartToyIcon sx={{ fontSize: '14px !important' }} />}
                    sx={{
                      borderRadius: '100px',
                      textTransform: 'none',
                      fontWeight: 700,
                      px: 2,
                      py: 0.5,
                      color: aiActive ? 'white' : 'text.secondary',
                      background: aiActive ? 'linear-gradient(135deg, #7C3AED, #3B82F6)' : 'transparent',
                      '&:hover': {
                        background: aiActive ? 'linear-gradient(135deg, #7C3AED, #3B82F6)' : 'rgba(255,255,255,0.05)',
                      }
                    }}
                  >
                    AI Assistant
                  </Button>
                </Stack>
                <IconButton onClick={closeChat} sx={{ color: "text.secondary", "&:hover": { color: "white" } }}>
                  <CloseIcon />
                </IconButton>
              </Stack>

              {/* Chat View vs AI Assistant View */}
              {!aiActive ? (
                <>
                  <Box sx={{ flex: 1, overflowY: "auto", p: 2.5 }}>
                    {messages.length !== 0 ? (
                      messages.map((item, index) => {
                        const isOwn = item.sender === username;
                        const isEditing = editingIndex === index;
                        return (
                          <Box
                            key={index}
                            sx={{
                              mb: 2.5,
                              display: "flex",
                              flexDirection: "column",
                              alignItems: isOwn ? "flex-end" : "flex-start",
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                color: isOwn ? "#A78BFA" : "#60A5FA",
                                fontWeight: 700,
                                mb: 0.6,
                                fontSize: '0.75rem'
                              }}
                            >
                              {item.sender}
                            </Typography>
                            
                            {isEditing ? (
                              <Box
                                sx={{
                                  background: "rgba(124,58,237,0.15)",
                                  border: "1px solid rgba(124,58,237,0.25)",
                                  borderRadius: "16px 4px 16px 16px",
                                  p: 1.5,
                                  width: "85%",
                                  boxShadow: "0 4px 16px rgba(0,0,0,0.15)"
                                }}
                              >
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ width: '100%' }}>
                                  <TextField
                                    value={editText}
                                    onChange={(e) => setEditText(e.target.value)}
                                    size="small"
                                    variant="standard"
                                    fullWidth
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' && editText.trim()) {
                                        editMessage(index, editText);
                                        setEditingIndex(null);
                                      } else if (e.key === 'Escape') {
                                        setEditingIndex(null);
                                      }
                                    }}
                                    sx={{
                                      input: { color: 'white', fontSize: '0.875rem' },
                                      "& .MuiInput-underline:before": { borderBottomColor: "rgba(255,255,255,0.2)" },
                                      "& .MuiInput-underline:hover:before": { borderBottomColor: "rgba(255,255,255,0.4)" },
                                      "& .MuiInput-underline:after": { borderBottomColor: "#A78BFA" }
                                    }}
                                  />
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      if (editText.trim()) {
                                        editMessage(index, editText);
                                        setEditingIndex(null);
                                      }
                                    }}
                                    sx={{ color: '#34d399', p: 0.5 }}
                                  >
                                    <CheckIcon sx={{ fontSize: 16 }} />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    onClick={() => setEditingIndex(null)}
                                    sx={{ color: '#ef4444', p: 0.5 }}
                                  >
                                    <CloseIcon sx={{ fontSize: 16 }} />
                                  </IconButton>
                                </Stack>
                              </Box>
                            ) : (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexDirection: isOwn ? 'row-reverse' : 'row', width: '100%', justifyContent: isOwn ? 'flex-end' : 'flex-start' }}>
                                <Box
                                  sx={{
                                    background: isOwn
                                      ? "rgba(124,58,237,0.15)"
                                      : "rgba(255,255,255,0.04)",
                                    border: isOwn
                                      ? "1px solid rgba(124,58,237,0.25)"
                                      : "1px solid rgba(255,255,255,0.04)",
                                    borderRadius: isOwn ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
                                    p: 2,
                                    maxWidth: "85%",
                                    boxShadow: "0 4px 16px rgba(0,0,0,0.15)"
                                  }}
                                >
                                  <Typography variant="body2" sx={{ lineHeight: 1.5, wordBreak: 'break-word' }}>
                                    {item.data}
                                  </Typography>
                                </Box>

                                {isOwn && (
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      setEditingIndex(index);
                                      setEditText(item.data);
                                    }}
                                    sx={{
                                      opacity: 0.3,
                                      color: 'white',
                                      '&:hover': { opacity: 1, background: 'rgba(255,255,255,0.05)' },
                                      transition: 'opacity 0.2s',
                                      p: 0.5
                                    }}
                                  >
                                    <EditIcon sx={{ fontSize: 14 }} />
                                  </IconButton>
                                )}
                              </Box>
                            )}
                          </Box>
                        );
                      })
                    ) : (
                      <Stack alignItems="center" justifyContent="center" sx={{ height: '70%' }} spacing={1.5}>
                        <Avatar sx={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', width: 56, height: 56 }}>
                          <ChatIcon sx={{ color: 'text.secondary', fontSize: 24 }} />
                        </Avatar>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          textAlign="center"
                          sx={{ fontWeight: 500 }}
                        >
                          No messages shared yet
                        </Typography>
                      </Stack>
                    )}
                  </Box>

                  <Box
                    sx={{ p: 2.5, borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(5,8,16,0.5)" }}
                  >
                    <Stack direction="row" spacing={1.5}>
                      <TextField
                        value={message}
                        onChange={handleMessage}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && message.trim()) {
                            sendMessage();
                          }
                        }}
                        placeholder="Type a secure message..."
                        variant="outlined"
                        size="small"
                        fullWidth
                        sx={{
                          input: { color: "white" },
                          "& .MuiOutlinedInput-root": {
                            background: "rgba(255,255,255,0.03)",
                            borderRadius: "14px",
                            "& fieldset": {
                              borderColor: "rgba(255,255,255,0.06)",
                            },
                            "&:hover fieldset": {
                              borderColor: "rgba(255,255,255,0.12)",
                            },
                            "&.Mui-focused fieldset": {
                              borderColor: "#7C3AED",
                            },
                          },
                        }}
                      />
                      <IconButton
                        onClick={() => {
                          if (message.trim()) sendMessage();
                        }}
                        sx={{
                          color: "#A78BFA",
                          background: "rgba(124,58,237,0.12)",
                          border: "1px solid rgba(124,58,237,0.25)",
                          "&:hover": {
                            background: "rgba(124,58,237,0.2)",
                            transform: "scale(1.05)"
                          },
                          transition: "all 0.2s ease"
                        }}
                      >
                        <SendIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Box>
                </>
              ) : (
                <>
                  {/* AI Assistant messages body */}
                  <Box sx={{ flex: 1, overflowY: "auto", p: 2.5, display: "flex", flexDirection: "column", gap: 2 }}>
                    {aiHistory.map((item, index) => {
                      const isOwn = item.sender === 'User';
                      return (
                        <Box
                          key={index}
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: isOwn ? "flex-end" : "flex-start",
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              color: isOwn ? "#A78BFA" : "#fbbf24",
                              fontWeight: 700,
                              mb: 0.6,
                              fontSize: '0.75rem'
                            }}
                          >
                            {isOwn ? 'You' : 'Conectify AI'}
                          </Typography>
                          <Box
                            sx={{
                              background: isOwn
                                ? "rgba(124,58,237,0.15)"
                                : "rgba(251,191,36,0.08)",
                              border: isOwn
                                ? "1px solid rgba(124,58,237,0.25)"
                                : "1px solid rgba(251,191,36,0.2)",
                              borderRadius: isOwn ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
                              p: 2,
                              maxWidth: "85%",
                              boxShadow: "0 4px 16px rgba(0,0,0,0.15)"
                            }}
                          >
                            <Typography variant="body2" sx={{ lineHeight: 1.5, wordBreak: 'break-word', whiteSpace: 'pre-line' }}>
                              {item.text}
                            </Typography>
                          </Box>
                        </Box>
                      );
                    })}

                    {aiMeetLoading && (
                      <Box sx={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CircularProgress size={14} sx={{ color: '#fbbf24' }} />
                        <Typography variant="caption" color="text.secondary">AI is typing...</Typography>
                      </Box>
                    )}
                  </Box>

                  {/* AI Input */}
                  <Box
                    sx={{ p: 2.5, borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(5,8,16,0.5)" }}
                  >
                    <Stack direction="row" spacing={1.5}>
                      <TextField
                        value={aiQuery}
                        onChange={(e) => setAiQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && aiQuery.trim() && !aiMeetLoading) {
                            handleSendAiMessage();
                          }
                        }}
                        placeholder="Ask AI anything..."
                        variant="outlined"
                        size="small"
                        fullWidth
                        sx={{
                          input: { color: "white" },
                          "& .MuiOutlinedInput-root": {
                            background: "rgba(255,255,255,0.03)",
                            borderRadius: "14px",
                            "& fieldset": {
                              borderColor: "rgba(255,255,255,0.06)",
                            },
                            "&:hover fieldset": {
                              borderColor: "rgba(255,255,255,0.12)",
                            },
                            "&.Mui-focused fieldset": {
                              borderColor: "#fbbf24",
                            },
                          },
                        }}
                      />
                      <IconButton
                        onClick={handleSendAiMessage}
                        disabled={aiMeetLoading || !aiQuery.trim()}
                        sx={{
                          color: "#fbbf24",
                          background: "rgba(251,191,36,0.1)",
                          border: "1px solid rgba(251,191,36,0.2)",
                          "&:hover": {
                            background: "rgba(251,191,36,0.18)",
                            transform: "scale(1.05)"
                          },
                          transition: "all 0.2s ease"
                        }}
                      >
                        <SendIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Box>
                </>
              )}
            </Stack>
          </Drawer>

          <Snackbar 
            open={snackbarOpen} 
            autoHideDuration={3000} 
            onClose={() => setSnackbarOpen(false)} 
            message="Meeting link copied to clipboard!" 
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            ContentProps={{
              sx: { background: 'rgba(124,58,237,0.9)', backdropFilter: 'blur(10px)', fontWeight: 600, borderRadius: '12px' }
            }}
          />

          {/* Hand Raised Notification — shown to other participants */}
          <Snackbar
            open={!!handSnackbar}
            autoHideDuration={4500}
            onClose={() => setHandSnackbar("")}
            message={handSnackbar}
            anchorOrigin={{ vertical: "top", horizontal: "center" }}
            ContentProps={{
              sx: {
                background: "rgba(251,191,36,0.92)",
                color: "#1a1000",
                backdropFilter: "blur(12px)",
                fontWeight: 800,
                borderRadius: "14px",
                boxShadow: "0 8px 32px rgba(251,191,36,0.35)",
                letterSpacing: 0.3,
              },
            }}
          />

          {/* Join / Leave Notifications */}
          <Snackbar
            open={joinLeaveToast.open}
            autoHideDuration={4000}
            onClose={() => setJoinLeaveToast((prev) => ({ ...prev, open: false }))}
            anchorOrigin={{ vertical: "top", horizontal: "right" }}
            ContentProps={{
              sx: {
                background: joinLeaveToast.isJoin 
                  ? "linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(5, 150, 105, 0.95))"
                  : "linear-gradient(135deg, rgba(239, 68, 68, 0.95), rgba(220, 38, 38, 0.95))",
                color: "white",
                backdropFilter: "blur(12px)",
                fontWeight: 700,
                borderRadius: "14px",
                border: joinLeaveToast.isJoin ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(239, 68, 68, 0.3)",
                boxShadow: joinLeaveToast.isJoin 
                  ? "0 10px 30px rgba(16, 185, 129, 0.35)" 
                  : "0 10px 30px rgba(239, 68, 68, 0.35)",
                fontSize: "0.95rem",
                px: 2,
                py: 0.5,
              },
            }}
            message={joinLeaveToast.message}
          />
        </Box>
      )}
    </Box>
  );
}
