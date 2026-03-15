# Deployment

This document is the canonical deployment workflow for both hosting modes.

Read [docs/product-specs/hosting-modes.md](../product-specs/hosting-modes.md) first so you use the right operating model.

For most deployment-mode questions you only need:

- [docs/product-specs/hosting-modes.md](../product-specs/hosting-modes.md)
- [docs/workflows/deployment.md](deployment.md)
- [docs/workflows/preview-environments.md](preview-environments.md) when preview is involved

Do not read [docs/workflows/getting-started.md](getting-started.md) unless the task is a fresh install/bootstrap. Do not read [docs/PRODUCT.md](../PRODUCT.md) unless the task needs big-picture product framing.

### Self-hosted Mongo Deployment

This profile is intended for cloning, restoring, and handoff.

1. **Prepare the source env**
   - `pnpm self-hosted:run -- promote` materializes generated runtime env files from the source env path in `smartsite-deployment.json`.
   - By default that source env path is `.env`.
   - Make sure the source env file exists and contains the values you want to project into the generated self-hosted env output.

2. **Provision the host**
   - Any normal Linux VPS with Docker Engine and Docker Compose is sufficient.
   - DigitalOcean is the current reference host because it maps cleanly to this workflow.

3. **Create the deployment manifest**

   ```bash
   pnpm self-hosted:init
   ```

4. **Configure the production URL**
   - Update `smartsite-deployment.json`.
   - Set `environments.production.url` to the real hostname.
   - Enable preview only if you actually need it.

5. **Copy the project to the host**
   - Sync the project to the server.
   - Keep `smartsite-deployment.json` in the app root.

6. **First boot**

   ```bash
   pnpm self-hosted:run -- promote
   ```

7. **Restore real content**
   - Dump the source database locally:

     ```bash
     pnpm self-hosted:dump -- .env .smartsite-self-hosted/backups/manual/source.archive.gz
     ```

   - Restore it into the target stack:

     ```bash
     pnpm self-hosted:run -- restore production .smartsite-self-hosted/backups/manual/source.archive.gz --yes
     pnpm self-hosted:run -- promote
     ```

8. **Verify runtime health**

   ```bash
   pnpm self-hosted:run -- status
   pnpm self-hosted:run -- probe
   ```

9. **Install automated backups**

   ```bash
   pnpm self-hosted:run -- install-backup-cron
   ```

10. **Inspect or roll back releases**

   ```bash
   pnpm self-hosted:run -- history
   pnpm self-hosted:run -- rollback
   ```

### Temporary HTTPS without a purchased domain

Self-hosted preview mode requires HTTPS. For preview or proof-of-concept deployments, point the public URL at a temporary hostname such as:

```bash
https://134-199-173-182.sslip.io
```

Set both:

- `NEXT_PUBLIC_URL`
- `CADDY_SITE_ADDRESS`

to the same hostname, then redeploy.

### Provider CLI bootstrap

For the self-hosted Mongo profile, browser setup should happen once, then host-native CLI should own the repeatable provisioning.

#### Current recommendation

- **Primary first deploy**: DigitalOcean, because the operator workflow has already been proven there and the docs below map directly to that host.
- **Cheapest recommended path**: Hetzner, if cost matters more than provider familiarity.
- **Edge layer later**: Cloudflare in front of either origin once you are ready to introduce a real domain.

#### DigitalOcean

1. Authenticate `doctl`

   ```bash
   brew install doctl
   doctl auth init
   ```

2. Create an initial droplet

   ```bash
   doctl compute droplet create smartsite-prod \
     --region syd1 \
     --image ubuntu-24-04-x64 \
     --size s-1vcpu-2gb \
     --enable-monitoring \
     --enable-backups \
     --ssh-keys <ssh-key-id>
   ```

3. Add a firewall for web and SSH traffic only

   ```bash
   doctl compute firewall create \
     --name smartsite-prod \
     --inbound-rules "protocol:tcp,ports:22,address:0.0.0.0/0,address:::/0 protocol:tcp,ports:80,address:0.0.0.0/0,address:::/0 protocol:tcp,ports:443,address:0.0.0.0/0,address:::/0" \
     --outbound-rules "protocol:tcp,ports:1-65535,address:0.0.0.0/0,address:::/0 protocol:udp,ports:1-65535,address:0.0.0.0/0,address:::/0"
   ```

