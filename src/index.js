import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

export const myUserId = crypto.getRandomValues(new Uint32Array(1))[0].toString(36);


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <App />
);

