export class FlightEntity {
    constructor() {}

    flightNumber: string;
    date: string;
    from: string;
    to: string;
    price: number;
    availableSeats: number;
    departureTime: string;
    duration: number = 1;
}