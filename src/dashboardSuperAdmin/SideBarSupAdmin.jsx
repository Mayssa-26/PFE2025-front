import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaMapMarked, FaHandSpock, FaSignOutAlt,FaCog } from 'react-icons/fa';
import {FaPeopleGroup} from 'react-icons/fa6';
import { MdDriveEta } from 'react-icons/md';
import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { useAuth } from '../Authentification/AuthContext';
import '../dashboardAdmin/SideBar.css';
import PropTypes from 'prop-types';

const SidebarSupAdmin = ({ isSidebarOpen, toggleSidebar }) => {
  const { userName, logout } = useAuth();
  const navigate = useNavigate();
  const [showVoitureSubMenu, setShowVoitureSubMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleVoitureSubMenu = () => setShowVoitureSubMenu(!showVoitureSubMenu);
  const [showSettingsSubMenu, setShowSettingsSubMenu] = useState(false);
  const toggleSettingsSubMenu = () => setShowSettingsSubMenu(!showSettingsSubMenu);
  
  return (
    <div className={`dashboard-admin`}>
      <div className={`sidebar ${isSidebarOpen ? 'show' : ''}`}>
        <div className="sidebar-header">
          <h3 className="sidebar-title">
            {userName ? `${userName}` : 'Vue de l’utilisateur'} <span>View</span>
          </h3>
        </div>

        <div className="sidebar-content">
          <nav className="sidebar-nav">
            <div className="nav-item">
              <Link to="/Admins" className="color">
                <FaHandSpock className="nav-icon" /> ----Admins
              </Link>
            </div>

            <div className="nav-item" onClick={toggleVoitureSubMenu}>
              <MdDriveEta className="nav-icon" /> ----Véhicules
              <ul className={`sub-menu ${showVoitureSubMenu ? 'open' : ''}`}>
                
                <li>
                  <Link to="/VehiculesAvecCapteurSA">Véhicules avec capteur</Link>
                </li>
                <li>
                  <Link to="/VehiculesSansCapteurSA">Véhicules sans capteur</Link>
                </li>
              </ul>
            </div>

            <div className="nav-item">
              <Link to="/mapSA" className="color">
                <FaMapMarked className="nav-icon" /> ----Carte
              </Link>
            </div>

            <div className="nav-item">
              <Link to="/TableGroups" className="color">
                <FaPeopleGroup className="nav-icon" /> ----Groupes
              </Link>
            </div>

            <div className="nav-item">
              <Link to="/demandes" className="color">
                <FileText size={18} className="nav-icon" /> ----Demandes
              </Link>
            </div>
          </nav>
        </div>
        <div className="nav-item" onClick={toggleSettingsSubMenu}>
              <FaCog className="nav-icon" />
              ----Paramètres
              <ul className={`sub-menu ${showSettingsSubMenu ? "open" : ""}`}>
                <li><Link to="/profilSA">Profil Super Administrateur</Link></li>
                
      
                <li>
                  Sécurité
                  <ul>
                    <li><Link to="/modifierPassword">Modifier mot de passe</Link></li>
                    </ul>
                </li>
                
              </ul>
            </div>

        <button className="logout-button" onClick={handleLogout}>
          <FaSignOutAlt className="logout-icon" /> Se déconnecter
        </button>
      </div>
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={toggleSidebar} />
      )}
    </div>
  );
};
SidebarSupAdmin.propTypes = {
  isSidebarOpen: PropTypes.bool.isRequired,
  toggleSidebar: PropTypes.func.isRequired,
  userName: PropTypes.string,
  logout: PropTypes.func.isRequired
};
export default SidebarSupAdmin;