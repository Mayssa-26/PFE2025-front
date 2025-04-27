import { useState } from "react";
import { Link } from "react-router-dom";
import "C:/stage/Test/frontTest/src/register/Register.css"
import image from "C:/stage/Test/frontTest/public/gps.png";

const Register = () => {
  const process = window.process || { env: {} };
  const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:8000/api";

  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    password: "",
    confirmPassword: "",
    cin: "",
    adresse: "",
    nationalite: "",
    dateNaissance: "",
    NumTel: "",
    role: "Admin", // Valeur par défaut
  });
  
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!/^\d{8}$/.test(formData.cin)) {
      setMessage("Le CIN doit contenir exactement 8 chiffres.");
      return;
    }

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
        <h2>Inscription</h2>

        {message && <p className="register-message">{message}</p>}

        <form onSubmit={handleSubmit}>
          <div className="register-input-group">
            <span>👤</span>
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
            <span>📧</span>
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
            <span>🔑</span>
            <input
              type="password"
              name="password"
              placeholder="mot de passe"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="register-input-group">
            <span>🏠</span>
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
            <span>🪪</span>
            <input
              className="input-large"
              type="text"
              name="cin"
              placeholder="CIN"
              value={formData.cin}
              onChange={handleChange}
              required
            />
            </div>
            <div>
            <span>📞</span>
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
            <span>📅</span>
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
              <option value="controller">Admin</option>
            </select>
          </div>

          <button type="submit" className="register-btn">
            S'inscrire
          </button>
        </form>

        <Link to="/" className="register-already-member">
          Je suis déjà membre
        </Link>
      </div>

      <div className="register-image-box">
        <img src={image} alt="Inscription" />
      </div>
    </div>
  );
};

export default Register;
