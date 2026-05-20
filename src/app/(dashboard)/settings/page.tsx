"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Save, Bell, Globe, Shield, Palette, Building2, Users, Database,
  UserPlus, Trash2, Loader2, AlertTriangle, Check,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BlurFade } from "@/components/magic/blur-fade";
import { toast } from "sonner";
import { useTheme, type Theme, type Accent } from "@/providers/theme-provider";
import { useUser } from "@/hooks/use-api";
import { useUsers, useAddUser, useDeleteUser, useWipeData } from "@/hooks/use-users";

const sections = [
  { id: "company", label: "Company", icon: Building2 },
  { id: "users", label: "Users", icon: Users },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "regional", label: "Regional", icon: Globe },
  { id: "security", label: "Security", icon: Shield },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "data", label: "Data", icon: Database },
];

const ACCENTS: Accent[] = ["#6366F1", "#10B981", "#F59E0B", "#F43F5E", "#3B82F6", "#8B5CF6"];

interface CompanyInfo {
  name: string; reg: string; email: string; phone: string; address: string; tin: string; vat: string;
}
interface RegionalInfo { language: string; dateFormat: string; timezone: string; }
interface NotifPrefs { lowStock: boolean; outOfStock: boolean; dailyReport: boolean; newSupplier: boolean; largeTx: boolean; }

const DEFAULT_COMPANY: CompanyInfo = {
  name: "StockSense Ltd", reg: "TZ-2024-00123", email: "info@stocksense.co.tz",
  phone: "+255 22 123 4567", address: "123 Samora Ave, Dar es Salaam, Tanzania",
  tin: "123-456-789", vat: "VAT-TZ-00456",
};
const DEFAULT_REGIONAL: RegionalInfo = {
  language: "English (Tanzania)", dateFormat: "DD/MM/YYYY", timezone: "Africa/Dar_es_Salaam (EAT +3)",
};
const DEFAULT_NOTIF: NotifPrefs = { lowStock: true, outOfStock: true, dailyReport: false, newSupplier: false, largeTx: true };

function loadJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try { const v = localStorage.getItem(key); return v ? { ...fallback, ...JSON.parse(v) } : fallback; }
  catch { return fallback; }
}

export default function SettingsPage() {
  const [active, setActive] = useState("company");
  const [saving, setSaving] = useState(false);
  const { data: me } = useUser();
  const isAdmin = me?.role === "admin";

  const [company, setCompany] = useState<CompanyInfo>(DEFAULT_COMPANY);
  const [regional, setRegional] = useState<RegionalInfo>(DEFAULT_REGIONAL);
  const [notif, setNotif] = useState<NotifPrefs>(DEFAULT_NOTIF);

  useEffect(() => {
    setCompany(loadJSON("stocksense:company", DEFAULT_COMPANY));
    setRegional(loadJSON("stocksense:regional", DEFAULT_REGIONAL));
    setNotif(loadJSON("stocksense:notif", DEFAULT_NOTIF));
  }, []);

  const handleSave = () => {
    setSaving(true);
    localStorage.setItem("stocksense:company", JSON.stringify(company));
    localStorage.setItem("stocksense:regional", JSON.stringify(regional));
    localStorage.setItem("stocksense:notif", JSON.stringify(notif));
    setTimeout(() => {
      setSaving(false);
      toast.success("Settings saved");
    }, 300);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut" }}>
      <Header title="Settings" subtitle="Configure your StockSense workspace" />

      <div className="flex gap-6 p-6">
        <BlurFade delay={0.1}>
          <nav className="w-48 shrink-0 space-y-1">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActive(s.id)}
                className={`relative flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors text-left ${
                  active === s.id ? "text-white" : "text-[#9CA3AF] hover:text-white hover:bg-white/5"
                }`}
              >
                {active === s.id && (
                  <motion.div
                    layoutId="settingsNav"
                    className="absolute inset-0 rounded-xl bg-[var(--color-primary)]/15 border border-[var(--color-primary)]/25"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <s.icon className={`relative h-4 w-4 ${active === s.id ? "text-[var(--color-primary-hover)]" : "text-[#6B7280]"}`} />
                <span className="relative">{s.label}</span>
              </button>
            ))}
          </nav>
        </BlurFade>

        <BlurFade delay={0.15} className="flex-1 min-w-0">
          <div className="glass rounded-2xl p-6">
            {active === "company" && (
              <CompanySection company={company} setCompany={setCompany} />
            )}
            {active === "users" && (
              <UsersSection isAdmin={isAdmin} currentUserId={me?.id} />
            )}
            {active === "notifications" && (
              <NotifSection notif={notif} setNotif={setNotif} />
            )}
            {active === "regional" && (
              <RegionalSection regional={regional} setRegional={setRegional} />
            )}
            {active === "security" && <SecuritySection />}
            {active === "appearance" && <AppearanceSection />}
            {active === "data" && <DataSection isAdmin={isAdmin} />}

            {["company", "notifications", "regional"].includes(active) && (
              <div className="mt-6 flex justify-end">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {saving ? "Saving…" : "Save Changes"}
                </Button>
              </div>
            )}
          </div>
        </BlurFade>
      </div>
    </motion.div>
  );
}

