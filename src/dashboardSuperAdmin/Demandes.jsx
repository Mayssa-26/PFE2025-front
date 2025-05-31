import { useEffect, useState, useContext } from "react";
import "./DemandesTable.css";
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

      const result = await response.json();
      toast.success(`Demande ${status.toLowerCase()} avec succès !`);
      fetchDemandes();
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(`Erreur : ${error.message}`);
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
      <button className="toggle-btn" onClick={toggleSidebar}>
        {isSidebarOpen ? "✕" : "☰"}
      </button>
      <SidebarSupAdmin isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="main-content">
        <NavbarSuperAdmin />
        <div className="container2">
          <div className="header">
            <div>
              <h2>Demandes des Admins</h2>
              <p>La liste des demandes des Admins en attente</p>
            </div>
          </div>

          <div className="status-select">
            <label htmlFor="statusFilter">Filtrer par statut: </label>
            <select
              className="status-select"
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
                <th>Nom</th>
                <th>Prénom</th>
                <th>Email</th>
                <th>Statut</th>
                <th>Action</th>
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
                        {demande.status || "inconnu"}
                      </span>
                    </td>
                    <td>
                      {demande.status === "enAttente" && (
                        <div className="action-icons">
                          <HiOutlineCheckCircle
                            className="icon approve-icon"
                            onClick={() => updateStatus(demande._id, "Approuvée")}
                            title="Approuver"
                          />
                          <HiOutlineXCircle
                            className="icon reject-icon"
                            onClick={() => updateStatus(demande._id, "Rejetée")}
                            title="Rejeter"
                          />
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center" }}>
                    Aucune demande trouvée
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {filteredDemandes.length > 0 && (
            <div className="pagination">
              <button onClick={goToPrevPage} disabled={currentPage === 1}>
                Précédent
              </button>
              <span>
                {currentPage} / {totalPages}
              </span>
              <button onClick={goToNextPage} disabled={currentPage === totalPages}>
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
      />
    </div>
  );
};

export default DemandesTable;