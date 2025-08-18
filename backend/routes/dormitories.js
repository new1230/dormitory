const express = require('express');
const cors = require('cors');
const { mockDormitories } = require('../mockData');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

let dormitories = [
  { id: 1, name: 'Dorm A', location: 'Bangkok' },
  { id: 2, name: 'Dorm B', location: 'Chiang Mai' }
];

// Get all dormitories
app.get('/api/dormitories', async (req, res) => {
  try {
    const { search, facilities, minPrice, maxPrice } = req.query;
    
    let filteredDormitories = mockDormitories.filter(d => d.isActive);
    
    if (search) {
      filteredDormitories = filteredDormitories.filter(d => 
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.description.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (facilities) {
      const facilityList = facilities.split(',');
      filteredDormitories = filteredDormitories.filter(d => 
        facilityList.some(facility => d.facilities.includes(facility))
      );
    }
    
    if (minPrice || maxPrice) {
      filteredDormitories = filteredDormitories.filter(d => {
        const roomPrice = d.roomTypes[0]?.price || 0;
        if (minPrice && roomPrice < Number(minPrice)) return false;
        if (maxPrice && roomPrice > Number(maxPrice)) return false;
        return true;
      });
    }
    
    // Sort by rating
    filteredDormitories.sort((a, b) => b.rating - a.rating);
    
    res.json(filteredDormitories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// เพิ่มหอพักใหม่
app.post('/api/dormitories', (req, res) => {
  const { name, location } = req.body;
  const newDorm = { id: Date.now(), name, location };
  dormitories.push(newDorm);
  res.status(201).json(newDorm);
});

// แก้ไขข้อมูลหอพัก
app.put('/api/dormitories/:id', (req, res) => {
  const { id } = req.params;
  const { name, location } = req.body;
  const dorm = dormitories.find(d => d.id === parseInt(id));
  if (dorm) {
    dorm.name = name;
    dorm.location = location;
    res.json(dorm);
  } else {
    res.status(404).json({ message: 'Dormitory not found' });
  }
});

// ลบหอพัก
app.delete('/api/dormitories/:id', (req, res) => {
  const { id } = req.params;
  dormitories = dormitories.filter(d => d.id !== parseInt(id));
  res.json({ message: 'Dormitory deleted' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});