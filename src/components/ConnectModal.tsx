import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { QrCode, Copy, Check, X, Smartphone, ExternalLink, RefreshCw, Sparkles, Monitor, Users } from 'lucide-react';

interface Team {
  name: string;
  score?: number;
}

interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  teams: Team[];
  connectedClients?: { team: number; role: string; ip: string; latencyMs: number }[];
}

export const ConnectModal: React.FC<ConnectModalProps> = ({ isOpen, onClose, teams, connectedClients = [] }) => {
  const [networkInfo, setNetworkInfo] = useState<{ ips: string[]; port: number; localUrl: string } | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<number>(0);
  const [qrCodeDataUrls, setQrCodeDataUrls] = useState<Record<number, string>>({});
  const [generalQr, setGeneralQr] = useState<string>('');
  const [viewMode, setViewMode] = useState<'individual' | 'all_grid'>('individual');
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [customHost, setCustomHost] = useState<string>('');
  const [isEditingHost, setIsEditingHost] = useState<boolean>(false);

  // Compute active base URL
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  
  // Choose best base host URL: custom override -> network IP (if on LAN) -> current window.location.origin
  const detectedLanIp = networkInfo?.ips?.[0];
  const defaultBaseUrl = customHost.trim()
    ? customHost.trim().replace(/\/+$/, '')
    : (detectedLanIp && window.location.hostname === 'localhost'
        ? `http://${detectedLanIp}:${networkInfo?.port || 3000}`
        : currentOrigin);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/network-info')
        .then((res) => res.json())
        .then((data) => {
          setNetworkInfo(data);
          // If on localhost and have a LAN IP, default custom host to it
          if (data.ips && data.ips.length > 0 && window.location.hostname === 'localhost') {
            setCustomHost(`http://${data.ips[0]}:${data.port || 3000}`);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  // Generate QR codes whenever defaultBaseUrl or teams change
  useEffect(() => {
    if (!isOpen) return;

    // 1. General scan QR (lets participant pick their team)
    const generalUrl = `${defaultBaseUrl}/?role=buzzer`;
    QRCode.toDataURL(generalUrl, {
      width: 280,
      margin: 2,
      color: {
        dark: '#040d1a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    }).then(setGeneralQr).catch(() => {});

    // 2. Individual team QR codes (direct one-touch connect into that team)
    const promises = teams.map((_, idx) => {
      const teamUrl = `${defaultBaseUrl}/?role=buzzer&team=${idx}`;
      return QRCode.toDataURL(teamUrl, {
        width: 280,
        margin: 2,
        color: {
          dark: '#040d1a',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'M',
      }).then((url) => ({ idx, url }));
    });

    Promise.all(promises).then((results) => {
      const map: Record<number, string> = {};
      results.forEach((r) => {
        map[r.idx] = r.url;
      });
      setQrCodeDataUrls(map);
    }).catch(() => {});
  }, [isOpen, defaultBaseUrl, teams]);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(key);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const getTeamUrl = (idx: number) => `${defaultBaseUrl}/?role=buzzer&team=${idx}`;
  const isTeamOnline = (idx: number) => connectedClients.some((c) => c.role === 'buzzer' && c.team === idx);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box"
        style={{ maxWidth: viewMode === 'all_grid' ? '920px' : '680px', maxHeight: '92vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--gold)] to-[var(--gold-2)] flex items-center justify-center text-black font-extrabold shadow-md">
              <QrCode size={20} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[var(--text)] m-0 leading-tight">
                Phone Buzzer QR Connect
              </h3>
              <p className="text-[11px] text-[var(--muted)] m-0">
                Scan with any phone camera (iPhone / Android) — instant connect with zero app download!
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn ghost small" style={{ padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        {/* View Mode Switcher & URL banner */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-[var(--card-2)] border border-[var(--border)] mb-4">
          <div className="flex items-center gap-1.5 flex-1 min-w-[240px]">
            <Smartphone size={16} className="text-[var(--teal)] flex-shrink-0" />
            <div className="text-xs truncate">
              <span className="text-[var(--muted)]">Target URL: </span>
              <strong className="text-[var(--gold-2)]">{defaultBaseUrl}</strong>
            </div>
            <button
              onClick={() => setIsEditingHost(!isEditingHost)}
              className="text-[10px] text-[var(--teal)] hover:underline ml-1 font-bold"
            >
              {isEditingHost ? 'Close' : 'Change IP/URL'}
            </button>
          </div>

          <div className="flex items-center gap-1 bg-[var(--navy)] p-1 rounded-lg border border-[var(--border)]">
            <button
              onClick={() => setViewMode('individual')}
              className={`btn small ${viewMode === 'individual' ? 'teal' : 'ghost'}`}
              style={{ padding: '4px 10px', fontSize: '11px' }}
            >
              <Smartphone size={13} /> Team Focus
            </button>
            <button
              onClick={() => setViewMode('all_grid')}
              className={`btn small ${viewMode === 'all_grid' ? 'teal' : 'ghost'}`}
              style={{ padding: '4px 10px', fontSize: '11px' }}
            >
              <Users size={13} /> Show All 8 QRs
            </button>
          </div>
        </div>

        {/* Optional Custom IP/Host Input */}
        {isEditingHost && (
          <div className="p-3 rounded-xl bg-[var(--navy)]/80 border border-[var(--teal)] mb-4">
            <div className="text-xs font-bold text-[var(--text)] mb-1">
              Custom LAN IP or Deployed Public URL:
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={customHost}
                onChange={(e) => setCustomHost(e.target.value)}
                placeholder="e.g. http://192.168.1.100:3000 or https://your-quiz.onrender.com"
                className="flex-1 bg-[var(--card)] text-[var(--text)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-xs font-mono"
              />
              <button
                onClick={() => setIsEditingHost(false)}
                className="btn teal small"
              >
                Apply
              </button>
            </div>
            <p className="text-[10px] text-[var(--muted)] mt-1">
              If phones are connected to the same Wi-Fi, use your laptop's local LAN IP (e.g. <code>http://192.168.X.X:3000</code>).
              If deployed online (e.g. Render, Railway), use your public <code>https://...</code> domain.
            </p>
          </div>
        )}

        {/* MODE 1: INDIVIDUAL TEAM VIEW (Big QR, easy to show to projector or specific team) */}
        {viewMode === 'individual' && (
          <div>
            {/* Team Selector Tabs */}
            <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3">
              {teams.map((t, idx) => {
                const online = isTeamOnline(idx);
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedTeam(idx)}
                    className={`btn small flex-shrink-0 ${
                      selectedTeam === idx ? 'gold' : 'ghost'
                    } ${online ? 'border-emerald-500/70' : ''}`}
                    style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <span>{t.name}</span>
                    {online ? (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Device connected" />
                    ) : (
                      <span className="text-[10px] opacity-60">#{idx + 1}</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Focused Team QR Showcase Box */}
            <div className="p-5 rounded-2xl bg-[var(--card-2)] border border-[var(--border)] flex flex-col md:flex-row items-center gap-6">
              {/* QR Image with white canvas padding for optimal camera scanning */}
              <div className="flex flex-col items-center flex-shrink-0">
                <div className="p-3 bg-white rounded-2xl shadow-xl border-4 border-[var(--gold)] flex items-center justify-center">
                  {qrCodeDataUrls[selectedTeam] ? (
                    <img
                      src={qrCodeDataUrls[selectedTeam]}
                      alt={`Scan to join ${teams[selectedTeam]?.name}`}
                      className="w-[200px] h-[200px] sm:w-[220px] sm:h-[220px] block rounded-lg"
                    />
                  ) : (
                    <div className="w-[200px] h-[200px] flex items-center justify-center text-gray-500 text-xs">
                      Generating QR...
                    </div>
                  )}
                </div>
                <span className="text-[11px] font-extrabold text-[var(--gold-2)] mt-2 uppercase tracking-wider">
                  Point Phone Camera to Scan
                </span>
              </div>

              {/* Team Info & Actions */}
              <div className="flex-1 flex flex-col gap-3 text-left w-full">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-[var(--teal)] text-white">
                      TEAM #{selectedTeam + 1}
                    </span>
                    {isTeamOnline(selectedTeam) && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 border border-emerald-500 text-emerald-300 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Phone Connected & Ready
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl font-black text-[var(--text)] mt-1 mb-0.5">
                    {teams[selectedTeam]?.name}
                  </h2>
                  <p className="text-xs text-[var(--muted)] m-0">
                    Scanning instantly opens this team's live buzzer screen with zero setup required.
                  </p>
                </div>

                {/* Direct Link box */}
                <div className="p-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={getTeamUrl(selectedTeam)}
                    className="flex-1 bg-transparent text-xs text-[var(--gold-2)] font-mono outline-none border-none truncate"
                  />
                  <button
                    onClick={() => copyToClipboard(getTeamUrl(selectedTeam), `team-${selectedTeam}`)}
                    className="btn small teal"
                    style={{ padding: '4px 10px', fontSize: '11px' }}
                  >
                    {copiedLink === `team-${selectedTeam}` ? <Check size={12} /> : <Copy size={12} />}
                    {copiedLink === `team-${selectedTeam}` ? 'Copied' : 'Copy'}
                  </button>
                  <a
                    href={getTeamUrl(selectedTeam)}
                    target="_blank"
                    rel="noreferrer"
                    className="btn small ghost"
                    style={{ padding: '4px 8px' }}
                    title="Open in new tab to test"
                  >
                    <ExternalLink size={12} />
                  </a>
                </div>

                {/* Instructions */}
                <div className="text-xs text-[var(--muted)] space-y-1 bg-[var(--navy)]/60 p-3 rounded-xl border border-[var(--border)]">
                  <div className="font-bold text-[var(--text)] flex items-center gap-1.5">
                    <span>📱 How participants connect on their phone:</span>
                  </div>
                  <ol className="list-decimal pl-4 space-y-0.5 text-[11.5px]">
                    <li>Open standard <b>Camera app</b> on iPhone or Android.</li>
                    <li>Hold camera over the QR code on your laptop screen.</li>
                    <li>Tap the yellow link pop-up that appears on their phone.</li>
                    <li><b>Done!</b> Their phone screen turns into the big buzzer button.</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODE 2: ALL 8 TEAMS GRID (Perfect for projecting onto a screen or wall!) */}
        {viewMode === 'all_grid' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-[var(--muted)]">
                Project this on a big screen or TV so all 8 teams can scan their respective QR code from their tables:
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {teams.map((t, idx) => {
                const online = isTeamOnline(idx);
                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-2xl bg-[var(--card-2)] border transition flex flex-col items-center text-center ${
                      online ? 'border-emerald-500 shadow-[0_0_12px_rgba(46,204,113,0.25)]' : 'border-[var(--border)]'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1.5 px-1">
                      <span className="text-[11px] font-extrabold text-[var(--teal)]">#{idx + 1}</span>
                      {online ? (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 font-extrabold border border-emerald-600">
                          LIVE
                        </span>
                      ) : (
                        <span className="text-[9px] text-[var(--muted)]">Scan</span>
                      )}
                    </div>

                    <div className="p-2 bg-white rounded-xl shadow-md border-2 border-[var(--gold)] mb-2 flex items-center justify-center">
                      {qrCodeDataUrls[idx] ? (
                        <img
                          src={qrCodeDataUrls[idx]}
                          alt={t.name}
                          className="w-[120px] h-[120px] block rounded"
                        />
                      ) : (
                        <div className="w-[120px] h-[120px] flex items-center justify-center text-gray-400 text-[10px]">
                          Loading...
                        </div>
                      )}
                    </div>

                    <div className="font-extrabold text-xs text-[var(--text)] truncate w-full mb-1">
                      {t.name}
                    </div>

                    <button
                      onClick={() => copyToClipboard(getTeamUrl(idx), `grid-${idx}`)}
                      className="text-[10px] text-[var(--gold-2)] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {copiedLink === `grid-${idx}` ? <Check size={10} /> : <Copy size={10} />}
                      <span>{copiedLink === `grid-${idx}` ? 'Copied link' : 'Copy link'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 mt-4 border-t border-[var(--border)]">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--muted)]">
              Connected Phones: <strong className="text-emerald-400">{connectedClients.filter(c => c.role === 'buzzer').length}</strong>
            </span>
          </div>
          <button onClick={onClose} className="btn teal small">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
