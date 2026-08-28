import bunyan, { LogLevel } from 'bunyan';
import fs from 'fs';

// Crea un stream para el archivo de error
const errorStream = {
    level: 'error',
    path: './test-error.log', // Ruta del archivo de error
};

// Crea un stream para la salida estándar
const stdoutStream = {
    level: (process.env.LOG_LEVEL || 'info') as LogLevel,
    stream: process.stdout,
};

export const logger = bunyan.createLogger({
    name: 'test-service',
    streams: [stdoutStream, errorStream],
});

logger.info('test-service logger started');