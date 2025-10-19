import React, { useEffect, useState } from "react";
import { AuthAPI } from "../api/auth.api";
import api from "../api/axiosInstance";

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [listings, setListings] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);

  const [form, setForm] = useState({
    startLocation: "",
    endLocation: "",
    distanceKm: "",
    energyUsedKWh: "",
  });

  const token = localStorage.getItem("token");

  // 🚀 Fetch dữ liệu người dùng, ví, hành trình và báo cáo
useEffect(() => {
  if (!token) {
    alert("Vui lòng đăng nhập trước.");
    window.location.href = "/";
    return;
  }

  const fetchData = async () => {
    try {
      const [profileRes, walletRes, tripsRes, summaryRes, listingsRes] = await Promise.all([
        AuthAPI.profile(),
        api.get("/carbon-wallet", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        api.get("/vehicle-trip/by-owner", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        api.get("/dashboard/summary", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        api.get("/carbon-market/my-listings", { 
          headers: { Authorization: `Bearer ${token}` } 
        }),
      ]);

      setUser(profileRes.data.user);
      setWallet(walletRes.data);
      setTrips(tripsRes.data);
      setSummary(summaryRes.data);
      setListings(listingsRes.data);
    } catch (err) {
      console.error("Lỗi load dữ liệu:", err);
      alert("Không thể tải dữ liệu. Hãy đăng nhập lại!");
      localStorage.removeItem("token");
      window.location.href = "/";
    }
  };

  fetchData();
}, [token]);


  // 🟢 Gửi form tạo hành trình mới
  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        startLocation: form.startLocation,
        endLocation: form.endLocation,
        distanceKm: parseFloat(form.distanceKm),
        energyUsedKWh: parseFloat(form.energyUsedKWh),
      };

      await api.post("/vehicle-trip", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("✅ Hành trình mới đã được tạo!");
      setForm({
        startLocation: "",
        endLocation: "",
        distanceKm: "",
        energyUsedKWh: "",
      });

      // Refresh danh sách hành trình
      const res = await api.get("/vehicle-trip/by-owner", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTrips(res.data);
    } catch (err) {
      console.error("❌ Lỗi tạo hành trình:", err);
      alert("Không thể tạo hành trình. Kiểm tra console để xem chi tiết.");
    } finally {
      setLoading(false);
    }
  };

  if (!user || !wallet) return <p style={{ padding: 40 }}>Đang tải dữ liệu...</p>;

  return (
    <div style={{ padding: 40 }}>
      <h2>Trang cá nhân EV Owner</h2>

      {/* 👤 Thông tin người dùng */}
      <section style={{ marginBottom: 40 }}>
        <h3>👤 Thông tin người dùng</h3>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Tên đăng nhập:</strong> {user.username}</p>
      </section>

      {/* 💰 Ví Carbon */}
      <section style={{ marginBottom: 40 }}>
        <h3>💰 Ví Carbon</h3>
        <p><strong>Tín chỉ carbon:</strong> {wallet.balanceCarbon ?? wallet.balance}</p>
        <p><strong>Số dư tiền (USD):</strong> {wallet.balanceFiat ?? 0}</p>
        <p><strong>Cập nhật lần cuối:</strong> {new Date(wallet.updatedAt).toLocaleString()}</p>
        <a href="/wallet" style={{ color: "#007bff", textDecoration: "none" }}>
          💳 Xem ví & giao dịch
        </a>
      </section>

{/* 📊 Báo cáo tổng kết */}
<section style={{ marginBottom: 40 }}>
  <h3>📊 Báo cáo tổng kết</h3>
  {summary ? (
    <div>
      <p>
        <strong>Tổng lượng CO₂ giảm phát thải:</strong>{" "}
        {summary.totalCO2?.toFixed(2)} kg
      </p>
      <p>
        <strong>Tổng số tín chỉ carbon:</strong>{" "}
        {summary.totalCredits?.toFixed(2)} credits
      </p>
      <p>
        <strong>Tổng doanh thu ước tính:</strong>{" "}
        ${summary.totalRevenue?.toFixed(2)}
      </p>
    </div>
  ) : (
    <p>Đang tải báo cáo...</p>
  )}
</section>

{/* 🏪 Niêm yết tín chỉ để bán */}
<section style={{ marginBottom: 40 }}>
  <h3>🏪 Niêm yết tín chỉ để bán</h3>
  <form
    onSubmit={async (e) => {
      e.preventDefault();
      const amount = prompt("Nhập số tín chỉ muốn bán:");
      const price = prompt("Nhập giá mỗi tín chỉ (USD):");
      if (!amount || !price) return alert("Vui lòng nhập đủ thông tin!");

      try {
        await api.post(
          "/carbon-market/listing",
          { amount: parseFloat(amount), pricePerCredit: parseFloat(price) },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert("✅ Đã niêm yết tín chỉ thành công!");

        // Refresh danh sách listing
        const listingsRes = await api.get("/carbon-market/my-listings", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setListings(listingsRes.data);
      } catch (err) {
        console.error("❌ Lỗi niêm yết:", err);
        alert("Không thể tạo listing!");
      }
    }}
  >
    <button>+ Tạo niêm yết mới</button>
  </form>
  <a href="/marketplace" style={{ color: "#007bff", textDecoration: "none", marginTop: 10, display: "inline-block" }}>
          🛒 Xem Marketplace
  </a>

  {/* Danh sách niêm yết */}
  <div style={{ marginTop: 20 }}>
    <h4>Danh sách niêm yết của bạn</h4>
    {listings.length === 0 ? (
      <p>Chưa có niêm yết nào.</p>
    ) : (
      <table border={1} cellPadding={6}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Số lượng</th>
            <th>Giá / tín chỉ</th>
            <th>Loại</th>
            <th>Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {listings.map((l) => (
            <tr key={l.id}>
              <td>{l.id}</td>
              <td>{l.amount}</td>
              <td>{l.pricePerCredit}</td>
              <td>{l.type}</td>
              <td>{l.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
</section>

      {/* 🚗 Form tạo hành trình mới */}
      <section style={{ marginBottom: 40 }}>
        <h3>🚗 Tạo hành trình mới</h3>
        <form
          onSubmit={handleCreateTrip}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            maxWidth: 400,
          }}
        >
          <input
            placeholder="Điểm đi"
            value={form.startLocation}
            onChange={(e) => setForm({ ...form, startLocation: e.target.value })}
            required
          />
          <input
            placeholder="Điểm đến"
            value={form.endLocation}
            onChange={(e) => setForm({ ...form, endLocation: e.target.value })}
            required
          />
          <input
            placeholder="Khoảng cách (km)"
            type="number"
            step="0.1"
            value={form.distanceKm}
            onChange={(e) => setForm({ ...form, distanceKm: e.target.value })}
            required
          />
          <input
            placeholder="Điện năng sử dụng (kWh)"
            type="number"
            step="0.1"
            value={form.energyUsedKWh}
            onChange={(e) => setForm({ ...form, energyUsedKWh: e.target.value })}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Đang tạo..." : "Thêm hành trình"}
          </button>
        </form>
      </section>

      {/* 🧾 Danh sách hành trình */}
      <section>
        <h3>🧾 Danh sách hành trình</h3>
        {trips.length === 0 ? (
          <p>Chưa có hành trình nào được ghi lại.</p>
        ) : (
          <table border={1} cellPadding={6}>
            <thead>
              <tr>
                <th>Ngày</th>
                <th>Điểm đi</th>
                <th>Điểm đến</th>
                <th>Khoảng cách (km)</th>
                <th>CO₂ tiết kiệm (kg)</th>
                <th>Tín chỉ carbon</th>
                <th>Hành động</th>
              </tr>
            </thead>

            <tbody>
  {trips.map((t) => {
    const credit = t.carbonCredits?.[0]?.creditsEarned ?? 0;
    return (
      <tr key={t.id}>
        <td>{new Date(t.date).toLocaleDateString()}</td>
        <td>{t.startLocation}</td>
        <td>{t.endLocation}</td>
        <td>{t.distanceKm}</td>
        <td>{t.co2SavedKg}</td>
        <td>{credit.toFixed(2)}</td>
        <td>
          <button
            onClick={async () => {
              if (window.confirm("Bạn có chắc muốn xoá hành trình này?")) {
                try {
                  await api.delete(`/vehicle-trip/${t.id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  alert("Đã xoá hành trình thành công ✅");

                  const res = await api.get("/vehicle-trip/by-owner", {
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  setTrips(res.data);
                } catch (err) {
                  console.error(err);
                  alert("Không thể xoá hành trình ❌");
                }
              }
            }}
          >
            Xoá
          </button>
        </td>
      </tr>
    );
  })}
</tbody>
          </table>
        )}
      </section>
    </div>
  );
}
