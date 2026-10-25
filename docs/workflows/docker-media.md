# Persistent media in Docker

Native 4.0 Docker images and Compose set `SMARTSITE_MEDIA_DIRECTORY=/app/public/media`. The `public-media` volume is mounted there. Payload reads, creates and deletes originals and resized variants in this directory; replacing `.next`, promoting an image or recreating a container must not remove uploads. Outside Docker the default remains the site's `public/media`. A custom value must be an absolute directory on durable storage.

The prebuilt release helper always rebuilds its builder stage: changing the private build environment or public URL must not reuse an image compiled for a previous deployment. This trades build-cache reuse for correct environment isolation.

Do not mount an upload volume inside `.next`. Builds and prebuilt promotion replace that tree. Hosted storage adapters continue to use their configured provider.

## Before upgrading a 3.0.x Docker site

The original 3.x standalone server can write uploads to `/app/.next/standalone/public/media` even though Compose mounts `/app/public/media`. A successful image URL does not establish persistence. **Stop the app and all writers before a build, image promotion or source inspection. Preserve the old build volume until every original and variant has been copied and verified.**

Inspect the stopped app's mounts and image with `docker inspect`. Record its exact container ID, `public-media` volume and `next-build` volume; do not guess a Compose project name. Bind-mounted/custom upload directories require their own reviewed copy procedure. The following variables refer only to those inspected resources:

```sh
# Set these to the inspected container, volume and existing Node application image.
LEGACY_CONTAINER=the-stopped-app-container
MEDIA_VOLUME=the-existing-public-media-volume
NODE_IMAGE=the-existing-app-image
# Absolute directory containing the verified new release, separate from the site.
SMARTSITE_KIT=/absolute/releases/smartsite-4.0.2
umask 077
MEDIA_BACKUP="$(mktemp -d)"
MEDIA_EXPORT="$MEDIA_BACKUP/legacy"
CANONICAL_EXPORT="$MEDIA_BACKUP/canonical"
mkdir "$MEDIA_EXPORT" "$CANONICAL_EXPORT"

docker cp "$LEGACY_CONTAINER:/app/.next/standalone/public/media/." "$MEDIA_EXPORT"

docker run --rm --init --network none --entrypoint node \
  --mount "type=bind,source=$SMARTSITE_KIT/docker/copy-media.mjs,target=/copy-media.mjs,readonly" \
  --mount "type=bind,source=$MEDIA_EXPORT,target=/source,readonly" \
  --mount "type=volume,source=$MEDIA_VOLUME,target=/destination" \
  "$NODE_IMAGE" /copy-media.mjs --from /source --to /destination \
  > "$MEDIA_BACKUP/legacy-media-copy-report.json"

# Export the entire durable volume, including any files already stored there.
docker run --rm --init --network none --entrypoint node \
  --mount "type=bind,source=$SMARTSITE_KIT/docker/copy-media.mjs,target=/copy-media.mjs,readonly" \
  --mount "type=volume,source=$MEDIA_VOLUME,target=/source,readonly" \
  --mount "type=bind,source=$CANONICAL_EXPORT,target=/destination" \
  "$NODE_IMAGE" /copy-media.mjs --from /source --to /destination \
  > "$MEDIA_BACKUP/canonical-media-copy-report.json"

# Run in the stopped site's standalone source directory, before kit inspection.
node "$SMARTSITE_KIT/docker/copy-media.mjs" \
  --from "$CANONICAL_EXPORT" --to "$PWD/public/media"
```

The helper never deletes source files or replaces different destination bytes. It rejects symlinks and conflicting filenames, and hashes every copied file. Stop and reconcile a conflict; do not rename referenced files or overwrite a different upload to force success. Keep the private exports and reports with the backup. For a genuinely empty site, establish that no media records exist before treating a missing directory as empty.

Only after this preparation, create the upgrade request and run inspection/backup. The kit checks every stored media filename against the copied originals/variants. When running the kit on the host, use its host-side `public/media`; do not copy the container-only `/app/public/media` override into that environment. Docker's native4 serving environment supplies the override itself.

## Compatible rollback to a 3.x source image

Stop 4.0 and its writer before starting old code. Retain the current database and `public-media` volume so legitimate post-upgrade edits survive. Follow the source-mode rollback's rebuild, then copy the verified durable media into the old standalone runtime directory **after rebuilding and before starting the app**:

```sh
# BUILD_VOLUME is the inspected build volume used by the rebuilt old app.
BUILD_VOLUME=the-existing-next-build-volume

docker run --rm --init --network none --entrypoint node \
  --mount "type=bind,source=$SMARTSITE_KIT/docker/copy-media.mjs,target=/copy-media.mjs,readonly" \
  --mount "type=volume,source=$MEDIA_VOLUME,target=/source,readonly" \
  --mount "type=volume,source=$BUILD_VOLUME,target=/legacy" \
  "$NODE_IMAGE" /copy-media.mjs --from /source --to /legacy/standalone/public/media
```

Do not invoke an automatic rollback helper that starts 3.x before this copy. Perform its rebuild/copy/start stages explicitly. Verify public image URLs and variants, login and the latest published content. While old code is running, any new local uploads again land in its legacy directory: repeat the checked export before another rebuild or forward upgrade. A database snapshot restore is a separate recovery decision that may discard newer edits; it is not required for compatible code rollback.
