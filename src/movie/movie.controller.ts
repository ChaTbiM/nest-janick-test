import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MovieService } from './movie.service';
import { Movie } from './movie.model';
import { GetAuthUser } from './../auth/get-authenticated-user';
import { User } from './../user/user.model';
import { CreateMovieDto, UpdateMovieDto } from './movie.dto';

@Controller('movies')
export class MovieController {
  constructor(private readonly movieService: MovieService) { }

  @Get()
  async findAll(): Promise<Movie[]> {
    return this.movieService.findAll();
  }

  @Get('user/:userId')
  async findByUser(@Param('userId') userId: string): Promise<Movie[]> {
    return this.movieService.findByUser(userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(@Body() movie: CreateMovieDto, @GetAuthUser() user: User): Promise<Movie> {
    return this.movieService.create(movie, user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Put(':id')
  async update(@Param('id') id: string, @Body() updatedMovie: UpdateMovieDto, @GetAuthUser() user: User): Promise<Movie> {
    return this.movieService.update(id, updatedMovie, user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async delete(@Param('id') id: string, @GetAuthUser() user: User): Promise<Movie> {
    return this.movieService.delete(id, user);
  }
}
