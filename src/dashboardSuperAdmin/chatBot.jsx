import { useState, useEffect } from 'react';
import './chatbot.css';

const AdvancedTraccarChatbot = () => {
  // États de l'application
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState({ vehicles: false, chat: false });
  const [error, setError] = useState(null);
  const [userInput, setUserInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  // Configuration des APIs
  const apiConfig = {
    traccar: {
      baseUrl: '/api',
      auth: 'Basic ' + btoa('admin:admin')
    },
    chatbot: {
      url: 'https://api.aimlapi.com/v1/chat/completions',
      apiKey: 'fbf7876ed15740298dade659d9279a22'
    }
  };

  // Domaines de compétence du chatbot
  const EXPERTISE_DOMAINS = [
    'géolocalisation de véhicules',
    'suivi GPS en temps réel',
    'historique des trajets',
    'analyse des distances parcourues',
    'calcul des vitesses moyennes',
    'gestion de flotte automobile',
    'optimisation des trajets',
    'géofencing et zones d\'intérêt',
    'rapports de consommation de carburant',
    'alertes et notifications Traccar'
  ];

  // Récupérer la liste des véhicules depuis Traccar
  const fetchVehicles = async () => {
    try {
      setLoading(prev => ({ ...prev, vehicles: true }));
      const response = await fetch(`${apiConfig.traccar.baseUrl}/devices`, {
        headers: {
          'Authorization': apiConfig.traccar.auth,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error(`Erreur ${response.status}`);
      
      const data = await response.json();
      setVehicles(data);
    } catch (err) {
      setError(`Erreur de chargement des véhicules: ${err.message}`);
    } finally {
      setLoading(prev => ({ ...prev, vehicles: false }));
    }
  };

  // Envoyer une question à l'API de chat
  const askChatbot = async (question) => {
    try {
      setLoading(prev => ({ ...prev, chat: true }));
      
      const response = await fetch(apiConfig.chatbot.url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiConfig.chatbot.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{
            role: 'system',
            content: `Tu es un expert en ${EXPERTISE_DOMAINS.join(', ')}. 
                      Réponds de manière concise et technique aux questions.
                      Pour les questions sur des véhicules spécifiques, demande des précisions si besoin.`
          }, {
            role: 'user',
            content: question
          }],
          max_tokens: 500
        })
      });
      
      if (!response.ok) throw new Error(`Erreur API ${response.status}`);
      
      const data = await response.json();
      return data.choices[0].message.content;
    } catch (err) {
      console.error('Erreur API chatbot:', err);
      return `Désolé, je n'ai pas pu obtenir de réponse. Erreur: ${err.message}`;
    } finally {
      setLoading(prev => ({ ...prev, chat: false }));
    }
  };

  // Détecter si la question concerne un véhicule spécifique
  const isVehicleQuestion = (question) => {
    return question.match(/véhicule|voiture|trajet|distance|vitesse|position|gps/i) && 
           vehicles.some(v => question.includes(v.id.toString()) || question.includes(v.name.toLowerCase()));
  };

  // Générer une réponse adaptée
  const generateResponse = async (question) => {
    // Réponses prédéfinies pour les questions techniques sur Traccar
    if (question.match(/comment.*traccar|fonctionnement.*traccar/i)) {
      return `Traccar est une plateforme open source de suivi GPS. Elle permet:
             - Le suivi en temps réel des véhicules
             - L'enregistrement des historiques de trajets
             - La génération de rapports détaillés
             - La configuration d'alertes et notifications`;
    }

    // Si la question concerne un véhicule spécifique
    if (isVehicleQuestion(question)) {
      return `Pour les questions sur un véhicule spécifique, veuillez préciser:
             - L'identifiant ou le nom du véhicule
             - La période concernée
             Ex: "Quel est le trajet du véhicule 123 hier ?"`;
    }

    // Pour les autres questions, utiliser l'API de chat
    return await askChatbot(question);
  };

  // Gérer l'envoi des questions
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || loading.chat) return;
    
    // Ajouter la question de l'utilisateur
    const userMessage = { text: userInput, sender: 'user' };
    setChatHistory(prev => [...prev, userMessage]);
    setUserInput('');
    
    // Obtenir et ajouter la réponse
    const response = await generateResponse(userInput);
    const botMessage = { text: response, sender: 'bot' };
    setChatHistory(prev => [...prev, botMessage]);
  };

  // Charger les véhicules au démarrage
  useEffect(() => { fetchVehicles(); }, []);

  return (
    <div className="chatbot-container">
      <header className="chatbot-header">
        <h1>Assistant Traccar Expert</h1>
        <p>Je peux répondre à vos questions sur {EXPERTISE_DOMAINS.join(', ')}</p>
      </header>

      <div className="chatbot-main">
        <div className="vehicle-panel">
          <h2>Véhicules disponibles ({vehicles.length})</h2>
          {loading.vehicles ? (
            <p>Chargement...</p>
          ) : error ? (
            <p className="error">{error}</p>
          ) : (
            <ul>
              {vehicles.slice(0, 5).map(vehicle => (
                <li key={vehicle.id}>
                  <span className="vehicle-name">{vehicle.name}</span>
                  <span className="vehicle-id">ID: {vehicle.id}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="chat-panel">
          <div className="chat-history">
            {chatHistory.length === 0 ? (
              <div className="welcome-message">
                <p>Posez-moi vos questions sur :</p>
                <ul>
                  {EXPERTISE_DOMAINS.map((domain, i) => (
                    <li key={i}>{domain}</li>
                  ))}
                </ul>
              </div>
            ) : (
              chatHistory.map((msg, i) => (
                <div key={i} className={`message ${msg.sender}`}>
                  {msg.text}
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleSubmit} className="chat-input-form">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder={`Posez une question sur ${EXPERTISE_DOMAINS[Math.floor(Math.random() * EXPERTISE_DOMAINS.length)]}...`}
              disabled={loading.chat}
            />
            <button type="submit" disabled={loading.chat}>
              {loading.chat ? 'Envoi...' : 'Envoyer'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdvancedTraccarChatbot;