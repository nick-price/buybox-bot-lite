import React, { useState, useEffect } from 'react';
import { Plus, Trash2, RefreshCw, Package, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const SellerList = ({ compact = false }) => {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingSeller, setAddingSeller] = useState(false);
  const [newSeller, setNewSeller] = useState({ sellerId: '', label: '' });

  useEffect(() => {
    fetchSellers();
  }, []);

  const fetchSellers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/tracker/sellers', {
        headers: {
          'x-user-id': localStorage.getItem('userId')
        }
      });
      setSellers(response.data);
    } catch (error) {
      console.error('Error fetching sellers:', error);
      toast.error('Failed to fetch sellers');
    } finally {
      setLoading(false);
    }
  };

  const addSeller = async (e) => {
    e.preventDefault();
    if (!newSeller.sellerId || !newSeller.label) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setAddingSeller(true);
      await axios.post('/api/tracker/sellers', newSeller, {
        headers: {
          'x-user-id': localStorage.getItem('userId')
        }
      });
      
      toast.success('Seller added successfully');
      setNewSeller({ sellerId: '', label: '' });
      fetchSellers();
    } catch (error) {
      console.error('Error adding seller:', error);
      toast.error('Failed to add seller');
    } finally {
      setAddingSeller(false);
    }
  };

  const deleteSeller = async (sellerId) => {
    if (!window.confirm('Are you sure you want to delete this seller?')) {
      return;
    }

    try {
      await axios.delete(`/api/tracker/sellers/${sellerId}`, {
        headers: {
          'x-user-id': localStorage.getItem('userId')
        }
      });
      
      toast.success('Seller deleted successfully');
      fetchSellers();
    } catch (error) {
      console.error('Error deleting seller:', error);
      toast.error('Failed to delete seller');
    }
  };

  const refreshAsins = async (sellerId) => {
    try {
      toast.loading('Refreshing ASINs...');
      await axios.post(`/api/tracker/asins/refresh/${sellerId}`, {}, {
        headers: {
          'x-user-id': localStorage.getItem('userId')
        }
      });
      
      toast.dismiss();
      toast.success('ASINs refreshed successfully');
    } catch (error) {
      console.error('Error refreshing ASINs:', error);
      toast.dismiss();
      toast.error('Failed to refresh ASINs');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!compact && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Add New Seller
          </h3>
          
          <form onSubmit={addSeller} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Seller ID
                </label>
                <input
                  type="text"
                  value={newSeller.sellerId}
                  onChange={(e) => setNewSeller({ ...newSeller, sellerId: e.target.value })}
                  placeholder="Enter Amazon Seller ID"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Label
                </label>
                <input
                  type="text"
                  value={newSeller.label}
                  onChange={(e) => setNewSeller({ ...newSeller, label: e.target.value })}
                  placeholder="Enter a label (e.g., 'My Store')"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={addingSeller}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {addingSeller ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Plus className="h-4 w-4" />
              )}
              <span>{addingSeller ? 'Adding...' : 'Add Seller'}</span>
            </button>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {compact ? 'Active Sellers' : 'Tracked Sellers'}
          </h3>
        </div>
        
        {sellers.length === 0 ? (
          <div className="p-6 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {compact ? 'No active sellers' : 'No sellers added yet. Add your first seller to start tracking.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {sellers.map((seller) => (
              <div key={seller.seller_id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                        {seller.label}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        ID: {seller.seller_id}
                      </p>
                    </div>
                  </div>
                  
                  {!compact && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => refreshAsins(seller.seller_id)}
                        className="flex items-center space-x-1 px-3 py-1 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors duration-200"
                      >
                        <RefreshCw className="h-4 w-4" />
                        <span>Refresh ASINs</span>
                      </button>
                      
                      <button
                        onClick={() => deleteSeller(seller.seller_id)}
                        className="flex items-center space-x-1 px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors duration-200"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerList; 