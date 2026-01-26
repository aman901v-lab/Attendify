import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  console.error("Critical rendering error:", error);
  rootElement.innerHTML = `<div style="color: white; padding: 20px; text-align: center;">
    <h2 style="color: #ef4444;">Initialization Error</h2>
    <p>Please check your internet connection or try refreshing the page.</p>
    <pre style="font-size: 10px; opacity: 0.5;">${error}</pre>
  </div>`;
}