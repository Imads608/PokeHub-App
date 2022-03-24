export default () => ({
  appPort: parseInt(process.env.APPLICATION_PORT, 10) || 3000,
  httpPort: parseInt(process.env.HTTP_PORT, 10) || 3001,
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
      name: 'events-exchange',
      userEventsRoutingPattern: 'events.user',
    }
  },
  awsConfig: {
    profile: 'pokehub',
    userBucketName: process.env.AWS_USER_DATA_BUCKET_NAME
  }
});
