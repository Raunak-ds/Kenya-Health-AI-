# Authentication & Role-Based Access Control

The Kenya Crop Health Management Platform implements a zero-trust, role-based authentication system ensuring data confidentiality and security.

---

## 1. User Roles

| Role | Intended User | Key Capabilities |
| :--- | :--- | :--- |
| `farmer` | Smallholder & commercial crop growers | Register farms and plots, upload leaf scans, receive KALRO-aligned advice, track follow-ups, submit feedback. |
| `extension_officer` | Sub-County Agronomists, County Extension Staff | Access expert review queue, validate/correct AI predictions, add field notes, view county surveillance data. |
| `admin` | System & Ag-Tech Platform Administrators | View system analytics, inspect model provenance, manage user accounts, review full disease surveillance maps. |

---

## 2. Password Security
- Passwords are **never stored in plaintext**.
- Hashing is performed using **bcrypt** with a work factor of 12 rounds (`gensalt(rounds=12)`).
- Minimum password length: 8 characters.

---

## 3. JWT Token Architecture
- Authentication generates JSON Web Tokens (JWT) signed with `HS256`.
- Token payload contains:
  - `sub`: User UUID
  - `exp`: Expiration timestamp (configurable via `ACCESS_TOKEN_EXPIRE_MINUTES`, default 7 days).
- Tokens are transmitted via HTTP standard `Authorization: Bearer <token>` headers.
- FastAPI dependency `get_current_user` extracts and validates the token on protected routes.
- Role gates:
  - `get_current_active_farmer`: standard authenticated users
  - `get_extension_or_admin`: extension officers and administrators
  - `get_admin_user`: platform administrators only

---

## 4. Endpoints
- `POST /api/v1/auth/register` : User registration
- `POST /api/v1/auth/login` : Issue JWT bearer token
- `GET /api/v1/auth/me` : Retrieve current user profile
- `PUT /api/v1/auth/me` : Update profile details
- `POST /api/v1/auth/me/change-password` : Verify current password and update
