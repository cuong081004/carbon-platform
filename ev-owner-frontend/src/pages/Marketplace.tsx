import React, { useEffect, useState } from "react";
import api from "../api/axiosInstance";

export default function Marketplace() {
  const [listings, setListings] = useState<any[]>([]);
  const [loadingId, setLoadingId] = useState<number | null>(null); // loading riêng từng nút
  const token = localStorage.getItem("token");

  // 🟢 Tải danh sách listing
  const fetchListings = async () => {
    try {
      const res = await api.get("/carbon-market/open-listings");
      setListings(res.data);
    } catch (err) {
      console.error("❌ Lỗi khi tải danh sách niêm yết:", err);
      alert("Không thể tải danh sách niêm yết!");
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  // 🛒 Xử lý mua
  const handleBuy = async (listingId: number) => {
    if (!token) {
      alert("⚠️ Bạn cần đăng nhập trước khi mua!");
      window.location.href = "/";
      return;
    }

    if (!window.confirm("Xác nhận mua tín chỉ carbon này?")) return;

    setLoadingId(listingId);
    try {
      const res = await api.post(
        `/carbon-market/buy/${listingId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.requiresPayment) {
        alert("💳 Bạn chưa đủ tiền. Cần nạp thêm để hoàn tất giao dịch.");
      } else {
        alert("✅ Mua thành công!");
        // Làm mới danh sách sau khi mua xong
        await fetchListings();
      }
    } catch (err: any) {
      console.error("❌ Lỗi khi mua:", err);
      alert(err.response?.data?.message || "Không thể mua niêm yết này!");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>🌍 Carbon Credit Marketplace</h2>
      <p>Xem và mua các tín chỉ carbon đang được niêm yết trên sàn.</p>

      {listings.length === 0 ? (
        <p>Hiện chưa có niêm yết nào đang mở.</p>
      ) : (
        <table
          border={1}
          cellPadding={8}
          style={{ borderCollapse: "collapse", width: "100%", marginTop: 20 }}
        >
          <thead style={{ backgroundColor: "#000000ff" }}>
            <tr>
              <th>ID</th>
              <th>Người bán</th>
              <th>Số lượng</th>
              <th>Giá / tín chỉ (USD)</th>
              <th>Tổng giá (USD)</th>
              <th>Loại</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {listings.map((l) => (
              <tr key={l.id}>
                <td>{l.id}</td>
                <td>{l.sellerId}</td>
                <td>{l.amount}</td>
                <td>{l.pricePerCredit}</td>
                <td>{(l.amount * l.pricePerCredit).toFixed(2)}</td>
                <td>{l.type}</td>
                <td>{l.status}</td>
                <td>
                  <button
                    disabled={loadingId === l.id}
                    onClick={() => handleBuy(l.id)}
                    style={{
                      backgroundColor:
                        loadingId === l.id ? "#ccc" : "#28a745",
                      color: "white",
                      padding: "6px 12px",
                      border: "none",
                      borderRadius: "4px",
                      cursor: loadingId === l.id ? "not-allowed" : "pointer",
                    }}
                  >
                    {loadingId === l.id ? "Đang xử lý..." : "Mua ngay"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
