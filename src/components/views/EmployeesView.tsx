import React, { useState, useEffect, useCallback } from "react";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AppShell } from "@/components/layout/AppShell";
import { Users, Search, Plus, Mail, Phone, Building, Shield, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { usersService } from "@/services/users.service";
import { organizationService } from "@/services/organization.service";

function EmployeesContent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State for Onboarding
  const [formData, setFormData] = useState({
    employeeId: "",
    name: "",
    email: "",
    password: "Password@123",
    role: "EMPLOYEE",
    gender: "MALE",
    department: "Engineering",
    designation: "Software Engineer",
    phone: "",
  });

  const fetchEmployees = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await usersService.getAllUsers({ search: searchTerm });
      const data = res?.data || res;
      if (Array.isArray(data)) {
        setEmployees(data);
      } else if (Array.isArray(data?.users)) {
        setEmployees(data.users);
      } else {
        const dirRes = await organizationService.getDirectory({ search: searchTerm });
        const dirData = dirRes?.data || dirRes;
        setEmployees(Array.isArray(dirData) ? dirData : []);
      }
    } catch (err) {
      console.error("Failed to load employees:", err);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchEmployees();
    }, 300);
    return () => clearTimeout(timeout);
  }, [fetchEmployees]);

  const handleOnboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await usersService.onboardEmployee(formData);
      alert("Employee successfully onboarded!");
      setShowAddModal(false);
      setFormData({
        employeeId: "",
        name: "",
        email: "",
        password: "Password@123",
        role: "EMPLOYEE",
        gender: "MALE",
        department: "Engineering",
        designation: "Software Engineer",
        phone: "",
      });
      await fetchEmployees();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to onboard employee.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-[#12173A]">
            Staff &amp; Faculty Directory
          </h1>
          <p className="text-xs sm:text-sm text-[#5B6180]">
            Complete employee roster, roles, biometric assignments, and department overview.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchEmployees}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
          <Button
            variant="primary"
            size="sm"
            className="gap-2"
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="h-4 w-4" />
            <span>Add New Employee</span>
          </Button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-3 rounded-2xl border border-[#E2E4EF] bg-white p-3 shadow-sm">
        <Search className="h-4 w-4 text-[#8A8FB0] ml-2" />
        <input
          type="text"
          placeholder="Search by staff name, department, or role..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent text-xs text-[#12173A] placeholder-[#8A8FB0] focus:outline-none"
        />
      </div>

      {/* Directory Grid */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
        </div>
      ) : employees.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {employees.map((member: any, idx) => {
            const name = member.name || member.fullName || "Employee";
            const id = member.employeeId || member.id || `WG-${idx + 1}`;
            const dept = member.department || "General";
            const role = member.designation || member.role || "Staff";
            const email = member.email || "staff@wegrow.edu.in";
            const phone = member.phone || "+91 98765 43210";

            return (
              <div
                key={member.id || member._id || idx}
                className="rounded-3xl border border-[#E2E4EF] bg-white p-5 shadow-sm hover:shadow-md transition-all space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar name={name} size="md" />
                    <div>
                      <h3 className="text-sm font-bold text-[#12173A]">{name}</h3>
                      <p className="text-xs text-[#EA6118] font-semibold">{role}</p>
                    </div>
                  </div>
                  <Badge variant="success">Active</Badge>
                </div>

                <div className="space-y-2 rounded-2xl bg-[#F4F5F9] p-3 text-xs text-[#5B6180]">
                  <div className="flex items-center gap-2">
                    <Building className="h-3.5 w-3.5 text-[#8A8FB0]" />
                    <span>{dept}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-[#8A8FB0]" />
                    <span className="truncate">{email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-[#8A8FB0]" />
                    <span>{phone}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px] text-[#8A8FB0]">
                  <span>
                    Employee ID: <strong className="text-[#12173A]">{id}</strong>
                  </span>
                  <span className="font-medium text-emerald-600">Verified</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center text-slate-500">
          <Users className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <p className="font-semibold text-sm">No employees found.</p>
          <p className="text-xs text-slate-400 mt-1">Click &quot;Add New Employee&quot; to onboard staff members.</p>
        </div>
      )}

      {/* Onboard Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-heading text-lg font-bold text-[#12173A]">
                Onboard New Employee
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleOnboardSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Employee ID</label>
                  <input
                    type="text"
                    required
                    placeholder="EMP012"
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Rohan Sharma"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Official Email</label>
                  <input
                    type="email"
                    required
                    placeholder="rohan@wegrow.edu.in"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Phone</label>
                  <input
                    type="text"
                    placeholder="9876543210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Department</label>
                  <input
                    type="text"
                    required
                    placeholder="Engineering / Management"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Designation</label>
                  <input
                    type="text"
                    required
                    placeholder="Associate Professor"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none bg-white"
                  >
                    <option value="EMPLOYEE">Employee</option>
                    <option value="MANAGER">Manager</option>
                    <option value="HR_MANAGER">HR Manager</option>
                    <option value="CEO">CEO</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none bg-white"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmitting}
                >
                  Confirm &amp; Onboard
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export function EmployeesView() {
  return (
    <AuthProvider>
      <AppShell>
        <EmployeesContent />
      </AppShell>
    </AuthProvider>
  );
}
export default EmployeesView;
