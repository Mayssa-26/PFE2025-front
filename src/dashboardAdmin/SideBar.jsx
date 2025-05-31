import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaMapMarked, FaHandSpock, FaSignOutAlt, FaCog } from "react-icons/fa";
import { MdDriveEta } from "react-icons/md";
import { FaBars } from "react-icons/fa";
import { useAuth } from "../Authentification/AuthContext";

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
    <>
      <style>{`
        
        /* Container principal */
        .dashboard-admin {
          position: relative;
          height: 100vh;
         font-family: 'Roboto', sans-serif;
        }

        /* Bouton toggle */
        .toggle-btn {
          position: fixed;
          top: 15px;
          left: 15px;
          z-index: 999;
          background-color: #1e1d54;
          color: white;
          border: none;
          font-size: 22px;
          padding: 8px 10px;
          border-radius: 5px;
          cursor: pointer;
          display: none; /* caché par défaut sur desktop */
          font-family: 'Roboto', sans-serif;
        }

        /* Sidebar principale */
        .sidebar {
          width: 250px;
          height: 100%;
          background-color: #1e1d54;
          padding-top: 20px;
          position: fixed;
          top: 0;
          left: 0;
          transition: all 0.3s ease;
        }

        .sidebar.show {
          left: 0;
        }

        .sidebar.hide {
          left: -100%;
        }

        /* Header de la sidebar */
        .sidebar-header {
          background: linear-gradient(135deg, #1b23444f, #426e912e);
          padding: 5px 15px;
          border-radius: 12px 12px 0 0;
          text-align: center;
          box-shadow: 0 8px 15px rgba(0, 0, 0, 0.15);
        }

        .sidebar-title {
          color: rgb(195, 187, 217);
          font-size: 24px;
          font-weight: bold;
          text-align: center;
          margin: 0;
          font-family: 'Roboto', sans-serif;
        }

        .sidebar-title span {
          color: #fcfbff;
        }

        /* Contenu de la sidebar */
        .sidebar-content {
          padding: 10px;
        }

        /* Navigation */
        .sidebar-nav {
          margin-top: 20px;
          list-style: none;
          padding: 0;
          margin: 0;
        }

        /* Items de navigation */
        .nav-item {
          display: block;
          padding: 12px 20px;
          border-radius: 10px;
          color: #f1f1f1;
          font-size: 16px;
          transition: background-color 0.3s ease, transform 0.3s ease;
          cursor: pointer;
          text-decoration: none;
          margin-bottom: 5px;
          font-family: 'Roboto', sans-serif;
        }

        .nav-item:hover {
          background-color: #ecebec6b;
          color: rgb(240, 239, 244);
          transform: translateX(5px);
        }

        .nav-item.active {
          background-color: #f3f4f6;
          color: rgb(166, 160, 187);
          font-weight: bold;
          font-family: 'Roboto', sans-serif;
        }

        .nav-item > a,
        .nav-item > div {
          display: flex;
          align-items: center;
          color: #f1f1f1;
          text-decoration: none;
          transition: color 0.3s ease;
        }

        .nav-item:hover > a,
        .nav-item:hover > div {
          color: rgb(240, 239, 244);
        }

        /* Icônes de navigation */
        .nav-icon {
          margin-right: 10px;
          font-size: 18px;
          color: #f1f1f1;
          font-family: 'Roboto', sans-serif;
        }

        /* Couleur spéciale pour les liens */
        .color {
          color: #f1f1f1;
        }

        /* Sous-menus */
        .sub-menu {
          display: none;
          padding-left: 20px;
          list-style-type: none;
          margin-top: 5px;
          padding: 0;
        }

        .sub-menu.open {
          display: block;
        }

        .sub-menu li {
          padding: 8px 0;
          margin: 2px 0;
        }

        .sub-menu li a {
          color: rgb(190, 178, 224);
          text-decoration: none;
          transition: color 0.3s ease;
          display: block;
          padding: 5px 10px;
          border-radius: 5px;
        }

        .sub-menu li a:hover {
          color: rgb(30, 19, 61);
          background-color: rgba(255, 255, 255, 0.1);
        }

        /* Sous-sous-menus (Sécurité) */
        .sub-menu ul {
          margin: 4px 0 0 0;
          padding: 0;
          list-style: none;
          padding-left: 20px;
        }

        .sub-menu ul li {
          padding: 5px 0;
        }

        .sub-menu ul li a {
          color: rgb(190, 178, 224);
          font-size: 14px;
          font-family: 'Roboto', sans-serif;
        }

        /* Bouton de déconnexion */
        .logout-button {
          width: 100%;
          padding: 10px;
          background-color: #19123e;
          color: rgb(245, 236, 236);
          border: none;
          border-radius: 5px;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          margin-top: 250px;
          transition: all 0.3s ease;
          font-family: 'Roboto', sans-serif;
        }

        .logout-button:hover {
          background-color: #cfc7df;
          color: #19123e;
        }

        .logout-icon {
          margin-right: 8px;
        }

        /* Modal de confirmation de déconnexion */
        .logout-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .logout-modal-container {
          background-color: #ffffff;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          padding: 24px;
          width: 90%;
          max-width: 400px;
          text-align: center;
          transition: all 0.3s ease;
          animation: fadeIn 0.3s ease-out;
        }

        .logout-modal-title {
          font-size: 1.25rem;
          font-weight: bold;
          color: #333;
          margin: 0 0 16px 0;
          font-family: 'Roboto', sans-serif;
        }

        .logout-modal-message {
          color: #666;
          margin: 0 0 24px 0;
          line-height: 1.5;
        }

        .logout-modal-actions {
          display: flex;
          justify-content: center;
          gap: 16px;
        }

        .logout-modal-cancel {
          background-color: #f3f4f6;
          color: #4b5563;
          border: 1px solid #e5e7eb;
          padding: 10px 20px;
          border-radius: 8px;
          transition: background-color 0.2s ease;
          cursor: pointer;
        }

        .logout-modal-cancel:hover {
          background-color: #e5e7eb;
        }

        .logout-modal-confirm {
          background-color: #ef4444;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          transition: background-color 0.2s ease;
          cursor: pointer;
        }

        .logout-modal-confirm:hover {
          background-color: #dc2626;
        }

        /* Overlay pour fermer la sidebar sur mobile */
        .sidebar-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0,0,0,0.5);
          z-index: 999;
          display: none;
        }

        /* Animation pour modal */
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .toggle-btn {
            display: block;
          }

          .sidebar {
            position: fixed;
            top: 0;
            left: -100%;
            height: 100vh;
            width: 250px;
            transition: left 0.3s ease;
            z-index: 998;
          }

          .sidebar.show {
            left: 0;
          }

          .sidebar.hide {
            left: -100%;
          }

          .logout-button {
            margin-top: 150px;
            background-color: #2f2f5e;
            padding: 10px;
          }
        }

        @media (max-width: 992px) {
          .dashboard-admin {
            padding-left: 0;
          }
          
          .sidebar {
            transform: translateX(-100%);
            transition: transform 0.3s ease;
            z-index: 1000;
          }
          
          .sidebar.show {
            transform: translateX(0);
          }
          
          .toggle-btn {
            display: block;
          }
          
          .sidebar.show + .sidebar-overlay {
            display: block;
          }
        }

        /* Mode sombre */
        .dark-mode {
          background-color: #1e1e1e;
          color: white;
        }

        .dark-mode a {
          color: #b3b3b3;
        }

        .dark-mode .nav-item {
          border-color: #333;
        }
      `}</style>

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
                <Link to="/drivers" className="color">
                  <FaHandSpock className="nav-icon" />
                  ----Chauffeurs
                </Link>
              </div>

              <div className="nav-item" onClick={toggleVoitureSubMenu}>
                <div>
                  <MdDriveEta className="nav-icon" />
                  ----Véhicules
                </div>
                <ul className={`sub-menu ${showVoitureSubMenu ? "open" : ""}`}>
                  <li><Link to="/VehiculesAvecCapteur">Véhicules avec capteur</Link></li>
                  <li><Link to="/VehiculesSansCapteur">Véhicules sans capteur</Link></li>
                </ul>
              </div>

              <div className="nav-item">
                <Link to="/map" className="color">
                  <FaMapMarked className="nav-icon" />
                  ----Carte
                </Link>
              </div>

              <div className="nav-item" onClick={toggleSettingsSubMenu}>
                <div>
                  <FaCog className="nav-icon" />
                  ----Paramètres
                </div>
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
    </>
  );
};

export default Sidebar;