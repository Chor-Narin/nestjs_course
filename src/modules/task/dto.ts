import { IsNotEmpty, IsString } from "class-validator";

export class dto {
    @IsNotEmpty()
    @IsString()
    name: string;
}