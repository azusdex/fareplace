import { Length, IsDateString, IsString } from 'class-validator';

export class TripDto {
    @Length(3,3)
    @IsString()
    from: string;

    @Length(3,3)
    @IsString()
    to: string;

    @IsDateString()
    date: string;

    @IsDateString()
    returnDate: string;
}