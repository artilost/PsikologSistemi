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
  createTestPayment,
  prisma 
} from './utils/test-utils';

describe('ReportsController (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let therapistToken: string;
  let clientToken: string;
  let therapistProfileId: string;
  let clientProfileId: string;
  let clientUserId: string;
  let therapistUserId: string;

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

    // Create some test data for reports
    const appointment = await createTestAppointment(
      therapistProfileId,
      clientProfileId,
      clientUserId,
    );

    const session = await createTestSession(
      appointment.id,
      therapistProfileId,
      clientProfileId,
      clientUserId,
    );

    await createTestPayment(clientUserId, session.id, 500);

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

  describe('GET /api/v1/reports/dashboard', () => {
    it('should get dashboard statistics (admin)', () => {
      return request(app.getHttpServer())
        .get('/api/v1/reports/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.totalClients).toBeDefined();
          expect(res.body.data.totalAppointments).toBeDefined();
          expect(res.body.data.totalSessions).toBeDefined();
          expect(res.body.data.pendingPayments).toBeDefined();
        });
    });

    it('should get dashboard statistics (therapist)', () => {
      return request(app.getHttpServer())
        .get('/api/v1/reports/dashboard')
        .set('Authorization', `Bearer ${therapistToken}`)
        .expect(200);
    });

    it('should reject client role', () => {
      return request(app.getHttpServer())
        .get('/api/v1/reports/dashboard')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(403);
    });
  });

  describe('GET /api/v1/reports/appointments', () => {
    it('should get appointment statistics', () => {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      return request(app.getHttpServer())
        .get(`/api/v1/reports/appointments?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.total).toBeDefined();
          expect(res.body.data.completed).toBeDefined();
          expect(res.body.data.cancelled).toBeDefined();
          expect(res.body.data.completionRate).toBeDefined();
        });
    });

    it('should filter by therapist', () => {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      return request(app.getHttpServer())
        .get(`/api/v1/reports/appointments?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&therapistId=${therapistProfileId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  describe('GET /api/v1/reports/revenue', () => {
    it('should get revenue report (admin)', () => {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = new Date();

      return request(app.getHttpServer())
        .get(`/api/v1/reports/revenue?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.totalRevenue).toBeDefined();
          expect(res.body.data.paidAmount).toBeDefined();
          expect(res.body.data.pendingAmount).toBeDefined();
          expect(res.body.data.revenueByMethod).toBeDefined();
        });
    });

    it('should reject therapist from revenue report', () => {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = new Date();

      return request(app.getHttpServer())
        .get(`/api/v1/reports/revenue?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
        .set('Authorization', `Bearer ${therapistToken}`)
        .expect(403);
    });
  });

  describe('GET /api/v1/reports/therapist-performance', () => {
    it('should get therapist performance report', () => {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = new Date();

      return request(app.getHttpServer())
        .get(`/api/v1/reports/therapist-performance?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
          expect(Array.isArray(res.body.data)).toBe(true);
          if (res.body.data.length > 0) {
            expect(res.body.data[0].therapistId).toBeDefined();
            expect(res.body.data[0].name).toBeDefined();
            expect(res.body.data[0].totalSessions).toBeDefined();
          }
        });
    });

    it('should reject non-admin from performance report', () => {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = new Date();

      return request(app.getHttpServer())
        .get(`/api/v1/reports/therapist-performance?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
        .set('Authorization', `Bearer ${therapistToken}`)
        .expect(403);
    });
  });

  describe('GET /api/v1/reports/clients', () => {
    it('should get client report', () => {
      const startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
      const endDate = new Date();

      return request(app.getHttpServer())
        .get(`/api/v1/reports/clients?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.newClients).toBeDefined();
          expect(res.body.data.activeClients).toBeDefined();
          expect(res.body.data.inactiveClients).toBeDefined();
          expect(res.body.data.clientsByMonth).toBeDefined();
        });
    });

    it('should reject non-admin from client report', () => {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = new Date();

      return request(app.getHttpServer())
        .get(`/api/v1/reports/clients?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
        .set('Authorization', `Bearer ${therapistToken}`)
        .expect(403);
    });
  });
});

