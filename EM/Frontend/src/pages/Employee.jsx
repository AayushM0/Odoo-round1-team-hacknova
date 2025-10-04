import React, { useEffect, useMemo, useReducer, useState } from "react";

// Placeholder for SVG icons (replace with actual imports in a real project)
const PlusIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="w-5 h-5"
  >
    <path
      fillRule="evenodd"
      d="M12 5.25a.75.75 0 01.75.75v5.25H18a.75.75 0 010 1.5h-5.25V18a.75.75 0 01-1.5 0v-5.25H6a.75.75 0 010-1.5h5.25V6a.75.75 0 01.75-.75z"
      clipRule="evenodd"
    />
  </svg>
);
const SearchIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="w-5 h-5"
  >
    <path
      fillRule="evenodd"
      d="M10.5 3.75a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zM2.25 10.5a8.25 8.25 0 1114.59 5.28l4.634 4.634a.75.75 0 11-1.06 1.06l-4.635-4.634A8.25 8.25 0 012.25 10.5z"
      clipRule="evenodd"
    />
  </svg>
);
const EditIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="w-4 h-4"
  >
    <path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 00-1.32 2.09l-.337 1.01a.75.75 0 00.916.916l1.01-.337a5.25 5.25 0 002.09-1.32l8.4-8.4z" />
    <path
      fillRule="evenodd"
      d="M8.625 10.5a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
      clipRule="evenodd"
    />
  </svg>
);
const TrashIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="w-4 h-4"
  >
    <path
      fillRule="evenodd"
      d="M16.5 4.478a.75.75 0 00-1.06-.02L11.75 8.25l-3.71-3.71a.75.75 0 10-1.06 1.06L10.69 9.25l-3.71 3.71a.75.75 0 101.06 1.06L11.75 10.75l3.71 3.71a.75.75 0 101.06-1.06L12.81 9.25l3.71-3.71a.75.75 0 00.02-1.06z"
      clipRule="evenodd"
    />
  </svg>
);
const BriefcaseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="w-8 h-8 text-blue-500"
  >
    <path d="M11.7 2.875a.75.75 0 00-.9 0l-9.15 6.096a.75.75 0 00-.244.629l.006.023a.75.75 0 00.323.514l5.666 4.316c.34.258.749.387 1.158.387H15.6c.41 0 .82-.129 1.158-.387l5.667-4.316a.75.75 0 00.323-.514l.006-.023a.75.75 0 00-.244-.629l-9.15-6.096z" />
    <path
      fillRule="evenodd"
      d="M17.55 18.25A2.25 2.25 0 0015.3 16H8.7a2.25 2.25 0 00-2.25 2.25v2.25c0 1.241.693 2.316 1.71 2.898.375.216.746.336 1.11.336h6.81c.364 0 .735-.12 1.11-.336 1.017-.582 1.71-1.657 1.71-2.898v-2.25z"
      clipRule="evenodd"
    />
  </svg>
);

/* ---------- Mock API (replace in production) ---------- */
const MOCK_EXPENSES = Array.from({ length: 42 }).map((_, i) => ({
  id: `${i + 1}`,
  date: new Date(2025, 0, (i % 30) + 1).toISOString().slice(0, 10),
  description: `Expense ${i + 1}`,
  amount: (Math.random() * 500).toFixed(2),
  category: ["Travel", "Food", "Supplies", "Other"][i % 4],
}));

const fakeApi = {
  fetchExpenses: async (page, pageSize, filters) => {
    return new Promise((res) => {
      setTimeout(() => {
        let filtered = MOCK_EXPENSES.filter((e) => {
          return (
            (!filters.category || e.category === filters.category) &&
            (!filters.search ||
              e.description
                .toLowerCase()
                .includes(filters.search.toLowerCase()))
          );
        });
        const start = (page - 1) * pageSize;
        const paginated = filtered.slice(start, start + pageSize);
        res({ data: paginated, total: filtered.length });
      }, 300);
    });
  },
  addExpense: async (expense) =>
    new Promise((res) =>
      setTimeout(() => res({ ...expense, id: String(Date.now()) }), 300)
    ),
  updateExpense: async (expense) =>
    new Promise((res) => setTimeout(() => res(expense), 300)),
  deleteExpense: async (id) =>
    new Promise((res) => setTimeout(() => res({ success: true }), 300)),
};

