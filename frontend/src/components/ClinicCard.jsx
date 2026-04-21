export default function ClinicCard({ clinic }) {
  return (
    <div style={{ border: '1px solid #ddd', padding: 12, marginBottom: 10 }}>
      <h3>{clinic.name}</h3>
      <p>📍 {clinic.address}</p>
      <img src={clinic.images} alt="Clinic Image" style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
    </div>
  );
}
