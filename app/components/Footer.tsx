'use client';

import { useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Link from 'next/link';
import DarkModeToggle from './DarkModeToggle';

export default function Footer() {
  // Initialize localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const existingCode = localStorage.getItem('creatorCode');
      if (!existingCode) {
        const newCreatorCode = uuidv4();
        localStorage.setItem('creatorCode', newCreatorCode);
      }
    }
  }, []);

  const handleResetData = () => {
    if (typeof window !== 'undefined') {
      const newCreatorCode = uuidv4();
      localStorage.setItem('creatorCode', newCreatorCode);

      // Reload the page to reflect changes
      window.location.reload();
    }
  };

  return (
    <footer className="bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="relative flex flex-col sm:flex-row justify-between items-center sm:items-center space-y-4 sm:space-y-0">
          {/* Copyright - centered on mobile, left on desktop */}
          <div className="text-sm text-secondary text-center sm:text-left">
            © 2025 Secret Santa-inator
          </div>

          {/* Single toggle - positioned absolutely to not interfere with flex layout */}
          <div className="absolute top-0 right-0 flex items-center -mt-4 -mr-2 sm:static sm:left-1/2 sm:transform sm:-translate-x-1/2 sm:mt-0 sm:mr-0">
            <DarkModeToggle />
          </div>

          {/* Links - centered on mobile, right on desktop */}
          <div className="flex flex-wrap justify-center sm:justify-end space-x-6 text-sm w-full sm:w-auto">
            <Link
              href="/about"
              className="text-secondary hover:text-primary transition-colors"
            >
              About
            </Link>
            <a
              href="https://github.com/ihtnc/secret-santa-inator"
              target="_blank"
              rel="noopener noreferrer"
              className="text-secondary hover:text-primary transition-colors"
            >
              GitHub
            </a>
            <button
              onClick={handleResetData}
              className="text-secondary hover:text-primary transition-colors cursor-pointer"
            >
              Reset Data
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}