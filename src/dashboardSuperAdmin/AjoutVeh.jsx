import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from 'axios';
import "./AjoutVeh.css";
import SidebarSupAdmin from "./SideBarSupAdmin";
import NavbarSuperAdmin from "./NavBarSupAdmin";

const AddVehicle = () => {
  const process = window.process || { env: {} };
  const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:8000/api";
  const navigate = useNavigate();
  const location = useLocation();
  const vehicle = location.state?.vehicle; // Récupérer les données du véhicule si modification

  const [formData, setFormData] = useState({
    marque: vehicle?.marque || "",
    modele: vehicle?.modele || "",
    immatriculation: vehicle?.immatriculation || "",
    mec: vehicle?.mec ? new Date(vehicle.mec).toISOString().split('T')[0] : "",
    etat: vehicle?.etat || "Fonctionnel",
    proprietaire: vehicle?.proprietaire || "",
    numChassis: vehicle?.numChassis || "",
    typeMines: vehicle?.typeMines || "",
    kilometrage: vehicle?.kilometrage || "",
    conducteur: vehicle?.conducteur || null,
    capteurId: vehicle?.capteurId || null,
    hasCapteur: vehicle?.hasCapteur || false
  });

  const [groupes, setGroupes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const isEditMode = !!vehicle; // Déterminer si on est en mode édition

  useEffect(() => {
    const fetchGroupes = async () => {
      try {
        const response = await axios.get(`${apiUrl}/groupes`);
        setGroupes(response.data);
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
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
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

    if (!/^[A-Z0-9]{3,10}$/i.test(formData.immatriculation)) {
      setMessage("Format d'immatriculation invalide");
      setMessageType("error");
      return false;
    }

    if (!/^[A-HJ-NPR-Z0-9]{17}$/i.test(formData.numChassis)) {
      setMessage("Le numéro de châssis doit contenir 17 caractères alphanumériques (sans I, O, Q)");
      setMessageType("error");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    try {
      if (isEditMode) {
        // Mode modification
        const response = await axios.put(`${apiUrl}/vehicules/update/${vehicle._id}`, {
          ...formData,
          mec: new Date(formData.mec).toISOString()
        });

        setMessage("Véhicule modifié avec succès !");
        setMessageType("success");
      } else {
        // Mode ajout
        const response = await axios.post(`${apiUrl}/vehicules/createVehicule`, {
          ...formData,
          mec: new Date(formData.mec).toISOString()
        });

        setMessage("Véhicule ajouté avec succès !");
        setMessageType("success");
      }

      // Redirection après 2 secondes
      setTimeout(() => navigate("/VehiculesSansCapteurSA"), 2000);
    } catch (error) {
      setMessage(error.response?.data?.message || "Erreur lors de l'opération");
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
        <div className="vehicle-container">
          <div className="vehicle-form-container">
            <div className="vehicle-header">
              <h2>{isEditMode ? "Modifier le véhicule" : "Ajouter un nouveau véhicule"}</h2>
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
                      value={formData.mec}
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
                  {loading ? "Traitement en cours..." : isEditMode ? "Modifier le véhicule" : "Enregistrer le véhicule"}
                </button>
                <button
                  type="button"
                  className="vehicle-btn secondary"
                  onClick={() => navigate("/VehiculesSansCapteurSA")}
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