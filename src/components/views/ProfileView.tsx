import React, { useState, useEffect, useCallback } from "react";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AppShell } from "@/components/layout/AppShell";
import { ROLE_LABELS } from "@/lib/constants";
import { Avatar } from "@/components/ui/Avatar";
import { User, Mail, Building, Shield, Phone, MapPin, Calendar, Lock, KeyRound, RefreshCw, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { usersService } from "@/services/users.service";
import { useToast } from "@/context/ToastContext";

function ProfileContent() {
  const { toast } = useToast();
  const { user, refreshUser } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);

  // Profile Form
  const [phone, setPhone] = useState("");
  const [personalEmail, setPersonalEmail] = useState("");
  const [address, setAddress] = useState("");

  // Password Form
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await usersService.getMe();
      const data = res?.data || res;
      setProfileData(data);
      if (data) {
        setPhone(data.phone || "");
        setPersonalEmail(data.personalEmail || "");
        setAddress(data.address || "");
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await usersService.updateMe({
        phone,
        personalEmail,
        address,
      });
      toast.success("Profile updated successfully!");
      await refreshUser();
      await fetchProfile();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsChangingPass(true);
    try {
      await usersService.changePassword(oldPassword, newPassword);
      toast.success("Password changed successfully!");
      setOldPassword("");
      setNewPassword("");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to change password.");
    } finally {
      setIsChangingPass(false);
    }
  };

  const name = profileData?.name || user?.name || "Staff Member";
  const email = profileData?.email || user?.email || "staff@wegrow.edu.in";
  const role = profileData?.role || user?.role || "employee";
  const department = profileData?.department || user?.department || "Campus Operations";
  const employeeId = profileData?.employeeId || user?.employeeId || "WG-001";
  const designation = profileData?.designation || user?.designation || "Staff";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-[#12173A]">
            My Profile &amp; Account Settings
          </h1>
          <p className="text-xs sm:text-sm text-[#5B6180]">
            Personal details, employment designation, biometric identity, and security credentials.
          </p>
        </div>
        <button
          onClick={fetchProfile}
          disabled={isLoading}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Profile Card */}
      <div className="rounded-3xl border border-[#E2E4EF] bg-white p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-[#E2E4EF]">
          <Avatar name={name} size="lg" className="ring-4 ring-[#EA6118]/20" />
          <div className="text-center sm:text-left space-y-1">
            <h2 className="font-heading text-xl font-bold text-[#12173A]">{name}</h2>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="rounded-full bg-[#EA6118]/10 px-2.5 py-0.5 text-xs font-bold text-[#EA6118]">
                {(ROLE_LABELS as Record<string, string>)[role] || role}
              </span>
              <span className="text-xs text-[#8A8FB0]">ID: <strong className="text-slate-800">{employeeId}</strong></span>
              <span className="text-xs text-slate-500">• {designation}</span>
            </div>
          </div>
        </div>

        {/* Details & Edit Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Details */}
          <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
            <h3 className="font-heading text-sm font-bold text-[#12173A]">
              Personal &amp; Contact Details
            </h3>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Official Campus Email</label>
              <input
                type="text"
                disabled
                value={email}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500 cursor-not-allowed"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Department</label>
              <input
                type="text"
                disabled
                value={department}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500 cursor-not-allowed"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Phone Number</label>
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Personal Email</label>
                <input
                  type="email"
                  placeholder="personal@gmail.com"
                  value={personalEmail}
                  onChange={(e) => setPersonalEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Residential Address</label>
              <textarea
                rows={2}
                placeholder="Address details..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none"
              />
            </div>

            <Button type="submit" variant="primary" size="sm" isLoading={isSaving} className="gap-2">
              <Save className="h-4 w-4" />
              <span>Save Contact Details</span>
            </Button>
          </form>

          {/* Change Password */}
          <form onSubmit={handleChangePassword} className="space-y-4 text-xs lg:border-l lg:border-slate-100 lg:pl-6">
            <h3 className="font-heading text-sm font-bold text-[#12173A] flex items-center gap-1.5">
              <KeyRound className="h-4 w-4 text-orange-500" />
              <span>Change Account Password</span>
            </h3>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Current Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">New Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#EA6118] focus:outline-none"
              />
            </div>

            <Button type="submit" variant="outline" size="sm" isLoading={isChangingPass} className="gap-2">
              <Lock className="h-4 w-4" />
              <span>Update Password</span>
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export function ProfileView() {
  return (
    <AuthProvider>
      <AppShell>
        <ProfileContent />
      </AppShell>
    </AuthProvider>
  );
}
export default ProfileView;
