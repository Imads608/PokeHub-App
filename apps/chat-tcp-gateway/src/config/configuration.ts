export default () => ({
  appPort: parseInt(process.env.APPLICATION_PORT, 10) || 3000,
  appName: process.env.APPLICATION_NAME,
  chatService: {
    host: process.env.CHAT_SERVICE_HOST,
    port: process.env.CHAT_SERVICE_PORT
  },
});
