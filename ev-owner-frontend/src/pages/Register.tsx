import { useState } from "react";
import { AuthAPI } from "../api/auth.api";

export default function Register() {
  const [form, setForm] = useState({ username: "", email: "", password: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await AuthAPI.register(form);
      alert("Đăng ký thành công!");
    } catch (err) {
      alert("Đăng ký thất bại!");
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>Đăng ký tài khoản EV Owner</h2>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", width: 300 }}>
        <input placeholder="Tên người dùng" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
        <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input type="password" placeholder="Mật khẩu" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <button type="submit">Đăng ký</button>
      </form>
    </div>
  );
}
