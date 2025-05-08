import { useState } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types"; // Import PropTypes
import "./Register.css";

const Register = ({ initialData = {}, onSubmit, onCancel, isEditMode = false }) => {
  const process = window.process || { env: {} };
  const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:8000/api";

  const [formData, setFormData] = useState({
    nom: initialData.nom || "",
    prenom: initialData.prenom || "",
    email: initialData.email || "",
    password: initialData.password || "",
    confirmPassword: initialData.password || "",
    cin: initialData.cin || "",
    adresse: initialData.adresse || "",
    nationalite: initialData.nationalite || "",
    dateNaissance: initialData.dateNaissance || "",
    NumTel: initialData.numTel || "",
    role: initialData.role || "Admin",
  });

  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!/^\d{8}$/.test(formData.cin)) {
      setMessage("Le CIN doit contenir exactement 8 chiffres.");
      return;
    }
    if (!/^\d{8}$/.test(formData.NumTel)) {
      setMessage("Le numero de téléphone doit contenir exactement 8 chiffres.");
      return;
    }


    if (isEditMode) {
      // Mode édition : appeler onSubmit avec les données du formulaire
      onSubmit(formData);
    } else {
      // Mode inscription
      try {
        const response = await fetch(`${apiUrl}/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || "Erreur lors de l'inscription");
        }

        setMessage("Inscription réussie !");
      } catch (error) {
        setMessage(error.message);
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  return (
    <div className="register-container">
      <div className="sregister-ignup-box">
        <h2>{isEditMode ? "Modifier l'administrateur" : "Inscription"}</h2>

        {message && <p className="register-message">{message}</p>}

        <form onSubmit={handleSubmit}>
          <div className="register-input-group">
            <span>👤Nom et prenom</span>
            <input
              className="input-small"
              type="text"
              name="nom"
              placeholder="Nom"
              value={formData.nom}
              onChange={handleChange}
              required
            />
            <input
              className="input-small"
              type="text"
              name="prenom"
              placeholder="Prénom"
              value={formData.prenom}
              onChange={handleChange}
              required
            />
          </div>

          <div className="register-input-group">
            <span>📧 email</span>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="register-input-group">
            <span>🔑 mot de passe</span>
            <input
              type="password"
              name="password"
              placeholder="Mot de passe"
              value={formData.password}
              onChange={handleChange}
              required={!isEditMode} // Mot de passe facultatif en mode édition
            />
          </div>

          <div className="register-input-group">
            <span>🏠adresse </span>
            <input
              className="input-large"
              type="text"
              name="adresse"
              placeholder="Adresse"
              value={formData.adresse}
              onChange={handleChange}
              required
            />
          </div>

          <div className="register-input-group">
            <span>🪪 CIN</span>
            <input
              className="input-large"
              type="text"
              name="cin"
              placeholder="CIN"
              value={formData.cin}
              onChange={handleChange}
              disabled={isEditMode}
              required
            />
          </div>

          <div className="register-input-group">
            <span>📞 numero de téléphone</span>
            <input
              className="input-large"
              type="text"
              name="NumTel"
              placeholder="Numéro de téléphone"
              value={formData.NumTel}
              onChange={handleChange}
              required
            />
          </div>

          <div className="register-input-group">
            <span>📅 Date de naissance</span>
            <input
              type="date"
              name="dateNaissance"
              value={formData.dateNaissance}
              onChange={handleChange}
              required
            />
          </div>

          <div className="register-input-group">
            <label>Rôle :</label>
            <select name="role" value={formData.role} onChange={handleChange}>
              <option value="Admin">Admin</option>
            </select>
          </div>

          <div className="form-actions">
            <button type="submit" className="register-btn">
              {isEditMode ? "Enregistrer" : "S'inscrire"}
            </button>
            {isEditMode && (
              <button type="button" className="btn-cancel" onClick={onCancel}>
                Annuler
              </button>
            )}
          </div>
        </form>

        {!isEditMode && (
          <Link to="/" className="register-already-member">
            Je suis déjà membre
          </Link>
        )}
      </div>

      
    </div>
  );
};

// Ajout de la validation des props
Register.propTypes = {
  initialData: PropTypes.shape({
    nom: PropTypes.string,
    prenom: PropTypes.string,
    email: PropTypes.string,
    password: PropTypes.string,
    cin: PropTypes.string,
    adresse: PropTypes.string,
    nationalite: PropTypes.string,
    dateNaissance: PropTypes.string,
    numTel: PropTypes.string,
    role: PropTypes.string,
  }),
  onSubmit: PropTypes.func,
  onCancel: PropTypes.func,
  isEditMode: PropTypes.bool,
};

// Valeurs par défaut pour les props
Register.defaultProps = {
  initialData: {},
  isEditMode: false,
};

export default Register;