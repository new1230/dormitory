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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [meterData, setMeterData] = useState({});
  const [calculations, setCalculations] = useState({});

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

  return (
    <div>
      <Navbar />
      <PageTransition>
        <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
          <div className="max-w-7xl mx-auto px-4">
            
            {/* หัวข้อ */}
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                📊 จดมิเตอร์และสร้างบิล
              </h1>
              <p className="text-gray-600">
                จดเลขมิเตอร์น้ำ-ไฟของแต่ละห้อง คำนวณค่าใช้จ่าย และสร้างบิลรายเดือน
              </p>
            </div>

            {/* เลือกเดือน-ปี */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">เดือน</label>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                      className="input-field w-40"
                    >
                      {months.map(month => (
                        <option key={month.value} value={month.value}>
                          {month.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ปี</label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                      className="input-field w-32"
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
                    className="btn-primary flex items-center gap-2"
                  >
                    💾 บันทึกทั้งหมดและสร้างบิล
                  </LoadingButton>
                </div>
              </div>
            </div>

            {/* สถิติ */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{rooms.length}</div>
                <div className="text-sm text-gray-600">ห้องที่มีผู้เช่า</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {rooms.filter(r => r.current_reading.reading_id).length}
                </div>
                <div className="text-sm text-gray-600">จดมิเตอร์แล้ว</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {rooms.filter(r => !r.current_reading.reading_id).length}
                </div>
                <div className="text-sm text-gray-600">ยังไม่ได้จด</div>
              </div>
            </div>

            {/* ตารางจดมิเตอร์ */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Mobile View */}
              <div className="block lg:hidden">
                <div className="space-y-4 p-4">
                  {rooms.map((room) => {
                    const roomData = meterData[room.room_id] || {};
                    const calc = calculations[room.room_id] || {};
                    
                    return (
                      <div key={room.room_id} className="bg-gray-50 rounded-lg p-4">
                        {/* หัวข้อห้อง */}
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="text-lg font-semibold text-gray-900">
                              ห้อง {room.room_number}
                            </div>
                            <div className="text-sm text-gray-600">{room.room_type_name}</div>
                            <div className="text-sm text-blue-600">{room.tenant.name}</div>
                          </div>
                          <div className="text-right text-sm">
                            <div className="text-green-600 font-semibold">
                              ฿{room.room_rent.toLocaleString()}/เดือน
                            </div>
                          </div>
                        </div>

                        {/* มิเตอร์น้ำ */}
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <label className="text-xs text-gray-700 font-medium">มิเตอร์น้ำ</label>
                            <div className="text-xs text-gray-500 mb-1">
                              เดือนก่อน: {room.previous_reading.water_reading}
                            </div>
                            <input
                              type="number"
                              step="0.01"
                              value={roomData.current_water_reading || ''}
                              onChange={(e) => handleInputChange(room.room_id, 'current_water_reading', e.target.value)}
                              className="input-field text-sm w-full"
                              placeholder="เดือนนี้"
                            />
                            {calc.water_units > 0 && (
                              <div className="text-xs text-blue-600 mt-1">
                                ใช้: {calc.water_units} หน่วย = ฿{calc.water_cost?.toLocaleString()}
                              </div>
                            )}
                          </div>

                          <div>
                            <label className="text-xs text-gray-700 font-medium">มิเตอร์ไฟ</label>
                            <div className="text-xs text-gray-500 mb-1">
                              เดือนก่อน: {room.previous_reading.electricity_reading}
                            </div>
                            <input
                              type="number"
                              step="0.01"
                              value={roomData.current_electricity_reading || ''}
                              onChange={(e) => handleInputChange(room.room_id, 'current_electricity_reading', e.target.value)}
                              className="input-field text-sm w-full"
                              placeholder="เดือนนี้"
                            />
                            {calc.electricity_units > 0 && (
                              <div className="text-xs text-green-600 mt-1">
                                ใช้: {calc.electricity_units} หน่วย = ฿{calc.electricity_cost?.toLocaleString()}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* ค่าใช้จ่ายอื่น */}
                        <div className="mb-3">
                          <label className="text-xs text-gray-700 font-medium">ค่าใช้จ่ายอื่น</label>
                          <input
                            type="number"
                            step="0.01"
                            value={roomData.other_charges || ''}
                            onChange={(e) => handleInputChange(room.room_id, 'other_charges', e.target.value)}
                            className="input-field text-sm w-full mb-2"
                            placeholder="0"
                          />
                          <textarea
                            value={roomData.other_charges_reason || ''}
                            onChange={(e) => handleInputChange(room.room_id, 'other_charges_reason', e.target.value)}
                            className="input-field text-xs w-full h-16 resize-none"
                            placeholder="เหตุผล..."
                          />
                        </div>

                        {/* ยอดรวม */}
                        {calc.total_amount && (
                          <div className="bg-white rounded p-3 mb-3">
                            <div className="text-center">
                              <div className="text-lg font-bold text-green-600 mb-1">
                                ฿{calc.total_amount.toLocaleString()}
                              </div>
                              <div className="text-xs text-gray-600 space-y-1">
                                <div>ห้อง: ฿{room.room_rent.toLocaleString()}</div>
                                <div>น้ำ: ฿{calc.water_cost?.toLocaleString()}</div>
                                <div>ไฟ: ฿{calc.electricity_cost?.toLocaleString()}</div>
                                <div>อื่นๆ: ฿{calc.other_charges?.toLocaleString()}</div>
                                {calc.penalty_amount > 0 && (
                                  <div className="text-red-600">
                                    ค่าปรับ: ฿{calc.penalty_amount?.toLocaleString()}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* ปุ่มจัดการ */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveMeterReading(room.room_id)}
                            disabled={!roomData.current_water_reading || !roomData.current_electricity_reading}
                            className="btn-secondary text-sm flex-1 disabled:opacity-50"
                          >
                            💾 บันทึก
                          </button>
                          {room.current_reading.reading_id && (
                            <button
                              onClick={() => createBill(room.room_id)}
                              className="btn-primary text-sm flex-1"
                            >
                              🧾 สร้างบิล
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ห้อง
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ผู้เช่า
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        มิเตอร์น้ำ
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        มิเตอร์ไฟ  
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        หลักฐาน
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ค่าใช้จ่ายอื่น
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ยอดรวม
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        การจัดการ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {rooms.map((room) => {
                      const roomData = meterData[room.room_id] || {};
                      const calc = calculations[room.room_id] || {};
                      
                      return (
                        <tr key={room.room_id} className="hover:bg-gray-50">
                          {/* ข้อมูลห้อง */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                ห้อง {room.room_number}
                              </div>
                              <div className="text-sm text-gray-500">
                                {room.room_type_name}
                              </div>
                            </div>
                          </td>

                          {/* ผู้เช่า */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {room.tenant.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              ค่าเช่า: ฿{room.room_rent.toLocaleString()}/เดือน
                            </div>
                          </td>

                          {/* มิเตอร์น้ำ */}
                          <td className="px-4 py-4">
                            <div className="space-y-2">
                              <div className="text-xs text-gray-500">
                                เดือนก่อน: {room.previous_reading.water_reading}
                              </div>
                              <input
                                type="number"
                                step="0.01"
                                value={roomData.current_water_reading || ''}
                                onChange={(e) => handleInputChange(room.room_id, 'current_water_reading', e.target.value)}
                                className="input-field text-sm w-20"
                                placeholder="เดือนนี้"
                              />
                              {calc.water_units > 0 && (
                                <div className="text-xs text-blue-600">
                                  ใช้: {calc.water_units} หน่วย<br/>
                                  ค่าน้ำ: ฿{calc.water_cost?.toLocaleString()}
                                </div>
                              )}
                            </div>
                          </td>

                          {/* มิเตอร์ไฟ */}
                          <td className="px-4 py-4">
                            <div className="space-y-2">
                              <div className="text-xs text-gray-500">
                                เดือนก่อน: {room.previous_reading.electricity_reading}
                              </div>
                              <input
                                type="number"
                                step="0.01"
                                value={roomData.current_electricity_reading || ''}
                                onChange={(e) => handleInputChange(room.room_id, 'current_electricity_reading', e.target.value)}
                                className="input-field text-sm w-20"
                                placeholder="เดือนนี้"
                              />
                              {calc.electricity_units > 0 && (
                                <div className="text-xs text-green-600">
                                  ใช้: {calc.electricity_units} หน่วย<br/>
                                  ค่าไฟ: ฿{calc.electricity_cost?.toLocaleString()}
                                </div>
                              )}
                            </div>
                          </td>

                          {/* หลักฐานมิเตอร์ */}
                          <td className="px-4 py-4">
                            <div className="space-y-2">
                              <div className="text-xs text-gray-700 mb-1">น้ำ:</div>
                              <MeterPhotoUpload 
                                roomId={room.room_id}
                                meterType="water"
                                existingPhoto={room.current_reading.meter_photo_water}
                                onPhotoUploaded={(filename) => handleInputChange(room.room_id, 'meter_photo_water', filename)}
                              />
                              <div className="text-xs text-gray-700 mb-1">ไฟ:</div>
                              <MeterPhotoUpload 
                                roomId={room.room_id}
                                meterType="electricity"
                                existingPhoto={room.current_reading.meter_photo_electricity}
                                onPhotoUploaded={(filename) => handleInputChange(room.room_id, 'meter_photo_electricity', filename)}
                              />
                            </div>
                          </td>

                          {/* ค่าใช้จ่ายอื่น */}
                          <td className="px-4 py-4">
                            <div className="space-y-2">
                              <input
                                type="number"
                                step="0.01"
                                value={roomData.other_charges || ''}
                                onChange={(e) => handleInputChange(room.room_id, 'other_charges', e.target.value)}
                                className="input-field text-sm w-20"
                                placeholder="0"
                              />
                              <textarea
                                value={roomData.other_charges_reason || ''}
                                onChange={(e) => handleInputChange(room.room_id, 'other_charges_reason', e.target.value)}
                                className="input-field text-xs w-full h-12 resize-none"
                                placeholder="เหตุผล..."
                              />
                              <textarea
                                value={roomData.notes || ''}
                                onChange={(e) => handleInputChange(room.room_id, 'notes', e.target.value)}
                                className="input-field text-xs w-full h-10 resize-none"
                                placeholder="หมายเหตุ..."
                              />
                            </div>
                          </td>

                          {/* ยอดรวม */}
                          <td className="px-4 py-4 text-center">
                            {calc.total_amount ? (
                              <div className="space-y-1">
                                <div className="text-lg font-bold text-green-600">
                                  ฿{calc.total_amount.toLocaleString()}
                                </div>
                                <div className="text-xs text-gray-500">
                                  ห้อง: ฿{room.room_rent.toLocaleString()}<br/>
                                  น้ำ: ฿{calc.water_cost?.toLocaleString()}<br/>
                                  ไฟ: ฿{calc.electricity_cost?.toLocaleString()}<br/>
                                  อื่นๆ: ฿{calc.other_charges?.toLocaleString()}<br/>
                                  {calc.penalty_amount > 0 && (
                                    <span className="text-red-600">
                                      ค่าปรับ: ฿{calc.penalty_amount?.toLocaleString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="text-gray-400">-</div>
                            )}
                          </td>

                          {/* การจัดการ */}
                          <td className="px-4 py-4 text-center">
                            <div className="space-y-2">
                              <button
                                onClick={() => saveMeterReading(room.room_id)}
                                disabled={!roomData.current_water_reading || !roomData.current_electricity_reading}
                                className="btn-secondary text-xs px-2 py-1 disabled:opacity-50"
                              >
                                💾 บันทึก
                              </button>
                              {room.current_reading.reading_id && (
                                <button
                                  onClick={() => createBill(room.room_id)}
                                  className="btn-primary text-xs px-2 py-1 w-full"
                                >
                                  🧾 สร้างบิล
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Empty State */}
              {rooms.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">📊</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่พบห้องที่มีผู้เช่า</h3>
                  <p className="text-gray-600">ไม่มีห้องที่ต้องจดมิเตอร์ในเดือนปีนี้</p>
                </div>
              )}
            </div>

            {/* หมายเหตุ */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
              <h4 className="text-sm font-medium text-blue-800 mb-2">💡 คำแนะนำการใช้งาน</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• กรอกเลขมิเตอร์น้ำและไฟของเดือนปัจจุบัน</li>
                <li>• ระบบจะคำนวณค่าใช้จ่ายอัตโนมัติเมื่อกรอกครบ</li>
                <li>• สามารถกรอกค่าใช้จ่ายอื่นๆ เพิ่มเติมได้ (เช่น ค่าซ่อมแซม)</li>
                <li>• ค่าปรับจะคำนวณอัตโนมัติหากเลยวันกำหนดชำระ (10 บาท/วัน)</li>
                <li>• บันทึกข้อมูลมิเตอร์ก่อน จากนั้นจึงสร้างบิล</li>
              </ul>
            </div>
          </div>
        </div>

        <ToastContainer notifications={notifications} />
      </PageTransition>
    </div>
  );
};

export default MeterReading;
