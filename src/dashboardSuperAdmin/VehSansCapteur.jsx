"use client";

import { useEffect, useState } from 'react';
import axios from 'axios';
import jwt_decode from 'jwt-decode';
import NavbarSuperAdmin from './NavBarSupAdmin';
import SidebarSupAdmin from './SideBarSupAdmin';
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
  const vehiculesPerPage = 5;

  // Récupérer l'ID et le groupe de l'admin connecté
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = jwt_decode(token);
      setAdminId(decoded.id);
      setAdminGroup(decoded.groupe); // Supposons que le groupe est stocké dans le token
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
      // Ajout du paramètre adminId pour filtrer par groupe admin
      const res = await axios.get('/api/vehicules/getVehicules', {
        params: {
          adminId, // Nouveau paramètre
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

  // Vérification périodique
  useEffect(() => {
    const interval = setInterval(fetchVehicules, 30000);
    return () => clearInterval(interval);
  }, [adminId]);

  useEffect(() => {
    fetchVehicules();
  }, [adminId, searchTerm, filteredMarque]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filteredMarque]);

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
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center' }}>
                      {adminId ? 'Aucun véhicule trouvé dans votre groupe' : 'Chargement...'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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