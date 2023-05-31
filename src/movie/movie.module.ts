import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Movie, MovieSchema } from './movie.model';
import { MovieService } from './movie.service';
import { MovieController } from './movie.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Movie.name, schema: MovieSchema }])],
  providers: [MovieService],
  controllers: [MovieController],
  exports: [MovieService],
})
export class MovieModule {}