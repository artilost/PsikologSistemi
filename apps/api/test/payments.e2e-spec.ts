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

describe('PaymentsController (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let therapistToken: string;
  let clientToken: string;
  let therapistProfileId: string;
  let clientProfileId: string;
  let clientUserId: string;
  let therapistUserId: string;
  let sessionId: string;
  let paymentId: string;

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

    // Create test appointment and session
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
    sessionId = session.id;

    // Create test payment
    const payment = await createTestPayment(clientUserId, sessionId, 500);
    paymentId = payment.id;

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

  describe('GET /api/v1/payments', () => {
    it('should get all payments (admin)', () => {
      return request(app.getHttpServer())
        .get('/api/v1/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toBeDefined();
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('should reject client role from listing payments', () => {
      return request(app.getHttpServer())
        .get('/api/v1/payments')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(403);
    });

    it('should reject therapist role from listing payments', () => {
      return request(app.getHttpServer())
        .get('/api/v1/payments')
        .set('Authorization', `Bearer ${therapistToken}`)
        .expect(403);
    });

    it('should support filtering by status', () => {
      return request(app.getHttpServer())
        .get('/api/v1/payments?status=PENDING')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  describe('GET /api/v1/payments/pending', () => {
    it('should get pending payments', () => {
      return request(app.getHttpServer())
        .get('/api/v1/payments/pending')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });
  });

  describe('GET /api/v1/payments/:id', () => {
    it('should get payment by ID', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/payments/${paymentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.id).toEqual(paymentId);
        });
    });

    it('should return 404 for non-existent payment', () => {
      return request(app.getHttpServer())
        .get('/api/v1/payments/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('GET /api/v1/payments/by-session/:sessionId', () => {
    it('should get payment by session ID', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/payments/by-session/${sessionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.sessionId).toEqual(sessionId);
        });
    });
  });

  describe('POST /api/v1/payments', () => {
    it('should create a new payment', () => {
      return request(app.getHttpServer())
        .post('/api/v1/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: clientUserId,
          amount: 600,
          currency: 'TRY',
          method: 'CREDIT_CARD',
          notes: 'Test payment',
        })
        .expect(201)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.amount).toEqual('600');
        });
    });

    it('should reject duplicate payment for same session', () => {
      return request(app.getHttpServer())
        .post('/api/v1/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: clientUserId,
          sessionId: sessionId,
          amount: 500,
        })
        .expect(400);
    });
  });

  describe('PATCH /api/v1/payments/:id', () => {
    it('should update payment', () => {
      return request(app.getHttpServer())
        .patch(`/api/v1/payments/${paymentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          notes: 'Updated payment notes',
        })
        .expect(200)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.notes).toEqual('Updated payment notes');
        });
    });
  });

  describe('POST /api/v1/payments/:id/process', () => {
    it('should process payment', () => {
      return request(app.getHttpServer())
        .post(`/api/v1/payments/${paymentId}/process`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          method: 'CASH',
          paidAmount: 500,
        })
        .expect(200)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
        });
    });

    it('should support partial payment', async () => {
      // Process partial payment
      await request(app.getHttpServer())
        .post(`/api/v1/payments/${paymentId}/process`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          method: 'CASH',
          paidAmount: 250,
        })
        .expect(200);

      // Check status is PARTIALLY_PAID
      const response = await request(app.getHttpServer())
        .get(`/api/v1/payments/${paymentId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.body.data.status).toEqual('PARTIALLY_PAID');
    });
  });

  describe('POST /api/v1/payments/:id/refund', () => {
    it('should refund payment', async () => {
      // First process payment
      await request(app.getHttpServer())
        .post(`/api/v1/payments/${paymentId}/process`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          method: 'CASH',
          paidAmount: 500,
        });

      // Then refund
      return request(app.getHttpServer())
        .post(`/api/v1/payments/${paymentId}/refund`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          refundAmount: 500,
          refundReason: 'Client request',
        })
        .expect(200)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
        });
    });

    it('should reject refund for pending payment', () => {
      return request(app.getHttpServer())
        .post(`/api/v1/payments/${paymentId}/refund`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          refundAmount: 500,
          refundReason: 'Test',
        })
        .expect(400);
    });
  });

  describe('GET /api/v1/payments/stats', () => {
    it('should get payment statistics', () => {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = new Date();

      return request(app.getHttpServer())
        .get(`/api/v1/payments/stats?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.totalRevenue).toBeDefined();
          expect(res.body.data.transactionCount).toBeDefined();
        });
    });
  });

  describe('GET /api/v1/payments/revenue-by-method', () => {
    it('should get revenue by payment method', () => {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = new Date();

      return request(app.getHttpServer())
        .get(`/api/v1/payments/revenue-by-method?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toBeDefined();
        });
    });
  });

  describe('DELETE /api/v1/payments/:id', () => {
    it('should delete payment (admin only)', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/payments/${paymentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
        });
    });

    it('should reject non-admin deletion', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/payments/${paymentId}`)
        .set('Authorization', `Bearer ${therapistToken}`)
        .expect(403);
    });
  });
});

