import React from 'react';
import './ToggleSwitch.css';

export default function ToggleSwitch({ label, checked, onChange, name }) {
  return (
    <div className="toggle-switch-container">
      {label && <span className="toggle-label">{label}</span>}
      <label className="toggle-switch">
        <input 
          type="checkbox" 
          name={name}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="slider round"></span>
      </label>
    </div>
  );
}
