import { Controller, Logger, Post, UseInterceptors } from '@nestjs/common';
import { AuthService } from '../common/auth.service';
import { LoginInterceptor } from './login.interceptor';
import { UsernameLogin, EmailLogin } from '@pokehub/auth';

@Controller('auth')
export class AuthController {
    private readonly logger = new Logger(AuthController.name);
    
    constructor(private readonly authService: AuthService) {}

    //@UseInterceptors(AuthInterceptor)
    /*@UseGuards(AuthGuard('local'))
    @Post('login')
    async login(@Request() req) {
        return this.authService.login(req.user);
    }*/

    @UseInterceptors(LoginInterceptor)
    @Post('login')
    async login(loginCreds: UsernameLogin | EmailLogin) {
        this.authService.loginUser(loginCreds);
    }
}
