require("dotenv").config();

import { MongoClient } from "mongodb";

const connectionString = process.env.CONNECTION_STRING;
const dbName = process.env.DB_NAME;

if (!connectionString || !dbName) {
  throw new Error("Faltan CONNECTION_STRING o DB_NAME en el archivo .env");
}

async function initDatabase() {
  const client = new MongoClient(connectionString, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  } as any);

  try {
    await client.connect();
    const db = client.db(dbName);
    await Promise.all([
      ensureCollection(db, "employees"),
      ensureCollection(db, "vacation_requests"),
      ensureCollection(db, "vacation_balances"),
      ensureCollection(db, "attendance_records"),
      ensureCollection(db, "attendance_imports"),
      ensureCollection(db, "attendance_settings"),
      ensureCollection(db, "notifications"),
    ]);

    await Promise.all([
      db.collection("employees").createIndex({ uid: 1 }, { unique: true, sparse: true }),
      db.collection("employees").createIndex({ email: 1 }, { unique: true, sparse: true }),
      db.collection("employees").createIndex({ employeeNumber: 1 }, { unique: true, sparse: true }),
      db.collection("employees").createIndex({ name: 1 }),
      db.collection("employees").createIndex({ hireDate: 1 }),
      db.collection("employees").createIndex({ department: 1, role: 1, status: 1 }),
      db.collection("employees").createIndex({ managerId: 1 }),

      db.collection("vacation_requests").createIndex({ employeeId: 1, status: 1 }),
      db.collection("vacation_requests").createIndex({ managerId: 1, status: 1 }),
      db.collection("vacation_requests").createIndex({ startDate: 1, endDate: 1 }),
      db.collection("vacation_requests").createIndex({ folio: 1 }, { unique: true, sparse: true }),

      db.collection("vacation_balances").createIndex({ employeeId: 1, year: 1 }, { unique: true }),

      db.collection("attendance_records").createIndex({ employeeId: 1, date: 1 }, { unique: true }),
      db.collection("attendance_records").createIndex({ weekKey: 1, employeeName: 1 }, { unique: true }),
      db.collection("attendance_records").createIndex({ weekStartDate: 1, weekEndDate: 1 }),
      db.collection("attendance_records").createIndex({ importId: 1 }),
      db.collection("attendance_imports").createIndex({ uploadedAtTS: -1 }),
      db.collection("attendance_imports").createIndex({ weekKeys: 1 }),
      db.collection("attendance_imports").createIndex({ "weeks.weekStartDate": 1 }),
      db.collection("attendance_imports").createIndex({ "weeks.weekEndDate": 1 }),

      db.collection("notifications").createIndex({ usuario_id: 1, leido: 1, creationDateTS: -1 }),
      db.collection("notifications").createIndex({ usuario_id: 1, categoria: 1, creationDateTS: -1 }),
      db.collection("notifications").createIndex({ creationDateTS: -1 }),
    ]);

    await db.collection("attendance_settings").updateOne(
      { key: "default" },
      {
        $setOnInsert: {
          key: "default",
          workdayStartTime: "09:00",
          lateToleranceMinutes: 5,
          lateRecordsForSaturday: 3,
          creationDateTS: new Date().getTime(),
        },
      },
      { upsert: true },
    );

    console.log(`Base de datos inicializada: ${dbName}`);
  } finally {
    await client.close();
  }
}

async function ensureCollection(db: any, collectionName: string) {
  const collections = await db.listCollections({ name: collectionName }).toArray();

  if (collections.length === 0) {
    await db.createCollection(collectionName);
  }
}

initDatabase().catch((error) => {
  console.error("Error al inicializar la base de datos");
  console.error(error);
  process.exit(1);
});

// TODO: eliminar este script cuando la inicializacion de Mongo quede resuelta con migraciones o seed formal.
