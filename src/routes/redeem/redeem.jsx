import React from 'react'
import { useContext } from 'react';
import { AuthContext } from '../../context/authContext';

const Redeem = () => {
    const {currentUser} = useContext(AuthContext)
  return (
    <>
        <span>Your Citizen Score: {currentUser.citizen_score}</span>
    </>
  )
}

export default Redeem;