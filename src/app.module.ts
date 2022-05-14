import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ItineraryService } from './services/itinerary.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, ItineraryService],
})
export class AppModule {}
