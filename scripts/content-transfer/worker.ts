import { readFile } from "node:fs/promises"
import { atomicJSON } from "../local/state.mjs"
import path from "node:path"
import { createHash } from "node:crypto"
import { createLocalReq, getPayload } from "payload"
import config from "../../src/payload.config"
import { contentTarget, revision, catalogue } from "../../src/payload/mcp/contracts"
import { projectContentResponse } from "../../src/payload/mcp/projection"
import { contentSave, uploadMedia } from "../../src/payload/mcp/tools"
import { withOperation, operationStatus } from "../../src/payload/mcp/operations"
import { mapReferences, schemaShape, type Reference } from "./references"

const request = JSON.parse(await readFile(process.argv[2], "utf8"))
const payload = await getPayload({ config })
const output = atomicJSON
const configFor = (target: string): any =>
  contentTarget(target, payload.config) === "global"
    ? payload.config.globals.find(g => g.slug === target)
    : payload.collections[target as keyof typeof payload.collections]?.config
const hash = (value: any) => revision(value)
const key = (target: string, id: string) => `${target}:${id}`
const strip = (data: any, target: string) =>
  Object.fromEntries(
    Object.entries(data).filter(
      ([k]) =>
        ![
          "id",
          "createdAt",
          "updatedAt",
          "_status",
          "uri",
          "breadcrumbs",
          "populatedAuthors",
          "globalType",
          ...(target === "media"
            ? [
                "filename",
                "url",
                "thumbnailURL",
                "mimeType",
                "filesize",
                "width",
                "height",
                "sizes",
                "focalX",
                "focalY",
              ]
            : []),
        ].includes(k)
    )
  )
