'use client';

import { useEffect, useRef, useState, useMemo } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "./trajet.css";

const detectExtendedStops = async (positions, google, minStopDuration = 5 * 60 * 1000) => {
  if (!google || positions.length < 2) return [];

  const extendedStops = [];
  let currentStop = null;
  const maxDistance = 20; // 20 mètres
  const minPointsForStop = 3; // Minimum 3 points

  // Trier les positions par timestamp
  const sortedPositions = [...positions].sort((a, b) => 
    new Date(a.deviceTime || a.timestamp) - new Date(b.deviceTime || b.timestamp)
  );

  for (let i = 1; i < sortedPositions.length; i++) {
    const prevPos = sortedPositions[i - 1];
    const currPos = sortedPositions[i];

    // Validation des données
    if (!prevPos.latitude || !prevPos.longitude || 
        !currPos.latitude || !currPos.longitude) {
      continue;
    }

    // Utiliser deviceTime si disponible, sinon timestamp
    const prevTime = prevPos.deviceTime || prevPos.timestamp;
    const currTime = currPos.deviceTime || currPos.timestamp;
    
    if (!prevTime || !currTime) continue;

    const timeDiff = new Date(currTime) - new Date(prevTime);
    
    // Ignorer les points trop éloignés dans le temps
    if (timeDiff > 10 * 60 * 1000) { // 10 minutes max entre points
      if (currentStop) {
        finalizeCurrentStop();
      }
      continue;
    }

    const distance = google.maps.geometry.spherical.computeDistanceBetween(
      new google.maps.LatLng(prevPos.latitude, prevPos.longitude),
      new google.maps.LatLng(currPos.latitude, currPos.longitude)
    );

    if (distance < maxDistance) {
      if (!currentStop) {
        currentStop = {
          startTime: new Date(prevTime),
          endTime: new Date(prevTime),
          position: prevPos,
          pointCount: 1,
          address: "Recherche en cours...",
          center: { 
            lat: prevPos.latitude, 
            lng: prevPos.longitude 
          },
          points: [prevPos]
        };
      }
      currentStop.endTime = new Date(currTime);
      currentStop.pointCount++;
      currentStop.points.push(currPos);
      
      // Mise à jour du centre
      currentStop.center.lat = currentStop.points.reduce((sum, p) => sum + p.latitude, 0) / currentStop.pointCount;
      currentStop.center.lng = currentStop.points.reduce((sum, p) => sum + p.longitude, 0) / currentStop.pointCount;
    } else {
      if (currentStop) {
        finalizeCurrentStop();
      }
    }
  }

  // Finaliser le dernier arrêt
  if (currentStop) {
    finalizeCurrentStop();
  }

  function finalizeCurrentStop() {
    const duration = currentStop.endTime - currentStop.startTime;
    if (duration >= minStopDuration && currentStop.pointCount >= minPointsForStop) {
      extendedStops.push({
        ...currentStop,
        duration: duration / (60 * 1000), // Convertir en minutes
        coordinates: `${currentStop.center.lat.toFixed(6)}, ${currentStop.center.lng.toFixed(6)}`
      });
    }
    currentStop = null;
  }

  // Geocoding des arrêts
  if (extendedStops.length > 0 && google.maps.Geocoder) {
    const geocoder = new google.maps.Geocoder();
    
    await Promise.all(extendedStops.map(async (stop) => {
      try {
        const response = await new Promise((resolve) => {
          geocoder.geocode(
            { location: stop.center },
            (results, status) => {
              if (status === "OK" && results[0]) {
                stop.address = results[0].formatted_address;
              }
              resolve();
            }
          );
        });
      } catch (error) {
        console.error("Erreur de géocodage:", error);
      }
    }));
  }

  return extendedStops;
};

// Simple intent detection function
const detectIntent = (input) => {
  const lowerInput = input.toLowerCase();
  if (lowerInput.includes("vitesse") || lowerInput.includes("speed")) return "speed";
  if (lowerInput.includes("arrêt") || lowerInput.includes("arret") || lowerInput.includes("stop")) return "stop";
  if (lowerInput.includes("distance") || lowerInput.includes("parcourue")) return "distance";
  if (lowerInput.includes("optimiser") || lowerInput.includes("conseil")) return "optimize";
  return "general";
};

