# Association Member Management System

A high-fidelity, secure Member Management System built using the MERN stack (MongoDB, Express, React, Node.js). The system supports dynamic roles and permissions, strict Sri Lankan application form validations, automatic unique membership ID generation, request logging, and a comprehensive audit trail.

---

## 📽️ Demo Video
- **Google Drive Demo Video**: [Watch Demo Video](https://drive.google.com/open?id=YOUR_DEMO_VIDEO_LINK)

---

## 🛠️ Tech Stack
- **Backend**: Node.js (ES Modules), Express.js, Mongoose, JWT, Bcrypt.
- **Frontend**: React (Vite), Lucide-React, custom premium Vanilla CSS (no CSS framework, fully styled for visual excellence).

---

## 🔑 Environment Variables

Create a `.env` file in the `server` directory with the following variables:
```env
PORT=5000
MONGODB_URI="your_mongodb_connection_string"
JWT_SECRET="your_jwt_secret_key"
```

---

## 🚀 Getting Started & Setup Steps

### 1. Install Dependencies
Run the install command in both the `server` and `client` directories:
```bash
# Install backend packages
cd server
npm install

# Install frontend packages
cd ../client
npm install
```

### 2. Database Seeding (F-14)
Seed the permissions list, the System Chairman account, and the 3 membership types:
```bash
cd ../server
npm run seed
```

**Seeded Chairman Credentials:**
- **Email**: `chairman@association.com`
- **Password**: `ChairmanSecurePassword123!`

**Seeded Membership Plans:**
1. **Individual Standard**: LKR 1,500 / year (applicable to INDIVIDUAL)
2. **Individual Premium**: LKR 5,000 / year (applicable to INDIVIDUAL)
3. **Corporate Gold**: LKR 15,000 / year (applicable to COMPANY)

### 3. Run Backend Server
```bash
# Development (with nodemon hot-reload)
npm run dev

# Production mode
npm start
```
The server will start on port `5000`.

### 4. Run Frontend Client
```bash
cd ../client
npm run dev
```
The client will start on port `3000` (proxied to backend API on port `5000`).

---

## 🧪 Running Unit Tests
We have implemented comprehensive unit tests for the authorization middleware. You can execute them with Node's native zero-dependency test runner:
```bash
cd server
npm run test
```

---

## 🛡️ How the Permission Check Works

The system utilizes a custom permission check middleware ([auth.js](file:///d:/yv-intern-assessment-savin-udana/server/middleware/auth.js)) to enforce secure endpoint routing.

1. **Authentication Interception**: The `protect` middleware extracts the JWT token from the `Authorization` request header, decrypts it, retrieves the corresponding `User` document, populates their assigned role (`officerRoleId`), and attaches the user model to the `req.user` request object.
2. **Middleware Evaluation**: The `checkPermission(permissionKey)` higher-order function checks the user's scope:
   - **System Chairman**: Bypasses restriction validation immediately (`userType === 'CHAIRMAN'`) and has all-access.
   - **Officer Staff**: Verifies if their loaded role object (`officerRoleId.permissions` array) contains the exact lowercase permission key requested (e.g. `application.view`, `member.view`). If yes, the request continues via `next()`. If missing, it returns a `403 Forbidden` response.
   - **Members / Guests**: Denied administrative access immediately (returns `403 Forbidden`).

---

## ✨ Features Checklist

### Completed Features
- **Security & Password Hashing**: Hashed passwords using Pre-save hooks with Bcrypt.
- **Validation**: Strict Sri Lankan NIC, phone, and address validation limits.
- **Database Seeding**: Automated script to seed Chairman, permissions, and plans.
- **Access Control & Permissions**: Dynamic roles configuration, permission alignment, and middleware checks.
- **Audit Logs**: Comprehensive logs tracking approvals, rejections, and role creations.
- **Logging (Requirement)**: Real-time, color-coded console logger tracing route timings, statuses, warnings, and error stacks.
- **Database Indexing (Requirement)**: Added database indexes on `status` and `email` on MemberApplication and `status` on Membership to optimize search speeds.
- **Bonus - Unit Tests**: Custom unit tests verifying status code returns (`401`, `403`, `200`) for the middleware.
- **Bonus - Export CSV**: Downloads the full registry in standard CSV format with cells safely escaped.
- **Bonus - Dashboard Metrics**: Staff panel showing total members, pending apps, and monthly approvals.

### Incomplete Features
- None

### Known Issues
- None