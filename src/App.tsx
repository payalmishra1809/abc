import React, { useState, useEffect, useRef } from 'react';
import {
  ROUND_CONFIGS,
  RoundConfig,
  R4_EASY,
  R4_MEDIUM,
  R4_HARD,
} from './quizData';
import {
  sndBuzz,
  sndWrong,
  sndCorrect,
  sndTick,
  sndTimeUp,
  sndRingTest,
  sndFanfare,
} from './sound';
import { TrackingTable } from './components/TrackingTable';
import { LocalLLMStudio } from './components/LocalLLMStudio';
import { ConnectModal } from './components/ConnectModal';
import { ParticipantView } from './components/ParticipantView';
import { usePWAInstall } from './usePWAInstall';
import {
  Volume2,
  VolumeX,
  Wifi,
  Download,
  RotateCcw,
  Trophy,
  Laptop,
  QrCode,
} from 'lucide-react';

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

interface ConnectedClient {
  id: string;
  role: 'host' | 'buzzer';
  team: number;
  name: string;
  ip: string;
  userAgent: string;
  connectedAt: number;
  lastPing: number;
  latencyMs: number;
}

interface EventLogItem {
  id: string;
  timestamp: number;
  timeFormatted: string;
  type: string;
  message: string;
  teamIndex?: number;
  delta?: number;
}

interface RapidFireSetItem {
  q: string;
  a: string;
  tier: 'easy' | 'medium' | 'hard';
}

