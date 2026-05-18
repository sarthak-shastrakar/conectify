import { Server } from "socket.io";
import { Meeting } from "../models/meeting.model.js";
import { User } from "../models/user.model.js";

let connections = {};   // roomPath → [socketId, ...]
let messages = {};      // roomPath → [{ sender, data, socket-id-sender }]
let timeOnline = {};    // socketId → Date joined

// Room metadata: who joined (by username), when room started having ≥2 people
let roomMeta = {};      // roomPath → { startTime, usernames: [{ socketId, username, name, avatar }], hadMultiple: false }

// Map socketId → { username, name, avatar } for lookup on disconnect
let socketUserMap = {}; // socketId → { username, name, avatar }

export const connectToSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            allowedHeaders: ["*"],
            credentials: true
        }
    });

    io.on("connection", (socket) => {
        console.log("Socket connected:", socket.id);

        // Client sends { path, username, name, avatar } on join
        socket.on("join-call", (path, userInfo) => {
            if (connections[path] === undefined) {
                connections[path] = [];
            }
            connections[path].push(socket.id);
            timeOnline[socket.id] = new Date();

            // Store user info mapped to socket
            if (userInfo) {
                socketUserMap[socket.id] = {
                    username: userInfo.username || userInfo.name || "anonymous",
                    name: userInfo.name || userInfo.username || "Anonymous",
                    avatar: userInfo.avatar || null,
                };
            } else {
                socketUserMap[socket.id] = { username: "anonymous", name: "Anonymous", avatar: null };
            }

            // Init room meta if first user
            if (!roomMeta[path]) {
                roomMeta[path] = { startTime: null, users: [], hadMultiple: false };
            }

            // Add user to room meta
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

            // Emit to all in room
            for (let a = 0; a < connections[path].length; a++) {
                io.to(connections[path][a]).emit("user-joined", socket.id, connections[path]);
            }

            // Send stored messages
            if (messages[path] !== undefined) {
                for (let a = 0; a < messages[path].length; ++a) {
                    io.to(socket.id).emit(
                        "chat-message",
                        messages[path][a]["data"],
                        messages[path][a]["sender"],
                        messages[path][a]["socket-id-sender"]
                    );
                }
            }
        });

        socket.on("signal", (toId, message) => {
            io.to(toId).emit("signal", socket.id, message);
        });

        socket.on("chat-message", (data, sender) => {
            const [matchingRoom, found] = Object.entries(connections).reduce(
                ([room, isFound], [roomKey, roomValue]) => {
                    if (!isFound && roomValue.includes(socket.id)) return [roomKey, true];
                    return [room, isFound];
                },
                ["", false]
            );

            if (found === true) {
                if (messages[matchingRoom] === undefined) messages[matchingRoom] = [];
                messages[matchingRoom].push({ sender, data, "socket-id-sender": socket.id });
                console.log("message", matchingRoom, ":", sender, data);
                connections[matchingRoom].forEach((elem) => {
                    io.to(elem).emit("chat-message", data, sender, socket.id);
                });
            }
        });

        socket.on("disconnect", async () => {
            let key;

            for (const [k, v] of JSON.parse(JSON.stringify(Object.entries(connections)))) {
                for (let a = 0; a < v.length; ++a) {
                    if (v[a] === socket.id) {
                        key = k;

                        // Notify everyone left
                        for (let a = 0; a < connections[key].length; ++a) {
                            io.to(connections[key][a]).emit("user-left", socket.id);
                        }

                        // Remove socket from room
                        const index = connections[key].indexOf(socket.id);
                        connections[key].splice(index, 1);

                        // ─── Room is now empty → save meeting to DB if valid ───────
                        if (connections[key].length === 0) {
                            delete connections[key];

                            const meta = roomMeta[key];

                            // Only save if at least 2 people joined at some point
                            if (meta && meta.hadMultiple && meta.startTime) {
                                const endTime = new Date();
                                const durationSeconds = Math.round((endTime - meta.startTime) / 1000);

                                // Extract meeting code from URL path (last segment)
                                const parts = key.split("/");
                                const meetingCode = parts[parts.length - 1];

                                // Resolve participant data (username → name)
                                const usernamesInRoom = [...new Set(meta.users.map(u => u.username))];
                                
                                // Find all users in DB
                                const dbUsers = await User.find({ username: { $in: usernamesInRoom } })
                                    .select("name username avatar")
                                    .lean();

                                const dbUserMap = {};
                                dbUsers.forEach(u => { dbUserMap[u.username] = u; });

                                // First user is host (joined first)
                                const hostUsername = meta.users.length > 0 ? meta.users[0].username : null;

                                const participantDocs = usernamesInRoom.map((uname, idx) => {
                                    const dbUser = dbUserMap[uname];
                                    return {
                                        username: uname,
                                        name: dbUser?.name || uname,
                                        avatar: dbUser?.avatar || null,
                                        role: uname === hostUsername ? "Host" : "Participant"
                                    };
                                });

                                // Save one meeting record (host is user_id)
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

                            // Cleanup meta
                            delete roomMeta[key];
                            delete messages[key];
                        }
                    }
                }
            }

            // Clean up socket user map
            delete socketUserMap[socket.id];
            delete timeOnline[socket.id];
        });
    });

    return io;
};
