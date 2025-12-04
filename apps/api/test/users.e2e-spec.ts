import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './utils/test-app-factory';
import { cleanDatabase, createTestOrganization, prisma } from './utils/test-utils';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let clientToken: string;
  let therapistToken: string;
  let adminId: string;
  let clientId: string;
  let therapistId: string;

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();

    // Register admin
    const adminReg = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'admin@test.com',
        password: 'Password123!',
        firstName: 'Admin',
        lastName: 'User',
        phone: '+905551111111',
        role: 'ADMIN',
      });
    adminId = adminReg.body.data?.id;

    // Register client
    const clientReg = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'client@test.com',
        password: 'Password123!',
        firstName: 'Client',
        lastName: 'User',
        phone: '+905552222222',
        role: 'CLIENT',
      });
    clientId = clientReg.body.data?.id;

    // Register therapist
    const therapistReg = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'therapist@test.com',
        password: 'Password123!',
        firstName: 'Therapist',
        lastName: 'User',
        phone: '+905553333333',
        role: 'THERAPIST',
      });
    therapistId = therapistReg.body.data?.id;

    // Login to get tokens
    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'Password123!',
      });
    adminToken = adminLogin.body.data?.accessToken;

    const clientLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'client@test.com',
        password: 'Password123!',
      });
    clientToken = clientLogin.body.data?.accessToken;

    const therapistLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'therapist@test.com',
        password: 'Password123!',
      });
    therapistToken = therapistLogin.body.data?.accessToken;
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('GET /api/v1/users', () => {
    it('should get all users (admin only)', () => {
      return request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res: any) => {
          expect(res.body.data).toBeDefined();
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('should reject non-admin users', () => {
      return request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(403);
    });

    it('should support pagination', () => {
      return request(app.getHttpServer())
        .get('/api/v1/users?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  describe('GET /api/v1/users/:id', () => {
    it('should get user by ID (own profile)', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/users/${clientId}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200)
        .expect((res: any) => {
          expect(res.body.data.id).toEqual(clientId);
          expect(res.body.data.email).toEqual('client@test.com');
        });
    });

    it('should get user by ID (admin can view any)', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/users/${clientId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('should return 404 for non-existent user', () => {
      return request(app.getHttpServer())
        .get('/api/v1/users/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('PATCH /api/v1/users/:id', () => {
    it('should update own profile', () => {
      return request(app.getHttpServer())
        .patch(`/api/v1/users/${clientId}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          firstName: 'Updated',
          lastName: 'Name',
        })
        .expect(200)
        .expect((res: any) => {
          expect(res.body.data.firstName).toEqual('Updated');
          expect(res.body.data.lastName).toEqual('Name');
        });
    });

    it('should reject duplicate email update', async () => {
      // Create another user
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'another@test.com',
          password: 'Password123!',
          firstName: 'Another',
          lastName: 'User',
          phone: '+905554444444',
        });

      // Try to update client email to existing email
      return request(app.getHttpServer())
        .patch(`/api/v1/users/${clientId}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          email: 'another@test.com',
        })
        .expect(409);
    });
  });

  describe('DELETE /api/v1/users/:id', () => {
    it('should soft delete user (admin only)', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/users/${clientId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
        });
    });

    it('should reject non-admin deletion', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/users/${clientId}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(403);
    });
  });

  describe('POST /api/v1/users/:id/restore', () => {
    it('should restore soft-deleted user (admin only)', async () => {
      // First delete
      await request(app.getHttpServer())
        .delete(`/api/v1/users/${clientId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Then restore
      return request(app.getHttpServer())
        .post(`/api/v1/users/${clientId}/restore`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
        });
    });

    it('should reject non-admin restore', () => {
      return request(app.getHttpServer())
        .post(`/api/v1/users/${clientId}/restore`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(403);
    });
  });
});
