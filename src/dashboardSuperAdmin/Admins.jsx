import { useState, useEffect } from "react";
import "../dashboardAdmin/Tous.css";
import './admins.css';
import '../register/Register.css';
import Register from "../register/Register";
import SidebarSupAdmin from "./SideBarSupAdmin";
import NavbarSuperAdmin from "./NavBarSupAdmin";
//import { useNavigate } from "react-router-dom";
import "../dashboardAdmin/SideBar.css";
import "../dashboardAdmin/NavBar.css";

const TousAdmins = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  //const navigate = useNavigate();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingAdmin, setEditingAdmin] = useState(null); // ajout pour l'édition
  const [ cinError, setCinError] = useState(false); // État pour gérer l'erreur CIN

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  useEffect(() => {
    const fetchAdminsWithGroups = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/groupes/getAdminsWithGroups");
        if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
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
      { 
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    const responseData = await response.json();
    
    if (!response.ok) {
      throw new Error(responseData.message || "Échec de la suppression");
    }

    // Debug: Vérification des données reçues
    console.log("Réponse complète du serveur:", responseData);
    
    // Mise à jour optimiste de l'interface
    setAdmins(prev => prev.filter(admin => admin._id !== selectedId));
    setShowModal(false);

    // Message de succès
    alert(`✅ ${responseData.message}`);
    
  } catch (error) {
    console.error("Erreur de suppression:", error);
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
        `http://localhost:8000/api/user/updateAdmin/${editingAdmin._id}`, // 🧭 correspond à req.params.id
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
      admin.nom.toLowerCase().includes(searchLower) ||
      admin.prenom.toLowerCase().includes(searchLower) ||
      admin.email.toLowerCase().includes(searchLower) ||
      admin.cin.toLowerCase().includes(searchLower) ||
      (admin.group && admin.group.nom && admin.group.nom.toLowerCase().includes(searchLower))
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
  if (loading) {
    return (
      <div className="dashboard-admin">
      <button className="toggle-btn" onClick={toggleSidebar}>
        ☰
      </button>
      <SidebarSupAdmin isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
        <div className="main-content">
          <NavbarSuperAdmin />
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
        <button className="toggle-btn" onClick={toggleSidebar}>
          {isSidebarOpen ? "✕" : "☰"}
        </button>
              <SidebarSupAdmin isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
              
        <div className="main-content">
          <NavbarSuperAdmin />
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
    <div className={`dashboard-admin ${showModal || editingAdmin ? "blurred" : ""}`}>
      <button className="toggle-btn" onClick={toggleSidebar}>
        {isSidebarOpen ? "✕" : "☰"}
      </button>
            <SidebarSupAdmin isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
            
      <div className="main-content">
        <NavbarSuperAdmin />

        <div className="container-admin">
          <div className="admin-header">
            <div className="header-text">
              <br />
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

        {/* Modal de suppression */}
        {showModal && (
  <div style={{ 
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
    animation: 'fadeIn 0.2s ease-out'
  }}>
    <div style={{ 
      background: 'white', 
      padding: '25px', 
      borderRadius: '10px', 
      maxWidth: '400px', 
      width: '90%',
      textAlign: 'center',
      boxShadow: '0 5px 15px rgba(0, 0, 0, 0.2)',
      animation: 'slideIn 0.3s ease-out'
    }}>
      <h3 style={{
        fontSize: '22px',
        fontWeight: 600,
        color: '#2c3e50',
        marginBottom: '15px'
      }}>Confirmer la suppression</h3>
      
      <p style={{
        color: '#555',
        fontSize: '16px',
        marginBottom: '25px',
        lineHeight: 1.5
      }}>Êtes-vous sûr de vouloir supprimer cet administrateur ?</p>
      
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '15px'
      }}>
        <button 
          onClick={handleDelete} 
          style={{ 
            padding: '10px 20px',
            backgroundColor: '#e74c3c',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            fontSize: '15px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#c0392b'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#e74c3c'}
        >
          Confirmer
        </button>
        
        <button 
          onClick={() => setShowModal(false)} 
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
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#ddd'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f1f1f1'}
        >
          <i style={{
            fontStyle: 'normal',
            fontSize: '14px'
          }}>❌</i>
          Annuler
        </button>
      </div>
    </div>
  </div>

)}
{showModal && (
  <div className="modal-overlay">
    <div className="modal-container">
      <h3 className="modal-title">Confirmer la suppression</h3>
      <p className="modal-message">Êtes-vous sûr de vouloir supprimer cet administrateur ?</p>
      <div className="modal-actions">
        <button onClick={handleDelete} className="btn-confirm-delete">Confirmer</button>
        <button onClick={() => setShowModal(false)} className="btn-cancel-delete">
          <span className="cancel-icon">❌</span>
          Annuler
        </button>
      </div>
    </div>
  </div>
)}

{editingAdmin && (
  <div style={{ position: 'absolute', top: 450, left: 0, right: 0, bottom: 1000, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
    <div style={{ background: 'white', width: '700px', padding: '20px', borderRadius: '8px', maxWidth: '1000px' }}>
     
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
