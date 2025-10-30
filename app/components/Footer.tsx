'use client';

import { useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Link from 'next/link';

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
    <footer className="bg-gray-100 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          {/* Left side - Copyright */}
          <div className="text-sm text-gray-600">
            © 2025 Secret Santa-inator
          </div>

          {/* Right side - Links */}
          <div className="flex flex-wrap justify-center sm:justify-end space-x-6 text-sm">
            <Link
              href="/about"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              About
            </Link>
            <a
              href="https://github.com/ihtnc/secret-santa-inator"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              GitHub
            </a>
            <button
              onClick={handleResetData}
              className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
            >
              Reset Data
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}