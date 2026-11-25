# ClinicQueue

ClinicQueue is a small appointment desk for a clinic. A patient makes an account, searches for a doctor, and books a free slot. A doctor sees who is coming and can open more slots. An admin adds doctors and can cancel any appointment.

Two patients cannot hold the same doctor at the same time. MongoDB enforces that with a unique compound index on `doctor`, `date` and `time`.

## Features

- Patient, doctor and admin screens in React
- Express REST API with JWT login
- Role checks for booking, rescheduling and cancelling
- Doctors, slots and appointments stored with Mongoose
- Unique compound index on doctor + date + time for active bookings
- Search and filter doctors by name and speciality
- Appointment history for the logged-in patient (doctors see their own list, admins see everyone)

## Stack

- MongoDB and Mongoose
- Express and Node.js
- JSON Web Tokens (`jsonwebtoken`) and `bcryptjs` for passwords
- React with Vite, React Router and Axios

Both apps are plain JavaScript.

## Folder structure

```
client/                  React app
  src/api.js             Axios instance, attaches the JWT
  src/context/           Who is logged in
  src/components/        Navbar, route guards, appointment card
  src/pages/             One screen per task
server/
  server.js              Express app and route mounting
  seed.js                Demo users, doctors and slots
  config/db.js           MongoDB connection
  models/                User, Doctor, Slot, Appointment
  routes/                URL to controller
  controllers/           The actual work for each request
  middleware/auth.js     Checks the JWT and the role
  utils/validate.js      Email, date and time checks
```

## Data

Dates and times are strings such as `2026-11-25` and `09:00`. They are the server's local calendar date, not a UTC timestamp, so the value stored is the value shown on screen.

**User** — name, email, password (hashed), role (`patient`, `doctor` or `admin`).

**Doctor** — the user's login, plus name, speciality, fee and a short about line.

**Slot** — doctor, date, time, and `isBooked`. Unique on doctor + date + time, so the same opening cannot be created twice.

**Appointment** — patient, doctor, date, time, reason, and status (`booked` or `cancelled`).

The appointment index is partial. It only covers documents whose status is `booked`. A cancelled row stays in the collection for the history list, and it does not block a new booking of that time. The API waits for these indexes to finish building before it accepts requests.

Public registration always creates a patient. Sending `role: "admin"` from the browser is ignored. Doctor and admin users are created by the seed script, or by an admin adding a doctor.

## How a request moves

1. React calls the API with Axios. After login, the token from `localStorage` is sent as `Authorization: Bearer <token>`.
2. Register, login and doctor search are public and go straight to the controller.
3. A private route runs `protect`. That function checks the JWT and loads the user. The token itself only contains the user id.
4. `allowRoles(...)` returns 403 when the role is wrong. A doctor cannot book, and a patient cannot open a slot.
5. The controller reads or writes MongoDB through a Mongoose model.
6. Booking first claims the slot (`isBooked` must still be false). It then saves the appointment. If a second booked row for the same doctor, date and time gets through, MongoDB rejects it with error code 11000 and the API responds with 409.

## API

| Method | Path | Who | What it does |
| --- | --- | --- | --- |
| POST | /api/auth/register | Public | Create a patient and return a JWT |
| POST | /api/auth/login | Public | Check email and password, return a JWT |
| GET | /api/auth/me | Logged in | Current user |
| GET | /api/doctors | Public | Search with `name` and `speciality` query params |
| GET | /api/doctors/me | Doctor | Profile of the logged-in doctor |
| GET | /api/doctors/:id | Public | One doctor |
| POST | /api/doctors | Admin | Create a doctor login and profile |
| GET | /api/slots | Public | List slots. Query: `doctorId`, `date`, `available=true` |
| POST | /api/slots | Doctor, admin | Open a slot. Doctors can only open their own |
| DELETE | /api/slots/:id | Doctor, admin | Delete a slot that is not booked |
| GET | /api/appointments | Patient, doctor, admin | List, limited by role |
| POST | /api/appointments | Patient | Book a free slot |
| PUT | /api/appointments/:id/reschedule | Patient | Move your own booking to another free slot |
| PUT | /api/appointments/:id/cancel | Patient, doctor, admin | Cancel. Patients and doctors only touch their own |
| GET | /api/health | Public | `{ "ok": true }` |

`/api/doctors/me` is registered before `/api/doctors/:id`. If it were the other way around, Express would treat the word `me` as an id.

## Run it locally

You need Node.js 18 or newer, and MongoDB listening on port 27017.

```bash
cd server
cp .env.example .env
npm install
npm run seed
npm start
```

In a second terminal:

```bash
cd client
cp .env.example .env
npm install
npm start
```

Open http://localhost:5173

`npm run seed` wipes the `clinicqueue` database and loads demo data. Use it only on your own machine. Change `JWT_SECRET` in `server/.env` if this leaves your laptop. The `.env` files are not committed. `.env.example` shows the variable names only.

Vite reads `VITE_API_URL` from `client/.env`. If that file is missing, the app calls `http://localhost:5000/api`.

### Demo logins

| Role | Email | Password |
| --- | --- | --- |
| Patient | rahul@clinicqueue.com | patient123 |
| Doctor | priya@clinicqueue.com | doctor123 |
| Admin | admin@clinicqueue.com | admin123 |

The other seeded doctors use `doctor123` as well: arjun@clinicqueue.com, neha@clinicqueue.com, rohan@clinicqueue.com.

## Quick check

1. Log in as Rahul, or register a new patient.
2. Filter speciality to Cardiology and open Dr. Priya Sharma.
3. Book a free slot. It shows up under Appointment history.
4. Register a second patient and try to book that same slot. The API returns 409 and the first booking stays.
5. Cancel the visit. The row remains in history with status `cancelled`, and the slot is free again.
