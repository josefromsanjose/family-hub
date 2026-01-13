import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2, Edit2, Save, X, Users } from "lucide-react";
import { useHousehold, HouseholdMember } from "../contexts/HouseholdContext";

export const Route = createFileRoute("/settings")({ component: Settings });

function Settings() {
  const { members, addMember, updateMember, deleteMember } = useHousehold();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    role: "",
  });
  const [editData, setEditData] = useState<HouseholdMember | null>(null);

  const handleAdd = () => {
    if (!formData.name.trim()) return;
    addMember({
      name: formData.name.trim(),
      role: formData.role.trim() || undefined,
    });
    setFormData({ name: "", role: "" });
    setShowAddForm(false);
  };

  const startEdit = (member: HouseholdMember) => {
    setEditingId(member.id);
    setEditData({ ...member });
  };

  const saveEdit = () => {
    if (!editData || !editData.name.trim()) return;
    updateMember(editData.id, {
      name: editData.name.trim(),
      role: editData.role?.trim() || undefined,
    });
    setEditingId(null);
    setEditData(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData(null);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to remove this household member?")) {
      deleteMember(id);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your household members and preferences</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Users className="text-gray-600" size={24} />
              <h2 className="text-xl font-bold text-gray-900">Household Members</h2>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
              Add Member
            </button>
          </div>

          {showAddForm && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Member</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Sarah, John, Emma"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyPress={(e) => e.key === "Enter" && handleAdd()}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="e.g., Parent, Child, Teenager"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyPress={(e) => e.key === "Enter" && handleAdd()}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleAdd}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Member
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setFormData({ name: "", role: "" });
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {members.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">No household members yet</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={20} />
                Add Your First Member
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {editingId === member.id ? (
                    <>
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 ${member.color || "bg-gray-500"}`}
                      >
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <input
                            type="text"
                            value={editData?.name || ""}
                            onChange={(e) =>
                              setEditData({ ...editData!, name: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Name"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            value={editData?.role || ""}
                            onChange={(e) =>
                              setEditData({ ...editData!, role: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Role (optional)"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={saveEdit}
                          className="p-2 hover:bg-green-100 rounded text-green-600 transition-colors"
                          aria-label="Save"
                        >
                          <Save size={20} />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-2 hover:bg-gray-100 rounded text-gray-600 transition-colors"
                          aria-label="Cancel"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 ${member.color || "bg-gray-500"}`}
                      >
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{member.name}</h3>
                        {member.role && (
                          <p className="text-sm text-gray-600">{member.role}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(member)}
                          className="p-2 hover:bg-blue-100 rounded text-blue-600 transition-colors"
                          aria-label="Edit member"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(member.id)}
                          className="p-2 hover:bg-red-100 rounded text-red-600 transition-colors"
                          aria-label="Delete member"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">About Household Hub</h2>
          <p className="text-gray-600 mb-4">
            Household Hub helps you manage your family's daily life - from meal planning to task
            management, shopping lists, and calendar events.
          </p>
          <p className="text-sm text-gray-500">
            All data is stored locally in your browser. Your information stays private and secure.
          </p>
        </div>
      </div>
    </div>
  );
}