export default function App() {
  // Check URL params for role & team
  const searchParams = new URLSearchParams(window.location.search);
  const initialRole = searchParams.get('role') === 'buzzer' ? 'buzzer' : 'host';
  const initialTeamParam = searchParams.get('team');
  const initialTeamIdx = initialTeamParam ? parseInt(initialTeamParam, 10) : 0;

  const [role, setRole] = useState<'host' | 'buzzer'>(initialRole);
  const [currentTeamIdx, setCurrentTeamIdx] = useState(
    isNaN(initialTeamIdx) || initialTeamIdx < 0 ? 0 : initialTeamIdx
  );

  // Core Game State
  const [teams, setTeams] = useState<Team[]>(
    Array.from({ length: 8 }, (_, i) => ({
      name: `Team ${i + 1}`,
      score: 0,
      finalist: false,
      individualLock: false,
    }))
  );

  const [view, setView] = useState<'quiz' | 'scoreboard' | 'tracking' | 'llm'>('quiz');
  const [currentRoundId, setCurrentRoundId] = useState('r1');
  const [qIndexMap, setQIndexMap] = useState<Record<string, number>>({
    r1: 0,
    r2: 0,
    r3: 0,
    r4: 0,
    r5: 0,
    tb: 0,
  });

  const [rounds, setRounds] = useState<RoundConfig[]>(ROUND_CONFIGS);
  const [buzzedTeam, setBuzzedTeam] = useState<number | null>(null);
  const [lockedOutTeams, setLockedOutTeams] = useState<number[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [buzzLocked, setBuzzLocked] = useState(true);
  const [liveQueue, setLiveQueue] = useState<BuzzEntry[]>([]);
  const [clients, setClients] = useState<ConnectedClient[]>([]);
  const [recentLogs, setRecentLogs] = useState<EventLogItem[]>([]);
  const [muted, setMuted] = useState(false);

  // Participant State
  const [hasBuzzed, setHasBuzzed] = useState(false);

  // Rapid Fire State
  const [rfTeamIdx, setRfTeamIdx] = useState(0);
  const [rfSet, setRfSet] = useState<RapidFireSetItem[]>([]);
  const [rfResults, setRfResults] = useState<(string | null)[]>([]);
  const [rfTimeLeft, setRfTimeLeft] = useState(60);
  const [rfRunning, setRfRunning] = useState(false);
  const rfTimerRef = useRef<any>(null);

  // Modals & Overlays
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{ show: boolean; msg: string; onConfirm: () => void }>({
    show: false,
    msg: '',
    onConfirm: () => {},
  });
  const [celebrateData, setCelebrateData] = useState<{
    show: boolean;
    emoji: string;
    msg: string;
    sub: string;
  }>({
    show: false,
    emoji: '🎉',
    msg: 'Correct!',
    sub: '',
  });
  const [showWrongFlash, setShowWrongFlash] = useState(false);

  // PWA Install Hook
  const { isInstallable, install } = usePWAInstall();

  // WebSocket reference
  const wsRef = useRef<WebSocket | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const confettiParticles = useRef<any[]>([]);
  const confettiAnimId = useRef<number | null>(null);

  // Sound and celebrate triggers
  const triggerCelebration = (msg: string, sub: string, emoji = '🎉', big = false) => {
    setCelebrateData({ show: true, emoji, msg, sub });
    burstConfetti(big);
    sndFanfare(muted);
    setTimeout(() => {
      setCelebrateData((prev) => ({ ...prev, show: false }));
    }, big ? 4200 : 2200);
  };

  const triggerWrongFlash = () => {
    sndWrong(muted);
    setShowWrongFlash(true);
    setTimeout(() => setShowWrongFlash(false), 260);
  };

  // Confetti Animation Engine
  const burstConfetti = (big: boolean) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.display = 'block';

    const colors = ['#d4af37', '#0e7c7b', '#eef2f8', '#f0cf5a', '#2ecc71', '#e74c3c'];
    const count = big ? 220 : 90;

    for (let i = 0; i < count; i++) {
      confettiParticles.current.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * 200,
        vx: (Math.random() - 0.5) * (big ? 6 : 4),
        vy: 2 + Math.random() * (big ? 6 : 4),
        size: 5 + Math.random() * 7,
        color: colors[Math.floor(Math.random() * colors.length)],
        rot: Math.random() * 360,
        vrot: (Math.random() - 0.5) * 10,
        life: 0,
        maxLife: 180 + Math.random() * 80,
      });
    }

    if (!confettiAnimId.current) {
      animateConfetti();
    }
  };

  const animateConfetti = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    confettiParticles.current.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05;
      p.rot += p.vrot;
      p.life++;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rot * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    });

    confettiParticles.current = confettiParticles.current.filter(
      (p) => p.life < p.maxLife && p.y < canvas.height + 40
    );

    if (confettiParticles.current.length > 0) {
      confettiAnimId.current = requestAnimationFrame(animateConfetti);
    } else {
      confettiAnimId.current = null;
      canvas.style.display = 'none';
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  // WebSocket Lifecycle
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    let reconnectTimer: any = null;

    function connect() {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        // Register role and team
        ws.send(
          JSON.stringify({
            type: 'join',
            role,
            team: currentTeamIdx,
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          handleServerMessage(msg);
        } catch (e) {
          console.error('Invalid WS payload', e);
        }
      };

      ws.onclose = () => {
        reconnectTimer = setTimeout(connect, 2000);
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    // Ping interval to measure latency
    const pingInterval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping', clientTimestamp: Date.now() }));
      }
    }, 5000);

    return () => {
      clearInterval(pingInterval);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (wsRef.current) wsRef.current.close();
    };
  }, [role, currentTeamIdx]);

  const handleServerMessage = (msg: any) => {
    switch (msg.type) {
      case 'init':
      case 'game-state': {
        const s = msg.state || msg;
        if (s.teams) setTeams(s.teams);
        if (typeof s.buzzLocked === 'boolean') {
          setBuzzLocked(s.buzzLocked);
          if (s.buzzLocked) setHasBuzzed(false);
        }
        if (s.currentRound) setCurrentRoundId(s.currentRound);
        if (typeof s.currentQIndex === 'number') {
          setQIndexMap((prev) => ({ ...prev, [s.currentRound || 'r1']: s.currentQIndex }));
        }
        if (s.buzzedTeam !== undefined) setBuzzedTeam(s.buzzedTeam);
        if (s.lockedOutTeams) setLockedOutTeams(s.lockedOutTeams);
        if (s.liveQueue) setLiveQueue(s.liveQueue);
        if (s.clients) setClients(s.clients);
        if (s.recentLogs) setRecentLogs(s.recentLogs);
        break;
      }

      case 'client-list-update': {
        if (msg.clients) setClients(msg.clients);
        break;
      }

      case 'buzz-event': {
        if (msg.queue) setLiveQueue(msg.queue);
        if (msg.buzzedTeam !== undefined) setBuzzedTeam(msg.buzzedTeam);
        sndBuzz(muted);
        break;
      }

      case 'ring-sound': {
        if (msg.team === undefined || msg.team === currentTeamIdx) {
          sndRingTest(muted);
        }
        break;
      }

      case 'event-logged': {
        if (msg.item) {
          setRecentLogs((prev) => [msg.item, ...prev.slice(0, 100)]);
        }
        break;
      }
    }
  };

  const sendWs = (data: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  };

  // Host Action Handlers
  const handleUnlockBuzzers = (clearLockedOut = false) => {
    setBuzzLocked(false);
    setLiveQueue([]);
    setBuzzedTeam(null);
    setHasBuzzed(false);
    if (clearLockedOut) setLockedOutTeams([]);
    sendWs({
      type: 'unlock-buzzers',
      qKey: `${currentRoundId}|${qIndexMap[currentRoundId] || 0}`,
      clearLockedOut,
    });
  };

  const handleLockBuzzers = () => {
    setBuzzLocked(true);
    sendWs({ type: 'lock-buzzers' });
  };

  const handleClearQueue = () => {
    setLiveQueue([]);
    setBuzzedTeam(null);
    sendWs({ type: 'clear-queue' });
  };

  const handleSelectBuzzer = (teamIdx: number) => {
    setBuzzedTeam(teamIdx);
    sendWs({ type: 'select-buzzer', team: teamIdx });
  };

  const handleAwardScore = (teamIdx: number, points: number, reason?: string) => {
    sendWs({ type: 'award-score', team: teamIdx, points, reason });
    setTeams((prev) =>
      prev.map((t, i) => (i === teamIdx ? { ...t, score: t.score + points } : t))
    );
    if (points > 0) {
      triggerCelebration(
        `${teams[teamIdx].name} Scores!`,
        `+${points} points awarded`,
        '🏆',
        false
      );
      setBuzzedTeam(null);
    }
  };

  const handleMarkWrong = (teamIdx: number, penalty: number) => {
    triggerWrongFlash();
    sendWs({ type: 'mark-wrong', team: teamIdx, penalty });
    setLockedOutTeams((prev) => [...prev, teamIdx]);
    setTeams((prev) =>
      prev.map((t, i) => (i === teamIdx ? { ...t, score: t.score + penalty } : t))
    );
  };

  const handleAdjustScoreDirect = (teamIdx: number, delta: number) => {
    handleAwardScore(teamIdx, delta, delta > 0 ? `+${delta} adjustment` : `${delta} adjustment`);
  };

  const handleToggleIndividualLock = (teamIdx: number, locked: boolean) => {
    sendWs({
      type: 'update-team',
      team: teamIdx,
      individualLock: locked,
    });
    setTeams((prev) =>
      prev.map((t, i) => (i === teamIdx ? { ...t, individualLock: locked } : t))
    );
  };

  const handleToggleFinalist = (teamIdx: number) => {
    const nextVal = !teams[teamIdx].finalist;
    sendWs({
      type: 'update-team',
      team: teamIdx,
      finalist: nextVal,
    });
    setTeams((prev) =>
      prev.map((t, i) => (i === teamIdx ? { ...t, finalist: nextVal } : t))
    );
  };

  const handleRenameTeam = (teamIdx: number, newName: string) => {
    const trimmed = newName.trim() || `Team ${teamIdx + 1}`;
    sendWs({
      type: 'update-team',
      team: teamIdx,
      name: trimmed,
    });
    setTeams((prev) =>
      prev.map((t, i) => (i === teamIdx ? { ...t, name: trimmed } : t))
    );
  };

  const handleRingTest = (team?: number) => {
    sendWs({ type: 'ring-test', team });
  };

  const handleStepQuestion = (delta: number) => {
    const curCfg = rounds.find((r) => r.id === currentRoundId);
    if (!curCfg || !curCfg.data) return;
    const max = curCfg.data.length;
    let nextIdx = (qIndexMap[currentRoundId] || 0) + delta;
    if (nextIdx < 0) nextIdx = 0;
    if (nextIdx >= max) nextIdx = max - 1;

    setQIndexMap((prev) => ({ ...prev, [currentRoundId]: nextIdx }));
    setRevealed(false);
    setBuzzedTeam(null);
    setLockedOutTeams([]);
    setLiveQueue([]);
    setBuzzLocked(true);

    sendWs({
      type: 'set-question',
      roundId: currentRoundId,
      qIndex: nextIdx,
    });
  };

  const handleResetAll = () => {
    setConfirmModal({
      show: true,
      msg: 'Reset all scores, team names, and round progress? This cannot be undone.',
      onConfirm: () => {
        if (rfTimerRef.current) clearInterval(rfTimerRef.current);
        sendWs({ type: 'reset-all' });
        setTeams(
          Array.from({ length: 8 }, (_, i) => ({
            name: `Team ${i + 1}`,
            score: 0,
            finalist: false,
            individualLock: false,
          }))
        );
        setQIndexMap({ r1: 0, r2: 0, r3: 0, r4: 0, r5: 0, tb: 0 });
        setBuzzedTeam(null);
        setLockedOutTeams([]);
        setRevealed(false);
        setLiveQueue([]);
        setBuzzLocked(true);
        setConfirmModal((prev) => ({ ...prev, show: false }));
      },
    });
  };

  // Participant Buzz action
  const handleParticipantBuzz = () => {
    setHasBuzzed(true);
    sendWs({
      type: 'buzz',
      team: currentTeamIdx,
      clientTimestamp: Date.now(),
    });
  };

  // Rapid Fire Engine
  const drawRapidFireSet = () => {
    const pickRandom = (arr: any[], n: number) => {
      const copy = [...arr];
      const picked: any[] = [];
      while (picked.length < n && copy.length > 0) {
        const idx = Math.floor(Math.random() * copy.length);
        picked.push(copy.splice(idx, 1)[0]);
      }
      return picked;
    };

    const easy = pickRandom(R4_EASY, 2).map((q) => ({ q: q[0], a: q[1], tier: 'easy' as const }));
    const med = pickRandom(R4_MEDIUM, 2).map((q) => ({ q: q[0], a: q[1], tier: 'medium' as const }));
    const hard = pickRandom(R4_HARD, 1).map((q) => ({ q: q[0], a: q[1], tier: 'hard' as const }));

    const set = [...easy, ...med, ...hard];
    setRfSet(set);
    setRfResults(set.map(() => null));
    setRfTimeLeft(60);
    setRfRunning(false);
    if (rfTimerRef.current) clearInterval(rfTimerRef.current);
  };

  const startRapidFireTimer = () => {
    if (rfRunning) return;
    setRfTimeLeft(60);
    setRfRunning(true);

    rfTimerRef.current = setInterval(() => {
      setRfTimeLeft((prev) => {
        if (prev <= 6 && prev > 1) {
          sndTick(muted);
        }
        if (prev <= 1) {
          clearInterval(rfTimerRef.current);
          setRfRunning(false);
          sndTimeUp(muted);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const markRfItem = (idx: number, isCorrect: boolean) => {
    setRfResults((prev) => {
      const next = [...prev];
      next[idx] = isCorrect ? 'correct' : 'wrong';
      return next;
    });

    if (isCorrect) {
      handleAdjustScoreDirect(rfTeamIdx, 10);
      sndCorrect(muted);
    } else {
      triggerWrongFlash();
    }
  };

  // Local LLM Question additions
  const handleAddQuestionToRound = (qObj: any) => {
    setRounds((prev) =>
      prev.map((r) => {
        if (r.id === currentRoundId && r.data) {
          if (r.type === 'mcq-simul' || r.type === 'mcq-buzzer') {
            const formatted: [string, string[], number] = [
              qObj.question,
              qObj.options || ['Option A', 'Option B', 'Option C', 'Option D'],
              qObj.correctIndex || 0,
            ];
            return { ...r, data: [...r.data, formatted] };
          } else {
            const formatted: [string, string] = [qObj.question, qObj.answer];
            return { ...r, data: [...r.data, formatted] };
          }
        }
        return r;
      })
    );
  };

  const handleReplaceCurrentQuestion = (qObj: any) => {
    const curIdx = qIndexMap[currentRoundId] || 0;
    setRounds((prev) =>
      prev.map((r) => {
        if (r.id === currentRoundId && r.data) {
          const updated = [...r.data];
          if (r.type === 'mcq-simul' || r.type === 'mcq-buzzer') {
            updated[curIdx] = [
              qObj.question,
              qObj.options || ['Option A', 'Option B', 'Option C', 'Option D'],
              qObj.correctIndex || 0,
            ];
          } else {
            updated[curIdx] = [qObj.question, qObj.answer];
          }
          return { ...r, data: updated };
        }
        return r;
      })
    );
    setRevealed(false);
  };

  // If in Participant Buzzer view
  if (role === 'buzzer') {
    return (
      <ParticipantView
        ws={wsRef.current}
        teams={teams}
        buzzLocked={buzzLocked}
        liveQueue={liveQueue}
        currentTeamIdx={currentTeamIdx}
        onSwitchTeam={(newTeam) => {
          setCurrentTeamIdx(newTeam);
          sendWs({ type: 'join', role: 'buzzer', team: newTeam });
        }}
        muted={muted}
        onToggleMute={setMuted}
        onBuzz={handleParticipantBuzz}
        hasBuzzed={hasBuzzed}
        onReturnToHost={() => setRole('host')}
      />
    );
  }

  const currentCfg = rounds.find((r) => r.id === currentRoundId) || rounds[0];
  const curQIndex = qIndexMap[currentRoundId] || 0;
  const questionData = currentCfg.data ? currentCfg.data[curQIndex] : null;

  return (
    <>
      <canvas id="confetti-canvas" ref={canvasRef} />
      <div id="wrong-flash" style={{ display: showWrongFlash ? 'block' : 'none' }} />

      {/* Confirmation Modal */}
      {confirmModal.show && (
        <div className="modal-overlay">
          <div className="modal-box text-center">
            <p className="modal-msg">{confirmModal.msg}</p>
            <div className="flex gap-2.5 justify-center">
              <button onClick={confirmModal.onConfirm} className="btn bad">
                Yes, Reset
              </button>
              <button
                onClick={() => setConfirmModal((prev) => ({ ...prev, show: false }))}
                className="btn ghost"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Celebration Banner Overlay */}
      {celebrateData.show && (
        <div id="celebrate-overlay" style={{ display: 'flex' }}>
          <div className="banner">
            <div className="emoji">{celebrateData.emoji}</div>
            <div className="msg">{celebrateData.msg}</div>
            {celebrateData.sub && <div className="sub">{celebrateData.sub}</div>}
          </div>
        </div>
      )}

      {/* Connect & Link Laptops / Phones Modal */}
      <ConnectModal
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        teams={teams}
        connectedClients={clients}
      />

      <div className="wrap" id="hostRoot">
        {/* Top Master Console Header */}
        <header className="top">
          <div className="brand">
            <div className="logo">🏆</div>
            <div>
              <h1>TECHNO QUIZ</h1>
              <p>Master Console · Emerging Trends in Tech</p>
            </div>
          </div>

          <div className="top-actions">
            {/* Sound toggle */}
            <label className="sound-toggle cursor-pointer">
              <input
                type="checkbox"
                checked={!muted}
                onChange={(e) => setMuted(!e.target.checked)}
              />
              <span>{muted ? <VolumeX size={15} /> : <Volume2 size={15} />} Sound</span>
            </label>

            {/* Link phones & laptops via QR modal */}
            <button
              onClick={() => setShowConnectModal(true)}
              className="btn gold small"
              title="Show Phone QR codes for all teams"
            >
              <QrCode size={14} /> Phone QR Connect
            </button>

            {/* PWA Install Button (Standalone Desktop App) */}
            {isInstallable && (
              <button
                onClick={install}
                className="btn gold small"
                title="Install as standalone desktop window"
              >
                <Download size={14} /> Install Desktop App
              </button>
            )}

            {/* Switch to participant view test */}
            <button
              onClick={() => setRole('buzzer')}
              className="btn ghost small"
              title="Preview participant buzzer on this laptop"
            >
              <Laptop size={14} /> Buzzer Mode
            </button>

            {/* Declare Champion */}
            <button
              onClick={() => {
                const sorted = [...teams].sort((a, b) => b.score - a.score);
                const top = sorted[0];
                if (top) {
                  triggerCelebration(
                    `🏆 ${top.name} WINS! 🏆`,
                    `TECHNO QUIZ CHAMPION — ${top.score} points`,
                    '🏆',
                    true
                  );
                }
              }}
              className="btn gold small"
            >
              <Trophy size={14} /> Champion
            </button>

            {/* Reset All */}
            <button onClick={handleResetAll} className="btn ghost small">
              <RotateCcw size={14} /> Reset
            </button>
          </div>
        </header>

        {/* View Toggle */}
        <div className="view-toggle">
          <button
            onClick={() => setView('quiz')}
            className={`viewbtn ${view === 'quiz' ? 'active' : ''}`}
          >
            🎮 Run Quiz
          </button>
          <button
            onClick={() => setView('scoreboard')}
            className={`viewbtn ${view === 'scoreboard' ? 'active' : ''}`}
          >
            🏆 Scoreboard
          </button>
          <button
            onClick={() => setView('tracking')}
            className={`viewbtn ${view === 'tracking' ? 'active' : ''}`}
          >
            📊 Live Tracking & Status
          </button>
          <button
            onClick={() => setView('llm')}
            className={`viewbtn ${view === 'llm' ? 'active' : ''}`}
          >
            🤖 Local LLM Studio
          </button>
        </div>

        {/* VIEW 1: RUN QUIZ */}
        {view === 'quiz' && (
          <div id="quizView">
            {/* Round Tabs */}
            <nav className="rounds" id="roundNav">
              {rounds.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    setCurrentRoundId(r.id);
                    setBuzzedTeam(null);
                    setLockedOutTeams([]);
                    setRevealed(false);
                    setLiveQueue([]);
                    setBuzzLocked(true);
                    sendWs({
                      type: 'set-question',
                      roundId: r.id,
                      qIndex: qIndexMap[r.id] || 0,
                    });
                  }}
                  className={r.id === currentRoundId ? 'active' : ''}
                >
                  {r.label} · {r.tier}
                </button>
              ))}
            </nav>

            {/* Mini Score Strip */}
            <div className="mini-score" id="miniScore">
              {teams.map((t, idx) => (
                <div
                  key={idx}
                  onClick={() => setView('scoreboard')}
                  className={`mini-chip ${t.finalist ? 'finalist' : ''}`}
                >
                  <span>{t.name}</span>
                  <span className="sc">{t.score}</span>
                </div>
              ))}
            </div>

            {/* Stage depending on round type */}
            <div className="stage" id="stage">
              {/* Type 1: Simultaneous MCQ (Round 1) */}
              {currentCfg.type === 'mcq-simul' && questionData && (
                <div>
                  <div className="round-title">
                    {currentCfg.label}{' '}
                    <span className="qcount">
                      Q {curQIndex + 1} / {currentCfg.data?.length}
                    </span>
                  </div>
                  <div className="tierpill easy">EASY · Simultaneous — all teams answer</div>
                  <div className="qtext">{questionData[0]}</div>

                  <div className="options">
                    {questionData[1].map((opt: string, i: number) => (
                      <div
                        key={i}
                        className={`opt ${revealed && i === questionData[2] ? 'correct-reveal' : ''}`}
                      >
                        <span className="letter">{String.fromCharCode(65 + i)}</span>
                        <span>{opt}</span>
                      </div>
                    ))}
                  </div>

                  <div className="controls-row">
                    <button
                      onClick={() => {
                        setRevealed(true);
                        sndCorrect(muted);
                      }}
                      className="btn teal"
                    >
                      Reveal Correct Option
                    </button>
                    <div className="spacer" />
                    <button onClick={() => handleStepQuestion(-1)} className="btn ghost">
                      ← Prev
                    </button>
                    <button onClick={() => handleStepQuestion(1)} className="btn ghost">
                      Next →
                    </button>
                  </div>

                  <p className="text-[12.5px] text-[var(--muted)] mt-3">
                    After revealing, click a team's button below to award +{currentCfg.scoring.correct} to
                    every team that answered correctly.
                  </p>

                  <div className="buzzgrid">
                    {teams.map((t, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleAdjustScoreDirect(idx, currentCfg.scoring.correct)}
                        className="buzzbtn"
                      >
                        {t.name} ✓ +{currentCfg.scoring.correct}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Type 2: Open Buzzer Question (Round 2, 3, TB) */}
              {currentCfg.type === 'buzzer' && questionData && (
                <div>
                  <div className="round-title">
                    {currentCfg.label}{' '}
                    <span className="qcount">
                      Q {curQIndex + 1} / {currentCfg.data?.length}
                    </span>
                  </div>
                  <div
                    className={`tierpill ${
                      currentCfg.tier === 'Easy'
                        ? 'easy'
                        : currentCfg.tier === 'Medium'
                        ? 'medium'
                        : 'hard'
                    }`}
                  >
                    {currentCfg.tier.toUpperCase()} · Buzzer round
                  </div>
                  <div className="qtext">{questionData[0]}</div>

                  {/* Team Buzzer Selection Buttons */}
                  <div className="buzzgrid">
                    {teams.map((t, idx) => {
                      const isLocked = lockedOutTeams.includes(idx);
                      const isSelected = buzzedTeam === idx;
                      return (
                        <button
                          key={idx}
                          disabled={isLocked || (buzzedTeam !== null && buzzedTeam !== idx)}
                          onClick={() => {
                            setBuzzedTeam(idx);
                            sndBuzz(muted);
                            sendWs({ type: 'select-buzzer', team: idx });
                          }}
                          className={`buzzbtn ${isSelected ? 'active' : ''} ${
                            isLocked ? 'locked-out' : ''
                          }`}
                        >
                          {t.name}
                        </button>
                      );
                    })}
                  </div>

                  {/* Live Buzz Queue Panel */}
                  <div className="queue-panel">
                    <div className="qp-head">
                      <h4>📡 Live Buzz Queue — first to last</h4>
                      <span className={`lockbadge ${buzzLocked ? 'locked' : 'open'}`}>
                        {buzzLocked ? '🔒 LOCKED' : '🔓 OPEN'}
                      </span>
                    </div>

                    <div className="queue-list">
                      {liveQueue.length === 0 ? (
                        <div className="queue-empty">
                          No buzzes yet. Click "Unlock Buzzers", then teams on their own devices can
                          buzz in — they'll appear here in order with millisecond timing.
                        </div>
                      ) : (
                        liveQueue.map((item, idx) => (
                          <div
                            key={idx}
                            onClick={() => handleSelectBuzzer(item.team)}
                            className={`queue-row ${buzzedTeam === item.team ? 'selected' : ''}`}
                          >
                            <div className="qrank">{idx + 1}</div>
                            <div className="qname">{item.name}</div>
                            <div className="qtime">
                              {idx === 0 ? 'first' : `+${(item.deltaMs / 1000).toFixed(2)}s`}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Answer Box */}
                  <div className={`answer-box ${revealed ? 'show' : ''}`}>
                    <div className="lbl">Answer</div>
                    <div className="val">{questionData[1]}</div>
                  </div>

                  {/* Controls */}
                  <div className="controls-row">
                    <button
                      onClick={() => handleUnlockBuzzers(true)}
                      className="btn teal"
                    >
                      🔓 Unlock Buzzers
                    </button>
                    <button onClick={handleLockBuzzers} className="btn ghost">
                      🔒 Lock Buzzers
                    </button>

                    <button
                      disabled={buzzedTeam === null}
                      onClick={() => {
                        if (buzzedTeam !== null) {
                          setRevealed(true);
                          handleAwardScore(buzzedTeam, currentCfg.scoring.correct, 'Buzzer correct');
                        }
                      }}
                      className="btn good"
                    >
                      ✔ Correct (+{currentCfg.scoring.correct})
                    </button>

                    <button
                      disabled={buzzedTeam === null}
                      onClick={() => {
                        if (buzzedTeam !== null) {
                          handleMarkWrong(buzzedTeam, currentCfg.scoring.wrong);
                        }
                      }}
                      className="btn bad"
                    >
                      ✘ Wrong ({currentCfg.scoring.wrong})
                    </button>

                    <button
                      onClick={() => setRevealed(true)}
                      className="btn teal"
                    >
                      Reveal Answer
                    </button>

                    <div className="spacer" />
                    <button onClick={() => handleStepQuestion(-1)} className="btn ghost">
                      ← Prev
                    </button>
                    <button onClick={() => handleStepQuestion(1)} className="btn ghost">
                      Next →
                    </button>
                  </div>
                </div>
              )}

              {/* Type 3: Rapid Fire (Round 4) */}
              {currentCfg.type === 'rapidfire' && (
                <div>
                  <div className="round-title">{currentCfg.label}</div>
                  <div className="tierpill medium">MIXED · 60-second individual sprint</div>

                  <div className="rf-setup">
                    <label className="text-[13px] text-[var(--muted)] font-bold">Team on the mic:</label>
                    <select
                      value={rfTeamIdx}
                      onChange={(e) => setRfTeamIdx(parseInt(e.target.value, 10))}
                      className="teamsel"
                    >
                      {teams.map((t, idx) => (
                        <option key={idx} value={idx}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                    <button onClick={drawRapidFireSet} className="btn teal">
                      🎲 Draw Set (2 Easy + 2 Medium + 1 Hard)
                    </button>
                    <button
                      disabled={rfSet.length === 0 || rfRunning}
                      onClick={startRapidFireTimer}
                      className="btn gold"
                    >
                      ▶ Start 60s Timer
                    </button>
                  </div>

                  <div className="timerdisp">{rfTimeLeft}</div>
                  <div className="timerbar">
                    <div style={{ width: `${Math.max(0, (rfTimeLeft / 60) * 100)}%` }} />
                  </div>

                  <div className="rf-list">
                    {rfSet.length === 0 ? (
                      <p className="text-[var(--muted)] text-center py-4">
                        Click "Draw Set" to generate this team's 5 rapid-fire questions.
                      </p>
                    ) : (
                      rfSet.map((item, idx) => {
                        const res = rfResults[idx];
                        return (
                          <div
                            key={idx}
                            className={`rf-item ${
                              res === 'correct'
                                ? 'done-correct'
                                : res === 'wrong'
                                ? 'done-wrong'
                                : ''
                            }`}
                          >
                            <span className={`tierpill ${item.tier}`} style={{ margin: 0 }}>
                              {item.tier[0].toUpperCase()}
                            </span>
                            <span className="rq">
                              {item.q} <em className="text-[var(--muted)]">— {item.a}</em>
                            </span>
                            <button
                              onClick={() => markRfItem(idx, true)}
                              className="btn small good"
                            >
                              ✔
                            </button>
                            <button
                              onClick={() => markRfItem(idx, false)}
                              className="btn small bad"
                            >
                              ✘
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="rf-tally">
                    {rfSet.length > 0 && (
                      <span>
                        {rfResults.filter((r) => r === 'correct').length} correct out of{' '}
                        {rfResults.filter((r) => r !== null).length} answered (+
                        {rfResults.filter((r) => r === 'correct').length * 10} pts this sprint)
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Type 4: Grand Finale Buzzer MCQ (Round 5) */}
              {currentCfg.type === 'mcq-buzzer' && questionData && (
                <div>
                  <div className="round-title">
                    {currentCfg.label}{' '}
                    <span className="qcount">
                      Q {curQIndex + 1} / {currentCfg.data?.length}
                    </span>
                  </div>
                  <div className="tierpill hard">HARD · Buzzer — finalists only</div>
                  <div className="qtext">{questionData[0]}</div>

                  <div className="options">
                    {questionData[1].map((opt: string, i: number) => (
                      <div
                        key={i}
                        className={`opt ${revealed && i === questionData[2] ? 'correct-reveal' : ''}`}
                      >
                        <span className="letter">{String.fromCharCode(65 + i)}</span>
                        <span>{opt}</span>
                      </div>
                    ))}
                  </div>

                  {/* Buzzer Buttons (Finalists only) */}
                  <div className="buzzgrid">
                    {teams.map((t, idx) => {
                      const eligible = t.finalist;
                      const isLocked = lockedOutTeams.includes(idx);
                      const isSelected = buzzedTeam === idx;
                      return (
                        <button
                          key={idx}
                          disabled={!eligible || isLocked || (buzzedTeam !== null && buzzedTeam !== idx)}
                          onClick={() => {
                            setBuzzedTeam(idx);
                            sndBuzz(muted);
                            sendWs({ type: 'select-buzzer', team: idx });
                          }}
                          className={`buzzbtn ${isSelected ? 'active' : ''} ${
                            isLocked ? 'locked-out' : ''
                          }`}
                        >
                          {t.name} {!eligible && '(Not Finalist)'}
                        </button>
                      );
                    })}
                  </div>

                  {/* Live Buzz Queue */}
                  <div className="queue-panel">
                    <div className="qp-head">
                      <h4>📡 Live Buzz Queue (Finalists)</h4>
                      <span className={`lockbadge ${buzzLocked ? 'locked' : 'open'}`}>
                        {buzzLocked ? '🔒 LOCKED' : '🔓 OPEN'}
                      </span>
                    </div>

                    <div className="queue-list">
                      {liveQueue.length === 0 ? (
                        <div className="queue-empty">
                          No buzzes yet. Unlock buzzers to accept responses from finalists.
                        </div>
                      ) : (
                        liveQueue.map((item, idx) => (
                          <div
                            key={idx}
                            onClick={() => handleSelectBuzzer(item.team)}
                            className={`queue-row ${buzzedTeam === item.team ? 'selected' : ''}`}
                          >
                            <div className="qrank">{idx + 1}</div>
                            <div className="qname">{item.name}</div>
                            <div className="qtime">
                              {idx === 0 ? 'first' : `+${(item.deltaMs / 1000).toFixed(2)}s`}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="controls-row">
                    <button
                      onClick={() => handleUnlockBuzzers(true)}
                      className="btn teal"
                    >
                      🔓 Unlock Buzzers
                    </button>
                    <button onClick={handleLockBuzzers} className="btn ghost">
                      🔒 Lock Buzzers
                    </button>

                    <button
                      disabled={buzzedTeam === null}
                      onClick={() => {
                        if (buzzedTeam !== null) {
                          setRevealed(true);
                          handleAwardScore(buzzedTeam, currentCfg.scoring.correct, 'Finale correct');
                        }
                      }}
                      className="btn good"
                    >
                      ✔ Correct (+{currentCfg.scoring.correct})
                    </button>

                    <button
                      disabled={buzzedTeam === null}
                      onClick={() => {
                        if (buzzedTeam !== null) {
                          handleMarkWrong(buzzedTeam, currentCfg.scoring.wrong);
                        }
                      }}
                      className="btn bad"
                    >
                      ✘ Wrong ({currentCfg.scoring.wrong})
                    </button>

                    <button
                      onClick={() => {
                        setRevealed(true);
                        sndCorrect(muted);
                      }}
                      className="btn teal"
                    >
                      Reveal Answer
                    </button>

                    <div className="spacer" />
                    <button onClick={() => handleStepQuestion(-1)} className="btn ghost">
                      ← Prev
                    </button>
                    <button onClick={() => handleStepQuestion(1)} className="btn ghost">
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </div>

            <footer className="hint" id="hintFooter">
              Tap a mini score chip or open "Live Tracking & Status" to manage connected laptops,
              audit buzz timing, and declare Grand-Finale finalists.
            </footer>
          </div>
        )}

        {/* VIEW 2: FULL SCOREBOARD */}
        {view === 'scoreboard' && (
          <div id="scoreView">
            <div className="board-big" id="boardBig">
              {teams
                .map((t, idx) => ({ ...t, idx }))
                .sort((a, b) => b.score - a.score)
                .map((team, rankPos) => {
                  const medals = ['🥇', '🥈', '🥉'];
                  return (
                    <div
                      key={team.idx}
                      className={`board-row ${team.finalist ? 'finalist' : ''}`}
                    >
                      <div className={`rank ${rankPos < 3 ? 'medal' : ''}`}>
                        {rankPos < 3 ? medals[rankPos] : rankPos + 1}
                      </div>

                      <button
                        onClick={() => handleToggleFinalist(team.idx)}
                        className={`star-btn ${team.finalist ? 'on' : ''}`}
                        title="Mark as Grand Finale finalist"
                        style={{ position: 'static', fontSize: '18px' }}
                      >
                        ★
                      </button>

                      <input
                        className="bname"
                        value={team.name}
                        onChange={(e) => handleRenameTeam(team.idx, e.target.value)}
                      />

                      <div className="badj">
                        <button
                          onClick={() => handleAdjustScoreDirect(team.idx, -10)}
                          className="btn small bad"
                        >
                          -10
                        </button>
                        <button
                          onClick={() => handleAdjustScoreDirect(team.idx, -5)}
                          className="btn small bad"
                        >
                          -5
                        </button>
                        <button
                          onClick={() => handleAdjustScoreDirect(team.idx, 5)}
                          className="btn small good"
                        >
                          +5
                        </button>
                        <button
                          onClick={() => handleAdjustScoreDirect(team.idx, 10)}
                          className="btn small good"
                        >
                          +10
                        </button>
                      </div>

                      <div className="bscore">{team.score}</div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* VIEW 3: REAL-TIME TRACKING TABLE & STATUS MANAGEMENT */}
        {view === 'tracking' && (
          <TrackingTable
            teams={teams}
            clients={clients}
            liveQueue={liveQueue}
            buzzLocked={buzzLocked}
            buzzedTeam={buzzedTeam}
            lockedOutTeams={lockedOutTeams}
            recentLogs={recentLogs}
            onUnlockAll={() => handleUnlockBuzzers(false)}
            onLockAll={handleLockBuzzers}
            onClearQueue={handleClearQueue}
            onRingTest={handleRingTest}
            onAdjustScore={handleAdjustScoreDirect}
            onToggleIndividualLock={handleToggleIndividualLock}
            onToggleFinalist={handleToggleFinalist}
            onSelectBuzzer={handleSelectBuzzer}
            onOpenQr={() => setShowConnectModal(true)}
          />
        )}

        {/* VIEW 4: LOCAL LLM STUDIO */}
        {view === 'llm' && (
          <LocalLLMStudio
            onAddQuestionToRound={handleAddQuestionToRound}
            onReplaceCurrentQuestion={handleReplaceCurrentQuestion}
            currentQuestionText={questionData ? questionData[0] : ''}
          />
        )}
      </div>
    </>
  );
}
