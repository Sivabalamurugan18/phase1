import React, { useState } from "react";
import Card from "../../../../components/ui/Card";
import Button from "../../../../components/ui/Button";
import {
  Plus,
  X,
  MessageSquare,
  Send,
  RefreshCw,
  Trash2,
  Edit2,
  Save,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { projectService } from "../../../../services/apiService";
import { ProjectQuickNote } from "../../../../types/screen";

interface QuickNotesTabProps {
  projectNo: string;
  projectName: string;
  planningId: number;
  quickNotes: ProjectQuickNote[];
  loadingQuickNotes: boolean;
  onRefreshQuickNotes: () => void;
}

const QuickNotesTab: React.FC<QuickNotesTabProps> = ({
  projectNo,
  projectName,
  planningId,
  quickNotes,
  loadingQuickNotes,
  onRefreshQuickNotes,
}) => {
  const [newNote, setNewNote] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState<number | null>(null);

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      toast.error("Please enter a note before adding");
      return;
    }

    setIsSubmitting(true);
    try {
      const noteData = {
        planningId: planningId,
        quickNotes: newNote.trim(),
        createdBy: localStorage.getItem("userId") || "Current User",

        createdTime: new Date().toISOString(),

        // Update modification data

        modifiedBy: localStorage.getItem("userId") || "Current User",

        modifiedTime: new Date().toISOString(),
      };

      const response = await projectService.createQuickNote(noteData);

      if (response.success) {
        setNewNote("");
        onRefreshQuickNotes();
        toast.success("Note added successfully");
      } else {
        throw new Error(response.error || "Failed to add note");
      }
    } catch (error) {
      console.error("Error adding note:", error);
      toast.error("Failed to add note");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditNote = (note: ProjectQuickNote) => {
    setEditingNoteId(note.planningQuickNotesId);
    setEditingText(note.quickNotes);
  };

  const handleSaveEdit = async (noteId: number) => {
    if (!editingText.trim()) {
      toast.error("Note cannot be empty");
      return;
    }
    const originalNote = quickNotes.find(
      (note) => note.planningQuickNotesId === noteId
    );

    if (!originalNote) {
      toast.error("Note not found");

      return;
    }

    setIsSubmitting(true);
    try {
      const noteData = {
        planningQuickNotesId: noteId,
        planningId: planningId,
        quickNotes: editingText.trim(),
        createdBy: originalNote.createdBy,

        createdTime: originalNote.createdTime,

        modifiedBy: localStorage.getItem("userId") || "Current User",

        modifiedTime: new Date().toISOString(),
      };

      const response = await projectService.updateQuickNote(noteId, noteData);

      if (response.success) {
        setEditingNoteId(null);
        setEditingText("");
        onRefreshQuickNotes();
        toast.success("Note updated successfully");
      } else {
        throw new Error(response.error || "Failed to update note");
      }
    } catch (error) {
      console.error("Error updating note:", error);
      toast.error("Failed to update note");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this note?"
    );
    if (!confirmed) return;

    setDeletingNoteId(noteId);
    try {
      const response = await projectService.deleteQuickNote(noteId);

      if (response.success) {
        onRefreshQuickNotes();
        toast.success("Note deleted successfully");
      } else {
        throw new Error(response.error || "Failed to delete note");
      }
    } catch (error) {
      console.error("Error deleting note:", error);
      toast.error("Failed to delete note");
    } finally {
      setDeletingNoteId(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditingText("");
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "Unknown time";
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return "Unknown time";
    }
  };

  const sortedNotes = [...quickNotes].sort((a, b) => {
    const dateA = new Date(a.createdTime || 0).getTime();
    const dateB = new Date(b.createdTime || 0).getTime();
    return dateB - dateA; // Most recent first
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Quick Notes
              </h2>
              <p className="text-sm text-gray-500">
                Project: {projectNo} - {projectName}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw className="h-4 w-4" />}
              onClick={onRefreshQuickNotes}
              disabled={loadingQuickNotes}
            >
              {loadingQuickNotes ? "Loading..." : "Refresh"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Add New Note */}
      <Card title="Add New Note">
        <div className="space-y-4">
          <div>
            <label
              htmlFor="newNote"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Write a new note
            </label>
            <textarea
              id="newNote"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
              placeholder={`Add a note for project ${projectNo}...`}
              disabled={isSubmitting}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              {newNote.length} characters
            </span>
            <Button
              variant="primary"
              icon={<Send className="h-4 w-4" />}
              onClick={handleAddNote}
              disabled={!newNote.trim() || isSubmitting}
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
            >
              {isSubmitting ? "Adding..." : "Add Note"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Notes List */}
      <Card title={`Notes (${quickNotes.length})`}>
        <div className="space-y-4">
          {loadingQuickNotes ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading notes...</span>
            </div>
          ) : sortedNotes.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No notes yet
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Start by adding your first note for this project.
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {sortedNotes.map((note) => (
                <div
                  key={note.planningQuickNotesId}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-medium">
                          {(note.createdBy || "U").charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {note.createdBy || "Unknown User"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDateTime(note.createdTime)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      {editingNoteId === note.planningQuickNotesId ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            icon={<X className="h-3 w-3" />}
                            onClick={handleCancelEdit}
                            disabled={isSubmitting}
                            title="Cancel editing"
                          />
                          <Button
                            variant="primary"
                            size="sm"
                            icon={<Save className="h-3 w-3" />}
                            onClick={() =>
                              handleSaveEdit(note.planningQuickNotesId)
                            }
                            disabled={isSubmitting || !editingText.trim()}
                            title="Save changes"
                          >
                            {isSubmitting ? "Saving..." : "Save"}
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            icon={<Edit2 className="h-3 w-3" />}
                            onClick={() => handleEditNote(note)}
                            disabled={
                              isSubmitting ||
                              deletingNoteId === note.planningQuickNotesId
                            }
                            title="Edit note"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            icon={<Trash2 className="h-3 w-3" />}
                            onClick={() =>
                              handleDeleteNote(note.planningQuickNotesId)
                            }
                            disabled={
                              isSubmitting ||
                              deletingNoteId === note.planningQuickNotesId
                            }
                            className="text-red-600 hover:text-red-800 hover:bg-red-50 border-red-200"
                            title="Delete note"
                          >
                            {deletingNoteId === note.planningQuickNotesId
                              ? "Deleting..."
                              : "Delete"}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {editingNoteId === note.planningQuickNotesId ? (
                    <textarea
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      rows={3}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
                      disabled={isSubmitting}
                    />
                  ) : (
                    <div className="mt-2">
                      <p className="text-gray-700 whitespace-pre-wrap break-words">
                        {note.quickNotes}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="text-center">
            <MessageSquare className="mx-auto h-8 w-8 mb-2 text-blue-100" />
            <p className="text-sm font-medium text-blue-100">Total Notes</p>
            <p className="mt-2 text-3xl font-semibold">{quickNotes.length}</p>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="text-center">
            <MessageSquare className="mx-auto h-8 w-8 mb-2 text-green-100" />
            <p className="text-sm font-medium text-green-100">Recent Notes</p>
            <p className="mt-2 text-3xl font-semibold">
              {
                quickNotes.filter((note) => {
                  const noteDate = new Date(note.createdTime || 0);
                  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                  return noteDate > dayAgo;
                }).length
              }
            </p>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="text-center">
            <MessageSquare className="mx-auto h-8 w-8 mb-2 text-purple-100" />
            <p className="text-sm font-medium text-purple-100">
              Total Characters
            </p>
            <p className="mt-2 text-3xl font-semibold">
              {quickNotes.reduce(
                (total, note) => total + note.quickNotes.length,
                0
              )}
            </p>
          </div>
        </Card>
      </div>

      {/* Guidelines */}
      <Card>
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
                Quick Notes Guidelines
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    Use this space for project-specific notes, observations, and
                    reminders
                  </li>
                  <li>
                    Notes are displayed in chronological order (newest first)
                  </li>
                  <li>
                    Click "Edit" to modify existing notes or "Delete" to remove
                    them
                  </li>
                  <li>All notes are automatically saved to the server</li>
                  <li>
                    Use clear, descriptive comments for better project
                    documentation
                  </li>
                  <li>Notes support multi-line text and preserve formatting</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default QuickNotesTab;
