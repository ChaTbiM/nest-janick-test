import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MovieService } from './movie.service';
import { Movie } from './movie.model';
import { GetAuthUser } from './../auth/get-authenticated-user';
import { User } from './../user/user.model';
import { CreateMovieDto, UpdateMovieDto } from './movie.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiBody, ApiParam } from '@nestjs/swagger';

@ApiTags('movies')
@Controller('movies')
export class MovieController {
  constructor(private readonly movieService: MovieService) { }

  @Get()
  @ApiOperation({ summary: 'Get all movies' })
  @ApiResponse({ status: 200, description: 'The found records', type: Movie, isArray: true })
  async findAll(): Promise<Movie[]> {
    return this.movieService.findAll();
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all movies by user id' })
  @ApiResponse({ status: 200, description: 'The found records', type: Movie, isArray: true })
  @ApiParam({ name: 'userId', required: true, description: 'The user id' })
  async findByUser(@Param('userId') userId: string): Promise<Movie[]> {
    return this.movieService.findByUser(userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new movie' })
  @ApiResponse({ status: 201, description: 'The record has been successfully created.', type: Movie })
  @ApiBody({ type: CreateMovieDto })
  async create(@Body() movie: CreateMovieDto, @GetAuthUser() user: User): Promise<Movie> {
    return this.movieService.create(movie, user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a movie' })
  @ApiResponse({ status: 200, description: 'The record has been successfully updated.', type: Movie })
  @ApiParam({ name: 'id', required: true, description: 'The movie id' })
  @ApiBody({ type: UpdateMovieDto })
  async update(@Param('id') id: string, @Body() updatedMovie: UpdateMovieDto, @GetAuthUser() user: User): Promise<Movie> {
    return this.movieService.update(id, updatedMovie, user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a movie' })
  @ApiResponse({ status: 200, description: 'The record has been successfully deleted.', type: Movie })
  @ApiParam({ name: 'id', required: true, description: 'The movie id' })
  async delete(@Param('id') id: string, @GetAuthUser() user: User): Promise<Movie> {
    return this.movieService.delete(id, user);
  }
}
