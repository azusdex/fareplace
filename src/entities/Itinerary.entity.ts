import { FlightEntity } from './flight.entity';

export class ItineraryEntity {
    constructor() {}

    flights: FlightEntity[] = [];
    totalPrice: number = 0;
}