import { MongoAdapter as MongoDB } from '@builderbot/database-mongo'

export type IDatabase = typeof MongoDB
export const adapterDB = new MongoDB({
    dbUri: process.env.MONGO_DB_URI,
    dbName: process.env.MONGO_DB_NAME
})