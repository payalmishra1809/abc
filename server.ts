import express from 'express';
import http from 'http';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocket, WebSocketServer } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

app.use(express.json());

// Game authoritative state
interface Team {
  name: string;
  score: number;
  finalist: boolean;
  individualLock?: boolean;
}

interface BuzzEntry {
  team: number;
  name: string;
  at: number;
  deltaMs: number;
  ip: string;
  deviceId: string;
}

interface EventLogItem {
  id: string;
  timestamp: number;
  timeFormatted: string;
  type: 'buzz' | 'score' | 'lock' | 'unlock' | 'connect' | 'disconnect' | 'reset' | 'test' | 'team_edit';
  message: string;
  teamIndex?: number;
  delta?: number;
}

interface ConnectedClient {
  id: string;
  ws: WebSocket;
  role: 'host' | 'buzzer';
  team: number;
  name: string;
  ip: string;
  userAgent: string;
  connectedAt: number;
  lastPing: number;
  latencyMs: number;
}

const teams: Team[] = Array.from({ length: 8 }, (_, i) => ({
  name: `Team ${i + 1}`,
  score: 0,
  finalist: false,
  individualLock: false,
}));

let buzzLocked = true;
let qKey: string | null = null;
let currentRound = 'r1';
let currentQIndex = 0;
let buzzedTeam: number | null = null;
let lockedOutTeams: number[] = [];
let liveQueue: BuzzEntry[] = [];
const eventLogs: EventLogItem[] = [];

function logEvent(type: EventLogItem['type'], message: string, teamIndex?: number, delta?: number) {
  const now = Date.now();
  const d = new Date(now);
  const timeFormatted = d.toLocaleTimeString('en-US', { hour12: false }) + '.' + String(d.getMilliseconds()).padStart(3, '0');
  const item: EventLogItem = {
    id: `${now}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: now,
    timeFormatted,
    type,
    message,
    teamIndex,
    delta,
  };
  eventLogs.unshift(item);
  if (eventLogs.length > 200) eventLogs.pop();
  broadcast({ type: 'event-logged', item });
}

// Connected clients
const clients = new Map<string, ConnectedClient>();

function getPublicClientList() {
  return Array.from(clients.values()).map(c => ({
    id: c.id,
    role: c.role,
    team: c.team,
    name: c.name,
    ip: c.ip,
    userAgent: c.userAgent,
    connectedAt: c.connectedAt,
    lastPing: c.lastPing,
    latencyMs: c.latencyMs,
  }));
}

function broadcast(data: any, excludeWs?: WebSocket) {
  const msg = JSON.stringify(data);
  for (const client of clients.values()) {
    if (client.ws !== excludeWs && client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(msg);
      } catch (e) {
        // ignore send error
      }
    }
  }
}

function broadcastGameState() {
  broadcast({
    type: 'game-state',
    state: {
      teams,
      buzzLocked,
      qKey,
      currentRound,
      currentQIndex,
      buzzedTeam,
      lockedOutTeams,
      liveQueue,
      clients: getPublicClientList(),
      recentLogs: eventLogs.slice(0, 50),
    },
  });
}

// WebSocket connection handling
wss.on('connection', (ws, req) => {
  const clientId = `client-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const rawIp = req.socket.remoteAddress || '127.0.0.1';
  const ip = rawIp.replace(/^.*:/, '');
  const userAgent = req.headers['user-agent'] || 'Unknown Device';

  const clientInfo: ConnectedClient = {
    id: clientId,
    ws,
    role: 'buzzer',
    team: 0,
    name: teams[0]?.name || 'Team 1',
    ip,
    userAgent,
    connectedAt: Date.now(),
    lastPing: Date.now(),
    latencyMs: 0,
  };

  clients.set(clientId, clientInfo);

  // Send initial state to newly connected client
  ws.send(
    JSON.stringify({
      type: 'init',
      clientId,
      teams,
      buzzLocked,
      qKey,
      currentRound,
      currentQIndex,
      buzzedTeam,
      lockedOutTeams,
      liveQueue,
      clients: getPublicClientList(),
      recentLogs: eventLogs.slice(0, 50),
    })
  );

  ws.on('message', (raw) => {
    try {
      const data = JSON.parse(raw.toString());
      handleClientMessage(clientInfo, data);
    } catch (e) {
      console.error('Invalid WS payload', e);
    }
  });

  ws.on('close', () => {
    const info = clients.get(clientId);
    if (info) {
      logEvent('disconnect', `${info.role === 'host' ? 'Host' : info.name} disconnected (${info.ip})`, info.team);
    }
    clients.delete(clientId);
    broadcast({ type: 'client-list-update', clients: getPublicClientList() });
  });

  ws.on('error', () => {
    clients.delete(clientId);
  });
});

