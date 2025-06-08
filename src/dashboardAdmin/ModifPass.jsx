import { useState } from "react";
import PropTypes from "prop-types";
import Sidebar from "./Sidebar.jsx";
import Navbar from "./Navbar.jsx";

const PasswordChange = ({ onCancel }) => {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [userId] = useState("demo-user");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

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

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
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

    // Simulation d'une requête API
    setTimeout(() => {
      setMessage("Mot de passe modifié avec succès !");
      setMessageType("success");
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    }, 1000);
  };

  const renderPasswordStrengthBar = () => {
    const { score, feedback } = passwordStrength;
    const maxScore = 5;
    const percentage = (score / maxScore) * 100;

    let barColor = "#ef4444";
    if (score >= 4) barColor = "#22c55e";
    else if (score >= 3) barColor = "#f59e0b";

    return (
      <div className="password-strength-container">
        <div className="password-strength-bar">
          <div
            className="password-strength-fill"
            style={{
              width: `${percentage}%`,
              backgroundColor: barColor,
            }}
          />
        </div>
        <span className="password-strength-text" style={{ color: barColor }}>
          {feedback}
        </span>
      </div>
    );
  };

  return (
    <div className="dashboard-admin">
      <style>
        {`
          :root {
            --primary-gradient: linear-gradient(135deg, rgb(30, 48, 130) 0%, rgb(54, 22, 118) 100%);
            --success-gradient: linear-gradient(135deg, rgb(24, 68, 106) 0%, rgb(26, 96, 99) 100%);
            --danger-gradient: linear-gradient(135deg, #e74c3c, #c0392b);
            --warning-gradient: linear-gradient(135deg, #f39c12, #e67e22);
            --accent-color: #6366f1;
            --text-primary: #1f2937;
            --text-secondary: #6b7280;
            --text-muted: #9ca3af;
            --bg-primary: #f8fafc;
            --bg-secondary: #ffffff;
            --border-color: #e5e7eb;
            --border-radius: 12px;
            --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
            --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }

          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: var(--bg-primary);
            color: var(--text-primary);
            line-height: 1.6;
          }

          .dashboard-admin {
            display: flex;
            min-height: 100vh;
            background: var(--bg-primary);
          }

          .main-content {
            flex: 1;
            margin-left: 250px;
            padding: 2rem;
            transition: var(--transition);
            background: var(--bg-primary);
            overflow-y: auto;
          }

          .register-container {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: calc(100vh - 120px);
            animation: fadeInUp 0.6s ease-out;
            padding: 2rem;
            margin-top: 20px;
          }

          .register-form-container {
            width: 100%;
            max-width: 600px;
            background: var(--bg-secondary);
            border-radius: var(--border-radius);
            box-shadow: var(--shadow-lg);
            padding: 2.5rem;
            transition: var(--transition);
            backdrop-filter: blur(10px);
            background: rgba(255, 255, 255, 0.95);
          }

          .register-form-container:hover {
            transform: translateY(-4px);
            box-shadow: var(--shadow-lg);
          }

          .register-header {
            text-align: center;
            margin-bottom: 2rem;
            position: relative;
          }

          .register-header h2 {
            font-size: 2rem;
            font-weight: 700;
            background: var(--primary-gradient);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
            margin-bottom: 0.5rem;
          }

          .register-decoration {
            width: 80px;
            height: 4px;
            background: var(--primary-gradient);
            border-radius: 2px;
            margin: 0 auto;
          }

          .register-message {
            display: flex;
            align-items: center;
            padding: 1rem;
            border-radius: var(--border-radius);
            margin-bottom: 1.5rem;
            animation: slideUp 0.3s ease;
          }

          .register-message.success {
            background: rgba(39, 174, 96, 0.1);
            border-left: 4px solid #27ae60;
          }

          .register-message.error {
            background: rgba(231, 76, 60, 0.1);
            border-left: 4px solid #e74c3c;
          }

          .message-icon {
            font-size: 1.5rem;
            margin-right: 0.75rem;
          }

          .register-input-group {
            margin-bottom: 1.5rem;
            position: relative;
          }

          .register-input-group label {
            display: flex;
            align-items: center;
            font-size: 0.9rem;
            font-weight: 500;
            color: var(--accent-color);
            margin-bottom: 0.5rem;
            text-transform: uppercase;
          }

          .input-wrapper {
            position: relative;
            display: flex;
            align-items: center;
          }

          .register-input-group input {
            width: 100%;
            padding: 0.75rem 2.5rem 0.75rem 1rem;
            border: 1px solid var(--border-color);
            border-radius: 8px;
            font-size: 1rem;
            transition: var(--transition);
            background: rgba(255, 255, 255, 0.8);
          }

          .register-input-group input:focus {
            border-color: var(--accent-color);
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
            outline: none;
          }

          .register-input-group input:invalid:not(:placeholder-shown) {
            border-color: #e74c3c;
          }

          .password-toggle {
            position: absolute;
            right: 0.75rem;
            background: none;
            border: none;
            cursor: pointer;
            font-size: 1.2rem;
            color: var(--text-secondary);
            transition: var(--transition);
          }

          .password-toggle:hover {
            color: var(--accent-color);
          }

          .input-hint {
            display: block;
            font-size: 0.85rem;
            color: var(--text-muted);
            margin-top: 0.5rem;
          }

          .password-strength-container {
            margin-top: 1.5rem;
          }

          .password-strength-bar {
            height: 8px;
            background: var(--border-color);
            border-radius: 4px;
            overflow: hidden;
            margin-bottom: 0.5rem;
          }

          .password-strength-fill {
            height: 100%;
            transition: width 0.5s ease;
          }

          .password-strength-text {
            font-size: 0.9rem;
            font-weight: 500;
          }

          .password-requirements {
            background: rgba(243, 244, 246, 0.5);
            border-radius: var(--border-radius);
            padding: 1.25rem;
            margin-bottom: 2rem;
            backdrop-filter: blur(5px);
          }

          .password-requirements h4 {
            font-size: 1rem;
            font-weight: 600;
            color: var(--text-primary);
            margin-bottom: 0.75rem;
          }

          .password-requirements ul {
            list-style: none;
            padding: 0;
          }

          .password-requirements li {
            font-size: 0.9rem;
            color: var(--text-secondary);
            margin-bottom: 0.5rem;
            display: flex;
            align-items: center;
          }

          .password-requirements li.requirement-met {
            color: #27ae60;
          }

          .password-requirements li::before {
            content: '•';
            margin-right: 0.5rem;
            color: var(--text-muted);
          }

          .password-requirements li.requirement-met::before {
            content: '✓';
            color: #27ae60;
          }

          .form-actions {
            display: flex;
            gap: 1rem;
            justify-content: center;
          }

          .register-btn {
            padding: 0.75rem 2rem;
            border-radius: 50px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: var(--transition);
            border: none;
            flex: 1;
            max-width: 200px;
            text-align: center;
          }

          .register-btn.primary {
            background: var(--primary-gradient);
            color: white;
            box-shadow: var(--shadow-md);
          }

          .register-btn.primary:hover {
            transform: translateY(-2px);
            box-shadow: var(--shadow-lg);
          }

          .register-btn.secondary {
            background: var(--border-color);
            color: var(--text-primary);
          }

          .register-btn.secondary:hover {
            background: var(--text-muted);
            transform: translateY(-2px);
          }

          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }

          @keyframes slideUp {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }

          @media (max-width: 1024px) {
            .main-content {
              margin-left: 0;
              padding: 1.5rem;
            }
          }

          @media (max-width: 768px) {
            .register-form-container {
              padding: 2rem;
              max-width: 100%;
            }

            .register-header h2 {
              font-size: 1.75rem;
            }

            .form-actions {
              flex-direction: column;
            }

            .register-btn {
              max-width: 100%;
              margin-bottom: 0.5rem;
            }
          }

          @media (max-width: 480px) {
            .register-header h2 {
              font-size: 1.5rem;
            }

            .register-input-group input {
              font-size: 0.9rem;
            }
          }

          @media (prefers-color-scheme: dark) {
            :root {
              --text-primary: #f9fafb;
              --text-secondary: #d1d5db;
              --text-muted: #9ca3af;
              --bg-primary: #111827;
              --bg-secondary: #1f2937;
              --border-color: #374151;
            }

            .register-form-container {
              background: rgba(31, 41, 55, 0.95);
            }

            .register-message.success {
              background: rgba(39, 174, 96, 0.2);
            }

            .register-message.error {
              background: rgba(231, 76, 60, 0.2);
            }

            .password-requirements {
              background: rgba(55, 65, 81, 0.5);
            }

            .register-input-group input {
              background: rgba(55, 65, 81, 0.8);
              color: var(--text-primary);
            }

            .password-toggle {
              color: var(--text-secondary);
            }

            .password-toggle:hover {
              color: var(--accent-color);
            }
          }
        `}
      </style>

      <Sidebar />
      <div className="main-content">
        <Navbar />
        <div className="register-container">
          <div className="register-form-container">
            <div className="register-header">
              <h2>Modification du mot de passe</h2>
              <div className="register-decoration" />
              <p className="input-hint">
                Renforcez la sécurité de votre compte en mettant à jour votre mot de passe
              </p>
            </div>

            {message && (
              <div className={`register-message ${messageType}`}>
                <span className="message-icon">{messageType === "success" ? "✅" : "⚠️"}</span>
                <p>{message}</p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="register-input-group">
                <label htmlFor="currentPassword">
                  <span className="input-icon">🔒</span>
                  Mot de passe actuel
                </label>
                <div className="input-wrapper">
                  <input
                    id="currentPassword"
                    type={showPasswords.current ? "text" : "password"}
                    name="currentPassword"
                    placeholder="Entrez votre mot de passe actuel"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => togglePasswordVisibility("current")}
                  >
                    {showPasswords.current ? "👁️" : "👁️"}
                  </button>
                </div>
              </div>

              <div className="register-input-group">
                <label htmlFor="newPassword">
                  <span className="input-icon">🔑</span>
                  Nouveau mot de passe
                </label>
                <div className="input-wrapper">
                  <input
                    id="newPassword"
                    type={showPasswords.new ? "text" : "password"}
                    name="newPassword"
                    placeholder="Créez un nouveau mot de passe sécurisé"
                    value={formData.newPassword}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => togglePasswordVisibility("new")}
                  >
                    {showPasswords.new ? "👁️" : "👁️"}
                  </button>
                </div>
                <span className="input-hint">
                  Minimum 8 caractères avec des lettres, chiffres et symboles
                </span>
                {formData.newPassword && renderPasswordStrengthBar()}
              </div>

              <div className="register-input-group">
                <label htmlFor="confirmPassword">
                  <span className="input-icon">🔄</span>
                  Confirmer le nouveau mot de passe
                </label>
                <div className="input-wrapper">
                  <input
                    id="confirmPassword"
                    type={showPasswords.confirm ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Confirmez votre nouveau mot de passe"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => togglePasswordVisibility("confirm")}
                  >
                    {showPasswords.confirm ? "👁️" : "👁️"}
                  </button>
                </div>
              </div>

              <div className="password-requirements">
                <h4>Exigences de sécurité</h4>
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
                  <li className={/[^A-Za-z0-9]/.test(formData.newPassword) ? "requirement-met" : ""}>
                    Au moins un caractère spécial
                  </li>
                  <li className={formData.newPassword.length >= 8 ? "requirement-met" : ""}>
                    Au moins 8 caractères
                  </li>
                </ul>
              </div>

              <div className="form-actions">
                <button type="submit" className="register-btn primary">
                  Modifier le mot de passe
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

PasswordChange.propTypes = {
  onCancel: PropTypes.func,
};

export default PasswordChange;