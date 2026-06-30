# AuthVault API Reference

This document contains request and response examples for the AuthVault REST API. For architecture, setup, deployment, and security details, see the main [README](../README.md).

## Base URLs

```text
Local:      http://localhost:8080
Production: https://jwt-authentication-system-production.up.railway.app
```

Frontend code uses same-origin URLs through `api-config.js`.

## Authentication

Send the access token on protected requests:

```http
Authorization: Bearer <accessToken>
```

- `/dashboard` requires a valid JWT.
- `/admin/**` requires a valid JWT containing the `ADMIN` role.
- Authentication endpoints are public but validate their request tokens or credentials.

## Validation

### Names

- Required
- 3 to 50 characters
- Letters and spaces only

### Passwords

- Required for registration, reset, and admin-created users
- 8 to 20 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### Error Responses

Runtime errors return HTTP `400` with a message:

```json
{
  "timestamp": "2026-06-30T12:00:00Z",
  "message": "Example error message",
  "status": 400
}
```

Bean-validation errors return field messages:

```json
{
  "timestamp": "2026-06-30T12:00:00Z",
  "status": 400,
  "errors": {
    "email": "Invalid email format"
  }
}
```

## Authentication Endpoints

### Register

```http
POST /auth/register
Content-Type: application/json
```

```json
{
  "name": "Demo User",
  "email": "demo.user@example.com",
  "password": "Demo@1234"
}
```

Returns HTTP `201` and an authentication response. Self-registration always creates a `USER` account.

```json
{
  "accessToken": "<jwt>",
  "refreshToken": "<uuid>",
  "userId": 1,
  "name": "Demo User",
  "email": "demo.user@example.com",
  "role": "USER"
}
```

### Login

```http
POST /auth/login
Content-Type: application/json
```

```json
{
  "email": "demo.user@example.com",
  "password": "Demo@1234"
}
```

Returns HTTP `200` with the same authentication response shape as registration. Login replaces older refresh tokens for the user.

### Refresh Access Token

```http
POST /auth/refresh
Content-Type: application/json
```

```json
{
  "refreshToken": "<refreshToken>"
}
```

Returns a new access token while preserving the valid refresh token.

### Logout

```http
POST /auth/logout
Content-Type: application/json
```

```json
{
  "refreshToken": "<refreshToken>"
}
```

Returns:

```text
Logged out successfully
```

The user's stored refresh tokens are removed.

## Password Reset Endpoints

### Request Reset Link

```http
POST /auth/forgot-password
Content-Type: application/json
```

```json
{
  "email": "demo.user@example.com"
}
```

The demo response contains the raw reset token and a frontend URL:

```json
{
  "message": "Password reset link generated. It expires in 15 minutes.",
  "resetToken": "<uuid>",
  "resetUrl": "/reset-password.html?token=<uuid>"
}
```

Requesting another link deletes the older token for that user.

### Reset Password

```http
POST /auth/reset-password
Content-Type: application/json
```

```json
{
  "token": "<resetToken>",
  "password": "NewDemo@1234"
}
```

If the new password matches the current BCrypt hash, the backend returns HTTP `400`:

```json
{
  "message": "Please enter a new password different from your current password.",
  "status": 400
}
```

The password and sessions remain unchanged, and the reset token remains valid for another attempt.

A successful reset returns:

```text
Password reset successfully
```

The backend updates the BCrypt hash, deletes old refresh sessions, and deletes the used reset token.

## Dashboard Endpoint

```http
GET /dashboard
Authorization: Bearer <accessToken>
```

Example response:

```json
{
  "id": 1,
  "name": "Demo User",
  "email": "demo.user@example.com",
  "role": "USER",
  "message": "Welcome to your dashboard."
}
```

## Admin User Endpoints

Every endpoint in this section requires an `ADMIN` access token.

### List Users

```http
GET /admin/users
Authorization: Bearer <adminAccessToken>
```

Example response:

```json
[
  {
    "id": 1,
    "name": "Admin",
    "email": "admin@example.com",
    "role": "ADMIN",
    "createdAt": "2026-06-30T12:00:00Z",
    "updatedAt": "2026-06-30T12:00:00Z"
  }
]
```

### Get User

```http
GET /admin/users/{id}
Authorization: Bearer <adminAccessToken>
```

Returns one user using the same response fields as the list endpoint.

### Create User

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

Returns HTTP `201` with the created user. The role must be `USER` or `ADMIN`.

### Update User

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

Only the name and role are accepted. The admin API intentionally does not expose email or password editing.

Safety rules:

- The logged-in admin cannot change their own role.
- The final admin cannot be demoted.

### Delete User

```http
DELETE /admin/users/{id}
Authorization: Bearer <adminAccessToken>
```

Returns HTTP `204` with no body.

Safety rules:

- The logged-in admin cannot delete their own account.
- The final admin cannot be deleted.
- Related refresh and password-reset tokens are deleted first.
