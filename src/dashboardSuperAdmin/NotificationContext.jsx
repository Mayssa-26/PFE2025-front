import { createContext, useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [demandes, setDemandes] = useState([]);
  const previousDemandesRef = useRef([]);

  const fetchDemandes = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/pending-registrations");
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      const data = await response.json();
      console.log("Demandes récupérées:", data);

      // Vérifier les nouvelles demandes en attente
      const newDemandes = data.filter(
        (newDemande) =>
          newDemande.status === "enAttente" &&
          !previousDemandesRef.current.some((existing) => existing._id === newDemande._id)
      );
      console.log("Nouvelles demandes en attente:", newDemandes);

      // Ajouter les nouvelles demandes en attente aux notifications
      if (newDemandes.length > 0) {
        setNotifications((prev) => {
          // Éviter les doublons en filtrant les notifications existantes
          const existingIds = new Set(prev.map((notif) => notif.id));
          const newNotifications = newDemandes
            .filter((demande) => !existingIds.has(demande._id))
            .map((demande) => ({
              id: demande._id,
              message: `Nouvelle demande de ${demande.prenom} ${demande.nom}`,
            }));
          return [...prev, ...newNotifications];
        });
      }

      // Mettre à jour les demandes et la référence
      setDemandes(data);
      previousDemandesRef.current = data;
    } catch (error) {
      console.error("Erreur lors de la récupération des demandes:", error.message);
    }
  };

  useEffect(() => {
    console.log("Initialisation du polling pour fetchDemandes");
    fetchDemandes();
    const interval = setInterval(() => {
      console.log("Polling: récupération des demandes");
      fetchDemandes();
    }, 30000);
    return () => {
      console.log("Nettoyage du polling");
      clearInterval(interval);
    };
  }, []);

  const removeNotification = (demandeId) => {
    console.log("Suppression de la notification pour demandeId:", demandeId);
    setNotifications((prev) => prev.filter((notif) => notif.id !== demandeId));
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        demandes,
        fetchDemandes,
        removeNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

NotificationProvider.propTypes = {
  children: PropTypes.node.isRequired,
};