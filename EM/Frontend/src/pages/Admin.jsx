import React, { useMemo, useReducer, useState } from "react";


const SearchIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd"/>
  </svg>
);
const UserPlusIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path opacity="0.1" d="M13 9.5C13 11.433 11.433 13 9.5 13C7.567 13 6 11.433 6 9.5C6 7.567 7.567 6 9.5 6C11.433 6 13 7.567 13 9.5Z" fill="#87CEEB"></path>
    <path d="M3 19C3.69137 16.6928 5.46998 16 9.5 16C13.53 16 15.3086 16.6928 16 19" stroke="#87CEEB" strokeWidth="2" strokeLinecap="round"></path>
    <path d="M13 9.5C13 11.433 11.433 13 9.5 13C7.567 13 6 11.433 6 9.5C6 7.567 7.567 6 9.5 6C11.433 6 13 7.567 13 9.5Z" stroke="#87CEEB" strokeWidth="2"></path>
    <path d="M15 6H21" stroke="#87CEEB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
    <path d="M18 3L18 9" stroke="#87CEEB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
  </svg>
);
const ArrowLeftIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M4 12L10 6M4 12L10 18M4 12H14.5M20 12H17.5" stroke="#1C274C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
  </svg>
);
const ArrowRightIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638l-4.158-3.96a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd"/>
  </svg>
);
const CogIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M7.834 2.222A.75.75 0 018.667 2h2.666a.75.75 0 01.833.222l2.64 2.285A.75.75 0 0115 5.5h2.25a.75.75 0 01.75.75v2.667a.75.75 0 01-.222.583l-2.285 2.64A.75.75 0 0115.5 13H17.75a.75.75 0 01.75.75v2.667a.75.75 0 01-.222.583l-2.64 2.285A.75.75 0 0113 19.5h-2.667a.75.75 0 01-.833-.222l-2.64-2.285A.75.75 0 015 16.5H2.75a.75.75 0 01-.75-.75v-2.667a.75.75 0 01.222-.583l2.285-2.64A.75.75 0 015.5 7H3.25a.75.75 0 01-.75-.75V3.583a.75.75 0 01.222-.583l2.64-2.285zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/>
  </svg>
);
const PaperAirplaneIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path d="M3.105 2.289a.75.75 0 00-.826.802l.302 1.517a.75.75 0 00.75.617h8.803a.75.75 0 01.595.289l1.791 1.79a.75.75 0 01-.258 1.25L11.5 11.25h-2.25l-.452 2.569a.75.75 0 00.742.827l.951-.118a.75.75 0 00.771-.536l.639-2.924c.01-.044.053-.08.098-.069a.75.75 0 01.846.846l-.069.098c-.01.045-.046.088-.09-.069a.75.75 0 00-.771.536l-.951.118a.75.75 0 00-.742-.827l.452-2.569z"/>
  </svg>
);

const MOCK_USERS = Array.from({ length: 30 }).map((_, i) => ({
  id: i + 1,
  name:
    ["John", "Sarah", "Marc", "Mitchell", "Andreas", "Olivia", "Emma", "Liam", "Noah", "Sophia"][i % 10] +
    " " +
    (i + 1),
  role: i % 5 === 0 ? "Manager" : "Employee",
  manager: i % 5 === 0 ? "Admin" : ["Marc", "Sarah", "Olivia"][i % 3],
  email: `user${i + 1}@example.com`,
  passwordSentAt: null, 
}));

/* ---------- Table reducer ---------- */
const initialTableState = { page: 1, perPage: 10, sortBy: "name", sortDir: "asc", filters: { role: "", search: "" } };

function tableReducer(state, action) {
  switch (action.type) {
    case "SET_PAGE":
      return { ...state, page: action.page };
    case "SET_PER_PAGE":
      return { ...state, perPage: action.perPage, page: 1 };
    case "SET_SORT":
      return { ...state, sortBy: action.sortBy, sortDir: action.sortDir };
    case "SET_FILTERS":
      return { ...state, filters: { ...state.filters, ...action.filters }, page: 1 };
    default:
      return state;
  }
}

