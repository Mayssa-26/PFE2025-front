import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaMapMarked, FaHandSpock, FaSignOutAlt, FaCog } from "react-icons/fa";
import { MdDriveEta } from "react-icons/md";
import { FaBars } from "react-icons/fa";
import { useAuth } from "../Authentification/AuthContext";
import "./SideBar.css";


const Sidebar = () => {
  const { userName, logout } = useAuth();
  const navigate = useNavigate();
  
  // Debugging: Check userName value
  console.log("Sidebar - userName:", userName);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showVoitureSubMenu, setShowVoitureSubMenu] = useState(false);
  const [showSettingsSubMenu, setShowSettingsSubMenu] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const openLogoutModal = () => {
    setIsLogoutModalOpen(true);
  };

  const closeLogoutModal = () => {
    setIsLogoutModalOpen(false);
  };

  const toggleVoitureSubMenu = () => setShowVoitureSubMenu(!showVoitureSubMenu);
  const toggleSettingsSubMenu = () => setShowSettingsSubMenu(!showSettingsSubMenu);
  
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className={`dashboard-admin`}>
      <button className="toggle-btn" onClick={toggleSidebar}>
        <FaBars />
      </button>
      
      <div className={`sidebar ${isSidebarOpen ? "show" : "hide"}`}>
        <div className="sidebar-header">
          <h3 className="sidebar-title">{userName ? `${userName}` : "Vue de l'utilisateur"} <span>View</span></h3>
        </div>

        <div className="sidebar-content">
          <nav className="sidebar-nav">
            <div className="nav-item">
              <FaHandSpock className="nav-icon" />
              <Link to="/drivers" className="color">----Chauffeurs</Link>
            </div>

            <div className="nav-item" onClick={toggleVoitureSubMenu}>
              <MdDriveEta className="nav-icon" />
              ----Véhicules
              <ul className={`sub-menu ${showVoitureSubMenu ? "open" : ""}`}>
                <li><Link to="/VehiculesAvecCapteur">Véhicules avec capteur</Link></li>
                <li><Link to="/VehiculesSansCapteur">Véhicules sans capteur</Link></li>
              </ul>
            </div>

            <div className="nav-item">
              <Link to="/map" className="color">
                <FaMapMarked className="nav-icon" /> ----Carte
              </Link>
            </div>

            <div className="nav-item" onClick={toggleSettingsSubMenu}>
              <FaCog className="nav-icon" />
              ----Paramètres
              <ul className={`sub-menu ${showSettingsSubMenu ? "open" : ""}`}>
                <li><Link to="/profil">Profil administrateur</Link></li>
                <li>
                  Sécurité
                  <ul>
                    <li><Link to="/modifierPassword">Modifier mot de passe</Link></li>
                  </ul>
                </li>
              </ul>
            </div>
          </nav>
        </div>

        <button className="logout-button" onClick={openLogoutModal}>
          <FaSignOutAlt className="logout-icon" /> Se déconnecter
        </button>
      </div>

      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div className="logout-modal-overlay">
          <div className="logout-modal-container">
            <h2 className="logout-modal-title">Confirmation de déconnexion</h2>
            <p className="logout-modal-message">Êtes-vous sûr de vouloir vous déconnecter ?</p>
            <div className="logout-modal-actions">
              <button 
                onClick={closeLogoutModal} 
                className="logout-modal-cancel"
              >
                Annuler
              </button>
              <button 
                onClick={handleLogout} 
                className="logout-modal-confirm"
              >
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      )}

      {isSidebarOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={toggleSidebar}
        />
      )}
    </div>
  );
};

export default Sidebar;