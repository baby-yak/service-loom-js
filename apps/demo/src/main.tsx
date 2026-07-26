import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { app } from './services/app.ts';

//start module

app
  .start()
  .then(() => {
    app.services.app.actions.setStarted(true);
  })
  .catch((e: unknown) => {
    console.log('error stating module', e);
    app.services.app.actions.setStarted(false);
  });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