/* ---------- Component ---------- */
export default function AdminDashboard() {
  const [users, setUsers] = useState(MOCK_USERS);
  const [tableState, dispatchTable] = useReducer(tableReducer, initialTableState);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", role: "Employee", manager: "", email: "" });

  // track sending state for password emails (array of ids)
  const [sendingIds, setSendingIds] = useState([]);

  // store rules per user id
  const [rulesByUser, setRulesByUser] = useState({});

  /* ---------- Derived Data ---------- */
  const filteredUsers = useMemo(() => {
    let list = [...users];
    if (tableState.filters.role) list = list.filter((u) => u.role === tableState.filters.role);
    if (tableState.filters.search) list = list.filter((u) => u.name.toLowerCase().includes(tableState.filters.search.toLowerCase()));
    list.sort((a, b) => (tableState.sortDir === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)));
    return list;
  }, [users, tableState]);

  const currentPageItems = useMemo(() => {
    const start = (tableState.page - 1) * tableState.perPage;
    return filteredUsers.slice(start, start + tableState.perPage);
  }, [filteredUsers, tableState]);

  /* ---------- Fake API helpers (simulate network) ---------- */
  const fakeSendPasswordEmail = (userId) =>
    new Promise((res) => setTimeout(() => res({ ok: true, sentAt: new Date().toISOString() }), 800));

  /* ---------- Add User ---------- */
  const handleAddUser = (e) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email) return alert("Name & Email are required");
    const newEntry = { ...newUser, id: users.length + 1, passwordSentAt: null };
    setUsers((prev) => [...prev, newEntry]);
    setNewUser({ name: "", role: "Employee", manager: "", email: "" });
    setShowAddForm(false);
    // keep pagination: if current page doesn't include the new item, nothing changes visually
  };

  /* ---------- Send password (simulated) ---------- */
  const handleSendPassword = async (user) => {
    if (sendingIds.includes(user.id)) return; // already sending
    setSendingIds((p) => [...p, user.id]);
    try {
      const res = await fakeSendPasswordEmail(user.id);
      if (res.ok) {
        setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, passwordSentAt: res.sentAt } : u)));
        alert(`Password reset email sent to ${user.email}`);
      } else {
        alert("Failed to send email");
      }
    } catch (err) {
      console.error(err);
      alert("Error sending email");
    } finally {
      setSendingIds((p) => p.filter((id) => id !== user.id));
    }
  };

  /* ---------- Rules: open and save ---------- */
  const openRulesForUser = (u) => {
    setSelectedUser(u);
    // initialize rules entry if not present
    setRulesByUser((prev) => {
      if (prev[u.id]) return prev;
      return {
        ...prev,
        [u.id]: {
          isManagerApprover: true,
          sequenceMatters: false,
          minApproval: 50,
          approvers: [
            { id: 1, name: "John", required: true },
            { id: 2, name: "Mitchell", required: false },
            { id: 3, name: "Andreas", required: false },
          ],
        },
      };
    });
  };

  const saveUserDetails = (updatedUser) => {
    setUsers((prev) => prev.map((p) => (p.id === updatedUser.id ? updatedUser : p)));
    setSelectedUser(updatedUser);
  };

  const saveRulesForSelected = (rules) => {
    if (!selectedUser) return;
    setRulesByUser((prev) => ({ ...prev, [selectedUser.id]: rules }));
    alert("Approval rules saved");
  };

  /* ---------- Subcomponents ---------- */
  const UserTable = () => (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 transition-all duration-300">
      {/* Controls row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <input
              placeholder="Search users..."
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200"
              value={tableState.filters.search}
              onChange={(e) =>
                dispatchTable({
                  type: "SET_FILTERS",
                  filters: { search: e.target.value },
                })
              }
            />
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>

          <select
            className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 transition-all duration-200"
            value={tableState.filters.role}
            onChange={(e) =>
              dispatchTable({
                type: "SET_FILTERS",
                filters: { role: e.target.value },
              })
            }
          >
            <option value="">All Roles</option>
            <option value="Employee">Employee</option>
            <option value="Manager">Manager</option>
          </select>
        </div>

        <div>
          <select
            value={tableState.perPage}
            onChange={(e) =>
              dispatchTable({
                type: "SET_PER_PAGE",
                perPage: Number(e.target.value),
              })
            }
            className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 transition-all duration-200"
          >
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full table-auto">
          <thead className="bg-gray-50 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
            <tr>
              <th className="p-4 border-b">Name</th>
              <th className="p-4 border-b">Role</th>
              <th className="p-4 border-b">Manager</th>
              <th className="p-4 border-b">Email</th>
              <th className="p-4 border-b text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentPageItems.map((u) => (
              <tr key={u.id} className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors duration-200">
                <td className="p-4 font-medium text-gray-800">{u.name}</td>
                <td className="p-4">{u.role}</td>
                <td className="p-4 text-gray-600">{u.manager}</td>
                <td className="p-4 text-blue-600 font-medium">{u.email}</td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => openRulesForUser(u)}
                      className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition-colors duration-200 transform hover:scale-[1.02]"
                      title="Set Approval Rules"
                    >
                      <CogIcon className="w-4 h-4 mr-2" />
                      Rules
                    </button>

                    <button
                      onClick={() => handleSendPassword(u)}
                      className={`inline-flex items-center px-4 py-2 rounded-lg shadow-md transition-colors duration-200 ${
                        u.passwordSentAt ? "bg-gray-200 text-gray-800" : "bg-green-500 text-white hover:bg-green-600"
                      }`}
                      title="Send/reset password email"
                      disabled={sendingIds.includes(u.id)}
                    >
                      <PaperAirplaneIcon className="w-4 h-4 mr-2" />
                      {sendingIds.includes(u.id) ? "Sending..." : u.passwordSentAt ? "Sent" : "Send Password"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {currentPageItems.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-500">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  /* ---------- Approval Rules Editor ---------- */
  const ApprovalRules = () => {
    if (!selectedUser) return null;
    // get latest user (in case it changed)
    const current = users.find((u) => u.id === selectedUser.id) || selectedUser;
    const existingRules = rulesByUser[selectedUser.id] || {
      isManagerApprover: true,
      sequenceMatters: false,
      minApproval: 50,
      approvers: [
        { id: 1, name: "John", required: true },
        { id: 2, name: "Mitchell", required: false },
        { id: 3, name: "Andreas", required: false },
      ],
    };

    const [isManagerApprover, setIsManagerApprover] = useState(existingRules.isManagerApprover);
    const [sequenceMatters, setSequenceMatters] = useState(existingRules.sequenceMatters);
    const [minApproval, setMinApproval] = useState(existingRules.minApproval);
    const [approvers, setApprovers] = useState(existingRules.approvers);

    const toggleRequired = (id) => setApprovers((prev) => prev.map((a) => (a.id === id ? { ...a, required: !a.required } : a)));
    const updateApproverName = (id, name) => setApprovers((prev) => prev.map((a) => (a.id === id ? { ...a, name } : a)));

    const onSave = () => {
      // persist user manager/role updates (we provide controls for them below)
      saveRulesForSelected({ isManagerApprover, sequenceMatters, minApproval, approvers });
      alert("Saved rules for " + current.name);
    };

    const onUpdateUserField = (field, value) => {
      const updated = { ...current, [field]: value };
      saveUserDetails(updated);
    };

    return (
      <div className="bg-white rounded-xl shadow-md p-6 mt-8 border border-gray-100 transition-all duration-300">
        <div className="flex justify-between items-center mb-6 border-b pb-4 border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">
            Approval Rules for <span className="text-blue-600">{current.name}</span>
          </h2>
          <div className="flex items-center gap-2">
            <button onClick={() => setSelectedUser(null)} className="text-sm text-gray-500 hover:text-black transition-colors duration-200 p-1 rounded-full hover:bg-gray-100">
              <span className="font-semibold">✕ Close</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Manager</label>
            <input value={current.manager || ""} onChange={(e) => onUpdateUserField("manager", e.target.value)} className="border border-gray-300 px-4 py-2 rounded-lg w-full focus:outline-none focus:border-blue-500 transition-all duration-200" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">User Role</label>
            <select value={current.role} onChange={(e) => onUpdateUserField("role", e.target.value)} className="border border-gray-300 px-4 py-2 rounded-lg w-full focus:outline-none focus:border-blue-500 transition-all duration-200 bg-white">
              <option>Employee</option>
              <option>Manager</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6 mb-6">
          <label className="inline-flex items-center text-gray-700 cursor-pointer">
            <input type="checkbox" checked={isManagerApprover} onChange={(e) => setIsManagerApprover(e.target.checked)} className="form-checkbox text-blue-500 rounded-md mr-2 h-4 w-4 border-gray-300 focus:ring-blue-500" />
            Manager is approver
          </label>
          <label className="inline-flex items-center text-gray-700 cursor-pointer">
            <input type="checkbox" checked={sequenceMatters} onChange={(e) => setSequenceMatters(e.target.checked)} className="form-checkbox text-blue-500 rounded-md mr-2 h-4 w-4 border-gray-300 focus:ring-blue-500" />
            Approval sequence matters
          </label>
        </div>

        <h3 className="text-md font-bold text-gray-800 mb-4 border-b pb-2">Approval Steps</h3>
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="bg-gray-50 text-left text-sm text-gray-600">
              <tr>
                <th className="p-2 border-b">Step</th>
                <th className="p-2 border-b">Approver</th>
                <th className="p-2 border-b">Required</th>
              </tr>
            </thead>
            <tbody>
              {approvers.map((a, idx) => (
                <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                  <td className="p-2">{idx + 1}</td>
                  <td className="p-2">
                    <input value={a.name} onChange={(e) => updateApproverName(a.id, e.target.value)} className="border px-3 py-1 rounded w-full" />
                  </td>
                  <td className="p-2">
                    <input type="checkbox" checked={a.required} onChange={() => toggleRequired(a.id)} className="form-checkbox text-blue-500 rounded-md h-4 w-4 border-gray-300 focus:ring-blue-500 cursor-pointer" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-600 mb-2">Minimum Approval Percentage</label>
          <div className="flex items-center gap-2">
            <input type="number" value={minApproval} onChange={(e) => setMinApproval(Number(e.target.value || 0))} className="border border-gray-300 px-3 py-2 rounded-lg w-24 focus:outline-none focus:border-blue-500 transition-all duration-200" />
            <span className="text-gray-600 text-lg font-medium">%</span>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={() => setSelectedUser(null)} className="px-5 py-2 bg-gray-200 rounded-lg">Cancel</button>
          <button onClick={onSave} className="inline-flex items-center px-5 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition-colors duration-200 transform hover:scale-[1.02]">Save Rules</button>
        </div>
      </div>
    );
  };

  /* ---------- Render ---------- */
  return (
    <div className="min-h-screen bg-[#F0F4F8] text-gray-800 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Admin    Dashboard</h1>
          <button onClick={() => setShowAddForm((s) => !s)} className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            <UserPlusIcon className="w-5 h-5 mr-2" /> Add User
          </button>
        </div>

        {/* Add User Form */}
        {showAddForm && (
          <form onSubmit={handleAddUser} className="mb-8 bg-white p-6 rounded-xl shadow-md border">
            <h2 className="text-xl font-bold mb-4">Add New User</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} placeholder="Full Name" className="border rounded-lg px-4 py-2" />
              <input value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} placeholder="Email" className="border rounded-lg px-4 py-2" />
              <input value={newUser.manager} onChange={(e) => setNewUser({ ...newUser, manager: e.target.value })} placeholder="Manager" className="border rounded-lg px-4 py-2" />
              <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} className="border rounded-lg px-4 py-2">
                <option value="Employee">Employee</option>
                <option value="Manager">Manager</option>
              </select>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 bg-gray-200 rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">Add</button>
            </div>
          </form>
        )}

        <UserTable />

        {/* Pagination */}
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing{" "}
            <span className="font-semibold text-gray-700">
              {Math.min((tableState.page - 1) * tableState.perPage + 1, filteredUsers.length)}
            </span>{" "}
            -{" "}
            <span className="font-semibold text-gray-700">
              {Math.min(tableState.page * tableState.perPage, filteredUsers.length)}
            </span>{" "}
            of <span className="font-semibold text-gray-700">{filteredUsers.length}</span> users
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => dispatchTable({ type: "SET_PAGE", page: Math.max(1, tableState.page - 1) })}
              className="p-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors duration-200 disabled:opacity-50"
              disabled={tableState.page === 1}
            >
              <ArrowLeftIcon />
            </button>
            <span className="px-4 py-2 font-medium bg-blue-500 text-white rounded-lg shadow-inner">{tableState.page}</span>
            <button
              onClick={() =>
                dispatchTable({
                  type: "SET_PAGE",
                  page: Math.min(Math.ceil(filteredUsers.length / tableState.perPage), tableState.page + 1),
                })
              }
              className="p-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors duration-200 disabled:opacity-50"
              disabled={tableState.page >= Math.ceil(filteredUsers.length / tableState.perPage)}
            >
              <ArrowRightIcon />
            </button>
          </div>
        </div>

        {/* Approval rules panel */}
        {selectedUser && <ApprovalRules />}
      </div>
    </div>
  );
}
