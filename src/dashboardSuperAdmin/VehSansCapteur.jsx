"use client";

import { useEffect, useState } from 'react';
import axios from 'axios';
import jwt_decode from 'jwt-decode';
import NavbarSuperAdmin from './NavBarSupAdmin';
import SidebarSupAdmin from './SideBarSupAdmin';
import { Link } from 'react-router-dom';
import './tableVeh.css';
import { MdArchive } from 'react-icons/md';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const VehiculesSansCapteurSA = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [vehicules, setVehicules] = useState([]);
  const [filteredMarque, setFilteredMarque] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [marques, setMarques] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [adminId, setAdminId] = useState(null);
  const [adminGroup, setAdminGroup] = useState(null);
  const [showArchivePopup, setShowArchivePopup] = useState(false);
  const [vehicleToArchive, setVehicleToArchive] = useState(null);
  const [isArchiving, setIsArchiving] = useState(false);
  const vehiculesPerPage = 5;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwt_decode(token);
        setAdminId(decoded.id);
        setAdminGroup(decoded.groupe);
      } catch (error) {
        console.error('Erreur lors du décodage du token:', error);
        setError('Session invalide. Veuillez vous reconnecter.');
        localStorage.removeItem('token');
      }
    } else {
      setError('Aucun token trouvé. Veuillez vous connecter.');
    }
  }, []);

  const normalizeString = (str) => str?.toLowerCase().replace(/\s|-/g, '');

  const checkAndRemoveTraccarVehicles = async (vehiclesList) => {
    try {
      const traccarResponse = await axios.get("https://yepyou.treetronix.com/api/devices", {
        headers: {
          Authorization: "Basic " + btoa("admin:admin"),
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
      const traccarVehicleNames = traccarResponse.data.map(v => normalizeString(v.name));
      return vehiclesList.filter(v => !traccarVehicleNames.includes(normalizeString(v.immatriculation)));
    } catch (error) {
      console.error("Erreur lors de la vérification Traccar:", error);
      toast.error('Erreur lors de la vérification des véhicules Traccar.');
      return vehiclesList;
    }
  };

const fetchVehicules = async () => {
  if (!adminId) return;
  
  setLoading(true);
  
  try {
    const token = localStorage.getItem('token');
    const res = await axios.get('/api/vehicules/getVehicules', {
      params: {
        adminId,
        marque: filteredMarque,
        search: searchTerm
        // Suppression du paramètre showArchived car le backend filtre déjà
      },
      headers: { Authorization: `Bearer ${token}` }
    });

    const filteredVehicles = await checkAndRemoveTraccarVehicles(res.data);
    setVehicules(filteredVehicles);
    setMarques([...new Set(filteredVehicles.map(v => v.marque))]);
    
  } catch (error) {
    toast.error(error.response?.data?.message || 'Erreur de chargement');
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    const interval = setInterval(fetchVehicules, 60000);
    return () => clearInterval(interval);
  }, [adminId]);

  useEffect(() => {
    fetchVehicules();
  }, [adminId, searchTerm, filteredMarque]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filteredMarque]);

const handleArchive = async () => {
  if (!vehicleToArchive) return;

  setIsArchiving(true);
  
  // Sauvegarde de l'ancien état pour rollback
  const previousVehicles = [...vehicules];
  
  try {
    // 1. Mise à jour optimiste immédiate
    setVehicules(prev => prev.filter(v => v._id !== vehicleToArchive._id));
    
    // 2. Envoi de la requête d'archivage
    const token = localStorage.getItem('token');
    await axios.put(
      `/api/vehicules/archive/${vehicleToArchive._id}`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    toast.success('Véhicule archivé avec succès');
    
    // 3. Optionnel : rechargement pour synchronisation
    // await fetchVehicules();

  } catch (error) {
    // Rollback en cas d'erreur
    setVehicules(previousVehicles);
    toast.error(error.response?.data?.message || 'Échec de l\'archivage');
  } finally {
    setShowArchivePopup(false);
    setIsArchiving(false);
  }
};

const filteredVehicules = vehicules.filter(v => {
  const matchesMarque = filteredMarque === '' || v.marque === filteredMarque;
  const search = searchTerm.toLowerCase();
  const matchesSearch =
    v.modele?.toLowerCase().includes(search) ||
    v.immatriculation?.toLowerCase().includes(search);
  const isNotArchived = !v.isArchived; // Exclure les véhicules archivés
  return matchesMarque && matchesSearch && isNotArchived;
});

  const totalPages = Math.ceil(filteredVehicules.length / vehiculesPerPage);
  const currentVehicules = filteredVehicules.slice(
    (currentPage - 1) * vehiculesPerPage,
    currentPage * vehiculesPerPage
  );

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
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
          <div className="header">
            <h2>Véhicules Sans Capteur</h2>
            <p>Liste des véhicules de votre groupe ne disposant pas de capteurs actifs.</p>
            {adminGroup && <p className="admin-group">Groupe: {adminGroup}</p>}
          </div>

          <div className="filter-bar">
            <input
              type="text"
              placeholder="Recherche par modèle ou immatriculation..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <select
              value={filteredMarque}
              onChange={e => setFilteredMarque(e.target.value)}
            >
              <option value="">Toutes les marques</option>
              {marques.map((marque, idx) => (
                <option key={idx} value={marque}>{marque}</option>
              ))}
            </select>
          </div>

          <div className="add-vehicle-btn">
            <Link to="/AjouterVehicule" className="link">
              <button className="btn-add">Ajouter un véhicule</button>
            </Link>
          </div>

          {error && (
            <div className="alert error">
              {error}
              <button onClick={() => setError(null)}>×</button>
            </div>
          )}

          {loading ? (
            <div className="loading">Chargement des véhicules...</div>
          ) : (
            <table className="vehicles-table">
              <thead>
                <tr>
                  <th>Marque</th>
                  <th>Modèle</th>
                  <th>Immatriculation</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentVehicules.length ? (
                  currentVehicules.map((v) => (
                    <tr key={v._id}>
                      <td>{v.marque || 'N/A'}</td>
                      <td>{v.modele || 'N/A'}</td>
                      <td>{v.immatriculation}</td>
                      <td>
                        <span className={`status-badge ${v.status === 'online' ? 'online' : 'offline'}`}>
                          {v.status || 'offline'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <Link
                            className="action-icon"
                            to="/AjouterVehicule"
                            state={{ vehicle: v }}
                          >
                            ✏️
                          </Link>
                         <button
  className={`action-icon archive ${isArchiving ? 'archiving' : ''}`}
  onClick={() => {
    setVehicleToArchive(v);
    setShowArchivePopup(true);
  }}
  disabled={isArchiving}
>
  {isArchiving ? '...' : <MdArchive />}
</button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center' }}>
                      {adminId ? 'Aucun véhicule trouvé dans votre groupe' : 'Chargement...'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {showArchivePopup && (
            <div className="popup-overlay">
              <div className="popup-content">
                <h3>🗂 Confirmer l'archivage</h3>
                <p>
                  Êtes-vous sûr de vouloir archiver le véhicule{' '}
                  <strong>{vehicleToArchive?.marque || 'N/A'} {vehicleToArchive?.modele || 'N/A'}</strong> ({vehicleToArchive?.immatriculation}) ?
                </p>
                <div className="popup-actions">
                  <button
                    className="popup-btn confirm"
                    onClick={handleArchive}
                    disabled={isArchiving}
                    style={{ backgroundColor: '#3498db' }}
                  >
                    {isArchiving ? 'Archivage...' : 'Confirmer'}
                  </button>
                  <button
                    className="popup-btn cancel"
                    onClick={() => setShowArchivePopup(false)}
                    disabled={isArchiving}
                  >
                    ❌ Annuler
                  </button>
                </div>
              </div>
            </div>
          )}

          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Précédent
              </button>
              <span className="current-page">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Suivant
              </button>
            </div>
          )}
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

export default VehiculesSansCapteurSA;