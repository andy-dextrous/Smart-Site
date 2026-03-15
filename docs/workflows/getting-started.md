# Getting Started

## Prerequisites

- Node.js 20+
- pnpm
- MongoDB Community for local development, bundled Docker Mongo for self-hosted deployments, or MongoDB Atlas for hosted deployments
- local storage, Cloudinary, S3-compatible storage, or Vercel Blob

## Project setup

```bash
git clone <your-repo-url>
cd <your-site-folder>
pnpm install
```

Run the interactive bootstrap from the project root:

```bash
npx smartsite init --project .
```

The wizard copies `.env.example` to `.env`, generates secrets, collects database and storage details, optionally seeds baseline data for a fresh local install, and can leave the dev server running.

## Environment configuration

Smart Site supports two first-class deployment shapes:

- hosted: Vercel or another Node host, MongoDB Atlas, and optional managed media storage
- self-hosted Mongo: Dockerized Smart Site app plus Dockerized MongoDB on the same VPS

Local values remain available for offline development.

## Database setup

Smart Site runs on MongoDB in every environment.

- local development uses MongoDB Community
- hosted deployments use Atlas or another managed MongoDB service
- self-hosted deployments use the SmartSite self-hosted workflow documented in [deployment.md](deployment.md)

## AI backend

AI features connect to the managed Smart Site AI platform operated by Wild Creative after approval.

Source: [source-manuscript-readme.md](../references/source-manuscript-readme.md)

## 🚀 Installation & Getting Started

### Prerequisites

- **Node.js 20+**
- **pnpm** (preferred package manager)
- **Database**: MongoDB Community (local via Homebrew), bundled Docker Mongo for self-hosted deployments, or MongoDB Atlas for hosted deployments
- **File Storage**: Local storage, Cloudinary, S3-compatible storage, or Vercel Blob
- **AI Backend**: Managed Smart Site AI platform (subscription access via andrew@wildcreative.com.au)

### 1. Project Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd <your-site-folder>

# Install dependencies
pnpm install
```

1. Run the interactive bootstrap with the Smart Site CLI (published to npm as `smartsite`). Always execute it from the project root so it can find `package.json` and `.env.example`.

   ```bash
   # One-off run without installing anything
   npx smartsite init --project .

   # Prefer a pinned dependency? add the CLI locally, then:
   pnpm smartsite init --project .
   ```

   The wizard copies `.env.example` to `.env`, generates secrets, collects database/storage/admin details, optionally seeds baseline data for a fresh local install, and (when seeding is enabled) keeps `next dev` running so you land on a ready-to-edit site.

### 2. Environment Configuration

> 💡 **Quick start**: `npx smartsite init --project .` (or `pnpm smartsite init --project .` after installing the CLI) handles `.env` creation, secret generation, database/storage selection, admin credentials, optional seeding, and can leave the dev server running when it finishes. AI access is requested later from the Smart Site admin once your project is ready.
>
> Need to re-run the baseline data later? Use `pnpm smartsite seed starter --start-dev` to boot a local dev server, call `/api/seed`, and keep the site running— or point at any URL with `--url https://staging.yoursite.com`.
>
> **Database safety:** Seeding writes to the database and can overwrite existing content. Treat it as a one-time bootstrap step for a fresh local site unless the user explicitly asks for it again. Do not seed staging or production databases.

The setup script writes these values into `.env`; use this reference when updating keys manually or configuring CI pipelines. Smart Site supports two first-class deployment shapes:

- **Hosted**: Vercel or another Node host, MongoDB Atlas, and optional managed media storage
- **Self-hosted Mongo**: Dockerized Smart Site app + Dockerized MongoDB on the same VPS, with optional Cloudinary or S3-compatible media

Local values remain available for offline development.

