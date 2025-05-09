"use client";

import { useEffect, useState } from 'react';
import axios from 'axios';
import jwt_decode from 'jwt-decode';
import NavbarSuperAdmin from './NavBarSupAdmin';
import SidebarSupAdmin from './SideBarSupAdmin';
import { Link, useNavigate } from 'react-router-dom'; // Importer useNavigate
//import { FiEdit, FiTrash2 } from 'react-icons/fi';
import '../dashboardAdmin/SideBar.css';
import '../dashboardAdmin/NavBar.css';
import './tableVeh.css';


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
  const [showDeletePopup, setShowDeletePopup] = useState(false); // État pour le popup
  const [vehicleToDelete, setVehicleToDelete] = useState(null); // Véhicule à supprimer
  const vehiculesPerPage = 5;
  
  // Récupérer l'ID et le groupe de l'admin connecté
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = jwt_decode(token);
      setAdminId(decoded.id);
      setAdminGroup(decoded.groupe);
    }
  }, []);

  // Fonction de normalisation pour la comparaison
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
      console.error("Erreur Traccar:", error);
      return vehiclesList;
    }
  };

  const fetchVehicules = async () => {
    if (!adminId) return;
    
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/vehicules/getVehicules', {
        params: {
          adminId,
          marque: filteredMarque,
          search: searchTerm
        }
      });

      if (Array.isArray(res.data)) {
        const filteredVehicles = await checkAndRemoveTraccarVehicles(res.data);
        setVehicules(filteredVehicles);
        setMarques([...new Set(filteredVehicles.map(v => v.marque))]);
      } else {
        setVehicules([]);
      }
    } catch (error) {
      console.error('Erreur:', error);
      setError('Impossible de charger les véhicules');
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

  // Fonction pour supprimer un véhicule
  const handleDelete = async () => {
    try {
      await axios.delete(`/api/vehicules/${vehicleToDelete._id}`);
      setVehicules(vehicules.filter(v => v._id !== vehicleToDelete._id));
      setShowDeletePopup(false);
      setVehicleToDelete(null);
      setError(null);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      setError('Impossible de supprimer le véhicule');
      setShowDeletePopup(false);
    }
  };

  const filteredVehicules = vehicules.filter(v => {
    const matchesMarque = filteredMarque === '' || v.marque === filteredMarque;
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      v.modele.toLowerCase().includes(search) ||
      v.immatriculation.toLowerCase().includes(search);
    return matchesMarque && matchesSearch;
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

          {/* Bouton Ajouter */}
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
                  currentVehicules.map((v, i) => (
                    <tr key={i}>
                      <td>{v.marque}</td>
                      <td>{v.modele}</td>
                      <td>{v.immatriculation}</td>
                      <td>
                        <span className={`status-badge ${v.status === 'online' ? 'online' : 'offline'}`}>
                          {v.status || 'offline'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <Link
                          className="action-icon delete"
                            to="/AjouterVehicule"
                            state={{ vehicle: v }} // Passer les données du véhicule
                            
                          >
                           ✏️
                          </Link>
                          <button
                            className="action-icon delete"
                            onClick={() => {
                              setVehicleToDelete(v);
                              setShowDeletePopup(true);
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
                    <td colSpan="5" style={{ textAlign: 'center' }}>
                      {adminId ? 'Aucun véhicule trouvé dans votre groupe' : 'Chargement...'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {/* Popup de confirmation de suppression */}
          {showDeletePopup && (
            <div className="popup-overlay">
              <div className="popup-content">
                <h3>Confirmer la suppression</h3>
                <p>
                  Êtes-vous sûr de vouloir supprimer le véhicule{' '}
                  <strong>{vehicleToDelete?.marque} {vehicleToDelete?.modele}</strong> ({vehicleToDelete?.immatriculation}) ?
                </p>
                <div className="popup-actions">
                  <button
                    className="popup-btn confirm"
                    onClick={handleDelete}
                  >
                    Confirmer
                  </button>
                  <button
                    className="popup-btn cancel"
                    onClick={() => setShowDeletePopup(false)}
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
    </div>
  );
};

export default VehiculesSansCapteurSA;