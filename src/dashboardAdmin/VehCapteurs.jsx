
"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaPlus } from 'react-icons/fa';
import { Map, Loader } from 'lucide-react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
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
    <>
      <style>
        {`
          /* CSS Reset */
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          /* Animations */
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          @keyframes slideIn {
            from { transform: translateY(-20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }

          @keyframes modalAppear {
            0% { transform: translateY(40px) scale(0.95); opacity: 0; }
            100% { transform: translateY(0) scale(1); opacity: 1; }
          }

          @keyframes spinner {
            to { transform: rotate(360deg); }
          }

          @keyframes slideDown {
            from { transform: translateY(-10px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }

          /* Variables */
          :root {
            --primary-color: #0f1738;
            --primary-light: #14275c;
            --primary-gradient: linear-gradient(135deg, #0c1746, #0d2643);
            --secondary-color: #3a0ca3;
            --accent-color: #f72585;
            --success-color: #4cc9f0;
            --warning-color: #f8961e;
            --danger-color: #e63946;
            --text-color: #2b2d42;
            --text-light: #8d99ae;
            --bg-color: #ffffff;
            --bg-light: #f8f9fa;
            --bg-dark: #edf2f4;
            --border-color: #e0e0e0;
            --shadow-sm: 0 2px 10px rgba(0, 0, 0, 0.05);
            --shadow-md: 0 4px 20px rgba(0, 0, 0, 0.08);
            --shadow-lg: 0 10px 30px rgba(0, 0, 0, 0.12);
            --radius-sm: 8px;
            --radius-md: 12px;
            --radius-lg: 20px;
            --transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
            --font-family: 'Inter', system-ui, -apple-system, sans-serif;
            --bg-table-header: #f1f5f9;
          }

          /* Global Styles */
          body {
            font-family: var(--font-family);
            background: var(--bg-light);
            color: var(--text-color);
            line-height: 1.6;
          }

          /* Modal Overlay */
          .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.65);
            backdrop-filter: blur(6px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            opacity: 0;
            visibility: hidden;
            transition: var(--transition);
            padding: 1rem;
          }

          .modal-overlay.active {
            opacity: 1;
            visibility: visible;
          }

          .modal-overlay.closing {
            opacity: 0;
          }

          .modal-overlay.closing .modal-content {
            transform: translateY(20px) scale(0.95);
            opacity: 0;
          }

          /* Modal Content */
          .modal-content {
            width: 90%;
            max-width: 800px;
            max-height: 90vh;
            background: var(--bg-color);
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-lg);
            overflow-y: auto;
            transform: translateY(20px);
            animation: modalAppear 0.4s ease forwards;
            position: relative;
            padding: 1.5rem;
          }

          /* Close Button */
          .modal-close-btn {
            position: absolute;
            top: 0.75rem;
            right: 0.75rem;
            background: none;
            border: none;
            font-size: 1.5rem;
            color: var(--text-light);
            cursor: pointer;
            transition: var(--transition);
          }

          .modal-close-btn:hover {
            color: var(--text-color);
          }

          /* Device Form Container */
          .device-form-container {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
          }

          .device-header {
            
            text-align: center;
            margin-bottom: 1rem;
          }

          .device-header h2 {
            font-size: 1.75rem;
            color: var(--text-color);
            margin-bottom: 0.5rem;
          }

          .device-decoration {
            width: 60px;
            height: 4px;
            background: var(--primary-gradient);
            margin: 0 auto;
            border-radius: var(--radius-sm);
          }

          .device-form-group {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }

          .device-form-group label {
            font-size: 0.875rem;
            font-weight: 500;
            color: var(--text-color);
          }

          .required-field::after {
            content: '*';
            color: var(--danger-color);
            margin-left: 0.25rem;
          }

          .device-form-group input,
          .device-form-group select {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid var(--border-color);
            border-radius: var(--radius-sm);
            font-size: 1rem;
            background: var(--bg-light);
            transition: var(--transition);
          }

          .device-form-group input:focus,
          .device-form-group select:focus {
            outline: none;
            border-color: var(--primary-color);
            box-shadow: 0 0 0 3px rgba(15, 23, 56, 0.1);
          }

          .device-form-group input:disabled,
          .device-form-group select:disabled {
            background: var(--bg-dark);
            cursor: not-allowed;
          }

          .driver-add-btn {
            padding: 0.5rem;
            background: var(--primary-color);
            color: white;
            border: none;
            border-radius: var(--radius-sm);
            cursor: pointer;
            transition: var(--transition);
          }

          .driver-add-btn:hover {
            background: var(--primary-light);
          }

          /* Form Grid */
          .form-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
          }

          /* Form Actions */
          .form-actions {
            display: flex;
            justify-content: flex-end;
            gap: 1rem;
            padding-top: 1rem;
          }

          /* Map Form */
          .map-form {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
            padding: 1.5rem;
          }

          .map-form h3 {
            font-size: 1.5rem;
            color: var(--text-color);
            font-weight: 600;
            text-align: center;
            margin-bottom: 1rem;
          }

          .form-group {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }

          .form-group label {
            font-size: 0.875rem;
            font-weight: 500;
            color: var(--text-color);
          }

          .form-group input {
            height: 2.5rem;
            padding: 0 1rem;
            background: var(--bg-light);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-sm);
            font-size: 0.875rem;
            color: var(--text-color);
            transition: var(--transition);
          }

          .form-group input:focus {
            outline: none;
            border-color: var(--primary-color);
            box-shadow: 0 0 0 3px rgba(15, 23, 56, 0.1);
          }

          /* Buttons */
          .btn-primary,
          .btn-secondary,
          .group-btn,
          .device-submit-btn {
            padding: 0.75rem 1.5rem;
            border-radius: var(--radius-sm);
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            transition: var(--transition);
            border: none;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
          }

          .btn-primary,
          .device-submit-btn {
            background: var(--primary-color);
            color: white;
          }

          .btn-primary:hover,
          .device-submit-btn:hover {
            background: var(--primary-light);
            box-shadow: var(--shadow-sm);
          }

          .btn-secondary,
          .group-btn.secondary {
            background: var(--bg-light);
            color: var(--text-color);
            border: 1px solid var(--border-color);
          }

          .btn-secondary:hover,
          .group-btn.secondary:hover {
            background: var(--bg-dark);
          }

          .group-btn.danger {
            background: var(--danger-color);
            color: white;
          }

          .group-btn.danger:hover {
            background: #c0392b;
            box-shadow: var(--shadow-sm);
          }

          .btn-primary:disabled,
          .btn-secondary:disabled,
          .group-btn:disabled,
          .device-submit-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          /* Spinner */
          .spinner-btn,
          .loading-spinner {
            width: 1.25rem;
            height: 1.25rem;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-top-color: white;
            border-radius: 50%;
            animation: spinner 0.8s linear infinite;
          }

          /* Alerts */
          .alert,
          .device-message {
            padding: 0.75rem 1rem;
            border-radius: var(--radius-sm);
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            animation: slideDown 0.3s ease;
          }

          .alert.error,
          .device-message.error {
            background: rgba(230, 57, 70, 0.1);
            color: var(--danger-color);
            border-left: 4px solid var(--danger-color);
          }

          .alert button,
          .device-message button {
            background: none;
            border: none;
            font-size: 1rem;
            color: inherit;
            cursor: pointer;
          }

          /* Confirmation Modal */
          .confirmation-modal {
            font-size: 1.25rem;
            font-weight: 600;
            color: var(--text-color);
            text-align: center;
            margin: 1.5rem 0 1rem;
          }

          .modal-message {
            font-size: 0.875rem;
            color: var(--text-light);
            text-align: center;
            margin-bottom: 1.5rem;
          }

          /* Vehicles Table */
          .vehicles-table {
            width: 100%;
            border-collapse: collapse;
            background: var(--bg-color);
            border-radius: var(--radius-md);
            box-shadow: var(--shadow-md);
            overflow: hidden;
            margin: 1.5rem 0;
            
          }

          .vehicles-table thead {
            background: rgba(15, 23, 56, 0.1);
            
          }

          .vehicles-table th {
            padding: 0.75rem 1rem;
           color: black;
            font-weight: 600;
            font-size: 0.75rem;
            text-transform: uppercase;
            text-align: left;
            background: ;
          }

          .vehicles-table tbody tr {
            border-bottom: 1px solid var(--border-color);
            transition: var(--transition);
          }

          .vehicles-table tbody tr:hover {
            background: var(--bg-table-header);
          }

          .vehicles-table td {
            padding: 0.75rem 1rem;
            font-size: 0.875rem;
            color: var(--text-color);
          }

          .status-badge {
            padding: 0.25rem 0.5rem;
            border-radius: var(--radius-sm);
            font-size: 0.75rem;
            font-weight: 500;
            text-transform: capitalize;
          }

        

          .actions-cell {
            text-align: center;
          }

          .action-buttons {
            display: flex;
            justify-content: center;
            gap: 0.5rem;
          }

          .action-btn {
            background: transparent;
            border: none;
            cursor: pointer;
            font-size: 1rem;
            padding: 0.5rem;
            border-radius: 50%;
            transition: var(--transition);
          }

          .action-btn.edit:hover {
            background: rgba(15, 23, 56, 0.1);
            color: var(--primary-color);
          }

          .action-btn.delete:hover {
            background: rgba(230, 57, 70, 0.1);
            color: var(--danger-color);
          }

          /* Pagination */
          

      .pagination {
            display: flex;
            justify-content: center;
            align-items: center;
            margin-top: 20px;
            gap: 15px;
          }

          .pagination button {
            padding: 8px 15px;
            background-color: #1b1646;
            color: white;
            border: 1px solid var(--border-color);
            border-radius: var(--radius-sm);
            cursor: pointer;
            font-size: 14px;
            transition: var(--transition);
          }

          .pagination button:hover:not(:disabled) {
            background-color: #1a103e;
          }

          .pagination button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .pagination span {
            padding: 8px 15px;
            background-color: #e7edf1;
            color: #201b39;
            border-radius: var(--radius-sm);
            font-size: 14px;
          }

          /* Dashboard Layout */
          .dashboard-admin {
            display: flex;
            min-height: 100vh;
          }

          .dashboard-admin.blurred .main-content {
            filter: blur(4px);
            pointer-events: none;
          }

          .main-content {
            flex: 1;
            margin-left: 250px;
            padding: 1.5rem;
            transition: var(--transition);
          }

          /* Toggle Button */
          .toggle-btn {
            position: fixed;
            top: 1rem;
            left: 1rem;
            z-index: 1001;
            background: var(--primary-color);
            color: white;
            border: none;
            border-radius: var(--radius-sm);
            padding: 0.5rem 0.75rem;
            font-size: 1.25rem;
            cursor: pointer;
            transition: var(--transition);
          }

          .toggle-btn:hover {
            background: var(--primary-light);
          }

          /* Container */
          .container2 {
          padding: 50px;
            max-width: 1200px;
            margin: 0 auto;
            shadow: var(--shadow-sm)
          }

          /* Header */
          .header {
            margin-bottom: 2rem;
            animation: slideIn 0.5s ease;
          }

          .header h2 {
            font-size: 1.75rem;
            font-weight: 600;
            color: var(--text-color);
          }

          .header p {
            font-size: 0.875rem;
            color: var(--text-light);
            margin-top: 0.5rem;
          }

          /* Filter Bar */
          .filter-bar {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 1.5rem;
            flex-wrap: wrap;
          }

          .filter-bar label {
            font-size: 0.875rem;
            font-weight: 500;
            color: var(--text-color);
          }

          .status-select {
            padding: 0.5rem;
            border: 1px solid var(--border-color);
            border-radius: var(--radius-sm);
            font-size: 0.875rem;
            background: var(--bg-color);
            transition: var(--transition);
          }

          .status-select:focus {
            outline: none;
            border-color: var(--primary-color);
            box-shadow: 0 0 0 3px rgba(15, 23, 56, 0.1);
          }

          /* Search Container */
          .search-container {
            position: relative;
            max-width: 400px;
            margin-bottom: 1.5rem;
          }

          .search-icon {
            position: absolute;
            left: 0.75rem;
            top: 50%;
            transform: translateY(-50%);
            color: var(--text-light);
            font-size: 1rem;
          }

          .search-input {
            width: 100%;
            padding: 0.75rem 1rem 0.75rem 2.5rem;
            border: 1px solid var(--border-color);
            border-radius: var(--radius-sm);
            font-size: 0.875rem;
            transition: var(--transition);
          }

          .search-input:focus {
            outline: none;
            border-color: var(--primary-color);
            box-shadow: 0 0 0 3px rgba(15, 23, 56, 0.1);
          }

          /* Loading and No Results */
          .loading,
          .no-results {
            text-align: center;
            font-size: 0.875rem;
            color: var(--text-light);
            padding: 2rem;
          }

          /* Dark Mode */
          @media (prefers-color-scheme: dark) {
            :root {
              --text-color: #e9ecef;
              --text-light: #adb5bd;
              --bg-color: #212529;
              --bg-light: #343a40;
              --bg-dark: #495057;
              --border-color: #4a4d51;
            }

            .modal-overlay {
              background: rgba(0, 0, 0, 0.8);
            }

            .vehicles-table {
              background: var(--bg-color);
            }

            .vehicles-table tbody tr:hover {
              background: var(--bg-light);
            }

            .device-form-group input,
            .device-form-group select,
            .form-group input {
              background: var(--bg-light);
              color: var(--text-color);
            }

            .device-form-group input:focus,
            .device-form-group select:focus,
            .form-group input:focus {
              background: var(--bg-color);
            }
          }

          /* Responsive Design */
          @media (max-width: 768px) {
            .main-content {
              margin-left: 0;
              padding: 1rem;
            }

            .modal-content {
              width: 95%;
              max-height: 95vh;
              padding: 1rem;
            }

            .form-grid {
              grid-template-columns: 1fr;
            }

            .form-actions {
              flex-direction: column;
              gap: 0.75rem;
            }

            .btn-primary,
            .btn-secondary,
            .group-btn,
            .device-submit-btn {
              width: 100%;
            }

            .vehicles-table th,
            .vehicles-table td {
              padding: 0.5rem;
              font-size: 0.75rem;
            }

            .action-buttons {
              flex-direction: column;
              gap: 0.25rem;
            }
          }
        `}
      </style>

      <div className={`dashboard-admin ${showDeleteModal || showAddVehicleModal || showEditVehicleModal || showAddDriverModal || showArchiveModal ? "blurred" : ""}`}>
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
                            className="action-btn edit"
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
                            ✏️
                          </button>
                          <button
                            className="action-btn delete"
                            onClick={() => {
                              setVehicleToArchive({ id: vehicle.id, name: vehicle.name });
                              setShowArchiveModal(true);
                            }}
                            disabled={loading.form || loading.actions}
                            title="Archiver le véhicule"
                            aria-label="Archiver"
                          >
                            🗑️
                          </button>
                          <button
                            className="action-btn edit"
                            onClick={() => setSelectedVehicle(vehicle)}
                            disabled={loading.positions}
                            title="Voir le trajet"
                            aria-label="Trajet"
                          >
                            🗺️
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
            </>
          )}
        </div>

        {selectedVehicle && (
          <div className="modal-overlay active">
            <div className="modal-content">
              <button
                className="modal-close-btn"
                onClick={() => setSelectedVehicle(null)}
                aria-label="Fermer la modale"
              >
                ×
              </button>
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
              <button
                className="modal-close-btn"
                onClick={() => setShowAddVehicleModal(false)}
                aria-label="Fermer la modale"
              >
                ×
              </button>
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
                      className="btn-secondary"
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
        )}

        {showEditVehicleModal && (
          <div className="modal-overlay active">
            <div className="modal-content">
              <button
                className="modal-close-btn"
                onClick={() => setShowEditVehicleModal(false)}
                aria-label="Fermer la modale"
              >
                ×
              </button>
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
                      className="btn-secondary"
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
        )}

        {showAddDriverModal && (
          <div className="modal-overlay active">
            <div className="modal-content">
              <button
                className="modal-close-btn"
                onClick={() => setShowAddDriverModal(false)}
                aria-label="Fermer la modale"
              >
                ×
              </button>
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
                      className="btn-secondary"
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
        )}

        {showArchiveModal && vehicleToArchive && (
          <div className="modal-overlay active">
            <div className="modal-content">
              <button
                className="modal-close-btn"
                onClick={() => setShowArchiveModal(false)}
                aria-label="Fermer la modale"
              >
                ×
              </button>
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

VehCap.propTypes = {
  statusFilter: PropTypes.string,
  title: PropTypes.string,
  description: PropTypes.string,
};

export default VehCap;