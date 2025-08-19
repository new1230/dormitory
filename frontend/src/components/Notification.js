import React, { useState, useEffect } from 'react';

const Notification = ({ 
  message, 
  type = 'info', 
  duration = 4000, 
  onClose,
  isVisible = true 
}) => {
  const [show, setShow] = useState(isVisible);

  useEffect(() => {
    const handleClose = () => {
      setShow(false);
      setTimeout(() => {
        if (onClose) onClose();
      }, 300);
    };

    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  const handleClose = () => {
    setShow(false);
    setTimeout(() => {
      if (onClose) onClose();
    }, 300); // รอ animation เสร็จ
  };

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50 border-green-200',
          text: 'text-green-800',
          icon: '✅',
          progressBg: 'bg-green-500'
        };
      case 'error':
        return {
          bg: 'bg-red-50 border-red-200',
          text: 'text-red-800',
          icon: '❌',
          progressBg: 'bg-red-500'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50 border-yellow-200',
          text: 'text-yellow-800',
          icon: '⚠️',
          progressBg: 'bg-yellow-500'
        };
      default: // info
        return {
          bg: 'bg-blue-50 border-blue-200',
          text: 'text-blue-800',
          icon: 'ℹ️',
          progressBg: 'bg-blue-500'
        };
    }
  };

  const styles = getTypeStyles();

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed top-4 right-4 z-50 max-w-sm w-full transform transition-all duration-300 ease-in-out ${
        show 
          ? 'translate-x-0 opacity-100 scale-100' 
          : 'translate-x-full opacity-0 scale-95'
      }`}
    >
      <div className={`${styles.bg} border rounded-lg shadow-lg p-4 relative overflow-hidden`}>
        {/* Close Button */}
        <button
          onClick={handleClose}
          className={`absolute top-2 right-2 ${styles.text} hover:opacity-70 text-lg leading-none`}
        >
          ×
        </button>

        {/* Content */}
        <div className="flex items-start space-x-3 pr-6">
          <span className="text-xl flex-shrink-0 mt-0.5">
            {styles.icon}
          </span>
          <div className="flex-1">
            <p className={`${styles.text} text-sm font-medium`}>
              {message}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        {duration > 0 && (
          <div className="absolute bottom-0 left-0 h-1 bg-gray-200 w-full">
            <div 
              className={`h-full ${styles.progressBg} transition-all ease-linear`}
              style={{
                animation: `shrink ${duration}ms linear forwards`
              }}
            />
          </div>
        )}
      </div>

      <style>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
};

// Toast Container สำหรับจัดการหลาย notifications
const ToastContainer = ({ notifications = [] }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <Notification key={notification.id} {...notification} />
      ))}
    </div>
  );
};

export default Notification;
export { ToastContainer };
