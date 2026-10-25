let ready = false
for (let attempt = 0; attempt < 120; attempt++) {
  try {
    const connection = new Mongo(`mongodb://${encodeURIComponent(process.env.MONGO_INITDB_ROOT_USERNAME)}:${encodeURIComponent(process.env.MONGO_INITDB_ROOT_PASSWORD)}@mongo:27017/admin?authSource=admin&directConnection=true`)
    const admin = connection.getDB("admin")
    const hello = admin.runCommand({hello:1})
    if (hello.setName && hello.setName !== 'smartsite-rs') throw new Error('Unexpected replica set; stop and inspect before conversion')
    if (!hello.setName) {
      const result = admin.runCommand({replSetInitiate:{_id:'smartsite-rs',members:[{_id:0,host:'mongo:27017'}]}})
      if (!result.ok && result.code !== 23) throw new Error(result.errmsg)
    }
    if (hello.setName === 'smartsite-rs' && hello.isWritablePrimary) { ready = true; break }
  } catch (error) { if (attempt === 119) throw error }
  sleep(1000)
}
if (!ready) throw new Error('Replica set did not become writable')
print('Authenticated replica set ready')