function handleClientMessage(client: ConnectedClient, msg: any) {
  const now = Date.now();

  switch (msg.type) {
    case 'join': {
      client.role = msg.role === 'host' ? 'host' : 'buzzer';
      client.team = typeof msg.team === 'number' ? msg.team : 0;
      client.name = teams[client.team]?.name || `Team ${client.team + 1}`;
      logEvent('connect', `${client.role === 'host' ? '👑 Master Console Host' : `📲 ${client.name}`} joined from ${client.ip}`, client.team);
      broadcast({ type: 'client-list-update', clients: getPublicClientList() });
      break;
    }

    case 'ping': {
      client.lastPing = now;
      if (typeof msg.clientTimestamp === 'number') {
        client.latencyMs = Math.max(1, Math.round(now - msg.clientTimestamp));
      }
      try {
        client.ws.send(JSON.stringify({ type: 'pong', serverTimestamp: now, clientTimestamp: msg.clientTimestamp }));
      } catch (e) {}
      break;
    }

    case 'buzz': {
      // Participant buzzed
      const teamIdx = typeof msg.team === 'number' ? msg.team : client.team;
      const teamName = teams[teamIdx]?.name || `Team ${teamIdx + 1}`;

      // Check validations
      if (buzzLocked) {
        try {
          client.ws.send(JSON.stringify({ type: 'buzz-rejected', reason: 'Buzzers are locked by host' }));
        } catch (e) {}
        return;
      }

      if (teams[teamIdx]?.individualLock) {
        try {
          client.ws.send(JSON.stringify({ type: 'buzz-rejected', reason: 'Your team is individually locked' }));
        } catch (e) {}
        return;
      }

      if (lockedOutTeams.includes(teamIdx)) {
        try {
          client.ws.send(JSON.stringify({ type: 'buzz-rejected', reason: 'Your team is locked out for this question' }));
        } catch (e) {}
        return;
      }

      // Check if already in queue for this question
      const alreadyInQueue = liveQueue.some(q => q.team === teamIdx);
      if (alreadyInQueue) {
        return;
      }

      const firstTime = liveQueue.length > 0 ? liveQueue[0].at : now;
      const deltaMs = now - firstTime;

      const entry: BuzzEntry = {
        team: teamIdx,
        name: teamName,
        at: now,
        deltaMs,
        ip: client.ip,
        deviceId: client.id,
      };

      liveQueue.push(entry);

      // If first buzz, mark as current active buzzed team
      if (buzzedTeam === null) {
        buzzedTeam = teamIdx;
      }

      const ordinal = liveQueue.length === 1 ? '1st' : liveQueue.length === 2 ? '2nd' : liveQueue.length === 3 ? '3rd' : `${liveQueue.length}th`;
      const deltaText = liveQueue.length === 1 ? 'First buzz!' : `+${(deltaMs / 1000).toFixed(2)}s`;
      logEvent('buzz', `⚡ ${teamName} BUZZED IN (${ordinal} · ${deltaText})`, teamIdx);

      // Broadcast update
      broadcast({
        type: 'buzz-event',
        entry,
        queue: liveQueue,
        buzzedTeam,
      });
      break;
    }

    case 'unlock-buzzers': {
      buzzLocked = false;
      qKey = msg.qKey || `${currentRound}|${currentQIndex}`;
      liveQueue = [];
      buzzedTeam = null;
      if (msg.clearLockedOut) {
        lockedOutTeams = [];
      }
      logEvent('unlock', `🔓 Buzzers unlocked for question [${qKey}]`);
      broadcastGameState();
      break;
    }

    case 'lock-buzzers': {
      buzzLocked = true;
      logEvent('lock', `🔒 Buzzers locked by host`);
      broadcastGameState();
      break;
    }

    case 'select-buzzer': {
      const idx = msg.team;
      if (typeof idx === 'number' && !lockedOutTeams.includes(idx)) {
        buzzedTeam = idx;
        broadcastGameState();
      }
      break;
    }

    case 'clear-queue': {
      liveQueue = [];
      buzzedTeam = null;
      broadcastGameState();
      break;
    }

    case 'award-score': {
      const { team, points, reason } = msg;
      if (typeof team === 'number' && teams[team]) {
        teams[team].score += points;
        const sign = points >= 0 ? `+${points}` : `${points}`;
        logEvent('score', `🏆 ${teams[team].name} awarded ${sign} pts (${reason || 'Score update'})`, team, points);
        if (points > 0) {
          // Clear active buzz after correct answer
          buzzedTeam = null;
          lockedOutTeams = [];
        }
        broadcastGameState();
      }
      break;
    }

    case 'mark-wrong': {
      const { team, penalty } = msg;
      if (typeof team === 'number' && teams[team]) {
        if (penalty) {
          teams[team].score += penalty; // penalty is negative like -5 or -10
        }
        if (!lockedOutTeams.includes(team)) {
          lockedOutTeams.push(team);
        }
        logEvent('score', `✘ ${teams[team].name} answered incorrect (${penalty || 0} pts)`, team, penalty);

        // Next team in queue gets the floor if available
        const nextInQueue = liveQueue.find(q => !lockedOutTeams.includes(q.team));
        buzzedTeam = nextInQueue ? nextInQueue.team : null;

        broadcastGameState();
      }
      break;
    }

    case 'update-team': {
      const { team, name, finalist, individualLock } = msg;
      if (typeof team === 'number' && teams[team]) {
        if (typeof name === 'string' && name.trim()) teams[team].name = name.trim();
        if (typeof finalist === 'boolean') teams[team].finalist = finalist;
        if (typeof individualLock === 'boolean') teams[team].individualLock = individualLock;
        logEvent('team_edit', `Updated ${teams[team].name} settings`, team);
        broadcastGameState();
      }
      break;
    }

    case 'ring-test': {
      const targetTeam = msg.team;
      logEvent('test', targetTeam != null ? `🔔 Sent buzzer audio test to ${teams[targetTeam]?.name}` : '🔔 Sent buzzer audio test to ALL connected devices');
      broadcast({ type: 'ring-sound', team: targetTeam });
      break;
    }

    case 'set-question': {
      if (msg.roundId) currentRound = msg.roundId;
      if (typeof msg.qIndex === 'number') currentQIndex = msg.qIndex;
      qKey = `${currentRound}|${currentQIndex}`;
      liveQueue = [];
      buzzedTeam = null;
      lockedOutTeams = [];
      buzzLocked = true;
      broadcastGameState();
      break;
    }

    case 'reset-all': {
      teams.forEach((t, i) => {
        t.name = `Team ${i + 1}`;
        t.score = 0;
        t.finalist = false;
        t.individualLock = false;
      });
      buzzLocked = true;
      buzzedTeam = null;
      lockedOutTeams = [];
      liveQueue = [];
      qKey = null;
      currentRound = 'r1';
      currentQIndex = 0;
      logEvent('reset', '🔄 Entire quiz state and scores reset');
      broadcastGameState();
      break;
    }
  }
}

