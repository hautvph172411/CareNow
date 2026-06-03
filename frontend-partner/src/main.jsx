import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/globals.css';

window.addEventListener('error', (event) => {
  document.body.innerHTML += `<div style="position:fixed;top:0;left:0;right:0;background:red;color:white;z-index:9999;padding:20px;font-family:monospace;white-space:pre-wrap;">
    <h3>Crash Report (Error):</h3>
    ${event.error ? event.error.stack : event.message}
  </div>`;
});

window.addEventListener('unhandledrejection', (event) => {
  document.body.innerHTML += `<div style="position:fixed;top:0;left:0;right:0;background:darkred;color:white;z-index:9999;padding:20px;font-family:monospace;white-space:pre-wrap;">
    <h3>Crash Report (Promise Rejection):</h3>
    ${event.reason?.stack || event.reason}
  </div>`;
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
