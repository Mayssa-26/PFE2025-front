"use client";
import { FaArrowRight } from 'react-icons/fa';

import { useEffect, useRef, useState } from "react";
import NavbarSuperAdmin from "./NavBarSupAdmin";
import SidebarSupAdmin from "./SideBarSupAdmin";
import "./dashSuperAdmin.css";
import "../dashboardAdmin/SideBar.css";
import "../dashboardAdmin/NavBar.css";
import axios from "axios";
import { ShoppingBag, BarChart2, PieChart, TrendingUp } from "lucide-react";
import { FaSearch } from "react-icons/fa";
import "../dashboardAdmin/tous.css";
import { useNavigate } from "react-router-dom";

const DashSuperAdmin = () => {
  const navigate = useNavigate();
  const donutRef = useRef(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    chauffeurs: 0,
    vehicules: 0,
    telephones: 0,
    positions: 0,
    onlinePercentage: 0,
    offlinePercentage: 0,
    groups: 0,
  });

  const [teamAData, setTeamAData] = useState([]);
  const [teamBData, setTeamBData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState({ vehicles: false, stats: false });
  const [error, setError] = useState(null);
  const [currentPage] = useState(1);
  const [offlineCount, setOfflineCount] = useState(0);
  const vehiclesPerPage = 5;
  const currentVehicles = vehicles.slice(
    (currentPage - 1) * vehiclesPerPage,
    currentPage * vehiclesPerPage
  );

  const filteredVehicles = vehicles.filter(
    (vehicle) =>
      vehicle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.id.toString().includes(searchTerm) ||
      (vehicle.groupId && vehicle.groupId.toString().includes(searchTerm))
  );

  useEffect(() => {
    const fetchStats = async () => {
      setLoading((prev) => ({ ...prev, stats: true }));
      setError(null);
      try {
        const vehiclesWithSensorsResponse = await axios.get(
          "https://yepyou.treetronix.com/api/devices",
          {
            headers: { Authorization: "Basic " + btoa("admin:admin") },
          }
        );
        const vehiclesWithSensors = vehiclesWithSensorsResponse.data.length;
        setVehicles(vehiclesWithSensorsResponse.data);
        const offlineVehicles = vehiclesWithSensorsResponse.data.filter(
          (v) => v.status !== "online"
        ).length;
        const onlineVehicles = vehiclesWithSensors - offlineVehicles;

        const vehiclesWithoutSensorsResponse = await axios.get(
          "/api/vehicules/getVehicules"
        );
        const vehiclesWithoutSensors =
          vehiclesWithoutSensorsResponse.data.length;

        const adminsResponse = await fetch(
          "http://localhost:8000/api/groupes/getAdminsWithGroups"
        );
        if (!adminsResponse.ok)
          throw new Error("Erreur lors de la récupération des admins");
        const adminsData = await adminsResponse.json();
        const adminsCount = adminsData.length;

        // Récupérer le nombre de groupes (remplacez par votre véritable endpoint)
        const groupsResponse = await fetch("http://localhost:8000/api/groupes");
        if (!groupsResponse.ok)
          throw new Error("Erreur lors de la récupération des groupes");
        const groupsData = await groupsResponse.json();
        const groupsCount = groupsData.length;

        const positionsCount = 102; // Remplacer par un appel API réel si disponible

        setStats({
          chauffeurs: vehiclesWithSensors,
          vehicules: vehiclesWithoutSensors,
          telephones: adminsCount,
          positions: positionsCount,
          onlinePercentage: vehiclesWithSensors
            ? ((onlineVehicles / vehiclesWithSensors) * 100).toFixed(1)
            : 0,
          offlinePercentage: vehiclesWithSensors
            ? ((offlineVehicles / vehiclesWithSensors) * 100).toFixed(1)
            : 0,
          groups: groupsCount,
        });
        setOfflineCount(offlineVehicles);

        setTeamAData([44, 58, 35, 53, 40, 48, 32, 46, 39, 52, 40]);
        setTeamBData([37, 45, 42, 50, 35, 44, 30, 43, 34, 48, 38]);
      } catch (error) {
        console.error("Erreur lors de la récupération des stats:", error);
        setError("Erreur lors de la récupération des statistiques.");
      } finally {
        setLoading((prev) => ({ ...prev, stats: false }));
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 300000); // Actualisation toutes les 5 minutes
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (donutRef.current) {
      const ctx = donutRef.current.getContext("2d");
      drawDonutChart(ctx, stats);
    }
  }, [teamAData, teamBData, stats]);

  function drawDonutChart(ctx, stats) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 20;

    ctx.clearRect(0, 0, width, height);

    const total =
      stats.chauffeurs + stats.vehicules + stats.telephones + stats.positions;
    const data = [
      { color: "#2196F3", value: stats.chauffeurs / total },
      { color: "#4CAF50", value: stats.vehicules / total },
      { color: "#FFC107", value: stats.telephones / total },
      { color: "#F44336", value: stats.positions / total },
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
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  return (
    <div className="dashboard-admin">
      <button className="toggle-btn" onClick={toggleSidebar}>
  {isSidebarOpen ? "✕" : "☰"}
</button>
      <SidebarSupAdmin isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="main-content">
        <NavbarSuperAdmin offlineCount={offlineCount} />
        <div className="dashboard">
          {loading.stats ? (
            <div className="loading">Chargement des statistiques...</div>
          ) : error ? (
            <div className="alert error">
              {error}
              <button onClick={() => setError(null)}>×</button>
            </div>
          ) : (
            <div className="stats-cards">
              <div className="stat-card">
                <div className="stat-header">
                  <div className="stat-icon blue">
                    <ShoppingBag size={24} />
                  </div>
                  <div className="stat-badge green">
                    +{stats.chauffeurs * 2}%
                  </div>
                </div>
                <div className="stat-content">
                  <h2 className="stat-value">{stats.chauffeurs}</h2>
                  <p className="stat-label">Véhicules avec Capteurs</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <div className="stat-icon yellow">
                    <BarChart2 size={24} />
                  </div>
                  <div className="stat-badge red">
                    +{stats.vehicules * 3}%
                  </div>
                </div>
                <div className="stat-content">
                  <h2 className="stat-value">{stats.vehicules}</h2>
                  <p className="stat-label">Véhicules sans Capteurs</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <div className="stat-icon pink">
                    <PieChart size={24} />
                  </div>
                  <div className="stat-badge yellow">+{stats.telephones}%</div>
                </div>
                <div className="stat-content">
                  <h2 className="stat-value">{stats.telephones}</h2>
                  <p className="stat-label">Admins</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <div className="stat-icon green">
                    <TrendingUp size={24} />
                  </div>
                  <div className="stat-badge blue">
                    +{Math.round(stats.positions / 3)}%
                  </div>
                </div>
                <div className="stat-content">
                  <h2 className="stat-value">{stats.positions}</h2>
                  <p className="stat-label">Positions</p>
                </div>
              </div>
            </div>
          )}

          <div className="chart-card donut-container">
            <div className="donut-and-stats">
              <div className="donut-wrapper">
                <canvas ref={donutRef} className="donut-chart"></canvas>
                <div className="donut-center">
                  <div className="donut-label">Total</div>
                  <div className="donut-value">
                    {stats.chauffeurs +
                      stats.vehicules +
                      stats.telephones +
                      stats.positions}
                  </div>
                </div>
              </div>
              <div className="additional-stats">
                <div className="stat-item">
                  <p className="stat-label">Véhicules Avec Capteurs</p>
                  <h3 className="stat-value">{stats.onlinePercentage}%</h3>
                </div>
                <div className="stat-item">
                  <p className="stat-label">Véhicules Sans Capteurs</p>
                  <h3 className="stat-value">{stats.offlinePercentage}%</h3>
                </div>
                <div className="stat-item">
                  <p className="stat-label">Nombre de groupes</p>
                  <h3 className="stat-value">{stats.groups}</h3>
                </div>
              </div>
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
        </div>

        {loading.vehicles ? (
          <div className="loading">Chargement des véhicules...</div>
        ) : error ? (
          <div className="alert error">
            {error}
            <button onClick={() => setError(null)}>×</button>
          </div>
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
                    <td>{vehicle.name}</td>
                    <td>{vehicle.id}</td>
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
  );
};

export default DashSuperAdmin;