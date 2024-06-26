import { Injectable, NotFoundException, UnauthorizedException, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserRole } from '../user/user.model';
import { Movie } from './movie.model';
import { CreateMovieDto, UpdateMovieDto } from './movie.dto';

@Injectable()
export class MovieService {
  constructor(@InjectModel(Movie.name) private movieModel: Model<Movie>) { }

  async findAll(): Promise<Movie[]> {
    try {
      return this.movieModel.find().populate('createdBy', 'email');
    } catch (error) {
      Logger.error('something went wrong trying to fetch all movies');
      throw new HttpException('something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findByUser(userId: string): Promise<Movie[]> {
    try {
      return this.movieModel.find({ createdBy: new Types.ObjectId(userId) }).populate('createdBy', 'email');
    } catch (error) {
      Logger.error('something went wrong trying to find movies by user with user id : ' + userId);
      throw new HttpException('something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async create(data: CreateMovieDto, user: User): Promise<Movie> {
    try {
      const newMovie = new this.movieModel({ ...data, createdBy: user._id });
      return newMovie.save();
    } catch (error) {
      Logger.error('user with id : ' + user._id + ' failed to create a movie');
      throw new HttpException('something went wrong creating a movie', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async update(id: string, data: UpdateMovieDto, user: User): Promise<Movie> {
    const movie = await this.movieModel.findById(id);
    if (!movie) {
      Logger.error('movie with id : ' + id + ' not found');
      throw new NotFoundException('Movie not found');
    }
    if (!this.isAuthorizedToUpdateOrDelete(user, movie)) {
      Logger.error('user with id : ' + user._id + ' is not authorized to update or delete movie with id : ' + id);
      throw new HttpException('You are not authorized to update or delete this movie', HttpStatus.FORBIDDEN);
    }
    Object.assign(movie, data);
    try {
      return movie.save();
    } catch (error) {
      Logger.error('something went wrong updating movie with id : ' + id);
      throw new HttpException('something went wrong updating a movie', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async delete(id: string, user: User): Promise<Movie> {
    const movie = await this.movieModel.findById(id);
    if (!movie) {
      Logger.error('trying to delete movie with id : ' + id + ', not found');
      throw new NotFoundException('Movie not found');
    }
    if (!this.isAuthorizedToUpdateOrDelete(user, movie)) {
      Logger.error('user with id : ' + user._id + ' is not authorized to update or delete movie with id : ' + id);
      throw new HttpException('You are not authorized to update or delete this movie', HttpStatus.FORBIDDEN);
    }
    try {
      return this.movieModel.findByIdAndDelete(id);
    } catch (error) {
      Logger.error('user with id ' + user._id.toString() + 'dont have permission to delete movie with id : ' + id);
      throw new HttpException('something went wrong deleting a movie', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  isAuthorizedToUpdateOrDelete(user: User, movie: Movie): boolean {
    return this.isAdmin(user) || this.isAuthor(user, movie)
  }

  isAuthor(user: User, movie: Movie): boolean {
    return movie.createdBy.toString() === user._id.toString()
  }

  isAdmin(user: User): boolean {
    return user.role === UserRole.ADMIN
  }
}
