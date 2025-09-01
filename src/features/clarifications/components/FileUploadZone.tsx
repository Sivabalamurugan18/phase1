import React, { useCallback, useState } from "react";
import { Upload, X, FileText, Image, File } from "lucide-react";
import Button from "../../../components/ui/Button";

interface FileUploadZoneProps {
  onFileUpload: (files: File[]) => void;
  onFileRemove: (index: number) => void;
  uploadedFiles: File[];
  existingAttachments?: string[];
  maxFiles?: number;
  maxFileSize?: number; // in MB
  acceptedTypes?: string[];
}

const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  onFileUpload,
  onFileRemove,
  uploadedFiles,
  existingAttachments = [],
  maxFiles = 1,
  maxFileSize = 1,
  acceptedTypes = ["image/png", "image/jpeg", "image/jpg", "application/pdf"],
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string>("");

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const validateFiles = (files: FileList): File[] => {
    const validFiles: File[] = [];
    const errors: string[] = [];

    Array.from(files).forEach((file) => {
      // Check file type
      if (!acceptedTypes.includes(file.type)) {
        errors.push(`${file.name}: Unsupported file type`);
        return;
      }

      // Check file size
      if (file.size > maxFileSize * 1024 * 1024) {
        errors.push(`${file.name}: File too large (max ${maxFileSize}MB)`);
        return;
      }

      validFiles.push(file);
    });

    // Check total file count
    const totalFiles =
      uploadedFiles.length + existingAttachments.length + validFiles.length;
    if (totalFiles > maxFiles) {
      errors.push(`Maximum ${maxFiles} files allowed`);
      return [];
    }

    if (errors.length > 0) {
      setUploadError(errors.join(", "));
      setTimeout(() => setUploadError(""), 5000);
    } else {
      setUploadError("");
    }

    return validFiles;
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const validFiles = validateFiles(e.dataTransfer.files);
        if (validFiles.length > 0) {
          onFileUpload(validFiles);
        }
      }
    },
    [
      onFileUpload,
      uploadedFiles.length,
      existingAttachments.length,
      maxFiles,
      maxFileSize,
      acceptedTypes,
    ]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      if (e.target.files && e.target.files[0]) {
        const validFiles = validateFiles(e.target.files);
        if (validFiles.length > 0) {
          onFileUpload(validFiles);
        }
      }
    },
    [
      onFileUpload,
      uploadedFiles.length,
      existingAttachments.length,
      maxFiles,
      maxFileSize,
      acceptedTypes,
    ]
  );

  const getFileIcon = (file: File | string) => {
    const fileName = typeof file === "string" ? file : file.name;
    const fileType = typeof file === "string" ? "" : file.type;

    if (
      fileType.startsWith("image/") ||
      fileName.match(/\.(jpg|jpeg|png|gif)$/i)
    ) {
      return <Image className="h-5 w-5 text-blue-500" />;
    } else if (fileType === "application/pdf" || fileName.endsWith(".pdf")) {
      return <FileText className="h-5 w-5 text-red-500" />;
    }
    return <File className="h-5 w-5 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
          dragActive
            ? "border-blue-400 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          onChange={handleChange}
          accept={acceptedTypes.join(",")}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <div className="mt-4">
            <p className="text-sm text-gray-600">
              <span className="font-medium text-blue-600 hover:text-blue-500">
                Click to upload
              </span>{" "}
              or drag and drop
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Images (PNG, JPG) and PDF files up to {maxFileSize}MB each (max{" "}
              {maxFiles} files)
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {uploadError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-600">{uploadError}</p>
        </div>
      )}

      {/* Existing Attachments */}
      {existingAttachments.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Existing Attachments
          </h4>
          <div className="space-y-2">
            {existingAttachments.map((attachment, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
              >
                <div className="flex items-center space-x-3">
                  {getFileIcon(attachment)}
                  <span className="text-sm text-gray-700">
                    {attachment.split("/").pop() || `Attachment ${index + 1}`}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(attachment, "_blank")}
                >
                  View
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            New Files ({uploadedFiles.length})
          </h4>
          <div className="space-y-2">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-blue-50 rounded-md"
              >
                <div className="flex items-center space-x-3">
                  {getFileIcon(file)}
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  icon={<X className="h-4 w-4" />}
                  onClick={() => onFileRemove(index)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* File Count Summary */}
      <div className="text-xs text-gray-500">
        {uploadedFiles.length + existingAttachments.length} of {maxFiles} files
      </div>
    </div>
  );
};

export default FileUploadZone;
