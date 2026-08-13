import React, { useState } from 'react';
import { api } from '../lib/api';
import { auth } from '../lib/firebase';
import { LogOut, FileText, Upload, ShieldCheck } from 'lucide-react';

export function Onboarding() {
  const [formData, setFormData] = useState({
    drugLicenseNumber: '',
    drugLicenseDocumentUrl: '',
    pharmacyCouncilRegistrationNumber: '',
    licenseIssuingState: '',
    licenseExpiryDate: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 1
    setLoading(true);
    setError('');

    // Validate
    if (!formData.drugLicenseNumber || !formData.pharmacyCouncilRegistrationNumber) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    try {
      await api.post('/pharmacy/verify', formData);
      setSuccess(true);
      // Force reload to update app state to pending_verification dashboard
      setTimeout(() => window.location.reload(), 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Verification submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2 text-teal-700">
          <ShieldCheck size={24} />
          <h2 className="text-xl font-bold m-0">MedLink Seller Portal</h2>
        </div>
        <button
          aria-label="Log out"
          className="flex items-center gap-2 text-gray-500 hover:text-red-600 transition-colors font-medium px-4 py-2 rounded-lg hover:bg-red-50"
          onClick={() => auth.signOut()}
        >
          <LogOut size={18} /> Logout
        </button>
      </header>

      <div className="flex-1 flex items-center justify-center p-6 py-12">
        <div className="bg-white rounded-2xl border border-gray-100 w-full max-w-2xl shadow-xl overflow-hidden">
          <div className="bg-teal-600 p-8 text-center text-white">
            <div className="inline-flex p-4 bg-white/20 rounded-full mb-4 backdrop-blur-sm">
              <FileText size={40} className="text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Verify Your Pharmacy</h3>
            <p className="text-teal-100 max-w-md mx-auto">
              Please provide your regulatory compliance details to activate your seller account and start receiving orders.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-8">
            {success ? (
              <div className="bg-green-50 text-green-800 p-6 rounded-xl text-center border border-green-200 flex flex-col items-center gap-3">
                <ShieldCheck size={48} className="text-green-600" />
                <div>
                  <h4 className="text-lg font-bold">Verification Submitted!</h4>
                  <p className="mt-1 text-green-700">Your application is now pending review by a coordinator. You will be redirected shortly.</p>
                </div>
              </div>
            ) : (
              <>
                {error && (
                  <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-100 flex items-center gap-2">
                    <span className="font-bold">Error:</span> {error}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="col-span-full md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">State Pharmacy Council Reg No. *</label>
                    <input
                      type="text"
                      name="pharmacyCouncilRegistrationNumber"
                      value={formData.pharmacyCouncilRegistrationNumber}
                      onChange={handleInputChange}
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                      required
                      placeholder="e.g. SPC-987654"
                    />
                  </div>

                  <div className="col-span-full md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">State Drug License Number *</label>
                    <input
                      type="text"
                      name="drugLicenseNumber"
                      value={formData.drugLicenseNumber}
                      onChange={handleInputChange}
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                      required
                      placeholder="e.g. DL-MH-12345"
                    />
                  </div>

                  <div className="col-span-full md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">License Issuing State *</label>
                    <select
                      name="licenseIssuingState"
                      value={formData.licenseIssuingState}
                      onChange={handleInputChange}
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none transition-all bg-white"
                      required
                    >
                      <option value="">Select State</option>
                      <option value="Maharashtra">Maharashtra</option>
                      <option value="Karnataka">Karnataka</option>
                      <option value="Delhi">Delhi</option>
                      <option value="Gujarat">Gujarat</option>
                      <option value="Tamil Nadu">Tamil Nadu</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="col-span-full md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">License Expiry Date *</label>
                    <input
                      type="date"
                      name="licenseExpiryDate"
                      value={formData.licenseExpiryDate}
                      onChange={handleInputChange}
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                      required
                    />
                  </div>

                  <div className="col-span-full">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Drug License Document URL (Optional)</label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        name="drugLicenseDocumentUrl"
                        value={formData.drugLicenseDocumentUrl}
                        onChange={handleInputChange}
                        className="flex-1 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                        placeholder="https://storage.../license.pdf"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">In a production environment, this would be a file upload to cloud storage.</p>
                  </div>
                </div>

                <div className="bg-gray-50 -mx-8 -mb-8 p-6 px-8 border-t border-gray-100 flex justify-end">
                  <button
                    type="submit"
                    className="bg-teal-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-teal-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Submitting...
                      </>
                    ) : 'Submit Verification Application'}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
