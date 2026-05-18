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
import PeopleIcon from "@mui/icons-material/People";

import server from "../environment";
import GlassCard from "../components/ui/GlassCard";
import GradientText from "../components/ui/GradientText";
import OrbitalDecor from "../components/ui/OrbitalDecor";
import { AuthContext } from "../contexts/AuthContext";

const server_url = server;

var connections = {};

const peerConfigConnections = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export default function VideoMeetComponent() {
  var socketRef = useRef();
  let socketIdRef = useRef();
  let localVideoref = useRef();
  const { userData } = useContext(AuthContext);

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

  const videoRef = useRef([]);
  let [videos, setVideos] = useState([]);
  let [snackbarOpen, setSnackbarOpen] = useState(false);

  const copyMeetingLink = () => {
    const url = window.location.href;
    const code = url.substring(url.lastIndexOf('/') + 1);
    const inviteText = `Join my Conectify-Call video meeting!\n\nMeeting Code: ${code}\nMeeting Link: ${url}`;
    navigator.clipboard.writeText(inviteText);
    setSnackbarOpen(true);
  };

  useEffect(() => {
    console.log("HELLO");
    getPermissions();
  }, []);

  let getDislayMedia = () => {
    if (screen) {
      if (navigator.mediaDevices.getDisplayMedia) {
        navigator.mediaDevices
          .getDisplayMedia({ video: true, audio: true })
          .then(getDislayMediaSuccess)
          .then((stream) => {})
          .catch((e) => console.log(e));
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
        console.log("Video permission granted");
      } else {
        setVideoAvailable(false);
        console.log("Video permission denied");
      }

      const audioPermission = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      if (audioPermission) {
        setAudioAvailable(true);
        console.log("Audio permission granted");
      } else {
        setAudioAvailable(false);
        console.log("Audio permission denied");
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
      console.log(error);
    }
  };

  useEffect(() => {
    if (video !== undefined && audio !== undefined) {
      getUserMedia();
      console.log("SET STATE HAS ", video, audio);
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
        console.log(description);
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

    stream.getTracks().forEach(
      (track) =>
        (track.onended = () => {
          setVideo(false);
          setAudio(false);

          try {
            let tracks = localVideoref.current.srcObject.getTracks();
            tracks.forEach((track) => track.stop());
          } catch (e) {
            console.log(e);
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
        .catch((e) => console.log(e));
    } else {
      try {
        let tracks = localVideoref.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      } catch (e) {}
    }
  };

  let getDislayMediaSuccess = (stream) => {
    console.log("HERE");
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
          .catch((e) => console.log(e));
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
            console.log(e);
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
                    .catch((e) => console.log(e));
                })
                .catch((e) => console.log(e));
            }
          })
          .catch((e) => console.log(e));
      }

      if (signal.ice) {
        connections[fromId]
          .addIceCandidate(new RTCIceCandidate(signal.ice))
          .catch((e) => console.log(e));
      }
    }
  };

  let connectToSocketServer = () => {
    socketRef.current = io.connect(server_url, { secure: false });

    socketRef.current.on("signal", gotMessageFromServer);

    socketRef.current.on("connect", () => {
      // Send user info alongside the room path so backend can save it
      const userInfo = userData
        ? { username: userData.username, name: userData.name, avatar: userData.avatar }
        : { username: username, name: username, avatar: null };

      socketRef.current.emit("join-call", window.location.href, userInfo);
      socketIdRef.current = socketRef.current.id;

      socketRef.current.on("chat-message", addMessage);

      socketRef.current.on("user-left", (id) => {
        setVideos((videos) => videos.filter((video) => video.socketId !== id));
      });

      socketRef.current.on("user-joined", (id, clients) => {
        clients.forEach((socketListId) => {
          connections[socketListId] = new RTCPeerConnection(
            peerConfigConnections
          );
          // Wait for their ice candidate
          connections[socketListId].onicecandidate = function (event) {
            if (event.candidate != null) {
              socketRef.current.emit(
                "signal",
                socketListId,
                JSON.stringify({ ice: event.candidate })
              );
            }
          };

          // Wait for their video stream
          connections[socketListId].onaddstream = (event) => {
            console.log("BEFORE:", videoRef.current);
            console.log("FINDING ID: ", socketListId);

            let videoExists = videoRef.current.find(
              (video) => video.socketId === socketListId
            );

            if (videoExists) {
              console.log("FOUND EXISTING");

              // Update the stream of the existing video
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
              // Create a new video
              console.log("CREATING NEW");
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

          // Add the local video stream
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
                .catch((e) => console.log(e));
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
    // getUserMedia();
  };
  let handleAudio = () => {
    setAudio(!audio);
    // getUserMedia();
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
      { sender: sender, data: data },
    ]);
    if (socketIdSender !== socketIdRef.current) {
      setNewMessages((prevNewMessages) => prevNewMessages + 1);
    }
  };

  let sendMessage = () => {
    console.log(socketRef.current);
    socketRef.current.emit("chat-message", message, username);
    setMessage("");

    // this.setState({ message: "", sender: username })
  };

  let connect = () => {
    setAskForUsername(false);
    getMedia();
  };

  return (
    <Box>
      {askForUsername === true ? (
        <Box
          sx={{
            display: "flex",
            minHeight: "100vh",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            overflow: "hidden",
            animation: "fadeInUp 0.4s ease both",
          }}
        >
          {/* Orbital background decoration */}
          <Box sx={{ position: "absolute", zIndex: 0, opacity: 0.6 }}>
            <OrbitalDecor size="lg" />
          </Box>

          <GlassCard
            float
            floatDelay="0s"
            sx={{
              maxWidth: 500,
              width: "100%",
              zIndex: 1,
              textAlign: "center",
              p: { xs: 3, md: 5 },
            }}
          >
            <GradientText variant="h4" sx={{ mb: 1 }}>
              Enter the Lobby
            </GradientText>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
              Set your name and preview your camera before joining
            </Typography>

            <Box
              sx={{
                width: "100%",
                height: 240,
                borderRadius: 4,
                overflow: "hidden",
                mb: 4,
                background: "rgba(0,0,0,0.5)",
                border: "1px solid rgba(255,255,255,0.1)",
                position: "relative",
              }}
            >
              <video
                ref={localVideoref}
                autoPlay
                muted
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <Box
                sx={{
                  position: "absolute",
                  bottom: 8,
                  left: 8,
                  background: "rgba(0,0,0,0.6)",
                  backdropFilter: "blur(8px)",
                  px: 1.5,
                  py: 0.5,
                  borderRadius: "100px",
                }}
              >
                <Typography variant="caption" sx={{ color: "white" }}>
                  {username || "You"}
                </Typography>
              </Box>
            </Box>

            <Stack spacing={3}>
              <TextField
                label="Your Name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                variant="outlined"
                fullWidth
              />
              <Button
                variant="contained"
                color="primary"
                size="large"
                fullWidth
                onClick={connect}
                disabled={!username.trim()}
              >
                Join Meeting
              </Button>
            </Stack>
          </GlassCard>
        </Box>
      ) : (
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            background: "#050810",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            animation: "fadeInUp 0.4s ease both",
          }}
        >
          {/* Participants Grid */}
          <Box
            sx={{
              flex: 1,
              p: 2,
              pb: { xs: 12, md: 10 }, // padding for control bar
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 2,
              overflowY: "auto",
            }}
          >
            {/* Local Video */}
            <Box
              sx={{
                position: "relative",
                borderRadius: "20px",
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.04)",
                animation: "drift 6s ease-in-out infinite",
                animationDelay: "0s",
                willChange: "transform",
                "&:hover": {
                  borderColor: "rgba(124,58,237,0.5)",
                },
              }}
            >
              <video
                ref={localVideoref}
                autoPlay
                muted
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <Box
                sx={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
                  p: 1.5,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Box
                  sx={{
                    background: "rgba(0,0,0,0.5)",
                    backdropFilter: "blur(8px)",
                    px: 1.5,
                    py: 0.5,
                    borderRadius: "100px",
                  }}
                >
                  <Typography variant="caption" sx={{ color: "white" }}>
                    {username} (You)
                  </Typography>
                </Box>
                {audio ? (
                  <MicIcon sx={{ color: "#34D399", fontSize: 20 }} />
                ) : (
                  <MicOffIcon sx={{ color: "#EF4444", fontSize: 20 }} />
                )}
              </Box>
            </Box>

            {/* Remote Videos */}
            {videos.map((vid, index) => (
              <Box
                key={vid.socketId}
                sx={{
                  position: "relative",
                  borderRadius: "20px",
                  overflow: "hidden",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.04)",
                  animation: "drift 6s ease-in-out infinite",
                  animationDelay: `${(index + 1) * 1}s`,
                  willChange: "transform",
                  "&:hover": {
                    borderColor: "rgba(124,58,237,0.5)",
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
                <Box
                  sx={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
                    p: 1.5,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Box
                    sx={{
                      background: "rgba(0,0,0,0.5)",
                      backdropFilter: "blur(8px)",
                      px: 1.5,
                      py: 0.5,
                      borderRadius: "100px",
                    }}
                  >
                    <Typography variant="caption" sx={{ color: "white" }}>
                      Participant
                    </Typography>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>

          {/* Control Bar */}
          <Box
            sx={{
              position: "fixed",
              bottom: { xs: 24, md: 32 },
              left: "50%",
              transform: "translateX(-50%)",
              background: "rgba(5,8,16,0.85)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "100px",
              px: { xs: 2, sm: 3 },
              py: 1.5,
              display: "flex",
              gap: { xs: 1, sm: 2 },
              alignItems: "center",
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
              zIndex: 10,
            }}
          >
            <IconButton
              onClick={handleAudio}
              sx={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: audio
                  ? "rgba(124,58,237,0.2)"
                  : "rgba(255,255,255,0.08)",
                border: `1px solid ${
                  audio ? "rgba(124,58,237,0.5)" : "rgba(255,255,255,0.12)"
                }`,
                color: "white",
                boxShadow: audio ? "0 0 16px rgba(124,58,237,0.5)" : "none",
                "&:hover": {
                  background: audio
                    ? "rgba(124,58,237,0.3)"
                    : "rgba(255,255,255,0.15)",
                  transform: "scale(1.1)",
                },
                transition: "all 0.2s ease",
              }}
            >
              {audio ? <MicIcon /> : <MicOffIcon />}
            </IconButton>

            <IconButton
              onClick={handleVideo}
              sx={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: video
                  ? "rgba(124,58,237,0.2)"
                  : "rgba(255,255,255,0.08)",
                border: `1px solid ${
                  video ? "rgba(124,58,237,0.5)" : "rgba(255,255,255,0.12)"
                }`,
                color: "white",
                boxShadow: video ? "0 0 16px rgba(124,58,237,0.5)" : "none",
                "&:hover": {
                  background: video
                    ? "rgba(124,58,237,0.3)"
                    : "rgba(255,255,255,0.15)",
                  transform: "scale(1.1)",
                },
                transition: "all 0.2s ease",
              }}
            >
              {video ? <VideocamIcon /> : <VideocamOffIcon />}
            </IconButton>

            {screenAvailable && (
              <IconButton
                onClick={handleScreen}
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: screen
                    ? "rgba(124,58,237,0.2)"
                    : "rgba(255,255,255,0.08)",
                  border: `1px solid ${
                    screen ? "rgba(124,58,237,0.5)" : "rgba(255,255,255,0.12)"
                  }`,
                  color: "white",
                  boxShadow: screen ? "0 0 16px rgba(124,58,237,0.5)" : "none",
                  "&:hover": {
                    background: screen
                      ? "rgba(124,58,237,0.3)"
                      : "rgba(255,255,255,0.15)",
                    transform: "scale(1.1)",
                  },
                  transition: "all 0.2s ease",
                }}
              >
                {screen ? <ScreenShareIcon /> : <StopScreenShareIcon />}
              </IconButton>
            )}

            <Tooltip title="Copy Meeting Link">
              <IconButton
                onClick={copyMeetingLink}
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "white",
                  "&:hover": {
                    background: "rgba(255,255,255,0.15)",
                    transform: "scale(1.1)",
                  },
                  transition: "all 0.2s ease",
                }}
              >
                <ContentCopyIcon />
              </IconButton>
            </Tooltip>

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
                  background: showModal
                    ? "rgba(124,58,237,0.2)"
                    : "rgba(255,255,255,0.08)",
                  border: `1px solid ${
                    showModal
                      ? "rgba(124,58,237,0.5)"
                      : "rgba(255,255,255,0.12)"
                  }`,
                  color: "white",
                  boxShadow: showModal
                    ? "0 0 16px rgba(124,58,237,0.5)"
                    : "none",
                  "&:hover": {
                    background: showModal
                      ? "rgba(124,58,237,0.3)"
                      : "rgba(255,255,255,0.15)",
                    transform: "scale(1.1)",
                  },
                  transition: "all 0.2s ease",
                }}
              >
                <ChatIcon />
              </IconButton>
            </Badge>

            <Divider
              orientation="vertical"
              sx={{
                borderColor: "rgba(255,255,255,0.1)",
                height: 32,
                mx: 1,
              }}
            />

            <Button
              onClick={handleEndCall}
              sx={{
                background: "linear-gradient(135deg, #DC2626, #991B1B)",
                boxShadow: "0 0 20px rgba(220,38,38,0.4)",
                borderRadius: "100px",
                px: 3,
                minWidth: "auto",
                color: "white",
                "&:hover": {
                  boxShadow: "0 0 32px rgba(220,38,38,0.6)",
                  transform: "scale(1.05)",
                  background: "linear-gradient(135deg, #EF4444, #B91C1C)",
                },
                transition: "all 0.2s ease",
              }}
            >
              <CallEndIcon sx={{ mr: { xs: 0, sm: 1 } }} />
              <Typography
                sx={{ display: { xs: "none", sm: "block" }, fontWeight: 600 }}
              >
                End Call
              </Typography>
            </Button>
          </Box>

          {/* Chat Drawer */}
          <Drawer
            anchor="right"
            open={showModal}
            onClose={closeChat}
            PaperProps={{
              sx: {
                width: { xs: "100%", sm: 340 },
                background: "rgba(5,8,16,0.95)",
                backdropFilter: "blur(24px)",
                borderLeft: "1px solid rgba(255,255,255,0.08)",
                color: "white",
              },
            }}
          >
            <Stack sx={{ height: "100%" }}>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ p: 2, borderBottom: "1px solid rgba(255,255,255,0.08)" }}
              >
                <Typography variant="h6" fontWeight={600}>
                  Chat
                </Typography>
                <IconButton onClick={closeChat} sx={{ color: "white" }}>
                  <CloseIcon />
                </IconButton>
              </Stack>

              <Box sx={{ flex: 1, overflowY: "auto", p: 2 }}>
                {messages.length !== 0 ? (
                  messages.map((item, index) => {
                    const isOwn = item.sender === username;
                    return (
                      <Box
                        key={index}
                        sx={{
                          mb: 2,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: isOwn ? "flex-end" : "flex-start",
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            color: isOwn ? "#A78BFA" : "#60A5FA",
                            fontWeight: 600,
                            mb: 0.5,
                          }}
                        >
                          {item.sender}
                        </Typography>
                        <Box
                          sx={{
                            background: isOwn
                              ? "rgba(124,58,237,0.2)"
                              : "rgba(255,255,255,0.06)",
                            border: isOwn
                              ? "1px solid rgba(124,58,237,0.3)"
                              : "none",
                            borderRadius: "12px",
                            p: 1.5,
                            maxWidth: "85%",
                          }}
                        >
                          <Typography variant="body2">{item.data}</Typography>
                        </Box>
                      </Box>
                    );
                  })
                ) : (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    textAlign="center"
                    sx={{ mt: 4 }}
                  >
                    No messages yet
                  </Typography>
                )}
              </Box>

              <Box
                sx={{ p: 2, borderTop: "1px solid rgba(255,255,255,0.08)" }}
              >
                <Stack direction="row" spacing={1}>
                  <TextField
                    value={message}
                    onChange={handleMessage}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && message.trim()) {
                        sendMessage();
                      }
                    }}
                    placeholder="Type a message..."
                    variant="outlined"
                    size="small"
                    fullWidth
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        color: "white",
                        background: "rgba(255,255,255,0.05)",
                        "& fieldset": {
                          borderColor: "rgba(255,255,255,0.1)",
                        },
                        "&:hover fieldset": {
                          borderColor: "rgba(255,255,255,0.2)",
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
                      background: "rgba(124,58,237,0.1)",
                      "&:hover": {
                        background: "rgba(124,58,237,0.2)",
                      },
                    }}
                  >
                    <SendIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </Box>
            </Stack>
          </Drawer>
          
          <Snackbar 
            open={snackbarOpen} 
            autoHideDuration={3000} 
            onClose={() => setSnackbarOpen(false)} 
            message="Meeting link copied to clipboard!" 
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            ContentProps={{
              sx: { background: 'rgba(124,58,237,0.9)', backdropFilter: 'blur(10px)' }
            }}
          />
        </Box>
      )}
    </Box>
  );
}
