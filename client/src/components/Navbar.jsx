import { Link, useLocation } from "react-router-dom";

const links = [
  { to: "/", label: "Dashboard" },
  { to: "/transactions", label: "Transactions" },
  { to: "/budgets", label: "Budgets" },
  { to: "/goals", label: "Goals" },
];

export default function Navbar() {
  const { pathname } = useLocation();

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="text-lg font-bold text-indigo-600">
          ExpenseTracker
        </Link>
        <div className="flex gap-6">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={
                pathname === link.to
                  ? "text-indigo-600 font-semibold"
                  : "text-gray-600 hover:text-gray-900"
              }
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
