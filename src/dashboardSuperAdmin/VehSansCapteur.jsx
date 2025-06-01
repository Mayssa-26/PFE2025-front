"use client";

import { useEffect, useState } from 'react';
import axios from 'axios';
import jwt_decode from 'jwt-decode';
import NavbarSuperAdmin from './NavBarSupAdmin';
import SidebarSupAdmin from './SideBarSupAdmin';
import { Link } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const VehSansCapSA = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [vehicules, setVehicules] = useState([]);
  const [filteredMarque, setFilteredMarque] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [marques, setMarques] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [adminId, setAdminId] = useState(null);
  const [adminGroup, setAdminGroup] = useState(null);
  const [showArchivePopup, setShowArchivePopup] = useState(false);
  const [vehicleToArchive, setVehicleToArchive] = useState(null);
  const [isArchiving, setIsArchiving] = useState(false);
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [groupes, setGroupes] = useState([]);
  const [formData, setFormData] = useState({
    marque: '',
    modele: '',
    immatriculation: '',
    mec: '',
    etat: 'Fonctionnel',
    proprietaire: '',
    numChassis: '',
    typeMines: '',
    kilometrage: '',
    conducteur: null,
    capteurId: null,
    hasCapteur: false,
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formMessage, setFormMessage] = useState('');
  const [formMessageType, setFormMessageType] = useState('');
  const vehiculesPerPage = 5;
  const apiUrl =  "http://localhost:8000/api";

  // Decode token
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwt_decode(token);
        setAdminId(decoded.id);
        setAdminGroup(decoded.groupe);
      } catch (error) {
        console.error('Erreur lors du décodage du token:', error);
        setError('Session invalide. Veuillez vous reconnecter.');
        localStorage.removeItem('token');
      }
    } else {
      setError('Aucun token trouvé. Veuillez vous connecter.');
    }
  }, []);

  // Fetch groupes for form
  useEffect(() => {
    const fetchGroupes = async () => {
      try {
        const response = await axios.get(`${apiUrl}/groupes`);
        setGroupes(response.data);
      } catch (error) {
        console.error("Erreur lors du chargement des groupes:", error);
        setFormMessage("Impossible de charger la liste des groupes");
        setFormMessageType("error");
      }
    };
    fetchGroupes();
  }, [apiUrl]);

  // Normalize string for comparison
  const normalizeString = (str) => str?.toLowerCase().replace(/\s|-/g, '');

  // Check and remove Traccar vehicles
  const checkAndRemoveTraccarVehicles = async (vehiclesList) => {
    try {
      const traccarResponse = await axios.get("https://yepyou.treetronix.com/api/devices", {
        headers: {
          Authorization: "Basic " + btoa("admin:admin"),
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
      const traccarVehicleNames = traccarResponse.data.map(v => normalizeString(v.name));
      return vehiclesList.filter(v => !traccarVehicleNames.includes(normalizeString(v.immatriculation)));
    } catch (error) {
      console.error("Erreur lors de la vérification Traccar:", error);
      toast.error('Erreur lors de la vérification des véhicules Traccar.');
      return vehiclesList;
    }
  };

  // Fetch vehicles
  const fetchVehicules = async () => {
    if (!adminId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${apiUrl}/vehicules/getVehicules`, {
        params: { adminId, marque: filteredMarque, search: searchTerm },
        headers: { Authorization: `Bearer ${token}` },
      });
      const filteredVehicles = await checkAndRemoveTraccarVehicles(res.data);
      setVehicules(filteredVehicles);
      setMarques([...new Set(filteredVehicles.map(v => v.marque))]);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const interval = setInterval(fetchVehicules, 60000);
    return () => clearInterval(interval);
  }, [adminId, fetchVehicules]);

  useEffect(() => {
    fetchVehicules();
  }, [adminId, searchTerm, filteredMarque]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filteredMarque]);

  // Handle archive
  const handleArchive = async () => {
    if (!vehicleToArchive) return;
    setIsArchiving(true);
    const previousVehicles = [...vehicules];
    try {
      setVehicules(prev => prev.filter(v => v._id !== vehicleToArchive._id));
      const token = localStorage.getItem('token');
      await axios.put(
        `${apiUrl}/vehicules/archive/${vehicleToArchive._id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Véhicule archivé avec succès');
    } catch (error) {
      setVehicules(previousVehicles);
      toast.error(error.response?.data?.message || 'Échec de l\'archivage');
    } finally {
      setShowArchivePopup(false);
      setIsArchiving(false);
    }
  };

  // Form handling
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validateForm = () => {
    const requiredFields = ["marque", "modele", "immatriculation", "mec", "proprietaire", "numChassis"];
    for (const field of requiredFields) {
      if (!formData[field]) {
        setFormMessage(`Le champ ${field} est obligatoire`);
        setFormMessageType("error");
        return false;
      }
    }
    if (!/^[A-Z0-9]{3,10}$/i.test(formData.immatriculation)) {
      setFormMessage("Format d'immatriculation invalide");
      setFormMessageType("error");
      return false;
    }
    if (!/^[A-HJ-NPR-Z0-9]{17}$/i.test(formData.numChassis)) {
      setFormMessage("Le numéro de châssis doit contenir 17 caractères alphanumériques (sans I, O, Q)");
      setFormMessageType("error");
      return false;
    }
    return true;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setFormLoading(true);
    try {
      await axios.post(`${apiUrl}/vehicules/createVehicule`, {
        ...formData,
        mec: new Date(formData.mec).toISOString(),
      });
      setFormMessage("Véhicule ajouté avec succès !");
      setFormMessageType("success");
      setFormData({
        marque: '',
        modele: '',
        immatriculation: '',
        mec: '',
        etat: 'Fonctionnel',
        proprietaire: '',
        numChassis: '',
        typeMines: '',
        kilometrage: '',
        conducteur: null,
        capteurId: null,
        hasCapteur: false,
      });
      setShowAddVehicleModal(false);
      fetchVehicules(); // Refresh vehicle list
    } catch (error) {
      setFormMessage(error.response?.data?.message || "Erreur lors de l'ajout du véhicule");
      setFormMessageType("error");
    } finally {
      setFormLoading(false);
    }
  };

  // Filter vehicles
  const filteredVehicules = vehicules.filter(v => {
    const matchesMarque = filteredMarque === '' || v.marque === filteredMarque;
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      v.modele?.toLowerCase().includes(search) ||
      v.immatriculation?.toLowerCase().includes(search);
    const isNotArchived = !v.isArchived;
    return matchesMarque && matchesSearch && isNotArchived;
  });

  const totalPages = Math.ceil(filteredVehicules.length / vehiculesPerPage);
  const currentVehicules = filteredVehicules.slice(
    (currentPage - 1) * vehiculesPerPage,
    currentPage * vehiculesPerPage
  );

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

          /* Variables */
          :root {
            --primary-color: #151145;
            --primary-dark: #1a1048;
            --secondary-color: #100d34;
            --success-color: #28a745;
            --danger-color: #dc3545;
            --text-color: #333;
            --text-light: #555;
            --text-placeholder: #aaa;
            --bg-color: #fff;
            --bg-light: #f9f9f9;
            --bg-table-header: #f5f7fa;
            --border-color: #e0e3e8;
            --shadow-sm: 0 2px 10px rgba(0, 0, 0, 0.1);
            --shadow-md: 0 2px 5px rgba(0, 0, 0, 0.05);
            --radius-sm: 4px;
            --radius-md: 8px;
            --radius-lg: 10px;
            --transition: all 0.3s ease;
            --font-family: system-ui, -apple-system, sans-serif;
          }

          /* Global Styles */
          body {
            font-family: var(--font-family);
            background: var(--bg-light);
            color: var(--text-color);
            line-height: 1.6;
          }

          /* Dashboard Layout */
          .dashboard-admin {
            display: flex;
            min-height: 100vh;
          }

          .main-content {
            flex: 1;
            padding: 1rem;
            margin-left: 250px;
            transition: var(--transition);
          }

          /* Toggle Button */
          .toggle-btn {
            display: none;
            position: fixed;
            top: 10px;
            left: 10px;
            z-index: 1000;
            background-color: var(--primary-color);
            color: white;
            border: none;
            border-radius: var(--radius-sm);
            padding: 8px 12px;
            font-size: 18px;
            cursor: pointer;
          }

          /* Container */
          .container2 {
            background-color: var(--bg-color);
            border-radius: var(--radius-md);
            box-shadow: var(--shadow-sm);
            padding: 25px;
            margin: 25px auto;
            max-width: 1200px;
            margin-top: 50px;
          }

          /* Header */
          .container2 .header {
            margin-bottom: 25px;
            padding-bottom: 15px;
            border-bottom: 1px solid var(--border-color);
          }

          .container2 .header h2 {
            color: var(--text-color);
            font-size: 24px;
            margin-bottom: 5px;
          }

          .container2 .header p {
            color: var(--text-light);
            font-size: 14px;
          }

          .admin-group {
            color: var(--text-color);
            font-size: 14px;
            margin-top: 5px;
          }

          /* Filter Bar */
          .filter-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            gap: 10px;
            flex-wrap: wrap;
          }

          .filter-bar input {
            flex: 1;
            min-width: 200px;
            padding: 12px 15px;
            border: 1px solid #bbb;
            border-radius: var(--radius-lg);
            font-size: 16px;
            color: var(--text-color);
            background-color: var(--bg-light);
            box-shadow: var(--shadow-md);
            transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
          }

          .filter-bar input:focus {
            outline: none;
            border-color: #007bff;
            box-shadow: 0 2px 7px rgba(0, 123, 255, 0.15);
          }

          .filter-bar input::placeholder {
            color: var(--text-placeholder);
            font-style: italic;
          }

          .filter-bar select {
            width: auto;
            min-width: 150px;
            padding: 6px 10px;
            border-radius: var(--radius-md);
            border: 1px;
            font-size: 14px;
            background-color: var(--bg-color);
            color: var(--text-color);
            transition: var(--transition);
          }

          .filter-bar select:focus {
            outline: none;
            border-color: #007bff;
            box-shadow: 0 2px 7px rgba(0, 123, 255, 0.15);
          }

          /* Add Vehicle Button */
          .add-vehicle-btn {
            margin-bottom: 20px;
          }

          .btn-add {
            background-color:rgb(15, 15, 92);
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: var(--radius-md);
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: var(--transition);
          }

          .btn-add:hover {
            background-color: #2980b9;
          }

          /* Vehicles Table */
          .vehicles-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 14px;
            background-color: var(--bg-color);
            border-radius: var(--radius-md);
            box-shadow: var(--shadow-sm);
            overflow: hidden;
          }

          .vehicles-table th {
            background-color: var(--bg-table-header);
            color: var(--text-color);
            font-weight: 600;
            text-align: left;
            padding: 12px 15px;
            border-bottom: 2px solid var(--border-color);
          }

          .vehicles-table td {
            padding: 12px 15px;
            border-bottom: 1px solid var(--border-color);
            color: var(--text-light);
          }

          .vehicles-table tr:hover td {
            background-color: var(--bg-light);
          }

          .no-vehicles {
            text-align: center;
            padding: 20px;
            color: var(--text-light);
          }

          .action-buttons {
            display: flex;
            gap: 8px;
          }

          .action-icon {
            background: none;
            border: none;
            color: var(--text-color);
            font-size: 16px;
            cursor: pointer;
            padding: 4px;
            border-radius: var(--radius-sm);
            transition: var(--transition);
            text-decoration: none;
          }

          .action-icon:hover {
            background-color: var(--bg-light);
            color: var(--primary-color);
          }

          .action-icon.archive {
            color: var(--danger-color);
          }

          .action-icon.archiving {
            opacity: 0.5;
            cursor: not-allowed;
          }

          /* Status Badge */
          .status-badge {
            display: inline-flex;
            justify-content: center;
            align-items: center;
            padding: 4px 12px;
            border-radius: 15px;
            font-size: 0.8em;
            font-weight: bold;
            color: #fff;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }

          .status-badge.online {
            background-color: var(--success-color);
          }

          .status-badge.offline {
            background-color: var(--danger-color);
          }

          /* Popup/Modal Styles */
          .popup-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.6);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            backdrop-filter: blur(5px);
          }

          .popup-content {
            background-color: var(--bg-color);
            padding: 20px;
            border-radius: var(--radius-md);
            width: 90%;
            max-width: 600px;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
            position: relative;
          }

          .popup-content h3 {
            color: var(--text-color);
            font-size: 20px;
            margin-bottom: 15px;
          }

          .popup-actions {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
            margin-top: 20px;
          }

          .popup-btn {
            padding: 8px 16px;
            border-radius: var(--radius-sm);
            border: none;
            cursor: pointer;
            font-size: 14px;
            transition: var(--transition);
          }

          .popup-btn.confirm {
            background-color:rgb(24, 17, 77);
            color: white;
          }

          .popup-btn.confirm:hover {
            background-color:rgb(14, 16, 80);
          }

          .popup-btn.cancel {
             background-color:rgb(162, 162, 177);
            color: white;
          }

          .popup-btn.cancel:hover {
            background-color:rgb(162, 162, 177);
          }

          .popup-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          /* Add Vehicle Form */
          .vehicle-form {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }

          .vehicle-form-section {
            margin-bottom: 20px;
          }

          .section-title {
            color: var(--text-color);
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 10px;
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 5px;
          }

          .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
          }

          .vehicle-input-item {
            display: flex;
            flex-direction: column;
          }

          .vehicle-label {
            display: flex;
            align-items: center;
            font-size: 14px;
            color: var(--text-color);
            font-weight: 500;
            margin-bottom: 8px;
          }

          .input-icon {
            margin-right: 8px;
            font-size: 16px;
          }

          .vehicle-input-item input,
          .vehicle-input-item select {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-size: 14px;
            color: var(--text-color);
            background-color: var(--bg-light);
            transition: border-color 0.2s;
          }

          .vehicle-input-item input:focus,
          .vehicle-input-item select:focus {
            outline: none;
            border-color: #007bff;
          }

          .vehicle-input-item input::placeholder {
            color: var(--text-placeholder);
          }

          .input-hint {
            font-size: 12px;
            color: var(--text-light);
            margin-top: 4px;
          }

          .vehicle-message {
            display: flex;
            align-items: center;
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 15px;
          }

          .vehicle-message.success {
            background-color: #e6f3e6;
            color: #2e7d32;
          }

          .vehicle-message.error {
            background-color: #fce4ec;
            color: var(--danger-color);
          }

          .message-icon {
            margin-right: 8px;
            font-size: 16px;
          }

          .form-actions {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-top: 20px;
          }

          .vehicle-btn {
            padding: 10px 20px;
            border-radius: 4px;
            font-size: 14px;
            cursor: pointer;
            transition: var(--transition);
          }

          .vehicle-btn-primary {
            background-color:rgb(21, 19, 78);
            color: white;
            border: none;
          }

          .vehicle-btn-primary:hover {
            background-color:rgb(14, 25, 73);
          }

          .vehicle-btn-secondary {
            background-color: grey;
            color: white;
            border: 1px solid var(--border-color);
          }

          .vehicle-btn-secondary:hover {
            background-color:grey;
          }

          .vehicle-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          /* Alert */
          .alert {
            padding: 12px 15px;
            border-radius: 4px;
            margin: 2px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 14px;
          }

          .alert.error {
            background-color: #fff;
            color: var(--danger-color);
            border-left: 4px solid var(--danger-color);
          }

          .alert .btn {
            background: none;
            border: none;
            font-size: 18px;
            cursor: pointer;
            color: var(--text-color);
          }

          /* Loading */
          .loading {
            text-align: center;
            padding: 20px;
            color: var(--text-color);
          }

          /* Pagination */
          .pagination {
            display: flex;
            justify-content: center;
            align-items: center;
            margin-top: 20px;
            gap: 10px;
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
            border: none;
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

          /* Responsive Design */
          @media (max-width: 768px) {
            .main-content {
              margin-left: 0;
              padding: 0.5rem;
            }

            .toggle-btn {
              display: block;
            }

            .container2 {
              padding: 15px;
              margin: 10px;
            }

            .filter-bar {
              flex-direction: column;
              align-items: stretch;
            }

            .filter-bar input,
            .filter-bar select {
              width: 100%;
              min-width: unset;
            }

            .form-row {
              grid-template-columns: 1fr;
            }

            .vehicles-table {
              display: block;
              overflow-x: auto;
              white-space: nowrap;
            }

            .popup-content {
              width: 95%;
              padding: 15px;
            }

            .pagination {
              gap: 5px;
              flex-wrap: wrap;
            }
          }

          /* Dark Mode */
          @media (prefers-color-scheme: dark) {
            :root {
              --text-color: #e9ecef;
              --text-light: #adb5bd;
              --text-placeholder: #6c757d;
              --bg-color: #212529;
              --bg-light: #343a40;
              --bg-table-header: #343a40;
              --border-color: #4a4d51;
            }

            .container2 {
              background-color: var(--bg-color);
            }

            .vehicles-table {
              background-color: var(--bg-color);
            }

            .vehicles-table tr:hover {
              background-color: var(--bg-light);
            }

            .popup-content {
              background-color: var(--bg-color);
            }

            .filter-bar input,
            .filter-bar select,
            .vehicle-input-item input,
            .vehicle-input-group select {
              background-color: var(--bg-light);
              color: var(--text-color);
              border-color: var(--border-color);
            }

            .alert.error {
              background-color: #2c2c2c;
            }
          }
        `}
      </style>
      <div className="dashboard-admin">
        <button className="toggle-btn" onClick={toggleSidebar}>
          {isSidebarOpen ? "✕" : "☰"}
        </button>
        <SidebarSupAdmin isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div className="main-content">
          <NavbarSuperAdmin />
          <div className="container2">
            <div className="header">
              <h2>Véhicules Sans Capteur</h2>
              <p>Liste des véhicules automobiles de votre groupe ne disposant pas de capteurs actifs.</p>
              {adminGroup && <p className="admin-group">Groupe: {adminGroup}</p>}
            </div>

            <div className="filter-bar">
              <input
                type="text"
                placeholder="Recherche par modèle ou immatriculation..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              <select value={filteredMarque} onChange={e => setFilteredMarque(e.target.value)}>
                <option value="">Toutes les marques disponibles</option>
                {marques.map((marque, idx) => (
                  <option key={idx} value={marque}>{marque}</option>
                ))}
              </select>
            </div>

            <div className="add-vehicle-btn">
              <button className="btn-add" onClick={() => setShowAddVehicleModal(true)}>
                Ajouter
              </button>
            </div>

            {error && (
              <div className="alert error">
                {error}
                <button onClick={() => setError(null)}>×</button>
              </div>
            )}

            {loading ? (
              <div className="loading">Chargement des véhicules...</div>
            ) : (
              <table className="vehicles-table">
                <thead>
                  <tr>
                    <th>Marque</th>
                    <th>Modèle</th>
                    <th>Immatriculation</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentVehicules.length > 0 ? (
                    currentVehicules.map((v) => (
                      <tr key={v._id}>
                        <td>{v.marque || 'N/A'}</td>
                        <td>{v.modele || 'N/A'}</td>
                        <td>{v.immatriculation}</td>
                        <td>
                          <span className={`status-badge ${v.etat === 'Fonctionnel' ? 'online' : 'offline'}`}>
                            {v.etat || 'offline'}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <Link
                              className="action-icon"
                              to="/AjouterVehicule"
                              state={{ vehicle: v }}
                            >
                              ✏️
                            </Link>
                            <button
                              className={`action-icon archive ${isArchiving ? 'archiving' : ''}`}
                              onClick={() => {
                                setVehicleToArchive(v);
                                setShowArchivePopup(true);
                              }}
                              disabled={isArchiving}
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center' }}>
                        {adminId ? 'Aucun véhicule trouvé dans votre groupe' : 'Chargement...'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {showArchivePopup && (
              <div className="popup-overlay">
                <div className="popup-content">
                  <h3>🗂 Confirmer l'archivage</h3>
                  <p>
                    Êtes-vous sûr de vouloir archiver le véhicule{' '}
                    <strong>{vehicleToArchive?.marque || 'N/A'} {vehicleToArchive?.modele || 'N/A'}</strong> ({vehicleToArchive?.immatriculation}) ?
                  </p>
                  <div className="popup-actions">
                    <button
                      className="popup-btn confirm"
                      onClick={handleArchive}
                      disabled={isArchiving}
                    >
                      {isArchiving ? 'Archivage...' : 'Confirmer'}
                    </button>
                    <button
                      className="popup-btn cancel"
                      onClick={() => setShowArchivePopup(false)}
                      disabled={isArchiving}
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              </div>
            )}

            {showAddVehicleModal && (
              <div className="popup-overlay">
                <div className="popup-content">
                  <h3>Ajouter un nouveau véhicule</h3>
                  {formMessage && (
                    <div className={`vehicle-message ${formMessageType}`}>
                      <div className="message-icon">
                        {formMessageType === 'success' ? '✓' : '⚠'}
                      </div>
                      <p>{formMessage}</p>
                    </div>
                  )}
                  <form onSubmit={handleFormSubmit} className="vehicle-form">
                    <div className="vehicle-form-section">
                      <h3 className="section-title">Informations générales</h3>
                      <div className="form-row">
                        <div className="vehicle-input-item">
                          <label className="vehicle-label" htmlFor="marque">
                            <span className="input-icon"></span> Marque
                          </label>
                          <input
                            id="marque"
                            name="marque"
                            type="text"
                            placeholder="Ex: CHERY"
                            value={formData.marque}
                            onChange={handleFormChange}
                            required
                          />
                        </div>
                        <div className="vehicle-input-item">
                          <label className="vehicle-label" htmlFor="modele">
                            <span className="input-icon"></span> Modèle
                          </label>
                          <input
                            id="modele"
                            name="modele"
                            type="text"
                            placeholder="Ex: ARRIZO"
                            value={formData.modele}
                            onChange={handleFormChange}
                            required
                          />
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="vehicle-input-item">
                          <label className="vehicle-label" htmlFor="immatriculation">
                            <span className="input-icon"></span> Immatriculation
                          </label>
                          <input
                            id="immatriculation"
                            name="immatriculation"
                            type="text"
                            placeholder="Ex: 123TU4567"
                            value={formData.immatriculation}
                            onChange={handleFormChange}
                            required
                          />
                        </div>
                        <div className="vehicle-input-item">
                          <label className="vehicle-label" htmlFor="mec">
                            <span className="input-icon"></span> Date de mise en circulation
                          </label>
                          <input
                            id="mec"
                            name="mec"
                            type="date"
                            value={formData.mec}
                            onChange={handleFormChange}
                            required
                          />
                        </div>
                      </div>
                      <div className="vehicle-input-item">
                        <label className="vehicle-label" htmlFor="etat">
                          <span className="input-icon"></span> État
                        </label>
                        <select
                          id="etat"
                          name="etat"
                          value={formData.etat}
                          onChange={handleFormChange}
                        >
                          <option value="Fonctionnel">Fonctionnel</option>
                          <option value="En réparation">En réparation</option>
                          <option value="Hors service">Hors service</option>
                        </select>
                      </div>
                      <div className="vehicle-input-item">
                        <label className="vehicle-label" htmlFor="proprietaire">
                          <span className="input-icon"></span> Propriétaire (Groupe)
                        </label>
                        <select
                          id="proprietaire"
                          name="proprietaire"
                          value={formData.proprietaire}
                          onChange={handleFormChange}
                          required
                        >
                          <option value="">Sélectionner un groupe</option>
                          {groupes.map(groupe => (
                            <option key={groupe._id} value={groupe._id}>
                              {groupe.nom}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="vehicle-form-section">
                      <h3 className="section-title">Détails techniques</h3>
                      <div className="form-row">
                        <div className="vehicle-input-item">
                          <label className="vehicle-label" htmlFor="numChassis">
                            <span className="input-icon"></span> Numéro de châssis (VIN)
                          </label>
                          <input
                            id="numChassis"
                            name="numChassis"
                            type="text"
                            placeholder="Ex: LWDC2015"
                            value={formData.numChassis}
                            onChange={handleFormChange}
                            required
                          />
                          <span className="input-hint">17 caractères alphanumériques</span>
                        </div>
                        <div className="vehicle-input-item">
                          <label className="vehicle-label" htmlFor="typeMines">
                            <span className="input-icon"></span> Type Mines
                          </label>
                          <input
                            id="typeMines"
                            name="typeMines"
                            type="text"
                            placeholder="Ex: M3XAE00"
                            value={formData.typeMines}
                            onChange={handleFormChange}
                          />
                        </div>
                      </div>
                      <div className="vehicle-input-item">
                        <label className="vehicle-label" htmlFor="kilometrage">
                          <span className="input-icon"></span> Kilométrage
                        </label>
                        <input
                          id="kilometrage"
                          name="kilometrage"
                          type="number"
                          placeholder="Kilométrage actuel"
                          value={formData.kilometrage}
                          onChange={handleFormChange}
                          min="0"
                        />
                      </div>
                    </div>
                    <div className="form-actions">
                      <button
                        type="submit"
                        className="vehicle-btn vehicle-btn-primary"
                        disabled={formLoading}
                      >
                        {formLoading ? 'Enregistrement...' : 'Enregistrer le véhicule'}
                      </button>
                      <button
                        type="button"
                        className="vehicle-btn vehicle-btn-secondary"
                        onClick={() => {
                          setShowAddVehicleModal(false);
                          setFormMessage('');
                          setFormData({
                            marque: '',
                            modele: '',
                            immatriculation: '',
                            mec: '',
                            etat: 'Fonctionnel',
                            proprietaire: '',
                            numChassis: '',
                            typeMines: '',
                            kilometrage: '',
                            conducteur: null,
                            capteurId: null,
                            hasCapteur: false,
                          });
                        }}
                        disabled={formLoading}
                      >
                        Annuler
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

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
          </div>
        </div>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={true}
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

export default VehSansCapSA;