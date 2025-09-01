import React, { useState, useEffect } from "react";
import Card from "../../../../components/ui/Card";
import Button from "../../../../components/ui/Button";
import FileUploadZone from "../FileUploadZone";
import { clarificationService } from "../../../../services/apiService";
import { toast } from "react-hot-toast";
import {
  Download,
  Trash2,
  RefreshCw,
  Eye,
  Image,
  FileText,
} from "lucide-react";
import ImagePreviewModal from "../../../../components/ui/ImagePreviewModal";
import PDFPreviewModal from "../../../../components/ui/PDFPreviewModal";

import { ClarificationFileUpload } from "../../../../types/screen";
import config from "../../../../config";

interface AttachmentsTabProps {
  clarification: any;
  onFileUpload: (files: File[]) => void;
  onFileRemove: (index: number) => void;
  uploadedFiles: File[];
}

const AttachmentsTab: React.FC<AttachmentsTabProps> = ({
  clarification,
  onFileUpload,
  onFileRemove,
  uploadedFiles,
}) => {
  const [existingAttachments, setExistingAttachments] = useState<
    ClarificationFileUpload[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingFileId, setDeletingFileId] = useState<number | null>(null);
  const [previewFile, setPreviewFile] =
    useState<ClarificationFileUpload | null>(null);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [showPDFPreview, setShowPDFPreview] = useState(false);

  // Fetch existing attachments from API
  const fetchExistingAttachments = async () => {
    if (!clarification?.clarificationId) return;

    try {
      setLoading(true);
      const response = await clarificationService.getFiles(
        clarification.clarificationId
      );

      if (response.success) {
        setExistingAttachments(
          (response.data as ClarificationFileUpload[]) || []
        );
        console.log("Existing attachments loaded:", response.data);
      } else {
        throw new Error(response.error || "Failed to fetch attachments");
      }
    } catch (error) {
      console.error("Error fetching attachments:", error);
      toast.error("Failed to load existing attachments");
      setExistingAttachments([]);
    } finally {
      setLoading(false);
    }
  };

  // Load attachments when clarification changes
  useEffect(() => {
    if (clarification?.clarificationId) {
      fetchExistingAttachments();
    }
  }, [clarification?.clarificationId]);

  const MAX_FILE_SIZE_MB = 1; // 1MB size limit

  const validateFile = (file: File) => {
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.error("File is too large. Maximum size is 1MB.");
      return false;
    }

    // Restrict to images and PDFs only
    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "application/pdf",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error(
        "Unsupported file type. Please upload images (PNG, JPG) or PDF files only."
      );
      return false;
    }

    return true;
  };

  // Handle deletion of existing attachment
  const handleDeleteExistingAttachment = async (
    fileId: number,
    fileName: string
  ) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${fileName}"?`
    );
    if (!confirmed) return;

    setDeletingFileId(fileId);
    try {
      const response = await clarificationService.deleteFile(fileId);

      if (response.success) {
        toast.success(`File "${fileName}" deleted successfully`);
        // Remove from local state
        setExistingAttachments((prev) =>
          prev.filter((file) => file.fileId !== fileId)
        );
      } else {
        throw new Error(response.error || "Failed to delete file");
      }
    } catch (error) {
      console.error("Error deleting file:", error);
      toast.error(`Failed to delete "${fileName}"`);
    } finally {
      setDeletingFileId(null);
    }
  };

  // Enhanced file upload to API with database columns
  const handleFileUploadToAPI = async (files: File[]) => {
    const validFiles = files.filter(validateFile);
    if (validFiles.length === 0) return;

    if (!clarification?.clarificationId) {
      toast.error("No clarification selected for file upload");
      return;
    }

    setUploading(true);

    try {
      // Get current user ID from localStorage
      const currentUserId = localStorage.getItem("userId") || "system";
      const currentTimestamp = new Date().toISOString();

      const uploadPromises = validFiles.map(async (file) => {
        try {
          // Create FormData with enhanced metadata
          const formData = new FormData();
          formData.append("File", file);
          formData.append("ClarificationId", clarification.clarificationId.toString());
          
          // Add database column values
          formData.append("UploadedBy", currentUserId);
          formData.append("UploadedAt", currentTimestamp);
          formData.append("ModifiedBy", currentUserId);
          formData.append("ModifiedAt", currentTimestamp);
          formData.append("DataFrom", "clarification_attachments");

          console.log("Uploading file with metadata:", {
            fileName: file.name,
            clarificationId: clarification.clarificationId,
            uploadedBy: currentUserId,
            uploadedAt: currentTimestamp,
            modifiedBy: currentUserId,
            modifiedAt: currentTimestamp,
            fileSize: file.size,
            contentType: file.type
          });

          const result = await clarificationService.uploadFile(
            clarification.clarificationId,
            file,
            {
              uploadedBy: currentUserId,
              uploadedAt: currentTimestamp,
              modifiedBy: currentUserId,
              modifiedAt: currentTimestamp,
            }
          );

          if (result) {
            return { success: true, fileName: file.name };
          } else {
            throw new Error(`Failed to upload ${file.name}`);
          }
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          return {
            success: false,
            fileName: file.name,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      });

      const results = await Promise.all(uploadPromises);
      const successful = results.filter((r) => r.success);
      const failed = results.filter((r) => !r.success);

      if (successful.length > 0) {
        toast.success(`${successful.length} file(s) uploaded successfully`);
        await fetchExistingAttachments();

        // Remove uploaded files from local state starting from last index
        for (let i = validFiles.length - 1; i >= 0; i--) {
          onFileRemove(i);
        }
      }

      if (failed.length > 0) {
        const errorMessages = failed
          .map((f) => `${f.fileName}: ${f.error}`)
          .join(", ");
        toast.error(`Failed to upload: ${errorMessages}`);
      }
    } catch (error) {
      console.error("Error in batch upload:", error);
      toast.error("Failed to upload files");
    } finally {
      setUploading(false);
    }
  };

  // Handle download of existing attachment
  const handleDownloadAttachment = (file: ClarificationFileUpload) => {
    try {
      const downloadUrl = `${config.API_BASE_URL}/api/ClarificationFileUploads/download/${file.fileId}`;
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = file.fileName;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Downloading ${file.fileName}`);
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error(`Failed to download ${file.fileName}`);
    }
  };

  // Handle preview of existing attachment
  const handlePreviewAttachment = (file: ClarificationFileUpload) => {
    setPreviewFile(file);

    if (file.contentType?.startsWith("image/")) {
      setShowImagePreview(true);
    } else if (file.contentType === "application/pdf") {
      setShowPDFPreview(true);
    } else {
      toast.error("Preview not available for this file type");
    }
  };

  // Get preview URL for file
  const getPreviewUrl = (file: ClarificationFileUpload) => {
    return `${config.API_BASE_URL}/api/ClarificationFileUploads/download/${file.fileId}`;
  };

  // Check if file is previewable
  const isPreviewable = (file: ClarificationFileUpload) => {
    return (
      file.contentType?.startsWith("image/") ||
      file.contentType === "application/pdf"
    );
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Enhanced format upload date with user info
  const formatUploadDate = (date?: Date | string) => {
    if (!date) return "Unknown date";
    try {
      return new Date(date).toLocaleString();
    } catch {
      return "Unknown date";
    }
  };

  // Format user info for display
  const formatUserInfo = (uploadedBy?: string, modifiedBy?: string) => {
    if (!uploadedBy && !modifiedBy) return "Unknown user";
    
    if (uploadedBy === modifiedBy || !modifiedBy) {
      return `Uploaded by: ${uploadedBy || "Unknown"}`;
    }
    
    return `Uploaded by: ${uploadedBy || "Unknown"} • Modified by: ${modifiedBy}`;
  };

  return (
    <div className="space-y-6">
      {/* Existing Attachments */}
      <Card title={`Existing Attachments (${existingAttachments.length})`}>
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading attachments...</span>
            </div>
          ) : existingAttachments.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500">
                <p className="text-lg font-medium">No attachments found</p>
                <p className="text-sm">Upload files using the form below.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {existingAttachments.map((file) => (
                <div
                  key={file.fileId}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      {file.contentType?.startsWith("image/") ? (
                        <Image className="w-5 h-5 text-blue-600" />
                      ) : file.contentType === "application/pdf" ? (
                        <FileText className="w-5 h-5 text-red-600" />
                      ) : (
                        <FileText className="w-5 h-5 text-gray-600" />
                      )}
                    </div>

                    <div>
                      <p className="font-semibold text-gray-700">
                        {file.fileName}
                      </p>
                      <div className="text-xs text-gray-500 space-y-1">
                        <p>
                          {formatFileSize(file.fileSize)} &middot;{" "}
                          {formatUploadDate(file.uploadedAt)}
                        </p>
                        <p>{formatUserInfo(file.uploadedBy, file.modifiedBy)}</p>
                        {file.modifiedAt && file.modifiedAt !== file.uploadedAt && (
                          <p className="text-yellow-600">
                            Modified: {formatUploadDate(file.modifiedAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    {isPreviewable(file) && (
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<Eye className="h-4 w-4" />}
                        onClick={() => handlePreviewAttachment(file)}
                      >
                        Preview
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<Download className="h-4 w-4" />}
                      onClick={() => handleDownloadAttachment(file)}
                    >
                      Download
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      icon={<Trash2 className="h-4 w-4" />}
                      onClick={() =>
                        handleDeleteExistingAttachment(
                          file.fileId,
                          file.fileName
                        )
                      }
                      disabled={deletingFileId === file.fileId}
                    >
                      {deletingFileId === file.fileId
                        ? "Deleting..."
                        : "Delete"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Image Preview Modal */}
      {previewFile && showImagePreview && (
        <ImagePreviewModal
          isOpen={showImagePreview}
          onClose={() => {
            setShowImagePreview(false);
            setPreviewFile(null);
          }}
          imageUrl={getPreviewUrl(previewFile)}
          fileName={previewFile.fileName}
          onDownload={() => handleDownloadAttachment(previewFile)}
        />
      )}

      {/* PDF Preview Modal */}
      {previewFile && showPDFPreview && (
        <PDFPreviewModal
          isOpen={showPDFPreview}
          onClose={() => {
            setShowPDFPreview(false);
            setPreviewFile(null);
          }}
          pdfUrl={getPreviewUrl(previewFile)}
          fileName={previewFile.fileName}
          onDownload={() => handleDownloadAttachment(previewFile)}
        />
      )}

      {/* File Upload Section */}
      <Card title="Upload New Attachments">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Upload supporting documents, drawings, or reference files for this
              clarification.
            </p>
            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw className="h-4 w-4" />}
              onClick={fetchExistingAttachments}
              disabled={loading}
            >
              {loading ? "Loading..." : "Refresh"}
            </Button>
          </div>

          <FileUploadZone
            onFileUpload={onFileUpload}
            onFileRemove={onFileRemove}
            uploadedFiles={uploadedFiles}
            maxFiles={1}
            maxFileSize={1}
            acceptedTypes={[
              "image/png",
              "image/jpeg",
              "image/jpg",
              "application/pdf",
            ]}
          />

          {/* Upload Button for New Files */}
          {uploadedFiles.length > 0 && (
            <div className="flex justify-end">
              <Button
                variant="primary"
                onClick={() => handleFileUploadToAPI(uploadedFiles)}
                disabled={uploading || !clarification?.clarificationId}
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              >
                {uploading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Uploading...</span>
                  </div>
                ) : (
                  `Upload ${uploadedFiles.length} File(s)`
                )}
              </Button>
            </div>
          )}

          {/* Upload Guidelines */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-blue-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  File Upload Guidelines
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Maximum file size: {MAX_FILE_SIZE_MB}MB per file</li>
                    <li>Supported formats: PNG, JPG, JPEG, PDF</li>
                    <li>Maximum {1} file can be uploaded at a time</li>
                    <li>All uploads are automatically tracked with user and timestamp information</li>
                    <li>Files are securely stored and can be previewed or downloaded</li>
                    <li>Use clear, descriptive file names for better organization</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* File Management Statistics */}
      {existingAttachments.length > 0 && (
        <Card title="Attachment Statistics">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <FileText className="mx-auto h-8 w-8 mb-2 text-blue-600" />
              <p className="text-sm font-medium text-blue-800">Total Files</p>
              <p className="mt-1 text-2xl font-bold text-blue-900">
                {existingAttachments.length}
              </p>
            </div>

            <div className="bg-green-50 rounded-lg p-4 text-center">
              <Image className="mx-auto h-8 w-8 mb-2 text-green-600" />
              <p className="text-sm font-medium text-green-800">Images</p>
              <p className="mt-1 text-2xl font-bold text-green-900">
                {existingAttachments.filter(f => f.contentType?.startsWith("image/")).length}
              </p>
            </div>

            <div className="bg-red-50 rounded-lg p-4 text-center">
              <FileText className="mx-auto h-8 w-8 mb-2 text-red-600" />
              <p className="text-sm font-medium text-red-800">PDFs</p>
              <p className="mt-1 text-2xl font-bold text-red-900">
                {existingAttachments.filter(f => f.contentType === "application/pdf").length}
              </p>
            </div>
          </div>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Total storage used: {" "}
              <span className="font-medium">
                {formatFileSize(existingAttachments.reduce((total, file) => total + file.fileSize, 0))}
              </span>
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AttachmentsTab;