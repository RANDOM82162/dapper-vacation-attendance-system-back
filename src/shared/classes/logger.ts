import bunyan, { LogLevel } from 'bunyan';

// Crea un stream para el archivo de error
const errorStream = {
    level: 'error',
    path: './backend-error.log',
};

// Crea un stream para la salida estándar
const stdoutStream = {
    level: (process.env.LOG_LEVEL || 'info') as LogLevel,
    stream: process.stdout,
};

export const logger = bunyan.createLogger({
    name: 'dapper-vacations-backend',
    streams: [stdoutStream, errorStream],
});

logger.info('dapper-vacations-backend logger started');
