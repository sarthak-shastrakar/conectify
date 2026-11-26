import React, { useEffect, useRef, useState, useContext, useCallback, memo } from "react";
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

// ─── Peer connections map (socketId → RTCPeerConnection) ───────────────────────
const peerConnections = {};

// ─── ICE candidate queues per peer (socketId → RTCIceCandidate[]) ──────────────
const iceCandidateQueues = {};

const peerConfigConnections = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

// ─── Optimized media constraints for multi-party calls ─────────────────────────
const MEDIA_CONSTRAINTS = {
  video: {
    width: { ideal: 640, max: 1280 },
    height: { ideal: 480, max: 720 },
    frameRate: { ideal: 24, max: 30 },
  },
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
};

// ─── Isolated Clock Component — prevents full page re-render every second ──────
const LiveClock = memo(() => {
  const [time, setTime] = useState(() => new Date().toLocaleTimeString());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <Typography
      variant="body2"
      sx={{
        color: "text.primary",
        fontWeight: 600,
        fontFamily: "monospace",
        background: "rgba(255,255,255,0.03)",
        px: 1.5,
        py: 0.6,
        borderRadius: "100px",
        display: { xs: "none", md: "block" },
      }}
    >
      {time}
    </Typography>
  );
});

// ─── Isolated Remote Video Tile — only re-renders when its own stream changes ──
const RemoteVideoTile = memo(({ vid, raisedHands }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && vid.stream) {
      videoRef.current.srcObject = vid.stream;
    }
  }, [vid.stream]);

  return (
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
          transform: "scale(1.01)",
        },
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />

      {/* Name Overlay */}
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
          zIndex: 5,
        }}
      >
        <Typography variant="caption" sx={{ color: "white", fontWeight: 700 }}>
          Participant
        </Typography>
      </Box>

      {/* Hand Raised Indicator */}
      {raisedHands[vid.socketId] && (
        <Box
          sx={{
            position: "absolute",
            top: 10,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 5,
            background: "rgba(251,191,36,0.18)",
            border: "1px solid rgba(251,191,36,0.5)",
            borderRadius: "100px",
            px: 1.5,
            py: 0.5,
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            animation: "handPulse 1.6s ease-in-out infinite",
            whiteSpace: "nowrap",
          }}
        >
          <Typography sx={{ fontSize: "0.9rem", lineHeight: 1 }}>✋</Typography>
          <Typography variant="caption" sx={{ color: "#fbbf24", fontWeight: 800, fontSize: "0.66rem" }}>
            {raisedHands[vid.socketId]}
          </Typography>
        </Box>
      )}
    </Box>
  );
});

