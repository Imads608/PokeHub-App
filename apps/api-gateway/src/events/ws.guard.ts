import { CanActivate, ExecutionContext, Inject, Injectable } from "@nestjs/common";
import { AppLogger } from "@pokehub/common/logger";
import { Observable } from "rxjs";
import { AUTH_SERVICE, IAuthService } from "../common/auth-service.interface";

@Injectable()
export class WsGuard implements CanActivate {

    constructor(private readonly logger: AppLogger, @Inject(AUTH_SERVICE) private authService: IAuthService) {
        this.logger.setContext(WsGuard.name);
    }

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const wsContext = context.switchToWs();
        const data = wsContext.getData()
        const token = data.headers.authorization;

        this.logger.log(`canActivate: Got Data ${JSON.stringify(data)} and token ${token}`);
        //const token = wsContext.args[0].handshake.headers.authorization
        return true;
    }
    
}