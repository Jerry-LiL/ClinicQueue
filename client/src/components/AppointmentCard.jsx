export default function AppointmentCard({ appointment, showPatient, children }) {
  return (
    <article className="appointment">
      <div>
        <h3>{appointment.doctor?.name || 'Doctor'}</h3>
        <p className="speciality">{appointment.doctor?.speciality}</p>
        <p>
          {appointment.date} at {appointment.time}
        </p>
        {showPatient && <p>Patient: {appointment.patient?.name}</p>}
        {appointment.reason ? <p>Reason: {appointment.reason}</p> : null}
      </div>
      <div className="actions">
        <span className={`pill pill-${appointment.status}`}>{appointment.status}</span>
        {children}
      </div>
    </article>
  );
}
