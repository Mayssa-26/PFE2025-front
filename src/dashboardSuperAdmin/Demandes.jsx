import { useEffect, useState } from "react";
import "./dashSuperAdmin.css";
import SidebarSupAdmin from "./SideBarSupAdmin";
import Navbar from "../dashboardAdmin/NavBar";
import "./DemandesTable.css";
import { HiOutlineCheckCircle, HiOutlineXCircle } from "react-icons/hi";

const DemandesTable = () => {
  const [demandes, setDemandes] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const demandesParPage = 3;

  const updateStatus = async (userId, status) => {
    try {
      const response = await fetch(`http://localhost:8000/updateStatus/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        console.error(`Erreur HTTP: ${response.status}`);
        throw new Error("Erreur lors de la mise à jour du statut");
      }

      fetchDemandes();
    } catch (error) {
      console.error("Erreur:", error);
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

  return (
    <div className="dashboard-admin">
      <SidebarSupAdmin />
      <div className="main-content">
        <Navbar className="navbar" />
        <div className="container2">
          <div className="header">
            <div>
              <h2>Demandes des Admins</h2>
              <p>La liste des demandes des Admins en attente</p>
            </div>
          </div>

          <div className="status-select">
            <label htmlFor="statusFilter">Filtrer par statut: </label>
            <select className="status-select"
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
                    <span className={`status-badge ${
                      demande.status === 'enAttente'
                        ? 'enAttente-oval'
                        : demande.status === 'Rejetée'
                        ? 'Rejetée-oval'
                        : 'Approuvée-oval'
                    }`}>
                      {demande.status || 'inconnu'}
                    </span>
                  </td>
                  <td>
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination controls */}
          <div className="pagination">
            <button onClick={goToPrevPage} disabled={currentPage === 1}>
              Précédent
            </button>
            <span>{currentPage} / {totalPages}</span>
            <button onClick={goToNextPage} disabled={currentPage === totalPages}>
              Suivant
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemandesTable;
