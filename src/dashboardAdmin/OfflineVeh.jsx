// Pour OfflineVehicles.jsx
import ToutesVoitures from "./VehCapteurs";

const OfflineVehicles = () => (
  <ToutesVoitures
    statusFilter="offline"
    title="Véhicules hors ligne"
    description="Liste des véhicules actuellement hors ligne"
  />
);

export default OfflineVehicles;
