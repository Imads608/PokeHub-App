export default () => ({
    appPort: parseInt(process.env.APPLICATION_PORT, 10) || 3000,
    appName: process.env.APPLICATION_NAME,
    rabbitMQ: {
      host: process.env.RABBITMQ_SERVICE,
      port: process.env.RABBITMQ_PORT,
      eventsExchange: {
        name: 'events-exchange'
      },
    },
  });
  