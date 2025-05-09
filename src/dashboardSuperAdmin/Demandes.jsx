import { useEffect, useState } from "react";
import "./dashSuperAdmin.css";
import SidebarSupAdmin from "./SideBarSupAdmin";
import NavbarSuperAdmin from "./NavBarSupAdmin";
import "./DemandesTable.css";
import { HiOutlineCheckCircle, HiOutlineXCircle } from "react-icons/hi";
import GroupAssignmentPopup from "./GroupAssignmentPopup";

const DemandesTable = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [demandes, setDemandes] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const demandesParPage = 3;
  
  // For the popup
  const [showPopup, setShowPopup] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);

  const updateStatus = async (userId, status, nomComplet) => {
    try {
      let response;
      if (status === "Approuvée") {
        response = await fetch(`http://localhost:8000/api/demandes/${userId}/accepter`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            // Add Authorization header if required, e.g., Bearer token
            // "Authorization": `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error(`Erreur HTTP: ${response.status}`, errorData);
          throw new Error(errorData.message || "Erreur lors de la mise à jour du statut");
        }

        const result = await response.json();
        console.log(result.message);
        
        // Show popup to assign group to the newly created admin
        if (result.idNewAdmin) {
          setSelectedAdmin({
            id: result.idNewAdmin._id,
            name: nomComplet
          });
          setShowPopup(true);
        }
        
      } else if (status === "Rejetée") {
        // Prompt for rejection reason
        const raison = window.prompt("Veuillez entrer la raison du refus :");
        if (!raison) {
          alert("Une raison est requise pour rejeter la demande.");
          return;
        }

        response = await fetch(`http://localhost:8000/api/demandes/${userId}/refuser`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            // Add Authorization header if required
            // "Authorization": `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ raison }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error(`Erreur HTTP: ${response.status}`, errorData);
          throw new Error(errorData.message || "Erreur lors de la mise à jour du statut");
        }

        const result = await response.json();
        console.log(result.message);
      }

      fetchDemandes(); // Refresh the demands list
    } catch (error) {
      console.error("Erreur:", error);
      alert("Une erreur s'est produite : " + error.message);
    }
  };

  const fetchDemandes = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/pending-registrations");
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des demandes");
      }
      const data = await response.json();
      setDemandes(data);
    } catch (error) {
      console.error("Erreur:", error);
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

  useEffect(() => {
    fetchDemandes();
  }, []);
  
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  const closePopup = () => {
    setShowPopup(false);
    setSelectedAdmin(null);
  };
  
  return (
    <div className="dashboard-admin">
      <button className="toggle-btn" onClick={toggleSidebar}>
        {isSidebarOpen ? "✕" : "☰"}
      </button>
      <SidebarSupAdmin isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
            
      <div className="main-content">
        <NavbarSuperAdmin className="navbar" />
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
                setCurrentPage(1); // Reset to first page on filter change
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
              {currentDemandes.map((demande, index) => (
                <tr key={index}>
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
                  {demande.status === "enAttente" && (
                  <td>
                    <HiOutlineCheckCircle
                      className="icon approve-icon"
                      onClick={() => updateStatus(
                        demande._id, 
                        "Approuvée", 
                        `${demande.prenom} ${demande.nom}`
                      )}
                      title="Approuver"
                    />
                    <HiOutlineXCircle
                      className="icon reject-icon"
                      onClick={() => updateStatus(demande._id, "Rejetée")}
                      title="Rejeter"
                    />
                  </td>)}
                </tr>
              ))}
            </tbody>
          </table>

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
        </div>
      </div>
      
      {/* Group Assignment Popup */}
      <GroupAssignmentPopup 
        isOpen={showPopup}
        onClose={closePopup}
        adminId={selectedAdmin?.id}
        adminName={selectedAdmin?.name}
      />
    </div>
  );
};

export default DemandesTable;