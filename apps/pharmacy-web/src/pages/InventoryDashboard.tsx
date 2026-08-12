import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Package, Plus, X, Search, Edit2, Trash2 } from 'lucide-react';
import type { UserProfile } from '../App';
import type { User } from 'firebase/auth';

interface Medicine {
  id: string;
  name: string;
  genericName: string;
  price: number;
  stockQuantity: number;
  prescriptionTier: string;
  category: string;
  description: string;
}

export function InventoryDashboard({ user }: { user: User, profile: UserProfile }) {
  const [inventory, setInventory] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    genericName: '',
    description: '',
    category: '',
    price: '',
    stockQuantity: '',
    prescriptionTier: 'otc'
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await api.get('/pharmacy/inventory');
      setInventory(res.data);
    } catch (err) {
      console.error("Failed to fetch inventory", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    
    try {
      await api.post('/medicines', {
        ...formData,
        price: parseFloat(formData.price),
        stockQuantity: parseInt(formData.stockQuantity) || 0
      });
      setIsAddModalOpen(false);
      setFormData({
        name: '',
        genericName: '',
        description: '',
        category: '',
        price: '',
        stockQuantity: '',
        prescriptionTier: 'otc'
      });
      fetchInventory();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to add medicine");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredInventory = inventory.filter(med => 
    med.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (med.genericName && med.genericName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
            <Package className="text-teal-600" /> Inventory Dashboard
          </h1>
          <p className="text-gray-500 mt-1">Manage your pharmacy's medicine catalog and stock</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors font-medium"
        >
          <Plus size={20} /> Add Medicine
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text"
              placeholder="Search inventory..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none transition-all"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
          </div>
        ) : filteredInventory.length === 0 ? (
          <div className="text-center p-12">
            <Package size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No medicines found</h3>
            <p className="text-gray-500">
              {searchTerm ? "Try adjusting your search terms." : "Your inventory is currently empty. Add your first medicine to start selling."}
            </p>
            {!searchTerm && (
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="mt-4 text-teal-600 font-medium hover:text-teal-700"
              >
                + Add Medicine
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-sm border-b border-gray-100">
                  <th className="p-4 font-medium">Medicine Name</th>
                  <th className="p-4 font-medium">Category</th>
                  <th className="p-4 font-medium">Price (₹)</th>
                  <th className="p-4 font-medium">Stock</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map((med) => (
                  <tr key={med.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-gray-900">{med.name}</div>
                      {med.genericName && <div className="text-sm text-gray-500">{med.genericName}</div>}
                      {med.prescriptionTier === 'schedule_h' && (
                        <span className="inline-block mt-1 text-[10px] uppercase font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Rx Required (Schedule H)</span>
                      )}
                      {med.prescriptionTier === 'restricted' && (
                        <span className="inline-block mt-1 text-[10px] uppercase font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">Restricted (In-store only)</span>
                      )}
                    </td>
                    <td className="p-4 text-gray-600">{med.category || '-'}</td>
                    <td className="p-4 font-medium text-gray-900">₹{med.price}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        med.stockQuantity > 20 ? 'bg-green-100 text-green-800' : 
                        med.stockQuantity > 0 ? 'bg-amber-100 text-amber-800' : 
                        'bg-red-100 text-red-800'
                      }`}>
                        {med.stockQuantity} in stock
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="p-2 text-gray-400 hover:text-teal-600 transition-colors rounded-lg hover:bg-teal-50" title="Edit">
                          <Edit2 size={16} />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Medicine Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Add New Medicine</h2>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 bg-gray-100 p-2 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddMedicine} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto flex-1">
                {error && (
                  <div className="mb-6 bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
                    {error}
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="col-span-full">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name *</label>
                    <input 
                      type="text" 
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                      placeholder="e.g. Paracetamol 500mg"
                    />
                  </div>
                  
                  <div className="col-span-full">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Generic Name</label>
                    <input 
                      type="text" 
                      name="genericName"
                      value={formData.genericName}
                      onChange={handleInputChange}
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                      placeholder="e.g. Acetaminophen"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select 
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none transition-all bg-white"
                    >
                      <option value="">Select Category</option>
                      <option value="Pain Relief">Pain Relief</option>
                      <option value="Antibiotics">Antibiotics</option>
                      <option value="Cold & Cough">Cold & Cough</option>
                      <option value="Vitamins">Vitamins</option>
                      <option value="First Aid">First Aid</option>
                      <option value="Diabetes">Diabetes</option>
                      <option value="Heart Health">Heart Health</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹) *</label>
                    <input 
                      type="number" 
                      name="price"
                      required
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={handleInputChange}
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity *</label>
                    <input 
                      type="number" 
                      name="stockQuantity"
                      required
                      min="0"
                      value={formData.stockQuantity}
                      onChange={handleInputChange}
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                      placeholder="0"
                    />
                  </div>

                  <div className="col-span-full">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prescription Tier *</label>
                    <select 
                      name="prescriptionTier"
                      value={formData.prescriptionTier}
                      onChange={handleInputChange}
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none transition-all bg-white"
                    >
                      <option value="otc">Over The Counter (OTC)</option>
                      <option value="schedule_h">Schedule H (Requires valid Rx)</option>
                      <option value="restricted">Restricted (Narcotics/Schedule X - Cannot be sold online)</option>
                    </select>
                  </div>

                  <div className="col-span-full">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea 
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none transition-all resize-none"
                      rows={3}
                      placeholder="Additional details about the medicine..."
                    />
                  </div>
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 shrink-0">
                <button 
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors font-medium flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Adding...
                    </>
                  ) : 'Add Medicine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
