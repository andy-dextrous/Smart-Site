# Troubleshooting

The preserved troubleshooting guidance from the source manuscript is reproduced below.


Source: [source-manuscript-readme.md](../references/source-manuscript-readme.md)

## 🔧 Troubleshooting

### Common Issues

| Issue                        | Solution                                       |
| ---------------------------- | ---------------------------------------------- |
| **Types not generating**     | Run `pnpm generate:types`                      |
| **Sections not appearing**   | Check registration in `sections-map.tsx`       |
| **Admin changes lost**       | Use `smartsite.config.ts` instead              |
| **MongoDB connection fails** | Ensure the MongoDB service is running (brew services list / net start MongoDB) |
| **Build fails**              | Run `pnpm type-check` and fix errors           |
| **AI chat not working**      | Email andrew@wildcreative.com.au—backend uptime is managed by Wild Creative |
| **Lost AI credentials**      | Coordinate with Wild Creative, then run `pnpm smartsite ai rotate --force` and restart |
| **Page looks stale after slug/content changes** | Run `pnpm regenerate-uris`, then re-check the published URI and revalidation flow |

### Debug Commands

```bash
# Check database connection
PAYLOAD_CONFIG_PATH=./src/admin/payload/payload.config.ts pnpm exec payload migrate:status

# Regenerate URI index
pnpm regenerate-uris

# Reset everything
pnpm db:schema
pnpm seed

# View MongoDB databases
mongo --eval "db.adminCommand('listDatabases')"
```

<a id="deployment"></a>
## 🚀 Deployment
