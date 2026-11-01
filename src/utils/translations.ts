import type { AppLanguage, MedicationTiming } from '../types';

export const TRANSLATIONS: Record<AppLanguage, Record<string, string>> = {
  en: {
    // Brand & Header
    'brand.name': 'RX-AID',
    'brand.tagline': 'Intelligent Prescription Assistance for Every Caregiver',
    'nav.home': 'Home',
    'nav.scan': 'Scan Prescription',
    'nav.medicines': 'My Medicines',
    'nav.pharmacies': 'Pharmacy Stores',
    'nav.compare': 'Price Comparison',
    'nav.cart': 'My Cart',
    'nav.orders': 'My Orders',
    'nav.profile': 'My Profile',
    'nav.login': 'Sign In',
    'nav.logout': 'Sign Out',

    // Timings
    'timing.morning': 'Morning Medicine',
    'timing.afternoon': 'Afternoon Medicine',
    'timing.evening': 'Evening Medicine',
    'timing.night': 'Bedtime Medicine',

    // Dashboard
    'dashboard.welcome': 'Welcome back,',
    'dashboard.greeting_sub': 'Let us care for your family together today.',
    'dashboard.scan_btn': 'Scan New Prescription',
    'dashboard.todays_medicines': "Today's Medication Routine",
    'dashboard.adherence': 'Medication Adherence',
    'dashboard.taken': 'Taken',
    'dashboard.missed': 'Missed',
    'dashboard.pending': 'Scheduled',
    'dashboard.mark_taken': 'I took this',
    'dashboard.mark_missed': 'Missed dose',
    'dashboard.mark_skip': 'Skip for now',

    // Scanner
    'scanner.title': 'Upload Doctor’s Prescription',
    'scanner.subtitle': 'Take a clear photo or choose a picture. Our friendly AI will read the medicines for you.',
    'scanner.sample_btn': '✨ Try Example Prescription',
    'scanner.analyse_btn': 'Read Prescription with Gemini AI',
    'scanner.drop_text': 'Click here or drop your prescription photo',

    // Verification
    'verify.title': 'Review Prescription with Care',
    'verify.subtitle': 'Please check if these medicine names and timings match what the doctor wrote.',
    'verify.warning_unclear': 'Some handwriting was difficult to read. Please check with your doctor or pharmacist.',
    'verify.activate_btn': 'Confirm & Save Schedule',

    // Pharmacy & Cart
    'pharmacy.title': 'Verified Pharmacy Stores',
    'pharmacy.subtitle': 'Explore reliable pharmacies for your verified medicines. Compare prices and order home delivery.',
    'pharmacy.select_store': 'Select This Store',
    'pharmacy.selected': 'Currently Selected',
    'cart.title': 'Your Medicine Cart',
    'cart.empty': 'Your cart is empty. Explore medicines from your verified prescriptions!',
    'cart.checkout': 'Proceed to Order Review',
    'cart.home_delivery': 'Home Delivery',
    'cart.store_pickup': 'Store Pickup',
    'cart.total': 'Total to Pay',

    // Price Comparison
    'compare.title': 'Medicine Price Comparison',
    'compare.subtitle': 'Compare exact prescribed medicine prices across trusted local and online pharmacies.',
    'compare.lowest_badge': '⭐ Lowest Total Price',
    'compare.add_cart': 'Add to Cart',

    // Orders
    'orders.title': 'My Medicine Orders',
    'orders.empty': 'No orders yet. Verified medicines can be ordered anytime with home delivery.',

    // Language Toggle
    'lang.switch': 'తెలుగు (Telugu)',
  },
  te: {
    // Brand & Header
    'brand.name': 'ఆర్ఎక్స్-ఎయిడ్',
    'brand.tagline': 'కుటుంబ సంరక్షకులకు సులభమైన ప్రిస్క్రిప్షన్ సహాయం',
    'nav.home': 'హోమ్',
    'nav.scan': 'ప్రిస్క్రిప్షన్ స్కాన్',
    'nav.medicines': 'నా మందులు',
    'nav.pharmacies': 'మందుల షాపులు',
    'nav.compare': 'ధరల పోలిక',
    'nav.cart': 'నా కార్ట్',
    'nav.orders': 'నా ఆర్డర్లు',
    'nav.profile': 'నా ప్రొఫైల్',
    'nav.login': 'లాగిన్ అవ్వండి',
    'nav.logout': 'లాగౌట్',

    // Timings
    'timing.morning': 'ఉదయం మందులు',
    'timing.afternoon': 'మధ్యాహ్నం మందులు',
    'timing.evening': 'సాయంత్రం మందులు',
    'timing.night': 'రాత్రి పడుకునే ముందు మందులు',

    // Dashboard
    'dashboard.welcome': 'స్వాగతం,',
    'dashboard.greeting_sub': 'ఈ రోజు మీ కుటుంబ సభ్యుల ఆరోగ్యాన్ని జాగ్రత్తగా చూసుకుందాం.',
    'dashboard.scan_btn': 'కొత్త ప్రిస్క్రిప్షన్ స్కాన్ చేయండి',
    'dashboard.todays_medicines': 'ఈ రోజు వేసుకోవలసిన మందులు',
    'dashboard.adherence': 'మందుల క్రమం',
    'dashboard.taken': 'తీసుకున్నారు',
    'dashboard.missed': 'మిస్ అయ్యారు',
    'dashboard.pending': 'వేసుకోవాలి',
    'dashboard.mark_taken': 'తీసుకున్నాను',
    'dashboard.mark_missed': 'మిస్ అయ్యింది',
    'dashboard.mark_skip': 'ఇప్పుడు వద్దు',

    // Scanner
    'scanner.title': 'డాక్టర్ ప్రిస్క్రిప్షన్ ఫోటో తీయండి',
    'scanner.subtitle': 'స్పష్టమైన ఫోటోను ఎంచుకోండి. మన ఏఐ మందుల వివరాలను సులభంగా చదివి చూపుతుంది.',
    'scanner.sample_btn': '✨ నమూనా ప్రిస్క్రిప్షన్ ప్రయత్నించండి',
    'scanner.analyse_btn': 'జెమిని ఏఐతో పరిశీలించండి',
    'scanner.drop_text': 'ఇక్కడ నొక్కి ప్రిస్క్రిప్షన్ ఫోటోను ఎంచుకోండి',

    // Verification
    'verify.title': 'మందుల వివరాలను సరిచూసుకోండి',
    'verify.subtitle': 'డాక్టర్ రాసిన పేర్లు, సమయాలు సరిగ్గా ఉన్నాయో లేదో దయచేసి నిర్ధారించుకోండి.',
    'verify.warning_unclear': 'కొన్ని అక్షరాలు స్పష్టంగా లేవు. డాక్టర్ లేదా ఫార్మసిస్ట్‌ను సంప్రదించండి.',
    'verify.activate_btn': 'నిర్ధారించి షెడ్యూల్ భద్రపరచండి',

    // Pharmacy & Cart
    'pharmacy.title': 'నమ్మకమైన మందుల షాపులు',
    'pharmacy.subtitle': 'మీ మందుల కోసం సరసమైన దుకాణాలను ఎంచుకోండి మరియు ఇంటి వద్దకే తెప్పించుకోండి.',
    'pharmacy.select_store': 'ఈ షాపును ఎంచుకోండి',
    'pharmacy.selected': 'ఎంచుకున్న షాపు',
    'cart.title': 'మీ మందుల కార్ట్',
    'cart.empty': 'కార్ట్ ఖాళీగా ఉంది. మీ ప్రిస్క్రిప్షన్ మందులను కార్ట్‌కు చేర్చండి!',
    'cart.checkout': 'ఆర్డర్ సమీక్షకు వెళ్లండి',
    'cart.home_delivery': 'ఇంటి వద్దకే డెలివరీ',
    'cart.store_pickup': 'దుకాణంలో తీసుకోవడం',
    'cart.total': 'మొత్తం చెల్లించవలసినది',

    // Price Comparison
    'compare.title': 'మందుల ధరల పోలిక',
    'compare.subtitle': 'వివిధ దుకాణాల్లో ప్రిస్క్రిప్షన్ మందుల ధరలను సులభంగా పోల్చండి.',
    'compare.lowest_badge': '⭐ అత్యంత తక్కువ మొత్తం ధర',
    'compare.add_cart': 'కార్ట్‌కు చేర్చండి',

    // Orders
    'orders.title': 'నా మందుల ఆర్డర్లు',
    'orders.empty': 'ఇంకా ఎటువంటి ఆర్డర్లు లేవు.',

    // Language Toggle
    'lang.switch': 'English',
  },
};

export function getTimingLabelFriendly(timing: MedicationTiming, lang: AppLanguage = 'en'): string {
  if (lang === 'te') {
    switch (timing) {
      case 'morning': return 'ఉదయం (🌅)';
      case 'afternoon': return 'మధ్యాహ్నం (☀️)';
      case 'evening': return 'సాయంత్రం (🌆)';
      case 'night': return 'రాత్రి (🌙)';
    }
  }
  switch (timing) {
    case 'morning': return 'Morning (🌅)';
    case 'afternoon': return 'Afternoon (☀️)';
    case 'evening': return 'Evening (🌆)';
    case 'night': return 'Bedtime (🌙)';
  }
}