// REST Endpoints
app.get('/api/network-info', (req, res) => {
  const nets = os.networkInterfaces();
  const ips: string[] = [];

  for (const name of Object.keys(nets)) {
    const netList = nets[name];
    if (netList) {
      for (const net of netList) {
        // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
        if (net.family === 'IPv4' && !net.internal) {
          ips.push(net.address);
        }
      }
    }
  }

  const port = 3000;
  res.json({
    ips,
    port,
    hostname: os.hostname(),
    joinUrls: ips.map(ip => `http://${ip}:${port}`),
    localUrl: `http://localhost:${port}`,
  });
});

app.get('/api/game/state', (req, res) => {
  res.json({
    teams,
    buzzLocked,
    qKey,
    currentRound,
    currentQIndex,
    buzzedTeam,
    lockedOutTeams,
    liveQueue,
    clients: getPublicClientList(),
    recentLogs: eventLogs.slice(0, 100),
  });
});

// Local LLM integration (Ollama / LM Studio / OpenAI-compatible local endpoints)
app.post('/api/local-llm/test', async (req, res) => {
  const { endpoint, type } = req.body;
  const baseUrl = (endpoint || 'http://localhost:11434').replace(/\/+$/, '');

  try {
    if (type === 'openai_compatible') {
      // Test OpenAI-compatible endpoint like LM Studio, LocalAI, vLLM
      const testUrl = baseUrl.endsWith('/v1') ? `${baseUrl}/models` : `${baseUrl}/v1/models`;
      const response = await fetch(testUrl, {
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(4000),
      });
      if (!response.ok) {
        return res.status(400).json({ success: false, error: `Local LLM returned HTTP ${response.status}` });
      }
      const data: any = await response.json();
      const models = Array.isArray(data.data) ? data.data.map((m: any) => m.id) : ['default-local-model'];
      return res.json({ success: true, type: 'openai_compatible', models, endpoint: baseUrl });
    } else {
      // Default: Ollama endpoint
      const testUrl = `${baseUrl}/api/tags`;
      const response = await fetch(testUrl, { signal: AbortSignal.timeout(4000) });
      if (!response.ok) {
        return res.status(400).json({ success: false, error: `Ollama returned HTTP ${response.status}` });
      }
      const data: any = await response.json();
      const models = Array.isArray(data.models) ? data.models.map((m: any) => m.name) : [];
      return res.json({ success: true, type: 'ollama', models, endpoint: baseUrl });
    }
  } catch (err: any) {
    return res.status(503).json({
      success: false,
      error: `Could not connect to local LLM at ${baseUrl}. Ensure Ollama (ollama run llama3) or LM Studio is running. (${err.message})`,
    });
  }
});

