// Pour OnlineVehicles.jsx
import ToutesVoitures from "./VehCapteurs";

const OnlineVehicles = () => (
  <ToutesVoitures
    statusFilter="online"
    title="Véhicules en ligne"
    description="Liste des véhicules actuellement en ligne"
  />
);

export default OnlineVehicles;
