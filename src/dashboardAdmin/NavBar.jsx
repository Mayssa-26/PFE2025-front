import { useState } from "react";

// Composant d'icône Bell personnalisé pour remplacer react-icons
const BellIcon = () => (
  <svg 
    width="20" 
    height="20" 
    viewBox="0 0 24 24" 
    fill="currentColor"
    style={{ display: 'block' }}
  >
    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
  </svg>
);

const Navbar = ({ offlineCount = 0 }) => {
    const [showTooltip, setShowTooltip] = useState(false);

    const toggleTooltip = () => {
        setShowTooltip(prev => !prev);
    };

    return (
       <>
            <style>
                {`
                    .navbar {
                        position: fixed;
                        top: 0;
                        left: 250px;
                        right: 0;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 16px 40px;
                        background: rgba(255, 255, 255, 0.95);
                        backdrop-filter: blur(10px);
                        -webkit-backdrop-filter: blur(10px);
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
                        z-index: 1000;
                        border-bottom: 1px solid rgba(229, 231, 235, 0.8);
                        min-height: 70px;
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    }

                    .navbar.scrolled {
                        padding: 12px 40px;
                        min-height: 60px;
                        background: rgba(255, 255, 255, 0.98);
                        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
                        border-bottom: 1px solid rgba(229, 231, 235, 0.9);
                    }

                    .navbar-title {
                        font-size: 24px;
                        font-weight: 600;
                        color: #1f2937;
                        text-decoration: none;
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                        letter-spacing: -0.025em;
                        font-family: 'Roboto', sans-serif;
                    }

                    .navbar.scrolled .navbar-title {
                        font-size: 22px;
                        transform: scale(0.95);
                    }

                    .navbar-title:hover {
                        color: rgb(10, 31, 64);
                        transform: translateY(-1px);
                    }

                    .navbar.scrolled .navbar-title:hover {
                        transform: scale(0.95) translateY(-1px);
                    }

                    .navbar-right-section {
                        display: flex;
                        align-items: center;
                        gap: 20px;
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    }

                    .navbar.scrolled .navbar-right-section {
                        gap: 16px;
                        transform: scale(0.95);
                    }

                    .notification-icon-wrapper {
                        position: relative;
                    }

                    .notification-icon {
                        position: relative;
                        cursor: pointer;
                        padding: 10px;
                        border-radius: 8px;
                        background: rgba(249, 250, 251, 0.8);
                        color: #6b7280;
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border: 1px solid rgba(229, 231, 235, 0.8);
                        width: 44px;
                        height: 44px;
                    }

                    .navbar.scrolled .notification-icon {
                        width: 40px;
                        height: 40px;
                        padding: 8px;
                        background: rgba(249, 250, 251, 0.9);
                    }

                    .notification-icon:hover {
                        background: rgba(243, 244, 246, 0.9);
                        color: #374151;
                        border-color: rgba(209, 213, 219, 0.9);
                        transform: translateY(-2px);
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                    }

                    .notification-badge {
                        position: absolute;
                        top: -4px;
                        right: -4px;
                        background: #dc2626;
                        color: white;
                        font-size: 11px;
                        font-weight: 600;
                        padding: 2px 6px;
                        border-radius: 10px;
                        min-width: 18px;
                        text-align: center;
                        box-shadow: 0 2px 8px rgba(220, 38, 38, 0.4);
                        border: 2px solid white;
                        line-height: 1.2;
                        font-family: 'Roboto', sans-serif;
                        animation: pulse 2s infinite;
                    }

                    .navbar.scrolled .notification-badge {
                        font-size: 10px;
                        padding: 1px 5px;
                        min-width: 16px;
                    }

                    @keyframes pulse {
                        0%, 100% {
                            opacity: 1;
                            transform: scale(1);
                        }
                        50% {
                            opacity: 0.8;
                            transform: scale(1.05);
                        }
                    }

                    .notification-tooltip {
                        position: absolute;
                        top: 55px;
                        right: 0;
                        background: #1f2937;
                        color: white;
                        padding: 8px 12px;
                        border-radius: 6px;
                        white-space: nowrap;
                        font-size: 13px;
                        font-weight: 500;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                        opacity: 0;
                        visibility: hidden;
                        transform: translateY(-8px);
                        transition: all 0.2s ease;
                        z-index: 50;
                        font-family: 'Roboto', sans-serif;
                    }

                    .notification-tooltip.show {
                        opacity: 1;
                        visibility: visible;
                        transform: translateY(0);
                    }

                    .notification-tooltip::before {
                        content: '';
                        position: absolute;
                        top: -6px;
                        right: 16px;
                        width: 0;
                        height: 0;
                        border-left: 6px solid transparent;
                        border-right: 6px solid transparent;
                        border-bottom: 6px solid #1f2937;
                    }

                    .profile-button {
                        color: #374151;
                        text-decoration: none;
                        font-weight: 500;
                        font-size: 15px;
                        padding: 10px 20px;
                        border-radius: 6px;
                        background: rgba(249, 250, 251, 0.8);
                        border: 1px solid rgba(229, 231, 235, 0.8);
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                        font-family: 'Roboto', sans-serif;
                    }

                    .navbar.scrolled .profile-button {
                        font-size: 14px;
                        padding: 8px 16px;
                        background: rgba(249, 250, 251, 0.9);
                    }

                    .profile-button:hover {
                        background: rgb(15, 16, 71);
                        color: white;
                        border-color: rgb(17, 12, 54);
                        transform: translateY(-2px);
                        box-shadow: 0 4px 12px rgba(15, 16, 71, 0.3);
                    }

                    /* Contenu décalé pour compenser la navbar fixe */
                    .content-spacer {
                        height: 70px;
                        width: 100%;
                    }

                    /* Responsive Design */
                    @media (max-width: 1024px) {
                        .navbar {
                            padding: 16px 30px;
                        }
                        .navbar.scrolled {
                            padding: 12px 30px;
                        }
                    }

                    @media (max-width: 768px) {
                        .navbar {
                            padding: 12px 20px;
                        }
                        .navbar.scrolled {
                            padding: 10px 20px;
                        }

                        .navbar-title {
                            font-size: 22px;
                        }

                        .navbar.scrolled .navbar-title {
                            font-size: 20px;
                        }

                        .navbar-right-section {
                            gap: 15px;
                        }

                        .navbar.scrolled .navbar-right-section {
                            gap: 12px;
                        }

                        .profile-button {
                            font-size: 14px;
                            padding: 8px 16px;
                        }

                        .navbar.scrolled .profile-button {
                            font-size: 13px;
                            padding: 6px 12px;
                        }
                    }

                    @media (max-width: 640px) {
                        .navbar {
                            padding: 12px 16px;
                        }
                        .navbar.scrolled {
                            padding: 8px 16px;
                        }

                        .navbar-title {
                            font-size: 20px;
                        }

                        .navbar.scrolled .navbar-title {
                            font-size: 18px;
                        }

                        .notification-icon {
                            width: 40px;
                            height: 40px;
                        }

                        .navbar.scrolled .notification-icon {
                            width: 30px;
                            height: 36px;
                        }

                        .profile-button {
                            font-size: 13px;
                            padding: 8px 12px;
                        }

                        .navbar.scrolled .profile-button {
                            font-size: 12px;
                            padding: 6px 10px;
                        }
                    }

                    /* Animation d'entrée */
                    .navbar {
                        animation: slideDown 0.6s cubic-bezier(0.4, 0, 0.2, 1);
                    }

                    @keyframes slideDown {
                        from {
                            opacity: 0;
                            transform: translateY(-100%);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }

                    /* Focus states pour l'accessibilité */
                    .navbar-title:focus,
                    .profile-button:focus,
                    .notification-icon:focus {
                        outline: 2px solid rgb(16, 10, 84);
                        outline-offset: 2px;
                    }

                    /* Animation de flottement subtile */
                    .navbar::before {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        height: 1px;
                        background: linear-gradient(90deg, transparent, rgba(16, 10, 84, 0.1), transparent);
                        opacity: 0;
                        transition: opacity 0.3s ease;
                    }

                    .navbar.scrolled::before {
                        opacity: 1;
                    }
                `}
            </style>
            
            <div className="navbar">
                <a href="/dashAdmin" className="navbar-title">Home</a>

                <div className="navbar-right-section">
                    <div className="notification-icon-wrapper">
                        <div className="notification-icon" onClick={toggleTooltip}>
                            <BellIcon />
                            {offlineCount > 0 && (
                                <>
                                    <span className="notification-badge">{offlineCount}</span>
                                    <div className={`notification-tooltip ${showTooltip ? 'show' : ''}`}>
                                        {offlineCount} véhicule(s) hors ligne
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <a href='/profil' className="profile-button">Profile</a>
                </div>
            </div>
        </>
    );
};

export default Navbar;