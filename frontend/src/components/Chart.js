import React from 'react';

// Simple Bar Chart Component
export const BarChart = ({ data, width = 300, height = 200 }) => {
  if (!data || data.length === 0) return <div>ไม่มีข้อมูล</div>;

  const maxValue = Math.max(...data.map(item => item.value));
  const barWidth = (width - 60) / data.length - 10;

  return (
    <div className="bg-white p-4 rounded-lg">
      <svg width={width} height={height} className="overflow-visible">
        {/* Y-axis labels */}
        {[0, maxValue/2, maxValue].map((value, index) => (
          <g key={index}>
            <text 
              x={40} 
              y={height - 40 - (index * (height - 80) / 2)} 
              textAnchor="end" 
              className="text-xs fill-gray-600"
            >
              {Math.round(value).toLocaleString()}
            </text>
            <line 
              x1={45} 
              y1={height - 40 - (index * (height - 80) / 2)} 
              x2={width - 10} 
              y2={height - 40 - (index * (height - 80) / 2)} 
              stroke="#e5e7eb" 
              strokeWidth={1}
            />
          </g>
        ))}

        {/* Bars */}
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * (height - 80);
          const x = 50 + index * (barWidth + 10);
          const y = height - 40 - barHeight;

          return (
            <g key={index}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill="#3b82f6"
                className="hover:fill-blue-600 transition-colors"
              />
              <text 
                x={x + barWidth/2} 
                y={height - 25} 
                textAnchor="middle" 
                className="text-xs fill-gray-600"
              >
                {item.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// Simple Pie Chart Component
export const PieChart = ({ data, size = 200 }) => {
  if (!data || data.length === 0) return <div>ไม่มีข้อมูล</div>;

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const center = size / 2;
  const radius = size / 2 - 20;

  let currentAngle = 0;
  const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

  return (
    <div className="bg-white p-4 rounded-lg">
      <svg width={size} height={size}>
        {data.map((item, index) => {
          const angle = (item.value / total) * 360;
          const startAngle = currentAngle;
          const endAngle = currentAngle + angle;
          
          const x1 = center + radius * Math.cos((startAngle * Math.PI) / 180);
          const y1 = center + radius * Math.sin((startAngle * Math.PI) / 180);
          const x2 = center + radius * Math.cos((endAngle * Math.PI) / 180);
          const y2 = center + radius * Math.sin((endAngle * Math.PI) / 180);
          
          const largeArcFlag = angle > 180 ? 1 : 0;
          
          const pathData = [
            `M ${center} ${center}`,
            `L ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            'Z'
          ].join(' ');

          currentAngle += angle;

          return (
            <path
              key={index}
              d={pathData}
              fill={colors[index % colors.length]}
              className="hover:opacity-80 transition-opacity"
            />
          );
        })}
      </svg>
      
      {/* Legend */}
      <div className="mt-4 grid grid-cols-1 gap-1 text-sm">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: colors[index % colors.length] }}
            />
            <span className="text-gray-700">
              {item.label}: {item.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Stats Card Component
export const StatsCard = ({ title, value, subtitle, icon, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    green: 'bg-green-50 border-green-200 text-green-800',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    red: 'bg-red-50 border-red-200 text-red-800',
    purple: 'bg-purple-50 border-purple-200 text-purple-800'
  };

  return (
    <div className={`p-4 rounded-lg border-2 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-75">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {subtitle && <p className="text-xs opacity-60">{subtitle}</p>}
        </div>
        {icon && (
          <div className="text-2xl opacity-75">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};
