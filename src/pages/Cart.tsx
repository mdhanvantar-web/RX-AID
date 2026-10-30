import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trash2,
  Plus,
  Minus,
  Truck,
  Building,
  CheckCircle,
  MapPin,
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Store,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PHARMACY_STORES } from '../services/pharmacyData';
import {
  findUnresolvedFlag,
  getUnresolvedMedicineFlags,
} from '../services/prescriptionComparison';
import type { CartItem, OrderRecord } from '../types';
import './Cart.css';

export function Cart() {
  const navigate = useNavigate();
  const {
    state,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    createOrder,
    updateUser,
  } = useApp();

  const { cart, selectedPharmacyId, user, prescriptions, comparisons, activePrescriptionId } = state;
  const store = PHARMACY_STORES.find(s => s.id === selectedPharmacyId) || PHARMACY_STORES[0];

  const comparisonFlags = getUnresolvedMedicineFlags(comparisons, prescriptions);
  const activeId =
    prescriptions.find(rx => rx.id === activePrescriptionId && rx.status === 'active')?.id ??
    prescriptions.find(rx => rx.status === 'active')?.id ??
    null;

  const issueForItem = (item: CartItem): { label: string; reason: string; comparisonPath: string | null } | null => {
    const flag = findUnresolvedFlag(comparisonFlags, item.product.medicineName);
    if (flag) {
      return {
        label: 'Needs clarification',
        reason:
          flag.reasons[0] ??
          'A changed or unclear instruction was detected. Please confirm with a doctor or pharmacist.',
        comparisonPath: `/prescriptions/compare/${flag.newPrescriptionId}/${flag.previousPrescriptionId}`,
      };
    }
    if (item.prescriptionId && activeId && item.prescriptionId !== activeId) {
      return {
        label: 'Older prescription version',
        reason:
          'This item was added from an earlier prescription version. Review the current verified version before ordering.',
        comparisonPath: null,
      };
    }
    return null;
  };

  const flaggedItems = cart
    .map(item => ({ item, issue: issueForItem(item) }))
    .filter(entry => entry.issue !== null);
  const orderBlocked = flaggedItems.length > 0;

  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  const [address, setAddress] = useState(user.deliveryAddress || 'Flat 302, Shanti Nilayam, Green Hills Road, Hyderabad');
  const [phone, setPhone] = useState(user.phone || '+91 90000 00000');
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [orderCelebration, setOrderCelebration] = useState(false);

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const deliveryFee = deliveryType === 'delivery'
    ? (subtotal >= store.freeDeliveryThreshold ? 0 : store.deliveryFee)
    : 0;
  const grandTotal = subtotal + deliveryFee;

  const handlePlaceOrder = () => {
    if (orderBlocked) return;

    // Save address in profile
    updateUser({ deliveryAddress: address, phone });

    const newOrder: OrderRecord = {
      id: `ORD-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString(),
      items: [...cart],
      pharmacy: store,
      deliveryType,
      deliveryAddress: deliveryType === 'delivery' ? address : `Store Pickup: ${store.address}`,
      subtotal,
      deliveryFee,
      total: grandTotal,
      status: 'Order Placed',
      estimatedArrival: deliveryType === 'delivery' ? store.estDeliveryTime : 'Ready in 30 mins',
    };

    createOrder(newOrder);
    setOrderCelebration(true);
  };

  if (orderCelebration) {
    return (
      <main className="page-content cart-page">
        <div className="container">
          <div className="card order-success-card animate-fade-in" role="status">
            <div className="success-icon-wrap" aria-hidden="true">
              <CheckCircle size={56} className="success-icon" />
            </div>
            <h1>Medicine Order Placed Successfully! 🎉</h1>
            <p className="order-sub">
              Your prescription medications will be prepared by <strong>{store.name}</strong> for {deliveryType === 'delivery' ? 'Home Delivery' : 'Store Pickup'}.
            </p>
            <div className="order-summary-box">
              <p><strong>Delivery Address:</strong> {address}</p>
              <p><strong>Estimated Arrival:</strong> {store.estDeliveryTime}</p>
              <p><strong>Total Amount:</strong> ₹{grandTotal.toFixed(2)} (Cash/UPI on Delivery)</p>
            </div>
            <div className="success-btn-row">
              <button
                id="view-orders-btn"
                className="btn btn-primary btn-lg"
                onClick={() => navigate('/orders')}
              >
                View in My Orders
              </button>
              <button
                id="back-home-btn"
                className="btn btn-secondary btn-lg"
                onClick={() => navigate('/')}
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page-content cart-page">
      <div className="container">
        
        {/* Header */}
        <header className="cart-header animate-fade-in">
          <div>
            <p className="section-label">Prescription Checkout</p>
            <h1>My Medicine Cart 🛒</h1>
            <p className="cart-subtitle">
              Review your prescribed medications and choose home delivery or pharmacy pickup.
            </p>
          </div>

          {cart.length > 0 && (
            <button
              id="clear-cart-btn"
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={clearCart}
            >
              <Trash2 size={16} aria-hidden="true" />
              <span>Empty Cart</span>
            </button>
          )}
        </header>

        {/* Selected Store Banner */}
        <div className="selected-pharmacy-banner card animate-fade-in">
          <div className="pharmacy-banner-left">
            <div className="store-avatar" aria-hidden="true">
              <Store size={24} />
            </div>
            <div>
              <span className="selected-store-label">Fulfilling Pharmacy</span>
              <h2 className="selected-store-name">{store.name}</h2>
              <p className="selected-store-address">{store.address}</p>
            </div>
          </div>
          <button
            id="change-store-btn"
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => navigate('/pharmacies')}
          >
            Change Pharmacy Store
          </button>
        </div>

        {flaggedItems.length > 0 && (
          <div className="cart-flag-banner card animate-fade-in" role="alert">
            <AlertTriangle size={22} className="cart-flag-icon" aria-hidden="true" />
            <div className="cart-flag-body">
              <h2>Ordering paused for {flaggedItems.length} item{flaggedItems.length === 1 ? '' : 's'}</h2>
              <p>
                These items have a changed, unclear, or older-prescription match. They will not be
                ordered automatically. Please confirm the correct instruction with the prescribing
                doctor or a qualified healthcare professional.
              </p>
              <ul>
                {flaggedItems.map(({ item, issue }) => (
                  <li key={item.id}>
                    <strong>{item.product.medicineName}</strong> — {issue?.label}. {issue?.reason}
                    {issue?.comparisonPath && (
                      <>
                        {' '}
                        <button
                          type="button"
                          className="link-btn"
                          onClick={() => navigate(issue.comparisonPath as string)}
                        >
                          Review comparison
                        </button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
              <p className="cart-flag-note">
                Your cart was not changed automatically. Remove these items or wait until the
                instructions are clarified and verified.
              </p>
            </div>
          </div>
        )}

        {cart.length === 0 ? (
          <div className="empty-cart-card card animate-fade-in">
            <div className="empty-cart-icon" aria-hidden="true">🛍️</div>
            <h2>Your Cart is Currently Empty</h2>
            <p>
              Explore verified prescription medicines from our licensed pharmacy partners or compare prices.
            </p>
            <div className="empty-cart-actions">
              <button
                id="browse-pharmacies-btn"
                className="btn btn-primary"
                onClick={() => navigate('/pharmacies')}
              >
                Explore Pharmacy Stores
              </button>
              <button
                id="compare-prices-btn"
                className="btn btn-secondary"
                onClick={() => navigate('/compare')}
              >
                Compare Medicine Prices
              </button>
            </div>
          </div>
        ) : (
          <div className="cart-layout-grid">
            
            {/* Left: Cart Items List */}
            <section className="cart-items-section card" aria-labelledby="items-heading">
              <h2 id="items-heading" className="card-title">
                Prescription Medicines ({cart.length} items)
              </h2>

              <div className="cart-items-list" role="list">
                {cart.map(item => (
                  <div key={item.id} className="cart-item-row" role="listitem">
                    <div className="item-info">
                      <span className={`badge ${issueForItem(item) ? 'badge-warning' : 'badge-success'} item-badge`}>
                        {issueForItem(item)?.label ?? 'Doctor Prescribed'}
                      </span>
                      <h3 className="item-name">{item.product.medicineName}</h3>
                      <p className="item-pack">{item.product.packInfo} · {item.product.dosageForm}</p>
                      <p className="item-unit-price">₹{item.product.price.toFixed(2)} / pack</p>
                    </div>

                    <div className="item-actions">
                      <div className="quantity-control" aria-label="Item quantity">
                        <button
                          type="button"
                          className="qty-btn"
                          onClick={() => updateCartQuantity(item.id, -1)}
                          aria-label="Decrease quantity"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="qty-number">{item.quantity}</span>
                        <button
                          type="button"
                          className="qty-btn"
                          onClick={() => updateCartQuantity(item.id, 1)}
                          aria-label="Increase quantity"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <span className="item-total-price">
                        ₹{(item.product.price * item.quantity).toFixed(2)}
                      </span>

                      <button
                        type="button"
                        className="remove-btn"
                        onClick={() => removeFromCart(item.id)}
                        aria-label={`Remove ${item.product.medicineName} from cart`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Safe Prescription Guarantee Notice */}
              <div className="cart-safe-guarantee">
                <ShieldCheck size={20} className="shield-icon" aria-hidden="true" />
                <p>
                  <strong>Clinical Match Guarantee:</strong> We only dispatch medicines strictly matching the doctor's verified prescription name and strength. No unauthorized brand substitutions.
                </p>
              </div>
            </section>

            {/* Right: Delivery & Order Summary */}
            <aside className="cart-summary-section" aria-label="Order summary and delivery details">
              <div className="card">
                <h2 className="card-title">Delivery Option</h2>

                {/* Home Delivery vs Store Pickup Tabs */}
                <div className="delivery-option-tabs" role="radiogroup">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={deliveryType === 'delivery'}
                    className={`delivery-tab ${deliveryType === 'delivery' ? 'delivery-tab--active' : ''}`}
                    onClick={() => setDeliveryType('delivery')}
                  >
                    <Truck size={18} aria-hidden="true" />
                    <span>Home Delivery ({store.estDeliveryTime})</span>
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={deliveryType === 'pickup'}
                    className={`delivery-tab ${deliveryType === 'pickup' ? 'delivery-tab--active' : ''}`}
                    onClick={() => setDeliveryType('pickup')}
                  >
                    <Building size={18} aria-hidden="true" />
                    <span>Store Pickup (Free)</span>
                  </button>
                </div>

                {deliveryType === 'delivery' && (
                  <div className="address-block">
                    <label htmlFor="delivery-address-input" className="address-label">
                      <MapPin size={16} aria-hidden="true" />
                      <span>Delivery Address (Elderly Patient / Caregiver)</span>
                    </label>
                    <textarea
                      id="delivery-address-input"
                      className="input address-textarea"
                      rows={3}
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      placeholder="Enter flat/door number, street name, city, landmark..."
                    />

                    <label htmlFor="contact-phone-input" className="address-label" style={{ marginTop: 'var(--space-3)' }}>
                      <span>Contact Phone Number</span>
                    </label>
                    <input
                      id="contact-phone-input"
                      type="tel"
                      className="input"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+91 Phone number for delivery updates"
                    />
                  </div>
                )}

                {/* Price Breakdown */}
                <div className="price-breakdown-list">
                  <div className="breakdown-row">
                    <span>Medicines Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="breakdown-row">
                    <span>
                      Delivery Fee
                      {subtotal >= store.freeDeliveryThreshold && (
                        <span className="free-delivery-tag"> (Free over ₹{store.freeDeliveryThreshold})</span>
                      )}
                    </span>
                    <span>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee.toFixed(2)}`}</span>
                  </div>
                  <div className="breakdown-row grand-total-row">
                    <span>Total Payable</span>
                    <span className="grand-total-amount">₹{grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Checkout Review Trigger Button */}
                <button
                  id="proceed-checkout-btn"
                  type="button"
                  className="btn btn-primary btn-lg checkout-btn"
                  onClick={() => setIsReviewOpen(true)}
                  disabled={orderBlocked}
                >
                  <span>{orderBlocked ? 'Resolve Flagged Medicines Before Ordering' : 'Review Order Before Placing'}</span>
                  <ArrowRight size={18} aria-hidden="true" />
                </button>

                {orderBlocked && (
                  <p className="cod-notice cod-notice--blocked" role="alert">
                    Ordering is paused until the flagged medicines are clarified with a doctor or
                    pharmacist.
                  </p>
                )}

                <p className="cod-notice">
                  Pay upon delivery via Cash, UPI, or Card. No immediate advance payment required.
                </p>
              </div>
            </aside>

          </div>
        )}

        {/* Order Review Modal */}
        {isReviewOpen && (
          <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="review-modal-title">
            <div className="modal-card card animate-fade-in">
              <h2 id="review-modal-title">Review Your Medicine Order</h2>
              <p className="modal-sub">
                Please double check your order details before final confirmation.
              </p>

              <div className="review-details-box">
                <div className="review-row">
                  <span>Pharmacy:</span>
                  <strong>{store.name}</strong>
                </div>
                <div className="review-row">
                  <span>Delivery Mode:</span>
                  <strong>{deliveryType === 'delivery' ? 'Home Delivery' : 'Store Pickup'}</strong>
                </div>
                {deliveryType === 'delivery' && (
                  <div className="review-row">
                    <span>Address:</span>
                    <span>{address}</span>
                  </div>
                )}
                <div className="review-row">
                  <span>Medicines:</span>
                  <span>{cart.length} items (Total {cart.reduce((s, i) => s + i.quantity, 0)} packs)</span>
                </div>
                <div className="review-row" style={{ marginTop: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
                  <span>Total Amount:</span>
                  <strong style={{ fontSize: '1.25rem', color: 'var(--color-primary-dark)' }}>
                    ₹{grandTotal.toFixed(2)}
                  </strong>
                </div>
              </div>

              <div className="demo-modal-alert">
                <AlertCircle size={16} aria-hidden="true" />
                <span>DEMO ORDER: This will record a local synthetic order in your 'My Orders' log.</span>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setIsReviewOpen(false)}
                >
                  Cancel / Edit Order
                </button>
                <button
                  id="confirm-place-order-btn"
                  type="button"
                  className="btn btn-primary btn-lg"
                  onClick={handlePlaceOrder}
                  disabled={orderBlocked}
                >
                  <CheckCircle size={18} aria-hidden="true" />
                  Confirm & Place Order
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
