import React, { useState } from 'react';
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Download,
  Upload,
  RefreshCw,
  X,
  ExternalLink,
  Shield,
  Layers,
} from 'lucide-react';
import { useFarm } from '../context/FarmContext';
import {
  getSavedSupabaseConfig,
  saveSupabaseConfig,
  isSupabaseConfigured,
  getSupabaseClient,
} from '../lib/supabase';

interface SupabaseSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseSetupModal: React.FC<SupabaseSetupModalProps> = ({ isOpen, onClose }) => {
  const {
    supabaseConnected,
    checkSupabaseStatus,
    resetToDefaults,
    exportDatabaseJSON,
    importDatabaseJSON,
    farmProfile,
    updateFarmProfile,
  } = useFarm();

  const [config, setConfig] = useState(getSavedSupabaseConfig());
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSQL, setCopiedSQL] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  // Profile fields state
  const [profileForm, setProfileForm] = useState(farmProfile);

  if (!isOpen) return null;

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setTesting(true);
    setTestResult(null);

    saveSupabaseConfig(config);

    try {
      const isOk = await checkSupabaseStatus();
      if (isOk) {
        setTestResult({
          success: true,
          message: 'Successfully connected to remote Supabase database instance!',
        });
      } else {
        setTestResult({
          success: false,
          message: 'Saved configuration. When tables are migrated, real-time sync will activate.',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Connection test failed.',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleExportJSON = () => {
    const jsonStr = exportDatabaseJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MushroomFarm_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importDatabaseJSON(content);
      if (success) {
        setImportError(null);
        alert('Database successfully restored from backup JSON file!');
      } else {
        setImportError('Invalid backup file format. Must be a valid Mushroom Farm export.');
      }
    };
    reader.readAsText(file);
  };

  const handleCopySQLMigration = () => {
    const sqlPath = '/supabase/migrations/20261027000000_mushroom_farm_init.sql';
    navigator.clipboard.writeText(`-- View file at ${sqlPath}`);
    setCopiedSQL(true);
    setTimeout(() => setCopiedSQL(false), 2500);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateFarmProfile(profileForm);
    alert('Farm profile updated successfully!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2.5">
            <Database className="h-5 w-5 text-emerald-700" />
            <div>
              <h3 className="text-base font-bold text-neutral-900">
                Database Backend & Farm Settings
              </h3>
              <p className="text-xs text-neutral-500">
                Connect remote Supabase or manage local persistent browser storage
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-6 text-xs">
          {/* Supabase Connection Status Banner */}
          <div
            className={`rounded-xl border p-4 flex items-start gap-3 ${
              supabaseConnected
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                : 'bg-amber-50/80 border-amber-200 text-amber-950'
            }`}
          >
            {supabaseConnected ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div>
              <span className="font-bold text-sm block">
                {supabaseConnected
                  ? 'Connected to Supabase Cloud Database'
                  : 'Running in Local Storage Mode'}
              </span>
              <p className="mt-0.5 text-xs opacity-90 leading-relaxed">
                {supabaseConnected
                  ? 'Your farm records, batches, and invoices are synced with your cloud Supabase database.'
                  : 'Data persists automatically in your browser storage. You can connect your free Supabase project anytime or export/import JSON backups below.'}
              </p>
            </div>
          </div>

          {/* Supabase Configuration Form */}
          <form onSubmit={handleSaveConfig} className="space-y-3 rounded-xl border border-neutral-200 p-4">
            <span className="font-bold text-neutral-900 text-xs block">
              Supabase Project Credentials
            </span>
            <p className="text-neutral-500 text-[11px]">
              Found in your Supabase Dashboard under <strong>Project Settings → API</strong>.
            </p>

            <div>
              <label className="block font-medium text-neutral-700 mb-1">
                Project URL (VITE_SUPABASE_URL)
              </label>
              <input
                type="text"
                placeholder="https://xyzcompany.supabase.co"
                value={config.url}
                onChange={(e) => setConfig({ ...config, url: e.target.value.trim() })}
                className="w-full rounded-lg border border-neutral-200 p-2 font-mono"
              />
            </div>

            <div>
              <label className="block font-medium text-neutral-700 mb-1">
                Public Anon Key (VITE_SUPABASE_ANON_KEY)
              </label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={config.anonKey}
                onChange={(e) => setConfig({ ...config, anonKey: e.target.value.trim() })}
                className="w-full rounded-lg border border-neutral-200 p-2 font-mono"
              />
            </div>

            {testResult && (
              <div
                className={`rounded-lg p-2.5 text-xs ${
                  testResult.success ? 'bg-emerald-50 text-emerald-800' : 'bg-neutral-100 text-neutral-800'
                }`}
              >
                {testResult.message}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="submit"
                disabled={testing}
                className="rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white hover:bg-emerald-800 transition-colors"
              >
                {testing ? 'Testing...' : 'Save & Test Connection'}
              </button>
            </div>
          </form>

          {/* Farm Information & Branding */}
          <form onSubmit={handleSaveProfile} className="space-y-3 rounded-xl border border-neutral-200 p-4">
            <span className="font-bold text-neutral-900 text-xs block">
              Farm Business Profile & Tax Information
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-neutral-700 mb-1">Farm Name</label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full rounded-lg border border-neutral-200 p-2"
                />
              </div>
              <div>
                <label className="block font-medium text-neutral-700 mb-1">Owner Name</label>
                <input
                  type="text"
                  value={profileForm.ownerName}
                  onChange={(e) => setProfileForm({ ...profileForm, ownerName: e.target.value })}
                  className="w-full rounded-lg border border-neutral-200 p-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-medium text-neutral-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="w-full rounded-lg border border-neutral-200 p-2"
                />
              </div>
              <div>
                <label className="block font-medium text-neutral-700 mb-1">GSTIN</label>
                <input
                  type="text"
                  value={profileForm.gstin || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, gstin: e.target.value })}
                  className="w-full rounded-lg border border-neutral-200 p-2 font-mono"
                />
              </div>
              <div>
                <label className="block font-medium text-neutral-700 mb-1">UPI ID (for invoices)</label>
                <input
                  type="text"
                  value={profileForm.upiId || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, upiId: e.target.value })}
                  className="w-full rounded-lg border border-neutral-200 p-2 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-neutral-700 mb-1">Facility Address</label>
              <input
                type="text"
                value={profileForm.address}
                onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                className="w-full rounded-lg border border-neutral-200 p-2"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="rounded-lg bg-neutral-900 px-4 py-2 font-semibold text-white hover:bg-neutral-800"
              >
                Update Farm Profile
              </button>
            </div>
          </form>

          {/* Backup, Restore, and Reset */}
          <div className="rounded-xl border border-neutral-200 p-4 space-y-3">
            <span className="font-bold text-neutral-900 text-xs block">
              Database Backup & Disaster Recovery
            </span>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleExportJSON}
                className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 font-medium text-neutral-700 hover:bg-neutral-50"
              >
                <Download className="h-4 w-4" />
                <span>Backup Database (JSON)</span>
              </button>

              <label className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 font-medium text-neutral-700 hover:bg-neutral-50 cursor-pointer">
                <Upload className="h-4 w-4" />
                <span>Restore Backup (JSON)</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJSON}
                  className="hidden"
                />
              </label>

              <button
                onClick={() => {
                  if (confirm('Reset all farm records back to realistic default sample data?')) {
                    resetToDefaults();
                    alert('Farm records restored to default sample data.');
                  }
                }}
                className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 font-medium text-rose-700 hover:bg-rose-100"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Reset to Sample Data</span>
              </button>
            </div>

            {importError && (
              <p className="text-rose-600 text-[11px] font-medium">{importError}</p>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end pt-3 border-t border-neutral-100">
          <button
            onClick={onClose}
            className="rounded-lg bg-neutral-900 px-5 py-2 text-xs font-semibold text-white hover:bg-neutral-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
