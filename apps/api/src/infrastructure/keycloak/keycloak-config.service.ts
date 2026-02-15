import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KeycloakConnectOptions, KeycloakConnectOptionsFactory, PolicyEnforcementMode, TokenValidation } from 'nest-keycloak-connect';

@Injectable()
export class KeycloakConfigService implements KeycloakConnectOptionsFactory {
    constructor(private readonly configService: ConfigService) { }

    createKeycloakConnectOptions(): KeycloakConnectOptions {
        return {
            authServerUrl: this.configService.get<string>('keycloak.authServerUrl'),
            realm: this.configService.get<string>('keycloak.realm'),
            clientId: this.configService.get<string>('keycloak.clientId'),
            secret: this.configService.get<string>('keycloak.secret') || '',
            policyEnforcement: PolicyEnforcementMode.PERMISSIVE,
            tokenValidation: TokenValidation.NONE,
        };
    }
}
