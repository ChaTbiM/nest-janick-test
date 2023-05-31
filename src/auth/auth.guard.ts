import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';
import { MovieService } from 'src/movie/movie.service';

@Injectable()
export class AuthorGuard implements CanActivate {
    constructor(private movieService: MovieService) { }

    canActivate(
        context: ExecutionContext,
    ): boolean | Promise<boolean> | Observable<boolean> {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        const movieId = request.params.id;

        // return this.checkIsAuthor(user, movieId);
        return true
    }

    //   async checkIsAuthor(user, movieId): Promise<boolean> {
    //     if (user.role === 'admin') {
    //       return true;
    //     }

    //     // const movie = await this.movieService.findOne(movieId);

    //     if (!movie) {
    //       return false;
    //     }

    //     return movie.createdBy == user._id;
    //   }
}