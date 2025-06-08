import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaMapMarked, FaHandSpock, FaSignOutAlt, FaCog } from "react-icons/fa";
import { MdDriveEta } from "react-icons/md";
import { FaBars } from "react-icons/fa";
import { useAuth } from "../Authentification/AuthContext";

const Sidebar = () => {
  const { userName, logout } = useAuth();
  const navigate = useNavigate();
  
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
          display: none;
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
          z-index: 998;
        }

        .sidebar.show {
          left: 0;
        }

        .sidebar.hide {
          left: -100%;
        }

        /* Header de la sidebar - Style identique au Super Admin */
        .sidebar-header {
          background: linear-gradient(135deg, #1b23444f, #426e912e);
          padding: 20px 15px;
          border-radius: 0 0 15px 15px;
          text-align: center;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
          margin-bottom: 20px;
          position: relative;
          overflow: hidden;
        }

        .sidebar-header::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }

        .sidebar-header:hover::before {
          opacity: 1;
        }

        /* Logo Styles - Identique au Super Admin */
        .logo-container {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 10px 0;
        }

        .sidebar-logo {
          width: 160px;
          height: auto;
          max-width: 100%;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          filter: drop-shadow(0 4px 12px rgba(0,0,0,0.3)) brightness(1.1);
          cursor: pointer;
          position: relative;
          z-index: 2;
        }

        .sidebar-logo:hover {
          transform: scale(1.08) rotate(2deg);
          filter: drop-shadow(0 8px 20px rgba(255,255,255,0.2)) 
                  drop-shadow(0 4px 12px rgba(0,0,0,0.4)) 
                  brightness(1.2) 
                  contrast(1.1);
        }

        /* Effet de brillance animé */
        .logo-shine {
          position: absolute;
          top: -100%;
          left: -100%;
          width: 300%;
          height: 300%;
          background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%);
          transform: rotate(45deg);
          transition: all 0.6s ease;
          pointer-events: none;
          opacity: 0;
        }

        .sidebar-logo:hover + .logo-shine {
          top: -150%;
          left: -150%;
          opacity: 1;
        }

        /* Particules flottantes autour du logo */
        .logo-particles {
          position: absolute;
          width: 100%;
          height: 100%;
          pointer-events: none;
          overflow: hidden;
        }

        .logo-particles::before,
        .logo-particles::after {
          content: '';
          position: absolute;
          width: 4px;
          height: 4px;
          background: rgba(255,255,255,0.6);
          border-radius: 50%;
          opacity: 0;
          transition: all 0.8s ease;
        }

        .logo-particles::before {
          top: 20%;
          left: 15%;
          animation: float1 3s ease-in-out infinite;
        }

        .logo-particles::after {
          top: 70%;
          right: 20%;
          animation: float2 3s ease-in-out infinite 1.5s;
        }

        .sidebar-header:hover .logo-particles::before,
        .sidebar-header:hover .logo-particles::after {
          opacity: 1;
        }

        @keyframes float1 {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.6; }
          50% { transform: translateY(-10px) translateX(5px); opacity: 1; }
        }

        @keyframes float2 {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.6; }
          50% { transform: translateY(-8px) translateX(-3px); opacity: 1; }
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
          margin-top: 150px;
          transition: all 0.3s ease;
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
            transform: translateX(-100%);
          }

          .sidebar.show {
            transform: translateX(0);
          }

          .sidebar.hide {
            transform: translateX(-100%);
          }

          .sidebar-logo {
            width: 120px;
          }

          .sidebar-header {
            padding: 15px 10px;
          }

          .logout-button {
            margin-top: 100px;
          }
        }

        @media (max-width: 480px) {
          .sidebar-logo {
            width: 100px;
          }
          
          .sidebar-header {
            padding: 12px 8px;
          }
        }
      `}</style>

      <div className={`dashboard-admin`}>
        <button className="toggle-btn" onClick={toggleSidebar}>
          <FaBars />
        </button>
        
        <div className={`sidebar ${isSidebarOpen ? "show" : "hide"}`}>
          <div className="sidebar-header">
            <div className="logo-container">
              <img 
                src="/logo3s.png" 
                alt="Logo 3S" 
                className="sidebar-logo" 
              />
              <div className="logo-shine"></div>
              <div className="logo-particles"></div>
            </div>
          </div>

          <div className="sidebar-content">
            <nav className="sidebar-nav">
              <div className="nav-item">
                <Link to="/drivers" className="color">
                  <FaHandSpock className="nav-icon" />
                  Chauffeurs
                </Link>
              </div>

              <div className="nav-item" onClick={toggleVoitureSubMenu}>
                <div>
                  <MdDriveEta className="nav-icon" />
                  Véhicules
                </div>
                <ul className={`sub-menu ${showVoitureSubMenu ? "open" : ""}`}>
                  <li><Link to="/VehiculesAvecCapteur">Véhicules avec capteur</Link></li>
                  <li><Link to="/VehiculesSansCapteur">Véhicules sans capteur</Link></li>
                </ul>
              </div>

              <div className="nav-item">
                <Link to="/map" className="color">
                  <FaMapMarked className="nav-icon" />
                  Carte
                </Link>
              </div>

              <div className="nav-item" onClick={toggleSettingsSubMenu}>
                <div>
                  <FaCog className="nav-icon" />
                  Paramètres
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