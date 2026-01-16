import { Link, useLocation } from "@tanstack/react-router";
import { useState } from "react";
import {
  Menu,
  X,
  Home,
  Calendar,
  ShoppingCart,
  CheckSquare,
  UtensilsCrossed,
  Settings,
  ListTodo,
} from "lucide-react";
import HeaderUser from "../integrations/clerk/header-user";
import { useAuthState } from "@/utils/auth";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Meal Planning", href: "/meals", icon: UtensilsCrossed },
  { name: "Shopping Lists", href: "/shopping", icon: ShoppingCart },
  { name: "Tasks & Chores", href: "/tasks", icon: CheckSquare },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { isSignedIn } = useAuthState();

  const closeMenu = () => setIsOpen(false);

  if (!isSignedIn) {
    return null;
  }

  return (
    <>
      <header className="bg-background border-b border-border shadow-sm">
        <div className="p-4 flex items-center justify-between w-full">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsOpen(true)}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
              aria-label="Open menu"
            >
              <Menu size={24} />
            </button>
            <h1 className="ml-4 text-xl font-semibold">
              <Link
                to="/"
                className="text-foreground hover:text-muted-foreground"
              >
                <span className="font-extrabold">Family Hub</span>
              </Link>
            </h1>
          </div>
          <HeaderUser />
        </div>
      </header>

      <aside
        className={`fixed top-0 left-0 h-full w-80 bg-sidebar shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
          <h2 className="text-xl font-bold text-sidebar-foreground">
            Navigation
          </h2>
          <button
            onClick={closeMenu}
            className="p-2 hover:bg-sidebar-accent rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    onClick={closeMenu}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                        : "text-sidebar-foreground hover:bg-sidebar-accent"
                    }`}
                  >
                    <Icon size={20} />
                    <span>{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}
    </>
  );
}
