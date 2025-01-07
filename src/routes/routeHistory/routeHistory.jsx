import React from 'react'
import './routeHistory.css'

const RouteHistory = () => {
  return (
    <div className='btn-container'>
        <a href="/line-score-date" className="btn">View Date v/s Score for a path</a>
        <a href="/bar-score-time" className="btn">View Time vs Score for a path</a>
        {/* <a href="/line-score-date-all" className="btn">Compare Date v/s Score for all paths</a> */}
    </div>
  )
}

export default RouteHistory;