import React, { useState, useEffect } from 'react';
import { Laptop, QrCode, Copy, Check, X, Wifi, ExternalLink } from 'lucide-react';

interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  teams: { name: string }[];
}

export const ConnectModal: React.FC<ConnectModalProps> = ({ isOpen, onClose, teams }) => {
  const [networkInfo, setNetworkInfo] = useState<{ ips: string[]; port: number; localUrl: string } | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/network-info')
        .then((res) => res.json())
        .then((data) => setNetworkInfo(data))
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const primaryIp = networkInfo?.ips?.[0] || 'localhost';
  const lanHostUrl = networkInfo?.ips?.length ? `http://${primaryIp}:3000` : currentOrigin;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(key);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box"
        style={{ maxWidth: '640px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <Wifi className="text-[var(--gold)]" size={20} />
            <h3 className="text-base font-extrabold text-[var(--text)] m-0">
              Link Other Laptops & Devices
            </h3>
          </div>
          <button onClick={onClose} className="btn ghost small" style={{ padding: '4px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Step 1: Open on other laptops */}
        <div className="mb-5">
          <div className="text-xs uppercase font-extrabold tracking-wider text-[var(--teal)] mb-1.5">
            1. Wi-Fi / LAN Join Address (Open on other laptops)
          </div>
          <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--card-2)] border border-[var(--border)]">
            <Laptop size={18} className="text-[var(--teal)] flex-shrink-0" />
            <code className="text-sm font-bold text-[var(--gold-2)] flex-1 overflow-x-auto">
              {lanHostUrl}
            </code>
            <button
              onClick={() => copyToClipboard(lanHostUrl, 'lan')}
              className="btn small ghost"
            >
              {copiedLink === 'lan' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              {copiedLink === 'lan' ? 'Copied' : 'Copy'}
            </button>
          </div>
          <p className="text-[11px] text-[var(--muted)] mt-1.5">
            Any laptop or smartphone connected to the same Wi-Fi network can open this URL directly.
          </p>
        </div>

        {/* Direct Team Buzzer Links */}
        <div className="mb-5">
          <div className="text-xs uppercase font-extrabold tracking-wider text-[var(--teal)] mb-1.5">
            2. Direct Team Buzzer Links (Auto-assigned)
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {teams.map((t, idx) => {
              const teamUrl = `${lanHostUrl}/?role=buzzer&team=${idx}`;
              return (
                <button
                  key={idx}
                  onClick={() => copyToClipboard(teamUrl, `team-${idx}`)}
                  className="p-2 rounded-xl bg-[var(--card-2)] border border-[var(--border)] hover:border-[var(--teal)] transition text-left cursor-pointer flex flex-col justify-between"
                >
                  <span className="text-xs font-bold text-[var(--text)]">{t.name}</span>
                  <div className="flex items-center justify-between text-[10px] text-[var(--muted)] mt-1">
                    <span>Team #{idx + 1}</span>
                    {copiedLink === `team-${idx}` ? (
                      <span className="text-emerald-400 font-bold">Copied!</span>
                    ) : (
                      <Copy size={11} />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Standalone Desktop App Instructions */}
        <div className="p-4 rounded-xl bg-[var(--navy)]/60 border border-[var(--border)] mb-4">
          <div className="text-xs font-extrabold text-[var(--text)] mb-1 flex items-center gap-1.5">
            <span>💻 Running as Standalone Desktop App on other laptops:</span>
          </div>
          <ul className="text-xs text-[var(--muted)] list-disc pl-4 space-y-1">
            <li>
              <b>Option A (1-Click PWA):</b> Open the link above in Chrome, Edge, or Brave, and click <b>"Install App"</b> in the address bar or top console menu. It runs in a borderless native window with zero browser bars!
            </li>
            <li>
              <b>Option B (Local Standalone):</b> Copy this project folder to another laptop, run <code className="bg-black/30 px-1 py-0.5 rounded text-white font-mono">npm install</code> and <code className="bg-black/30 px-1 py-0.5 rounded text-white font-mono">npm start</code> to run completely offline.
            </li>
          </ul>
        </div>

        <div className="flex justify-end">
          <button onClick={onClose} className="btn teal small">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
