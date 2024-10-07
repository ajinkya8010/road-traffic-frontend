import React from 'react';
import './analysis.css';
import MapRouting from '../../components/mapRouting/mapRouting';
import FestivalChecker from '../../components/festivalChecker/festivalChecker';

const Analysis = () => {
  return (
    <div>
      <MapRouting/>
      <FestivalChecker/>
    </div>

  )
}

export default Analysis;