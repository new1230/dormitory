import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LoadingSpinner } from './LoadingEffect';

const RoomImageManager = ({ roomId, onImagesChange }) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (roomId) {
      fetchImages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  const fetchImages = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/rooms/${roomId}/images`);
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
    
    if (images.length + files.length > 10) {
      alert(`สามารถมีรูปได้สูงสุด 10 รูป คุณมีรูปอยู่แล้ว ${images.length} รูป`);
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('images', file);
      });

      await axios.post(`http://localhost:5000/api/rooms/${roomId}/images`, formData, {
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
      await axios.delete(`http://localhost:5000/api/rooms/${roomId}/images/${imageId}`);
      await fetchImages();
    } catch (error) {
      console.error('Delete error:', error);
      alert('เกิดข้อผิดพลาดในการลบรูป');
    }
  };

  const handleSetPrimary = async (imageId) => {
    try {
      await axios.patch(`http://localhost:5000/api/rooms/${roomId}/images/${imageId}/primary`);
      await fetchImages();
    } catch (error) {
      console.error('Set primary error:', error);
      alert('เกิดข้อผิดพลาดในการกำหนดรูปหลัก');
    }
  };

  if (!roomId) {
    return <div className="text-gray-500 text-sm">กรุณาบันทึกห้องก่อนเพื่อเพิ่มรูปภาพ</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-medium text-gray-700">
          รูปภาพห้อง ({images.length}/10)
        </h4>
        <label className="btn-primary text-xs cursor-pointer">
          {uploading ? 'กำลังอัปโหลด...' : '+ เพิ่มรูป'}
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => handleUpload(e.target.files)}
            className="hidden"
            disabled={uploading || images.length >= 10}
          />
        </label>
      </div>

      {loading ? (
        <div className="flex justify-center py-4">
          <LoadingSpinner size="small" />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {images.map((image) => (
            <div key={image.image_id} className="relative group">
              <img
                src={`http://localhost:5000${image.imageUrl}`}
                alt={image.image_description || 'รูปห้อง'}
                className="w-full h-20 object-cover rounded border"
              />
              
              {/* Primary Badge */}
              {image.is_primary && (
                <div className="absolute top-1 left-1 bg-green-500 text-white text-xs px-1 rounded">
                  หลัก
                </div>
              )}
              
              {/* Controls */}
              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                {!image.is_primary && (
                  <button
                    onClick={() => handleSetPrimary(image.image_id)}
                    className="bg-blue-500 hover:bg-blue-600 text-white p-1 rounded text-xs"
                    title="ตั้งเป็นรูปหลัก"
                  >
                    ⭐
                  </button>
                )}
                <button
                  onClick={() => handleDelete(image.image_id)}
                  className="bg-red-500 hover:bg-red-600 text-white p-1 rounded text-xs"
                  title="ลบรูป"
                >
                  🗑️
                </button>
              </div>
              
              {/* Description */}
              {image.image_description && (
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-1 truncate">
                  {image.image_description}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {images.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📷</div>
          <p className="text-sm">ยังไม่มีรูปภาพห้อง</p>
        </div>
      )}
    </div>
  );
};

export default RoomImageManager;
