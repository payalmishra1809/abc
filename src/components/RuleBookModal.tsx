import React, { useState } from 'react';
import { BookOpen, Download, FileText, Printer, X, CheckCircle, AlertCircle, Zap, Bell, Award, Layers } from 'lucide-react';

interface RuleBookModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RuleBookModal: React.FC<RuleBookModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'rules' | 'scoring' | 'conduct'>('rules');

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadWordDoc = () => {
    const docHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>TECHNO QUIZ — Official Rule Book & Competition Guidelines</title>
        <style>
          body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 11pt; line-height: 1.45; color: #111; margin: 30pt; }
          h1 { color: #0b2545; font-size: 20pt; border-bottom: 2pt solid #d4af37; padding-bottom: 6pt; margin-bottom: 8pt; text-align: center; }
          h2 { color: #134074; font-size: 14pt; margin-top: 14pt; border-bottom: 1pt solid #cbd5e1; padding-bottom: 3pt; }
          h3 { color: #0b2545; font-size: 12pt; margin-top: 10pt; }
          p, li { font-size: 10.5pt; text-align: justify; }
          .page-break { page-break-after: always; }
          .meta-box { background-color: #f1f5f9; padding: 10pt; border-left: 4pt solid #d4af37; margin-bottom: 12pt; font-size: 10pt; }
          table { width: 100%; border-collapse: collapse; margin-top: 8pt; margin-bottom: 12pt; font-size: 10pt; }
          th { background-color: #0b2545; color: #ffffff; padding: 6pt 8pt; border: 1pt solid #cbd5e1; text-align: left; }
          td { padding: 6pt 8pt; border: 1pt solid #cbd5e1; }
          tr:nth-child(even) { background-color: #f8fafc; }
          .badge { font-weight: bold; color: #0f766e; }
        </style>
      </head>
      <body>
        <!-- PAGE 1: TOURNAMENT OVERVIEW & ROUND 1 -->
        <h1>🏆 TECHNO QUIZ — OFFICIAL RULE BOOK</h1>
        <div style="text-align:center; font-weight: bold; color: #64748b; margin-bottom: 12pt;">
          Official Guidelines & Operational Handbook for Hosts and Participating Teams (Pages: 3)
        </div>

        <div class="meta-box">
          <b>Topic:</b> Emerging Trends in Technology (Artificial Intelligence, Quantum Computing, Blockchain, IoT, Cyber Tech)<br/>
          <b>Eligibility:</b> Registered Teams (Up to 8 Teams, 2–3 participants per team)<br/>
          <b>Scoring Engine:</b> Real-Time Synchronized Digital Master Console with WebSocket Millisecond Buzzer
        </div>

        <h2>Section 1: General Tournament Structure</h2>
        <p>The TECHNO QUIZ is structured into 4 core competitive rounds plus a Grand Finale / Tie-Breaker. Each round tests distinct intellectual, tactical, and reaction capabilities.</p>
        
        <h2>Section 2: Round-by-Round Official Rules</h2>

        <h3>Round 1: Trend Trivia (Simultaneous Alphabetical Option Submission)</h3>
        <p><b>Objective:</b> Foundation round evaluating core technical literacy across contemporary tech trends.</p>
        <ul>
          <li><b>Format:</b> The Quiz Host projects and reads aloud each Multiple Choice Question (MCQ) alongside 4 options labeled <b>A, B, C, and D</b>.</li>
          <li><b>Answer Submission:</b>
            <ul>
              <li>There is <b>NO buzzer</b> in this round. Every team participates simultaneously.</li>
              <li>After the host completes reading the question, teams receive a <b>15 to 20-second deliberation window</b>.</li>
              <li>Upon the host's call (<i>"Options UP!"</i>), all teams simultaneously declare their chosen alphabet option (<b>A, B, C, or D</b>) via their participant device, response placard, or verbal callout.</li>
              <li>Once all teams have locked in their letters, no modifications are permitted.</li>
            </ul>
          </li>
          <li><b>Correct Answer Reveal:</b> The host digitally reveals the official correct option on the central projection screen.</li>
          <li><b>Scoring Allocation:</b>
            <ul>
              <li><b>Correct Option:</b> <b>+10 Points</b> awarded to every team that correctly identified the letter.</li>
              <li><b>Incorrect / No Option:</b> <b>0 Points</b> (No negative marking in Round 1).</li>
              <li>Points are digitally tallied immediately into the master leaderboard.</li>
            </ul>
          </li>
        </ul>

        <div class="page-break"></div>

        <!-- PAGE 2: ROUND 2 BUZZER BLITZ & ROUND 3 PICTURE BUZZER -->
        <h2>Round 2: Buzzer Blitz (High-Speed Reaction & Direct Recall)</h2>
        <p><b>Objective:</b> Tests speed of recall, prompt decision making, and calculated risk-taking.</p>
        <ul>
          <li><b>Format:</b> Direct technical questions (No multiple-choice options provided).</li>
          <li><b>Buzzer Protocol & Fair Play:</b>
            <ul>
              <li>The host reads the question. During the reading, the buzzer remains <b>LOCKED</b>.</li>
              <li>Once the question reading is concluded, the host clicks <b>"Unlock Buzzer"</b>. The digital buzzers on participant mobile phones will instantly flash green.</li>
              <li>The team that hits their buzzer first (recorded down to the millisecond) earns the primary right to answer.</li>
              <li><b>Answering Window:</b> The buzzed team has <b>5 seconds</b> to begin formulating their answer. No consultation with other teams is permitted.</li>
            </ul>
          </li>
          <li><b>Scoring & Penalties:</b>
            <ul>
              <li><b>Correct Answer:</b> <b>+10 Points</b>.</li>
              <li><b>Incorrect Answer:</b> <b>-5 Points (Negative Marking)</b>.</li>
            </ul>
          </li>
          <li><b>Pass / Re-buzz Rule:</b> If the first team answers incorrectly or hesitates beyond 5 seconds, the host may unlock the buzzer for the remaining teams (Pass) for <b>+5 points</b> (no further negative penalty).</li>
        </ul>

        <h3>Round 3: Picture This (Visual & Audio-Visual Recognition)</h3>
        <p><b>Objective:</b> Recognition of emerging tech hardware, founder logos, architecture diagrams, and pioneer personalities.</p>
        <ul>
          <li><b>Format:</b> Visual slide projected on the main auditorium screen (logos, humanoid robotics, chip dies, space missions, patent diagrams).</li>
          <li><b>Buzzer Rule:</b> Operates under the Buzzer Blitz mechanism. Teams must buzz to identify the technology, corporate parent, or technical paradigm.</li>
          <li><b>Scoring:</b> <b>+10 Points</b> for correct identification; <b>-5 Points</b> for wrong identification. Partial credit (5 points) may be awarded at the host's sole discretion for identifying key related nuances.</li>
        </ul>

        <div class="page-break"></div>

        <!-- PAGE 3: ROUND 4 RAPID FIRE & SUMMARY SCORING MATRIX -->
        <h2>Round 4: Rapid Fire (60-Second Team Sprint)</h2>
        <p><b>Objective:</b> High-velocity individual team sprint testing stamina, breadth of knowledge, and quick verbal response under time pressure.</p>
        <ul>
          <li><b>Format:</b> Each team takes the stage individually for a dedicated <b>60-Second Sprint</b>.</li>
          <li><b>Question Stream:</b> The host fires up to 10 rapid technical queries (spanning Easy, Medium, and Hard difficulty tiers).</li>
          <li><b>Passing Protocol:</b>
            <ul>
              <li>Teams may say <b>"Pass"</b> to skip to the next question without penalty.</li>
              <li>Passed questions are NOT revisited once skipped.</li>
            </ul>
          </li>
          <li><b>Scoring Allocation:</b>
            <ul>
              <li><b>+10 Points</b> for each correct answer delivered within the 60 seconds.</li>
              <li><b>0 Points</b> for wrong or passed questions (No negative marking).</li>
              <li>Bonus: Any team successfully answering 7 or more questions within the 60 seconds earns a <b>+10 Point Velocity Bonus</b>.</li>
            </ul>
          </li>
        </ul>

        <h2>Official Scoring Matrix Summary</h2>
        <table>
          <thead>
            <tr>
              <th>Round Name</th>
              <th>Question Type</th>
              <th>Buzzer Used?</th>
              <th>Correct</th>
              <th>Incorrect</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><b>Round 1: Trend Trivia</b></td>
              <td>Multiple Choice (A, B, C, D)</td>
              <td>No (Simultaneous Letter Submission)</td>
              <td><span class="badge">+10 Pts</span></td>
              <td>0 Pts</td>
            </tr>
            <tr>
              <td><b>Round 2: Buzzer Blitz</b></td>
              <td>Direct Technical Recall</td>
              <td>Yes (Digital Millisecond Buzzer)</td>
              <td><span class="badge">+10 Pts</span></td>
              <td>-5 Pts</td>
            </tr>
            <tr>
              <td><b>Round 3: Picture This</b></td>
              <td>Visual & Logo Identification</td>
              <td>Yes (Digital Buzzer)</td>
              <td><span class="badge">+10 Pts</span></td>
              <td>-5 Pts</td>
            </tr>
            <tr>
              <td><b>Round 4: Rapid Fire</b></td>
              <td>60-Second Timed Sprint</td>
              <td>No (Solo Team Sprint)</td>
              <td><span class="badge">+10 Pts</span></td>
              <td>0 Pts</td>
            </tr>
            <tr>
              <td><b>Round 5: Grand Finale (Finalists)</b></td>
              <td>Advanced Tech MCQs</td>
              <td>Yes (Finalists Only)</td>
              <td><span class="badge">+20 Pts</span></td>
              <td>-10 Pts</td>
            </tr>
            <tr>
              <td><b>Tie-Breaker (Sudden Death)</b></td>
              <td>Direct High-Difficulty Q</td>
              <td>Yes (First Correct Buzz Wins)</td>
              <td>Winner</td>
              <td>Lockout</td>
            </tr>
          </tbody>
        </table>

        <h2>Code of Conduct & Dispute Settlement</h2>
        <ol>
          <li><b>Device Discipline:</b> Use of smartwatches, cellular browsing, or generative AI assistants during questions is strictly prohibited and results in immediate disqualification.</li>
          <li><b>Quiz Master Discretion:</b> In any ambiguity regarding pronunciation, acronyms, or answer equivalence, the Quiz Master's ruling is final and binding.</li>
          <li><b>Tie-Breakers:</b> In the event of a tie for qualifying spots or 1st place, a <i>Sudden Death Buzzer Question</i> will be activated.</li>
        </ol>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', docHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'TECHNO_QUIZ_Official_Rule_Book.doc';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box"
        style={{ maxWidth: '820px', maxHeight: '92vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--gold)] to-[var(--gold-2)] flex items-center justify-center text-black font-extrabold shadow-md">
              <BookOpen size={22} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[var(--text)] m-0 leading-tight">
                Official Rule Book — TECHNO QUIZ
              </h3>
              <p className="text-[11.5px] text-[var(--muted)] m-0">
                Tournament guidelines, rounds protocol & scoring handbook (Confined to 3 Pages)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadWordDoc}
              className="btn small gold"
              style={{ padding: '6px 10px', fontSize: '11.5px' }}
              title="Download Word Document (.doc)"
            >
              <Download size={14} />
              <span>Word Doc</span>
            </button>
            <button
              onClick={handlePrint}
              className="btn small teal"
              style={{ padding: '6px 10px', fontSize: '11.5px' }}
              title="Save as PDF via Print"
            >
              <Printer size={14} />
              <span>Print / PDF</span>
            </button>
            <button onClick={onClose} className="btn ghost small" style={{ padding: '6px' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-4 border-b border-[var(--border)] pb-2 text-xs">
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'rules'
                ? 'bg-[var(--gold)] text-black shadow-md'
                : 'bg-[var(--card-2)] text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            📄 Page 1 & 2: Round Procedures
          </button>
          <button
            onClick={() => setActiveTab('scoring')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'scoring'
                ? 'bg-[var(--gold)] text-black shadow-md'
                : 'bg-[var(--card-2)] text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            📊 Page 3: Scoring Matrix
          </button>
          <button
            onClick={() => setActiveTab('conduct')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'conduct'
                ? 'bg-[var(--gold)] text-black shadow-md'
                : 'bg-[var(--card-2)] text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            ⚖️ Fair Play & Conduct
          </button>
        </div>

        {/* TAB 1: ROUND PROCEDURES */}
        {activeTab === 'rules' && (
          <div className="space-y-4 text-xs">
            {/* Round 1 */}
            <div className="p-4 rounded-xl bg-[var(--card-2)] border border-[var(--border)]">
              <div className="flex items-center justify-between mb-2">
                <span className="font-extrabold text-sm text-[var(--gold)] flex items-center gap-1.5">
                  <Layers size={16} /> Round 1: Trend Trivia (Simultaneous Letter Submission)
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10.5px]">
                  No Buzzer · All Teams
                </span>
              </div>
              <p className="text-[var(--text)] leading-relaxed mb-2.5">
                <strong>Host & Question Procedure:</strong> The host projects and reads the question aloud with 4 options (A, B, C, D).
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] mb-2">
                <div className="p-2.5 rounded-lg bg-[var(--card)] border border-[var(--border)]">
                  <strong className="text-[var(--teal)]">Submission Rule:</strong>
                  <ul className="list-disc pl-4 mt-1 space-y-1 text-[var(--muted)]">
                    <li>All teams deliberate for 15 seconds.</li>
                    <li>Teams declare their chosen alphabet (<b>A, B, C, or D</b>) simultaneously on call.</li>
                    <li>No answers can be changed once submitted.</li>
                  </ul>
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--card)] border border-[var(--border)]">
                  <strong className="text-emerald-400">Scoring & Reveal:</strong>
                  <ul className="list-disc pl-4 mt-1 space-y-1 text-[var(--muted)]">
                    <li>Host clicks to reveal the official correct option.</li>
                    <li><b>+10 Points</b> awarded to every team that selected the correct letter.</li>
                    <li><b>0 Points</b> for wrong letter (No negative marking).</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Round 2 */}
            <div className="p-4 rounded-xl bg-[var(--card-2)] border border-[var(--border)]">
              <div className="flex items-center justify-between mb-2">
                <span className="font-extrabold text-sm text-[var(--gold)] flex items-center gap-1.5">
                  <Bell size={16} /> Round 2: Buzzer Blitz (High-Speed Reaction)
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold text-[10.5px]">
                  Digital Buzzer · Negative Marking
                </span>
              </div>
              <p className="text-[var(--text)] leading-relaxed mb-2.5">
                <strong>Host & Question Procedure:</strong> Direct questions without multiple choices. Tests speed and accurate recall.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 rounded-lg bg-[var(--card)] border border-[var(--border)]">
                  <strong className="text-[var(--teal)]">Buzzer Rules:</strong>
                  <ul className="list-disc pl-4 mt-1 space-y-1 text-[var(--muted)]">
                    <li>Buzzer stays locked while host reads the question.</li>
                    <li>Host unlocks buzzer — first team to buzz gets 5 seconds to answer.</li>
                    <li>Buzzer timestamps are accurate down to the millisecond.</li>
                  </ul>
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--card)] border border-[var(--border)]">
                  <strong className="text-amber-400">Scoring & Penalties:</strong>
                  <ul className="list-disc pl-4 mt-1 space-y-1 text-[var(--muted)]">
                    <li><b>+10 Points</b> for correct answer.</li>
                    <li><b>-5 Points</b> penalty for wrong answer or timeout.</li>
                    <li>Unanswered questions can pass to next team in queue for <b>+5 Points</b>.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Round 3 */}
            <div className="p-4 rounded-xl bg-[var(--card-2)] border border-[var(--border)]">
              <div className="flex items-center justify-between mb-2">
                <span className="font-extrabold text-sm text-[var(--gold)] flex items-center gap-1.5">
                  <Zap size={16} /> Round 3: Picture This (Visual Tech Clues)
                </span>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold text-[10.5px]">
                  Visual Media · Digital Buzzer
                </span>
              </div>
              <p className="text-[var(--text)] leading-relaxed mb-2">
                <strong>Format:</strong> High-definition visual projected (robotics, logos, chips, satellite missions). Teams must buzz in to identify the company, system, or technology.
              </p>
              <div className="p-2.5 rounded-lg bg-[var(--card)] border border-[var(--border)] text-[11px] text-[var(--muted)]">
                <b>Scoring:</b> <b>+10 Points</b> for correct identification | <b>-5 Points</b> for wrong guess. Partial hints deduct 5 points.
              </div>
            </div>

            {/* Round 4 */}
            <div className="p-4 rounded-xl bg-[var(--card-2)] border border-[var(--border)]">
              <div className="flex items-center justify-between mb-2">
                <span className="font-extrabold text-sm text-[var(--gold)] flex items-center gap-1.5">
                  <Award size={16} /> Round 4: Rapid Fire (60-Second Timed Sprint)
                </span>
                <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 font-bold text-[10.5px]">
                  Solo Team Sprint · 60s Timer
                </span>
              </div>
              <p className="text-[var(--text)] leading-relaxed mb-2">
                <strong>Format:</strong> Each team takes the floor alone. The host reads up to 10 rapid technical queries within an automated 60-second digital countdown.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 rounded-lg bg-[var(--card)] border border-[var(--border)]">
                  <strong className="text-purple-300">Sprint Mechanics:</strong>
                  <ul className="list-disc pl-4 mt-1 space-y-1 text-[var(--muted)]">
                    <li>Teams may answer immediately or say <b>"Pass"</b>.</li>
                    <li>Passed questions are not repeated.</li>
                    <li>Timer halts automatically at exactly 0.0 seconds.</li>
                  </ul>
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--card)] border border-[var(--border)]">
                  <strong className="text-emerald-400">Scoring & Bonus:</strong>
                  <ul className="list-disc pl-4 mt-1 space-y-1 text-[var(--muted)]">
                    <li><b>+10 Points</b> per correct answer.</li>
                    <li><b>0 Points</b> for wrong or passed questions.</li>
                    <li><b>+10 Bonus Points</b> if 7+ questions answered correctly in 60s.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SCORING MATRIX */}
        {activeTab === 'scoring' && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-[var(--card-2)] border border-[var(--border)]">
              <h4 className="font-extrabold text-sm text-[var(--text)] mb-3">
                Comprehensive Tournament Scoring Matrix
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[11.5px]">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-[var(--muted)]">
                      <th className="py-2 font-bold">Round</th>
                      <th className="py-2 font-bold">Nature</th>
                      <th className="py-2 font-bold">Mechanism</th>
                      <th className="py-2 font-bold text-emerald-400">Correct</th>
                      <th className="py-2 font-bold text-rose-400">Wrong</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]/50">
                    <tr>
                      <td className="py-2.5 font-bold text-[var(--gold)]">Round 1: Trend Trivia</td>
                      <td>MCQ (Tech Trends)</td>
                      <td>Simultaneous Alphabet Callout (A/B/C/D)</td>
                      <td className="font-extrabold text-emerald-400">+10 Pts</td>
                      <td className="text-[var(--muted)]">0 Pts</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-bold text-[var(--gold)]">Round 2: Buzzer Blitz</td>
                      <td>Direct Knowledge</td>
                      <td>Digital Millisecond Buzzer</td>
                      <td className="font-extrabold text-emerald-400">+10 Pts</td>
                      <td className="font-extrabold text-rose-400">-5 Pts</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-bold text-[var(--gold)]">Round 3: Picture This</td>
                      <td>Visual Identification</td>
                      <td>Digital Millisecond Buzzer</td>
                      <td className="font-extrabold text-emerald-400">+10 Pts</td>
                      <td className="font-extrabold text-rose-400">-5 Pts</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-bold text-[var(--gold)]">Round 4: Rapid Fire</td>
                      <td>60-Second Sprint</td>
                      <td>Solo Team Verbal Sprint</td>
                      <td className="font-extrabold text-emerald-400">+10 Pts / Q</td>
                      <td className="text-[var(--muted)]">0 Pts (Pass allowed)</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-bold text-[var(--gold)]">Round 5: Grand Finale</td>
                      <td>Advanced MCQ</td>
                      <td>Top 4 Finalist Teams Buzzer</td>
                      <td className="font-extrabold text-emerald-400">+20 Pts</td>
                      <td className="font-extrabold text-rose-400">-10 Pts</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-bold text-[var(--gold)]">Tie-Breaker (Sudden Death)</td>
                      <td>Complex Problem</td>
                      <td>First Correct Buzz Wins</td>
                      <td className="font-extrabold text-emerald-400">Advances / Wins</td>
                      <td className="font-extrabold text-rose-400">Lockout</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--card-2)] border border-[var(--border)] text-[11.5px]">
              <strong className="text-[var(--text)]">Automated Digital Tabulation:</strong>
              <p className="text-[var(--muted)] mt-1 m-0">
                All points are logged in the host console and synchronized to the Live Tracking Table and Big Screen Scoreboard. In case of host input correction, score adjustments are reflected in real time with an audit trail.
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: FAIR PLAY & CONDUCT */}
        {activeTab === 'conduct' && (
          <div className="space-y-3.5 text-xs">
            <div className="p-3.5 rounded-xl bg-[var(--card-2)] border border-[var(--border)]">
              <div className="flex items-center gap-2 mb-2 font-bold text-sm text-[var(--text)]">
                <AlertCircle size={16} className="text-amber-400" />
                <span>Fair Play Regulations</span>
              </div>
              <ul className="space-y-2 text-[11.5px] text-[var(--muted)] pl-4 list-disc m-0">
                <li>
                  <strong className="text-[var(--text)]">Strict Zero Electronic Assistance:</strong> Mobile phones used for buzzer entry must stay strictly on the buzzer interface screen. Any switching to search engines or AI tools prompts immediate team disqualification.
                </li>
                <li>
                  <strong className="text-[var(--text)]">Premature Buzzing:</strong> Buzzing before the question reading is concluded is prevented by server-side locking. Any repeated physical tampering will forfeit the team's chance for that question.
                </li>
                <li>
                  <strong className="text-[var(--text)]">Speaking Protocol:</strong> Only the nominated team speaker or the team member who hit the buzzer should deliver the final answer.
                </li>
                <li>
                  <strong className="text-[var(--text)]">Quiz Master's Decision:</strong> In all subjective matters (pronunciation, spelling of acronyms, or partial answers), the Quiz Master's ruling is conclusive.
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 mt-4 border-t border-[var(--border)]">
          <div className="text-[11px] text-[var(--muted)]">
            Format: Confined to 3 Pages · Compatible with Print, PDF & MS Word
          </div>
          <div className="flex gap-2">
            <button onClick={handleDownloadWordDoc} className="btn small gold">
              <FileText size={13} /> Download Word Document (.doc)
            </button>
            <button onClick={onClose} className="btn teal small">
              Close Handbook
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
