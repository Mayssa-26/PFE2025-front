"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import PropTypes from 'prop-types';
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

  // Authentification et récupération du groupe de l'admin
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
          const response = await axios.get(`/api/vehicules/admin/${decoded.id}`, {
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
          setError(`Erreur lors de la récupération du groupe: ${apiError.response?.data?.message || apiError.message}`);
        }
      };

      fetchAdminGroup();
    } catch (tokenError) {
      console.error('Erreur de token:', tokenError);
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

        const matchedGroup = groupsResponse.data.find(group => group.name.toLowerCase() === adminGroupName.toLowerCase());
        if (!matchedGroup) {
          setDrivers([]);
          setError(`Aucun groupe nommé "${adminGroupName}" trouvé dans Traccar`);
          return;
        }

        const driverMap = {};
        driversResponse.data
          .filter(driver => driver.attributes?.group === matchedGroup.name && !driver.attributes?.archived)
          .forEach(driver => {
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
          setError(`Aucun chauffeur actif trouvé dans le groupe "${adminGroupName}"`);
        }
      } catch (err) {
        console.error('Erreur API Traccar:', err);
        setError(err.response?.data?.message || 'Erreur de chargement des chauffeurs depuis Traccar');
        setDrivers([]);
      } finally {
        setLoading(prev => ({ ...prev, drivers: false }));
      }
    };

    fetchDriversFromTraccar();
  }, [adminGroupName, isAuthenticated]);

  // Rafraîchissement de la liste des chauffeurs
  const refreshDriversList = async () => {
    if (!adminGroupName) return;

    setLoading(prev => ({ ...prev, drivers: true }));
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

      const matchedGroup = groupsResponse.data.find(group => group.name.toLowerCase() === adminGroupName.toLowerCase());
      if (!matchedGroup) {
        setDrivers([]);
        setError(`Aucun groupe nommé "${adminGroupName}" trouvé dans Traccar`);
        return;
      }

      const driverMap = {};
      driversResponse.data
        .filter(driver => driver.attributes?.group === matchedGroup.name && !driver.attributes?.archived)
        .forEach(driver => {
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
    } catch (err) {
      console.error('Erreur lors de l\'actualisation:', err);
      toast.error('Erreur lors de l\'actualisation des chauffeurs');
    } finally {
      setLoading(prev => ({ ...prev, drivers: false }));
    }
  };

  // Filtrage des chauffeurs
  const filteredDrivers = drivers.filter(driver =>
    driver.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (statusSelection === 'all' || driver.vehicles.some(v => v.status === statusSelection))
  );

  // Gestion du formulaire
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
          archived: false,
        },
      };

      if (showEditDriverModal && driverToEdit) {
        await axios.put(`${TRACCAR_API}/drivers/${driverToEdit.id}`, payload, {
          auth: TRACCAR_AUTH,
          headers: { 'Content-Type': 'application/json' },
        });
        toast.success("Chauffeur modifié avec succès !");
      } else {
        await axios.post(`${TRACCAR_API}/drivers`, payload, {
          auth: TRACCAR_AUTH,
          headers: { 'Content-Type': 'application/json' },
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
      console.error(`Erreur lors de la ${action} du chauffeur:`, err);
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
      uniqueId: driver.uniqueId,
    });
    setShowEditDriverModal(true);
  };

  const handleDeleteDriver = (driver, e) => {
    e.stopPropagation();
    if (driver.vehicles.length > 0) {
      toast.error(`Impossible de supprimer le chauffeur "${driver.name}" car il est associé à ${driver.vehicles.length} véhicule(s).`);
      return;
    }
    setDriverToDelete(driver);
    setShowDeleteConfirmModal(true);
  };

  const confirmDeleteDriver = async () => {
    if (!driverToDelete) return;

    setLoading(prev => ({ ...prev, delete: true }));

    try {
      await axios.delete(`${TRACCAR_API}/drivers/${driverToDelete.id}`, {
        auth: TRACCAR_AUTH,
        headers: { 'Content-Type': 'application/json' },
      });

      toast.success(`Chauffeur "${driverToDelete.name}" supprimé avec succès !`);
      setShowDeleteConfirmModal(false);
      setDriverToDelete(null);
      await refreshDriversList();
    } catch (err) {
      console.error('Erreur lors de la suppression du chauffeur:', err);
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
    const fromLocal = new Date(`${formData.get("fromDate")}T${formData.get("fromTime")}:00`);
    const toLocal = new Date(`${formData.get("toDate")}T${formData.get("toTime")}:00`);
    const fromUTC = fromLocal.toISOString();
    const toUTC = toLocal.toISOString();

    if (fromLocal >= toLocal) {
      setFormError("La date de début doit être antérieure à la date de fin");
      setLoading(prev => ({ ...prev, positions: false }));
      return;
    }

    try {
      const response = await axios.get(`${TRACCAR_API}/reports/route`, {
        params: { deviceId: selectedVehicle.vehicleId, from: fromUTC, to: toUTC },
        auth: TRACCAR_AUTH,
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      });

      const positions = response.data.map(pos => ({
        ...pos,
        timestamp: pos.serverTime ? new Date(pos.serverTime).toISOString() : null,
      }));

      navigate('/trajet', {
        state: { positions, vehicleName: selectedVehicle.vehicleName, period: { from: fromUTC, to: toUTC } },
      });
    } catch (error) {
      console.error('Erreur lors du chargement du trajet:', error);
      setFormError(`Erreur lors du chargement du trajet: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(prev => ({ ...prev, positions: false }));
    }
  };

  const handleVehicleClick = (e, vehicle, driver) => {
    e.stopPropagation();
    setSelectedVehicle(vehicle);
    setSelectedDriver(driver);
  };

  const getInitials = (name) => {
    if (!name) return '';
    const names = name.split(' ');
    return names.map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  const getAvatarColor = (name) => {
    if (!name) return '#000000';
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
            --primary-color:rgb(10, 22, 56);
            --secondary-color:rgb(25, 45, 90);
            --success-color: #10b981;
            --error-color: #ef4444;
            --warning-color: #f59e0b;
            --info-color: #3b82f6;
            --background-color: #f5f7fa;
            --card-background: #ffffff;
            --text-primary: #111827;
            --text-secondary: #4b5563;
            --border-color: #d1d5db;
            --shadow-sm: 0 2px 6px rgba(0, 0, 0, 0.05);
            --shadow-md: 0 4px 10px rgba(0, 0, 0, 0.1);
            --border-radius: 8px;
            --transition: all 0.2s ease-in-out;
            --font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            --font-heading: 'Inter', sans-serif;
          }

          .dashboard-admin {
            display: flex;
            min-height: 100vh;
            background-color: var(--background-color);
            font-family: var(--font-primary);
          }

          .main-content {
            flex: 1;
            margin-left: 250px;
            padding: 1.5rem;
            transition: margin-left var(--transition);
            overflow-y: auto;
          }

          .container2 {
            max-width: 1200px;
            margin: 2rem auto 0;
          }

          .header {
            background: var(--card-background);
            padding: 2rem;
            border-radius: var(--border-radius);
            box-shadow: var(--shadow-sm);
            margin-bottom: 2rem;
            margin-top: 5rem;
          }

          .header h2 {
            font-family: var(--font-heading);
            font-size: 1.75rem;
            font-weight: 700;
            color: var(--text-primary);
            margin: 0;
          }

          .header p {
            font-size: 0.875rem;
            color: var(--text-secondary);
            margin-top: 0.5rem;
          }

          .filter-bar {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 1rem;
            flex-wrap: wrap;
          }

          .filter-bar label {
            font-size: 0.875rem;
            color: var(--text-primary);
            font-weight: 500;
          }

          .status-select {
            padding: 0.5rem 1rem;
            border: 1px solid var(--border-color);
            border-radius: var(--border-radius);
            font-size: 0.875rem;
            background: var(--card-background);
            color: var(--text-primary);
            transition: var(--transition);
            cursor: pointer;
            appearance: none;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%234b5563' viewBox='0 0 16 16'%3E%3Cpath d='M8 10.5L4 6.5h8L8 10.5z'/%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: right 0.75rem center;
          }

          .status-select:focus-visible {
            outline: none;
            border-color: var(--primary-color);
            box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.2);
          }

          .search-container {
            position: relative;
            max-width: 350px;
            width: 100%;
          }

          .search-icon {
            position: absolute;
            left: 0.75rem;
            top: 50%;
            transform: translateY(-50%);
            color: var(--text-secondary);
            font-size: 1rem;
          }

          .search-input {
            width: 100%;
            padding: 0.5rem 1rem 0.5rem 2.5rem;
            border: 1px solid var(--border-color);
            border-radius: var(--border-radius);
            font-size: 0.875rem;
            background: var(--card-background);
            color: var(--text-primary);
            transition: var(--transition);
          }

          .search-input:focus-visible {
            border-color: var(--primary-color);
            box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.2);
            outline: none;
          }

          .drivers-section {
            background: var(--card-background);
            border-radius: var(--border-radius);
            box-shadow: var(--shadow-sm);
            padding: 1.5rem;
          }

          .drivers-section h3 {
            font-family: var(--font-heading);
            font-size: 1.5rem;
            font-weight: 600;
            color: var(--text-primary);
            margin-bottom: 1rem;
          }

          .drivers-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 1.25rem;
          }

          .driver-card {
            background: var(--card-background);
            border-radius: var(--border-radius);
            box-shadow: var(--shadow-sm);
            padding: 1.25rem;
            position: relative;
            cursor: pointer;
            transition: var(--transition);
          }

          .driver-card:hover {
            transform: translateY(-3px);
            box-shadow: var(--shadow-md);
          }

          .driver-actions {
            position: absolute;
            top: 0.5rem;
            right: 0.5rem;
            display: flex;
            gap: 0.5rem;
            opacity: 0;
            transition: var(--transition);
          }

          .driver-card:hover .driver-actions {
            opacity: 1;
          }

          .action-btn {
            background: none;
            border: none;
            cursor: pointer;
            font-size: 1rem;
            padding: 0.5rem;
            border-radius: 50%;
            transition: var(--transition);
          }

          .action-btn.edit:hover,
          .action-btn.edit:focus-visible {
            background-color: rgba(59, 131, 246, 0.1);
            color: var(--info-color);
          }

          .action-btn.delete:hover,
          .action-btn.delete:focus-visible {
            background-color: rgba(239, 68, 68, 0.1);
            color: var(--error-color);
          }

          .driver-avatar {
            width: 40px;
            height: 40px;
            background: var(--avatar-color);
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1rem;
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
            display: inline-flex;
            align-items: center;
            padding: 0.25rem 0.75rem;
            border-radius: 1rem;
            font-size: 0.75rem;
            font-weight: 500;
          }

          .status-badge.online {
            background-color: rgba(16, 185, 129, 0.1);
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
            background: rgba(0, 0, 0, 0.75);
            backdrop-filter: blur(6px);
            z-index: 1000;
            display: flex;
            justify-content: center;
            align-items: center;
            animation: fadeIn 0.3s ease-out;
          }

          .modal-content {
            background: var(--card-background);
            border-radius: var(--border-radius);
            padding: 1.5rem;
            max-width: 500px;
            width: 95%;
            box-shadow: var(--shadow-md);
            animation: slideIn 0.3s ease-out;
            max-height: 90vh;
            overflow-y: auto;
          }

          .driver-details-container,
          .confirmation-content,
          .map-form {
            padding: 0.5rem;
          }

          .driver-details,
          .confirmation-modal,
          .map-form h3 {
            font-family: var(--font-heading);
            font-size: 1.5rem;
            font-weight: 600;
            color: var(--text-primary);
            margin-bottom: 1rem;
          }

          .driver-details p,
          .confirmation-content p,
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
            font-weight: 500;
            cursor: pointer;
            transition: var(--transition);
          }

          .vehicle-item strong:hover {
            color: var(--primary-color);
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
          }

          .form-group label {
            font-size: 0.875rem;
            font-weight: 500;
            color: var(--text-primary);
          }

          .form-group input {
            padding: 0.5rem;
            border: 1px solid var(--border-color);
            border-radius: var(--border-radius);
            font-size: 0.875rem;
            background: var(--card-background);
            color: var(--text-primary);
            transition: var(--transition);
          }

          .form-group input:focus-visible {
            border-color: var(--primary-color);
            box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.2);
            outline: none;
          }

          .group-container {
            width: 100%;
            max-width: 450px;
            margin: 0 auto;
            display: flex;
            flex-direction: column;
            align-items: center;
          }

          .group-form-container {
            width: 100%;
            padding: 0.5rem;
          }

          .group-form-container h3 {
            font-family: var(--font-heading);
            font-size: 1.5rem;
            font-weight: 600;
            color: var(--text-primary);
            margin-bottom: 1rem;
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 0.5rem;
          }

          .group-input-group {
            margin-bottom: 1rem;
          }

          .group-input-group label {
            font-size: 0.875rem;
            color: var(--text-primary);
            font-weight: 500;
            display: block;
            margin-bottom: 0.25rem;
          }

          .group-input-group input {
            width: 100%;
            padding: 0.5rem;
            border: 1px solid var(--border-color);
            border-radius: var(--border-radius);
            font-size: 0.875rem;
            background: var(--card-background);
            color: var(--text-primary);
            transition: var(--transition);
          }

          .group-input-group input:focus-visible {
            border-color: var(--primary-color);
            box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.2);
            outline: none;
          }

          .form-actions {
            display: flex;
            justify-content: flex-end;
            gap: 0.75rem;
            margin-top: 1rem;
            flex-wrap: wrap;
          }

          .btn {
            padding: 0.5rem 1rem;
            border-radius: var(--border-radius);
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            border: none;
            transition: var(--transition);
            text-align: center;
            line-height: 1.5;
          }

          .btn--primary {
            background: var(--primary-color);
            color: white;
          }

          .btn--primary:hover:not(:disabled),
          .btn--primary:focus-visible {
            background: var(--secondary-color);
            transform: translateY(-1px);
            box-shadow: var(--shadow-sm);
          }

          .btn--secondary {
            background: #6b7280;
            color: white;
          }

          .btn--secondary:hover:not(:disabled),
          .btn--secondary:focus-visible {
            background: #4b5563;
            transform: translateY(-1px);
            box-shadow: var(--shadow-sm);
          }

          .btn--danger {
            background: var(--error-color);
            color: white;
          }

          .btn--danger:hover:not(:disabled),
          .btn--danger:focus-visible {
            background: #dc2626;
            transform: translateY(-1px);
            box-shadow: var(--shadow-sm);
          }

          .btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
          }

          .alert.error {
            background-color: rgba(239, 68, 68, 0.1);
            color: var(--error-color);
            padding: 0.75rem 1rem;
            border: 1px solid var(--error-color);
            border-radius: var(--border-radius);
            margin-bottom: 1rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 0.875rem;
          }

          .alert.error button {
            background: none;
            border: none;
            color: var(--error-color);
            font-size: 1rem;
            cursor: pointer;
            padding: 0.25rem;
          }

          .loading,
          .no-results {
            text-align: center;
            color: var(--text-secondary);
            padding: 1.5rem;
            background: var(--card-background);
            border-radius: var(--border-radius);
            box-shadow: var(--shadow-sm);
            font-size: 0.875rem;
          }

          .toggle-btn {
            display: none;
            position: fixed;
            top: 1rem;
            left: 1rem;
            z-index: 1100;
            background: var(--primary-color);
            color: white;
            padding: 0.5rem;
            border-radius: var(--border-radius);
            cursor: pointer;
            font-size: 1rem;
            box-shadow: var(--shadow-sm);
            transition: var(--transition);
            border: none;
          }

          .toggle-btn:hover,
          .toggle-btn:focus-visible {
            background: var(--secondary-color);
            transform: translateY(-1px);
            box-shadow: var(--shadow-md);
          }

          .spinner-btn {
            display: inline-block;
            width: 14px;
            height: 14px;
            border: 2px solid white;
            border-top: 2px solid transparent;
            border-radius: 50%;
            animation: spin 0.6s linear infinite;
            margin-right: 0.5rem;
            vertical-align: middle;
          }

          .confirmation-modal {
            text-align: center;
            font-family: var(--font-heading);
            font-size: 1.5rem;
            font-weight: 600;
            color: var(--text-primary);
            margin-bottom: 1rem;
          }

          .confirmation-content p {
            font-size: 0.875rem;
            color: var(--text-secondary);
            margin-bottom: 1rem;
            text-align: center;
          }

          @keyframes spin {
            to { transform: rotate(360deg); }
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          @keyframes slideIn {
            from { transform: translateY(10px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }

          @media (max-width: 1024px) {
            .main-content {
              margin-left: 0;
              padding: 1rem;
            }

            .drivers-grid {
              grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
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
            .confirmation-modal,
            .map-form h3 {
              font-size: 1.25rem;
            }

            .group-form-container {
              padding: 0.5rem;
            }

            .form-actions {
              flex-direction: column;
              gap: 0.5rem;
            }

            .btn {
              width: 100%;
              padding: 0.5rem;
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
              font-size: 1.25rem;
            }

            .group-input-group label,
            .group-input-group input,
            .form-group label,
            .form-group input {
              font-size: 0.8125rem;
            }

            .alert.error {
              font-size: 0.8125rem;
            }

            .btn {
              font-size: 0.8125rem;
            }
          }

          @media (prefers-color-scheme: dark) {
            :root {
              --background-color: #1f2937;
              --card-background: #2d3748;
              --text-primary: #f3f4f6;
              --text-secondary: #9ca3af;
              --border-color: #4b5563;
            }

            .search-input,
            .group-input-group input,
            .form-group input,
            .status-select {
              background: #374151;
              color: var(--text-primary);
              border-color: var(--border-color);
            }

            .alert.error {
              background: rgba(239, 68, 68, 0.15);
            }

            .spinner-btn {
              border: 2px solid var(--text-primary);
              border-top: 2px solid transparent;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            * {
              animation: none;
              transition: none;
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
              className="btn btn--primary"
              onClick={() => setShowAddDriverModal(true)}
              disabled={loading.drivers || !adminGroupName}
              aria-label="Ajouter un nouveau chauffeur"
            >
              Ajouter un chauffeur
            </button>
            <label htmlFor="statusSelect">Filtrer par statut :</label>
            <select
              id="statusSelect"
              value={statusSelection}
              onChange={(e) => setStatusSelection(e.target.value)}
              className="status-select"
              aria-label="Filtrer par statut"
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
              aria-label="Rechercher des chauffeurs par nom"
            />
          </div>

          {error && (
            <div className="alert error">
              <span>{error}</span>
              <button onClick={() => setError(null)} aria-label="Fermer l'erreur">×</button>
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
                    key={driver.id}
                    className="driver-card"
                    onClick={() => setSelectedDriver(driver)}
                    style={{ '--avatar-color': getAvatarColor(driver.name) }}
                  >
                    <div className="driver-actions">
                      <button
                        className="action-btn edit"
                        onClick={(e) => handleEditDriver(driver, e)}
                        title="Modifier le chauffeur"
                        aria-label={`Modifier le chauffeur ${driver.name}`}
                      >
                        ✏️
                      </button>
                      <button
                        className="action-btn delete"
                        onClick={(e) => handleDeleteDriver(driver, e)}
                        title="Supprimer le chauffeur"
                        aria-label={`Supprimer le chauffeur ${driver.name}`}
                      >
                        🗑️
                      </button>
                    </div>
                    <div className="driver-avatar">{getInitials(driver.name)}</div>
                    <div className="driver-info">
                      <h4>{driver.name}</h4>
                      <p>Véhicules: {driver.vehicles.length}</p>
                      <p>
                        Statut:{' '}
                        {driver.vehicles.some(v => v.status === 'online') ? (
                          <span className="status-badge online">En ligne</span>
                        ) : (
                          <span className="status-badge offline">Hors ligne</span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {selectedDriver && (
          <div className="modal-overlay">
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
                          <strong
                            onClick={(e) => handleVehicleClick(e, vehicle, selectedDriver)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                handleVehicleClick(e, vehicle, selectedDriver);
                              }
                            }}
                          >
                            {vehicle.vehicleName}
                          </strong>
                          <p>
                            Statut:{' '}
                            <span className={`status-badge ${vehicle.status}`}>
                              {vehicle.status === 'online' ? 'En ligne' : 'Hors ligne'}
                            </span>
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn--secondary"
                    onClick={() => setSelectedDriver(null)}
                    disabled={loading.positions}
                    aria-label="Fermer les détails du chauffeur"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedVehicle && (
          <div className="modal-overlay">
            <div className="modal-content">
              <form className="map-form" onSubmit={handleSubmit}>
                <h3>Trajet du véhicule: {selectedVehicle.vehicleName}</h3>
                <p>Chauffeur: {selectedDriver?.name || 'Inconnu'}</p>
                {formError && (
                  <div className="alert error">
                    <span>{formError}</span>
                    <button onClick={() => setFormError(null)} type="button" aria-label="Fermer l'erreur">×</button>
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
                        aria-label={field === 'fromDate' ? 'Date de début' : 'Date de fin'}
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
                        aria-label={field === 'fromTime' ? 'Heure de début' : 'Heure de fin'}
                      />
                    </div>
                  ))}
                </div>
                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn btn--primary"
                    disabled={loading.positions}
                    aria-label="Visualiser le trajet"
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
                    className="btn btn--secondary"
                    onClick={() => setSelectedVehicle(null)}
                    disabled={loading.positions}
                    aria-label="Annuler la visualisation du trajet"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showAddDriverModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="group-container">
                <div className="group-form-container">
                  <h3>Ajouter un nouveau chauffeur</h3>
                  {formError && (
                    <div className="alert error">
                      <span>{formError}</span>
                      <button onClick={() => setFormError(null)} type="button" aria-label="Fermer l'erreur">×</button>
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
                        aria-label="Nom du chauffeur"
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
                        aria-label="Identifiant unique du chauffeur"
                      />
                    </div>
                    <div className="form-actions">
                      <button
                        type="submit"
                        className="btn btn--primary"
                        disabled={loading.form || !adminGroupName}
                        aria-label="Enregistrer le nouveau chauffeur"
                      >
                        {loading.form ? 'Envoi...' : 'Enregistrer'}
                      </button>
                      <button
                        type="button"
                        className="btn btn--secondary"
                        onClick={() => {
                          setShowAddDriverModal(false);
                          setDriverForm({ name: '', uniqueId: '' });
                        }}
                        disabled={loading.form}
                        aria-label="Annuler l'ajout du chauffeur"
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
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="group-container">
                <div className="group-form-container">
                  <h3>Modifier le chauffeur</h3>
                  {formError && (
                    <div className="alert error">
                      <span>{formError}</span>
                      <button onClick={() => setFormError(null)} type="button" aria-label="Fermer l'erreur">×</button>
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
                        aria-label="Modifier le nom du chauffeur"
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
                        aria-label="Modifier l'identifiant unique du chauffeur"
                      />
                    </div>
                    <div className="form-actions">
                      <button
                        type="submit"
                        className="btn btn--primary"
                        disabled={loading.form || !adminGroupName}
                        aria-label="Enregistrer les modifications du chauffeur"
                      >
                        {loading.form ? 'Modification...' : 'Modifier'}
                      </button>
                      <button
                        type="button"
                        className="btn btn--secondary"
                        onClick={() => {
                          setShowEditDriverModal(false);
                          setDriverToEdit(null);
                          setDriverForm({ name: '', uniqueId: '' });
                        }}
                        disabled={loading.form}
                        aria-label="Annuler la modification du chauffeur"
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
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="confirmation-content">
                <h3 className="confirmation-modal">⚠️ Confirmer la suppression</h3>
                <p>
                  Êtes-vous sûr de vouloir supprimer le chauffeur <strong>{driverToDelete.name}</strong> ?
                </p>
                <div className="form-actions">
                  <button
                    onClick={confirmDeleteDriver}
                    className="btn btn--danger"
                    disabled={loading.delete}
                    aria-label={`Confirmer la suppression du chauffeur ${driverToDelete.name}`}
                  >
                    {loading.delete ? 'Suppression...' : 'Confirmer'}
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteConfirmModal(false);
                      setDriverToDelete(null);
                    }}
                    className="btn btn--secondary"
                    disabled={loading.delete}
                    aria-label="Annuler la suppression"
                  >
                    Annuler
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
    </div>
  );
};

Drivers.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
};

export default Drivers;