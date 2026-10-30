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
];

export function getProductsForStore(pharmacyId: string, verifiedMeds: MedicationEntry[]): PharmacyProduct[] {
  const store = PHARMACY_STORES.find(s => s.id === pharmacyId) || PHARMACY_STORES[0];
  const products: PharmacyProduct[] = [];

  for (const med of verifiedMeds) {
    if (med.unclear) continue; // safety rule: never sell unclear items

    const match = CATALOG_ITEMS.find(item =>
      med.medicineName.toLowerCase().includes(item.baseName.toLowerCase())
    );

    if (match) {
      const price = match.storePrices[store.id] ?? 35.00;
      const deliveryFee = store.deliveryFee;
      products.push({
        id: `prod-${store.id}-${match.baseName.toLowerCase()}`,
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
      const match = CATALOG_ITEMS.find(item =>
        med.medicineName.toLowerCase().includes(item.baseName.toLowerCase())
      );

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
