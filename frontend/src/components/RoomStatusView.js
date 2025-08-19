import React from 'react';
import RoomCard from './RoomCard';

const RoomStatusView = ({ rooms, onEditRoom, onChangeRoomStatus }) => {
  // จัดกลุ่มห้องตามสถานะ
  const groupedRooms = {
    available: rooms.filter(room => room.status === '1'), // ห้องว่าง
    occupied: rooms.filter(room => room.status === '0'),  // มีผู้พัก
    booked: rooms.filter(room => room.status === '3'),    // จองแล้ว
    maintenance: rooms.filter(room => room.status === '2') // ปิดซ่อม
  };

  const getStatusSummary = () => {
    return {
      available: groupedRooms.available.length,
      occupied: groupedRooms.occupied.length,
      booked: groupedRooms.booked.length,
      maintenance: groupedRooms.maintenance.length,
      total: rooms.length
    };
  };

  const summary = getStatusSummary();

  // คำนวณห้องที่สัญญาใกล้หมด
  const getExpiringRooms = () => {
    return groupedRooms.occupied.filter(room => {
      if (!room.contract_end) return false;
      const now = new Date();
      const endDate = new Date(room.contract_end);
      const daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
      return daysLeft <= 30 && daysLeft > 0;
    });
  };

  const expiringRooms = getExpiringRooms();

  const StatusSection = ({ title, rooms, bgColor, textColor, icon, emptyMessage }) => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          {title}
          <span className={`ml-2 px-3 py-1 rounded-full text-sm font-medium ${bgColor} ${textColor}`}>
            {rooms.length} ห้อง
          </span>
        </h3>
      </div>

      {rooms.length === 0 ? (
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
          <p>{emptyMessage}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {rooms.map(room => (
            <RoomCard
              key={room.room_id}
              room={room}
              onEdit={onEditRoom}
              onChangeStatus={onChangeRoomStatus}
              viewMode="special"
            />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <div className="text-sm text-gray-600">ทั้งหมด</div>
          <div className="text-2xl font-bold text-gray-900">{summary.total}</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <div className="text-sm text-gray-600">ห้องว่าง</div>
          <div className="text-2xl font-bold text-green-600">{summary.available}</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
          <div className="text-sm text-gray-600">มีผู้พัก</div>
          <div className="text-2xl font-bold text-red-600">{summary.occupied}</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <div className="text-sm text-gray-600">จองแล้ว</div>
          <div className="text-2xl font-bold text-blue-600">{summary.booked}</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500">
          <div className="text-sm text-gray-600">ปิดซ่อม</div>
          <div className="text-2xl font-bold text-orange-600">{summary.maintenance}</div>
        </div>
      </div>

      {/* Alert for Expiring Contracts */}
      {expiringRooms.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className="font-semibold text-yellow-800">
              แจ้งเตือน: มีสัญญาเช่าใกล้หมดอายุ {expiringRooms.length} ห้อง
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {expiringRooms.map(room => {
              const daysLeft = Math.ceil((new Date(room.contract_end) - new Date()) / (1000 * 60 * 60 * 24));
              return (
                <span key={room.room_id} className="inline-flex items-center px-2 py-1 rounded text-xs bg-yellow-200 text-yellow-800">
                  ห้อง {room.room_number} (เหลือ {daysLeft} วัน)
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Room Status Sections */}
      <StatusSection
        title="ห้องว่าง"
        rooms={groupedRooms.available}
        bgColor="bg-green-100"
        textColor="text-green-800"
        icon="🟢"
        emptyMessage="ไม่มีห้องว่างในขณะนี้"
      />

      <StatusSection
        title="มีผู้พักอาศัย"
        rooms={groupedRooms.occupied}
        bgColor="bg-red-100"
        textColor="text-red-800"
        icon="🔴"
        emptyMessage="ไม่มีห้องที่มีผู้พักในขณะนี้"
      />

      <StatusSection
        title="จองแล้ว"
        rooms={groupedRooms.booked}
        bgColor="bg-blue-100"
        textColor="text-blue-800"
        icon="🔵"
        emptyMessage="ไม่มีห้องที่จองแล้วในขณะนี้"
      />

      <StatusSection
        title="ปิดซ่อม"
        rooms={groupedRooms.maintenance}
        bgColor="bg-orange-100"
        textColor="text-orange-800"
        icon="🟠"
        emptyMessage="ไม่มีห้องที่ปิดซ่อมในขณะนี้"
      />
    </div>
  );
};

export default RoomStatusView;
