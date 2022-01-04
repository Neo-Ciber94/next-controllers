import { ChangeEvent, FC, useState } from 'react';
import { FaUpload, FaImage, FaSync } from 'react-icons/fa';

export interface FileUploadProps {
  onFile: (file: File) => void;
  onReset: () => void;
}

export const FileUpload: FC<FileUploadProps> = ({ onFile, onReset }) => {
  const [file, setFile] = useState<File | null>(null);

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file) {
        setFile(file);
        onFile(file);
      }
    }
  };

  const handleReset = () => {
    setFile(null);
    onReset();
  };

  return (
    <div className="flex flex-row file-upload text-white text-base sm:w-[300px] w-full">
      {file && (
        <div className="rounded-l-lg file-name sm:w-[300px] w-full" title={file.name}>
          {file.name}
        </div>
      )}
      {!file && (
        <label
          htmlFor="file-input"
          className="sm:w-[300px] w-full btn-rounded bg-red-600 hover:bg-red-500 transition-all"
        >
          Select file
        </label>
      )}
      {file && (
        <button className="btn rounded-r-lg bg-red-600 hover:bg-red-500" onClick={handleReset}>
          <FaSync size={15} />
        </button>
      )}

      {/* Hidden */}
      <input id="file-input" type="file" onChange={handleFile} />
    </div>
  );
};