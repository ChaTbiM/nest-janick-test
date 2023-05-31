import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { INestApplication, HttpStatus } from '@nestjs/common';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthService } from '../auth/auth.service';
import { CreateUserDto } from './../user/user.dto';
import { User, UserRole } from './../user/user.model';
import { MovieService } from './movie.service';
import { CreateMovieDto } from './movie.dto';
import { Category, Movie } from './movie.model';

describe('AuthController (e2e)', () => {
    let app: INestApplication;
    let mongoServer: MongoMemoryServer;
    let movieService: MovieService;
    let authService: AuthService;
    const user: CreateUserDto = {
        email: "testing@user.com",
        password: "TestPassword123",
    }
    const admin: CreateUserDto = {
        email: "testing@admin.com",
        password: "TestPassword123",
    }
    let userJwtToken: string;
    let adminJwtToken: string;
    const createMovieDTO = {
        title: 'Movie 1',
        description: 'Description 1dsadasdsadasda',
        releaseDate: new Date(),
        category: Category.ACTION,
        rating: 5,
        actors: ['Actor 1', 'Actor 2'],
    };

    const updateMovieDTO = {
        title: "Movie 2 updated",
        description: ' 1dsadasdsadasda Description',
        releaseDate: new Date(),
        category: Category.DRAMA,
        rating: 4,
        actors: ['Actor 1', 'Actor 3'],
    }

    const listOfMovies = [];
    const listOfUsers = []

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();

        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                MongooseModule.forRoot(uri),
                AppModule,
            ],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();
        authService = moduleFixture.get<AuthService>(AuthService);
        movieService = moduleFixture.get<MovieService>(MovieService);

        await authService.createUser(admin as User);
        const createdUser = await authService.createUser(user as User);

        listOfUsers.push(createdUser)

        userJwtToken = await authService.login(user as User);
        adminJwtToken = await authService.login(admin as User);

        // inserting movies 
        const movieModel = await movieService.create(createMovieDTO as CreateMovieDto, createdUser);
        listOfMovies.push(movieModel);
    });

    afterAll(async () => {
        await mongoServer.stop();
        await app.close()
    });

    describe("get movies", () => {
        it("Can retrieve the movie list when not logged in ", async () => {
            const response = await request(app.getHttpServer()).get('/movies');
            expect(response.status).toBe(HttpStatus.OK);
            expect(response.body[0]._id).toEqual(listOfMovies[0]._id.toString());
        })

        it("Can retrieve the movie list when logged in with a user role", async () => {
            const response = await request(app.getHttpServer()).get('/movies').set('Authorization', `Bearer ${userJwtToken}`);
            expect(response.status).toBe(HttpStatus.OK);
            expect(response.body[0]._id).toEqual(listOfMovies[0]._id.toString());
        })

        it("Can retrieve the movie list when logged in with an admin role", async () => {
            const response = await request(app.getHttpServer()).get('/movies').set('Authorization', `Bearer ${adminJwtToken}`);
            expect(response.status).toBe(HttpStatus.OK);
            expect(response.body[0]._id).toEqual(listOfMovies[0]._id.toString());
        })

        it("Can retrieve the movie list of a specific user when not logged in", async () => {
            const userId = listOfUsers[0]._id.toString();
            const response = await request(app.getHttpServer()).get(`/movies/user/${userId}`);
            expect(response.status).toBe(HttpStatus.OK);
            expect(response.body[0]._id).toEqual(listOfMovies[0]._id.toString());
        })
    })

    describe("create movie", () => {
        it("Can't create a movie when not logged in", async () => {
            const response = await request(app.getHttpServer()).post('/movies').send(createMovieDTO);
            expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
        })

        it("Can create a movie when logged in with a user role", async () => {
            const response = await request(app.getHttpServer()).post('/movies').send({ ...createMovieDTO, title: "unique title user" }).set('Authorization', `Bearer ${userJwtToken}`);
            expect(response.status).toBe(HttpStatus.CREATED);
            expect(response.body.title).toEqual("unique title user");
        })

        it("Can create a movie when logged in with a admin role", async () => {
            const response = await request(app.getHttpServer()).post('/movies').send({ ...createMovieDTO, title: "unique title user" }).set('Authorization', `Bearer ${adminJwtToken}`);
            expect(response.status).toBe(HttpStatus.CREATED);
            expect(response.body.title).toEqual("unique title user");
        })


        it("Creating a movie should pass the field validators (title, description, etc...)", async () => {
            const response = await request(app.getHttpServer()).post('/movies').send({ ...createMovieDTO, title: "unique title user" }).set('Authorization', `Bearer ${userJwtToken}`);
            expect(response.status).not.toBe(HttpStatus.BAD_REQUEST);
        })
    })

    describe("update movie", () => {
        it("Can update user's own movie", async () => {
            const response = await request(app.getHttpServer()).put(`/movies/${listOfMovies[0]._id}`).send({ ...updateMovieDTO, title: "updated by user" }).set('Authorization', `Bearer ${userJwtToken}`);
            expect(response.status).toBe(HttpStatus.OK);
            expect(response.body.title).toEqual("updated by user");
        })

        it("updating a movie should pass the field validators (title, description, etc...)", async () => {
            // sending empty
            const response = await request(app.getHttpServer()).put(`/movies/${listOfMovies[0]._id}`).send({}).set('Authorization', `Bearer ${userJwtToken}`);
            expect(response.status).not.toBe(HttpStatus.BAD_REQUEST);
        })

        it("Can't update another user's movie when not admin", async () => {
            const otherUser = await authService.createUser({ email: "other@email.com", password: "password" });
            const otherUserJwtToken = await authService.login(otherUser as User);
            const movieId = listOfMovies[0]._id.toString();
            const response = await request(app.getHttpServer()).put(`/movies/${movieId}`).send({ ...updateMovieDTO, title: "updated by user" }).set('Authorization', `Bearer ${otherUserJwtToken}`);
            expect(response.status).toBe(HttpStatus.FORBIDDEN);
        })

        it("Can update another user's movie when admin", async () => {
            const otherAdmin = await authService.createUser({ email: "other-admin@email.com", password: "password", role: UserRole.ADMIN });
            const otherAdminJwtToken = await authService.login(otherAdmin as User);
            const movieId = listOfMovies[0]._id.toString();
            const response = await request(app.getHttpServer()).put(`/movies/${movieId}`).send({ ...updateMovieDTO, title: "updated by other admin" }).set('Authorization', `Bearer ${otherAdminJwtToken}`);
            listOfMovies[0] = response.body
            expect(response.status).toBe(HttpStatus.OK)
            expect(response.body.title).toEqual("updated by other admin")
        })
    })

    describe("delete movie", () => {
        it("Can delete user's own movie", async () => {
            // userJwttoken belongs to the createdUser which was used to create the movie in BeforeAll hook
            const movieId = listOfMovies[0]._id.toString();
            const response = await request(app.getHttpServer()).delete(`/movies/${movieId}`).set('Authorization', `Bearer ${userJwtToken}`);
            expect(response.status).toBe(HttpStatus.OK);
            expect(response.body.title).toEqual(listOfMovies[0].title);
        });

        it("Can't delete another user's movie when not admin", async () => {
            const otherUser = await authService.createUser({ email: "other-user-for-delete@email.com", password: "password" });
            const otherUserJwtToken = await authService.login(otherUser as User);
            const createdMovie = await movieService.create(createMovieDTO as CreateMovieDto, listOfUsers[0] as User);
            const movieId = createdMovie._id.toString();
            const response = await request(app.getHttpServer()).delete(`/movies/${movieId}`).set('Authorization', `Bearer ${otherUserJwtToken}`);
            expect(response.status).toBe(HttpStatus.FORBIDDEN);
            expect(response.body.message).toEqual("You are not authorized to update or delete this movie");
        });

        it("Can't delete another user's movie when not admin", async () => {
            const lastCreatedAdmin = await authService.createUser({ email: "last-admin@gmail.com", password: "password", role: UserRole.ADMIN });
            const lastCreatedAdminJwtToken = await authService.login(lastCreatedAdmin as User);
            const createdMovie = await movieService.create({ ...createMovieDTO, title: "last delete" } as CreateMovieDto, listOfUsers[0] as User);
            const movieId = createdMovie._id.toString();
            const response = await request(app.getHttpServer()).delete(`/movies/${movieId}`).set('Authorization', `Bearer ${lastCreatedAdminJwtToken}`);
            expect(response.status).toBe(HttpStatus.OK);
            expect(response.body.title).toEqual("last delete");
        });
    })
});
