# Road Traffic Frontend

A modern web application for monitoring and analyzing road traffic data, built with React and Vite.

## Features

- Interactive maps using Leaflet and Google Maps integration
- Real-time traffic data visualization
- Route planning and navigation
- Traffic analytics with Chart.js
- Calendar integration for scheduling
- Rich text editing capabilities
- Responsive and modern UI design

## Tech Stack

- **Frontend Framework**: React 18
- **Build Tool**: Vite
- **Maps & Location**:
  - Leaflet
  - Google Maps API
  - Leaflet Routing Machine
  - Leaflet GeoSearch
- **Data Visualization**: Chart.js
- **UI Components**:
  - React Calendar
  - React Select
  - React Quill (Rich Text Editor)
- **Routing**: React Router DOM
- **Styling**: SASS
- **HTTP Client**: Axios
- **Development Tools**:
  - ESLint
  - TypeScript support

## Getting Started

### Prerequisites

- Node.js (Latest LTS version recommended)
- npm or yarn

### Installation

1. Clone the repository:

   ```bash
   git clone [repository-url]
   cd road-traffic-frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   ```

3. Start the development server:

   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open your browser and visit `http://localhost:5173`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── assets/        # Static assets
├── components/    # Reusable React components
├── context/       # React context providers
├── lib/          # Utility functions and libraries
├── routes/       # Route components and configuration
├── App.jsx       # Main application component
└── main.jsx      # Application entry point
```

## Contributing

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
