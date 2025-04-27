"use client";

import { useEffect, useRef, useState } from "react";
import NavbarSuperAdmin from "./NavBarSupAdmin";
import SidebarSupAdmin from "./SideBarSupAdmin";
import "./dashSuperAdmin.css";
import "../dashboardAdmin/SideBar.css";
import "../dashboardAdmin/NavBar.css";
import axios from "axios";
import { ShoppingBag, BarChart2, PieChart, TrendingUp, Menu } from "lucide-react";
import { FaSearch } from "react-icons/fa"; // Importez FaSearch
import "../dashboardAdmin/tous.css"; // Assurez-vous que ce fichier existe pour les styles de statut ovale et recherche
import { useNavigate } from "react-router-dom";

const DashSuperAdmin = () => {
  
  const navigate = useNavigate();
  const chartRef = useRef(null);
  const donutRef = useRef(null);

  const [stats, setStats] = useState({
    chauffeurs: 0,
    vehicules: 0,
    telephones: 0,
    positions: 0,
  });

  const [teamAData, setTeamAData] = useState([]);
  const [teamBData, setTeamBData] = useState([]);
  const [searchTerm, setSearchTerm] = useState(""); // État pour le terme de recherche
  const [vehicles, setVehicles] = useState([]); // État pour stocker la liste des véhicules
  const [loading, setLoading] = useState({ vehicles: false, positions: false });
  const [error, setError] = useState(null);
  const [currentPage] = useState(1);
  const vehiclesPerPage = 5; // Vous pouvez ajuster le nombre par page
  //const totalPages = Math.ceil(vehicles.length / vehiclesPerPage);
  const currentVehicles = vehicles.slice((currentPage - 1) * vehiclesPerPage, currentPage * vehiclesPerPage);

  // Filtrer les véhicules en fonction du terme de recherche
  const filteredVehicles = vehicles.filter(vehicle =>
    vehicle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.id.toString().includes(searchTerm) ||
    (vehicle.groupId && vehicle.groupId.toString().includes(searchTerm))
  );

  // Simulate API fetch pour les statistiques
  useEffect(() => {
    // Fake backend call
    setTimeout(() => {
      setStats({
        chauffeurs: 4,
        vehicules: 4,
        telephones: 5,
        positions: 102,
      });

      setTeamAData([44, 58, 35, 53, 40, 48, 32, 46, 39, 52, 40]);
      setTeamBData([37, 45, 42, 50, 35, 44, 30, 43, 34, 48, 38]);
    }, 1000);
  }, []);

  useEffect(() => {
    if (chartRef.current && teamAData.length && teamBData.length) {
      const ctx = chartRef.current.getContext("2d");
      drawLineChart(ctx, teamAData, teamBData);
    }
    if (donutRef.current) {
      const ctx = donutRef.current.getContext("2d");
      drawDonutChart(ctx, stats);
    }
  }, [teamAData, teamBData, stats]);

  function drawLineChart(ctx, teamAData, teamBData) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(173, 216, 255, 0.2)";
    ctx.fillRect(0, 0, width, height - 40);

    ctx.strokeStyle = "#e0e0e0";
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      const y = 20 + (i * (height - 80)) / 5;
      ctx.beginPath();
      ctx.moveTo(50, y);
      ctx.lineTo(width - 20, y);
      ctx.stroke();
    }

    const days = ["Dec 01", "Dec 02", "Dec 03", "Dec 04", "Dec 05", "Dec 06", "Dec 07", "Dec 08", "Dec 09", "Dec 10", "Dec 11"];

    ctx.fillStyle = "#666";
    ctx.font = "10px Arial";
    ctx.textAlign = "center";
    const xStep = (width - 70) / (days.length - 1);
    days.forEach((day, i) => ctx.fillText(day, 50 + i * xStep, height - 10));

    ctx.textAlign = "right";
    for (let i = 0; i < 6; i++) {
      const value = 25 + i * 6;
      const y = height - 60 - (i * (height - 80)) / 5;
      ctx.fillText(value.toString(), 45, y);
    }

    ctx.textAlign = "left";
    for (let i = 0; i < 6; i++) {
      const value = 30 + i * 12;
      const y = height - 60 - (i * (height - 80)) / 5;
      ctx.fillText(value.toString(), width - 15, y);
    }

    ctx.strokeStyle = "#2196F3";
    ctx.lineWidth = 3;
    ctx.beginPath();
    teamAData.forEach((value, i) => {
      const x = 50 + i * xStep;
      const normalizedValue = (value - 25) / 30;
      const y = height - 60 - normalizedValue * (height - 80);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "rgba(33, 150, 243, 0.3)");
    gradient.addColorStop(1, "rgba(33, 150, 243, 0.0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    teamAData.forEach((value, i) => {
      const x = 50 + i * xStep;
      const normalizedValue = (value - 25) / 30;
      const y = height - 60 - normalizedValue * (height - 80);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineTo(50 + (teamAData.length - 1) * xStep, height - 40);
    ctx.lineTo(50, height - 40);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "#4CAF50";
    ctx.lineWidth = 3;
    ctx.beginPath();
    teamBData.forEach((value, i) => {
      const x = 50 + i * xStep;
      const normalizedValue = (value - 25) / 30;
      const y = height - 60 - normalizedValue * (height - 80);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }

  function drawDonutChart(ctx, stats) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 20;

    ctx.clearRect(0, 0, width, height);

    const total = stats.chauffeurs + stats.vehicules + stats.telephones + stats.positions;
    const data = [
      { color: "#2196F3", value: stats.chauffeurs / total },
      { color: "#4CAF50", value: stats.vehicules / total },
      { color: "#FFC107", value: stats.telephones / total },
      { color: "#F44336", value: stats.positions / total },
    ];

    let startAngle = -0.25 * 2 * Math.PI;
    data.forEach(segment => {
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
  
  const [offlineCount, setOfflineCount] = useState(0);

  useEffect(() => {
    const fetchVehiclesData = async () => {
      setLoading((prev) => ({ ...prev, vehicles: true }));
      setError(null);
      try {
        const response = await axios.get("https://yepyou.treetronix.com/api/devices", {
          headers: { Authorization: "Basic " + btoa("admin:admin") },
        });
        setVehicles(response.data);
        const offlineVehicles = response.data.filter(v => v.status !== "online");
        setOfflineCount(offlineVehicles.length);

        // Ajoute une classe pulse temporairement pour attirer l'attention
        if (offlineVehicles.length > 0) {
          const badge = document.querySelector('.notification-badge');
          if (badge) {
            badge.classList.add('pulse');
            setTimeout(() => badge.classList.remove('pulse'), 3000);
          }
        }
      } catch (error) {
        console.error("Error fetching vehicles:", error);
        setError("Erreur lors de la récupération des véhicules.");
      } finally {
        setLoading((prev) => ({ ...prev, vehicles: false }));
      }
    };

    fetchVehiclesData();
    const interval = setInterval(fetchVehiclesData, 300000); // Actualisation toutes les 5 minutes
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="dashboard-admin">
      <SidebarSupAdmin />
      <div className="main-content">
        <NavbarSuperAdmin offlineCount={offlineCount} />
        <div className="dashboard">
          <div className="stats-cards">
            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon blue"><ShoppingBag size={24} /></div>
                <div className="stat-badge green">+{stats.chauffeurs * 2}%</div>
              </div>
              <div className="stat-content">
                <h2 className="stat-value">{stats.chauffeurs}</h2>
                <p className="stat-label">Chauffeurs</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon yellow"><BarChart2 size={24} /></div>
                <div className="stat-badge red">+{stats.vehicules * 3}%</div>
              </div>
              <div className="stat-content">
                <h2 className="stat-value">{stats.vehicules}</h2>
                <p className="stat-label">Véhicules</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon pink"><PieChart size={24} /></div>
                <div className="stat-badge yellow">+{stats.telephones}%</div>
              </div>
              <div className="stat-content">
                <h2 className="stat-value">{stats.telephones}</h2>
                <p className="stat-label">Téléphones</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon green"><TrendingUp size={24} /></div>
                <div className="stat-badge blue">+{stats.positions / 3}%</div>
              </div>
              <div className="stat-content">
                <h2 className="stat-value">{stats.positions}</h2>
                <p className="stat-label">Positions</p>
              </div>
            </div>
          </div>

          <div className="charts-container">
            <div className="chart-card">
              <div className="chart-header"><Menu className="chart-menu" size={20} /></div>
              <canvas ref={chartRef} className="line-chart"></canvas>
              <div className="chart-legend">
                <div className="legend-item"><div className="legend-color team-a"></div><span>TEAM A</span></div>
                <div className="legend-item"><div className="legend-color team-b"></div><span>TEAM B</span></div>
              </div>
            </div>

            <div className="chart-card donut-container">
              <canvas ref={donutRef} className="donut-chart"></canvas>
              <div className="donut-center">
                <div className="donut-label">Total</div>
                <div className="donut-value">{stats.chauffeurs + stats.vehicules + stats.telephones + stats.positions}</div>
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
                      
                    </tr>
                  </thead>
                  <tbody>
                    {currentVehicles.map(vehicle =><tr key={vehicle.id}>
                        <td>{vehicle.name}</td>
                        <td>{vehicle.id}</td>
                        <td>{vehicle.groupId || "-"}</td>
                        <td>
                          <span className={`status-badge ${vehicle.status === 'online' ? 'online-oval' : 'offline-oval'}`}>
                            {vehicle.status || 'inconnu'}
                          </span>
                        </td>
                        
                      </tr>
                    )}
                  </tbody>
                </table>

                
                  <button onClick={() => navigate("/ToutesVoitures")} className="pagination-btn">Voir Plus</button>
                  
              </>
            )
          )}
        </div>

      </div>
    </div>
  );
};

export default DashSuperAdmin;