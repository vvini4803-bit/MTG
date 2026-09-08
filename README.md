# 🌾 BUILD MY DIGITAL VILLAGE SUPER APP (ನಮ್ಮ ಗ್ರಾಮಸಿರಿ)

Build a **real, beautiful, production-ready Digital Village Super App + responsive website** for my village.

The app feels like a premium modern 2026 application with beautiful animations, but is **extremely simple to use**.

---

## ⭐ MOST IMPORTANT DESIGN PRINCIPLE

### POWERFUL TECHNOLOGY UNDERNEATH
### SIMPLE EXPERIENCE ON TOP

The app is for:
- 🌾 **Farmers**
- 👵 **Elderly people**
- 🎓 **Students**
- 🧒 **Children**
- 👨‍👩‍👧‍👦 **Families**
- 💼 **Working people**
- 🤝 **Everyone in the village**

A farmer who is not comfortable with technology can open the app and understand it immediately.

Key Design Elements:
- Large buttons
- Large icons
- Large readable text
- Kannada + English (`ಕನ್ನಡ | EN`)
- Simple words
- Minimal forms
- Voice interaction
- Clear navigation
- Very few main options
- Beautiful but lightweight animations

The application feels:
**Simple like WhatsApp** + **Beautiful like a premium modern app** + **Useful like a digital village information center**.

---

# 🏡 MAIN APP STRUCTURE

The main application has ONLY these major sections:

### 🏠 HOME
### 📰 NEWS
### 📅 EVENTS
### 🏏 SPORTS
### 🌾 AGRICULTURE
### 🛕 TEMPLES
### 📸 PHOTOS
### 🗺️ VILLAGE MAP
### 🤖🎙️ ASK VILLAGE

Everything else is placed **naturally inside** these sections:
- **Inside Home**: ℹ️ About Our Village (Population, Households, Area, Crops, last verified date), 📖 Our Village (History, traditions), 🏆 Our Achievers (Athletes, farmers, students).
- **Inside News**: ➕ SHARE UPDATE (🎙️ SPEAK, 📷 PHOTO, ⌨️ TYPE) with trust moderation badges.
- **Inside Map**: Community landmarks (Temples, Schools, Clinic, Sports, Bus stops, Water points, Emergency) with 1-tap Google Maps directions.

---

# 🏠 HOME SCREEN & HERO DESIGN

The home screen feels like entering the village:
- **Village Hero**: Moving crops in the wind, soft sunlight, gentle morning clouds, and subtle floating particles without heavy laggy 3D.
- **🔴 LIVE VILLAGE UPDATE**: A clean real-time status ticker showing verified announcements, emergency alerts, or live sports updates.
- **8 Large Cards**:
  ```text
  📰 NEWS          📅 EVENTS
  🏏 SPORTS        🌾 AGRICULTURE
  🛕 TEMPLES       📸 PHOTOS
  🗺️ VILLAGE MAP   🎙️ ASK VILLAGE
  ```
- **Mobile Bottom Navigation**: Only 5 clean tabs:
  `🏠 Home | 📰 News | 📅 Events | 🎙️ Ask | 👤 Profile`

---

# 📰 NEWS & TRUST SYSTEM

Real-time village news feed with category filters (Announcements, Agriculture, Water, Power, Sports, Emergency).

### ➕ SHARE UPDATE
Residents can submit news with 3 simple options:
- 🎙️ **SPEAK**: Speaks in Kannada or English -> instant speech-to-text transcription.
- 📷 **PHOTO**: Take photo or choose file with client-side image compression.
- ⌨️ **TYPE**: Simple headline and optional details.

### 🛡️ News Trust Badges
Every item has a clear status:
- 🟢 **VERIFIED** — Officially confirmed by Village Administration.
- 🔵 **COMMUNITY REPORT** — Submitted by a resident; pending review.
- 🟡 **CHECKING** — Currently under review by village moderators.
- 🔴 **REJECTED** — Dismissed as rumor or inaccurate.

---

# 📅 EVENTS

Village festivals, temple jatre, sports tournaments, school programs, and health camps.
- Event Name & Kannada Name
- Date, Time, Venue, and Organizer
- **⏳ COUNTDOWN**: "2 DAYS TO GO", "TOMORROW"
- **🔴 LIVE NOW**: Displayed when the event is actively happening
- **COMPLETED**: Archived event history
- Interactive RSVP with celebration confetti

