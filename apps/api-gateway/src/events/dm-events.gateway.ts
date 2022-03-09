import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException, WsResponse, } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AppLogger } from '@pokehub/common/logger';
import { Inject } from '@nestjs/common';
import { AUTH_SERVICE, IAuthService } from '../common/auth-service.interface';

@WebSocketGateway({ cors: true, namespace: 'dms' })
export class DMEventsGateway implements OnGatewayDisconnect, OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(private readonly logger: AppLogger, @Inject(AUTH_SERVICE) private readonly authService: IAuthService) {
    logger.setContext(DMEventsGateway.name);
  }
  
  async handleConnection(client: Socket, ...args: any[]) {
    try {
      this.logger.log(`handleConnection: A new client with id ${client.id} is trying to connect.`);
      if (!client.handshake.query.token) {
        this.logger.log(`handleConnection: No Authorization Token found while connecting to client with id ${client.id}. Disconnecting...`);
        client.disconnect();
      }

      await this.authService.decodeToken(client.handshake.query.token as string);
      this.logger.log(`handleConnection: Client ${client.id} Successfully connected to server`);
    } catch (err) {
      this.logger.error(`handleConnection: Got error while trying to connect with client: ${JSON.stringify(err)}. Disconnecting`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`handleDisconnect: Client ${client.id} Disconnected`);
  }
}
