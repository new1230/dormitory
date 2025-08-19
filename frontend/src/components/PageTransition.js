import React, { useState, useEffect } from 'react';

const PageTransition = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // เมื่อ component mount
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 50); // เริ่ม animation หลังจาก mount เล็กน้อย

    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      className={`transition-all duration-300 ease-out transform ${
        isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-1'
      }`}
    >
      {children}
    </div>
  );
};

export default PageTransition;
