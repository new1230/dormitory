import React from "react";

const rooms = [
  {
    room_id: "101",
    room_type_id: "A1",
    room_number: "101",
    status: "ใช้งาน",
    description: "ห้องพักเดี่ยวพร้อมแอร์",
    room_img: "https://via.placeholder.com/80"
  },
  {
    room_id: "102",
    room_type_id: "A2",
    room_number: "102",
    status: "ไม่ใช้งาน",
    description: "ห้องพักคู่",
    room_img: "https://via.placeholder.com/80"
  }
];

export default function RoomDetail() {
  return (
    <div style={{ padding: 20 }}>
      <h2>รายละเอียดหอพัก</h2>
      <table border="1" cellPadding="8" style={{ width: "100%" }}>
        <thead>
          <tr>
            <th>room_id</th>
            <th>room_type_id</th>
            <th>room_number</th>
            <th>status</th>
            <th>description</th>
            <th>room_img</th>
          </tr>
        </thead>
        <tbody>
          {rooms.map((room, idx) => (
            <tr key={idx}>
              <td>{room.room_id}</td>
              <td>{room.room_type_id}</td>
              <td>{room.room_number}</td>
              <td>{room.status}</td>
              <td>{room.description}</td>
              <td>
                <img src={room.room_img} alt="room" width={80} style={{ borderRadius: 8 }} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}