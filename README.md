# Association Member Management System

A high-fidelity, secure Member Management System built using the MERN stack (MongoDB, Express, React, Node.js). The system supports dynamic roles and permissions, strict Sri Lankan application form validations, automatic unique membership ID generation, and a comprehensive audit trail.

## Tech Stack
- **Backend**: Node.js (ES Modules), Express.js, Mongoose, JWT, Bcrypt.
- **Frontend**: React (Vite), Lucide-React, custom premium Vanilla CSS (no CSS framework, fully styled for visual excellence).

---

## Getting Started

### 1. Database Seeding (F-14)
Run the seed script to automatically create the **System Chairman** account, seed the **permissions list**, and initialize the **3 membership types**:
```bash
cd server
npm run seed
```
**Seeded Chairman Credentials:**
- **Email**: `chairman@association.com`
- **Password**: `ChairmanSecurePassword123!`

**Seeded Membership Plans:**
1. **Individual Standard**: LKR 1,500 / year (applicable to INDIVIDUAL)
2. **Individual Premium**: LKR 5,000 / year (applicable to INDIVIDUAL)
3. **Corporate Gold**: LKR 15,000 / year (applicable to COMPANY)

### 2. Run Backend Dev Server
Starts the Express server on port 5000, listening for client requests:
```bash
cd server
npm run dev
```

### 3. Run Frontend Client
Installs packages and runs the Vite client on port 3000 (proxied to port 5000):
```bash
cd client
npm install
npm run dev
```

---

## Schema Adaptations & Database Collections

We adapted the Mongoose schemas to align with the requested key fields and relationships:

### 1. `users` Collection
- `fullName`: (String, required) - Registered name of user.
- `email`: (String, unique, required) - Credentials username.
- `passwordHash`: (String, required) - Hashed password (raw input is hashed via pre-save hooks).
- `userType`: (`CHAIRMAN` | `OFFICER` | `MEMBER`) - General user classification.
- `officerRoleId`: (ObjectId referencing `OfficerRole`, nullable) - Reference to staff role permissions.
- `isActive`: (Boolean) - Account active status flag.

### 2. `memberApplications` Collection
- `userId`: (ObjectId referencing `users`) - Reference to the member who applied.
- `applicantType`: (`INDIVIDUAL` | `COMPANY`) - Registrant type.
- `fullName`: (String) - Applicant name (if Individual).
- `companyName`: (String) - Corporation name (if Company).
- `nic`: (String) - Sri Lankan National Identity Card number (if Individual).
- `registrationNo`: (String) - Business registration number (if Company).
- `email`: (String) - Email address associated with application (unique per application).
- `phone`: (String) - Sri Lankan phone number (formatted like `0771234567` or `+94771234567`).
- `address`: (String, max 250 characters).
- `membershipTypeId`: (ObjectId referencing `membershipTypes`).
- `status`: (`PENDING` | `APPROVED` | `REJECTED`).
- `rejectionReason`: (String, nullable) - Required on rejection.
- `reviewedBy`: (ObjectId referencing `users`, nullable) - Reviewing Officer/Chairman.
- `reviewedAt`: (Date, nullable) - Review timestamp.

### 3. `memberships` Collection
- `userId`: (ObjectId referencing `users`) - Associated member.
- `applicationId`: (ObjectId referencing `memberApplications`).
- `membershipNumber`: (String, unique) - Auto-generated upon approval (format: `MEM-YYYY-XXXXX`).
- `membershipTypeId`: (ObjectId referencing `membershipTypes`).
- `status`: (`ACTIVE` | `EXPIRED`).
- `startDate`: (Date) - Approval date.
- `endDate`: (Date) - Expiration date (1 year standard annual duration).

### 4. `membershipTypes` Collection
- `name`: (String) - Plan title.
- `applicableTo`: (`INDIVIDUAL` | `COMPANY`) - Filter mapping.
- `annualFee`: (Number) - Cost in LKR.
- `isActive`: (Boolean).

### 5. `officerRoles` Collection
- `name`: (String, unique) - Role title.
- `description`: (String).
- `permissions`: (Array of Strings) - List of assigned permission keys.
- `createdBy`: (ObjectId referencing `users`).

### 6. `auditLogs` Collection
- `actorUserId`: (ObjectId referencing `users`) - Staff who triggered the mutation.
- `action`: (String) - The type of action performed.
- `entityType`: (String) - Class of mutated entity.
- `entityId`: (ObjectId) - ID of mutated record.
- `details`: (Mixed/Object) - Metadata.
- `ipAddress`: (String) - Remote host address.
- `createdAt`: (Date) - Mutation log timestamp.

---

## Permission Keys and Enforcement (F-12)

The system enforces authorization rules at both backend (Express middlewares checking keys on requests) and frontend (React components checking permissions arrays to hide actions).

| Permission Key | Action Allowed |
| :--- | :--- |
| `member.view` | Access members directory search and pagination list |
| `application.view` | View incoming membership applications with status filters |
| `application.approve` | Approve a pending application (creates a unique membership record) |
| `application.reject` | Reject a pending application (requests a rejection reason) |
| `role.manage` | Create officer roles, change permissions, and assign roles to users |
| `audit.view` | View the global system audit log trail |

- The **Chairman** bypasses permission checks (has all-access).
- **Officers** only have effective access to resources matching keys ticked in their assigned `officerRoleId`.
- **Members** have standard client access (can submit application, check status, and view active digital membership card).