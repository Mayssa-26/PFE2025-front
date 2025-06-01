import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import PropTypes from 'prop-types';
import { Map as MapIcon } from 'lucide-react';
import jwt_decode from 'jwt-decode';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
          setError(`Erreur lors de la récupération du groupe: ${apiError.response?.data?.message || apiError.message}`);
        }
      };

      fetchAdminGroup();
    } catch (tokenError) {
      localStorage.removeItem('token');
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    if (!adminGroupName || !isAuthenticated) return;

    const fetchDriversFromTraccar = async () => {
      setLoading(prev => ({ ...prev, drivers: true }));
      setError(null);

      try {
        const groupsResponse = await axios.get(`${TRACCAR_API}/groups`, {
          auth: TRACCAR_AUTH,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        });

        const matchedGroup = groupsResponse.data.find(group => group.name.toLowerCase() === adminGroupName.toLowerCase());
        if (!matchedGroup) {
          setDrivers([]);
          setError(`Aucun groupe nommé "${adminGroupName}" trouvé dans Traccar`);
          return;
        }

        const driversResponse = await axios.get(`${TRACCAR_API}/drivers`, {
          auth: TRACCAR_AUTH,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        });

        const filteredDrivers = driversResponse.data
          .filter(driver => driver.attributes?.group === matchedGroup.name)
          .map(driver => ({
            name: driver.name,
            vehicles: [],
            id: driver.id,
            uniqueId: driver.uniqueId,
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

        const mappedDrivers = Object.values(driverMap);
        setDrivers(mappedDrivers);

        if (mappedDrivers.length === 0) {
          setError(`Aucun chauffeur trouvé dans le groupe "${adminGroupName}"`);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Erreur de chargement des chauffeurs depuis Traccar');
        setDrivers([]);
      } finally {
        setLoading(prev => ({ ...prev, drivers: false }));
      }
    };

    fetchDriversFromTraccar();
  }, [adminGroupName, isAuthenticated]);

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

  const filteredDrivers = drivers.filter(driver =>
    driver.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (statusSelection === 'all' || driver.vehicles.some(v => v.status === statusSelection))
  );

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
        await axios.put(`${TRACCAR_API}/drivers/${driverToEdit.id}`, payload, {
          auth: TRACCAR_AUTH,
          headers: {
            'Content-Type': 'application/json',
          },
        });
        toast.success("Chauffeur modifié avec succès !");
      } else {
        await axios.post(`${TRACCAR_API}/drivers`, payload, {
          auth: TRACCAR_AUTH,
          headers: {
            'Content-Type': 'application/json',
          },
        });
        toast.success("Chauffeur ajouté avec succès !");
      }

      setDriverForm({ name: '', uniqueId: '' });
      setShowAddDriverModal(false);
      setShowEditDriverModal(false);
      setDriverToEdit(null);

      await refreshDriversList();
    } catch (err) {
      const action = showEditDriverModal ? 'modification' : 'ajout';
      toast.error(`Échec de la ${action} du chauffeur: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(prev => ({ ...prev, form: false }));
    }
  };

  const handleEditDriver = (driver, e) => {
    e.stopPropagation();
    setDriverToEdit(driver);
    setDriverForm({
      name: driver.name,
      uniqueId: driver.uniqueId
    });
    setShowEditDriverModal(true);
  };

  const handleDeleteDriver = (driver, e) => {
    e.stopPropagation();
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

      await refreshDriversList();
    } catch (err) {
      toast.error(`Échec de la suppression du chauffeur: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(prev => ({ ...prev, delete: false }));
    }
  };

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
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      const positions = response.data.map(pos => ({
        ...pos,
        timestamp: pos.timestamp ? new Date(pos.timestamp).toISOString() : null,
      }));

      navigate('/trajet', {
        state: { positions, vehicleName: selectedVehicle.vehicleName, period: { from: fromUTC, to: toUTC } },
      });
    } catch (error) {
      setFormError('Erreur lors du chargement du trajet: ' + error.message);
    } finally {
      setLoading(prev => ({ ...prev, positions: false }));
    }
  };

  const getInitials = (name) => {
    const names = name.split(' ');
    return names.map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  const getAvatarColor = (name) => {
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 50%)`;
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="dashboard-admin">
      <style>
        {`
          :root {
            --primary-color: #101a43;
            --secondary-color: #0c2647;
            --primary-gradient: linear-gradient(to bottom, #101a43, #0c2647);
            --success-color: #22c55e;
            --error-color: #ef4444;
            --warning-color: #f59e0b;
            --info-color: #3b82f6;
            --background-color: #f8fafc;
            --card-background: white;
            --text-primary: #1f2937;
            --text-secondary: #6b7280;
            --border-color: #e5e7eb;
            --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.15);
            --border-radius: 12px;
            --transition: all 0.3s ease;
          }
            .btn-fermer{
            padding: 0.75rem;
            border-radius: 12px;
            font-size: 0.9rem;
            font-weight: 600;
            cursor: pointer;
            border: none;
            transition: var(--transition);
            }

          .dashboard-admin {
            display: flex;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            min-height: 100vh;
            background-color: var(--background-color);
          }

          .main-content {
            flex: 1;
            margin-left: 240px;
            padding: flex 2rem;
            transition: margin-left 0.3s ease;
            background: var(--background-color);
            overflow-y: auto;
          }

          .container2 {
            max-width: 1200px;
            margin: 0 auto;
            margin-top: 2rem;
          }

          .header {
            background: var(--card-background);
            padding: 2rem;
            border-radius: var(--border-radius);
            box-shadow: var(--shadow-sm);
            margin-bottom: 2rem;
            backdrop-filter: blur(10px);
          }

          .header h2 {
            font-family: 'Playfair Display', serif;
            font-size: 2rem;
            font-weight: 600;
            color: var(--text-primary);
            background: var(--primary-gradient);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
            margin: 0;
          }

          .header p {
            font-size: 0.9rem;
            color: var(--text-muted);
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
            border: 1px solid #2c3e50;
            border-radius: 10px;
            font-size: 0.875rem;
            background: var(--card-background);
            color: var(--text-primary);
            transition: var(--transition);
          }

          .status-select:focus {
            outline: none;
            border-color: var(--primary-color);
            box-shadow: 0 0 0 3px rgba(16, 26, 67, 0.15);
          }

          .search-container {
            position: relative;
            max-width: 400px;
            width: 100%;
            margin-bottom: 1.5rem;
          }

          .search-icon {
            position: absolute;
            left: 1rem;
            top: 50%;
            transform: translateY(-50%);
            color: var(--text-secondary);
            font-size: 1.2rem;
          }

          .search-input {
            width: input 100%;
            padding: 0.75rem 1rem 0.75rem 2.5rem;
            border: 1px solid var(--border-color);
            border-radius: var(--border-radius);
            font-size: 1rem;
            background: rgba(255, 255, 255, 0.8);
            color: var(--text-primary);
            transition: var(--transition);
          }

          .search-input:focus {
            outline: none;
            border-color: 2px solid #2c3e50;
            box-shadow: 0 0 0 3px rgba(16, 26, 67, 0.15);
          }

          .drivers-section {
            background: var(--card-background);
            border-radius: var(--border-radius);
            box-shadow: var(--shadow-sm);
            margin:20px;
            padding: 1.5rem;
            backdrop-filter: blur(5px);
          }

          .drivers-section h3 {
            font-family: 'Playfair Display', serif;
            font-size: 1.5rem;
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
            transition: var(--transition);
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
            gap: 0.75rem;
            opacity: 0;
            transition: var(--transition);
          }

          .driver-card:hover .driver-actions {
           
            opacity: 0.5;
          }

          .action-btn {
            background: 0.5rem;
            border: none;
            cursor: pointer;
            font-size: 1.2rem;
            padding: 0.5rem;
            border-radius: 50%;
            transition: var(--transition);
          }

          .action-btn.edit {
            color: var(--info-color);
          }

          .action-btn.edit:hover {
            background-color: rgba(59, 131, 246, 0.99);
            color: var(--info-color);
          }

          .action-btn.delete {
            color: var(--error-color);
          }

          .action-btn.delete:hover {
            background-color: rgba(239, 68, 68, 0.51);
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
            display: inline-block;
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
            backdrop-filter: blur(6px);
            z-index: 1000;
            display: flex;
            justify-content: center;
            align-items: center;
            animation: fadeIn 0.3s ease-out;
          }

          .modal-overlay.active {
            display: flex;
          }

          .modal-content {
            background: var(--card-background);
            border-radius: var(--border-radius);
            padding: 1rem.5rem;
            max-width: 600px;
            width: 90%;
            box-shadow: 0 6px 20px rgba(0, 0, 0.2);
            animation: scaleIn 0.3s ease-out;
            overflow-y: auto;
            max-height: 90vh;
            backdrop-filter: blur(10px);
          }

          .driver-details-container {
            padding: 20px;
          }

          .driver-details, .confirmation-modal, .map-form {
            font-family: 'Playfair Display', serif;
            font-size: 1.5rem;
            color: var(--text-primary);
            margin-bottom: 1rem;
          }

          .driver-details p, .confirmation-content p, .map-form p {
            font-size: 0.875rem;
            color: var(--text-secondary);
            margin-bottom: 0.75rem;
          }

          .vehicles-list {
            list-style: none;
            padding: none0;
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
            width: 100%;
          }

          .form-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
          }

          .form-group {
            display: 100%;
            width: flex;
            flex-direction: column;
            gap: 0.5rem;
          }

          .form-group label {
            font-size: 0.9rem;
            font-weight: 500;
            color: var(--text-primary);
          }

          .form-group input {
            padding: 0.75rem;
            border: 1px solid #2c3e50;
            border-radius: 6px;
            font-size: 0.9rem;
            background: rgba(255, 255, 255, 0.8);
            color: var(--text-primary);
            transition: var(--transition);
          }

          .form-group input:focus {
            outline: none;
            border-color: var(--primary-color);
            box-shadow: 0 0 0 3px rgba(16, 26, 67, 0.15);
          }

          .group-container {
            width: 100%;
            max-width: 500px;
            margin: 0 auto;
            display: flex;
            flex-direction: column;
            align-items: center;
          }

          .group-form-container {
            display: flex;
            flex-direction: column;
            width: 100%;
            max-width: 500px;
            padding: 1.5rem;
          }

          .group-form-container h3 {
            font-family: 'Playfair Display', serif;
            font-size: 1.5rem;
            font-weight: 600;
            color: var(--text-primary);
            margin: 0;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid var(--border-color);
          }

          .group-input-group {
            display: .form-group;
            margin-bottom: 1rem;
          }

          .group-input-group label {
            font-size: 0.9rem;
            color: var(--text-primary);
            font-weight: bold 500;
          }

          .group-input-group input {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid #2c3e50;
            border-radius: 6px;
            font-size: 0.9rem;
            background: rgba(255, 255, 255, 0.8);
            color: var(--text-primary);
            transition: var(--border-color 0.2s, box-shadow 0.2s);
          }

          .group-input-group input:focus {
            border-color: var(--primary-color);
            box-shadow: 0 0 0 3px rgba(16, 26, 67, 0.15);
            outline: none;
          }

          .form-actions {
            display: flex;
            justify-content: center;
            gap: 1rem;
            margin-top: 1rem;
            flex-wrap: wrap;
          }

          .group-btn {
            , .btn-primary, .btn-secondary {
            padding: 0.75rem;
            border-radius: 12px;
            font-size: 0.9rem;
            font-weight: 600;
            cursor: pointer;
            border: none;
            transition: var(--transition);
          }

          .group-btn {
            background: var(--primary-gradient);
            color: white;
            box-shadow: var(--shadow-sm);
          }

          .group-btn-primary:hover:not(:disabled) {
            background: var(--primary-color);
            transform: translateY(-2px);
            box-shadow: var(--shadow-md);
          }

          .group-btn.secondary {
            background: #6b7280;
            color: white;
          }

          .group-btn .btn-secondary:hover:not(:disabled) {
            background: #555;
            transform: translateY(-2px);
            box-shadow: var(--shadow-sm);
          }

          .group-btn.danger {
            background: var(--error-color);
            color: white;
          }

          .group-btn.danger:hover:not(:disabled) {
            background: #dc3545;
            transform: translateY(-2px);
            box-shadow: var(--shadow-sm);
          }

          .group-btn:disabled, .btn-primary:disabled, .btn-secondary:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
          }

          .alert.error {
            background-color: rgba(239, 68, 68, 0.1);
            color: var(--error-color);
            padding: 0.75rem;
            border: 1px solid var(--error-color);
            border-radius: var(--border-radius);
            margin-bottom: 1rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 0.85rem;
          }

          .alert.error button {
            background: none;
            border: none;
            color: var(--error-color);
            font-size: 1rem;
            cursor: pointer;
            padding: 0.25rem;
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
            background: var(--primary-gradient);
            color: white;
            padding: 0.75rem;
            border-radius: 50%;
            cursor: pointer;
            font-size: 1.2rem;
            box-shadow: var(--shadow-sm);
            transition: var(--transition);
          }

          .toggle-btn:hover {
            transform: translateY(-2px);
            box-shadow: var(--shadow-md);
          }

          .spinner-btn {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 3px solid var(--primary-color);
            border-top: 3px solid transparent;
            border-radius: 50%;
            animation: spin 0.6s linear infinite;
            margin-right: 0.5rem;
          }

          .confirmation-modal {
            text-align: center;
            font-family: 'Playfair Display', serif;
            font-size: 1.5rem;
            font-weight: 600;
            color: var(--text-primary);
            margin-bottom: 1rem;
          }

          .confirmation-content p {
            font-size: 1rem;
            color: var(--text-secondary);
            margin-bottom: 1.5rem;
          }

          @keyframes spin {
            to { transform: rotate(360deg); }
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          @keyframes scaleIn {
            from { transform: scale(0.95); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }

          @media (max-width: 1024px) {
            .main-content {
              margin-left: 0;
              padding: 1rem;
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

            .toggle-btn {
              display: block;
            }
          }

          @media (max-width: 768px) {
            .modal-content {
              padding: 1rem;
              width: 95%;
            }

            .driver-details,
            .confirmation-header,
            .map-form h3 {
              font-size: 1.25rem;
            }

            .group-form-container {
              padding: 1rem;
              max-width: 100%;
            }

            .form-actions {
              flex-direction: column;
              gap: 0.75rem;
            }

            .group-btn,
            .btn-primary,
            .btn-secondary {
              width: 100%;
              padding: 0.65rem;
            }

            .group-input-group input {
              font-size: 0.85rem;
            }
          }

          @media (max-width: 480px) {
            .drivers-grid {
              grid-template-columns: 1fr;
            }

            .search-container {
              max-width: 100%;
            }

            .group-form-container h3 {
              font-size: 1.2rem;
            }

            .group-input-group label {
              font-size: 0.85rem;
            }

            .group-input-group input {
              font-size: 0.85rem;
              padding: 0.6rem;
            }

            .alert.error {
              font-size: 0.8rem;
            }

            .group-btn {
              font-size: 0.85rem;
            }
          }

          @media (prefers-color-scheme: dark) {
            :root {
              --background-color: #111827;
              --card-background: rgba(31, 41, 55, 0.95);
              --text-primary: #f9fafb;
              --text-secondary: #d1d5db;
              --border-color: #374151;
            }

            .dashboard-admin {
              background: var(--background-color);
            }

            .main-content,
            .container2,
            .header,
            .drivers-section {
              background: var(--card-background);
            }

            .search-input,
            .group-input-group input,
            .form-group input,
            .status-select {
              background: rgba(55, 65, 81, 0.8);
              color: var(--text-primary);
              border-color: var(--border-color);
            }

            .modal-content {
              background: var(--card-background);
            }

            .alert.error {
              background: rgba(52, 34, 0, 0.2);
            }
          }

          button:focus-visible,
          .action-btn:focus-visible,
          .group-btn:focus-visible,
          .btn-primary:focus-visible,
          .btn-secondary:focus-visible,
          input:focus-visible {
            outline: 2px solid var(--primary-color);
            outline-offset: 2px;
          }

          @media (prefers-reduced-motion: reduce) {
            * {
              animation: none !important;
              transition: none !important;
            }
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
              onClick={() => setShowAddDriverModal(true)}
              disabled={loading.drivers || !adminGroupName}
              aria-label="Add new driver"
            >
              Ajouter un chauffeur
            </button>
            <label htmlFor="statusSelect">Filtrer par statut :</label>
            <select
              id="statusSelect"
              value={statusSelection}
              onChange={(e) => setStatusSelection(e.target.value)}
              className="status-select"
              aria-label="Filter by status"
            >
              <option value="all">Tous</option>
              <option value="online">En ligne</option>
              <option value="offline">Hors ligne</option>
            </select>
          </div>

          <div className="search-container">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Rechercher par nom..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
              aria-label="Search drivers by name"
            />
          </div>
        </div>

        {error && (
          <div className="alert error">
            <span>{error}</span>
            <button onClick={() => setError(null)} aria-label="Close error">×</button>
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
                  <div className="driver-actions">
                    <button
                      className="action-btn edit"
                      onClick={(e) => handleEditDriver(driver, e)}
                      title="Modifier le chauffeur"
                      aria-label={`Edit driver ${driver.name}`}
                    >
                      ✏️
                    </button>
                    <button
                      className="action-btn delete"
                      onClick={(e) => handleDeleteDriver(driver, e)}
                      title="Supprimer le chauffeur"
                      aria-label={`Delete driver ${driver.name}`}
                    >
                      🗑️
                    </button>
                  </div>

                  <div className="driver-avatar">{getInitials(driver.name)}</div>
                  <div className="driver-info">
                    <h4>{driver.name}</h4>
                    <p>Capteurs: {driver.vehicles.length}</p>
                    <p>Statut: {driver.vehicles.some(v => v.status === 'online') ? (
                      <span className="status-badge online">En ligne</span>
                    ) : (
                      <span className="status-badge offline">Hors ligne</span>
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
            <div className="driver-details-container">
              <h3 className="driver-details">Chauffeur: {selectedDriver.name}</h3>
              <h4>Véhicules attribués</h4>
              {selectedDriver.vehicles.length === 0 ? (
                <p>Aucun véhicule attribué</p>
              ) : (
                <ul className="vehicles-list">
                  {selectedDriver.vehicles.map(vehicle => (
                    <li key={vehicle.vehicleId} className="vehicle-item">
                      <div>
                        <strong>{vehicle.vehicleName}</strong>
                        <p>Statut: <span className={`status-badge ${vehicle.status}`}>{vehicle.status === 'online' ? 'En ligne' : 'Hors ligne'}</span></p>
                      </div>
                     
                    </li>
                  ))}
                </ul>
              )}
              <div className="form-actions">
                <button
                  type="button"
                  className="btn-fermer"
                  onClick={() => setSelectedDriver(null)}
                  disabled={loading.positions}
                  aria-label="Close driver details"
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
                  <span>{formError}</span>
                  <button onClick={() => setFormError(null)} type="button" aria-label="Close error">×</button>
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
                      aria-required="true"
                      aria-label={field === 'fromDate' ? 'Start date' : 'End date'}
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
                      aria-required="true"
                      aria-label={field === 'fromTime' ? 'Start time' : 'End time'}
                    />
                  </div>
                ))}
              </div>
              <div className="form-actions">
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading.positions}
                  aria-label="Visualize route"
                >
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
                  aria-label="Cancel route visualization"
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
                <h3>Ajouter un nouveau chauffeur</h3>
                {formError && (
                  <div className="alert error">
                    <span>{formError}</span>
                    <button onClick={() => setFormError(null)} type="button" aria-label="Close error">×</button>
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
                      aria-required="true"
                      aria-label="Driver name"
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
                      aria-required="true"
                      aria-label="Unique driver ID"
                    />
                  </div>
                  <div className="form-actions">
                    <button
                      type="submit"
                      className="group-btn primary"
                      disabled={loading.form || !adminGroupName}
                      aria-label="Save new driver"
                    >
                      {loading.form ? 'Envoi...' : 'Enregistrer'}
                    </button>
                    <button
                      type="button"
                      className="group-btn secondary"
                      onClick={() => setShowAddDriverModal(false)}
                      disabled={loading.form}
                      aria-label="Cancel adding driver"
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

      {showEditDriverModal && (
        <div className="modal-overlay active">
          <div className="modal-content">
            <div className="group-container">
              <div className="group-form-container">
                <h3>Modifier le chauffeur</h3>
                {formError && (
                  <div className="alert error">
                    <span>{formError}</span>
                    <button onClick={() => setFormError(null)} type="button" aria-label="Close error">×</button>
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
                      aria-required="true"
                      aria-label="Edit driver name"
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
                      aria-required="true"
                      aria-label="Edit unique driver ID"
                    />
                  </div>
                  <div className="form-actions">
                    <button
                      type="submit"
                      className="group-btn primary"
                      disabled={loading.form || !adminGroupName}
                      aria-label="Save edited driver"
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
                      aria-label="Cancel editing driver"
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

      {showDeleteConfirmModal && driverToDelete && (
        <div className="modal-overlay active">
          <div className="modal-content">
            <div className="confirmation-content">
              <h3 className="confirmation-modal">⚠️ Confirmer la suppression</h3>
              <p>Êtes-vous sûr de vouloir supprimer le chauffeur <strong>{driverToDelete.name}</strong> ?</p>
              <div className="form-actions">
                <button
                  onClick={confirmDeleteDriver}
                  className="group-btn danger"
                  disabled={loading.delete}
                  aria-label={`Confirm delete driver ${driverToDelete.name}`}
                >
                  {loading.delete ? 'Suppression...' : 'Confirmer'}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirmModal(false);
                    setDriverToDelete(null);
                  }}
                  className="group-btn secondary"
                  disabled={loading.delete}
                  aria-label="Cancel deletion"
                >
                  <i style={{ fontStyle: 'normal', fontSize: '14px' }}>❌</i> Annuler
                </button>
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
        theme="light"
      />
    </div>
  );
};

Drivers.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
};

export default Drivers;