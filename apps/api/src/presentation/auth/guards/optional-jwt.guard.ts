import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // Override canActivate to allow requests even without token
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    // Check if Authorization header exists
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers?.authorization;
    
    // If no auth header, allow request to proceed (user will be undefined)
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      request.user = undefined;
      return true;
    }
    
    // If auth header exists, try to authenticate
    // If it fails, still allow request (user will be undefined)
    const result = super.canActivate(context);
    
    // Handle both Promise and Observable cases
    if (result instanceof Promise) {
      return result.catch(() => {
        request.user = undefined;
        return true;
      });
    }
    
    // For Observable, catch errors and allow request
    if (result instanceof Observable) {
      return result.pipe(
        catchError(() => {
          request.user = undefined;
          return of(true);
        })
      );
    }
    
    return result;
  }

  // Override handleRequest to return undefined instead of throwing error
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    
    // If there's an error (token invalid, expired, etc.), return undefined instead of throwing
    // This allows the request to proceed, and the handler can check if user exists
    if (err) {
      request.user = undefined;
      console.log('OptionalJwtAuthGuard: Authentication error:', err.message || err);
      return undefined;
    }
    
    // If no user but no error (token missing), return undefined
    if (!user) {
      request.user = undefined;
      console.log('OptionalJwtAuthGuard: No user found');
      return undefined;
    }
    
    // If user exists, set it in request and return it
    request.user = user;
    console.log('OptionalJwtAuthGuard: User authenticated:', { id: user.id, email: user.email, role: user.role });
    return user;
  }
}

