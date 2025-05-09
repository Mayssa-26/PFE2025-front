// 'use client';

// import { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { toast, ToastContainer } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import './Reports.css';

// const AdminReportsDashboard = () => {
//   const navigate = useNavigate();
//   const [reports, setReports] = useState([]);
//   const [pdfs, setPdfs] = useState([]);
//   const [filterVehicle, setFilterVehicle] = useState('');
//   const [filterDate, setFilterDate] = useState('');
//   const [filterCompanyGroup, setFilterCompanyGroup] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
//   const [isDeleting, setIsDeleting] = useState({});
//   const [error, setError] = useState(null);

//   const companyGroups = [...new Set(reports.map((report) => report.companyGroup))];

//   // Fetch reports
//   useEffect(() => {
//     const fetchReports = async () => {
//       setIsLoading(true);
//       try {
//         const response = await fetch('/api/reports', {
//           headers: {
//             'Accept': 'application/json',
//             // Add authentication if needed: 'Authorization': `Bearer ${localStorage.getItem('token')}`,
//           },
//         });
//         if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`);
//         const data = await response.json();
//         setReports(data);
//       } catch (error) {
//         console.error('Erreur:', error);
//         toast.error(`Erreur: ${error.message}`);
//         setError(`Erreur: ${error.message}`);
//       } finally {
//         setIsLoading(false);
//       }
//     };
//     fetchReports();
//   }, []);

//   // Fetch PDFs
//   useEffect(() => {
//     const fetchPdfs = async () => {
//       try {
//         const response = await fetch('/api/pdfs', {
//           headers: {
//             'Accept': 'application/json',
//             // Add authentication if needed
//           },
//         });
//         if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`);
//         const data = await response.json();
//         setPdfs(data);
//       } catch (error) {
//         console.error('Erreur:', error);
//         toast.error(`Erreur: ${error.message}`);
//         setError(`Erreur: ${error.message}`);
//       }
//     };
//     fetchPdfs();
//   }, []);

//   // Delete PDF
//   const handleDeletePDF = async (id) => {
//     setIsDeleting((prev) => ({ ...prev, [id]: true }));
//     try {
//       const response = await fetch(`/api/pdf/${id}`, {
//         method: 'DELETE',
//         headers: {
//           // Add authentication if needed
//         },
//       });
//       if (!response.ok) throw new Error('Erreur lors de la suppression du PDF');
//       setPdfs((prevPdfs) => prevPdfs.filter((pdf) => pdf.id !== id));
//       toast.success('PDF supprimé avec succès.');
//     } catch (error) {
//       console.error('Erreur:', error);
//       toast.error('Erreur lors de la suppression du PDF.');
//     } finally {
//       setIsDeleting((prev) => ({ ...prev, [id]: false }));
//     }
//   };

//   // Download PDF
//   const handleDownloadPDF = async (report) => {
//     try {
//       const summary = report.summary;
//       const response = await fetch('/api/reports/generate-pdf', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           vehicleName: report.vehicleName,
//           companyGroup: report.companyGroup,
//           period: report.period,
//           positions: report.positions,
//           summary: summary,
//         }),
//       });

//       if (!response.ok) throw new Error('Erreur lors de la génération du PDF');

//       const { fileUrl, fileName } = await response.json();
//       setPdfs((prevPdfs) => [...prevPdfs, { id: fileUrl.split('/').pop(), fileName }]);

//       const link = document.createElement('a');
//       link.href = fileUrl;
//       link.download = fileName;
//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);
//     } catch (error) {
//       console.error('Erreur:', error);
//       toast.error('Erreur lors du téléchargement du PDF.');
//     }
//   };

//   const handleViewReport = (report) => {
//     navigate('/route', {
//       state: {
//         positions: report.positions,
//         period: report.period,
//         vehicleName: report.vehicleName,
//         companyGroup: report.companyGroup,
//       },
//     });
//   };

