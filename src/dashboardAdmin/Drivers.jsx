import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaEdit, FaTrash } from 'react-icons/fa';
import Navbar from './NavBar';
import Sidebar from './SideBar';
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
 * .group-btn.danger { background: #dc3545; color: #fff; }
 * .group-btn:disabled { background: #ccc; cursor: not-allowed; }
 * .modal-overlay.active { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; }
 * .modal-content { background: #fff; border-radius: 8px; padding: 15px; max-width: 400px; width: 100%; }
 * .alert.error { padding: 8px; background: #f8d7da; color: #721c24; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; font-size: 14px; }
 * .driver-actions { position: absolute; top: 10px; right: 10px; display: flex; gap: 8px; opacity: 0; transition: opacity 0.3s; }
 * .driver-card:hover .driver-actions { opacity: 1; }
 * .action-btn { background: none; border: none; cursor: pointer; padding: 6px; border-radius: 4px; transition: background-color 0.2s; }
 * .action-btn.edit { color: #007bff; }
 * .action-btn.edit:hover { background-color: #e7f3ff; }
 * .action-btn.delete { color: #dc3545; }
 * .action-btn.delete:hover { background-color: #ffe6e6; }
 * .driver-card { position: relative; }
 * .confirmation-modal { text-align: center; }
 * .confirmation-modal h3 { margin-bottom: 15px; color: #dc3545; }
 * .confirmation-modal p { margin-bottom: 20px; color: #666; }
 */

const Drivers = ({ title = "Liste des Chauffeurs", description = "Consultez et gérez les chauffeurs de votre groupe" }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [drivers, setDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showAddDriverModal, setShowAddDriverModal] = useState(false);
  const [showEditDriverModal, setShowEditDriverModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [driverToDelete, setDriverToDelete] = useState(null);
  const [driverToEdit, setDriverToEdit] = useState(null);
  const [driverForm, setDriverForm] = useState({ name: '', uniqueId: '' });
  const [loading, setLoading] = useState({ drivers: false, positions: false, form: false, delete: false });
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

  // Fonction pour actualiser la liste des chauffeurs
  const refreshDriversList = async () => {
    if (!adminGroupName) return;

    try {
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
      console.error('Erreur lors de l\'actualisation:', err);
    }
  };

  // Filtrage des chauffeurs
  const filteredDrivers = drivers.filter(driver =>
    driver.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (statusSelection === 'all' || driver.vehicles.some(v => v.status === statusSelection))
  );

  // Gestion du formulaire d'ajout/modification de chauffeur
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

      if (showEditDriverModal && driverToEdit) {
        // Mode édition - PUT request
        await axios.put(`${TRACCAR_API}/drivers/${driverToEdit.id}`, payload, {
          auth: TRACCAR_AUTH,
          headers: {
            'Content-Type': 'application/json',
          },
        });
        toast.success("Chauffeur modifié avec succès !");
      } else {
        // Mode ajout - POST request
        await axios.post(`${TRACCAR_API}/drivers`, payload, {
          auth: TRACCAR_AUTH,
          headers: {
            'Content-Type': 'application/json',
          },
        });
        toast.success("Chauffeur ajouté avec succès !");
      }

      // Reset form and close modal
      setDriverForm({ name: '', uniqueId: '' });
      setShowAddDriverModal(false);
      setShowEditDriverModal(false);
      setDriverToEdit(null);

      // Refresh drivers list
      await refreshDriversList();
    } catch (err) {
      console.error('Erreur lors de la sauvegarde du chauffeur:', err);
      const action = showEditDriverModal ? 'modification' : 'ajout';
      toast.error(`Échec de la ${action} du chauffeur: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(prev => ({ ...prev, form: false }));
    }
  };

  // Gestion de l'édition d'un chauffeur
  const handleEditDriver = (driver, e) => {
    e.stopPropagation(); // Empêche l'ouverture de la modal de détails
    setDriverToEdit(driver);
    setDriverForm({
      name: driver.name,
      uniqueId: driver.uniqueId
    });
    setShowEditDriverModal(true);
  };

  // Gestion de la suppression d'un chauffeur
  const handleDeleteDriver = (driver, e) => {
    e.stopPropagation(); // Empêche l'ouverture de la modal de détails
    setDriverToDelete(driver);
    setShowDeleteConfirmModal(true);
  };

  const confirmDeleteDriver = async () => {
    if (!driverToDelete) return;

    setLoading(prev => ({ ...prev, delete: true }));

    try {
      await axios.delete(`${TRACCAR_API}/drivers/${driverToDelete.id}`, {
        auth: TRACCAR_AUTH,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      toast.success("Chauffeur supprimé avec succès !");
      setShowDeleteConfirmModal(false);
      setDriverToDelete(null);

      // Refresh drivers list
      await refreshDriversList();
    } catch (err) {
      console.error('Erreur lors de la suppression du chauffeur:', err);
      toast.error(`Échec de la suppression du chauffeur: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(prev => ({ ...prev, delete: false }));
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
    <>
    <style>{`
        :root {
          --primary-color: #1e1d54;
          --secondary-color: #426e91;
          --success-color: #22c55e;
          --error-color: #ef4444;
          --warning-color: #f59e0b;
          --info-color: #3b82f6;
          --background-color: #f5f7fa;
          --card-background: #ffffff;
          --text-primary: #1f2937;
          --text-secondary: #6b7280;
          --border-color: #d1d5db;
          --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.1);
          --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.15);
          --border-radius: 8px;
        }

        .dashboard-admin {
          display: flex;
          font-family: 'Roboto', sans-serif;
          min-height: 100vh;
          background-color: var(--background-color);
        }

        .main-content {
          flex: 1;
          margin-left: 250px;
          padding: 2rem;
          transition: margin-left 0.3s ease;
        }

        .container2 {
          max-width: 1200px;
          margin: 0 auto;
          margin-top: 2rem;
        }

        .header {
          background: var(--card-background);
          padding: 1.5rem;
          border-radius: var(--border-radius);
          box-shadow: var(--shadow-sm);
          margin-bottom: 2rem;
        }

        .header h2 {
          font-size: 1.75rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
        }

        .header p {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin: 0.5rem 0 0;
        }

        .filter-bar {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }

        .filter-bar label {
          font-size: 0.875rem;
          color: var(--text-primary);
          font-weight: 500;
        }

        .status-select {
          padding: 0.75rem;
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius);
          font-size: 0.875rem;
          background: var(--card-background);
          color: var(--text-primary);
          transition: border-color 0.2s ease;
        }

        .status-select:focus {
          outline: none;
          border-color: var(--primary-color);
          box-shadow: 0 0 0 3px rgba(30, 29, 84, 0.1);
        }

        .search-container {
          position: relative;
          max-width: 400px;
          margin-bottom: 1.5rem;
        }

        .search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-secondary);
        }

        .search-input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 2.5rem;
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius);
          font-size: 0.875rem;
          transition: border-color 0.2s ease;
        }

        .search-input:focus {
          outline: none;
          border-color: var(--primary-color);
          box-shadow: 0 0 0 3px rgba(30, 29, 84, 0.1);
        }

        .drivers-section {
          background: var(--card-background);
          border-radius: var(--border-radius);
          box-shadow: var(--shadow-sm);
          padding: 1.5rem;
        }

        .drivers-section h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 1rem;
        }

        .drivers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 1.5rem;
        }

        .driver-card {
          background: var(--card-background);
          border-radius: var(--border-radius);
          box-shadow: var(--shadow-sm);
          padding: 1rem;
          position: relative;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .driver-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-md);
        }

        .driver-actions {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          display: flex;
          gap: 0.5rem;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .driver-card:hover .driver-actions {
          opacity: 1;
        }

        .action-btn {
          background: transparent;
          border: none;
          cursor: pointer;
          font-size: 1rem;
          padding: 0.5rem;
          border-radius: 50%;
          transition: all 0.2s ease;
        }

        .action-btn.edit:hover {
          background-color: rgba(24, 20, 81, 0.1);
          color: var(--info-color);
        }

        .action-btn.delete:hover {
          background-color: rgba(239, 68, 68, 0.1);
          color: var(--error-color);
        }

        .driver-avatar {
          width: 48px;
          height: 48px;
          background: var(--avatar-color);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 0.75rem;
        }

        .driver-info h4 {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 0.5rem;
        }

        .driver-info p {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin: 0.25rem 0;
        }

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 1rem;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .status-badge.online {
          background-color: rgba(34, 197, 94, 0.1);
          color: var(--success-color);
        }

        .status-badge.offline {
          background-color: rgba(239, 68, 68, 0.1);
          color: var(--error-color);
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          z-index: 1000;
          display: flex;
          justify-content: center;
          align-items: center;
          animation: fadeIn 0.3s ease-out;
        }

        .modal-content {
          background: var(--card-background);
          border-radius: var(--border-radius);
          padding: 10px;
         max-width: 600px;
          box-shadow: var(--shadow-md);
          animation: slideIn 0.3s ease-out;
          height: 600px;
        }

        .driver-details h3,
        .confirmation-modal,
        .map-form h3 {
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 1rem;
        }

        .driver-details p,
        .confirmation-modal + p,
        .map-form p {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin-bottom: 0.75rem;
        }

        .vehicles-list {
          list-style: none;
          padding: 0;
          margin: 0 0 1rem;
        }

        .vehicle-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 0;
          border-bottom: 1px solid var(--border-color);
        }

        .vehicle-item:last-child {
          border-bottom: none;
        }

        .vehicle-item strong {
          color: var(--text-primary);
        }

        .map-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          width: 100px;
        }

        .form-group label {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-primary);
        }

        .form-group input {
          padding: 0.75rem;
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius);
          font-size: 0.875rem;
          transition: border-color 0.2s ease;
        }

        .form-group input:focus {
          outline: none;
          border-color: var(--primary-color);
          box-shadow: 0 0 0 3px rgba(30, 29, 84, 0.1);
        }

        .group-container {
          width: 150px;
          max-width: 400px;
        }

        .group-form-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          width: 800px;
        }

        .group-input-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          width: 100%;
        }

        .group-input-group label {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-primary);
        }

        .group-input-group input {
          padding: 0.75rem;
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius);
          font-size: 0.875rem;
          transition: border-color 0.2s ease;
        }

        .group-input-group input:focus {
          outline: none;
          border-color: var(--primary-color);
          box-shadow: 0 0 0 3px rgba(30, 29, 84, 0.1);
        }

        .form-actions {
          display: flex;
          justify-content: center;
          gap: 1rem;
          margin-top: 1rem;
          flex-wrap: wrap;
        }

        .group-btn,
        .btn-primary,
        .btn-secondary {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: var(--border-radius);
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .group-btn.primary,
        .btn-primary {
          background: var(--primary-color);
          color: white;
        }

        .group-btn.primary:hover:not(:disabled),
        .btn-primary:hover:not(:disabled) {
          background: var(--secondary-color);
          transform: translateY(-2px);
        }

        .group-btn.secondary,
        .btn-secondary {
          background: #f3f4f6;
          color: var(--text-primary);
          border: 1px solid var(--border-color);
        }

        .group-btn.secondary:hover:not(:disabled),
        .btn-secondary:hover:not(:disabled) {
          background: #e5e7eb;
          transform: translateY(-2px);
        }

        .group-btn.danger {
          background: var(--error-color);
          color: white;
        }

        .group-btn.danger:hover:not(:disabled) {
          background: #dc2626;
          transform: translateY(-2px);
        }

        .group-btn:disabled,
        .btn-primary:disabled,
        .btn-secondary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .alert.error {
          background-color: rgba(239, 68, 68, 0.1);
          color: var(--error-color);
          padding: 1rem;
          border-radius: var(--border-radius);
          margin-bottom: 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .alert.error button {
          background: none;
          border: none;
          color: var(--error-color);
          font-size: 1rem;
          cursor: pointer;
        }

        .loading {
          text-align: center;
          color: var(--text-secondary);
          padding: 2rem;
          background: var(--card-background);
          border-radius: var(--border-radius);
          box-shadow: var(--shadow-sm);
        }

        .no-results {
          text-align: center;
          color: var(--text-secondary);
          padding: 2rem;
          background: var(--card-background);
          border-radius: var(--border-radius);
          box-shadow: var(--shadow-sm);
        }

        .toggle-btn {
          display: none;
          position: fixed;
          top: 1rem;
          left: 1rem;
          z-index: 1100;
          background: var(--primary-color);
          color: white;
          border: none;
          padding: 0.75rem;
          border-radius: var(--border-radius);
          cursor: pointer;
          font-size: 1rem;
        }

        .spinner-btn {
          display: inline-block;
          width: 1rem;
          height: 1rem;
          border: 2px solid white;
          border-top: 2px solid transparent;
          border-radius: 50%;
          animation: spin 0.75s linear infinite;
          margin-right: 0.5rem;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideIn {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        @media (max-width: 1024px) {
          .main-content {
            margin-left: 0;
          }

          .drivers-grid {
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          }

          .filter-bar {
            flex-direction: column;
            align-items: stretch;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .toggle-btn {
            display: block;
          }

          .modal-content {
            padding: 1.5rem;
            width: 100px;
          }

          .driver-details h3,
          .confirmation-modal,
          .map-form h3 {
            font-size: 1.25rem;
          }

          .driver-details p,
          .confirmation-modal + p,
          .map-form p {
            font-size: 0.875rem;
          }

          .form-actions {
            flex-direction: column;
            gap: 0.5rem;
          }

          .group-btn,
          .btn-primary,
          .btn-secondary {
            width: 100%;
          }
        }

        @media (max-width: 480px) {
          .drivers-grid {
            grid-template-columns: 1fr;
          }

          .search-container {
            max-width: 100%;
          }

          .group-input-group input,
          .form-group input {
            font-size: 0.75rem;
          }
        }

        button:focus-visible,
        .action-btn:focus-visible,
        .group-btn:focus-visible,
        .btn-primary:focus-visible,
        .btn-secondary:focus-visible {
          outline: 2px solid var(--primary-color);
          outline-offset: 2px;
        }

        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
          }
        }
          .modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(6px);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
  animation: fadeIn 0.3s ease-out;
}

.modal-content {
  background: #f8fafc;
  border-radius: var(--border-radius);
  padding: 1.5rem;
  max-width: 600px;
  width: 95%;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  animation: scaleIn 0.3s ease-out;
}

.group-container {
  width: 500px;
  max-width: 600px;
  margin-left: 1.5rem;
  margin-top: -1.5rem;
}

.group-form-container {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  width: 500px;
  padding: 1.5rem;
  
}

.group-form-container h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #2c3e50;
}

.alert.error {
  background-color: rgba(239, 68, 68, 0.05);
  color: var(--error-color);
  padding: 0.75rem 1rem;
  border: 2px solid var(--error-color);
  border-radius: var(--border-radius);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  font-weight: 500;
}

.alert.error button {
  background: none;
  border: none;
  color: var(--error-color);
  font-size: 1.1rem;
  cursor: pointer;
  padding: 0.2rem;
  transition: color 0.2s ease;
}

.alert.error button:hover {
  color: #c0392b;
}

.group-input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.group-input-group label {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-primary);
}

.group-input-group input {
  padding: 0.65rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.9rem;
  color: var(--text-primary);
  background: white;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.group-input-group input:hover {
  border-color: #94a3b8;
}

.group-input-group input:focus {
  outline: none;
  border-color: #2c3e50;
  box-shadow: 0 0 0 3px rgb(25, 17, 77);
}

.group-input-group input::placeholder {
  color: #94a3b8;
}

.form-actions {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  margin-top: 1rem;
  flex-wrap: wrap;
}

.group-btn {
  padding: 0.65rem 1.25rem;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}

.group-btn.primary {
  background:rgb(15, 12, 61);
  color: white;
}

.group-btn.primary:hover:not(:disabled) {
  background:rgb(19, 15, 57);
  transform: translateY(-2px);
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
}

.group-btn.secondary {
  background: #95a5a6;
  color: white;
}

.group-btn.secondary:hover:not(:disabled) {
  background: #7f8c8d;
  transform: translateY(-2px);
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
}

.group-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scaleIn {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

@media (max-width: 768px) {
  .modal-content {
    padding: 1rem;
    width: 140px;
  }

  .group-form-container h3 {
    font-size: 1.1rem;
  }

  .form-actions {
    flex-direction: column;
    gap: 0.5rem;
  }

  .group-btn {
    width: 100%;
    padding: 0.65rem;
  }
}

@media (max-width: 480px) {
  .group-input-group label {
    font-size: 0.8rem;
  }

  .group-input-group input {
    font-size: 0.8rem;
    padding: 0.5rem;
  }

  .alert.error {
    font-size: 0.75rem;
  }
}

.group-btn:focus-visible,
.group-input-group input:focus-visible {
  outline: 2px solidrgb(24, 25, 67);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .modal-overlay,
  .modal-content {
    animation: none;
  }

  .group-btn,
  .group-input-group input {
    transition: none;
  }
}
      `}</style>
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
                  {/* Boutons d'action */}
                  <div className="driver-actions">
                    <button
                      className="action-btn edit"
                      onClick={(e) => handleEditDriver(driver, e)}
                      title="Modifier le chauffeur"
                    >
                      <i className="edit-icon">✏️</i>
                    </button>
                    {/* <button
                      className="action-btn delete"
                      onClick={(e) => handleDeleteDriver(driver, e)}
                      title="Supprimer le chauffeur"
                    >
                     <i className="delete-icon">🗑️</i>
                    </button> */}
                  </div>

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

      {/* Modal d'ajout de chauffeur */}
      {showAddDriverModal && (
        <div className="modal-overlay active">
          <div className="modal-content">
            <div className="group-container">
              <div className="group-form-container">
                <h3>Ajouter un nouveau chauffeur</h3>
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

      {/* Modal d'édition de chauffeur */}
      {showEditDriverModal && (
        <div className="modal-overlay active">
          <div className="modal-content">
            <div className="group-container">
              <div className="group-form-container">
                <h3>Modifier le chauffeur</h3>
                {formError && (
                  <div className="alert error">
                    {formError}
                    <button onClick={() => setFormError(null)} type="button">×</button>
                  </div>
                )}
                <form onSubmit={handleDriverFormSubmit}>
                  <div className="group-input-group">
                    <label htmlFor="editName">Nom du chauffeur</label>
                    <input
                      id="editName"
                      type="text"
                      name="name"
                      placeholder="Entrez le nom"
                      value={driverForm.name}
                      onChange={handleDriverFormChange}
                      required
                    />
                  </div>
                  <div className="group-input-group">
                    <label htmlFor="editUniqueId">Identifiant unique</label>
                    <input
                      id="editUniqueId"
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
                      {loading.form ? 'Modification...' : 'Modifier'}
                    </button>
                    <button
                      type="button"
                      className="group-btn secondary"
                      onClick={() => {
                        setShowEditDriverModal(false);
                        setDriverToEdit(null);
                        setDriverForm({ name: '', uniqueId: '' });
                      }}
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

      {/* Modal de confirmation de suppression */}
      {/* {showDeleteConfirmModal && driverToDelete && (
  <div
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      zIndex: 1000,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      animation: 'fadeIn 0.2s ease-out',
    }}
    className="modal-overlay active"
  >
    <div
      style={{
        background: 'white',
        padding: '25px',
        borderRadius: '10px',
        maxWidth: '400px',
        width: '90%',
        textAlign: 'center',
        boxShadow: '0 5px 15px rgba(0, 0, 0, 0.2)',
        animation: 'slideIn 0.3s ease-out',
      }}
      className="modal-content"
    >
      <h3
        style={{
          fontSize: '22px',
          fontWeight: 600,
          color: '#2c3e50',
          marginBottom: '15px',
        }}
        className="confirmation-modal"
      >
        ⚠️ Confirmer la suppression
      </h3>
      <p
        style={{
          color: '#555',
          fontSize: '16px',
          marginBottom: '25px',
          lineHeight: 1.5,
        }}
      >
        Êtes-vous sûr de vouloir supprimer le chauffeur{' '}
        <strong>{driverToDelete.name}</strong> ?
      </p>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '15px',
        }}
        className="form-actions"
      >
        <button
          onClick={confirmDeleteDriver}
          style={{
            padding: '10px 20px',
            backgroundColor: '#e74c3c',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            fontSize: '15px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#c0392b')}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#e74c3c')}
          className="group-btn danger"
          disabled={loading.delete}
        >
          {loading.delete ? 'Suppression...' : 'Confirmer'}
        </button>
        <button
          onClick={() => {
            setShowDeleteConfirmModal(false);
            setDriverToDelete(null);
          }}
          style={{
            padding: '10px 20px',
            backgroundColor: '#f1f1f1',
            color: '#333',
            border: 'none',
            borderRadius: '5px',
            fontSize: '15px',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#ddd')}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#f1f1f1')}
          className="group-btn secondary"
          disabled={loading.delete}
        >
          <i style={{ fontStyle: 'normal', fontSize: '14px' }}>❌</i>
          Annuler
        </button>
      </div>
    </div>
  </div>
)} */}

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
    </>
  );
};

Drivers.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
};

export default Drivers;