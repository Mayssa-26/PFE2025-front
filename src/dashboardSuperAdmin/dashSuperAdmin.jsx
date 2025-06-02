"use client";
import { FaArrowRight } from 'react-icons/fa';

import { useEffect, useRef, useState } from "react";
import NavbarSuperAdmin from "./NavBarSupAdmin";
import SidebarSupAdmin from "./SideBarSupAdmin";


import axios from "axios";
import { ShoppingBag, BarChart2, PieChart, TrendingUp } from "lucide-react";
import { FaSearch } from "react-icons/fa";
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

        .dashboard {
          max-width: 1500px;
          margin: 0 auto;
          padding: 2rem;
        }

        .stats-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: var(--card-background);
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s ease;
        }

        .stat-card:hover {
          transform: translateY(-4px);
        }

        .stat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .stat-icon {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .stat-icon.green { background-color: var(--success-color); }
        .stat-icon.red { background-color: var(--error-color); }
        .stat-icon.yellow { background-color: var(--warning-color); }
        .stat-icon.blue { background-color: var(--info-color); }

        .stat-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 1rem;
          font-size: 0.75rem;
          font-weight: 600;
          color: white;
          font-family: 'Roboto', sans-serif;
        }

        .stat-badge.green { background-color: var(--success-color); }
        .stat-badge.red { background-color: var(--error-color); }
        .stat-badge.yellow { background-color: var(--warning-color); }
        .stat-badge.blue { background-color: var(--info-color); }

        .stat-content {
          display: flex;
          flex-direction: column;
        }

        .stat-value {
          font-size: 1.75remontant
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
          font-family: 'Roboto', sans-serif;
        }

        .stat-label {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin: 0.25rem 0 0;
          font-family: 'Roboto', sans-serif;
        }

        .chart-card {
          background: var(--card-background);
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          margin-top: 2rem;
        }

        .donut-and-stats {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.5rem;
          flex-wrap: wrap;
        }

        .donut-wrapper {
          flex: 2;
          max-width: 400px;
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 1rem;
        }

        .donut-chart {
          width: 500%;
          max-width: 450px;
          height: 250px;
        }

        .donut-center {
          position: absolute;
          text-align: center;
        }

        .donut-label {
          font-size: 0.875rem;
          color: var(--text-secondary);
          font-family: 'Roboto', sans-serif;
        }

        .donut-value {
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--text-primary);
          font-family: 'Roboto', sans-serif;
        }

        .additional-stats {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .stat-item .stat-label {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin-bottom: 0.25rem;
          font-family: 'Roboto', sans-serif;
        }

        .stat-item .stat-value {
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--text-primary);
          font-family: 'Roboto', sans-serif;
        }

        .search-container {
          position: relative;
          margin: 1.5rem 0;
          max-width: 400px;
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
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 0.875rem;
          transition: border-color 0.2s ease;
          font-family: 'Roboto', sans-serif;
        }

        .search-input:focus {
          outline: none;
          border-color: var(--primary-color);
          box-shadow: 0 0 0 3px rgba(30, 29, 84, 0.1);
        }

        .vehicles-table {
          width: 100%;
          border-collapse: collapse;
          background: var(--card-background);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          margin-top: 1.5rem;
        }

        .vehicles-table thead {
          background: linear-gradient(90deg, #6b7280, #4b5563);
          color: white;
        }

        .vehicles-table th {
          padding: 1rem;
          text-align: left;
          font-size: 0.875rem;
          text-transform: uppercase;
          font-family: 'Roboto', sans-serif;
        }

        .vehicles-table tbody tr {
          transition: background 0.2s ease;
        }

        .vehicles-table tbody tr:hover {
          background-color: #f3f4f6;
        }

        .vehicles-table td {
          padding: 1rem;
          border-bottom: 1px solid #e5e7eb;
          font-size: 0.875rem;
          color: var(--text-primary);
          font-family: 'Roboto', sans-serif;
        }

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 1rem;
          font-size: 0.75rem;
          font-weight: 500;
          font-family: 'Roboto', sans-serif;
        }

        .online-oval {
          background-color: rgba(34, 197, 94, 0.1);
          color: var(--success-color);
        }

        .offline-oval {
          background-color: rgba(239, 68, 68, 0.1);
          color: var(--error-color);
        }

        .see-more-btn {
          background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
          color: white;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.2s ease;
          margin-top: 1rem;
          font-family: 'Roboto', sans-serif;
        }

        .see-more-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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
          border-radius: 8px;
          cursor: pointer;
          font-size: 1rem;
          font-family: 'Roboto', sans-serif;
        }

        .alert.error {
          background-color: rgba(239, 68, 68, 0.1);
          color: var(--error-color);
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .loading {
          text-align: center;
          color: var(--text-secondary);
          padding: 2rem;
        }

        .no-results {
          text-align: center;
          color: var(--text-secondary);
          padding: 2rem;
          background: var(--card-background);
          border-radius: 8px;
        }

        @media (max-width: 1024px) {
          .main-content {
            margin-left: 0;
          }

          .stats-cards {
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          }

          .donut-and-stats {
            flex-direction: column;
            align-items: center;
          }
        }

        @media (max-width: 768px) {
          .dashboard {
            padding: 1rem;
          }

          .stats-cards {
            grid-template-columns: 1fr;
          }

          .search-container {
            max-width: 100%;
          }

          .toggle-btn {
            display: block;
          }

          .sidebar {
            transform: translateX(-100%);
            transition: transform 0.3s ease;
          }

          .sidebar.open {
            transform: translateX(0);
          }
        }

        @media (max-width: 640px) {
          .dashboard {
            padding: 0.5rem;
          }

          .stat-value {
            font-size: 1.5rem;
            font-family: 'Roboto', sans-serif;
          }

          .stat-label {
            font-size: 0.75rem;
            font-family: 'Roboto', sans-serif;
          }
        }
      `}</style>
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
                  <h2 className="stat-value">+ 100 </h2>
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
                  <p className="stat-label">Capteurs</p>
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
    </>
  );
};

export default DashSuperAdmin;