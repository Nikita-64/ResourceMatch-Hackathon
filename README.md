# ResourceMatch — Smart Resource Allocation System

##  Problem Statement
Local NGOs and social groups collect community needs through 
paper surveys and field reports. This data is scattered, making 
it hard to identify urgent needs and deploy volunteers efficiently.

##  Solution
ResourceMatch is a web-based platform that:
- Centralizes community needs in one place
- Automatically matches volunteers to tasks using a smart 
  scoring algorithm
- Prioritizes high urgency needs first
- Connects the right volunteer to the right task based on 
  skill, location, and availability

##  How Matching Works
Each volunteer is scored against every need:
- Skill match (exact) → +5 points
- Skill match (related) → +3 points  
- Location match (exact) → +3 points
- Nearby location → +1 point
- High urgency → +2 points
- Medium urgency → +1 point
- Unavailable volunteer → disqualified

##  Authentication
- Email/Password and Phone OTP login
- Two roles: NGO Admin and Volunteer
- Admin access protected by invite code
- Role-based dashboard routing

##  Features
- Smart volunteer-to-need matching algorithm
- Real-time Firebase database
- Interactive map view of needs and volunteers
- Urgency breakdown charts
- CSV import and export
- Role-based dashboards (NGO & Volunteer)
- Secure authentication

## Tech Stack
- Frontend: HTML, CSS, Vanilla JavaScript
- Database: Firebase Firestore
- Authentication: Firebase Auth
- Map: Leaflet.js (OpenStreetMap)
- Hosting: Vercel

