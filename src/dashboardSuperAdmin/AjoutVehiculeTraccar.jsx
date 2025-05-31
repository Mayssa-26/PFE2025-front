"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import "./AjoutVehTraccar.css";
import SidebarSupAdmin from "./SideBarSupAdmin";
import NavbarSuperAdmin from "./NavBarSupAdmin";
import { useNavigate, useLocation } from "react-router-dom";

const AddDeviceForm = () => {
  const TRACCAR_API = "https://yepyou.treetronix.com/api";
  const TRACCAR_AUTH = {
    username: "admin",
    password: "admin",
  };

  const navigate = useNavigate();
  const { state } = useLocation();
  const isEditMode = !!state?.vehicleToEdit;

  const [form, setForm] = useState({
    name: "",
    uniqueId: "",
    chauffeur: "",
    groupId: 0,
    category: "default",
    phone: "",
    model: "",
    contact: "",
    archived: false,
    status: "offline"
  });

  const [groups, setGroups] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [allDrivers, setAllDrivers] = useState([]);
  const [loading, setLoading] = useState({ 
    form: false, 
    groups: false,
    drivers: false,
    allDrivers: false
  });
  const [message, setMessage] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Initialisation du formulaire
  useEffect(() => {
    if (isEditMode) {
      const { vehicleToEdit } = state;
      setForm({
        name: vehicleToEdit.name || "",
        uniqueId: vehicleToEdit.uniqueId || "",
        chauffeur: vehicleToEdit.attributes?.chauffeur || "",
        groupId: vehicleToEdit.groupId || 0,
        category: vehicleToEdit.category || "default",
        phone: vehicleToEdit.phone || "",
        model: vehicleToEdit.model || "",
        contact: vehicleToEdit.contact || "",
        archived: vehicleToEdit.attributes?.archived || false,
        status: vehicleToEdit.status || "offline"
      });
    }
  }, [isEditMode, state]);

  // Chargement des groupes
  useEffect(() => {
    const fetchGroups = async () => {
      setLoading(prev => ({ ...prev, groups: true }));
      setMessage(null);

      try {
        const response = await axios.get(`${TRACCAR_API}/groups`, {
          auth: TRACCAR_AUTH,
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          timeout: 10000,
        });

        setGroups(response.data);
      } catch (err) {
        console.error("Erreur de récupération des groupes:", err);
        setMessage({
          type: "error",
          text: `Échec du chargement des groupes: ${err.response?.data?.message || err.message}`,
        });
      } finally {
        setLoading(prev => ({ ...prev, groups: false }));
      }
    };

    fetchGroups();
  }, []);

  // Chargement de tous les chauffeurs
  useEffect(() => {
    const fetchAllDrivers = async () => {
      setLoading(prev => ({ ...prev, allDrivers: true }));
      try {
        const response = await axios.get(`${TRACCAR_API}/drivers`, {
          auth: TRACCAR_AUTH,
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
        });
        setAllDrivers(response.data);
      } catch (err) {
        console.error("Erreur de récupération des chauffeurs:", err);
        setMessage({
          type: "error",
          text: `Échec du chargement de la liste des chauffeurs: ${err.response?.data?.message || err.message}`,
        });
      } finally {
        setLoading(prev => ({ ...prev, allDrivers: false }));
      }
    };

    fetchAllDrivers();
  }, []);

  // Filtrage des chauffeurs par groupe
  useEffect(() => {
    const filterDriversByGroup = () => {
      if (!form.groupId || form.groupId === 0) {
        setDrivers([]);
        return;
      }

      setLoading(prev => ({ ...prev, drivers: true }));
      setMessage(null);

      try {
        const selectedGroup = groups.find(g => g.id === Number(form.groupId));
        if (!selectedGroup) {
          setDrivers([]);
          setMessage({
            type: "info",
            text: "Aucun groupe sélectionné ou groupe introuvable.",
          });
          return;
        }

        const filteredDrivers = allDrivers
          .filter(driver => {
            const driverGroup = driver.attributes?.group?.trim();
            return driverGroup && driverGroup === selectedGroup.name.trim();
          })
          .map(driver => ({
            id: driver.id,
            name: driver.name || "Nom inconnu",
            uniqueId: driver.uniqueId || "",
            attributes: driver.attributes || {}
          }));

        setDrivers(filteredDrivers);

        if (filteredDrivers.length === 0) {
          setMessage({
            type: "info",
            text: `Aucun chauffeur trouvé pour le groupe "${selectedGroup.name}".`,
          });
        }
      } catch (err) {
        console.error("Erreur de filtrage des chauffeurs:", err);
        setMessage({
          type: "error",
          text: `Échec du filtrage des chauffeurs: ${err.message}`,
        });
      } finally {
        setLoading(prev => ({ ...prev, drivers: false }));
      }
    };

    if (allDrivers.length > 0 && groups.length > 0) {
      filterDriversByGroup();
    }
  }, [form.groupId, groups, allDrivers]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleArchive = async () => {
    if (!isEditMode) return;
    setLoading(prev => ({ ...prev, form: true }));
    setMessage(null);

    try {
      await axios.put(
        `${TRACCAR_API}/devices/${state.vehicleToEdit.id}`,
        {
          id: state.vehicleToEdit.id,
          name: form.name,
          uniqueId: form.uniqueId,
          groupId: Number(form.groupId) || 0,
          category: form.category || null,
          phone: form.phone || null,
          model: form.model || null,
          contact: form.contact || null,
          attributes: {
            ...state.vehicleToEdit.attributes,
            chauffeur: form.chauffeur,
            archived: true,
          },
        },
        {
          auth: TRACCAR_AUTH,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      setMessage({
        type: "success",
        text: `Véhicule "${form.name}" archivé avec succès`,
      });
      setTimeout(() => navigate("/VehiculesAvecCapteurSA"), 2000);
    } catch (err) {
      console.error("Erreur lors de l'archivage:", err);
      setMessage({
        type: "error",
        text: `Échec de l'archivage: ${err.response?.data?.message || err.message}`,
      });
    } finally {
      setLoading(prev => ({ ...prev, form: false }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(prev => ({ ...prev, form: true }));
    setMessage(null);

    try {
      const devicePayload = {
        name: form.name,
        uniqueId: form.uniqueId,
        groupId: Number(form.groupId) || 0,
        category: form.category || null,
        phone: form.phone || null,
        model: form.model || null,
        contact: form.contact || null,
        attributes: {
          ...(isEditMode ? state.vehicleToEdit.attributes : {}),
          chauffeur: form.chauffeur,
          archived: form.archived
        },
      };

      if (isEditMode) {
        devicePayload.id = state.vehicleToEdit.id;
        await axios.put(
          `${TRACCAR_API}/devices/${state.vehicleToEdit.id}`,
          devicePayload,
          {
            auth: TRACCAR_AUTH,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        setMessage({
          type: "success",
          text: `Véhicule "${form.name}" mis à jour avec succès`,
        });
      } else {
        await axios.post(
          `${TRACCAR_API}/devices`,
          devicePayload,
          {
            auth: TRACCAR_AUTH,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        setMessage({
          type: "success",
          text: `Véhicule "${form.name}" ajouté avec succès`,
        });
        setForm({
          name: "",
          uniqueId: "",
          chauffeur: "",
          groupId: 0,
          category: "default",
          phone: "",
          model: "",
          contact: "",
          archived: false,
          status: "offline"
        });
      }

      setTimeout(() => navigate("/VehiculesAvecCapteurSA"), 2000);
    } catch (err) {
      console.error("Erreur lors de l'opération:", err);
      setMessage({
        type: "error",
        text: `Échec de l'opération: ${err.response?.data?.message || err.message}`,
      });
    } finally {
      setLoading(prev => ({ ...prev, form: false }));
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const formTitle = isEditMode 
    ? `Modifier le véhicule: ${state?.vehicleToEdit?.name || ''}` 
    : "Ajouter un nouveau véhicule";

  return (
    <div className="dashboard-admin">
      <button className="toggle-btn" onClick={toggleSidebar}>
        {isSidebarOpen ? "✕" : "☰"}
      </button>
      <SidebarSupAdmin isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      <div className="main-content">
        <NavbarSuperAdmin />
        <div className="device-container">
          <div className="device-form-container">
            <div className="device-header">
              <h2>{formTitle}</h2>
              <div className="device-decoration"></div>
            </div>

            {message && (
              <div className={`device-message ${message.type}`}>
                <span className="message-icon">
                  {message.type === "success" ? "✅" : 
                   message.type === "error" ? "❌" : "ℹ️"}
                </span>
                <p>{message.text}</p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="device-form-section">
                <h3 className="section-title">Informations principales</h3>
                <div className="form-grid">
                  <div className="device-form-group">
                    <label className="required-field">Nom</label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={form.name}
                      onChange={handleChange}
                      disabled={loading.form}
                    />
                  </div>

                  <div className="device-form-group">
                    <label className="required-field">Identifiant unique</label>
                    <input
                      type="text"
                      name="uniqueId"
                      required
                      value={form.uniqueId}
                      onChange={handleChange}
                      disabled={loading.form}
                    />
                    <span className="input-hint">IMEI ou autre identifiant unique</span>
                  </div>

                  <div className="device-form-group">
                    <label>Groupe</label>
                    {loading.groups ? (
                      <div className="loading-placeholder">
                        Chargement des groupes...
                      </div>
                    ) : (
                      <select
                        name="groupId"
                        value={form.groupId}
                        onChange={handleChange}
                        disabled={groups.length === 0 || loading.form}
                      >
                        <option value="0">Aucun groupe</option>
                        {groups.map((group) => (
                          <option key={group.id} value={group.id}>
                            {group.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="device-form-group">
                    <label>Chauffeur</label>
                    {loading.drivers ? (
                      <div className="loading-placeholder">
                        Chargement des chauffeurs...
                      </div>
                    ) : (
                      <select
                        name="chauffeur"
                        value={form.chauffeur}
                        onChange={handleChange}
                        disabled={drivers.length === 0 || loading.form}
                      >
                        <option value="">Sélectionner un chauffeur</option>
                        {drivers.map((driver) => (
                          <option key={driver.id} value={driver.name}>
                            {driver.name} ({driver.uniqueId})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </div>

              <div className="device-form-section">
                <h3 className="section-title">Informations complémentaires</h3>
                <div className="form-grid">
                  <div className="device-form-group">
                    <label>Catégorie</label>
                    <input
                      type="text"
                      name="category"
                      value={form.category}
                      onChange={handleChange}
                      disabled={loading.form}
                    />
                  </div>

                  <div className="device-form-group">
                    <label>Modèle</label>
                    <input
                      type="text"
                      name="model"
                      value={form.model}
                      onChange={handleChange}
                      disabled={loading.form}
                    />
                  </div>

                  <div className="device-form-group">
                    <label>Téléphone (SIM)</label>
                    <input
                      type="text"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      disabled={loading.form}
                    />
                  </div>

                  <div className="device-form-group">
                    <label>Contact</label>
                    <input
                      type="text"
                      name="contact"
                      value={form.contact}
                      onChange={handleChange}
                      disabled={loading.form}
                    />
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  disabled={loading.form}
                  className="device-submit-btn"
                >
                  {loading.form ? (
                    <>
                      <svg
                        className="loading-spinner"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Envoi en cours...
                    </>
                  ) : isEditMode ? "Mettre à jour" : "Ajouter le véhicule"}
                </button>
                {isEditMode && (
                  <button
                    type="button"
                    className="vehicle-btn archive"
                    onClick={handleArchive}
                    disabled={loading.form}
                  >
                    Archiver
                  </button>
                )}
                <button
                  type="button"
                  className="vehicle-btn secondary"
                  onClick={() => navigate("/VehiculesAvecCapteurSA")}
                  disabled={loading.form}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddDeviceForm;