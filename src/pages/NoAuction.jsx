import React from 'react';
import { Gavel } from 'lucide-react';

const NoAuction = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center py-16 bg-white rounded-lg shadow-md max-w-2xl w-full">
        <Gavel className="w-24 h-24 mx-auto text-gray-400 mb-6" />
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          No Current Auctions
        </h1>
        <p className="text-lg text-gray-600">
          There is no current auction now...
        </p>
      </div>
    </div>
  );
};

export default NoAuction;
