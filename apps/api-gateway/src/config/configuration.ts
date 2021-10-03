export default () => ({
    appPort: parseInt(process.env.APPLICATION_PORT, 10) || 3000,
    userService: {
        host: 'localhost',
        port: process.env.USER_MICROSERVICE_PORT
    },
    authService: {
        host: 'localhost',
        port: process.env.AUTH_MICROSERVICE_PORT
    },
    chatService: {
        host: 'localhost',
        port: process.env.CHAT_MICROSERVICE_PORT
    },
    rabbitMQ: {
        host: 'localhost',
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