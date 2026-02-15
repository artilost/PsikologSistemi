import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import {
    AuthGuard,
    KeycloakConnectModule,
    RoleGuard,
} from 'nest-keycloak-connect';
import { HttpModule } from '@nestjs/axios';
import { KeycloakConfigService } from './keycloak-config.service';
import { KeycloakAdminService } from './keycloak-admin.service';
import { KeycloakUserHydrationGuard } from './keycloak-user-hydration.guard';


@Global()
@Module({
    imports: [
        HttpModule,
        KeycloakConnectModule.registerAsync({
            useClass: KeycloakConfigService,
            inject: [KeycloakConfigService],
        }),
    ],
    providers: [
        KeycloakConfigService,
        KeycloakAdminService,
        {
            provide: APP_GUARD,
            useClass: AuthGuard,
        },
        {
            provide: APP_GUARD,
            useClass: KeycloakUserHydrationGuard,
        },
    ],
    exports: [KeycloakConnectModule, KeycloakConfigService, KeycloakAdminService],
})
export class KeycloakModule { }
