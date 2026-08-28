import { Db, MongoClient, ObjectID } from "mongodb";
import * as express from "express";


const url = process.env.CONNECTION_STRING as string;

const dbName = process.env.DB_NAME as string;

const client: MongoClient = new MongoClient(url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

let connection: Db;


export async function initializeMongo(req: express.Request, res: express.Response, next: express.NextFunction) {
  console.log("initializing mongo....");
  console.log(req.url);
  console.log(connection == undefined ? 'undefined' : 'exists');

  if (!connection) {
    await client.connect();
    connection = client.db(dbName);
  }
  next();
}

async function getClient() {
  return client;
}

async function connect(dbName?: string) {
  try {
    return connection;
  } catch (error) {
    throw error;
  }
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