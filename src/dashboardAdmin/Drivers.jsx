import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';
import Navbar from './NavBar';
import Sidebar from './SideBar';
import './dashAdmin.css';
import './SideBar.css';
import './NavBar.css';
import './Drivers.css';
import PropTypes from 'prop-types';
import { Map as MapIcon } from 'lucide-react';
import jwt_decode from 'jwt-decode';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

/* 
 * Additional CSS needed (add to Drivers.css or your stylesheet):
 * .group-container { max-width: 400px; margin: 0 auto; padding: 10px; }
 * .group-form-container { background: #fff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); padding: 15px; }
 * .group-input-group { margin-bottom: 10px; }
 * .group-input-group label { display: block; font-size: 14px; margin-bottom: 4px; font-weight: 500; }
 * .group-input-group input { width: 100%; padding: 6px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px; }
 * .form-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 10px; }
 * .group-btn { padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; }
 * .group-btn.primary { background: #007bff; color: #fff; }
 * .group-btn.secondary { background: #6c757d; color: #fff; }
 * .group-btn:disabled { background: #ccc; cursor: not-allowed; }
 * .modal-overlay.active { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; }
 * .modal-content { background: #fff; border-radius: 8px; padding: 15px; max-width: 400px; width: 100%; }
 * .alert.error { padding: 8px; background: #f8d7da; color: #721c24; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; font-size: 14px; }
 */

