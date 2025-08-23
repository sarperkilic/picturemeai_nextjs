import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { getFailedRendersLast24h, getRendersByProvider } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin (you may need to implement this check based on your user tier system)
    // For now, we'll check if the user has admin tier in their user data
    const userData = session.user;
    if (userData?.tier !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const provider = searchParams.get('provider');

    let data;

    if (type === 'failed-last-24h') {
      data = await getFailedRendersLast24h();
    } else if (type === 'by-provider' && provider) {
      data = await getRendersByProvider(provider);
    } else {
      return NextResponse.json(
        { error: 'Invalid query parameters. Use type=failed-last-24h or type=by-provider&provider=<provider>' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
} 