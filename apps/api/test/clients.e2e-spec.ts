import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './utils/test-app-factory';
import { cleanDatabase, createTestOrganization, createTestClient, prisma } from './utils/test-utils';

describe('ClientsController (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let therapistToken: string;
  let clientToken: string;
  let clientProfileId: string;
  let clientUserId: string;
  let orgId: string;

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();

    // Create organization
    const org = await createTestOrganization('Test Clinic');
    orgId = org.id;

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

    // Create client profile
    const clientProfile = await createTestClient(clientUserId);
    clientProfileId = clientProfile.id;

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

  describe('GET /api/v1/clients', () => {
    it('should get all clients (admin)', () => {
      return request(app.getHttpServer())
        .get('/api/v1/clients')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toBeDefined();
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('should get all clients (therapist)', () => {
      return request(app.getHttpServer())
        .get('/api/v1/clients')
        .set('Authorization', `Bearer ${therapistToken}`)
        .expect(200);
    });

    it('should reject client role from listing all clients', () => {
      return request(app.getHttpServer())
        .get('/api/v1/clients')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(403);
    });

    it('should support pagination', () => {
      return request(app.getHttpServer())
        .get('/api/v1/clients?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res: any) => {
          expect(res.body.meta).toBeDefined();
          expect(res.body.meta.page).toBe(1);
          expect(res.body.meta.limit).toBe(10);
        });
    });
  });

  describe('GET /api/v1/clients/search', () => {
    it('should search clients by name', () => {
      return request(app.getHttpServer())
        .get('/api/v1/clients/search?q=Client')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
        });
    });
  });

  describe('GET /api/v1/clients/:id', () => {
    it('should get client by ID', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/clients/${clientProfileId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.id).toEqual(clientProfileId);
        });
    });

    it('should return 404 for non-existent client', () => {
      return request(app.getHttpServer())
        .get('/api/v1/clients/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('GET /api/v1/clients/by-user/:userId', () => {
    it('should get client by user ID', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/clients/by-user/${clientUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.userId).toEqual(clientUserId);
        });
    });
  });

  describe('PATCH /api/v1/clients/:id', () => {
    it('should update client profile', () => {
      return request(app.getHttpServer())
        .patch(`/api/v1/clients/${clientProfileId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          occupation: 'Software Engineer',
          address: 'Istanbul, Turkey',
        })
        .expect(200)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.occupation).toEqual('Software Engineer');
        });
    });
  });

  describe('PATCH /api/v1/clients/:id/consent', () => {
    it('should update client consent', () => {
      return request(app.getHttpServer())
        .patch(`/api/v1/clients/${clientProfileId}/consent`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          consentType: 'recording',
          value: false,
        })
        .expect(200)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
        });
    });
  });

  describe('DELETE /api/v1/clients/:id', () => {
    it('should soft delete client (admin only)', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/clients/${clientProfileId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
        });
    });

    it('should reject non-admin deletion', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/clients/${clientProfileId}`)
        .set('Authorization', `Bearer ${therapistToken}`)
        .expect(403);
    });
  });

  describe('POST /api/v1/clients/:id/restore', () => {
    it('should restore soft-deleted client', async () => {
      // First soft delete
      await request(app.getHttpServer())
        .delete(`/api/v1/clients/${clientProfileId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Then restore
      return request(app.getHttpServer())
        .post(`/api/v1/clients/${clientProfileId}/restore`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
        });
    });
  });
});

