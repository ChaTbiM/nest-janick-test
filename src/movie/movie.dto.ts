import { PartialType } from '@nestjs/mapped-types';
import { IsDateString, IsEnum, IsString, IsUrl, Max, Min, MinLength, MaxLength } from 'class-validator';
import { Category } from './movie.model';

export class CreateMovieDto {
    @IsString()
    @MinLength(2)
    @MaxLength(120)
    title: string;

    @IsString()
    @MinLength(20)
    @MaxLength(500)
    description: string;

    @IsDateString()
    releaseDate: Date;

    @Min(1)
    @Max(5)
    rating: number;

    @IsEnum(Category)
    category: Category;

    @IsString({ each: true })
    actors: string[];

    @IsUrl()
    poster: string;
}

export class UpdateMovieDto extends PartialType(CreateMovieDto) { }