export default function VideoMeetComponent() {
  const socketRef = useRef();
  const socketIdRef = useRef();
  const localVideoref = useRef();
  const chatEndRef = useRef(null);
  const { userData, isLoading } = useContext(AuthContext);

  const [videoAvailable, setVideoAvailable] = useState(true);
  const [audioAvailable, setAudioAvailable] = useState(true);
  const [video, setVideo] = useState(false);
  const [audio, setAudio] = useState(false);
  const [screen, setScreen] = useState(false);
  const [showModal, setModal] = useState(false);
  const [screenAvailable, setScreenAvailable] = useState(false);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [newMessages, setNewMessages] = useState(0);
  const [askForUsername, setAskForUsername] = useState(true);
  const [username, setUsername] = useState("");

  useEffect(() => {
    if (!isLoading && userData) {
      setUsername(userData.name || userData.username || "");
    }
  }, [isLoading, userData]);

  const [videos, setVideos] = useState([]);

  // ─── Callback ref & effect to keep local video element permanently bound to stream ──
  const setLocalVideoRef = useCallback((el) => {
    localVideoref.current = el;
    if (el && window.localStream) {
      if (el.srcObject !== window.localStream) {
        el.srcObject = window.localStream;
      }
    }
  }, []);

  useEffect(() => {
    if (localVideoref.current && window.localStream) {
      if (localVideoref.current.srcObject !== window.localStream) {
        localVideoref.current.srcObject = window.localStream;
      }
    }
  }, [askForUsername, videos.length, video, screen]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editText, setEditText] = useState("");

  // Emoji reactions
  const [floatingEmojis, setFloatingEmojis] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Raise hand
  const [handRaised, setHandRaised] = useState(false);
  const [raisedHands, setRaisedHands] = useState({});
  const [handSnackbar, setHandSnackbar] = useState("");

  // Join/Leave Notifications
  const [joinLeaveToast, setJoinLeaveToast] = useState({ open: false, message: "", isJoin: true });

  // AI Assistant Chatbot state inside VideoMeet
  const [aiActive, setAiActive] = useState(false);
  const [aiQuery, setAiQuery] = useState("");
  const [aiHistory, setAiHistory] = useState([
    { sender: "AI", text: "Hello! I am Conectify AI, your meeting assistant. Ask me anything! 🤖" },
  ]);
  const [aiMeetLoading, setAiMeetLoading] = useState(false);

  const handleSendAiMessage = async () => {
    if (!aiQuery.trim()) return;
    const userMsg = { sender: "User", text: aiQuery };
    setAiHistory((prev) => [...prev, userMsg]);
    const currentQuery = aiQuery;
    setAiQuery("");
    setAiMeetLoading(true);

    try {
      const res = await api.post(API_ROUTES.CHATBOT, {
        message: currentQuery,
        chatHistory: aiHistory,
      });
      setAiHistory((prev) => [...prev, { sender: "AI", text: res.data.reply }]);
    } catch (err) {
      console.error("AI chat failed inside meeting:", err);
      setAiHistory((prev) => [...prev, { sender: "AI", text: "Failed to connect. Please try again! ⚠️" }]);
    } finally {
      setAiMeetLoading(false);
    }
  };

  const copyMeetingLink = () => {
    const url = window.location.href;
    const code = url.substring(url.lastIndexOf("/") + 1);
    const inviteText = `Join my Conectify-Call video meeting!\n\nMeeting Code: ${code}\nMeeting Link: ${url}`;
    navigator.clipboard.writeText(inviteText);
    setSnackbarOpen(true);
  };

  useEffect(() => {
    getPermissions();
  }, []); // eslint-disable-line

  // ─── Get permissions and local preview ───────────────────────────────────────
  const getPermissions = async () => {
    try {
      let vAvail = false;
      let aAvail = false;

      try {
        await navigator.mediaDevices.getUserMedia({ video: true });
        vAvail = true;
      } catch {
        vAvail = false;
      }
      setVideoAvailable(vAvail);

      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        aAvail = true;
      } catch {
        aAvail = false;
      }
      setAudioAvailable(aAvail);

      setScreenAvailable(!!navigator.mediaDevices.getDisplayMedia);

      if (vAvail || aAvail) {
        const constraints = {};
        if (vAvail) constraints.video = MEDIA_CONSTRAINTS.video;
        if (aAvail) constraints.audio = MEDIA_CONSTRAINTS.audio;

        const userMediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        window.localStream = userMediaStream;
        if (localVideoref.current) {
          localVideoref.current.srcObject = userMediaStream;
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  // ─── Create a new RTCPeerConnection for a given peer socket ───────────────────
  const createPeer = useCallback(
    (peerId) => {
      // If a connection already exists and is healthy, reuse it
      if (
        peerConnections[peerId] &&
        peerConnections[peerId].connectionState !== "closed" &&
        peerConnections[peerId].connectionState !== "failed"
      ) {
        return peerConnections[peerId];
      }

      // Close and clean up stale connection if any
      if (peerConnections[peerId]) {
        peerConnections[peerId].close();
      }

      const pc = new RTCPeerConnection(peerConfigConnections);

      // ── Add all local tracks to new peer connection ──────────────────────────
      if (window.localStream) {
        window.localStream.getTracks().forEach((track) => {
          pc.addTrack(track, window.localStream);
        });
      }

      // ── ICE candidate handling ───────────────────────────────────────────────
      pc.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          socketRef.current.emit(
            "signal",
            peerId,
            JSON.stringify({ ice: event.candidate })
          );
        }
      };

      // ── Remote track received ────────────────────────────────────────────────
      pc.ontrack = (event) => {
        const stream = event.streams[0];
        if (!stream) return;

        setVideos((prev) => {
          const exists = prev.find((v) => v.socketId === peerId);
          if (exists) {
            return prev.map((v) =>
              v.socketId === peerId ? { ...v, stream } : v
            );
          }
          return [...prev, { socketId: peerId, stream }];
        });
      };

      // ── Connection state monitoring ──────────────────────────────────────────
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed") {
          console.warn(`Peer connection failed for ${peerId}, attempting restart`);
          pc.restartIce();
        }
      };

      peerConnections[peerId] = pc;
      iceCandidateQueues[peerId] = [];

      return pc;
    },
    []
  );

  // ─── Signal handler with ICE candidate queue ──────────────────────────────────
  const gotMessageFromServer = useCallback(
    async (fromId, message) => {
      if (fromId === socketIdRef.current) return;

      let signal;
      try {
        signal = JSON.parse(message);
      } catch {
        return;
      }

      const pc = peerConnections[fromId];
      if (!pc) return;

      if (signal.sdp) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));

          // Flush queued ICE candidates now that remote description is set
          if (iceCandidateQueues[fromId]) {
            for (const candidate of iceCandidateQueues[fromId]) {
              try {
                await pc.addIceCandidate(candidate);
              } catch (e) {
                console.error("Queued ICE candidate error:", e);
              }
            }
            iceCandidateQueues[fromId] = [];
          }

          if (signal.sdp.type === "offer") {
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socketRef.current.emit(
              "signal",
              fromId,
              JSON.stringify({ sdp: pc.localDescription })
            );
          }
        } catch (e) {
          console.error("SDP handling error:", e);
        }
      }

      if (signal.ice) {
        const candidate = new RTCIceCandidate(signal.ice);
        // Queue if remote description not ready
        if (!pc.remoteDescription) {
          if (!iceCandidateQueues[fromId]) iceCandidateQueues[fromId] = [];
          iceCandidateQueues[fromId].push(candidate);
        } else {
          try {
            await pc.addIceCandidate(candidate);
          } catch (e) {
            console.error("ICE candidate error:", e);
          }
        }
      }
    },
    []
  );

  // ─── Connect to socket server ─────────────────────────────────────────────────
  const connectToSocketServer = useCallback(() => {
    socketRef.current = io.connect(server_url, {
      secure: server_url.startsWith("https"),   // auto true on Render (HTTPS)
      transports: ["websocket", "polling"],      // polling as fallback for Render
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current.on("signal", gotMessageFromServer);

    socketRef.current.on("connect", () => {
      const userInfo = userData
        ? { username: userData.username, name: userData.name, avatar: userData.avatar }
        : { username, name: username, avatar: null };

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
        // Properly close and clean up peer connection
        if (peerConnections[id]) {
          peerConnections[id].close();
          delete peerConnections[id];
          delete iceCandidateQueues[id];
        }

        setVideos((prev) => prev.filter((v) => v.socketId !== id));
        setRaisedHands((prev) => {
          const updated = { ...prev };
          delete updated[id];
          return updated;
        });

        if (leavingUserName) {
          setJoinLeaveToast({
            open: true,
            message: `${leavingUserName} left the call 🚪`,
            isJoin: false,
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

      // ── user-joined: THE CRITICAL FIX ────────────────────────────────────────
      // Only create a peer connection for the NEW user, never overwrite existing ones
      socketRef.current.on("user-joined", async (id, clients, joiningUserName) => {
        if (joiningUserName) {
          setJoinLeaveToast({
            open: true,
            message: `${joiningUserName} joined the call 👋`,
            isJoin: true,
          });
        }

        // For each client in the room, create peer connection only if it doesn't exist
        for (const socketListId of clients) {
          if (socketListId === socketIdRef.current) continue; // skip self

          // Only create peer if we don't have a valid connection with this peer
          if (
            !peerConnections[socketListId] ||
            peerConnections[socketListId].connectionState === "closed" ||
            peerConnections[socketListId].connectionState === "failed"
          ) {
            createPeer(socketListId);
          }
        }

        // If WE are the one who just joined, create offers to all existing participants
        if (id === socketIdRef.current) {
          for (const peerId of Object.keys(peerConnections)) {
            if (peerId === socketIdRef.current) continue;
            try {
              const pc = peerConnections[peerId];
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              socketRef.current.emit(
                "signal",
                peerId,
                JSON.stringify({ sdp: pc.localDescription })
              );
            } catch (e) {
              console.error("Offer creation error:", e);
            }
          }
        }
      });
    });
  }, [gotMessageFromServer, createPeer, userData, username]);

  // ─── Start media and connect ──────────────────────────────────────────────────
  const getMedia = useCallback(() => {
    setVideo(videoAvailable);
    setAudio(audioAvailable);
    connectToSocketServer();
  }, [videoAvailable, audioAvailable, connectToSocketServer]);

  // ─── Toggle video track (no renegotiation needed) ────────────────────────────
  const handleVideo = useCallback(() => {
    if (window.localStream) {
      const videoTracks = window.localStream.getVideoTracks();
      if (videoTracks.length > 0) {
        const newState = !videoTracks[0].enabled;
        videoTracks.forEach((t) => (t.enabled = newState));
        setVideo(newState);
        return;
      }
    }
    setVideo((prev) => !prev);
  }, []);

  // ─── Toggle audio track (no renegotiation needed) ────────────────────────────
  const handleAudio = useCallback(() => {
    if (window.localStream) {
      const audioTracks = window.localStream.getAudioTracks();
      if (audioTracks.length > 0) {
        const newState = !audioTracks[0].enabled;
        audioTracks.forEach((t) => (t.enabled = newState));
        setAudio(newState);
        return;
      }
    }
    setAudio((prev) => !prev);
  }, []);

  // ─── Screen share ─────────────────────────────────────────────────────────────
  const handleScreen = useCallback(async () => {
    if (screen) {
      // Stop screen sharing — restore camera
      if (window.localStream) {
        window.localStream.getTracks().forEach((t) => t.stop());
      }
      setScreen(false);

      // Restart camera stream
      try {
        const camStream = await navigator.mediaDevices.getUserMedia({
          video: videoAvailable ? MEDIA_CONSTRAINTS.video : false,
          audio: audioAvailable ? MEDIA_CONSTRAINTS.audio : false,
        });
        window.localStream = camStream;
        if (localVideoref.current) localVideoref.current.srcObject = camStream;

        // Replace tracks in all peer connections
        for (const pc of Object.values(peerConnections)) {
          const senders = pc.getSenders();
          camStream.getTracks().forEach((track) => {
            const sender = senders.find((s) => s.track && s.track.kind === track.kind);
            if (sender) sender.replaceTrack(track);
          });
        }
      } catch (e) {
        console.error("Camera restart error:", e);
      }
    } else {
      // Start screen sharing
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });

        window.localStream = displayStream;
        if (localVideoref.current) localVideoref.current.srcObject = displayStream;
        setScreen(true);

        // Replace tracks in all peer connections
        for (const pc of Object.values(peerConnections)) {
          const senders = pc.getSenders();
          displayStream.getTracks().forEach((track) => {
            const sender = senders.find((s) => s.track && s.track.kind === track.kind);
            if (sender) {
              sender.replaceTrack(track);
            } else {
              pc.addTrack(track, displayStream);
            }
          });
        }

        // Auto-stop when user ends screen share via browser UI
        displayStream.getVideoTracks()[0].onended = () => {
          handleScreen();
        };
      } catch (e) {
        console.error("Screen share error:", e);
      }
    }
  }, [screen, videoAvailable, audioAvailable]); // eslint-disable-line

  // ─── End call cleanup ─────────────────────────────────────────────────────────
  const handleEndCall = useCallback(() => {
    try {
      if (window.localStream) {
        window.localStream.getTracks().forEach((t) => t.stop());
      }
    } catch (e) {}

    // Close all peer connections
    for (const id of Object.keys(peerConnections)) {
      peerConnections[id].close();
      delete peerConnections[id];
      delete iceCandidateQueues[id];
    }

    if (socketRef.current) socketRef.current.disconnect();
    window.location.href = "/home";
  }, []);

  const openChat = useCallback(() => {
    setModal(true);
    setNewMessages(0);
  }, []);

  const closeChat = useCallback(() => setModal(false), []);
  const handleMessage = useCallback((e) => setMessage(e.target.value), []);

  const addMessage = useCallback((data, sender, socketIdSender) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        sender,
        data,
        socketIdSender,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    if (socketIdSender !== socketIdRef.current) {
      setNewMessages((prev) => prev + 1);
    }
  }, []);

  useEffect(() => {
    if (showModal) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, aiHistory, showModal, aiActive]);

  const sendMessage = useCallback(() => {
    if (socketRef.current && message.trim()) {
      socketRef.current.emit("chat-message", message, username);
      setMessage("");
    }
  }, [message, username]);

  const editMessage = useCallback((index, newText) => {
    if (socketRef.current) {
      socketRef.current.emit("edit-chat-message", index, newText);
    }
  }, []);

  const addFloatingEmoji = useCallback((emoji, sender) => {
    const id = Date.now() + Math.random();
    const x = 12 + Math.random() * 70;
    setFloatingEmojis((prev) => [...prev, { id, emoji, x, sender }]);
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((e) => e.id !== id));
    }, 3000);
  }, []);

  const sendEmojiReaction = useCallback(
    (emoji) => {
      addFloatingEmoji(emoji, username);
      if (socketRef.current) {
        socketRef.current.emit("emoji-reaction", emoji, username);
      }
      setShowEmojiPicker(false);
    },
    [addFloatingEmoji, username]
  );

  const toggleRaiseHand = useCallback(() => {
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
  }, [handRaised, username]);

  const connect = useCallback(() => {
    setAskForUsername(false);
    getMedia();
  }, [getMedia]);

  // Pre-join lobby device preview control functions
  const toggleLobbyVideo = async () => {
    if (videoAvailable) {
      setVideoAvailable(false);
      try {
        if (localVideoref.current && localVideoref.current.srcObject) {
          localVideoref.current.srcObject.getVideoTracks().forEach((t) => t.stop());
        }
      } catch (e) {}
    } else {
      setVideoAvailable(true);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: MEDIA_CONSTRAINTS.video,
          audio: audioAvailable ? MEDIA_CONSTRAINTS.audio : false,
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
    setAudioAvailable((prev) => !prev);
  };

  const currentRoomId = window.location.pathname.split("/").pop();

  if (isLoading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#050810" }}>
        <CircularProgress sx={{ color: "#7C3AED" }} />
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
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50%       { opacity: 1;   transform: scale(1.06); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes drift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%       { transform: translate(30px, -20px) scale(1.03); }
          66%       { transform: translate(-20px, 15px) scale(0.97); }
        }
      `}</style>

      {/* Drifting Ambient Neon Glow Blobs */}
      <Box
        sx={{
          position: "absolute",
          top: "10%",
          left: "5%",
          width: { xs: 200, md: 450 },
          height: { xs: 200, md: 450 },
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 75%)",
          filter: "blur(60px)",
          animation: "drift 10s ease-in-out infinite",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          bottom: "10%",
          right: "5%",
          width: { xs: 250, md: 500 },
          height: { xs: 250, md: 500 },
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(37,99,235,0.08) 0%, transparent 75%)",
          filter: "blur(70px)",
          animation: "drift 12s ease-in-out 2s infinite reverse",
          zIndex: 0,
          pointerEvents: "none",
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
          <Box sx={{ position: "absolute", zIndex: 0, opacity: 0.35, pointerEvents: "none" }}>
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
            <GradientText variant="h4" sx={{ mb: 1, fontWeight: 800, letterSpacing: "-1px" }}>
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
                boxShadow: "0 12px 32px rgba(0,0,0,0.4)",
              }}
            >
              {videoAvailable ? (
                <video
                  ref={setLocalVideoRef}
                  autoPlay
                  muted
                  playsInline
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <Box
                  sx={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 1.5,
                  }}
                >
                  <Avatar sx={{ width: 68, height: 68, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "text.secondary" }}>
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
                  zIndex: 4,
                }}
              >
                <IconButton
                  onClick={toggleLobbyAudio}
                  sx={{
                    color: audioAvailable ? "#a78bfa" : "#ef4444",
                    background: audioAvailable ? "rgba(124,58,237,0.12)" : "rgba(239,68,68,0.12)",
                    border: `1px solid ${audioAvailable ? "rgba(124,58,237,0.2)" : "rgba(239,68,68,0.2)"}`,
                    "&:hover": { transform: "scale(1.1)", background: audioAvailable ? "rgba(124,58,237,0.2)" : "rgba(239,68,68,0.2)" },
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
                    "&:hover": { transform: "scale(1.1)", background: videoAvailable ? "rgba(124,58,237,0.2)" : "rgba(239,68,68,0.2)" },
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
                  },
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
                  fontSize: "1rem",
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
              <Typography sx={{ fontSize: "24px", color: "#a78bfa" }}>⬡</Typography>
              <Box>
                <GradientText variant="h6" sx={{ fontSize: "1rem", fontWeight: 800, mb: 0 }}>
                  Conectify Call
                </GradientText>
                <Typography variant="caption" sx={{ color: "text.secondary", display: { xs: "none", sm: "block" } }}>
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
                display: { xs: "none", sm: "flex" },
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
              <Stack
                direction="row"
                alignItems="center"
                spacing={0.8}
                sx={{ background: "rgba(255,255,255,0.04)", px: 1.8, py: 0.6, borderRadius: "100px", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <PeopleIcon sx={{ fontSize: 16, color: "#a78bfa" }} />
                <Typography variant="caption" sx={{ color: "white", fontWeight: 700 }}>
                  {videos.length + 1}
                </Typography>
              </Stack>

              {/* Isolated Real-time Clock — won't trigger full re-render */}
              <LiveClock />
            </Stack>
          </Box>

          {/* Main Call Workspace */}
          <Box
            sx={{
              flex: 1,
              position: "relative",
              p: { xs: 2, md: 4 },
              pt: { xs: 3, md: 4 },
              pb: { xs: 14, md: 12 },
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
                        "&:hover": { borderColor: "rgba(124,58,237,0.3)" },
                      }}
                    >
                      {video ? (
                        <video
                          ref={setLocalVideoRef}
                          autoPlay
                          muted
                          playsInline
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
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
                            <Box sx={{ position: "absolute", width: 150, height: 150, borderRadius: "50%", border: "1px solid rgba(124,58,237,0.15)", animation: "pulseGlow 2s infinite" }} />
                            <Box sx={{ position: "absolute", width: 200, height: 200, borderRadius: "50%", border: "1px dashed rgba(99,102,241,0.08)", animation: "pulseGlow 3s infinite" }} />
                            <Avatar
                              sx={{
                                width: 96,
                                height: 96,
                                background: "linear-gradient(135deg, #7C3AED 0%, #2563EB 100%)",
                                fontSize: "2.2rem",
                                fontWeight: 800,
                                zIndex: 1,
                                boxShadow: "0 8px 32px rgba(124,58,237,0.3)",
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
                          zIndex: 5,
                        }}
                      >
                        <Typography variant="body2" sx={{ color: "white", fontWeight: 600 }}>
                          {username} (You)
                        </Typography>
                      </Box>

                      <Box sx={{ position: "absolute", bottom: 16, right: 16, zIndex: 5 }}>
                        {audio ? (
                          <Box sx={{ background: "rgba(16,185,129,0.15)", p: 1, borderRadius: "50%", border: "1px solid rgba(16,185,129,0.3)" }}>
                            <MicIcon sx={{ color: "#34D399", fontSize: 18 }} />
                          </Box>
                        ) : (
                          <Box sx={{ background: "rgba(239,68,68,0.15)", p: 1, borderRadius: "50%", border: "1px solid rgba(239,68,68,0.3)" }}>
                            <MicOffIcon sx={{ color: "#EF4444", fontSize: 18 }} />
                          </Box>
                        )}
                      </Box>

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
                        boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
                      }}
                    >
                      <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, letterSpacing: "-0.5px" }}>
                        Waiting for Others
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 4, lineHeight: 1.6 }}>
                        You're the first one here! Invite colleagues or friends using the link below to start sharing ideas.
                      </Typography>

                      <Divider sx={{ borderColor: "rgba(255,255,255,0.06)", mb: 3 }} />

                      <Stack spacing={2}>
                        <Typography variant="caption" sx={{ color: "#a78bfa", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8 }}>
                          Invite Link
                        </Typography>

                        <Box
                          sx={{
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: "16px",
                            p: 2,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 2,
                          }}
                        >
                          <Typography variant="body2" sx={{ fontFamily: "monospace", color: "text.secondary", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {window.location.href}
                          </Typography>
                          <IconButton onClick={copyMeetingLink} sx={{ color: "#a78bfa", background: "rgba(124,58,237,0.1)", "&:hover": { background: "rgba(124,58,237,0.2)" } }}>
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </Box>

                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 2 }}>
                          <InfoOutlinedIcon sx={{ color: "#60a5fa", fontSize: 18 }} />
                          <Typography variant="caption" sx={{ color: "text.secondary", lineHeight: 1.4 }}>
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
                      transform: "scale(1.01)",
                    },
                  }}
                >
                  {video ? (
                    <video
                      ref={setLocalVideoRef}
                      autoPlay
                      muted
                      playsInline
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
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
                            boxShadow: "0 8px 24px rgba(124,58,237,0.3)",
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
                      zIndex: 5,
                    }}
                  >
                    <Typography variant="caption" sx={{ color: "white", fontWeight: 700 }}>
                      {username} (You)
                    </Typography>
                  </Box>

                  <Box sx={{ position: "absolute", bottom: 12, right: 12, zIndex: 5 }}>
                    {audio ? (
                      <Box sx={{ background: "rgba(16,185,129,0.15)", p: 0.8, borderRadius: "50%", border: "1px solid rgba(16,185,129,0.3)" }}>
                        <MicIcon sx={{ color: "#34D399", fontSize: 16 }} />
                      </Box>
                    ) : (
                      <Box sx={{ background: "rgba(239,68,68,0.15)", p: 0.8, borderRadius: "50%", border: "1px solid rgba(239,68,68,0.3)" }}>
                        <MicOffIcon sx={{ color: "#EF4444", fontSize: 16 }} />
                      </Box>
                    )}
                  </Box>

                  {raisedHands[socketIdRef.current] && (
                    <Box sx={{ position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)", zIndex: 5, background: "rgba(251,191,36,0.18)", border: "1px solid rgba(251,191,36,0.5)", borderRadius: "100px", px: 1.5, py: 0.5, display: "flex", alignItems: "center", gap: 0.5, animation: "handPulse 1.6s ease-in-out infinite", whiteSpace: "nowrap" }}>
                      <Typography sx={{ fontSize: "0.9rem", lineHeight: 1 }}>✋</Typography>
                      <Typography variant="caption" sx={{ color: "#fbbf24", fontWeight: 800, fontSize: "0.66rem" }}>Raised</Typography>
                    </Box>
                  )}
                </Box>

                {/* Remote Video Tiles — memoized, no re-render unless stream changes */}
                {videos.map((vid) => (
                  <RemoteVideoTile key={vid.socketId} vid={vid} raisedHands={raisedHands} />
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
                borderColor: "rgba(124,58,237,0.25)",
              },
            }}
          >
            {/* Audio Toggle */}
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

            {/* Video Toggle */}
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

            {/* Screen Share */}
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
                  "&:hover": { background: "rgba(255,255,255,0.1)", transform: "scale(1.1)" },
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

            <Divider orientation="vertical" sx={{ borderColor: "rgba(255,255,255,0.08)", height: 28, mx: 0.5 }} />

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
                <Typography sx={{ display: { xs: "none", sm: "block" }, fontWeight: 700, letterSpacing: 0.5, fontSize: "0.9rem" }}>
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
              <Box onClick={() => setShowEmojiPicker(false)} sx={{ position: "fixed", inset: 0, zIndex: 24 }} />
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
                width: { xs: "100%", sm: 380 },
                background: "rgba(10, 14, 26, 0.96)",
                backdropFilter: "blur(30px)",
                borderLeft: "1px solid rgba(255,255,255,0.08)",
                color: "white",
                boxShadow: "-12px 0 40px rgba(0,0,0,0.6)",
              },
            }}
          >
            <Stack sx={{ height: "100%" }}>
              {/* Drawer Header */}
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{
                  px: 2,
                  py: 1.8,
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(15, 23, 42, 0.55)",
                }}
              >
                <Stack
                  direction="row"
                  spacing={0.5}
                  sx={{
                    background: "rgba(255,255,255,0.05)",
                    p: "4px",
                    borderRadius: "100px",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <Button
                    size="small"
                    onClick={() => setAiActive(false)}
                    startIcon={<ChatIcon sx={{ fontSize: "14px !important" }} />}
                    sx={{
                      borderRadius: "100px",
                      textTransform: "none",
                      fontWeight: 700,
                      fontSize: "0.82rem",
                      px: 2,
                      py: 0.6,
                      color: !aiActive ? "#ffffff" : "rgba(255,255,255,0.65)",
                      background: !aiActive ? "linear-gradient(135deg, #7C3AED, #3B82F6)" : "transparent",
                      boxShadow: !aiActive ? "0 2px 10px rgba(124,58,237,0.35)" : "none",
                      "&:hover": {
                        background: !aiActive ? "linear-gradient(135deg, #7C3AED, #3B82F6)" : "rgba(255,255,255,0.08)",
                        color: "#ffffff",
                      },
                      transition: "all 0.2s ease",
                    }}
                  >
                    Chat
                  </Button>
                  <Button
                    size="small"
                    onClick={() => setAiActive(true)}
                    startIcon={<SmartToyIcon sx={{ fontSize: "15px !important" }} />}
                    sx={{
                      borderRadius: "100px",
                      textTransform: "none",
                      fontWeight: 700,
                      fontSize: "0.82rem",
                      px: 2,
                      py: 0.6,
                      color: aiActive ? "#ffffff" : "rgba(255,255,255,0.65)",
                      background: aiActive ? "linear-gradient(135deg, #7C3AED, #3B82F6)" : "transparent",
                      boxShadow: aiActive ? "0 2px 10px rgba(124,58,237,0.35)" : "none",
                      "&:hover": {
                        background: aiActive ? "linear-gradient(135deg, #7C3AED, #3B82F6)" : "rgba(255,255,255,0.08)",
                        color: "#ffffff",
                      },
                      transition: "all 0.2s ease",
                    }}
                  >
                    AI Assistant
                  </Button>
                </Stack>
                <IconButton
                  onClick={closeChat}
                  sx={{
                    color: "rgba(255,255,255,0.6)",
                    borderRadius: "10px",
                    "&:hover": { color: "#ffffff", background: "rgba(255,255,255,0.08)" },
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Stack>

              {/* Chat View vs AI Assistant View */}
              {!aiActive ? (
                <>
                  <Box sx={{ flex: 1, overflowY: "auto", p: 2, display: "flex", flexDirection: "column", gap: 2 }}>
                    {messages.length !== 0 ? (
                      messages.map((item, index) => {
                        const isOwn = item.socketIdSender === socketIdRef.current || item.sender === username;
                        const isEditing = editingIndex === index;
                        const initial = item.sender ? item.sender.trim().charAt(0).toUpperCase() : "?";

                        return (
                          <Box
                            key={index}
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: isOwn ? "flex-end" : "flex-start",
                              width: "100%",
                            }}
                          >
                            {isEditing ? (
                              <Box
                                sx={{
                                  background: "rgba(124,58,237,0.18)",
                                  border: "1px solid rgba(124,58,237,0.4)",
                                  borderRadius: "14px",
                                  p: 1.2,
                                  width: "85%",
                                  boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
                                }}
                              >
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ width: "100%" }}>
                                  <TextField
                                    value={editText}
                                    onChange={(e) => setEditText(e.target.value)}
                                    size="small"
                                    variant="standard"
                                    fullWidth
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" && editText.trim()) {
                                        editMessage(index, editText);
                                        setEditingIndex(null);
                                      } else if (e.key === "Escape") {
                                        setEditingIndex(null);
                                      }
                                    }}
                                    sx={{
                                      input: { color: "white", fontSize: "0.875rem" },
                                      "& .MuiInput-underline:before": { borderBottomColor: "rgba(255,255,255,0.2)" },
                                      "& .MuiInput-underline:hover:before": { borderBottomColor: "rgba(255,255,255,0.4)" },
                                      "& .MuiInput-underline:after": { borderBottomColor: "#A78BFA" },
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
                                    sx={{ color: "#34d399", p: 0.5 }}
                                  >
                                    <CheckIcon sx={{ fontSize: 16 }} />
                                  </IconButton>
                                  <IconButton size="small" onClick={() => setEditingIndex(null)} sx={{ color: "#ef4444", p: 0.5 }}>
                                    <CloseIcon sx={{ fontSize: 16 }} />
                                  </IconButton>
                                </Stack>
                              </Box>
                            ) : isOwn ? (
                              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", maxWidth: "85%" }}>
                                <Box
                                  sx={{
                                    background: "linear-gradient(135deg, #7C3AED 0%, #3B82F6 100%)",
                                    borderRadius: "18px 18px 4px 18px",
                                    px: 2,
                                    py: 1.2,
                                    color: "#ffffff",
                                    boxShadow: "0 4px 16px rgba(124,58,237,0.25)",
                                  }}
                                >
                                  <Typography sx={{ fontSize: "0.88rem", lineHeight: 1.5, wordBreak: "break-word" }}>
                                    {item.data}
                                  </Typography>
                                </Box>
                                <Stack direction="row" alignItems="center" spacing={0.8} sx={{ mt: 0.5, pr: 0.5 }}>
                                  <Typography sx={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.45)", fontWeight: 500 }}>
                                    {item.time || "Just now"}
                                  </Typography>
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      setEditingIndex(index);
                                      setEditText(item.data);
                                    }}
                                    title="Edit message"
                                    sx={{
                                      p: 0.3,
                                      color: "rgba(255,255,255,0.4)",
                                      "&:hover": { color: "#A78BFA", background: "rgba(124,58,237,0.1)" },
                                    }}
                                  >
                                    <EditIcon sx={{ fontSize: 13 }} />
                                  </IconButton>
                                </Stack>
                              </Box>
                            ) : (
                              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, maxWidth: "88%" }}>
                                <Avatar
                                  sx={{
                                    width: 28,
                                    height: 28,
                                    fontSize: "0.75rem",
                                    fontWeight: 700,
                                    background: "linear-gradient(135deg, rgba(59,130,246,0.5), rgba(124,58,237,0.5))",
                                    border: "1px solid rgba(255,255,255,0.15)",
                                    color: "#ffffff",
                                    flexShrink: 0,
                                    mt: 2.2,
                                  }}
                                >
                                  {initial}
                                </Avatar>
                                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                                  <Typography
                                    sx={{
                                      color: "#93C5FD",
                                      fontWeight: 700,
                                      mb: 0.4,
                                      pl: 0.5,
                                      fontSize: "0.72rem",
                                    }}
                                  >
                                    {item.sender}
                                  </Typography>
                                  <Box
                                    sx={{
                                      background: "rgba(255,255,255,0.07)",
                                      border: "1px solid rgba(255,255,255,0.1)",
                                      borderRadius: "18px 18px 18px 4px",
                                      px: 2,
                                      py: 1.2,
                                      color: "#F1F5F9",
                                      backdropFilter: "blur(12px)",
                                      boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
                                    }}
                                  >
                                    <Typography sx={{ fontSize: "0.88rem", lineHeight: 1.5, wordBreak: "break-word" }}>
                                      {item.data}
                                    </Typography>
                                  </Box>
                                  <Typography sx={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.4)", mt: 0.5, pl: 0.5 }}>
                                    {item.time || "Just now"}
                                  </Typography>
                                </Box>
                              </Box>
                            )}
                          </Box>
                        );
                      })
                    ) : (
                      <Stack alignItems="center" justifyContent="center" sx={{ height: "100%" }} spacing={1.5}>
                        <Avatar
                          sx={{
                            background: "rgba(124,58,237,0.12)",
                            border: "1px solid rgba(124,58,237,0.25)",
                            width: 58,
                            height: 58,
                          }}
                        >
                          <ChatIcon sx={{ color: "#A78BFA", fontSize: 26 }} />
                        </Avatar>
                        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>
                          No messages yet
                        </Typography>
                        <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.4)", textAlign: "center", px: 3 }}>
                          Start chatting with participants in this meeting
                        </Typography>
                      </Stack>
                    )}
                    <div ref={chatEndRef} />
                  </Box>

                  <Box sx={{ p: 2, borderTop: "1px solid rgba(255,255,255,0.08)", background: "rgba(8,12,24,0.9)" }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: "100px",
                        px: 2,
                        py: 0.6,
                        transition: "all 0.2s ease",
                        "&:focus-within": {
                          borderColor: "#7C3AED",
                          boxShadow: "0 0 0 3px rgba(124,58,237,0.2)",
                          background: "rgba(255,255,255,0.07)",
                        },
                      }}
                    >
                      <TextField
                        value={message}
                        onChange={handleMessage}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey && message.trim()) {
                            e.preventDefault();
                            sendMessage();
                          }
                        }}
                        placeholder="Type a secure message..."
                        variant="standard"
                        fullWidth
                        InputProps={{ disableUnderline: true }}
                        sx={{
                          input: {
                            color: "white",
                            fontSize: "0.88rem",
                            "&::placeholder": { color: "rgba(255,255,255,0.4)", opacity: 1 },
                          },
                        }}
                      />
                      <IconButton
                        onClick={() => {
                          if (message.trim()) sendMessage();
                        }}
                        disabled={!message.trim()}
                        sx={{
                          color: "white",
                          width: 36,
                          height: 36,
                          ml: 1,
                          flexShrink: 0,
                          background: message.trim()
                            ? "linear-gradient(135deg, #7C3AED, #3B82F6)"
                            : "rgba(255,255,255,0.06)",
                          boxShadow: message.trim() ? "0 4px 14px rgba(124,58,237,0.4)" : "none",
                          "&:hover": {
                            background: message.trim()
                              ? "linear-gradient(135deg, #6D28D9, #2563EB)"
                              : "rgba(255,255,255,0.06)",
                            transform: message.trim() ? "scale(1.05)" : "none",
                          },
                          transition: "all 0.2s ease",
                        }}
                      >
                        <SendIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
                  </Box>
                </>
              ) : (
                <>
                  <Box sx={{ flex: 1, overflowY: "auto", p: 2, display: "flex", flexDirection: "column", gap: 2 }}>
                    {aiHistory.map((item, index) => {
                      const isOwn = item.sender === "User";
                      return (
                        <Box
                          key={index}
                          sx={{ display: "flex", flexDirection: "column", alignItems: isOwn ? "flex-end" : "flex-start" }}
                        >
                          <Typography
                            variant="caption"
                            sx={{ color: isOwn ? "#A78BFA" : "#fbbf24", fontWeight: 700, mb: 0.5, fontSize: "0.72rem", px: 0.5 }}
                          >
                            {isOwn ? "You" : "Conectify AI"}
                          </Typography>
                          <Box
                            sx={{
                              background: isOwn
                                ? "linear-gradient(135deg, #7C3AED 0%, #3B82F6 100%)"
                                : "rgba(251,191,36,0.1)",
                              border: isOwn ? "none" : "1px solid rgba(251,191,36,0.25)",
                              borderRadius: isOwn ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                              px: 2,
                              py: 1.2,
                              maxWidth: "85%",
                              color: "#ffffff",
                              boxShadow: isOwn ? "0 4px 16px rgba(124,58,237,0.25)" : "0 2px 10px rgba(0,0,0,0.15)",
                            }}
                          >
                            <Typography sx={{ fontSize: "0.88rem", lineHeight: 1.5, wordBreak: "break-word", whiteSpace: "pre-line" }}>
                              {item.text}
                            </Typography>
                          </Box>
                        </Box>
                      );
                    })}

                    {aiMeetLoading && (
                      <Box sx={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 1, pl: 0.5 }}>
                        <CircularProgress size={14} sx={{ color: "#fbbf24" }} />
                        <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)" }}>
                          AI is typing...
                        </Typography>
                      </Box>
                    )}
                    <div ref={chatEndRef} />
                  </Box>

                  <Box sx={{ p: 2, borderTop: "1px solid rgba(255,255,255,0.08)", background: "rgba(8,12,24,0.9)" }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: "100px",
                        px: 2,
                        py: 0.6,
                        transition: "all 0.2s ease",
                        "&:focus-within": {
                          borderColor: "#fbbf24",
                          boxShadow: "0 0 0 3px rgba(251,191,36,0.15)",
                          background: "rgba(255,255,255,0.07)",
                        },
                      }}
                    >
                      <TextField
                        value={aiQuery}
                        onChange={(e) => setAiQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && aiQuery.trim() && !aiMeetLoading) {
                            e.preventDefault();
                            handleSendAiMessage();
                          }
                        }}
                        placeholder="Ask AI anything..."
                        variant="standard"
                        fullWidth
                        InputProps={{ disableUnderline: true }}
                        sx={{
                          input: {
                            color: "white",
                            fontSize: "0.88rem",
                            "&::placeholder": { color: "rgba(255,255,255,0.4)", opacity: 1 },
                          },
                        }}
                      />
                      <IconButton
                        onClick={handleSendAiMessage}
                        disabled={aiMeetLoading || !aiQuery.trim()}
                        sx={{
                          color: aiQuery.trim() && !aiMeetLoading ? "#1a1000" : "rgba(255,255,255,0.3)",
                          width: 36,
                          height: 36,
                          ml: 1,
                          flexShrink: 0,
                          background: aiQuery.trim() && !aiMeetLoading
                            ? "linear-gradient(135deg, #fbbf24, #f59e0b)"
                            : "rgba(255,255,255,0.06)",
                          boxShadow: aiQuery.trim() && !aiMeetLoading ? "0 4px 14px rgba(251,191,36,0.35)" : "none",
                          "&:hover": {
                            background: aiQuery.trim() && !aiMeetLoading
                              ? "linear-gradient(135deg, #fcd34d, #d97706)"
                              : "rgba(255,255,255,0.06)",
                            transform: aiQuery.trim() && !aiMeetLoading ? "scale(1.05)" : "none",
                          },
                          transition: "all 0.2s ease",
                        }}
                      >
                        <SendIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
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
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            ContentProps={{
              sx: { background: "rgba(124,58,237,0.9)", backdropFilter: "blur(10px)", fontWeight: 600, borderRadius: "12px" },
            }}
          />

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
