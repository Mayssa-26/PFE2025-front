"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';
import jwt_decode from 'jwt-decode';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import PropTypes from 'prop-types';
import NavbarSuperAdmin from './NavBarSupAdmin';
import SidebarSupAdmin from './SideBarSupAdmin';



const DriversSA = ({ title = "Liste des Chauffeurs (Super Admin)", description = "Consultez et gérez tous les chauffeurs de tous les groupes" }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [drivers, setDrivers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [showAddDriverModal, setShowAddDriverModal] = useState(false);
  const [showEditDriverModal, setShowEditDriverModal] = useState(false);
  const [showArchiveConfirmModal, setShowArchiveConfirmModal] = useState(false);
  const [driverToArchive, setDriverToArchive] = useState(null);
  const [driverToEdit, setDriverToEdit] = useState(null);
  const [driverForm, setDriverForm] = useState({ name: '', uniqueId: '', groupId: '' });
  const [loading, setLoading] = useState({ drivers: false, form: false, actions: false });
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

        // Récupérer tous les chauffeurs
        const driversResponse = await axios.get(`${TRACCAR_API}/drivers`, {
          auth: TRACCAR_AUTH,
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        });

        // Récupérer tous les appareils
        const devicesResponse = await axios.get(`${TRACCAR_API}/devices`, {
          auth: TRACCAR_AUTH,
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        });

        // Mapper les chauffeurs avec leurs groupes et véhicules
        const driverMap = {};
        driversResponse.data
          .filter(driver => {
            const isArchived = driver.attributes && driver.attributes.archived === true;
            console.log(`Driver ${driver.name} (ID: ${driver.id}) archived: ${isArchived}`);
            return !isArchived;
          })
          .forEach(driver => {
            const group = groupsResponse.data.find(g => g.name === driver.attributes?.group) || { name: 'Aucun groupe' };
            driverMap[driver.name] = {
              name: driver.name,
              id: driver.id,
              uniqueId: driver.uniqueId,
              groupName: group.name,
              groupId: group.id,
              vehicles: [],
              attributes: driver.attributes || {},
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
          setError('Aucun chauffeur actif trouvé dans les groupes');
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

  // Gestion du formulaire d'ajout ou d'édition de chauffeur
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
          archived: false,
        },
      };

      await axios.post(`${TRACCAR_API}/drivers`, payload, {
        auth: TRACCAR_AUTH,
        headers: { 'Content-Type': 'application/json' },
      });

      toast.success("Chauffeur ajouté avec succès !");
      setDriverForm({ name: '', uniqueId: '', groupId: '' });
      setShowAddDriverModal(false);

      await refreshDrivers();
    } catch (err) {
      console.error('Erreur lors de l\'ajout du chauffeur:', err);
      toast.error(`Échec de l'ajout du chauffeur: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(prev => ({ ...prev, form: false }));
    }
  };

  // Gestion de l'édition d'un chauffeur
  const handleEditDriver = async (e) => {
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
          archived: false,
        },
      };

      await axios.put(`${TRACCAR_API}/drivers/${driverToEdit.id}`, payload, {
        auth: TRACCAR_AUTH,
        headers: { 'Content-Type': 'application/json' },
      });

      toast.success("Chauffeur modifié avec succès !");
      setDriverForm({ name: '', uniqueId: '', groupId: '' });
      setShowEditDriverModal(false);
      setDriverToEdit(null);

      await refreshDrivers();
    } catch (err) {
      console.error('Erreur lors de la modification du chauffeur:', err);
      toast.error(`Échec de la modification du chauffeur: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(prev => ({ ...prev, form: false }));
    }
  };

  // Gestion de l'archivage d'un chauffeur
  const handleArchiveDriver = async () => {
    if (!driverToArchive) return;

    setLoading(prev => ({ ...prev, actions: true }));

    try {
      // Fetch current driver data
      const driverRes = await axios.get(`${TRACCAR_API}/drivers/${driverToArchive.id}`, {
        auth: TRACCAR_AUTH,
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      });
      const driver = driverRes.data;
      console.log('Driver to archive:', driver);

      // Update driver with archived: true
      const response = await axios.put(
        `${TRACCAR_API}/drivers/${driverToArchive.id}`,
        {
          id: driver.id,
          name: driver.name,
          uniqueId: driver.uniqueId,
          attributes: {
            ...driver.attributes,
            archived: true,
          },
        },
        {
          auth: TRACCAR_AUTH,
          headers: { 'Content-Type': 'application/json' },
        }
      );
      console.log('Archive response:', response.data);

      toast.success(`Chauffeur "${driverToArchive.name}" archivé avec succès !`);
      setShowArchiveConfirmModal(false);
      setDriverToArchive(null);

      // Force refresh drivers list
      await refreshDrivers();
    } catch (err) {
      console.error('Erreur lors de l\'archivage du chauffeur:', err);
      toast.error(`Échec de l'archivage du chauffeur: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(prev => ({ ...prev, actions: false }));
    }
  };

  // Fonction pour rafraîchir la liste des chauffeurs
  const refreshDrivers = async () => {
    try {
      setDrivers([]); // Clear state to avoid stale data
      const [driversResponse, devicesResponse] = await Promise.all([
        axios.get(`${TRACCAR_API}/drivers`, {
          auth: TRACCAR_AUTH,
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        }),
        axios.get(`${TRACCAR_API}/devices`, {
          auth: TRACCAR_AUTH,
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        }),
      ]);

      console.log('Drivers response:', driversResponse.data);

      const driverMap = {};
      driversResponse.data
        .filter(driver => {
          const isArchived = driver.attributes && driver.attributes.archived === true;
          console.log(`Driver ${driver.name} (ID: ${driver.id}) archived: ${isArchived}`);
          return !isArchived;
        })
        .forEach(driver => {
          const group = groups.find(g => g.name === driver.attributes?.group) || { name: 'Aucun groupe' };
          driverMap[driver.name] = {
            name: driver.name,
            id: driver.id,
            uniqueId: driver.uniqueId,
            groupName: group.name,
            groupId: group.id,
            vehicles: [],
            attributes: driver.attributes || {},
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
      console.log('Refreshed drivers:', mappedDrivers);
      setDrivers(mappedDrivers);
    } catch (err) {
      console.error('Erreur lors du rafraîchissement des chauffeurs:', err);
      toast.error('Erreur lors du rafraîchissement des chauffeurs');
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

        .modal-content-archivage {
          background: var(--card-background);
          border-radius: var(--border-radius);
          padding: 10px;
          width: 200px;
          box-shadow: var(--shadow-md);
          animation: slideIn 0.3s ease-out;
          height: 250px;
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

          .modal-content-edit {
            padding: 1.5rem;
            width: 100px;
            height: 300px;
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

.modal-content-add {
  background: #f8fafc;
  border-radius: var(--border-radius);
  padding: 1.5rem;
  max-width: 600px;
  width: 95%;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  animation: scaleIn 0.3s ease-out;
  height: 650px;
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
                  <div className="driver-actions">
                    <button
                      className="action-btn edit"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDriverToEdit(driver);
                        setDriverForm({
                          name: driver.name,
                          uniqueId: driver.uniqueId,
                          groupId: driver.groupId || '',
                        });
                        setShowEditDriverModal(true);
                      }}
                      title="Modifier le chauffeur"
                    >
                      <i className="edit-icon">✏️</i>
                    </button>
                    <button
                      className="action-btn archive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDriverToArchive(driver);
                        setShowArchiveConfirmModal(true);
                      }}
                      title="Archiver le chauffeur"
                    >
                      <i className="archive-icon">🗑️</i>
                    </button>
                  </div>

                  <div className="driver-avatar">{getInitials(driver.name)}</div>
                  <div className="driver-info">
                    <h4>{driver.name}</h4>
                    <p className="group-name">Groupe: {driver.groupName}</p>
                    <p>Capteurs: {driver.vehicles.length}</p>
                    <p>
                      Statut:{' '}
                      {driver.vehicles.some(v => v.status === 'online') ? (
                        <span className="status-badge online">Online</span>
                      ) : (
                        <span className="status-badge offline">Offline</span>
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
                    </li>
                  ))}
                </ul>
              )}
              <div className="form-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setSelectedDriver(null)}
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddDriverModal && (
        
        <div className="modal-overlay active">
          <div className="modal-content-add">
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
                    <h3 style={{ fontSize: '22px', fontWeight: 600, color: 'rgb(25, 17, 77)', marginBottom: '15px' }}>
                  Ajouter un chauffeur
                </h3>
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
                        title="Ajouter un chauffeur"
                      disabled={loading.form}
                    >
                      
                      <i style={{ fontStyle: 'normal', fontSize: '14px' }}>❌</i>
                      Annuler
                    </button>
                    
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditDriverModal && driverToEdit && (
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
              maxWidth: '600px',
              width: '90%',
              boxShadow: '0 5px 15px rgba(0, 0, 0, 0.2)',
              animation: 'slideIn 0.3s ease-out',
            }}
            className="modal-content-edit"
          >
            <div className="group-container">
              <div className="group-form-container">
                <h3 style={{ fontSize: '22px', fontWeight: 600, color: 'rgb(25, 17, 77)', marginBottom: '15px' }}>
                  Modifier le chauffeur
                </h3>
                {formError && (
                  <div className="alert error">
                    {formError}
                    <button onClick={() => setFormError(null)} type="button">×</button>
                  </div>
                )}
                <form onSubmit={handleEditDriver}>
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
                  <div className="group-input-group">
                    <label htmlFor="editGroupId">Groupe</label>
                    <select
                      id="editGroupId"
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
                      style={{
                        padding: '10px 20px',
                        backgroundColor: 'rgb(25, 17, 77)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        fontSize: '15px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#0056b3')}
                      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#007bff')}
                      className="group-btn primary"
                      disabled={loading.form || groups.length === 0}
                    >
                      {loading.form ? 'Modification...' : 'Modifier'}
                    </button>
                    <button
                      type="button"
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
                      onClick={() => {
                        setShowEditDriverModal(false);
                        setDriverToEdit(null);
                        setDriverForm({ name: '', uniqueId: '', groupId: '' });
                      }}
                      disabled={loading.form}
                    >
                      <i style={{ fontStyle: 'normal', fontSize: '14px' }}>❌</i>
                      Annuler
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {showArchiveConfirmModal && driverToArchive && (
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
            className="modal-content-archivage"
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
              ⚠️ Confirmer l'archivage
            </h3>
            <p
              style={{
                color: '#555',
                fontSize: '16px',
                marginBottom: '25px',
                lineHeight: 1.5,
              }}
            >
              Êtes-vous sûr de vouloir archiver le chauffeur{' '}
              <strong>{driverToArchive.name}</strong> ?
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
                onClick={handleArchiveDriver}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'red',
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
                disabled={loading.actions}
              >
                {loading.actions ? 'Archivage...' : 'Confirmer'}
              </button>
              <button
                onClick={() => {
                  setShowArchiveConfirmModal(false);
                  setDriverToArchive(null);
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
                disabled={loading.actions}
              >
                <i style={{ fontStyle: 'normal', fontSize: '14px' }}>❌</i>
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
    </>
  );
};

DriversSA.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
};

export default DriversSA;