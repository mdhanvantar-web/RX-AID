import type { PharmacyStore, PharmacyProduct, MedicationEntry } from '../types';

export const PHARMACY_STORES: PharmacyStore[] = [
  {
    id: 'store-apollo',
    name: 'Apollo Pharmacy',
    tagline: 'Trusted 24x7 Healthcare Partner',
    rating: 4.8,
    reviewCount: 3420,
    deliveryFee: 25,
    freeDeliveryThreshold: 500,
    estDeliveryTime: '30-45 mins',
    isHomeDeliveryAvailable: true,
    address: 'Shop 4, Main Road, Somajiguda, Hyderabad',
    phone: '+91 40 2345 6789',
    badge: 'Popular',
  },
  {
    id: 'store-medplus',
    name: 'MedPlus Health Services',
    tagline: 'Reliable Neighbourhood Medicine Store',
    rating: 4.7,
    reviewCount: 2190,
    deliveryFee: 20,
    freeDeliveryThreshold: 400,
    estDeliveryTime: '45-60 mins',
    isHomeDeliveryAvailable: true,
    address: 'Near Clock Tower, MG Road, Secunderabad',
    phone: '+91 40 2789 1234',
    badge: 'Best Value',
  },
  {
    id: 'store-tata1mg',
    name: 'Tata 1mg Care',
    tagline: 'Genuine Medicines with Lab Assurance',
    rating: 4.9,
    reviewCount: 5120,
    deliveryFee: 15,
    freeDeliveryThreshold: 600,
    estDeliveryTime: '2-4 hours',
    isHomeDeliveryAvailable: true,
    address: 'Hub Centre, Hitec City, Hyderabad',
    phone: '+91 1800 212 232',
    badge: 'Top Rated',
  },
  {
    id: 'store-netmeds',
    name: 'Netmeds Express',
    tagline: 'Direct-to-Home Prescription Delivery',
    rating: 4.6,
    reviewCount: 1850,
    deliveryFee: 30,
    freeDeliveryThreshold: 500,
    estDeliveryTime: 'Same Day (by 6 PM)',
    isHomeDeliveryAvailable: true,
    address: 'Kukatpally Housing Board, Hyderabad',
    phone: '+91 1800 103 0304',
  },
  {
    id: 'store-local',
    name: 'Sri Rama Chemist & Druggist',
    tagline: 'Your Friendly Local Tier-2 Community Chemist',
    rating: 4.9,
    reviewCount: 420,
    deliveryFee: 10,
    freeDeliveryThreshold: 300,
    estDeliveryTime: '15-25 mins',
    isHomeDeliveryAvailable: true,
    address: 'Opposite Community Hall, Station Road, Warangal',
    phone: '+91 870 245 8899',
    badge: 'Fastest Local',
  },
];

// Price database for known prescription medications across pharmacies
interface MedCatalogItem {
  baseName: string;
  strength: string;
  dosageForm: string;
  packInfo: string;
  manufacturer: string;
  storePrices: Record<string, number>; // pharmacyId -> price
}

const CATALOG_ITEMS: MedCatalogItem[] = [
  {
    baseName: 'Metformin',
    strength: '500mg',
    dosageForm: 'Oral Tablet',
    packInfo: 'Strip of 10 tablets',
    manufacturer: 'Glycomet (USV Ltd)',
    storePrices: {
      'store-apollo': 24.50,
      'store-medplus': 22.00,
      'store-tata1mg': 21.50,
      'store-netmeds': 23.00,
      'store-local': 20.00,
    },
  },
  {
    baseName: 'Amlodipine',
    strength: '5mg',
    dosageForm: 'Oral Tablet',
    packInfo: 'Strip of 15 tablets',
    manufacturer: 'Amlip (Cipla Ltd)',
    storePrices: {
      'store-apollo': 42.00,
      'store-medplus': 39.50,
      'store-tata1mg': 38.00,
      'store-netmeds': 41.00,
      'store-local': 37.50,
    },
  },
  {
    baseName: 'Atorvastatin',
    strength: '10mg',
    dosageForm: 'Oral Tablet',
    packInfo: 'Strip of 10 tablets',
    manufacturer: 'Atorva (Zydus Cadila)',
    storePrices: {
      'store-apollo': 98.00,
      'store-medplus': 92.00,
      'store-tata1mg': 89.00,
      'store-netmeds': 94.00,
      'store-local': 88.00,
    },
  },
  {
    baseName: 'Telmisartan',
    strength: '40mg',
    dosageForm: 'Oral Tablet',
    packInfo: 'Strip of 15 tablets',
    manufacturer: 'Telma (Glenmark)',
    storePrices: {
      'store-apollo': 92.00,
      'store-medplus': 88.00,
      'store-tata1mg': 85.00,
      'store-netmeds': 90.00,
      'store-local': 84.00,
    },
  },
  {
    baseName: 'Pantoprazole',
    strength: '40mg',
    dosageForm: 'Oral Tablet',
    packInfo: 'Strip of 15 tablets',
    manufacturer: 'Pan 40 (Alkem)',
    storePrices: {
      'store-apollo': 110.00,
      'store-medplus': 104.00,
      'store-tata1mg': 99.00,
      'store-netmeds': 107.00,
      'store-local': 98.00,
    },
  },
  {
    baseName: 'Levothyroxine',
    strength: '50mcg',
    dosageForm: 'Oral Tablet',
    packInfo: 'Strip of 30 tablets',
    manufacturer: 'Thyronorm (Abbott)',
    storePrices: {
      'store-apollo': 96.00,
      'store-medplus': 92.00,
      'store-tata1mg': 89.00,
      'store-netmeds': 94.00,
      'store-local': 88.00,
    },
  },
  {
    baseName: 'Paracetamol',
    strength: '650mg',
    dosageForm: 'Oral Tablet',
    packInfo: 'Strip of 15 tablets',
    manufacturer: 'Dolo 650 (Micro Labs)',
    storePrices: {
      'store-apollo': 38.00,
      'store-medplus': 35.00,
      'store-tata1mg': 33.00,
      'store-netmeds': 36.00,
      'store-local': 32.00,
    },
  },
  {
    baseName: 'Cetirizine',
    strength: '10mg',
    dosageForm: 'Oral Tablet',
    packInfo: 'Strip of 10 tablets',
    manufacturer: 'Cetzine (GSK)',
    storePrices: {
      'store-apollo': 32.00,
      'store-medplus': 29.00,
      'store-tata1mg': 27.00,
      'store-netmeds': 30.00,
      'store-local': 26.00,
    },
  },
  {
    baseName: 'Losartan',
    strength: '50mg',
    dosageForm: 'Oral Tablet',
    packInfo: 'Strip of 10 tablets',
    manufacturer: 'Losar (Unichem)',
    storePrices: {
      'store-apollo': 58.00,
      'store-medplus': 54.00,
      'store-tata1mg': 51.00,
      'store-netmeds': 56.00,
      'store-local': 50.00,
    },
  },
  {
    baseName: 'Metoprolol',
    strength: '25mg',
    dosageForm: 'Oral Tablet',
    packInfo: 'Strip of 15 tablets',
    manufacturer: 'Metolar XR (Cipla)',
    storePrices: {
      'store-apollo': 82.00,
      'store-medplus': 78.00,
      'store-tata1mg': 75.00,
      'store-netmeds': 80.00,
      'store-local': 74.00,
    },
  },
  {
    baseName: 'Amoxicillin',
    strength: '500mg',
    dosageForm: 'Oral Capsule',
    packInfo: 'Strip of 10 capsules',
    manufacturer: 'Mox (Sun Pharma)',
    storePrices: {
      'store-apollo': 105.00,
      'store-medplus': 99.00,
      'store-tata1mg': 95.00,
      'store-netmeds': 102.00,
      'store-local': 94.00,
    },
  },
  {
    baseName: 'Azithromycin',
    strength: '500mg',
    dosageForm: 'Oral Tablet',
    packInfo: 'Strip of 5 tablets',
    manufacturer: 'Azithral (Alembic)',
    storePrices: {
      'store-apollo': 118.00,
      'store-medplus': 112.00,
      'store-tata1mg': 108.00,
      'store-netmeds': 115.00,
      'store-local': 106.00,
    },
  },
  {
    baseName: 'Montelukast',
    strength: '10mg',
    dosageForm: 'Oral Tablet',
    packInfo: 'Strip of 10 tablets',
    manufacturer: 'Montair (Cipla)',
    storePrices: {
      'store-apollo': 125.00,
      'store-medplus': 118.00,
      'store-tata1mg': 114.00,
      'store-netmeds': 121.00,
      'store-local': 112.00,
    },
  },
  {
    baseName: 'Glimepiride',
    strength: '2mg',
    dosageForm: 'Oral Tablet',
    packInfo: 'Strip of 10 tablets',
    manufacturer: 'Amaryl (Sanofi)',
    storePrices: {
      'store-apollo': 74.00,
      'store-medplus': 70.00,
      'store-tata1mg': 67.00,
      'store-netmeds': 72.00,
      'store-local': 66.00,
    },
  },
  {
    baseName: 'Vitamin D3',
    strength: '60000IU',
    dosageForm: 'Oral Granules',
    packInfo: 'Sachet of 4 granules',
    manufacturer: 'Uprise D3 (Alkem)',
    storePrices: {
      'store-apollo': 42.00,
      'store-medplus': 39.00,
      'store-tata1mg': 37.00,
      'store-netmeds': 41.00,
      'store-local': 36.00,
    },
  },
];

/**
 * Catalog prices are for one specific strength. Only use a catalog offer when
 * the verified prescription states the same strength; otherwise fall back to
 * the prescribed medicine details. This prevents the UI from implying that a
 * different strength is the prescribed product.
 */
function findCatalogMatch(med: MedicationEntry): MedCatalogItem | undefined {
  const prescribedStrength = (med.strength ?? '').toLowerCase().replace(/\s+/g, '');
  if (!prescribedStrength) return undefined;
  return CATALOG_ITEMS.find(
    item =>
      med.medicineName.toLowerCase().includes(item.baseName.toLowerCase()) &&
      item.strength.toLowerCase().replace(/\s+/g, '') === prescribedStrength
  );
}

export function getProductsForStore(pharmacyId: string, verifiedMeds: MedicationEntry[]): PharmacyProduct[] {
  const store = PHARMACY_STORES.find(s => s.id === pharmacyId) || PHARMACY_STORES[0];
  const products: PharmacyProduct[] = [];

  for (const med of verifiedMeds) {
    if (med.unclear) continue; // safety rule: never sell unclear items

    const match = findCatalogMatch(med);

    if (match) {
      const price = match.storePrices[store.id] ?? 35.00;
      const deliveryFee = store.deliveryFee;
      products.push({
        id: `prod-${store.id}-${med.id}`,
        pharmacyId: store.id,
        pharmacyName: store.name,
        medicineName: `${match.baseName} (${match.manufacturer})`,
        strength: match.strength,
        dosageForm: match.dosageForm,
        packInfo: match.packInfo,
        price,
        deliveryFee,
        totalPayable: price + deliveryFee,
        inStock: true,
        prescriptionRequired: true,
        manufacturer: match.manufacturer,
      });
    } else {
      // Fallback for custom verified medicines
      const price = 45.00;
      products.push({
        id: `prod-${store.id}-${med.id}`,
        pharmacyId: store.id,
        pharmacyName: store.name,
        medicineName: med.medicineName,
        strength: med.strength ?? 'Prescribed Strength',
        dosageForm: 'Tablet / Capsule',
        packInfo: 'Standard prescription pack',
        price,
        deliveryFee: store.deliveryFee,
        totalPayable: price + store.deliveryFee,
        inStock: true,
        prescriptionRequired: true,
      });
    }
  }

  return products;
}

export function getAllPriceComparisons(verifiedMeds: MedicationEntry[]): Array<{
  medication: MedicationEntry;
  offers: PharmacyProduct[];
  bestOffer: PharmacyProduct;
}> {
  const results: Array<{
    medication: MedicationEntry;
    offers: PharmacyProduct[];
    bestOffer: PharmacyProduct;
  }> = [];

  for (const med of verifiedMeds) {
    if (med.unclear) continue;

    const offers: PharmacyProduct[] = [];

    for (const store of PHARMACY_STORES) {
      const match = findCatalogMatch(med);

      const price = match ? (match.storePrices[store.id] ?? 35.00) : 40.00;
      const deliveryFee = store.deliveryFee;
      const totalPayable = price + deliveryFee;

      offers.push({
        id: `comp-${store.id}-${med.id}`,
        pharmacyId: store.id,
        pharmacyName: store.name,
        medicineName: match ? `${match.baseName} (${match.manufacturer})` : med.medicineName,
        strength: match ? match.strength : (med.strength ?? 'As Prescribed'),
        dosageForm: match ? match.dosageForm : 'Oral Dose',
        packInfo: match ? match.packInfo : 'Prescription Pack',
        price,
        deliveryFee,
        totalPayable,
        inStock: true,
        prescriptionRequired: true,
        manufacturer: match?.manufacturer,
      });
    }

    // Sort by TOTAL payable price ascending (highlight lowest total payable amount)
    offers.sort((a, b) => a.totalPayable - b.totalPayable);

    if (offers.length > 0) {
      results.push({
        medication: med,
        offers,
        bestOffer: offers[0],
      });
    }
  }

  return results;
}
