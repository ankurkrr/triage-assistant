'use client';

import React, { useState } from 'react';
import type { TriageResult, ApiErrorResponse } from '@/lib/triage/types';

const SAMPLE_REQUESTS = [
  {
    label: '⚡ Slow loading',
    text: 'The website is loading very slowly for several of our users.',
  },
  {
    label: '🔒 Cannot log in',
    text: 'A customer reports they cannot log in to the portal.',
  },
  {
    label: '💳 Invoice incorrect',
    text: 'An invoice amount appears incorrect on our account.',
  },
  {
    label: '🤝 Partnership',
    text: 'We would like to explore a potential partnership with your team.',
  },
  {
    label: '🚨 Access removal',
    text: 'Immediate access removal requested for former employee credentials.',
  },
  {
    label: '💼 Pricing request',
    text: 'Please provide pricing details for enterprise plans.',
  },
];

export default function HomePage() {
  const [requestText, setRequestText] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<TriageResult | null>(null);
  const [draftResponse, setDraftResponse] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isAnalyzing = status === 'loading';

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = requestText.trim();

    if (!trimmed) {
      setStatus('error');
      setErrorMessage('Please enter a business request to analyze.');
      return;
    }

    setStatus('loading');
    setErrorMessage(null);
    setCopied(false);

    try {
      const response = await fetch('/api/triage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ request: trimmed }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorData = data as ApiErrorResponse;
        const msg =
          errorData?.error?.message ||
          'Something went wrong while analyzing the request. Please try again.';
        setStatus('error');
        setErrorMessage(msg);
        return;
      }

      const triageResult = data as TriageResult;
      setResult(triageResult);
      setDraftResponse(triageResult.draftResponse);
      setStatus('success');
    } catch {
      setStatus('error');
      setErrorMessage(
        'Unable to connect to the analysis service. Please verify your connection and try again.'
      );
    }
  };

  const handleReset = () => {
    setRequestText('');
    setResult(null);
    setDraftResponse('');
    setStatus('idle');
    setErrorMessage(null);
    setCopied(false);
  };

  const handleCopyDraft = async () => {
    if (!draftResponse) return;
    try {
      await navigator.clipboard.writeText(draftResponse);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback for non-supported clipboard API
    }
  };

  const getPriorityTagClass = (priority: string) => {
    switch (priority) {
      case 'Urgent':
        return 'tag-priority-urgent';
      case 'High':
        return 'tag-priority-high';
      case 'Medium':
        return 'tag-priority-medium';
      case 'Low':
      default:
        return 'tag-priority-low';
    }
  };

  const getPriorityIndicatorClass = (priority: string) => {
    switch (priority) {
      case 'Urgent':
        return 'indicator-urgent';
      case 'High':
        return 'indicator-high';
      case 'Medium':
        return 'indicator-medium';
      case 'Low':
      default:
        return 'indicator-low';
    }
  };

  return (
    <main className="container">
      <header className="header">
        <div className="header-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
          <span>Intelligent Triage Engine</span>
        </div>
        <h1>AI Request Triage Assistant</h1>
        <p>
          Transform unstructured business requests into clear summaries, categorization, priority rankings, and reviewable draft responses.
        </p>
      </header>

      <section className="card" aria-labelledby="form-heading">
        <div className="card-title-row">
          <h2 id="form-heading" className="card-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#818cf8' }} aria-hidden="true">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span>Input Request</span>
          </h2>
          {requestText.length > 0 && (
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              {requestText.trim().length.toLocaleString()} characters
            </span>
          )}
        </div>

        <form onSubmit={handleAnalyze}>
          <div className="form-group">
            <label htmlFor="request-input" className="form-label">
              Enter or paste a customer, client, or internal request
            </label>
            <textarea
              id="request-input"
              className="textarea"
              placeholder="e.g. Our customer portal is returning errors when users try to log in and staff cannot access active records..."
              value={requestText}
              onChange={(e) => setRequestText(e.target.value)}
              disabled={isAnalyzing}
              aria-invalid={status === 'error' && !requestText.trim()}
              rows={5}
            />
          </div>

          <div className="sample-prompts">
            <div className="sample-prompts-title">Select a sample mock request to test:</div>
            <div className="sample-buttons">
              {SAMPLE_REQUESTS.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="sample-btn"
                  onClick={() => {
                    setRequestText(sample.text);
                    if (status === 'error') {
                      setStatus('idle');
                      setErrorMessage(null);
                    }
                  }}
                  disabled={isAnalyzing}
                >
                  {sample.label}
                </button>
              ))}
            </div>
          </div>

          {status === 'error' && errorMessage && (
            <div className="status-banner status-error" role="alert">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}

          {isAnalyzing && (
            <div className="status-banner status-loading" aria-live="polite" aria-busy="true">
              <span className="spinner" aria-hidden="true" />
              <span>Analyzing business context, urgency, and routing…</span>
            </div>
          )}

          <div className="actions" style={{ marginTop: '1.5rem' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isAnalyzing || !requestText.trim()}
            >
              {isAnalyzing ? (
                <>
                  <span className="spinner" aria-hidden="true" style={{ width: '0.875rem', height: '0.875rem' }} />
                  <span>Analyzing…</span>
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                  <span>Analyze Request</span>
                </>
              )}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleReset}
              disabled={isAnalyzing || (!requestText && !result && !errorMessage)}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              <span>Clear</span>
            </button>
          </div>
        </form>
      </section>

      {status === 'success' && result && (
        <section className="card result-card" aria-labelledby="result-heading">
          <div className="card-title-row">
            <h2 id="result-heading" className="card-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#34d399' }} aria-hidden="true">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span>Triage Recommendation</span>
            </h2>
            <span style={{ fontSize: '0.8125rem', color: '#34d399', fontWeight: 600 }}>
              ✓ Complete
            </span>
          </div>

          <div className="badges-grid">
            <div className="badge-card">
              <div className="badge-label">Category</div>
              <div className="badge-value">
                <span className="tag tag-category">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                    <line x1="7" y1="7" x2="7.01" y2="7" />
                  </svg>
                  {result.category}
                </span>
              </div>
            </div>

            <div className="badge-card">
              <div className="badge-label">Priority</div>
              <div className="badge-value">
                <span className={`tag ${getPriorityTagClass(result.priority)}`}>
                  <span className={`badge-tag-indicator ${getPriorityIndicatorClass(result.priority)}`} aria-hidden="true" />
                  {result.priority}
                </span>
              </div>
            </div>

            <div className="badge-card">
              <div className="badge-label">Recommended Owner</div>
              <div className="badge-value">
                <span className="tag tag-owner">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  {result.owner}
                </span>
              </div>
            </div>
          </div>

          <div className="field-block">
            <div className="field-title">
              <span>Executive Summary</span>
            </div>
            <p className="field-content">{result.summary}</p>
          </div>

          <div className="field-block">
            <div className="field-title">
              <span>Priority Rationale</span>
            </div>
            <p className="field-content">{result.priorityReason}</p>
          </div>

          <div className="field-block">
            <div className="field-title">
              <label htmlFor="draft-response">Draft First Response</label>
              <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                Editable for human review
              </span>
            </div>
            <div className="draft-wrapper">
              <textarea
                id="draft-response"
                className="textarea draft-textarea"
                value={draftResponse}
                onChange={(e) => setDraftResponse(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <div className="actions" style={{ marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleCopyDraft}
            >
              {copied ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  <span>Copy Draft Response</span>
                </>
              )}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleReset}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
              <span>Analyze Another Request</span>
            </button>
          </div>
        </section>
      )}
    </main>
  );
}


