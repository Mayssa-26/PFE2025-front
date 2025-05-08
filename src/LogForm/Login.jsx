import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Authentification/AuthContext.jsx";
import "./Login.css";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:8000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      // Log de la réponse serveur
      console.log('Réponse serveur:', response);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur de serveur : ${errorText}`);
      }

      const data = await response.json();
      console.log('Données reçues:', data); // Log des données reçues du back-end

      login(data.token, data.role, data.name); // Store token and role

      // Redirection en fonction du rôle
      if (data.role === "Admin") {
        navigate("/dashAdmin");
      } else if (data.role === "superAdmin") {
        navigate("/dashboardSuperAdmin");
      } 
    } catch (error) {
      if (error.message.includes("NetworkError")) {
        setMessage("Erreur : Impossible de se connecter au serveur.");
      } else {
        setMessage(`Erreur : ${error.message}`);
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
    <div className="login-conteneur">
      <div className="login-box">
        <h2>Connexion</h2>
        <form onSubmit={handleSubmit}>
          <div className="login-input-group">
            <span>📧</span>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Email"
            />
          </div>
          <div className="login-input-group">
            <span>🔒</span>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Mot de passe"
            />
          </div>
          <button type="submit" className="login-btn">
            Se connecter
          </button>
        </form>
        {message && <p>{message}</p>}

        <p className="login-redirect-text">
          Vous n'avez pas de compte ?
          <span
            className="login-register-link"
            onClick={() => navigate("/register")}
          >
            S'inscrire
          </span>
        </p>
      </div>
      <div className="login-image-box">
        <img src="/gps.png" alt="login illustration" />
      </div>
    </div>
  );
};

export default Login;
