import React from 'react';

const Loader = ({ message = 'Cargando tableros...' }) => {
  return (
    <div className="loader-overlay">
      <div className="loader-content">
        <div className="spinner"></div>
        <h2>{message}</h2>
      </div>
    </div>
  );
};

export default Loader;