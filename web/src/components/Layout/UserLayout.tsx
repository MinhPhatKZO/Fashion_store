import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './UserHeader';
import Footer from './Footer';

const UserLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default UserLayout;



