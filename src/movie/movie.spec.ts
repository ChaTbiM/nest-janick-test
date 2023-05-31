import { Test, TestingModule } from '@nestjs/testing';
import { MovieService } from './movie.service';
import { getModelToken } from '@nestjs/mongoose';
import { User, UserRole } from '../user/user.model';
import { Category, Movie } from './movie.model';
import { Model } from 'mongoose';
import { InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateMovieDto, UpdateMovieDto } from './movie.dto';
import * as crypto from 'crypto';

function generateRandomBytes(length) {
    return crypto.randomBytes(length).toString('hex');
}

const listOfMoviesMock = ["movie1", "movie2", "movie3"]


describe('MovieService', () => {
    let service: MovieService;
    let serviceWithException: MovieService;
    let movieModel: Model<Movie>;

    const updatedMovieDto: UpdateMovieDto = {
        title: 'test',
        description: 'test',
        releaseDate: new Date(),
        rating: 3,
        category: Category.DRAMA,
        actors: ['actor1', 'actor2'],
        poster: 'http://test.com/test.jpg',
    };
    const createMovieDto: CreateMovieDto = {
        title: 'test0',
        description: 'test',
        releaseDate: new Date(),
        rating: 3,
        category: Category.ACTION,
        actors: ['actor1', 'actor2'],
        poster: 'http://test.com/test.jpg',
    };
    const user = {
        _id: 'user1',
        email: 'user1@test.com',
        password: 'password',
        role: UserRole.USER,
    };

    class MovieModelMock {
        _id: string
        title: string;
        description: string;
        releaseDate: Date;
        rating: number;
        category: Category;
        actors: string[];
        poster: string;
        createdBy: string;
        constructor(data: Movie) {
            this.title = data.title;
            this.description = data.description;
            this.releaseDate = data.releaseDate;
            this.rating = data.rating;
            this.category = data.category;
            this.actors = data.actors;
            this.poster = data.poster;
            this._id = "movieId";
            this.createdBy = "userId"
        }
        save = jest.fn().mockResolvedValue(this);
        static findOne = jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(null),
        })

        static find = jest.fn().mockReturnValue({ populate: jest.fn().mockResolvedValue(listOfMoviesMock) })
        static findById = jest.fn().mockResolvedValue({ createMovieDto, createdBy: user._id, save: jest.fn().mockReturnValue(updatedMovieDto) })
        static findByIdAndDelete = jest.fn().mockResolvedValue(updatedMovieDto)
    }

    class MovieModelMockWithException extends MovieModelMock {
        static find = jest.fn().mockReturnValue({
            populate: jest.fn().mockRejectedValue(new InternalServerErrorException()),
        });
        static findById = jest.fn().mockResolvedValue(null)
        save = jest.fn().mockRejectedValue(new InternalServerErrorException())
    }

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MovieService,
                {
                    provide: getModelToken(Movie.name),
                    useValue: MovieModelMock,
                },
            ],
        }).compile();

        const moduleWithException: TestingModule = await Test.createTestingModule({
            providers: [
                MovieService,
                {
                    provide: getModelToken(Movie.name),
                    useValue: MovieModelMockWithException,
                },
            ],
        }).compile();

        service = module.get<MovieService>(MovieService);
        serviceWithException = moduleWithException.get<MovieService>(MovieService);
        movieModel = module.get<Model<Movie>>(getModelToken(Movie.name));

        jest.clearAllMocks();

    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('get All Movies', () => {
        it('should return an array of movies', async () => {
            expect(await service.findAll()).toStrictEqual(listOfMoviesMock);
        });
        it('should throw internal server error', async () => {
            await expect(serviceWithException.findAll()).rejects.toThrow(InternalServerErrorException)
        });
    })

    describe("get user movies", () => {
        it('should return an array of movies created by user', async () => {
            const userId = generateRandomBytes(12)
            expect(await service.findByUser(userId)).toStrictEqual(listOfMoviesMock);
        });
        it('should throw internal server error', async () => {
            await expect(serviceWithException.findAll()).rejects.toThrow(InternalServerErrorException)
        });
    })

    describe("create movie", () => {
        it('create should return a movie', async () => {
            const createdMovie = await service.create(createMovieDto, user as User);
            expect(createdMovie).toEqual(expect.objectContaining({ _id: "movieId", ...createMovieDto, createdBy: "userId" }));
        });
        it('should throw internal server error', async () => {
            await expect(serviceWithException.create(createMovieDto, user as User)).rejects.toThrow(InternalServerErrorException)
        });
    })

    describe("update movie", () => {
        it('should return updated movie', async () => {
            expect(await service.update('movie1', updatedMovieDto, user as User)).toBe(updatedMovieDto);
        });

        it('should throw NotFoundException', async () => {
            await expect(serviceWithException.update('whatever', updatedMovieDto, user as User)).rejects.toThrow(NotFoundException);
        });

        it('should throw UnauthorizedException', async () => {
            MovieModelMockWithException.findById = jest.fn().mockResolvedValue({ ...createMovieDto, createdBy: "whoever2" })
            await expect(serviceWithException.update('movie1', updatedMovieDto, { ...user, _id: "whoever" } as User)).rejects.toThrow(UnauthorizedException);
        });

    })

    describe("delete movie", () => {
        it('should return deleted movie', async () => {
            expect(await service.delete('movie1', user as User)).toBe(updatedMovieDto);
        });

        it('should throw NotFoundException', async () => {
            MovieModelMockWithException.findById = jest.fn().mockResolvedValue(null);
            await expect(serviceWithException.update('whateversadas', updatedMovieDto, user as User)).rejects.toThrow(NotFoundException);
        });

        it('should throw UnauthorizedException', async () => {
            MovieModelMockWithException.findById = jest.fn().mockResolvedValue({ ...createMovieDto, createdBy: "whoever2" })
            await expect(serviceWithException.update('movie1', updatedMovieDto, { ...user, _id: "whoeverdd" } as User)).rejects.toThrow(UnauthorizedException);
        });
    })
});
