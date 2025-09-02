import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Routes from './router';

const AppLayout: React.FC = () => {
    return (
        <Router>
            <div className="app-layout">
                <Header />
                <div className="main-content">
                    <Sidebar />
                    <div className="content">
                        <Routes />
                    </div>
                </div>
            </div>
        </Router>
    );
};

export default AppLayout;