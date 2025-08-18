import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Dormitories = () => {
  const [dormitories, setDormitories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFacilities, setSelectedFacilities] = useState([]);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });

  useEffect(() => {
    fetchDormitories();
    // eslint-disable-next-line
  }, []);

  const fetchDormitories = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedFacilities.length > 0) params.append('facilities', selectedFacilities.join(','));
      if (priceRange.min) params.append('minPrice', priceRange.min);
      if (priceRange.max) params.append('maxPrice', priceRange.max);

      const response = await axios.get(`http://localhost:5000/api/dormitories?${params}`);
      setDormitories(response.data);
    } catch (error) {
      console.error('Error fetching dormitories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchDormitories();
  };

  const handleFacilityToggle = (facility) => {
    setSelectedFacilities(prev => 
      prev.includes(facility) 
        ? prev.filter(f => f !== facility)
        : [...prev, facility]
    );
  };

  const getFacilityIcon = (facility) => {
    const icons = {
      wifi: '📶',
      air_conditioning: '❄️',
      kitchen: '🍳',
      laundry: '👕',
      parking: '🚗',
      security: '🔒',
      cleaning: '🧹'
    };
    return icons[facility] || '🏠';
  };

  const getFacilityName = (facility) => {
    const names = {
      wifi: 'Wi-Fi',
      air_conditioning: 'แอร์คอนดิชัน',
      kitchen: 'ครัว',
      laundry: 'ซักรีด',
      parking: 'ที่จอดรถ',
      security: 'รักษาความปลอดภัย',
      cleaning: 'ทำความสะอาด'
    };
    return names[facility] || facility;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">กำลังโหลด...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">หอพักทั้งหมด</h1>
      {/* Search and Filter */}
      <div className="card mb-8">
        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ค้นหา
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field"
              placeholder="ชื่อหอพัก..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ราคาต่ำสุด
            </label>
            <input
              type="number"
              value={priceRange.min}
              onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
              className="input-field"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ราคาสูงสุด
            </label>
            <input
              type="number"
              value={priceRange.max}
              onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
              className="input-field"
              placeholder="10000"
            />
          </div>
          <div className="flex items-end">
            <button onClick={handleSearch} className="btn-primary w-full">
              ค้นหา
            </button>
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            สิ่งอำนวยความสะดวก
          </label>
          <div className="flex flex-wrap gap-2">
            {['wifi', 'air_conditioning', 'kitchen', 'laundry', 'parking', 'security', 'cleaning'].map(facility => (
              <button
                key={facility}
                onClick={() => handleFacilityToggle(facility)}
                className={`px-3 py-1 rounded-full text-sm ${
                  selectedFacilities.includes(facility)
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {getFacilityIcon(facility)} {getFacilityName(facility)}
              </button>
            ))}
          </div>
        </div>
      </div>
      {/* Dormitories Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dormitories.map(dormitory => (
          <div key={dormitory._id} className="card hover:shadow-lg transition-shadow">
            <div className="aspect-video bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
              {dormitory.images && dormitory.images.length > 0 ? (
                <img 
                  src={dormitory.images[0]} 
                  alt={dormitory.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <div className="text-4xl">🏠</div>
              )}
            </div>
            <h3 className="text-xl font-semibold mb-2">{dormitory.name}</h3>
            <p className="text-gray-600 mb-3 line-clamp-2">{dormitory.description}</p>
            <div className="flex items-center mb-3">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <span key={i}>
                    {i < Math.floor(dormitory.rating) ? '★' : '☆'}
                  </span>
                ))}
              </div>
              <span className="text-sm text-gray-600 ml-2">
                ({dormitory.totalReviews} รีวิว)
              </span>
            </div>
            <div className="mb-3">
              <p className="text-sm text-gray-600">
                📍 {dormitory.address.street}, {dormitory.address.city}
              </p>
            </div>
            <div className="mb-4">
              <p className="text-lg font-semibold text-primary-600">
                เริ่มต้น {Math.min(...dormitory.roomTypes.map(rt => rt.price))} บาท/เดือน
              </p>
            </div>
            <div className="flex flex-wrap gap-1 mb-4">
              {dormitory.facilities.slice(0, 3).map(facility => (
                <span key={facility} className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {getFacilityIcon(facility)} {getFacilityName(facility)}
                </span>
              ))}
              {dormitory.facilities.length > 3 && (
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                  +{dormitory.facilities.length - 3} อื่นๆ
                </span>
              )}
            </div>
            <Link 
              to={`/dormitories/${dormitory._id}`}
              className="btn-primary w-full text-center"
            >
              ดูรายละเอียด
            </Link>
          </div>
        ))}
      </div>
      {dormitories.length === 0 && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🏠</div>
          <h3 className="text-xl font-semibold mb-2">ไม่พบหอพัก</h3>
          <p className="text-gray-600">ลองปรับเงื่อนไขการค้นหาใหม่</p>
        </div>
      )}
    </div>
  );
};

export default Dormitories; 