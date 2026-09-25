import React, { useState, useEffect } from 'react';
import { Cpu, CheckCircle2, AlertCircle, RefreshCw, Sparkles, Plus, Copy, Check, ArrowRight } from 'lucide-react';

interface LocalLLMStudioProps {
  onAddQuestionToRound: (questionObj: any) => void;
  onReplaceCurrentQuestion: (questionObj: any) => void;
  currentQuestionText?: string;
}

export const LocalLLMStudio: React.FC<LocalLLMStudioProps> = ({
  onAddQuestionToRound,
  onReplaceCurrentQuestion,
  currentQuestionText,
}) => {
  const [endpointType, setEndpointType] = useState<'ollama' | 'openai_compatible'>('ollama');
  const [endpointUrl, setEndpointUrl] = useState('http://localhost:11434');
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'checking' | 'connected' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  // Generation parameters
  const [topic, setTopic] = useState('Autonomous AI Agents & Reasoning');
  const [tier, setTier] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [format, setFormat] = useState<'mcq' | 'buzzer'>('buzzer');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);
  const [actionNotice, setActionNotice] = useState('');

  // Presets
  const TECH_TOPICS = [
    'Autonomous AI Agents & Reasoning',
    'Quantum Supremacy & Post-Quantum Cryptography',
    'Robotics & Humanoid Automations',
    'Edge AI & Neuromorphic Computing',
    'SpaceTech & Lunar/Mars Missions',
    'Zero-Day Exploits & Cybersecurity',
    'Semiconductors & GPU Accelerators',
    'Decentralized Physical Infrastructure (DePIN)',
  ];

  const testConnection = async () => {
    setConnectionStatus('checking');
    setStatusMessage('Connecting to local LLM backend...');
    try {
      const res = await fetch('/api/local-llm/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: endpointUrl, type: endpointType }),
      });
      const data = await res.json();
      if (data.success) {
        setConnectionStatus('connected');
        setModels(data.models || []);
        if (data.models && data.models.length > 0) {
          setSelectedModel(data.models[0]);
        }
        setStatusMessage(`Connected! Found ${data.models?.length || 0} local model(s).`);
      } else {
        setConnectionStatus('error');
        setStatusMessage(data.error || 'Failed to connect to local LLM.');
      }
    } catch (err: any) {
      setConnectionStatus('error');
      setStatusMessage(`Connection failed: ${err.message}. Make sure Ollama or LM Studio is running.`);
    }
  };

  useEffect(() => {
    // Initial silent check
    testConnection();
  }, []);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setActionNotice('');
    try {
      const res = await fetch('/api/local-llm/generate-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: endpointUrl,
          type: endpointType,
          model: selectedModel || 'llama3',
          topic,
          tier,
          format,
        }),
      });
      const data = await res.json();
      if (data.success && data.result) {
        setGeneratedResult(data.result);
      } else {
        alert(`Generation error: ${data.error || 'Check local LLM status'}`);
      }
    } catch (e: any) {
      alert(`Network error during generation: ${e.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!generatedResult) return;
    navigator.clipboard.writeText(JSON.stringify(generatedResult, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddToQuiz = () => {
    if (!generatedResult) return;
    onAddQuestionToRound(generatedResult);
    setActionNotice('✅ Added question to current round!');
    setTimeout(() => setActionNotice(''), 3000);
  };

  const handleReplaceCurrent = () => {
    if (!generatedResult) return;
    onReplaceCurrentQuestion(generatedResult);
    setActionNotice('✅ Replaced current active question with this one!');
    setTimeout(() => setActionNotice(''), 3000);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Local Backend Config Card */}
      <div className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-[var(--shadow)]">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Cpu className="text-[var(--gold)]" size={22} />
            <h3 className="text-base font-extrabold text-[var(--text)] m-0">
              Open-Source & Local LLM Engine
            </h3>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-teal-950/70 border border-teal-500/40 text-teal-300 font-bold">
            100% Standalone · No Claude or External Cloud Required
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div>
            <label className="text-xs font-bold text-[var(--muted)] mb-1 block">Backend Type</label>
            <select
              value={endpointType}
              onChange={(e) => {
                const val = e.target.value as any;
                setEndpointType(val);
                setEndpointUrl(val === 'ollama' ? 'http://localhost:11434' : 'http://localhost:1234/v1');
              }}
              className="w-full bg-[var(--card-2)] text-[var(--text)] border border-[var(--border)] rounded-xl p-2.5 text-xs font-bold"
            >
              <option value="ollama">Ollama (localhost:11434)</option>
              <option value="openai_compatible">LM Studio / LocalAI / vLLM (localhost:1234/v1)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-[var(--muted)] mb-1 block">Local Endpoint URL</label>
            <input
              type="text"
              value={endpointUrl}
              onChange={(e) => setEndpointUrl(e.target.value)}
              className="w-full bg-[var(--card-2)] text-[var(--text)] border border-[var(--border)] rounded-xl p-2.5 text-xs font-bold"
              placeholder="http://localhost:11434"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[var(--muted)] mb-1 block">Local Model</label>
            <div className="flex gap-2">
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full bg-[var(--card-2)] text-[var(--text)] border border-[var(--border)] rounded-xl p-2.5 text-xs font-bold"
              >
                {models.length > 0 ? (
                  models.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))
                ) : (
                  <option value="llama3">llama3 (default)</option>
                )}
              </select>
              <button onClick={testConnection} className="btn ghost small" title="Refresh local models">
                <RefreshCw size={14} className={connectionStatus === 'checking' ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2 text-xs">
          {connectionStatus === 'connected' && (
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <CheckCircle2 size={16} />
              <span>{statusMessage}</span>
            </div>
          )}
          {connectionStatus === 'error' && (
            <div className="flex items-center gap-1.5 text-amber-400 font-medium">
              <AlertCircle size={16} />
              <span>{statusMessage} (Start Ollama locally: <code>ollama run llama3</code>)</span>
            </div>
          )}
          {connectionStatus === 'checking' && (
            <div className="flex items-center gap-1.5 text-[var(--muted)]">
              <RefreshCw size={14} className="animate-spin" />
              <span>Checking local connection...</span>
            </div>
          )}
        </div>
      </div>

      {/* Question Generator Card */}
      <div className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-[var(--shadow)]">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="text-[var(--gold)]" size={20} />
          <h3 className="text-base font-extrabold text-[var(--text)] m-0">
            Generate Dynamic Quiz Questions
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div className="md:col-span-1">
            <label className="text-xs font-bold text-[var(--muted)] mb-1 block">Difficulty Tier</label>
            <div className="flex gap-1.5">
              {(['Easy', 'Medium', 'Hard'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTier(t)}
                  className={`btn small flex-1 ${tier === t ? 'teal' : 'ghost'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[var(--muted)] mb-1 block">Question Format</label>
            <div className="flex gap-1.5">
              <button
                onClick={() => setFormat('buzzer')}
                className={`btn small flex-1 ${format === 'buzzer' ? 'teal' : 'ghost'}`}
              >
                Buzzer (Open Answer)
              </button>
              <button
                onClick={() => setFormat('mcq')}
                className={`btn small flex-1 ${format === 'mcq' ? 'teal' : 'ghost'}`}
              >
                MCQ (4 Options)
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[var(--muted)] mb-1 block">Generate Now</label>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="btn gold w-full justify-center"
            >
              {isGenerating ? (
                <>
                  <RefreshCw size={14} className="animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <Sparkles size={14} /> Generate with Local LLM
                </>
              )}
            </button>
          </div>
        </div>

        {/* Topic Input & Quick Chips */}
        <div className="mb-4">
          <label className="text-xs font-bold text-[var(--muted)] mb-1 block">Tech Domain / Topic Prompt</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full bg-[var(--card-2)] text-[var(--text)] border border-[var(--border)] rounded-xl p-2.5 text-xs font-bold mb-2"
            placeholder="e.g. Quantum Computing, AI Agents, Microchips..."
          />

          <div className="flex flex-wrap gap-1.5">
            {TECH_TOPICS.map((preset) => (
              <button
                key={preset}
                onClick={() => setTopic(preset)}
                className={`text-[11px] px-2.5 py-1 rounded-full border border-[var(--border)] font-semibold transition cursor-pointer ${
                  topic === preset
                    ? 'bg-[var(--teal)] text-white border-transparent'
                    : 'bg-[var(--card-2)] text-[var(--muted)] hover:text-[var(--text)]'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Generated Result Preview */}
        {generatedResult && (
          <div className="p-4 rounded-xl bg-[var(--card-2)] border border-[var(--border)] mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className={`tierpill ${generatedResult.tier?.toLowerCase() || 'medium'}`}>
                {generatedResult.tier || tier} · {generatedResult.type?.toUpperCase() || format.toUpperCase()}
              </span>
              <div className="flex items-center gap-2">
                <button onClick={handleCopy} className="btn ghost small">
                  {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  {copied ? 'Copied' : 'Copy JSON'}
                </button>
              </div>
            </div>

            <p className="text-base font-bold text-[var(--text)] mb-3">{generatedResult.question}</p>

            {generatedResult.options && Array.isArray(generatedResult.options) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                {generatedResult.options.map((opt: string, i: number) => (
                  <div
                    key={i}
                    className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center gap-2 ${
                      i === generatedResult.correctIndex
                        ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                        : 'bg-[var(--card)] border-[var(--border)] text-[var(--muted)]'
                    }`}
                  >
                    <span className="w-5 h-5 rounded bg-[var(--navy)] flex items-center justify-center font-bold text-[10px]">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span>{opt}</span>
                    {i === generatedResult.correctIndex && <CheckCircle2 size={14} className="ml-auto text-emerald-400" />}
                  </div>
                ))}
              </div>
            )}

            <div className="p-3 rounded-lg bg-[var(--card)] border border-[var(--border)] mb-3">
              <div className="text-[10px] uppercase font-extrabold tracking-wider text-[var(--teal)] mb-1">
                Answer Key
              </div>
              <div className="text-sm font-bold text-[var(--gold-2)]">{generatedResult.answer}</div>
              {generatedResult.explanation && (
                <div className="text-xs text-[var(--muted)] mt-1">{generatedResult.explanation}</div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[var(--border)]">
              <button onClick={handleAddToQuiz} className="btn good small">
                <Plus size={14} /> Add as Bonus Question to Current Round
              </button>
              <button onClick={handleReplaceCurrent} className="btn gold small">
                <ArrowRight size={14} /> Replace Active Question
              </button>
              {actionNotice && <span className="text-xs font-bold text-emerald-400 ml-2">{actionNotice}</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
