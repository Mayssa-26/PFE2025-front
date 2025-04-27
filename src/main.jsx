import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Ton composant principal
import './index.css'; // Si tu utilises du CSS global

// Créer l'élément racine du DOM
const root = ReactDOM.createRoot(document.getElementById('root'));

// Rendu de l'application
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
