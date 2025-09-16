import React, { useState, useEffect } from 'react';
import axios from 'axios';

const RoomImageManager = ({ roomId, onImagesChange }) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);

  useEffect(() => {
    if (roomId) {
      fetchImages();
    }
  }, [roomId]);

  const fetchImages = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/rooms/${roomId}/images`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      setImages(response.data || []);
    } catch (error) {
      console.error('Failed to fetch room images:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 10) {
      alert('สามารถอัปโหลดได้สูงสุด 10 รูป');
      return;
    }
    
    setSelectedFiles(files);
    
    // Create previews
    const filePreviews = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    setPreviews(filePreviews);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('images', file);
      });

      await axios.post(`http://localhost:5000/api/rooms/${roomId}/images`, formData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      // Clear selections
      setSelectedFiles([]);
      setPreviews([]);
      
      // Refresh images
      await fetchImages();
      
      if (onImagesChange) {
        onImagesChange();
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('การอัปโหลดล้มเหลว');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!window.confirm('คุณต้องการลบรูปภาพนี้หรือไม่?')) {
      return;
    }

    try {
      await axios.delete(`http://localhost:5000/api/rooms/${roomId}/images/${imageId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      await fetchImages();
      
      if (onImagesChange) {
        onImagesChange();
      }
    } catch (error) {
      console.error('Delete failed:', error);
      alert('การลบรูปภาพล้มเหลว');
    }
  };

  const handleSetPrimary = async (imageId) => {
    try {
      await axios.patch(`http://localhost:5000/api/rooms/${roomId}/images/${imageId}/primary`, {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      await fetchImages();
      
      if (onImagesChange) {
        onImagesChange();
      }
    } catch (error) {
      console.error('Set primary failed:', error);
      alert('การตั้งรูปหลักล้มเหลว');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-lg font-medium text-gray-800 mb-4">อัปโหลดรูปภาพห้อง</h4>
        
        <div className="space-y-4">
          <div>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="text-xs text-gray-500 mt-1">
              สามารถอัปโหลดได้สูงสุด 10 รูป (รูปปัจจุบัน: {images.length}/10)
            </p>
          </div>

          {/* File Previews */}
          {previews.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {previews.map((preview, index) => (
                <div key={index} className="relative">
                  <img
                    src={preview.preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => {
                      const newPreviews = previews.filter((_, i) => i !== index);
                      const newFiles = selectedFiles.filter((_, i) => i !== index);
                      setPreviews(newPreviews);
                      setSelectedFiles(newFiles);
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {selectedFiles.length > 0 && (
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  กำลังอัปโหลด...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  อัปโหลดรูปภาพ
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Current Images */}
      {images.length > 0 && (
        <div>
          <h4 className="text-lg font-medium text-gray-800 mb-4">รูปภาพปัจจุบัน</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {images.map((image) => (
              <div key={image.image_id} className="relative group">
                <img
                  src={`http://localhost:5000${image.imageUrl}`}
                  alt={image.image_description || 'Room image'}
                  className="w-full h-32 object-cover rounded-lg"
                />
                
                {/* Primary Badge */}
                {image.is_primary && (
                  <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                    รูปหลัก
                  </div>
                )}

                {/* Actions */}
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center space-x-2">
                  <button
                    onClick={() => handleSetPrimary(image.image_id)}
                    disabled={image.is_primary}
                    className={`px-3 py-1 text-xs rounded ${
                      image.is_primary
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                    }`}
                    title={image.is_primary ? 'รูปหลักแล้ว' : 'ตั้งเป็นรูปหลัก'}
                  >
                    ⭐
                  </button>
                  <button
                    onClick={() => handleDeleteImage(image.image_id)}
                    className="px-3 py-1 text-xs rounded bg-red-500 hover:bg-red-600 text-white"
                    title="ลบรูปภาพ"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {images.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📷</div>
          <p>ยังไม่มีรูปภาพ</p>
        </div>
      )}
    </div>
  );
};

export default RoomImageManager;