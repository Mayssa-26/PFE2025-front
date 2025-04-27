import { FaBell } from "react-icons/fa";
import PropTypes from 'prop-types';
import "../dashboardAdmin/NavBar.css";
import { Link } from "react-router-dom";
import { useState } from "react";

const NavbarSuperAdmin = ({ offlineCount }) => {
     const [showTooltip, setShowTooltip] = useState(false); // 👈 état pour afficher ou cacher le message
    
        const toggleTooltip = () => {
            setShowTooltip(prev => !prev); // 👈 clic = on inverse visible/caché
        };
    
    return (
        <div className="navbar">
            <Link to="/dashboardSuperAdmin" className="navbar-title">Home</Link>

            <div className="notification-area">
                
                <div className="notification-icon" onClick={toggleTooltip}>
                    <FaBell />
                    {offlineCount > 0 && (
                        <>
                            <span className="notification-badge">{offlineCount}</span>
                            {showTooltip && (
  <div className={`notification-tooltip ${showTooltip ? 'show' : ''}`}>
    {offlineCount} véhicule(s) hors ligne
  </div>
)}
                        </>
                    )}
                </div>
            </div>
            <button className="profile-button">Profile</button>
        </div>
    );
};

NavbarSuperAdmin.propTypes = {
    offlineCount: PropTypes.number.isRequired
};

export default NavbarSuperAdmin;