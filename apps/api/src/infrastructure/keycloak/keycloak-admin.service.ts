import { Injectable, Logger, InternalServerErrorException, ConflictException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { CreateUserDto } from '../../presentation/auth/dto';

@Injectable()
export class KeycloakAdminService {
    private readonly logger = new Logger(KeycloakAdminService.name);
    private readonly realm: string;
    private readonly authServerUrl: string;
    private readonly clientId: string;
    private readonly clientSecret: string;

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) {
        this.realm = this.configService.get<string>('keycloak.realm') ?? '';
        this.authServerUrl = this.configService.get<string>('keycloak.authServerUrl') ?? '';
        this.clientId = this.configService.get<string>('keycloak.clientId') ?? '';
        this.clientSecret = this.configService.get<string>('keycloak.secret') ?? '';

        if (!this.clientSecret) {
            this.logger.warn('Keycloak client secret is missing. Admin operations will fail.');
        }
    }

    private async getAdminAccessToken(): Promise<string> {
        try {
            const params = new URLSearchParams();
            params.append('client_id', this.clientId);
            params.append('client_secret', this.clientSecret);
            params.append('grant_type', 'client_credentials');

            const url = `${this.authServerUrl}/realms/${this.realm}/protocol/openid-connect/token`;

            const response = await firstValueFrom(
                this.httpService.post(url, params, {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                }),
            );

            return response.data.access_token;
        } catch (error) {
            this.logger.error('Failed to get Keycloak admin access token', error.response?.data || error.message);
            throw new InternalServerErrorException('Failed to authenticate with Keycloak Admin API');
        }
    }

    async createUser(dto: CreateUserDto): Promise<string> {
        const token = await this.getAdminAccessToken();
        const url = `${this.authServerUrl}/admin/realms/${this.realm}/users`;

        const userData = {
            username: dto.email,
            email: dto.email,
            firstName: dto.firstName,
            lastName: dto.lastName,
            enabled: true,
            emailVerified: false, // User needs to verify email
            credentials: [
                {
                    type: 'password',
                    value: dto.password,
                    temporary: false,
                },
            ],
            groups: [], // Can assign groups if needed
        };

        try {
            const response = await firstValueFrom(
                this.httpService.post(url, userData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }),
            );

            // Keycloak returns 201 Created with Location header containing the new user ID
            if (response.status === 201) {
                const location = response.headers['location'];
                const userId = location.substring(location.lastIndexOf('/') + 1);
                this.logger.log(`Created Keycloak user: ${dto.email} (${userId})`);
                return userId;
            }

            throw new InternalServerErrorException('Failed to create user in Keycloak');
        } catch (error) {
            if (error.response?.status === 409) {
                throw new ConflictException('User with this email already exists in Keycloak');
            }
            this.logger.error('Failed to create Keycloak user', error.response?.data || error.message);
            throw new InternalServerErrorException('Failed to create user in Keycloak');
        }
    }
    async deleteUserByEmail(email: string): Promise<void> {
        const token = await this.getAdminAccessToken();
        const searchUrl = `${this.authServerUrl}/admin/realms/${this.realm}/users?email=${email}&exact=true`;

        try {
            const searchResponse = await firstValueFrom(
                this.httpService.get(searchUrl, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            );

            if (searchResponse.data && searchResponse.data.length > 0) {
                const userId = searchResponse.data[0].id;
                const deleteUrl = `${this.authServerUrl}/admin/realms/${this.realm}/users/${userId}`;

                await firstValueFrom(
                    this.httpService.delete(deleteUrl, {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                );
                this.logger.log(`Deleted Keycloak user: ${email} (${userId})`);
            }
        } catch (error) {
            this.logger.warn(`Failed to delete Keycloak user ${email}: ${error.message}`);
            // Don't throw, just log warning as we want to proceed with creation
        }
    }
}
