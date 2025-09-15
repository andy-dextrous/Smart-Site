---
description: Create and set up a new client site in the monorepo with complete Smart-Site integration
allowed_tools:
  - Bash
  - Write
  - MultiEdit
  - Read
---

# Create Client Site: $ARGUMENTS

Set up a new client site branch and integrate Smart-Site for client: $ARGUMENTS

## Understanding Client Sites Architecture

Client sites are Smart-Site implementations customized for specific clients. They:
- Live in `apps/clients/` directory
- Each client gets its own git branch (`client/[name]`)
- Inherit the core Smart-Site admin layer
- Allow customizations through `smartsite.config.ts`
- Receive updates via the SmartSite CLI

## Step 1: Validate Client Name

Parse "$ARGUMENTS" to extract client name:
- Must be lowercase kebab-case (e.g., "acme-corp", "blue-sky")
- No spaces or special characters
- Will be used for branch name and directory

## Step 2: Create Client Branch

Create and checkout a new branch for the client:
```bash
git checkout -b client/$ARGUMENTS
```

This branch strategy allows:
- Isolated development per client
- Easy deployment tracking
- Clear separation of client customizations

## Step 3: Clone Smart-Site Repository

Navigate to clients directory and clone the official Smart-Site:
```bash
cd apps/clients
git clone https://github.com/andy-dextrous/Smart-Site $ARGUMENTS
```

This gets the latest stable Smart-Site as the foundation.

## Step 4: Remove Git History

Remove the cloned repository's git history to integrate with monorepo:
```bash
cd $ARGUMENTS
rm -rf .git
```

This makes it part of the monorepo rather than a submodule.

## Step 5: Navigate Back to Root

Return to monorepo root for dependency installation:
```bash
cd ../../..
```

## Step 6: Install Dependencies

Install all dependencies at the monorepo level:
```bash
pnpm install
```

This links the client site with shared packages and dependencies.

## Step 7: Create SmartSite Configuration

Create `apps/clients/$ARGUMENTS/smartsite.config.ts`:

```typescript
import { defineConfig } from "@/admin/lib/config"

/**
 * SmartSite Configuration for $ARGUMENTS
 * 
 * This file controls customizations without modifying core admin files.
 * All customizations here are preserved during SmartSite updates.
 */
const smartSiteConfig = defineConfig({
  // Site Information
  site: {
    name: "$ARGUMENTS",
    domain: "https://$ARGUMENTS.com", // Update with actual domain
  },

  // Disable default collections/globals/blocks as needed
  // Example: collections: [{ services: false, team: false }]
  collections: [],
  globals: [],
  blocks: [],

  // Add custom collections/globals/blocks
  // Import and add your custom Payload configs here

  // Media configuration
  media: {
    storage: "local", // Options: "local", "vercel-blob", "s3", "cloudinary"
  },

  // Frontend options
  frontend: {
    enableFrontend: true,
    revalidation: 60, // ISR revalidation time in seconds
  },
})

export default smartSiteConfig
```

## Step 8: Environment Setup

Create `.env.local` for client-specific configuration:

```bash
cat > apps/clients/$ARGUMENTS/.env.local << 'EOF'
# Database
DATABASE_URI=mongodb://localhost:27017/$ARGUMENTS
PAYLOAD_SECRET=generate-a-secure-random-string-here

# Site URL
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3000

# Email (optional)
RESEND_API_KEY=
RESEND_DEFAULT_FROM_ADDRESS=
RESEND_DEFAULT_FROM_NAME=$ARGUMENTS

# Media Storage (if using cloud storage)
# VERCEL_BLOB_READ_WRITE_TOKEN=
# S3_ACCESS_KEY_ID=
# S3_SECRET_ACCESS_KEY=
# S3_BUCKET=
# S3_REGION=
# CLOUDINARY_CLOUD_NAME=
# CLOUDINARY_API_KEY=
# CLOUDINARY_API_SECRET=
EOF
```

Generate a secure PAYLOAD_SECRET:
```bash
openssl rand -base64 32
```

