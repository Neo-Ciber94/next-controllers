import Image from 'next/image';
import { FC } from 'react';
import { FileDetails } from '../shared/types';

export interface GalleryProps {
  files: FileDetails[];
}

export const Gallery: FC<GalleryProps> = ({ files }) => {
  return (
    <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      {files.map((file) => (
        <div key={file.id} className="relative rounded-lg overflow-hidden shadow-md w-full h-[400px]">
          <Image src={imageUrl(file.url)} alt={file.fileName} layout="fill" objectFit="cover" />
        </div>
      ))}
    </div>
  );
};

function imageUrl(url: string) {
  return `http://localhost:3000/${url}`;
}
