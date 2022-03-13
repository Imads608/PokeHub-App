const appConfig: { apiGateway: string; chatService: string, userNotifService: string, chatNotifService: string, frontend: string } = {
  apiGateway: 'http://localhost:3015',
  userNotifService: 'http://localhost:3018',
  chatNotifService: 'http://localhost:3017',
  chatService: 'http://localhost:3002',
  frontend: 'http://localhost:4200'
};

export default appConfig;
