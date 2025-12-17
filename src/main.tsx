import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initSentry, Sentry } from './sentry';
import App from './App';
import './index.css';
import './styles/analytics.css';

// Initialize Sentry before rendering
initSentry();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<p>An error occurred</p>}>
      <App />
    </Sentry.ErrorBoundary>
  </StrictMode>
);
