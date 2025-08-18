import React, { useState } from "react";

const initialRoom = {
  code: "",
  name: "",
  description: "",
  maxPeople: "",
  price: "",
  status: true,
  image: null,
};

export default function Room() {
  const [rooms, setRooms] = useState([]);
  const [room, setRoom] = useState(initialRoom);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setRoom((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageChange = (e) => {
    setRoom((prev) => ({
      ...prev,
      image: e.target.files[0],
    }));
  };

  const handleAddRoom = () => {
    if (
      room.code &&
      room.name &&
      room.description &&
      room.maxPeople &&
      room.price
    ) {
      setRooms([...rooms, room]);
      setRoom(initialRoom);
    }
  };

  const handleDeleteRoom = (index) => {
    setRooms(rooms.filter((_, i) => i !== index));
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>ข้อมูลประเภทห้องพัก</h2>
      <form
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          marginBottom: 20,
        }}
      >
        <input
          type="text"
          name="code"
          placeholder="รหัสประเภทห้องพัก"
          value={room.code}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="name"
          placeholder="ชื่อประเภทห้องพัก"
          value={room.name}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="description"
          placeholder="คำอธิบาย"
          value={room.description}
          onChange={handleChange}
          required
        />
        <input
          type="number"
          name="maxPeople"
          placeholder="จำนวนคนสูงสุด"
          value={room.maxPeople}
          onChange={handleChange}
          required
        />
        <input
          type="number"
          name="price"
          placeholder="ราคาต่อคืน (บาท)"
          value={room.price}
          onChange={handleChange}
          required
        />
        <label>
          สถานะการใช้งาน
          <input
            type="checkbox"
            name="status"
            checked={room.status}
            onChange={handleChange}
          />
          {room.status ? "ใช้งาน" : "ไม่ใช้งาน"}
        </label>
        <input type="file" accept="image/*" onChange={handleImageChange} />
        {room.image && (
          <img
            src={URL.createObjectURL(room.image)}
            alt="room"
            width={60}
            style={{ borderRadius: 8, marginLeft: 8 }}
          />
        )}
        <button type="button" onClick={handleAddRoom}>
          เพิ่มข้อมูล
        </button>
      </form>
      <table border="1" cellPadding="8" style={{ width: "100%" }}>
        <thead>
          <tr>
            <th>รหัส</th>
            <th>ชื่อ</th>
            <th>คำอธิบาย</th>
            <th>จำนวนคนสูงสุด</th>
            <th>ราคา/คืน</th>
            <th>สถานะ</th>
            <th>รูปภาพ</th>
            <th>ลบ</th>
          </tr>
        </thead>
        <tbody>
          {rooms.map((r, idx) => (
            <tr key={idx}>
              <td>{r.code}</td>
              <td>{r.name}</td>
              <td>{r.description}</td>
              <td>{r.maxPeople}</td>
              <td>{r.price} บาท</td>
              <td>{r.status ? "ใช้งาน" : "ไม่ใช้งาน"}</td>
              <td>
                {r.image && (
                  <img
                    src={URL.createObjectURL(r.image)}
                    alt="room"
                    width={50}
                    style={{ borderRadius: 8 }}
                  />
                )}
              </td>
              <td>
                <button type="button" onClick={() => handleDeleteRoom(idx)}>
                  ลบ
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}