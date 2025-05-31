import { useState } from "react";
import PropTypes from "prop-types";

const Register = ({ initialData = {}, onSubmit, onCancel, isEditMode = false }) => {
  const process = window.process || { env: {} };
  const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:8000/api";

  const [formData, setFormData] = useState({
    nom: initialData.nom || "",
    prenom: initialData.prenom || "",
    email: initialData.email || "",
    confirmPassword: initialData.password || "",
    cin: initialData.cin || "",
    adresse: initialData.adresse || "",
    nationalite: initialData.nationalite || "",
    dateNaissance: initialData.dateNaissance || "",
    numTel: initialData.numTel || "",
    role: "Admin",
  });

  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!/^\d{8}$/.test(formData.cin)) {
      setMessage("Le CIN doit contenir exactement 8 chiffres.");
      return;
    }
    if (!/^\d{8}$/.test(formData.numTel)) {
      setMessage("Le numero de téléphone doit contenir exactement 8 chiffres.");
      return;
    }

    if (isEditMode) {
      onSubmit(formData);
    } else {
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
    <>
      <style>
        {`
          .register-container {
            display: flex;
          justify-content: center;
          align-items: center;
          width: 90%;
          max-width: 900px;
          max-height: 200vh;
          height: 150vh;
          background: linear-gradient(135deg, #eee5eb, #cecdec);
          padding: 40px;
          border-radius: 10px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          margin: auto;
          flex-wrap: wrap;
          gap: 0px;
          margin-top: 0px;
          background-color: rgba(255, 255, 255, 255);
          }

          .sregister-ignup-box {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
            width: 100%;
            max-width: 600px;
            border: 1px solid rgba(255, 255, 255, 0.2);
          }

          .sregister-ignup-box h2 {
            text-align: center;
            margin-bottom: 30px;
            color: #333;
            font-size: 28px;
            font-weight: 600;
            background: linear-gradient(135deg,rgb(28, 39, 88),rgb(14, 17, 58));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          .register-message {
            text-align: center;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 20px;
            font-weight: 500;
            background: linear-gradient(135deg,rgb(32, 25, 73) 0%,rgb(25, 26, 105) 100%);
            color: white;
            border: none;
          }

          .register-input-group {
            margin-bottom: 25px;
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .register-input-group.two-columns {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
          }

          .register-input-group > div {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .register-input-group span {
            font-weight: 600;
            color: #555;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .register-input-group input {
            padding: 15px;
            border: 2px solid #e1e5e9;
            border-radius: 12px;
            font-size: 16px;
            background: rgba(247, 250, 252, 0.8);
            transition: all 0.3s ease;
            outline: none;
          }

          .register-input-group input:focus {
            border-color:rgb(8, 17, 61);
            background: white;
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.2);
          }

          .register-input-group input:disabled {
            background: #f8f9fa;
            color: #6c757d;
            cursor: not-allowed;
          }

          .input-small {
            flex: 1;
          }

          .input-large {
            width: 100%;
          }

          .form-actions {
            display: flex;
            gap: 15px;
            margin-top: 30px;
            justify-content: center;
          }

          .register-btn {
            background: linear-gradient(135deg,rgb(9, 17, 54) 0%,rgb(19, 12, 63) 100%);
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            min-width: 150px;
          }

          .register-btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
          }

          .register-btn:active {
            transform: translateY(-1px);
          }

          .btn-cancel {
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            min-width: 150px;
          }

          .btn-cancel:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 25px rgba(255, 107, 107, 0.4);
          }

          .register-already-member {
            display: block;
            text-align: center;
            margin-top: 25px;
            color:rgb(25, 15, 117);
            text-decoration: none;
            font-weight: 500;
            transition: all 0.3s ease;
          }

          .register-already-member:hover {
            color:rgb(12, 27, 74);
            transform: translateY(-1px);
          }

          /* Responsive Design */
          @media (max-width: 768px) {
            .register-container {
              padding: 10px;
            }

            .sregister-ignup-box {
              padding: 25px;
            }

            .sregister-ignup-box h2 {
              font-size: 24px;
            }

            .register-input-group.two-columns {
              grid-template-columns: 1fr;
              gap: 0;
            }

            .form-actions {
              flex-direction: column;
              align-items: center;
            }

            .register-btn, .btn-cancel {
              width: 100%;
              max-width: 250px;
            }
          }

          /* Animation d'entrée */
          .sregister-ignup-box {
            animation: slideInUp 0.6s ease-out;
          }

          @keyframes slideInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
      
      <div className="register-container">
        <div className="sregister-ignup-box">
          <h2>{isEditMode ? "Modifier l'administrateur" : "Inscription"}</h2>

          {message && <p className="register-message">{message}</p>}

          <form onSubmit={handleSubmit}>
            <div className="register-input-group two-columns">
              <div>
                <span>👤 Nom</span>
                <input
                  className="input-small"
                  type="text"
                  name="nom"
                  placeholder="Nom"
                  value={formData.nom}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <span>👤 Prénom</span>
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
            </div>

            <div className="register-input-group">
              <span>📧 Email</span>
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
              <span>🏠 Adresse</span>
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
              <span>📞 Numéro de téléphone</span>
              <input
                className="input-large"
                type="text"
                name="numTel"
                placeholder="Numéro de téléphone"
                value={formData.numTel}
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
            <a href="/" className="register-already-member">
              Je suis déjà membre
            </a>
          )}
        </div>
      </div>
    </>
  );
};

Register.propTypes = {
  initialData: PropTypes.object,
  onSubmit: PropTypes.func,
  onCancel: PropTypes.func,
  isEditMode: PropTypes.bool,
};

Register.defaultProps = {
  initialData: {},
  isEditMode: false,
};

export default Register;