```bash
# Core Configuration
NODE_ENV=development
NEXT_PUBLIC_URL=http://localhost:3000
PAYLOAD_CONFIG_PATH=./src/admin/payload/payload.config.ts

# Database
DATABASE_PROVIDER=mongoose
DATABASE_URL="mongodb+srv://<username>:<password>@<cluster-url>/smart-site?retryWrites=true&w=majority"
# DATABASE_URL=mongodb://127.0.0.1:27017/smart-site-dev   # Local development override

# Security
PAYLOAD_SECRET=<generate-random-32-char-string>    # openssl rand -hex 32
PREVIEW_SECRET=<generate-random-16-char-string>    # openssl rand -hex 16

# Storage (optional - defaults to local)
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...          # Vercel Blob storage
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
# AWS_ACCESS_KEY_ID=...
# AWS_SECRET_ACCESS_KEY=...

# Email (Optional - for forms)
RESEND_API_KEY=re_...                             # Resend.com API key
RESEND_DEFAULT_FROM=noreply@example.com


# AI Agent (auto-generated after setup)
AI_AGENT_API_KEY=

# Admin Seeding (Development)
PAYLOAD_ADMIN_EMAIL=admin@example.com
PAYLOAD_ADMIN_PASSWORD=SecurePassword123!
```

#### AI Environment Variables

- `AI_AGENT_API_KEY` — generated automatically during setup/seed. This is the only AI secret that ships in `.env.example`; the wizard writes the actual value after it provisions the hidden agent.

> Legacy placeholders (`SMARTSITE_AI_REGISTRATION_SECRET`, `SMARTSITE_SITE_NAME`) were removed. All onboarding now flows through the admin “Apply for AI Access” action described below, which keeps the local environment lean.

> Rerun the seed (or `pnpm smartsite ai rotate`) if `.env` ever loses the agent credentials. The command reconciles the database user and restores the values without regenerating keys unless a rotation flow is requested.

### Identity Configuration

Set the canonical site name in `src/smartsite.config.ts`:

```ts
// src/smartsite.config.ts
const config: UserConfig = {
  identity: {
    siteName: "Smart Site",
  },
  // ...
}
```

This value is used when seeding content, registering the AI agent, and rendering admin chrome. The CLI reads it automatically, so you no longer need `SMARTSITE_SITE_NAME` in `.env`.

### 3. Database Setup

Smart Site runs on MongoDB in every environment. PostgreSQL drivers remain in the repository for compatibility with legacy tooling, but the canonical configuration sets `DATABASE_PROVIDER=mongoose` and points `DATABASE_URL` at a MongoDB deployment.

#### Self-hosted Mongo appliance

This is the recommended profile when you want a site you can install on a VPS, back up, restore, and hand over safely.

1. **Keep local development on normal Mongo**
   - Run Smart Site locally against MongoDB Community.
   - Use that environment for day-to-day section and app development.

2. **Create the deployment manifest**

   ```bash
   pnpm self-hosted:init
   ```

   This copies `smartsite-deployment.example.json` to `smartsite-deployment.json`.

3. **Update the deployment manifest**
   - Set `environments.production.url` to the real public hostname.
   - Leave `preview.enabled` as `false` unless you actually need a review environment.
   - Preview should always use HTTPS.

4. **Let the scripts generate the hidden env artifacts**

   ```bash
   pnpm self-hosted:prepare
   ```

   Generated env files and state are written under `.smartsite-self-hosted/`, not alongside your main project files.

5. **Deploy production**

   ```bash
   pnpm self-hosted:run -- promote
   ```

6. **Restore real site data or clone an existing site**

   ```bash
   pnpm self-hosted:run -- restore production .smartsite-self-hosted/backups/manual/site.archive.gz --yes
   pnpm self-hosted:run -- promote
   ```

7. **Check runtime health or take a backup**

   ```bash
   pnpm self-hosted:run -- status
   pnpm self-hosted:run -- backup
   ```

8. **Enable preview only when needed**
   - Set `environments.preview.enabled` to `true`.
   - Give preview its own HTTPS URL.
   - Deploy it explicitly:

   ```bash
   pnpm self-hosted:run -- preview
   ```

9. **Preview mode requirement**
   - Draft preview requires HTTPS.
   - For temporary testing without a purchased domain, use a hostname such as `134-199-173-182.sslip.io` and set the production or preview URL to that host before rebuilding.

#### Hosted MongoDB Atlas + managed hosting

This profile keeps the classic hosted approach for teams that want managed infrastructure.

