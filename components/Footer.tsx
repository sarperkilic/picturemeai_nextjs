import { Link } from '@heroui/link';

import { GitHubIcon, XIcon } from '@/components/icons';

export function Footer() {
  return (
    <footer className='w-full flex items-center justify-center py-2 border-t border-default-50'>
      <div className='flex flex-wrap items-center justify-center gap-2 text-xs'>
        <Link
          className='text-default-400 hover:text-default-600 transition-colors'
          href='/terms'
        >
          Terms
        </Link>
        <span className='text-default-200'>•</span>
        <Link
          className='text-default-400 hover:text-default-600 transition-colors'
          href='/privacy'
        >
          Privacy
        </Link>
      </div>
    </footer>
  );
}
