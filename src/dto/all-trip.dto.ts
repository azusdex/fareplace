import { Length, IsString } from 'class-validator';

export class AllTripValidator {
    @Length(3,3)
    @IsString()
    from: string;

    @Length(3,3)
    @IsString()
    to: string;
}