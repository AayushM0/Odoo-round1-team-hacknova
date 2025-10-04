import React, { useState, useEffect, useMemo } from "react";

/* ---------- Mock Data (Replace with API later) ---------- */
const MOCK_REQUESTS = [
  { id: 1, subject: "None", owner: "Sarah", category: "Food", status: "Waiting Approval", amountUSD: 567, amountINR: 49896 },
  { id: 2, subject: "Team Travel", owner: "John", category: "Travel", status: "Waiting Approval", amountUSD: 220, amountINR: 19380 },
  { id: 3, subject: "Office Supplies", owner: "Emma", category: "Office", status: "Approved", amountUSD: 180, amountINR: 15850 },
  { id: 4, subject: "Client Dinner", owner: "Raj", category: "Food", status: "Rejected", amountUSD: 320, amountINR: 28340 },
];

/* ---------- Utility Helpers ---------- */
const statusColor = (status) => {
  switch (status) {
    case "Approved": return "text-green-600 bg-green-50";
    case "Rejected": return "text-red-600 bg-red-50";
    case "Waiting Approval": return "text-yellow-600 bg-yellow-50";
    default: return "text-gray-600 bg-gray-50";
  }
};

/* ---------- Component ---------- */
export default function ManagerDashboard() {
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 5;
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    setRequests(MOCK_REQUESTS);
  }, []);

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      return (
        (!search || r.owner.toLowerCase().includes(search.toLowerCase()) || r.subject.toLowerCase().includes(search.toLowerCase())) &&
        (!category || r.category === category)
      );
    });
  }, [requests, search, category]);

  const paginated = useMemo(() => {
    const start = (page - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, page]);

  const handleAction = (id, action) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: action === "approve" ? "Approved" : "Rejected" } : r
      )
    );
  };

  const totalPages = Math.ceil(filtered.length / perPage);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-8 font-sans">
      <h1 className="text-2xl font-semibold mb-6">Manager DashBoard</h1>

      <div className="bg-white border rounded-2xl shadow-sm p-6">
        <h2 className="text-lg mb-4 font-medium">Approvals to Review</h2>

        {/* Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <input
            type="text"
            placeholder="Search by owner or subject..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="border rounded-md px-3 py-2 w-full md:w-1/3"
          />

          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className="border rounded-md px-3 py-2 w-full md:w-1/4"
          >
            <option value="">All Categories</option>
            <option value="Food">Food</option>
            <option value="Travel">Travel</option>
            <option value="Office">Office</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="p-3">Approval Subject</th>
                <th className="p-3">Request Owner</th>
                <th className="p-3">Category</th>
                <th className="p-3">Request Status</th>
                <th className="p-3">Total Amount (USD → INR)</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              {paginated.length > 0 ? (
                paginated.map((req) => (
                  <tr
                    key={req.id}
                    className="border-b hover:bg-gray-50 transition cursor-pointer"
                    onClick={() => setSelected(req)}
                  >
                    <td className="p-3">{req.subject}</td>
                    <td className="p-3">{req.owner}</td>
                    <td className="p-3">{req.category}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${statusColor(req.status)}`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="text-blue-600 font-medium">{req.amountUSD} $</span> →{" "}
                      <span className="text-gray-700 font-semibold">{req.amountINR.toLocaleString()} ₹</span>
                    </td>
                    <td className="p-3 text-center">
                      {req.status === "Waiting Approval" ? (
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAction(req.id, "approve");
                            }}
                            className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                          >
                            Approve
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAction(req.id, "reject");
                            }}
                            className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">—</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-500">
                    No records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
          <div>
            Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length}
          </div>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Prev
            </button>
            <span className="px-3 py-1 border rounded">{page}</span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-3 italic">
          Once the expense is approved/rejected by the manager, that record becomes read-only and the buttons disappear.
        </p>
      </div>

      {/* Slide-in Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-end z-50">
          <div className="bg-white shadow-xl w-full sm:w-[400px] p-6 overflow-y-auto animate-slide-in">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold">Request Details</h3>
              <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-black">✕</button>
            </div>

            <div className="space-y-3 text-sm">
              <div><strong>Subject:</strong> {selected.subject}</div>
              <div><strong>Owner:</strong> {selected.owner}</div>
              <div><strong>Category:</strong> {selected.category}</div>
              <div>
                <strong>Status:</strong>{" "}
                <span className={`px-2 py-1 rounded text-xs font-medium ${statusColor(selected.status)}`}>
                  {selected.status}
                </span>
              </div>
              <div><strong>Amount:</strong> {selected.amountUSD} $ = {selected.amountINR.toLocaleString()} ₹</div>
            </div>

            <div className="mt-6">
              <p className="text-gray-500 text-xs italic">
                Once approved/rejected, this record cannot be modified.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* Simple slide-in animation */
const style = document.createElement("style");
style.textContent = `
@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
.animate-slide-in {
  animation: slideIn 0.3s ease-out forwards;
}
`;
document.head.appendChild(style);