const StaticRouteMap = () => {
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const location = useLocation();
  const mapRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [mapError, setMapError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [positions, setPositions] = useState([]);
  const [showIdealRoute, setShowIdealRoute] = useState(false);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);
  const [realRoute, setRealRoute] = useState(null);
  const [longestStopMarker, setLongestStopMarker] = useState(null);
  const [showLongestStop, setShowLongestStop] = useState(false);
  const [map, setMap] = useState(null);
  const [address, setAddress] = useState("");
  const [geofenceResult, setGeofenceResult] = useState(null);
  const [isCheckingGeofence, setIsCheckingGeofence] = useState(false);
  const [addressMarker, setAddressMarker] = useState(null);
  const [showActivityReport, setShowActivityReport] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [isStatsLoading, setIsStatsLoading] = useState(false);
  const [isStatsLoaded, setIsStatsLoaded] = useState(false);
  const [autocompleteService, setAutocompleteService] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [minStopDuration, setMinStopDuration] = useState(5); // Default: 5 minutes
  const [activityStats, setActivityStats] = useState({
    totalDistance: 0,
    totalTime: 0,
    extendedStops: [],
    speedData: [],
    averageSpeed: 0,
    movingAverageSpeed: 0,
    maxSpeed: 0,
    startTime: null,
    endTime: null,
    movementData: [],
    stopsData: [],
    timeDistribution: [],
    movingTime: 0,
    stoppedTime: 0,
  });

  // Suggested questions for the chatbot
  const suggestedQuestions = [
    "Quelle était ma vitesse moyenne ?",
    "Où sont mes arrêts prolongés ?",
    "Comment optimiser mon trajet ?",
    "Quelle est la distance parcourue ?",
  ];

  const generateLocalRecommendations = (summary, userInput, context = []) => {
    const intent = detectIntent(userInput);
    let recommendations = "";
    const hasRecentStopQuery = context.some(msg => detectIntent(msg.text) === "stop");

    switch (intent) {
      case "speed":
        recommendations = `Votre vitesse maximale était de ${summary.realRoute.maxSpeed}. Vitesse moyenne : ${summary.realRoute.averageSpeed}. Vitesse moyenne en mouvement : ${summary.realRoute.movingAverageSpeed}. `;
        if (parseFloat(summary.realRoute.maxSpeed.replace(" km/h", "")) > 120) {
          recommendations += "Vous avez dépassé les limites de vitesse sur autoroute. Essayez de maintenir une vitesse plus constante.";
        } else {
          recommendations += "Votre vitesse semble conforme aux limites.";
        }
        break;

      case "stop":
        if (summary.longestStop) {
          recommendations = `Arrêt prolongé détecté à ${summary.longestStop.address} pendant ${summary.longestStop.duration}. `;
          if (hasRecentStopQuery) {
            recommendations += `Coordonnées : ${summary.longestStop.coordinates}.`;
          } 
          if (parseFloat(summary.longestStop.duration.replace("h ", ".").replace("min", "")) > 1) {
            recommendations += "Cet arrêt semble long. Planifiez mieux vos pauses pour optimiser votre trajet.";
          } else {
            recommendations += "Cette pause est raisonnable pour votre trajet.";
          }
        } else {
          recommendations = "Aucun arrêt prolongé détecté pendant votre trajet.";
        }
        break;

      case "distance":
        recommendations = `Vous avez parcouru ${summary.realRoute.distance}. `;
        if (summary.idealRoute.distance !== "Non calculé") {
          const realDistance = parseFloat(summary.realRoute.distance);
          const idealDistance = parseFloat(summary.idealRoute.distance);
          if (realDistance > idealDistance * 1.2) {
            recommendations += "Votre trajet était plus long que l'itinéraire idéal. Vérifiez les itinéraires alternatifs.";
          } else {
            recommendations += "Votre distance est proche de l'itinéraire idéal.";
          }
        }
        break;

      case "optimize":
        recommendations = "Conseils pour optimiser votre trajet :\n" +
          "- Planifiez vos arrêts à l'avance (15-20 min toutes les 2h).\n" +
          "- Maintenez une vitesse constante pour économiser du carburant.\n" +
          "- Vérifiez les conditions de trafic avant de partir.\n" +
          "- Utilisez des itinéraires alternatifs si votre vitesse moyenne est basse.";
        if (summary.realRoute.averageSpeed.replace(" km/h", "") < 30) {
          recommendations += "\nVotre vitesse moyenne est basse, probablement à cause du trafic. Essayez des routes périphériques.";
        }
        break;

      default:
        recommendations = `Analyse de votre trajet du ${summary.period.start} :\n` +
          `- Distance parcourue : ${summary.realRoute.distance}\n`+
          `- Durée totale : ${summary.realRoute.duration}\n`+
          `- Vitesse moyenne : ${summary.realRoute.averageSpeed}\n` +
          `- Vitesse moyenne en mouvement : ${summary.realRoute.movingAverageSpeed}\n\n`;
        if (summary.longestStop) {
          recommendations += `Arrêt prolongé à ${summary.longestStop.address} pendant ${summary.longestStop.duration}. `; 
        }
        recommendations += "\nConseils généraux :\n" +
          "- Planifiez votre itinéraire pour éviter les détours.\n" +
          "- Faites des pauses courtes et régulières.\n" +
          "- Vérifiez le trafic en temps réel.";
        break;
    }

    return recommendations;
  };

  const fetchRecommendations = async (userInput = "", summary) => {
    setIsChatLoading(true);
    try {
      if (!summary || !summary.realRoute.distance) {
        throw new Error("Données de trajet incomplètes. Veuillez vérifier les données GPS.");
      }
      const context = chatMessages.slice(-2); // Last 2 messages for context
      const recommendations = generateLocalRecommendations(summary, userInput, context);

      // Update map if stop-related query
      if (detectIntent(userInput) === "stop" && summary.longestStop && map) {
        map.setCenter({ lat: summary.longestStop.center.lat, lng: summary.longestStop.center.lng });
        map.setZoom(16);
      }

      setChatMessages((prev) => [
        ...prev,
        { sender: "user", text: userInput || "Donne-moi des recommandations" },
        { sender: "bot", text: recommendations },
      ]);
    } catch (error) {
      console.error("Erreur génération recommandations:", error);
      setChatMessages((prev) => [
        ...prev,
        { sender: "user", text: userInput || "Donne-moi des recommandations" },
        { sender: "bot", text: `Erreur : ${error.message}` },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    fetchRecommendations(chatInput, generateAnalyticalSummary());
    setChatInput("");
  };

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
    if (!isChatOpen && chatMessages.length === 0 && isStatsLoaded) {
      fetchRecommendations("", generateAnalyticalSummary());
    }
  };

  useEffect(() => {
    if (location.state?.positions && location.state?.period) {
      const { positions, period } = location.state;
      const fromTime = new Date(period.from).getTime();
      const toTime = new Date(period.to).getTime();
      const totalDuration = toTime - fromTime;
      const step = totalDuration / (positions.length - 1 || 1);

      const validPositions = positions
        .filter(
          (pos) =>
            pos.latitude !== undefined &&
            pos.longitude !== undefined &&
            !isNaN(pos.latitude) &&
            !isNaN(pos.longitude)
        )
        .map((pos, index) => {
          let timestamp = pos.deviceTime || pos.timestamp;
          if (!timestamp) {
            const estimatedTime = new Date(fromTime + index * step);
            timestamp = estimatedTime.toISOString();
          } else {
            timestamp = new Date(timestamp).toISOString();
          }
          return { ...pos, timestamp };
        });

      if (validPositions.length === 0) {
        setMapError("Coordonnées GPS invalides");
        setLoading(false);
        return;
      }

      setPositions(validPositions);
    } else {
      setMapError("Aucune donnée de trajet disponible");
      setLoading(false);
    }
  }, [location.state]);

  const initMap = () => {
    const mapInstance = new window.google.maps.Map(mapRef.current, {
      zoom: 14,
      center: { lat: positions[0].latitude, lng: positions[0].longitude },
      mapTypeId: "roadmap",
    });

    setMap(mapInstance);
    setMapLoaded(true);

    const routePath = positions.map((pos) => ({ lat: pos.latitude, lng: pos.longitude }));

    const newRealRoute = new window.google.maps.Polyline({
      path: routePath,
      geodesic: true,
      strokeColor: "#007bff",
      strokeOpacity: 0.8,
      strokeWeight: 4,
      icons: [
        {
          icon: {
            path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            strokeColor: "#007bff",
            fillColor: "#007bff",
            fillOpacity: 1,
            scale: 3,
          },
          offset: "100%",
          repeat: "100px",
        },
      ],
      map: mapInstance,
    });

    setRealRoute(newRealRoute);

    new window.google.maps.Marker({
      position: { lat: positions[0].latitude, lng: positions[0].longitude },
      map: mapInstance,
      title: "Départ",
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: "#28a745",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 2,
      },
    });

    new window.google.maps.Marker({
      position: {
        lat: positions[positions.length - 1].latitude,
        lng: positions[positions.length - 1].longitude,
      },
      map: mapInstance,
      title: "Arrivée",
      icon: {
        path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
        scale: 6,
        fillColor: "#dc3545",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 2,
      },
    });

    setLoading(false);
  };

  useEffect(() => {
    if (positions.length === 0) return;

    if (window.google) {
      initMap();
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyDNX04w1kGf_a6P7UkxNYAkjYS57bj_p34&libraries=places,geometry,directions`;
    script.async = true;
    script.defer = true;
    script.onload = initMap;
    script.onerror = () => {
      setMapError("Erreur de chargement de Google Maps");
      setLoading(false);
    };
    document.body.appendChild(script);

    return () => {
      if (script && document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [positions]);

  useEffect(() => {
    if (!mapLoaded || !autocompleteRef.current) return;

    const initAutocomplete = () => {
      const autocomplete = new window.google.maps.places.Autocomplete(autocompleteRef.current, {
        types: ["geocode"],
      });

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (!place.geometry) {
          console.log("Aucun détail disponible pour l'adresse:", place.name);
          return;
        }
        setAddress(place.formatted_address);
      });

      return autocomplete;
    };

    const autocomplete = initAutocomplete();
    setAutocompleteService(autocomplete);

    return () => {
      if (autocomplete) {
        window.google.maps.event.clearInstanceListeners(autocomplete);
      }
    };
  }, [mapLoaded]);

  useEffect(() => {
    if (!window.google || !window.google.maps || !window.google.maps.places || !autocompleteRef.current) {
      return;
    }

    const autocomplete = new window.google.maps.places.Autocomplete(autocompleteRef.current, {
      types: ["geocode"],
    });

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place.geometry) {
        console.log("Aucun détail disponible pour l'adresse:", place.name);
        return;
      }
      setAddress(place.formatted_address);
    });

    return () => {
      if (autocomplete) {
        window.google.maps.event.clearInstanceListeners(autocomplete);
      }
    };
  }, []);

  const calculateActivityStats = async () => {
    if (!window.google || positions.length < 2) return;

    setIsStatsLoading(true);
    setIsStatsLoaded(false);

    let totalDistance = 0;
    const speedData = [];
    const movementData = [];
    let totalSpeed = 0;
    let movingTotalSpeed = 0;
    let maxSpeed = 0;
    let speedCount = 0;
    let movingSpeedCount = 0;
    let movingTime = 0;
    let stoppedTime = 0;
    let totalTime = 0;
    const movementThreshold = 50;
    const timeWindows = {
      "00h-04h": 0,
      "04h-08h": 0,
      "08h-12h": 0,
      "12h-16h": 0,
      "16h-20h": 0,
      "20h-00h": 0,
    };

    for (let i = 1; i < positions.length; i++) {
      const prevPos = positions[i - 1];
      const currPos = positions[i];

      if (!prevPos.latitude || !prevPos.longitude || !currPos.latitude || !currPos.longitude) continue;
      if (!prevPos.timestamp || !currPos.timestamp) continue;

      const distance = window.google.maps.geometry.spherical.computeDistanceBetween(
        new window.google.maps.LatLng(prevPos.latitude, prevPos.longitude),
        new window.google.maps.LatLng(currPos.latitude, currPos.longitude)
      );

      totalDistance += distance;

      const currTime = new Date(currPos.timestamp);
      const prevTime = new Date(prevPos.timestamp);
      const timeDiff = (currTime - prevTime) / 1000;

      const hour = currTime.getHours();
      if (hour >= 0 && hour < 4) timeWindows["00h-04h"] += timeDiff;
      else if (hour >= 4 && hour < 8) timeWindows["04h-08h"] += timeDiff;
      else if (hour >= 8 && hour < 12) timeWindows["08h-12h"] += timeDiff;
      else if (hour >= 12 && hour < 16) timeWindows["12h-16h"] += timeDiff;
      else if (hour >= 16 && hour < 20) timeWindows["16h-20h"] += timeDiff;
      else timeWindows["20h-00h"] += timeDiff;

      if (timeDiff > 0) {
        const speed = (distance / 1000) / (timeDiff / 3600);
        speedData.push({
          time: formatTime(currTime),
          speed: Math.round(speed * 10) / 10,
        });

        movementData.push({
          time: formatTime(currTime),
          distance: Math.round((distance / 1000) * 100) / 100,
          speed: Math.round(speed * 10) / 10,
        });

        // Include all segments for global average speed
        totalSpeed += speed;
        speedCount++;
        if (speed > maxSpeed) maxSpeed = speed;

        // Include only moving segments for moving average speed
        if (distance > movementThreshold) {
          movingTotalSpeed += speed;
          movingSpeedCount++;
          movingTime += timeDiff;
        } else {
          stoppedTime += timeDiff;
        }

        totalTime += timeDiff;
      }
    }

    const extendedStops = await detectExtendedStops(positions, window.google, minStopDuration * 60 * 1000);

    const stopsData = [
      { name: "En mouvement", value: Math.round(movingTime) },
      { name: "À l'arrêt", value: Math.round(stoppedTime) },
    ];

    const timeDistribution = Object.keys(timeWindows).map((key) => ({
      period: key,
      minutes: Math.round(timeWindows[key] / 60),
    }));

    let startTime = null;
    let endTime = null;

    if (positions.length > 1 && positions[0].timestamp && positions[positions.length - 1].timestamp) {
      startTime = new Date(positions[0].timestamp);
      endTime = new Date(positions[positions.length - 1].timestamp);
      totalTime = (endTime - startTime) / 60000;
    }

    const stats = {
      totalDistance: totalDistance / 1000,
      totalTime,
      extendedStops,
      speedData: speedData.filter((_, i) => i % 3 === 0),
      movementData: movementData.filter((_, i) => i % 3 === 0),
      stopsData,
      timeDistribution,
      averageSpeed: speedCount > 0 ? totalSpeed / speedCount : 0,
      movingAverageSpeed: movingSpeedCount > 0 ? movingTotalSpeed / movingSpeedCount : 0,
      maxSpeed,
      startTime,
      endTime,
      movingTime: movingTime / 60,
      stoppedTime: stoppedTime / 60,
    };

    setActivityStats(stats);
    setIsStatsLoading(false);
    setIsStatsLoaded(true);

    return stats;
  };

  // Memoize activity stats to prevent unnecessary recalculations
  const memoizedStats = useMemo(() => calculateActivityStats(), [positions, map, minStopDuration]);

  useEffect(() => {
    if (positions.length > 0 && window.google && map) {
      calculateActivityStats();
    }
  }, [positions, map, minStopDuration]);

  // Proactive chatbot message after stats are loaded
  useEffect(() => {
    if (isStatsLoaded && isChatOpen && chatMessages.length === 0) {
      const summary = generateAnalyticalSummary();
      const proactiveMessage = `Votre trajet a duré ${summary.realRoute.duration}. Voulez-vous des conseils sur la vitesse, les arrêts ou l'optimisation ?`;
      setChatMessages([{ sender: "bot", text: proactiveMessage }]);
    }
  }, [isStatsLoaded, isChatOpen]);

  useEffect(() => {
    if (!window.google || !realRoute || positions.length === 0) return;

    const validPositions = positions.filter((pos) => !isNaN(pos.latitude) && !isNaN(pos.longitude));
    if (validPositions.length < 2) return;

    if (showIdealRoute) {
      const directionsService = new window.google.maps.DirectionsService();
      const newDirectionsRenderer = new window.google.maps.DirectionsRenderer({
        map: realRoute.getMap(),
        polylineOptions: { strokeColor: "#28a745", strokeOpacity: 1.0, strokeWeight: 4 },
        suppressMarkers: true,
      });

      const start = validPositions[0];
      const end = validPositions[validPositions.length - 1];

      const distance = window.google.maps.geometry.spherical.computeDistanceBetween(
        new window.google.maps.LatLng(start.latitude, start.longitude),
        new google.maps.LatLng(end.latitude, end.longitude)
      );

      const isCircular = distance < 50;

      const request = {
        origin: new window.google.maps.LatLng(start.latitude, start.longitude),
        destination: new window.google.maps.LatLng(end.latitude, end.longitude),
        travelMode: window.google.maps.TravelMode.DRIVING,
      };

      if (isCircular) {
        const waypoints = [];
        const step = Math.max(1, Math.floor(validPositions.length / 9));
        for (let i = step; i < validPositions.length - 1; i += step) {
          waypoints.push({
            location: new window.google.maps.LatLng(
              validPositions[i].latitude,
              validPositions[i].longitude
            ),
            stopover: true,
          });
        }
        request.waypoints = waypoints;
        request.destination = waypoints.length > 0 ? waypoints[waypoints.length - 1].location : request.origin;
      }

      directionsService.route(request, (result, status) => {
        if (status === "OK") {
          newDirectionsRenderer.setDirections(result);
          setDirectionsRenderer(newDirectionsRenderer);
        } else {
          console.warn("Erreur trajet idéal:", status);
          alert("Impossible de calculer le trajet idéal: " + status);
        }
      });
    } else if (directionsRenderer) {
      directionsRenderer.setMap(null);
      setDirectionsRenderer(null);
    }
  }, [showIdealRoute, realRoute, positions]);

  useEffect(() => {
    if (!showLongestStop || !map || !window.google || !isStatsLoaded) return;

    if (longestStopMarker) {
      longestStopMarker.setMap(null);
      setLongestStopMarker(null);
    }

    const stop = activityStats.extendedStops.length > 0
      ? activityStats.extendedStops.reduce(
          (max, stop) => (stop.duration > max.duration ? stop : max),
          activityStats.extendedStops[0]
        )
      : null;

    if (stop) {
      const minutes = Math.floor(stop.duration);
      const seconds = Math.floor((stop.duration % 1) * 60);
      const pointCount = stop.pointCount;

      const marker = new window.google.maps.Marker({
        position: { lat: stop.center.lat, lng: stop.center.lng },
        map: map,
        title: `Arrêt prolongé: environ ${minutes}min ${seconds}s`,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: "#FFA500",
          fillOpacity: 1,
          strokeColor: "#FFFFFF",
          strokeWeight: 2,
        },
      });

      const infowindow = new window.google.maps.InfoWindow({
        content: `<div style="padding: 10px;"><strong>Arrêt prolongé</strong><br>Durée estimée: ${minutes}min ${seconds}s<br>Nombre de points: ${pointCount}<br>Adresse: ${stop.address}</div>`,
      });

      marker.addListener("click", () => infowindow.open(map, marker));
      infowindow.open(map, marker);
      setLongestStopMarker(marker);
    }
  }, [activityStats.extendedStops, showLongestStop, map, isStatsLoaded]);

  const handleShowIdealRoute = () => setShowIdealRoute((prev) => !prev);

  const toggleLongestStop = () => {
    if (!map || !window.google) return;

    if (!isStatsLoaded) {
      alert("Les données des arrêts sont en cours de chargement. Veuillez réessayer dans un instant.");
      return;
    }

    if (!showLongestStop) {
      const stop = activityStats.extendedStops.length > 0
        ? activityStats.extendedStops.reduce(
            (max, stop) => (stop.duration > max.duration ? stop : max),
            activityStats.extendedStops[0]
          )
        : null;

      if (stop) {
        const minutes = Math.floor(stop.duration);
        const seconds = Math.floor((stop.duration % 1) * 60);
        const pointCount = stop.pointCount;

        const marker = new window.google.maps.Marker({
          position: { lat: stop.center.lat, lng: stop.center.lng },
          map: map,
          title: `Arrêt prolongé: environ ${minutes}min ${seconds}s`,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: "#FFA500",
            fillOpacity: 1,
            strokeColor: "#FFFFFF",
            strokeWeight: 2,
          },
        });

        const infowindow = new window.google.maps.InfoWindow({
          content: `<div style="padding: 10px;"><strong>Arrêt prolongé</strong><br>Durée estimée: ${minutes}min ${seconds}s<br>Nombre de points: ${pointCount}<br>Adresse: ${stop.address}</div>`,
        });

        marker.addListener("click", () => infowindow.open(map, marker));
        infowindow.open(map, marker);
        setLongestStopMarker(marker);
      } else {
        alert("Aucun arrêt prolongé détecté.");
      }
    } else if (longestStopMarker) {
      longestStopMarker.setMap(null);
      setLongestStopMarker(null);
    }

    setShowLongestStop(!showLongestStop);
  };

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
          strokeWeight: 2,
        },
      });

      setAddressMarker(marker);

      const stop = activityStats.extendedStops.length > 0
        ? activityStats.extendedStops.reduce(
            (max, stop) => (stop.duration > max.duration ? stop : max),
            activityStats.extendedStops[0]
        )
        : null;

      if (stop) {
        const stopLatLng = new window.google.maps.LatLng(stop.center.lat, stop.center.lng);
        const distance = window.google.maps.geometry.spherical.computeDistanceBetween(location, stopLatLng);

        if (distance <= 1000) {
          setGeofenceResult(
            `✅ L'adresse est dans un rayon de 1km de l'arrêt prolongé. (Distance: ${distance.toFixed(2)} m)`
          );
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
  };

  const handleViewActivity = async () => {
    if (!showActivityReport) {
      setIsStatsLoading(true);
      try {
        const stats = await calculateActivityStats();
        setActivityStats(stats);
      } catch (error) {
        console.error("Erreur calcul stats:", error);
      } finally {
        setIsStatsLoading(false);
      }
    }
    setShowActivityReport(!showActivityReport);
  };

  const generateAnalyticalSummary = () => {
    const vehicleName = location.state?.vehicleName || "Véhicule inconnu";
    const period = location.state?.period || { from: "N/A", to: "N/A" };
    const idealRouteData = directionsRenderer?.getDirections()?.routes[0]?.legs[0] || null;

    const longestStop = activityStats.extendedStops.length > 0
      ? activityStats.extendedStops.reduce(
          (max, stop) => (stop.duration > max.duration ? stop : max),
          activityStats.extendedStops[0]
        )
      : null;

    return {
      vehicle: {
        name: vehicleName,
        id: location.state?.positions?.[0]?.deviceId || "N/A",
      },
      period: {
        start: period.from !== "N/A" ? new Date(period.from).toLocaleString() : "N/A",
        end: period.to !== "N/A" ? new Date(period.to).toLocaleString() : "N/A",
      },
      
      realRoute: {
        distance: activityStats.totalDistance.toFixed(2) + " km",
        duration: formatDuration(activityStats.totalTime),
        averageSpeed: activityStats.averageSpeed.toFixed(2) + " km/h",
        movingAverageSpeed: activityStats.movingAverageSpeed.toFixed(2) + " km/h",
        maxSpeed: activityStats.maxSpeed.toFixed(2) + " km/h",
      },
      
      idealRoute: idealRouteData
        ? {
            distance: (idealRouteData.distance.value / 1000).toFixed(2) + " km",
            duration: formatDuration(idealRouteData.duration.value / 60),
          }
        : { distance: "Non calculé", duration: "Non calculé" },
      longestStop: longestStop
        ? {
            address: longestStop.address || "Adresse non disponible",
            duration: formatDuration(longestStop.duration),
            startTime: formatTime(longestStop.startTime),
            endTime: formatTime(longestStop.endTime),
            coordinates: `Lat: ${longestStop.center.lat.toFixed(4)}, Lng: ${longestStop.center.lng.toFixed(4)}`,
            center: longestStop.center,
          }
        : null,
      activitySummary: {
        movingTime: formatDuration(activityStats.movingTime),
        stoppedTime: formatDuration(activityStats.stoppedTime),
        timeDistribution: activityStats.timeDistribution.map((period) => ({
          period: period.period,
          minutes: period.minutes,
        })),
      },
    };
  };

  const handleShowSummary = () => {
    if (!showSummary) {
      memoizedStats.then(stats => setActivityStats(stats));
    }
    setShowSummary(!showSummary);
  };

  const formatTime = (date) => {
    if (!date) return "N/A";
    const utcDate = new Date(date);
    return utcDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    const utcDate = new Date(date);
    return utcDate.toLocaleDateString([], { timeZone: "UTC" });
  };

  const formatDuration = (minutes) => {
    if (!minutes) return "N/A";
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return `${hours}h ${mins}min`;
  };

 const saveActivityReportAsPDF = async () => {
  try {
    // Créer un élément temporaire pour le PDF
    const summary = generateAnalyticalSummary();
    const fileName = `rapport_${summary.vehicle.name}_${Date.now()}.pdf`;
    const pdfContent = document.createElement("div");
    pdfContent.style.width = "210mm";
    pdfContent.style.padding = "20px";
    pdfContent.style.backgroundColor = "white";

    // Ajouter le contenu formaté
    pdfContent.innerHTML = `
      <style>
        .pdf-header {
          text-align: center;
          margin-bottom: 20px;
          border-bottom: 2px solid #007bff;
          padding-bottom: 10px;
        }
        .pdf-title {
          color: darkblue;
          font-size: 24px;
          margin: 0;
        }
        .pdf-section {
          margin-bottom: 15px;
          padding: 10px;
          background-color: #f8f9fa;
          border-radius: 5px;
        }
        .pdf-section h3 {
          color: #007bff;
          margin-top: 0;
          border-bottom: 1px solid #dee2e6;
          padding-bottom: 5px;
        }
        .pdf-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
        }
        .pdf-label {
          font-weight: bold;
          width: 50%;
        }
        .pdf-value {
          width: 50%;
        }
        .pdf-list {
          margin-top: 5px;
          padding-left: 20px;
        }
        .company-logo {
          text-align: center;
          margin-bottom: 10px;
        }
      </style>
      
      <div class="pdf-header">
        <h1 class="pdf-title">Rapport de Trajet - ${summary.vehicle.name}</h1>
        <p> Date: ${formatDate(new Date())}</p>
      </div>

      <div class="pdf-section">
        <h3>Informations du Véhicule</h3>
        <div class="pdf-row">
          <span class="pdf-label">Nom :</span>
          <span class="pdf-value">${summary.vehicle.name}</span>
        </div>
      </div>

      <div class="pdf-section">
        <h3>Période Analysée</h3>
        <div class="pdf-row">
          <span class="pdf-label">Début :</span>
          <span class="pdf-value">${summary.period.start}</span>
        </div>
        <div class="pdf-row">
          <span class="pdf-label">Fin :</span>
          <span class="pdf-value">${summary.period.end}</span>
        </div>
      </div>

      <div class="pdf-section">
        <h3>Trajet Effectué</h3>
        <div class="pdf-row">
          <span class="pdf-label">Distance :</span>
          <span class="pdf-value">${summary.realRoute.distance}</span>
        </div>
        <div class="pdf-row">
          <span class="pdf-label">Durée :</span>
          <span class="pdf-value">${summary.realRoute.duration}</span>
        </div>
        <div class="pdf-row">
          <span class="pdf-label">Vitesse Moyenne :</span>
          <span class="pdf-value">${summary.realRoute.averageSpeed}</span>
        </div>
        <div class="pdf-row">
          <span class="pdf-label">Vitesse Maximale :</span>
          <span class="pdf-value">${summary.realRoute.maxSpeed}</span>
        </div>
      </div>

      ${summary.longestStop ? `
      <div class="pdf-section">
        <h3>Arrêt Prolongé</h3>
        <div class="pdf-row">
          <span class="pdf-label">Adresse :</span>
          <span class="pdf-value">${summary.longestStop.address}</span>
        </div>
        <div class="pdf-row">
          <span class="pdf-label">Durée :</span>
          <span class="pdf-value">${summary.longestStop.duration}</span>
        </div>
        <div class="pdf-row">
          <span class="pdf-label">Coordonnées :</span>
          <span class="pdf-value">${summary.longestStop.coordinates}</span>
        </div>
      </div>
      ` : ''}

      <div class="pdf-section">
        <h3>Activité</h3>
        <div class="pdf-row">
          <span class="pdf-label">Temps en mouvement :</span>
          <span class="pdf-value">${summary.activitySummary.movingTime}</span>
        </div>
        <div class="pdf-row">
          <span class="pdf-label">Temps à l'arrêt :</span>
          <span class="pdf-value">${summary.activitySummary.stoppedTime}</span>
        </div>
      </div>

      <div class="pdf-section">
        <h3>Distribution du temps</h3>
        <ul class="pdf-list">
          ${summary.activitySummary.timeDistribution.map(period => `
            <li>${period.period} : ${period.minutes} minutes</li>
          `).join('')}
        </ul>
      </div>
    `;

    // Ajouter au DOM temporairement
    document.body.appendChild(pdfContent);

    // Générer le PDF
    const canvas = await html2canvas(pdfContent, {
      scale: 2,
      logging: false,
      useCORS: true,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

    // Convertir le PDF en blob
    const pdfBlob = pdf.output('blob');

    // Préparer les données pour MongoDB
    const formData = new FormData();
    formData.append('report', pdfBlob, fileName);
    formData.append('vehicleName', summary.vehicle.name);
    formData.append('driverName', location.state?.driverName || 'Inconnu'); // Assurez-vous que driverName est disponible
    formData.append('periodStart', summary.period.start);
    formData.append('periodEnd', summary.period.end);
    formData.append('createdAt', new Date().toISOString());

    // Envoyer au backend pour stockage dans MongoDB
    await axios.post('/api/reports', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    // Télécharger le PDF
    pdf.save(fileName);

    // Nettoyer
    document.body.removeChild(pdfContent);

    alert("Rapport généré et enregistré avec succès !");
  } catch (error) {
    console.error("Erreur lors de la génération ou de l'enregistrement du PDF:", error);
    alert("Erreur lors de la génération ou de l'enregistrement du PDF.");
  }
};
  
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

  return (
    <div className="trajet-container">
      <div className="button-container">
        <button className="geofence-check-btn chat-toggle-btn" onClick={toggleChat}>
          {isChatOpen ? "× Fermer" : "💬 Ouvrir le Chatbot"}
        </button>
      </div>
      {isChatOpen && (
        <div className="chat-container">
          <div className="chat-header">
            <h3>Assistant de Trajet</h3>
            <button className="close-chat" onClick={toggleChat}>×</button>
          </div>
          <div className="chat-messages">
            {chatMessages.map((msg, index) => (
              <div key={index} className={`chat-message ${msg.sender}`}>
                <div className="message-content">
                  <strong>{msg.sender === "user" ? "Vous" : "Assistant"}:</strong>
                  <div>{msg.text}</div>
                </div>
              </div>
            ))}
            {isChatLoading && (
              <div className="chat-message bot">
                <div className="message-content loading-dots">
                  <span>.</span>
                  <span>.</span>
                  <span>.</span>
                </div>
              </div>
            )}
          </div>
          <form onSubmit={handleChatSubmit} className="chat-input-form">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Posez une question sur votre trajet..."
              disabled={isChatLoading}
            />
            <button
              type="submit"
              disabled={isChatLoading || !chatInput.trim()}
              className="send-button"
            >
              {isChatLoading ? (
                <span className=" uma loading-dots">
                  <span>.</span>
                  <span>.</span>
                  <span>.</span>
                </span>
              ) : (
                "Envoyer"
              )}
            </button>
          </form>
          <div className="suggested-questions">
            {suggestedQuestions.map((question, index) => (
              <button
                key={index}
                className="suggested-question-btn"
                onClick={() => setChatInput(question)}
                disabled={isChatLoading}
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}
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
          <button
            className="geofence-check-btn"
            onClick={toggleLongestStop}
            disabled={!isStatsLoaded}
          >
            {showLongestStop ? "Masquer" : "Afficher"} l'arrêt prolongé
          </button>
        </div>
      </div>
      {geofenceResult && <p className="geofence-result">{geofenceResult}</p>}
      <div className="map-container" ref={mapRef} style={{ height: "500px", width: "100%" }} />
      
      {loading && <p className="loading">Chargement de la carte...</p>}
      {mapError && <p className="error-message">{mapError}</p>}

      <div className="button-container">
        <button className="geofence-check-btn" onClick={handleShowSummary}>
          {showSummary ? "Masquer" : "Afficher"} le résumé analytique
        </button>
        <button className="geofence-check-btn" onClick={handleViewActivity}>
          {showActivityReport ? "Masquer" : "Afficher"} le rapport d'activité
        </button>
      </div>

      {showSummary && (
        <div className="activity-modal-overlay">
          <div className="activity-modal">
            <h2 style={{ color: "darkblue", marginBottom: "15px" }}>
              Résumé Analytique - {location.state?.vehicleName}
            </h2>
            <button onClick={handleShowSummary}>×</button>

            {isStatsLoading ? (
              <p>Chargement des statistiques...</p>
            ) : (
              (() => {
                const summary = generateAnalyticalSummary();
                return (
                  <>
                    <div>
                      <h3>Informations du Véhicule</h3>
                      <p>
                        <strong>Nom :</strong> {summary.vehicle.name}
                      </p>

                      <h3>Période Analysée</h3>
                      <p>
                        <strong>Début :</strong> {summary.period.start}
                      </p>
                      <p>
                        <strong>Fin :</strong> {summary.period.end}
                      </p>

                      <h3>Trajet Effectué</h3>
                      
                      <p>
                        <strong>Distance :</strong> {summary.realRoute.distance}
                      </p>
                      <p>
                        <strong>Durée :</strong> {summary.realRoute.duration}
                      </p>
                      <p>
                        <strong>Vitesse Moyenne (globale) :</strong> {summary.realRoute.averageSpeed}
                      </p>
                      <p>
                        <strong>Vitesse Moyenne (en mouvement) :</strong> {summary.realRoute.movingAverageSpeed}
                      </p>
                      <p>
                        <strong>Vitesse Maximale :</strong> {summary.realRoute.maxSpeed}
                      </p>

                      <h3>Trajet Idéal</h3>
                      <p>
                        <strong>Distance :</strong> {summary.idealRoute.distance}
                      </p>
                      <p>
                        <strong>Durée :</strong> {summary.idealRoute.duration}
                      </p>

                      <h3>Arrêt Prolongé</h3>
                      {summary.longestStop ? (
                        <>
                          <p>
                            <strong>Adresse :</strong> {summary.longestStop.address}
                          </p>
                          <p>
                            <strong>Durée :</strong> {summary.longestStop.duration}
                          </p>
                          <p>
                            <strong>Début :</strong> {summary.longestStop.startTime}
                          </p>
                          <p>
                            <strong>Fin :</strong> {summary.longestStop.endTime}
                          </p>
                          <p>
                            <strong>Coordonnées :</strong> {summary.longestStop.coordinates}
                          </p>
                        </>
                      ) : (
                        <p>Aucun arrêt prolongé détecté.</p>
                      )}

                      <h3>Résumé des Activités</h3>
                      <p>
                        <strong>Temps en mouvement :</strong> {summary.activitySummary.movingTime}
                      </p>
                      <p>
                        <strong>Temps à l'arrêt :</strong> {summary.activitySummary.stoppedTime}
                      </p>
                      <h4>Distribution du temps par période</h4>
                      <ul>
                        {summary.activitySummary.timeDistribution.map((period, index) => (
                          <li key={index}>
                            {period.period} : {period.minutes} minutes
                          </li>
                        ))}
                      </ul>
                    </div>
                  
                    <div className="pdf-button-container">
                      <button
                        className="pdf-button"
                        onClick={saveActivityReportAsPDF}
                        disabled={isStatsLoading}
                      >
                        {isStatsLoading ? "Génération..." : "Exporter en PDF"}
                      </button>
                    </div>
                  </>
                );
              })()
            )}
          </div>
        </div>
      )}

      {showActivityReport && (
        <div className="activity-modal-overlay">
          <div className="activity-modal">
            <h2>Rapport d'activité du trajet</h2>
            <div className="tab-buttons">
              <button onClick={handleViewActivity}>×</button>
              <button
                className={`tab-button ${activeTab === "general" ? "active" : ""}`}
                onClick={() => setActiveTab("general")}
              >
                Général
              </button>
              <button
                className={`tab-button ${activeTab === "vitesse" ? "active" : ""}`}
                onClick={() => setActiveTab("vitesse")}
              >
                Vitesse
              </button>
              <button
                className={`tab-button ${activeTab === "arrets" ? "active" : ""}`}
                onClick={() => setActiveTab("arrets")}
              >
                Arrêts
              </button>
              
            </div>
            <div className="tab-content">
              {activeTab === "general" && (
                <div>
                  <div className="stats-grid">
                    <div className="stats-card">
                      <h3>Informations générales</h3>
                      <p>
                        <strong>Date du trajet:</strong> {formatDate(activityStats.startTime)}
                      </p>
                      <p>
                        <strong>Heure de départ:</strong> {formatTime(activityStats.startTime)}
                      </p>
                      <p>
                        <strong>Heure d'arrivée:</strong> {formatTime(activityStats.endTime)}
                      </p>
                      <p>
                        <strong>Durée totale:</strong> {formatDuration(activityStats.totalTime)}
                      </p>
                      <p>
                        <strong>Distance parcourue:</strong> {activityStats.totalDistance.toFixed(2)} km
                      </p>
                      <p>
                        <strong>Vitesse moyenne (globale):</strong> {activityStats.averageSpeed.toFixed(2)} km/h
                      </p>
                      <p>
                        <strong>Vitesse moyenne (en mouvement):</strong> {activityStats.movingAverageSpeed.toFixed(2)} km/h
                      </p>
                      <p>
                        <strong>Vitesse maximale:</strong> {activityStats.maxSpeed.toFixed(2)} km/h
                      </p>
                    </div>

                    <div className="stats-card">
                      <h3>Répartition du temps</h3>
                      <div className="chart-container">
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
                              {activityStats.stopsData.map((entry, index) => (
                                <Cell key={`cell${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => `${value} min`} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  <div className="stats-card">
                    <h3>Distribution du temps par période</h3>
                    <div className="chart-container">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={activityStats.timeDistribution}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="period" />
                          <YAxis label={{ value: "Minutes", angle: -90, position: "insideLeft" }} />
                          <Tooltip formatter={(value) => `${value} min`} />
                          <Legend />
                          <Bar dataKey="minutes" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "vitesse" && (
                <div>
                  <div className="stats-card">
                    <h3>Vitesse au cours du temps</h3>
                    <div className="chart-container">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={activityStats.speedData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="time" />
                          <YAxis
                            label={{ value: "Vitesse (km/h)", angle: -90, position: "insideLeft" }}
                          />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="speed" stroke="#8884d8" name="Vitesse" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="stats-card">
                    <h3>Distance parcourue par intervalle de temps</h3>
                    <div className="chart-container">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={activityStats.movementData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="time" />
                          <YAxis label={{ value: "Distance (km)", angle: -90, position: "insideLeft" }} />
                          <Tooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="distance"
                            stroke="#00c49f"
                            name="Distance"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "arrets" && (
                <div>
                  <div className="stats-card">
                    <h3>Filtres des arrêts</h3>
                    <label htmlFor="minStopDuration">Durée minimale de l'arrêt :</label>
                    <select
                      id="minStopDuration"
                      value={minStopDuration}
                      onChange={(e) => setMinStopDuration(Number(e.target.value))}
                      className="duration-select"
                    >
                      <option value={5}>5 minutes</option>
                      <option value={15}>15 minutes</option>
                      <option value={30}>30 minutes</option>
                      <option value={45}>45 minutes</option>
                      <option value={60}>1 heure</option>
                    </select>
                  </div>
                  {activityStats.extendedStops.length > 0 ? (
                    activityStats.extendedStops
                      .filter((stop) => stop.duration >= minStopDuration)
                      .map((stop, index) => (
                        <div key={index} className="stats-card">
                          <h3>Arrêt {index + 1}</h3>
                          <p>
                            <strong>Début:</strong> {formatTime(stop.startTime)}
                          </p>
                          <p>
                            <strong>Fin:</strong> {formatTime(stop.endTime)}
                          </p>
                          <p>
                            <strong>Durée:</strong> {formatDuration(stop.duration)}
                          </p>
                          <p>
                            <strong>Adresse:</strong> {stop.address}
                          </p>
                        </div>
                      ))
                  ) : (
                    <p>Aucun arrêt prolongé détecté pour la durée sélectionnée ({minStopDuration} minutes).</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaticRouteMap;