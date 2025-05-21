import { FaBell } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { useState, useContext } from "react";
import { NotificationContext } from "./NotificationContext";
import "../dashboardAdmin/NavBar.css";

const NavbarSuperAdmin = () => {
  const { notifications, removeNotification } = useContext(NotificationContext);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();

  console.log("Notifications actuelles dans NavbarSuperAdmin:", notifications);

  const toggleNotifications = (event) => {
    event.stopPropagation();
    console.log("Toggling notifications, current state:", showNotifications);
    setShowNotifications((prev) => !prev);
  };

  const handleNotificationClick = (demandeId) => {
    console.log("Notification clicked, demandeId:", demandeId);
    removeNotification(demandeId);
    setShowNotifications(false);
    navigate("/demandes", { state: { highlightedDemandeId: demandeId } });
  };

  return (
    <div className="navbar">
      <Link to="/dashboardSuperAdmin" className="navbar-title">
        Home
      </Link>

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
  );
};

export default NavbarSuperAdmin;