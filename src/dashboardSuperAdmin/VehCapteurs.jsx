"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaSearch } from "react-icons/fa";
import PropTypes from 'prop-types';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SidebarSupAdmin from "./SideBarSupAdmin";
import NavbarSuperAdmin from "./NavBarSupAdmin";

const VehCapSupAdmin = ({ statusFilter, title = "Liste des Véhicules", description = "Consultez et gérez les véhicules" }) => {
  const [groups, setGroups] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [loading, setLoading] = useState({ vehicles: false, positions: false, actions: false, form: false });
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusSelection, setStatusSelection] = useState("all");
  const [formError, setFormError] = useState(null);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [vehicleToArchive, setVehicleToArchive] = useState(null);
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [showEditVehicleModal, setShowEditVehicleModal] = useState(false);
  const [vehicleForm, setVehicleForm] = useState({ 
    name: '', 
    uniqueId: '', 
    groupId: '', 
    category: '', 
    model: '', 
    phone: '', 
    contact: '' 
  });
  const [editVehicleForm, setEditVehicleForm] = useState({ 
    id: '', 
    name: '', 
    uniqueId: '', 
    groupId: '', 
    category: '', 
    model: '', 
    phone: '', 
    contact: '' 
  });
  const navigate = useNavigate();
  const vehiclesPerPage = 3;

  const filteredVehicles = vehicles
    .filter(vehicle =>
      !vehicle.attributes?.archived &&
      (statusSelection === "all" || vehicle.status === statusSelection) &&
      (!statusFilter || vehicle.status === statusFilter) &&
      (
        vehicle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.id.toString().includes(searchTerm) ||
        (vehicle.groupId && vehicle.groupId.toString().includes(searchTerm))
      )
    );

  const indexOfLastVehicle = currentPage * vehiclesPerPage;
  const indexOfFirstVehicle = indexOfLastVehicle - vehiclesPerPage;
  const currentVehicles = filteredVehicles.slice(indexOfFirstVehicle, indexOfLastVehicle);
  const totalPages = Math.ceil(filteredVehicles.length / vehiclesPerPage);

  const fetchVehiclesAndGroups = useCallback(async () => {
    setLoading(prev => ({ ...prev, vehicles: true }));
    try {
      const [vehiclesRes, groupsRes] = await Promise.all([
        axios.get("https://yepyou.treetronix.com/api/devices", {
          headers: {
            Authorization: "Basic " + btoa("admin:admin"),
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }),
        axios.get("https://yepyou.treetronix.com/api/groups", {
          headers: {
            Authorization: "Basic " + btoa("admin:admin"),
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }),
      ]);
      setVehicles(vehiclesRes.data);
      setGroups(groupsRes.data);
    } catch (err) {
      console.error("Erreur API:", err);
      toast.error("Impossible de charger les données. Réessayez plus tard.");
    } finally {
      setLoading(prev => ({ ...prev, vehicles: false }));
    }
  }, []);

  useEffect(() => {
    fetchVehiclesAndGroups();
  }, [fetchVehiclesAndGroups]);

  const handleVehicleFormChange = (e) => {
    const { name, value } = e.target;
    setVehicleForm(prev => ({ ...prev, [name]: value }));
  };

  const handleEditVehicleFormChange = (e) => {
    const { name, value } = e.target;
    setEditVehicleForm(prev => ({ ...prev, [name]: value }));
  };

  const handleVehicleFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(prev => ({ ...prev, form: true }));
    setFormError(null);

    try {
      const response = await axios.post("https://yepyou.treetronix.com/api/devices", {
        name: vehicleForm.name,
        uniqueId: vehicleForm.uniqueId,
        groupId: parseInt(vehicleForm.groupId),
        category: vehicleForm.category || null,
        phone: vehicleForm.phone || null,
        model: vehicleForm.model || null,
        contact: vehicleForm.contact || null
      }, {
        headers: {
          Authorization: "Basic " + btoa("admin:admin"),
          "Content-Type": "application/json"
        }
      });

      toast.success("Véhicule ajouté avec succès !");
      setVehicleForm({ name: '', uniqueId: '', groupId: '', category: '', model: '', phone: '', contact: '' });
      setShowAddVehicleModal(false);
      fetchVehiclesAndGroups();
    } catch (err) {
      console.error("Erreur lors de l'ajout du véhicule:", err);
      setFormError(err.response?.data?.message || "Erreur lors de l'ajout du véhicule");
    } finally {
      setLoading(prev => ({ ...prev, form: false }));
    }
  };

  const handleEditVehicleFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(prev => ({ ...prev, form: true }));
    setFormError(null);

    try {
      const vehicleRes = await axios.get(`https://yepyou.treetronix.com/api/devices/${editVehicleForm.id}`, {
        headers: {
          Authorization: "Basic " + btoa("admin:admin"),
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
      const vehicle = vehicleRes.data;

      await axios.put(
        `https://yepyou.treetronix.com/api/devices/${editVehicleForm.id}`,
        {
          id: editVehicleForm.id,
          name: editVehicleForm.name,
          uniqueId: editVehicleForm.uniqueId,
          groupId: parseInt(editVehicleForm.groupId),
          category: editVehicleForm.category || vehicle.category || null,
          phone: editVehicleForm.phone || vehicle.phone || null,
          model: editVehicleForm.model || vehicle.model || null,
          contact: editVehicleForm.contact || vehicle.contact || null,
          attributes: vehicle.attributes || {}
        },
        {
          headers: {
            Authorization: "Basic " + btoa("admin:admin"),
            "Content-Type": "application/json",
          },
        }
      );

      toast.success("Véhicule modifié avec succès !");
      setEditVehicleForm({ id: '', name: '', uniqueId: '', groupId: '', category: '', model: '', phone: '', contact: '' });
      setShowEditVehicleModal(false);
      fetchVehiclesAndGroups();
    } catch (err) {
      console.error("Erreur lors de la modification du véhicule:", err);
      setFormError(err.response?.data?.message || "Erreur lors de la modification du véhicule");
    } finally {
      setLoading(prev => ({ ...prev, form: false }));
    }
  };

  const handleEditVehicle = (vehicle) => {
    setEditVehicleForm({
      id: vehicle.id,
      name: vehicle.name,
      uniqueId: vehicle.uniqueId,
      groupId: vehicle.groupId || '',
      category: vehicle.category || '',
      model: vehicle.model || '',
      phone: vehicle.phone || '',
      contact: vehicle.contact || ''
    });
    setShowEditVehicleModal(true);
  };

  const handleArchive = async () => {
    if (!vehicleToArchive) return;

    setLoading(prev => ({ ...prev, actions: true }));

    try {
      const vehicleRes = await axios.get(`https://yepyou.treetronix.com/api/devices/${vehicleToArchive.id}`, {
        headers: {
          Authorization: "Basic " + btoa("admin:admin"),
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
      const vehicle = vehicleRes.data;

      await axios.put(
        `https://yepyou.treetronix.com/api/devices/${vehicleToArchive.id}`,
        {
          id: vehicleToArchive.id,
          name: vehicle.name,
          uniqueId: vehicle.uniqueId,
          groupId: vehicle.groupId || 0,
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
          headers: {
            Authorization: "Basic " + btoa("admin:admin"),
            "Content-Type": "application/json",
          },
        }
      );

      await fetchVehiclesAndGroups();
      toast.success(`Véhicule "${vehicleToArchive.name}" archivé avec succès.`);
    } catch (err) {
      console.error("Erreur lors de l'archivage:", err);
      toast.error(`Échec de l'archivage: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(prev => ({ ...prev, actions: false }));
      setShowArchiveModal(false);
      setVehicleToArchive(null);
    }
  };

  const openArchiveModal = (deviceId, deviceName) => {
    setVehicleToArchive({ id: deviceId, name: deviceName });
    setShowArchiveModal(true);
  };

  const closeArchiveModal = () => {
    setShowArchiveModal(false);
    setVehicleToArchive(null);
  };

  const getGroupName = (groupId) => {
    const group = groups.find(g => g.id === groupId);
    return group ? group.name : "-";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setLoading(prev => ({ ...prev, positions: true }));

    const formData = new FormData(e.target);
    const from = `${formData.get("fromDate")}T${formData.get("fromTime")}:00Z`;
    const to = `${formData.get("toDate")}T${formData.get("toTime")}:00Z`;

    if (!formData.get("fromDate") || !formData.get("toDate") || !formData.get("fromTime") || !formData.get("toTime")) {
      setFormError("Tous les champs sont obligatoires");
      setLoading(prev => ({ ...prev, positions: false }));
      return;
    }

    if (new Date(from) > new Date(to)) {
      setFormError("La date de fin doit être après la date de début");
      setLoading(prev => ({ ...prev, positions: false }));
      return;
    }

    try {
      const response = await axios.get(`https://yepyou.treetronix.com/api/reports/route`, {
        params: { deviceId: selectedVehicle.id, from, to },
        headers: { Authorization: "Basic " + btoa("admin:admin"), "Content-Type": "application/json", Accept: "application/json" }
      });

      const positions = (Array.isArray(response.data) ? response.data : [response.data])
        .map(item => ({
          latitude: parseFloat(item.latitude ?? item.lat),
          longitude: parseFloat(item.longitude ?? item.lng ?? item.lon),
          deviceTime: item.deviceTime ?? item.timestamp,
        }))
        .filter(pos => !isNaN(pos.latitude) && !isNaN(pos.longitude));

      if (positions.length === 0) throw new Error("Aucune position valide trouvée pour cette période.");

      navigate("/trajet", {
        state: { positions, vehicleName: selectedVehicle.name, period: { from, to } },
        replace: true,
      });
    } catch (err) {
      console.error("Erreur:", err);
      setFormError(err.response?.data?.message || err.message || "Erreur lors de la récupération du trajet");
    } finally {
      setLoading(prev => ({ ...prev, positions: false }));
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className={`dashboard-admin ${selectedVehicle ? "blurred" : ""}`}>
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
            max-width: 600px;
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

          .form-group input:disabled {
            background: var(--bg-dark);
            cursor: not-allowed;
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

          .alert button {
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
            color: var(--text-color);
            font-weight: 600;
            font-size: 0.75rem;
            text-transform: uppercase;
            text-align: left;
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

          .status-badge.online {
           background: rgba(38, 122, 73, 0.89);
            color: white;
          }

          .status-badge.offline {
            background: rgba(230, 57, 70, 0.2);
            color: var(--danger-color);
          }

          .status-badge.unknown {
            background: rgba(248, 150, 30, 0.2);
            color: var(--warning-color);
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

          .action-btn.map:hover {
            background: rgba(76, 201, 240, 0.1);
            color: var(--success-color);
          }

          /* Pagination */
          .pagination {
            display: flex;
            justify-content: center;
            align-items: center;
            margin-top: 1.5rem;
            gap: 1rem;
          }

          .pagination button {
            padding: 0.5rem 1rem;
            background: var(--primary-color);
            color: white;
            border: none;
            border-radius: var(--radius-sm);
            cursor: pointer;
            font-size: 0.875rem;
            transition: var(--transition);
          }

          .pagination button:hover:not(:disabled) {
            background: var(--primary-light);
          }

          .pagination button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .pagination span {
            padding: 0.5rem 1rem;
            background: var(--bg-light);
            color: var(--text-color);
            border-radius: var(--radius-sm);
            font-size: 0.875rem;
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
            max-width: 1200px;
            margin: 0 auto;
            padding: 1rem;
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

          /* Device Form Styles */
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

          .device-form-section {
            margin-bottom: 1.5rem;
          }

          .section-title {
            font-size: 1.1rem;
            color: var(--primary-color);
            margin-bottom: 1rem;
            padding-bottom: 0.5rem;
            border-bottom: 1px solid var(--border-color);
          }

          .message-icon {
            font-size: 1.2rem;
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

            .form-group input,
            .status-select,
            .device-form-group input,
            .device-form-group select {
              background: var(--bg-light);
              color: var(--text-color);
            }

            .form-group input:focus,
            .status-select:focus,
            .device-form-group input:focus,
            .device-form-group select:focus {
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

      <button className="toggle-btn" onClick={toggleSidebar}>
        {isSidebarOpen ? "✕" : "☰"}
      </button>
      <SidebarSupAdmin isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div className="main-content">
        <NavbarSuperAdmin />
        <div className="container2">
          <div className="header">
            <h2>{title}</h2>
            <p>{description}</p>
          
          <br></br>
          <div className="filter-bar">
            <br />
            <button
              className="btn-primary"
              onClick={() => setShowAddVehicleModal(true)}
              disabled={loading.vehicles}
            >
              Ajouter
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
</div>
          <div className="search-container">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Rechercher par nom, ID ou groupe..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

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
                    <th className="actions-column">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentVehicles.map(vehicle => (
                    <tr key={vehicle.id}>
                      <td>{vehicle.name}</td>
                      <td>{vehicle.id}</td>
                      <td>{getGroupName(vehicle.groupId)}</td>
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
                            onClick={() => handleEditVehicle(vehicle)}
                            disabled={loading.actions}
                            title="Modifier le véhicule"
                            aria-label="Modifier"
                          >
                            ✏️
                          </button>
                          <button
                            className="action-btn delete"
                            onClick={() => openArchiveModal(vehicle.id, vehicle.name)}
                            disabled={loading.actions}
                            title="Archiver le véhicule"
                            aria-label="Archiver"
                          >
                            🗑️
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
                  onClick={closeArchiveModal}
                  className="group-btn secondary"
                  disabled={loading.actions}
                >
                  Annuler
                </button>
              </div>
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
                          value={vehicleForm.groupId}
                          onChange={handleVehicleFormChange}
                          disabled={loading.form}
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
                          <span className="loading-spinner"></span> Envoi en cours...
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
                          value={editVehicleForm.groupId}
                          onChange={handleEditVehicleFormChange}
                          disabled={loading.form}
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
                          <span className="loading-spinner"></span> Envoi en cours...
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
    </div>
  );
};

VehCapSupAdmin.propTypes = {
  statusFilter: PropTypes.string,
  title: PropTypes.string,
  description: PropTypes.string,
};

export default VehCapSupAdmin;