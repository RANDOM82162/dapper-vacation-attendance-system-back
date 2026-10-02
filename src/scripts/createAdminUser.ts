require("dotenv").config();

// TODO: Remove this development-only admin seed script before production.
import { MongoClient, ObjectId } from "mongodb";
import { auth } from "../shared/database/firebase";
import { EmployeeRole, EmployeeStatus } from "../api/employees/employeesDto";

interface CreateAdminArgs {
  email: string;
  password: string;
  name: string;
  employeeNumber: string;
  department: string;
  hireDate: string;
}

async function createAdminUser() {
  const args = parseArgs(process.argv.slice(2));
  validateArgs(args);

  const connectionString = process.env.CONNECTION_STRING;
  const dbName = process.env.DB_NAME;

  if (!connectionString || !dbName) {
    throw new Error("Faltan CONNECTION_STRING o DB_NAME en el archivo .env");
  }

  const normalizedEmail = args.email.trim().toLowerCase();
  const now = Date.now();
  const firebaseUser = await upsertFirebaseAdmin({
    ...args,
    email: normalizedEmail,
  });

  const client = new MongoClient(connectionString, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  } as any);

  try {
    await client.connect();

    const db = client.db(dbName);
    const employees = db.collection("employees");
    const existingEmployee = await employees.findOne({
      $or: [
        { uid: firebaseUser.uid },
        { email: normalizedEmail },
        { employeeNumber: args.employeeNumber },
      ],
    });

    if (
      existingEmployee &&
      existingEmployee.employeeNumber &&
      existingEmployee.employeeNumber !== args.employeeNumber &&
      existingEmployee.email !== normalizedEmail
    ) {
      throw new Error("Ya existe un empleado con ese UID, correo o numero de empleado y no coincide con los datos enviados.");
    }

    const employeeId = existingEmployee?._id || new ObjectId();

    await employees.updateOne(
      { _id: employeeId },
      {
        $set: {
          uid: firebaseUser.uid,
          employeeNumber: args.employeeNumber,
          name: args.name.trim(),
          email: normalizedEmail,
          department: args.department.trim(),
          hireDate: args.hireDate,
          role: EmployeeRole.ADMINISTRADOR,
          status: EmployeeStatus.ACTIVO,
          updateDateTS: now,
        },
        $setOnInsert: {
          _id: employeeId,
          creationDateTS: now,
        },
      },
      { upsert: true },
    );

    console.log("Administrador listo.");
    console.log(`Correo: ${normalizedEmail}`);
    console.log(`UID Firebase: ${firebaseUser.uid}`);
    console.log(`Empleado MongoDB: ${employeeId.toString()}`);
  } finally {
    await client.close();
  }
}

async function upsertFirebaseAdmin(args: CreateAdminArgs) {
  try {
    const existingUser = await auth().getUserByEmail(args.email);
    const updatedUser = await auth().updateUser(existingUser.uid, {
      email: args.email,
      password: args.password,
      displayName: args.name.trim(),
      disabled: false,
      emailVerified: true,
    });

    await auth().setCustomUserClaims(updatedUser.uid, {
      role: EmployeeRole.ADMINISTRADOR,
    });

    return updatedUser;
  } catch (error: any) {
    if (error?.code !== "auth/user-not-found") {
      throw error;
    }

    const createdUser = await auth().createUser({
      email: args.email,
      password: args.password,
      displayName: args.name.trim(),
      disabled: false,
      emailVerified: true,
    });

    await auth().setCustomUserClaims(createdUser.uid, {
      role: EmployeeRole.ADMINISTRADOR,
    });

    return createdUser;
  }
}

function parseArgs(rawArgs: string[]): CreateAdminArgs {
  const values: Record<string, string> = {};

  for (let index = 0; index < rawArgs.length; index += 1) {
    const current = rawArgs[index];
    if (!current.startsWith("--")) continue;

    const key = current.slice(2);
    const next = rawArgs[index + 1];

    if (!next || next.startsWith("--")) {
      values[key] = "";
      continue;
    }

    values[key] = next;
    index += 1;
  }

  return {
    email: values.email || "",
    password: values.password || "",
    name: values.name || "",
    employeeNumber: values.employeeNumber || "",
    department: values.department || "Direccion",
    hireDate: values.hireDate || formatDate(new Date()),
  };
}

function validateArgs(args: CreateAdminArgs) {
  const missingFields = [
    ["email", args.email],
    ["password", args.password],
    ["name", args.name],
    ["employeeNumber", args.employeeNumber],
  ].filter(([, value]) => !String(value).trim());

  if (missingFields.length > 0) {
    printUsage();
    throw new Error(`Faltan datos obligatorios: ${missingFields.map(([field]) => field).join(", ")}`);
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(args.email.trim())) {
    throw new Error("El correo no tiene un formato valido.");
  }

  if (args.password.length < 6) {
    throw new Error("La contrasena debe tener al menos 6 caracteres.");
  }

  if (!/^\d+$/.test(args.employeeNumber.trim())) {
    throw new Error("El numero de empleado debe ser numerico.");
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(args.hireDate)) {
    throw new Error("La fecha de ingreso debe tener formato YYYY-MM-DD.");
  }
}

function printUsage() {
  console.log("");
  console.log("Uso:");
  console.log("npm run auth:create-admin -- --email admin@empresa.com --password admin123 --name \"Administrador\" --employeeNumber 1");
  console.log("");
  console.log("Opcionales:");
  console.log("--department Direccion");
  console.log("--hireDate 2026-09-04");
  console.log("");
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

createAdminUser().catch((error) => {
  console.error("No se pudo crear el administrador.");
  console.error(error?.message || error);
  process.exit(1);
});
