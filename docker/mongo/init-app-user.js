const databaseName = process.env.MONGO_INITDB_DATABASE
const username = process.env.MONGO_APP_USERNAME
const password = process.env.MONGO_APP_PASSWORD

if (!databaseName || !username || !password) {
  throw new Error("Mongo init env vars are incomplete")
}

const database = db.getSiblingDB(databaseName)
const existingUser = database.getUser(username)

if (!existingUser) {
  database.createUser({
    user: username,
    pwd: password,
    roles: [
      {
        role: "readWrite",
        db: databaseName,
      },
    ],
  })
}

