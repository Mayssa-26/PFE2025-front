import { useState } from 'react'; 
import { useNavigate } from 'react-router-dom';
import { FaMapMarked, FaHandSpock, FaSignOutAlt } from 'react-icons/fa';
import { MdDriveEta } from 'react-icons/md';
import { Link } from 'react-router-dom';
//import { useEffect } from 'react';
import { FileText } from "lucide-react";
import { useAuth } from '../Authentification/AuthContext';
import '../dashboardAdmin/SideBar.css';

const SidebarSupAdmin = () => {
  
  const {  logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };
  

  const [showVoitureSubMenu, setShowVoitureSubMenu] = useState(false);
  const toggleVoitureSubMenu = () => setShowVoitureSubMenu(!showVoitureSubMenu);

  return (
    <div className={`dashboard-admin}`}>
      <div className="sidebar">
        <div className="sidebar-header">
          <h2 className="sidebar-title">
            Manager <span>View</span>
          </h2>
        </div>

        <div className="sidebar-content">
          <nav className="sidebar-nav">
          
          
            <div className="nav-item" >
            <Link to="/Admins" className='color'>
              <FaHandSpock className="nav-icon" />
              ----Admins
              </Link>
            </div>

            <div className="nav-item" onClick={toggleVoitureSubMenu}>
              <MdDriveEta className="nav-icon" />
              ----Véhicules
              <ul className={`sub-menu ${showVoitureSubMenu ? 'open' : ''}`}>
                <li><Link to="/ToutesVoituresSA">Tous les véhicules</Link></li>
                <li><Link to="/VehiculesAvecCapteurSA">Véhicules avec capteur</Link>
                
                </li>
                <li><Link to="/VehiculesSansCapteurSA">Véhicules sans capteur</Link></li>
              </ul>
            </div>

            <div className="nav-item">
              <Link to="/mapSA" className='color'>
                <FaMapMarked className="nav-icon" /> ----Carte
              </Link>
            </div>
            
            
              <div className="nav-item">
                <Link to="/demandes" className='color'>
                  <FileText size={18} className="nav-icon" /> ----Demandes
                </Link>
                
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

export default SidebarSupAdmin;