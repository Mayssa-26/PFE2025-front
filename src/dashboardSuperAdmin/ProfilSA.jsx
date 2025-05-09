import { useEffect, useState } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { useNavigate, useLocation } from "react-router-dom";
import "../dashboardAdmin/Profil.css";
import SidebarSupAdmin from "./SideBarSupAdmin";
import Register from "../register/Register"; // Import manquant ajouté
import NavbarSuperAdmin from "./NavBarSupAdmin";
const SAProfile = () => {
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
  const [editingAdmin, setEditingAdmin] = useState(null); // État manquant ajouté
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
        throw new Error("ID super admin manquant dans le token");
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
    // Vérifier si des données mises à jour sont passées via state
    if (location.state?.updated) {
      fetchAdminData(); // Recharger les données après une mise à jour
    } else {
      fetchAdminData(); // Charger les données au montage initial
    }
  }, [location.state, navigate]);

  const formatDate = (dateString) => {
    if (!dateString) return "Non spécifié";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const handleEditClick = () => {
    setEditingAdmin(adminData); // Définir les données à éditer
  };

  const handleEditSave = async (updatedData) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const decoded = jwt_decode(token);
      await axios.put(`http://localhost:8000/api/user/updateAdminSA/${decoded.id}`, updatedData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setEditingAdmin(null);
      fetchAdminData(); // Rafraîchir les données après la mise à jour
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      setError("Échec de la mise à jour du profil");
    }
  };

  const handleEditCancel = () => {
    setEditingAdmin(null); // Annuler l'édition
  };

  if (loading) {
    return <div className="loading">Chargement du profil...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <button onClick={() => window.location.reload()} className="retry-button">
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-admin">
      <SidebarSupAdmin />
      <div className="main-content">
        <NavbarSuperAdmin />
        <div className="profile-container">
          <div className="profile-header">
            <h1 style={{ color: 'rgb(25, 25, 69)' }}>Profil Super Administrateur</h1>
            
          </div>

          <div className="profile-content">
            <div className="profile-section">
              <h2>Informations Personnelles</h2>
              <div className="profile-info">
                <div className="info-item">
                  <span className="info-label">Nom:</span>
                  <span className="info-value">{adminData.nom}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Prénom:</span>
                  <span className="info-value">{adminData.prenom}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Email:</span>
                  <span className="info-value">{adminData.email}</span>
                </div>
              </div>
            </div>

            <div className="profile-section">
              <h2>Coordonnées</h2>
              <div className="profile-info">
                <div className="info-item">
                  <span className="info-label">Adresse:</span>
                  <span className="info-value">{adminData.adresse}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Téléphone:</span>
                  <span className="info-value">{adminData.NumTel}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Date de naissance:</span>
                  <span className="info-value">{formatDate(adminData.dateNaissance)}</span>
                </div>
              </div>
            </div>

            <div className="profile-section">
              <h2>Informations Super Administrateur</h2>
              <div className="profile-info">
                <div className="info-item">
                  <span className="info-label">CIN:</span>
                  <span className="info-value">{adminData.cin}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Rôle:</span>
                  <span className="info-value">{adminData.role}</span>
                </div>
              </div>
            </div>
          </div>
          <button onClick={handleEditClick} className="edit-button">
              Modifier le profil
            </button>
          {editingAdmin && (
            <div className="edit-modal-overlay">
              <div className="edit-modal">
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

export default SAProfile;