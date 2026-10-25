import { mkdir, open, writeFile } from "node:fs/promises"
import path from "node:path"
import { spawn } from "node:child_process"
import { MongoClient } from "mongodb"
import { local, owned, processIdentity, waitFor, delay, saveState } from "./state.mjs"
export function databaseURL(state, credentials) {
  return `mongodb://smartsite:${encodeURIComponent(credentials.databasePassword)}@127.0.0.1:${state.databasePort}/${state.databaseName}?authSource=admin&replicaSet=${state.replicaSet}`
}
export async function inspectDatabase(state, credentials) {
  const client = new MongoClient(databaseURL(state, credentials), {
    serverSelectionTimeoutMS: 1500,
  })
  try {
    await client.connect()
    const hello = await client.db("admin").command({ hello: 1 })
    return {
      connected: true,
      transactions: Boolean(
        hello.setName === state.replicaSet &&
        hello.isWritablePrimary &&
        hello.logicalSessionTimeoutMinutes
      ),
      owned: owned(state.databaseProcess),
    }
  } finally {
    await client.close()
  }
}
export async function ensureDatabase(state, credentials) {
  const running = owned(state.databaseProcess)
  if (running) {
    try {
      const status = await inspectDatabase(state, credentials)
      if (status.transactions) return
    } catch {
      // A crash can occur after recording the process but before replica/user
      // initialization. Resume only this proven-owned process below.
    }
  }
  if (!running) {
    const data = path.join(local, "mongo")
    await mkdir(data, { recursive: true, mode: 0o700 })
    const keyFile = path.join(local, "mongo-key")
    try {
      await writeFile(keyFile, credentials.replicaKey, { mode: 0o600, flag: "wx" })
    } catch (error) {
      if (error.code !== "EEXIST") throw error
    }
    const log = await open(path.join(local, "mongo.log"), "a", 0o600)
    const child = spawn(
      "mongod",
      [
        "--dbpath",
        data,
        "--bind_ip",
        "127.0.0.1",
        "--port",
        String(state.databasePort),
        "--replSet",
        state.replicaSet,
        "--auth",
        "--keyFile",
        keyFile,
      ],
      { detached: true, stdio: ["ignore", log.fd, log.fd] }
    )
    await new Promise((resolve, reject) => {
      child.once("spawn", resolve)
      child.once("error", reject)
    })
    child.unref()
    await log.close()
    await delay(300)
    const identity = processIdentity(child.pid)
    if (!identity)
      throw new Error(
        "Mongo did not start; inspect private mongo.log. An occupied port is never killed."
      )
    state.databaseProcess = { pid: child.pid, identity }
    await saveState(state)
  }
  // The localhost exception only permits first replica/user initialization.
  const client = new MongoClient(
    `mongodb://127.0.0.1:${state.databasePort}/admin?directConnection=true`,
    { serverSelectionTimeoutMS: 1500 }
  )
  try {
    await waitFor(() => client.connect())
    try {
      await client.db().command({
        replSetInitiate: {
          _id: state.replicaSet,
          members: [{ _id: 0, host: `127.0.0.1:${state.databasePort}` }],
        },
      })
    } catch (error) {
      if (![23, 13].includes(error.code)) throw error
    }
    await waitFor(async () => (await client.db().command({ hello: 1 })).isWritablePrimary)
    try {
      await client.db().command({
        createUser: "smartsite",
        pwd: credentials.databasePassword,
        roles: [{ role: "root", db: "admin" }],
      })
    } catch (error) {
      if (![51003, 13].includes(error.code)) throw error
    }
  } finally {
    await client.close()
  }
  await inspectDatabase(state, credentials)
}
