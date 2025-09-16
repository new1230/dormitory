import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import PageTransition from '../components/PageTransition';
import { LoadingSpinner, LoadingButton } from '../components/LoadingEffect';
import useNotification from '../hooks/useNotification';
import { ToastContainer } from '../components/Notification';
import MeterPhotoUpload from '../components/MeterPhotoUpload';
import axios from 'axios';

const MeterReading = () => {
  const { notifications, showSuccess, showError, showWarning } = useNotification();

  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [meterData, setMeterData] = useState({});
  const [calculations, setCalculations] = useState({});
  
  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    status: 'all', // all, completed, pending, not_started
    roomType: 'all',
    sortBy: 'room_number', // room_number, tenant_name, total_amount
    sortOrder: 'asc' // asc, desc
  });

  const months = [
    { value: 1, label: 'มกราคม' }, { value: 2, label: 'กุมภาพันธ์' },
    { value: 3, label: 'มีนาคม' }, { value: 4, label: 'เมษายน' },
    { value: 5, label: 'พฤษภาคม' }, { value: 6, label: 'มิถุนายน' },
    { value: 7, label: 'กรกฎาคม' }, { value: 8, label: 'สิงหาคม' },
    { value: 9, label: 'กันยายน' }, { value: 10, label: 'ตุลาคม' },
    { value: 11, label: 'พฤศจิกายน' }, { value: 12, label: 'ธันวาคม' }
  ];

  const years = [];
  for (let year = new Date().getFullYear() - 2; year <= new Date().getFullYear() + 1; year++) {
    years.push(year);
  }

  useEffect(() => {
    fetchRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, selectedYear]);

  // Filter and sort rooms
  useEffect(() => {
    let filtered = [...rooms];

    // Search filter
    if (filters.search) {
      filtered = filtered.filter(room =>
        room.room_number.toString().toLowerCase().includes(filters.search.toLowerCase()) ||
        (room.tenant?.name && room.tenant.name.toLowerCase().includes(filters.search.toLowerCase()))
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(room => {
        const hasReading = room.current_reading.reading_id;
        const hasBill = room.current_reading.is_billed;
        
        switch (filters.status) {
          case 'completed':
            return hasReading && hasBill;
          case 'pending':
            return hasReading && !hasBill;
          case 'not_started':
            return !hasReading;
          default:
            return true;
        }
      });
    }

    // Room type filter
    if (filters.roomType !== 'all') {
      filtered = filtered.filter(room => room.room_type_id.toString() === filters.roomType);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (filters.sortBy) {
        case 'room_number':
          aValue = parseInt(a.room_number);
          bValue = parseInt(b.room_number);
          break;
        case 'tenant_name':
          aValue = a.tenant?.name || '';
          bValue = b.tenant?.name || '';
          break;
        case 'total_amount':
          aValue = calculations[a.room_id]?.total_amount || 0;
          bValue = calculations[b.room_id]?.total_amount || 0;
          break;
        default:
          aValue = a.room_number;
          bValue = b.room_number;
      }

      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredRooms(filtered);
  }, [rooms, filters, calculations]);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/meter-readings/rooms/${selectedYear}/${selectedMonth}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setRooms(response.data);
      
      // เตรียมข้อมูลเริ่มต้นสำหรับการกรอก
      const initialData = {};
      response.data.forEach(room => {
        initialData[room.room_id] = {
          current_water_reading: room.current_reading.water_reading,
          current_electricity_reading: room.current_reading.electricity_reading,
          other_charges: room.current_reading.other_charges,
          other_charges_reason: room.current_reading.other_charges_reason,
          notes: room.current_reading.notes,
          meter_photo_water: room.current_reading.meter_photo_water,
          meter_photo_electricity: room.current_reading.meter_photo_electricity
        };
      });
      setMeterData(initialData);

    } catch (error) {
      console.error('Failed to fetch rooms:', error);
      showError('ไม่สามารถโหลดข้อมูลห้องได้');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = async (roomId, field, value) => {
    const newData = {
      ...meterData,
      [roomId]: {
        ...meterData[roomId],
        [field]: value
      }
    };
    setMeterData(newData);

    // คำนวณค่าใช้จ่ายทันทีเมื่อกรอกข้อมูลมิเตอร์
    if (field === 'current_water_reading' || field === 'current_electricity_reading' || field === 'other_charges') {
      const roomData = newData[roomId];
      if (roomData.current_water_reading && roomData.current_electricity_reading) {
        await calculateCosts(roomId, roomData);
      }
    }
  };

  const calculateCosts = async (roomId, roomData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/meter-readings/calculate-costs',
        {
          room_id: roomId,
          reading_month: selectedMonth,
          reading_year: selectedYear,
          current_water_reading: roomData.current_water_reading,
          current_electricity_reading: roomData.current_electricity_reading,
          other_charges: roomData.other_charges || 0
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCalculations(prev => ({
        ...prev,
        [roomId]: response.data.calculations
      }));

    } catch (error) {
      console.error('Failed to calculate costs:', error);
    }
  };

  const saveMeterReading = async (roomId) => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const roomData = meterData[roomId];

      const formData = new FormData();
      formData.append('room_id', roomId);
      formData.append('reading_month', selectedMonth);
      formData.append('reading_year', selectedYear);
      formData.append('current_water_reading', roomData.current_water_reading || 0);
      formData.append('current_electricity_reading', roomData.current_electricity_reading || 0);
      formData.append('other_charges', roomData.other_charges || 0);
      formData.append('other_charges_reason', roomData.other_charges_reason || '');
      formData.append('notes', roomData.notes || '');
      
      if (roomData.meter_photo_water) {
        formData.append('meter_photo_water_filename', roomData.meter_photo_water);
      }
      if (roomData.meter_photo_electricity) {
        formData.append('meter_photo_electricity_filename', roomData.meter_photo_electricity);
      }

      await axios.post('http://localhost:5000/api/meter-readings', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      showSuccess(`บันทึกข้อมูลห้อง ${rooms.find(r => r.room_id === roomId)?.room_number} สำเร็จ`);
      
      // รีเฟรชข้อมูล
      fetchRooms();

    } catch (error) {
      console.error('Failed to save meter reading:', error);
      showError('ไม่สามารถบันทึกข้อมูลมิเตอร์ได้');
    } finally {
      setSaving(false);
    }
  };

  const createBill = async (roomId) => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const roomData = meterData[roomId];

      await axios.post('http://localhost:5000/api/meter-readings/create-bill', {
        room_id: roomId,
        reading_month: selectedMonth,
        reading_year: selectedYear,
        other_charges: roomData.other_charges || 0,
        other_charges_reason: roomData.other_charges_reason || ''
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      showSuccess(`สร้างบิลห้อง ${rooms.find(r => r.room_id === roomId)?.room_number} สำเร็จ`);
      
      // รีเฟรชข้อมูล
      fetchRooms();

    } catch (error) {
      console.error('Failed to create bill:', error);
      showError('ไม่สามารถสร้างบิลได้');
    } finally {
      setSaving(false);
    }
  };

  const saveAllAndCreateBills = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      let successCount = 0;
      let errorCount = 0;

      // บันทึกข้อมูลมิเตอร์ทุกห้อง
      for (const room of rooms) {
        try {
          const roomData = meterData[room.room_id];
          if (!roomData?.current_water_reading || !roomData?.current_electricity_reading) {
            continue;
          }

          const formData = new FormData();
          formData.append('room_id', room.room_id);
          formData.append('reading_month', selectedMonth);
          formData.append('reading_year', selectedYear);
          formData.append('current_water_reading', roomData.current_water_reading);
          formData.append('current_electricity_reading', roomData.current_electricity_reading);
          formData.append('other_charges', roomData.other_charges || 0);
          formData.append('other_charges_reason', roomData.other_charges_reason || '');
          formData.append('notes', roomData.notes || '');

          await axios.post('http://localhost:5000/api/meter-readings', formData, {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          });

          // สร้างบิล
          await axios.post('http://localhost:5000/api/meter-readings/create-bill', {
            room_id: room.room_id,
            reading_month: selectedMonth,
            reading_year: selectedYear,
            other_charges: roomData.other_charges || 0,
            other_charges_reason: roomData.other_charges_reason || ''
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });

          successCount++;
        } catch (error) {
          console.error(`Failed for room ${room.room_number}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        showSuccess(`บันทึกและสร้างบิลสำเร็จ ${successCount} ห้อง`);
      }
      if (errorCount > 0) {
        showWarning(`มีห้องที่ไม่สามารถประมวลผลได้ ${errorCount} ห้อง`);
      }

      // รีเฟรชข้อมูล
      fetchRooms();

    } catch (error) {
      console.error('Failed to save all:', error);
      showError('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <PageTransition>
          <div className="flex justify-center items-center min-h-screen">
            <LoadingSpinner size="large" />
          </div>
        </PageTransition>
      </div>
    );
  }

  // Get unique room types for filter
  const roomTypes = [...new Set(rooms.map(room => ({
    id: room.room_type_id,
    name: room.room_type_name
  })))];

  // Get statistics
  const stats = {
    total: rooms.length,
    completed: rooms.filter(r => r.current_reading.reading_id && r.current_reading.is_billed).length,
    pending: rooms.filter(r => r.current_reading.reading_id && !r.current_reading.is_billed).length,
    notStarted: rooms.filter(r => !r.current_reading.reading_id).length
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      roomType: 'all',
      sortBy: 'room_number',
      sortOrder: 'asc'
    });
  };

  return (
    <div>
      <Navbar />
      <PageTransition>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-6">
          <div className="max-w-7xl mx-auto px-4">
            
            {/* Header Section */}
            <div className="mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                📊 จดมิเตอร์และสร้างบิล
              </h1>
              <p className="text-lg text-gray-600 max-w-3xl">
                จดเลขมิเตอร์น้ำ-ไฟของแต่ละห้อง คำนวณค่าใช้จ่าย และสร้างบิลรายเดือน
              </p>
            </div>

            {/* Month/Year Selection */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">เดือน</label>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors min-w-[140px]"
                    >
                      {months.map(month => (
                        <option key={month.value} value={month.value}>
                          {month.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">ปี</label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors min-w-[120px]"
                    >
                      {years.map(year => (
                        <option key={year} value={year}>
                          {year + 543}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3">
                  <LoadingButton
                    loading={saving}
                    onClick={saveAllAndCreateBills}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    💾 บันทึกทั้งหมดและสร้างบิล
                  </LoadingButton>
                </div>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">{stats.total}</div>
                <div className="text-sm text-gray-600">ห้องทั้งหมด</div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">{stats.completed}</div>
                <div className="text-sm text-gray-600">เสร็จสิ้น</div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <div className="text-3xl font-bold text-yellow-600 mb-2">{stats.pending}</div>
                <div className="text-sm text-gray-600">รอสร้างบิล</div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <div className="text-3xl font-bold text-red-600 mb-2">{stats.notStarted}</div>
                <div className="text-sm text-gray-600">ยังไม่ได้จด</div>
              </div>
            </div>

            {/* Advanced Filters */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">🔍 ตัวกรองและค้นหา</h3>
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  ล้างตัวกรองทั้งหมด
                </button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Search */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">ค้นหา</label>
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    placeholder="ค้นหาห้อง หรือชื่อผู้เช่า..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">สถานะ</label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  >
                    <option value="all">ทั้งหมด</option>
                    <option value="not_started">ยังไม่ได้จด</option>
                    <option value="pending">รอสร้างบิล</option>
                    <option value="completed">เสร็จสิ้น</option>
                  </select>
                </div>

                {/* Room Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ประเภทห้อง</label>
                  <select
                    value={filters.roomType}
                    onChange={(e) => handleFilterChange('roomType', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  >
                    <option value="all">ทั้งหมด</option>
                    {roomTypes.map(type => (
                      <option key={type.room_type_id || type.id} value={type.room_type_id || type.id}>
                        {type.room_type_name || type.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">เรียงตาม</label>
                  <div className="flex gap-2">
                    <select
                      value={filters.sortBy}
                      onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                      className="flex-1 px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm"
                    >
                      <option value="room_number">เลขห้อง</option>
                      <option value="tenant_name">ชื่อผู้เช่า</option>
                      <option value="total_amount">ยอดรวม</option>
                    </select>
                    <button
                      onClick={() => handleFilterChange('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
                      className="px-3 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      title={filters.sortOrder === 'asc' ? 'เรียงจากน้อยไปมาก' : 'เรียงจากมากไปน้อย'}
                    >
                      {filters.sortOrder === 'asc' ? '↑' : '↓'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Rooms List */}
            <div className="space-y-4">
              {filteredRooms.length === 0 ? (
                <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                  <div className="text-gray-400 text-6xl mb-4">🔍</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่พบห้องที่ตรงกับเงื่อนไข</h3>
                  <p className="text-gray-600">ลองเปลี่ยนตัวกรองหรือคำค้นหา</p>
                </div>
              ) : (
                filteredRooms.map((room) => {
                  const roomData = meterData[room.room_id] || {};
                  const calc = calculations[room.room_id] || {};
                  
                  // Determine room status
                  const hasReading = room.current_reading.reading_id;
                  const hasBill = room.current_reading.is_billed;
                  let status = 'not_started';
                  let statusColor = 'red';
                  let statusText = 'ยังไม่ได้จด';
                  
                  if (hasReading && hasBill) {
                    status = 'completed';
                    statusColor = 'green';
                    statusText = 'เสร็จสิ้น';
                  } else if (hasReading && !hasBill) {
                    status = 'pending';
                    statusColor = 'yellow';
                    statusText = 'รอสร้างบิล';
                  }
                  
                  return (
                    <div key={room.room_id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                      {/* Room Header */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="bg-white rounded-lg p-3 shadow-sm">
                              <div className="text-2xl font-bold text-blue-600">ห้อง {room.room_number}</div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-600">{room.room_type_name}</div>
                              <div className="font-semibold text-gray-900">{room.tenant.name}</div>
                              <div className="text-sm text-blue-600">ค่าเช่า: ฿{room.room_rent.toLocaleString()}/เดือน</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className={`px-3 py-1 rounded-full text-sm font-medium bg-${statusColor}-100 text-${statusColor}-800`}>
                              {statusText}
                            </div>
                            {calc.total_amount && (
                              <div className="text-right">
                                <div className="text-2xl font-bold text-green-600">฿{calc.total_amount.toLocaleString()}</div>
                                <div className="text-xs text-gray-500">ยอดรวม</div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Room Content */}
                      <div className="p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          
                          {/* Meter Readings */}
                          <div className="lg:col-span-2">
                            <h4 className="text-lg font-semibold text-gray-900 mb-4">📊 ข้อมูลมิเตอร์</h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Water Meter */}
                              <div className="bg-blue-50 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-3">
                                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                    <span className="text-white text-sm">💧</span>
                                  </div>
                                  <h5 className="font-semibold text-gray-900">มิเตอร์น้ำ</h5>
                                </div>
                                
                                <div className="space-y-3">
                                  <div className="text-sm text-gray-600">
                                    เดือนก่อน: <span className="font-medium">{room.previous_reading.water_reading}</span>
                                  </div>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={roomData.current_water_reading || ''}
                                    onChange={(e) => handleInputChange(room.room_id, 'current_water_reading', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="เดือนนี้"
                                  />
                                  {calc.water_units > 0 && (
                                    <div className="bg-white rounded p-2 text-sm">
                                      <div className="text-blue-600 font-medium">
                                        ใช้: {calc.water_units} หน่วย
                                      </div>
                                      <div className="text-green-600 font-semibold">
                                        ค่าน้ำ: ฿{calc.water_cost?.toLocaleString()}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Electricity Meter */}
                              <div className="bg-yellow-50 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-3">
                                  <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                                    <span className="text-white text-sm">⚡</span>
                                  </div>
                                  <h5 className="font-semibold text-gray-900">มิเตอร์ไฟ</h5>
                                </div>
                                
                                <div className="space-y-3">
                                  <div className="text-sm text-gray-600">
                                    เดือนก่อน: <span className="font-medium">{room.previous_reading.electricity_reading}</span>
                                  </div>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={roomData.current_electricity_reading || ''}
                                    onChange={(e) => handleInputChange(room.room_id, 'current_electricity_reading', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                    placeholder="เดือนนี้"
                                  />
                                  {calc.electricity_units > 0 && (
                                    <div className="bg-white rounded p-2 text-sm">
                                      <div className="text-yellow-600 font-medium">
                                        ใช้: {calc.electricity_units} หน่วย
                                      </div>
                                      <div className="text-green-600 font-semibold">
                                        ค่าไฟ: ฿{calc.electricity_cost?.toLocaleString()}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Other Charges */}
                            <div className="mt-6">
                              <h5 className="font-semibold text-gray-900 mb-3">💰 ค่าใช้จ่ายอื่น</h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm text-gray-700 mb-1">จำนวนเงิน</label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={roomData.other_charges || ''}
                                    onChange={(e) => handleInputChange(room.room_id, 'other_charges', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="0"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm text-gray-700 mb-1">เหตุผล</label>
                                  <input
                                    type="text"
                                    value={roomData.other_charges_reason || ''}
                                    onChange={(e) => handleInputChange(room.room_id, 'other_charges_reason', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="เช่น ค่าซ่อมแซม"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Right Side - Photos & Actions */}
                          <div className="space-y-6">
                            
                            {/* Meter Photos */}
                            <div>
                              <h5 className="font-semibold text-gray-900 mb-3">📸 หลักฐานมิเตอร์</h5>
                              <div className="space-y-4">
                                <div>
                                  <div className="text-sm text-gray-700 mb-2">น้ำ:</div>
                                  <MeterPhotoUpload 
                                    roomId={room.room_id}
                                    meterType="water"
                                    existingPhoto={room.current_reading.meter_photo_water}
                                    onPhotoUploaded={(filename) => handleInputChange(room.room_id, 'meter_photo_water', filename)}
                                  />
                                </div>
                                <div>
                                  <div className="text-sm text-gray-700 mb-2">ไฟ:</div>
                                  <MeterPhotoUpload 
                                    roomId={room.room_id}
                                    meterType="electricity"
                                    existingPhoto={room.current_reading.meter_photo_electricity}
                                    onPhotoUploaded={(filename) => handleInputChange(room.room_id, 'meter_photo_electricity', filename)}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Cost Breakdown */}
                            {calc.total_amount && (
                              <div className="bg-gray-50 rounded-lg p-4">
                                <h5 className="font-semibold text-gray-900 mb-3">💵 รายละเอียดค่าใช้จ่าย</h5>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span>ค่าเช่าห้อง:</span>
                                    <span className="font-medium">฿{room.room_rent.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>ค่าน้ำ:</span>
                                    <span className="font-medium">฿{calc.water_cost?.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>ค่าไฟ:</span>
                                    <span className="font-medium">฿{calc.electricity_cost?.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>อื่นๆ:</span>
                                    <span className="font-medium">฿{calc.other_charges?.toLocaleString()}</span>
                                  </div>
                                  {calc.penalty_amount > 0 && (
                                    <div className="flex justify-between text-red-600">
                                      <span>ค่าปรับ:</span>
                                      <span className="font-medium">฿{calc.penalty_amount?.toLocaleString()}</span>
                                    </div>
                                  )}
                                  <div className="border-t border-gray-300 pt-2">
                                    <div className="flex justify-between font-semibold text-lg">
                                      <span>รวม:</span>
                                      <span className="text-green-600">฿{calc.total_amount.toLocaleString()}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="space-y-3">
                              <button
                                onClick={() => saveMeterReading(room.room_id)}
                                disabled={!roomData.current_water_reading || !roomData.current_electricity_reading}
                                className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                                  !roomData.current_water_reading || !roomData.current_electricity_reading
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-105 shadow-lg'
                                }`}
                              >
                                💾 บันทึกข้อมูลมิเตอร์
                              </button>
                              
                              {room.current_reading.reading_id && (
                                <button
                                  onClick={() => createBill(room.room_id)}
                                  className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all duration-200 hover:scale-105 shadow-lg"
                                >
                                  🧾 สร้างบิล
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Help Section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mt-8">
              <h4 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
                💡 คำแนะนำการใช้งาน
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">1.</span>
                    <span className="text-blue-700">กรอกเลขมิเตอร์น้ำและไฟของเดือนปัจจุบัน</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">2.</span>
                    <span className="text-blue-700">ระบบจะคำนวณค่าใช้จ่ายอัตโนมัติเมื่อกรอกครบ</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">3.</span>
                    <span className="text-blue-700">สามารถกรอกค่าใช้จ่ายอื่นๆ เพิ่มเติมได้</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">4.</span>
                    <span className="text-blue-700">ค่าปรับจะคำนวณอัตโนมัติหากเลยวันกำหนดชำระ</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">5.</span>
                    <span className="text-blue-700">บันทึกข้อมูลมิเตอร์ก่อน จากนั้นจึงสร้างบิล</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">6.</span>
                    <span className="text-blue-700">ใช้ตัวกรองเพื่อค้นหาและจัดเรียงห้องได้</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <ToastContainer notifications={notifications} />
      </PageTransition>
    </div>
  );
};

export default MeterReading;
