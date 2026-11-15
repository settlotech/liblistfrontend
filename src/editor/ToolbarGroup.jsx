import React from 'react';


export const ToolbarGroup = ({ children, className = '', label }) => {
  return (
    <div
      className={`toolbar-group ${className}`}
      role="group"
      aria-label={label}
    >
      <div className="toolbar-group-items">{children}</div>
      {label && <span className="toolbar-group-label">{label}</span>}
    </div>
  );
};
export default ToolbarGroup;
