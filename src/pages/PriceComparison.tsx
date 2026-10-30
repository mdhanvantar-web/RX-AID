import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ShieldAlert,
  ShoppingCart,
  CheckCircle2,
  Plus,
  Pill,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getAllPriceComparisons } from '../services/pharmacyData';
import type { MedicationEntry, PharmacyProduct } from '../types';
import './PriceComparison.css';

export function PriceComparison() {
  const navigate = useNavigate();
  const { state, addToCart } = useApp();
  const { prescriptions } = state;

  const [addedItemMap, setAddedItemMap] = useState<Record<string, boolean>>({});

  // Collect verified clear medications from all active prescriptions
  const verifiedMeds: MedicationEntry[] = [];
  for (const rx of prescriptions) {
    if (rx.status === 'active' && rx.verified?.medications) {
      for (const m of rx.verified.medications) {
        if (!m.unclear) {
          verifiedMeds.push(m);
        }
      }
    }
  }

  // Fallback demo medications if user navigates here before scanning
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

  const comparisons = getAllPriceComparisons(effectiveMeds);

  const handleAddToCart = (product: PharmacyProduct) => {
    addToCart(product, 1);
    setAddedItemMap(prev => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedItemMap(prev => ({ ...prev, [product.id]: false }));
    }, 2000);
  };

  return (
    <main className="page-content price-compare-page">
      <div className="container">
        
        {/* Header */}
        <header className="compare-header animate-fade-in">
          <div>
            <p className="section-label">Smart Transparency</p>
            <h1>Medicine Price Comparison ⚖️</h1>
            <p className="compare-subtitle">
              Compare exact prescribed medicine costs across licensed local and delivery pharmacies.
            </p>
          </div>

          <button
            id="go-to-cart-btn"
            className="btn btn-primary"
            onClick={() => navigate('/cart')}
          >
            <ShoppingCart size={18} aria-hidden="true" />
            <span>Go to My Cart</span>
          </button>
        </header>

        {/* Demo Data & Clinical Equivalence Notice */}
        <div className="demo-banner animate-fade-in" role="note">
          <ShieldAlert size={18} aria-hidden="true" />
          <span>
            <strong>DEMO DATA & CLINICAL SAFETY NOTICE:</strong> All listed prices and delivery charges are synthetic models. We only compare genuine clinically equivalent formulations from certified pharmaceutical catalogues. Never change prescribed medications without consulting a licensed physician or pharmacist.
          </span>
        </div>

        {/* Comparison Tables per Prescribed Medicine */}
        <div className="comparison-groups-list stagger">
          {comparisons.map(({ medication, offers, bestOffer }) => (
            <section
              key={medication.id}
              className="card medicine-compare-card"
              aria-labelledby={`med-heading-${medication.id}`}
            >
              <div className="med-compare-title-row">
                <div className="med-title-left">
                  <div className="med-pill-icon-wrap" aria-hidden="true">
                    <Pill size={22} />
                  </div>
                  <div>
                    <h2 id={`med-heading-${medication.id}`} className="med-compare-name">
                      {medication.medicineName} {medication.strength}
                    </h2>
                    <p className="med-compare-meta">
                      Prescribed dose: {medication.dose ?? '1 unit'} · {medication.frequency ?? 'Daily'}
                    </p>
                  </div>
                </div>

                <div className="best-price-badge-wrap">
                  <span className="badge badge-success best-badge">
                    <Sparkles size={14} aria-hidden="true" />
                    Lowest Total: ₹{bestOffer.totalPayable.toFixed(2)} at {bestOffer.pharmacyName}
                  </span>
                </div>
              </div>

              {/* Table / Responsive Grid of Stores */}
              <div className="stores-comparison-table-wrap">
                <table className="compare-table" role="table">
                  <thead>
                    <tr>
                      <th scope="col">Pharmacy Store</th>
                      <th scope="col">Pack Size & Form</th>
                      <th scope="col">Medicine Price</th>
                      <th scope="col">Delivery Fee</th>
                      <th scope="col" className="total-col-head">Total Payable</th>
                      <th scope="col">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {offers.map((offer, idx) => {
                      const isBest = idx === 0;
                      const isAdded = addedItemMap[offer.id];
                      return (
                        <tr
                          key={offer.id}
                          className={`compare-row ${isBest ? 'compare-row--best' : ''}`}
                        >
                          <td>
                            <div className="store-cell">
                              <span className="store-cell-name">{offer.pharmacyName}</span>
                              {isBest && (
                                <span className="best-tag">⭐ Lowest Total</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <span className="pack-cell">{offer.packInfo} ({offer.dosageForm})</span>
                          </td>
                          <td>
                            <span className="price-cell">₹{offer.price.toFixed(2)}</span>
                          </td>
                          <td>
                            <span className="fee-cell">₹{offer.deliveryFee.toFixed(2)}</span>
                          </td>
                          <td>
                            <span className={`total-cell ${isBest ? 'total-cell--best' : ''}`}>
                              ₹{offer.totalPayable.toFixed(2)}
                            </span>
                          </td>
                          <td>
                            <button
                              id={`add-compare-${offer.id}`}
                              type="button"
                              className={`btn btn-sm ${isBest ? 'btn-success' : 'btn-secondary'}`}
                              onClick={() => handleAddToCart(offer)}
                            >
                              {isAdded ? (
                                <>
                                  <CheckCircle2 size={14} aria-hidden="true" />
                                  <span>Added</span>
                                </>
                              ) : (
                                <>
                                  <Plus size={14} aria-hidden="true" />
                                  <span>Add to Cart</span>
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>

      </div>
    </main>
  );
}
