import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './utils/test-app-factory';
import { 
  cleanDatabase, 
  createTestOrganization, 
  createTestClient, 
  createTestTherapist,
  createTestAppointment,
  prisma 
} from './utils/test-utils';

describe('AppointmentsController (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let therapistToken: string;
  let clientToken: string;
  let therapistProfileId: string;
  let clientProfileId: string;
  let clientUserId: string;
  let therapistUserId: string;
  let appointmentId: string;

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();

    // Create organization
    const org = await createTestOrganization('Test Clinic');

    // Register admin
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'admin@test.com',
        password: 'Password123!',
        firstName: 'Admin',
        lastName: 'User',
        phone: '+905551111111',
        role: 'ADMIN',
      });

    // Register therapist
    const therapistRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'therapist@test.com',
        password: 'Password123!',
        firstName: 'Therapist',
        lastName: 'User',
        phone: '+905552222222',
        role: 'THERAPIST',
      });
    therapistUserId = therapistRes.body.data.id;

    // Register client
    const clientRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'client@test.com',
        password: 'Password123!',
        firstName: 'Client',
        lastName: 'User',
        phone: '+905553333333',
        role: 'CLIENT',
      });
    clientUserId = clientRes.body.data.id;

    // Create profiles
    const therapistProfile = await createTestTherapist(therapistUserId);
    therapistProfileId = therapistProfile.id;

    const clientProfile = await createTestClient(clientUserId);
    clientProfileId = clientProfile.id;

    // Create test appointment
    const appointment = await createTestAppointment(
      therapistProfileId,
      clientProfileId,
      clientUserId,
    );
    appointmentId = appointment.id;

    // Get tokens
    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@test.com', password: 'Password123!' });
    adminToken = adminLogin.body.data.accessToken;

    const therapistLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'therapist@test.com', password: 'Password123!' });
    therapistToken = therapistLogin.body.data.accessToken;

    const clientLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'client@test.com', password: 'Password123!' });
    clientToken = clientLogin.body.data.accessToken;
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('GET /api/v1/appointments', () => {
    it('should get all appointments', () => {
      return request(app.getHttpServer())
        .get('/api/v1/appointments')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toBeDefined();
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('should filter appointments by therapist', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/appointments?therapistId=${therapistProfileId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('should support pagination', () => {
      return request(app.getHttpServer())
        .get('/api/v1/appointments?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res: any) => {
          expect(res.body.meta).toBeDefined();
        });
    });
  });

  describe('GET /api/v1/appointments/:id', () => {
    it('should get appointment by ID', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/appointments/${appointmentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.id).toEqual(appointmentId);
        });
    });

    it('should return 404 for non-existent appointment', () => {
      return request(app.getHttpServer())
        .get('/api/v1/appointments/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('POST /api/v1/appointments', () => {
    it('should create a new appointment', () => {
      const startTime = new Date(Date.now() + 48 * 60 * 60 * 1000); // Day after tomorrow
      const endTime = new Date(startTime.getTime() + 50 * 60 * 1000);

      return request(app.getHttpServer())
        .post('/api/v1/appointments')
        .set('Authorization', `Bearer ${therapistToken}`)
        .send({
          therapistId: therapistProfileId,
          clientId: clientProfileId,
          userId: clientUserId,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          duration: 50,
          type: 'individual',
        })
        .expect(201)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.therapistId).toEqual(therapistProfileId);
        });
    });

    it('should reject conflicting appointments', async () => {
      // Get the existing appointment's time
      const existingAppointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
      });

      return request(app.getHttpServer())
        .post('/api/v1/appointments')
        .set('Authorization', `Bearer ${therapistToken}`)
        .send({
          therapistId: therapistProfileId,
          clientId: clientProfileId,
          userId: clientUserId,
          startTime: existingAppointment!.startTime.toISOString(),
          endTime: existingAppointment!.endTime.toISOString(),
          duration: 50,
        })
        .expect(400);
    });
  });

  describe('PATCH /api/v1/appointments/:id', () => {
    it('should update appointment', () => {
      return request(app.getHttpServer())
        .patch(`/api/v1/appointments/${appointmentId}`)
        .set('Authorization', `Bearer ${therapistToken}`)
        .send({
          appointmentNotes: 'Updated notes',
          type: 'online',
        })
        .expect(200)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.appointmentNotes).toEqual('Updated notes');
        });
    });
  });

  describe('PATCH /api/v1/appointments/:id/status', () => {
    it('should update appointment status', () => {
      return request(app.getHttpServer())
        .patch(`/api/v1/appointments/${appointmentId}/status`)
        .set('Authorization', `Bearer ${therapistToken}`)
        .send({ status: 'CONFIRMED' })
        .expect(200)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
        });
    });
  });

  describe('POST /api/v1/appointments/:id/cancel', () => {
    it('should cancel appointment', () => {
      return request(app.getHttpServer())
        .post(`/api/v1/appointments/${appointmentId}/cancel`)
        .set('Authorization', `Bearer ${therapistToken}`)
        .send({ reason: 'Patient request' })
        .expect(200)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
        });
    });
  });

  describe('POST /api/v1/appointments/:id/reschedule', () => {
    it('should reschedule appointment', () => {
      const newStartTime = new Date(Date.now() + 72 * 60 * 60 * 1000);
      const newEndTime = new Date(newStartTime.getTime() + 50 * 60 * 1000);

      return request(app.getHttpServer())
        .post(`/api/v1/appointments/${appointmentId}/reschedule`)
        .set('Authorization', `Bearer ${therapistToken}`)
        .send({
          startTime: newStartTime.toISOString(),
          endTime: newEndTime.toISOString(),
        })
        .expect(200)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
        });
    });
  });

  describe('GET /api/v1/appointments/available-slots', () => {
    it('should get available time slots', () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

      return request(app.getHttpServer())
        .get(`/api/v1/appointments/available-slots?therapistId=${therapistProfileId}&date=${tomorrow.toISOString()}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });
  });

  describe('DELETE /api/v1/appointments/:id', () => {
    it('should delete appointment (admin only)', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/appointments/${appointmentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
        });
    });

    it('should reject non-admin deletion', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/appointments/${appointmentId}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(403);
    });
  });
});

