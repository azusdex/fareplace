import {Injectable} from '@nestjs/common';
import {parse} from 'papaparse';
import {readFileSync} from 'fs';
import {ItineraryEntity} from './../entities/itinerary.entity';
import {FlightEntity} from './../entities/flight.entity';

@Injectable()
export class FlyService {

    readonly csvFlightsPath = './src/files/flights.csv';
    readonly csvPricesPath = './src/files/prices.csv';

    async csvToJson(csvPath: string) {
        const path = require("path");
        const file = readFileSync(path.resolve(csvPath), 'utf8');

        return await parse(file, {
            header: true
        })['data'];
    }

    initFlightEntity(flight: Array<String>): FlightEntity {
        let f: FlightEntity = new FlightEntity();
        f.flightNumber = flight['FlightNumber'];
        f.date = flight['DepartureDate'];
        f.from = flight['DepartureAirportCode'];
        f.to = flight['ArrivalAirportCode'];
        f.departureTime = flight['DepartureTime'];
        f.duration = flight['Duration'];

        return f;
    }

    async getFlights(fromCode: string, toCode: string, date?: string): Promise<ItineraryEntity> {
        let relevantFlights: ItineraryEntity = new ItineraryEntity();
        const flights = await this.csvToJson(this.csvFlightsPath);

        for (let flight of flights) {
            if (flight['DepartureAirportCode'] == fromCode.toUpperCase() && flight['ArrivalAirportCode'] == toCode.toUpperCase()) {
                if (date && flight['DepartureDate'] != date) {
                    continue;
                }

                relevantFlights.flights.push(this.initFlightEntity(flight));
            }
        }

        return relevantFlights;
    }

    async getFlightsBetweenDates(fromCode: string, toCode: string, minDate: number, maxDate: number) {
        let relevantFlights: ItineraryEntity = new ItineraryEntity();
        const flights = await this.csvToJson(this.csvFlightsPath);

        for (let flight of flights) {
            if (flight['DepartureAirportCode'] == fromCode.toUpperCase() && flight['ArrivalAirportCode'] == toCode.toUpperCase()) {
                let date: number = new Date(flight['DepartureDate'] + ' ' + flight['DepartureTime']).getTime();

                if (date >= minDate && date <= maxDate) {
                    relevantFlights.flights.push(this.initFlightEntity(flight));
                }
            }
        }

        return relevantFlights;
    }

    async getPrices(flights: ItineraryEntity): Promise<ItineraryEntity> {
        const prices = await this.csvToJson(this.csvPricesPath);
        let relevantFlights: ItineraryEntity = new ItineraryEntity();
        let totalPrice: number = 0;

        for (let flight of flights.flights) {
            for (let price of prices) {
                if (price['DepartureDate'] == flight.date && price['FlightNumber'] == flight.flightNumber) {
                    flight.price = price['Price'];
                    flight.availableSeats = price['SeatsAvailable'];

                    relevantFlights.flights.push(flight);
                    relevantFlights.totalPrice += Number(flight.price);
                }
            }
        }

        return relevantFlights;
    }

    async getDepartureAirport(fromCode: string, date: string): Promise<ItineraryEntity> {
        let relevant = new ItineraryEntity();
        let flights = await this.csvToJson(this.csvFlightsPath);

        for (let flight of flights) {
            if (flight['DepartureDate'] == date && flight['DepartureAirportCode'] == fromCode.toUpperCase()) {
                relevant.flights.push(this.initFlightEntity(flight));
            }
        }

        return relevant;
    }

    async findConnections(fromCode: string, toCode: string, date: string) {
        let departureFlights: ItineraryEntity = await this.getDepartureAirport(fromCode, date);
        let arrivalFlights: ItineraryEntity = await this.getArrivalAirport(toCode, date);

        let direct: ItineraryEntity = this.findDirectFlight(fromCode, toCode, departureFlights);
        direct = await this.getPrices(direct);

        departureFlights = this.removeFlights(fromCode, toCode, departureFlights);
        arrivalFlights = this.removeFlights(fromCode, toCode, arrivalFlights);

        let oneConnection: ItineraryEntity = this.findOneConnection(fromCode, toCode, departureFlights, arrivalFlights);
        for (const connection of oneConnection.flights) {
            oneConnection = await this.getPrices(oneConnection);
            departureFlights = this.removeFlights(connection.from, connection.to, departureFlights);
            arrivalFlights = this.removeFlights(connection.from, connection.to, arrivalFlights);
        }

        let twoConnections: ItineraryEntity[] = await this.findTwoConnections(date, departureFlights, arrivalFlights);
        let twoConnectionsWithPrices: ItineraryEntity[] = [];
        for (const connection of twoConnections) {
            twoConnectionsWithPrices.push(await this.getPrices(connection));
        }

        return [direct, oneConnection, twoConnectionsWithPrices];
    }

