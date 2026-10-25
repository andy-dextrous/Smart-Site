/** Copy a quiesced media directory without replacing different bytes or following links.
 * Used before a legacy Docker build is replaced, and to prepare compatible old-code rollback.
 * Never deletes the source. Reports contain filenames, sizes and SHA-256, not credentials.
 */
import { createHash } from 'node:crypto'
import { constants } from 'node:fs'
import { copyFile, lstat, mkdir, readFile, readdir, realpath } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const digest = bytes => createHash('sha256').update(bytes).digest('hex')
async function directoryWithoutLinks(directory, create = false) {
  const absolute = path.resolve(directory)
  let cursor = path.parse(absolute).root
  for (const part of absolute.slice(cursor.length).split(path.sep).filter(Boolean)) {
    cursor = path.join(cursor, part)
    let info
    try { info = await lstat(cursor) } catch (error) {
      if (error.code !== 'ENOENT' || !create) throw error
      await mkdir(cursor)
      info = await lstat(cursor)
    }
    if (info.isSymbolicLink() || !info.isDirectory()) throw new Error(`Media directory is not a real directory: ${cursor}`)
  }
  return realpath(absolute)
}
export async function copyMedia(sourceArgument, destinationArgument) {
  if (!path.isAbsolute(sourceArgument) || !path.isAbsolute(destinationArgument)) throw new Error('Use absolute source and destination directories')
  // Resolve the top-level path before checking children: macOS /tmp and /var are
  // system aliases, but links inside the supplied media tree are never accepted.
  const sourceInfo = await lstat(sourceArgument)
  if (sourceInfo.isSymbolicLink() || !sourceInfo.isDirectory()) throw new Error('Media source must be a real directory')
  const source = await realpath(sourceArgument)
  const destinationParent = await realpath(path.dirname(destinationArgument))
  const destination = await directoryWithoutLinks(path.join(destinationParent, path.basename(destinationArgument)), true)
  if (source === destination || source.startsWith(destination + path.sep) || destination.startsWith(source + path.sep)) throw new Error('Media source and destination must be separate directories')
  const files = []
  async function walk(directory, prefix = '') {
    for (const item of await readdir(directory, { withFileTypes: true })) {
      const relative = prefix ? `${prefix}/${item.name}` : item.name
      const file = path.join(source, relative)
      if (item.isSymbolicLink()) throw new Error(`Media symlink requires manual review: ${relative}`)
      if (item.isDirectory()) await walk(file, relative)
      else if (item.isFile()) {
        const bytes = await readFile(file)
        files.push({ path: relative, bytes: bytes.length, sha256: digest(bytes) })
      } else throw new Error(`Unsupported media file: ${relative}`)
    }
  }
  await walk(source)
  // Check every collision before copying any file. An interrupted same-byte copy
  // can be resumed; a different existing upload is never silently overwritten.
  for (const file of files) {
    const target = path.join(destination, file.path)
    await directoryWithoutLinks(path.dirname(target), true)
    const info = await lstat(target).catch(error => { if (error.code === 'ENOENT') return null; throw error })
    if (info && (!info.isFile() || info.isSymbolicLink() || digest(await readFile(target)) !== file.sha256)) throw new Error(`Conflicting existing media: ${file.path}`)
  }
  for (const file of files) {
    const from = path.join(source, file.path), to = path.join(destination, file.path)
    if (digest(await readFile(from)) !== file.sha256) throw new Error(`Source media changed during copy: ${file.path}`)
    try { await copyFile(from, to, constants.COPYFILE_EXCL) } catch (error) { if (error.code !== 'EEXIST') throw error }
    const info = await lstat(to)
    if (!info.isFile() || info.isSymbolicLink() || digest(await readFile(to)) !== file.sha256) throw new Error(`Copied media verification failed: ${file.path}`)
  }
  return { schemaVersion: 1, status: 'copied-and-verified', files: files.sort((a, b) => a.path.localeCompare(b.path)) }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2)
  if (args.length !== 4 || args[0] !== '--from' || args[2] !== '--to') throw new Error('Usage: node docker/copy-media.mjs --from /absolute/source --to /absolute/destination')
  console.log(JSON.stringify(await copyMedia(args[1], args[3])))
}