const Drivers = ({ title = "Liste des Chauffeurs", description = "Consultez et gérez les chauffeurs de votre groupe" }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [drivers, setDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showAddDriverModal, setShowAddDriverModal] = useState(false);
  const [driverForm, setDriverForm] = useState({ name: '', uniqueId: '' });
  const [loading, setLoading] = useState({ drivers: false, positions: false, form: false });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusSelection, setStatusSelection] = useState('all');
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [adminId, setAdminId] = useState(null);
  const [adminGroupName, setAdminGroupName] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  const TRACCAR_API = 'https://yepyou.treetronix.com/api';
  const TRACCAR_AUTH = { username: 'admin', password: 'admin' };

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

      const fetchAdminGroup = async () => {
        try {
          console.log('Fetching admin group for ID:', decoded.id);
          const response = await axios.get(`api/vehicules/admin/${decoded.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          console.log('Admin group response:', response.data);

          if (response.data?.success) {
            const groupData = response.data.data[0] || response.data.data;
            const groupName = groupData?.nom || groupData?.name || groupData?.groupName;
            if (groupName) {
              setAdminGroupName(groupName);
            } else {
              console.warn('Group data structure:', groupData);
              setError(`Nom du groupe non trouvé pour l'admin ${decoded.id}`);
            }
          } else {
            setError(response.data?.message || `Aucun groupe assigné à l'admin ${decoded.id}`);
          }
        } catch (apiError) {
          console.error('Admin group error:', apiError);
          setError(`Erreur lors de la récupération du groupe: ${apiError.response?.data?.message || apiError.message}`);
        }
      };

      fetchAdminGroup();
    } catch (tokenError) {
      console.error('Token error:', tokenError);
      localStorage.removeItem('token');
      navigate('/login');
    }
  }, [navigate]);

  // Récupération des chauffeurs depuis Traccar
  useEffect(() => {
    if (!adminGroupName || !isAuthenticated) return;

    const fetchDriversFromTraccar = async () => {
      setLoading(prev => ({ ...prev, drivers: true }));
      setError(null);

      try {
        console.log('Fetching groups from Traccar...');
        const groupsResponse = await axios.get(`${TRACCAR_API}/groups`, {
          auth: TRACCAR_AUTH,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        });
        console.log('Groups response:', groupsResponse.data);

        const matchedGroup = groupsResponse.data.find(group => group.name.toLowerCase() === adminGroupName.toLowerCase());
        if (!matchedGroup) {
          console.log('No matching group found for:', adminGroupName);
          setDrivers([]);
          setError(`Aucun groupe nommé "${adminGroupName}" trouvé dans Traccar`);
          return;
        }
        console.log('Matched group:', matchedGroup);

        console.log('Fetching drivers from Traccar...');
        const driversResponse = await axios.get(`${TRACCAR_API}/drivers`, {
          auth: TRACCAR_AUTH,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        });
        console.log('Drivers response:', driversResponse.data);

        const filteredDrivers = driversResponse.data
          .filter(driver => driver.attributes?.group === matchedGroup.name)
          .map(driver => ({
            name: driver.name,
            vehicles: [],
            id: driver.id,
            uniqueId: driver.uniqueId,
          }));

        console.log('Fetching devices for group ID:', matchedGroup.id);
        const devicesResponse = await axios.get(`${TRACCAR_API}/devices`, {
          params: { groupId: matchedGroup.id },
          auth: TRACCAR_AUTH,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        });
        console.log('Devices response:', devicesResponse.data);

        const driverMap = {};
        filteredDrivers.forEach(driver => {
          driverMap[driver.name] = {
            name: driver.name,
            id: driver.id,
            uniqueId: driver.uniqueId,
            vehicles: [],
          };
        });

        devicesResponse.data
          .filter(device => device.groupId === matchedGroup.id && device.attributes?.chauffeur)
          .forEach(device => {
            const chauffeur = device.attributes.chauffeur;
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
          setError(`Aucun chauffeur trouvé dans le groupe "${adminGroupName}"`);
        }
      } catch (err) {
        console.error('Traccar API error:', err);
        setError(err.response?.data?.message || 'Erreur de chargement des chauffeurs depuis Traccar');
        setDrivers([]);
      } finally {
        setLoading(prev => ({ ...prev, drivers: false }));
      }
    };

    fetchDriversFromTraccar();
  }, [adminGroupName, isAuthenticated]);

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
    if (!adminGroupName) {
      toast.error("Aucun groupe assigné à l'admin");
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
      const payload = {
        name: driverForm.name,
        uniqueId: driverForm.uniqueId,
        attributes: {
          group: adminGroupName,
        },
      };

      await axios.post(`${TRACCAR_API}/drivers`, payload, {
        auth: TRACCAR_AUTH,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      toast.success("Chauffeur ajouté avec succès !");
      setDriverForm({ name: '', uniqueId: '' });
      setShowAddDriverModal(false);

      // Refresh drivers list
      const driversResponse = await axios.get(`${TRACCAR_API}/drivers`, {
        auth: TRACCAR_AUTH,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      const groupsResponse = await axios.get(`${TRACCAR_API}/groups`, {
        auth: TRACCAR_AUTH,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      const matchedGroup = groupsResponse.data.find(group => group.name.toLowerCase() === adminGroupName.toLowerCase());
      if (matchedGroup) {
        const filteredDrivers = driversResponse.data
          .filter(driver => driver.attributes?.group === matchedGroup.name)
          .map(driver => ({
            name: driver.name,
            id: driver.id,
            uniqueId: driver.uniqueId,
            vehicles: [],
          }));

        const devicesResponse = await axios.get(`${TRACCAR_API}/devices`, {
          params: { groupId: matchedGroup.id },
          auth: TRACCAR_AUTH,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        });

        const driverMap = {};
        filteredDrivers.forEach(driver => {
          driverMap[driver.name] = {
            name: driver.name,
            id: driver.id,
            uniqueId: driver.uniqueId,
            vehicles: [],
          };
        });

        devicesResponse.data
          .filter(device => device.groupId === matchedGroup.id && device.attributes?.chauffeur)
          .forEach(device => {
            const chauffeur = device.attributes.chauffeur;
            if (driverMap[chauffeur]) {
              driverMap[chauffeur].vehicles.push({
                vehicleName: device.name,
                vehicleId: device.id,
                status: device.status === 'online' ? 'online' : 'offline',
              });
            }
          });

        setDrivers(Object.values(driverMap));
      }
    } catch (err) {
      console.error('Erreur lors de l\'ajout du chauffeur:', err);
      toast.error(`Échec de l'ajout du chauffeur: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(prev => ({ ...prev, form: false }));
    }
  };

  // Gestion du trajet
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
      console.log('Fetching route for vehicle ID:', selectedVehicle.vehicleId);
      const response = await axios.get(`${TRACCAR_API}/reports/route`, {
        params: { deviceId: selectedVehicle.vehicleId, from: fromUTC, to: toUTC },
        auth: TRACCAR_AUTH,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });
      console.log('Route response:', response.data);

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

      <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      <div className="main-content">
        <Navbar />

        <div className="container2">
          <div className="header">
            <h2>{title}</h2>
            <p>{description}</p>
          </div>

          <div className="filter-bar">
            <button
              className="group-btn primary"
              onClick={() => setShowAddDriverModal(true)}
              disabled={loading.drivers || !adminGroupName}
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
          <h3>Chauffeurs du groupe {adminGroupName || '...'}</h3>
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
                  key={driver.name}
                  className="driver-card"
                  onClick={() => setSelectedDriver(driver)}
                  style={{ '--avatar-color': getAvatarColor(driver.name) }}
                >
                  <div className="driver-avatar">{getInitials(driver.name)}</div>
                  <div className="driver-info">
                    <h4>{driver.name}</h4>
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
                  <div className="form-actions">
                    <button
                      type="submit"
                      className="group-btn primary"
                      disabled={loading.form || !adminGroupName}
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

Drivers.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
};

export default Drivers;