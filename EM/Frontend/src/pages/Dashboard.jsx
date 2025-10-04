import React from "react";
import heroImage from "../assets/hero.png";
import user from "../assets/xyz.jpg";
import expense from "../assets/reort2.webp";
import apr from "../assets/approve.webp";
import role from "../assets/custom.png";
import receipt from "../assets/ocr.webp";
import curr from "../assets/currency.webp";

function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="bg-blue-600 shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            ExpenseReimburse
          </h1>
          <div className="flex items-center space-x-4">
            <button className="px-5 py-2 bg-white text-blue-800 font-semibold rounded-lg shadow hover:bg-gray-100 transition">
              Sign In
            </button>
            <button className="px-5 py-2 bg-green-500 text-white font-semibold rounded-lg shadow hover:bg-green-600 transition">
              Sign Up
            </button>
          </div>
        </div>
      </header>
      <section className="relative w-full h-[600px] bg-blue-50 md:h-[700px] overflow-hidden">
        <div className="absolute inset-0 bg-pink bg-opacity-50 flex flex-col md:flex-row justify-center items-center px-6 md:px-16">
          <div className="text-left md:w-1/2 text-gray mb-8 md:mb-0 -translate-y-5">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Smooth Online Expense Reimbursement
            </h2>
            <p className="text-lg md:text-xl max-w-md">
              Simplify expense management with automated workflows, multi-level
              approvals, and intelligent OCR receipt scanning.
            </p>
          </div>
          <div className="md:w-1/2 flex justify-end items-start">
            <img
              src={heroImage}
              alt="Expense Illustration"
              className="w-full max-w-lg object-contain -translate-y-5 translate-x-10"
            />
          </div>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h3 className="text-4xl font-bold text-center text-gray-800 mb-12">
          Core Features
        </h3>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-blue-50 rounded-xl shadow p-6 hover:shadow-lg transition flex flex-col items-center text-center">
            <img
              src={user}
              alt="Authentication"
              className="w-30 h-20 mb-4 object-contain"
            />

            <h4 className="font-bold text-xl mb-2">
              Authentication & User Management
            </h4>
            <p>
              Auto-create company and admin user on signup. Admin can create
              employees & managers, assign roles, and manage approval flows.
            </p>
          </div>

          <div className="bg-blue-50 rounded-xl shadow p-6 hover:shadow-lg transition flex flex-col items-center text-center">
            <img
              src={expense}
              alt="Authentication"
              className="w-30 h-20 mb-4 object-contain"
            />
            <h4 className="font-bold text-xl mb-2">Expense Submission</h4>
            <p>
              Employees can submit expenses with amount, category, description,
              and date. View history of approved/rejected expenses.
            </p>
          </div>

          <div className="bg-blue-50 rounded-xl shadow p-6 hover:shadow-lg transition flex flex-col items-center text-center">
            <img
              src={apr}
              alt="Authentication"
              className="w-30 h-20 mb-4 object-contain"
            />
            <h4 className="font-bold text-xl mb-2">Approval Workflow</h4>
            <p>
              Multi-level approvals with conditional rules: percentage-based,
              specific approver, or hybrid rules.
            </p>
          </div>

          <div className="bg-blue-50 rounded-xl shadow p-6 hover:shadow-lg transition flex flex-col items-center text-center">
            <img
              src={role}
              alt="Authentication"
              className="w-30 h-20 mb-4 object-contain"
            />
            <h4 className="font-bold text-xl mb-2">Roles & Permissions</h4>
            <p>
              Admin: Full control over users and approvals. Manager:
              Approve/reject expenses. Employee: Submit and track expenses.
            </p>
          </div>

          <div className="bg-blue-50 rounded-xl shadow p-6 hover:shadow-lg transition flex flex-col items-center text-center">
            <img
              src={receipt}
              alt="Authentication"
              className="w-30 h-20 mb-4 object-contain"
            />
            <h4 className="font-bold text-xl mb-2">OCR for Receipts</h4>
            <p>
              Scan receipts to automatically generate expense claims with
              amount, date, description, type, and vendor info.
            </p>
          </div>

          <div className="bg-blue-50 rounded-xl shadow p-6 hover:shadow-lg transition flex flex-col items-center text-center">
            <img
              src={curr}
              alt="Authentication"
              className="w-30 h-20 mb-4 object-contain"
            />
            <h4 className="font-bold text-xl mb-2">
              Currency Support & Conversion
            </h4>
            <p>
              Supports multiple currencies per country with live exchange rates
              using APIs.
            </p>
          </div>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h3 className="text-4xl font-bold text-center text-gray-800 mb-12">
          Platform Stats
        </h3>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="p-6 bg-blue-50 rounded-xl shadow hover:shadow-md transition flex flex-col justify-between min-h-[180px] group">
            <p className="text-lg text-black-600">Total Claims Submitted</p>
            <h3 className="text-3xl md:text-4xl font-bold text-black-800 mt-2">
              45
            </h3>
            <p className="text-lg text-black-700 mt-1">12% ↑ vs last month</p>
          </div>

          <div className="p-6 bg-blue-50 rounded-xl shadow hover:shadow-md transition flex flex-col justify-between min-h-[180px] group">
            <p className="text-lg text-black-600">Claims Approved</p>
            <h3 className="text-3xl md:text-4xl font-bold text-black-800 mt-2">
              30
            </h3>
            <p className="text-lg text-black-700 mt-1">8% ↑ vs last month</p>
          </div>

          <div className="p-6 bg-blue-50 rounded-xl shadow hover:shadow-md transition flex flex-col justify-between min-h-[180px] group">
            <p className="text-lg text-black-600">Pending Approvals</p>
            <h3 className="text-3xl md:text-4xl font-bold text-black-800 mt-2">
              12
            </h3>
            <p className="text-lg text-black-700 mt-1">5% ↓ vs last month</p>
          </div>

          <div className="p-6 bg-blue-50 rounded-xl shadow hover:shadow-md transition flex flex-col justify-between min-h-[180px] group">
            <p className="text-lg text-black-600">Amount Reimbursed</p>
            <h3 className="text-3xl md:text-4xl font-bold text-black-800 mt-2">
              $12,350
            </h3>
            <p className="text-lg text-black-700 mt-1">15% ↑ vs last month</p>
          </div>
        </div>
      </section>

      <footer className="bg-blue-600 text-gray-100 py-12 mt-16">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-10">
          <div>
            <h2 className="text-2xl font-bold text-white">ExpenseReimburse</h2>
            <p className="mt-3 text-sm text-gray-200">
              A smooth online expense reimbursement platform to simplify claims
              and approvals.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Company</h3>
            <ul className="space-y-2">
              <li>
                <a href="/about" className="hover:text-white">
                  About Us
                </a>
              </li>
              <li>
                <a href="/blog" className="hover:text-white">
                  Blog
                </a>
              </li>
              <li>
                <a href="/enrolled" className="hover:text-white">
                  Enrolled Companies
                </a>
              </li>
              <li>
                <a href="/careers" className="hover:text-white">
                  Careers
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Resources</h3>
            <ul className="space-y-2">
              <li>
                <a href="/features" className="hover:text-white">
                  Features
                </a>
              </li>
              <li>
                <a href="/support" className="hover:text-white">
                  Support
                </a>
              </li>
              <li>
                <a href="/faq" className="hover:text-white">
                  FAQ
                </a>
              </li>
              <li>
                <a href="/contact" className="hover:text-white">
                  Contact Us
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Account</h3>
            <ul className="space-y-2">
              <li>
                <a href="/login" className="hover:text-white">
                  Login
                </a>
              </li>
              <li>
                <a href="/signup" className="hover:text-white">
                  Sign Up
                </a>
              </li>
              <li>
                <a href="/dashboard" className="hover:text-white">
                  Dashboard
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-blue-400 mt-10 pt-6 text-center text-sm text-gray-200">
          © {new Date().getFullYear()} ExpenseReimburse. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

export default Dashboard;
