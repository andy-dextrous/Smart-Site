> First publication follows [first launch](first-launch.md). Code deployments preserve content. Use Node 24.22.1 and pnpm 10.34.8. Self-hosted Mongo must run as an authenticated replica set; see the current compose file and migration notes below.

# Deployment

This is the canonical deployment workflow for SmartSite.

Read [docs/product-specs/hosting-modes.md](../product-specs/hosting-modes.md) first. Hosted and self-hosted are both first-class paths, but the deploy steps are different.

## Choose one path first

If the site is hosted, use the hosted procedure below.

If the site is self-hosted, use the self-hosted procedure below.

Do not mix the two in a single operational runbook.

## Hosted deployment

Hosted deployment means:

- a managed Node-compatible host
- a managed MongoDB service
- build and deploy handled by the hosting platform

### Typical hosted flow

1. Connect the repository to the hosting platform.
2. Configure production environment variables on that platform, including separate random `PAYLOAD_SECRET` and `PREVIEW_SECRET` values. `CRON_SECRET` is only needed for an explicitly configured bearer-authenticated runner. Follow `.env.example` and configure durable storage explicitly in `src/payload.config.ts`; missing storage credentials must fail instead of falling back to ephemeral files.
3. Provision a managed MongoDB database.
4. Configure the media provider.
5. Trigger a production build on the platform.
6. Verify the public site and admin after deploy.

### Hosted first deploy

1. Provision the managed Mongo database.
2. Set destination variables from `.env.example`, with a new site UUID and separate destination secrets. Never copy the local database URL, local identity, account credentials or MCP keys into production.
3. Set the production public URL.
4. Configure the media provider.
5. Trigger the first production build.
6. Follow [first launch](first-launch.md) for destination adoption, administrator/key creation and a reviewed content transfer. Do not run local bootstrap against the hosted database.
7. Verify the public site, admin, forms, and media.

### Optional scheduling and recovery

SmartSite works on the existing hosting account without cron. The shipped `vercel.json` has no scheduled jobs, native future-publishing controls are off, and ordinary saves drain publication work immediately. An administrator can recover pending work with `POST /api/publication`; no runner secret is needed for administrator authentication. Bounded or interrupted work may need repeated recovery calls, and static traffic does not process it automatically.

Only configure a scheduler when the site needs unattended recovery or future publishing:

1. For future publishing, enable `versions.drafts.schedulePublish: true` in the chosen native collection/global definitions. Inspect existing queued jobs before enabling them; overdue work must be deliberately reviewed.
2. For a persistent Node host, opt into the built-in poller with `SMARTSITE_BACKGROUND_RECOVERY=true` and a private random `CRON_SECRET`. This flag controls the timer, not which collections can schedule.
3. For Vercel or another serverless host, deliberately add a scheduler calling `GET /api/publication` with `Authorization: Bearer <CRON_SECRET>`. Verify the actual plan supports the chosen cadence. [Vercel Hobby cron limits](https://vercel.com/docs/cron-jobs/usage-and-pricing) allow daily rather than minute-level execution; use a suitable explicitly approved alternative if the site needs tighter timing. Do not transfer projects or purchase a plan merely to deploy the default site.
4. Test future publish/unpublish, disabled-target isolation and crash recovery in the serving environment. Avoid overlapping native scheduled-job runners; read their [recovery limits](../engineering/routing-and-caching.md).

Set `PAYLOAD_CONFIG_PATH=src/payload.config.ts` if the platform has an explicit override; remove an old `src/admin/payload/payload.config.ts` override during upgrade. Vercel needs durable media storage; local uploads are not persistent there. Preview deployments do not execute Vercel cron: if scheduling is opted in, test the authenticated endpoint explicitly and verify automatic invocation after production promotion. Keep preview database, identity and credentials distinct from production.

### Hosted ongoing production deploys

The normal hosted release loop is:

1. push code to Git
2. let the hosting platform build and deploy
3. verify the public site and admin
4. leave the production database in place

### Hosted data rules

- the managed production Mongo database is the source of truth for that environment
- deploys should not overwrite production data
- local refresh from production should still be deliberate, not live sync
- preview should use separate hosted env vars and separate Mongo data when the change risk justifies it

### Hosted production checklist

- environment variables configured on the hosting platform
- managed Mongo reachable from the host
- media provider configured and tested
- public URL matches the real hostname
- HTTPS enabled
- admin login verified
- preview route verified when used
- backup and recovery expectations documented with the hosting provider or team

## Self-hosted deployment

Self-hosting is opt-in. The blank starter does not contain `.smartsite-self-hosted/` or a generated `smartsite-deployment.json`. Ordinary local startup and hosted deployment must not create them. After choosing this path, `self-hosted:init` creates the manifest and `self-hosted:prepare` creates private runtime files under `.smartsite-self-hosted/`. Agents should use these helpers instead of creating placeholder folders. Preserve an existing site’s private runtime state during upgrades.

Local Docker uploads use the persistent `/app/public/media` directory. Before upgrading an existing 3.x Docker deployment, follow [the checked media relocation and rollback procedure](docker-media.md); the old standalone runtime may have stored uploads inside its build directory.

Self-hosted deployment means:

- Dockerized SmartSite app
- Dockerized MongoDB
- `smartsite-deployment.json` as the deployment manifest
- a VPS as the runtime host
- `pnpm self-hosted:run -- ...` as the operational command surface

### Canonical self-hosted production model

The preferred production model is:

1. local development happens against local Mongo
2. GitHub Actions builds the release off the VPS
3. the release is transferred to the VPS
4. the VPS promotes the finished release
5. the VPS Mongo database stays in place

In other words:

- GitHub Actions is the build machine
- the VPS is the runtime machine
- the production database is persistent state, not build output

This also means the local developer workflow stays simple:

- run the app locally in the usual way
- keep one local Mongo database
- use Docker on the VPS for production only

### Self-hosted first deploy

1. Create the deployment manifest:

   ```bash
   pnpm self-hosted:init
   ```

2. Update `smartsite-deployment.json`:
   - set the production URL
   - enable preview only if you need it
   - keep preview on its own URL and data

3. Generate self-hosted env artifacts:

   ```bash
   pnpm self-hosted:prepare
   ```

4. Provision the VPS:
   - install Docker and Docker Compose
   - copy the project to the host
   - keep `smartsite-deployment.json` at the app root

5. Bootstrap the runtime stack and database:
   - start the self-hosted lane
   - restore approved content when needed
   - verify health before calling the environment production-ready

6. Configure the GitHub Actions deployment workflow for this site:
   - start from `.github/workflows/self-hosted-prebuilt.yml`
   - set `SELF_HOSTED_SSH_KEY`, `SELF_HOSTED_HOST`, `SELF_HOSTED_USER`, and `SELF_HOSTED_PATH`
   - let the workflow fetch the current runtime env from the VPS
   - let the workflow build from a snapshot of the current self-hosted production database
   - use the `public_url` workflow input only when the runtime env URL needs an intentional override

7. Use GitHub Actions as the normal production release path.

Build environment inputs use Node 24 dotenv syntax: quote values containing `#` and multiline values. `$NAME`, `${NAME}` and shell expressions remain literal; resolve any intended substitutions before supplying the file. Both prebuilt helpers use the same serializer and accept its generated build files, which are private (`0600`) and never log environment values. Edit the source dotenv file rather than the generated shell file; malformed generated files are rejected.

After the first production bootstrap, return to the ordinary local development workflow. Do not keep a local Docker runtime around as the default way to work on the site.

### Self-hosted ongoing production deploys

The normal ongoing release loop is:

1. push code to GitHub
2. let GitHub Actions build the release
3. have GitHub Actions ship the built image to the VPS
4. promote the release on the VPS
5. verify the site, admin, and release history

The production VPS should not need to run `next build` during ordinary deploys.

### Self-hosted data rules

- production Mongo should be the source of truth for that environment
- deploys should not overwrite production data
- production backups should be routine
- restores should be explicit and guarded
- local refresh from production should be a deliberate backup-and-restore action

### Self-hosted maintenance after launch

Six months after launch, the safe loop should be:

1. pull fresh production data into local
2. build and test the feature locally
3. deploy the code release
4. run a targeted migration only if existing production data needs to change shape

Use:

```bash
pnpm self-hosted:data-pull production local --yes
pnpm self-hosted:migrate production scripts/migrations/example.ts --yes
```

`data-pull` and `migrate` use the same remote connection settings as the starter workflow template:

- `SELF_HOSTED_HOST`
- `SELF_HOSTED_USER`
- `SELF_HOSTED_PATH`

Do not treat whole-database restore as the normal way to ship feature work.

This is the intended long-term maintenance loop:

1. local development stays local
2. `data-pull` brings production content down when needed
3. deploy moves code to production
4. `migrate` moves production data shape forward when needed

### Self-hosted operational commands

```bash
pnpm self-hosted:data-pull production local --yes
pnpm self-hosted:run -- backup
pnpm self-hosted:run -- guard
pnpm self-hosted:run -- history
pnpm self-hosted:migrate production scripts/migrations/example.ts --yes
pnpm self-hosted:run -- promote-prebuilt <archive-path> [release-image] [deployment-id]
pnpm self-hosted:run -- probe
pnpm self-hosted:run -- rollback
pnpm self-hosted:run -- status
```

### Self-hosted fallback note

Older self-hosted flows may still build on the host. Treat that as a legacy or emergency fallback, not the preferred production model when off-box build infrastructure is available.

Likewise, old local self-hosted Docker habits should be treated as legacy or diagnostic-only behavior, not as the normal SmartSite development loop.

## Temporary HTTPS without a purchased domain

Self-hosted preview and some proof environments still need HTTPS. Temporary hostnames such as:

```bash
https://134-199-173-182.sslip.io
```

are acceptable for proof or preview use until a real domain is ready.

Set both:

- `NEXT_PUBLIC_URL`
- `CADDY_SITE_ADDRESS`

to the same hostname before rebuilding.

## Provider bootstrap examples

### DigitalOcean

```bash
brew install doctl
doctl auth init

doctl compute droplet create smartsite-prod \
  --region syd1 \
  --image ubuntu-24-04-x64 \
  --size s-1vcpu-2gb \
  --enable-monitoring \
  --enable-backups \
  --ssh-keys <ssh-key-id>
```

### Hetzner

```bash
brew install hcloud
hcloud context create smartsite

hcloud server create \
  --name smartsite-prod \
  --type cpx22 \
  --image ubuntu-24.04 \
  --location hel1
```

## Database safety




- for schema evolution or backfills, prefer targeted migration scripts under `scripts/migrations/`


## Authenticated self-hosted replica set

The current compose topology keeps Mongo private on its Docker network, persists data and its replica key separately, and waits for authenticated initialization and a writable primary before build/app startup. `MONGO_REPLICA_KEY` is generated once in the private destination environment and retained. Do not regenerate it during a restart. The URI must include `replicaSet=smartsite-rs`; the advertised member is `mongo:27017` inside this network. External operator tools need an explicit secure tunnel/direct connection, not public Mongo ports.

For an existing standalone volume: stop writes, save and test a database/user/media backup, preserve root/app credentials, generate one replica key in its private environment, and start the upgraded mongo plus mongo-init services using the SAME compose project and data volume. Verify replica primary and a real transaction before restarting the app. Abort on identity, credential or replica-name mismatch. Never use `down -v` in this procedure. Rollback preserves the original backup and source/environment; do not downgrade Mongo data files in place.

Backup/archive/restore scripts remain explicit operator tools. Test restore into a distinct empty database/stack first. A successful archive command alone is not a restore test. The prebuilt CI build database is disposable and independent of the destination; it must never run destination seeding/adoption.

The disposable `pnpm test:docker-upgrade` rehearsal proves this conversion with a populated volume, a committed transaction, restart and restoration of the pre-upgrade archive into a separate volume. It does not authorize applying the procedure to a live deployment.

For every serving host, test a real save, persisted publication work and cache acknowledgement as described in [first launch](first-launch.md). Verify administrator recovery after interruption. If background recovery or future publishing was explicitly enabled, also test its runner, authentication and cadence; absence of an optional scheduler or cron secret is not a deployment failure.
