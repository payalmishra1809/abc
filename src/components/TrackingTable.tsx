import React from 'react';
import { Volume2, Lock, Unlock, ShieldAlert, CheckCircle2, RotateCcw, Download, QrCode } from 'lucide-react';

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

interface TrackingTableProps {
  teams: Team[];
  clients: ConnectedClient[];
  liveQueue: BuzzEntry[];
  buzzLocked: boolean;
  buzzedTeam: number | null;
  lockedOutTeams: number[];
  recentLogs: EventLogItem[];
  onUnlockAll: () => void;
  onLockAll: () => void;
  onClearQueue: () => void;
  onRingTest: (team?: number) => void;
  onAdjustScore: (team: number, delta: number) => void;
  onToggleIndividualLock: (team: number, currentLocked: boolean) => void;
  onToggleFinalist: (team: number) => void;
  onSelectBuzzer: (team: number) => void;
  onOpenQr?: (team?: number) => void;
}

export const TrackingTable: React.FC<TrackingTableProps> = ({
  teams,
  clients,
  liveQueue,
  buzzLocked,
  buzzedTeam,
  lockedOutTeams,
  recentLogs,
  onUnlockAll,
  onLockAll,
  onClearQueue,
  onRingTest,
  onAdjustScore,
  onToggleIndividualLock,
  onToggleFinalist,
  onSelectBuzzer,
  onOpenQr,
}) => {
  // Map connected devices by team index
  const teamClientsMap = new Map<number, ConnectedClient[]>();
  clients.forEach((c) => {
    if (c.role === 'buzzer') {
      const list = teamClientsMap.get(c.team) || [];
      list.push(c);
      teamClientsMap.set(c.team, list);
    }
  });

  const exportGameStatus = () => {
    const data = {
      exportTimestamp: new Date().toISOString(),
      teams: teams.map((t, i) => ({
        index: i + 1,
        name: t.name,
        score: t.score,
        finalist: t.finalist,
        connectedDevices: (teamClientsMap.get(i) || []).map((c) => ({ ip: c.ip, latencyMs: c.latencyMs })),
      })),
      recentLogs: recentLogs.slice(0, 50),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `techno-quiz-status-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Top Status Bar & Global Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-[var(--shadow)]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-extrabold tracking-wider text-[var(--teal)]">Buzzer Master:</span>
            <span className={`lockbadge ${buzzLocked ? 'locked' : 'open'}`}>
              {buzzLocked ? '🔒 ALL LOCKED' : '🔓 LIVE & OPEN'}
            </span>
          </div>
          <div className="h-4 w-[1px] bg-[var(--border)]" />
          <div className="text-xs text-[var(--muted)] font-semibold">
            Connected Devices: <b className="text-[var(--text)]">{clients.filter((c) => c.role === 'buzzer').length}</b> laptops/phones
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenQr && (
            <button onClick={() => onOpenQr()} className="btn gold small" title="Show Phone QR codes">
              <QrCode size={14} /> Phone QR Connect
            </button>
          )}
          {buzzLocked ? (
            <button onClick={onUnlockAll} className="btn teal small">
              <Unlock size={14} /> Unlock All Buzzers
            </button>
          ) : (
            <button onClick={onLockAll} className="btn bad small">
              <Lock size={14} /> Lock All Buzzers
            </button>
          )}
          <button onClick={onClearQueue} className="btn ghost small" title="Clear current buzzer queue">
            <RotateCcw size={14} /> Clear Queue
          </button>
          <button onClick={() => onRingTest()} className="btn ghost small" title="Test audio ping on all connected laptops">
            <Volume2 size={14} /> Ring Test All
          </button>
          <button onClick={exportGameStatus} className="btn ghost small" title="Export game snapshot">
            <Download size={14} /> Export JSON
          </button>
        </div>
      </div>

      {/* Real-Time Game Tracking & Status Management Table */}
      <div className="tracking-table-wrap">
        <table className="tracking-table">
          <thead>
            <tr>
              <th style={{ width: '48px' }}>#</th>
              <th>Team Name</th>
              <th>Device Connection</th>
              <th>Buzzer State</th>
              <th>Timing & Queue</th>
              <th style={{ textAlign: 'right' }}>Score</th>
              <th style={{ textAlign: 'center' }}>Management Actions</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team, idx) => {
              const connectedDevs = teamClientsMap.get(idx) || [];
              const isOnline = connectedDevs.length > 0;
              const isBuzzedActive = buzzedTeam === idx;
              const queueIndex = liveQueue.findIndex((q) => q.team === idx);
              const queueEntry = queueIndex !== -1 ? liveQueue[queueIndex] : null;
              const isLockedOut = lockedOutTeams.includes(idx);
              const isIndividuallyLocked = team.individualLock;

              return (
                <tr key={idx} className={isBuzzedActive ? 'buzzed-row' : ''}>
                  {/* Team Index & Star */}
                  <td className="font-bold text-[var(--muted)]">
                    <button
                      onClick={() => onToggleFinalist(idx)}
                      className={`star-btn ${team.finalist ? 'on' : ''}`}
                      title={team.finalist ? 'Finalist' : 'Mark as Finalist'}
                    >
                      ★
                    </button>
                    {idx + 1}
                  </td>

                  {/* Team Name */}
                  <td className="font-bold text-[var(--text)]">
                    <div className="flex items-center gap-2">
                      <span>{team.name}</span>
                      {team.finalist && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--gold)] text-black font-extrabold">
                          FINALIST
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Device Connection Status */}
                  <td>
                    {isOnline ? (
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center">
                          <span className="status-dot online" />
                          <span className="text-xs font-bold text-emerald-400">
                            ONLINE ({connectedDevs.length} {connectedDevs.length > 1 ? 'devices' : 'device'})
                          </span>
                        </div>
                        <div className="text-[11px] text-[var(--muted)]">
                          IP: {connectedDevs[0].ip} · {connectedDevs[0].latencyMs}ms ping
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <span className="status-dot offline" />
                        <span className="text-xs font-semibold text-[var(--muted)]">Offline / No laptop linked</span>
                      </div>
                    )}
                  </td>

                  {/* Buzzer State */}
                  <td>
                    {isBuzzedActive ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-teal-900/60 text-teal-200 border border-teal-500">
                        ⚡ BUZZED (1st - Active)
                      </span>
                    ) : queueEntry ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-900/40 text-amber-200 border border-amber-500/50">
                        🔔 #{queueIndex + 1} in line
                      </span>
                    ) : isLockedOut ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-950/50 text-red-300 border border-red-800">
                        ⛔ Locked Out (Wrong)
                      </span>
                    ) : isIndividuallyLocked ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-800 text-gray-400 border border-gray-700">
                        🔒 Muted / Locked
                      </span>
                    ) : buzzLocked ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-900 text-[var(--muted)] border border-[var(--border)]">
                        🔒 Locked (Host)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-950/40 text-emerald-300 border border-emerald-800/60">
                        🔓 Ready & Armed
                      </span>
                    )}
                  </td>

                  {/* Timing & Queue */}
                  <td>
                    {queueEntry ? (
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-[var(--gold-2)]">
                          {queueIndex === 0 ? 'First to buzz!' : `+${(queueEntry.deltaMs / 1000).toFixed(3)}s`}
                        </span>
                        <span className="text-[10px] text-[var(--muted)]">
                          exact: {new Date(queueEntry.at).toISOString().substring(17, 23)}s
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-[var(--muted)]">—</span>
                    )}
                  </td>

                  {/* Score */}
                  <td style={{ textAlign: 'right' }}>
                    <span className="text-lg font-black text-[var(--gold-2)]">{team.score}</span>
                  </td>

                  {/* Management Actions */}
                  <td>
                    <div className="flex items-center justify-center gap-1.5 flex-wrap">
                      {/* Micro score adjustments */}
                      <button
                        onClick={() => onAdjustScore(idx, 10)}
                        className="btn small good"
                        style={{ padding: '4px 7px', fontSize: '11px' }}
                        title="Add 10 points"
                      >
                        +10
                      </button>
                      <button
                        onClick={() => onAdjustScore(idx, -5)}
                        className="btn small bad"
                        style={{ padding: '4px 7px', fontSize: '11px' }}
                        title="Subtract 5 points"
                      >
                        -5
                      </button>

                      {/* Select this team for active answer */}
                      {queueEntry && !isBuzzedActive && (
                        <button
                          onClick={() => onSelectBuzzer(idx)}
                          className="btn small teal"
                          style={{ padding: '4px 8px', fontSize: '11px' }}
                          title="Give floor to this team"
                        >
                          Floor
                        </button>
                      )}

                      {/* Lock / Unlock individual team */}
                      <button
                        onClick={() => onToggleIndividualLock(idx, !isIndividuallyLocked)}
                        className={`btn small ${isIndividuallyLocked ? 'good' : 'ghost'}`}
                        style={{ padding: '4px 7px', fontSize: '11px' }}
                        title={isIndividuallyLocked ? 'Unlock team buzzer' : 'Lock individual team buzzer'}
                      >
                        {isIndividuallyLocked ? <Unlock size={12} /> : <Lock size={12} />}
                      </button>

                      {/* Ring test to laptop */}
                      <button
                        onClick={() => onRingTest(idx)}
                        className="btn small ghost"
                        style={{ padding: '4px 7px', fontSize: '11px' }}
                        title="Ring test this laptop"
                      >
                        <Volume2 size={12} />
                      </button>

                      {/* Phone QR button for this team */}
                      {onOpenQr && (
                        <button
                          onClick={() => onOpenQr(idx)}
                          className="btn small gold"
                          style={{ padding: '4px 7px', fontSize: '11px' }}
                          title={`Show phone QR code for ${team.name}`}
                        >
                          <QrCode size={12} /> QR
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Real-Time Live Event Audit Log */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs uppercase font-extrabold tracking-wider text-[var(--teal)]">
            📋 Live Event Audit Log (Real-Time Synchronized Stream)
          </h4>
          <span className="text-[11px] text-[var(--muted)]">Logged with millisecond timestamps</span>
        </div>

        <div className="audit-log-wrap">
          {recentLogs.length === 0 ? (
            <div className="text-center py-6 text-[var(--muted)]">
              No game events yet. Start the quiz, buzz in, or award scores to see real-time audit logs.
            </div>
          ) : (
            recentLogs.map((log) => (
              <div key={log.id} className="audit-entry">
                <span className="audit-time">[{log.timeFormatted}]</span>
                <span className="audit-msg">{log.message}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
