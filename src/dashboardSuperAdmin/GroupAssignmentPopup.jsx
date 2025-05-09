/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import { IoClose, IoSearch } from "react-icons/io5";
import "./GroupAssignmentPopup.css";

const GroupAssignmentPopup = ({ isOpen, onClose, adminId, adminName }) => {
  const [groups, setGroups] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchGroupsWithoutAdmin();
    }
  }, [isOpen]);

  useEffect(() => {
    // Filter groups based on search term
    if (searchTerm.trim() === "") {
      setFilteredGroups(groups);
    } else {
      const filtered = groups.filter(group => 
        group.nom.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredGroups(filtered);
    }
  }, [searchTerm, groups]);

  const fetchGroupsWithoutAdmin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("http://localhost:8000/api/groupes/getGroupsWithoutAdmin");
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur lors de la récupération des groupes");
      }
      const data = await response.json();
      setGroups(data);
      setFilteredGroups(data);
    } catch (error) {
      console.error("Erreur:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignGroup = async () => {
    if (!selectedGroup) {
      alert("Veuillez sélectionner un groupe");
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/api/affecter-groupe", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: adminId,
          groupeId: selectedGroup._id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur lors de l'affectation du groupe");
      }

      const result = await response.json();
      alert(result.message);
      onClose();
    } catch (error) {
      console.error("Erreur:", error);
      alert("Une erreur s'est produite : " + error.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="popup-overlay">
      <div className="popup-container">
        <div className="popup-header">
          <h2>Affecter Admin à un Groupe</h2>
          <button className="close-button" onClick={onClose}>
            <IoClose size={24} />
          </button>
        </div>
        
        <div className="popup-content">
          <div className="admin-info">
            <p><strong>Admin:</strong> {adminName}</p>
          </div>

          <div className="search-container">
            <IoSearch className="search-icon" />
            <input
              type="text"
              placeholder="Rechercher un groupe..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          {isLoading && <p className="loading-text">Chargement des groupes...</p>}
          
          {error && <p className="error-message">Erreur: {error}</p>}
          
          {!isLoading && !error && filteredGroups.length === 0 && (
            <p className="no-groups-message">Aucun groupe sans admin trouvé</p>
          )}

          <div className="groups-list">
            {filteredGroups.map((group) => (
              <div 
                key={group._id}
                className={`group-item ${selectedGroup && selectedGroup._id === group._id ? 'selected' : ''}`}
                onClick={() => setSelectedGroup(group)}
              >
                <div className="group-details">
                  <h3>{group.nom}</h3>
                  <p>{group.description || "Aucune description"}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="popup-footer">
          <button className="cancel-button" onClick={onClose}>
            Annuler
          </button>
          <button 
            className="assign-button"
            onClick={handleAssignGroup}
            disabled={!selectedGroup}
          >
            Affecter
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupAssignmentPopup;