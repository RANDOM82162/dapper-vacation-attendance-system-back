require("dotenv").config();

import { spawn, ChildProcess } from "child_process";
import * as net from "net";

const firebaseProjectId = process.env.FIREBASE_PROJECT_ID || process.env.PROJECT_ID || "demo-dapper-vacations";
const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1:9099";
const [authHostname, authPortText] = authHost.split(":");
const authPort = Number(authPortText || "9099");
const commandEnv = {
  ...process.env,
  USE_FIREBASE_EMULATORS: "true",
  FIREBASE_AUTH_EMULATOR_HOST: authHost,
  FIREBASE_PROJECT_ID: firebaseProjectId,
  PROJECT_ID: firebaseProjectId,
};

let emulatorProcess: ChildProcess | null = null;

async function startFirebaseEmulators() {
  emulatorProcess = spawn(
    getExecutable("npm"),
    ["exec", "firebase-tools", "--", "emulators:start", "--only", "auth", "--project", firebaseProjectId],
    {
      cwd: process.cwd(),
      env: commandEnv,
      stdio: "inherit",
      shell: isWindows(),
    },
  );

  emulatorProcess.on("exit", (code) => {
    process.exit(code ?? 0);
  });

  await waitForPort(authHostname, authPort, 30000);
}

function waitForPort(host: string, port: number, timeoutMs: number) {
  const startedAt = Date.now();

  return new Promise<void>((resolve, reject) => {
    const tryConnect = () => {
      const socket = net.createConnection({ host, port });

      socket.once("connect", () => {
        socket.destroy();
        resolve();
      });

      socket.once("error", () => {
        socket.destroy();

        if (Date.now() - startedAt >= timeoutMs) {
          reject(new Error(`El emulador de Firebase Auth no respondio en ${host}:${port}.`));
          return;
        }

        setTimeout(tryConnect, 500);
      });
    };

    tryConnect();
  });
}

function getExecutable(command: "npm") {
  if (!isWindows()) return command;
  return `${command}.cmd`;
}

function isWindows() {
  return process.platform === "win32";
}

function stopEmulator() {
  if (!emulatorProcess || emulatorProcess.killed) return;
  emulatorProcess.kill("SIGINT");
}

process.on("SIGINT", () => {
  stopEmulator();
});

process.on("SIGTERM", () => {
  stopEmulator();
});

startFirebaseEmulators().catch((error) => {
  console.error("No se pudo preparar Firebase Emulator.");
  console.error(error?.message || error);
  stopEmulator();
  process.exit(1);
});
