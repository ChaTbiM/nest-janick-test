import { IsEmail, IsEnum, IsOptional, MinLength } from 'class-validator';
import { UserRole } from './user.model';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    example: 'johndoe@example.com',
    description: 'The email address of the user',
  })
  @IsEmail({}, { message: 'Invalid email' })
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'The password of the user',
  })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @ApiProperty({
    example: 'user',
    enum: UserRole,
    description: 'The role of the user',
    required: false,
  })
  @IsOptional() // added this to allow for the default value to be set
  @IsEnum(UserRole)
  role?: UserRole;
}

export class LoginUserDto {
  @ApiProperty({
    example: 'johndoe@example.com',
    description: 'The email address of the user',
  })
  @IsEmail({}, { message: 'Invalid email' })
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'The password of the user',
  })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;
}