/* ---------- Reducer ---------- */
function reducer(state, action) {
  switch (action.type) {
    case "SET_EXPENSES":
      return {
        ...state,
        expenses: action.payload.data,
        total: action.payload.total,
      };
    case "ADD_EXPENSE":
      return { ...state, expenses: [action.payload, ...state.expenses] };
    case "UPDATE_EXPENSE":
      return {
        ...state,
        expenses: state.expenses.map((e) =>
          e.id === action.payload.id ? action.payload : e
        ),
      };
    case "DELETE_EXPENSE":
      return {
        ...state,
        expenses: state.expenses.filter((e) => e.id !== action.payload),
      };
    default:
      return state;
  }
}

/* ---------- Component ---------- */
export default function EmployeeDashboard() {
  const [state, dispatch] = useReducer(reducer, { expenses: [], total: 0 });
  const [page, setPage] = useState(1);
  const [pageSize] = useState(5);
  const [filters, setFilters] = useState({ category: "", search: "" });
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    description: "",
    amount: "",
    category: "Travel",
  });

  /* ---------- Fetch expenses ---------- */
  useEffect(() => {
    setLoading(true);
    fakeApi.fetchExpenses(page, pageSize, filters).then((res) => {
      dispatch({ type: "SET_EXPENSES", payload: res });
      setLoading(false);
    });
  }, [page, pageSize, filters]);

  /* ---------- Stats ---------- */
  const stats = useMemo(() => {
    const total = state.expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const avg = state.expenses.length ? total / state.expenses.length : 0;
    return { total, avg };
  }, [state.expenses]);

  /* ---------- Handlers ---------- */
  const openModal = (expense = null) => {
    setEditing(expense);
    setForm(
      expense || {
        date: new Date().toISOString().slice(0, 10),
        description: "",
        amount: "",
        category: "Travel",
      }
    );
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, amount: Number(form.amount) };

    if (editing) {
      dispatch({ type: "UPDATE_EXPENSE", payload });
      await fakeApi.updateExpense(payload);
    } else {
      const temp = { ...payload, id: `temp-${Math.random()}` };
      dispatch({ type: "ADD_EXPENSE", payload: temp });
      const saved = await fakeApi.addExpense(payload);
      dispatch({ type: "UPDATE_EXPENSE", payload: saved });
    }
    setShowModal(false);
  };

  const handleDelete = async (id) => {
    dispatch({ type: "DELETE_EXPENSE", payload: id });
    await fakeApi.deleteExpense(id);
  };

  /* ---------- Render ---------- */
  return (
    <div className="bg-[#F0F4F8] min-h-screen font-sans text-gray-800 py-10">
      <div className="max-w-6xl mx-auto px-6">
        <h1 className="text-4xl font-extrabold mb-8 text-center text-gray-800 flex items-center justify-center gap-3">
          <BriefcaseIcon /> Employee Dashboard
        </h1>

        {/* Filters and Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8 p-4 bg-white rounded-lg shadow-sm">
          <select
            className="flex-1 border border-gray-300 bg-white text-gray-700 px-4 py-3 rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-200"
            value={filters.category}
            onChange={(e) =>
              setFilters((f) => ({ ...f, category: e.target.value }))
            }
          >
            <option value="">All Categories</option>
            <option>Travel</option>
            <option>Food</option>
            <option>Supplies</option>
            <option>Other</option>
          </select>
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              className="w-full border border-gray-300 bg-white text-gray-700 px-4 py-3 pl-10 rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-200"
              placeholder="Search expenses..."
              value={filters.search}
              onChange={(e) =>
                setFilters((f) => ({ ...f, search: e.target.value }))
              }
            />
          </div>
          <button
            className="flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 shadow-md transform hover:scale-105"
            onClick={() => openModal()}
          >
            <PlusIcon className="mr-2" /> Add Expense
          </button>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 bg-white rounded-lg shadow-lg border border-gray-200">
            <span className="text-sm uppercase text-gray-500 font-medium">
              Total Expenses
            </span>
            <div className="text-4xl font-bold mt-2 text-blue-600">
              ${stats.total.toFixed(2)}
            </div>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-lg border border-gray-200">
            <span className="text-sm uppercase text-gray-500 font-medium">
              Average Expense
            </span>
            <div className="text-4xl font-bold mt-2 text-green-600">
              ${stats.avg.toFixed(2)}
            </div>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-lg border border-gray-200">
            <span className="text-sm uppercase text-gray-500 font-medium">
              Total Items
            </span>
            <div className="text-4xl font-bold mt-2 text-gray-800">
              {state.total}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-100 text-gray-600">
                <tr>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold">Description</th>
                  <th className="px-6 py-4 font-semibold">Amount</th>
                  <th className="px-6 py-4 font-semibold">Category</th>
                  <th className="px-6 py-4 font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : (
                  state.expenses.map((e) => (
                    <tr
                      key={e.id}
                      className="border-t border-gray-200 hover:bg-gray-50 transition-colors duration-200"
                    >
                      <td className="px-6 py-4">{e.date}</td>
                      <td className="px-6 py-4">{e.description}</td>
                      <td className="px-6 py-4 font-semibold text-blue-600">
                        ${Number(e.amount).toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-gray-200 text-gray-600">
                          {e.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 gap-5 text-right flex ">
                        <button
                          className="flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-200 "
                          onClick={() => openModal(e)}
                          title="Edit Expense" // Tooltip for accessibility and clarity
                        >
                          <EditIcon className="w-5 h-5 mr-1" />
                          <span className="sr-only sm:not-sr-only">Edit</span>
                        </button>
                        <button
                          className="flex items-center text-red-600 hover:text-red-800 transition-colors duration-200"
                          onClick={() => handleDelete(e.id)}
                          title="Delete Expense"
                        >
                          <TrashIcon className="w-4 h-4 mr-1" />
                          <span className="sr-only sm:not-sr-only">Delete</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="mt-8 flex justify-center items-center gap-2">
          {Array.from({ length: Math.ceil(state.total / pageSize) }).map(
            (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 shadow-sm ${
                  page === i + 1
                    ? "bg-blue-500 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-100"
                }`}
              >
                {i + 1}
              </button>
            )
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4"
            role="dialog"
            aria-modal="true"
          >
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-lg relative border border-gray-200">
              <h2 className="text-3xl font-semibold mb-6 text-center text-gray-800">
                {editing ? "Edit Expense" : "Add New Expense"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, date: e.target.value }))
                  }
                  className="bg-gray-50 border border-gray-300 text-gray-800 px-4 py-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                  required
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  className="bg-gray-50 border border-gray-300 text-gray-800 px-4 py-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                  required
                />
                <input
                  type="number"
                  placeholder="Amount"
                  value={form.amount}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, amount: e.target.value }))
                  }
                  className="bg-gray-50 border border-gray-300 text-gray-800 px-4 py-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                  step="0.01"
                  required
                />
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, category: e.target.value }))
                  }
                  className="bg-gray-50 border border-gray-300 text-gray-800 px-4 py-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                >
                  <option>Travel</option>
                  <option>Food</option>
                  <option>Supplies</option>
                  <option>Other</option>
                </select>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-6 py-3 border border-gray-300 text-gray-600 rounded-lg shadow-sm hover:bg-gray-100 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow-md transition-colors duration-200"
                  >
                    Save Expense
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}