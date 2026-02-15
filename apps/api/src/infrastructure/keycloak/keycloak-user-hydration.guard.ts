import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class KeycloakUserHydrationGuard implements CanActivate {
    constructor(private readonly prisma: PrismaService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const keycloakUser = request.user;

        if (!keycloakUser) {
            return true; // No user to hydrate (e.g. public route), let other guards handle it
        }

        // Keycloak 'sub' claim is the user ID
        const keycloakId = keycloakUser.sub;

        if (!keycloakId) {
            return true;
        }

        // Find user in database by Keycloak ID (which we stored as id or keycloakId)
        // In our case, we are using the Keycloak ID as the User ID in our DB
        // Find user in database by Keycloak ID (which we stored as keycloakId)
        let user = await this.prisma.user.findUnique({
            where: { id: keycloakId },
            include: {
                clientProfile: true,
                therapistProfile: true,
            },
        });

        if (!user) {
            user = await this.prisma.user.findUnique({
                where: { keycloakId: keycloakId },
                include: {
                    clientProfile: true,
                    therapistProfile: true,
                },
            });
        }

        if (user) {
            // Replace request.user with the full user entity from DB
            // We merge it with existing keycloak claims just in case
            request.user = {
                ...keycloakUser,
                ...user,
                // Ensure role is correct type if needed
                role: user.role,
            };
        } else {
            // If user is not found in DB but has a valid token, it might be a sync issue
            // For now, we allow it but log a warning, or we could deny access
            console.warn(`User with Keycloak ID ${keycloakId} not found in database`);
        }

        return true;
    }
}
