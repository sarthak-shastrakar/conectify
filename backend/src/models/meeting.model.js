import mongoose, { Schema } from "mongoose";

const meetingSchema = new Schema(
    {
        user_id: { type: String },      // Host username
        meetingCode: { type: String, required: true },
        date: { type: Date, default: Date.now, required: true },
        endedAt: { type: Date, default: null },
        duration: { type: Number, default: 0 },  // Duration in seconds
        participantCount: { type: Number, default: 0 },
        participants: [{ 
            username: String,
            name: String,
            avatar: { type: String, default: null },
            role: { type: String, enum: ['Host', 'Participant'], default: 'Participant' }
        }]
    }
)

const Meeting = mongoose.model("Meeting", meetingSchema);

export { Meeting };