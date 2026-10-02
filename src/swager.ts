
import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Api',
      version: '1.0.0',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    `${__dirname.replace(/\\/g, '/')}/api/**/*.routes.{ts,js}`,
    `${__dirname.replace(/\\/g, '/')}/api/**/*.swagger.{ts,js}`,
  ]
};

export default swaggerJsdoc(options);
