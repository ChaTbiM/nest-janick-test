import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { IsDateString, IsEnum, IsString, IsUrl, Max, Min, MinLength, MaxLength } from 'class-validator';
import { User } from 'src/user/user.model';

export enum Category {
    ACTION = 'action',
    COMEDY = 'comedy',
    DRAMA = 'drama',
    THRILLER = 'thriller',
}

@Schema()
export class Movie extends Document {
    @Prop({ minlength: 2, maxlength: 120 })
    @MinLength(2)
    @MaxLength(120)
    @IsString()
    title: string;

    @Prop({ minlength: 20, maxlength: 500 })
    @MinLength(20)
    @MaxLength(500)
    @IsString()
    description: string;

    @Prop()
    @IsDateString()
    releaseDate: Date;

    @Prop({ min: 1, max: 5 })
    @Min(1)
    @Max(5)
    rating: number;

    @Prop({ enum: Category })
    @IsEnum(Category)
    category: Category;

    @Prop([String])
    @IsString({ each: true })
    actors: string[];

    @Prop()
    @IsUrl()
    poster: string;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    createdBy: User | Types.ObjectId;
}

export const MovieSchema = SchemaFactory.createForClass(Movie);
