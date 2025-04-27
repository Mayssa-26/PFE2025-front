import { useEffect, useState } from 'react';
import axios from 'axios';
import NavbarSuperAdmin from './NavBarSupAdmin';
import SidebarSupAdmin from './SideBarSupAdmin';
import '../dashboardAdmin/SideBar.css';
import '../dashboardAdmin/NavBar.css';
import './tableVeh.css';

const VehiculesSansCapteurSA = () => {
  const [vehicules, setVehicules] = useState([]);
  const [filteredMarque, setFilteredMarque] = useState('');
  const [filteredGroupe, setFilteredGroupe] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [marques, setMarques] = useState([]);
  const [groupes, setGroupes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const vehiculesPerPage = 5;

  const fetchVehicules = async () => {
    try {
      const res = await axios.get('/api/vehicules/getVehicules', {
        params: {
          marque: filteredMarque,
          search: searchTerm,
          groupe: filteredGroupe
        }
      });
      if (Array.isArray(res.data)) {
        setVehicules(res.data);
        const uniqueMarques = [...new Set(res.data.map(v => v.marque))];
        setMarques(uniqueMarques);
      } else {
        setVehicules([]);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des véhicules:', error);
    }
  };

  const fetchGroupes = async () => {
    try {
      const res = await axios.get('/api/groupes');
      setGroupes(res.data);
    } catch (error) {
      console.error("Erreur lors de la récupération des groupes :", error);
    }
  };

  useEffect(() => {
    fetchVehicules();
  }, [searchTerm, filteredMarque, filteredGroupe]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filteredMarque, filteredGroupe]);

  useEffect(() => {
    fetchGroupes();
  }, []);

  const filteredVehicules = vehicules.filter(v => {
    const matchesMarque = filteredMarque === '' || v.marque === filteredMarque;
    const matchesGroupe = filteredGroupe === '' || v.proprietaire?._id === filteredGroupe;
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      v.modele.toLowerCase().includes(search) ||
      v.immatriculation.toLowerCase().includes(search);
    return matchesMarque && matchesGroupe && matchesSearch;
  });

  const totalPages = Math.ceil(filteredVehicules.length / vehiculesPerPage);
  const currentVehicules = filteredVehicules.slice(
    (currentPage - 1) * vehiculesPerPage,
    currentPage * vehiculesPerPage
  );

  return (
    <div className="dashboard-admin">
      <SidebarSupAdmin />
      <div className="main-content">
        <NavbarSuperAdmin />
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

            <select
              value={filteredGroupe}
              onChange={e => setFilteredGroupe(e.target.value)}
            >
              <option value="">Tous les groupes</option>
              {groupes.map((groupe, idx) => (
                <option key={idx} value={groupe._id}>{groupe.nom}</option>
              ))}
            </select>
          </div>

          <table className="vehicles-table">
            <thead>
              <tr>
                <th>Marque</th>
                <th>Modèle</th>
                <th>Groupe</th>
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
                    <td>{v.proprietaire?.nom || 'N/A'}</td>
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
                  <td colSpan="5" style={{ textAlign: 'center' }}>Aucun véhicule trouvé</td>
                </tr>
              )}
            </tbody>
          </table>

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
