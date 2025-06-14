
import React from 'react'; // Ajout de l'import React manquant
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './contexts/AuthContext.tsx'; // Ajout de AuthProvider
import { BrowserRouter } from "react-router-dom"; // BrowserRouter sera ici

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter> {/* BrowserRouter englobe AuthProvider et App */}
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
