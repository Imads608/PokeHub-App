export default () => ({
    appPort: parseInt(process.env.APPLICATION_PORT, 10) || 3000,
    appName: process.env.APPLICATION_NAME,
    appServiceName: process.env.APPLICATION_SERVICE_NAME,
    protocol: process.env.PROTOCOL,
    authService: {
      host: process.env.AUTH_MICROSERVICE_HOST,
      port: process.env.AUTH_MICROSERVICE_PORT,
      portHttp: process.env.AUTH_MICROSERVICE_HTTP_PORT
    },
    rabbitMQ: {
      host: process.env.RABBITMQ_SERVICE,
      port: process.env.RABBITMQ_PORT,
      eventsExchange: {
        name: 'events-exchange',
        publicRoomEventsRoutingPattern: 'events.publicRooms.*',
        dmEventsRoutingPattern: 'events.dms.*',
      },
    },
  });
  