import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {ItineraryService} from "./services/itinerary.service";

describe('ItineraryService', () => {
  let service: ItineraryService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [],
      providers: [AppService, ItineraryService],
    }).compile();

    service = app.get<ItineraryService>(ItineraryService);
  });

  describe('root', () => {
    it('test parse csv file flights.csv', () => {
      service.csvToJson(service.csvFlightsPath).then(data => {
        const count = data.length;

        expect(count).toBe(12241);
      });
    })

    it('test parse csv file prices.csv', () => {
      service.csvToJson(service.csvPricesPath).then(data => {
        const count = data.length;

        expect(count).toBe(12242);
      });
    })

    it('test getRoundTrip', () => {
      service.getRoundTrip('TLV', 'MAD', '2022-07-27', '2022-08-10').then(data => {
        for(const obj of data) {
          expect(obj.flights[0].from).toEqual('TLV');
          expect(obj.flights[0].to).toEqual('MAD');
          expect(obj.flights[0].date).toEqual('2022-07-27');
          expect(obj.flights[1].from).toEqual('MAD');
          expect(obj.flights[1].to).toEqual('TLV');
          expect(obj.flights[1].date).toEqual('2022-08-10');
        }
      })
    });

    it('test priceAllRoundTrip', () => {
      service.getAllRoundTrip('TLV', 'ROM').then(data => {
        for(const f of data.flights) {
          expect(f.from).toEqual('TLV');
          expect(f.to).toEqual('ROM');
          expect(Number(f.price)).toBeGreaterThanOrEqual(0);
        }
      })
    });
  });
});
