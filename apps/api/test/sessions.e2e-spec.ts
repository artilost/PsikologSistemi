import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './utils/test-app-factory';
import { 
  cleanDatabase, 
  createTestOrganization, 
  createTestClient, 
  createTestTherapist,
  createTestAppointment,
  createTestSession,
  prisma 
} from './utils/test-utils';

describe('SessionsController (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let therapistToken: string;
  let clientToken: string;
  let therapistProfileId: string;
  let clientProfileId: string;
  let clientUserId: string;
  let therapistUserId: string;
  let appointmentId: string;
  let sessionId: string;

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

    // Create test session
    const session = await createTestSession(
      appointmentId,
      therapistProfileId,
      clientProfileId,
      clientUserId,
    );
    sessionId = session.id;

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

  describe('GET /api/v1/sessions', () => {
    it('should get all sessions (admin)', () => {
      return request(app.getHttpServer())
        .get('/api/v1/sessions')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toBeDefined();
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('should get all sessions (therapist)', () => {
      return request(app.getHttpServer())
        .get('/api/v1/sessions')
        .set('Authorization', `Bearer ${therapistToken}`)
        .expect(200);
    });

    it('should reject client role from listing sessions', () => {
      return request(app.getHttpServer())
        .get('/api/v1/sessions')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(403);
    });

    it('should filter sessions by therapist', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/sessions?therapistId=${therapistProfileId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  describe('GET /api/v1/sessions/:id', () => {
    it('should get session by ID', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${therapistToken}`)
        .expect(200)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.id).toEqual(sessionId);
        });
    });

    it('should return 404 for non-existent session', () => {
      return request(app.getHttpServer())
        .get('/api/v1/sessions/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('GET /api/v1/sessions/by-appointment/:appointmentId', () => {
    it('should get session by appointment ID', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/sessions/by-appointment/${appointmentId}`)
        .set('Authorization', `Bearer ${therapistToken}`)
        .expect(200)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.appointmentId).toEqual(appointmentId);
        });
    });
  });

  describe('GET /api/v1/sessions/drafts', () => {
    it('should get draft sessions', () => {
      return request(app.getHttpServer())
        .get('/api/v1/sessions/drafts')
        .set('Authorization', `Bearer ${therapistToken}`)
        .expect(200)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });
  });

  describe('GET /api/v1/sessions/client-history/:clientId', () => {
    it('should get client session history', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/sessions/client-history/${clientProfileId}`)
        .set('Authorization', `Bearer ${therapistToken}`)
        .expect(200)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });
  });

  describe('POST /api/v1/sessions', () => {
    it('should create a new session', async () => {
      // First create a new appointment without session
      const newAppointment = await createTestAppointment(
        therapistProfileId,
        clientProfileId,
        clientUserId,
        new Date(Date.now() + 48 * 60 * 60 * 1000),
      );

      return request(app.getHttpServer())
        .post('/api/v1/sessions')
        .set('Authorization', `Bearer ${therapistToken}`)
        .send({
          appointmentId: newAppointment.id,
          therapistId: therapistProfileId,
          clientId: clientProfileId,
          userId: clientUserId,
          sessionNumber: 2,
        })
        .expect(201)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.appointmentId).toEqual(newAppointment.id);
        });
    });

    it('should reject duplicate session for same appointment', () => {
      return request(app.getHttpServer())
        .post('/api/v1/sessions')
        .set('Authorization', `Bearer ${therapistToken}`)
        .send({
          appointmentId: appointmentId,
          therapistId: therapistProfileId,
          clientId: clientProfileId,
          userId: clientUserId,
        })
        .expect(400);
    });
  });

  describe('PATCH /api/v1/sessions/:id/notes', () => {
    it('should update session notes', () => {
      return request(app.getHttpServer())
        .patch(`/api/v1/sessions/${sessionId}/notes`)
        .set('Authorization', `Bearer ${therapistToken}`)
        .send({
          clinicalNotes: 'Patient showed improvement',
          treatmentPlan: 'Continue CBT',
          progressNotes: 'Good progress',
          diagnosis: 'Anxiety Disorder',
          interventions: ['CBT', 'Mindfulness'],
          homework: 'Daily journaling',
        })
        .expect(200)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.clinicalNotes).toEqual('Patient showed improvement');
        });
    });
  });

  describe('POST /api/v1/sessions/:id/sign', () => {
    it('should sign session notes', () => {
      return request(app.getHttpServer())
        .post(`/api/v1/sessions/${sessionId}/sign`)
        .set('Authorization', `Bearer ${therapistToken}`)
        .expect(200)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
        });
    });

    it('should reject signing already signed session', async () => {
      // First sign
      await request(app.getHttpServer())
        .post(`/api/v1/sessions/${sessionId}/sign`)
        .set('Authorization', `Bearer ${therapistToken}`);

      // Try to sign again
      return request(app.getHttpServer())
        .post(`/api/v1/sessions/${sessionId}/sign`)
        .set('Authorization', `Bearer ${therapistToken}`)
        .expect(400);
    });
  });

  describe('GET /api/v1/sessions/stats/:therapistId', () => {
    it('should get therapist session statistics', () => {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = new Date();

      return request(app.getHttpServer())
        .get(`/api/v1/sessions/stats/${therapistProfileId}?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
        .set('Authorization', `Bearer ${therapistToken}`)
        .expect(200)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.totalSessions).toBeDefined();
        });
    });
  });

  describe('DELETE /api/v1/sessions/:id', () => {
    it('should delete session (admin only)', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
        });
    });

    it('should reject non-admin deletion', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${therapistToken}`)
        .expect(403);
    });
  });
});

