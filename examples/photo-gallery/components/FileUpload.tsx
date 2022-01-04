import { FC, useState } from 'react';
import { FaUpload, FaImage, FaSync } from 'react-icons/fa';

export interface FileUploadProps {
  onFile: (file: File) => void;
}

export const FileUpload: FC<FileUploadProps> = ({ onFile }) => {
  const [file, setFile] = useState<File | null>(null);

  return (
    <div className="file-upload">
      {file && <div className="file-name" title={file.name}>{file.name}</div>}
      {!file && <label htmlFor="file-input">Select file</label>}
      {file && (
        <button className="file-reset" onClick={() => setFile(null)}>
          Reset
        </button>
      )}

      {/* Hidden */}
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
