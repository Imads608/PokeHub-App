export default () => ({
    appPort: parseInt(process.env.APPLICATION_PORT, 10) || 3000,
    appName: process.env.APPLICATION_NAME,
    postgresCreds: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      sync: process.env.DB_SYNCHRONIZE
    },
    rabbitMQ: {
      host: process.env.RABBITMQ_SERVICE,
      port: process.env.RABBITMQ_PORT,
      eventsExchange: {
        name: 'user-events-exchange',
        eventsRoutingPattern: 'events'
      },
    },
  });
  