import { useEffect, useState } from 'react';
import axios from 'axios';
import jwt_decode from 'jwt-decode';
import Navbar from './NavBar';
import Sidebar from './SideBar';
import '../dashboardAdmin/SideBar.css';
import '../dashboardAdmin/NavBar.css';
import './Tous.css';

const VehiculesSansCapteur = () => {
  const [vehicules, setVehicules] = useState([]);
  const [filteredMarque, setFilteredMarque] = useState('');
  const [filteredGroupe] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [marques, setMarques] = useState([]);
  const [ setGroupes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [adminId, setAdminId] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const vehiculesPerPage = 5;

  // ➔ Décoder le token pour récupérer l'admin ID
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = jwt_decode(token);
      setAdminId(decoded.id);
      setIsAuthenticated(true);
    }
  }, []);

  // ➔ Charger les véhicules et groupes
  useEffect(() => {
    if (!adminId || !isAuthenticated) return;

    const fetchVehicules = async () => {
      try {
        const response = await axios.get(`/api/vehicules/admin/${adminId}`);
        if (response.data.success) {
          setVehicules(response.data.data[0]?.vehicules || []);
          setMarques([...new Set((response.data.data[0]?.vehicules || []).map(v => v.marque))]);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des véhicules:', error);
      }
    };

    const fetchGroupes = async () => {
      try {
        const response = await axios.get('/api/groupes');
        setGroupes(response.data);
      } catch (error) {
        console.error('Erreur lors de la récupération des groupes:', error);
      }
    };

    fetchVehicules();
    fetchGroupes();
  }, [adminId, isAuthenticated]);

  const filteredVehicules = vehicules.filter(v => {
    const matchesMarque = !filteredMarque || v.marque === filteredMarque;
    const matchesGroupe = !filteredGroupe || v.groupeId === filteredGroupe;
    const matchesSearch = searchTerm === '' || 
      (v.modele?.toLowerCase().includes(searchTerm.toLowerCase()) || 
       v.immatriculation?.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesMarque && matchesGroupe && matchesSearch;
  });

  const totalPages = Math.ceil(filteredVehicules.length / vehiculesPerPage);
  const currentVehicules = filteredVehicules.slice(
    (currentPage - 1) * vehiculesPerPage,
    currentPage * vehiculesPerPage
  );
  // Ajoutez cette fonction au début du composant
const filterVehiclesWithoutSensors = (vehicules, vehiclesWithSensors) => {
  if (!vehiclesWithSensors || vehiclesWithSensors.length === 0) return vehicules;
  
  const sensorVehicleNames = vehiclesWithSensors.map(v => v.name?.toLowerCase().trim());
  
  return vehicules.filter(v => {
    const immatriculation = v.immatriculation?.toLowerCase().trim();
    return !sensorVehicleNames.includes(immatriculation);
  });
};

// Modifiez le useEffect pour récupérer les véhicules avec capteurs
useEffect(() => {
  if (!adminId || !isAuthenticated) return;

  const fetchData = async () => {
    try {
      const [vehiculesResponse, sensorsResponse] = await Promise.all([
        axios.get(`/api/vehicules/admin/${adminId}`),
        axios.get("https://yepyou.treetronix.com/api/devices", {
          headers: {
            Authorization: "Basic " + btoa("admin:admin"),
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        })
      ]);
      
      if (vehiculesResponse.data.success) {
        const filtered = filterVehiclesWithoutSensors(
          vehiculesResponse.data.data[0]?.vehicules || [],
          sensorsResponse.data
        );
        
        setVehicules(filtered);
        setMarques([...new Set(filtered.map(v => v.marque))]);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des données:', error);
    }
  };

  fetchData();
}, [adminId, isAuthenticated]);

  return (
    <div className="dashboard-admin">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        <div className="container2">
          <div className="header">
            <h2>Véhicules Sans Capteur</h2>
            <p>Liste des véhicules enregistrés ne disposant pas de capteurs actifs.</p>
          </div>

          <div className="filter-bar">
            <input
              type="text"
              placeholder="Recherche par modèle ou immatriculation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <select
              value={filteredMarque}
              onChange={(e) => setFilteredMarque(e.target.value)}
            >
              <option value="">Toutes les marques</option>
              {marques.map((marque) => (
                <option key={marque} value={marque}>{marque}</option>
              ))}
            </select>

           
          </div>

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
              {currentVehicules.length > 0 ? (
                currentVehicules.map((v) => (
                  <tr key={`${v.groupeId}-${v.immatriculation}`}>
                    <td>{v.marque}</td>
                    <td>{v.modele}</td>
                    
                    <td>{v.immatriculation}</td>
                    <td>
                      <span className={`status-badge ${v.etat === 'Fonctionnel' ? 'online' : 'offline'}`}>
                        {v.etat || 'offline'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="no-vehicles">
                    {vehicules.length === 0 ? 'Chargement...' : 'Aucun véhicule trouvé'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
              >
                Précédent
              </button>
              <span>Page {currentPage} sur {totalPages}</span>
              <button
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
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

export default VehiculesSansCapteur;
