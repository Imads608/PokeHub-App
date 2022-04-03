export default () => ({
  appPort: parseInt(process.env.APPLICATION_PORT, 10) || 3000,
  httpPort: parseInt(process.env.HTTP_PORT, 10) || 3001,
  appName: process.env.APPLICATION_NAME,
  appServiceName: process.env.APPLICATION_SERVICE_NAME,
  protocol: process.env.PROTOCOL,
  callbacks: {
    host: process.env.CALLBACK_HOST,
    port: process.env.CALLBACK_PORT
  },
  userTCPGateway: {
    host: process.env.USER_TCP_GATEWAY_HOST,
    port: process.env.USER_TCP_GATEWAY_PORT,
  },
  rabbitMQ: {
    host: process.env.RABBITMQ_SERVICE,
    port: process.env.RABBITMQ_PORT,
    eventsExchange: {
      name: 'events-exchange',
      userEventsRoutingPattern: 'events.user.*',
      publicRoomEventsRoutingPattern: 'events.publicRooms.*',
      dmEventsRoutingPattern: 'events.dms.*',
    },
  },
  tokenDetails: {
    accessTokenSecret: process.env.ACCESS_TOKEN_SECRET,
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET,
    accessTokenExpiration: process.env.ACCESS_TOKEN_EXPIRATION_SECONDS || 60,
    emailVerificationTokenExpiration: process.env.EMAIL_VERIFICATION_TOKEN_EXPIRATON_SECONDS || 900,
    passwordResetTokenExpiration: process.env.PASSWORD_RESET_TOKEN_EXPIRATON_SECONDS || 900
  },
  googleClientCreds: {
    id: process.env.GOOGLE_CLIENT_ID,
    secret: process.env.GOOGLE_CLIENT_SECRET,
    callback: process.env.GOOGLE_OAUTH_CALLBACK
  },
});
