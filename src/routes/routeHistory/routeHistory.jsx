import React from 'react'
import './routeHistory.css'

const RouteHistory = () => {
  return (
    <div className='btn-container'>
        <a href="/traffic-calendar" className="btn">Traffic Calendar</a>
        <a href="/festival-analysis" className="btn">Festival traffic analysis (last 4 years)</a>
        <a href="/last-four-week" className="btn">Last 4 week analysis for a WeekDay</a>
    </div>
  )
}

export default RouteHistory;