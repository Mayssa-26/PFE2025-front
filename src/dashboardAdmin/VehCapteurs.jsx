"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';
import Navbar from './NavBar';
import Sidebar from './SideBar';
import './dashAdmin.css';
import './SideBar.css';
import './NavBar.css';
import './Tous.css';
import PropTypes from 'prop-types';
import { Map, Loader } from 'lucide-react';
import './VehCap.css';
import jwt_decode from 'jwt-decode';

const VehCap = ({ statusFilter, title, description }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [loading, setLoading] = useState({ vehicles: false, positions: false });
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusSelection, setStatusSelection] = useState('all');
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [adminId, setAdminId] = useState(null);
  const [adminGroupName, setAdminGroupName] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const vehiclesPerPage = 3;

  // Récupération des informations de l'admin
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    try {
      const decoded = jwt_decode(token);
      setAdminId(decoded.id);
      setIsAuthenticated(true);

      // Récupérer le groupe de l'admin via l'API
      const fetchAdminGroup = async () => {
        try {
          const response = await axios.get(`api/vehicules/admin/${decoded.id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
      
          console.log('Full API Response:', response.data);
      
          if (response.data?.success) {
            // Handle array response
            const groupData = response.data.data[0] || response.data.data;
            
            // Check multiple possible field names for group name
            const groupName = groupData?.nom || groupData?.name || groupData?.groupName;
            
            if (groupName) {
              setAdminGroupName(groupName);
            } else {
              console.warn('Group data structure:', groupData);
              setError(`Group name not found in response for admin ${decoded.id}`);
            }
          } else {
            setError(response.data?.message || `No group assigned to admin ${decoded.id}`);
          }
        } catch (apiError) {
          console.error('Error fetching admin group:', apiError);
          setError(`Failed to fetch group: ${apiError.response?.data?.message || apiError.message}`);
        }
      };

      fetchAdminGroup();
    } catch (tokenError) {
      console.error('Erreur token:', tokenError);
      localStorage.removeItem('token');
      navigate('/login');
    }
  }, [navigate]);
// Récupération des véhicules depuis Traccar
// Récupération des véhicules depuis Traccar
useEffect(() => {
  if (!adminGroupName || !isAuthenticated) return;

  const fetchVehiclesFromTraccar = async () => {
    setLoading(prev => ({ ...prev, vehicles: true }));
    setError(null);

    try {
      // 1. Récupérer tous les groupes depuis Traccar
      const groupsResponse = await axios.get('https://yepyou.treetronix.com/api/groups', {
        headers: {
          Authorization: 'Basic ' + btoa('admin:admin'),
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      // 2. Trouver le groupe correspondant exactement au groupe de l'admin
      const matchedGroup = groupsResponse.data.find(
        group => group.name.toLowerCase() === adminGroupName.toLowerCase()
      );

      if (!matchedGroup) {
        setVehicles([]);
        setError(`Aucun groupe nommé "${adminGroupName}" trouvé dans Traccar`);
        return;
      }

      // 3. Récupérer uniquement les véhicules de ce groupe spécifique
      const devicesResponse = await axios.get('https://yepyou.treetronix.com/api/devices', {
        params: {
          groupId: matchedGroup.id, // Utilisation directe de l'ID du groupe
        },
        headers: {
          Authorization: 'Basic ' + btoa('admin:admin'),
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      // 4. Vérifier que les véhicules appartiennent bien au groupe
      const mappedVehicles = devicesResponse.data
        .filter(device => device.groupId === matchedGroup.id) // Filtre supplémentaire pour s'assurer
        .map(device => ({
          id: device.id,
          name: device.name,
          groupName: adminGroupName, // On utilise le nom du groupe de l'admin
          status: device.status === 'online' ? 'online' : 'offline',
          lastUpdate: device.lastUpdate,
          originalData: device,
        }));

      setVehicles(mappedVehicles);
      
      if (mappedVehicles.length === 0) {
        setError(`Aucun véhicule trouvé dans le groupe "${adminGroupName}"`);
      }
    } catch (err) {
      console.error('Erreur API Traccar:', err);
      setError(err.response?.data?.message || 'Erreur de chargement des véhicules depuis Traccar');
      setVehicles([]);
    } finally {
      setLoading(prev => ({ ...prev, vehicles: false }));
    }
  };

  fetchVehiclesFromTraccar();
}, [adminGroupName, isAuthenticated]);
 
  // Fonctions utilitaires
  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesStatus = statusSelection === 'all' || vehicle.status === statusSelection;
    const matchesFilter = !statusFilter || vehicle.status === statusFilter;
    const matchesSearch =
      vehicle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.id.toString().includes(searchTerm);
    return matchesStatus && matchesFilter && matchesSearch;
  });

  // Pagination
  const indexOfLastVehicle = currentPage * vehiclesPerPage;
  const indexOfFirstVehicle = indexOfLastVehicle - vehiclesPerPage;
  const currentVehicles = filteredVehicles.slice(indexOfFirstVehicle, indexOfLastVehicle);
  const totalPages = Math.ceil(filteredVehicles.length / vehiclesPerPage);

  // Gestion du trajet
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setLoading(prev => ({ ...prev, positions: true }));

    const formData = new FormData(e.target);

    // Créer des dates en heure locale
   // Remplacer cette partie dans handleSubmit
const fromLocal = new Date(`${formData.get("fromDate")}T${formData.get("fromTime")}`);
const toLocal = new Date(`${formData.get("toDate")}T${formData.get("toTime")}`);

// Convertir en UTC (corrigé)
const fromUTC = new Date(fromLocal.getTime()).toISOString();
const toUTC = new Date(toLocal.getTime()).toISOString();
    try {
      // Since we're using MongoDB data, we need to fetch the device ID from Traccar
      // by matching the vehicle's immatriculation with Traccar devices
      const traccarDevices = await axios.get('https://yepyou.treetronix.com/api/devices', {
        headers: {
          Authorization: 'Basic ' + btoa('admin:admin'),
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      const matchedDevice = traccarDevices.data.find(
        device => device.name.toLowerCase() === selectedVehicle.name.toLowerCase()
      );

      if (!matchedDevice) {
        throw new Error('Vehicle not found in Traccar');
      }

      const response = await axios.get(`https://yepyou.treetronix.com/api/reports/route`, {
        params: {
          deviceId: matchedDevice.id,
          from: fromUTC,
          to: toUTC,
        },
        headers: {
          Authorization: "Basic " + btoa("admin:admin"),
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      const positions = response.data.map(pos => ({
        ...pos,
        timestamp: pos.timestamp ? new Date(pos.timestamp).toISOString() : null,
      }));

      navigate("/trajet", {
        state: {
          positions,
          vehicleName: selectedVehicle.name,
          period: {
            from: fromUTC,
            to: toUTC,
          },
        },
      });
    } catch (error) {
      console.error('Erreur lors du chargement du trajet:', error);
      setFormError('Erreur lors du chargement du trajet: ' + error.message);
    } finally {
      setLoading(prev => ({ ...prev, positions: false }));
    }
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="dashboard-admin">
      <button className="toggle-btn" onClick={toggleSidebar}>
        {isSidebarOpen ? '✕' : '☰'}
      </button>

      <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      <div className="main-content">
        <Navbar />

        <div className="container2">
          <div className="header">
            <h2>{title}</h2>
            <p>{description}</p>
          </div>

          <Link to="/dashdAdmin" className="btn-back">
            Retour au dashboard
          </Link>

          <div className="filter-bar">
            <label htmlFor="statusSelect">Filtrer par statut :</label>
            <select
              id="statusSelect"
              value={statusSelection}
              onChange={(e) => setStatusSelection(e.target.value)}
              className="status-select"
            >
              <option value="all">Tous</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
            </select>
          </div>

          <div className="search-container">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Rechercher par nom ou ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {error && (
          <div className="alert error">
            {error}
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        {loading.vehicles ? (
          <div className="loading">Chargement des véhicules...</div>
        ) : filteredVehicles.length === 0 ? (
          <div className="no-results">
            Aucun véhicule trouvé {searchTerm && `pour "${searchTerm}"`}
          </div>
        ) : (
          <>
            <table className="vehicles-table">
              <thead>
                <tr>
                  <th>Immatriculation</th>
                  <th>ID</th>
                  <th>Groupe</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentVehicles.map(vehicle => (
                  <tr key={vehicle.id}>
                    <td>{vehicle.name}</td>
                    <td>{vehicle.id}</td>
                    <td>{vehicle.groupName}</td>
                    <td>
                      <span
                        className={`status-badge ${
                          vehicle.status === 'online' ? 'online-oval' : 'offline-oval'
                        }`}
                      >
                        {vehicle.status || 'inconnu'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="action-btn"
                        onClick={() => setSelectedVehicle(vehicle)}
                        disabled={loading.positions}
                        title="Voir le trajet"
                      >
                        {loading.positions && selectedVehicle?.id === vehicle.id ? (
                          <Loader size={18} className="animate-spin" />
                        ) : (
                          <Map size={18} />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
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
                <span>Page {currentPage} sur {totalPages}</span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage >= totalPages}
                >
                  Suivant
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {selectedVehicle && (
        <div className="modal-overlay active">
          <div className="modal-content">
            <form className="map-form" onSubmit={handleSubmit}>
              <h3>Trajet du véhicule: {selectedVehicle.name}</h3>

              {formError && (
                <div className="alert error">
                  {formError}
                  <button onClick={() => setFormError(null)} type="button">
                    ×
                  </button>
                </div>
              )}

              <div className="form-grid">
                {['fromDate', 'toDate'].map(field => (
                  <div key={field} className="form-group">
                    <label htmlFor={field}>
                      {field === 'fromDate' ? 'Date de début' : 'Date de fin'}
                    </label>
                    <input
                      type="date"
                      id={field}
                      name={field}
                      required
                      disabled={loading.positions}
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                ))}

                {['fromTime', 'toTime'].map(field => (
                  <div key={field} className="form-group">
                    <label htmlFor={field}>
                      {field === 'fromTime' ? 'Heure de début' : 'Heure de fin'}
                    </label>
                    <input
                      type="time"
                      id={field}
                      name={field}
                      required
                      disabled={loading.positions}
                    />
                  </div>
                ))}
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={loading.positions}>
                  {loading.positions ? (
                    <>
                      <span className="spinner-btn"></span> Chargement...
                    </>
                  ) : (
                    'Visualiser le trajet'
                  )}
                </button>

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setSelectedVehicle(null)}
                  disabled={loading.positions}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

VehCap.propTypes = {
  statusFilter: PropTypes.string,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
};

export default VehCap;