import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChallengeController } from './challenge.controller';
import { ChallengeService } from './challenge.service';
import { EmailController } from './email.controller';
import { EmailService } from './email.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env'
    }),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '24h') as any,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AppController, ChallengeController, EmailController, AuthController],
  providers: [AppService, ChallengeService, EmailService, AuthService, JwtStrategy],
})
export class AppModule {}
