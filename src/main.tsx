import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>    {/* ✅ Capitalized - matches import */}
    <App />       {/* ✅ Capitalized - matches import */}
  </StrictMode>,
);
