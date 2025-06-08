import { FaBell } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { useState, useContext } from "react";
import { NotificationContext } from "./NotificationContext";

const NavbarSuperAdmin = () => {
  const { notifications, removeNotification } = useContext(NotificationContext);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();

  const toggleNotifications = (event) => {
    event.stopPropagation();
    setShowNotifications((prev) => !prev);
  };

  const handleNotificationClick = (demandeId) => {
    removeNotification(demandeId);
    setShowNotifications(false);
    navigate("/demandes", { state: { highlightedDemandeId: demandeId } });
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
            position: relative;
          }

          .notification-area {
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

          .notification-dropdown {
            position: absolute;
            top: 55px;
            right: 0;
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            width: 300px;
            max-height: 400px;
            overflow-y: auto;
            z-index: 100;
          }

          .notification-dropdown ul {
            list-style: none;
            padding: 0;
            margin: 0;
          }

          .notification-dropdown li {
            padding: 12px 16px;
            border-bottom: 1px solid #f3f4f6;
            cursor: pointer;
            transition: background 0.2s ease;
            font-size: 14px;
            font-family: 'Roboto', sans-serif;
          }

          .notification-dropdown li:hover {
            background: #f9fafb;
          }

          .notification-dropdown li:last-child {
            border-bottom: none;
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
            
            .notification-dropdown {
              width: 280px;
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

            .notification-dropdown {
              width: 250px;
              right: -10px;
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

            .notification-dropdown {
              width: 220px;
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

            .notification-dropdown {
              top: 50px;
              right: -15px;
              width: 200px;
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
          .notification-icon:focus,
          .notification-dropdown li:focus {
            outline: 2px solid rgb(16, 10, 84);
            outline-offset: 2px;
          }
        `}
      </style>
      
      <div className="navbar">
        <Link to="/dashboardSuperAdmin" className="navbar-title">
          Home
        </Link>

        <div className="navbar-right-section">
          <div className="notification-area">
            <div
              className="notification-icon"
              onClick={toggleNotifications}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && toggleNotifications(e)}
            >
              <FaBell />
              {notifications.length > 0 && (
                <span className="notification-badge">{notifications.length}</span>
              )}
            </div>
            {showNotifications && notifications.length > 0 && (
              <div className="notification-dropdown">
                <ul>
                  {notifications.map((notif) => (
                    <li
                      key={notif.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNotificationClick(notif.id);
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === "Enter" && handleNotificationClick(notif.id)}
                    >
                      {notif.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <Link to="/profilSA" className="profile-button">
            Profile
          </Link>
        </div>
      </div>
    </>
  );
};

export default NavbarSuperAdmin;