    removeFlights(fromCode: string, toCode: string, flights: ItineraryEntity) {
        let results: ItineraryEntity = new ItineraryEntity();
        for (const flight of flights.flights) {
            if (flight.from != fromCode || flight.to != toCode) {
                results.flights.push(flight);
            }
        }

        return results;
    }

    findOneConnection(fromCode: string, toCode: string, departureFlights: ItineraryEntity, arrivalFlights: ItineraryEntity) {
        let connection: ItineraryEntity = new ItineraryEntity();
        for (let f of departureFlights.flights) {
            for (let ff of arrivalFlights.flights) {
                if (f.to == ff.from) {
                    let minTimeStamp = new Date(f.date + ' ' + f.departureTime).getTime();
                    let maxTimeStamp = minTimeStamp + 6 * 60 * 60 * 1000;
                    let connectionTime = new Date(ff.date + ' ' + ff.departureTime).getTime();

                    if (connectionTime > minTimeStamp && connectionTime <= maxTimeStamp) {
                        connection.flights.push(f);
                        connection.flights.push(ff);
                    }
                }
            }
        }

        return connection;
    }

    async findTwoConnections(date: string, departureFlights: ItineraryEntity, arrivalFlights: ItineraryEntity) {
        let variations = [];
        let connection: ItineraryEntity = new ItineraryEntity();
        let results: ItineraryEntity[] = [];

        for (const dFlight of departureFlights.flights) {
            let minTimeStamp = new Date(dFlight.date + ' ' + dFlight.departureTime).getTime();
            let maxTimeStamp = minTimeStamp + 6 * 60 * 60 * 1000;

            for (const aFlight of arrivalFlights.flights) {
                let connectionTime = new Date(aFlight.date + ' ' + aFlight.departureTime).getTime();

                if (dFlight.to != aFlight.from && connectionTime >= minTimeStamp && connectionTime <= maxTimeStamp) {
                    if (!variations.some(e => e.from === dFlight.to && e.to === aFlight.from)) {
                        variations.push({
                            from: dFlight.to,
                            to: aFlight.from,
                            minTime: minTimeStamp,
                            maxTime: maxTimeStamp
                        });
                    }
                }
            }
        }

        for (const v of variations) {
            const flights: ItineraryEntity = await this.getFlightsBetweenDates(v['from'], v['to'], v['minTime'], v['maxTime']);
            connection.flights.push(...flights.flights);
        }

        for (const d of departureFlights.flights) {
            for (const c of connection.flights) {
                if (d.to == c.from) {
                    for (const a of (arrivalFlights.flights)) {
                        if (c.to == a.from) {
                            let fl = new ItineraryEntity();
                            fl.flights.push(d);
                            fl.flights.push(c);
                            fl.flights.push(a);

                            results.push(fl);
                        }
                    }
                }
            }
        }

        return results;
    }

    findDirectFlight(fromCode: string, toCode: string, flights: ItineraryEntity) {
        let directs: ItineraryEntity = new ItineraryEntity();
        for (const flight of flights.flights) {
            if (flight.from == fromCode && flight.to == toCode) {
                directs.flights.push(flight);
            }
        }

        return directs;
    }

    async getArrivalAirport(toCode: string, date: string): Promise<ItineraryEntity> {
        let relevant = new ItineraryEntity();
        let flights = await this.csvToJson(this.csvFlightsPath);

        for (let flight of flights) {
            if (flight['DepartureDate'] == date && flight['ArrivalAirportCode'] == toCode.toUpperCase()) {
                relevant.flights.push(this.initFlightEntity(flight));
            }
        }

        return relevant;
    }

    async getAllRoundTrip(fromCode: string, toCode: string): Promise<ItineraryEntity> {
        let flights = await this.getFlights(fromCode, toCode);
        let result = await this.getPrices(flights);

        return result;
    }

    async getRoundTrip(fromCode: string, toCode: string, date: string, returnDate: string): Promise<ItineraryEntity> {
        let flights = await this.getFlights(fromCode, toCode, date);
        let returnFlights = await this.getFlights(toCode, fromCode, returnDate);
        let relevantFlights: ItineraryEntity = new ItineraryEntity();
        relevantFlights.flights = flights.flights.concat(returnFlights.flights);

        let result = await this.getPrices(relevantFlights);

        return result;
    }
}