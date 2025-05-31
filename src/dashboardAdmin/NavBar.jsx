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
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 16px 40px;
                        background: #ffffff;
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
                        position: sticky;
                        top: 0;
                        z-index: 1000;
                        border-bottom: 1px solid #e5e7eb;
                        min-height: 70px;
                    }

                    .navbar-title {
                        font-size: 24px;
                        font-weight: 600;
                        color: #1f2937;
                        text-decoration: none;
                        transition: color 0.2s ease;
                        letter-spacing: -0.025em;
                        font-family: 'Roboto', sans-serif;
                    }

                    .navbar-title:hover {
                        color: rgb(10, 31, 64);
                    }

                    .navbar-right-section {
                        display: flex;
                        align-items: center;
                        gap: 20px;
                    }

                    .notification-icon-wrapper {
                        position: relative;
                    }

                    .notification-icon {
                        position: relative;
                        cursor: pointer;
                        padding: 10px;
                        border-radius: 8px;
                        background: #f9fafb;
                        color: #6b7280;
                        transition: all 0.2s ease;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border: 1px solid #e5e7eb;
                        width: 44px;
                        height: 44px;
                    }

                    .notification-icon:hover {
                        background: #f3f4f6;
                        color: #374151;
                        border-color: #d1d5db;
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
                        box-shadow: 0 1px 4px rgba(220, 38, 38, 0.3);
                        border: 2px solid white;
                        line-height: 1.2;
                        font-family: 'Roboto', sans-serif;
                    }

                    @keyframes pulse {
                        0%, 100% {
                            opacity: 1;
                        }
                        50% {
                            opacity: 0.8;
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
                        background: #f9fafb;
                        border: 1px solid #e5e7eb;
                        transition: all 0.2s ease;
                        font-family: 'Roboto', sans-serif;
                    }

                    .profile-button:hover {
                        background: rgb(15, 16, 71);
                        color: white;
                        border-color: rgb(17, 12, 54);
                    }

                    /* Responsive Design */
                    @media (max-width: 1024px) {
                        .navbar {
                            padding: 16px 30px;
                        }
                    }

                    @media (max-width: 768px) {
                        .navbar {
                            padding: 12px 20px;
                        }

                        .navbar-title {
                            font-size: 22px;
                            font-family: 'Roboto', sans-serif;
                        }

                        .navbar-right-section {
                            gap: 15px;
                        }

                        .profile-button {
                            font-size: 14px;
                            padding: 8px 16px;
                            font-family: 'Roboto', sans-serif;
                        }

                        .notification-tooltip {
                            right: -10px;
                            font-size: 12px;
                            font-family: 'Roboto', sans-serif;
                        }
                    }

                    @media (max-width: 640px) {
                        .navbar {
                            padding: 12px 16px;
                        }

                        .navbar-title {
                            font-size: 20px;
                            font-family: 'Roboto', sans-serif;
                        }

                        .navbar-right-section {
                            gap: 12px;
                        }

                        .notification-icon {
                            width: 40px;
                            height: 40px;
                        }

                        .profile-button {
                            font-size: 13px;
                            padding: 8px 12px;
                            font-family: 'Roboto', sans-serif;
                        }
                    }

                    @media (max-width: 480px) {
                        .navbar {
                            padding: 10px 12px;
                        }

                        .navbar-title {
                            font-size: 18px;
                            font-family: 'Roboto', sans-serif;
                        }

                        .profile-button {
                            padding: 6px 10px;
                            font-size: 12px;
                            font-family: 'Roboto', sans-serif;
                        }

                        .notification-icon {
                            width: 36px;
                            height: 36px;
                            padding: 8px;
                        }

                        .notification-tooltip {
                            top: 50px;
                            right: -15px;
                        }
                    }

                    /* Transitions subtiles */
                    .navbar {
                        animation: slideDown 0.3s ease-out;
                    }

                    @keyframes slideDown {
                        from {
                            opacity: 0;
                            transform: translateY(-20px);
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