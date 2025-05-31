import { useLocation } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { FiSearch, FiAlertCircle, FiX } from "react-icons/fi";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import "react-toastify/dist/ReactToastify.css";
import "./tableGroup.css";
import SidebarSupAdmin from "./SideBarSupAdmin";
import NavbarSuperAdmin from "./NavBarSupAdmin";
import { Link } from "react-router-dom";

const API_BASE_URL = "http://localhost:8000/api";
const TRACCAR_API_URL = "https://yepyou.treetronix.com/api";

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
        params: { archived: false }, // Exclude archived groups
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
      const response = await axios.put(`${API_BASE_URL}/groupes/${selectedGroupe._id}`, {
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

    // Optimistically remove the group from the UI
    const groupeIdToArchive = groupeToArchive._id;
    const previousGroupes = [...groupes]; // Store previous state for rollback
    setGroupes((prevGroupes) => prevGroupes.filter((g) => g._id !== groupeIdToArchive));

    try {
      // Fetch all Traccar groups to find the one with matching name
      const traccarGroupsResponse = await axios.get(`${TRACCAR_API_URL}/groups`, {
        headers: {
          Authorization: "Basic " + btoa("admin:admin"), // Replace with your Traccar credentials
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

      // Update group in Traccar to set archived: true
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
            Authorization: "Basic " + btoa("admin:admin"), // Replace with your Traccar credentials
            "Content-Type": "application/json",
          },
        }
      );

      // Update group in MongoDB to set archived: true
      await axios.put(`${API_BASE_URL}/groupes/${groupeToArchive._id}/archive`, {
        archived: true,
      });

      toast.success(`Groupe "${groupeToArchive.nom}" archivé avec succès.`);
    } catch (error) {
      // Revert optimistic update on error
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
    <div className="dashboard-admin">
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideIn {
            from { transform: translateY(-20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
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
            <div className="add-group-btn">
              <Link to="/AjouterGroupe" className="link">
                Ajouter un groupe
              </Link>
            </div>
          </div>

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
                          className="action-icon archive"
                          onClick={() => {
                            setGroupeToArchive(groupe);
                            setShowArchiveModal(true);
                          }}
                          aria-label="Archiver"
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

          {showArchiveModal && groupeToArchive && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.5)',
                zIndex: 1000,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                animation: 'fadeIn 0.2s ease-out',
              }}
              className="modal-overlay active"
            >
              <div
                style={{
                  background: 'white',
                  padding: '25px',
                  borderRadius: '10px',
                  maxWidth: '400px',
                  width: '90%',
                  textAlign: 'center',
                  boxShadow: '0 5px 15px rgba(0, 0, 0, 0.2)',
                  animation: 'slideIn 0.3s ease-out',
                }}
                className="modal-content"
              >
                <h3
                  style={{
                    fontSize: '22px',
                    fontWeight: 600,
                    color: '#2c3e50',
                    marginBottom: '15px',
                  }}
                  className="confirmation-modal"
                >
                  ⚠️ Confirmer l'archivage
                </h3>
                <p
                  style={{
                    color: '#555',
                    fontSize: '16px',
                    marginBottom: '25px',
                    lineHeight: 1.5,
                  }}
                >
                  Êtes-vous sûr de vouloir archiver le groupe{' '}
                  <strong>{groupeToArchive.nom}</strong> ?
                </p>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '15px',
                  }}
                  className="form-actions"
                >
                  <button
                    onClick={handleArchive}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#e74c3c',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      fontSize: '15px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#c0392b')}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#e74c3c')}
                    className="group-btn danger"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Archivage...' : 'Confirmer'}
                  </button>
                  <button
                    onClick={() => setShowArchiveModal(false)}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#f1f1f1',
                      color: '#333',
                      border: 'none',
                      borderRadius: '5px',
                      fontSize: '15px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#ddd')}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#f1f1f1')}
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
          />
        </div>
      </div>
    </div>
  );
}