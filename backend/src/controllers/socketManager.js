import { Server } from "socket.io";
import { Meeting } from "../models/meeting.model.js";
import { User } from "../models/user.model.js";

let connections = {};   // roomPath → [socketId, ...]
let messages = {};      // roomPath → [{ sender, data, socket-id-sender }]
let timeOnline = {};    // socketId → Date joined

// Room metadata: who joined (by username), when room started having ≥2 people
let roomMeta = {};      // roomPath → { startTime, users: [...], hadMultiple: false }

// Map socketId → { username, name, avatar } for lookup on disconnect
let socketUserMap = {}; // socketId → { username, name, avatar }

// Helper: find which room a socket belongs to (O(1) with reverse map)
let socketRoomMap = {}; // socketId → roomPath

export const connectToSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            allowedHeaders: ["*"],
            credentials: true
        },
        // Force WebSocket transport to avoid polling overhead
        transports: ["websocket"],
        pingInterval: 25000,
        pingTimeout: 60000,
    });

    io.on("connection", (socket) => {
        console.log("Socket connected:", socket.id);

        // Client sends { path, username, name, avatar } on join
        socket.on("join-call", (path, userInfo) => {
            if (!connections[path]) {
                connections[path] = [];
            }
            connections[path].push(socket.id);
            timeOnline[socket.id] = new Date();
            socketRoomMap[socket.id] = path;

            // Store user info mapped to socket
            socketUserMap[socket.id] = {
                username: userInfo?.username || userInfo?.name || "anonymous",
                name: userInfo?.name || userInfo?.username || "Anonymous",
                avatar: userInfo?.avatar || null,
            };

            // Init room meta if first user
            if (!roomMeta[path]) {
                roomMeta[path] = { startTime: null, users: [], hadMultiple: false };
            }

            // Add user to room meta (avoid duplicates)
            const u = socketUserMap[socket.id];
            if (!roomMeta[path].users.find(x => x.socketId === socket.id)) {
                roomMeta[path].users.push({ socketId: socket.id, ...u });
            }

            // Mark start time when 2nd person joins
            if (connections[path].length === 2 && !roomMeta[path].hadMultiple) {
                roomMeta[path].startTime = new Date();
                roomMeta[path].hadMultiple = true;
                console.log(`Meeting started: ${path} at ${roomMeta[path].startTime}`);
            }

            // Emit to all in room (using socket.io room for efficiency)
            const joiningUserName = socketUserMap[socket.id]?.name || "Someone";

            // Join socket.io room (enables efficient broadcast)
            socket.join(path);

            // Notify everyone in the room (including the new joiner)
            io.to(path).emit("user-joined", socket.id, connections[path], joiningUserName);

            // Send stored messages only to the new joiner
            if (messages[path]) {
                for (const msg of messages[path]) {
                    socket.emit("chat-message", msg["data"], msg["sender"], msg["socket-id-sender"]);
                }
            }
        });

        // WebRTC signaling relay — simple point-to-point, no room needed
        socket.on("signal", (toId, message) => {
            io.to(toId).emit("signal", socket.id, message);
        });

        socket.on("chat-message", (data, sender) => {
            const path = socketRoomMap[socket.id];
            if (!path) return;

            if (!messages[path]) messages[path] = [];
            messages[path].push({ sender, data, "socket-id-sender": socket.id });

            console.log("message", path, ":", sender, data);

            // Broadcast to everyone in the room (including sender for confirmation)
            io.to(path).emit("chat-message", data, sender, socket.id);
        });

        socket.on("edit-chat-message", (index, newData) => {
            const path = socketRoomMap[socket.id];
            if (!path || !messages[path]) return;

            const msg = messages[path][index];
            if (msg && msg["socket-id-sender"] === socket.id) {
                msg.data = newData;
                console.log("message edited in", path, "at index", index, ":", newData);
                io.to(path).emit("edit-chat-message", index, newData);
            }
        });

        socket.on("emoji-reaction", (emoji, sender) => {
            const path = socketRoomMap[socket.id];
            if (!path) return;
            io.to(path).emit("emoji-reaction", emoji, sender, socket.id);
        });

        socket.on("raise-hand", (sender) => {
            const path = socketRoomMap[socket.id];
            if (!path) return;
            io.to(path).emit("raise-hand", socket.id, sender);
        });

        socket.on("lower-hand", () => {
            const path = socketRoomMap[socket.id];
            if (!path) return;
            io.to(path).emit("lower-hand", socket.id);
        });

        socket.on("disconnect", async () => {
            const key = socketRoomMap[socket.id];

            if (key && connections[key]) {
                const leavingUserName = socketUserMap[socket.id]?.name || "Someone";

                // Remove socket from room array
                connections[key] = connections[key].filter(id => id !== socket.id);

                // Notify all remaining participants
                io.to(key).emit("user-left", socket.id, leavingUserName);

                // ─── Room is now empty → save meeting to DB if valid ───────────
                if (connections[key].length === 0) {
                    delete connections[key];

                    const meta = roomMeta[key];

                    if (meta && meta.hadMultiple && meta.startTime) {
                        const endTime = new Date();
                        const durationSeconds = Math.round((endTime - meta.startTime) / 1000);

                        const parts = key.split("/");
                        const meetingCode = parts[parts.length - 1];

                        const usernamesInRoom = [...new Set(meta.users.map(u => u.username))];

                        const dbUsers = await User.find({ username: { $in: usernamesInRoom } })
                            .select("name username avatar")
                            .lean();

                        const dbUserMap = {};
                        dbUsers.forEach(u => { dbUserMap[u.username] = u; });

                        const hostUsername = meta.users.length > 0 ? meta.users[0].username : null;

                        const participantDocs = usernamesInRoom.map((uname) => {
                            const dbUser = dbUserMap[uname];
                            return {
                                username: uname,
                                name: dbUser?.name || uname,
                                avatar: dbUser?.avatar || null,
                                role: uname === hostUsername ? "Host" : "Participant"
                            };
                        });

                        const meeting = new Meeting({
                            user_id: hostUsername,
                            meetingCode,
                            date: meta.startTime,
                            endedAt: endTime,
                            duration: durationSeconds,
                            participantCount: participantDocs.length,
                            participants: participantDocs
                        });

                        try {
                            await meeting.save();
                            console.log(`Meeting saved: ${meetingCode}, duration: ${durationSeconds}s, participants: ${participantDocs.length}`);
                        } catch (err) {
                            console.error("Failed to save meeting:", err.message);
                        }
                    } else {
                        console.log(`Meeting ${key} NOT saved — only 1 person joined or no valid session.`);
                    }

                    // Cleanup
                    delete roomMeta[key];
                    delete messages[key];
                }
            }

            // Clean up all maps for this socket
            delete socketUserMap[socket.id];
            delete socketRoomMap[socket.id];
            delete timeOnline[socket.id];
            console.log("Socket disconnected:", socket.id);
        });
    });

    return io;
};
