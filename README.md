# AuthVault

AuthVault is a Spring Boot authentication and authorization project with JWT access tokens, refresh tokens, role-based access control, admin user management, and a small HTML/CSS/JavaScript frontend.

The app is built as a demo user-management system:

- Normal users can register, log in, and view their own dashboard.
- Admin users can view users, create users, edit user name/role, and delete users.
- Admins cannot remove the last admin account.
- Admins cannot delete their own logged-in account.
- Admins cannot change their own role from the admin panel.
- Passwords are stored with BCrypt, never as plain text.

## What JWT Does In This App

JWT is used to protect backend APIs without server-side HTTP sessions.

When a user logs in through `/auth/login`, the backend checks the email and password. If they are valid, the backend returns:

- `accessToken`: a signed JWT used in the `Authorization` header.
- `refreshToken`: a database-stored token used to request a new access token.
- User details such as id, name, email, and role.

The JWT contains:

- `sub`: the user's email address.
- `role`: the user's role, such as `USER` or `ADMIN`.
- `iat`: token issued time.
- `exp`: token expiry time.

The JWT is signed with HS256 using `JWT_SECRET`. A client must send the access token like this:

```http
Authorization: Bearer <accessToken>
```

For every protected request, `JwtFilter` reads that header, validates the token signature and expiry, extracts the email and role, and places the authenticated user into Spring Security's context. Spring Security then decides whether the request is allowed.

## Authorization Rules

Public routes:

- `/`
- `/login.html`
- `/signup.html`
- `/auth/**`
- Static HTML, CSS, and JavaScript files

Authenticated routes:

- `/dashboard`
- Any other backend route not explicitly public or admin-only

Admin-only routes:

- `/admin/**`

Admin authorization works through the role claim in the JWT. If the token has role `ADMIN`, the filter creates the authority `ROLE_ADMIN`, so Spring Security allows access to `/admin/**`.

## Main Features

### Authentication

- Register new users with `/auth/register`.
- Login with `/auth/login`.
- Passwords are hashed using BCrypt.
- The default role for self-registered users is `USER`.

### Refresh Tokens

- Refresh tokens are random UUID values stored in the database.
- Refresh tokens expire after 7 days.
- On login/register, old refresh tokens for that user are removed and a new one is created.
- `/auth/refresh` returns a new JWT access token when the refresh token is valid.
- `/auth/logout` removes the user's refresh tokens.

### Role-Based Access

- `USER` can access their own dashboard.
- `ADMIN` can access the dashboard and admin user APIs.
- Admin user APIs are blocked for normal users.

### Admin User Management

Admins can:

- List all users.
- Create a user with a role.
- Edit a user's name.
- Edit a user's role.
- Delete users.

Admins cannot:

- Edit a user's password from the admin panel.
- Delete their own logged-in account.
- Remove the last remaining admin.
- Change their own admin role while logged in.

### Forgot Password

- `/auth/forgot-password` creates a short-lived reset token.
- Reset tokens expire after 15 minutes.
- Creating a new reset token removes older reset tokens for that user.
- `/auth/reset-password` updates the password and deletes old refresh tokens so previous sessions cannot continue.

## API Endpoints

### Auth

```http
POST /auth/register
```

```json
{
  "name": "Normal User",
  "email": "user@example.com",
  "password": "User@1234"
}
```

```http
POST /auth/login
```

```json
{
  "email": "user@example.com",
  "password": "User@1234"
}
```

```http
POST /auth/refresh
```

```json
{
  "refreshToken": "<refreshToken>"
}
```

```http
POST /auth/logout
```

```json
{
  "refreshToken": "<refreshToken>"
}
```

```http
POST /auth/forgot-password
```

```json
{
  "email": "user@example.com"
}
```

```http
POST /auth/reset-password
```

```json
{
  "token": "<resetToken>",
  "password": "NewPassword@123"
}
```

### Dashboard

