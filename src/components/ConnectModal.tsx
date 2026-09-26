import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { QrCode, Copy, Check, X, Smartphone, ExternalLink, ShieldAlert, Sparkles } from 'lucide-react';

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
  const [singleQrUrl, setSingleQrUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
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
          if (data.ips && data.ips.length > 0 && window.location.hostname === 'localhost') {
            setCustomHost(`http://${data.ips[0]}:${data.port || 3000}`);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  // Generate SINGLE general connection QR code (opens participant buzzer role directly)
  const universalJoinUrl = `${defaultBaseUrl}/?role=buzzer`;

  useEffect(() => {
    if (!isOpen) return;

    QRCode.toDataURL(universalJoinUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: '#030c17',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    }).then(setSingleQrUrl).catch(() => {});
  }, [isOpen, universalJoinUrl]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(universalJoinUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const connectedBuzzersCount = connectedClients.filter(c => c.role === 'buzzer').length;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box"
        style={{ maxWidth: '620px', maxHeight: '92vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--gold)] to-[var(--gold-2)] flex items-center justify-center text-black font-extrabold shadow-md">
              <QrCode size={22} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[var(--text)] m-0 leading-tight">
                Single QR Connect — All Teams & Phones
              </h3>
              <p className="text-[11px] text-[var(--muted)] m-0">
                One universal QR for all teams to scan from their phones or laptops
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn ghost small" style={{ padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Fair Play Notice */}
        <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[var(--card-2)] border border-[var(--border)] mb-4 text-xs">
          <ShieldAlert size={16} className="text-emerald-400 flex-shrink-0" />
          <div className="text-[11.5px] text-[var(--muted)]">
            <strong className="text-emerald-300">Fair Play Protected:</strong> Scanning participants only get the live buzzer interface with no host console access or question reveals.
          </div>
        </div>

        {/* Central Single QR Presentation Box */}
        <div className="p-6 rounded-2xl bg-[var(--card-2)] border-2 border-[var(--gold)]/40 shadow-xl flex flex-col items-center text-center">
          <div className="p-3 bg-white rounded-2xl shadow-2xl border-4 border-[var(--gold)] mb-3 flex items-center justify-center">
            {singleQrUrl ? (
              <img
                src={singleQrUrl}
                alt="Universal Participant Buzzer QR Code"
                className="w-[240px] h-[240px] sm:w-[260px] sm:h-[260px] block rounded-lg"
              />
            ) : (
              <div className="w-[240px] h-[240px] flex items-center justify-center text-gray-500 text-xs">
                Generating QR code...
              </div>
            )}
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--navy)] border border-[var(--gold)] text-[var(--gold-2)] text-xs font-black uppercase tracking-wider mb-2">
            <Sparkles size={13} /> Scan with any phone camera
          </div>

          <p className="text-xs text-[var(--muted)] max-w-md mx-auto mb-4">
            Participants point their phone camera at this single QR code. Once scanned, they pick their team number (1–8) and can customize their team name right on their screen!
          </p>

          {/* Direct Link box */}
          <div className="w-full p-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] flex items-center gap-2 max-w-lg">
            <Smartphone size={15} className="text-[var(--teal)] flex-shrink-0" />
            <input
              type="text"
              readOnly
              value={universalJoinUrl}
              className="flex-1 bg-transparent text-xs text-[var(--gold-2)] font-mono outline-none border-none truncate"
            />
            <button
              onClick={handleCopy}
              className="btn small teal flex-shrink-0"
              style={{ padding: '4px 10px', fontSize: '11px' }}
            >
              {copiedLink ? <Check size={12} /> : <Copy size={12} />}
              {copiedLink ? 'Copied' : 'Copy'}
            </button>
            <a
              href={universalJoinUrl}
              target="_blank"
              rel="noreferrer"
              className="btn small ghost flex-shrink-0"
              style={{ padding: '4px 8px' }}
              title="Open participant screen in new tab"
            >
              <ExternalLink size={12} />
            </a>
          </div>

          {/* Change IP/Domain toggle */}
          <button
            onClick={() => setIsEditingHost(!isEditingHost)}
            className="text-[11px] text-[var(--teal)] hover:underline mt-2.5 font-bold"
          >
            {isEditingHost ? 'Hide IP settings' : 'Change Target IP / Custom Domain'}
          </button>
        </div>

        {/* Optional Custom IP/Host Input */}
        {isEditingHost && (
          <div className="p-3 rounded-xl bg-[var(--navy)]/80 border border-[var(--teal)] mt-3">
            <div className="text-xs font-bold text-[var(--text)] mb-1">
              Custom LAN IP or Deployed Public URL:
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={customHost}
                onChange={(e) => setCustomHost(e.target.value)}
                placeholder="e.g. http://192.168.1.100:3000 or https://your-quiz.up.railway.app"
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
              If deployed on Railway or Render, enter your public <code>https://...</code> domain so the QR works anywhere.
            </p>
          </div>
        )}

        {/* How it Works Step-by-Step */}
        <div className="mt-4 p-3.5 rounded-xl bg-[var(--card-2)] border border-[var(--border)]">
          <div className="text-xs font-bold text-[var(--text)] mb-2 flex items-center gap-1.5">
            <span>📱 Participant Instructions (30 Seconds Setup):</span>
          </div>
          <ol className="list-decimal pl-4 space-y-1 text-xs text-[var(--muted)] m-0">
            <li>Any team member scans the single QR code using their iPhone or Android camera.</li>
            <li>Tap the link to open the buzzer website directly in mobile Safari / Chrome.</li>
            <li>Select their assigned team number (<b>Team 1–8</b>) and tap <b>"Rename Team"</b> to set their official team name.</li>
            <li>Ready! The big buzzer button lights up when questions are opened.</li>
          </ol>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 mt-4 border-t border-[var(--border)]">
          <div className="text-xs text-[var(--muted)]">
            Live Connected Devices: <strong className="text-emerald-400">{connectedBuzzersCount}</strong>
          </div>
          <button onClick={onClose} className="btn teal small">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
