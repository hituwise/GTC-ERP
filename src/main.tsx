import { Component, ReactNode, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  declare props: ErrorBoundaryProps;
  declare state: ErrorBoundaryState;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("Uncaught application error:", error, errorInfo);
  }

  render() {
    if (this.state && (this.state as ErrorBoundaryState).hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '1rem', border: '1px solid #e2e8f0', maxWidth: '480px', width: '100%', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>Application Notice</h2>
            <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.5rem' }}>
              The application encountered a temporary load issue. Click below to reload.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{ backgroundColor: '#4f46e5', color: 'white', fontWeight: 700, padding: '0.75rem 1.5rem', borderRadius: '0.75rem', border: 'none', cursor: 'pointer', fontSize: '0.875rem' }}
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Global API Fetch Interceptor to attach multi-tenant identity headers
const originalFetch = window.fetch;
const customFetch = async function (this: any, input: RequestInfo | URL, init?: RequestInit) {
  let url = "";
  if (typeof input === "string") {
    url = input;
  } else if (input instanceof URL) {
    url = input.toString();
  } else if (input && typeof input === "object" && "url" in input) {
    url = (input as any).url;
  }

  if (url && (url.startsWith("/api/") || url.includes("/api/"))) {
    const saved = localStorage.getItem("erp_logged_in_user");
    if (saved) {
      try {
        const user = JSON.parse(saved);
        if (user && user.email) {
          init = init || {};
          let headersObj: any = {};
          if (init.headers) {
            if (init.headers instanceof Headers) {
              init.headers.forEach((value, key) => {
                headersObj[key] = value;
              });
            } else if (Array.isArray(init.headers)) {
              init.headers.forEach(([key, value]) => {
                headersObj[key] = value;
              });
            } else {
              headersObj = { ...init.headers };
            }
          }
          headersObj["x-logged-in-user-email"] = user.email;
          headersObj["x-logged-in-user-role"] = user.role;
          init.headers = headersObj;
        }
      } catch (e) {
        console.error("Error setting headers in fetch interceptor:", e);
      }
    }
  }
  return originalFetch.call(window, input, init);
};

try {
  Object.defineProperty(window, 'fetch', {
    value: customFetch,
    writable: true,
    configurable: true,
    enumerable: true
  });
} catch (e) {
  console.warn("Failed to intercept window.fetch via Object.defineProperty, trying globalThis:", e);
  try {
    (globalThis as any).fetch = customFetch;
  } catch (err) {
    console.error("Critical error: fetch cannot be intercepted:", err);
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

// Register PWA Service Worker for mobile device installation
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("[PWA] Service Worker registered successfully with scope:", registration.scope);
      })
      .catch((error) => {
        console.error("[PWA] Service Worker registration failed:", error);
      });
  });
}


