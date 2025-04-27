import { useState } from "react";
import "./Car.css";
import image from "C:/stage/Test/frontTest/public/car.png";
import { GiGriffinSymbol } from "react-icons/gi";
import { IoLogoModelS, IoIosColorPalette } from "react-icons/io";
import { FaCalendarAlt } from "react-icons/fa";
import { FcMoneyTransfer } from "react-icons/fc";
import { SiGooglestreetview } from "react-icons/si";
import { RiErrorWarningFill } from "react-icons/ri";
import { MdTextFields } from "react-icons/md";
import { FaCheckCircle } from "react-icons/fa"; // Import checkmark icon

const RegisterCar = () => {
  const process = window.process || { env: {} };
  const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:8000/api";
  const [formData, setFormData] = useState({
    matricule: "",
    marque: "",
    modele: "",
    anneeFab: 0,
    prix: 0,
    couleur: "",
    kilometrage: 0,
    condition: "",
    description: "",
  });

  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Validation before the request
      if (formData.anneeFab < 1900 || formData.anneeFab > new Date().getFullYear()) {
        setMessage("L'année de fabrication doit être valide.");
        setIsSuccess(false);
        return;
      }
      if (formData.prix <= 0) {
        setMessage("Le prix doit être supérieur à 0.");
        setIsSuccess(false);
        return;
      }

      const response = await fetch(`${apiUrl}/cars/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Erreur lors de l'inscription");
      }

      setMessage("Voiture ajoutée avec succès !");
      setIsSuccess(true);
    } catch (error) {
      setMessage(error.message);
      setIsSuccess(false);
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
    
    <div className="register-page">
       <div className="dashboard-admin">
    <div className="registerCar-container">
      <div className="registerCar-box">
        <h2>Ajouter Voiture</h2>

        <form onSubmit={handleSubmit}>
          <div className="registerCar-input-group">
            <span><FaCalendarAlt className="react-icons"/></span>
            <input
              type="text"
              name="matricule"
              placeholder="Matricule"
              value={formData.matricule}
              onChange={handleChange}
              required
            />
          </div>
          <div className="registerCar-input-group">
            <span><GiGriffinSymbol className="react-icons"/></span>
            <input
              type="text"
              name="marque"
              placeholder="Marque"
              value={formData.marque}
              onChange={handleChange}
              required
            />
          </div>
          <div className="registerCar-input-group">
            <span><IoLogoModelS className="react-icons" /></span>
            <input
              type="text"
              name="modele"
              placeholder="Modèle"
              value={formData.modele}
              onChange={handleChange}
              required
            />
          </div>
          <div className="registerCar-input-group">
            <span><FaCalendarAlt className="react-icons" /></span>
            <input
              type="number"
              name="anneeFab"
              placeholder="Année de fabrication"
              value={formData.anneeFab}
              onChange={handleChange}
              required
            />
          </div>
          <div className="registerCar-input-group">
            <span><FcMoneyTransfer className="react-icons"/></span>
            <input
              type="number"
              name="prix"
              placeholder="Prix"
              value={formData.prix}
              onChange={handleChange}
              required
            />
          </div>
          <div className="registerCar-input-group">
            <span><IoIosColorPalette className="react-icons"/></span>
            <input
              type="text"
              name="couleur"
              placeholder="Couleur"
              value={formData.couleur}
              onChange={handleChange}
              required
            />
          </div>
          <div className="registerCar-input-group">
            <span><SiGooglestreetview className="react-icons"/></span>
            <input
              type="number"
              name="kilometrage"
              placeholder="Kilométrage"
              value={formData.kilometrage}
              onChange={handleChange}
              required
            />
          </div>
          <div className="registerCar-input-group">
  <span><RiErrorWarningFill className="react-icons" /></span>
  <select
    name="condition"
    value={formData.condition}
    onChange={handleChange}
    required
  >
    <option value="">Sélectionner la condition</option>
    <option value="Neuf">Neuf</option>
    <option value="Occasion">Occasion</option>
  </select>
</div>

          <div className="registerCar-input-group">
            <span><MdTextFields className="react-icons"/></span>
            <input
              type="text"
              name="description"
              placeholder="Description"
              value={formData.description}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="registerCar-btn">
            Ajouter
          </button>

          {/* Message box now appears below the submit button */}
          {message && (
            <div className={`message-box ${isSuccess ? 'success' : 'error'}`}>
              {isSuccess ? (
                <div className="registerCar-success-box">
                  <FaCheckCircle size={30} color="green" />
                  <span>{message}</span>
                </div>
              ) : (
                <div className="registerCar-error-box">
                  <RiErrorWarningFill size={30} color="red" />
                  <span>{message}</span>
                </div>
              )}
            </div>
          )}
        </form>
      </div>
      <div className="registerCar-image-box">
        <img src={image} alt="Voiture" />
      </div>
    </div>
    </div>
    </div>
    
  );
};

export default RegisterCar;
