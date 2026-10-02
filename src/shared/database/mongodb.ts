import { Db, MongoClient, ObjectID } from "mongodb";
import * as express from "express";


const url = process.env.CONNECTION_STRING as string;

const dbName = process.env.DB_NAME as string;

const client: MongoClient = new MongoClient(url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

let connection: Db;
let connectionPromise: Promise<Db> | null = null;


export async function initializeMongo(req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    await connect();
    next();
  } catch (error) {
    next(error);
  }
}

async function getClient() {
  return client;
}

async function connect(databaseName?: string) {
  if (connection) return connection;

  if (!connectionPromise) {
    connectionPromise = client.connect()
      .then(() => {
        connection = client.db(databaseName || dbName);
        return connection;
      })
      .catch((error) => {
        connectionPromise = null;
        throw error;
      });
  }

  return connectionPromise;
}


async function createSession() {
  try {
    return await client.startSession();
  } catch (error) {
    throw error;
  }
}

function getMongoId(documentId: string) {
  try {
    return new ObjectID(documentId);
  } catch (error) { }
}

export { connect, getMongoId, createSession, getClient };
