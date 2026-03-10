# Face Recognition Attendance System

A modern, intelligent face recognition-based attendance system designed for universities and colleges. Enables seamless, privacy-first automated attendance marking with role-based access control and comprehensive administrative features.

---

## 📋 Project Overview

The **Face Recognition Attendance System** automates attendance tracking using AI-powered face recognition. It replaces traditional manual roll calls with real-time, intelligent detection while maintaining privacy and security standards.

### Key Highlights:
- **Four-role system**: Admin, Faculty, Student, and Kiosk (anonymous)
- **AI-powered face recognition** using InsightFace embeddings
- **Role-based access control** with JWT authentication
- **Progressive Web App** for mobile and desktop access
- **Privacy-first design** with automatic image purging
- **Comprehensive audit trail** with CSV export capabilities
- **Real-time updates** using REST APIs
- **Multi-camera support** for kiosk mode

---

## 🛠️ Tech Stack Overview

### Frontend
- **React 19** - UI framework with hooks
- **TypeScript** - Type-safe JavaScript
- **Vite 6** - Fast build tool and dev server
- **Lucide React** - Icon library
- **Recharts** - Data visualization
- **Axios** - HTTP client

### Backend
- **FastAPI** (Python) - Modern async web framework
- **SQLAlchemy** - ORM for database operations
- **PostgreSQL** - Relational database
- **Uvicorn** - ASGI server
- **Pydantic** - Data validation
- **InsightFace** - Face recognition & embedding

### DevOps & Tools
- **JWT** - Token-based authentication
- **Passlib + bcrypt** - Password hashing
- **python-jose** - JWT handling
- **Pillow** - Image processing
- **OpenCV** - Computer vision
- **ONNX Runtime** - Model inference

---

## 📦 Prerequisites

Before starting, install the following:

