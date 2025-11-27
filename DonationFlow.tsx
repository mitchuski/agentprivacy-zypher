/**
 * Donation Flow Component
 * 
 * Guides users through the Signal-to-Sanctuary donation process:
 * 1. Read story → 2. Form proverb → 3. Copy → 4. Paste → 5. Copy memo → 6. Zashi
 * 
 * Located at agentprivacy.ai as part of the First Person Spellbook
 */

import React, { useState, useCallback } from 'react';

interface Act {
  id: string;
  title: string;
  narrative: string;
  zAddress: string;
  theme: string;
}

interface DonationFlowProps {
  act: Act;
  onComplete?: (result: DonationResult) => void;
}

interface DonationResult {
  actId: string;
  proverb: string;
  memo: string;
  zAddress: string;
  timestamp: number;
}

type FlowStep = 'read' | 'form' | 'verify' | 'copy' | 'send';

export const DonationFlow: React.FC<DonationFlowProps> = ({ act, onComplete }) => {
  const [step, setStep] = useState<FlowStep>('read');
  const [proverb, setProverb] = useState('');
  const [memo, setMemo] = useState('');
  const [copied, setCopied] = useState<'proverb' | 'memo' | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Generate transaction memo from proverb
  const generateMemo = useCallback((proverbText: string): string => {
    // Format: ACT:<id>|<proverb>
    // Max 512 bytes for Zcash memo
    const prefix = `ACT:${act.id}|`;
    const maxProverbLength = 512 - prefix.length;
    const truncatedProverb = proverbText.slice(0, maxProverbLength);
    return prefix + truncatedProverb;
  }, [act.id]);

  // Validate proverb meets minimum requirements
  const validateProverb = (text: string): { valid: boolean; message: string } => {
    if (text.length < 10) {
      return { valid: false, message: 'Proverb too short. Please write at least a sentence.' };
    }
    if (text.length > 400) {
      return { valid: false, message: 'Proverb too long. Please keep it under 400 characters.' };
    }
    // Check for meaningful content (not just spaces/punctuation)
    const wordCount = text.split(/\s+/).filter(w => w.length > 2).length;
    if (wordCount < 3) {
      return { valid: false, message: 'Please write a meaningful proverb with at least 3 words.' };
    }
    return { valid: true, message: '' };
  };

  // Handle proverb submission
  const handleProverbSubmit = () => {
    const validation = validateProverb(proverb);
    if (!validation.valid) {
      setError(validation.message);
      return;
    }
    setError(null);
    setMemo(generateMemo(proverb));
    setStep('verify');
  };

  // Copy to clipboard
  const copyToClipboard = async (text: string, type: 'proverb' | 'memo') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      setError('Failed to copy to clipboard');
    }
  };

  // Render step content
  const renderStep = () => {
    switch (step) {
      case 'read':
        return (
          <div className="flow-step read-step">
            <h2>📖 Step 1: Read the Story</h2>
            <div className="story-container">
              <h3>{act.title}</h3>
              <p className="narrative">{act.narrative}</p>
              <p className="theme">
                <strong>Theme:</strong> {act.theme}
              </p>
            </div>
            <p className="instruction">
              Take a moment to absorb the story of Soulbae and Soulbis. 
              When you feel you understand the teaching, proceed to form your proverb.
            </p>
            <button 
              className="primary-button"
              onClick={() => setStep('form')}
            >
              I understand the story →
            </button>
          </div>
        );

      case 'form':
        return (
          <div className="flow-step form-step">
            <h2>✍️ Step 2: Form Your Proverb</h2>
            <p className="instruction">
              Express the wisdom from this story in your own words. 
              This isn't about memorizing — it's about demonstrating understanding.
            </p>
            <textarea
              value={proverb}
              onChange={(e) => setProverb(e.target.value)}
              placeholder="Write your interpretation of the teaching..."
              rows={4}
              className="proverb-input"
            />
            <div className="char-count">
              {proverb.length} / 400 characters
            </div>
            {error && <p className="error">{error}</p>}
            <div className="button-group">
              <button 
                className="secondary-button"
                onClick={() => setStep('read')}
              >
                ← Back to story
              </button>
              <button 
                className="primary-button"
                onClick={handleProverbSubmit}
                disabled={proverb.length < 10}
              >
                Verify proverb →
              </button>
            </div>
          </div>
        );

      case 'verify':
        return (
          <div className="flow-step verify-step">
            <h2>✓ Step 3: Verify Your Proverb</h2>
            <div className="proverb-display">
              <p className="label">Your proverb:</p>
              <blockquote>{proverb}</blockquote>
              <button
                className={`copy-button ${copied === 'proverb' ? 'copied' : ''}`}
                onClick={() => copyToClipboard(proverb, 'proverb')}
              >
                {copied === 'proverb' ? '✓ Copied!' : '📋 Copy proverb'}
              </button>
            </div>
            <p className="instruction">
              Does this capture your understanding? If so, proceed to get your transaction memo.
            </p>
            <div className="button-group">
              <button 
                className="secondary-button"
                onClick={() => setStep('form')}
              >
                ← Edit proverb
              </button>
              <button 
                className="primary-button"
                onClick={() => setStep('copy')}
              >
                Generate memo →
              </button>
            </div>
          </div>
        );

      case 'copy':
        return (
          <div className="flow-step copy-step">
            <h2>📝 Step 4: Copy Transaction Memo</h2>
            <div className="memo-display">
              <p className="label">Transaction memo:</p>
              <code className="memo-code">{memo}</code>
              <button
                className={`copy-button large ${copied === 'memo' ? 'copied' : ''}`}
                onClick={() => copyToClipboard(memo, 'memo')}
              >
                {copied === 'memo' ? '✓ Copied!' : '📋 Copy memo to clipboard'}
              </button>
            </div>
            
            <div className="address-display">
              <p className="label">Send to this shielded address:</p>
              <code className="z-address">{act.zAddress}</code>
              <button
                className="copy-button"
                onClick={() => copyToClipboard(act.zAddress, 'memo')}
              >
                📋 Copy address
              </button>
            </div>

            <div className="button-group">
              <button 
                className="secondary-button"
                onClick={() => setStep('verify')}
              >
                ← Back
              </button>
              <button 
                className="primary-button"
                onClick={() => setStep('send')}
              >
                I've copied everything →
              </button>
            </div>
          </div>
        );

      case 'send':
        return (
          <div className="flow-step send-step">
            <h2>💎 Step 5: Send via Zashi</h2>
            
            <div className="zashi-instructions">
              <ol>
                <li>
                  <strong>Open Zashi wallet</strong> on your device
                </li>
                <li>
                  <strong>Start a new transaction</strong> (Send)
                </li>
                <li>
                  <strong>Paste the z-address</strong> you copied:
                  <code className="inline-code">{act.zAddress.slice(0, 20)}...</code>
                </li>
                <li>
                  <strong>Enter your donation amount</strong> (any amount works)
                </li>
                <li>
                  <strong>Add the memo</strong> - paste what you copied:
                  <code className="inline-code">{memo.slice(0, 30)}...</code>
                </li>
                <li>
                  <strong>Send the transaction</strong>
                </li>
              </ol>
            </div>

            <div className="privacy-note">
              <h4>🛡️ Privacy Note</h4>
              <p>
                Your transaction is fully shielded. The oracle can verify your proverb 
                matches the spellbook, but cannot see your identity or link this to 
                other transactions. This is the Mage's gift: sight without control.
              </p>
            </div>

            <div className="golden-split">
              <h4>⚖️ Golden Split</h4>
              <p>
                Once verified, your donation splits according to the golden ratio:
              </p>
              <ul>
                <li><strong>61.8%</strong> → Sanctuary (visible signal of support)</li>
                <li><strong>38.2%</strong> → Protocol (infrastructure, stays shielded)</li>
              </ul>
            </div>

            <div className="completion">
              <button 
                className="primary-button"
                onClick={() => {
                  onComplete?.({
                    actId: act.id,
                    proverb,
                    memo,
                    zAddress: act.zAddress,
                    timestamp: Date.now()
                  });
                }}
              >
                ✨ I've sent my donation
              </button>
              <button 
                className="secondary-button"
                onClick={() => setStep('copy')}
              >
                ← Back to memo
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="donation-flow">
      {/* Progress indicator */}
      <div className="progress-bar">
        {(['read', 'form', 'verify', 'copy', 'send'] as FlowStep[]).map((s, i) => (
          <div 
            key={s}
            className={`progress-step ${step === s ? 'active' : ''} ${
              ['read', 'form', 'verify', 'copy', 'send'].indexOf(step) > i ? 'completed' : ''
            }`}
          >
            <span className="step-number">{i + 1}</span>
            <span className="step-label">{s.charAt(0).toUpperCase() + s.slice(1)}</span>
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="step-content">
        {renderStep()}
      </div>
    </div>
  );
};

/**
 * Styles (would normally be in a separate CSS file)
 */
export const DonationFlowStyles = `
.donation-flow {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  font-family: system-ui, -apple-system, sans-serif;
}

.progress-bar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 30px;
}

.progress-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  opacity: 0.5;
}

.progress-step.active {
  opacity: 1;
}

.progress-step.completed {
  opacity: 0.8;
}

.step-number {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.progress-step.active .step-number {
  background: #6366f1;
  color: white;
}

.progress-step.completed .step-number {
  background: #22c55e;
  color: white;
}

.flow-step {
  padding: 20px;
  background: #f9fafb;
  border-radius: 12px;
}

.story-container {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin: 20px 0;
}

.narrative {
  font-style: italic;
  color: #4b5563;
  line-height: 1.8;
}

.proverb-input {
  width: 100%;
  padding: 15px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 16px;
  resize: vertical;
}

.proverb-input:focus {
  border-color: #6366f1;
  outline: none;
}

.button-group {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.primary-button {
  background: #6366f1;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
}

.primary-button:hover {
  background: #4f46e5;
}

.secondary-button {
  background: white;
  color: #374151;
  border: 2px solid #e5e7eb;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
}

.copy-button {
  background: #1f2937;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  margin-top: 10px;
}

.copy-button.copied {
  background: #22c55e;
}

.memo-code, .z-address {
  display: block;
  background: #1f2937;
  color: #22c55e;
  padding: 15px;
  border-radius: 8px;
  font-family: monospace;
  font-size: 14px;
  word-break: break-all;
}

.error {
  color: #dc2626;
  margin-top: 10px;
}

.privacy-note, .golden-split {
  background: white;
  padding: 15px;
  border-radius: 8px;
  margin-top: 20px;
}

.golden-split ul {
  margin: 10px 0;
  padding-left: 20px;
}

.zashi-instructions ol {
  line-height: 2;
}

.inline-code {
  background: #e5e7eb;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
}
`;

export default DonationFlow;
