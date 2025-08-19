import React, { useState } from 'react';

const MeterPhotoUpload = ({ roomId, meterType, onPhotoUploaded, existingPhoto }) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(existingPhoto ? `http://localhost:5000/uploads/meter-photos/${existingPhoto}` : null);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // แสดง preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);

    // อัปโหลดทันที
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append(meterType === 'water' ? 'meter_photo_water' : 'meter_photo_electricity', file);

      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/meter-readings/upload-photo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        const filename = result.files[meterType];
        onPhotoUploaded && onPhotoUploaded(filename);
      }

    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block">
        <div className="cursor-pointer border-2 border-dashed border-gray-300 rounded-lg p-2 hover:border-blue-400 transition-colors">
          {preview ? (
            <img 
              src={preview} 
              alt={`มิเตอร์${meterType === 'water' ? 'น้ำ' : 'ไฟ'}`}
              className="w-full h-20 object-cover rounded"
            />
          ) : (
            <div className="text-center text-gray-500 py-3">
              <div className="text-sm">📷</div>
              <div className="text-xs">อัปโหลดรูป</div>
            </div>
          )}
        </div>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          disabled={uploading}
        />
      </label>
      
      {uploading && (
        <div className="text-xs text-blue-600 text-center">กำลังอัปโหลด...</div>
      )}
    </div>
  );
};

export default MeterPhotoUpload;
