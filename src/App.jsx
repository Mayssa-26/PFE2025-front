import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./Authentification/AuthContext.jsx";
import Register from './register/Register.jsx';
import Login from "./LogForm/Login.jsx";
import DashAdmin from './dashboardAdmin/dashAdmin.jsx';
import DemandesTable from "./dashboardSuperAdmin/Demandes.jsx";
import VehCap from './dashboardAdmin/VehCapteurs.jsx';
import VehicleRoute from './dashboardAdmin/map.jsx';
import PrivateRoute from './Authentification/PrivateRoute.jsx';
import StaticRouteMap from './dashboardAdmin/Trajet.jsx';
import VehicleReport from "./dashboardAdmin/charts.jsx";
import OnlineVehicles from "./dashboardAdmin/OnlineVeh.jsx";
import OfflineVehicles from "./dashboardAdmin/OfflineVeh.jsx";
import { ThemeProvider } from "./dashboardAdmin/ThemeContext.jsx";
import './index.css';
import DashSuperAdmin from "./dashboardSuperAdmin/dashSuperAdmin.jsx";
import VehiculesSansCapteur from "./dashboardAdmin/VehSansCapteur.jsx";
import VehiculesSansCapteurSA from "./dashboardSuperAdmin/VehSansCapteur.jsx";
import VehCapSupAdmin from "./dashboardSuperAdmin/VehCapteurs.jsx";
import VehicleRouteSA from "./dashboardSuperAdmin/map.jsx";
import TousAdmins from "./dashboardSuperAdmin/Admins.jsx";
import UserProfile from "./dashboardAdmin/Profil.jsx";
//import AdminReportsDashboard from "./dashboardSuperAdmin/Reports.jsx";
import PasswordChange from "./dashboardAdmin/ModifPass.jsx";
import AddVehicle from "./dashboardSuperAdmin/AjoutVeh.jsx";
import GroupeTable from "./dashboardSuperAdmin/TableGroups.jsx";
import AddGroup from "./dashboardSuperAdmin/AjoutGroupe.jsx";
import SAProfile from "./dashboardSuperAdmin/ProfilSA.jsx";
import { NotificationProvider } from "./dashboardSuperAdmin/NotificationContext";
import AdvancedTraccarChatbot from "./dashboardSuperAdmin/chatBot.jsx";
import AddDeviceForm from "./dashboardSuperAdmin/AjoutVehiculeTraccar.jsx";
import PasswordChangeSA from "./dashboardSuperAdmin/modifPasswordSA.jsx";
import Drivers from "./dashboardAdmin/Drivers.jsx";
import DriverSA from "./dashboardSuperAdmin/DriversSA.jsx";
function App() {
  return (
    <NotificationProvider>
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
            
            <Route path="/VehiculesAvecCapteur" element={<PrivateRoute><VehCap /></PrivateRoute>} />
            <Route path="/VehiculesAvecCapteurSA" element={<PrivateRoute><VehCapSupAdmin /></PrivateRoute>} />
            <Route path="/VehiculesSansCapteurSA" element={<PrivateRoute><VehiculesSansCapteurSA /></PrivateRoute>} />
            <Route path="/VehiculesSansCapteur" element={<PrivateRoute><VehiculesSansCapteur /> </PrivateRoute>} />
            <Route path="/demandes" element={<DemandesTable />} />
            <Route path="/map" element={<VehicleRoute />} />
            <Route path="/trajet" element={<StaticRouteMap />} />
            <Route path="/charts/:id" element={<VehicleReport />} />
            <Route path="/OnlineVeh" element={<OnlineVehicles />} />
            <Route path="/OfflineVeh" element={<OfflineVehicles />} />
            <Route path="/mapSA" element={<PrivateRoute><VehicleRouteSA /></PrivateRoute>} />
            <Route path="/Admins" element={<PrivateRoute><TousAdmins /></PrivateRoute>} />
            {/* <Route path="/rapport" element={<PrivateRoute><AdminReportsDashboard /></PrivateRoute>} /> */}
            <Route path="/profil" element={<PrivateRoute><UserProfile/></PrivateRoute>} /> 
            <Route path="/modifierPassword" element={<PrivateRoute><PasswordChange/></PrivateRoute>} />
            <Route path="/AjouterVehicule" element={<PrivateRoute><AddVehicle /></PrivateRoute>} />
            <Route path="/TableGroups" element={<PrivateRoute><GroupeTable /></PrivateRoute>} />
            <Route path="/AjouterGroupe" element={<PrivateRoute><AddGroup /></PrivateRoute>} />
            <Route path='/profilSA' element={<PrivateRoute><SAProfile /></PrivateRoute>} />
            {/* <Route path="*" element={<Navigate to="/" replace />} /> */}
            <Route path='/chatbot' element={<PrivateRoute><AdvancedTraccarChatbot /></PrivateRoute>} />
            <Route path='/addVehiculeTraccar' element={<PrivateRoute><AddDeviceForm /></PrivateRoute>} />
            <Route path="/modifierPasswordSA" element={<PrivateRoute><PasswordChangeSA/></PrivateRoute>} />
            <Route path="/drivers" element={<Drivers />} />
            <Route path="/driverSA" element={<DriverSA />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
    </NotificationProvider>

  );
}

export default App;
