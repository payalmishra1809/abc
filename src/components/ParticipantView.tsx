import React, { useState } from 'react';
import { sndBuzz } from '../sound';
import { Edit3, Check, X, Shield, Volume2, VolumeX, Smartphone, Users } from 'lucide-react';

interface ParticipantViewProps {
  ws: WebSocket | null;
  teams: { name: string; score: number }[];
  buzzLocked: boolean;
  liveQueue: { team: number; name: string; at: number; deltaMs: number }[];
  currentTeamIdx: number;
  onSwitchTeam: (newTeam: number) => void;
  onRenameTeam: (teamIdx: number, newName: string) => void;
  muted: boolean;
  onToggleMute: (muted: boolean) => void;
  onBuzz: () => void;
  hasBuzzed: boolean;
}

export const ParticipantView: React.FC<ParticipantViewProps> = ({
  ws,
  teams,
  buzzLocked,
  liveQueue,
  currentTeamIdx,
  onSwitchTeam,
  onRenameTeam,
  muted,
  onToggleMute,
  onBuzz,
  hasBuzzed,
}) => {
  const currentTeam = teams[currentTeamIdx] || { name: `Team ${currentTeamIdx + 1}`, score: 0 };
  const isConnected = ws && ws.readyState === WebSocket.OPEN;

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(currentTeam.name);

  // Sync editedName when team updates from server
  React.useEffect(() => {
    if (!isEditingName) {
      setEditedName(currentTeam.name);
    }
  }, [currentTeam.name, isEditingName]);

  const handlePress = () => {
    if (buzzLocked || hasBuzzed) return;
    sndBuzz(muted);
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }
    onBuzz();
  };

  const handleSaveName = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = editedName.trim();
    if (trimmed && trimmed !== currentTeam.name) {
      onRenameTeam(currentTeamIdx, trimmed);
    }
    setIsEditingName(false);
  };

  const handleCancelName = () => {
    setEditedName(currentTeam.name);
    setIsEditingName(false);
  };

  return (
    <div id="participantRoot" style={{ display: 'block', maxWidth: '640px', margin: '0 auto', minHeight: '100vh', padding: '16px 14px' }}>
      {/* Top Header - Fair play locked: No host link/view */}
      <div className="p-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '24px' }}>🏆</span>
          <div>
            <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text)' }}>
              TECHNO QUIZ
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--muted)' }}>
              <Shield size={12} className="text-emerald-400" />
              <span>Participant Buzzer Mode</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => onToggleMute(!muted)}
            className="btn ghost small"
            style={{ padding: '6px 10px', fontSize: '12px' }}
            title={muted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            <span>{muted ? 'Muted' : 'Sound'}</span>
          </button>
        </div>
      </div>

      {/* Team Card & Selector */}
      <div className="p-teamcard" style={{ marginBottom: '14px' }}>
        <div className="pt-left" style={{ flex: 1, minWidth: 0 }}>
          <div className="pnum" title={`Team #${currentTeamIdx + 1}`}>
            #{currentTeamIdx + 1}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {isEditingName ? (
              <form onSubmit={handleSaveName} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                <input
                  type="text"
                  value={editedName}
                  maxLength={30}
                  autoFocus
                  onChange={(e) => setEditedName(e.target.value)}
                  placeholder="Enter team name..."
                  className="bg-[var(--card-2)] text-[var(--text)] border border-[var(--gold)] rounded-lg px-2.5 py-1 text-sm font-bold w-full outline-none"
                />
                <button type="submit" className="btn small gold" style={{ padding: '6px 8px' }} title="Save team name">
                  <Check size={14} />
                </button>
                <button type="button" onClick={handleCancelName} className="btn small ghost" style={{ padding: '6px 8px' }} title="Cancel">
                  <X size={14} />
                </button>
              </form>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="ptname" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {currentTeam.name}
                </div>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="text-xs text-[var(--gold-2)] hover:underline inline-flex items-center gap-1 font-bold cursor-pointer"
                  title="Rename your team"
                >
                  <Edit3 size={13} />
                  <span>Rename</span>
                </button>
              </div>
            )}
            <div className="ptpoints">
              Points: <b>{currentTeam.score}</b>
            </div>
          </div>
        </div>

        {/* Team switch dropdown button */}
        {!isEditingName && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label htmlFor="team-select" className="sr-only">Switch Team</label>
            <select
              id="team-select"
              value={currentTeamIdx}
              onChange={(e) => {
                const nextIdx = parseInt(e.target.value, 10);
                if (!isNaN(nextIdx)) onSwitchTeam(nextIdx);
              }}
              className="bg-[var(--card)] text-[var(--gold-2)] border border-[var(--border)] rounded-lg px-2 py-1.5 text-xs font-bold cursor-pointer outline-none"
              title="Switch assigned team"
            >
              {teams.map((t, idx) => (
                <option key={idx} value={idx} className="bg-[var(--card-2)] text-[var(--text)]">
                  #{idx + 1}: {t.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Connection & Lock Status */}
      <div className="p-status-row" style={{ marginBottom: '16px' }}>
        <span className={`p-conn ${isConnected ? 'live' : 'off'}`}>
          {isConnected ? '📡 Live Connected' : '📡 Connecting to host...'}
        </span>
        <span className={`lockbadge ${buzzLocked ? 'locked' : 'open'}`}>
          {buzzLocked ? '🔒 BUZZER LOCKED' : '🔓 OPEN — BUZZ NOW!'}
        </span>
      </div>

      {/* Big Circular Buzzer */}
      <div className="p-stage" style={{ marginBottom: '18px' }}>
        <div
          onClick={handlePress}
          className={`p-buzzcircle ${
            buzzLocked ? '' : hasBuzzed ? 'pressed' : 'unlocked'
          }`}
          style={{ cursor: buzzLocked || hasBuzzed ? 'not-allowed' : 'pointer' }}
        >
          <div className="picon">{buzzLocked ? '🔒' : hasBuzzed ? '⚡' : '🔔'}</div>
          <div className="plabel">
            {buzzLocked ? 'BUZZER LOCKED' : hasBuzzed ? 'BUZZED IN!' : 'BUZZ IN!'}
          </div>
          <div className="psub">
            {buzzLocked
              ? 'Waiting for Host...'
              : hasBuzzed
              ? 'Waiting for host...'
              : 'Tap the circle now!'}
          </div>
        </div>
      </div>

      {/* Info & Live Queue Status */}
      <div className="p-info-box">
        <div className="pib-title">
          {buzzLocked
            ? 'Host is reading the question'
            : hasBuzzed
            ? 'You buzzed!'
            : 'Buzzer is OPEN'}
        </div>
        <div className="pib-sub">
          {buzzLocked
            ? 'Buzzer unlocks as soon as the host activates it. Keep your finger ready!'
            : hasBuzzed
            ? 'Sit tight — the host is reviewing the buzzer queue.'
            : 'First to tap wins the buzz — go!'}
        </div>

        {liveQueue.length > 0 && (
          <div className="p-order-list">
            {liveQueue.map((q, i) => {
              const isMe = q.team === currentTeamIdx;
              return (
                <div key={i} className={`p-order-row ${isMe ? 'me' : ''}`}>
                  <span className="porank">{i + 1}</span>
                  <span>
                    {q.name} {isMe ? '(You)' : ''}
                  </span>
                  <span className="ml-auto text-xs text-[var(--muted)]">
                    {i === 0 ? 'First' : `+${(q.deltaMs / 1000).toFixed(2)}s`}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Subtle footer */}
      <div className="text-center text-[11px] text-[var(--muted)] mt-5">
        TECHNO QUIZ · Official Participant Buzzer
      </div>
    </div>
  );
};
