# AeroWeather - Full-Stack Weather Application

A premium, full-stack weather tracking application built with Next.js, Prisma, SQLite, and Tailwind CSS. 
This project fulfills all frontend and backend requirements for the PM Accelerator assignment.

## Features
- **Hyper-local Weather Tracking**: Search by City, Zip Code, Landmark, or use the "My Location" GPS button.
- **Advanced Weather Metrics**: Real-time Temperature, "Feels Like", Humidity, Wind Speed, and Surface Pressure (via Open-Meteo API).
- **5-Day Forecast**: Animated grid displaying daily high/low temperatures.
- **Database Persistence**: Full CRUD functionality via Prisma ORM & SQLite.
  - Create: Automated logging of all weather searches.
  - Read: Interactive SaaS-style history dashboard.
  - Update: Add custom notes to historical records.
  - Delete: Remove historical records.
- **Data Export**: Export search history to CSV or JSON formats.
- **Premium Glassmorphism UI**: Dynamic ambient backgrounds, blur effects, and micro-animations.

## Technology Stack
- **Frontend**: Next.js (App Router), React, Tailwind CSS, Lucide React (Icons).
- **Backend**: Next.js API Routes.
- **Database**: Prisma ORM, local SQLite Database (`dev.db`).

## Project Structure
The project was explicitly structured to maintain strict separation of concerns:
- `/frontend/` - React components, UI state, and styling.
- `/backend/` - Business logic and external API integrations.
- `/database/` - Prisma ORM client and database schema.
- `/src/app/` - Next.js routing, layouts, and API Controllers.

## How to Run Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Generate the Prisma Client and Sync Database:
   ```bash
   npx prisma db push
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`.

## Developer
- **Tahir Hussain** - BSAI Student (Islamabad, Pakistan)
