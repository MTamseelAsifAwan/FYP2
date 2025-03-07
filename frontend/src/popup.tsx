import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import './globals.css'
import Routers  from './Routers'

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <Routers/>
    </React.StrictMode>,
  );
} else {
  console.error('Root element not found');
}
