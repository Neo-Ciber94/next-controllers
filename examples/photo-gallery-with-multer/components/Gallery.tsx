import Image from 'next/image';
import { FC, useState, useEffect, CSSProperties } from 'react';
import { BASE_URL } from '../shared';
import { FileDetails } from '../shared/types';
import { FaTimes, FaInfoCircle } from 'react-icons/fa';

export interface GalleryProps {
  files: FileDetails[];
  onDelete?: (file: FileDetails) => void;
}

export const Gallery: FC<GalleryProps> = ({ files, onDelete }) => {
  const [deleting, setDeleting] = useState<FileDetails | null>(null);

  useEffect(() => {
    const onClick = () => setDeleting(null);
    window.addEventListener('click', onClick);
    return () => window.removeEventListener('click', onClick);
  }, []);

  const handleDelete = (file: FileDetails) => {
    if (deleting && deleting.id == file.id) {
      onDelete?.(file);
    } else {
      setDeleting(file);
    }
  };

  return (
    <div className="p-1 md:p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {files.map((file, index) => (
        <GalleryItem key={file.id} index={index} file={file} deleting={deleting} onDelete={() => handleDelete(file)} />
      ))}
    </div>
  );
};

interface GalleryItemProps {
  index: number;
  file: FileDetails;
  deleting: FileDetails | null;
  onDelete: () => void;
}

const GalleryItem: React.FC<GalleryItemProps> = ({ index, file, deleting, onDelete }) => {
  const delayed: CSSProperties = {
    animationDelay: `${index * 0.1}s`,
  };

  return (
    <div style={delayed} className="relative rounded-lg overflow-hidden shadow-md w-full h-[400px] animate-fade-grow">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="absolute z-10 hover:scale-110 transition-all right-2 top-2 text-[25px]"
      >
        {deleting && deleting.id == file.id ? <DeleteConfirm /> : <Delete />}
      </button>

      <GalleryImage file={file} />
    </div>
  );
};

function GalleryImage({ file }: { file: FileDetails }) {
  if (file.blurUrl == null) {
    return <Image src={imageUrl(file.url)} alt={file.fileName} layout="fill" objectFit="cover" />;
  }

  return (
    <Image
      src={imageUrl(file.url)}
      alt={file.fileName}
      layout="fill"
      objectFit="cover"
      placeholder="blur"
      blurDataURL={file.blurUrl}
    />
  );
}

function Delete() {
  return (
    <span className="text-red-600">
      <FaTimes />
    </span>
  );
}

function DeleteConfirm() {
  return (
    <span className="text-yellow-500">
      <FaInfoCircle />
    </span>
  );
}

function imageUrl(url: string) {
  return `${BASE_URL}/${url}`;
}
