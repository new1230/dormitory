import React from 'react';

const RoomCard = ({ room, onEdit, onChangeStatus, viewMode = 'normal' }) => {
  const getStatusInfo = (status) => {
    const statusInfo = {
      '1': { 
        text: 'ห้องว่าง', 
        color: 'bg-green-100 text-green-800 border-green-200', 
        icon: '🟢',
        bgColor: 'bg-green-50'
      },
      '0': { 
        text: 'มีผู้พัก', 
        color: 'bg-red-100 text-red-800 border-red-200', 
        icon: '🔴',
        bgColor: 'bg-red-50'
      },
      '2': { 
        text: 'ปิดซ่อม', 
        color: 'bg-orange-100 text-orange-800 border-orange-200', 
        icon: '🟠',
        bgColor: 'bg-orange-50'
      },
      '3': { 
        text: 'จองแล้ว', 
        color: 'bg-blue-100 text-blue-800 border-blue-200', 
        icon: '🔵',
        bgColor: 'bg-blue-50'
      }
    };
    return statusInfo[status] || { 
      text: 'ไม่ทราบสถานะ', 
      color: 'bg-gray-100 text-gray-800 border-gray-200', 
      icon: '⚪',
      bgColor: 'bg-gray-50'
    };
  };

  const statusInfo = getStatusInfo(room.status);

  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getContractInfo = () => {
    if (!room.contract_start || !room.contract_end) return null;
    
    const now = new Date();
    const endDate = new Date(room.contract_end);
    const daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
    
    return {
      start: room.contract_start,
      end: room.contract_end,
      daysLeft,
      isExpiringSoon: daysLeft <= 30 && daysLeft > 0,
      isExpired: daysLeft < 0
    };
  };

  const contractInfo = getContractInfo();

  // Special Display Mode - สำหรับแสดงสถานะห้องแบบพิเศษ
  if (viewMode === 'special') {
    return (
      <div className={`${statusInfo.bgColor} border-2 ${statusInfo.color.split(' ')[2]} rounded-lg p-4 transition-all duration-200 hover:shadow-md`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{statusInfo.icon}</span>
            <span className="font-semibold text-lg">{room.room_number}</span>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
            {statusInfo.text}
          </span>
        </div>

        <div className="text-sm text-gray-600 mb-2">
          <div className="font-medium">{room.roomType?.room_type_name}</div>
          <div className="flex items-center gap-2 mt-1">
            <span>👥 {room.roomType?.capacity} คน</span>
            {room.roomType?.room_size && (
              <span>📐 {room.roomType?.room_size} ตร.ม.</span>
            )}
          </div>
        </div>

        {/* Contract Information for Special Display */}
        {room.status === '0' && contractInfo && (
          <div className={`text-xs p-2 rounded border-l-4 ${
            contractInfo.isExpired 
              ? 'bg-red-50 border-red-400 text-red-700'
              : contractInfo.isExpiringSoon 
                ? 'bg-yellow-50 border-yellow-400 text-yellow-700'
                : 'bg-blue-50 border-blue-400 text-blue-700'
          }`}>
            <div className="font-medium mb-1">
              {contractInfo.isExpired 
                ? '⚠️ สัญญาหมดแล้ว'
                : contractInfo.isExpiringSoon 
                  ? '⏰ สัญญาใกล้หมด'
                  : '📋 ข้อมูลสัญญา'
              }
            </div>
            <div>สิ้นสุด: {formatDate(contractInfo.end)}</div>
            {!contractInfo.isExpired && (
              <div>เหลือ: {contractInfo.daysLeft} วัน</div>
            )}
          </div>
        )}

        {/* Pricing for Available Rooms */}
        {room.status === '1' && room.roomType && (
          <div className="text-xs text-gray-600 mt-2 p-2 bg-white rounded border">
            <div className="font-medium text-green-600">
              ฿{Number(room.roomType.price_per_month).toLocaleString()}/เดือน
            </div>
            <div className="flex justify-between mt-1">
              <span>น้ำ: ฿{Number(room.roomType.water_rate).toFixed(1)}/หน่วย</span>
              <span>ไฟ: ฿{Number(room.roomType.electricity_rate).toFixed(1)}/หน่วย</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Normal Display Mode
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-200 hover:shadow-lg border">
      {/* Room Image */}
      <div className="relative h-32 bg-gray-200">
        {room.room_img ? (
          <img
            src={`http://localhost:5000/uploads/rooms/${room.room_img}`}
            alt={`ห้อง ${room.room_number}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2v0" />
              </svg>
              <p className="text-xs mt-1">ไม่มีรูปภาพ</p>
            </div>
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-2 left-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
            {statusInfo.text}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="absolute top-2 right-2 flex gap-2">
          <button
            onClick={() => onEdit(room)}
            className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full text-xs transition-colors"
            title="แก้ไข"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Room Header */}
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-lg font-bold text-gray-900">ห้อง {room.room_number}</h3>
            <p className="text-sm text-gray-600">{room.roomType?.room_type_name}</p>
          </div>
        </div>

        {/* Room Details */}
        <div className="flex justify-between items-center text-sm text-gray-600 mb-3">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {room.roomType?.capacity} คน
            </span>
            {room.roomType?.room_size && (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V6a2 2 0 012-2h2M4 16v2a2 2 0 002 2h2M16 4h2a2 2 0 012 2v2M16 20h2a2 2 0 002-2v-2" />
                </svg>
                {room.roomType?.room_size} ตร.ม.
              </span>
            )}
          </div>
        </div>

        {/* Contract Information for Occupied Rooms */}
        {room.status === '0' && contractInfo && (
          <div className={`text-xs p-2 rounded border-l-4 mb-3 ${
            contractInfo.isExpired 
              ? 'bg-red-50 border-red-400 text-red-700'
              : contractInfo.isExpiringSoon 
                ? 'bg-yellow-50 border-yellow-400 text-yellow-700'
                : 'bg-blue-50 border-blue-400 text-blue-700'
          }`}>
            <div className="font-medium mb-1">
              {contractInfo.isExpired 
                ? '⚠️ สัญญาหมดแล้ว'
                : contractInfo.isExpiringSoon 
                  ? '⏰ สัญญาใกล้หมด'
                  : '📋 ข้อมูลสัญญา'
              }
            </div>
            <div>เริ่ม: {formatDate(contractInfo.start)}</div>
            <div>สิ้นสุด: {formatDate(contractInfo.end)}</div>
            {!contractInfo.isExpired && (
              <div>เหลือ: {contractInfo.daysLeft} วัน</div>
            )}
          </div>
        )}

        {/* Description */}
        {room.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {room.description}
          </p>
        )}

        {/* Pricing and Facilities */}
        {room.roomType && (
          <div className="border-t pt-3">
            <div className="flex justify-between items-center text-sm mb-2">
              <span className="font-semibold text-green-600">
                ฿{Number(room.roomType.price_per_month).toLocaleString()}/เดือน
              </span>
              <div className="flex gap-2">
                {room.roomType.air_condition && (
                  <span className="text-blue-600 text-xs">❄️ แอร์</span>
                )}
                {room.roomType.fan && !room.roomType.air_condition && (
                  <span className="text-green-600 text-xs">💨 พัดลม</span>
                )}
              </div>
            </div>
            <div className="text-xs text-gray-600">
              น้ำ: ฿{Number(room.roomType.water_rate).toFixed(1)}/หน่วย • 
              ไฟ: ฿{Number(room.roomType.electricity_rate).toFixed(1)}/หน่วย
            </div>
          </div>
        )}

        {/* Status Change Buttons */}
        <div className="mt-3 pt-3 border-t">
          <div className="flex gap-2 flex-wrap">
            {room.status !== '1' && (
              <button
                onClick={() => onChangeStatus(room.room_id, '1')}
                className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded transition-colors"
              >
                ✓ ว่าง
              </button>
            )}
            {room.status !== '0' && (
              <button
                onClick={() => onChangeStatus(room.room_id, '0')}
                className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded transition-colors"
              >
                ✗ มีผู้พัก
              </button>
            )}
            {room.status !== '3' && (
              <button
                onClick={() => onChangeStatus(room.room_id, '3')}
                className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded transition-colors"
              >
                📋 จองแล้ว
              </button>
            )}
            {room.status !== '2' && (
              <button
                onClick={() => onChangeStatus(room.room_id, '2')}
                className="px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white text-xs rounded transition-colors"
              >
                🔧 ซ่อม
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomCard;
