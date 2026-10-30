import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Store,
  Clock,
  MapPin,
  CheckCircle,
  Plus,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import './Orders.css';

export function Orders() {
  const navigate = useNavigate();
  const { state } = useApp();
  const { orders } = state;

  return (
    <main className="page-content orders-page">
      <div className="container">
        
        {/* Header */}
        <header className="orders-header animate-fade-in">
          <div>
            <p className="section-label">Order History</p>
            <h1>My Medicine Orders 📦</h1>
            <p className="orders-subtitle">
              Track your home deliveries and pickup orders fulfilled by verified pharmacy partners.
            </p>
          </div>

          <button
            id="order-new-meds-btn"
            className="btn btn-primary"
            onClick={() => navigate('/pharmacies')}
          >
            <Plus size={18} aria-hidden="true" />
            <span>Order Prescribed Medicines</span>
          </button>
        </header>

        {orders.length === 0 ? (
          <div className="empty-orders-card card animate-fade-in">
            <div className="empty-orders-icon" aria-hidden="true">📋</div>
            <h2>No Orders Placed Yet</h2>
            <p>
              When you order verified prescription medicines from our partner stores, your orders will appear here for easy tracking.
            </p>
            <div className="empty-actions">
              <button
                id="empty-explore-stores-btn"
                className="btn btn-primary btn-lg"
                onClick={() => navigate('/pharmacies')}
              >
                Explore Pharmacy Stores
              </button>
              <button
                id="empty-view-medicines-btn"
                className="btn btn-secondary btn-lg"
                onClick={() => navigate('/routine')}
              >
                View My Prescribed Medicines
              </button>
            </div>
          </div>
        ) : (
          <div className="orders-list stagger" role="list">
            {orders.map(order => (
              <article key={order.id} className="card order-record-card" role="listitem">
                <div className="order-top-banner">
                  <div className="order-id-group">
                    <span className="order-id-label">Order ID: {order.id}</span>
                    <span className="order-date-text">
                      Placed on {format(new Date(order.date), 'dd MMM yyyy, h:mm a')}
                    </span>
                  </div>

                  <div className="order-status-pill">
                    <CheckCircle size={16} aria-hidden="true" />
                    <span>{order.status}</span>
                  </div>
                </div>

                <div className="order-pharmacy-row">
                  <div className="pharmacy-badge-info">
                    <Store size={18} className="pharmacy-icon" aria-hidden="true" />
                    <span className="pharmacy-name">{order.pharmacy.name}</span>
                  </div>
                  <div className="delivery-est-badge">
                    <Clock size={16} aria-hidden="true" />
                    <span>Arrival: <strong>{order.estimatedArrival}</strong></span>
                  </div>
                </div>

                {/* Items List */}
                <div className="order-items-box">
                  <span className="box-title">Ordered Medicines:</span>
                  <div className="ordered-items-tags">
                    {order.items.map(item => (
                      <div key={item.id} className="ordered-item-pill">
                        <span className="pill-name">{item.product.medicineName}</span>
                        <span className="pill-qty">× {item.quantity} pack(s)</span>
                        <span className="pill-price">₹{(item.product.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="order-bottom-row">
                  <div className="delivery-destination">
                    <MapPin size={16} className="pin-icon" aria-hidden="true" />
                    <span>{order.deliveryAddress}</span>
                  </div>

                  <div className="order-total-group">
                    <span className="total-label">Total Paid (COD/UPI):</span>
                    <span className="total-val">₹{order.total.toFixed(2)}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}
