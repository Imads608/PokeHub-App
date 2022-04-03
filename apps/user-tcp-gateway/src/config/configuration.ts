export default () => ({
  appPort: parseInt(process.env.APPLICATION_PORT, 10) || 3000,
  appName: process.env.APPLICATION_NAME,
  userService: {
    host: process.env.USER_SERVICE_HOST,
    port: process.env.USER_SERVICE_PORT
  },
});