try {
  if (process.env.SMARTSITE_SITE_ID !== request.expectedSiteId)
    throw new Error("Environment target mismatch")
  const identity = await payload.find({
    collection: "smartsite-identity",
    where: { siteId: { equals: request.expectedSiteId } },
    limit: 1,
  })
  if (!identity.docs.length) throw new Error("Stored site identity mismatch")
  if (!request.operatorId)
    throw new Error("An explicit existing CMS operatorId is required")
  const user = await payload.findByID({
    collection: "users",
    id: request.operatorId,
    depth: 0,
  })
  if (!["admin", "developer"].includes(user.role))
    throw new Error("A CMS administrator must perform content transfer")
  const req = await createLocalReq(
    {
      user: { ...user, collection: "users" },
      context: { smartsiteKeyId: `transfer:${request.operatorId}` },
    },
    payload
  )
  if (request.action === "export") {
    if (!Array.isArray(request.selection) || !request.selection.length)
      throw new Error("Select approved source documents/globals explicitly")
    const items: any[] = []
    const seen = new Set<string>()
    const external: Reference[] = []
    const gather = async (target: string, id?: string) => {
      const kind = contentTarget(target, payload.config),
        itemKey = key(target, id || target)
      if (seen.has(itemKey)) return
      seen.add(itemKey)
      const schema = configFor(target)
      if (!schema || schema.auth) throw new Error("Excluded target")
      const raw: any =
        kind === "global"
          ? await payload.findGlobal({
              slug: target as any,
              req,
              overrideAccess: false,
              depth: 0,
            })
          : await payload.findByID({
              collection: target as any,
              id: id!,
              draft: true,
              req,
              overrideAccess: false,
              depth: 0,
            })
      const data = await projectContentResponse(req, target, raw)
      const relations: Reference[] = []
      await mapReferences(
        schema.fields,
        strip(data, target),
        async ref => {
          relations.push(ref)
          return ref.id
        },
        "",
        req
      )
      const item: any = {
        key: itemKey,
        target,
        sourceId: id || target,
        kind,
        data: strip(data, target),
        mode: schema.versions?.drafts
          ? raw._status === "published"
            ? "publish"
            : "draft"
          : "live",
        schemaHash: hash(schemaShape(schema.fields, req)),
        relations,
      }
      if (target === "media") {
        const localDir =
          typeof schema.upload === "object" ? schema.upload.staticDir : undefined
        const file =
          request.mediaFiles?.[id!] ||
          (localDir && raw.filename
            ? path.join(localDir, path.basename(raw.filename))
            : undefined)
        if (!file)
          throw new Error(
            "Supply an explicit downloaded mediaFiles path for remote storage; no arbitrary URL fetching"
          )
        const bytes = await readFile(file)
        if (bytes.length > 2 * 1024 * 1024)
          throw new Error(
            "Transfer images must be at most 2 MiB; prepare larger assets through the CMS"
          )
        item.media = {
          base64: bytes.toString("base64"),
          sha256: createHash("sha256").update(bytes).digest("hex"),
          alt: raw.alt || "Website image",
        }
      }
      items.push(item)
      for (const ref of relations) {
        try {
          contentTarget(ref.target, payload.config)
          await gather(ref.target, ref.id)
        } catch (error) {
          if (
            [
              ...catalogue(payload.config).collections,
              ...catalogue(payload.config).globals,
            ].includes(ref.target)
          )
            throw error
          external.push(ref)
        }
      }
      item.checksum = hash({ ...item, checksum: undefined })
    }
    for (const selected of request.selection) await gather(selected.target, selected.id)
    const bundle = {
      schemaVersion: 1,
      sourceSiteId: request.expectedSiteId,
      release: JSON.parse(await readFile("package.json", "utf8")).version,
      items,
      externalReferences: external,
    }
    await output(request.bundleFile, bundle)
    await output(request.reportFile || ".smartsite/transfers/report.json", {
      status: "exported",
      items: items.length,
      externalReferences: external,
      bundleChecksum: hash(bundle),
    })
  } else {
    const bundle = JSON.parse(await readFile(request.bundleFile, "utf8"))
    if (
      bundle.schemaVersion !== 1 ||
      !request.bundleChecksum ||
      hash(bundle) !== request.bundleChecksum
    )
      throw new Error("Bundle checksum/version mismatch")
    if (bundle.sourceSiteId === request.expectedSiteId)
      throw new Error("Source and destination must be distinct")
    const mappings: Record<string, string> = {}
    const unresolved: any[] = []
    const omissions: any[] = []
    const items = new Map<string, any>(bundle.items.map((i: any) => [i.key, i]))
    for (const item of bundle.items) {
      const schema = configFor(item.target)
      if (
        !schema ||
        schema.auth ||
        hash(schemaShape(schema.fields, req)) !== item.schemaHash ||
        hash({ ...item, checksum: undefined }) !== item.checksum
      )
        throw new Error(`Schema or checksum mismatch: ${item.key}`)
      for (const ref of item.relations) {
        if (items.has(key(ref.target, ref.id))) continue
        const mapping = request.referenceMappings?.find(
          (m: any) => m.target === ref.target && m.sourceId === ref.id
        )
        if (mapping) {
          await payload.findByID({
            collection: ref.target,
            id: mapping.destinationId,
            req,
            overrideAccess: false,
            depth: 0,
          })
          mappings[key(ref.target, ref.id)] = mapping.destinationId
        } else if (
          !ref.required &&
          request.optionalOmissions?.includes(`${item.target}.${ref.path}`)
        )
          omissions.push({ item: item.key, ...ref })
        else unresolved.push({ item: item.key, ...ref })
      }
    }
    // No writes until every excluded reference and required schema is verified.
    if (unresolved.length) {
      await output(request.reportFile || ".smartsite/transfers/report.json", {
        status: "blocked",
        unresolved,
        omissions,
      })
      throw new Error("Unresolved relationships; review the private report")
    }
    const approvalScope = hash({
      bundle: request.bundleChecksum,
      destination: request.expectedSiteId,
      operator: request.operatorId,
      mappings: request.referenceMappings || [],
      omissions: request.optionalOmissions || [],
    })
    const receiptFile = request.receiptFile || ".smartsite/transfers/import-receipt.json"
    let receipt: any = {
      bundleChecksum: request.bundleChecksum,
      destination: request.expectedSiteId,
      mappings: {},
      beforeGlobals: {},
      operations: {},
      afterRevisions: {},
    }
    try {
      receipt = JSON.parse(await readFile(receiptFile, "utf8"))
    } catch (error: any) {
      if (error.code !== "ENOENT") throw error
    }
    if (
      receipt.bundleChecksum !== request.bundleChecksum ||
      receipt.destination !== request.expectedSiteId
    )
      throw new Error("Receipt target mismatch")
    receipt.operations ??= {}
    receipt.afterRevisions ??= {}
    const hasEffects =
      Object.keys(receipt.operations).length > 0 ||
      Object.keys(receipt.mappings).length > 0
    if (hasEffects && receipt.approvalScope !== approvalScope)
      throw new Error(
        "Import receipt scope changed after effects; preserve the original operator, mappings and omissions"
      )
    receipt.approvalScope = approvalScope
    Object.assign(mappings, receipt.mappings)
    for (const target of new Set<string>(
      bundle.items.filter((i: any) => i.kind === "collection").map((i: any) => i.target)
    )) {
      const existing = await payload.find({
        collection: target as any,
        req,
        overrideAccess: false,
        depth: 0,
        pagination: false,
      })
      const imported = new Set(
        Object.entries(receipt.mappings)
          .filter(([k]) => k.startsWith(target + ":"))
          .map(([, v]) => String(v))
      )
      // An interrupted result may have a committed operation but no local receipt.
      for (const [itemKey, saved] of Object.entries(receipt.operations) as any) {
        if (!itemKey.startsWith(target + ":")) continue
        const status = JSON.parse(
          (await operationStatus({ operationId: saved.operationId }, req)).content[0].text
        )
        if (status.status === "committed") {
          const id = status.result.document.id
          imported.add(String(id))
          mappings[itemKey] = id
          receipt.mappings[itemKey] = id
          receipt.afterRevisions[itemKey] = status.result.revision
        }
      }
      if (existing.docs.some((doc: any) => !imported.has(String(doc.id))))
        throw new Error(
          `Destination ${target} is populated; prepare explicit reconciliation instead of overwrite`
        )
    }
    // Topological ordering blocks cycles rather than copying unresolved source IDs.
    const ordered: any[] = []
    const visiting = new Set<string>(),
      done = new Set<string>()
    const order = (item: any) => {
      if (done.has(item.key)) return
      if (visiting.has(item.key))
        throw new Error("Cyclic content references require a reviewed staged migration")
      visiting.add(item.key)
      for (const ref of item.relations) {
        const dependency = items.get(key(ref.target, ref.id))
        if (dependency) order(dependency)
      }
      visiting.delete(item.key)
      done.add(item.key)
      ordered.push(item)
    }
    for (const item of bundle.items) order(item)
    const planFile = request.planFile || ".smartsite/transfers/import-plan.json"
    if (!request.apply) {
      const globals: Record<string, any> = {}
      for (const item of ordered.filter(i => i.kind === "global")) {
        const current = await payload.findGlobal({
          slug: item.target,
          req,
          overrideAccess: false,
          depth: 0,
        })
        globals[item.key] = {
          revision: revision(current),
          before: await projectContentResponse(req, item.target, current),
        }
      }
      await output(planFile, { schemaVersion: 1, approvalScope, globals })
      await output(request.reportFile || ".smartsite/transfers/report.json", {
        status: "dry-run",
        destination: request.expectedSiteId,
        order: ordered.map(i => i.key),
        omissions,
        planFile,
        globalChanges: ordered
          .filter(i => i.kind === "global")
          .map(i => ({ target: i.target, before: globals[i.key].before, after: i.data })),
      })
    } else {
      if (!request.approvedPublication)
        throw new Error("Apply requires explicit approvedPublication scope")
      const plan = JSON.parse(await readFile(planFile, "utf8"))
      if (plan.schemaVersion !== 1 || plan.approvalScope !== approvalScope)
        throw new Error("Dry-run approval scope changed; review a new dry run")
      // Check ALL globals before any collection/media effect.
      for (const item of ordered.filter(i => i.kind === "global")) {
        if (receipt.mappings[item.key]) continue
        const pending = receipt.operations[item.key]
        if (pending) {
          const status = JSON.parse(
            (await operationStatus({ operationId: pending.operationId }, req)).content[0]
              .text
          )
          if (status.status === "committed") continue
        }
        const current = await payload.findGlobal({
          slug: item.target,
          req,
          overrideAccess: false,
          depth: 0,
        })
        if (revision(current) !== plan.globals[item.key]?.revision)
          throw new Error(`Global changed after dry run: ${item.target}`)
      }
      for (const item of ordered) {
        if (receipt.mappings[item.key]) {
          const current =
            item.kind === "global"
              ? await payload.findGlobal({
                  slug: item.target,
                  req,
                  overrideAccess: false,
                  depth: 0,
                })
              : await payload.findByID({
                  collection: item.target,
                  id: receipt.mappings[item.key],
                  req,
                  overrideAccess: false,
                  depth: 0,
                  draft: true,
                })
          if (
            receipt.afterRevisions[item.key] &&
            revision(current) !== receipt.afterRevisions[item.key]
          )
            throw new Error(`Imported content changed since receipt: ${item.key}`)
          continue
        }
        const schema = configFor(item.target)
        const data = await mapReferences(
          schema.fields,
          item.data,
          async ref => mappings[key(ref.target, ref.id)] ?? null,
          "",
          req
        )
        // Deterministic UUID binds retries to this bundle, destination and item.
        const digest = createHash("sha256")
          .update(`${request.bundleChecksum}:${request.expectedSiteId}:${item.key}`)
          .digest("hex")
        const operationId = `${digest.slice(0, 8)}-${digest.slice(8, 12)}-4${digest.slice(13, 16)}-8${digest.slice(17, 20)}-${digest.slice(20, 32)}`
        let args: any = {
          operationId,
          target: item.target,
          action: "create",
          data,
          mode: item.mode,
        }
        if (item.kind === "global") {
          const current = await payload.findGlobal({
            slug: item.target,
            req,
            overrideAccess: false,
            depth: 0,
          })
          receipt.beforeGlobals[item.key] ??= plan.globals[item.key].before
          args = {
            ...args,
            action: "update",
            expectedRevision: plan.globals[item.key].revision,
          }
          await output(receiptFile, receipt)
        }
        if (item.media) {
          if (
            createHash("sha256")
              .update(Buffer.from(item.media.base64, "base64"))
              .digest("hex") !== item.media.sha256
          )
            throw new Error("Media checksum mismatch")
          args = {
            target: "media",
            operationId,
            base64: item.media.base64,
            alt: item.media.alt,
          }
        }
        // Persist exact input BEFORE effects, including the global's original revision.
        // A lost response replays that same input against the durable server receipt.
        args = receipt.operations[item.key] ?? args
        receipt.operations[item.key] = args
        await output(receiptFile, receipt)
        const result = JSON.parse(
          (await withOperation(args, req, item.media ? uploadMedia : contentSave))
            .content[0].text
        )
        if (item.kind === "collection") mappings[item.key] = result.document.id
        receipt.mappings[item.key] =
          item.kind === "global" ? item.target : result.document.id
        receipt.afterRevisions[item.key] = result.revision
        await output(receiptFile, receipt)
      }
      await output(request.reportFile || ".smartsite/transfers/report.json", {
        status: "applied",
        items: ordered.length,
        omissions,
        receiptFile,
      })
    }
  }
} finally {
  await payload.destroy()
}
