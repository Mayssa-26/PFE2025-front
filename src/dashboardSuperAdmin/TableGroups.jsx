import { useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { FiSearch, FiAlertCircle, FiX } from "react-icons/fi";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import "react-toastify/dist/ReactToastify.css";
import "./tableGroup.css";
import SidebarSupAdmin from "./SideBarSupAdmin";
import NavbarSuperAdmin from "./NavBarSupAdmin";
import { Link } from "react-router-dom";

const API_BASE_URL = "http://localhost:8000/api";

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
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [groupeToDelete, setGroupeToDelete] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [admins, setAdmins] = useState([]);
  const groupesPerPage = viewAll ? 5 : 5;
  const [groupes, setGroupes] = useState([]);

  useEffect(() => {
    fetchGroupesWithStats();
    fetchAdmins();
  }, []);

  const fetchGroupesWithStats = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_BASE_URL}/groupes/getGroupesWithVehiculesStats`);
      
      const formattedGroupes = response.data.data.map(groupe => ({
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
  };

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
    groupe.nom?.toLowerCase().includes(searchQuery.toLowerCase())
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
      const response = await axios.put(`${API_BASE_URL}/groupes/${selectedGroupe._id}`, {
        nom: selectedGroupe.nom,
        admin: selectedGroupe.admin,
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

  const handleSupprimer = async () => {
    try {
      setIsLoading(true);
      const response = await axios.delete(`${API_BASE_URL}/groupes/${groupeToDelete._id}`);
      toast.success(response.data.message || "Groupe supprimé avec succès!");
      fetchGroupesWithStats();
      setShowDeletePopup(false);
      setGroupeToDelete(null);
    } catch (error) {
      const errorMessage =
        error.response?.status === 404
          ? "Groupe non trouvé"
          : error.response?.status === 400
          ? error.response.data.message
          : error.response?.data?.message || "Une erreur est survenue lors de la suppression";
      toast.error(`Erreur: ${errorMessage}`);
      console.error("Erreur détaillée:", error.response?.data);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSelectedGroupe((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="dashboard-admin">
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
            <div className="add-group-btn">
              <Link to="/AjouterGroupe" className="link">
                Ajouter un groupe
              </Link>
            </div>
          </div>

          {/* Nouveau Modal Popup pour l'édition */}
          {showEditForm && (
            <div className="edit-popup-overlay">
              <div className="edit-popup-container">
                <div className="edit-popup-header">
                  <h3>Modifier le groupe</h3>
                  <button className="close-btn" onClick={() => setShowEditForm(false)}>
                    <FiX />
                  </button>
                </div>
                <form className="edit-form" onSubmit={handleUpdateGroupe}>
                  <div className="form-group">
                    <label htmlFor="nom">Nom du groupe</label>
                    <input
                      type="text"
                      id="nom"
                      name="nom"
                      value={selectedGroupe.nom}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="admin">Admin</label>
                    <select
                      id="admin"
                      name="admin"
                      value={selectedGroupe.admin}
                      onChange={handleInputChange}
                    >
                      <option value="">Aucun admin</option>
                      {admins.map((admin) => (
                        <option key={admin._id} value={admin._id}>
                          {admin.nom}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-actions">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowEditForm(false)}
                    >
                      Annuler
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-primary" 
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <span className="spinner"></span>
                          Enregistrement...
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
                <th>Nom du groupe</th>
                <th>Véhicules fonctionnels</th>
                <th>Véhicules accidentés</th>
                <th>Véhicules en stock</th>
                <th>Véhicules en réparation</th>
                <th>Total véhicules</th>
                <th>Actions</th>
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
                          aria-label="Modifier"
                        >
                          ✏️
                        </button>
                        <button
                          className="action-icon delete"
                          onClick={() => {
                            setGroupeToDelete(groupe);
                            setShowDeletePopup(true);
                          }}
                          aria-label="Supprimer"
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
                    <div className="empty-state">
                      <FiAlertCircle className="empty-icon" />
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
              <button onClick={handlePrevPage} disabled={currentPage === 1}>
                Précédent
              </button>
              <span className="current-page">
                {currentPage} / {totalPages}
              </span>
              <button onClick={handleNextPage} disabled={currentPage === totalPages}>
                Suivant
              </button>
            </div>
          )}

          {showDeletePopup && (
            <div className="popup-overlay">
              <div className="popup-content">
                <h3>Confirmer la suppression</h3>
                <p>
                  Êtes-vous sûr de vouloir supprimer le groupe{" "}
                  <strong>{groupeToDelete?.nom}</strong> ?
                </p>
                <div className="popup-actions">
                  <button
                    className="popup-btn cancel"
                    onClick={() => setShowDeletePopup(false)}
                  >
                    ❌ Annuler
                  </button>
                  <button
                    className="popup-btn confirm"
                    onClick={handleSupprimer}
                    disabled={isLoading}
                  >
                    {isLoading ? <div className="spinner-btn"></div> : "Confirmer"}
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
          />
        </div>
      </div>
    </div>
  );
}