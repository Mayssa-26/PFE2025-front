import { useState } from 'react'; 
import { useNavigate } from 'react-router-dom';
import { FaMapMarked, FaHandSpock, FaSignOutAlt, FaCog } from 'react-icons/fa';
import { MdDriveEta } from 'react-icons/md';
import { Link } from 'react-router-dom';
import { ThemeContext } from './ThemeContext';
import { useContext } from 'react';
import { useAuth } from '../Authentification/AuthContext';

import './SideBar.css';

const Sidebar = () => {
  
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  const {  logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  const [showChauffeurSubMenu, setShowChauffeurSubMenu] = useState(false);
  const toggleChauffeurSubMenu = () => setShowChauffeurSubMenu(!showChauffeurSubMenu);

  const [showVoitureSubMenu, setShowVoitureSubMenu] = useState(false);
  const toggleVoitureSubMenu = () => setShowVoitureSubMenu(!showVoitureSubMenu);

  const [showSettingsSubMenu, setShowSettingsSubMenu] = useState(false);
  const toggleSettingsSubMenu = () => setShowSettingsSubMenu(!showSettingsSubMenu);

  return (
    <div className={`dashboard-admin ${darkMode ? 'dark-mode' : ''}`}>
      <div className="sidebar">
        <div className="sidebar-header">
          <h2 className="sidebar-title">
            Manager <span>View</span>
          </h2>
        </div>

        <div className="sidebar-content">
          <nav className="sidebar-nav">

            <div className="nav-item" onClick={toggleChauffeurSubMenu}>
              <FaHandSpock className="nav-icon" />
              ----Chauffeurs
              <ul className={`sub-menu ${showChauffeurSubMenu ? 'open' : ''}`}>
                <li><Link to="/TousChauffeurs">Tous les Chauffeurs</Link></li>
                <li><Link to="/StatistiquesChauffeurs">Statistiques chauffeurs</Link></li>
              </ul>
            </div>

            <div className="nav-item" onClick={toggleVoitureSubMenu}>
              <MdDriveEta className="nav-icon" />
              ----Véhicules
              <ul className={`sub-menu ${showVoitureSubMenu ? 'open' : ''}`}>
                <li><Link to="/ToutesVoitures">Tous les véhicules</Link></li>
                <li><Link to="/VehiculesAvecCapteur">Véhicules avec capteur</Link>
                
                </li>
                <li><Link to="/VehiculesSansCapteur">Véhicules sans capteur</Link></li>
              </ul>
            </div>

            <div className="nav-item">
              <Link to="/map" className='color'>
                <FaMapMarked className="nav-icon" /> ----Carte
              </Link>
            </div>
            
            

            <div className="nav-item" onClick={toggleSettingsSubMenu}>
              <FaCog className="nav-icon" />
              ----Paramètres
              <ul className={`sub-menu ${showSettingsSubMenu ? 'open' : ''}`}>
                <li><Link to="/profil">Profil administrateur</Link></li>

                {/* Préférences système sous-menu */}
                <li>
                  Préférences système
                  <ul>
                    <li onClick={toggleDarkMode} style={{cursor: "pointer"}}>
                      Activer {darkMode ? 'Mode Clair' : 'Mode Sombre'}
                    </li>
                  </ul>
                </li>

                {/* Sécurité sous-menu */}
                <li>
                  Sécurité
                  <ul>
                    <li><Link to="/securite/modifier-mot-de-passe">Modifier mot de passe</Link></li>
                    <li><Link to="/securite/modifier-email">Modifier email</Link></li>
                  </ul>
                </li>

                <li><Link to="/notifications-settings">Notifications</Link></li>
              </ul>
            </div>

          </nav>
        </div>

        <button className="logout-button" onClick={handleLogout}>
          <FaSignOutAlt className="logout-icon" /> Se déconnecter
        </button>
      </div>
    </div>
  );
};

export default Sidebar;