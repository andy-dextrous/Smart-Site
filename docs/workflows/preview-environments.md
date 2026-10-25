# Preview Environments

Preview is optional in both hosting modes. Use it when:

- a site is already live
- the change is risky
- stakeholders need to review a production-like version before promotion

Read [docs/product-specs/hosting-modes.md](../product-specs/hosting-modes.md) first so you choose the right preview model.

## Shared preview rules

- preview should be separate from production
- preview should never share the production database
- preview should be safe to refresh, test, and discard
- production should stay boring while preview absorbs review risk

## Hosted preview

Hosted preview means a separate hosted environment.

Recommended rules:

- use separate environment variables
- use a separate preview hostname when needed
- use a separate preview database or cluster
- keep production credentials out of the preview lane unless explicitly required

Typical hosted preview flow:

1. create or reuse the hosted preview environment
2. point it at preview env vars and preview Mongo
3. deploy the branch or preview build
4. verify admin, forms, media, and page rendering

## Refreshing hosted preview from production

Hosted refresh should still be deliberate:

1. take an approved production export, dump, or backup from the managed database
2. restore or import that data into the hosted preview database
3. redeploy the hosted preview environment if the platform requires a rebuild

Do not point hosted preview straight at the production database as a convenience shortcut.

## Hosted rollback expectations

Hosted rollback should use the hosting platform's release history or redeploy controls. Roll back the application release first, and use database restore only when there is an actual data problem.

## Self-hosted preview

Self-hosted preview means a separate self-hosted stack.

Recommended rules:

- enable preview in `smartsite-deployment.json`
- give preview its own HTTPS hostname
- keep `allowIndexing` disabled
- use separate Mongo data from production
- keep preview and production runtime state separate

Deploy preview with:

```bash
pnpm self-hosted:run -- preview
```

## Refreshing self-hosted preview from production

1. Take a fresh production backup:

   ```bash
   pnpm self-hosted:run -- backup
   ```

2. Restore that archive into preview:

   ```bash
   pnpm self-hosted:run -- restore preview .smartsite-self-hosted/backups/production/<archive>.archive.gz --yes
   ```

3. Rebuild or redeploy preview:

   ```bash
   pnpm self-hosted:run -- preview
   ```

## Rolling back a self-hosted release

If a self-hosted promote produces a bad deploy:

```bash
pnpm self-hosted:run -- history
pnpm self-hosted:run -- rollback
```

If you need a specific earlier release:

```bash
pnpm self-hosted:run -- rollback production <deployment-id>
```

Use `--force` only when the overwrite or downgrade is intentional and already verified:

```bash
pnpm self-hosted:run -- restore production .smartsite-self-hosted/backups/manual/source.archive.gz --yes --force
```

## Temporary HTTPS

Self-hosted preview should use HTTPS. For temporary proof environments, a hostname such as:

```bash
https://134-199-173-182.sslip.io
```

is acceptable until a purchased domain is ready.

## Agent workflow expectations

- local is the safest place for schema and section changes
- preview is where you verify production-like behavior when local is not enough
- production changes should be backed by a fresh backup
- restores, backup-retention changes, and production env changes are explicit operational actions, not casual side effects
