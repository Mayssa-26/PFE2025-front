"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaPlus } from 'react-icons/fa';
import { Map, Loader } from 'lucide-react';
import Navbar from './NavBar';
import Sidebar from './SideBar';
import './VehCap.css';
import PropTypes from 'prop-types';
import jwt_decode from 'jwt-decode';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const VehCap = ({ statusFilter, title = "Liste des Véhicules", description = "Consultez et gérez les véhicules de votre groupe" }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [showEditVehicleModal, setShowEditVehicleModal] = useState(false);
  const [showAddDriverModal, setShowAddDriverModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState(null);
  const [vehicleToArchive, setVehicleToArchive] = useState(null);
  const [vehicleForm, setVehicleForm] = useState({ name: '', uniqueId: '', groupId: '', driverId: '' });
  const [editVehicleForm, setEditVehicleForm] = useState({ id: '', name: '', uniqueId: '', groupId: '', driverId: '' });
  const [driverForm, setDriverForm] = useState({ name: '', uniqueId: '' });
  const [loading, setLoading] = useState({ vehicles: false, positions: false, form: false, driverForm: false, actions: false });
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
        const [groupsResponse, driversResponse, devicesResponse] = await Promise.all([
          axios.get(`${TRACCAR_API}/groups`, {
            auth: TRACCAR_AUTH,
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          }),
          axios.get(`${TRACCAR_API}/drivers`, {
            auth: TRACCAR_AUTH,
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          }),
          axios.get(`${TRACCAR_API}/devices`, {
            auth: TRACCAR_AUTH,
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          }),
        ]);

        const matchedGroup = groupsResponse.data.find(
          group => group.name.toLowerCase() === adminGroupName.toLowerCase()
        );
        if (!matchedGroup) {
          setVehicles([]);
          setGroups([]);
          setError(`Aucun groupe nommé "${adminGroupName}" trouvé dans Traccar`);
          return;
        }
        setAdminGroupId(matchedGroup.id);
        setGroups([matchedGroup]);

        setDrivers(driversResponse.data.filter(driver => driver.attributes?.group === adminGroupName));

        const mappedVehicles = devicesResponse.data
          .filter(device => device.groupId === matchedGroup.id && !device.attributes?.archived)
          .map(device => ({
            id: device.id,
            name: device.name,
            groupName: adminGroupName,
            groupId: device.groupId,
            status: device.status || 'unknown',
            lastUpdate: device.lastUpdate,
            driverName: device.attributes?.chauffeur || '-',
            originalData: device,
            attributes: device.attributes || {},
          }));

        setVehicles(mappedVehicles);

        if (mappedVehicles.length === 0) {
          setError(`Aucun véhicule trouvé dans le groupe "${adminGroupName}"`);
        }
      } catch (err) {
        console.error('Erreur API Traccar:', err);
        setError(err.response?.data?.message || 'Erreur de chargement des données depuis Traccar');
        setVehicles([]);
        setGroups([]);
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
    if (!vehicleForm.groupId) {
      toast.error("Le groupe est obligatoire");
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
        groupId: parseInt(vehicleForm.groupId),
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
      setVehicleForm({ name: '', uniqueId: '', groupId: adminGroupId?.toString() || '', driverId: '' });
      setShowAddVehicleModal(false);

      const devicesResponse = await axios.get(`${TRACCAR_API}/devices`, {
        params: { groupId: adminGroupId },
        auth: TRACCAR_AUTH,
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      });

      const mappedVehicles = devicesResponse.data
        .filter(device => device.groupId === adminGroupId && !device.attributes?.archived)
        .map(device => ({
          id: device.id,
          name: device.name,
          groupName: adminGroupName,
          groupId: device.groupId,
          status: device.status || 'unknown',
          lastUpdate: device.lastUpdate,
          driverName: device.attributes?.chauffeur || '-',
          originalData: device,
          attributes: device.attributes || {},
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
    if (!editVehicleForm.groupId) {
      toast.error("Le groupe est obligatoire");
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
      const vehicleRes = await axios.get(`${TRACCAR_API}/devices/${editVehicleForm.id}`, {
        auth: TRACCAR_AUTH,
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      });
      const vehicle = vehicleRes.data;

      const payload = {
        id: editVehicleForm.id,
        name: editVehicleForm.name,
        uniqueId: editVehicleForm.uniqueId,
        groupId: parseInt(editVehicleForm.groupId),
        category: vehicle.category || null,
        phone: vehicle.phone || null,
        model: vehicle.model || null,
        contact: vehicle.contact || null,
        attributes: {
          ...vehicle.attributes,
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
      setEditVehicleForm({ id: '', name: '', uniqueId: '', groupId: adminGroupId?.toString() || '', driverId: '' });
      setShowEditVehicleModal(false);

      const devicesResponse = await axios.get(`${TRACCAR_API}/devices`, {
        params: { groupId: adminGroupId },
        auth: TRACCAR_AUTH,
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      });

      const mappedVehicles = devicesResponse.data
        .filter(device => device.groupId === adminGroupId && !device.attributes?.archived)
        .map(device => ({
          id: device.id,
          name: device.name,
          groupName: adminGroupName,
          groupId: device.groupId,
          status: device.status || 'unknown',
          lastUpdate: device.lastUpdate,
          driverName: device.attributes?.chauffeur || '-',
          originalData: device,
          attributes: device.attributes || {},
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
        .filter(device => device.groupId === adminGroupId && !device.attributes?.archived)
        .map(device => ({
          id: device.id,
          name: device.name,
          groupName: adminGroupName,
          groupId: device.groupId,
          status: device.status || 'unknown',
          lastUpdate: device.lastUpdate,
          driverName: device.attributes?.chauffeur || '-',
          originalData: device,
          attributes: device.attributes || {},
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

  // Archivage d'un véhicule
  const handleArchive = async () => {
    if (!vehicleToArchive) return;

    setLoading(prev => ({ ...prev, actions: true }));
    setError(null);

    try {
      const vehicleRes = await axios.get(`${TRACCAR_API}/devices/${vehicleToArchive.id}`, {
        auth: TRACCAR_AUTH,
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      });
      const vehicle = vehicleRes.data;

      await axios.put(
        `${TRACCAR_API}/devices/${vehicleToArchive.id}`,
        {
          id: vehicleToArchive.id,
          name: vehicle.name,
          uniqueId: vehicle.uniqueId,
          groupId: vehicle.groupId || adminGroupId,
          category: vehicle.category || null,
          phone: vehicle.phone || null,
          model: vehicle.model || null,
          contact: vehicle.contact || null,
          attributes: {
            ...vehicle.attributes,
            archived: true,
          },
        },
        {
          auth: TRACCAR_AUTH,
          headers: { 'Content-Type': 'application/json' },
        }
      );

      toast.success(`Véhicule "${vehicleToArchive.name}" archivé avec succès !`);

      const devicesResponse = await axios.get(`${TRACCAR_API}/devices`, {
        params: { groupId: adminGroupId },
        auth: TRACCAR_AUTH,
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      });

      const mappedVehicles = devicesResponse.data
        .filter(device => device.groupId === adminGroupId && !device.attributes?.archived)
        .map(device => ({
          id: device.id,
          name: device.name,
          groupName: adminGroupName,
          groupId: device.groupId,
          status: device.status || 'unknown',
          lastUpdate: device.lastUpdate,
          driverName: device.attributes?.chauffeur || '-',
          originalData: device,
          attributes: device.attributes || {},
        }));

      setVehicles(mappedVehicles);
      setShowArchiveModal(false);
      setVehicleToArchive(null);
    } catch (err) {
      console.error('Erreur lors de l\'archivage du véhicule:', err);
      toast.error(`Échec de l'archivage du véhicule: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(prev => ({ ...prev, actions: false }));
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
    const matchesStatus = statusSelection === 'all' || (vehicle.status || 'unknown') === statusSelection;
    const matchesFilter = !statusFilter || (vehicle.status || 'unknown') === statusFilter;
    const matchesSearch = 
      vehicle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.id.toString().includes(searchTerm) ||
      (vehicle.driverName && vehicle.driverName.toLowerCase().includes(searchTerm.toLowerCase()));
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
    } catch (err) {
      console.error('Erreur lors du chargement du trajet:', err);
      setFormError('Erreur lors du chargement du trajet: ' + err.message);
    } finally {
      setLoading(prev => ({ ...prev, positions: false }));
    }
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className={`dashboard-admin ${showDeleteModal || showAddVehicleModal || showEditVehicleModal || showAddDriverModal || showArchiveModal ? "blurred" : ""}`}>
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideIn {
            from { transform: translateY(-20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `}
      </style>
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
              <option value="unknown">Unknown</option>
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
                          vehicle.status === 'online' ? 'online' : 
                          vehicle.status === 'offline' ? 'offline' : 'unknown'
                        }`}
                      >
                        {vehicle.status || 'inconnu'}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <div className="action-buttons">
                        <button
                          className="btn-action btn-edit"
                          onClick={() => {
                            setEditVehicleForm({
                              id: vehicle.id,
                              name: vehicle.name,
                              uniqueId: vehicle.originalData.uniqueId,
                              groupId: vehicle.groupId?.toString() || adminGroupId?.toString() || '',
                              driverId: vehicle.attributes?.chauffeur
                                ? drivers.find(d => d.name === vehicle.attributes.chauffeur)?.id.toString() || ''
                                : '',
                            });
                            setShowEditVehicleModal(true);
                          }}
                          disabled={loading.form || loading.actions}
                          title="Modifier le véhicule"
                          aria-label="Modifier"
                        >
                          <i className="icon-edit">✏️</i>
                        </button>
                        
                        <button
                          className="btn-action btn-delete"
                          onClick={() => {
                            setVehicleToArchive({ id: vehicle.id, name: vehicle.name });
                            setShowArchiveModal(true);
                          }}
                          disabled={loading.form || loading.actions}
                          title="Archiver le véhicule"
                          aria-label="Archiver"
                        >
                          <i className="icon-archive">🗑️</i>
                        </button>
                        <button
                          className="btn-action btn-edit"
                          onClick={() => setSelectedVehicle(vehicle)}
                          disabled={loading.positions}
                          title="Voir le trajet"
                          aria-label="Trajet"
                        >
                          <i className="icon-edit">🗺️</i>
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
            <div className="device-container">
              <div className="device-form-container">
                <div className="device-header">
                  <h2>Ajouter un véhicule</h2>
                  <div className="device-decoration"></div>
                </div>

                {formError && (
                  <div className="device-message error">
                    <span className="message-icon">❌</span>
                    <p>{formError}</p>
                  </div>
                )}

                <form onSubmit={handleVehicleFormSubmit}>
                  <div className="device-form-section">
                    <h3 className="section-title">Informations principales</h3>
                    <div className="form-grid">
                      <div className="device-form-group">
                        <label className="required-field">Nom</label>
                        <input
                          type="text"
                          name="name"
                          required
                          value={vehicleForm.name}
                          onChange={handleVehicleFormChange}
                          disabled={loading.form}
                          placeholder="Entrez le nom du véhicule"
                        />
                      </div>

                      <div className="device-form-group">
                        <label className="required-field">Identifiant unique</label>
                        <input
                          type="text"
                          name="uniqueId"
                          required
                          value={vehicleForm.uniqueId}
                          onChange={handleVehicleFormChange}
                          disabled={loading.form}
                          placeholder="ID ou matricule"
                        />
                      </div>

                      <div className="device-form-group">
                        <label className="required-field">Groupe</label>
                        <select
                          name="groupId"
                          value={vehicleForm.groupId || adminGroupId || ''}
                          onChange={handleVehicleFormChange}
                          disabled={loading.form || !adminGroupId}
                          required
                        >
                          <option value="">Sélectionnez un groupe</option>
                          {groups.map((group) => (
                            <option key={group.id} value={group.id}>
                              {group.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="device-form-group">
                        <label>Chauffeur</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <select
                            name="driverId"
                            value={vehicleForm.driverId}
                            onChange={handleVehicleFormChange}
                            disabled={drivers.length === 0 || loading.form}
                          >
                            <option value="">Sélectionner un chauffeur</option>
                            {drivers.map((driver) => (
                              <option key={driver.id} value={driver.id}>
                                {driver.name} ({driver.uniqueId})
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            className="driver-add-btn"
                            onClick={() => setShowAddDriverModal(true)}
                            disabled={loading.form}
                            title="Ajouter un chauffeur"
                          >
                            <FaPlus size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="device-form-section">
                    <h3 className="section-title">Informations complémentaires</h3>
                    <div className="form-grid">
                      <div className="device-form-group">
                        <label>Catégorie</label>
                        <input
                          type="text"
                          name="category"
                          value={vehicleForm.category || ''}
                          onChange={handleVehicleFormChange}
                          disabled={loading.form}
                          placeholder="Catégorie du véhicule"
                        />
                      </div>

                      <div className="device-form-group">
                        <label>Modèle</label>
                        <input
                          type="text"
                          name="model"
                          value={vehicleForm.model || ''}
                          onChange={handleVehicleFormChange}
                          disabled={loading.form}
                          placeholder="Modèle du véhicule"
                        />
                      </div>

                      <div className="device-form-group">
                        <label>Téléphone (SIM)</label>
                        <input
                          type="text"
                          name="phone"
                          value={vehicleForm.phone || ''}
                          onChange={handleVehicleFormChange}
                          disabled={loading.form}
                          placeholder="Numéro de téléphone"
                        />
                      </div>

                      <div className="device-form-group">
                        <label>Contact</label>
                        <input
                          type="text"
                          name="contact"
                          value={vehicleForm.contact || ''}
                          onChange={handleVehicleFormChange}
                          disabled={loading.form}
                          placeholder="Personne à contacter"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-actions">
                    <button
                      type="submit"
                      disabled={loading.form}
                      className="device-submit-btn"
                    >
                      {loading.form ? (
                        <>
                          <Loader className="loading-spinner" size={20} />
                          Envoi en cours...
                        </>
                      ) : "Ajouter le véhicule"}
                    </button>
                    <button
                      type="button"
                      className="vehicle-btn secondary"
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
            <div className="device-container">
              <div className="device-form-container">
                <div className="device-header">
                  <h2>Modifier le véhicule</h2>
                  <div className="device-decoration"></div>
                </div>

                {formError && (
                  <div className="device-message error">
                    <span className="message-icon">❌</span>
                    <p>{formError}</p>
                  </div>
                )}

                <form onSubmit={handleEditVehicleFormSubmit}>
                  <div className="device-form-section">
                    <h3 className="section-title">Informations principales</h3>
                    <div className="form-grid">
                      <div className="device-form-group">
                        <label className="required-field">Nom</label>
                        <input
                          type="text"
                          name="name"
                          required
                          value={editVehicleForm.name}
                          onChange={handleEditVehicleFormChange}
                          disabled={loading.form}
                          placeholder="Entrez le nom du véhicule"
                        />
                      </div>

                      <div className="device-form-group">
                        <label className="required-field">Identifiant unique</label>
                        <input
                          type="text"
                          name="uniqueId"
                          required
                          value={editVehicleForm.uniqueId}
                          onChange={handleEditVehicleFormChange}
                          disabled={loading.form}
                          placeholder="ID ou matricule"
                        />
                      </div>

                      <div className="device-form-group">
                        <label className="required-field">Groupe</label>
                        <select
                          name="groupId"
                          value={editVehicleForm.groupId || adminGroupId || ''}
                          onChange={handleEditVehicleFormChange}
                          disabled={loading.form || !adminGroupId}
                          required
                        >
                          <option value="">Sélectionnez un groupe</option>
                          {groups.map((group) => (
                            <option key={group.id} value={group.id}>
                              {group.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="device-form-group">
                        <label>Chauffeur</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <select
                            name="driverId"
                            value={editVehicleForm.driverId}
                            onChange={handleEditVehicleFormChange}
                            disabled={drivers.length === 0 || loading.form}
                          >
                            <option value="">Sélectionner un chauffeur</option>
                            {drivers.map((driver) => (
                              <option key={driver.id} value={driver.id}>
                                {driver.name} ({driver.uniqueId})
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            className="driver-add-btn"
                            onClick={() => setShowAddDriverModal(true)}
                            disabled={loading.form}
                            title="Ajouter un chauffeur"
                          >
                            <FaPlus size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="device-form-section">
                    <h3 className="section-title">Informations complémentaires</h3>
                    <div className="form-grid">
                      <div className="device-form-group">
                        <label>Catégorie</label>
                        <input
                          type="text"
                          name="category"
                          value={editVehicleForm.category || ''}
                          onChange={handleEditVehicleFormChange}
                          disabled={loading.form}
                          placeholder="Catégorie du véhicule"
                        />
                      </div>

                      <div className="device-form-group">
                        <label>Modèle</label>
                        <input
                          type="text"
                          name="model"
                          value={editVehicleForm.model || ''}
                          onChange={handleEditVehicleFormChange}
                          disabled={loading.form}
                          placeholder="Modèle du véhicule"
                        />
                      </div>

                      <div className="device-form-group">
                        <label>Téléphone (SIM)</label>
                        <input
                          type="text"
                          name="phone"
                          value={editVehicleForm.phone || ''}
                          onChange={handleEditVehicleFormChange}
                          disabled={loading.form}
                          placeholder="Numéro de téléphone"
                        />
                      </div>

                      <div className="device-form-group">
                        <label>Contact</label>
                        <input
                          type="text"
                          name="contact"
                          value={editVehicleForm.contact || ''}
                          onChange={handleEditVehicleFormChange}
                          disabled={loading.form}
                          placeholder="Personne à contacter"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-actions">
                    <button
                      type="submit"
                      disabled={loading.form}
                      className="device-submit-btn"
                    >
                      {loading.form ? (
                        <>
                          <Loader className="loading-spinner" size={20} />
                          Envoi en cours...
                        </>
                      ) : "Mettre à jour"}
                    </button>
                    <button
                      type="button"
                      className="vehicle-btn secondary"
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
            <div className="device-container">
              <div className="device-form-container">
                <div className="device-header">
                  <h2>Ajouter un chauffeur</h2>
                  <div className="device-decoration"></div>
                </div>

                {driverFormError && (
                  <div className="device-message error">
                    <span className="message-icon">❌</span>
                    <p>{driverFormError}</p>
                  </div>
                )}

                <form onSubmit={handleDriverFormSubmit}>
                  <div className="device-form-section">
                    <div className="form-grid">
                      <div className="device-form-group">
                        <label className="required-field">Nom du chauffeur</label>
                        <input
                          type="text"
                          name="name"
                          required
                          value={driverForm.name}
                          onChange={handleDriverFormChange}
                          disabled={loading.driverForm}
                          placeholder="Entrez le nom complet"
                        />
                      </div>

                      <div className="device-form-group">
                        <label className="required-field">Identifiant unique</label>
                        <input
                          type="text"
                          name="uniqueId"
                          required
                          value={driverForm.uniqueId}
                          onChange={handleDriverFormChange}
                          disabled={loading.driverForm}
                          placeholder="ID ou matricule"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-actions">
                    <button
                      type="submit"
                      disabled={loading.driverForm}
                      className="device-submit-btn"
                    >
                      {loading.driverForm ? (
                        <>
                          <Loader className="loading-spinner" size={20} />
                          Envoi en cours...
                        </>
                      ) : "Ajouter le chauffeur"}
                    </button>
                    <button
                      type="button"
                      className="vehicle-btn secondary"
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


      {showArchiveModal && vehicleToArchive && (
        <div className="modal-overlay active">
          <div className="modal-content">
            <h3 className="confirmation-modal">⚠️ Confirmer l'archivage</h3>
            <p className="modal-message">
              Êtes-vous sûr de vouloir archiver le véhicule <strong>{vehicleToArchive.name}</strong> ?
            </p>
            <div className="form-actions">
              <button
                onClick={handleArchive}
                className="group-btn danger"
                disabled={loading.actions}
              >
                {loading.actions ? 'Archivage...' : 'Confirmer'}
              </button>
              <button
                onClick={() => setShowArchiveModal(false)}
                className="group-btn secondary"
                disabled={loading.actions}
              >
                <i className="cancel-icon">❌</i>
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