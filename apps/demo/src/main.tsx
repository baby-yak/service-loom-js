import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { app } from './services/app.tsx';

//start module
app.events.on('errorStarting', (error) => console.error('errorStarting:', error));
app.events.on('errorStopping', (error) => console.error('errorStopping:', error));
app.start();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
