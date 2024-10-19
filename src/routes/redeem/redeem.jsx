import React, { useContext } from 'react';
import { AuthContext } from '../../context/authContext';
import Card from '../../components/card/card';
import "./redeem.css";

const Redeem = () => {
    const { currentUser } = useContext(AuthContext);
    const images = [
        {
            'src': '/card1.jpg', 
            'desc': '60% off - Courses',
            'points': 1000
        },
        {
            'src': '/card2.jpg', 
            'desc': 'Public Transport',
            'points': 1000
        },
        {
            'src': '/card3.jpg', 
            'desc': '50% off - Fabrics',
            'points': 800
        },
        {
            'src': '/card4.jpg', 
            'desc': '70% off',
            'points': 1200
        },
        {
            'src': '/card5.jpg', 
            'desc': 'Sale',
            'points': 800
        },
        {
            'src': '/card6.jpg',
            'desc': 'Sale',
            'points': 1000 
        },
        {
            'src': '/card7.jpg', 
            'desc': '60% off - Academic Books',
            'points': 900
        },
        {
            'src': '/card8.jpg', 
            'desc': 'Citizen award trophy',
            'points': 1200
        },
        {
            'src': '/card9.jpg', 
            'desc': '60% off - Footware',
            'points': 1000
        },
    ];

    return (
        <div className="redeem-container">
            <div className="citizen-score-card">
                <span className="citizen-score-title">Citizen Score </span>
                <span className="citizen-score-value">{currentUser.citizen_score}</span>
            </div>
            <div className="card-grid">
                {images.map((obj, index) => (
                    <Card key={index} obj={obj}/>
                ))}
            </div>
        </div>
    );
}

export default Redeem;
