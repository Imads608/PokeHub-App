export default () => ({
    appPort: parseInt(process.env.APPLICATION_PORT, 10) || 3000,
    appName: process.env.APPLICATION_NAME,
    userService: {
        host: process.env.USER_MICROSERVICE_HOST,
        port: process.env.USER_MICROSERVICE_PORT
    },
    authService: {
        host: process.env.AUTH_MICROSERVICE_HOST,
        port: process.env.AUTH_MICROSERVICE_PORT
    },
    chatService: {
        host: process.env.CHAT_MICROSERVICE_HOST,
        port: process.env.CHAT_MICROSERVICE_PORT
    },
    mailService: {
        host: process.env.MAIL_MICROSERVICE_HOST,
        port: process.env.MAIL_MICROSERVICE_PORT
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
    googleClientCreds: {
        id: process.env.GOOGLE_CLIENT_ID,
        secret: process.env.GOOGLE_CLIENT_SECRET
    }
});