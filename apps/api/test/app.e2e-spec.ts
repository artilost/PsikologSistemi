import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './utils/test-app-factory';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  it('/api/v1/health (GET) - should return health status', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/health');
    
    // Debug: log the response if it fails
    if (response.status !== 200) {
      console.log('Health endpoint response:', response.status, response.body);
    }
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('environment');
  });

  it('/api/v1/health/live (GET) - should return liveness probe', () => {
    return request(app.getHttpServer())
      .get('/api/v1/health/live')
      .expect(200)
      .expect((res: any) => {
        expect(res.body).toHaveProperty('status', 'alive');
        expect(res.body).toHaveProperty('timestamp');
      });
  });

  it('/api/v1/health/ready (GET) - should return readiness probe', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/health/ready');
    
    // In test environment, Redis might not be available, so we accept both 200 and 503
    expect([200, 503]).toContain(response.status);
    if (response.status === 200) {
      expect(response.body).toHaveProperty('status', 'ready');
      expect(response.body).toHaveProperty('checks');
    }
  });

  afterAll(async () => {
    await app.close();
  });
});

