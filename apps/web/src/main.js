import { jsx as _jsx } from "react/jsx-runtime";
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import './components/GameComponent';
import { RecoilRoot } from 'recoil';
createRoot(document.getElementById('root')).render(_jsx(RecoilRoot, { children: _jsx(App, {}) }));
