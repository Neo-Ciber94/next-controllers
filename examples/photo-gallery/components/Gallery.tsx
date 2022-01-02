import Image from 'next/image';
import { FC } from 'react';
import { FileDetails } from '../lib/models/types';

export interface GalleryProps {
  files: FileDetails[];
}

export const Gallery: FC<GalleryProps> = ({ files }) => {
  return (
    <div className="gallery">
      {files.map((file) => (
        <div key={file.id} className="gallery-item">
          <Image src={imageUrl(file.url)} alt={file.fileName} width={256} height={256} />
        </div>
      ))}
    </div>
  );
};

function imageUrl(url: string) {
  return `http://localhost:3000/${url}`;
}
