# Preview Environments

The preserved preview-environment guidance from the source manuscript is reproduced below.

Source: [source-manuscript-readme.md](../references/source-manuscript-readme.md)

## 🧪 Preview Environments

Preview is optional. Use it when a site is already live, the change is risky, or stakeholders need to review a production-like environment before you promote.

### Self-hosted preview

1. Enable preview in `smartsite-deployment.json`
   - Set `environments.preview.enabled` to `true`
   - Give it its own HTTPS hostname
   - Leave `allowIndexing` as `false`

2. Deploy preview

   ```bash
   pnpm self-hosted:run -- preview
   ```

Recommended rules:

- preview and production must never share the same Mongo volume
- preview should always run with indexing disabled
- preview should have its own hostname and HTTPS
- preview may run on the same VPS as production only if ports, stack names, and backup schedules differ

### Refreshing preview from production

1. Take a fresh production backup:

   ```bash
   pnpm self-hosted:run -- backup
   ```

2. Restore that archive into preview:

   ```bash
   pnpm self-hosted:run -- restore preview .smartsite-self-hosted/backups/production/<archive>.archive.gz --yes
   ```

3. Rebuild preview after the restore:

   ```bash
   pnpm self-hosted:run -- preview
   ```

### Rolling back a self-hosted release

If a promote produces a bad deploy:

```bash
pnpm self-hosted:run -- history
pnpm self-hosted:run -- rollback
```

If you need a specific earlier release:

```bash
pnpm self-hosted:run -- rollback production <deployment-id>
```

Use `--force` only when the downgrade or overwrite is intentional and already verified:

```bash
pnpm self-hosted:run -- restore production .smartsite-self-hosted/backups/manual/source.archive.gz --yes --force
```

### Hosted preview

The existing Atlas-based staging or preview model still works for hosted deployments. Keep a separate MongoDB database or cluster, a separate public hostname, and separate environment variables when you need a hosted review environment.

### AI and agent workflow expectations

- local is the safest place for schema and section changes
- preview is where you verify real preview flows, integrations, and deployment behaviour when local is not enough
- production changes should be boring, repeatable, and backed by a fresh backup
- AI agents should treat restores, backup retention changes, and production env changes as explicit operational actions, not casual side effects

---

<a id="additional-resources"></a>