4. Install Docker on the host, sync the project, then run:

   ```bash
   pnpm self-hosted:run -- promote
   ```

#### Hetzner

1. Authenticate `hcloud`

   ```bash
   brew install hcloud
   hcloud context create smartsite
   ```

2. Create an initial server

   ```bash
   hcloud server create \
     --name smartsite-prod \
     --type cpx22 \
     --image ubuntu-24.04 \
     --location hel1
   ```

3. Harden the host, install Docker, sync the project, then run:

   ```bash
   pnpm self-hosted:run -- promote
   ```

#### Cloudflare later

- Add the real domain or subdomain in Cloudflare DNS.
- Point it at the origin droplet.
- Keep the record proxied.
- Update `smartsite-deployment.json`, then run:

  ```bash
  pnpm self-hosted:run -- promote
  ```

### Hosted Deployment

Smart Site still supports classic hosted delivery when that fits the project better.

1. **Connect repository to the host**
   - Import the project to Vercel or another Node-compatible host.

2. **Environment variables**
   - Copy the required values from `.env`.
   - Update `NEXT_PUBLIC_URL` to the real public hostname.

3. **Database & storage**
   - Provision MongoDB Atlas or another managed MongoDB service.
   - Configure Cloudinary, S3-compatible storage, or Vercel Blob.

4. **Deploy & validate**
   - Trigger a production build and validate admin, preview, forms, and media uploads.

### Database safety

- Do not use seed flows as a routine deployment step.
- Seed only when intentionally bootstrapping a brand-new local or hosted database and only after confirming the overwrite is wanted.
- For existing preview or production environments, move content with backups, dumps, restores, or admin exports instead of reseeding.

### AI Backend Deployment

The Smart Site AI backend is still operated by Wild Creative, but the project now ships a live apply flow instead of a docs-only “email us” step.

Current flow:

1. seed or bootstrap the site normally
2. open the AI access gate in admin
3. use the built-in “Apply for AI Access” action
4. wait for the backend status to move from pending to active

Wild Creative still owns the managed AI platform, approval backend, and support, but the request flow now exists inside the product.

### Other Platforms

Smart Site can deploy to any Node.js hosting platform:

- **Netlify**: Use `@netlify/plugin-nextjs`
- **Railway**: Direct deployment with managed services
- **DigitalOcean**: Droplet for self-hosted Mongo, or App Platform for hosted Node
- **AWS**: EC2 for self-hosted Mongo, or Amplify plus managed Mongo-compatible storage/services

### Production Checklist

#### Core runtime

- [ ] Environment variables configured for the target environment
- [ ] Database provisioned and connected
- [ ] File storage configured
- [ ] Email service configured
- [ ] Public URL and preview URL match the real hostname
- [ ] HTTPS enabled
- [ ] Admin login verified
- [ ] Preview route verified over HTTPS
- [ ] Content seeded or migrated intentionally

#### Self-hosted Mongo

- [ ] `smartsite-deployment.json` configured for the target environment
- [ ] `pnpm self-hosted:run -- promote` completes cleanly
- [ ] `pnpm self-hosted:run -- status` shows healthy services
- [ ] `pnpm self-hosted:run -- probe` passes
- [ ] Nightly backup cron installed
- [ ] Release history is recording
- [ ] A restore has been tested against a preview or non-production environment
- [ ] Rollback has been tested once on a preview or non-production environment
- [ ] Mongo is not exposed publicly
- [ ] Rollback plan documented for the team

#### Hosted

- [ ] Build environment variables mirrored into the hosting platform
- [ ] MongoDB Atlas or managed Mongo reachable from the host
- [ ] Media provider configured and tested

#### AI Backend (Managed by Wild Creative)

- [ ] Subscription confirmed with Wild Creative
- [ ] AI workspace approved by Wild Creative (contact andrew@wildcreative.com.au)
- [ ] `AI_AGENT_API_KEY` generated after seeding
- [ ] Connection test completed (admin chat assistant responding)
- [ ] Support contact: andrew@wildcreative.com.au documented for the team

> **🚀 Production data:** Prefer restoring or migrating real content into preview or production. Reserve seeding for intentional bootstrap flows only, and require explicit confirmation before any database-writing action that can overwrite data.

---

<a id="staging-environments"></a>
