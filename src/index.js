import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

export const myUserId = crypto.getRandomValues(new Uint32Array(1))[0].toString(36);

export const isMobile = ()=> {
    const userAgent = navigator.userAgent.toLowerCase();
    return /iphone|ipod|android|blackberry|windows phone|nokia|webos|bada|symbian|tablet|kindle|mobile/.test(userAgent);
}

if (isMobile()) window.document.body.style.overflow = "hidden";

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <App />
);

