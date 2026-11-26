# Conectify-Call: Security Audit & MERN Application Hardening

This document provides a comprehensive report of the security audit performed on the Conectify-Call video conferencing project and outlines the production-grade hardening implemented to secure the authentication, input handling, and connection architectures.

---

## 🛡️ Executive Summary of Audit & Gaps

We conducted a complete security audit of the existing manual authentication system. The table below represents the security gaps identified and the corresponding remedies applied:

| Category | Issue Found | Risk Level | Fix Implemented |
| :--- | :--- | :--- | :--- |
| **Headers & Security** | Missing HTTP Security headers (XSS, Clickjacking, MIME sniffing protection). | 🔴 **Critical** | Installed and integrated `helmet` as the primary middleware in `app.js`. |
| **CORS Configuration** | Wildcard `*` or loose CORS allowed, leaving endpoints fully exposed. | 🔴 **Critical** | Created a strict origin whitelist loaded from the environment variable (`ALLOWED_ORIGINS`). |
| **Credential Storage** | Low bcrypt salt rounds (`10` or lower used for hashing passwords). | 🔴 **Critical** | Upgraded to **`12` rounds** (current OWASP-recommended standard). |
| **Data Protection** | User passwords could easily leak in API queries and responses. | 🔴 **Critical** | Excluded `password` from the User Schema using a custom `toJSON` hook transformer, plus selective query filters. |
| **Secrets & Keys** | Placeholder JWT secrets or secrets that were too short. | 🔴 **Critical** | Added a secure startup validation checklist that terminates the process if the `JWT_ACCESS_SECRET` is less than 64 characters. |
| **Network Traffic** | API endpoint and credentials misconfigured on the frontend pointing to prod. | 🔴 **Critical** | Corrected `IS_PROD = false` and corrected a malformed HTTP protocol scheme (`http//` ➡️ `http://`). |
| **Input Validation** | Missing validation on authentication forms (possible injection/crashes). | 🟡 **High** | Integrated robust `express-validator` middleware chains on both `/login` and `/register` endpoints. |
| **Rate Limiting** | Authentication routes were vulnerable to high-speed brute-force attacks. | 🟡 **High** | Added a strict rate-limiting buffer on `/login` and `/register` (max 10 requests per 15 minutes). |
| **Information Leak** | Different messages returned for non-existent users and wrong passwords. | 🟡 **High** | Harmonized response messages to return a generic `"Invalid username or password"` to prevent username enumeration. |
| **Global Error Handling**| Application crashes returned detailed database stack traces to the client. | 🟡 **High** | Created a centralized error handler (`errorHandler.js`) that hides technical details from client responses. |

---

## 🛠️ Detailed File Changes

### 1. Backend Hardening

#### A. Centralized Error Handler (`backend/src/middleware/errorHandler.js`)
Handles Mongoose model validation, invalid Mongo IDs, unique database index constraints (like duplicate usernames), and token expiration gracefully, returning a consistent JSON structure without leaking code traces.

#### B. API Entry point (`backend/src/app.js`)
* Validates key environment variables (`PORT`, `MONGO_URI`, `JWT_ACCESS_SECRET`, `ALLOWED_ORIGINS`) on process boot.
* Integrates `helmet` to inject advanced secure headers.
* Parses and enforces `ALLOWED_ORIGINS` CORS configuration.
* Restricts system-wide traffic to `100 requests per 15 minutes`.
* Added graceful shutdown hooks (`SIGINT`, `SIGTERM`) to cleanly terminate database and sockets without abruptly dropping packets.

#### C. User Schema (`backend/src/models/user.model.js`)
* Added explicit Mongoose validation constraints (`minlength`, `maxlength`).
* Added automatic removal of `password` during serialization via a customized `toJSON` schema override hook.

#### D. Authentication Logic (`backend/src/controllers/user.controller.js`)
* Enforces validation constraints before letting traffic hit database.
* Upgraded hashing algorithm to 12-round bcrypt hashes.
* Prevented timing/enumeration attacks with unified error codes.
* Securely manages custom session token resets on user logouts.

#### E. Router Safeguards (`backend/src/routes/users.routes.js`)
* Implemented `authLimiter` allowing only **10 failed authentication actions within 15 minutes** per IP.
* Configured route hooks for both input schema validations and rates.

---

### 2. Frontend Safeguards

#### A. Central Axios Engine (`frontend/src/utils/api.js`)
* Encapsulated base configuration mapping `process.env.REACT_APP_API_URL`.
* Designed global response interceptors to automatically capture `401 Unauthorized` states, invalidate stale web tokens on the browser, and gracefully reset application context routes.

#### B. Global Session Layer (`frontend/src/contexts/AuthContext.jsx`)
* Reconfigured context loaders to support non-blocking initialization cycles (`isLoading` states), preventing rapid route blinking or layout shifts when page loads.
* Ensures invalid browser cache configurations are safely wiped if connection endpoints time out.

#### C. Higher-Order Authentication Guardian (`frontend/src/utils/withAuth.jsx`)
* Upgraded HOC route validators to read active React state properties rather than reading raw `localStorage` elements.

#### D. Interactive Forms (`frontend/src/pages/authentication.jsx`)
* Implemented submit state guards that automatically freeze buttons while server calls are active, preventing duplicate database writes.
* Added standard `autoComplete="new-password"` flags to form inputs.

---

## 📦 Required NPM Modules

To complete the backend updates, navigate to the `backend/` directory and install the new security packages:

```bash
cd backend
npm install helmet express-rate-limit express-validator morgan jsonwebtoken
```

---

## 📝 Environment Variable Checklists

Ensure your environment configurations are updated with the variables documented below:

### Backend Configuration (`backend/src/.env` & `backend/.env.example`)
```env
PORT=8002
NODE_ENV=development

# Database connection
MONGO_URI=your_mongodb_connection_string

# JWT Secret (MUST be at least 64 random hexadecimal characters)
JWT_ACCESS_SECRET=a3f8c2e1d94b7e6f0a1c3d5e7f9b2a4c6e8d0f2b4c6a8e0d2f4b6c8a0e2d4f6b8c0a2e4d6f8b0c2a4e6d8f0b2c4

JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# CORS Allowed Client Origins
ALLOWED_ORIGINS=http://localhost:3000
```

### Frontend Configuration (`frontend/.env.example`)
```env
# Root domain mapping for target API
REACT_APP_API_URL=http://localhost:8002
```
