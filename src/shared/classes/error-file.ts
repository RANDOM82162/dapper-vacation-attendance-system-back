import bunyan from 'bunyan';
import fs from 'fs';

const errorStream = {
    level: 'error',
    path: '/var/log/myapp/error.log', 
};

export const loggerFile = bunyan.createLogger({
    name: 'test-file',
    streams: [
        {
            stream: process.stdout,
            level: 'info',
        },
        errorStream, // Agrega la corriente de archivo de error
    ],
});

// Ejemplo de registro de un error
loggerFile.error('Un error ha ocurrido', new Error('Detalles del error'));