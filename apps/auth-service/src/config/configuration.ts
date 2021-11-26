export default () => ({
    appPort: parseInt(process.env.APPLICATION_PORT, 10) || 3000,
    userService: {
        host: process.env.USER_MICROSERVICE_HOST,
        port: process.env.USER_MICROSERVICE_PORT
    },
    rabbitMQ: {
        host: process.env.RABBITMQ_SERVICE,
        port: process.env.RABBITMQ_PORT,
        eventsExchange: {
            name: 'events-exchange',
            userEventsRoutingPattern: 'events.user.*',
            publicRoomEventsRoutingPattern: 'events.publicRooms.*',
            dmEventsRoutingPattern: 'events.dms.*'
        }
    },
    tokenDetails: {
        accessTokenSecret: process.env.ACCESS_TOKEN_SECRET,
        refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET,
        accessTokenExpiration: process.env.ACCESS_TOKEN_EXPIRATION_SECONDS
    },
    googleClientCreds: {
        id: process.env.GOOGLE_CLIENT_ID
    }
});