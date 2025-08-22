'use client';

import { usePathname } from 'next/navigation';

import { Navbar } from '@/components/navbar';
import { DashboardNavbar } from '@/components/dashboard-navbar';
import { useSession } from '@/lib/use-firebase-auth';

export function ConditionalNavbar() {
  const pathname = usePathname();
  const { user } = useSession();

  console.log('ConditionalNavbar - pathname:', pathname);
  console.log('ConditionalNavbar - user:', user);
  console.log('ConditionalNavbar - userId:', user?.id);

  // Use dashboard navbar for dashboard routes
  if (pathname?.startsWith('/dashboard')) {
    return <DashboardNavbar userId={user?.id} />;
  }

  // Use regular navbar for all other routes
  return <Navbar />;
}
