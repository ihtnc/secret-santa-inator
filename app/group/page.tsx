'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loading } from '@/app/components/Loading';

export default function GroupRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to my-groups page
    router.replace('/my-groups');
  }, [router]);

  // Show a loading state while redirecting
  return <Loading message="Redirecting to your groups..." />;
}