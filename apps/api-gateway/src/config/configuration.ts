export default () => ({
  appPort: parseInt(process.env.APPLICATION_PORT, 10) || 3000,
  appName: process.env.APPLICATION_NAME,
  protocol: process.env.PROTOCOL || 'http',
  userGateways: {
    tcpGateway: {
      host: process.env.USER_TCP_GATEWAY_HOST,
      port: process.env.USER_TCP_GATEWAY_PORT
    },
    restGateway: {
      host: process.env.USER_REST_GATEWAY_HOST,
      port: process.env.USER_REST_GATEWAY_PORT
    }
  },
  authGateway: {
    host: process.env.AUTH_GATEWAY_HOST,
    tcpPort: process.env.AUTH_GATEWAY_TCP_PORT,
    restPort: process.env.AUTH_GATEWAY_REST_PORT
  },
  chatGateways: {
    tcpGateway: {
      host: process.env.CHAT_TCP_GATEWAY_HOST,
      port: process.env.CHAT_TCP_GATEWAY_PORT
    }
  },
  mailGateway: {
    host: process.env.MAIL_GATEWAY_HOST,
    port: process.env.MAIL_GATEWAY_PORT
  },
  rabbitMQ: {
    host: process.env.RABBITMQ_SERVICE,
    port: process.env.RABBITMQ_PORT,
    eventsExchange: {
      name: 'events-exchange',
      userEventsRoutingPattern: 'events.user',
      publicRoomEventsRoutingPattern: 'events.publicRooms',
      dmEventsRoutingPattern: 'events.dms',
    },
  },
  googleClientCreds: {
    id: process.env.GOOGLE_CLIENT_ID,
    secret: process.env.GOOGLE_CLIENT_SECRET,
  },
});
