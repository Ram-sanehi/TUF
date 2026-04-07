# Calendar

An interactive wall calendar component with date range selection, notes, and month-specific imagery.

## What's in it

- Wall calendar UI with 3D depth and animations
- Pick date ranges across the calendar  
- 7 lines for notes that save to your browser
- Responsive design (desktop & mobile)
- Month images sourced from Pinterest and hosted on Cloudinary

## Setup

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`

## How it works

Built with React + TypeScript. Everything's in one component for easy integration. Notes and date selections are stored in localStorage, so they persist on reload.

Month images are pulled from Pinterest, uploaded to Cloudinary for hosting, and swapped based on the current month.
