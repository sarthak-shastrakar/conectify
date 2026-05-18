# Conectify: Video Conferencing Web App

Conectify is a full-stack, highly secure real-time video conferencing web application built using the MERN (MongoDB, Express.js, React, Node.js) stack. The application enables users to create and join video meetings, chat in real-time, and share screens seamlessly.

---

## 🚀 Live Demo
You can try the live application here: **[Conectify Live Demo](https://conectify-call-frontend.onrender.com)**

---

## 🛡️ Production-Grade Security Hardening (Latest Updates)

We have completed a comprehensive security audit of the manual authentication, database, and connection architectures. Below is the list of production-ready security enhancements implemented:

### 1. Backend Hardening
* **HTTP Security Headers:** Integrated `helmet` as the primary middleware to protect against common web vulnerabilities (XSS, Clickjacking, MIME-sniffing, etc.).
* **CORS Whitelist Protection:** Removed the generic wildcard CORS configuration and replaced it with a strict origin whitelist configured via environment variables (`ALLOWED_ORIGINS`).
* **Cryptographic Strength:** Upgraded bcrypt salt rounds to **`12` rounds** (meeting the current OWASP-recommended guidelines).
* **Zero Password Leakage:** Overrode the User Schema `toJSON` serialization to ensure passwords are automatically stripped from any API response, alongside explicit query-level filters (`select("-password")`).
* **Rate Limiting:** Implemented strict request buffers to prevent brute-force attacks on auth endpoints:
  * `/login` and `/register`: Restrained to a maximum of **10 requests per 15 minutes** per IP.
  * General API routes: Capped at **100 requests per 15 minutes**.
* **Startup Env Check:** Validates key configurations (`PORT`, `MONGO_URI`, `JWT_ACCESS_SECRET`, `ALLOWED_ORIGINS`) on process startup. The server terminates immediately if the secret is weak (< 64 characters) or missing.
* **Centralized Error Handler (`errorHandler.js`):** Intercepts database (Mongoose) errors, duplicate keys, validation crashes, and JWT expirations. Hides detailed stack traces from clients in production.
* **Graceful Shutdowns:** Listens for `SIGINT` and `SIGTERM` signals to cleanly drain active socket connections and close database streams before shutting down.

### 2. Frontend Hardening
* **Global Axios Instance (`api.js`):** Unified axios queries under a custom instance. Automatically intercepts `401 Unauthorized` responses to flush invalid browser caches and route users back to authentication.
* **Non-Blocking Silent Authenticator (`AuthContext.jsx`):** Employs an `isLoading` barrier state on startup to evaluate existing sessions cleanly without blinking intermediate dashboards or flashing auth screens.
* **HOC Route Shielding (`withAuth.jsx`):** Refactored protected routes to evaluate reactive context states instead of parsing insecure raw string values directly from `localStorage`.
* **Form Double-Submit Prevention:** Disabled submit buttons and displays "Please wait..." dynamically during pending API queries.
* **Autocomplete Protections:** Injected `autoComplete="new-password"` into credentials forms.

---

## ✨ Features
* **Real-time Video & Audio Calls:** Low-latency WebRTC streams with encrypted socket signaling.
* **Instant In-Call Chat:** Send and receive message logs in real-time during meetings.
* **Screen Sharing:** Broadcast your desktop to meeting participants.
* **Room Management:** Instantly join or create meetings using unique meeting codes.
* **Responsive UI:** Elegant, fluid dark mode UI built with responsive grid system, tailored for mobile, tablet, and desktop views.

---

## 🛠️ Tech Stack
* **Frontend:** React.js, WebRTC, Tailwind CSS, Material UI (MUI), Axios
* **Backend:** Node.js, Express.js, Socket.io, MongoDB + Mongoose, JWT + Bcrypt

---

## 📦 Getting Started & Setup

### Prerequisites
Make sure you have **Node.js** and **MongoDB** installed on your machine.

### Installation & Run

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/sarthak-shastrakar/video-conferencing-app.git
   cd video-conferencing-app
   ```

2. **Install Backend Dependencies:**
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies:**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Environment Variables Configuration:**

   * **Backend Configuration (`backend/src/.env`):**
     Create a `.env` file inside `backend/src/` and set up the following:
     ```env
     PORT=8002
     NODE_ENV=development

     # MongoDB Connection String
     MONGO_URI=your_mongodb_connection_uri

     # JWT Secret (MUST be a 64+ character random hex string)
     # Generate using: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
     JWT_ACCESS_SECRET=a3f8c2e1d94b7e6f0a1c3d5e7f9b2a4c6e8d0f2b4c6a8e0d2f4b6c8a0e2d4f6b8c0a2e4d6f8b0c2a4e6d8f0b2c4

     JWT_ACCESS_EXPIRY=15m
     JWT_REFRESH_EXPIRY=7d

     # CORS Whitelisted Origins
     ALLOWED_ORIGINS=http://localhost:3000
     ```

   * **Frontend Configuration (`frontend/.env`):**
     Create a `.env` file in the `frontend/` directory:
     ```env
     REACT_APP_API_URL=http://localhost:8002
     ```

5. **Run the Application:**
   * **Start Backend:**
     ```bash
     cd backend
     npm run dev
     ```
   * **Start Frontend:**
     ```bash
     cd frontend
     npm start
     ```
   * Navigate to `http://localhost:3000` to view the app.
