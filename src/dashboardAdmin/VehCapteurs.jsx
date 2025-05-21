import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaPlus } from 'react-icons/fa';
import { Map, Loader } from 'lucide-react';
import Navbar from './NavBar';
import Sidebar from './SideBar';
import './dashAdmin.css';
import './SideBar.css';
import './NavBar.css';
import './Tous.css';
import './VehCap.css';
import PropTypes from 'prop-types';
import jwt_decode from 'jwt-decode';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const VehCap = ({ statusFilter, title = "Liste des Véhicules", description = "Consultez et gérez les véhicules de votre groupe" }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [showEditVehicleModal, setShowEditVehicleModal] = useState(false);
  const [showAddDriverModal, setShowAddDriverModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState(null);
  const [vehicleForm, setVehicleForm] = useState({ name: '', uniqueId: '', driverId: '' });
  const [editVehicleForm, setEditVehicleForm] = useState({ id: '', name: '', uniqueId: '', driverId: '' });
  const [driverForm, setDriverForm] = useState({ name: '', uniqueId: '' });
  const [loading, setLoading] = useState({ vehicles: false, positions: false, form: false, driverForm: false });
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusSelection, setStatusSelection] = useState('all');
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [driverFormError, setDriverFormError] = useState(null);
  const [adminId, setAdminId] = useState(null);
  const [adminGroupName, setAdminGroupName] = useState(null);
  const [adminGroupId, setAdminGroupId] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const vehiclesPerPage = 3;

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
          const response = await axios.get(`api/vehicules/admin/${decoded.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (response.data?.success) {
            const groupData = response.data.data[0] || response.data.data;
            const groupName = groupData?.nom || groupData?.name || groupData?.groupName;
            if (groupName) {
              setAdminGroupName(groupName);
            } else {
              setError(`Nom du groupe non trouvé pour l'admin ${decoded.id}`);
            }
          } else {
            setError(response.data?.message || `Aucun groupe assigné à l'admin ${decoded.id}`);
          }
        } catch (apiError) {
          console.error('Erreur lors de la récupération du groupe:', apiError);
          setError(`Erreur: ${apiError.response?.data?.message || apiError.message}`);
        }
      };

      fetchAdminGroup();
    } catch (tokenError) {
      console.error('Erreur token:', tokenError);
      localStorage.removeItem('token');
      navigate('/login');
    }
  }, [navigate]);

  // Récupération des groupes, chauffeurs et véhicules depuis Traccar
  useEffect(() => {
    if (!adminGroupName || !isAuthenticated) return;

    const fetchDataFromTraccar = async () => {
      setLoading(prev => ({ ...prev, vehicles: true }));
      setError(null);

      try {
        const groupsResponse = await axios.get(`${TRACCAR_API}/groups`, {
          auth: TRACCAR_AUTH,
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        });

        const matchedGroup = groupsResponse.data.find(
          group => group.name.toLowerCase() === adminGroupName.toLowerCase()
        );
        if (!matchedGroup) {
          setVehicles([]);
          setError(`Aucun groupe nommé "${adminGroupName}" trouvé dans Traccar`);
          return;
        }
        setAdminGroupId(matchedGroup.id);

        const driversResponse = await axios.get(`${TRACCAR_API}/drivers`, {
          auth: TRACCAR_AUTH,
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        });
        setDrivers(driversResponse.data.filter(driver => driver.attributes?.group === adminGroupName));

        const devicesResponse = await axios.get(`${TRACCAR_API}/devices`, {
          params: { groupId: matchedGroup.id },
          auth: TRACCAR_AUTH,
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        });

        const mappedVehicles = devicesResponse.data
          .filter(device => device.groupId === matchedGroup.id)
          .map(device => ({
            id: device.id,
            name: device.name,
            groupName: adminGroupName,
            status: device.status === 'online' ? 'online' : 'offline',
            lastUpdate: device.lastUpdate,
            driverName: device.attributes?.chauffeur || '-',
            originalData: device,
          }));

        setVehicles(mappedVehicles);

        if (mappedVehicles.length === 0) {
          setError(`Aucun véhicule trouvé dans le groupe "${adminGroupName}"`);
        }
      } catch (err) {
        console.error('Erreur API Traccar:', err);
        setError(err.response?.data?.message || 'Erreur de chargement des données depuis Traccar');
        setVehicles([]);
      } finally {
        setLoading(prev => ({ ...prev, vehicles: false }));
      }
    };

    fetchDataFromTraccar();
  }, [adminGroupName, isAuthenticated]);

  // Gestion du formulaire d'ajout de véhicule
  const handleVehicleFormChange = (e) => {
    const { name, value } = e.target;
    setVehicleForm(prev => ({ ...prev, [name]: value }));
  };

  const validateVehicleForm = () => {
    if (!vehicleForm.name.trim()) {
      toast.error("Le nom du véhicule est obligatoire");
      return false;
    }
    if (vehicleForm.name.trim().length < 2) {
      toast.error("Le nom du véhicule doit contenir au moins 2 caractères");
      return false;
    }
    if (!vehicleForm.uniqueId.trim()) {
      toast.error("L'identifiant unique est obligatoire");
      return false;
    }
    return true;
  };

  const handleVehicleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateVehicleForm()) return;

    setLoading(prev => ({ ...prev, form: true }));
    setFormError(null);

    try {
      const payload = {
        name: vehicleForm.name,
        uniqueId: vehicleForm.uniqueId,
        groupId: adminGroupId,
        attributes: {
          chauffeur: vehicleForm.driverId
            ? drivers.find(driver => driver.id === parseInt(vehicleForm.driverId))?.name || ''
            : '',
        },
      };

      await axios.post(`${TRACCAR_API}/devices`, payload, {
        auth: TRACCAR_AUTH,
        headers: { 'Content-Type': 'application/json' },
      });

      toast.success("Véhicule ajouté avec succès !");
      setVehicleForm({ name: '', uniqueId: '', driverId: '' });
      setShowAddVehicleModal(false);

      const devicesResponse = await axios.get(`${TRACCAR_API}/devices`, {
        params: { groupId: adminGroupId },
        auth: TRACCAR_AUTH,
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      });

      const mappedVehicles = devicesResponse.data
        .filter(device => device.groupId === adminGroupId)
        .map(device => ({
          id: device.id,
          name: device.name,
          groupName: adminGroupName,
          status: device.status === 'online' ? 'online' : 'offline',
          lastUpdate: device.lastUpdate,
          driverName: device.attributes?.chauffeur || '-',
          originalData: device,
        }));

      setVehicles(mappedVehicles);
    } catch (err) {
      console.error('Erreur lors de l\'ajout du véhicule:', err);
      toast.error(`Échec de l'ajout du véhicule: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(prev => ({ ...prev, form: false }));
    }
  };

  // Gestion du formulaire de modification de véhicule
  const handleEditVehicleFormChange = (e) => {
    const { name, value } = e.target;
    setEditVehicleForm(prev => ({ ...prev, [name]: value }));
  };

  const validateEditVehicleForm = () => {
    if (!editVehicleForm.name.trim()) {
      toast.error("Le nom du véhicule est obligatoire");
      return false;
    }
    if (editVehicleForm.name.trim().length < 2) {
      toast.error("Le nom du véhicule doit contenir au moins 2 caractères");
      return false;
    }
    if (!editVehicleForm.uniqueId.trim()) {
      toast.error("L'identifiant unique est obligatoire");
      return false;
    }
    return true;
  };

  const handleEditVehicleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateEditVehicleForm()) return;

    setLoading(prev => ({ ...prev, form: true }));
    setFormError(null);

    try {
      const payload = {
        id: editVehicleForm.id,
        name: editVehicleForm.name,
        uniqueId: editVehicleForm.uniqueId,
        groupId: adminGroupId,
        attributes: {
          chauffeur: editVehicleForm.driverId
            ? drivers.find(driver => driver.id === parseInt(editVehicleForm.driverId))?.name || ''
            : '',
        },
      };

      await axios.put(`${TRACCAR_API}/devices/${editVehicleForm.id}`, payload, {
        auth: TRACCAR_AUTH,
        headers: { 'Content-Type': 'application/json' },
      });

      toast.success("Véhicule modifié avec succès !");
      setEditVehicleForm({ id: '', name: '', uniqueId: '', driverId: '' });
      setShowEditVehicleModal(false);

      const devicesResponse = await axios.get(`${TRACCAR_API}/devices`, {
        params: { groupId: adminGroupId },
        auth: TRACCAR_AUTH,
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      });

      const mappedVehicles = devicesResponse.data
        .filter(device => device.groupId === adminGroupId)
        .map(device => ({
          id: device.id,
          name: device.name,
          groupName: adminGroupName,
          status: device.status === 'online' ? 'online' : 'offline',
          lastUpdate: device.lastUpdate,
          driverName: device.attributes?.chauffeur || '-',
          originalData: device,
        }));

      setVehicles(mappedVehicles);
    } catch (err) {
      console.error('Erreur lors de la modification du véhicule:', err);
      toast.error(`Échec de la modification du véhicule: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(prev => ({ ...prev, form: false }));
    }
  };

  // Suppression d'un véhicule
  const handleDeleteVehicle = async () => {
    if (!vehicleToDelete) return;

    setLoading(prev => ({ ...prev, form: true }));
    setError(null);

    try {
      await axios.delete(`${TRACCAR_API}/devices/${vehicleToDelete}`, {
        auth: TRACCAR_AUTH,
        headers: { 'Content-Type': 'application/json' },
      });

      toast.success("Véhicule supprimé avec succès !");

      const devicesResponse = await axios.get(`${TRACCAR_API}/devices`, {
        params: { groupId: adminGroupId },
        auth: TRACCAR_AUTH,
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      });

      const mappedVehicles = devicesResponse.data
        .filter(device => device.groupId === adminGroupId)
        .map(device => ({
          id: device.id,
          name: device.name,
          groupName: adminGroupName,
          status: device.status === 'online' ? 'online' : 'offline',
          lastUpdate: device.lastUpdate,
          driverName: device.attributes?.chauffeur || '-',
          originalData: device,
        }));

      setVehicles(mappedVehicles);
      setShowDeleteModal(false);
      setVehicleToDelete(null);
    } catch (err) {
      console.error('Erreur lors de la suppression du véhicule:', err);
      toast.error(`Échec de la suppression du véhicule: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(prev => ({ ...prev, form: false }));
    }
  };

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
    return true;
  };

  const handleDriverFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateDriverForm()) return;

    setLoading(prev => ({ ...prev, driverForm: true }));
    setDriverFormError(null);

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
        headers: { 'Content-Type': 'application/json' },
      });

      toast.success("Chauffeur ajouté avec succès !");
      setDriverForm({ name: '', uniqueId: '' });
      setShowAddDriverModal(false);

      const driversResponse = await axios.get(`${TRACCAR_API}/drivers`, {
        auth: TRACCAR_AUTH,
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      });
      setDrivers(driversResponse.data.filter(driver => driver.attributes?.group === adminGroupName));

      const newDriver = driversResponse.data.find(driver => driver.uniqueId === driverForm.uniqueId);
      if (newDriver) {
        setVehicleForm(prev => ({ ...prev, driverId: newDriver.id.toString() }));
        setEditVehicleForm(prev => ({ ...prev, driverId: newDriver.id.toString() }));
      }
    } catch (err) {
      console.error('Erreur lors de l\'ajout du chauffeur:', err);
      toast.error(`Échec de l'ajout du chauffeur: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(prev => ({ ...prev, driverForm: false }));
    }
  };

  // Filtrage des véhicules
  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesStatus = statusSelection === 'all' || vehicle.status === statusSelection;
    const matchesFilter = !statusFilter || vehicle.status === statusFilter;
    const matchesSearch =
      vehicle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.id.toString().includes(searchTerm) ||
      vehicle.driverName.toLowerCase().includes(searchTerm.toLowerCase());
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
    const fromLocal = new Date(`${formData.get("fromDate")}T${formData.get("fromTime")}`);
    const toLocal = new Date(`${formData.get("toDate")}T${formData.get("toTime")}`);
    const fromUTC = new Date(fromLocal.getTime()).toISOString();
    const toUTC = new Date(toLocal.getTime()).toISOString();

    try {
      const traccarDevices = await axios.get(`${TRACCAR_API}/devices`, {
        auth: TRACCAR_AUTH,
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      });

      const matchedDevice = traccarDevices.data.find(
        device => device.name.toLowerCase() === selectedVehicle.name.toLowerCase()
      );

      if (!matchedDevice) {
        throw new Error('Véhicule non trouvé dans Traccar');
      }

      const response = await axios.get(`${TRACCAR_API}/reports/route`, {
        params: { deviceId: matchedDevice.id, from: fromUTC, to: toUTC },
        auth: TRACCAR_AUTH,
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      });

      const positions = response.data.map(pos => ({
        ...pos,
        timestamp: pos.timestamp ? new Date(pos.timestamp).toISOString() : null,
      }));

      navigate('/trajet', {
        state: { positions, vehicleName: selectedVehicle.name, period: { from: fromUTC, to: toUTC } },
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
    <div className={`dashboard-admin ${showDeleteModal || showAddVehicleModal || showEditVehicleModal || showAddDriverModal ? "blurred" : ""}`}>
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
              onClick={() => setShowAddVehicleModal(true)}
              disabled={loading.vehicles || !adminGroupId}
            >
              Ajouter un véhicule
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
              placeholder="Rechercher par nom, ID ou chauffeur..."
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
                  <th>Chauffeur</th>
                  <th>Status</th>
                  <th className="actions-column">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentVehicles.map(vehicle => (
                  <tr key={vehicle.id}>
                    <td>{vehicle.name}</td>
                    <td>{vehicle.id}</td>
                    <td>{vehicle.groupName}</td>
                    <td>{vehicle.driverName}</td>
                    <td>
                      <span
                        className={`status-badge ${
                          vehicle.status === 'online' ? 'online-oval' : 'offline-oval'
                        }`}
                      >
                        {vehicle.status || 'inconnu'}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <div className="action-buttons">
                        <button
                          className="btn-edit"
                          onClick={() => {
                            setEditVehicleForm({
                              id: vehicle.id,
                              name: vehicle.name,
                              uniqueId: vehicle.originalData.uniqueId,
                              driverId: drivers.find(d => d.name === vehicle.driverName)?.id.toString() || '',
                            });
                            setShowEditVehicleModal(true);
                          }}
                          disabled={loading.form}
                          title="Modifier le véhicule"
                        >
                          <i className="edit-icon">✏️</i>
                        </button>
                        <button
                          className="btn-delete"
                          onClick={() => {
                            setVehicleToDelete(vehicle.id);
                            setShowDeleteModal(true);
                          }}
                          disabled={loading.form}
                          title="Supprimer le véhicule"
                        >
                          <i className="delete-icon">🗑️</i>
                        </button>
                        <button
                         className="btn-delete"
                          onClick={() => setSelectedVehicle(vehicle)}
                          disabled={loading.positions}
                          title="Voir le trajet"
                        >
                           
                           <i className="delete-icon">🗺️</i>
                          
                        </button>
                      </div>
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
                  <button onClick={() => setFormError(null)} type="button">×</button>
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

      {showAddVehicleModal && (
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
                <form onSubmit={handleVehicleFormSubmit}>
                  <div className="group-input-group">
                    <label htmlFor="name">Nom du véhicule</label>
                    <input
                      id="name"
                      type="text"
                      name="name"
                      placeholder="Entrez le nom (ex: Immatriculation)"
                      value={vehicleForm.name}
                      onChange={handleVehicleFormChange}
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
                      value={vehicleForm.uniqueId}
                      onChange={handleVehicleFormChange}
                      required
                    />
                  </div>
                  <div className="group-input-group">
                    <label htmlFor="driverId">Chauffeur (optionnel)</label>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <select
                        id="driverId"
                        name="driverId"
                        value={vehicleForm.driverId}
                        onChange={handleVehicleFormChange}
                      >
                        <option value="">Aucun chauffeur</option>
                        {drivers.map(driver => (
                          <option key={driver.id} value={driver.id}>
                            {driver.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="driver-add-btn"
                        onClick={() => setShowAddDriverModal(true)}
                        disabled={loading.driverForm}
                        title="Ajouter un chauffeur"
                      >
                        <FaPlus size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="form-actions">
                    <button
                      type="submit"
                      className="group-btn primary"
                      disabled={loading.form}
                    >
                      {loading.form ? 'Envoi...' : 'Enregistrer'}
                    </button>
                    <button
                      type="button"
                      className="group-btn secondary"
                      onClick={() => setShowAddVehicleModal(false)}
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

      {showEditVehicleModal && (
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
                <form onSubmit={handleEditVehicleFormSubmit}>
                  <div className="group-input-group">
                    <label htmlFor="name">Nom du véhicule</label>
                    <input
                      id="name"
                      type="text"
                      name="name"
                      placeholder="Entrez le nom (ex: Immatriculation)"
                      value={editVehicleForm.name}
                      onChange={handleEditVehicleFormChange}
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
                      value={editVehicleForm.uniqueId}
                      onChange={handleEditVehicleFormChange}
                      required
                    />
                  </div>
                  <div className="group-input-group">
                    <label htmlFor="driverId">Chauffeur (optionnel)</label>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <select
                        id="driverId"
                        name="driverId"
                        value={editVehicleForm.driverId}
                        onChange={handleEditVehicleFormChange}
                      >
                        <option value="">Aucun chauffeur</option>
                        {drivers.map(driver => (
                          <option key={driver.id} value={driver.id}>
                            {driver.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="driver-add-btn"
                        onClick={() => setShowAddDriverModal(true)}
                        disabled={loading.driverForm}
                        title="Ajouter un chauffeur"
                      >
                        <FaPlus size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="form-actions">
                    <button
                      type="submit"
                      className="group-btn primary"
                      disabled={loading.form}
                    >
                      {loading.form ? 'Envoi...' : 'Enregistrer'}
                    </button>
                    <button
                      type="button"
                      className="group-btn secondary"
                      onClick={() => setShowEditVehicleModal(false)}
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

      {showAddDriverModal && (
        <div className="modal-overlay active">
          <div className="modal-content">
            <div className="group-container">
              <div className="group-form-container">
                {driverFormError && (
                  <div className="alert error">
                    {driverFormError}
                    <button onClick={() => setDriverFormError(null)} type="button">×</button>
                  </div>
                )}
                <form onSubmit={handleDriverFormSubmit}>
                  <div className="group-input-group">
                    <label htmlFor="driverName">Nom du chauffeur</label>
                    <input
                      id="driverName"
                      type="text"
                      name="name"
                      placeholder="Entrez le nom"
                      value={driverForm.name}
                      onChange={handleDriverFormChange}
                      required
                    />
                  </div>
                  <div className="group-input-group">
                    <label htmlFor="driverUniqueId">Identifiant unique</label>
                    <input
                      id="driverUniqueId"
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
                      disabled={loading.driverForm}
                    >
                      {loading.driverForm ? 'Envoi...' : 'Enregistrer'}
                    </button>
                    <button
                      type="button"
                      className="group-btn secondary"
                      onClick={() => setShowAddDriverModal(false)}
                      disabled={loading.driverForm}
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

      {showDeleteModal && (
        <div className="modal-overlay active">
          <div className="modal-container">
            <h3 className="modal-title">Confirmer la suppression</h3>
            <p className="modal-message">Êtes-vous sûr de vouloir supprimer ce véhicule ?</p>
            <div className="modal-actions">
              <button onClick={handleDeleteVehicle} className="btn-confirm-delete">
                Confirmer
              </button>
              <button onClick={() => setShowDeleteModal(false)} className="btn-cancel-delete">
                <span className="cancel-icon">❌</span>
                Annuler
              </button>
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

VehCap.propTypes = {
  statusFilter: PropTypes.string,
  title: PropTypes.string,
  description: PropTypes.string,
};

export default VehCap;