import http from 'http';

describe('Server smoke test', () => {
  it('responds to health check', async () => {
    const res = await new Promise<http.IncomingMessage>((resolve) => {
      http.get('http://localhost:3000/health', resolve);
    });
    expect(res.statusCode).toBe(200);
  });
});
