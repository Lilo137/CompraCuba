import { Body, Controller, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthEntity } from './entities/auth.entity';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
@ApiTags('Autenticación')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOkResponse({ type: AuthEntity })
  login(
    @Res({ passthrough: true }) res,
    @Body() { email, password }: LoginDto,
  ) {
    return this.authService.login(email, password, res);
  }

  @Post('logout')
  @ApiOkResponse({ type: AuthEntity })
  logout(@Res({ passthrough: true }) res, @Body() { email }: LoginDto) {
    return this.authService.logout(res, email);
  }
}