1. **Provision MongoDB Atlas**
   - Create a Serverless or Dedicated cluster in the same region as your application host.
   - Add a database user with read/write access and restrict IP access appropriately.
   - Copy the SRV connection string and update `.env`:

     ```bash
     DATABASE_PROVIDER=mongoose
     DATABASE_URL="mongodb+srv://<username>:<password>@<cluster-url>/smart-site?retryWrites=true&w=majority"
     ```

2. **Configure storage and hosting**
   - Vercel Blob, Cloudinary, or S3-compatible storage all work.
   - Mirror the `.env` values into your platform environment variables.

3. **Deploy & validate**
   - Push your repo and let the host build automatically.
   - Trigger `pnpm seed` locally against the target database only when intentionally bootstrapping a brand-new hosted site and only after confirming the target database is meant to be overwritten.

#### Local development (macOS and Linux)

1. Install MongoDB Community with Homebrew.

   ```bash
   brew tap mongodb/brew
   brew install mongodb-community@8.0
   brew services start mongodb-community@8.0
   ```

2. Verify the service and confirm connectivity.

   ```bash
   brew services list | grep mongodb
   mongosh "mongodb://127.0.0.1:27017" --eval "db.adminCommand('ping')"
   ```

3. Update `.env` for local development.

   ```bash
   DATABASE_PROVIDER=mongoose
   DATABASE_URL=mongodb://127.0.0.1:27017/smart-site-dev
   ```

4. Useful administration commands.

   ```bash
   brew services start mongodb-community@8.0
   brew services restart mongodb-community@8.0
   brew services stop mongodb-community@8.0
   brew services list | grep mongodb-community@8.0
   tail -f $(brew --prefix)/var/log/mongodb/mongo.log
   ```

Homebrew stores data in `$(brew --prefix)/var/mongodb` (for example `/usr/local/var/mongodb`) and logs in `$(brew --prefix)/var/log/mongodb/mongo.log`. One daemon can host any number of Smart Site databases—use different names (for example `smart-site-dev`, `smart-site-staging`) to keep environments isolated.

##### Backups and restores (macOS/Linux)

```bash
mkdir -p backups
mongodump --uri "${MONGODB_URI:-mongodb://127.0.0.1:27017/smart-site-dev}" --out .smartsite-self-hosted/backups/manual/$(date +%Y%m%d-%H%M%S)
```

```bash
# Set MONGODB_URI to the target connection string and provide a BACKUP_PATH directory
MONGODB_URI="mongodb+srv://<username>:<password>@<cluster-url>/smart-site-prod" \
BACKUP_PATH=.smartsite-self-hosted/backups/manual/dev-YYYYMMDD-HHMMSS \
mongorestore --uri "$MONGODB_URI" "$BACKUP_PATH"
```

#### Local development (Windows)

1. Install MongoDB as a Windows service.

   ```powershell
   choco install mongodb --params "/InstallDirectory=C:\\Program Files\\MongoDB"
   net start MongoDB
   ```

   The installer registers the service and places data under `C:\Program Files\MongoDB\Server\<version>\data`. Keep the default port `27017` for parity with local scripts.

2. Install MongoDB Shell (mongosh) if it is not included.

   ```powershell
   choco install mongosh
   ```

3. Set the same environment variables in `.env` as the macOS/Linux flow.

   ```bash
   DATABASE_PROVIDER=mongoose
   DATABASE_URL=mongodb://127.0.0.1:27017/smart-site-dev
   ```

4. Manage the Windows service when required.

   ```powershell
   net stop MongoDB
   net start MongoDB
   ```

#### GUI tooling

