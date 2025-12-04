import { PrismaClient } from '@prisma/client';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export async function cleanDatabase() {
  // Delete in order to respect foreign key constraints
  const deleteOrder = [
    'intake_forms',
    'reception_check_ins',
    'waitlist_requests',
    'payments',
    'sessions',
    'appointments',
    'therapist_locations',
    'therapist_profiles',
    'client_profiles',
    'session_packages',
    'calendar_syncs',
    'data_exports',
    'notifications',
    'audit_logs',
    'linked_accounts',
    'rooms',
    'locations',
    'users',
    'organizations',
    'system_configs',
  ];

  try {
    for (const table of deleteOrder) {
      await prisma.$executeRawUnsafe(`DELETE FROM "${table}"`);
    }
  } catch (error) {
    // Fallback: try TRUNCATE with CASCADE
    try {
      const tablenames = await prisma.$queryRaw<
        Array<{ tablename: string }>
      >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

      for (const { tablename } of tablenames) {
        if (tablename !== '_prisma_migrations') {
          await prisma.$executeRawUnsafe(`TRUNCATE TABLE "public"."${tablename}" CASCADE`);
        }
      }
    } catch (truncateError) {
      console.log('Database cleanup error:', truncateError);
    }
  }
}

export async function createTestUser(email: string, role: 'ADMIN' | 'THERAPIST' | 'CLIENT' = 'CLIENT', organizationId?: string) {
  // Hash password 'Password123!' with bcrypt (same as used in tests)
  const hashedPassword = await bcrypt.hash('Password123!', 10);
  
  return prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'User',
      role,
      organizationId,
      status: 'ACTIVE',
    },
  });
}

export async function createTestOrganization(name: string) {
  const uniqueSlug = `${name.toLowerCase().replace(/\s/g, '-')}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  return prisma.organization.create({
    data: {
      name,
      slug: uniqueSlug,
      subscriptionPlan: 'enterprise',
    },
  });
}

export async function createTestTherapist(userId: string) {
  return prisma.therapistProfile.create({
    data: {
      userId,
      licenseNumber: `LIC-${Date.now()}`,
      specialization: ['CBT', 'Psychodynamic'],
      biography: 'Test therapist bio',
      yearsExperience: 5,
      hourlyRate: 500,
      sessionDuration: 50,
    },
  });
}

export async function createTestClient(userId: string) {
  return prisma.clientProfile.create({
    data: {
      userId,
      dateOfBirth: new Date('1990-01-01'),
      gender: 'male',
      occupation: 'Test Occupation',
      emergContact: 'Emergency Contact',
      emergPhone: '+905559999999',
      consentSigned: true,
      consentSignedAt: new Date(),
      recordingConsent: true,
      dataProcessConsent: true,
      isActive: true,
    },
  });
}

export async function createTestAppointment(
  therapistId: string,
  clientId: string,
  userId: string,
  startTime?: Date,
  endTime?: Date,
) {
  const start = startTime || new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
  const end = endTime || new Date(start.getTime() + 50 * 60 * 1000); // 50 minutes later

  return prisma.appointment.create({
    data: {
      therapistId,
      clientId,
      userId,
      startTime: start,
      endTime: end,
      duration: 50,
      type: 'individual',
      status: 'SCHEDULED',
    },
  });
}

export async function createTestSession(
  appointmentId: string,
  therapistId: string,
  clientId: string,
  userId: string,
) {
  return prisma.session.create({
    data: {
      appointmentId,
      therapistId,
      clientId,
      userId,
      sessionNumber: 1,
      actualStart: new Date(),
      actualEnd: new Date(Date.now() + 50 * 60 * 1000),
      duration: 50,
      noteStatus: 'DRAFT',
    },
  });
}

export async function createTestPayment(userId: string, sessionId?: string, amount = 500) {
  return prisma.payment.create({
    data: {
      userId,
      sessionId,
      amount,
      currency: 'TRY',
      status: 'PENDING',
      method: 'CASH',
    },
  });
}

export { prisma };