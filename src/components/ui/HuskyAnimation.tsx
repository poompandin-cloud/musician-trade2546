import React from 'react';
import './Husky.css'; // เดี๋ยวเราจะสร้างไฟล์นี้ในขั้นตอนถัดไป

const HuskyAnimation = () => {
  return (
    <div className="husky-container">
      <div className="husky">
        <div className="mane"><div className="coat"></div></div>
        <div className="body">
          <div className="head">
            <div className="ear"></div><div className="ear"></div>
            <div className="face">
              <div className="eye"></div><div className="eye"></div>
              <div className="nose"></div>
              <div className="mouth">
                <div className="lips"></div><div className="tongue"></div>
              </div>
            </div>
          </div>
          <div className="torso"></div>
        </div>
        <div className="legs">
          <div className="front-legs">
            <div className="leg"></div><div className="leg"></div>
          </div>
          <div className="hind-leg"></div>
        </div>
        <div className="tail">
          <div className="tail"><div className="tail"><div className="tail">
            <div className="tail"><div className="tail"><div className="tail"></div></div></div>
          </div></div></div>
        </div>
      </div>

      {/* SVG Filter ต้องมีเพื่อให้ภาพดูเหมือนวาดด้วยมือ */}
      <svg xmlns="http://www.w3.org/2000/svg" version="1.1" style={{ display: 'none' }}>
        <defs>
          <filter id="squiggly-0">
            <feTurbulence baseFrequency="0.02" numOctaves="3" result="noise" seed="0" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" />
          </filter>
          <filter id="squiggly-1">
            <feTurbulence baseFrequency="0.02" numOctaves="3" result="noise" seed="1" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" />
          </filter>
          <filter id="squiggly-2">
            <feTurbulence baseFrequency="0.02" numOctaves="3" result="noise" seed="2" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" />
          </filter>
          <filter id="squiggly-3">
            <feTurbulence baseFrequency="0.02" numOctaves="3" result="noise" seed="3" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" />
          </filter>
          <filter id="squiggly-4">
            <feTurbulence baseFrequency="0.02" numOctaves="3" result="noise" seed="4" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" />
          </filter>
        </defs>
      </svg>
    </div>
  );
};

export default HuskyAnimation;