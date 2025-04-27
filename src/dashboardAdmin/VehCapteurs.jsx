"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { FaSearch } from "react-icons/fa";
import Navbar from "./NavBar";
import Sidebar from "./SideBar";
import "./dashAdmin.css";
import "./SideBar.css";
import "./NavBar.css";
import "./Tous.css";
import PropTypes from 'prop-types';

const VehCap = ({ statusFilter, title, description }) => {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [loading, setLoading] = useState({ vehicles: false, positions: false });
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusSelection, setStatusSelection] = useState("all");
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState(null);
  const navigate = useNavigate();
  const vehiclesPerPage = 3;

  const filteredVehicles = vehicles
    .filter(vehicle =>
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

  useEffect(() => {
    const fetchVehicles = async () => {
      setLoading(prev => ({ ...prev, vehicles: true }));
      setError(null);
      try {
        const response = await axios.get("https://yepyou.treetronix.com/api/devices", {
          headers: { Authorization: "Basic " + btoa("admin:admin") },
          timeout: 10000,
        });
        setVehicles(response.data);
      } catch (err) {
        console.error("Erreur API:", err);
        setError("Impossible de charger les véhicules. Réessayez plus tard.");
      } finally {
        setLoading(prev => ({ ...prev, vehicles: false }));
      }
    };
    fetchVehicles();
  }, []);

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
        headers: { Authorization: "Basic " + btoa("admin:admin") },
        timeout: 15000,
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

  return (
    <div className="dashboard-admin">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        <div className="container2">
          <div className="header">
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
          <Link to="/dashAdmin" className="btn-back">Retour au dashboard</Link>

          {/* Barre de filtre */}
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


          {/* Recherche */}
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

        {error && <div className="alert error">{error}<button onClick={() => setError(null)}>×</button></div>}

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
                    <th>Nom</th>
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
                      <td>{vehicle.groupId || "-"}</td>
                      <td>
                        <span className={`status-badge ${vehicle.status === 'online' ? 'online-oval' : 'offline-oval'}`}>
                          {vehicle.status || 'inconnu'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="action-btn"
                          onClick={() => { setSelectedVehicle(vehicle); setFormError(null); }}
                          disabled={loading.positions}
                          title="Voir le trajet"
                        >
                          {loading.positions && selectedVehicle?.id === vehicle.id ? <span className="spinner"></span> : "🗺️"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="pagination">
                <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="pagination-btn">Précédent</button>
                <span>{currentPage}</span>
                <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage >= totalPages} className="pagination-btn">Suivant</button>
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
    </div>
  );
};

VehCap.propTypes = {
  statusFilter: PropTypes.string,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
};

export default VehCap;
