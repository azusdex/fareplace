import {Controller, Get, Res, HttpStatus, Query, Header} from '@nestjs/common';
import {Response} from 'express';
import {AppService} from './app.service';
import {AllTripDto} from './dto/all-trip.dto';
import {PriceConnectionDto} from './dto/price-connection.dto';
import {TripDto} from './dto/trip.dto';
import {ItineraryService} from './services/itinerary.service'

@Controller('itinerary')
export class AppController {
    constructor(private readonly appService: AppService, private readonly itineraryService: ItineraryService) {
    }

    @Get('priceRoundTrip')
    async getPriceRoundTrip(
        @Query() queryParams: TripDto,
        @Res() res: Response
    ) {
        const result = await this.itineraryService.getRoundTrip(
            queryParams.from,
            queryParams.to,
            queryParams.date,
            queryParams.returnDate
        );

        return res.status(HttpStatus.OK).json(result);
    }

    @Get('priceWithConnections')
    async getPriceWithConnections(
        @Query() queryParams: PriceConnectionDto,
        @Res() res: Response
    ) {
        const result = await this.itineraryService.findConnections(
            queryParams.from,
            queryParams.to,
            queryParams.date
        )

        return res.status(HttpStatus.OK).json(result);
    }

    @Get('priceAllRoundTrip')
    @Header('Content-Type', 'application/json-seq')
    async getPriceAllRoundTrip(
        @Query() queryParams: AllTripDto,
        @Res() res: Response
    ) {
        const result = await this.itineraryService.getAllRoundTrip(
            queryParams.from,
            queryParams.to
        );

        return res.status(HttpStatus.OK).json(result);
    }
}
