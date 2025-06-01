import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, BarChart2, PieChart, TrendingUp } from "lucide-react";
import { FaSearch, FaArrowRight } from "react-icons/fa";
import axios from "axios";
import jwt_decode from "jwt-decode";
import Navbar from "./NavBar";
import Sidebar from "./SideBar";


const DashAdmin = () => {
  const navigate = useNavigate();
  const donutRef = useRef(null);
  
  // State management
  const [stats, setStats] = useState({
    vehiculesAvecCapteur: 0,
    vehiculesSansCapteur: 0,
    chauffeurs: 0,
    positions: 0,
  });
  const [adminStats, setAdminStats] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [vehiclesWithSensors, setVehiclesWithSensors] = useState([]);
  const [loading, setLoading] = useState({ vehicles: false, adminStats: false });
  const [error, setError] = useState(null);
  const [currentPage] = useState(1);
  const [offlineCount, setOfflineCount] = useState(0);
  const [adminGroupName, setAdminGroupName] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const vehiclesPerPage = 5;
  const currentVehicles = vehiclesWithSensors.slice(
    (currentPage - 1) * vehiclesPerPage,
    currentPage * vehiclesPerPage
  );

  const filteredVehicles = vehiclesWithSensors.filter(
    (vehicle) =>
      vehicle.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.id?.toString().includes(searchTerm) ||
      (vehicle.groupName &&
        vehicle.groupName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Donut chart drawing
  useEffect(() => {
    if (donutRef.current) {
      const ctx = donutRef.current.getContext("2d");
      drawDonutChart(ctx, stats);
    }
  }, [stats]);

  const drawDonutChart = (ctx, stats) => {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 20;
    
    ctx.clearRect(0, 0, width, height);
    const total = Object.values(stats).reduce((sum, val) => sum + val, 0);
    
    const data = [
      { color: "#22c55e", value: stats.vehiculesAvecCapteur / total },
      { color: "#ef4444", value: stats.vehiculesSansCapteur / total },
      { color: "#f59e0b", value: stats.chauffeurs / total },
      { color: "#3b82f6", value: stats.positions / total },
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
  };

  // Data fetching
  useEffect(() => {
    const fetchData = async () => {
      setLoading((prev) => ({ ...prev, vehicles: true, adminStats: true }));
      setError(null);

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        const decoded = jwt_decode(token);
        const currentAdminId = decoded.id;
        setIsAuthenticated(true);

        // Fetch admin group
        const adminResponse = await axios.get(
          `/api/vehicules/admin/${currentAdminId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const groupData = adminResponse.data?.success 
          ? (adminResponse.data.data[0] || adminResponse.data.data)
          : null;
          
        const groupName = groupData?.nom || groupData?.name || groupData?.groupName;
        if (!groupName) {
          throw new Error(`No group name found for admin ${currentAdminId}`);
        }
        setAdminGroupName(groupName);

        // Fetch vehicles without sensors
        const vehiclesWithoutSensors = groupData?.vehicules || [];
        const vehiculesSansCapteur = vehiclesWithoutSensors.length;

        // Fetch groups from Traccar
        const groupsResponse = await axios.get(
          "https://yepyou.treetronix.com/api/groups",
          {
            headers: {
              Authorization: "Basic " + btoa("admin:admin"),
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          }
        );

        const matchedGroup = groupsResponse.data.find(
          (group) => group.name.toLowerCase() === groupName.toLowerCase()
        );
        if (!matchedGroup) {
          throw new Error(`No group named "${groupName}" found in Traccar`);
        }

        // Fetch drivers
        const driversResponse = await axios.get(
          "https://yepyou.treetronix.com/api/drivers",
          {
            headers: {
              Authorization: "Basic " + btoa("admin:admin"),
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          }
        );

        const filteredDrivers = driversResponse.data.filter(
          (driver) => driver.attributes?.group === matchedGroup.name
        );
        const chauffeursCount = filteredDrivers.length;

        // Fetch devices
        const devicesResponse = await axios.get(
          "https://yepyou.treetronix.com/api/devices",
          {
            params: { groupId: matchedGroup.id },
            headers: {
              Authorization: "Basic " + btoa("admin:admin"),
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          }
        );

        const mappedVehicles = devicesResponse.data
          .filter((device) => device.groupId === matchedGroup.id)
          .map((device) => ({
            id: device.id,
            name: device.name,
            groupId: device.groupId,
            groupName,
            status: device.status === "online" ? "online" : "offline",
            lastUpdate: device.lastUpdate,
            isPhone: device.category === "phone",
            positions: device.positions || 0,
            originalData: device,
          }));

        setVehiclesWithSensors(mappedVehicles);
        const vehiculesAvecCapteur = mappedVehicles.length;
        const offlineVehicles = mappedVehicles.filter((v) => v.status !== "online");
        setOfflineCount(offlineVehicles.length);

        setStats({
          vehiculesAvecCapteur,
          vehiculesSansCapteur,
          chauffeurs: chauffeursCount,
          positions: mappedVehicles.reduce((acc, v) => acc + (v.positions || 0), 0),
        });

        setAdminStats([{
          adminId: currentAdminId,
          adminName: `Admin ${currentAdminId}`,
          vehiculesAvecCapteur,
          vehiculesSansCapteur,
          chauffeurs: chauffeursCount,
        }]);

        if (offlineVehicles.length > 0) {
          const badge = document.querySelector(".notification-badge");
          if (badge) {
            badge.classList.add("pulse");
            setTimeout(() => badge.classList.remove("pulse"), 3000);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(`Erreur lors de la récupération des données: ${error.message}`);
      } finally {
        setLoading((prev) => ({ ...prev, vehicles: false, adminStats: false }));
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 300000);
    return () => clearInterval(interval);
  }, [navigate]);

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
          font-size: 1.75rem;
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

        .charts-container {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
          margin-top: 2rem;
        }

        .chart-card {
          background: var(--card-background);
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .donut-container {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .donut-chart {
          width: 100%;
          max-width: 300px;
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
          font-family: 'Roboto', sans-serif;
        }

        .see-more-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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
        }
      `}</style>

      <div className="dashboard-admin">
        <Sidebar />
        <div className="main-content">
          <Navbar offlineCount={offlineCount} />
          <div className="dashboard">
            <div className="stats-cards">
              {[
                {
                  icon: ShoppingBag,
                  value: stats.vehiculesAvecCapteur,
                  label: "Véhicules avec capteur",
                  badge: `+${stats.vehiculesAvecCapteur * 2}%`,
                  color: "green",
                  badgeColor: "blue"
                },
                {
                  icon: BarChart2,
                  value: stats.vehiculesSansCapteur,
                  label: "Véhicules sans capteur",
                  badge: `+${stats.vehiculesSansCapteur * 3}%`,
                  color: "red",
                  badgeColor: "yellow"
                },
                {
                  icon: PieChart,
                  value: stats.chauffeurs,
                  label: "Chauffeurs",
                  badge: `+${stats.chauffeurs}%`,
                  color: "yellow",
                  badgeColor: "green"
                },
                {
                  icon: TrendingUp,
                  value: "+50",
                  label: "Positions",
                  badge: `+${Math.round(stats.positions / 3)}%`,
                  color: "blue",
                  badgeColor: "pink"
                }
              ].map((stat, index) => (
                <div className="stat-card" key={index}>
                  <div className="stat-header">
                    <div className={`stat-icon ${stat.color}`}>
                      <stat.icon size={24} />
                    </div>
                    <div className={`stat-badge ${stat.badgeColor}`}>
                      {stat.badge}
                    </div>
                  </div>
                  <div className="stat-content">
                    <h2 className="stat-value">{stat.value}</h2>
                    <p className="stat-label">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="charts-container">
              <div className="chart-card donut-container">
                <canvas ref={donutRef} className="donut-chart" />
                <div className="donut-center">
                  <div className="donut-label">Total</div>
                  <div className="donut-value">
                    {Object.values(stats).reduce((sum, val) => sum + val, 0)}
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
                Aucun véhicule avec capteur trouvé.{" "}
                {searchTerm && `Recherche: "${searchTerm}"`}
                {!searchTerm && vehiclesWithSensors.length === 0 && (
                  <span>
                    Vérifiez la connexion à l'API ou l'assignation des groupes.
                  </span>
                )}
                {!searchTerm &&
                  vehiclesWithSensors.length === 0 &&
                  stats.vehiculesAvecCapteur === 0 && (
                    <span>
                      Aucun véhicule dans le groupe {adminGroupName} assigné à l'admin.
                    </span>
                  )}
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
                        <td>{vehicle.groupName || "-"}</td>
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
    </>
  );
};

export default DashAdmin;