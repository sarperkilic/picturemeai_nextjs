'use client';

import { Card, CardBody } from '@heroui/card';
import Image from 'next/image';
import { AvatarTemplate } from '@/types/templates';

interface AvatarCardProps {
  avatar: AvatarTemplate;
  onSelect: () => void;
}

export function AvatarCard({ avatar, onSelect }: AvatarCardProps) {
  const isUserAvatar = avatar.user_id !== null;

  return (
    <Card
      isPressable
      className="cursor-pointer transition-all hover:shadow-md hover:scale-105 relative"
      onPress={onSelect}
    >
      <CardBody className="p-3">
        <div className="aspect-square mb-3 overflow-hidden rounded-lg relative">
          <Image
            alt={avatar.avatar_name}
            className="w-full h-full object-cover"
            height={200}
            src={avatar.storage_url}
            width={200}
          />
          {/* User avatar indicator */}
          {isUserAvatar && (
            <div className="absolute top-2 right-2">
              <div className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full font-medium">
                My Avatar
              </div>
            </div>
          )}
        </div>
        <div className="space-y-1">
          <h5 className="text-sm font-medium text-center line-clamp-1">
            {avatar.avatar_name}
          </h5>
          <div className="flex justify-center space-x-2 text-xs text-default-500">
            <span className="capitalize">{avatar.gender}</span>
            <span>•</span>
            <span>{avatar.category}</span>
          </div>
        </div>
      </CardBody>
    </Card>
  );
} 