Update the .env.local with the generated secret.

## Step 9: Update Package.json

Update `apps/clients/$ARGUMENTS/package.json` name field:
```json
{
  "name": "@smartsite/$ARGUMENTS",
  ...
}
```

## Step 10: Database Setup

If MongoDB is running locally, seed the database:
```bash
cd apps/clients/$ARGUMENTS
pnpm seed
```

If not, note that seeding is required once MongoDB is available.

## Step 11: Verify Setup

Start the development server to verify everything works:
```bash
pnpm dev
```

Check that:
- Site loads at http://localhost:3000
- Admin panel accessible at http://localhost:3000/admin
- No console errors

## Step 12: Initial Customization Setup

Create initial directories for client customizations:
```bash
mkdir -p apps/clients/$ARGUMENTS/src/components/custom
mkdir -p apps/clients/$ARGUMENTS/src/styles/custom
mkdir -p apps/clients/$ARGUMENTS/public/assets
```

## Step 13: Create Initial Commit

Stage and commit all changes:
```bash
git add .
git status # Review changes
git commit -m "feat: add $ARGUMENTS client site

- Set up Smart-Site foundation
- Configure environment variables
- Add smartsite.config.ts for customizations
- Ready for client-specific development"
```

## Step 14: Push Branch to Origin

Push the client branch to remote repository:
```bash
git push -u origin client/$ARGUMENTS
```

## Step 15: Documentation

Create `apps/clients/$ARGUMENTS/README.md`:

```markdown
# $ARGUMENTS - Smart Site Client

## Overview
Smart-Site implementation for $ARGUMENTS client.

## Development
\`\`\`bash
# Install dependencies (from monorepo root)
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build
\`\`\`

## Customization
All customizations should be made through:
- \`smartsite.config.ts\` - Core configuration
- \`src/components/custom/\` - Custom components
- \`src/styles/custom/\` - Custom styles

**WARNING**: Never modify files in \`src/admin/\` directly.
These are overwritten during SmartSite updates.

## Updates
To update with latest Smart-Site admin code:
\`\`\`bash
pnpm smartsite update $ARGUMENTS
\`\`\`

## Deployment
[Add deployment instructions specific to this client]
```

## Important Notes

### Admin Folder Protection
**CRITICAL**: Never modify files in `src/admin/` directory:
- This folder contains core Smart-Site product code
- It's completely replaced during updates via SmartSite CLI
- All customizations must go through `smartsite.config.ts`

### Customization Best Practices
1. Use `smartsite.config.ts` for all Payload customizations
2. Create custom components in `src/components/custom/`
3. Override styles in `src/styles/custom/`
4. Keep client-specific assets in `public/assets/`

### Branch Management
- Always work on the `client/$ARGUMENTS` branch
- Never merge client branches into main/master
- Each client branch is deployed independently

### Version Tracking
The client site will have a version file at `src/admin/version.json` that tracks:
- Current Smart-Site version
- Last update date
- Git commit reference

## Summary Output

Provide the following summary:

```
✅ Client Site Created Successfully

Client: $ARGUMENTS
Branch: client/$ARGUMENTS  
Location: apps/clients/$ARGUMENTS
Development URL: http://localhost:3000
Admin URL: http://localhost:3000/admin

Next Steps:
1. Update .env.local with production values
2. Customize site through smartsite.config.ts
3. Add client branding and content
4. Configure deployment settings

To update with latest Smart-Site:
pnpm smartsite update $ARGUMENTS

To start development:
pnpm dev
```

## Troubleshooting

**Port already in use**:
```bash
pnpm kill  # Kills processes on ports 3000/3001
```

**Database connection failed**:
- Ensure MongoDB is running
- Check DATABASE_URI in .env.local
- Run `pnpm seed` after fixing connection

**Dependencies not installing**:
- Ensure you're at monorepo root when running `pnpm install`
- Clear node_modules and reinstall if needed

**Git push rejected**:
- Ensure you have permissions to create branches
- Check if branch already exists: `git branch -r | grep client/$ARGUMENTS`