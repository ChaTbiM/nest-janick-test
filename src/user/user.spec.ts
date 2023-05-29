import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getModelToken } from '@nestjs/mongoose';
import { User, UserRole } from './user.model';
import * as bcrypt from 'bcrypt';
import { ConflictException, HttpException, HttpStatus } from '@nestjs/common';
import { Model } from 'mongoose';

describe('UserService', () => {
  let userService: UserService;
  let userServiceWithException: UserService;


  class UserModelMock {
    email: string;
    password: string;
    role: UserRole;
    constructor(userData) {
      this.email = userData.email;
      this.password = userData.password;
      this.role = userData.role;
    }
    save = jest.fn().mockResolvedValue(true);
    static findOne = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    })

  }

  class UserModelMockWithException extends UserModelMock {
    save = jest.fn().mockRejectedValue(new HttpException(
      'Something went wrong',
      HttpStatus.INTERNAL_SERVER_ERROR,
    ));
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getModelToken(User.name),
          useValue: UserModelMock,
        },
      ],
    }).compile();


    const moduleWithReject: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getModelToken(User.name),
          useValue: UserModelMockWithException,
        },
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
    userServiceWithException = moduleWithReject.get<UserService>(UserService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(userService).toBeDefined();
  });

  describe('createUser', () => {
    it('should return a conflict when the user already exists', async () => {
      UserModelMock.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValueOnce({
          email: 'test@test.com',
          password: 'testpassword',
          role: UserRole.USER,
        }),
      });

      await expect(
        userService.createUser({
          email: 'test@test.com',
          password: 'testpassword',
          role: UserRole.USER,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create a user', async () => {
      bcrypt.hash = jest.fn().mockResolvedValue('hashed');
      const mockedUser = {
        email: 'test@test.com',
        password: 'hashedPassword',
        role: UserRole.USER,
      }

      const result = await userService.createUser(mockedUser);

      expect(result).toBeTruthy();
    });

    it('should throw an exception for internal server error', async () => {
      await expect(
        userServiceWithException.createUser({
          email: 'test@test.com',
          password: 'testpassword',
          role: UserRole.USER,
        }),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('findUserByEmail', () => {
    it('should find a user', async () => {
      UserModelMock.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          email: 'test@test.com',
          password: 'testpassword',
          role: UserRole.USER,
        }),
      })

      const user = await userService.findUserByEmail('test@test.com');
      expect(user).toBeDefined();
    });

    it('should throw an exception for user not found', async () => {
      UserModelMockWithException.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockRejectedValue(new HttpException('User not found',
          HttpStatus.NOT_FOUND,
        )),
      })
      await expect(userServiceWithException.findUserByEmail('test@test.com')).rejects.toThrow(HttpException);
    });
  });

  describe('validateUser', () => {
    it('should validate a user', async () => {
      UserModelMock.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          email: 'test@test.com',
          password: 'testpassword',
        }),
      })

      bcrypt.compare = jest.fn().mockResolvedValue(true);

      const user = await userService.validateUser('test@test.com', 'testpassword');
      expect(user).toBeDefined();
    });

    it('should throw an exception for invalid user', async () => {
      UserModelMock.findOne = jest.fn().mockResolvedValueOnce(null);

      await expect(userService.validateUser('test@testdd.com', 'testpassword')).rejects.toThrow(HttpException);
    });

    it('should throw an exception for invalid password', async () => {
      UserModelMockWithException.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockRejectedValue(new HttpException(
          'Invalid email or password',
          HttpStatus.UNAUTHORIZED,
        )),
      })

      bcrypt.compare = jest.fn().mockResolvedValue(false);

      await expect(userServiceWithException.validateUser('test@test.com', 'testpassword')).rejects.toThrow(HttpException);
    });

  });
});



