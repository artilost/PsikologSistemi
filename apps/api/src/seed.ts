import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './infrastructure/database/prisma.service';
import { PrismaModule } from './infrastructure/database/prisma.module';
import { Logger } from '@nestjs/common';
import { UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

// Create a dedicated seed module
@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        PrismaModule,
    ],
})
class SeedModule { }

async function bootstrap() {
    // Prevent running in production
    if (process.env.NODE_ENV === 'production') {
        console.error('❌ Seed script cannot run in production environment!');
        process.exit(1);
    }

    const logger = new Logger('Seed');
    const app = await NestFactory.createApplicationContext(SeedModule);

    try {
        const prismaService = app.get(PrismaService);
        const SALT_ROUNDS = 10;

        const users = [
            {
                email: 'admin@psikolog.com',
                password: 'Admin123!',
                firstName: 'System',
                lastName: 'Admin',
                role: UserRole.ADMIN,
                phone: '+905550000001'
            },
            {
                email: 'therapist@psikolog.com',
                password: 'Therapist123!',
                firstName: 'Ahmet',
                lastName: 'Yılmaz',
                role: UserRole.THERAPIST,
                phone: '+905550000002'
            },
            {
                email: 'client@psikolog.com',
                password: 'Client123!',
                firstName: 'Mehmet',
                lastName: 'Demir',
                role: UserRole.CLIENT,
                phone: '+905550000003'
            }
        ];

        for (const userData of users) {
            logger.log(`Processing user: ${userData.email}`);

            // Normalize email
            const normalizedEmail = userData.email.toLowerCase().trim();

            // Check if user exists
            const existingUser = await prismaService.user.findFirst({
                where: {
                    email: { equals: normalizedEmail, mode: 'insensitive' }
                }
            });

            if (existingUser) {
                logger.log(`User already exists: ${userData.email}`);
                
                // Update password and reset profiles for testing
                const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS);
                await prismaService.user.update({
                    where: { id: existingUser.id },
                    data: {
                        password: hashedPassword,
                        status: UserStatus.ACTIVE,
                        role: userData.role,
                    }
                });
                
                // Reset profiles to test onboarding (update fields to null instead of deleting)
                if (userData.role === UserRole.THERAPIST) {
                    // Create or update therapist profile
                    const existingProfile = await prismaService.therapistProfile.findUnique({
                        where: { userId: existingUser.id }
                    });
                    
                    if (existingProfile) {
                        await prismaService.therapistProfile.update({
                            where: { userId: existingUser.id },
                            data: {
                                licenseNumber: null,
                                biography: null,
                                specialization: [],
                                yearsExperience: null,
                            }
                        });
                    } else {
                        await prismaService.therapistProfile.create({
                            data: {
                                userId: existingUser.id,
                            }
                        });
                    }
                    logger.log(`Reset therapist profile for: ${userData.email}`);
                } else if (userData.role === UserRole.CLIENT) {
                    // Create or update client profile
                    const existingProfile = await prismaService.clientProfile.findUnique({
                        where: { userId: existingUser.id }
                    });
                    
                    if (existingProfile) {
                        await prismaService.clientProfile.update({
                            where: { userId: existingUser.id },
                            data: {
                                dateOfBirth: null,
                                gender: null,
                                occupation: null,
                                emergContact: null,
                                emergPhone: null,
                                address: null,
                            }
                        });
                    } else {
                        await prismaService.clientProfile.create({
                            data: {
                                userId: existingUser.id,
                            }
                        });
                    }
                    logger.log(`Reset client profile for: ${userData.email}`);
                }
                
                logger.log(`Updated password and reset profile for: ${userData.email}`);
            } else {
                // Hash password
                const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS);

                // Create user with profile based on role
                const user = await prismaService.user.create({
                    data: {
                        email: normalizedEmail,
                        phone: userData.phone,
                        password: hashedPassword,
                        firstName: userData.firstName,
                        lastName: userData.lastName,
                        role: userData.role,
                        status: UserStatus.ACTIVE,
                        // Create profile based on role
                        ...(userData.role === UserRole.CLIENT && {
                            clientProfile: {
                                create: {
                                    // ClientProfile will be created with default values
                                },
                            },
                        }),
                        ...(userData.role === UserRole.THERAPIST && {
                            therapistProfile: {
                                create: {
                                    // TherapistProfile will be created with default values
                                },
                            },
                        }),
                    },
                });
                logger.log(`Created user in Local DB: ${userData.email}`);
            }
        }

        logger.log('✅ Seeding completed successfully');
    } catch (error) {
        logger.error('❌ Seeding failed', error);
        throw error;
    } finally {
        await app.close();
    }
}

bootstrap();