function Field({ label, value, onChange, type = "text", readOnly = false }: {
  label: string; value: string; onChange?: (v: string) => void; type?: string; readOnly?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-[#9CA3AF]">{label}</label>
      <Input
        type={type}
        value={value}
        readOnly={readOnly}
        onChange={(e) => onChange?.(e.target.value)}
      />
    </div>
  );
}

function CompanySection({ company, setCompany }: { company: CompanyInfo; setCompany: (c: CompanyInfo) => void }) {
  const upd = (k: keyof CompanyInfo) => (v: string) => setCompany({ ...company, [k]: v });
  return (
    <div className="space-y-5">
      <h2 className="text-base font-semibold text-white">Company Information</h2>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Company Name" value={company.name} onChange={upd("name")} />
        <Field label="Registration No." value={company.reg} onChange={upd("reg")} />
        <Field label="Business Email" value={company.email} onChange={upd("email")} type="email" />
        <Field label="Phone" value={company.phone} onChange={upd("phone")} />
        <div className="col-span-2"><Field label="Address" value={company.address} onChange={upd("address")} /></div>
        <Field label="TIN Number" value={company.tin} onChange={upd("tin")} />
        <Field label="VAT Number" value={company.vat} onChange={upd("vat")} />
      </div>
    </div>
  );
}

function NotifSection({ notif, setNotif }: { notif: NotifPrefs; setNotif: (n: NotifPrefs) => void }) {
  const items: { key: keyof NotifPrefs; label: string; desc: string }[] = [
    { key: "lowStock", label: "Low stock alerts", desc: "Get notified when items fall below reorder point" },
    { key: "outOfStock", label: "Out of stock alerts", desc: "Immediate alert when stock hits zero" },
    { key: "dailyReport", label: "Daily inventory report", desc: "Receive a daily summary via email" },
    { key: "newSupplier", label: "New supplier registration", desc: "Alert when a new supplier is added" },
    { key: "largeTx", label: "Large transaction alerts", desc: "Alert on transactions above TZS 5,000,000" },
  ];
  return (
    <div className="space-y-5">
      <h2 className="text-base font-semibold text-white">Notification Preferences</h2>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.key} className="flex items-start justify-between rounded-xl bg-white/5 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-white">{item.label}</p>
              <p className="text-xs text-[#9CA3AF]">{item.desc}</p>
            </div>
            <Toggle on={notif[item.key]} onChange={(v) => setNotif({ ...notif, [item.key]: v })} />
          </div>
        ))}
      </div>
    </div>
  );
}

