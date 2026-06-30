# AuthVault

AuthVault is a full-stack authentication and authorization demo built with Spring Boot, Spring Security, JWT, and a responsive HTML/CSS/JavaScript frontend.

> **Student demo project:** Do not enter real passwords, banking details, or personal information. AuthVault is not affiliated with any company or real service.

- **Live application:** [Open AuthVault](https://jwt-authentication-system-production.up.railway.app/login.html)
- **Create a demo account:** [Sign up](https://jwt-authentication-system-production.up.railway.app/signup.html)

## Project Overview

AuthVault demonstrates a production-style authentication flow in a compact portfolio project. It combines short-lived JWT access tokens, database-backed refresh tokens, BCrypt password hashing, role-based access control, admin user management, and password recovery.

Spring Boot serves both the frontend and REST API. Frontend requests use the page's current origin, so the same build works at `http://localhost:8080` and on Railway without hardcoded API hosts.

Users can create an account, sign in, and view their own dashboard. Administrators receive the same dashboard plus tools to list, create, update, and delete user accounts within enforced safety rules.

## Features

- Registration and login with validated credentials
- BCrypt password hashing
- HS256 JWT access tokens containing email and role claims
- Database-backed refresh tokens with a 7-day lifetime
- `USER` and `ADMIN` role-based authorization
- Personal dashboard for authenticated users
- Admin user listing, creation, role updates, and deletion
- Admin password visibility toggle when creating users
- Admin editing limited to user name and role, never passwords
- Protection against deleting the active admin or removing the final admin
- Forgot-password flow with 15-minute, one-time reset tokens
- Prevention of password resets that reuse the current password
- Refresh-session invalidation after successful password reset
- Same-origin API configuration for local and Railway environments
- Responsive layouts for desktop, tablet, and mobile
- MySQL locally, PostgreSQL in production, and H2 for tests

## Screenshots

### Login

![Login](docs/images/login.png)

### Dashboard

![Dashboard](docs/images/dashboard.png)

### Admin Panel

![Admin Panel](docs/images/admin.png)

## Tech Stack

| Area | Technology |
| --- | --- |
| Language | Java 17 |
| Backend | Spring Boot 3.5, Spring Web |
| Security | Spring Security, JJWT 0.11.5, BCrypt |
| Persistence | Spring Data JPA, Hibernate |
| Validation | Jakarta Bean Validation |
| Local database | MySQL 8 |
| Production database | PostgreSQL on Railway |
| Test database | H2 |
| Frontend | HTML, CSS, vanilla JavaScript |
| Build | Maven Wrapper |

## Architecture Overview

```mermaid
flowchart LR
    Browser["Responsive web frontend"] -->|"Public authentication requests"| Auth["/auth/**"]
    Browser -->|"Bearer JWT"| Dashboard["/dashboard"]
    Browser -->|"Bearer ADMIN JWT"| Admin["/admin/**"]
    Auth --> Services["Application services"]
    Dashboard --> Services
    Admin --> Services
    Services --> JPA["Spring Data JPA"]
    JPA --> DB["MySQL / PostgreSQL"]
```

### Runtime Layers

- **Frontend:** Static pages and JavaScript served by Spring Boot.
- **Controllers:** Authentication, dashboard, and admin REST endpoints.
- **Security:** Stateless filter chain plus `JwtFilter` for bearer-token authentication.
- **Services:** Authentication, refresh-token, and password-reset business logic.
- **Persistence:** JPA repositories for users, refresh tokens, and reset tokens.
- **Profiles:** MySQL for `local`, H2 for `test`, PostgreSQL for `prod`.

`api-config.js` builds API URLs from `window.location.origin`. Local pages call the local backend, while deployed pages call the Railway service that served them.

## Authentication & Authorization Flow

1. A user registers or submits credentials to `/auth/login`.
2. The backend verifies the password against its BCrypt hash.
3. The backend returns a signed access token, refresh token, and basic user details.
4. The frontend stores tokens in `localStorage` for this demonstration project.
5. Protected requests send `Authorization: Bearer <accessToken>`.
6. `JwtFilter` validates the JWT, extracts the email and role, and creates the Spring Security context.
7. Spring Security permits authenticated dashboard requests and requires `ROLE_ADMIN` for `/admin/**`.

### Token Behavior

| Token | Storage | Lifetime | Purpose |
| --- | --- | --- | --- |
| Access token | Browser `localStorage` | 15 minutes by default | Authenticate protected API requests |
| Refresh token | Browser and database | 7 days | Issue a new access token |
| Reset token | Database and reset URL | 15 minutes | Authorize one password reset |

Access tokens are signed with HS256 and include `sub` (email), `role`, `iat`, and `exp` claims. Login and registration replace older refresh tokens for the user. Logout removes refresh sessions.

### Roles

| Capability | USER | ADMIN |
| --- | :---: | :---: |
| Register and login | Yes | Yes |
| View own dashboard | Yes | Yes |
| List and view users | No | Yes |
| Create users | No | Yes |
| Update user name and role | No | Yes |
| Delete users | No | Yes |
| Edit passwords from admin panel | No | No |

Normal users do not see the admin panel. Attempting to open the Users section displays an administrator-access message.

## Security Features

- Passwords are stored as BCrypt hashes and never compared as plain text.
- Security is stateless; HTTP Basic is disabled.
- JWT signatures and expiry times are validated on protected requests.
- `/dashboard` requires authentication and `/admin/**` requires `ADMIN` authority.
- The dashboard page shell is public because browser navigation cannot attach a bearer header; its data comes from the protected dashboard API.
- Admins cannot delete their own active account.
- The final admin cannot be deleted or demoted.
- Admins cannot change their own role while logged in.
- Admin updates accept name and role only, not email or password.
- Deleting a user also deletes related refresh and reset tokens.
- Reset tokens expire after 15 minutes and older tokens are replaced.
- A reset request using the current password is rejected without consuming the token.
- A successful reset deletes the used token and all previous refresh sessions.
- CORS uses an explicit, environment-configurable origin allowlist.

### Password Rules

Passwords must be 8 to 20 characters and contain an uppercase letter, lowercase letter, number, and special character. Names must be 3 to 50 characters and contain only letters and spaces.

### Public And Protected Routes

| Access | Routes |
| --- | --- |
| Public | `/`, auth pages, `/dashboard.html` shell, `/auth/**`, static assets |
| Authenticated | `/dashboard` and any backend route not explicitly public |
| ADMIN only | `/admin/**` |

## Project Structure

```text
src/
|-- main/
|   |-- java/com/auth/authproject/
|   |   |-- config/       Security, CORS, admin bootstrap, production datasource
|   |   |-- controller/   Authentication, dashboard, and admin endpoints
|   |   |-- dto/          Request/response models and validation
|   |   |-- entity/       User, refresh-token, and reset-token entities
|   |   |-- exception/    Consistent API error responses
|   |   |-- repository/   Spring Data JPA repositories
|   |   |-- security/     JWT service and request filter
|   |   `-- service/      Authentication and token business logic
|   `-- resources/
|       |-- static/       Frontend pages, styles, and JavaScript
|       |-- application.properties
|       |-- application-local.properties
|       `-- application-prod.properties
`-- test/
    |-- java/             Spring Boot tests
    `-- resources/        H2 test profile
```

## Local Development

### Prerequisites

- Java 17 or newer
- MySQL 8 listening on port `3306`
- PowerShell or another terminal

### 1. Create The MySQL Database

Hibernate creates and updates tables, but it does not create the database itself.

```sql
CREATE DATABASE jwt_auth_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

### 2. Configure Local MySQL

Update `src/main/resources/application-local.properties` for your installation:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/jwt_auth_db
spring.datasource.username=root
spring.datasource.password=<your-local-mysql-password>
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
spring.jpa.hibernate.ddl-auto=update
spring.jpa.database-platform=org.hibernate.dialect.MySQLDialect
```

Do not commit or publish real database credentials.

### 3. Configure A Local Admin

The project has no permanent hardcoded admin password. Set demo environment variables before startup:

```powershell
$env:ADMIN_NAME="Admin"
$env:ADMIN_EMAIL="admin@example.com"
$env:ADMIN_PASSWORD="Admin@123"
```

`AdminBootstrapConfig` creates or updates this account at startup and stores the password as a BCrypt hash. Do not reuse demo credentials in production.

### 4. Run

The default profile is `local`:

```powershell
.\mvnw.cmd spring-boot:run
```

Open [http://localhost:8080/login.html](http://localhost:8080/login.html).

## Production Deployment (Railway)

**Live deployment:** [https://jwt-authentication-system-production.up.railway.app](https://jwt-authentication-system-production.up.railway.app/login.html)

1. Create a Railway service from this repository.
2. Provision a Railway PostgreSQL database.
3. Add the environment variables listed below.
4. Set `SPRING_PROFILES_ACTIVE=prod`.
5. Deploy the Spring Boot application.

Railway supplies `PORT` automatically. The application uses Railway's value and falls back to port `8080` locally.

`ProductionDataSourceConfig` accepts a standard PostgreSQL URL, converts it to JDBC format when necessary, and configures the PostgreSQL driver. Supported URL forms are:

```text
postgresql://username:password@host:5432/database
jdbc:postgresql://host:5432/database
```

The frontend and API are served by the same Railway service, so normal production requests are same-origin.

## Environment Variables

| Variable | Required In Production | Default | Purpose |
| --- | :---: | --- | --- |
| `SPRING_PROFILES_ACTIVE` | Yes | `local` | Select `local`, `test`, or `prod` configuration |
| `DATABASE_URL` | Yes | None | Railway PostgreSQL URL |
| `JWT_SECRET` | Yes | Development-only fallback | HMAC signing key; use at least 32 random bytes |
| `JWT_EXPIRATION` | No | `900000` | Access-token lifetime in milliseconds |
| `ADMIN_NAME` | No | `Admin` | Bootstrapped admin display name |
| `ADMIN_EMAIL` | For bootstrap | Empty | Bootstrapped admin email |
| `ADMIN_PASSWORD` | For bootstrap | Empty | Bootstrapped admin password |
| `DB_USERNAME` | No | Parsed from URL | Optional PostgreSQL username override |
| `DB_PASSWORD` | No | Parsed from URL | Optional PostgreSQL password override |
| `CORS_ALLOWED_ORIGINS` | No | Railway application origin | Comma-separated allowed frontend origins |
| `PORT` | Supplied by Railway | `8080` | HTTP server port |

The production admin is created or updated only when both `ADMIN_EMAIL` and `ADMIN_PASSWORD` are present.

## Database

| Table | Important Fields | Purpose |
| --- | --- | --- |
| `users` | `email`, BCrypt `password`, `role`, timestamps | User identities and authorization roles |
| `refresh_tokens` | UUID `token`, `expiry_date`, `user_id` | Persistent refresh sessions |
| `password_reset_tokens` | UUID `token`, `expiry_date`, `user_id`, compatibility status fields | Temporary password-reset authorization |

Relationships use user foreign keys. User deletion cleans up associated token records before deleting the account. Hibernate uses `ddl-auto=update` in the application configuration.

### Profiles

| Profile | Database | Use |
| --- | --- | --- |
| `local` | MySQL | Local development |
| `test` | In-memory H2 | Automated tests |
| `prod` | PostgreSQL | Railway deployment |

The default selection is:

```properties
spring.profiles.active=${SPRING_PROFILES_ACTIVE:local}
```

## API Overview

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | Public | Register a `USER` account |
| `POST` | `/auth/login` | Public | Authenticate and issue tokens |
| `POST` | `/auth/refresh` | Public with refresh token | Issue a new access token |
| `POST` | `/auth/logout` | Public with refresh token | Delete refresh sessions |
| `POST` | `/auth/forgot-password` | Public | Generate a 15-minute reset token |
| `POST` | `/auth/reset-password` | Public with reset token | Set a different password |
| `GET` | `/dashboard` | Authenticated | Return the current user's dashboard data |
| `GET` | `/admin/users` | ADMIN | List users |
| `GET` | `/admin/users/{id}` | ADMIN | Get one user |
| `POST` | `/admin/users` | ADMIN | Create a user |
| `PUT` | `/admin/users/{id}` | ADMIN | Update name and role |
| `DELETE` | `/admin/users/{id}` | ADMIN | Delete a user and token records |

Detailed payloads, responses, validation rules, and examples are available in [docs/API.md](docs/API.md).

## Build & Test

Run the test suite:

```powershell
.\mvnw.cmd test
```

Build the executable JAR:

```powershell
.\mvnw.cmd clean package
```

The packaged application is written to `target/`.

## Security Notes

- Use a long, random `JWT_SECRET` in production; never use the development fallback.
- Do not use local demo admin credentials in production.
- Never commit database URLs, passwords, reset tokens, or JWT secrets.
- Keep production traffic on HTTPS.
- The demo returns reset links in API responses. A real application should deliver links through a verified email provider without exposing raw tokens in general UI.
- `localStorage` keeps this demo easy to inspect. A hardened system should consider secure HTTP-only cookies and appropriate CSRF protection.
- Production hardening should also include rate limiting, account lockout controls, a strict Content Security Policy, secret rotation, and security-event monitoring.
- AuthVault intentionally displays student-demo and test-credential warnings to avoid being mistaken for a real service.

## Future Improvements

- Docker Compose support for the application and local MySQL
- Email delivery for password-reset links
- OAuth2 or OpenID Connect login
- User profile management
- Authentication rate limiting and lockout policies
- Structured audit logging
- Expanded unit, integration, and security test coverage

These are roadmap ideas and are not implemented in the current project.

## License

This repository is intended for learning and portfolio demonstration. Add a license file before redistributing it under specific license terms.
