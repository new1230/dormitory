import React, { useState, useContext, useEffect } from "react";
import { ProfileContext } from "../contexts/ProfileContext";

export default function ProfilePage() {
  const { profiles, setProfiles, setCurrentProfile } = useContext(ProfileContext);
  const [form, setForm] = useState({
    id: null,
    studentId: "",
    name: "",
    citizenId: "",
    email: "",
    phone: "",
    password: "",
    image: "",
  });
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (profiles.length > 0) setCurrentProfile(profiles[0]);
  }, [profiles, setCurrentProfile]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image" && files.length > 0) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setForm({ ...form, image: ev.target.result });
      };
      reader.readAsDataURL(files[0]);
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editing) {
      setProfiles(
        profiles.map((p) => (p.id === form.id ? { ...form } : p))
      );
      setEditing(false);
    } else {
      setProfiles([
        ...profiles,
        { ...form, id: Date.now() },
      ]);
    }
    setForm({
      id: null,
      studentId: "",
      name: "",
      citizenId: "",
      email: "",
      phone: "",
      password: "",
      image: "",
    });
  };

  const handleEdit = (profile) => {
    setForm(profile);
    setEditing(true);
  };

  const handleDelete = (id) => {
    setProfiles(profiles.filter((p) => p.id !== id));
    if (editing && form.id === id) {
      setEditing(false);
      setForm({
        id: null,
        studentId: "",
        name: "",
        citizenId: "",
        email: "",
        phone: "",
        password: "",
        image: "",
      });
    }
  };

  return (
    <div className="profile-container" style={{
      maxWidth: 1200,
      margin: "40px auto",
      background: "#fff",
      borderRadius: 16,
      boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
      padding: 32
    }}>
      <h2 style={{ textAlign: "center", color: "#2563eb", marginBottom: 24 }}>
        โปรไฟล์นักศึกษา
      </h2>
      <form
        onSubmit={handleSubmit}
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 24,
          marginBottom: 32,
          background: "#f9fafb",
          padding: 24,
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label>รหัสนักศึกษา</label>
          <input
            name="studentId"
            value={form.studentId}
            onChange={handleChange}
            required
            className="input"
            style={{ padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
          />

          <label>ชื่อ-นามสกุล</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className="input"
            style={{ padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
          />

          <label>เลขบัตรประชาชน</label>
          <input
            name="citizenId"
            value={form.citizenId}
            onChange={handleChange}
            required
            maxLength={13}
            className="input"
            style={{ padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
          />

          <label>อีเมล์</label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
            className="input"
            style={{ padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
          />

          <label>เบอร์โทร</label>
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            required
            maxLength={10}
            className="input"
            style={{ padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
          />

          <label>รหัสผ่าน</label>
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required
            className="input"
            style={{ padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
          />
        </div>
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16
        }}>
          <label style={{ marginBottom: 8, fontWeight: "bold", color: "#2563eb" }}>รูปโปรไฟล์</label>
          <label
            htmlFor="profile-image-upload"
            style={{
              display: "inline-block",
              background: "#2563eb",
              color: "#fff",
              padding: "10px 28px",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: "bold",
              marginBottom: 12,
              boxShadow: "0 2px 8px rgba(37,99,235,0.10)",
              transition: "background 0.2s",
              border: "none",
              fontSize: 16,
              letterSpacing: 1
            }}
            onMouseOver={e => e.currentTarget.style.background = "#1d4ed8"}
            onMouseOut={e => e.currentTarget.style.background = "#2563eb"}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                <path fill="#fff" d="M12 5.5a1 1 0 0 1 1 1V11h4.5a1 1 0 1 1 0 2H13v4.5a1 1 0 1 1-2 0V13H6.5a1 1 0 1 1 0-2H11V6.5a1 1 0 0 1 1-1Z"/>
              </svg>
              {form.image ? "เปลี่ยนรูปภาพ" : "เพิ่มรูปภาพ"}
            </span>
          </label>
          <input
            id="profile-image-upload"
            name="image"
            type="file"
            accept="image/*"
            onChange={handleChange}
            style={{ display: "none" }}
          />
          {form.image ? (
            <img
              src={form.image}
              alt="profile"
              style={{
                width: 120,
                height: 120,
                objectFit: "cover",
                borderRadius: "50%",
                border: "2px solid #2563eb",
                marginBottom: 8,
                boxShadow: "0 2px 8px rgba(37,99,235,0.10)"
              }}
            />
          ) : (
            <div style={{
              width: 120,
              height: 120,
              borderRadius: "50%",
              background: "#e5e7eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#9ca3af",
              fontSize: 48,
              marginBottom: 8,
              boxShadow: "0 2px 8px rgba(37,99,235,0.10)"
            }}>
              ?
            </div>
          )}
          <button
            type="submit"
            style={{
              background: editing ? "#f59e42" : "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              padding: "10px 24px",
              fontWeight: "bold",
              cursor: "pointer",
              marginBottom: 8
            }}
          >
            {editing ? "แก้ไข" : "เพิ่ม"}
          </button>
          {editing && (
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setForm({
                  id: null,
                  studentId: "",
                  name: "",
                  citizenId: "",
                  email: "",
                  phone: "",
                  password: "",
                  image: "",
                });
              }}
              style={{
                background: "#ef4444",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                padding: "8px 20px",
                fontWeight: "bold",
                cursor: "pointer"
              }}
            >
              ยกเลิก
            </button>
          )}
        </div>
      </form>
      <h3 style={{ color: "#2563eb", marginBottom: 16 }}>รายชื่อนักศึกษา</h3>
      <div style={{
        overflowX: "auto",
        background: "#f9fafb",
        borderRadius: 12,
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
      }}>
        <table style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 16
        }}>
          <thead style={{ background: "#2563eb", color: "#fff" }}>
            <tr>
              <th style={{ padding: 12 }}>รูป</th>
              <th style={{ padding: 12 }}>รหัสนักศึกษา</th>
              <th style={{ padding: 12 }}>ชื่อ-นามสกุล</th>
              <th style={{ padding: 12 }}>เลขบัตรประชาชน</th>
              <th style={{ padding: 12 }}>อีเมล์</th>
              <th style={{ padding: 12 }}>เบอร์โทร</th>
              <th style={{ padding: 12 }}>รหัสผ่าน</th>
              <th style={{ padding: 12 }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => (
              <tr key={p.id} style={{ background: "#fff", borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ textAlign: "center", padding: 8 }}>
                  {p.image ? (
                    <img
                      src={p.image}
                      alt="profile"
                      style={{ width: 50, height: 50, objectFit: "cover", borderRadius: "50%" }}
                    />
                  ) : (
                    <span style={{
                      width: 50,
                      height: 50,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "#e5e7eb",
                      borderRadius: "50%",
                      color: "#9ca3af",
                      fontSize: 24
                    }}>?</span>
                  )}
                </td>
                <td style={{ padding: 8 }}>{p.studentId}</td>
                <td style={{ padding: 8 }}>{p.name}</td>
                <td style={{ padding: 8 }}>{p.citizenId}</td>
                <td style={{ padding: 8 }}>{p.email}</td>
                <td style={{ padding: 8 }}>{p.phone}</td>
                <td style={{ padding: 8 }}>{p.password}</td>
                <td style={{ padding: 8 }}>
                  <button
                    onClick={() => handleEdit(p)}
                    style={{
                      background: "#f59e42",
                      color: "#fff",
                      border: "none",
                      borderRadius: 4,
                      padding: "6px 14px",
                      marginRight: 6,
                      cursor: "pointer"
                    }}
                  >
                    แก้ไข
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    style={{
                      background: "#ef4444",
                      color: "#fff",
                      border: "none",
                      borderRadius: 4,
                      padding: "6px 14px",
                      cursor: "pointer"
                    }}
                  >
                    ลบ
                  </button>
                </td>
              </tr>
            ))}
            {profiles.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: 24, color: "#9ca3af" }}>
                  ไม่มีข้อมูลนักศึกษา
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}