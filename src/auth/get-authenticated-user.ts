import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from 'src/user/user.model';

export const GetAuthUser = createParamDecorator(
    (_: any, ctx: ExecutionContext): User => {
        const request = ctx.switchToHttp().getRequest();
        return request.user;
    },
);
