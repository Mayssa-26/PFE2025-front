
import { useState, useEffect } from "react";
import Register from "../register/Register";
import SidebarSupAdmin from "./SideBarSupAdmin";
import NavbarSuperAdmin from "./NavBarSupAdmin";

const TousAdmins = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [cinError, setCinError] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  useEffect(() => {
    const fetchAdminsWithGroups = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/groupes/getAdminsWithGroups");
        if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
        const data = await response.json();
        setAdmins(data.filter(admin => !admin.isArchived));
      } catch (error) {
        console.error("Erreur de récupération:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminsWithGroups();
  }, []);

  useEffect(() => {
    if (showSuccessPopup) {
      const timer = setTimeout(() => setShowSuccessPopup(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessPopup]);

  const handleDelete = async () => {
    if (!selectedId) return;

    try {
      const response = await fetch(
        `http://localhost:8000/api/user/archiveAdmin/${selectedId}`,
        { method: "PUT", headers: { "Content-Type": "application/json" } }
      );

      const responseData = await response.json();
      if (!response.ok) throw new Error(responseData.message || "Échec de l'archivage");

      setAdmins(prev => prev.filter(admin => admin._id !== selectedId));
      setShowModal(false);
      setShowSuccessPopup(true);
    } catch (error) {
      console.error("Erreur d'archivage:", error);
      alert(`❌ Erreur: ${error.message}`);
    }
  };

  const handleEdit = (admin) => {
    setEditingAdmin({
      ...admin,
      originalCin: admin.cin,
      nom: admin.nom || "",
      prenom: admin.prenom || "",
      email: admin.email || "",
      cin: admin.cin || "",
      adresse: admin.adresse || "",
      numTel: admin.numTel || "",
      dateNaissance: admin.dateNaissance || "",
      nationalite: admin.nationalite || "",
      role: admin.role || "Admin",
      password: "",
    });
  };

  const handleEditCancel = () => {
    setEditingAdmin(null);
  };

  const handleEditSave = async (updatedData) => {
    if (updatedData.cin !== editingAdmin.originalCin) {
      setCinError(true);
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8000/api/user/updateAdmin/${editingAdmin._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedData),
        }
      );

      if (!response.ok) throw new Error("Erreur lors de la mise à jour");

      const updatedAdmins = admins.map((admin) =>
        admin._id === editingAdmin._id ? { ...admin, ...updatedData } : admin
      );

      setAdmins(updatedAdmins);
      setEditingAdmin(null);
      setCinError(false);
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      alert(`Erreur: ${error.message}`);
    }
  };

  const filteredAdmins = admins.filter(admin => {
    const searchLower = searchTerm.toLowerCase();
    return (
      admin.nom?.toLowerCase().includes(searchLower) ||
      admin.prenom?.toLowerCase().includes(searchLower) ||
      admin.email?.toLowerCase().includes(searchLower) ||
      admin.cin?.toLowerCase().includes(searchLower) ||
      (admin.group?.nom && admin.group.nom.toLowerCase().includes(searchLower))
    );
  });

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

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className={`dashboard-admin ${showModal || editingAdmin ? "blurred" : ""}`}>
      <style>{`
        :root {
          --primary-color: #1e1d54;
          --secondary-color: #426e91;
          --success-color: #22c55e;
          --error-color: #ef4444;
          --warning-color: #f59e0b;
          --info-color: #3b82f6;
          --background-color: #f5f7fa;
          --card-background: #ffffff;
          --text-primary: #1f2937;
          --text-secondary: #6b7280;
          --border-color: #d1d5db;
          --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.1);
          --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.15);
          --border-radius: 8px;
        }

        .dashboard-admin {
          display: flex;
          font-family: 'Roboto', sans-serif;
          min-height: 100vh;
          background-color: var(--background-color);
        }

        .blurred {
          filter: blur(4px);
          pointer-events: none;
        }

        .main-content {
          flex: 1;
          margin-left: 250px;
          padding: 2rem;
          transition: margin-left 0.3s ease;
        }

        .container-admin {
          max-width: 1200px;
          margin: 0 auto;
        }

        .admin-header {
          background: var(--card-background);
          padding: 2rem;
          border-radius: var(--border-radius);
          box-shadow: var(--shadow-sm);
          margin-bottom: 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 2rem;
          margin-top: 1rem;

        }

        .header-text h1 {
          font-size: 1.75rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
        }

        .header-text p {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin: 0.5rem 0 0;
        }

        .search-container {
          flex: 1;
          max-width: 400px;
        }

        .search-bar {
          position: relative;
          width: 100%;
        }

        .search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-secondary);
          font-size: 1rem;
        }

        .search-input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 2.5rem;
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius);
          font-size: 0.875rem;
          transition: border-color 0.2s ease;
        }

        .search-input:focus {
          outline: none;
          border-color: var(--primary-color);
          box-shadow: 0 0 0 3px rgba(30, 29, 84, 0.1);
        }

        .table-container {
          background: var(--card-background);
          border-radius: var(--border-radius);
          box-shadow: var(--shadow-sm);
          overflow-x: auto;
        }

        .admin-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 600px;
        }

        .admin-table th,
        .admin-table td {
          padding: 1rem;
          text-align: left;
          border-bottom: 1px solid var(--border-color);
        }

        .admin-table th {
          background: linear-gradient(90deg,rgb(245, 245, 245),rgb(249, 249, 249));
          color: black;
          font-size: 0.875rem;
          text-transform: uppercase;
          font-weight: 600;
        }

        .admin-table tbody tr {
          transition: background 0.2s ease;
        }

        .admin-table tbody tr:hover {
          background-color: #f3f4f6;
        }

        .group-name {
          color: var(--text-primary);
          font-size: 0.875rem;
        }

        .no-group {
          color: var(--text-secondary);
          font-style: italic;
        }

        .actions-cell {
          text-align: center;
          width: 120px;
        }

        .action-buttons {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
        }

        .btn-edit,
        .btn-delete {
          background: transparent;
          border: none;
          cursor: pointer;
          font-size: 1rem;
          padding: 0.5rem;
          border-radius: 50%;
          transition: all 0.2s ease;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .btn-edit:hover {
          background-color: rgba(59, 130, 246, 0.1);
          color: var(--info-color);
          transform: scale(1.1);
        }

        .btn-delete:hover {
          background-color: rgba(239, 68, 68, 0.1);
          color: var(--error-color);
          transform: scale(1.1);
        }

        .pagination {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 1.5rem;
        }

        .pagination button {
          background: var(--card-background);
          color: var(--text-primary);
          padding: 0.5rem 1rem;
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius);
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .pagination button:hover:not(:disabled) {
          background: var(--primary-color);
          color: white;
          border-color: var(--primary-color);
          transform: translateY(-2px);
        }

        .pagination button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          z-index: 1000;
          display: flex;
          justify-content: center;
          align-items: center;
          animation: fadeIn 0.3s ease-out;
        }

        .modal-content {
          background: var(--card-background);
          border-radius: var(--border-radius);
          padding: 2rem;
          max-width: 400px;
          width: 90%;
          box-shadow: var(--shadow-md);
          animation: slideIn 0.3s ease-out;
          text-align: center;
        }

        .modal-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 1rem;
        }

        .modal-message {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin-bottom: 1.5rem;
          line-height: 1.5;
        }

        .modal-actions {
          display: flex;
          justify-content: center;
          gap: 1rem;
        }

        .btn-confirm-delete {
          background: var(--error-color);
          color: white;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: var(--border-radius);
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-confirm-delete:hover {
          background: #dc2626;
          transform: translateY(-2px);
        }

        .btn-cancel-delete {
          background: #f3f4f6;
          color: var(--text-primary);
          padding: 0.75rem 1.5rem;
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius);
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-cancel-delete:hover {
          background: #e5e7eb;
          transform: translateY(-2px);
        }

        .success-popup {
          position: fixed;
          top: 1.5rem;
          right: 1.5rem;
          z-index: 2000;
          background: var(--card-background);
          border-radius: var(--border-radius);
          box-shadow: var(--shadow-md);
          padding: 1rem 1.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          max-width: 350px;
          animation: slideInRight 0.5s ease-out, fadeOut 0.5s 2.5s forwards;
        }

        .success-popup-content {
          background: linear-gradient(135deg, #d1fae5, #a7f3d0);
          color: var(--success-color);
          padding: 1rem;
          border-radius: var(--border-radius);
          display: flex;
          align-items: center;
          gap: 0.75rem;
          width: 100%;
        }

        .success-popup-icon {
          width: 32px;
          height: 32px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
        }

        .success-popup-message h4 {
          font-size: 1rem;
          font-weight: 600;
          margin: 0;
        }

        .success-popup-message p {
          font-size: 0.875rem;
          margin: 0.25rem 0 0;
          color: var(--text-secondary);
        }

        .success-popup-close {
          background: none;
          border: none;
          font-size: 1.25rem;
          cursor: pointer;
          color: var(--text-secondary);
          transition: all 0.2s ease;
        }

        .success-popup-close:hover {
          color: var(--text-primary);
        }

        .edit-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          z-index: 1000;
          display: flex;
          justify-content: center;
          align-items: center;
          animation: fadeIn 0.3s ease-out;
        }

        .edit-modal-container {
          background: var(--card-background);
          border-radius: var(--border-radius);
          padding: 1.5rem;
          max-width: 700px;
          width: 90%;
          box-shadow: var(--shadow-md);
          animation: slideIn 0.3s ease-out;
        }

        .loading-container {
          text-align: center;
          padding: 4rem;
          background: var(--card-background);
          border-radius: var(--border-radius);
          box-shadow: var(--shadow-sm);
          margin: 2rem auto;
          max-width: 600px;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid var(--border-color);
          border-top: 4px solid var(--primary-color);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem;
        }

        .error-container {
          text-align: center;
          padding: 2rem;
          background: var(--card-background);
          border-radius: var(--border-radius);
          box-shadow: var(--shadow-sm);
          margin: 2rem auto;
          max-width: 600px;
        }

        .error-icon {
          font-size: 2rem;
          color: var(--error-color);
          margin-bottom: 1rem;
        }

        .error-container h3 {
          font-size: 1.5rem;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }

        .error-container p {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin-bottom: 1rem;
        }

        .btn-retry {
          background: var(--primary-color);
          color: white;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: var(--border-radius);
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-retry:hover {
          background: var(--secondary-color);
          transform: translateY(-2px);
        }

        .toggle-btn {
          display: none;
          position: fixed;
          top: 1rem;
          left: 1rem;
          z-index: 1100;
          background: var(--primary-color);
          color: white;
          border: none;
          padding: 0.75rem;
          border-radius: var(--border-radius);
          cursor: pointer;
          font-size: 1rem;
        }

        .no-results {
          text-align: center;
          padding: 2rem;
          color: var(--text-secondary);
          font-style: italic;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideIn {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 1024px) {
          .main-content {
            margin-left: 0;
          }

          .admin-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .search-container {
            max-width: 100%;
          }
        }

        @media (max-width: 768px) {
          .toggle-btn {
            display: block;
          }

          .admin-table th,
          .admin-table td {
            padding: 0.75rem;
            font-size: 0.875rem;
          }

          .modal-content {
            padding: 1.5rem;
          }

          .modal-title {
            font-size: 1.25rem;
          }

          .modal-message {
            font-size: 0.875rem;
          }

          .success-popup {
            top: 1rem;
            right: 1rem;
            left: 1rem;
            max-width: none;
          }
        }

        @media (max-width: 480px) {
          .admin-table {
            min-width: 500px;
          }

          .modal-actions {
            flex-direction: column;
            gap: 0.5rem;
          }

          .btn-confirm-delete,
          .btn-cancel-delete {
            width: 100%;
          }

          .pagination button {
            padding: 0.5rem;
            font-size: 0.75rem;
          }
        }

        button:focus-visible,
        .btn-edit:focus-visible,
        .btn-delete:focus-visible,
        .btn-retry:focus-visible {
          outline: 2px solid var(--primary-color);
          outline-offset: 2px;
        }

        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

      <button className="toggle-btn" onClick={toggleSidebar}>
        {isSidebarOpen ? "✕" : "☰"}
      </button>
      <SidebarSupAdmin isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="main-content">
        <NavbarSuperAdmin />
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Chargement en cours...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <div className="error-icon">⚠️</div>
            <h3>Erreur de chargement</h3>
            <p>{error}</p>
            <button className="btn-retry" onClick={() => window.location.reload()}>
              Réessayer
            </button>
          </div>
        ) : (
          <div className="container-admin">
            <div className="admin-header">
              <div className="header-text">
                <h1>Administrateurs</h1>
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
                          {admin.groupes?.length > 0 ? (
                            admin.groupes.map((groupeNom, index) => (
                              <span key={index} className="group-name">
                                {groupeNom}{index !== admin.groupes.length - 1 && ', '}
                              </span>
                            ))
                          ) : (
                            <span className="no-group">Aucun groupe assigné</span>
                          )}
                        </td>
                        <td className="actions-cell">
                          <div className="action-buttons">
                            <button className="btn-edit" onClick={() => handleEdit(admin)}>
                              ✏️
                            </button>
                            <button
                              className="btn-delete"
                              onClick={() => {
                                setSelectedId(admin._id);
                                setShowModal(true);
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
                      <td colSpan="6" className="no-results">
                        Aucun administrateur trouvé pour votre recherche
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

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
        )}

        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3 className="modal-title">Confirmer l'archivage</h3>
              <p className="modal-message">Êtes-vous sûr de vouloir archiver cet administrateur ?</p>
              <div className="modal-actions">
                <button className="btn-confirm-delete" onClick={handleDelete}>
                  Confirmer
                </button>
                <button className="btn-cancel-delete" onClick={() => setShowModal(false)}>
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {showSuccessPopup && (
          <div className="success-popup">
            <div className="success-popup-content">
              <div className="success-popup-icon">✅</div>
              <div className="success-popup-message">
                <h4>Succès !</h4>
                <p>Admin archivé avec succès</p>
              </div>
              <button className="success-popup-close" onClick={() => setShowSuccessPopup(false)}>
                ×
              </button>
            </div>
          </div>
        )}

        {editingAdmin && (
          <div className="edit-modal-overlay">
            <div className="edit-modal-container">
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
  );
};

export default TousAdmins;