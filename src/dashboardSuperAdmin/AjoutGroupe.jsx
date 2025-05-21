import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./AjoutGroup.css";
import SidebarSupAdmin from "./SideBarSupAdmin";
import NavbarSuperAdmin from "./NavBarSupAdmin";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AddGroup = () => {
  const process = window.process || { env: {} };
  const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:8000/api";
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nom: "",
    admin: "",
  });
  const [loading, setLoading] = useState(false);
  const [admins, setAdmins] = useState([]);

  // Fetch admins without groups
  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const response = await axios.get(`${apiUrl}/groupes/getAdminsWithoutGroups`);
        setAdmins(response.data);
      } catch (error) {
        const errorMessage =
          error.response?.status === 404
            ? "Aucun admin sans groupe trouvé"
            : error.response?.data?.message || "Erreur lors de la récupération des admins";
        toast.error(errorMessage);
      }
    };

    fetchAdmins();
  }, [apiUrl]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.nom.trim()) {
      toast.error("Le nom du groupe est obligatoire");
      return false;
    }
    if (formData.nom.trim().length < 3) {
      toast.error("Le nom du groupe doit contenir au moins 3 caractères");
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
    const payload = {
      nom: formData.nom,
      admin: formData.admin || null,
    };
    console.log("Payload sent to backend:", payload);

    // 1. Créer le groupe dans votre base de données
    const response = await axios.post(`${apiUrl}/groupes/createGroupe`, payload);
    console.log("Backend response:", response.data);

    // 2. Si la création dans votre BD est réussie, créer le groupe dans Traccar
    if (response.data.success) {
      try {
        const traccarPayload = {
          name: formData.nom,
          // Ajoutez d'autres champs nécessaires pour Traccar si besoin
        };

        // Assurez-vous que cette URL correspond à votre endpoint Traccar
        const traccarResponse = await axios.post(
          `${apiUrl}/traccar/groups`, // Remplacez par votre endpoint Traccar
          traccarPayload,
          {
            headers: {
              // Ajoutez les headers nécessaires pour l'authentification Traccar
              'Authorization': `Basic ${btoa('admin:admin')}`, // Remplacez par vos credentials
            },
          }
        );

        console.log("Traccar response:", traccarResponse.data);
        toast.success("Groupe ajouté avec succès dans Traccar et la base de données !");
      } catch (traccarError) {
        console.error("Erreur Traccar:", traccarError.response?.data);
        toast.warning("Groupe ajouté dans la base de données mais erreur lors de l'ajout dans Traccar");
      }
    }

    setFormData({ nom: "", admin: "" });
    setTimeout(() => navigate("/TableGroups"), 2000);
  } catch (error) {
    const errorMessage =
      error.response?.status === 400 && error.response.data.message.includes("existe déjà")
        ? "Un groupe avec ce nom existe déjà"
        : error.response?.status === 400 && error.response.data.message.includes("admin")
        ? "Cet admin est déjà assigné à un autre groupe"
        : error.response?.data?.message || "Erreur lors de l'ajout du groupe";
    toast.error(errorMessage);
    console.error("Erreur détaillée:", error.response?.data);
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
                <div className="group-input-group">
                  <label htmlFor="admin">
                    <span className="input-icon">👤</span> Propriétaire (Admin)
                  </label>
                  <select
                    id="admin"
                    name="admin"
                    value={formData.admin}
                    onChange={handleChange}
                  >
                    <option value="">Aucun admin</option>
                    {admins.map((admin) => (
                      <option key={admin._id} value={admin._id}>
                        {admin.nom} {admin.prenom}
                      </option>
                    ))}
                  </select>
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

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
};

export default AddGroup;