app.post('/api/local-llm/generate-question', async (req, res) => {
  const { endpoint, type, model, topic, tier, format } = req.body;
  const baseUrl = (endpoint || 'http://localhost:11434').replace(/\/+$/, '');
  const modelName = model || 'llama3';

  const systemPrompt = `You are a high-tech quizmaster creating questions for "TECHNO QUIZ: Emerging Trends in Tech".
You MUST reply with ONLY a single valid JSON object, without code fences, markdown, or commentary.
Required JSON format:
{
  "question": "string",
  "tier": "${tier || 'Medium'}",
  "type": "${format === 'mcq' ? 'mcq' : 'buzzer'}",
  ${format === 'mcq' ? '"options": ["Option A", "Option B", "Option C", "Option D"],\n  "correctIndex": 0,' : ''}
  "answer": "string concisely giving the correct answer",
  "explanation": "brief 1-2 sentence tech background"
}`;

  const userPrompt = `Generate a fresh, exciting ${tier || 'Medium'} difficulty question on the topic: "${topic || 'Emerging Tech, AI, Quantum, Robotics, or Web3'}". Format: ${format === 'mcq' ? 'Multiple Choice with 4 options' : 'Open buzzer question with concise exact answer'}.`;

  try {
    let rawText = '';

    if (type === 'openai_compatible') {
      const url = baseUrl.endsWith('/v1') ? `${baseUrl}/chat/completions` : `${baseUrl}/v1/chat/completions`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelName,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.7,
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        return res.status(500).json({ error: `Local LLM failed with HTTP ${response.status}` });
      }
      const data: any = await response.json();
      rawText = data.choices?.[0]?.message?.content || '';
    } else {
      // Ollama
      const url = `${baseUrl}/api/chat`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelName,
          stream: false,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        return res.status(500).json({ error: `Ollama failed with HTTP ${response.status}` });
      }
      const data: any = await response.json();
      rawText = data.message?.content || '';
    }

    // Parse JSON safely
    const cleaned = rawText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const jsonStart = cleaned.indexOf('{');
    const jsonEnd = cleaned.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error('LLM output did not contain valid JSON: ' + rawText.slice(0, 100));
    }
    const parsed = JSON.parse(cleaned.substring(jsonStart, jsonEnd + 1));
    return res.json({ success: true, result: parsed, raw: rawText });
  } catch (err: any) {
    console.error('LLM generation error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Mount Vite or serve static dist
async function setupVite() {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }
}

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
setupVite().then(() => {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n======================================================`);
    console.log(`🏆 TECHNO QUIZ Master Console & Live Buzzer Server`);
    console.log(`======================================================`);
    console.log(`> Local:   http://localhost:${PORT}`);
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
      const netList = nets[name];
      if (netList) {
        for (const net of netList) {
          if (net.family === 'IPv4' && !net.internal) {
            console.log(`> LAN:     http://${net.address}:${PORT} (Connect other laptops here)`);
          }
        }
      }
    }
    console.log(`> WebSocket: ws://localhost:${PORT}/ws`);
    console.log(`======================================================\n`);
  });
});
