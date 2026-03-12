import React, { useState } from "react";
import { PlusCircle, CheckCircle, BookOpen, Edit, Trash2, X, AlertCircle } from "lucide-react";
import { useApp } from "../context/AppContext";

export const SubjectsTab: React.FC = () => {
  const { subjects, addSubject, updateSubject, deleteSubject } = useApp();

  const [newSubject, setNewSubject] = useState({ name: "", code: "" });
  const [subjectMessage, setSubjectMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({ name: "", code: "" });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newSubject.name && newSubject.code) {
      try {
        setIsLoading(true);
        await addSubject(newSubject);
        setNewSubject({ name: "", code: "" });
        setSubjectMessage("Subject added successfully.");
        setTimeout(() => setSubjectMessage(""), 3000);
      } catch (err) {
        console.error(err);
        setSubjectMessage("Failed to add subject.");
        setTimeout(() => setSubjectMessage(""), 3000);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleEditClick = (subject: any) => {
    setEditingId(subject.id);
    setEditValues({ name: subject.name, code: subject.code });
  };

  const handleSaveEdit = async (subjectId: string) => {
    if (!editValues.name || !editValues.code) {
      alert("Name and code are required");
      return;
    }
    try {
      setIsLoading(true);
      await updateSubject(subjectId, editValues);
      setEditingId(null);
      setSubjectMessage("Subject updated successfully.");
      setTimeout(() => setSubjectMessage(""), 3000);
    } catch (err) {
      console.error(err);
      setSubjectMessage("Failed to update subject.");
      setTimeout(() => setSubjectMessage(""), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (subjectId: string) => {
    try {
      setIsLoading(true);
      await deleteSubject(subjectId);
      setDeleteConfirm(null);
      setSubjectMessage("Subject deleted successfully.");
      setTimeout(() => setSubjectMessage(""), 3000);
    } catch (err) {
      console.error(err);
      setSubjectMessage("Failed to delete subject.");
      setTimeout(() => setSubjectMessage(""), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ADD SUBJECT FORM */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <div className="flex items-center mb-6">
          <div className="bg-blue-100 p-2 rounded-lg mr-4">
            <BookOpen className="text-blue-600" size={24} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Add New Subject
            </h2>
            <p className="text-sm text-gray-500">
              Create course entries for the system
            </p>
          </div>
        </div>

        <form onSubmit={handleAddSubject} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject Name
              </label>
              <input
                type="text"
                required
                className="block w-full border border-gray-300 rounded-lg p-3 focus:ring-blue-500 focus:border-blue-500"
                value={newSubject.name}
                onChange={(e) =>
                  setNewSubject({ ...newSubject, name: e.target.value })
                }
                placeholder="Advanced Computer Vision"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject Code
              </label>
              <input
                type="text"
                required
                className="block w-full border border-gray-300 rounded-lg p-3 focus:ring-blue-500 focus:border-blue-500"
                value={newSubject.code}
                onChange={(e) =>
                  setNewSubject({ ...newSubject, code: e.target.value })
                }
                placeholder="CS405"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center disabled:opacity-50"
          >
            <PlusCircle className="mr-2" size={18} /> Create Subject
          </button>

          {subjectMessage && (
            <div className={`p-3 rounded-lg flex items-center border text-sm ${
              subjectMessage.includes("deleted") || subjectMessage.includes("Failed")
                ? "bg-red-50 text-red-700 border-red-200"
                : "bg-green-50 text-green-700 border-green-200"
            }`}>
              <CheckCircle size={18} className="mr-2" />
              {subjectMessage}
            </div>
          )}
        </form>
      </div>

      {/* SUBJECTS LIST TABLE */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
          <BookOpen className="mr-2" size={20} /> Subject Inventory
        </h3>
        <div className="overflow-x-auto max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  System ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {subjects.length > 0 ? (
                subjects.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50">
                    {editingId === sub.id ? (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="text"
                            value={editValues.code}
                            onChange={(e) =>
                              setEditValues({ ...editValues, code: e.target.value })
                            }
                            className="block w-full border border-gray-300 rounded p-2 text-xs"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="text"
                            value={editValues.name}
                            onChange={(e) =>
                              setEditValues({ ...editValues, name: e.target.value })
                            }
                            className="block w-full border border-gray-300 rounded p-2 text-xs"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 font-mono">
                          {sub.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap space-x-2">
                          <button
                            onClick={() => handleSaveEdit(sub.id)}
                            disabled={isLoading}
                            className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-3 py-1 bg-gray-400 text-white text-xs rounded hover:bg-gray-500"
                          >
                            Cancel
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded">
                            {sub.code}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {sub.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                          {sub.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap space-x-2">
                          <button
                            onClick={() => handleEditClick(sub)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                          >
                            <Edit size={16} />
                          </button>
                          {deleteConfirm === sub.id ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleDelete(sub.id)}
                                disabled={isLoading}
                                className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:opacity-50"
                              >
                                Yes
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-2 py-1 bg-gray-400 text-white text-xs rounded hover:bg-gray-500"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(sub.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </td>
                      </>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No subjects found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
