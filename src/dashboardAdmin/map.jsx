import { useEffect, useState, useRef } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import jwt_decode from 'jwt-decode';
import './Map.css';

const containerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '8px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
};

const GOOGLE_MAPS_API_KEY = 'AIzaSyDNX04w1kGf_a6P7UkxNYAkjYS57bj_p34';

function VehicleRoute() {
  const [positions, setPositions] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [adminId, setAdminId] = useState(null);
  const [adminGroupName, setAdminGroupName] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);
  const mapCenterRef = useRef({ lat: 36.8, lng: 10.18 });
  const mapRef = useRef(null);
  const googleRef = useRef(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const sidebarRef = useRef(null);
  const [googleMapsReady, setGoogleMapsReady] = useState(false);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const wsRef = useRef(null);
  const markerRefs = useRef({});

  // WebSocket pour les positions en temps réel
  useEffect(() => {
    wsRef.current = new WebSocket('ws://localhost:8080');

    wsRef.current.onopen = () => console.log('WebSocket connecté');
    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const { deviceId, latitude, longitude } = data;
      setPositions((prev) => {
        const index = prev.findIndex((pos) => pos.deviceId === deviceId);
        if (index !== -1) {
          const updated = [...prev];
          updated[index] = { ...updated[index], latitude, longitude };
          return updated;
        }
        return [...prev, { deviceId, latitude, longitude }];
      });
      if (markerRefs.current[deviceId]) {
        animateMarker(markerRefs.current[deviceId], latitude, longitude);
      }
    };
    wsRef.current.onclose = () => console.log('WebSocket déconnecté');
    wsRef.current.onerror = (error) => console.error('WebSocket error:', error);

    return () => wsRef.current?.close();
  }, []);

  // Récupération des informations de l'admin
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    try {
      const decoded = jwt_decode(token);
      setAdminId(decoded.id);
      setIsAuthenticated(true);

      // Récupérer le groupe de l'admin via l'API
      const fetchAdminGroup = async () => {
        try {
          const response = await axios.get(`api/vehicules/admin/${decoded.id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.data?.success) {
            const groupData = response.data.data[0] || response.data.data;
            const groupName = groupData?.nom || groupData?.name || groupData?.groupName;

            if (groupName) {
              setAdminGroupName(groupName);
            } else {
              setError(`Group name not found in response for admin ${decoded.id}`);
            }
          } else {
            setError(response.data?.message || `No group assigned to admin ${decoded.id}`);
          }
        } catch (apiError) {
          console.error('Error fetching admin group:', apiError);
          setError(`Failed to fetch group: ${apiError.response?.data?.message || apiError.message}`);
        }
      };

      fetchAdminGroup();
    } catch (tokenError) {
      console.error('Erreur token:', tokenError);
      localStorage.removeItem('token');
      navigate('/login');
    }
  }, [navigate]);

  // Récupération des véhicules depuis Traccar
  useEffect(() => {
    if (!adminGroupName || !isAuthenticated) return;

    const fetchVehiclesFromTraccar = async () => {
      setError(null);

      try {
        // 1. Récupérer tous les groupes depuis Traccar
        const groupsResponse = await axios.get('https://yepyou.treetronix.com/api/groups', {
          headers: {
            Authorization: 'Basic ' + btoa('admin:admin'),
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        });

        // 2. Trouver le groupe correspondant exactement au groupe de l'admin
        const matchedGroup = groupsResponse.data.find(
          (group) => group.name.toLowerCase() === adminGroupName.toLowerCase()
        );

        if (!matchedGroup) {
          setVehicles([]);
          setError(`Aucun groupe nommé "${adminGroupName}" trouvé dans Traccar`);
          return;
        }

        // 3. Récupérer uniquement les véhicules de ce groupe spécifique
        const devicesResponse = await axios.get('https://yepyou.treetronix.com/api/devices', {
          params: {
            groupId: matchedGroup.id,
          },
          headers: {
            Authorization: 'Basic ' + btoa('admin:admin'),
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        });

        // 4. Mapper les véhicules
        const mappedVehicles = devicesResponse.data
          .filter((device) => device.groupId === matchedGroup.id)
          .map((device) => ({
            id: device.id,
            name: device.name,
            uniqueId: device.uniqueId,
            status: device.status,
            groupName: adminGroupName,
          }));

        setVehicles(mappedVehicles);

        if (mappedVehicles.length === 0) {
          setError(`Aucun véhicule trouvé dans le groupe "${adminGroupName}"`);
        }
      } catch (err) {
        console.error('Erreur API Traccar:', err);
        setError(err.response?.data?.message || 'Erreur de chargement des véhicules depuis Traccar');
        setVehicles([]);
      }
    };

    fetchVehiclesFromTraccar();
  }, [adminGroupName, isAuthenticated]);

  const handleVehicleClick = (vehicleId) => {
    setSelectedVehicleId(vehicleId);
    const vehiclePos = positions.find((pos) => pos.deviceId === vehicleId);
    if (vehiclePos && mapRef.current) {
      mapRef.current.panTo({
        lat: parseFloat(vehiclePos.latitude),
        lng: parseFloat(vehiclePos.longitude),
      });
    }

    const selectedVehicleElement = sidebarRef.current?.querySelector(`#vehicle-${vehicleId}`);
    if (selectedVehicleElement) {
      selectedVehicleElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  };

  const animateMarker = (marker, newLat, newLng, duration = 1000) => {
    const startPos = marker.getPosition();
    const startLat = startPos.lat();
    const startLng = startPos.lng();
    const deltaLat = newLat - startLat;
    const deltaLng = newLng - startLng;
    let startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const interpolatedLat = startLat + deltaLat * progress;
      const interpolatedLng = startLng + deltaLng * progress;
      marker.setPosition(new window.google.maps.LatLng(interpolatedLat, interpolatedLng));
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  };

  const onGoogleMapsApiLoaded = () => {
    setGoogleMapsReady(true);
    googleRef.current = window.google;
  };

  // Filtrer les véhicules par recherche
  const filteredVehicles = vehicles.filter((vehicle) =>
    vehicle.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ padding: '20px', paddingTop: '50px', margin: '10px', paddingBottom: '50px', backgroundColor: '#d2d2ec' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: '10px 15px',
            backgroundColor: '#ffffff',
            border: '1px solid #ccc',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
            color: 'black',
            marginRight: '20px',
          }}
        >
          ←
        </button>
        <input
          type="text"
          placeholder="Rechercher un véhicule"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: '10px',
            border: '1px solid #ccc',
            borderRadius: '6px',
            width: '200px',
            fontSize: '14px',
          }}
        />
      </div>

      <div style={{ display: 'flex' }}>
        <div
          style={{
            width: '300px',
            backgroundColor: 'rgba(255, 255, 255, 0.49)',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            padding: '15px',
            marginRight: '20px',
            height: '80vh',
            overflowY: 'auto',
          }}
          ref={sidebarRef}
        >
          <h3 style={{ marginBottom: '15px', textAlign: 'center', fontSize: '18px' }}>
            Véhicules
          </h3>
          {error && (
            <div style={{ color: 'red', fontSize: '14px', marginBottom: '10px' }}>
              {error}
            </div>
          )}
          {filteredVehicles.length > 0 ? (
            filteredVehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                id={`vehicle-${vehicle.id}`}
                onClick={() => handleVehicleClick(vehicle.id)}
                style={{
                  cursor: 'pointer',
                  padding: '10px',
                  marginBottom: '10px',
                  borderRadius: '6px',
                  backgroundColor: selectedVehicleId === vehicle.id ? '#e0f7e9' : '#f9f9f9',
                  borderLeft: `5px solid ${vehicle.status === 'online' ? '#4CAF50' : '#aaa'}`,
                }}
              >
                <strong>{vehicle.name}</strong><br />
                <span style={{ fontSize: '13px' }}>
                  <b>ID:</b> {vehicle.uniqueId}
                </span>
                <br />
                <span style={{ fontSize: '13px' }}>
                  <b>Status:</b> {vehicle.status}
                </span>
                <br />
                <span style={{ fontSize: '13px' }}>
                  <b>Groupe:</b> {vehicle.groupName}
                </span>
              </div>
            ))
          ) : (
            <p style={{ fontSize: '13px', color: '#888' }}>
              Aucun véhicule trouvé
            </p>
          )}
        </div>

        <div
          style={{
            flexGrow: 1,
            height: '80vh',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            padding: '5px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY} onLoad={onGoogleMapsApiLoaded}>
            {googleMapsReady && (
              <GoogleMap
                mapContainerStyle={containerStyle}
                center={mapCenterRef.current}
                zoom={13}
                onLoad={(map) => {
                  mapRef.current = map;
                  googleRef.current = window.google;
                }}
                options={{
                  mapTypeId: 'roadmap',
                  mapTypeControl: true,
                  mapTypeControlOptions: googleRef.current
                    ? {
                        style: googleRef.current.maps.MapTypeControlStyle.DEFAULT,
                        position: googleRef.current.maps.ControlPosition.TOP_RIGHT,
                      }
                    : undefined,
                }}
              >
                {positions.map((pos) => (
                  <Marker
                    key={pos.deviceId}
                    position={{
                      lat: parseFloat(pos.latitude),
                      lng: parseFloat(pos.longitude),
                    }}
                    onLoad={(marker) => {
                      markerRefs.current[pos.deviceId] = marker;
                    }}
                    icon={
                      googleRef.current
                        ? {
                            path: googleRef.current.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
                            fillColor: 'red',
                            fillOpacity: 1,
                            strokeColor: '#ffffff',
                            strokeWeight: 2,
                            scale: 8,
                          }
                        : undefined
                    }
                    animation={
                      googleRef.current && pos.deviceId === selectedVehicleId
                        ? googleRef.current.maps.Animation.BOUNCE
                        : undefined
                    }
                    onClick={() => handleVehicleClick(pos.deviceId)}
                  />
                ))}
              </GoogleMap>
            )}
          </LoadScript>
        </div>
      </div>
    </div>
  );
}

export default VehicleRoute;