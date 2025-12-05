import { Module } from '@nestjs/common';
import { SponsorModule } from './sponsor/sponsor.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    SponsorModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }