const appConfig: { apiGateway: string; chatService: string, userSocketService: string, chatSocketService: string, frontend: string } = {
  apiGateway: 'http://localhost:3015',
  userSocketService: 'http://localhost:3005',
  chatSocketService: 'http://localhost:3010',
  chatService: 'http://localhost:3002',
  frontend: 'http://localhost:4200'
};

export default appConfig;
