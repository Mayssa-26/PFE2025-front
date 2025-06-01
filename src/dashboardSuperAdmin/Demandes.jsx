import { useEffect, useState, useContext } from "react";
import SidebarSupAdmin from "./SideBarSupAdmin";
import NavbarSuperAdmin from "./NavBarSupAdmin";
import { HiOutlineCheckCircle, HiOutlineXCircle } from "react-icons/hi";
import { NotificationContext } from "./NotificationContext";
import { useLocation } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const DemandesTable = () => {
  const { demandes, fetchDemandes } = useContext(NotificationContext);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [highlightedDemande, setHighlightedDemande] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // Added for loading state
  const demandesParPage = 3;
  const location = useLocation();

  // Gérer la mise en surbrillance depuis la navigation
  useEffect(() => {
    if (location.state?.highlightedDemandeId) {
      const demandeIndex = demandes.findIndex(
        (demande) => demande._id === location.state.highlightedDemandeId
      );
      if (demandeIndex !== -1) {
        setStatusFilter("all");
        const page = Math.ceil((demandeIndex + 1) / demandesParPage);
        setCurrentPage(page);
        setHighlightedDemande(location.state.highlightedDemandeId);
        setTimeout(() => {
          setHighlightedDemande(null);
        }, 3000);
      }
    }
  }, [location.state, demandes]);

  const updateStatus = async (userId, status) => {
    setIsLoading(true);
    try {
      let response;
      if (status === "Approuvée") {
        response = await fetch(`http://localhost:8000/api/demandes/${userId}/accepter`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
        });
      } else if (status === "Rejetée") {
        const raison = window.prompt("Veuillez entrer la raison du refus :");
        if (!raison) {
          toast.error("Une raison est requise pour rejeter la demande.");
          setIsLoading(false);
          return;
        }

        response = await fetch(`http://localhost:8000/api/demandes/${userId}/refuser`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ raison }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur lors de la mise à jour du statut");
      }

      toast.success(`Demande ${status.toLowerCase()} avec succès !`);
      fetchDemandes();
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(`Erreur : ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const demandesadmins = demandes.filter((demande) => demande.role === "Admin");
  const filteredDemandes = demandesadmins.filter((demande) =>
    statusFilter === "all" ? true : demande.status === statusFilter
  );

  const totalPages = Math.ceil(filteredDemandes.length / demandesParPage);
  const indexOfLast = currentPage * demandesParPage;
  const indexOfFirst = indexOfLast - demandesParPage;
  const currentDemandes = filteredDemandes.slice(indexOfFirst, indexOfLast);

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const goToPrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="dashboard-admin">
      <style>
        {`
          /* CSS Variables alignées avec SAProfile.jsx et PasswordChangeSA.jsx */
          :root {
            --primary-gradient: linear-gradient(135deg, rgb(18, 28, 72) 0%, rgb(30, 13, 82) 100%);
            --success-gradient: linear-gradient(135deg,rgb(26, 118, 65),rgb(25, 101, 56));
            --danger-gradient: linear-gradient(135deg, #e74c3c, #c0392b);
            --warning-gradient: linear-gradient(135deg,rgb(155, 103, 20),rgb(151, 83, 24));
            --accent-color: #6366f1;
            --text-primary: #1f2937;
            --text-secondary: #6b7280;
            --text-muted: #9ca3af;
            --bg-primary: #f8fafc;
            --bg-secondary: #ffffff;
            --border-color: #e5e7eb;
            --border-radius: 12px;
            --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
            --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }

          /* Reset et styles de base */
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: var(--bg-primary);
            color: var(--text-primary);
            line-height: 1.6;
          }

          /* Layout principal */
          .dashboard-admin {
            display: flex;
            min-height: 100vh;
            background: var(--bg-primary);
          }

          .main-content {
            flex: 1;
            margin-left: 250px;
            padding: 2rem;
            transition: var(--transition);
            background: var(--bg-primary);
            overflow-y: auto;
          }

          .toggle-btn {
            display: none;
            position: fixed;
            top: 1rem;
            left: 1rem;
            z-index: 1000;
            background: var(--accent-color);
            color: white;
            border: none;
            border-radius: 8px;
            padding: 0.5rem 1rem;
            cursor: pointer;
            font-size: 1.5rem;
            transition: var(--transition);
          }

          .toggle-btn:hover {
            background: #4f46e5;
            transform: translateY(-2px);
          }

          /* Conteneur de la table */
          .container2 {
            width: 100%;
            max-width: 1200px;
            background: rgba(255, 255, 255, 0.95);
            border-radius: var(--border-radius);
            box-shadow: var(--shadow-lg);
            padding: 2rem;
            margin: 2rem auto;
            margin-top: 3rem;
            backdrop-filter: blur(10px);
            animation: fadeInUp 0.6s ease-out;
          }

          /* En-tête */
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
            border-bottom: 2px solid var(--border-color);
            padding-bottom: 1rem;
          }

          .header h2 {
            font-size: 1.75rem;
            font-weight: 700;
            background: var(--primary-gradient);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
          }

          .header p {
            font-size: 0.9rem;
            color: var(--text-muted);
            margin-top: 0.25rem;
          }

          /* Filtre de statut */
          .status-select {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin: 1.5rem 0;
          }

          .status-select label {
            font-size: 0.9rem;
            font-weight: 500;
            color: var(--accent-color);
            text-transform: uppercase;
          }

          .status-select select {
            padding: 0.5rem 1rem;
            border: 1px solid var(--border-color);
            border-radius: 8px;
            font-size: 0.9rem;
            background: rgba(255, 255, 255, 0.8);
            transition: var(--transition);
            cursor: pointer;
          }

          .status-select select:focus {
            border-color: var(--accent-color);
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
            outline: none;
          }

          /* Table */
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.9rem;
            margin-top: 1rem;
          }

          th, td {
            text-align: left;
            padding: 1rem;
            transition: var(--transition);
          }

          th {
            background: rgba(215, 215, 215, 0.8);
            color: black;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.85rem;
            border-bottom: 2px solid var(--border-color);
          }

          td {
            color: var(--text-primary);
            border-bottom: 1px solid var(--border-color);
          }

          tr:hover td {
            background: rgba(243, 244, 246, 0.5);
          }

          /* Badges de statut */
          .status-badge {
            display: inline-flex;
            justify-content: center;
            align-items: center;
            padding: 0.4rem 1rem;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 600;
            color: white;
            box-shadow: var(--shadow-sm);
            transition: var(--transition);
          }

          .status-badge.Approuvée-oval {
            background: var(--success-gradient);
          }

          .status-badge.Rejetée-oval {
            background: var(--danger-gradient);
          }

          .status-badge.enAttente-oval {
            background: var(--warning-gradient);
          }

          /* Icônes d'action */
          .action-icons {
            display: flex;
            gap: 0.5rem;
          }

          .icon {
            font-size: 1.5rem;
            cursor: pointer;
            transition: var(--transition);
          }

          .icon:hover {
            transform: scale(1.2);
          }

          .approve-icon {
            color: #27ae60;
          }

          .reject-icon {
            color: #e74c3c;
          }

          /* Pagination */
          .pagination {
            margin-top: 1.5rem;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 1rem;
          }

          .pagination button {
            padding: 0.5rem 1rem;
            border: none;
            background: var(--primary-gradient);
            color: white;
            border-radius: 8px;
            cursor: pointer;
            font-size: 0.9rem;
            transition: var(--transition);
            box-shadow: var(--shadow-sm);
          }

          .pagination button:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: var(--shadow-md);
          }

          .pagination button:disabled {
            background: var(--text-muted);
            cursor: not-allowed;
          }

          .pagination span {
            font-size: 0.9rem;
            color: var(--text-secondary);
          }

          /* Surlignage */
          .highlight-demand {
            background: linear-gradient(135deg, #fefcbf, #fef08a) !important;
            animation: pulse 2s infinite;
            transition: background 0.5s ease;
          }

          @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(254, 252, 191, 0.7); }
            70% { box-shadow: 0 0 0 10px rgba(254, 252, 191, 0); }
            100% { box-shadow: 0 0 0 0 rgba(254, 252, 191, 0); }
          }

          /* Loading state */
          .loading-overlay {
            position: relative;
            opacity: 0.6;
            pointer-events: none;
          }

          .loading-overlay::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 24px;
            height: 24px;
            border: 3px solid var(--accent-color);
            border-top: 3px solid transparent;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            transform: translate(-50%, -50%);
          }

          @keyframes spin {
            0% { transform: translate(-50%, -50%) rotate(0deg); }
            100% { transform: translate(-50%, -50%) rotate(360deg); }
          }

          /* Animations */
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }

          /* Responsive Design */
          @media (max-width: 1024px) {
            .main-content {
              margin-left: 0;
              padding: 1.5rem;
            }

            .toggle-btn {
              display: block;
            }

            .container2 {
              margin: 1.5rem auto;
              padding: 1.5rem;
            }
          }

          @media (max-width: 768px) {
            .header h2 {
              font-size: 1.5rem;
            }

            .header p {
              font-size: 0.85rem;
            }

            table {
              font-size: 0.85rem;
            }

            th, td {
              padding: 0.75rem;
            }

            .status-select select {
              font-size: 0.85rem;
              padding: 0.4rem 0.8rem;
            }

            .pagination button {
              padding: 0.4rem 0.8rem;
              font-size: 0.85rem;
            }
          }

          @media (max-width: 480px) {
            table {
              display: block;
              overflow-x: auto;
              white-space: nowrap;
            }

            .header {
              flex-direction: column;
              align-items: flex-start;
              gap: 0.5rem;
            }

            .status-select {
              flex-direction: column;
              align-items: flex-start;
            }

            .status-select select {
              width: 100%;
              margin-top: 0.5rem;
            }
          }

          /* Dark Mode */
          @media (prefers-color-scheme: dark) {
            :root {
              --text-primary: #f9fafb;
              --text-secondary: #d1d5db;
              --text-muted: #9ca3af;
              --bg-primary: #111827;
              --bg-secondary: #1f2937;
              --border-color: #374151;
            }

            .dashboard-admin {
              background: var(--bg-primary);
            }

            .main-content {
              background: var(--bg-primary);
            }

            .container2 {
              background: rgba(31, 41, 55, 0.95);
              box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
            }

            th {
              background: var(--bg-secondary);
              color: var(--text-primary);
            }

            td {
              color: var(--text-secondary);
              border-bottom: 1px solid var(--border-color);
            }

            tr:hover td {
              background: rgba(55, 65, 81, 0.5);
            }

            .status-select select {
              background: rgba(55, 65, 81, 0.8);
              color: var(--text-primary);
              border-color: var(--border-color);
            }

            .pagination button {
              background: var(--accent-color);
            }

            .pagination button:disabled {
              background: var(--text-muted);
            }
          }
        `}
      </style>
      <button className="toggle-btn" onClick={toggleSidebar}>
        {isSidebarOpen ? "✕" : "☰"}
      </button>
      <SidebarSupAdmin isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div className={`main-content ${isLoading ? "loading-overlay" : ""}`}>
        <NavbarSuperAdmin />
        <div className="container2">
          <div className="header">
            <div>
              <h2>Demandes des Admins</h2>
              <p>La liste des demandes des admins en attente</p>
            </div>
          </div>

          <div className="status-select">
            <label htmlFor="statusFilter">Filtrer par statut:</label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">Tous</option>
              <option value="enAttente">En attente</option>
              <option value="Approuvée">Approuvée</option>
              <option value="Rejetée">Rejetée</option>
            </select>
          </div>

          <table>
            <thead>
              <tr>
                <th scope="col">Nom</th>
                <th scope="col">Prénom</th>
                <th scope="col">Email</th>
                <th scope="col">Statut</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentDemandes.length > 0 ? (
                currentDemandes.map((demande) => (
                  <tr
                    key={demande._id}
                    id={`demande-${demande._id}`}
                    className={highlightedDemande === demande._id ? "highlight-demand" : ""}
                  >
                    <td>{demande.nom}</td>
                    <td>{demande.prenom}</td>
                    <td>{demande.email}</td>
                    <td>
                      <span
                        className={`status-badge ${
                          demande.status === "enAttente"
                            ? "enAttente-oval"
                            : demande.status === "Rejetée"
                            ? "Rejetée-oval"
                            : "Approuvée-oval"
                        }`}
                      >
                        {demande.status || "Inconnu"}
                      </span>
                    </td>
                    <td>
                      {demande.status === "enAttente" && (
                        <div className="action-items">
                          <HiOutlineCheckCircle
                            className="icon approve-icon"
                            onClick={() => updateStatus(demande._id, "Approuvée")}
                            title="Approuver"
                            aria-label="Approuver la demande"
                          />
                          <HiOutlineXCircle
                            className="icon reject-icon"
                            onClick={() => updateStatus(demande._id, "Rejetée")}
                            title="Rejeter"
                            aria-label="Rejeter la demande"
                          />
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center", padding: "2rem" }}>
                    Aucune demande trouvée
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {filteredDemandes.length > 0 && (
            <div className="pagination">
              <button
                type="button"
                onClick={goToPrevPage}
                disabled={currentPage === 1}
                aria-label="Page précédente"
              >
                Précédent
              </button>
              <span aria-label="Current page of total pages">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                aria-label="Page suivante"
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
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
};

export default DemandesTable;