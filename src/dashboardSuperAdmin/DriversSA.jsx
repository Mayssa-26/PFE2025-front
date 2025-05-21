import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';
import { Map as MapIcon } from 'lucide-react';
import jwt_decode from 'jwt-decode';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import PropTypes from 'prop-types';
import NavbarSuperAdmin from './NavBarSupAdmin';
import SidebarSupAdmin from './SideBarSupAdmin';
import '../dashboardAdmin/dashAdmin.css';
import '../dashboardAdmin/SideBar.css';
import '../dashboardAdmin/NavBar.css';
import '../dashboardAdmin/Drivers.css';

/* 
 * Additional CSS for group display (add to Drivers.css):
 * .driver-info .group-name { font-size: 12px; color: #555; margin-top: 4px; }
 * .group-select { width: 100%; padding: 6px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px; }
 */

const DriversSA = ({ title = "Liste des Chauffeurs (Super Admin)", description = "Consultez et gérez tous les chauffeurs de tous les groupes" }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [drivers, setDrivers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showAddDriverModal, setShowAddDriverModal] = useState(false);
  const [driverForm, setDriverForm] = useState({ name: '', uniqueId: '', groupId: '' });
  const [loading, setLoading] = useState({ drivers: false, positions: false, form: false });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusSelection, setStatusSelection] = useState('all');
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  const TRACCAR_API = 'https://yepyou.treetronix.com/api';
  const TRACCAR_AUTH = { username: 'admin', password: 'admin' };

  // Authentification du super admin
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    try {
      const decoded = jwt_decode(token);
      setIsAuthenticated(true);
    } catch (tokenError) {
      console.error('Token error:', tokenError);
      localStorage.removeItem('token');
      navigate('/login');
    }
  }, [navigate]);

  // Récupération des groupes et chauffeurs depuis Traccar
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchDataFromTraccar = async () => {
      setLoading(prev => ({ ...prev, drivers: true }));
      setError(null);

      try {
        // Récupérer tous les groupes
        const groupsResponse = await axios.get(`${TRACCAR_API}/groups`, {
          auth: TRACCAR_AUTH,
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        });
        setGroups(groupsResponse.data);
        console.log('Groups:', groupsResponse.data);

        // Récupérer tous les chauffeurs
        const driversResponse = await axios.get(`${TRACCAR_API}/drivers`, {
          auth: TRACCAR_AUTH,
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        });
        console.log('Drivers:', driversResponse.data);

        // Récupérer tous les appareils
        const devicesResponse = await axios.get(`${TRACCAR_API}/devices`, {
          auth: TRACCAR_AUTH,
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        });
        console.log('Devices:', devicesResponse.data);

        // Mapper les chauffeurs avec leurs groupes et véhicules
        const driverMap = {};
        driversResponse.data.forEach(driver => {
          const group = groupsResponse.data.find(g => g.name === driver.attributes?.group) || { name: 'Aucun groupe' };
          driverMap[driver.name] = {
            name: driver.name,
            id: driver.id,
            uniqueId: driver.uniqueId,
            groupName: group.name,
            groupId: group.id,
            vehicles: [],
          };
        });

        devicesResponse.data.forEach(device => {
          const chauffeur = device.attributes?.chauffeur;
          if (driverMap[chauffeur]) {
            driverMap[chauffeur].vehicles.push({
              vehicleName: device.name,
              vehicleId: device.id,
              status: device.status === 'online' ? 'online' : 'offline',
            });
          }
        });

        const mappedDrivers = Object.values(driverMap);
        console.log('Mapped drivers:', mappedDrivers);
        setDrivers(mappedDrivers);

        if (mappedDrivers.length === 0) {
          setError('Aucun chauffeur trouvé dans les groupes');
        }
      } catch (err) {
        console.error('Traccar API error:', err);
        setError(err.response?.data?.message || 'Erreur de chargement des chauffeurs depuis Traccar');
        setDrivers([]);
      } finally {
        setLoading(prev => ({ ...prev, drivers: false }));
      }
    };

    fetchDataFromTraccar();
  }, [isAuthenticated]);

  // Filtrage des chauffeurs
  const filteredDrivers = drivers.filter(driver =>
    driver.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (statusSelection === 'all' || driver.vehicles.some(v => v.status === statusSelection))
  );

  // Gestion du formulaire d'ajout de chauffeur
  const handleDriverFormChange = (e) => {
    const { name, value } = e.target;
    setDriverForm(prev => ({ ...prev, [name]: value }));
  };

  const validateDriverForm = () => {
    if (!driverForm.name.trim()) {
      toast.error("Le nom du chauffeur est obligatoire");
      return false;
    }
    if (driverForm.name.trim().length < 2) {
      toast.error("Le nom du chauffeur doit contenir au moins 2 caractères");
      return false;
    }
    if (!driverForm.uniqueId.trim()) {
      toast.error("L'identifiant unique est obligatoire");
      return false;
    }
    if (!driverForm.groupId) {
      toast.error("Veuillez sélectionner un groupe");
      return false;
    }
    return true;
  };

  const handleDriverFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateDriverForm()) return;

    setLoading(prev => ({ ...prev, form: true }));
    setFormError(null);

    try {
      const selectedGroup = groups.find(g => g.id === parseInt(driverForm.groupId));
      const payload = {
        name: driverForm.name,
        uniqueId: driverForm.uniqueId,
        attributes: {
          group: selectedGroup?.name || '',
        },
      };

      await axios.post(`${TRACCAR_API}/drivers`, payload, {
        auth: TRACCAR_AUTH,
        headers: { 'Content-Type': 'application/json' },
      });

      toast.success("Chauffeur ajouté avec succès !");
      setDriverForm({ name: '', uniqueId: '', groupId: '' });
      setShowAddDriverModal(false);

      // Refresh drivers list
      const driversResponse = await axios.get(`${TRACCAR_API}/drivers`, {
        auth: TRACCAR_AUTH,
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      });

      const devicesResponse = await axios.get(`${TRACCAR_API}/devices`, {
        auth: TRACCAR_AUTH,
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      });

      const driverMap = {};
      driversResponse.data.forEach(driver => {
        const group = groups.find(g => g.name === driver.attributes?.group) || { name: 'Aucun groupe' };
        driverMap[driver.name] = {
          name: driver.name,
          id: driver.id,
          uniqueId: driver.uniqueId,
          groupName: group.name,
          groupId: group.id,
          vehicles: [],
        };
      });

      devicesResponse.data.forEach(device => {
        const chauffeur = device.attributes?.chauffeur;
        if (driverMap[chauffeur]) {
          driverMap[chauffeur].vehicles.push({
            vehicleName: device.name,
            vehicleId: device.id,
            status: device.status === 'online' ? 'online' : 'offline',
          });
        }
      });

      setDrivers(Object.values(driverMap));
    } catch (err) {
      console.error('Erreur lors de l\'ajout du chauffeur:', err);
      toast.error(`Échec de l'ajout du chauffeur: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(prev => ({ ...prev, form: false }));
    }
  };

  // Gestion du trajet (inchangé)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setLoading(prev => ({ ...prev, positions: true }));

    const formData = new FormData(e.target);
    const fromLocal = new Date(`${formData.get("fromDate")}T${formData.get("fromTime")}`);
    const toLocal = new Date(`${formData.get("toDate")}T${formData.get("toTime")}`);
    const fromUTC = new Date(fromLocal.getTime()).toISOString();
    const toUTC = new Date(toLocal.getTime()).toISOString();

    try {
      const response = await axios.get(`${TRACCAR_API}/reports/route`, {
        params: { deviceId: selectedVehicle.vehicleId, from: fromUTC, to: toUTC },
        auth: TRACCAR_AUTH,
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      });

      const positions = response.data.map(pos => ({
        ...pos,
        timestamp: pos.timestamp ? new Date(pos.timestamp).toISOString() : null,
      }));

      navigate('/trajet', {
        state: { positions, vehicleName: selectedVehicle.vehicleName, period: { from: fromUTC, to: toUTC } },
      });
    } catch (error) {
      console.error('Route error:', error);
      setFormError('Erreur lors du chargement du trajet: ' + error.message);
    } finally {
      setLoading(prev => ({ ...prev, positions: false }));
    }
  };

  // Générer un avatar à partir des initiales
  const getInitials = (name) => {
    const names = name.split(' ');
    return names.map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  // Générer une couleur d'avatar basée sur le nom
  const getAvatarColor = (name) => {
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 50%)`;
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="dashboard-admin">
      <button className="toggle-btn" onClick={toggleSidebar}>
        {isSidebarOpen ? '✕' : '☰'}
      </button>

      <SidebarSupAdmin isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      <div className="main-content">
        <NavbarSuperAdmin />

        <div className="container2">
          <div className="header">
            <h2>{title}</h2>
            <p>{description}</p>
          </div>

          <div className="filter-bar">
            <button
              className="group-btn primary"
              onClick={() => setShowAddDriverModal(true)}
              disabled={loading.drivers || groups.length === 0}
            >
              Ajouter un chauffeur
            </button>
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
              placeholder="Rechercher par nom de chauffeur..."
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

        <div className="drivers-section">
          <h3>Tous les chauffeurs</h3>
          {loading.drivers ? (
            <div className="loading">Chargement des chauffeurs...</div>
          ) : filteredDrivers.length === 0 ? (
            <div className="no-results">
              Aucun chauffeur trouvé {searchTerm && `pour "${searchTerm}"`}
            </div>
          ) : (
            <div className="drivers-grid">
              {filteredDrivers.map(driver => (
                <div
                  key={driver.id}
                  className="driver-card"
                  onClick={() => setSelectedDriver(driver)}
                  style={{ '--avatar-color': getAvatarColor(driver.name) }}
                >
                  <div className="driver-avatar">{getInitials(driver.name)}</div>
                  <div className="driver-info">
                    <h4>{driver.name}</h4>
                    <p className="group-name">Groupe: {driver.groupName}</p>
                    <p>Capteurs: {driver.vehicles.length}</p>
                    <p>Statut: {driver.vehicles.some(v => v.status === 'online') ? (
                      <span className="status-badge online">Online</span>
                    ) : (
                      <span className="status-badge offline">Offline</span>
                    )}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedDriver && (
        <div className="modal-overlay active">
          <div className="modal-content">
            <div className="driver-details">
              <h3>Chauffeur: {selectedDriver.name}</h3>
              <p>Groupe: {selectedDriver.groupName}</p>
              <h4>Véhicules attribués</h4>
              {selectedDriver.vehicles.length === 0 ? (
                <p>Aucun véhicule attribué</p>
              ) : (
                <ul className="vehicles-list">
                  {selectedDriver.vehicles.map(vehicle => (
                    <li key={vehicle.vehicleId} className="vehicle-item">
                      <div>
                        <strong>{vehicle.vehicleName}</strong>
                        <p>Statut: <span className={`status-badge ${vehicle.status}`}>{vehicle.status}</span></p>
                      </div>
                      <button
                        className="action-btn"
                        onClick={() => setSelectedVehicle(vehicle)}
                        disabled={loading.positions}
                        title="Voir le trajet"
                      >
                        <MapIcon size={18} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="form-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setSelectedDriver(null)}
                  disabled={loading.positions}
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedVehicle && (
        <div className="modal-overlay active">
          <div className="modal-content">
            <form className="map-form" onSubmit={handleSubmit}>
              <h3>Trajet du véhicule: {selectedVehicle.vehicleName}</h3>
              <p>Chauffeur: {selectedDriver.name}</p>
              {formError && (
                <div className="alert error">
                  {formError}
                  <button onClick={() => setFormError(null)} type="button">×</button>
                </div>
              )}
              <div className="form-grid">
                {['fromDate', 'toDate'].map(field => (
                  <div key={field} className="form-group">
                    <label htmlFor={field}>{field === 'fromDate' ? 'Date de début' : 'Date de fin'}</label>
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
                    <label htmlFor={field}>{field === 'fromTime' ? 'Heure de début' : 'Heure de fin'}</label>
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

      {showAddDriverModal && (
        <div className="modal-overlay active">
          <div className="modal-content">
            <div className="group-container">
              <div className="group-form-container">
                {formError && (
                  <div className="alert error">
                    {formError}
                    <button onClick={() => setFormError(null)} type="button">×</button>
                  </div>
                )}
                <form onSubmit={handleDriverFormSubmit}>
                  <div className="group-input-group">
                    <label htmlFor="name">Nom du chauffeur</label>
                    <input
                      id="name"
                      type="text"
                      name="name"
                      placeholder="Entrez le nom"
                      value={driverForm.name}
                      onChange={handleDriverFormChange}
                      required
                    />
                  </div>
                  <div className="group-input-group">
                    <label htmlFor="uniqueId">Identifiant unique</label>
                    <input
                      id="uniqueId"
                      type="text"
                      name="uniqueId"
                      placeholder="Entrez l'ID unique"
                      value={driverForm.uniqueId}
                      onChange={handleDriverFormChange}
                      required
                    />
                  </div>
                  <div className="group-input-group">
                    <label htmlFor="groupId">Groupe</label>
                    <select
                      id="groupId"
                      name="groupId"
                      value={driverForm.groupId}
                      onChange={handleDriverFormChange}
                      className="group-select"
                      required
                    >
                      <option value="">Sélectionner un groupe</option>
                      {groups.map(group => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-actions">
                    <button
                      type="submit"
                      className="group-btn primary"
                      disabled={loading.form || groups.length === 0}
                    >
                      {loading.form ? 'Envoi...' : 'Enregistrer'}
                    </button>
                    <button
                      type="button"
                      className="group-btn secondary"
                      onClick={() => setShowAddDriverModal(false)}
                      disabled={loading.form}
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              </div>
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
  );
};

DriversSA.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
};

export default DriversSA;