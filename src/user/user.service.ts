import {
  ConflictException,
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './user.model';
import { CreateUserDto } from './user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const { email, password, role } = createUserDto;

    const existingUser = await this.userModel.findOne({ email }).exec();
    if (existingUser) {
      Logger.error('User already exists');
      throw new ConflictException('User already exists');
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new this.userModel({
        email,
        password: hashedPassword,
        role,
      });
      return user.save();
    } catch (error) {
      Logger.error('Something went wrong');
      throw new HttpException(
        'Something went wrong',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findUserByEmail(email: string): Promise<User> {
    try {
      return this.userModel.findOne({ email }).exec();
    } catch (error) {
      Logger.error('User Not Found with email : ' + email);
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
  }

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.findUserByEmail(email);
    if (!user) {
      Logger.error('User Not Found with email : ' + email);
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      Logger.error('Invalid password for user with email : ' + email);
      throw new HttpException(
        'Invalid password',
        HttpStatus.UNAUTHORIZED,
      );
    }
    if (user && isPasswordValid) {
      return user;
    }
    return null;
  }
}
