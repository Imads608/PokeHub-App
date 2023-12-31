export default () => ({
    appPort: parseInt(process.env.APPLICATION_PORT, 10) || 3000,
    appName: process.env.APPLICATION_NAME,
    protocol: process.env.PROTOCOL,
    authGateway: {
      host: process.env.AUTH_GATEWAY_HOST,
      tcpPort: process.env.AUTH_GATEWAY_TCP_PORT,
      restPort: process.env.AUTH_GATEWAY_REST_PORT
    },
    rabbitMQ: {
      host: process.env.RABBITMQ_SERVICE,
      port: process.env.RABBITMQ_PORT,
      eventsExchange: {
        name: 'events-exchange',
        userEventsRoutingPattern: 'events.user'
      },
    },
  });
  