import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import QrScanner from 'qr-scanner';
import { classifyQR } from './url';
import { detectLocale, languageNames, loadLocale, locales, t, type Locale } from './i18n';
import './style.css';

type Facing = 'environment' | 'user';

function ScannerDialog({ close, translate }: { close: () => void; translate: (key: string) => string }) {
  const video = useRef<HTMLVideoElement>(null);
  const scanner = useRef<QrScanner | null>(null);
  const generation = useRef(0);
  const isOpening = useRef(false);
  const [facing, setFacing] = useState<Facing>('environment');
  const [message, setMessage] = useState('Looking for a QR code…');
  const [result, setResult] = useState<'other' | 'not-url' | null>(null);
  const [error, setError] = useState(false);

  const stop = useCallback(() => {
    ++generation.current;
    const old = scanner.current;
    scanner.current = null;
    if (old) { try { old.stop(); old.destroy(); } catch { /* camera already stopped */ } }
    const element = video.current;
    if (element?.srcObject instanceof MediaStream) {
      element.srcObject.getTracks().forEach(track => track.stop());
      element.srcObject = null;
    }
  }, []);

  const start = useCallback(async (camera: Facing) => {
    stop();
    setResult(null);
    setError(false);
    setMessage('Looking for a QR code…');
    const id = generation.current;
    if (!video.current) return;
    if (!window.isSecureContext) {
      setMessage('Camera needs HTTPS or localhost.'); setError(true); return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setMessage('Camera could not start.'); setError(true); return;
    }
    let instance: QrScanner | null = null;
    try {
      instance = new QrScanner(video.current, scan => {
        if (id !== generation.current || isOpening.current) return;
        const decoded = typeof scan === 'string' ? scan : scan.data;
        const match = classifyQR(decoded);
        if (match.kind === 'slonig' && match.url) {
          isOpening.current = true;
          stop();
          window.location.assign(match.url);
        } else {
          stop();
          setResult(match.kind === 'not-url' ? 'not-url' : 'other');
          setMessage(match.kind === 'other' ? 'This is not Slonig' : 'This is not a web link');
        }
      }, { preferredCamera: camera, returnDetailedScanResult: true, maxScansPerSecond: 8 });
      scanner.current = instance;
      await instance.start();
      if (id !== generation.current) { instance.stop(); instance.destroy(); }
    } catch (e) {
      if (id !== generation.current) return;
      stop();
      const name = e instanceof Error ? e.name : '';
      setMessage(['NotAllowedError', 'PermissionDeniedError', 'SecurityError'].includes(name)
        ? 'Camera blocked. Please allow camera access.'
        : name === 'NotFoundError' ? 'Camera not found.' : 'Camera could not start.');
      setError(true);
    }
  }, [stop]);

  useEffect(() => {
    void start('environment');
    const keyHandler = (event: KeyboardEvent) => { if (event.key === 'Escape') close(); };
    document.addEventListener('keydown', keyHandler);
    return () => { document.removeEventListener('keydown', keyHandler); stop(); };
  }, [start, stop, close]);

  const switchCamera = () => {
    const next = facing === 'environment' ? 'user' : 'environment';
    setFacing(next);
    void start(next);
  };

  return <div className="overlay" onMouseDown={event => { if (event.target === event.currentTarget) close(); }}>
    <section className="dialog" role="dialog" aria-modal="true" aria-label={translate('Scan a QR code')}>
      <header className="dialog-head"><h2>{translate('Scan a QR code')}</h2><button className="close" type="button" onClick={close} aria-label={translate('Close')}>×</button></header>
      <div className="dialog-body">
        <div className="camera-frame" hidden={result !== null}><video ref={video} playsInline muted autoPlay /><div className="aim" aria-hidden="true" /></div>
        <p className="status" role="status" aria-live="polite">{translate(message)}</p>
        <div className="actions">
          {result !== null ? <button className="primary" onClick={() => void start(facing)}>{translate('Scan another')}</button> : <>
            {!error && <button className="secondary" onClick={switchCamera}>{translate('Switch camera')}</button>}
            {error && <button className="primary" onClick={() => void start(facing)}>{translate('Try again')}</button>}
          </>}
        </div>
      </div>
    </section>
  </div>;
}

function App() {
  const [language, setLanguage] = useState<Locale>(detectLocale);
  const [ready, setReady] = useState(false);
  const [opened, setOpened] = useState(false);
  const close = useCallback(() => setOpened(false), []);
  useEffect(() => {
    let active = true;
    void loadLocale(language).then(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, [language]);
  const changeLanguage = (next: Locale) => { setReady(false); setLanguage(next); };
  return <main className="page"><div className="center">
    <button className="scan" type="button" onClick={() => setOpened(true)}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V5a1 1 0 0 1 1-1h4m6 0h4a1 1 0 0 1 1 1v4M4 15v4a1 1 0 0 0 1 1h4m6 0h4a1 1 0 0 0 1-1v-4M8 12h8" /></svg>
      <span>{ready ? t('Scan a QR code') : 'Scan a QR code'}</span>
    </button>
    <nav className="language--selector" aria-label={t('Language')}>
      {locales.map(locale => <button key={locale} className={locale === language ? 'isActive' : ''}
        lang={locale} aria-pressed={locale === language} type="button" onClick={() => changeLanguage(locale)}>{languageNames[locale]}</button>)}
    </nav>
  </div>{opened && <ScannerDialog close={close} translate={t} />}</main>;
}

createRoot(document.getElementById('app')!).render(<App />);
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL }).catch(() => {});
}
