import React from 'react';

const RoomTypeCard = ({ roomType, onEdit, onToggleStatus, onUploadThumbnail, onDeleteThumbnail }) => {
  const getStyleBadge = (style) => {
    const styles = {
      'single': { text: 'ห้องเดี่ยว', color: 'bg-blue-100 text-blue-800' },
      'double': { text: 'ห้องคู่', color: 'bg-green-100 text-green-800' },
      'triple': { text: 'ห้องสาม', color: 'bg-purple-100 text-purple-800' },
      'quadruple': { text: 'ห้องสี่', color: 'bg-orange-100 text-orange-800' },
      'dormitory': { text: 'ห้องโฮสเทล', color: 'bg-gray-100 text-gray-800' }
    };
    return styles[style] || { text: style, color: 'bg-gray-100 text-gray-800' };
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

  const styleBadge = getStyleBadge(roomType.room_style);
  const categoryBadge = getCategoryBadge(roomType.room_category);
  const genderBadge = getGenderBadge(roomType.gender_allowed);
  const furnishedBadge = getFurnishedBadge(roomType.furnished);

  const handleThumbnailUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      onUploadThumbnail(roomType.room_type_id, file);
    }
    event.target.value = '';
  };

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden transition-all duration-200 hover:shadow-lg ${
      roomType.is_active === '0' ? 'opacity-50' : ''
    }`}>
      {/* Thumbnail Section */}
      <div className="relative h-48 bg-gray-200">
        {roomType.thumbnail ? (
          <img
            src={`http://localhost:5000/uploads/room-types/${roomType.thumbnail}`}
            alt={roomType.room_type_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm mt-2">ไม่มีรูปภาพ</p>
            </div>
          </div>
        )}
        
        {/* Thumbnail Controls */}
        <div className="absolute top-2 right-2 flex gap-2">
          <label className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full cursor-pointer text-xs transition-colors">
            <input
              type="file"
              accept="image/*"
              onChange={handleThumbnailUpload}
              className="hidden"
            />
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </label>
          
          {roomType.thumbnail && (
            <button
              onClick={() => onDeleteThumbnail(roomType.room_type_id)}
              className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full text-xs transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>

        {/* Status Badge */}
        <div className="absolute top-2 left-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            roomType.is_active === '1' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {roomType.is_active === '1' ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
            {roomType.room_type_name}
          </h3>
          <div className="flex gap-1 ml-2">
            <button
              onClick={() => onEdit(roomType)}
              className="text-blue-600 hover:text-blue-700 p-1"
              title="แก้ไข"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button
              onClick={() => onToggleStatus(roomType.room_type_id)}
              className={`p-1 ${roomType.is_active === '1' ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}`}
              title={roomType.is_active === '1' ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={roomType.is_active === '1' ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" : "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"} />
              </svg>
            </button>
          </div>
        </div>

        {/* Description */}
        {roomType.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {roomType.description}
          </p>
        )}

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${styleBadge.color}`}>
            {styleBadge.text}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryBadge.color}`}>
            {categoryBadge.text}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${genderBadge.color}`}>
            {genderBadge.text}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${furnishedBadge.color}`}>
            {furnishedBadge.text}
          </span>
        </div>

        {/* Capacity & Size */}
        <div className="flex justify-between items-center mb-3 text-sm">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {roomType.capacity} คน
            </span>
            {roomType.room_size && (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V6a2 2 0 012-2h2M4 16v2a2 2 0 002 2h2M16 4h2a2 2 0 012 2v2M16 20h2a2 2 0 002-2v-2" />
                </svg>
                {roomType.room_size} ตร.ม.
              </span>
            )}
          </div>
        </div>

        {/* Comfort Features */}
        <div className="flex gap-3 mb-4 text-sm">
          {roomType.air_condition && (
            <span className="flex items-center gap-1 text-blue-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              แอร์
            </span>
          )}
          {roomType.fan && !roomType.air_condition && (
            <span className="flex items-center gap-1 text-green-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              พัดลม
            </span>
          )}
        </div>

        {/* Pricing */}
        <div className="border-t pt-3 mt-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="font-semibold text-green-600">
                ฿{Number(roomType.price_per_month).toLocaleString()}
              </span>
              <span className="text-gray-500"> /เดือน</span>
            </div>
            {roomType.price_per_semester && (
              <div>
                <span className="font-semibold text-blue-600">
                  ฿{Number(roomType.price_per_semester).toLocaleString()}
                </span>
                <span className="text-gray-500"> /เทอม</span>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mt-2">
            <div>น้ำ: ฿{Number(roomType.water_rate).toFixed(1)}/หน่วย</div>
            <div>ไฟ: ฿{Number(roomType.electricity_rate).toFixed(1)}/หน่วย</div>
          </div>
          
          <div className="text-xs text-gray-600 mt-1">
            ชำระทุกวันที่ {roomType.payment_due_day} ของเดือน
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomTypeCard;