---

# 🏏 SPORTS

- Tournaments for **Cricket**, **Kabaddi**, **Volleyball**, and **Football**.
- Fixtures, teams, points table, and photo archives.
- **Real-Time Scorekeeper**: Authorized sports organizers can update runs, wickets, overs, or raid points with ball-by-ball commentary.

---

# 🌾 AGRICULTURE

Tailored specifically for farmers:
- Large visual cards: **🌾 Crops**, **🌱 Seasons**, **💧 Irrigation**, **🚜 Farming**, **🧑‍🌾 Farmer Stories**, **📚 Knowledge**.
- Local crops: Arecanut (ಅಡಿಕೆ), Paddy (ಭತ್ತ), Black Pepper (ಕಾಳುಮೆಣಸು), Coconut (ತೆಂಗು).
- Separation of **🟢 VERIFIED LOCAL INFORMATION** from **ℹ️ GENERAL AGRICULTURE INFORMATION**.
- Daily Mandi rates and 3-phase pump electricity supply schedules.

---

# 🛕 TEMPLES & CULTURAL HERITAGE

- Traditional temple records: Daily darshan & pooja timings, festival dates, committee phone numbers.
- Strict labels: **🟢 HISTORICAL FACT** vs **🔵 LOCAL STORY** vs **🟡 UNVERIFIED INFORMATION**.

---

# 📸 PHOTOS

- Photo gallery categories: Festivals, Temples, Sports, Agriculture, Scenery, Old photos.
- ➕ Upload Photo: Take Photo / Choose File with automatic client-side compression and moderation approval.

---

# 🗺️ VILLAGE MAP (ನಮ್ಮ ಊರಿನ ನಕ್ಷೆ)

Public community places with large, easy-to-understand markers:
- 🛕 Temples
- 🏫 Schools
- 🏥 Health Centers (PHC)
- 🏏 Sports Grounds
- 🏛️ Community & Panchayat Halls
- 🚌 Bus Stops & Auto Stands
- 💧 Pure Drinking Water RO Plants
- 🏦 Banks / ATMs
- 🚨 Emergency Police Outposts
- Tapping a marker shows: Name, Description, Distance from center, and **🧭 GET DIRECTIONS** (opens Google Maps navigation).

---

# 🤖🎙️ ASK VILLAGE (ನಮ್ಮ ಊರನ್ನು ಕೇಳಿ)

AI Assistant powered by an animated 3D particle orb:
- **Large 🎙️ ASK Button**: Speak or type in **Kannada** or **English**.
- **Source of Truth**: Grounded strictly in verified village records (news, events, temples, crops, contacts, map locations).
- **AI Safety Guarantee**: Never fabricates or hallucinates facts. If data is unavailable, politely responds: *"I couldn't find verified information about that yet."*
- **Gemini AI Integration**: Securely connects to Google Gemini using `VITE_GEMINI_API_KEY` without exposing keys in frontend code.

---

# 👥 USER ROLES & SECURITY

- **7 Granular Roles**: `SUPER_ADMIN`, `ADMIN`, `MODERATOR`, `EVENT_ORGANIZER`, `SPORTS_ORGANIZER`, `VERIFIED_CONTRIBUTOR`, `USER`.
- **Database & Storage Rules**: Production-grade `firestore.rules` and `storage.rules` with deny-by-default, document ownership, status locks, and 5MB upload validation.
- **Privacy First**: Phone numbers, emails, and personal addresses are never publicly exposed.

---

# 🚀 RUNNING LOCALLY

### Prerequisites
- Node.js v18+
- npm

### Start Development Server
```bash
npm run dev
```
Open **`http://localhost:5173/`** in any browser.

### Build for Production
```bash
npm run build
```
Emits optimized, clean production bundles in `dist/`.

### 🤖 Gemini AI Configuration
The application supports a multi-key pool for high availability and failover:
```env
VITE_GEMINI_API_KEY=your_key_1
VITE_GEMINI_API_KEY_2=your_key_2
VITE_GEMINI_API_KEY_3=your_key_3
```
- **Voice Assistant**: Real-time Kannada & English village Q&A grounded in live database state.
- **Community Chat**: Real-time Kannada ⇄ English translation, smart replies, and message polishing.
- **Automatic Failover**: Seamlessly rotates across keys if quota or rate limit (HTTP 429) is hit.

