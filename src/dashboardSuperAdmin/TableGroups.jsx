
import { useLocation } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { FiSearch, FiAlertCircle, FiX } from "react-icons/fi";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import PropTypes from "prop-types";
import "react-toastify/dist/ReactToastify.css";
import SidebarSupAdmin from "./SideBarSupAdmin";
import NavbarSuperAdmin from "./NavBarSupAdmin";

const API_BASE_URL = "http://localhost:8000/api";
const TRACCAR_API_URL = "https://yepyou.treetronix.com/api";

// AddGroup Component
function AddGroup({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({ nom: "", admin: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [admins, setAdmins] = useState([]);

  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/groupes/getAdminsWithoutGroups`);
        setAdmins(response.data);
      } catch (error) {
        toast.error("Erreur lors de la récupération des admins");
        console.error("Erreur détaillée:", error.response?.data);
      }
    };
    fetchAdmins();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await axios.post(`${API_BASE_URL}/groupes`, {
        nom: formData.nom,
        admin: formData.admin || null,
      });
      toast.success("Groupe ajouté avec succès!");
      onSuccess();
      onClose();
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Erreur lors de l'ajout du groupe";
      toast.error(`Erreur: ${errorMessage}`);
      console.error("Erreur détaillée:", error.response?.data);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="popup-container">
      <button className="close-btn" onClick={() => { console.log("Close clicked"); onClose(); }} aria-label="Fermer">
        <FiX />
      </button>
      <div className="popup-header">
        <h2>Ajouter un groupe</h2>
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
              value={formData.nom}
              onChange={handleInputChange}
              required
              aria-required="true"
            />
          </div>
          <div className="group-input-group">
            <label htmlFor="admin">
              <span className="input-icon">👤</span> Admin
            </label>
            <select
              id="admin"
              name="admin"
              value={formData.admin}
              onChange={handleInputChange}
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
            type="button"
            className="group-btn secondary"
            onClick={() => { console.log("Cancel clicked"); onClose(); }}
          >
            Annuler
          </button>
          <button
            type="submit"
            className="group-btn primary"
            disabled={isLoading}
            onClick={() => console.log("Submit clicked")}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                Enregistrement...
              </>
            ) : (
              "Ajouter"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

AddGroup.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
};

export default function GroupeTable() {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const viewAll = location.pathname === "/GroupeListe";
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedGroupe, setSelectedGroupe] = useState({
    _id: null,
    nom: "",
    admin: "",
    nombreVehiculesFonctionnels: 0,
    nombreVehiculesAccidentes: 0,
    nombreVehiculesStock: 0,
    nombreVehiculesReparation: 0,
    nombreTotalVehicules: 0,
  });
  const [showEditForm, setShowEditForm] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [groupeToArchive, setGroupeToArchive] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [admins, setAdmins] = useState([]);
  const groupesPerPage = viewAll ? 5 : 5;
  const [groupes, setGroupes] = useState([]);

  useEffect(() => {
    fetchGroupesWithStats();
    fetchAdmins();
  }, []);

  const fetchGroupesWithStats = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_BASE_URL}/groupes/getGroupesWithVehiculesStats`, {
        params: { archived: false },
      });

      const formattedGroupes = response.data.data.map((groupe) => ({
        _id: groupe._id,
        nom: groupe.nomGroupe,
        admin: groupe.admin || "",
        nombreTotalVehicules: groupe.totalVehicules,
        nombreVehiculesStock: groupe.vehiculesEnStock,
        nombreVehiculesFonctionnels: groupe.etatsCount?.Fonctionnel || 0,
        nombreVehiculesAccidentes: groupe.etatsCount?.Accidenté || 0,
        nombreVehiculesReparation: groupe.etatsCount?.["En réparation"] || 0,
        vehicules: groupe.vehicules,
      }));

      setGroupes(formattedGroupes);
    } catch (error) {
      const errorMessage =
        error.response?.status === 404
          ? "Statistiques des groupes non trouvées"
          : error.response?.status === 400
          ? error.response.data.message
          : "Une erreur est survenue lors de la récupération des statistiques";
      toast.error(`Erreur: ${errorMessage}`);
      console.error("Erreur détaillée:", error.response?.data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchAdmins = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/groupes/getAdminsWithoutGroups`);
      setAdmins(response.data);
    } catch (error) {
      toast.error("Erreur lors de la récupération des admins non affectés");
      console.error("Erreur détaillée:", error.response?.data);
    }
  };

  const filteredGroupes = groupes.filter((groupe) =>
    groupe.nom?.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !groupe.attributes?.archived
  );

  const totalPages = Math.ceil(filteredGroupes.length / groupesPerPage);
  const indexOfLastGroupe = currentPage * groupesPerPage;
  const indexOfFirstGroupe = indexOfLastGroupe - groupesPerPage;
  const currentGroupes = filteredGroupes.slice(indexOfFirstGroupe, indexOfLastGroupe);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleEditGroupe = (groupe) => {
    setSelectedGroupe({
      _id: groupe._id,
      nom: groupe.nom,
      admin: groupe.admin || "",
      nombreVehiculesFonctionnels: groupe.nombreVehiculesFonctionnels,
      nombreVehiculesAccidentes: groupe.nombreVehiculesAccidentes,
      nombreVehiculesStock: groupe.nombreVehiculesStock,
      nombreVehiculesReparation: groupe.nombreVehiculesReparation,
      nombreTotalVehicules: groupe.nombreTotalVehicules,
    });
    setShowEditForm(true);
  };

  const handleUpdateGroupe = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await axios.put(`${API_BASE_URL}/groupes/${selectedGroupe._id}`, {
        nom: selectedGroupe.nom,
        admin: selectedGroupe.admin || null,
      });
      toast.success("Groupe mis à jour avec succès!");
      setShowEditForm(false);
      fetchGroupesWithStats();
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Erreur lors de la mise à jour du groupe";
      toast.error(`Erreur: ${errorMessage}`);
      console.error("Erreur détaillée:", error.response?.data);
    } finally {
      setIsLoading(false);
    }
  };

  const handleArchive = async () => {
    if (!groupeToArchive) return;

    setIsLoading(true);
    const groupeIdToArchive = groupeToArchive._id;
    const previousGroupes = [...groupes];
    setGroupes((prevGroupes) => prevGroupes.filter((g) => g._id !== groupeIdToArchive));

    try {
      const traccarGroupsResponse = await axios.get(`${TRACCAR_API_URL}/groups`, {
        headers: {
          Authorization: "Basic " + btoa("admin:admin"),
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      const traccarGroup = traccarGroupsResponse.data.find(
        (group) => group.name === groupeToArchive.nom
      );

      if (!traccarGroup) {
        throw new Error("Groupe non trouvé dans Traccar");
      }

      await axios.put(
        `${TRACCAR_API_URL}/groups/${traccarGroup.id}`,
        {
          id: traccarGroup.id,
          name: traccarGroup.name,
          attributes: {
            ...traccarGroup.attributes,
            archived: true,
          },
        },
        {
          headers: {
            Authorization: "Basic " + btoa("admin:admin"),
            "Content-Type": "application/json",
          },
        }
      );

      await axios.put(`${API_BASE_URL}/groupes/${groupeToArchive._id}/archive`, {
        archived: true,
      });

      toast.success(`Groupe "${groupeToArchive.nom}" archivé avec succès.`);
    } catch (error) {
      setGroupes(previousGroupes);
      const errorMessage =
        error.response?.status === 404
          ? "Groupe non trouvé"
          : error.response?.status === 400
          ? error.response.data.message
          : error.response?.data?.message || error.message || "Une erreur est survenue lors de l'archivage";
      toast.error(`Erreur: ${errorMessage}`);
      console.error("Erreur détaillée:", error.response?.data || error);
    } finally {
      setIsLoading(false);
      setShowArchiveModal(false);
      setGroupeToArchive(null);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSelectedGroupe((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className={`dashboard-admin ${showEditForm || showAddForm || showArchiveModal ? "blurred" : ""}`}>
      <style>
        {`
          :root {
            --primary-color: #0d174a;
            --primary-light: #10174e;
            --primary-gradient: linear-gradient(to right, #0d174a, #090b45);
            --secondary-color: #3498db;
            --accent-color: #1abc9c;
            --success-color: #2ecc71;
            --danger-color: #e74c3c;
            --text-color: #333;
            --text-light: #555;
            --text-muted: #777;
            --bg-color: #ffffff;
            --bg-light: #f7f9fc;
            --bg-dark: #f9fafc;
            --border-color: #ddd;
            --shadow-sm: 0 2px 10px rgba(0, 0, 0, 0.05);
            --shadow-md: 0 4px 20px rgba(0, 0, 0, 0.08);
            --shadow-lg: 0 10px 30px rgba(0, 0, 0, 0.12);
            --radius-sm: 6px;
            --radius-md: 8px;
            --radius-lg: 12px;
            --transition: all 0.3s ease;
            --font-family: 'Inter', system-ui, -apple-system, sans-serif;
          }

          body {
            font-family: var(--font-family);
            background: var(--bg-light);
            color: var(--text-color);
            line-height: 1.6;
          }

          .dashboard-admin {
            display: flex;
            min-height: 100vh;
          }

          .dashboard-admin.blurred .main-content:not(.popup-overlay, .popup-overlay *) {
            filter: none;
            pointer-events: none;
          }

          .main-content {
            flex: 1;
            margin-left: 240px;
            padding: 1rem;
            transition: var(--transition);
            position: relative;
          }

          .popup-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.65);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            backdrop-filter: blur(6px);
            animation: fadeIn 0.3s ease;
            pointer-events: auto; /* Ensure popup is interactive */
          }

          .popup-container {
            background: var(--bg-color);
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-lg);
            width: 90%;
            max-width: 600px;
            padding: 2rem;
            animation: modalAppear 0.4s ease forwards;
            position: relative;
            z-index: 1001;
            pointer-events: auto; /* Ensure container is interactive */
          }

          .toggle-btn {
            position: fixed;
            top: 1rem;
            left: 1rem;
            z-index: 1002; /* Above popup */
            background: var(--primary-color);
            color: white;
            border: none;
            border-radius: var(--radius-sm);
            padding: 0.5rem 0.75rem;
            font-size: 1.25rem;
            cursor: pointer;
            transition: var(--transition);
          }

          .toggle-btn:hover {
            background: var(--primary-light);
          }

          .container2 {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
            background: var(--bg-color);
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-md);
          }

          .container2 h2 {
            font-size: 1.75rem;
            font-weight: 600;
            color: var(--text-color);
            margin-bottom: 0.5rem;
          }

          .container2 p {
            font-size: 0.875rem;
            color: var(--text-muted);
            margin-bottom: 1.5rem;
          }

          .filter-bar {
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
          }

          .search-container {
            position: relative;
            flex: 1;
            min-width: 200px;
          }

          .search-icon {
            position: absolute;
            top: 50%;
            left: 0.75rem;
            transform: translateY(-50%);
            color: var(--text-muted);
            font-size: 1rem;
          }

          .search-input {
            padding: 0.75rem 1rem 0.75rem 2.5rem;
            font-size: 0.875rem;
            border: 1px solid var(--border-color);
            border-radius: var(--radius-sm);
            width: 100%;
            transition: var(--transition);
          }

          .search-input:focus {
            border-color: var(--secondary-color);
            box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
            outline: none;
          }

          .add-group-btn {
            background: var(--primary-gradient);
            color: white;
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: var(--radius-sm);
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            transition: var(--transition);
          }

          .add-group-btn:hover {
            background: linear-gradient(to right, #10174e, #140a54);
            box-shadow: var(--shadow-sm);
          }

          .vehicles-table {
            width: 100%;
            border-collapse: collapse;
            background: var(--bg-color);
            border-radius: var(--radius-md);
            box-shadow: var(--shadow-md);
            overflow: hidden;
            margin-top: 1rem;
          }

          .vehicles-table th {
            background: var(--bg-dark);
            color: var(--text-color);
            font-weight: 600;
            text-align: left;
            padding: 0.75rem 1rem;
            font-size: 0.75rem;
            text-transform: uppercase;
          }

          .vehicles-table td {
            padding: 0.75rem 1rem;
            font-size: 0.875rem;
            color: var(--text-color);
            border-bottom: 1px solid var(--border-color);
          }

          .vehicles-table tr:hover td {
            background: var(--bg-dark);
          }

          .action-buttons {
            display: flex;
            gap: 0.5rem;
            justify-content: flex-start;
          }

          .action-icon {
            background: none;
            border: none;
            cursor: pointer;
            font-size: 1rem;
            padding: 0.5rem;
            border-radius: 50%;
            transition: var(--transition);
          }

          .action-icon.edit {
            color: var(--text-light);
          }

          .action-icon.edit:hover {
            background: rgba(52, 152, 219, 0.1);
            color: var(--secondary-color);
          }

          .action-icon.archive {
            color: var(--danger-color);
          }

          .action-icon.archive:hover {
            background: rgba(231, 76, 60, 0.1);
            color: #c0392b;
          }

          .spinner-btn {
            display: inline-block;
            width: 1.25rem;
            height: 1.25rem;
            border: 2px solid var(--primary-color);
            border-top: 2px solid transparent;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }

          @keyframes spin {
            to { transform: rotate(360deg); }
          }

          .pagination {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 1rem;
            margin-top: 1.5rem;
          }

          .pagination button {
            padding: 0.5rem 1rem;
            background: var(--primary-gradient);
            color: white;
            border: none;
            border-radius: var(--radius-sm);
            cursor: pointer;
            font-size: 0.875rem;
            transition: var(--transition);
          }

          .pagination button:hover:not(:disabled) {
            background: linear-gradient(to right, #10174e, #140a54);
            box-shadow: var(--shadow-sm);
          }

          .pagination button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .pagination .current-page {
            font-size: 0.875rem;
            color: var(--text-light);
          }

          .popup-header {
            margin-bottom: 1.5rem;
          }

          .popup-header h2 {
            font-size: 1.5rem;
            color: var(--text-color);
            font-weight: 600;
            margin-bottom: 0.5rem;
          }

          .group-decoration {
            width: 100px;
            height: 4px;
            background: linear-gradient(to right, var(--secondary-color), var(--accent-color));
            border-radius: 2px;
          }

          .close-btn {
            position: absolute;
            top: 1rem;
            right: 1rem;
            background: none;
            border: none;
            color: var(--text-light);
            font-size: 1.5rem;
            cursor: pointer;
            transition: var(--transition);
          }

          .close-btn:hover {
            color: var(--text-color);
          }

          .group-form-section {
            margin-bottom: 1.5rem;
            background: var(--bg-dark);
            padding: 1.5rem;
            border-radius: var(--radius-md);
          }

          .section-title {
            font-size: 1.125rem;
            color: #445;
            font-weight: 600;
            margin-bottom: 1rem;
          }

          .group-input-group {
            margin-bottom: 1.25rem;
          }

          .group-input-group label {
            display: flex;
            align-items: center;
            font-size: 0.875rem;
            font-weight: 500;
            color: var(--text-color);
            margin-bottom: 0.5rem;
          }

          .input-icon {
            margin-right: 0.5rem;
            font-size: 1rem;
          }

          .group-input-group input,
          .group-input-group select {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid var(--border-color);
            border-radius: var(--radius-sm);
            font-size: 0.875rem;
            background: var(--bg-color);
            color: var(--text-color);
            transition: var(--transition);
          }

          .group-input-group input:focus,
          .group-input-group select:focus {
            border-color: var(--secondary-color);
            box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
            outline: none;
          }

          .form-actions {
            display: flex;
            justify-content: flex-end;
            gap: 1rem;
          }

          .group-btn {
            padding: 0.75rem 1.5rem;
            border-radius: var(--radius-sm);
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            transition: var(--transition);
            border: none;
          }

          .group-btn.primary {
            background: var(--primary-gradient);
            color: white;
          }

          .group-btn.primary:hover:not(:disabled) {
            background: linear-gradient(to right, #10174e, #140a54);
            box-shadow: var(--shadow-sm);
          }

          .group-btn.secondary {
            background: var(--bg-light);
            color: var(--text-light);
            border: 1px solid var(--border-color);
          }

          .group-btn.secondary:hover:not(:disabled) {
            background: #f9f9f9;
            border-color: #ccc;
          }

          .group-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .spinner {
            width: 1.25rem;
            height: 1.25rem;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-top: 2px solid white;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin-right: 0.5rem;
          }

          .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.65);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            backdrop-filter: blur(6px);
            animation: fadeIn 0.3s ease;
            pointer-events: auto;
          }

          .modal-content {
            background: var(--bg-color);
            padding: 1.5rem;
            border-radius: var(--radius-lg);
            max-width: 400px;
            width: 90%;
            text-align: center;
            box-shadow: var(--shadow-lg);
            animation: modalAppear 0.4s ease forwards;
            pointer-events: auto;
          }

          .confirmation-modal {
            font-size: 1.25rem;
            font-weight: 600;
            color: var(--text-color);
            margin-bottom: 1rem;
          }

          .modal-content p {
            color: var(--text-muted);
            font-size: 0.875rem;
            margin-bottom: 1.5rem;
          }

          .group-btn.danger {
            background: var(--danger-color);
            color: white;
          }

          .group-btn.danger:hover:not(:disabled) {
            background: #c0392b;
            box-shadow: var(--shadow-sm);
          }

          .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1rem;
            padding: 2rem;
            color: var(--text-muted);
          }

          .empty-icon {
            font-size: 2rem;
          }

          .clear-search {
            background: var(--primary-color);
            color: white;
            padding: 0.5rem 1rem;
            border: none;
            border-radius: var(--radius-sm);
            cursor: pointer;
            font-size: 0.875rem;
            transition: var(--transition);
          }

          .clear-search:hover {
            background: var(--primary-light);
            box-shadow: var(--shadow-sm);
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          @keyframes modalAppear {
            0% { transform: translateY(40px) scale(0.95); opacity: 0; }
            100% { transform: translateY(0) scale(1); opacity: 1; }
          }

          @media (max-width: 1024px) {
            .main-content {
              margin-left: 0;
              padding: 1rem;
            }

            .toggle-btn {
              display: block;
            }

            .container2 {
              padding: 1.5rem;
            }
          }

          @media (max-width: 768px) {
            .filter-bar {
              flex-direction: column;
              align-items: stretch;
            }

            .vehicles-table {
              display: block;
              overflow-x: auto;
              white-space: nowrap;
            }

            .add-group-btn {
              width: 100%;
              justify-content: center;
            }

            .container2 h2 {
              font-size: 1.5rem;
            }
          }

          @media (max-width: 480px) {
            .container2 {
              padding: 1rem;
            }

            .search-input {
              font-size: 0.85rem;
            }

            .pagination button {
              padding: 0.4rem 0.8rem;
              font-size: 0.85rem;
            }

            .popup-container,
            .modal-content {
              width: 95%;
              padding: 1rem;
            }

            .form-actions {
              flex-direction: column;
              gap: 0.75rem;
            }

            .group-btn {
              width: 100%; /* Fixed invalid 'reck' property */
            }
          }

          @media (prefers-color-scheme: dark) {
            :root {
              --text-color: #e9ecef;
              --text-light: #adb5bd;
              --text-muted: #6b7280;
              --bg-color: #212529;
              --bg-light: #343a40;
              --bg-dark: #495057;
              --border-color: #4a4d51;
            }

            .dashboard-admin {
              background: var(--bg-light);
            }

            .main-content {
              background: var(--bg-light);
            }

            .container2 {
              background: var(--bg-color);
              box-shadow: var(--shadow-md);
            }

            .vehicles-table th {
              background: var(--bg-dark);
              color: var(--text-color);
            }

            .vehicles-table td {
              color: var(--text-light);
            }

            .vehicles-table tr:hover td {
              background: var(--bg-dark);
            }

            .search-input,
            .group-input-group input,
            .group-input-group select {
              background: var(--bg-dark);
              color: var(--text-color);
            }

            .popup-container,
            .modal-content {
              background: var(--bg-color);
            }

            .clear-search {
              background: var(--primary-color);
            }
          }
        `}
      </style>
      <button className="toggle-btn" onClick={toggleSidebar}>
        {isSidebarOpen ? "✕" : "☰"}
      </button>
      <SidebarSupAdmin isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="main-content">
        <NavbarSuperAdmin />
        <div className="container2">
          <h2>Gestion des groupes</h2>
          <p>Gérez les groupes et consultez leurs statistiques</p>
          <div className="filter-bar">
            <div className="search-container">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Rechercher un groupe..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
            <button
              className="add-group-btn"
              onClick={() => { console.log("Add group button clicked"); setShowAddForm(true); }}
            >
              Ajouter un groupe
            </button>
          </div>

          {showAddForm && (
            <div className="popup-overlay">
              <AddGroup
                onClose={() => setShowAddForm(false)}
                onSuccess={fetchGroupesWithStats}
              />
            </div>
          )}

          {showEditForm && (
            <div className="popup-overlay">
              <div className="popup-container">
                <button
                  className="close-btn"
                  onClick={() => { console.log("Edit close clicked"); setShowEditForm(false); }}
                >
                  <FiX />
                </button>
                <div className="popup-header">
                  <h2>Modifier le groupe</h2>
                  <div className="group-decoration"></div>
                </div>
                <form onSubmit={handleUpdateGroupe}>
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
                        value={selectedGroupe.nom}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="group-input-group">
                      <label htmlFor="admin">
                        <span className="input-icon">👤</span> Admin
                      </label>
                      <select
                        id="admin"
                        name="admin"
                        value={selectedGroupe.admin}
                        onChange={handleInputChange}
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
                      type="button"
                      className="group-btn secondary"
                      onClick={() => { console.log("Edit cancel clicked"); setShowEditForm(false); }}
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="group-btn primary"
                      disabled={isLoading}
                      onClick={() => console.log("Edit submit clicked")}
                    >
                      {isLoading ? (
                        <>
                          <span className="spinner"></span>
                          Envoi...
                        </>
                      ) : (
                        "Enregistrer"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <table className="vehicles-table">
            <thead>
              <tr>
                <th scope="col">Nom du groupe</th>
                <th scope="col">Véhicules fonctionnels</th>
                <th scope="col">Véhicules accidentés</th>
                <th scope="col">Véhicules en stock</th>
                <th scope="col">Véhicules en réparation</th>
                <th scope="col">Total véhicules</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center" }}>
                    <div className="spinner-btn"></div> Chargement des données...
                  </td>
                </tr>
              ) : currentGroupes.length > 0 ? (
                currentGroupes.map((groupe) => (
                  <tr key={groupe._id}>
                    <td>{groupe.nom}</td>
                    <td>{groupe.nombreVehiculesFonctionnels}</td>
                    <td>{groupe.nombreVehiculesAccidentes}</td>
                    <td>{groupe.nombreVehiculesStock}</td>
                    <td>{groupe.nombreVehiculesReparation}</td>
                    <td>{groupe.nombreTotalVehicules}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="action-icon edit"
                          onClick={() => handleEditGroupe(groupe)}
                        >
                          ✏️
                        </button>
                        <button
                          className="action-icon archive"
                          onClick={() => {
                            setGroupeToArchive(groupe);
                            setShowArchiveModal(true);
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center" }}>
                    <div className="empty-groupes">
                      <FiAlertCircle />
                      <p>Aucun groupe trouvé</p>
                      {searchQuery && (
                        <button className="clear-search" onClick={() => setSearchQuery("")}>
                          Effacer la recherche
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {filteredGroupes.length > 0 && (
            <div className="pagination">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
              >
                Précédent
              </button>
              <span className="current-page">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
              >
                Suivant
              </button>
            </div>
          )}

          {showArchiveModal && groupeToArchive && (
            <div className="modal-overlay">
              <div className="modal-content">
                <h3 className="confirmation-modal">⚠️ Confirmer l'archivage</h3>
                <p>
                  Êtes-vous sûr de vouloir archiver le groupe{' '}
                  <strong>{groupeToArchive.nom}</strong> ?
                </p>
                <div className="form-actions">
                  <button
                    onClick={() => { console.log("Archive confirm clicked"); handleArchive(); }}
                    className="group-btn danger"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Archivage...' : 'Confirmer'}
                  </button>
                  <button
                    onClick={() => { console.log("Archive cancel clicked"); setShowArchiveModal(false); }}
                    className="group-btn secondary"
                    disabled={isLoading}
                  >
                    <i style={{ fontStyle: 'normal', fontSize: '14px' }}>❌</i>
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          )}

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
            theme="light"
          />
        </div>
      </div>
    </div>
  );
}
