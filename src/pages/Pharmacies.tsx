import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Store,
  Star,
  Clock,
  Truck,
  CheckCircle2,
  MapPin,
  Phone,
  ShieldAlert,
  Plus,
  ShoppingCart,
  Search,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PHARMACY_STORES, getProductsForStore } from '../services/pharmacyData';
import {
  findUnresolvedFlag,
  getUnresolvedMedicineFlags,
} from '../services/prescriptionComparison';
import type { MedicationEntry, PharmacyProduct } from '../types';
import './Pharmacies.css';

export function Pharmacies() {
  const navigate = useNavigate();
  const { state, setSelectedPharmacy, addToCart } = useApp();
  const { selectedPharmacyId, prescriptions, comparisons, activePrescriptionId } = state;

  const [searchQuery, setSearchQuery] = useState('');
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  // Use the currently verified prescription version only. Older versions stay
  // saved in history but do not feed the pharmacy inventory.
  const activePrescription =
    prescriptions.find(rx => rx.id === activePrescriptionId && rx.status === 'active') ??
    prescriptions.find(rx => rx.status === 'active') ??
    null;

  const verifiedMeds: MedicationEntry[] = [];
  if (activePrescription?.verified?.medications) {
    for (const m of activePrescription.verified.medications) {
      if (!m.unclear) verifiedMeds.push(m);
    }
  }

  // Fallback demo meds if no prescription has been verified yet
  const effectiveMeds: MedicationEntry[] = verifiedMeds.length > 0 ? verifiedMeds : [
    {
      id: 'demo-med-1',
      medicineName: 'Metformin',
      strength: '500mg',
      dose: '1 tablet',
      frequency: 'Twice daily',
      timings: ['morning', 'evening'],
      foodInstruction: 'After food',
      duration: '30 days',
      notes: null,
      unclear: false,
      unclearFields: [],
    },
    {
      id: 'demo-med-2',
      medicineName: 'Amlodipine',
      strength: '5mg',
      dose: '1 tablet',
      frequency: 'Once daily',
      timings: ['morning'],
      foodInstruction: 'Before food',
      duration: '30 days',
      notes: null,
      unclear: false,
      unclearFields: [],
    },
    {
      id: 'demo-med-3',
      medicineName: 'Atorvastatin',
      strength: '10mg',
      dose: '1 tablet',
      frequency: 'Once daily',
      timings: ['night'],
      foodInstruction: null,
      duration: '30 days',
      notes: null,
      unclear: false,
      unclearFields: [],
    },
  ];

  const filteredStores = PHARMACY_STORES.filter(store =>
    store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    store.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedStore = PHARMACY_STORES.find(s => s.id === selectedPharmacyId) || PHARMACY_STORES[0];
  const storeProducts = getProductsForStore(selectedStore.id, effectiveMeds);

  // Medicines in a pending comparison that changed or need review are never
  // offered for ordering until the caregiver obtains professional clarification.
  const comparisonFlags = getUnresolvedMedicineFlags(comparisons, prescriptions);
  const flagFor = (medicineName: string) => findUnresolvedFlag(comparisonFlags, medicineName);
  const safeProducts = storeProducts.filter(p => !flagFor(p.medicineName));
  const flaggedProducts = storeProducts.filter(p => Boolean(flagFor(p.medicineName)));

  const handleSelectStore = (storeId: string) => {
    setSelectedPharmacy(storeId);
  };

  const handleAddToCart = (product: PharmacyProduct) => {
    addToCart(product, 1, activePrescription?.id);
    setJustAddedId(product.id);
    setTimeout(() => setJustAddedId(null), 1800);
  };

  return (
    <main className="page-content pharmacies-page">
      <div className="container">
        
        {/* Header */}
        <header className="pharmacies-header animate-fade-in">
          <div>
            <p className="section-label">Verified Pharmacies</p>
            <h1>Pharmacy Stores & Home Delivery 🏪</h1>
            <p className="pharmacies-subtitle">
              Select your trusted local or partner pharmacy to fulfill verified prescription medications.
            </p>
          </div>

          <button
            id="view-cart-header-btn"
            className="btn btn-primary"
            onClick={() => navigate('/cart')}
          >
            <ShoppingCart size={18} aria-hidden="true" />
            <span>View My Cart</span>
          </button>
        </header>

        {/* Store Search */}
        <div className="search-bar-wrap animate-fade-in">
          <Search size={18} className="search-icon" aria-hidden="true" />
          <input
            id="search-store-input"
            type="text"
            className="input search-input"
            placeholder="Search pharmacy by name or neighbourhood..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Stores Grid */}
        <section className="stores-grid stagger" aria-label="Available pharmacies">
          {filteredStores.map(store => {
            const isSelected = store.id === selectedPharmacyId;
            return (
              <div
                key={store.id}
                className={`store-card card ${isSelected ? 'store-card--selected' : ''}`}
              >
                <div className="store-top-row">
                  <div className="store-title-group">
                    <h2 className="store-name">{store.name}</h2>
                    <p className="store-tagline">{store.tagline}</p>
                  </div>
                  {store.badge && (
                    <span className="badge badge-primary">{store.badge}</span>
                  )}
                </div>

                <div className="store-meta-grid">
                  <div className="meta-item">
                    <Star size={16} className="star-icon" aria-hidden="true" />
                    <span><strong>{store.rating}</strong> ({store.reviewCount} reviews)</span>
                  </div>
                  <div className="meta-item">
                    <Clock size={16} aria-hidden="true" />
                    <span>{store.estDeliveryTime}</span>
                  </div>
                  <div className="meta-item">
                    <Truck size={16} aria-hidden="true" />
                    <span>Delivery fee: ₹{store.deliveryFee}</span>
                  </div>
                </div>

                <div className="store-location-info">
                  <MapPin size={15} className="pin-icon" aria-hidden="true" />
                  <span>{store.address}</span>
                </div>

                <div className="store-contact-row">
                  <Phone size={14} aria-hidden="true" />
                  <span>{store.phone}</span>
                </div>

                <div className="store-action-row">
                  {isSelected ? (
                    <div className="selected-indicator">
                      <CheckCircle2 size={18} aria-hidden="true" />
                      <span>Preferred Store Selected</span>
                    </div>
                  ) : (
                    <button
                      id={`select-store-${store.id}`}
                      type="button"
                      className="btn btn-secondary select-store-btn"
                      onClick={() => handleSelectStore(store.id)}
                    >
                      <Store size={16} aria-hidden="true" />
                      Select This Store
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </section>

        {/* Products Available at Selected Store */}
        <section className="store-inventory-section card animate-fade-in" aria-labelledby="inventory-heading">
          <div className="inventory-header">
            <div>
              <h2 id="inventory-heading">
                Prescribed Medicines at <span className="highlight-store">{selectedStore.name}</span>
              </h2>
              <p className="inventory-sub">
                Only showing exact matches from your currently verified prescription version. No
                unauthorized substitutes. Changed or unclear medicines are held for clarification.
              </p>
            </div>

            <button
              id="compare-prices-shortcut"
              className="btn btn-secondary btn-sm"
              onClick={() => navigate('/compare')}
            >
              Compare All Store Prices →
            </button>
          </div>

          {flaggedProducts.length > 0 && (
            <div className="pharmacy-flagged-block" role="alert">
              <div className="pharmacy-flagged-head">
                <ShieldAlert size={20} aria-hidden="true" />
                <div>
                  <h3>Needs clarification before ordering</h3>
                  <p>
                    These medicines have a changed or unresolved instruction in a new prescription.
                    They cannot be ordered until a doctor or pharmacist clarifies the correct
                    instruction. Nothing was changed in your cart automatically.
                  </p>
                </div>
              </div>

              <div className="flagged-products-grid">
                {flaggedProducts.map(product => {
                  const flag = flagFor(product.medicineName);
                  return (
                    <div key={`flagged-${product.id}`} className="product-card product-card--flagged">
                      <div className="product-top">
                        <span className="badge badge-warning">Needs clarification</span>
                      </div>
                      <h3 className="product-title">{product.medicineName}</h3>
                      <div className="product-details-list">
                        <p><strong>Strength:</strong> {product.strength}</p>
                        <p><strong>Form:</strong> {product.dosageForm}</p>
                        <p><strong>Packaging:</strong> {product.packInfo}</p>
                      </div>
                      <p className="flagged-reason">
                        {flag?.reasons[0] ??
                          'A difference was detected in a new prescription. Please obtain professional clarification.'}
                      </p>
                      <div className="product-price-row">
                        <span className="product-price">₹{product.price.toFixed(2)}</span>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          disabled
                          aria-label={`Cannot add ${product.medicineName} until the instruction is clarified`}
                        >
                          Order paused
                        </button>
                      </div>
                      {flag && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm flagged-review-link"
                          onClick={() =>
                            navigate(
                              `/prescriptions/compare/${flag.newPrescriptionId}/${flag.previousPrescriptionId}`
                            )
                          }
                        >
                          Review the comparison
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="product-cards-grid">
            {safeProducts.map(product => {
              const wasAdded = justAddedId === product.id;
              return (
                <div key={product.id} className="product-card">
                  <div className="product-top">
                    <span className="badge badge-success">Verified Match</span>
                    <span className="stock-tag">● In Stock</span>
                  </div>

                  <h3 className="product-title">{product.medicineName}</h3>
                  <div className="product-details-list">
                    <p><strong>Strength:</strong> {product.strength}</p>
                    <p><strong>Form:</strong> {product.dosageForm}</p>
                    <p><strong>Packaging:</strong> {product.packInfo}</p>
                  </div>

                  <div className="product-price-row">
                    <div>
                      <span className="product-price">₹{product.price.toFixed(2)}</span>
                      <span className="per-pack-label"> per pack</span>
                    </div>

                    <button
                      id={`add-cart-${product.id}`}
                      type="button"
                      className={`btn ${wasAdded ? 'btn-success' : 'btn-primary'} btn-sm`}
                      onClick={() => handleAddToCart(product)}
                    >
                      {wasAdded ? (
                        <>
                          <CheckCircle2 size={16} aria-hidden="true" />
                          <span>Added!</span>
                        </>
                      ) : (
                        <>
                          <Plus size={16} aria-hidden="true" />
                          <span>Add to Cart</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </div>
    </main>
  );
}
