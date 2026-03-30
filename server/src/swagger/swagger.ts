import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SwapBox API',
      version: '1.0.0',
      description: 'SwapBox — ნივთების გაცვლა-გაჩუქების პლატფორმა',
    },
    servers: [
      { url: 'http://localhost:5000', description: 'Development' },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'token',
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'ავტორიზაცია' },
      { name: 'Items', description: 'ნივთები' },
      { name: 'Users', description: 'მომხმარებლები' },
      { name: 'Chat', description: 'ჩატი' },
      { name: 'Reviews', description: 'შეფასებები' },
      { name: 'Upload', description: 'ფაილების ატვირთვა' },
      { name: 'Categories', description: 'კატეგორიები' },
    ],
  },
  apis: ['./src/presentation/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
