import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import jwtDecode from "jwt-decode"; // Ajoutez cette dépendance pour décoder le token
import "../dashboardAdmin/ModifPass.css";
import SidebarSupAdmin from "./SideBarSupAdmin";
import NavbarSuperAdmin from "./NavBarSupAdmin";
const PasswordChangeSA = ({  onCancel }) => {
  const process = window.process || { env: {} };
  const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:8000/api";

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [userId, setUserId] = useState(null); // État pour stocker l'ID de l'utilisateur
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: "",
  });

  // Récupérer l'ID de l'utilisateur connecté depuis le token JWT
  useEffect(() => {
    const token = localStorage.getItem("token"); // Supposons que le token est stocké dans localStorage
    if (token) {
      try {
        const decoded = jwtDecode(token); // Décoder le token
        setUserId(decoded.id); // Supposons que l'ID est dans le champ 'id' du token
      } catch (error) {
        console.error("Erreur lors du décodage du token :", error);
      }
    }
  }, []);

  const checkPasswordStrength = (password) => {
    let score = 0;
    let feedback = "";

    if (password.length < 8) {
      feedback = "Trop court (minimum 8 caractères)";
    } else {
      if (password.length >= 10) score += 1;
      if (/[A-Z]/.test(password)) score += 1;
      if (/[a-z]/.test(password)) score += 1;
      if (/[0-9]/.test(password)) score += 1;
      if (/[^A-Za-z0-9]/.test(password)) score += 1;

      if (score <= 2) feedback = "Faible";
      else if (score <= 3) feedback = "Moyen";
      else if (score <= 4) feedback = "Fort";
      else feedback = "Très fort";
    }

    return { score, feedback };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));

    if (name === "newPassword") {
      setPasswordStrength(checkPasswordStrength(value));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userId) {
      setMessage("Utilisateur non identifié. Veuillez vous reconnecter.");
      setMessageType("error");
      return;
    }

    if (formData.newPassword.length < 8) {
      setMessage("Le mot de passe doit contenir au moins 8 caractères.");
      setMessageType("error");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage("Les mots de passe ne correspondent pas.");
      setMessageType("error");
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/user/updatePassword/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`, // Ajouter le token pour l'authentification
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Erreur lors de la modification du mot de passe"
        );
      }

      setMessage("Mot de passe modifié avec succès !");
      setMessageType("success");
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      setMessage(error.message);
      setMessageType("error");
    }
  };

  const renderPasswordStrengthBar = () => {
    const { score, feedback } = passwordStrength;
    const maxScore = 5;
    const percentage = (score / maxScore) * 100;

    let barColor = "#e74c3c";
    if (score >= 4) barColor = "#27ae60";
    else if (score >= 3) barColor = "#f39c12";

    return (
      <div className="password-strength-container">
        <div className="password-strength-bar">
          <div
            className="password-strength-fill"
            style={{
              width: `${percentage}%`,
              backgroundColor: barColor,
            }}
          ></div>
        </div>
        <span className="password-strength-text" style={{ color: barColor }}>
          {feedback}
        </span>
      </div>
    );
  };

  return (
    <div className="dashboard-admin">
      <SidebarSupAdmin />
      <div className="main-content">
        <NavbarSuperAdmin />
        <div className="register-container">
          <div className="register-form-container">
            <div className="register-header">
              <h2>Modification du mot de passe</h2>
              <div className="register-decoration"></div>
            </div>

            {message && (
              <div className={`register-message ${messageType}`}>
                <div className="message-icon">
                  {messageType === "success" ? "✓" : "⚠"}
                </div>
                <p>{message}</p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="register-form-section">
                <h3 className="section-title">Sécurité</h3>

                <div className="register-input-group">
                  <label htmlFor="currentPassword">
                    <span className="input-icon">🔑</span> Mot de passe actuel
                  </label>
                  <input
                    id="currentPassword"
                    type="password"
                    name="currentPassword"
                    placeholder="Votre mot de passe actuel"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="register-input-group">
                  <label htmlFor="newPassword">
                    <span className="input-icon">🔒</span> Nouveau mot de passe
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    name="newPassword"
                    placeholder="Votre nouveau mot de passe"
                    value={formData.newPassword}
                    onChange={handleChange}
                    required
                  />
                  <span className="input-hint">
                    Minimum 8 caractères, incluant lettres, chiffres et caractères spéciaux
                  </span>
                  {formData.newPassword && renderPasswordStrengthBar()}
                </div>

                <div className="register-input-group">
                  <label htmlFor="confirmPassword">
                    <span className="input-icon">🔒</span> Confirmer le mot de passe
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirmer votre nouveau mot de passe"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="password-requirements">
                <h4>Pour plus de sécurité, votre mot de passe devrait contenir :</h4>
                <ul>
                  <li className={/[A-Z]/.test(formData.newPassword) ? "requirement-met" : ""}>
                    Au moins une lettre majuscule
                  </li>
                  <li className={/[a-z]/.test(formData.newPassword) ? "requirement-met" : ""}>
                    Au moins une lettre minuscule
                  </li>
                  <li className={/[0-9]/.test(formData.newPassword) ? "requirement-met" : ""}>
                    Au moins un chiffre
                  </li>
                  <li
                    className={
                      /[^A-Za-z0-9]/.test(formData.newPassword) ? "requirement-met" : ""
                    }
                  >
                    Au moins un caractère spécial
                  </li>
                  <li className={formData.newPassword.length >= 8 ? "requirement-met" : ""}>
                    Au moins 8 caractères
                  </li>
                </ul>
              </div>

              <div className="form-actions">
                <button type="submit" className="register-btn primary">
                  Changer le mot de passe
                </button>
                {onCancel && (
                  <button
                    type="button"
                    className="register-btn secondary"
                    onClick={onCancel}
                  >
                    Annuler
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

PasswordChangeSA.propTypes = {
  onSubmit: PropTypes.func,
  onCancel: PropTypes.func,
};

export default PasswordChangeSA;