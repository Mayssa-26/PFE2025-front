import { useEffect, useState } from 'react';
import axios from 'axios';
import jwt_decode from 'jwt-decode';
import Navbar from './NavBar';
import Sidebar from './SideBar';

const VehiculesSansCapteur = () => {
  const [vehicules, setVehicules] = useState([]);
  const [filteredMarque, setFilteredMarque] = useState('');
  const [filteredGroupe] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [marques, setMarques] = useState([]);
  const [setGroupes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [adminId, setAdminId] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const vehiculesPerPage = 5;

  // Decode token to retrieve admin ID
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = jwt_decode(token);
      setAdminId(decoded.id);
      setIsAuthenticated(true);
    }
  }, []);

  // Fetch vehicles and filter those without sensors
  useEffect(() => {
    if (!adminId || !isAuthenticated) return;

    const fetchData = async () => {
      try {
        const [vehiculesResponse, sensorsResponse] = await Promise.all([
          axios.get(`/api/vehicules/admin/${adminId}`),
          axios.get("https://yepyou.treetronix.com/api/devices", {
            headers: {
              Authorization: "Basic " + btoa("admin:admin"),
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          })
        ]);

        if (vehiculesResponse.data.success) {
          const filtered = filterVehiclesWithoutSensors(
            vehiculesResponse.data.data[0]?.vehicules || [],
            sensorsResponse.data
          );

          setVehicules(filtered);
          setMarques([...new Set(filtered.map(v => v.marque))]);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
      }
    };

    fetchData();
  }, [adminId, isAuthenticated]);

  // Filter vehicles without sensors
  const filterVehiclesWithoutSensors = (vehicules, vehiclesWithSensors) => {
    if (!vehiclesWithSensors || vehiclesWithSensors.length === 0) return vehicules;

    const sensorVehicleNames = vehiclesWithSensors.map(v => v.name?.toLowerCase().trim());

    return vehicules.filter(v => {
      const immatriculation = v.immatriculation?.toLowerCase().trim();
      return !sensorVehicleNames.includes(immatriculation);
    });
  };

  // Filter vehicles based on search and marque
  const filteredVehicules = vehicules.filter(v => {
    const matchesMarque = !filteredMarque || v.marque === filteredMarque;
    const matchesGroupe = !filteredGroupe || v.groupeId === filteredGroupe;
    const matchesSearch =
      searchTerm === '' ||
      (v.modele?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       v.immatriculation?.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesMarque && matchesGroupe && matchesSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredVehicules.length / vehiculesPerPage);
  const currentVehicules = filteredVehicules.slice(
    (currentPage - 1) * vehiculesPerPage,
    currentPage * vehiculesPerPage
  );

  return (
    <div className="dashboard-admin">
      <style>
        {`
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
            --shadow-md: 0 2px 5px rgba(0, 0, 0, 0.08);
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
            margin-left: 250px; /* Adjust based on Sidebar width */
            transition: var(--transition);
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
            border: 1px solid #ccc;
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

          /* Status Badge */
          .status-badge {
            display: inline-flex;
            justify-content: center;
            align-items: center;
            padding: 4px 10px;
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

         

          /* Responsive Design */
          @media (max-width: 768px) {
            .main-content {
              margin-left: 0;
              padding: 0.5rem;
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

            .vehicles-table {
              display: block;
              overflow-x: auto;
              white-space: nowrap;
            }

            .pagination {
              gap: 10px;
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

            .vehicles-table tr:hover td {
              background-color: var(--bg-light);
            }

            .filter-bar input,
            .filter-bar select {
              background-color: var(--bg-light);
              color: var(--text-color);
              border-color: var(--border-color);
            }
          }
        `}
      </style>

      <Sidebar />
      <div className="main-content">
        <Navbar />
        <div className="container2">
          <div className="header">
            <h2>Véhicules Sans Capteur</h2>
            <p>Liste des véhicules enregistrés ne disposant pas de capteurs actifs.</p>
          </div>

          <div className="filter-bar">
            <input
              type="text"
              placeholder="Recherche par modèle ou immatriculation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              value={filteredMarque}
              onChange={(e) => setFilteredMarque(e.target.value)}
            >
              <option value="">Toutes les marques</option>
              {marques.map((marque) => (
                <option key={marque} value={marque}>{marque}</option>
              ))}
            </select>
          </div>

          <table className="vehicles-table">
            <thead>
              <tr>
                <th>Marque</th>
                <th>Modèle</th>
                <th>Immatriculation</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {currentVehicules.length > 0 ? (
                currentVehicules.map((v) => (
                  <tr key={`${v.groupeId}-${v.immatriculation}`}>
                    <td>{v.marque}</td>
                    <td>{v.modele}</td>
                    <td>{v.immatriculation}</td>
                    <td>
                      <span className={`status-badge ${v.etat === 'Fonctionnel' ? 'online' : 'offline'}`}>
                        {v.etat || 'offline'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="no-vehicles">
                    {vehicules.length === 0 ? 'Chargement...' : 'Aucun véhicule trouvé'}
                  </td>
                </tr>
              )}
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
        </div>
      </div>
    </div>
  );
};

export default VehiculesSansCapteur;