function RegionalSection({ regional, setRegional }: { regional: RegionalInfo; setRegional: (r: RegionalInfo) => void }) {
  const upd = (k: keyof RegionalInfo) => (v: string) => setRegional({ ...regional, [k]: v });
  return (
    <div className="space-y-5">
      <h2 className="text-base font-semibold text-white">Regional Settings</h2>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Currency" value="TZS — Tanzanian Shilling" readOnly />
        <Field label="Language" value={regional.language} onChange={upd("language")} />
        <Field label="Date Format" value={regional.dateFormat} onChange={upd("dateFormat")} />
        <Field label="Timezone" value={regional.timezone} onChange={upd("timezone")} />
      </div>
    </div>
  );
}

function SecuritySection() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (next.length < 8) return toast.error("Password must be at least 8 characters");
    if (next !== confirm) return toast.error("Passwords do not match");
    setBusy(true);
    try {
      const res = await fetch("/api/me/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current, next }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to update password");
      }
      toast.success("Password updated");
      setCurrent(""); setNext(""); setConfirm("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-5">
      <h2 className="text-base font-semibold text-white">Security</h2>
      <div className="space-y-4 max-w-md">
        <Field label="Current Password" value={current} onChange={setCurrent} type="password" />
        <Field label="New Password" value={next} onChange={setNext} type="password" />
        <Field label="Confirm Password" value={confirm} onChange={setConfirm} type="password" />
        <Button onClick={submit} disabled={busy || !current || !next}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Update Password
        </Button>
      </div>
    </div>
  );
}

