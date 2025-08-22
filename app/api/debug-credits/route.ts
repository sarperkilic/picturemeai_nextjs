import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

import { auth } from '@/lib/auth';
import { getUserCredits } from '@/lib/credits';

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: headers() });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Debug: User ID:', session.user.id);
    
    const credits = await getUserCredits(session.user.id);
    console.log('Debug: Credits fetched:', credits);

    return NextResponse.json({
      userId: session.user.id,
      credits: credits,
      session: {
        user: {
          id: session.user.id,
          email: session.user.email,
        }
      }
    });
  } catch (error) {
    console.error('Debug: Error fetching user credits:', error);

    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 