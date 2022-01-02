import { FC, useState } from 'react';
import { FaUpload, FaImage } from 'react-icons/fa';

export interface FileUploadProps {
  onFile: (file: File) => void;
}

export const FileUpload: FC<FileUploadProps> = ({ onFile }) => {
  const [file, setFile] = useState<File | null>(null);

  return (
    <div className="file-upload">
      <label htmlFor="file-input" title={file?.name}>
        <span className="icon">
          {!file && <FaUpload style={{ margin: '0 10px' }} />}
          {file && <FaImage style={{ margin: '0 10px' }} />}
        </span>
        {file ? file.name : 'Select file'}
      </label>
      <input
        id="file-input"
        type="file"
        onChange={(e) => {
          const files = e.target.files;
          if (files && files.length > 0) {
            const file = files[0];
            if (file) {
              setFile(file);
              onFile(file);
            }
          }
        }}
      />
    </div>
  );
};