function AppearanceSection() {
  const { theme, setTheme, accent, setAccent } = useTheme();
  const themes: { value: Theme; label: string; icon: string }[] = [
    { value: "dark", label: "Dark", icon: "🌙" },
    { value: "light", label: "Light", icon: "☀️" },
    { value: "system", label: "System", icon: "💻" },
  ];

  return (
    <div className="space-y-5">
      <h2 className="text-base font-semibold text-white">Appearance</h2>
      <div className="space-y-4">
        <div>
          <p className="mb-3 text-sm font-medium text-[#9CA3AF]">Theme</p>
          <div className="grid grid-cols-3 gap-3">
            {themes.map((t) => (
              <button
                key={t.value}
                onClick={() => { setTheme(t.value); toast.success(`Theme: ${t.label}`); }}
                className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-sm transition-all ${
                  theme === t.value
                    ? "border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 text-white scale-[1.02]"
                    : "border-white/10 text-[#9CA3AF] hover:border-white/20"
                }`}
              >
                <span className="text-2xl">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium text-[#9CA3AF]">Accent Color</p>
          <div className="flex gap-2">
            {ACCENTS.map((color) => (
              <button
                key={color}
                onClick={() => { setAccent(color); toast.success("Accent updated"); }}
                className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${
                  color === accent ? "border-white scale-110" : "border-transparent"
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function UsersSection({ isAdmin, currentUserId }: { isAdmin: boolean; currentUserId?: string }) {
  const { data: users = [], isLoading } = useUsers();
  const addUser = useAddUser();
  const deleteUser = useDeleteUser();

  const [form, setForm] = useState({ name: "", email: "", password: "", role: "user" as "admin" | "manager" | "user" });

  if (!isAdmin) {
    return (
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-white">Users</h2>
        <div className="rounded-xl border border-[#F59E0B]/30 bg-[#F59E0B]/10 p-4 text-sm text-[#FBBF24]">
          Only admins can manage users.
        </div>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addUser.mutateAsync(form);
      toast.success(`User ${form.email} created`);
      setForm({ name: "", email: "", password: "", role: "user" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create user");
    }
  };

  const remove = async (id: string, email: string) => {
    if (!confirm(`Delete user ${email}?`)) return;
    try {
      await deleteUser.mutateAsync(id);
      toast.success("User deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-base font-semibold text-white">Users & Access</h2>

      <form onSubmit={submit} className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
        <p className="text-sm font-medium text-white flex items-center gap-2">
          <UserPlus className="h-4 w-4" /> Add new user
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Input placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <Input placeholder="Password (min 8 chars)" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} minLength={8} required />
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as typeof form.role })}
            className="h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-[var(--color-primary)]/50"
          >
            <option value="user">User</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <Button type="submit" disabled={addUser.isPending}>
          {addUser.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          Create User
        </Button>
      </form>

      <div>
        <p className="mb-3 text-sm font-medium text-[#9CA3AF]">Existing users ({users.length})</p>
        {isLoading ? (
          <div className="text-sm text-[#9CA3AF]">Loading…</div>
        ) : (
          <div className="space-y-2">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-hover)] flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {u.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {u.name} {u.id === currentUserId && <span className="text-xs text-[#9CA3AF]">(you)</span>}
                    </p>
                    <p className="truncate text-xs text-[#9CA3AF]">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                    u.role === "admin" ? "bg-[#F43F5E]/15 text-[#FB7185]"
                    : u.role === "manager" ? "bg-[#F59E0B]/15 text-[#FBBF24]"
                    : "bg-white/10 text-[#9CA3AF]"
                  }`}>{u.role}</span>
                  {u.id !== currentUserId && (
                    <button
                      onClick={() => remove(u.id, u.email)}
                      disabled={deleteUser.isPending}
                      className="text-[#9CA3AF] hover:text-[#F43F5E] transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DataSection({ isAdmin }: { isAdmin: boolean }) {
  const wipe = useWipeData();
  const [confirmText, setConfirmText] = useState("");

  if (!isAdmin) {
    return (
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-white">Data Management</h2>
        <div className="rounded-xl border border-[#F59E0B]/30 bg-[#F59E0B]/10 p-4 text-sm text-[#FBBF24]">
          Only admins can manage data.
        </div>
      </div>
    );
  }

  const doWipe = async (scope: string[], label: string) => {
    if (scope.includes("all") && confirmText !== "DELETE") {
      toast.error('Type "DELETE" to confirm a full wipe');
      return;
    }
    if (!confirm(`This will permanently delete ${label}. Continue?`)) return;
    try {
      await wipe.mutateAsync(scope);
      toast.success(`${label} wiped`);
      setConfirmText("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Wipe failed");
    }
  };

  return (
    <div className="space-y-5">
      <h2 className="text-base font-semibold text-white">Data Management</h2>

      <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
        <p className="text-sm font-medium text-white">Selective cleanup</p>
        <p className="text-xs text-[#9CA3AF]">Remove demo / dummy records by category. Users are preserved.</p>
        <div className="grid grid-cols-2 gap-2 pt-1">
          {[
            { scope: ["transactions"], label: "transactions" },
            { scope: ["invoices"], label: "invoices" },
            { scope: ["products"], label: "products" },
            { scope: ["suppliers"], label: "suppliers" },
            { scope: ["categories"], label: "categories" },
          ].map((opt) => (
            <Button
              key={opt.label}
              variant="outline"
              size="sm"
              disabled={wipe.isPending}
              onClick={() => doWipe(opt.scope, `all ${opt.label}`)}
            >
              <Trash2 className="h-3.5 w-3.5" /> Clear {opt.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-[#F43F5E]/30 bg-[#F43F5E]/5 p-4 space-y-3">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 text-[#F43F5E] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-white">Wipe all data & start clean</p>
            <p className="text-xs text-[#9CA3AF] mt-0.5">
              Deletes all products, suppliers, categories, transactions, and invoices. Your user account is kept.
            </p>
          </div>
        </div>
        <Input
          placeholder='Type "DELETE" to confirm'
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
        />
        <Button
          variant="outline"
          disabled={wipe.isPending || confirmText !== "DELETE"}
          onClick={() => doWipe(["all"], "ALL data")}
          className="border-[#F43F5E]/40 text-[#FB7185] hover:bg-[#F43F5E]/10"
        >
          {wipe.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          Wipe everything
        </Button>
      </div>
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className={`relative h-5 w-9 rounded-full transition-colors ${on ? "bg-[var(--color-primary)]" : "bg-white/20"}`}
    >
      <motion.div
        animate={{ x: on ? 16 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow"
      />
    </button>
  );
}
