import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthAPI } from "../api/auth.api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await AuthAPI.login(email, password);
      localStorage.setItem("token", res.data.access_token);
      alert("Đăng nhập thành công!");
      navigate("/dashboard");
    } catch (err: any) {
      alert("Đăng nhập thất bại. Kiểm tra email hoặc mật khẩu!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "40px" }}>
      <h2>Đăng nhập EV Owner</h2>
      <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", width: 300 }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ marginBottom: 10, padding: 8 }}
        />
        <input
          type="password"
          placeholder="Mật khẩu"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ marginBottom: 10, padding: 8 }}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </form>
    </div>
  );
}
