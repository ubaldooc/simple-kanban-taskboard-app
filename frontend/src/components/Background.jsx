// frontend/src/components/Background.jsx
import React from 'react';
import './Background.css';

const Background = ({ url, isActive }) => {
  return (
    <div
      className={`background-layer ${isActive ? 'active' : ''}`}
      style={{ backgroundImage: `url(${url})` }}
    />
  );
};

export default Background;
