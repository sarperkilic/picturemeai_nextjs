'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { ErrorBoundary } from '@/components/error-boundary';
import { useSession } from '@/lib/use-firebase-auth';
import { useCreditsStore } from '@/lib/credits-store';
import { useProjectsStore } from '@/lib/projects-store';
import { UGCMenuPanel } from '@/components/dashboard/UGCMenuPanel';
import { GenerationGuide } from '@/components/dashboard/GenerationGuide';
import { GeneratedVideosSection } from '@/components/dashboard/GeneratedVideosSection';
import { UGCModal } from '@/components/dashboard/UGCModal';

export function UGCDashboardClient() {
  const router = useRouter();
  const { user, isLoading } = useSession();
  const { fetchCredits } = useCreditsStore();
  const { fetchProjectsForDashboard } = useProjectsStore();

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/sign-in');
    }
  }, [user, isLoading, router]);

  // Load credits and projects on component mount
  useEffect(() => {
    if (user?.id) {
      fetchCredits();
      fetchProjectsForDashboard(user.id, 10);
    }
  }, [user?.id, fetchCredits, fetchProjectsForDashboard]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className='w-full min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4' />
          <p className='text-default-500'>Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  return (
    <ErrorBoundary>
      <section className='w-full min-h-screen'>
        <div className='w-full px-6 py-8'>
          <div className='container mx-auto max-w-7xl'>
            {/* 2-Column Layout */}
            <div className='grid grid-cols-1 lg:grid-cols-12 gap-8'>
              {/* Left Column - Menu Panel (narrower) */}
              <div className='lg:col-span-3'>
                <div className='lg:sticky lg:top-20'>
                  <UGCMenuPanel />
                </div>
              </div>

              {/* Right Column - Main Content (wider) */}
              <div className='lg:col-span-9'>
                <div className='space-y-8'>
                  {/* Upper Section - Generation Guide */}
                  <GenerationGuide />

                  {/* Lower Section - Generated Videos */}
                  <GeneratedVideosSection />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* UGC Modal */}
        <UGCModal />
      </section>
    </ErrorBoundary>
  );
}
