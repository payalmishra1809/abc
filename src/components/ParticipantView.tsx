import React, { useState, useEffect } from 'react';
import { sndBuzz, sndRingTest } from '../sound';

interface ParticipantViewProps {
  ws: WebSocket | null;
  teams: { name: string; score: number }[];
  buzzLocked: boolean;
  liveQueue: { team: number; name: string; at: number; deltaMs: number }[];
  currentTeamIdx: number;
  onSwitchTeam: (newTeam: number) => void;
  muted: boolean;
  onToggleMute: (muted: boolean) => void;
  onBuzz: () => void;
  hasBuzzed: boolean;
  onReturnToHost: () => void;
}

export const ParticipantView: React.FC<ParticipantViewProps> = ({
  ws,
  teams,
  buzzLocked,
  liveQueue,
  currentTeamIdx,
  onSwitchTeam,
  muted,
  onToggleMute,
  onBuzz,
  hasBuzzed,
  onReturnToHost,
}) => {
  const currentTeam = teams[currentTeamIdx] || { name: `Team ${currentTeamIdx + 1}`, score: 0 };
  const isConnected = ws && ws.readyState === WebSocket.OPEN;

  const handlePress = () => {
    if (buzzLocked || hasBuzzed) return;
    sndBuzz(muted);
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }
    onBuzz();
  };

  const handleSwitch = () => {
    const val = prompt(`Enter your team number (1-${teams.length}):`, String(currentTeamIdx + 1));
    if (val === null) return;
    const n = parseInt(val, 10);
    if (!isNaN(n) && n >= 1 && n <= teams.length) {
      onSwitchTeam(n - 1);
    }
  };

  return (
    <div id="participantRoot" style={{ display: 'block' }}>
      {/* Header */}
      <div className="p-header">
        <h1>🏆 TECHNO QUIZ — Live Buzzer</h1>
        <div className="flex items-center gap-2">
          <label className="sound-toggle text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={!muted}
              onChange={(e) => onToggleMute(!e.target.checked)}
            />
            <span>🔊 Sound</span>
          </label>
          <button onClick={onReturnToHost} className="btn ghost small text-[11px] py-1 px-2" title="Switch to Host Console">
            Host View
          </button>
        </div>
      </div>

      {/* Team Card */}
      <div className="p-teamcard">
        <div className="pt-left">
          <div className="pnum">#{currentTeamIdx + 1}</div>
          <div>
            <div className="ptname">{currentTeam.name}</div>
            <div className="ptpoints">
              Points: <b>{currentTeam.score}</b>
            </div>
          </div>
        </div>
        <button onClick={handleSwitch} className="btn ghost small">
          Switch Team
        </button>
      </div>

      {/* Connection & Lock Status */}
      <div className="p-status-row">
        <span className={`p-conn ${isConnected ? 'live' : 'off'}`}>
          {isConnected ? '📡 Live Connected' : '📡 Connecting...'}
        </span>
        <span className={`lockbadge ${buzzLocked ? 'locked' : 'open'}`}>
          {buzzLocked ? '🔒 BUZZER LOCKED' : '🔓 OPEN'}
        </span>
      </div>

      {/* Big Circular Buzzer */}
      <div className="p-stage">
        <div
          onClick={handlePress}
          className={`p-buzzcircle ${
            buzzLocked ? '' : hasBuzzed ? 'pressed' : 'unlocked'
          }`}
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

      {/* Info & Order List */}
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
    </div>
  );
};
