"use client"

import { useEffect, useRef, useState } from "react"
import { useLocation } from "react-router-dom"
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import "./trajet.css"

const StaticRouteMap = () => {
  // All existing state variables remain the same
  const location = useLocation()
  const mapRef = useRef(null)
  const autocompleteRef = useRef(null)
  const [mapError, setMapError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [positions, setPositions] = useState([])
  const [showIdealRoute, setShowIdealRoute] = useState(false)
  const [directionsRenderer, setDirectionsRenderer] = useState(null)
  const [realRoute, setRealRoute] = useState(null)
  const [longestStopMarker, setLongestStopMarker] = useState(null)
  const [showLongestStop, setShowLongestStop] = useState(false)
  const [map, setMap] = useState(null)
  const [address, setAddress] = useState("")
  const [geofenceResult, setGeofenceResult] = useState(null)
  const [isCheckingGeofence, setIsCheckingGeofence] = useState(false)
  const [addressMarker, setAddressMarker] = useState(null)
  const [showActivityReport, setShowActivityReport] = useState(false)
  const [activeTab, setActiveTab] = useState("general")
  const [activityStats, setActivityStats] = useState({
    totalDistance: 0,
    totalTime: 0,
    extendedStops: [],
    speedData: [],
    averageSpeed: 0,
    maxSpeed: 0,
    startTime: null,
    endTime: null,
    movementData: [], // Pour stocker les données de déplacement pour le graphique
    stopsData: [], // Pour un graphique en secteurs des temps d'arrêt
    timeDistribution: [] // Pour un graphique en barres de la distribution du temps
  })

  useEffect(() => {
    if (location.state?.positions) {
      const positionsWithTimestamps = location.state.positions.map((pos, index) => {
        if (!pos.timestamp) {
          const estimatedTime = new Date()
          estimatedTime.setSeconds(estimatedTime.getSeconds() + index * 5)
          return { ...pos, timestamp: estimatedTime.toISOString() }
        }
        return pos
      })
      setPositions(positionsWithTimestamps)
    } else {
      setMapError("Aucune donnée de trajet disponible")
      setLoading(false)
    }
  }, [location.state])

  useEffect(() => {
    if (positions.length === 0) return
    setLoading(true)
    setMapError(null)

    const validPositions = positions.filter(
      (pos) => pos.latitude !== undefined && pos.longitude !== undefined && !isNaN(pos.latitude) && !isNaN(pos.longitude),
    )

    if (validPositions.length === 0) {
      setLoading(false)
      setMapError("Coordonnées GPS invalides")
      return
    }

    const initMap = () => {
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        zoom: 14,
        center: { lat: validPositions[0].latitude, lng: validPositions[0].longitude },
        mapTypeId: "roadmap",
      })

      setMap(mapInstance)

      const routePath = validPositions.map((pos) => ({ lat: pos.latitude, lng: pos.longitude }))

      const newRealRoute = new window.google.maps.Polyline({
        path: routePath,
        geodesic: true,
        strokeColor: "#007bff",
        strokeOpacity: 0.8,
        strokeWeight: 4,
        icons: [{
          icon: {
            path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            strokeColor: "#007bff",
            fillColor: "#007bff",
            fillOpacity: 1,
            scale: 3,
          },
          offset: "100%",
          repeat: "100px",
        }],
        map: mapInstance,
      })

      setRealRoute(newRealRoute)

      new window.google.maps.Marker({
        position: { lat: validPositions[0].latitude, lng: validPositions[0].longitude },
        map: mapInstance,
        title: "Départ",
        icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 8, fillColor: "#28a745", fillOpacity: 1, strokeColor: "#ffffff", strokeWeight: 2 },
      })

      new window.google.maps.Marker({
        position: { lat: validPositions[validPositions.length - 1].latitude, lng: validPositions[validPositions.length - 1].longitude },
        map: mapInstance,
        title: "Arrivée",
        icon: { path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW, scale: 6, fillColor: "#dc3545", fillOpacity: 1, strokeColor: "#ffffff", strokeWeight: 2 },
      })

      setLoading(false)

      // Initialize autocomplete after map is ready
      if (autocompleteRef.current) {
        new window.google.maps.places.Autocomplete(autocompleteRef.current, { types: ["geocode"] })
      }
    }

    if (!window.google) {
      const script = document.createElement("script")
      script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=geometry,directions,places`
      script.async = true
      script.defer = true
      script.onload = initMap
      script.onerror = () => {
        setMapError("Erreur de chargement de Google Maps")
        setLoading(false)
      }
      document.body.appendChild(script)

      return () => {
        if (script && document.body.contains(script)) {
          document.body.removeChild(script)
        }
      }
    } else {
      initMap()
    }
  }, [positions])

  const calculateActivityStats = () => {
    if (!window.google || positions.length < 2) return;

    // Calcul de la distance totale
    let totalDistance = 0;
    const speedData = [];
    const movementData = [];
    let totalSpeed = 0;
    let maxSpeed = 0;
    let speedCount = 0;

    // Pour les totaux de temps
    let movingTime = 0;
    let stoppedTime = 0;
    let totalTime = 0;

    // Définir un seuil pour le mouvement (50m entre deux points pour être considéré en mouvement)
    const movementThreshold = 50; // en mètres
    const timeWindows = {
      "00h-04h": 0,
      "04h-08h": 0,
      "08h-12h": 0,
      "12h-16h": 0,
      "16h-20h": 0,
      "20h-00h": 0
    };

    for (let i = 1; i < positions.length; i++) {
      const prevPos = positions[i-1];
      const currPos = positions[i];

      if (!prevPos.latitude || !prevPos.longitude || !currPos.latitude || !currPos.longitude) continue;
      if (!prevPos.timestamp || !currPos.timestamp) continue;

      const distance = window.google.maps.geometry.spherical.computeDistanceBetween(
        new window.google.maps.LatLng(prevPos.latitude, prevPos.longitude),
        new window.google.maps.LatLng(currPos.latitude, currPos.longitude)
      );

      totalDistance += distance;

      // Calcul de la vitesse et du temps
      const currTime = new Date(currPos.timestamp);
      const prevTime = new Date(prevPos.timestamp);
      const timeDiff = (currTime - prevTime) / 1000; // en secondes

      // Pour la distribution du temps par tranche horaire
      const hour = currTime.getHours();
      if (hour >= 0 && hour < 4) timeWindows["00h-04h"] += timeDiff;
      else if (hour >= 4 && hour < 8) timeWindows["04h-08h"] += timeDiff;
      else if (hour >= 8 && hour < 12) timeWindows["08h-12h"] += timeDiff;
      else if (hour >= 12 && hour < 16) timeWindows["12h-16h"] += timeDiff;
      else if (hour >= 16 && hour < 20) timeWindows["16h-20h"] += timeDiff;
      else timeWindows["20h-00h"] += timeDiff;

      // Données pour le graphique de vitesse
      if (timeDiff > 0) {
        const speed = (distance / 1000) / (timeDiff / 3600); // km/h
        speedData.push({
          time: formatTime(currTime),
          speed: Math.round(speed * 10) / 10
        });

        // Pour le graphique de mouvement
        movementData.push({
          time: formatTime(currTime),
          distance: Math.round((distance / 1000) * 100) / 100, // en km, arrondi à 2 décimales
          speed: Math.round(speed * 10) / 10
        });

        // Mise à jour des statistiques de vitesse
        totalSpeed += speed;
        speedCount++;
        if (speed > maxSpeed) maxSpeed = speed;

        // Identifier si on est en mouvement ou à l'arrêt
        if (distance > movementThreshold) {
          movingTime += timeDiff;
        } else {
          stoppedTime += timeDiff;
        }

        totalTime += timeDiff;
      }
    }

    // Détection des arrêts prolongés (>30min)
    const extendedStops = [];
    let currentStop = null;

    for (let i = 1; i < positions.length; i++) {
      const prevPos = positions[i-1];
      const currPos = positions[i];

      if (!prevPos.latitude || !prevPos.longitude || !currPos.latitude || !currPos.longitude) continue;
      if (!prevPos.timestamp || !currPos.timestamp) continue;

      const distance = window.google.maps.geometry.spherical.computeDistanceBetween(
        new window.google.maps.LatLng(prevPos.latitude, prevPos.longitude),
        new window.google.maps.LatLng(currPos.latitude, currPos.longitude)
      );

      if (distance < 50) { // Arrêt détecté (moins de 50m de déplacement)
        if (!currentStop) {
          currentStop = {
            startTime: new Date(prevPos.timestamp),
            position: prevPos,
            pointCount: 1,
            address: "Recherche en cours..." // On pourrait faire un géocodage inverse ici
          };
        }
        currentStop.endTime = new Date(currPos.timestamp);
        currentStop.pointCount++;
      } else {
        if (currentStop) {
          const duration = (currentStop.endTime - currentStop.startTime) / 60000; // en minutes
          if (duration > 30) { // Seulement les arrêts >30min
            const centerLat = currentStop.position.latitude;
            const centerLng = currentStop.position.longitude;

            extendedStops.push({
              ...currentStop,
              duration,
              center: {
                lat: centerLat,
                lng: centerLng
              }
            });

            // Géocodage inverse pour obtenir l'adresse
            if (window.google && window.google.maps && window.google.maps.Geocoder) {
              const geocoder = new window.google.maps.Geocoder();
              geocoder.geocode({
                location: { lat: centerLat, lng: centerLng }
              }, (results, status) => {
                if (status === "OK" && results[0]) {
                  const stopIndex = extendedStops.findIndex(stop =>
                    stop.center.lat === centerLat && stop.center.lng === centerLng
                  );
                  if (stopIndex !== -1) {
                    const updatedStops = [...extendedStops];
                    updatedStops[stopIndex] = {
                      ...updatedStops[stopIndex],
                      address: results[0].formatted_address
                    };
                    setActivityStats(prevStats => ({
                      ...prevStats,
                      extendedStops: updatedStops
                    }));
                  }
                }
              });
            }
          }
          currentStop = null;
        }
      }
    }

    // Préparation des données pour le graphique circulaire de la répartition du temps
    const stopsData = [
      { name: 'En mouvement', value: Math.round(movingTime) }, // en minutes
      { name: 'À l\'arrêt', value: Math.round(stoppedTime) } // en minutes
    ];

    // Préparation des données pour le graphique en barres de la distribution du temps
    const timeDistribution = Object.keys(timeWindows).map(key => ({
      period: key,
      minutes: Math.round(timeWindows[key] / 60)
    }));

    // Calcul du temps total et des heures
    let startTime = null;
    let endTime = null;

    if (positions.length > 1 && positions[0].timestamp && positions[positions.length-1].timestamp) {
      startTime = new Date(positions[0].timestamp);
      endTime = new Date(positions[positions.length-1].timestamp);
      totalTime = (endTime - startTime) / 60000; // Convertir en minutes
    }

    setActivityStats({
      totalDistance: totalDistance / 1000, // Convertir en km
      totalTime,
      extendedStops,
      speedData: speedData.filter((_, i) => i % 3 === 0), // Réduire les points pour le graphique
      movementData: movementData.filter((_, i) => i % 3 === 0), // Réduire les points pour le graphique
      stopsData,
      timeDistribution,
      averageSpeed: speedCount > 0 ? (totalSpeed / speedCount) : 0,
      maxSpeed,
      startTime,
      endTime,
      movingTime: movingTime / 60, // en minutes
      stoppedTime: stoppedTime / 60 // en minutes
    });
  };

  useEffect(() => {
    if (!window.google || !realRoute || positions.length === 0) return

    const validPositions = positions.filter((pos) => !isNaN(pos.latitude) && !isNaN(pos.longitude))

    if (showIdealRoute) {
      const directionsService = new window.google.maps.DirectionsService()
      const newDirectionsRenderer = new window.google.maps.DirectionsRenderer({
        map: realRoute.getMap(),
        polylineOptions: { strokeColor: "#28a745", strokeOpacity: 1.0, strokeWeight: 4 },
        suppressMarkers: true,
      })

      const request = {
        origin: new window.google.maps.LatLng(validPositions[0].latitude, validPositions[0].longitude),
        destination: new window.google.maps.LatLng(validPositions[validPositions.length - 1].latitude, validPositions[validPositions.length - 1].longitude),
        travelMode: window.google.maps.TravelMode.DRIVING,
      }

      directionsService.route(request, (result, status) => {
        if (status === "OK") {
          newDirectionsRenderer.setDirections(result)
          setDirectionsRenderer(newDirectionsRenderer)
        } else {
          console.warn("Erreur trajet idéal:", status)
        }
      })
    } else if (directionsRenderer) {
      directionsRenderer.setMap(null)
      setDirectionsRenderer(null)
    }
  }, [showIdealRoute, realRoute, positions])

  const handleShowIdealRoute = () => setShowIdealRoute((prev) => !prev)

  const toggleLongestStop = () => {
    if (!map || !window.google) return

    if (!showLongestStop) {
      const stop = findStopsBasedOnDensity()
      if (stop && stop.position) {
        const minutes = Math.floor(stop.duration / 60000)
        const seconds = Math.floor((stop.duration % 60000) / 1000)
        const pointCount = stop.pointCount

        const marker = new window.google.maps.Marker({
          position: { lat: stop.position.latitude, lng: stop.position.longitude },
          map: map,
          title: `Arrêt prolongé: environ ${minutes}min ${seconds}s`,
          icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 10, fillColor: "#FFA500", fillOpacity: 1, strokeColor: "#FFFFFF", strokeWeight: 2 },
        })

        const infowindow = new window.google.maps.InfoWindow({
          content: `<div style="padding: 10px;"><strong>Arrêt prolongé</strong><br>Durée estimée: ${minutes}min ${seconds}s<br>Nombre de points: ${pointCount}</div>`,
        })

        marker.addListener("click", () => infowindow.open(map, marker))
        infowindow.open(map, marker)
        setLongestStopMarker(marker)
      } else {
        alert("Aucun arrêt prolongé détecté dans ce trajet")
      }
    } else if (longestStopMarker) {
      longestStopMarker.setMap(null)
      setLongestStopMarker(null)
    }

    setShowLongestStop(!showLongestStop)
  }

  const findStopsBasedOnDensity = () => {
    if (!window.google || positions.length < 10) return null

    const clusters = []
    let currentCluster = [positions[0]]

    for (let i = 1; i < positions.length; i++) {
      const prevPos = positions[i - 1]
      const currPos = positions[i]
      if (!prevPos.latitude || !prevPos.longitude || !currPos.latitude || !currPos.longitude) continue

      const distance = window.google.maps.geometry.spherical.computeDistanceBetween(
        new window.google.maps.LatLng(prevPos.latitude, prevPos.longitude),
        new window.google.maps.LatLng(currPos.latitude, currPos.longitude),
      )

      if (distance < 50) {
        currentCluster.push(currPos)
      } else {
        if (currentCluster.length > 5) clusters.push([...currentCluster])
        currentCluster = [currPos]
      }
    }

    if (currentCluster.length > 5) clusters.push(currentCluster)

    let largestCluster = null
    let maxSize = 0
    for (const cluster of clusters) {
      if (cluster.length > maxSize) {
        maxSize = cluster.length
        largestCluster = cluster
      }
    }

    if (largestCluster) {
      const centerLat = largestCluster.reduce((sum, pos) => sum + pos.latitude, 0) / largestCluster.length
      const centerLng = largestCluster.reduce((sum, pos) => sum + pos.longitude, 0) / largestCluster.length
      return { position: { latitude: centerLat, longitude: centerLng }, duration: largestCluster.length * 5000, pointCount: largestCluster.length }
    }

    return null
  }

  const checkGeofence = async () => {
    if (!address.trim()) {
      setGeofenceResult("Veuillez entrer une adresse à vérifier");
      return;
    }
    if (!map || !window.google) {
      setGeofenceResult("La carte n'est pas prête");
      return;
    }

    setIsCheckingGeofence(true);
    setGeofenceResult(null);

    if (addressMarker) addressMarker.setMap(null);

    const geocoder = new window.google.maps.Geocoder();

    try {
      const geocodeResponse = await new Promise((resolve, reject) => {
        geocoder.geocode({ address: address }, (results, status) => {
          status === "OK" ? resolve(results) : reject(new Error("Impossible de trouver cette adresse"));
        });
      });

      const location = geocodeResponse[0].geometry.location;

      const marker = new window.google.maps.Marker({
        position: location,
        map: map,
        title: address,
        icon: {
          path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
          scale: 6,
          fillColor: "#ffc107",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2
        }
      });

      setAddressMarker(marker);

      const stop = findStopsBasedOnDensity();
      if (stop && stop.position) {
        const stopLatLng = new window.google.maps.LatLng(stop.position.latitude, stop.position.longitude);
        const distance = window.google.maps.geometry.spherical.computeDistanceBetween(location, stopLatLng);

        if (distance <= 1000) {
          setGeofenceResult(`✅ L'adresse est dans un rayon de 1km de l'arrêt prolongé. (Distance: ${distance.toFixed(2)} m)`);
        } else {
          setGeofenceResult(`❌ L'adresse est en dehors du rayon de 1km. (Distance: ${distance.toFixed(2)} m)`);
        }
      } else {
        setGeofenceResult("Aucun arrêt prolongé détecté pour vérifier la distance.");
      }
    } catch (error) {
      setGeofenceResult(error.message);
    } finally {
      setIsCheckingGeofence(false);
    }
  }

  const handleViewActivity = () => {
    if (!showActivityReport) {
      calculateActivityStats();
    }
    setShowActivityReport(!showActivityReport);
  }

  // Formater le temps en heures et minutes
  const formatTime = (date) => {
    if (!date) return "N/A";
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Formater la date
  const formatDate = (date) => {
    if (!date) return "N/A";
    return date.toLocaleDateString();
  };

  // Formater la durée en heures et minutes
  const formatDuration = (minutes) => {
    if (!minutes) return "N/A";
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return `${hours}h ${mins}min`;
  };

  // Couleurs pour les graphiques
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  return (
    <div className="trajet-container">
      <h1 className="trajet-title">Planification de Trajet</h1>

      <div className="top-bar">
        <div className="address-section">
          <input
            className="address-input"
            ref={autocompleteRef}
            type="text"
            placeholder="Entrez une adresse"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
          <button className="geofence-check-btn" onClick={checkGeofence} disabled={isCheckingGeofence}>
            Vérifier
          </button>
        </div>

        <div className="button-container2">
          <button className="geofence-check-btn" onClick={handleShowIdealRoute}>
            {showIdealRoute ? "Masquer" : "Afficher"} le trajet idéal
          </button>
          <button className="geofence-check-btn" onClick={toggleLongestStop}>
            {showLongestStop ? "Masquer" : "Afficher"} l'arrêt prolongé
          </button>
        </div>
      </div>

      <div className="map-container" ref={mapRef} style={{ height: "500px", width: "100%" }} />
      {geofenceResult && <p className="geofence-result">{geofenceResult}</p>}
      {loading && <p className="loading">Chargement de la carte...</p>}
      {mapError && <p className="error-message">{mapError}</p>}

      {/* Popup Modal pour le rapport d'activité avec graphiques */}
      {showActivityReport && (
        <div className="activity-modal-overlay" style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000,
          animation: "fadeIn 0.3s ease-out"
        }}>
          <div className="activity-modal" style={{
            backgroundColor: "#fff",
            borderRadius: "8px",
            padding: "20px",
            width: "90%",
            maxWidth: "1000px",
            maxHeight: "90vh",
            overflowY: "auto",
            boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
            position: "relative",
            animation: "slideIn 0.4s ease-out"
          }}>
            <button
              onClick={handleViewActivity}
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                background: "none",
                border: "none",
                fontSize: "22px",
                cursor: "pointer",
                padding: "5px 10px"
              }}
            >
              ✖
            </button>

            <h2 style={{ color: "#007bff", marginBottom: "15px", borderBottom: "2px solid #f0f0f0", paddingBottom: "10px" }}>
              Rapport d'activité du trajet
            </h2>

            {/* Navigation par onglets */}
            <div style={{ display: "flex", borderBottom: "1px solid #ddd", marginBottom: "20px" }}>
              <button
                style={{
                  padding: "10px 20px",
                  border: "none",
                  backgroundColor: activeTab === "general" ? "#007bff" : "#f8f9fa",
                  color: activeTab === "general" ? "#fff" : "#555",
                  borderTopLeftRadius: "4px",
                  borderTopRightRadius: "4px",
                  cursor: "pointer",
                  margin: "0 5px 0 0"
                }}
                onClick={() => setActiveTab("general")}
              >
                Général
              </button>
              <button
                style={{
                  padding: "10px 20px",
                  border: "none",
                  backgroundColor: activeTab === "vitesse" ? "#007bff" : "#f8f9fa",
                  color: activeTab === "vitesse" ? "#fff" : "#555",
                  borderTopLeftRadius: "4px",
                  borderTopRightRadius: "4px",
                  cursor: "pointer",
                  margin: "0 5px"
                }}
                onClick={() => setActiveTab("vitesse")}
              >
                Vitesse & Mouvement
              </button>
              <button
                style={{
                  padding: "10px 20px",
                  border: "none",
                  backgroundColor: activeTab === "arrets" ? "#007bff" : "#f8f9fa",
                  color: activeTab === "arrets" ? "#fff" : "#555",
                  borderTopLeftRadius: "4px",
                  borderTopRightRadius: "4px",
                  cursor: "pointer",
                  margin: "0 5px"
                }}
                onClick={() => setActiveTab("arrets")}
              >
                Arrêts
              </button>
            </div>

            {/* Onglet Général */}
            {activeTab === "general" && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
                  <div style={{ backgroundColor: "#f8f9fa", padding: "15px", borderRadius: "6px" }}>
                    <h3 style={{ fontSize: "18px", marginBottom: "15px", color: "#555" }}>Informations générales</h3>
                    <p style={{ marginBottom: "8px" }}><strong>Date du trajet:</strong> {formatDate(activityStats.startTime)}</p>
                    <p style={{ marginBottom: "8px" }}><strong>Heure de départ:</strong> {formatTime(activityStats.startTime)}</p>
                    <p style={{ marginBottom: "8px" }}><strong>Heure d arrivée:</strong> {formatTime(activityStats.endTime)}</p>
                    <p style={{ marginBottom: "8px" }}><strong>Durée totale:</strong> {formatDuration(activityStats.totalTime)}</p>
                    <p style={{ marginBottom: "8px" }}><strong>Distance parcourue:</strong> {activityStats.totalDistance.toFixed(2)} km</p>
                    <p style={{ marginBottom: "8px" }}><strong>Vitesse moyenne:</strong> {activityStats.averageSpeed.toFixed(2)} km/h</p>
                    <p style={{ marginBottom: "8px" }}><strong>Vitesse maximale:</strong> {activityStats.maxSpeed.toFixed(2)} km/h</p>
                  </div>

                  <div style={{ backgroundColor: "#f8f9fa", padding: "15px", borderRadius: "6px" }}>
                    <h3 style={{ fontSize: "18px", marginBottom: "15px", color: "#555" }}>Répartition du temps</h3>
                    <div style={{ height: "250px" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={activityStats.stopsData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {
                              activityStats.stopsData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))
                            }
                          </Pie>
                          <Tooltip formatter={(value) => `${value} min`} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div style={{ backgroundColor: "#f8f9fa", padding: "15px", borderRadius: "6px", marginBottom: "20px" }}>
                  <h3 style={{ fontSize: "18px", marginBottom: "15px", color: "#555" }}>Distribution du temps par période</h3>
                  <div style={{ height: "250px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={activityStats.timeDistribution}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" />
                        <YAxis label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }} />
                        <Tooltip formatter={(value) => `${value} min`} />
                        <Legend />
                        <Bar dataKey="minutes" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* Onglet Vitesse & Mouvement */}
            {activeTab === "vitesse" && (
              <div>
                <div style={{ backgroundColor: "#f8f9fa", padding: "15px", borderRadius: "6px", marginBottom: "20px" }}>
                  <h3 style={{ fontSize: "18px", marginBottom: "15px", color: "#555" }}>Vitesse au cours du temps</h3>
                  <div style={{ height: "300px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={activityStats.speedData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis label={{ value: 'Vitesse (km/h)', angle: -90, position: 'insideLeft' }} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="speed" stroke="#8884d8" name="Vitesse" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div style={{ backgroundColor: "#f8f9fa", padding: "15px", borderRadius: "6px", marginBottom: "20px" }}>
                  <h3 style={{ fontSize: "18px", marginBottom: "15px", color: "#555" }}>Distance parcourue par intervalle de temps</h3>
                  <div style={{ height: "300px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={activityStats.movementData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis label={{ value: 'Distance (km)', angle: -90, position: 'insideLeft' }} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="distance" stroke="#00c49f" name="Distance" />
                      </LineChart></ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* Onglet Arrêts */}
            {activeTab === "arrets" && (
              <div>
                {activityStats.extendedStops.length > 0 ? (
                  activityStats.extendedStops.map((stop, index) => (
                    <div key={index} style={{ backgroundColor: "#f8f9fa", padding: "15px", borderRadius: "6px", marginBottom: "20px" }}>
                      <h3 style={{ fontSize: "18px", marginBottom: "15px", color: "#555" }}>Arrêt {index + 1}</h3>
                      <p style={{ marginBottom: "8px" }}><strong>Début:</strong> {formatTime(stop.startTime)}</p>
                      <p style={{ marginBottom: "8px" }}><strong>Fin:</strong> {formatTime(stop.endTime)}</p>
                      <p style={{ marginBottom: "8px" }}><strong>Durée:</strong> {formatDuration(stop.duration)}</p>
                      <p style={{ marginBottom: "8px" }}><strong>Adresse:</strong> {stop.address}</p>
                    </div>
                  ))
                ) : (
                  <p>Aucun arrêt prolongé détecté.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="button-container">
        <button className="view-activity-btn" onClick={handleViewActivity}>
          {showActivityReport ? "Masquer" : "Afficher"} le rapport d'activité
        </button>
      </div>
    </div>
  );
};

export default StaticRouteMap;