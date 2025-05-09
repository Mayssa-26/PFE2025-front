import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./AjoutGroup.css";
import SidebarSupAdmin from "./SideBarSupAdmin";
import NavbarSuperAdmin from "./NavBarSupAdmin";

const AddGroup = () => {
  const process = window.process || { env: {} };
  const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:8000/api";
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nom: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  // Réinitialiser le message après 5 secondes
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
        setMessageType("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.nom.trim()) {
      setMessage("Le nom du groupe est obligatoire");
      setMessageType("error");
      return false;
    }
    if (formData.nom.trim().length < 3) {
      setMessage("Le nom du groupe doit contenir au moins 3 caractères");
      setMessageType("error");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${apiUrl}/groupes/createGroupe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 400 && data.message.includes("existe déjà")) {
          throw new Error("Un groupe avec ce nom existe déjà");
        } else if (response.status === 400 && data.errors) {
          throw new Error(data.errors.join(", "));
        } else {
          throw new Error(data.message || "Erreur lors de l'ajout du groupe");
        }
      }

      setFormData({ nom: "" });
      setMessage("Groupe ajouté avec succès !");
      setMessageType("success");

      setTimeout(() => navigate("/TableGroups"), 2000);
    } catch (error) {
      setMessage(error.message);
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-admin">
      <SidebarSupAdmin />
      <div className="main-content">
        <NavbarSuperAdmin />
        <div className="group-container">
          <div className="group-form-container">
            <div className="group-header">
              <h2>Ajouter un nouveau groupe</h2>
              <div className="group-decoration"></div>
            </div>

            {message && (
              <div className={`group-message ${messageType}`}>
                <div className="message-icon">
                  {messageType === "success" ? "✓" : "⚠"}
                </div>
                <p>{message}</p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="group-form-section">
                <h3 className="section-title">Informations du groupe</h3>
                <div className="group-input-group">
                  <label htmlFor="nom">
                    <span className="input-icon">👥</span> Nom du groupe
                  </label>
                  <input
                    id="nom"
                    type="text"
                    name="nom"
                    placeholder="Entrez le nom du groupe"
                    value={formData.nom}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="group-btn primary"
                  disabled={loading}
                >
                  {loading ? "Traitement en cours..." : "Enregistrer le groupe"}
                </button>
                <button
                  type="button"
                  className="group-btn secondary"
                  onClick={() => navigate("/TableGroups")}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddGroup;