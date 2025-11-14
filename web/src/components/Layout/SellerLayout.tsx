import React from 'react';
import { Outlet } from 'react-router-dom';
import SellerHeader from './SellerHeader';
import Footer from './Footer';

const SellerLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <SellerHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default SellerLayout;
