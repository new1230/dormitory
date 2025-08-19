import React from 'react';

const RoomTypeDisplayCard = ({ roomType }) => {
  const getStyleIcon = (style) => {
    const icons = {
      'single': '🏠',
      'double': '🏡', 
      'triple': '🏘️',
      'quadruple': '🏢',
      'dormitory': '🏫'
    };
    return icons[style] || '🏠';
  };

  const getStyleText = (style) => {
    const styles = {
      'single': 'ห้องเดี่ยว',
      'double': 'ห้องคู่',
      'triple': 'ห้องสาม',
      'quadruple': 'ห้องสี่',
      'dormitory': 'ห้องโฮสเทล'
    };
    return styles[style] || style;
  };

  const getCategoryBadge = (category) => {
    const categories = {
      'standard': { text: 'มาตรฐาน', color: 'bg-blue-100 text-blue-800' },
      'deluxe': { text: 'พิเศษ', color: 'bg-purple-100 text-purple-800' },
      'suite': { text: 'สวีท', color: 'bg-yellow-100 text-yellow-800' },
      'hostel': { text: 'โฮสเทล', color: 'bg-gray-100 text-gray-800' }
    };
    return categories[category] || { text: category, color: 'bg-gray-100 text-gray-800' };
  };

  const getGenderBadge = (gender) => {
    const genders = {
      'male': { text: 'ชายเท่านั้น', color: 'bg-blue-100 text-blue-800' },
      'female': { text: 'หญิงเท่านั้น', color: 'bg-pink-100 text-pink-800' },
      'mixed': { text: 'ชาย-หญิง', color: 'bg-green-100 text-green-800' }
    };
    return genders[gender] || { text: gender, color: 'bg-gray-100 text-gray-800' };
  };

  const getFurnishedBadge = (furnished) => {
    const furnished_types = {
      'fully': { text: 'ครบครันทั้งหมด', color: 'bg-green-100 text-green-800' },
      'partial': { text: 'เฟอร์นิเจอร์พื้นฐาน', color: 'bg-yellow-100 text-yellow-800' },
      'unfurnished': { text: 'ห้องเปล่า', color: 'bg-red-100 text-red-800' }
    };
    return furnished_types[furnished] || { text: furnished, color: 'bg-gray-100 text-gray-800' };
  };

  const categoryBadge = getCategoryBadge(roomType.room_category);
  const genderBadge = getGenderBadge(roomType.gender_allowed);
  const furnishedBadge = getFurnishedBadge(roomType.furnished);

  // สิ่งอำนวยความสะดวกที่โดดเด่น
  const highlightFacilities = [];
  if (roomType.air_condition) highlightFacilities.push('❄️ แอร์');
  if (roomType.fan && !roomType.air_condition) highlightFacilities.push('🌀 พัดลม');
  if (roomType.facilities?.wifi) highlightFacilities.push('📶 WiFi');
  if (roomType.facilities?.hot_water) highlightFacilities.push('🚿 น้ำอุ่น');
  if (roomType.facilities?.refrigerator) highlightFacilities.push('❄️ ตู้เย็น');
  if (roomType.facilities?.tv) highlightFacilities.push('📺 ทีวี');

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      {/* Thumbnail Section */}
      <div className="relative h-64 bg-gradient-to-br from-blue-100 to-blue-200">
        {roomType.thumbnail ? (
          <img
            src={`http://localhost:5000/uploads/room-types/${roomType.thumbnail}`}
            alt={roomType.room_type_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <div className="text-6xl mb-2">{getStyleIcon(roomType.room_style)}</div>
              <p className="text-sm">{getStyleText(roomType.room_style)}</p>
            </div>
          </div>
        )}
        
        {/* Header Badge */}
        <div className="absolute top-3 left-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${categoryBadge.color}`}>
            {categoryBadge.text}
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6">
        {/* Title */}
        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
          {roomType.room_type_name}
        </h3>

        {/* Description */}
        {roomType.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-3">
            {roomType.description}
          </p>
        )}

        {/* Quick Info */}
        <div className="flex items-center justify-between mb-4 text-sm">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {roomType.capacity} คน
            </span>
            {roomType.room_size && (
              <span className="flex items-center gap-1 text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V6a2 2 0 012-2h2M4 16v2a2 2 0 002 2h2M16 4h2a2 2 0 012 2v2M16 20h2a2 2 0 002-2v-2" />
                </svg>
                {roomType.room_size} ตร.ม.
              </span>
            )}
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${genderBadge.color}`}>
            {genderBadge.text}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${furnishedBadge.color}`}>
            {furnishedBadge.text}
          </span>
        </div>

        {/* Facilities */}
        {highlightFacilities.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2 text-xs">
              {highlightFacilities.slice(0, 4).map((facility, index) => (
                <span key={index} className="bg-blue-50 text-blue-700 px-2 py-1 rounded">
                  {facility}
                </span>
              ))}
              {highlightFacilities.length > 4 && (
                <span className="text-gray-500">+{highlightFacilities.length - 4} อื่นๆ</span>
              )}
            </div>
          </div>
        )}

        {/* Pricing Section */}
        <div className="border-t pt-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-green-600">
                ฿{Number(roomType.price_per_month).toLocaleString()}
              </span>
              <span className="text-gray-500 text-sm">/เดือน</span>
            </div>
            
            {roomType.price_per_semester && (
              <div className="flex justify-between items-center">
                <span className="text-md font-semibold text-blue-600">
                  ฿{Number(roomType.price_per_semester).toLocaleString()}
                </span>
                <span className="text-gray-500 text-sm">/เทอม</span>
              </div>
            )}
          </div>
          
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>ค่าน้ำ:</span>
                <span>฿{Number(roomType.water_rate).toFixed(1)}/หน่วย</span>
              </div>
              <div className="flex justify-between">
                <span>ค่าไฟ:</span>
                <span>฿{Number(roomType.electricity_rate).toFixed(1)}/หน่วย</span>
              </div>
            </div>
            
            <div className="text-xs text-gray-500 mt-2 text-center">
              💳 ชำระทุกวันที่ {roomType.payment_due_day} ของเดือน
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomTypeDisplayCard;
