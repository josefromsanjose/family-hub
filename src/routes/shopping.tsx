import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2, CheckCircle2, Circle, ShoppingCart } from "lucide-react";

export const Route = createFileRoute("/shopping")({ component: ShoppingLists });

interface ShoppingItem {
  id: string;
  name: string;
  quantity?: string;
  category: string;
  completed: boolean;
}

const categories = ["Produce", "Meat & Seafood", "Dairy", "Bakery", "Pantry", "Frozen", "Other"];

function ShoppingLists() {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    quantity: "",
    category: categories[0],
  });

  const addItem = () => {
    if (!formData.name.trim()) return;

    const newItem: ShoppingItem = {
      id: Date.now().toString(),
      name: formData.name,
      quantity: formData.quantity || undefined,
      category: formData.category,
      completed: false,
    };

    setItems([...items, newItem]);
    setFormData({ name: "", quantity: "", category: categories[0] });
    setShowAddForm(false);
  };

  const toggleItem = (id: string) => {
    setItems(
      items.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  const deleteItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const getItemsByCategory = (category: string) => {
    return items.filter((item) => item.category === category);
  };

  const completedCount = items.filter((item) => item.completed).length;
  const totalCount = items.length;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Shopping Lists</h1>
            <p className="text-muted-foreground">
              {totalCount > 0
                ? `${completedCount} of ${totalCount} items completed`
                : "Create your grocery shopping list"}
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus size={20} />
            Add Item
          </button>
        </div>

        {showAddForm && (
          <div className="bg-card rounded-lg shadow-sm p-6 mb-6 border border-border">
            <h2 className="text-xl font-bold text-card-foreground mb-4">Add Shopping Item</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1">Item Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Milk, Bread, Chicken"
                  className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === "Enter" && addItem()}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Quantity</label>
                <input
                  type="text"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="e.g., 2 lbs, 1 gallon"
                  className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === "Enter" && addItem()}
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-foreground mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={addItem}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Add Item
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-accent transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {items.length === 0 ? (
          <div className="bg-card rounded-lg shadow-sm p-12 border border-border text-center">
            <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No items yet</h3>
            <p className="text-muted-foreground mb-4">Start adding items to your shopping list</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus size={20} />
              Add Your First Item
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {categories.map((category) => {
              const categoryItems = getItemsByCategory(category);
              if (categoryItems.length === 0) return null;

              return (
                <div key={category} className="bg-card rounded-lg shadow-sm border border-border">
                  <div className="px-6 py-4 border-b border-border">
                    <h2 className="text-lg font-semibold text-card-foreground">{category}</h2>
                  </div>
                  <ul className="divide-y divide-border">
                    {categoryItems.map((item) => (
                      <li
                        key={item.id}
                        className={`px-6 py-4 flex items-center gap-4 hover:bg-accent transition-colors ${
                          item.completed ? "bg-secondary" : ""
                        }`}
                      >
                        <button
                          onClick={() => toggleItem(item.id)}
                          className="flex-shrink-0"
                          aria-label={item.completed ? "Mark as incomplete" : "Mark as complete"}
                        >
                          {item.completed ? (
                            <CheckCircle2 size={24} className="text-green-500" />
                          ) : (
                            <Circle size={24} className="text-muted-foreground" />
                          )}
                        </button>
                        <div className="flex-1">
                          <p
                            className={`text-sm font-medium ${
                              item.completed ? "text-muted-foreground line-through" : "text-foreground"
                            }`}
                          >
                            {item.name}
                          </p>
                          {item.quantity && (
                            <p className="text-xs text-muted-foreground mt-1">{item.quantity}</p>
                          )}
                        </div>
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="p-2 hover:bg-red-900/30 rounded text-red-400 transition-colors"
                          aria-label="Delete item"
                        >
                          <Trash2 size={18} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