Requires a valid JWT:

```http
GET /dashboard
Authorization: Bearer <accessToken>
```

Returns the logged-in user's dashboard information.

### Admin Users

Requires an admin JWT:

```http
GET /admin/users
Authorization: Bearer <adminAccessToken>
```

```http
GET /admin/users/{id}
Authorization: Bearer <adminAccessToken>
```

```http
POST /admin/users
Authorization: Bearer <adminAccessToken>
Content-Type: application/json
```

```json
{
  "name": "Team Member",
  "email": "member@example.com",
  "password": "Member@1234",
  "role": "USER"
}
```

```http
PUT /admin/users/{id}
Authorization: Bearer <adminAccessToken>
Content-Type: application/json
```

```json
{
  "name": "Updated Name",
  "role": "ADMIN"
}
```

```http
DELETE /admin/users/{id}
Authorization: Bearer <adminAccessToken>
```

## Frontend Pages

- `/login.html`
- `/signup.html`
- `/dashboard.html`
- `/forgot-password.html`
- `/reset-password.html`

The frontend resolves API paths through `api-config.js`, which currently targets the Railway deployment.

## Local Development

Local is the default profile. It uses the MySQL database `jwt_auth_db` on port `3306`.

```powershell
.\mvnw.cmd spring-boot:run
```

Open:

```text
https://jwt-authentication-system-production.up.railway.app/login.html
```

To create a local admin automatically, run with admin environment variables:

```powershell
$env:ADMIN_NAME="Admin"
$env:ADMIN_EMAIL="admin@example.com"
$env:ADMIN_PASSWORD="Admin@123"
.\mvnw.cmd spring-boot:run
```

The admin bootstrap runs on startup. If `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set, the app creates or updates that admin account.

## Production Deployment

Production should use the `prod` profile and PostgreSQL.

Required Railway environment variables:

```text
SPRING_PROFILES_ACTIVE=prod
DATABASE_URL=<your Railway PostgreSQL URL>
JWT_SECRET=<strong long secret>
ADMIN_NAME=Admin
ADMIN_EMAIL=<your admin email>
ADMIN_PASSWORD=<your admin password>
```

Optional environment variables:

```text
JWT_EXPIRATION=900000
DB_USERNAME=<database username if not included in DATABASE_URL>
DB_PASSWORD=<database password if not included in DATABASE_URL>
```

`JWT_EXPIRATION` is in milliseconds. The default is `900000`, which is 15 minutes.

`DATABASE_URL` may be either:

```text
postgresql://username:password@host/database
```

or:

```text
jdbc:postgresql://host:5432/database
```

Do not commit real database URLs, passwords, or JWT secrets into git.

## Production Admin Password

The production admin password is not hardcoded in the code. It comes from:

```text
ADMIN_PASSWORD
```

The admin email comes from:

```text
ADMIN_EMAIL
```

If these are missing, the app will not seed an admin account. If they are present, `AdminBootstrapConfig` creates or updates that admin user on startup and stores the password as a BCrypt hash.

## Important Security Notes

- Use a long random `JWT_SECRET` in production.
- Do not use the default development JWT secret in production.
- Use HTTPS in production.
- Do not store real secrets in `application.properties`.
- Do not expose the PostgreSQL internal URL in the frontend.
- The current password reset implementation generates the reset link in the API response. That is useful for a demo, but a real production app should email the reset link instead.
- The frontend stores tokens in `localStorage`. That is simple for a demo, but a hardened production app should consider secure, HTTP-only cookies and stricter CSRF/CORS handling.

## Running Tests

```powershell
.\mvnw.cmd test
```

## Tech Stack

- Java 17
- Spring Boot 3.5
- Spring Security
- Spring Data JPA
- JWT with `jjwt`
- BCrypt password hashing
- MySQL for local development
- H2 for automated tests
- PostgreSQL for production
- HTML, CSS, and JavaScript frontend