| Software | Version | Download |
|----------|---------|----------|
| **Python** | 3.10+ | [python.org](https://www.python.org/downloads/) |
| **Node.js** | 18+ | [nodejs.org](https://nodejs.org/) |
| **PostgreSQL** | 12+ | [postgresql.org](https://www.postgresql.org/download/) |
| **Git** | Latest | [git-scm.com](https://git-scm.com/) (optional) |

Verify installations:
```bash
python --version
node --version
npm --version
psql --version
```

---

## 🚀 Step-by-Step Setup & Run Instructions

### Step 1: Database Setup

1. **Start PostgreSQL Service**:
   - **Windows**: Starts automatically during installation
   - **Linux**: `sudo systemctl start postgresql`
   - **Mac**: `brew services start postgresql`

2. **Create the Database**:
   ```bash
   psql -U postgres -c "CREATE DATABASE attendance_db;"
   ```
   - If prompted for password, enter your PostgreSQL admin password

3. **Verify Connection**:
   ```bash
   psql -U postgres -d attendance_db -c "SELECT version();"
   ```

---

### Step 2: Backend Setup

1. **Navigate to Project Root**:
   ```bash
   cd "path/to/Face-Recognition-Attendance-System"
   ```

2. **Install Python Dependencies**:
   ```bash
   pip install -r backend/requirements.txt
   ```
   
   This installs:
   - FastAPI & Uvicorn
   - SQLAlchemy & psycopg2
   - InsightFace & ONNX Runtime
   - Pydantic & JWT libraries

3. **Create `.env` File** (Optional - for custom configuration):
   
   Create `backend/.env`:
   ```env
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/attendance_db
   JWT_SECRET=your-secret-key-change-this
   JWT_ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=60
   MATCH_SIMILARITY_THRESHOLD=0.65
   MIN_SAMPLES_PER_STUDENT=8
   ```
   
   - Replace `YOUR_PASSWORD` with your PostgreSQL password
   - If no custom `.env`, default values will be used

4. **Start Backend Server**:
   ```bash
   uvicorn backend.main:app --reload
   ```
   
   ✅ **Backend is running on**: `http://localhost:8000`
   - API Documentation: `http://localhost:8000/docs` (Swagger UI)
   - ReDoc: `http://localhost:8000/redoc`

---

### Step 3: Frontend Setup

1. **Open New Terminal** (keep backend running):
   ```bash
   cd "path/to/Face-Recognition-Attendance-System"
   ```

2. **Install Node Dependencies**:
   ```bash
   npm install
   ```

3. **Start Frontend Dev Server**:
   ```bash
   npm run dev
   ```
   
   ✅ **Frontend is running on**: `http://localhost:3000`

---

### Step 4: Create Admin Account & Login

1. **Open Browser** and navigate to: `http://localhost:3000`

2. **Create First Admin Account**:
   - You'll see a "No Users Found" message with a button "Create Admin Account"
   - Click the button and fill in:
     - **Full Name**: Your name
     - **Email**: admin@example.com
     - **Password**: admin123 (or your preferred password)
   - Click **"Create Admin"**

3. **Login** with your newly created credentials

4. **Success!** You're now logged into the Admin Dashboard

---

## 📱 Using the Application

### Admin Console

#### 1. **Train Model Tab**
   - Select a student from the dropdown
   - Upload face images (PNG/JPG, max 5MB each)
   - Click "Start Training" to process face embeddings
   - System learns student's face patterns for recognition

#### 2. **Manage Users Tab**
   - Add new **Students**, **Faculty**, or **Admin** users
   - Edit user details (name, email, enrollment number, semester)
   - Assign subjects to students
   - Manage user roles and permissions

#### 3. **Manage Subjects Tab**
   - Create new subjects/courses with codes (e.g., CS101, MATH201)
   - Edit subject information
   - Delete courses
   - Bulk assign students to subjects

### Faculty Dashboard
- Start class sessions for assigned subjects
- View live attendance in real-time
- Monitor attendance statistics
- Export attendance records as CSV
- Manual attendance adjustment options

### Student Dashboard
- View enrolled subjects
- Check personal attendance percentage
- View detailed attendance history
- Download attendance records

### Kiosk Mode ("Give Attendance")
- **Anonymous attendance marking** - No login required
- Uses face recognition to automatically identify students
- Real-time feedback with visual confirmation
- No internet required (offline-capable)
- Live webcam feed with detection status

---

## 📂 Project Structure

```
Face-Recognition-Attendance-System/
│
├── backend/                           # FastAPI Backend
│   ├── main.py                       # Application entry point
│   ├── models.py                     # SQLAlchemy database models
│   ├── schemas.py                    # Pydantic request/response schemas
│   ├── auth.py                       # Authentication & password hashing
│   ├── config.py                     # Configuration & environment variables
│   ├── db.py                         # Database connection & initialization
│   ├── deps.py                       # Dependency injection
│   ├── face_service.py               # Face detection & embedding logic
│   ├── requirements.txt              # Python dependencies
│   └── routers/                      # API endpoints
│       ├── auth.py                   # Login & authentication endpoints
│       ├── admin.py                  # Admin operations (users, subjects)
│       ├── subjects.py               # Subject management
│       ├── sessions.py               # Class session management
│       ├── kiosk.py                  # Attendance marking endpoints
│       └── attendance.py             # Attendance records & export
│
├── src/                              # Frontend Source Code
│   ├── pages/                        # Page components
│   │   ├── Home.tsx                  # Login & landing page
│   │   ├── AdminDashboard.tsx        # Admin console
│   │   ├── FacultyDashboard.tsx      # Faculty functions
│   │   ├── StudentDashboard.tsx      # Student portal
│   │   └── Kiosk.tsx                 # Kiosk mode
│   │
│   ├── components/                   # Reusable components
│   │   ├── ManageUsersTab.tsx        # User management UI
│   │   ├── SubjectsTab.tsx           # Subject management UI
│   │   ├── TrainModelTab.tsx         # Face training UI
│   │   ├── MultiCamCapture.tsx       # Camera capture component
│   │   ├── WebcamCapture.tsx         # Webcam feed
│   │   └── Navbar.tsx                # Navigation bar
│   │
│   ├── context/                      # React Context (State Management)
│   │   └── AppContext.tsx            # Global app state & API calls
│   │
│   ├── App.tsx                       # Main app component
│   ├── index.tsx                     # React entry point
│   ├── apiClient.ts                  # Axios HTTP client
│   ├── types.ts                      # TypeScript type definitions
│   ├── constants.ts                  # Mock data & constants
│   └── index.html                    # HTML template
│
├── package.json                      # Node.js dependencies & scripts
├── tsconfig.json                     # TypeScript configuration
├── vite.config.ts                    # Vite configuration
├── README.md                         # This file
└── storage/                          # Local storage directory
    ├── raw/                          # Original uploaded images
    ├── crops/                        # Cropped face images
    ├── probes/                       # Test images during recognition
    └── models/                       # Pre-trained face models
```

---

## 🔧 Key Commands

### Backend Commands
```bash
# Navigate to project root
cd "path/to/Face-Recognition-Attendance-System"

# Install dependencies
pip install -r backend/requirements.txt

# Run backend server (with hot reload)
uvicorn backend.main:app --reload

# Run backend on specific port
uvicorn backend.main:app --reload --port 8001
```

### Frontend Commands
```bash
# Navigate to project root
cd "path/to/Face-Recognition-Attendance-System"

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Database Commands
```bash
# Connect to database
psql -U postgres -d attendance_db

# Create database
psql -U postgres -c "CREATE DATABASE attendance_db;"

# Drop database (caution!)
psql -U postgres -c "DROP DATABASE attendance_db;"

# List all databases
psql -U postgres -l
```

---

## 🔐 Default Credentials (After First Admin Creation)

| Role   | Email          | Password |
|--------|----------------|----------|
| Admin  | admin@test.com | admin123 |

**Note**: Credentials are automatically created when you first access the application.

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| **Port 8000 already in use** | Kill process: `netstat -ano \| findstr :8000` (Windows) or `lsof -i :8000` (Mac/Linux), then kill and retry |
| **Port 3000 already in use** | Run on different port: `npm run dev -- --port 3001` |
| **PostgreSQL connection failed** | Verify PostgreSQL is running and password is correct in `.env` |
| **Module not found (Python)** | Reinstall dependencies: `pip install --upgrade -r backend/requirements.txt` |
| **npm install fails** | Clear cache: `npm cache clean --force`, delete `node_modules` and retry |
| **CORS errors in browser** | Ensure backend is running on `localhost:8000` before making requests |
| **Face recognition not working** | Ensure face images are uploaded via "Train Model" tab before testing kiosk |
| **Cannot create admin account** | Verify backend is running and PostgreSQL database exists |

---

## 🎯 Quick Start Checklist

- [ ] PostgreSQL installed and running
- [ ] Database `attendance_db` created
- [ ] Python 3.10+ installed
- [ ] Node.js 18+ installed
- [ ] Backend dependencies installed: `pip install -r backend/requirements.txt`
- [ ] Frontend dependencies installed: `npm install`
- [ ] Backend running: `uvicorn backend.main:app --reload` (Terminal 1)
- [ ] Frontend running: `npm run dev` (Terminal 2)
- [ ] Browser open: `http://localhost:3000`
- [ ] Admin account created
- [ ] Successfully logged in ✅

---

## 📝 Features & Capabilities

✅ **Authentication**
  - JWT-based login system
  - Role-based access control (RBAC)
  - Secure password hashing

✅ **User Management**
  - Create/edit/delete users
  - Support for multiple roles (Admin, Faculty, Student)
  - Subject enrollment management

✅ **Face Recognition**
  - Real-time face detection
  - Face embedding generation
  - Similarity-based matching
  - Multi-face handling

✅ **Attendance System**
  - Automated marking via kiosk
  - Manual mark/reject options
  - CSV export functionality
  - Attendance history tracking

✅ **Admin Console**
  - User management interface
  - Subject/course management
  - Face training tool
  - System configuration

---

## 📚 Additional Resources

- **FastAPI Documentation**: https://fastapi.tiangolo.com/
- **React Documentation**: https://react.dev/
- **PostgreSQL Documentation**: https://www.postgresql.org/docs/
- **InsightFace GitHub**: https://github.com/deepinsight/insightface
- **Vite Documentation**: https://vitejs.dev/

---

## 💡 Tips for First-Time Users

1. **Start Simple**: Create one student, add face images, then test kiosk
2. **Use Test Data**: The system comes with demo credentials for quick testing
3. **Read Logs**: Check terminal output for detailed error messages
4. **Check API Docs**: Visit `http://localhost:8000/docs` to explore all endpoints
5. **Learn Step-by-Step**: Master admin console before testing kiosk

---

## ✨ We're All Set!

You now have everything needed to run the Face Recognition Attendance System independently. Follow the setup steps, and you'll have a fully functional attendance system in minutes!

For questions or issues, refer to the troubleshooting section or check the source code comments.

**Happy Coding! 🚀**
| GET    | `/students/{id}`        | Get student details |
| POST   | `/students/{id}/images` | Upload enrollment images (multipart) |
| POST   | `/admin/train`          | Recompute embeddings & canonical vectors |
| POST   | `/windows/arm`          | Start attendance window |
| POST   | `/windows/close`        | End attendance window |
| GET    | `/windows/active`       | Get current active window |
| POST   | `/recognize`            | Submit embedding/cropped face for match |
| WS     | `/ws`                   | Real-time updates |
| POST   | `/otp/request`          | Student requests OTP |
| POST   | `/otp/verify`           | Verify OTP & mark attendance |

---

## Database Schema (PostgreSQL)

```sql
students
└── enrollment_no (PK), name, semester, email, consent_ts, created_at

subjects
└── id (PK), code, name, semester

student_subjects
└── id, enrollment_no FK, subject_id FK

student_images
└── id, enrollment_no FK, file_path, processed_path, captured_at

embeddings
└── id, enrollment_no FK, vector BYTEA, image_id FK

student_profile
└── enrollment_no (PK), canonical_embedding BYTEA, updated_at

attendance_windows
└── id, subject_id, faculty_id, start_ts, end_ts, status

attendance_records
└── id, enrollment_no, subject_id, timestamp, method, confidence, window_id

prediction_logs
└── id, attempted_at, predicted_enrollment, confidence, status, note, window_id
```

## Indexes

- `attendance_records(subject_id, timestamp)`
- `embeddings(enrollment_no)`
- `prediction_logs(window_id)`

---

## Data Retention

- **Raw images** → auto-purge after **30 days**
- **Embeddings** → retained unless student removed
- **Logs** → retained for **1 year**

---

## Machine Learning Pipeline

### Face Detection
- InsightFace or OpenCV DNN
- Configurable: `scaleFactor`, `minNeighbors`

### Preprocessing
- Optional landmark alignment
- Resize to **112×112** or **160×160**
- Normalize pixel values

### Embedding Model
- **ArcFace** (recommended) or **FaceNet**
- 512-dimensional **L2-normalized** vectors

### Matching
- Canonical embedding = mean of all normalized enrollment embeddings
- Similarity metric → **Cosine similarity**
- Default threshold → **0.65**
- Return **top-3 candidates** for unresolved cases

### Liveness (MVP)
Compare **two consecutive frames**:
- Embedding distance < **0.3**
- Low motion difference  
Helps prevent basic photo spoofing.

### Optional Indexing
- **FAISS** index recommended for datasets **>10,000 students**

---

## Configuration (`.env`)

```env
MATCH_THRESHOLD=0.65
MIN_ENROLLMENT_IMAGES=8
IMAGE_PURGE_DAYS=30
OTP_RATE_LIMIT=3/hour
RECOGNITION_RATE_LIMIT=5/sec
EMBEDDING_MODE=edge
DATABASE_URL=postgresql://user:password@localhost/db
JWT_SECRET=your_secret_key
```

otp_requests
└── id, student_enrollment, window_id, hashed_otp, expires_at, status
