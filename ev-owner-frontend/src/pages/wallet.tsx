import React, { useEffect, useState } from "react";
import api from "../api/axiosInstance";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

export default function WalletPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      alert("⚠️ Bạn cần đăng nhập để xem ví!");
      window.location.href = "/";
      return;
    }

    const fetchData = async () => {
      try {
        const [txRes, summaryRes] = await Promise.all([
          api.get("/carbon-market/my-wallet-transactions", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          api.get("/carbon-market/my-wallet-summary", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setTransactions(txRes.data);
        setSummary(summaryRes.data);
      } catch (err) {
        console.error(err);
        alert("Không thể tải dữ liệu ví!");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  if (loading) return <p style={{ padding: 40 }}>Đang tải dữ liệu ví...</p>;

  return (
    <div style={{ padding: 40 }}>
      <h2>💳 Ví Carbon cá nhân</h2>

      {/* --- Tổng quan ví --- */}
      {summary && (
        <div
          style={{
            display: "flex",
            gap: 40,
            marginBottom: 40,
            flexWrap: "wrap",
          }}
        >
          <div style={cardStyle}>
            <h3>🌿 Tín chỉ Carbon</h3>
            <p style={valueStyle}>{summary.balanceCarbon.toFixed(2)}</p>
          </div>
          <div style={cardStyle}>
            <h3>💵 Số dư tiền (USD)</h3>
            <p style={valueStyle}>{summary.balanceFiat.toFixed(2)}</p>
          </div>
          <div style={cardStyle}>
            <h3>📈 Tổng giao dịch</h3>
            <p style={valueStyle}>{summary.totalTransactions}</p>
          </div>
          <div style={cardStyle}>
            <h3>🕒 30 ngày gần nhất</h3>
            <p style={valueStyle}>{summary.recentTransactionsCount}</p>
          </div>
        </div>
      )}

{/* --- Nút nạp/rút tiền --- */}
<div style={{ display: "flex", gap: 20, marginBottom: 40 }}>
  <button
    onClick={async () => {
      const amount = prompt("Nhập số tiền muốn nạp (USD):");
      if (!amount) return;
      try {
        const res = await api.post(
          "/carbon-market/deposit",
          { amount: parseFloat(amount) },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert(res.data.message);
        window.location.reload();
      } catch (err) {
        console.error(err);
        alert("Không thể nạp tiền!");
      }
    }}
  >
    💰 Nạp tiền
  </button>

  <button
    onClick={async () => {
      const amount = prompt("Nhập số tiền muốn rút (USD):");
      if (!amount) return;
      try {
        const res = await api.post(
          "/carbon-market/withdraw",
          { amount: parseFloat(amount) },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert(res.data.message);
        window.location.reload();
      } catch (err) {
        console.error(err);
        alert("Không thể rút tiền!");
      }
    }}
  >
    💸 Rút tiền
  </button>
</div>


      {/* --- Biểu đồ giao dịch --- */}
      {summary?.dailyTransactionData?.length > 0 && (
        <>
          <h3>📊 Biểu đồ số giao dịch trong 30 ngày</h3>
          <div style={{ width: "100%", height: 300, marginBottom: 40 }}>
            <ResponsiveContainer>
              <LineChart data={summary.dailyTransactionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#82ca9d"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* --- Lịch sử chi tiết --- */}
      <h3>📜 Lịch sử giao dịch</h3>
      {transactions.length === 0 ? (
        <p>Chưa có giao dịch nào.</p>
      ) : (
        <table
          border={1}
          cellPadding={8}
          style={{ borderCollapse: "collapse", width: "100%" }}
        >
          <thead style={{ backgroundColor: "#000000ff" }}>
            <tr>
              <th>ID</th>
              <th>Loại</th>
              <th>Số tiền (USD)</th>
              <th>Số tín chỉ</th>
              <th>Mô tả</th>
              <th>Thời gian</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id}>
                <td>{t.id}</td>
                <td>{t.type}</td>
                <td>{t.amountFiat.toFixed(2)}</td>
                <td>{t.amountCarbon}</td>
                <td>{t.description || "-"}</td>
                <td>{new Date(t.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// --- Styles ---
const cardStyle: React.CSSProperties = {
  flex: "1 1 200px",
  background: "#463ac8ff",
  padding: "20px",
  borderRadius: "12px",
  boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
};

const valueStyle: React.CSSProperties = {
  fontSize: "24px",
  fontWeight: "bold",
  color: "#2a8f5b",
  marginTop: "10px",
};
