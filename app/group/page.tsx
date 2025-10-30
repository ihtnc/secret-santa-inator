'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function GroupRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to my-groups page
    router.replace('/my-groups');
  }, [router]);

  // Show a loading state while redirecting
  return (
    <div className="bg-gray-50 flex items-center justify-center h-full">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting to your groups...</p>
      </div>
    </div>
  );
}