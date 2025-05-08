import { useEffect, useRef, useState } from "react";
import Navbar from "./NavBar";
import Sidebar from "./SideBar";
import "./dashAdmin.css";
import "./SideBar.css";
import "./NavBar.css";
import axios from "axios";
import { ShoppingBag, BarChart2, PieChart, TrendingUp } from "lucide-react";
import { FaSearch } from "react-icons/fa";
import "./tous.css";
import { useNavigate } from "react-router-dom";
import jwt_decode from "jwt-decode";
import { FaArrowRight } from 'react-icons/fa';
const DashAdmin = () => {
  const navigate = useNavigate();
  const donutRef = useRef(null);

  const [stats, setStats] = useState({
    vehiculesAvecCapteur: 0,
    vehiculesSansCapteur: 0,
    telephones: 0,
    positions: 0,
  });

  const [adminStats, setAdminStats] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [vehiclesWithSensors, setVehiclesWithSensors] = useState([]);
  const [loading, setLoading] = useState({ vehicles: false, adminStats: false });
  const [error, setError] = useState(null);
  const [currentPage] = useState(1);
  const [offlineCount, setOfflineCount] = useState(0);
  const vehiclesPerPage = 5;
  const currentVehicles = vehiclesWithSensors.slice(
    (currentPage - 1) * vehiclesPerPage,
    currentPage * vehiclesPerPage
  );

  const filteredVehicles = vehiclesWithSensors.filter((vehicle) =>
    vehicle.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.id?.toString().includes(searchTerm) ||
    (vehicle.groupId && vehicle.groupId.toString().includes(searchTerm))
  );

  useEffect(() => {
    if (donutRef.current) {
      const ctx = donutRef.current.getContext("2d");
      drawDonutChart(ctx, stats);
    }
  }, [stats]);

  function drawDonutChart(ctx, stats) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 20;
    ctx.clearRect(0, 0, width, height);
    const total =
      stats.vehiculesAvecCapteur +
      stats.vehiculesSansCapteur +
      stats.telephones +
      stats.positions;
    const data = [
      { color: "#4CAF50", value: stats.vehiculesAvecCapteur / total },
      { color: "#F44336", value: stats.vehiculesSansCapteur / total },
      { color: "#FFC107", value: stats.telephones / total },
      { color: "#2196F3", value: stats.positions / total },
    ];
    let startAngle = -0.25 * 2 * Math.PI;
    data.forEach((segment) => {
      ctx.beginPath();
      ctx.arc(
        centerX,
        centerY,
        radius,
        startAngle,
        startAngle + segment.value * 2 * Math.PI
      );
      ctx.strokeStyle = segment.color;
      ctx.lineWidth = 20;
      ctx.stroke();
      startAngle += segment.value * 2 * Math.PI;
    });
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading((prev) => ({ ...prev, vehicles: true, adminStats: true }));
      setError(null);
      try {
        const token = localStorage.getItem("token");
        let currentAdminId = null;
        if (token) {
          const decoded = jwt_decode(token);
          currentAdminId = decoded.id;
        }

        // Fetch vehicles with sensors from /api/devices
        const devicesResponse = await axios.get(
          "https://yepyou.treetronix.com/api/devices",
          {
            headers: { Authorization: "Basic " + btoa("admin:admin") },
          }
        );
        const vehiclesWithSensorsData = devicesResponse.data || [];
        setVehiclesWithSensors(vehiclesWithSensorsData);

        const vehiculesAvecCapteur = vehiclesWithSensorsData.filter(
          (v) => v.hasSensor
        ).length;
        const offlineVehicles = vehiclesWithSensorsData.filter(
          (v) => v.status !== "online"
        );
        setOfflineCount(offlineVehicles.length);

        // Fetch vehicles without sensors for the admin
        const adminVehiclesResponse = await axios.get(
          `/api/vehicules/admin/${currentAdminId}`
        );
        const vehiclesWithoutSensors =
          adminVehiclesResponse.data.data[0]?.vehicules || [];
        const vehiculesSansCapteur = vehiclesWithoutSensors.length; // All vehicles from this API are without sensors

        // Update stats
        setStats((prev) => ({
          ...prev,
          vehiculesAvecCapteur,
          vehiculesSansCapteur,
          telephones: vehiclesWithSensorsData.filter((v) => v.isPhone).length,
          positions: vehiclesWithSensorsData.reduce(
            (acc, v) => acc + (v.positions || 0),
            0
          ),
        }));

        // Update admin stats
        setAdminStats([
          {
            adminId: currentAdminId,
            adminName: `Admin ${currentAdminId}`,
            vehiculesAvecCapteur,
            vehiculesSansCapteur,
          },
        ]);

        if (offlineVehicles.length > 0) {
          const badge = document.querySelector(".notification-badge");
          if (badge) {
            badge.classList.add("pulse");
            setTimeout(() => badge.classList.remove("pulse"), 3000);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Erreur lors de la récupération des données.");
      } finally {
        setLoading((prev) => ({ ...prev, vehicles: false, adminStats: false }));
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 300000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="dashboard-admin">
      <Sidebar />
      <div className="main-content">
        <Navbar offlineCount={offlineCount} />
        <div className="dashboard">
          <div className="stats-cards">
            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon green">
                  <ShoppingBag size={24} />
                </div>
                <div className="stat-badge blue">
                  +{stats.vehiculesAvecCapteur * 2}%
                </div>
              </div>
              <div className="stat-content">
                <h2 className="stat-value">{stats.vehiculesAvecCapteur}</h2>
                <p className="stat-label">Véhicules avec capteur</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon red">
                  <BarChart2 size={24} />
                </div>
                <div className="stat-badge yellow">
                  +{stats.vehiculesSansCapteur * 3}%
                </div>
              </div>
              <div className="stat-content">
                <h2 className="stat-value">{stats.vehiculesSansCapteur}</h2>
                <p className="stat-label">Véhicules sans capteur</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon yellow">
                  <PieChart size={24} />
                </div>
                <div className="stat-badge green">+{stats.telephones}%</div>
              </div>
              <div className="stat-content">
                <h2 className="stat-value">{stats.telephones}</h2>
                <p className="stat-label">Téléphones</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon blue">
                  <TrendingUp size={24} />
                </div>
                <div className="stat-badge pink">+{stats.positions / 3}%</div>
              </div>
              <div className="stat-content">
                <h2 className="stat-value">{stats.positions}</h2>
                <p className="stat-label">Positions</p>
              </div>
            </div>
          </div>

          <div className="admin-stats-container">
            {adminStats.length === 0 ? (
              <p>Aucune donnée disponible</p>
            ) : (
              <div className="stats-schema-container">
                <h3>Statistiques des Véhicules</h3>
                <div className="stats-schema">
                  {adminStats.map((admin) => (
                    <div className="stats-item" key={admin.adminId}>
                      <div className="stats-details">
                        <div className="stat">
                          <h5>Véhicules avec capteur</h5>
                          <p>{admin.vehiculesAvecCapteur}</p>
                        </div>
                        <div className="stat">
                          <h5>Véhicules sans capteur</h5>
                          <p>{admin.vehiculesSansCapteur}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="charts-container">
            <div className="chart-card donut-container">
              <canvas ref={donutRef} className="donut-chart"></canvas>
              <div className="donut-center">
                <div className="donut-label">Total</div>
                <div className="donut-value">
                  {stats.vehiculesAvecCapteur +
                    stats.vehiculesSansCapteur +
                    stats.telephones +
                    stats.positions}
                </div>
              </div>
            </div>
            
          </div>

          {error && (
            <div className="alert error">
              {error}
              <button onClick={() => setError(null)}>×</button>
            </div>
          )}
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
                    <th>Nom</th>
                    <th>ID</th>
                    <th>Groupe</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {currentVehicles.map((vehicle) => (
                    <tr key={vehicle.id}>
                      <td>{vehicle.name || "N/A"}</td>
                      <td>{vehicle.id || "N/A"}</td>
                      <td>{vehicle.groupId || "-"}</td>
                      <td>
                        <span
                          className={`status-badge ${
                            vehicle.status === "online"
                              ? "online-oval"
                              : "offline-oval"
                          }`}
                        >
                          {vehicle.status || "inconnu"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button
                className="see-more-btn"
                onClick={() => navigate("/VehiculesAvecCapteurSA")}
              >
                Voir Plus
                <FaArrowRight className="icon" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashAdmin;