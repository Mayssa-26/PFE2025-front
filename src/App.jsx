import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./Authentification/AuthContext.jsx";
import Register from './register/Register.jsx';
import Login from "./LogForm/Login.jsx";
import DashAdmin from './dashboardAdmin/dashAdmin.jsx';
import RegisterCar from './dashboardAdmin/RegisterCar.jsx';
import DemandesTable from "./dashboardSuperAdmin/Demandes.jsx";
import VehCap from './dashboardAdmin/VehCapteurs.jsx';
import VehicleRoute from './dashboardAdmin/map.jsx';
import PrivateRoute from './Authentification/PrivateRoute.jsx';
import StaticRouteMap from './dashboardAdmin/trajet.jsx';
import VehicleReport from "./dashboardAdmin/charts.jsx";
import OnlineVehicles from "./dashboardAdmin/OnlineVeh.jsx";
import OfflineVehicles from "./dashboardAdmin/OfflineVeh.jsx";
import { ThemeProvider } from "./dashboardAdmin/ThemeContext.jsx";
import './index.css';
import DashSuperAdmin from "./dashboardSuperAdmin/dashSuperAdmin.jsx";
import VehiculesSansCapteur from "./dashboardSuperAdmin/VehSansCapteur.jsx";
import VehiculesSansCapteurSA from "./dashboardSuperAdmin/VehSansCapteur.jsx";
import VehCapSupAdmin from "./dashboardSuperAdmin/VehCapteurs.jsx";
import VehicleRouteSA from "./dashboardSuperAdmin/map.jsx";
import TousAdmins from "./dashboardSuperAdmin/Admins.jsx";
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<Login />} />
            <Route path="/dashAdmin" element={
              <PrivateRoute allowedRoles={['Admin']}>
                <DashAdmin />
              </PrivateRoute>
            } />
            <Route path="/dashboardSuperAdmin" element={
              <PrivateRoute allowedRoles={['superAdmin']}>
                <DashSuperAdmin />
              </PrivateRoute>
            } />
            <Route path="/registerCar" element={<PrivateRoute><RegisterCar /></PrivateRoute>} />
            <Route path="/VehiculesAvecCapteur" element={<PrivateRoute><VehCap /></PrivateRoute>} />
            <Route path="/VehiculesSansCapteur" element={<PrivateRoute><VehiculesSansCapteur /></PrivateRoute>} />
            <Route path="/VehiculesAvecCapteurSA" element={<PrivateRoute><VehCapSupAdmin /></PrivateRoute>} />
            <Route path="/VehiculesSansCapteurSA" element={<PrivateRoute><VehiculesSansCapteurSA /></PrivateRoute>} />
            <Route path="/demandes" element={<DemandesTable />} />
            <Route path="/map" element={<VehicleRoute />} />
            <Route path="/trajet" element={<StaticRouteMap />} />
            <Route path="/charts/:id" element={<VehicleReport />} />
            <Route path="/OnlineVeh" element={<OnlineVehicles />} />
            <Route path="/OfflineVeh" element={<OfflineVehicles />} />
            <Route path="/mapSA" element={<PrivateRoute><VehicleRouteSA /></PrivateRoute>} />
            <Route path="/Admins" element={<PrivateRoute><TousAdmins /></PrivateRoute>} />
            
            {/* <Route path="*" element={<Navigate to="/" replace />} /> */}
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
