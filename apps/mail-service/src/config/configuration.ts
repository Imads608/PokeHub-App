export default () => ({
  appPort: parseInt(process.env.APPLICATION_PORT, 10) || 3000,
  appName: process.env.APPLICATION_NAME,
  emailVerificationEndpoint: process.env.EMAIL_VERIFICATION_ENDPOINT,
  frontendDetails: {
    host: process.env.FRONTEND_HOST,
    port: process.env.FRONTEND_PORT,
  },
  rabbitMQ: {
    host: process.env.RABBITMQ_SERVICE,
    port: process.env.RABBITMQ_PORT,
  },
  smtpConfig: {
    host: process.env.SMTP_HOST,
    username: process.env.SMTP_USERNAME,
    password: process.env.SMTP_PASSWORD,
    email: process.env.SMTP_EMAIL,
  },
});
