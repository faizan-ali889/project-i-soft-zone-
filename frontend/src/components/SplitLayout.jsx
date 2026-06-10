import React from 'react';
import { Outlet } from 'react-router-dom';
import IconStrip from './IconStrip';
import ContextPanel from './ContextPanel';

const SplitLayout = () => {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', width: '100vw' }}>
      <IconStrip />
      <ContextPanel />
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        backgroundColor: 'var(--bg-base)', 
        position: 'relative',
        boxSizing: 'border-box'
      }}>
        <Outlet />
      </div>
    </div>
  );
};

export default SplitLayout;
