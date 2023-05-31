import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { INestApplication, HttpStatus } from '@nestjs/common';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongooseModule } from '@nestjs/mongoose';
import { response } from 'express';

describe('AuthController (e2e)', () => {
    let app: INestApplication;
    let mongoServer: MongoMemoryServer;

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
    });

    afterAll(async () => {
        await mongoServer.stop();
        await app.close()
    });

    it('can register using an e-mail and a compliant password', async () => {
        const response = await request(app.getHttpServer())
            .post('/auth/register')
            .send({ email: 'test@test.com', password: 'TestPassword123' })

        expect(response.status).toBe(HttpStatus.CREATED)
        expect(response.body).toEqual({});
    });

    it("can't register using the same e-mail as someone else", async () => {
        await request(app.getHttpServer())
            .post('/auth/register')
            .send({ email: 'test@test.com', password: 'TestPassword123' });

        const response = await request(app.getHttpServer())
            .post('/auth/register')
            .send({ email: 'test@test.com', password: 'TestPassword123' })

        expect(response.status).toBe(HttpStatus.CONFLICT);
        expect(response.body).toHaveProperty("message", "User already exists")
    });

    it("can't register using an e-mail that doesn't match the validator", async () => {
        const response = await request(app.getHttpServer())
            .post('/auth/register')
            .send({ email: 'test', password: 'TestPassword123' })

        expect(response.status).toBe(HttpStatus.BAD_REQUEST)
        expect(response.body).toHaveProperty("message", ["Invalid email"]);
    })

    it("can't register using an e-mail and password that doesn't match the validator", async () => {
        const response = await request(app.getHttpServer())
            .post('/auth/register')
            .send({ email: 'test@gmail.com', password: 'p1' })

        expect(response.status).toBe(HttpStatus.BAD_REQUEST)
        expect(response.body).toHaveProperty("message", ["Password must be at least 8 characters long"]);
    });

    it('can login using the right e-mail and right password', async () => {
        await request(app.getHttpServer())
            .post('/auth/register')
            .send({ email: 'login@test.com', password: 'LoginPassword123' });

        const response = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'login@test.com', password: 'LoginPassword123' })

        expect(response.status).toBe(HttpStatus.OK)
        expect(response.body).toHaveProperty("token")
    });

    it("can't login using the right e-mail and wrong password", async () => {
        const response = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'login@test.com', password: 'WrongPassword' })

        expect(response.status).toBe(HttpStatus.UNAUTHORIZED)
        expect(response.body).toHaveProperty("message", "Invalid password")
    });

    it("can't login using the wrong e-mail and right password", async () => {
        const response = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'wrong@test.com', password: 'LoginPassword1999' })

        expect(response.status).toBe(HttpStatus.NOT_FOUND)
        expect(response.body).toHaveProperty("message", "User not found")
    });

});
