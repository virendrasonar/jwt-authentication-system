# AuthVault

Spring Boot JWT authentication and role-based authorization app.

## Profiles

Local is the default profile:

```powershell
.\mvnw.cmd spring-boot:run
```

Production uses environment variables:

```powershell
$env:SPRING_PROFILES_ACTIVE="prod"
$env:DATABASE_URL="postgresql://username:password@host/database"
$env:JWT_SECRET="change-this-to-a-long-secret"
.\mvnw.cmd spring-boot:run
```

`DATABASE_URL` may be either `postgresql://...` or `jdbc:postgresql://...`.
If your database URL does not include credentials, also set `DB_USERNAME` and `DB_PASSWORD`.

On Render, add these environment variables to the web service:

```text
SPRING_PROFILES_ACTIVE=prod
DATABASE_URL=<your Render internal PostgreSQL URL>
JWT_SECRET=<strong secret>
```

Do not put the database URL into git-tracked properties files.
