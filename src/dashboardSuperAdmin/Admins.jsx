import { useState, useEffect } from "react";
import Sidebar from "./SideBarSupAdmin";
import Navbar from "./NavBarSupAdmin";
import "../dashboardAdmin/Tous.css";

const TousAdmins = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  useEffect(() => {
    const fetchAdminsWithGroups = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/groupes/getAdminsWithGroups");
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        const data = await response.json();
        setAdmins(data);
      } catch (error) {
        console.error("Erreur de récupération:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminsWithGroups();
  }, []);

  const handleDelete = async () => {
    if (!selectedId) return;

    try {
      const response = await fetch(
        `http://localhost:8000/api/user/deleteAdmin/${selectedId}`,
        { method: "DELETE" }
      );

      if (!response.ok) throw new Error("Échec de la suppression");

      setAdmins(admins.filter(admin => admin._id !== selectedId));
      setShowModal(false);
    } catch (error) {
      console.error("Erreur de suppression:", error);
      alert(`Erreur: ${error.message}`);
    }
  };

  const filteredAdmins = admins.filter(admin => {
    const searchLower = searchTerm.toLowerCase();
    return (
      admin.nom.toLowerCase().includes(searchLower) ||
      admin.prenom.toLowerCase().includes(searchLower) ||
      admin.email.toLowerCase().includes(searchLower) ||
      admin.cin.toLowerCase().includes(searchLower) ||
      (admin.group && admin.group.nom && admin.group.nom.toLowerCase().includes(searchLower))
    );
  });

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentAdmins = filteredAdmins.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAdmins.length / itemsPerPage);

  
  const handlePrevious = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  if (loading) {
    return (
      <div className="dashboard-admin">
        <Sidebar />
        <div className="main-content">
          <Navbar />
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Chargement en cours...</p>
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
            <h3>Erreur de chargement</h3>
            <p>{error}</p>
            <button className="btn-retry" onClick={() => window.location.reload()}>
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`dashboard-admin ${showModal ? "blurred" : ""}`}>
      <Sidebar />
      <div className="main-content">
        <Navbar />

        <div className="container-admin">
          <div className="admin-header">
            <div className="header-text">
              <h2>Gestion des Administrateurs</h2>
              <p>Liste complète des administrateurs et leurs groupes assignés</p>
            </div>
            <div className="search-container">
              <div className="search-bar">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Rechercher un administrateur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>
          </div>

          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Prénom</th>
                  <th>Email</th>
                  <th>CIN</th>
                  <th>Groupes Responsables</th>
                  <th className="actions-column">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentAdmins.length > 0 ? (
                  currentAdmins.map(admin => (
                    <tr key={admin._id}>
                      <td>{admin.nom}</td>
                      <td>{admin.prenom}</td>
                      <td>{admin.email}</td>
                      <td>{admin.cin}</td>
                      <td>
  {admin.groupes && admin.groupes.length > 0 ? (
    admin.groupes.map((groupeId) => (
      <span key={groupeId}>{groupeId}</span> // Affiche l'ID du groupe, ou tu peux changer ça pour afficher un nom spécifique
    ))
  ) : (
    <span className="no-group">Aucun groupe assigné</span>
  )}
</td>


                      <td className="actions-cell">
                        <div className="action-buttons">
                          <button className="btn-edit">
                            <i className="edit-icon">✏️</i>
                          </button>
                          <button
                            className="btn-delete"
                            onClick={() => {
                              setSelectedId(admin._id);
                              setShowModal(true);
                            }}
                          >
                            <i className="delete-icon">🗑️</i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="no-results">
                      Aucun administrateur trouvé pour votre recherche
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button onClick={handlePrevious} disabled={currentPage === 1}>
                ← Précédent
              </button>
              
              <button onClick={handleNext} disabled={currentPage === totalPages}>
                Suivant →
              </button>
            </div>
          )}
        </div>

        {showModal && (
          <div className="modal-overlay">
            <div className="confirmation-modal">
              <div className="modal-content">
                <h3>Confirmer la suppression</h3>
                <p>Êtes-vous sûr de vouloir supprimer cet administrateur ?</p>
                <p className="warning-text">
                  ⚠️ Cette action est irréversible et supprimera toutes les associations de groupe.
                </p>
                <div className="modal-actions">
                  <button className="btn-confirm" onClick={handleDelete}>
                    Confirmer
                  </button>
                  <button className="btn-cancel" onClick={() => setShowModal(false)}>
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TousAdmins;
