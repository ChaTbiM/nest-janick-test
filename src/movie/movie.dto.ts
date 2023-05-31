import { PartialType } from '@nestjs/mapped-types';
import { IsDateString, IsEnum, IsString, IsUrl, Max, Min, MinLength, MaxLength } from 'class-validator';
import { Category } from './movie.model';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMovieDto {
    @ApiProperty({ description: 'The title of the movie' })
    @IsString()
    @MinLength(2)
    @MaxLength(120)
    title: string;

    @ApiProperty({ description: 'The description of the movie' })
    @IsString()
    @MinLength(20)
    @MaxLength(500)
    description: string;

    @ApiProperty({ description: 'The release date of the movie' })
    @IsDateString()
    releaseDate: Date;

    @ApiProperty({ description: 'The rating of the movie' })
    @Min(1)
    @Max(5)
    rating: number;

    @ApiProperty({ enum: Category, description: 'The category of the movie' })
    @IsEnum(Category)
    category: Category;

    @ApiProperty({ type: [String], description: 'The actors in the movie' })
    @IsString({ each: true })
    actors: string[];

    @ApiProperty({ description: 'The poster URL of the movie' })
    @IsUrl()
    poster: string;
}

export class UpdateMovieDto extends PartialType(CreateMovieDto) {
    @ApiPropertyOptional()
    title?: string;

    @ApiPropertyOptional()
    description?: string;

    @ApiPropertyOptional()
    releaseDate?: Date;

    @ApiPropertyOptional()
    rating?: number;

    @ApiPropertyOptional()
    category?: Category;

    @ApiPropertyOptional()
    actors?: string[];

    @ApiPropertyOptional()
    poster?: string;
}