- [MongoDB Compass](https://www.mongodb.com/products/compass) is the recommended GUI. Connect with `mongodb://127.0.0.1:27017` in development and paste Atlas connection strings for staging or production.
- The seed scripts create collections automatically; Compass will list them after the first request to `/api/seed` or after running `pnpm seed`.

#### Production and staging (MongoDB Atlas)

1. Provision a MongoDB Atlas cluster (Dedicated or Serverless) in the region closest to your deployment.
2. Create a database user with read/write access and restrict IP access to your deployment environments.
3. Copy the SRV connection string from Atlas and update the environment.

   ```bash
   DATABASE_PROVIDER=mongoose
   DATABASE_URL=mongodb+srv://<username>:<password>@<cluster-url>/smart-site-prod?retryWrites=true&w=majority
   ```

4. Redeploy Smart Site so the new environment variables take effect.

#### Moving data between environments

Use MongoDB’s native tools for a repeatable promote flow.

```bash
mongodump --uri "mongodb://127.0.0.1:27017/smart-site-dev" --out .smartsite-self-hosted/backups/manual/dev-$(date +%Y%m%d-%H%M%S)
```

```bash
mongorestore --uri "mongodb+srv://<username>:<password>@<cluster-url>/smart-site-prod" .smartsite-self-hosted/backups/manual/dev-YYYYMMDD-HHMMSS
```

> Use the raw `mongodump` and `mongorestore` commands above for hosted environment promotion. SmartSite does not currently ship `pnpm smartsite staging pull` or `pnpm smartsite staging push` wrappers.

Run seeding (`pnpm smartsite seed starter` or `pnpm seed`) only against development databases and only with explicit confirmation that overwriting the target data is intended. Once a staging or production environment is active, use the promote flow above or Payload admin exports to transfer content.

### 4. AI Backend Setup

To enable AI features you connect to the managed Smart Site AI platform operated by Wild Creative. There is no customer-managed installation step—after seeding, contact andrew@wildcreative.com.au (or use the upcoming admin “Apply for AI Access” action) and they will activate your workspace. Until approval the AI sidebar remains disabled, but your local agent credentials are ready.

### 5. Development Server

```bash
# Start development server
pnpm dev
```

### 6. Database Seeding & Initial Setup

> **🗃️ Important:** The setup wizard (`smartsite init --project .`) can seed the minimal profile for you during first setup. Use the commands below only when you intentionally want to overwrite a local development database.

The wizard already seeds the **minimal** profile so you can start building immediately. Rerun the seed only after intentionally wiping the local development database and confirming that losing existing content is acceptable.

#### Reseeding from the command line

1. Ensure the dev server is running (`pnpm dev`).
2. Make sure the target database is local, disposable, or already intentionally wiped.
3. Treat this as a destructive action. Do not run it against staging, preview, or production databases.
4. Run the seeding script (minimal profile only):

   ```bash
   pnpm seed
   ```

   The wizard prompts for a site name during setup; rerun `smartsite init --project .` or call the seed endpoint with a custom `siteName` to change the label.

#### Minimal seed contents

The minimal profile is intentionally lean, giving editors the essentials without opinionated marketing copy:

- **Admin user** using the credentials you entered during setup.
- **Primary contact form** stored in the Forms collection (name, email, phone, message, confirmation workflow, notification email).
- **Pages**:
  - `Home` with a hero + content block that explains how to start building sections.
  - `Contact` with a hero and the primary contact form already embedded.
  - `Privacy Policy` and `Terms` with placeholder content ready to replace.
- **Navigation**:
  - Header links for Home and Contact.
  - Footer legal links for Privacy Policy and Terms.
  - *Remember*: headers and footers are managed via Payload globals (`globals/header`, `globals/footer`). Never implement them as sections; update the globals in admin or via `smartsite.config.ts` overrides.
- **Global settings** preconfigured with site name/description, SEO defaults (including robots.txt), and routing that points the homepage field at the seeded Home page. Social links, locations, analytics IDs, and templates are intentionally left blank for you to fill in.

Smart Site ships only the minimal profile so you can build bespoke sites without demo noise.

### 7. Available Scripts

```bash
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run ESLint
pnpm lint:fix         # Fix ESLint issues
pnpm type-check       # Run TypeScript checks

# Database & Content Management
pnpm db:schema        # Generate database schema
pnpm seed             # Seed local development content only; destructive if the DB is not disposable
# Run the two commands above sequentially to rebuild the schema and reseed
pnpm regenerate-uris  # Regenerate URI index for routing

# Payload CMS Commands
PAYLOAD_CONFIG_PATH=src/admin/payload/payload.config.ts payload  # Access Payload CLI
pnpm generate:types   # Generate TypeScript types from Payload
```

<a id="architecture-overview"></a>
