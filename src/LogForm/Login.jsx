import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Authentification/AuthContext.jsx";

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
      try {
        const errorData = JSON.parse(errorText);
        setMessage(errorData.message || "Une erreur est survenue");
      } catch (parseError) {
        setMessage("Une erreur est survenue");
      }
      return; // Exit early to avoid further processing
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
      setMessage("Une erreur est survenue");
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
    <>
      <style>{`
        /* Conteneur principal */
        .login-conteneur1 {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 90%;
          max-width: 900px;
          height: 90vh;
          background: linear-gradient(135deg, #eee5eb, #cecdec);
          padding: 40px;
          border-radius: 10px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          margin: auto;
          flex-wrap: wrap;
          gap: 0px;
          margin-top: 30px;
        }
        
        .login-box h2 {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 20px;
          color: #230f49;
        }
        
        /* Image Box */
        .login-image-box {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: center;
          max-width: 40%;
        }
        
        .login-image-box img {
          width: 60%;
          max-width: 250px;
          filter: drop-shadow(4px 4px 10px rgba(0, 0, 0, 0.2));
        }
        
        /* Boîte de connexion */
        .login-box {
          flex: 1;
          min-width: 300px;
          max-width: 500px;
          padding: 25px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
          text-align: center;
          transition: 0.3s ease-in-out;
        }
        
        .login-box:hover {
          box-shadow: 0 12px 35px rgba(0, 0, 0, 0.2);
          transform: translateY(-5px);
        }
        
        /* Champs de saisie */
        .login-input-group {
          display: flex;
          align-items: center;
          background: #f5f5f5;
          border-radius: 8px;
          padding: 10px;
          margin-bottom: 15px;
        }
        
        .login-input-group input {
          border: none;
          background: transparent;
          width: 100%;
          padding: 10px;
          font-size: 16px;
        }
        
        .login-input-group span {
          color: #230f49;
          font-size: 18px;
          margin-right: 10px;
          opacity: 0.8;
        }
        
        /* Bouton de connexion */
        .login-btn {
          width: 100%;
          padding: 12px;
          background: linear-gradient(135deg, #230f49, #4b13b3);
          color: white;
          font-size: 16px;
          font-weight: bold;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease-in-out;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
        }
        
        .login-btn:hover {
          background: linear-gradient(135deg, #4b13b3, #230f49);
          transform: scale(1.05);
        }
        
        /* Lien d'inscription */
        .login-already-member {
          font-size: 14px;
          margin-top: 12px;
        }
        
        .login-register-link {
          color: #230f49;
          font-weight: bold;
          text-decoration: none;
          transition: all 0.3s;
          display: inline-block;
          cursor: pointer;
        }
        
        .login-register-link:hover {
          text-decoration: underline;
          color: #4b13b3;
        }
        
        /* Style pour le message d'erreur */
        .error-message {
          color: #d32f2f;
          background-color: #fce4e4;
          padding: 10px;
          border-radius: 8px;
          margin-top: 15px;
          font-size: 14px;
          font-weight: 500;
          text-align: center;
          border: 1px solid #ef5350;
          transition: all 0.3s ease-in-out;
        }
        
        /* Responsive */
        @media screen and (max-width: 768px) {
          .login-conteneur1 {
            flex-direction: column;
            height: auto;
            padding: 10px;
          }
        
          .login-image-box {
            display: none;
          }
        
          .login-box {
            width: 90%;
            padding: 20px;
          }
        
          .login-btn {
            width: 100%;
            font-size: 14px;
            padding: 12px;
          }
        }
        
        @media screen and (max-width: 400px) {
          .login-box {
            width: 95%;
            padding: 15px;
          }
        
          .login-input-group {
            padding: 8px;
          }
        
          .login-btn {
            padding: 10px;
          }
          
          .error-message {
            font-size: 13px;
            padding: 8px;
          }
        }
      `}</style>

      <div className="login-conteneur1">
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
          {message && <p className="error-message">{message}</p>}

          <p className="login-already-member">
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
    </>
  );
};

export default Login;