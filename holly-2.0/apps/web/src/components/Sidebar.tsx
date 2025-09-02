import React from 'react';
import { Link } from 'react-router-dom';

const Sidebar: React.FC = () => {
    return (
        <nav className="sidebar">
            <ul>
                <li>
                    <Link to="/">Dashboard</Link>
                </li>
                <li>
                    <Link to="/alerts">Alerts</Link>
                </li>
                <li>
                    <Link to="/vault">Vault</Link>
                </li>
                <li>
                    <Link to="/settings">Settings</Link>
                </li>
            </ul>
        </nav>
    );
};

export default Sidebar;