import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

type Alert = {
  id: string;
  type: 'INFO'|'WARN'|'ERROR';
  message: string;
  ts: number;
};

const alerts: Alert[] = [];

// jednoduchý generator alertů
function generateAlert(): Alert {
  const types: Alert['type'][] = ['INFO','WARN','ERROR'];
  const pick = types[Math.floor(Math.random()*types.length)];
  return {
    id: Math.random().toString(36).slice(2),
    type: pick,
    message: pick === 'ERROR' ? 'Unexpected error occurred'
      : pick === 'WARN' ? 'Disk space getting low'
      : 'Background job finished',
    ts: Date.now()
  };
}

// REST: seznam posledních alertů
app.get('/api/alerts', (_req, res) => {
  res.json(alerts.slice(-100));
});

// SSE stream
app.get('/api/alerts/stream', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });
  res.flushHeaders?.();

  // uvítací event
  res.write(`event: hello\ndata: ${JSON.stringify({ ts: Date.now() })}\n\n`);

  const timer = setInterval(() => {
    const a = generateAlert();
    alerts.push(a);
    res.write(`event: alert\ndata: ${JSON.stringify(a)}\n\n`);
    // keepalive ping
    res.write(`event: ping\ndata: ${Date.now()}\n\n`);
  }, 5000);

  req.on('close', () => {
    clearInterval(timer);
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
});
