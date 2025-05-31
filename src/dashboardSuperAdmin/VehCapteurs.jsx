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
import "../dashboardAdmin/VehCap.css";

const VehCapSupAdmin = ({ statusFilter, title, description }) => {
  const [groups, setGroups] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [loading, setLoading] = useState({ vehicles: false, positions: false, actions: false });
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusSelection, setStatusSelection] = useState("all");
  const [formError, setFormError] = useState(null);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [vehicleToArchive, setVehicleToArchive] = useState(null);
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

  const handleEditVehicle = (vehicle) => {
    navigate("/addVehiculeTraccar", {
      state: {
        vehicleToEdit: {
          id: vehicle.id,
          name: vehicle.name,
          uniqueId: vehicle.uniqueId,
          groupId: vehicle.groupId || 0,
          category: vehicle.category || "default",
          phone: vehicle.phone || "",
          model: vehicle.model || "",
          contact: vehicle.contact || "",
          status: vehicle.status || "offline",
          attributes: vehicle.attributes || {}
        }
      }
    });
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
        {isSidebarOpen ? "✕" : "☰"}
      </button>
      <SidebarSupAdmin isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div className="main-content">
        <NavbarSuperAdmin />
        <div className="container2">
          <div className="header">
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
          
          <div className="add-vehicle-container">
            <button className="btn-add" onClick={() => navigate("/addVehiculeTraccar")}>
              Ajouter
            </button>
          </div>

          <div className="filter-bar">
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
              placeholder="Rechercher par nom, ID ou groupe..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {loading.vehicles ? <div className="loading">Chargement des véhicules...</div> : (
          filteredVehicles.length === 0 ? (
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
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentVehicles.map(vehicle => (
                    <tr key={vehicle.id}>
                      <td>{vehicle.name}</td>
                      <td>{vehicle.id}</td>
                      <td>{getGroupName(vehicle.groupId)}</td>
                      <td>
                        <span className={`status-badge ${vehicle.status === 'online' ? 'online-oval' : 'offline-oval'}`}>
                          {vehicle.status || 'inconnu'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn-edit"
                          onClick={() => handleEditVehicle(vehicle)}
                          disabled={loading.actions}
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-delete"
                          onClick={() => openArchiveModal(vehicle.id, vehicle.name)}
                          disabled={loading.actions}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="pagination">
                <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>Précédent</button>
                <span>{currentPage}</span>
                <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage >= totalPages}>Suivant</button>
              </div>
            </>
          )
        )}
      </div>

      {selectedVehicle && (
        <div className="modal-overlay active">
          <div className="modal-content">
            <form className="map-form" onSubmit={handleSubmit}>
              <h3>Trajet du véhicule: {selectedVehicle.name}</h3>
              {formError && <div className="alert error">{formError}<button onClick={() => setFormError(null)} type="button">×</button></div>}
              <div className="form-grid">
                {["fromDate", "toDate"].map((field) => (
                  <div key={field} className="form-group">
                    <label htmlFor={field}>{field === "fromDate" ? "Date de début" : "Date de fin"}</label>
                    <input type="date" id={field} name={field} required disabled={loading.positions} max={new Date().toISOString().split('T')[0]} />
                  </div>
                ))}
                {["fromTime", "toTime"].map((field) => (
                  <div key={field} className="form-group">
                    <label htmlFor={field}>{field === "fromTime" ? "Heure de début" : "Heure de fin"}</label>
                    <input type="time" id={field} name={field} required disabled={loading.positions} />
                  </div>
                ))}
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={loading.positions}>
                  {loading.positions ? <><span className="spinner-btn"></span> Chargement...</> : "Visualiser le trajet"}
                </button>
                <button type="button" className="btn-secondary" onClick={() => { setSelectedVehicle(null); setFormError(null); }} disabled={loading.positions}>
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
            <h3>⚠️ Confirmer l'archivage</h3>
            <p>Êtes-vous sûr de vouloir archiver le véhicule <strong>{vehicleToArchive.name}</strong> ?</p>
            <div className="form-actions">
              <button onClick={handleArchive} className="group-btn danger" disabled={loading.actions}>
                {loading.actions ? 'Archivage...' : 'Confirmer'}
              </button>
              <button onClick={closeArchiveModal} className="group-btn secondary" disabled={loading.actions}>
                ❌ Annuler
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

VehCapSupAdmin.propTypes = {
  statusFilter: PropTypes.string,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
};

export default VehCapSupAdmin;