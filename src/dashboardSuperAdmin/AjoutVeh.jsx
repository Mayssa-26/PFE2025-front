import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Importer useNavigate
import "./AjoutVeh.css";
import Sidebar from "../dashboardAdmin/SideBar";
import Navbar from "../dashboardAdmin/NavBar";

const AddVehicle = () => {
  const process = window.process || { env: {} };
  const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:8000/api";
  const navigate = useNavigate(); // Initialiser useNavigate

  const [formData, setFormData] = useState({
    marque: "",
    modele: "",
    immatriculation: "",
    mec: "",
    etat: "Fonctionnel",
    proprietaire: "",
    numChassis: "",
    typeMines: "",
    kilometrage: "",
    conducteur: null,
    capteurId: null,
    hasCapteur: false
  });

  const [groupes, setGroupes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  // Récupérer la liste des groupes
  useEffect(() => {
    const fetchGroupes = async () => {
      try {
        const response = await fetch(`${apiUrl}/groupes`);
        if (!response.ok) {
          throw new Error("Erreur lors de la récupération des groupes");
        }
        const data = await response.json();
        setGroupes(data);
      } catch (error) {
        console.error("Erreur:", error);
        setMessage("Impossible de charger la liste des groupes");
        setMessageType("error");
      }
    };

    fetchGroupes();
  }, [apiUrl]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === "checkbox") {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const validateForm = () => {
    const requiredFields = ["marque", "modele", "immatriculation", "mec", "proprietaire", "numChassis"];
    
    for (const field of requiredFields) {
      if (!formData[field]) {
        setMessage(`Le champ ${field} est obligatoire`);
        setMessageType("error");
        return false;
      }
    }

    const immatriculationRegex = /^[A-Z0-9]{3,10}$/i;
    if (!immatriculationRegex.test(formData.immatriculation)) {
      setMessage("Format d'immatriculation invalide");
      setMessageType("error");
      return false;
    }

    const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/i;
    if (!vinRegex.test(formData.numChassis)) {
      setMessage("Le numéro de châssis doit contenir 17 caractères alphanumériques (sans I, O, Q)");
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
      const response = await fetch(`${apiUrl}/vehicules`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur lors de l'ajout du véhicule");
      }

      setFormData({
        marque: "",
        modele: "",
        immatriculation: "",
        mec: "",
        etat: "Fonctionnel",
        proprietaire: "",
        numChassis: "",
        typeMines: "",
        kilometrage: "",
        conducteur: null,
        capteurId: null,
        hasCapteur: false
      });

      setMessage("Véhicule ajouté avec succès!");
      setMessageType("success");
    } catch (error) {
      setMessage(error.message);
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-admin">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        <div className="vehicle-container">
          <div className="vehicle-form-container">
            <div className="vehicle-header">
              <h2>Ajouter un nouveau véhicule</h2>
              <div className="vehicle-decoration"></div>
            </div>

            {message && (
              <div className={`vehicle-message ${messageType}`}>
                <div className="message-icon">
                  {messageType === "success" ? "✓" : "⚠"}
                </div>
                <p>{message}</p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="vehicle-form-section">
                <h3 className="section-title">Informations générales</h3>
                
                <div className="form-row">
                  <div className="vehicle-input-group">
                    <label htmlFor="marque">
                      <span className="input-icon">🚗</span> Marque
                    </label>
                    <input
                      id="marque"
                      type="text"
                      name="marque"
                      placeholder="Ex: CHERY"
                      value={formData.marque}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="vehicle-input-group">
                    <label htmlFor="modele">
                      <span className="input-icon">📝</span> Modèle
                    </label>
                    <input
                      id="modele"
                      type="text"
                      name="modele"
                      placeholder="Ex: ARRIZO"
                      value={formData.modele}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="vehicle-input-group">
                    <label htmlFor="immatriculation">
                      <span className="input-icon">🔢</span> Immatriculation
                    </label>
                    <input
                      id="immatriculation"
                      type="text"
                      name="immatriculation"
                      placeholder="Ex: 123TU4567"
                      value={formData.immatriculation}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="vehicle-input-group">
                    <label htmlFor="mec">
                      <span className="input-icon">📅</span> Date de mise en circulation
                    </label>
                    <input
                      id="mec"
                      type="date"
                      name="mec"
                      value={formData.mec ? formData.mec.split('T')[0] : ''}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="vehicle-input-group">
                  <label htmlFor="etat">
                    <span className="input-icon">🔧</span> État
                  </label>
                  <select
                    id="etat"
                    name="etat"
                    value={formData.etat}
                    onChange={handleChange}
                  >
                    <option value="Fonctionnel">Fonctionnel</option>
                    <option value="En réparation">En réparation</option>
                    <option value="Hors service">Hors service</option>
                  </select>
                </div>

                <div className="vehicle-input-group">
                  <label htmlFor="proprietaire">
                    <span className="input-icon">👥</span> Propriétaire (Groupe)
                  </label>
                  <select
                    id="proprietaire"
                    name="proprietaire"
                    value={formData.proprietaire}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Sélectionner un groupe</option>
                    {groupes.map(groupe => (
                      <option key={groupe._id} value={groupe._id}>
                        {groupe.nom}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="vehicle-form-section">
                <h3 className="section-title">Détails techniques</h3>
                
                <div className="form-row">
                  <div className="vehicle-input-group">
                    <label htmlFor="numChassis">
                      <span className="input-icon">🔍</span> Numéro de châssis (VIN)
                    </label>
                    <input
                      id="numChassis"
                      type="text"
                      name="numChassis"
                      placeholder="Ex: LWDC11B4JD080515"
                      value={formData.numChassis}
                      onChange={handleChange}
                      required
                    />
                    <span className="input-hint">17 caractères alphanumériques</span>
                  </div>

                  <div className="vehicle-input-group">
                    <label htmlFor="typeMines">
                      <span className="input-icon">📋</span> Type Mines
                    </label>
                    <input
                      id="typeMines"
                      type="text"
                      name="typeMines"
                      placeholder="Ex: M3XAE00TL5W0P0M5"
                      value={formData.typeMines}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="vehicle-input-group">
                  <label htmlFor="kilometrage">
                    <span className="input-icon">🧮</span> Kilométrage
                  </label>
                  <input
                    id="kilometrage"
                    type="number"
                    name="kilometrage"
                    placeholder="Kilométrage actuel"
                    value={formData.kilometrage}
                    onChange={handleChange}
                    min="0"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button 
                  type="submit" 
                  className="vehicle-btn primary"
                  disabled={loading}
                >
                  {loading ? "Traitement en cours..." : "Enregistrer le véhicule"}
                </button>
                <button 
                  type="button" 
                  className="vehicle-btn secondary"
                  onClick={() => navigate("/VehiculesSansCapteurSA")} // Rediriger vers la page vehSansCap
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

export default AddVehicle;