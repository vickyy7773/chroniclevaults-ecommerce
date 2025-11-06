import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, Filter, ChevronUp, ChevronDown } from 'lucide-react';
import { API_BASE_URL } from '../../constants/api';

const FilterOptionsManagement = () => {
  const [filterOptions, setFilterOptions] = useState({
    rarity: [],
    condition: [],
    denomination: [],
    metal: []
  });
  const [loading, setLoading] = useState(false);
  const [editingOption, setEditingOption] = useState(null);
  const [addingNew, setAddingNew] = useState(null); // { type: 'rarity', value: '', displayOrder: 0 }
  const [expandedSections, setExpandedSections] = useState({
    rarity: true,
    condition: true,
    denomination: true,
    metal: true
  });

  const filterTypeLabels = {
    rarity: 'Rarity Options',
    condition: 'Condition Options',
    denomination: 'Denomination Options',
    metal: 'Metal Options'
  };

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  const fetchFilterOptions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/filter-options/admin/all`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (data.success) {
        setFilterOptions(data.data);
      } else {
        alert('Failed to load filter options');
      }
    } catch (error) {
      console.error('Error fetching filter options:', error);
      alert(`Failed to load filter options: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = (type) => {
    setAddingNew({ type, value: '', displayOrder: filterOptions[type].length + 1 });
  };

  const handleSaveNew = async () => {
    if (!addingNew.value.trim()) {
      alert('Please enter a value');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/filter-options`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: addingNew.type,
          value: addingNew.value.trim(),
          displayOrder: addingNew.displayOrder
        })
      });

      const data = await response.json();

      if (data.success) {
        await fetchFilterOptions();
        setAddingNew(null);
        alert('Filter option added successfully!');
      } else {
        alert(data.message || 'Failed to add filter option');
      }
    } catch (error) {
      console.error('Error adding filter option:', error);
      alert(`Failed to add filter option: ${error.message}`);
    }
  };

  const handleEdit = (option) => {
    setEditingOption({ ...option, newValue: option.value, newDisplayOrder: option.displayOrder });
  };

  const handleSaveEdit = async () => {
    if (!editingOption.newValue.trim()) {
      alert('Please enter a value');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/filter-options/${editingOption._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          value: editingOption.newValue.trim(),
          displayOrder: editingOption.newDisplayOrder,
          isActive: editingOption.isActive
        })
      });

      const data = await response.json();

      if (data.success) {
        await fetchFilterOptions();
        setEditingOption(null);
        alert('Filter option updated successfully!');
      } else {
        alert(data.message || 'Failed to update filter option');
      }
    } catch (error) {
      console.error('Error updating filter option:', error);
      alert(`Failed to update filter option: ${error.message}`);
    }
  };

  const handleDelete = async (optionId, type, value) => {
    if (window.confirm(`Are you sure you want to delete "${value}"?`)) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/filter-options/${optionId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (data.success) {
          await fetchFilterOptions();
          alert('Filter option deleted successfully!');
        } else {
          alert(data.message || 'Failed to delete filter option');
        }
      } catch (error) {
        console.error('Error deleting filter option:', error);
        alert(`Failed to delete filter option: ${error.message}`);
      }
    }
  };

  const toggleSection = (type) => {
    setExpandedSections(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const toggleActiveStatus = async (option) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/filter-options/${option._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          isActive: !option.isActive
        })
      });

      const data = await response.json();

      if (data.success) {
        await fetchFilterOptions();
      } else {
        alert(data.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert(`Failed to update status: ${error.message}`);
    }
  };

  const renderFilterSection = (type) => {
    const options = filterOptions[type] || [];
    const isExpanded = expandedSections[type];

    return (
      <div key={type} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-4">
        {/* Section Header */}
        <div
          className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100"
          onClick={() => toggleSection(type)}
        >
          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-gray-800">{filterTypeLabels[type]}</h3>
            <span className="px-2 py-1 bg-amber-100 text-amber-700 text-sm rounded-full">
              {options.length} options
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAddNew(type);
              }}
              className="flex items-center gap-2 px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              Add New
            </button>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </div>
        </div>

        {/* Section Content */}
        {isExpanded && (
          <div className="p-4">
            {/* Adding New Option Form */}
            {addingNew && addingNew.type === type && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-3">Add New {filterTypeLabels[type]}</h4>
                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-8">
                    <input
                      type="text"
                      value={addingNew.value}
                      onChange={(e) => setAddingNew({ ...addingNew, value: e.target.value })}
                      placeholder="Enter value"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      autoFocus
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      value={addingNew.displayOrder}
                      onChange={(e) => setAddingNew({ ...addingNew, displayOrder: parseInt(e.target.value) })}
                      placeholder="Order"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                  <div className="col-span-2 flex gap-2">
                    <button
                      onClick={handleSaveNew}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setAddingNew(null)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Options List */}
            {options.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No options available. Click "Add New" to create one.
              </div>
            ) : (
              <div className="space-y-2">
                {options.map((option) => (
                  <div
                    key={option._id}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      option.isActive
                        ? 'bg-white border-gray-200 hover:border-amber-300'
                        : 'bg-gray-50 border-gray-200 opacity-60'
                    } transition-all`}
                  >
                    {/* Display Order */}
                    <div className="w-12 text-center">
                      {editingOption?._id === option._id ? (
                        <input
                          type="number"
                          value={editingOption.newDisplayOrder}
                          onChange={(e) => setEditingOption({ ...editingOption, newDisplayOrder: parseInt(e.target.value) })}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded text-center"
                        />
                      ) : (
                        <span className="text-sm font-medium text-gray-500">#{option.displayOrder}</span>
                      )}
                    </div>

                    {/* Value */}
                    <div className="flex-1">
                      {editingOption?._id === option._id ? (
                        <input
                          type="text"
                          value={editingOption.newValue}
                          onChange={(e) => setEditingOption({ ...editingOption, newValue: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                          autoFocus
                        />
                      ) : (
                        <span className={`font-medium ${option.isActive ? 'text-gray-800' : 'text-gray-500'}`}>
                          {option.value}
                        </span>
                      )}
                    </div>

                    {/* Status Toggle */}
                    <button
                      onClick={() => toggleActiveStatus(option)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        option.isActive
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      }`}
                    >
                      {option.isActive ? 'Active' : 'Inactive'}
                    </button>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {editingOption?._id === option._id ? (
                        <>
                          <button
                            onClick={handleSaveEdit}
                            className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingOption(null)}
                            className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEdit(option)}
                            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(option._id, type, option.value)}
                            className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Filter Options Management</h1>
        <p className="text-gray-600">
          Manage filter options for products. Changes here will immediately reflect in the product filters.
        </p>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {renderFilterSection('rarity')}
          {renderFilterSection('condition')}
          {renderFilterSection('denomination')}
          {renderFilterSection('metal')}
        </div>
      )}
    </div>
  );
};

export default FilterOptionsManagement;
