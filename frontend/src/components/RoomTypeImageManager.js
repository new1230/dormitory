import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LoadingSpinner } from './LoadingEffect';

const RoomTypeImageManager = ({ roomTypeId, onImagesChange }) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (roomTypeId) {
      fetchImages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomTypeId]);

  const fetchImages = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/room-types/${roomTypeId}/images`);
      setImages(response.data);
      if (onImagesChange) {
        onImagesChange(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch images:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (files) => {
    if (!files || files.length === 0) return;
    
    if (images.length + files.length > 5) {
      alert(`ประเภทห้องสามารถมีรูปได้สูงสุด 5 รูป คุณมีรูปอยู่แล้ว ${images.length} รูป`);
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('images', file);
      });

      await axios.post(`http://localhost:5000/api/room-types/${roomTypeId}/images`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      await fetchImages();
    } catch (error) {
      console.error('Upload error:', error);
      alert(error.response?.data?.message || 'เกิดข้อผิดพลาดในการอัปโหลด');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (imageId) => {
    if (!window.confirm('คุณต้องการลบรูปนี้หรือไม่?')) return;

    try {
      await axios.delete(`http://localhost:5000/api/room-types/${roomTypeId}/images/${imageId}`);
      await fetchImages();
    } catch (error) {
      console.error('Delete error:', error);
      alert('เกิดข้อผิดพลาดในการลบรูป');
    }
  };

  const handleSetPrimary = async (imageId) => {
    try {
      await axios.patch(`http://localhost:5000/api/room-types/${roomTypeId}/images/${imageId}/primary`);
      await fetchImages();
    } catch (error) {
      console.error('Set primary error:', error);
      alert('เกิดข้อผิดพลาดในการกำหนดรูปหลัก');
    }
  };

  if (!roomTypeId) {
    return <div className="text-gray-500 text-sm">กรุณาบันทึกประเภทห้องก่อนเพื่อเพิ่มรูปภาพ</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-medium text-gray-700">
          รูปภาพประเภทห้อง ({images.length}/5)
        </h4>
        <label className="btn-primary text-xs cursor-pointer">
          {uploading ? 'กำลังอัปโหลด...' : '+ เพิ่มรูป'}
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => handleUpload(e.target.files)}
            className="hidden"
            disabled={uploading || images.length >= 5}
          />
        </label>
      </div>

      {loading ? (
        <div className="flex justify-center py-4">
          <LoadingSpinner size="small" />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((image) => (
            <div key={image.image_id} className="relative group">
              <img
                src={`http://localhost:5000${image.imageUrl}`}
                alt={image.image_description || 'รูปประเภทห้อง'}
                className="w-full h-24 object-cover rounded border"
              />
              
              {/* Primary Badge */}
              {image.is_primary && (
                <div className="absolute top-1 left-1 bg-green-500 text-white text-xs px-2 py-1 rounded">
                  🏠 รูปหลัก
                </div>
              )}
              
              {/* Controls */}
              <div className="absolute inset-0 bg-black bg-opacity-60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {!image.is_primary && (
                  <button
                    onClick={() => handleSetPrimary(image.image_id)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs"
                    title="ตั้งเป็นรูปหลัก"
                  >
                    ⭐ หลัก
                  </button>
                )}
                <button
                  onClick={() => handleDelete(image.image_id)}
                  className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
                  title="ลบรูป"
                >
                  🗑️ ลบ
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {images.length === 0 && !loading && (
        <div className="text-center py-6 text-gray-500">
          <div className="text-3xl mb-2">🏠</div>
          <p className="text-sm">ยังไม่มีรูปประเภทห้อง</p>
        </div>
      )}
    </div>
  );
};

export default RoomTypeImageManager;
