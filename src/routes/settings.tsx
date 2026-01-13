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
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your household members and preferences</p>
        </div>

        <div className="bg-card rounded-lg shadow-sm border border-border p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Users className="text-muted-foreground" size={24} />
              <h2 className="text-xl font-bold text-card-foreground">Household Members</h2>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus size={20} />
              Add Member
            </button>
          </div>

          {showAddForm && (
            <div className="mb-6 p-4 bg-secondary rounded-lg border border-border">
              <h3 className="text-lg font-semibold text-foreground mb-4">Add New Member</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Sarah, John, Emma"
                    className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                    onKeyPress={(e) => e.key === "Enter" && handleAdd()}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Role (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="e.g., Parent, Child, Teenager"
                    className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                    onKeyPress={(e) => e.key === "Enter" && handleAdd()}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleAdd}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Add Member
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setFormData({ name: "", role: "" });
                  }}
                  className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {members.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No household members yet</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
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
                  className="flex items-center gap-4 p-4 border border-border rounded-lg hover:bg-accent transition-colors"
                >
                  {editingId === member.id ? (
                    <>
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 ${member.color || "bg-muted"}`}
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
                            className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
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
                            className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                            placeholder="Role (optional)"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={saveEdit}
                          className="p-2 hover:bg-primary/20 rounded text-primary transition-colors"
                          aria-label="Save"
                        >
                          <Save size={20} />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-2 hover:bg-accent rounded text-muted-foreground transition-colors"
                          aria-label="Cancel"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 ${member.color || "bg-muted"}`}
                      >
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{member.name}</h3>
                        {member.role && (
                          <p className="text-sm text-muted-foreground">{member.role}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(member)}
                          className="p-2 hover:bg-primary/20 rounded text-primary transition-colors"
                          aria-label="Edit member"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(member.id)}
                          className="p-2 hover:bg-destructive/20 rounded text-destructive transition-colors"
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

        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          <h2 className="text-xl font-bold text-card-foreground mb-4">About Household Hub</h2>
          <p className="text-muted-foreground mb-4">
            Household Hub helps you manage your family's daily life - from meal planning to task
            management, shopping lists, and calendar events.
          </p>
          <p className="text-sm text-muted-foreground">
            All data is stored locally in your browser. Your information stays private and secure.
          </p>
        </div>
      </div>
    </div>
  );
}