//   const formatDate = (date) => {
//     return new Date(date).toISOString().split('T')[0];
//   };

//   const formatDuration = (minutes) => {
//     if (!Number.isFinite(minutes) || minutes < 0) return 'N/A';
//     const hours = Math.floor(minutes / 60);
//     const mins = Math.floor(minutes % 60);
//     return `${hours}h ${mins}min`;
//   };

//   return (
//     <div className="admin-reports-container">
//       <ToastContainer />
//       <h1>Tableau de Bord des Rapports - Super Admin</h1>
//       {error && <p className="error-message">{error}</p>}
//       <div className="filters">
//         <input
//           type="text"
//           placeholder="Filtrer par véhicule"
//           value={filterVehicle}
//           onChange={(e) => setFilterVehicle(e.target.value)}
//           className="filter-input"
//         />
//         <input
//           type="date"
//           value={filterDate}
//           onChange={(e) => setFilterDate(e.target.value)}
//           className="filter-input"
//         />
//         <select
//           value={filterCompanyGroup}
//           onChange={(e) => setFilterCompanyGroup(e.target.value)}
//           className="filter-input"
//         >
//           <option value="">Tous les groupes de société</option>
//           {companyGroups.map((group) => (
//             <option key={group} value={group}>
//               {group}
//             </option>
//           ))}
//         </select>
//       </div>
//       {isLoading ? (
//         <p>Chargement des rapports...</p>
//       ) : (
//         <div className="reports-list">
//           {Object.keys(groupedReports).length > 0 ? (
//             Object.keys(groupedReports).map((group) => (
//               <div key={group} className="company-group-section">
//                 <h2>{group}</h2>
//                 <table className="reports-table">
//                   <thead>
//                     <tr>
//                       <th>Véhicule</th>
//                       <th>Date</th>
//                       <th>Distance</th>
//                       <th>Durée</th>
//                       <th>Actions</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {groupedReports[group].map((report) => (
//                       <tr key={report.id}>
//                         <td>{report.vehicleName}</td>
//                         <td>{new Date(report.period.from).toLocaleDateString()}</td>
//                         <td>{report.summary?.realRoute?.distance || 'N/A'}</td>
//                         <td>{formatDuration(report.summary?.realRoute?.duration)}</td>
//                         <td>
//                           <button
//                             className="action-btn view-btn"
//                             onClick={() => handleViewReport(report)}
//                           >
//                             Voir
//                           </button>
//                           <button
//                             className="action-btn download-btn"
//                             onClick={() => handleDownloadPDF(report)}
//                           >
//                             Télécharger PDF
//                           </button>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             ))
//           ) : (
//             <p>Aucun rapport trouvé.</p>
//           )}
//         </div>
//       )}
//       <div className="pdf-links-section">
//         <h2>Rapports Téléchargés (PDF)</h2>
//         {pdfs.length > 0 ? (
//           <table className="pdf-table">
//             <thead>
//               <tr>
//                 <th>Nom du Fichier</th>
//                 <th>Télécharger</th>
//                 <th>Supprimer</th>
//               </tr>
//             </thead>
//             <tbody>
//               {pdfs.map((pdf) => (
//                 <tr key={pdf.id}>
//                   <td>{pdf.fileName}</td>
//                   <td>
//                     <a
//                       href={`/api/pdf/${pdf.id}`}
//                       download={pdf.fileName}
//                       className="action-btn download-btn"
//                     >
//                       Télécharger
//                     </a>
//                   </td>
//                   <td>
//                     <button
//                       className="action-btn delete-btn"
//                       onClick={() => handleDeletePDF(pdf.id)}
//                       disabled={isDeleting[pdf.id]}
//                     >
//                       {isDeleting[pdf.id] ? 'Suppression...' : 'Supprimer'}
//                     </button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         ) : (
//           <p>Aucun PDF disponible.</p>
//         )}
//       </div>
//     </div>
//   );
// };

// export default AdminReportsDashboard;