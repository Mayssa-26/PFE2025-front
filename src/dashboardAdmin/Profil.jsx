import { useEffect, useState } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { useNavigate, useLocation } from "react-router-dom";
import Sidebar from  "./Sidebar";
import Navbar from  "./Navbar";
import Register from "../register/Register";

const UserProfile = () => {
  const [adminData, setAdminData] = useState({
    nom: "",
    prenom: "",
    email: "",
    cin: "",
    adresse: "",
    NumTel: "",
    dateNaissance: "",
    role: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      let decoded;
      try {
        decoded = jwt_decode(token);
      } catch (decodeError) {
        console.error("Erreur de décodage du token:", decodeError);
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      if (!decoded.id) {
        throw new Error("ID admin manquant dans le token");
      }

      const response = await axios.get(`http://localhost:8000/api/user/${decoded.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.data) {
        throw new Error("Réponse vide du serveur");
      }

      setAdminData({
        nom: response.data.nom || "Non spécifié",
        prenom: response.data.prenom || "Non spécifié",
        email: response.data.email || "Non spécifié",
        cin: response.data.cin || "Non spécifié",
        adresse: response.data.adresse || "Non spécifié",
        NumTel: response.data.NumTel || "Non spécifié",
        dateNaissance: response.data.dateNaissance || "",
        role: response.data.role || "Non spécifié",
      });
    } catch (error) {
      console.error("Erreur complète:", error);
      if (error.response) {
        if (error.response.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
          setError("Session expirée. Veuillez vous reconnecter.");
        } else {
          setError(`Erreur serveur: ${error.response.data.message || "Erreur inconnue"}`);
        }
      } else if (error.request) {
        setError("Le serveur ne répond pas. Vérifiez votre connexion.");
      } else {
        setError(`Erreur: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (location.state?.updated) {
      fetchAdminData();
    } else {
      fetchAdminData();
    }
  }, [location.state, navigate]);

  const formatDate = (dateString) => {
    if (!dateString) return "Non spécifié";
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const handleEditClick = () => {
    setEditingAdmin(adminData);
  };

  const handleEditSave = async (updatedData) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const decoded = jwt_decode(token);
      await axios.put(`http://localhost:8000/api/user/updateAdmin/${decoded.id}`, updatedData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setEditingAdmin(null);
      fetchAdminData();
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      setError("Échec de la mise à jour du profil");
    }
  };

  const handleEditCancel = () => {
    setEditingAdmin(null);
  };

  if (loading) {
    return (
      <div className="dashboard-admin">
        <Sidebar />
        <div className="main-content">
          <Navbar />
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Chargement du profil...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-admin">
        <Sidebar />
        <div className="main-content">
          <Navbar />
          <div className="error-container">
            <div className="error-icon">⚠️</div>
            <div className="error-message">{error}</div>
            <button onClick={() => window.location.reload()} className="retry-button">
              <span className="retry-icon">🔄</span>
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-admin">
      <style>
        {`
          /* Variables CSS améliorées */
          :root {
            --primary-gradient: linear-gradient(135deg,rgb(30, 48, 130) 0%,rgb(54, 22, 118) 100%);
            --secondary-gradient: linear-gradient(135deg,rgb(95, 45, 161) 0%,rgb(75, 23, 153) 100%);
            --success-gradient: linear-gradient(135deg,rgb(24, 68, 106) 0%,rgb(26, 96, 99) 100%);
            --accent-color: #6366f1;
            --text-primary: #1f2937;
            --text-secondary: #6b7280;
            --text-muted: #9ca3af;
            --bg-primary: #f8fafc;
            --bg-secondary: #ffffff;
            --border-color: #e5e7eb;
            --border-radius: 16px;
            --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
            --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
            --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
            --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
            --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }

          /* Reset et styles de base */
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: var(--bg-primary);
            color: var(--text-primary);
            line-height: 1.6;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }

          /* Layout principal */
          .dashboard-admin {
            display: flex;
            min-height: 100vh;
            background: var(--bg-primary);
          }

          .main-content {
            flex: 1;
            margin-left: 250px;
            padding: 2rem;
            transition: var(--transition);
            background: var(--bg-primary);
          }

          /* Container du profil */
          .profile-container {
            max-width: 1200px;
            margin: 0 auto;
            animation: fadeInUp 0.6s ease-out;
            margin-top: 2rem;
          }

          /* En-tête */
          .profile-header {
            text-align: center;
            margin-bottom: 3rem;
            padding: 2rem 0;
            position: relative;
          }

          .profile-header h1 {
            font-size: 3rem;
            font-weight: 800;
            background: var(--primary-gradient);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
            margin-bottom: 0.5rem;
            letter-spacing: -0.025em;
          }

          .profile-header::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 100px;
            height: 4px;
            background: var(--primary-gradient);
            border-radius: 2px;
            opacity: 0.8;
          }

          /* Grille des sections */
          .profile-content {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 2rem;
            margin-bottom: 2rem;
          }

          /* Sections du profil */
          .profile-section {
            background: var(--bg-secondary);
            border-radius: var(--border-radius);
            border: 1px solid var(--border-color);
            box-shadow: var(--shadow-md);
            overflow: hidden;
            transition: var(--transition);
            position: relative;
          }

          .profile-section:hover {
            transform: translateY(-4px);
            box-shadow: var(--shadow-xl);
            border-color: var(--accent-color);
          }

          /* En-têtes des sections */
          .profile-section h2 {
            padding: 1.5rem 2rem;
            margin: 0;
            font-size: 1.25rem;
            font-weight: 700;
            color: white;
            position: relative;
            overflow: hidden;
          }

          .profile-section:nth-child(1) h2 {
            background: var(--primary-gradient);
          }

          .profile-section:nth-child(2) h2 {
            background: var(--success-gradient);
          }

          .profile-section:nth-child(3) h2 {
            background: var(--secondary-gradient);
          }

          .profile-section h2::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            transition: left 0.5s;
          }

          .profile-section:hover h2::before {
            left: 100%;
          }

          /* Contenu des sections */
          .profile-info {
            padding: 2rem;
          }

          /* Éléments d'information */
          .info-item {
            display: flex;
            flex-direction: column;
            padding: 1rem 0;
            border-bottom: 1px solid var(--border-color);
            transition: var(--transition);
          }

          .info-item:last-child {
            border-bottom: none;
            padding-bottom: 0;
          }

          .info-item:hover {
            transform: translateX(4px);
            padding-left: 0.5rem;
          }

          .info-label {
            font-size: 0.875rem;
            font-weight: 600;
            color: var(--accent-color);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 0.25rem;
            display: flex;
            align-items: center;
          }

          .info-label::before {
            content: '';
            width: 6px;
            height: 6px;
            background: var(--accent-color);
            border-radius: 50%;
            margin-right: 0.5rem;
            opacity: 0.7;
          }

          .info-value {
            font-size: 1.125rem;
            font-weight: 500;
            color: var(--text-primary);
            word-break: break-word;
            line-height: 1.5;
          }

          /* Bouton d'édition */
          .edit-button-container {
            display: flex;
            justify-content: center;
            margin-top: 2rem;
          }

          .edit-button {
            background: var(--primary-gradient);
            color: white;
            border: none;
            padding: 1rem 2rem;
            border-radius: 50px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: var(--transition);
            box-shadow: var(--shadow-md);
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            position: relative;
            overflow: hidden;
          }

          .edit-button::before {
            content: '✏️';
            font-size: 1.1rem;
          }

          .edit-button:hover {
            transform: translateY(-2px) scale(1.05);
            box-shadow: var(--shadow-xl);
          }

          .edit-button:active {
            transform: translateY(0) scale(0.98);
          }

          /* Modal */
          .edit-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.75);
            backdrop-filter: blur(4px);
            z-index: 1000;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 1rem;
            animation: fadeIn 0.3s ease;
          }

          .edit-modal {
            background: var(--bg-secondary);
            border-radius: var(--border-radius);
            box-shadow: var(--shadow-xl);
            width: 100%;
            max-width: 800px;
            max-height: 90vh;
            overflow-y: auto;
            animation: slideUp 0.3s ease;
          }

          /* États de chargement */
          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 60vh;
            gap: 1rem;
          }

          .loading-spinner {
            width: 48px;
            height: 48px;
            border: 4px solid var(--border-color);
            border-top-color: var(--accent-color);
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          .loading-container p {
            font-size: 1.125rem;
            color: var(--text-secondary);
            font-weight: 500;
          }

          /* États d'erreur */
          .error-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 60vh;
            gap: 1.5rem;
            text-align: center;
            padding: 2rem;
          }

          .error-icon {
            font-size: 4rem;
            opacity: 0.8;
          }

          .error-message {
            color: var(--text-secondary);
            font-size: 1.125rem;
            line-height: 1.6;
            max-width: 500px;
            padding: 1.5rem;
            background: rgba(239, 68, 68, 0.05);
            border: 1px solid rgba(239, 68, 68, 0.1);
            border-radius: var(--border-radius);
          }

          .retry-button {
            background: var(--primary-gradient);
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 50px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: var(--transition);
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            box-shadow: var(--shadow-md);
          }

          .retry-button:hover {
            transform: translateY(-2px);
            box-shadow: var(--shadow-lg);
          }

          .retry-icon {
            font-size: 1.1rem;
          }

          /* Animations */
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(50px) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @keyframes spin {
            to { transform: rotate(360deg); }
          }

          /* Responsive Design */
          @media (max-width: 1024px) {
            .main-content {
              margin-left: 0;
              padding: 1.5rem;
            }
          }

          @media (max-width: 768px) {
            .main-content {
              padding: 1rem;
            }

            .profile-header h1 {
              font-size: 2.5rem;
            }

            .profile-content {
              grid-template-columns: 1fr;
              gap: 1.5rem;
            }

            .profile-section h2 {
              padding: 1.25rem 1.5rem;
              font-size: 1.125rem;
            }

            .profile-info {
              padding: 1.5rem;
            }

            .edit-modal {
              margin: 1rem;
              max-width: calc(100% - 2rem);
            }
          }

          @media (max-width: 480px) {
            .profile-header h1 {
              font-size: 2rem;
            }

            .profile-section h2 {
              padding: 1rem;
            }

            .profile-info {
              padding: 1rem;
            }

            .info-value {
              font-size: 1rem;
            }
          }

          /* Mode sombre */
          @media (prefers-color-scheme: dark) {
            :root {
              --text-primary: #f9fafb;
              --text-secondary: #d1d5db;
              --text-muted: #9ca3af;
              --bg-primary: #111827;
              --bg-secondary: #1f2937;
              --border-color: #374151;
            }

            .profile-section {
              border-color: var(--border-color);
            }

            .info-item {
              border-color: var(--border-color);
            }

            .error-message {
              background: rgba(239, 68, 68, 0.1);
              border-color: rgba(239, 68, 68, 0.2);
              color: var(--text-secondary);
            }
          }
        `}
      </style>
      
      <Sidebar />
      <div className="main-content">
        <Navbar />
        <div className="profile-container">
          <div className="profile-header">
            <h1>Profil Administrateur</h1>
          </div>

          <div className="profile-content">
            <div className="profile-section">
              <h2>Informations Personnelles</h2>
              <div className="profile-info">
                <div className="info-item">
                  <span className="info-label">Nom</span>
                  <span className="info-value">{adminData.nom}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Prénom</span>
                  <span className="info-value">{adminData.prenom}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Email</span>
                  <span className="info-value">{adminData.email}</span>
                </div>
              </div>
            </div>

            <div className="profile-section">
              <h2>Coordonnées</h2>
              <div className="profile-info">
                <div className="info-item">
                  <span className="info-label">Adresse</span>
                  <span className="info-value">{adminData.adresse}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Téléphone</span>
                  <span className="info-value">{adminData.NumTel}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Date de naissance</span>
                  <span className="info-value">{formatDate(adminData.dateNaissance)}</span>
                </div>
              </div>
            </div>

            <div className="profile-section">
              <h2>Informations Administratives</h2>
              <div className="profile-info">
                <div className="info-item">
                  <span className="info-label">CIN</span>
                  <span className="info-value">{adminData.cin}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Rôle</span>
                  <span className="info-value">{adminData.role}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="edit-button-container">
            <button onClick={handleEditClick} className="edit-button">
              Modifier le profil
            </button>
          </div>

          {editingAdmin && (
            <div className="edit-modal-overlay" onClick={handleEditCancel}>
              <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
                <Register
                  initialData={editingAdmin}
                  onSubmit={handleEditSave}
                  onCancel={handleEditCancel}
                  isEditMode={true}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;