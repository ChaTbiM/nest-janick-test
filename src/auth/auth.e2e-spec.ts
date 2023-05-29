import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { INestApplication, HttpStatus } from '@nestjs/common';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongooseModule } from '@nestjs/mongoose';

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
        return request(app.getHttpServer())
            .post('/auth/register')
            .send({ email: 'test@test.com', password: 'TestPassword123' })
            .expect(HttpStatus.CREATED);
    });

    it("can't register using the same e-mail as someone else", async () => {
        await request(app.getHttpServer())
            .post('/auth/register')
            .send({ email: 'test@test.com', password: 'TestPassword123' });

        return request(app.getHttpServer())
            .post('/auth/register')
            .send({ email: 'test@test.com', password: 'TestPassword123' })
            .expect(HttpStatus.CONFLICT);
    });

    it("can't register using an e-mail and password that doesn't match the validator", async () => {
        return request(app.getHttpServer())
            .post('/auth/register')
            .send({ email: 'test@gmail.com', password: 'p1' })
            .expect(HttpStatus.BAD_REQUEST);
    });

    it('can login using the right e-mail and right password', async () => {
        await request(app.getHttpServer())
            .post('/auth/register')
            .send({ email: 'login@test.com', password: 'LoginPassword123' });

        return request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'login@test.com', password: 'LoginPassword123' })
            .expect(HttpStatus.OK);
    });

    it("can't login using the right e-mail and wrong password", async () => {
        return request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'login@test.com', password: 'WrongPassword' })
            .expect(HttpStatus.UNAUTHORIZED);
    });

    it("can't login using the wrong e-mail and right password", async () => {
        return request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'wrong@test.com', password: 'LoginPassword123' })
            .expect(HttpStatus.NOT_FOUND);
    });

});
