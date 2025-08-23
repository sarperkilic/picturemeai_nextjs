'use client';

import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from '@heroui/dropdown';
import { Avatar } from '@heroui/avatar';
import { Button } from '@heroui/button';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/lib/use-firebase-auth';

interface UserMenuProps {
  onNavigate?: () => void;
}

export function UserMenu({ onNavigate }: UserMenuProps) {
  const { user, isLoading, signOut } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className='w-8 h-8 animate-pulse bg-default-200 rounded-full' />
    );
  }

  if (!user) {
    return (
      <Button
        as={NextLink}
        color='primary'
        href='/auth/sign-in'
        size='sm'
        variant='flat'
        onClick={() => onNavigate?.()}
      >
        Sign In
      </Button>
    );
  }

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/auth/sign-in');
    } catch (error) {
      console.error('Failed to sign out:', error);
      // Fallback redirect even if signOut fails
      router.push('/auth/sign-in');
    }
  };

  const userEmail = user.email;
  const userName = user.name || userEmail?.split('@')[0];

  return (
    <Dropdown placement='bottom-end'>
      <DropdownTrigger>
        <Avatar
          isBordered
          as='button'
          className='transition-transform'
          name={userName || undefined}
          size='sm'
          src={undefined}
        />
      </DropdownTrigger>
      <DropdownMenu aria-label='Profile Actions' variant='flat'>
        <DropdownItem
          key='profile'
          className='h-14 gap-2'
          textValue='User info'
        >
          <p className='font-semibold'>Signed in as</p>
          <p className='font-semibold text-default-600'>{userEmail}</p>
        </DropdownItem>
        <DropdownItem
          key='dashboard'
          as={NextLink}
          href='/dashboard'
          onClick={() => onNavigate?.()}
        >
          Dashboard
        </DropdownItem>

        <DropdownItem key='logout' color='danger' onPress={handleLogout}>
          Log Out
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
}
