/**
 * Kenya Crop Health AI — production frontend
 * Plain SPA preserving the existing backend API contracts.
 */

'use strict';

const state = {
  token: localStorage.getItem('token') || null,
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  lang: ['en', 'sw', 'hi', 'ta'].includes(localStorage.getItem('lang')) ? localStorage.getItem('lang') : 'en',
  i18n: {},
  currentRoute: '#/',
  routeParams: {},
  notificationsCount: 0,
  charts: [],
  previewObjectUrl: null,
};

let cameraStream = null;
let capturedCameraFile = null;

const KENYA_COUNTIES = {
  "Nakuru": [-0.3031, 36.0800],
  "Nyandarua": [-0.1804, 36.5230],
  "Kiambu": [-1.1714, 36.8356],
  "Trans Nzoia": [1.0566, 34.9528],
  "Uasin Gishu": [0.5143, 35.2698],
  "Kirinyaga": [-0.5000, 37.3333],
  "Machakos": [-1.5177, 37.2634],
  "Kajiado": [-1.8500, 36.7833],
  "Bungoma": [0.5695, 34.5584],
  "Kakamega": [0.2827, 34.7519],
  "Nandi": [0.1836, 35.1269],
  "Bomet": [-0.7813, 35.3416],
  "Kericho": [-0.3677, 35.2831],
  "Kisii": [-0.6817, 34.7667],
  "Meru": [0.0463, 37.6559],
  "Nairobi": [-1.2921, 36.8219],
  "Murang'a": [-0.7167, 37.1500],
  "Embu": [-0.5333, 37.4500],
  "Kilifi": [-3.5107, 39.9093],
  "Kisumu": [-0.0917, 34.7680]
};

const DEFAULT_I18N = {
  nav: {
    home: 'Home', dashboard: 'Dashboard', scan: 'Scan Crop', farms: 'Farms',
    history: 'History', follow_ups: 'Follow-ups', notifications: 'Notifications',
    profile: 'Profile', expert: 'Expert Review', admin: 'Admin', login: 'Sign In',
    register: 'Register', logout: 'Sign Out'
  },
  headers: {
    what_to_do_now: 'What to do now', prevention: 'Prevention', monitoring: 'Monitoring',
    escalation: 'When to get expert help', kenya_notes: 'Kenya field notes', sources: 'Sources', feedback: 'Was this result useful?'
  },
  feedback: {
    helpful_question: 'Did this recommendation help you decide what to do?',
    yes: 'Yes', no: 'No', not_sure: 'Not sure', outcome_question: 'How is the crop now?',
    improved: 'Improving', unchanged: 'Unchanged', worsened: 'Worsening', submit: 'Submit feedback',
    submitted: 'Thank you for your feedback!'
  },
  stats: { no_scans_yet: 'No scans yet' },
  disclaimer_text: 'AI screening supports early detection and does not replace professional agricultural advice. Consult an extension officer before major treatment decisions.'
};

const ICONS = {
  dashboard: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
  scan: '<path d="M4 7V5a2 2 0 0 1 2-2h2"/><path d="M16 3h2a2 2 0 0 1 2 2v2"/><path d="M20 17v2a2 2 0 0 1-2 2h-2"/><path d="M8 21H6a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="3.5"/>',
  farms: '<path d="M3 21h18"/><path d="M5 21V9l7-5 7 5v12"/><path d="M9 21v-7h6v7"/>',
  history: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  tasks: '<rect x="4" y="4" width="16" height="17" rx="2"/><path d="M8 2v4M16 2v4M4 9h16"/><path d="m9 14 2 2 4-5"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
  profile: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.4-4 4.2-6 8-6s6.6 2 8 6"/>',
  home: '<path d="m3 11 9-8 9 8"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
  login: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="m10 17 5-5-5-5"/><path d="M15 12H3"/>',
  register: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
  leaf: '<path d="M20 4C10 5 4 11 4 20c8 0 16-6 16-16Z"/><path d="M4 20C9 14 14 9 20 4"/>',
  warning: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  check: '<path d="m20 6-11 11-5-5"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  arrow: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
  camera: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2Z"/><circle cx="12" cy="13" r="4"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/>',
  chart: '<path d="M3 3v18h18"/><path d="M8 17v-6"/><path d="M13 17V7"/><path d="M18 17v-3"/>',
  map: '<path d="M9 20 3 17V4l6 3 6-3 6 3v13l-6-3-6 3Z"/><path d="M9 7v13"/><path d="M15 4v13"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9"/><path d="M16 3.1a4 4 0 0 1 0 7.8"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>',
  sprout: '<path d="M7 20h10"/><path d="M12 20v-9"/><path d="M12 11C7 11 4 8 4 4c4 0 7 2 8 7Z"/><path d="M12 11c0-5 3-8 8-8 0 5-3 8-8 8Z"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
  refresh: '<path d="M21 12a9 9 0 0 0-15.5-6.2L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 15.5 6.2L21 16"/><path d="M21 21v-5h-5"/>',
  plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
  eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z"/><circle cx="12" cy="12" r="3"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  message: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z"/>',
  microscope: '<path d="M6 18h8"/><path d="M3 22h18"/><path d="M14 22v-4a2 2 0 0 0-2-2v0a7 7 0 0 1-7-7V3"/><path d="M9 3h6"/><path d="M12 3v6"/><path d="m18 9 3-3"/><path d="m15 12 3 3"/>'
};

function icon(name, size = 18) {
  const body = ICONS[name] || ICONS.leaf;
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}

function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function safeUrl(value) {
  const raw = String(value || '').trim();
  return /^https?:\/\//i.test(raw) ? esc(raw) : '#';
}

function formatNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? new Intl.NumberFormat(langInfo().locale).format(n) : '0';
}

function formatPercent(value, alreadyPercent = false) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 'N/A';
  const n = Number(value);
  const pct = alreadyPercent || n > 1 ? n : n * 100;
  return `${pct.toFixed(1)}%`;
}

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(langInfo().locale, { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(langInfo().locale, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}


/* ---------- languages: English, Kiswahili, Hindi, Tamil ---------- */
const LANGS = [
  { code: 'en', short: 'EN', name: 'English', locale: 'en-KE', toast: 'Language changed to English' },
  { code: 'sw', short: 'SW', name: 'Kiswahili', locale: 'sw-KE', toast: 'Lugha imebadilishwa kuwa Kiswahili' },
  { code: 'hi', short: 'हि', name: 'हिन्दी', locale: 'hi-IN', toast: 'भाषा हिन्दी में बदल गई' },
  { code: 'ta', short: 'த', name: 'தமிழ்', locale: 'ta-IN', toast: 'மொழி தமிழாக மாற்றப்பட்டது' }
];
const EXTRA_TR = {"Maize":["मक्का","மக்காச்சோளம்"],"Potato":["आलू","உருளைக்கிழங்கு"],"Tomato":["टमाटर","தக்காளி"],"Leaf":["पत्ती","இலை"],"Unknown":["अज्ञात","தெரியவில்லை"],"Healthy":["स्वस्थ","ஆரோக்கியமானது"],"Below threshold":["सीमा से कम","வரம்புக்குக் கீழே"],"High confidence":["उच्च विश्वास","அதிக நம்பிக்கை"],"Confident":["भरोसेमंद","நம்பகமானது"],"Low confidence":["कम विश्वास","குறைந்த நம்பிக்கை"],"Signed out":["साइन आउट हो गया","வெளியேறிவிட்டீர்கள்"],"AI-powered crop disease detection for Kenya":["केन्या के लिए AI आधारित फसल रोग पहचान","கென்யாவிற்கான AI அடிப்படையிலான பயிர் நோய் கண்டறிதல்"],"Healthier crops. Stronger farmers. A greener Kenya.":["स्वस्थ फसलें। मजबूत किसान। एक हरा-भरा केन्या।","ஆரோக்கியமான பயிர்கள். வலிமையான விவசாயிகள். பசுமையான கென்யா."],"Photograph a leaf, receive confidence-aware screening, Kenya-grounded agronomic guidance, and recovery follow-up in one trusted platform.":["पत्ती की फोटो लें और एक भरोसेमंद मंच पर विश्वास-स्तर सहित जाँच, केन्या की खेती के अनुरूप सलाह और सुधार की निगरानी पाएँ।","இலையைப் படம் எடுங்கள்; நம்பிக்கை அளவுடன் கூடிய பரிசோதனை, கென்யா வயல் நிலைக்கேற்ற வேளாண் ஆலோசனை, மீட்பு கண்காணிப்பு ஆகியவற்றை ஒரே நம்பகமான தளத்தில் பெறுங்கள்."],"Scan a Crop":["फसल स्कैन करें","பயிரை ஸ்கேன் செய்யுங்கள்"],"Open Dashboard":["डैशबोर्ड खोलें","டாஷ்போர்டைத் திறக்கவும்"],"Sign In":["साइन इन करें","உள்நுழைக"],"Registered farmers":["पंजीकृत किसान","பதிவு செய்த விவசாயிகள்"],"Crop scans":["फसल स्कैन","பயிர் ஸ்கேன்கள்"],"Supported crops":["समर्थित फसलें","ஆதரிக்கப்படும் பயிர்கள்"],"Live platform statistics are temporarily unavailable.":["लाइव प्लेटफ़ॉर्म आँकड़े अभी उपलब्ध नहीं हैं।","நேரடி தள புள்ளிவிவரங்கள் தற்காலிகமாகக் கிடைக்கவில்லை."],"The platform is ready for early field deployment and farmer onboarding.":["प्लेटफ़ॉर्म शुरुआती क्षेत्र उपयोग और किसानों को जोड़ने के लिए तैयार है।","தளம் ஆரம்பகால வயல் பயன்பாட்டுக்கும் விவசாயிகளை இணைப்பதற்கும் தயாராக உள்ளது."],"Scan Result":["स्कैन परिणाम","ஸ்கேன் முடிவு"],"Disease detected":["रोग पाया गया","நோய் கண்டறியப்பட்டது"],"Field workflow":["खेत का कार्यप्रवाह","வயல் பணிப்போக்கு"],"From field photo to the right action":["खेत की फोटो से सही कदम तक","வயல் புகைப்படத்திலிருந்து சரியான நடவடிக்கை வரை"],"Capture leaf":["पत्ती की फोटो लें","இலையைப் படமெடுக்கவும்"],"Use the phone camera or upload a sharp leaf photo.":["फ़ोन कैमरे से फोटो लें या साफ़ पत्ती की फोटो अपलोड करें।","தொலைபேசி கேமராவைப் பயன்படுத்துங்கள் அல்லது தெளிவான இலைப் படத்தைப் பதிவேற்றுங்கள்."],"AI screening":["AI जाँच","AI பரிசோதனை"],"Receive prediction, confidence, severity, and Grad-CAM explanation.":["अनुमान, विश्वास-स्तर, गंभीरता और Grad-CAM स्पष्टीकरण प्राप्त करें।","கணிப்பு, நம்பிக்கை அளவு, தீவிரம் மற்றும் Grad-CAM விளக்கத்தைப் பெறுங்கள்."],"Act locally":["स्थानीय स्तर पर कदम उठाएँ","உள்ளூர் நிலைக்கேற்ப செயல்படுங்கள்"],"Management and prevention steps grounded in Kenyan field conditions.":["केन्या की खेत परिस्थितियों पर आधारित प्रबंधन और रोकथाम के उपाय।","கென்யா வயல் நிலைமைகளை அடிப்படையாகக் கொண்ட மேலாண்மை மற்றும் தடுப்பு வழிமுறைகள்."],"Monitor recovery":["सुधार की निगरानी करें","மீட்சியைக் கண்காணியுங்கள்"],"Complete reminders and record whether symptoms improve.":["अनुस्मारक पूरे करें और दर्ज करें कि लक्षणों में सुधार हुआ या नहीं।","நினைவூட்டல்களை முடித்து, அறிகுறிகள் மேம்பட்டனவா என்பதைப் பதிவு செய்யுங்கள்."],"Maize, Irish potato, and tomato":["मक्का, आलू और टमाटर","மக்காச்சோளம், உருளைக்கிழங்கு மற்றும் தக்காளி"],"Focused on priority food-security and income crops for Kenyan smallholder farmers.":["केन्या के छोटे किसानों के लिए खाद्य सुरक्षा और आय की प्रमुख फसलों पर केंद्रित।","கென்யாவின் சிறு விவசாயிகளுக்கு உணவுப் பாதுகாப்பு மற்றும் வருமானம் தரும் முக்கிய பயிர்களில் கவனம் செலுத்துகிறது."],"Confidence-aware by design":["विश्वास-स्तर के साथ बनाया गया","நம்பிக்கை அளவை கருத்தில் கொண்ட வடிவமைப்பு"],"Uncertain results are clearly flagged instead of forcing a diagnosis.":["अनिश्चित परिणाम को जबरन निदान बनाने के बजाय साफ़ चिह्नित किया जाता है।","உறுதியற்ற முடிவுகளை கட்டாயமாக நோய் என்று கூறாமல் தெளிவாகக் குறிப்பிடுகிறோம்."],"Explainable predictions":["समझाने योग्य अनुमान","விளக்கக்கூடிய கணிப்புகள்"],"Grad-CAM shows which leaf regions influenced the result.":["Grad-CAM दिखाता है कि पत्ती के किन हिस्सों ने परिणाम को प्रभावित किया।","முடிவை பாதித்த இலையின் பகுதிகளை Grad-CAM காட்டுகிறது."],"Human expert safety net":["मानव विशेषज्ञ का सुरक्षा कवच","மனித நிபுணர் பாதுகாப்பு வலை"],"Extension officers can review queued cases and verify or correct labels.":["विस्तार अधिकारी लंबित मामलों की समीक्षा कर परिणाम की पुष्टि या सुधार कर सकते हैं।","விரிவாக்க அலுவலர்கள் காத்திருக்கும் வழக்குகளை ஆய்வு செய்து முடிவுகளை உறுதிப்படுத்தலாம் அல்லது திருத்தலாம்."],"AI assists — it does not replace agronomic expertise":["AI मदद करता है — यह कृषि विशेषज्ञता की जगह नहीं लेता","AI உதவுகிறது — வேளாண் நிபுணத்துவத்திற்கு மாற்றாகாது"],"Results are based on a single leaf image and may be incorrect. For major treatment decisions or spreading crop loss, consult a qualified extension officer or plant pathologist.":["परिणाम केवल एक पत्ती की फोटो पर आधारित हैं और गलत हो सकते हैं। बड़े उपचार निर्णयों या फसल नुकसान फैलने पर योग्य विस्तार अधिकारी या पादप रोग विशेषज्ञ से सलाह लें।","முடிவுகள் ஒரே ஒரு இலைப் படத்தை அடிப்படையாகக் கொண்டவை; தவறாக இருக்கலாம். பெரிய சிகிச்சை முடிவுகளுக்கு அல்லது பயிர் இழப்பு பரவினால், தகுதியான விரிவாக்க அலுவலர் அல்லது தாவர நோயியல் நிபுணரை அணுகுங்கள்."],"Welcome back to the field":["खेत में आपका फिर स्वागत है","வயலுக்கு மீண்டும் வரவேற்கிறோம்"],"Continue tracking farms, crop scans, and practical agronomic guidance.":["खेतों, फसल स्कैन और व्यावहारिक कृषि सलाह पर नज़र रखना जारी रखें।","பண்ணைகள், பயிர் ஸ்கேன்கள் மற்றும் நடைமுறை வேளாண் ஆலோசனைகளைத் தொடர்ந்து கண்காணியுங்கள்."],"Confidence-aware AI results":["विश्वास-स्तर सहित AI परिणाम","நம்பிக்கை அளவுடன் AI முடிவுகள்"],"Grad-CAM and severity metrics":["Grad-CAM और गंभीरता के माप","Grad-CAM மற்றும் தீவிர அளவீடுகள்"],"Follow-up and expert verification":["फ़ॉलो-अप और विशेषज्ञ सत्यापन","பின்தொடர்தல் மற்றும் நிபுணர் சரிபார்ப்பு"],"Secure account access":["सुरक्षित खाता प्रवेश","பாதுகாப்பான கணக்கு அணுகல்"],"Sign in to your account":["अपने खाते में साइन इन करें","உங்கள் கணக்கில் உள்நுழையுங்கள்"],"Use your phone number and password.":["अपना फ़ोन नंबर और पासवर्ड इस्तेमाल करें।","உங்கள் தொலைபேசி எண் மற்றும் கடவுச்சொல்லைப் பயன்படுத்துங்கள்."],"Phone number":["फ़ोन नंबर","தொலைபேசி எண்"],"Example: +254712345678 or 0712345678":["उदाहरण: +254712345678 या 0712345678","எடுத்துக்காட்டு: +254712345678 அல்லது 0712345678"],"Password":["पासवर्ड","கடவுச்சொல்"],"No account yet?":["अभी तक खाता नहीं है?","இன்னும் கணக்கு இல்லையா?"],"Create one":["खाता बनाएँ","உருவாக்குங்கள்"],"Join the platform":["प्लेटफ़ॉर्म से जुड़ें","தளத்தில் இணையுங்கள்"],"Create your Crop Health AI account":["अपना Crop Health AI खाता बनाएँ","உங்கள் Crop Health AI கணக்கை உருவாக்குங்கள்"],"Register farms, scan crops, and track recovery over time.":["खेत पंजीकृत करें, फसलें स्कैन करें और समय के साथ सुधार पर नज़र रखें।","பண்ணைகளைப் பதிவு செய்யுங்கள், பயிர்களை ஸ்கேன் செய்யுங்கள், காலப்போக்கில் மீட்சியைக் கண்காணியுங்கள்."],"Full name":["पूरा नाम","முழு பெயர்"],"Email":["ईमेल","மின்னஞ்சல்"],"optional":["वैकल्पिक","விருப்பத்திற்குரியது"],"County":["काउंटी","கவுண்டி"],"Select county":["काउंटी चुनें","கவுண்டியைத் தேர்ந்தெடுக்கவும்"],"Your role":["आपकी भूमिका","உங்கள் பங்கு"],"Farmer":["किसान","விவசாயி"],"Extension officer":["विस्तार अधिकारी","விரிவாக்க அலுவலர்"],"Preferred language":["पसंदीदा भाषा","விருப்ப மொழி"],"Create Account":["खाता बनाएँ","கணக்கை உருவாக்கு"],"Already registered?":["पहले से पंजीकृत हैं?","ஏற்கனவே பதிவு செய்துவிட்டீர்களா?"],"Sign in":["साइन इन करें","உள்நுழைக"],"Farm overview":["खेत का अवलोकन","பண்ணை கண்ணோட்டம்"],"Welcome back":["फिर स्वागत है","மீண்டும் வருக"],"Here is your crop health position today":["आज आपकी फसल के स्वास्थ्य की स्थिति यह है","இன்று உங்கள் பயிர் ஆரோக்கிய நிலை இதோ"],"Scan Crop":["फसल स्कैन करें","பயிரை ஸ்கேன் செய்"],"Farms":["खेत","பண்ணைகள்"],"follow-up reminders overdue":["फ़ॉलो-अप अनुस्मारक विलंबित हैं","பின்தொடர்தல் நினைவூட்டல்கள் தாமதமாகியுள்ளன"],"Complete field checks to prevent further spread.":["आगे फैलाव रोकने के लिए खेत की जाँच पूरी करें।","மேலும் பரவாமல் தடுக்க வயல் சோதனைகளை முடியுங்கள்."],"Review":["समीक्षा करें","மதிப்பாய்வு"],"registered":["पंजीकृत","பதிவு செய்யப்பட்டது"],"Crop plots":["फसल प्लॉट","பயிர் நிலங்கள்"],"under monitoring":["निगरानी में","கண்காணிப்பில்"],"Total scans":["कुल स्कैन","மொத்த ஸ்கேன்கள்"],"AI records":["AI रिकॉर्ड","AI பதிவுகள்"],"Active issues":["सक्रिय समस्याएँ","செயலில் உள்ள சிக்கல்கள்"],"requiring action":["कार्रवाई आवश्यक","நடவடிக்கை தேவை"],"Healthy scans":["स्वस्थ स्कैन","ஆரோக்கிய ஸ்கேன்கள்"],"healthy":["स्वस्थ","ஆரோக்கியம்"],"no disease detected":["कोई रोग नहीं मिला","நோய் எதுவும் கண்டறியப்படவில்லை"],"Pending follow-ups":["लंबित फ़ॉलो-अप","நிலுவையில் உள்ள பின்தொடர்தல்கள்"],"overdue":["विलंबित","தாமதம்"],"open reminders":["खुले अनुस्मारक","திறந்த நினைவூட்டல்கள்"],"Detect crop disease with AI":["AI से फसल रोग पहचानें","AI மூலம் பயிர் நோயைக் கண்டறியுங்கள்"],"Add Farm":["खेत जोड़ें","பண்ணை சேர்"],"Register and organize plots":["प्लॉट पंजीकृत करें और व्यवस्थित करें","நிலங்களைப் பதிவு செய்து ஒழுங்குபடுத்துங்கள்"],"View History":["इतिहास देखें","வரலாற்றைப் பார்"],"Review past scans and actions":["पिछले स्कैन और कार्रवाइयाँ देखें","முந்தைய ஸ்கேன்கள் மற்றும் நடவடிக்கைகளைப் பாருங்கள்"],"Recent Scans":["हाल के स्कैन","சமீபத்திய ஸ்கேன்கள்"],"Latest records from your live account":["आपके खाते के नवीनतम रिकॉर्ड","உங்கள் கணக்கின் சமீபத்திய பதிவுகள்"],"View all":["सभी देखें","அனைத்தையும் பார்"],"No scans yet":["अभी तक कोई स्कैन नहीं","இன்னும் ஸ்கேன்கள் இல்லை"],"Start by photographing an affected leaf.":["प्रभावित पत्ती की फोटो लेकर शुरुआत करें।","பாதிக்கப்பட்ட இலையைப் படம் எடுத்து தொடங்குங்கள்."],"Start first scan":["पहला स्कैन शुरू करें","முதல் ஸ்கேனைத் தொடங்குங்கள்"],"Crop Health Trend":["फसल स्वास्थ्य रुझान","பயிர் ஆரோக்கிய போக்கு"],"Last six months · real scan counts":["पिछले छह महीने · वास्तविक स्कैन संख्या","கடந்த ஆறு மாதங்கள் · உண்மையான ஸ்கேன் எண்ணிக்கை"],"No trend yet":["अभी कोई रुझान नहीं","இன்னும் போக்கு இல்லை"],"Trends appear after scans are recorded.":["स्कैन दर्ज होने के बाद रुझान दिखेंगे।","ஸ்கேன்கள் பதிவான பிறகு போக்குகள் தோன்றும்."],"Disease Alerts":["रोग चेतावनियाँ","நோய் எச்சரிக்கைகள்"],"Recent cases from your scans":["आपके स्कैन से हाल के मामले","உங்கள் ஸ்கேன்களில் இருந்து சமீபத்திய நிகழ்வுகள்"],"Uncertain condition":["अनिश्चित स्थिति","உறுதியற்ற நிலை"],"No disease alerts":["कोई रोग चेतावनी नहीं","நோய் எச்சரிக்கைகள் இல்லை"],"Recent scans have not detected disease.":["हाल के स्कैन में कोई रोग नहीं मिला।","சமீபத்திய ஸ்கேன்களில் நோய் கண்டறியப்படவில்லை."],"Follow-up Reminders":["फ़ॉलो-अप अनुस्मारक","பின்தொடர்தல் நினைவூட்டல்கள்"],"pending":["लंबित","நிலுவை"],"All tasks":["सभी कार्य","அனைத்துப் பணிகள்"],"No follow-ups due":["कोई फ़ॉलो-अप बाकी नहीं","பின்தொடர்தல்கள் எதுவும் நிலுவையில் இல்லை"],"Reminders are created when disease is detected.":["रोग मिलने पर अनुस्मारक अपने आप बनते हैं।","நோய் கண்டறியப்படும்போது நினைவூட்டல்கள் உருவாக்கப்படும்."],"AI Recommendation":["AI सिफ़ारिश","AI பரிந்துரை"],"Recommendations appear after your first scan":["पहले स्कैन के बाद सिफ़ारिशें दिखेंगी","முதல் ஸ்கேனுக்குப் பிறகு பரிந்துரைகள் தோன்றும்"],"Scan a leaf to receive agronomic steps based on your live result.":["अपने परिणाम के आधार पर कृषि सलाह पाने के लिए पत्ती स्कैन करें।","உங்கள் முடிவின் அடிப்படையில் வேளாண் வழிமுறைகளைப் பெற இலையை ஸ்கேன் செய்யுங்கள்."],"Open result":["परिणाम खोलें","முடிவைத் திற"],"Start scan":["स्कैन शुरू करें","ஸ்கேனைத் தொடங்கு"],"Image":["छवि","படம்"],"Crop":["फसल","பயிர்"],"Result":["परिणाम","முடிவு"],"Confidence":["विश्वास","நம்பிக்கை"],"Severity":["गंभीरता","தீவிரம்"],"Date":["तारीख","தேதி"],"Scan":["स्कैन","ஸ்கேன்"],"AI screening workflow":["AI जाँच प्रक्रिया","AI பரிசோதனை பணிப்போக்கு"],"Scan a crop leaf":["फसल की पत्ती स्कैन करें","பயிர் இலையை ஸ்கேன் செய்யுங்கள்"],"Choose the farm context, add a clear leaf image, then run analysis.":["खेत चुनें, साफ़ पत्ती की फोटो जोड़ें, फिर विश्लेषण चलाएँ।","பண்ணையைத் தேர்ந்தெடுத்து, தெளிவான இலைப் படத்தைச் சேர்த்து, பின்னர் பகுப்பாய்வை இயக்குங்கள்."],"Farm":["खेत","பண்ணை"],"Photo":["फोटो","புகைப்படம்"],"Analyze":["विश्लेषण","பகுப்பாய்வு"],"General / unassigned":["सामान्य / निर्धारित नहीं","பொது / ஒதுக்கப்படாதது"],"Crop plot":["फसल प्लॉट","பயிர் நிலம்"],"Select farm first":["पहले खेत चुनें","முதலில் பண்ணையைத் தேர்ந்தெடுக்கவும்"],"Crop type":["फसल का प्रकार","பயிர் வகை"],"Auto-detect":["स्वतः पहचान","தானாகக் கண்டறி"],"Irish potato":["आलू","உருளைக்கிழங்கு"],"Growth stage":["विकास की अवस्था","வளர்ச்சி நிலை"],"Select":["चुनें","தேர்ந்தெடுக்கவும்"],"Seedling / nursery":["पौध / नर्सरी","நாற்று / நாற்றங்கால்"],"Vegetative":["वानस्पतिक अवस्था","தழைவளர்ச்சி நிலை"],"Flowering / tasseling":["फूल आना / मंजरी निकलना","பூக்கும் / கதிர் வெளிவரும் நிலை"],"Fruiting / grain filling":["फल लगना / दाना भरना","காய்க்கும் / தானியம் நிரம்பும் நிலை"],"Maturation":["परिपक्वता","முதிர்ச்சி"],"Leaf photo":["पत्ती की फोटो","இலைப் புகைப்படம்"],"Tap to capture or drag an image here":["फोटो लेने के लिए टैप करें या यहाँ खींचकर छोड़ें","படமெடுக்க தட்டவும் அல்லது படத்தை இங்கே இழுத்து விடவும்"],"One leaf, good light, sharp focus. JPEG, PNG, or WebP up to 10 MB.":["एक पत्ती, अच्छी रोशनी, साफ़ फोकस। JPEG, PNG या WebP, अधिकतम 10 MB।","ஒரு இலை, நல்ல வெளிச்சம், தெளிவான ஃபோகஸ். JPEG, PNG அல்லது WebP, அதிகபட்சம் 10 MB."],"Replace":["बदलें","மாற்று"],"Remove":["हटाएँ","நீக்கு"],"Analyze Leaf with AI":["AI से पत्ती का विश्लेषण करें","AI மூலம் இலையை பகுப்பாய்வு செய்"],"Image-quality tips":["फोटो की गुणवत्ता के सुझाव","படத் தரத்திற்கான குறிப்புகள்"],"Fill most of the frame with one leaf":["फ्रेम का ज़्यादातर हिस्सा एक पत्ती से भरें","படச்சட்டத்தின் பெரும்பகுதியை ஒரே இலையால் நிரப்புங்கள்"],"Use natural light without harsh shadow":["तेज़ छाया के बिना प्राकृतिक रोशनी में लें","கடுமையான நிழல் இல்லாமல் இயற்கை வெளிச்சத்தைப் பயன்படுத்துங்கள்"],"Hold steady and avoid blur":["फ़ोन स्थिर रखें, धुंधली फोटो से बचें","நிலையாகப் பிடித்து மங்கலைத் தவிர்க்கவும்"],"Include lesions and healthy tissue":["धब्बे और स्वस्थ हिस्सा दोनों दिखाएँ","புள்ளிகளையும் ஆரோக்கியமான பகுதியையும் சேர்த்துக் கொள்ளுங்கள்"],"Below-threshold results":["सीमा से कम विश्वास वाले परिणाम","வரம்புக்குக் கீழான முடிவுகள்"],"If confidence is below threshold, you will be guided to retake the photo or seek expert review.":["यदि विश्वास सीमा से कम हो, तो आपको फोटो दोबारा लेने या विशेषज्ञ की समीक्षा लेने के लिए कहा जाएगा।","நம்பிக்கை வரம்புக்குக் கீழே இருந்தால், படத்தை மீண்டும் எடுக்க அல்லது நிபுணர் மதிப்பாய்வை நாட வழிகாட்டப்படுவீர்கள்."],"Back to history":["इतिहास पर वापस","வரலாற்றுக்குத் திரும்பு"],"Schedule follow-up":["फ़ॉलो-अप तय करें","பின்தொடர்தலை திட்டமிடுங்கள்"],"Diagnostic result":["निदान परिणाम","நோயறிதல் முடிவு"],"severity band":["गंभीरता स्तर","தீவிர நிலை"],"Affected area":["प्रभावित क्षेत्र","பாதிக்கப்பட்ட பகுதி"],"image estimate":["फोटो से अनुमान","படத்திலிருந்து மதிப்பீடு"],"Recommended next step":["सुझाया गया अगला कदम","பரிந்துரைக்கப்பட்ட அடுத்த படி"],"Retake a sharp image of the affected leaf. Include symptomatic and healthy tissue where possible, avoiding blur and harsh shadow.":["प्रभावित पत्ती की साफ़ फोटो दोबारा लें। संभव हो तो लक्षण वाला और स्वस्थ हिस्सा दोनों शामिल करें, धुंधलापन और तेज़ छाया से बचें।","பாதிக்கப்பட்ட இலையின் தெளிவான படத்தை மீண்டும் எடுக்கவும். முடிந்தால் அறிகுறி உள்ள பகுதியையும் ஆரோக்கியமான பகுதியையும் சேர்க்கவும்; மங்கல் மற்றும் கடுமையான நிழலைத் தவிர்க்கவும்."],"Top alternatives":["शीर्ष विकल्प","முதன்மை மாற்று முடிவுகள்"],"Retake photo":["फोटो दोबारा लें","படத்தை மீண்டும் எடு"],"Visual analysis":["दृश्य विश्लेषण","காட்சி பகுப்பாய்வு"],"Original image and Grad-CAM explanation":["मूल फोटो और Grad-CAM स्पष्टीकरण","அசல் படம் மற்றும் Grad-CAM விளக்கம்"],"Uploaded image":["अपलोड की गई फोटो","பதிவேற்றிய படம்"],"Verified by an extension officer":["विस्तार अधिकारी द्वारा सत्यापित","விரிவாக்க அலுவலரால் சரிபார்க்கப்பட்டது"],"Decision":["निर्णय","முடிவு"],"Your field feedback helps improve the service":["आपकी प्रतिक्रिया सेवा को बेहतर बनाने में मदद करती है","உங்கள் வயல் கருத்து சேவையை மேம்படுத்த உதவுகிறது"],"Notes":["टिप्पणियाँ","குறிப்புகள்"],"Changes after 3–5 days…":["3–5 दिन बाद के बदलाव…","3–5 நாட்களுக்குப் பிறகான மாற்றங்கள்…"],"No recommendation snapshot available":["सिफ़ारिश का रिकॉर्ड उपलब्ध नहीं","பரிந்துரை பதிவு எதுவும் இல்லை"],"This record does not include stored agronomic guidance.":["इस रिकॉर्ड में सहेजी गई कृषि सलाह शामिल नहीं है।","இந்தப் பதிவில் சேமிக்கப்பட்ட வேளாண் வழிகாட்டுதல் இல்லை."],"Chemical stewardship":["रसायनों का ज़िम्मेदार उपयोग","இரசாயனங்களை பொறுப்புடன் பயன்படுத்துதல்"],"Farm management":["खेत प्रबंधन","பண்ணை மேலாண்மை"],"My Farms":["मेरे खेत","என் பண்ணைகள்"],"Manage locations and crop parcels.":["स्थान और फसल प्लॉट प्रबंधित करें।","இடங்களையும் பயிர் நிலங்களையும் நிர்வகியுங்கள்."],"No farms yet":["अभी कोई खेत नहीं","இன்னும் பண்ணைகள் இல்லை"],"Register your first farm to organize plots and scans.":["प्लॉट और स्कैन व्यवस्थित करने के लिए अपना पहला खेत पंजीकृत करें।","நிலங்களையும் ஸ்கேன்களையும் ஒழுங்குபடுத்த உங்கள் முதல் பண்ணையைப் பதிவு செய்யுங்கள்."],"Add first farm":["पहला खेत जोड़ें","முதல் பண்ணையைச் சேர்"],"Location not specified":["स्थान निर्दिष्ट नहीं","இடம் குறிப்பிடப்படவில்லை"],"Plots":["प्लॉट","நிலங்கள்"],"Scans":["स्कैन","ஸ்கேன்கள்"],"Size":["आकार","அளவு"],"View plots & history":["प्लॉट और इतिहास देखें","நிலங்கள் & வரலாற்றைப் பார்"],"Add Crop Plot":["फसल प्लॉट जोड़ें","பயிர் நிலம் சேர்"],"No crop plots yet":["अभी कोई फसल प्लॉट नहीं","இன்னும் பயிர் நிலங்கள் இல்லை"],"Add maize, potato, or tomato to begin crop monitoring.":["फसल निगरानी शुरू करने के लिए मक्का, आलू या टमाटर जोड़ें।","பயிர் கண்காணிப்பைத் தொடங்க மக்காச்சோளம், உருளைக்கிழங்கு அல்லது தக்காளியைச் சேர்க்கவும்."],"Add first plot":["पहला प्लॉट जोड़ें","முதல் நிலத்தைச் சேர்"],"Standard variety":["मानक किस्म","நிலையான ரகம்"],"Stage":["अवस्था","நிலை"],"Scan this crop":["इस फसल को स्कैन करें","இந்தப் பயிரை ஸ்கேன் செய்"],"Diagnostic records":["निदान रिकॉर्ड","நோயறிதல் பதிவுகள்"],"Scan History":["स्कैन इतिहास","ஸ்கேன் வரலாறு"],"All leaf scans and verification states.":["सभी पत्ती स्कैन और सत्यापन स्थितियाँ।","அனைத்து இலை ஸ்கேன்களும் சரிபார்ப்பு நிலைகளும்."],"New Scan":["नया स्कैन","புதிய ஸ்கேன்"],"Condition":["स्थिति","நிலை"],"Status":["स्थिति","நிலைமை"],"View":["देखें","பார்"],"Records will appear after your first scan.":["पहले स्कैन के बाद रिकॉर्ड दिखेंगे।","முதல் ஸ்கேனுக்குப் பிறகு பதிவுகள் தோன்றும்."],"Scan now":["अभी स्कैन करें","இப்போது ஸ்கேன் செய்"],"Recovery monitoring":["सुधार की निगरानी","மீட்சி கண்காணிப்பு"],"Follow-up Tracker":["फ़ॉलो-अप ट्रैकर","பின்தொடர்தல் கண்காணிப்பு"],"Record whether symptoms are improving, unchanged, or worsening.":["दर्ज करें कि लक्षण सुधर रहे हैं, वैसे ही हैं या बिगड़ रहे हैं।","அறிகுறிகள் மேம்படுகின்றனவா, மாறாமல் உள்ளனவா அல்லது மோசமடைகின்றனவா என்பதைப் பதிவு செய்யுங்கள்."],"Due date":["नियत तारीख","கடைசி தேதி"],"Instructions":["निर्देश","வழிமுறைகள்"],"Outcome":["नतीजा","விளைவு"],"Record":["दर्ज करें","பதிவு செய்"],"No follow-up tasks":["कोई फ़ॉलो-अप कार्य नहीं","பின்தொடர்தல் பணிகள் இல்லை"],"Reminders are scheduled automatically after detection.":["पहचान के बाद अनुस्मारक अपने आप तय हो जाते हैं।","கண்டறிதலுக்குப் பிறகு நினைவூட்டல்கள் தானாகத் திட்டமிடப்படும்."],"Communication":["संचार","தகவல் தொடர்பு"],"Notifications":["सूचनाएँ","அறிவிப்புகள்"],"Reminders and expert review updates.":["अनुस्मारक और विशेषज्ञ समीक्षा के अपडेट।","நினைவூட்டல்கள் மற்றும் நிபுணர் மதிப்பாய்வு புதுப்பிப்புகள்."],"Mark all read":["सभी को पढ़ा हुआ चिह्नित करें","அனைத்தையும் படித்ததாகக் குறி"],"View scan":["स्कैन देखें","ஸ்கேனைப் பார்"],"Mark read":["पढ़ा हुआ चिह्नित करें","படித்ததாகக் குறி"],"No notifications":["कोई सूचना नहीं","அறிவிப்புகள் இல்லை"],"New alerts and updates will appear here.":["नई चेतावनियाँ और अपडेट यहाँ दिखेंगे।","புதிய எச்சரிக்கைகளும் புதுப்பிப்புகளும் இங்கே தோன்றும்."],"Account profile":["खाता प्रोफ़ाइल","கணக்கு சுயவிவரம்"],"Phone":["फ़ोन","தொலைபேசி"],"Member since":["सदस्य बनने की तारीख","உறுப்பினர் ஆன நாள்"],"Edit profile":["प्रोफ़ाइल संपादित करें","சுயவிவரத்தைத் திருத்து"],"Change password":["पासवर्ड बदलें","கடவுச்சொல்லை மாற்று"],"Switch language":["भाषा बदलें","மொழியை மாற்று"],"Sign out":["साइन आउट","வெளியேறு"],"Due date & time":["नियत तारीख और समय","கடைசி தேதி & நேரம்"],"Add new farm":["नया खेत जोड़ें","புதிய பண்ணையைச் சேர்"],"Farm name":["खेत का नाम","பண்ணையின் பெயர்"],"Unit":["इकाई","அலகு"],"Approximate location":["अनुमानित स्थान","தோராய இடம்"],"Save farm":["खेत सहेजें","பண்ணையைச் சேமி"],"Add crop plot":["फसल प्लॉट जोड़ें","பயிர் நிலம் சேர்"],"Variety / hybrid":["किस्म / संकर","ரகம் / கலப்பினம்"],"Plot size (acres)":["प्लॉट का आकार (एकड़)","நில அளவு (ஏக்கர்)"],"Save crop plot":["फसल प्लॉट सहेजें","பயிர் நிலத்தைச் சேமி"],"Record follow-up":["फ़ॉलो-अप दर्ज करें","பின்தொடர்தலைப் பதிவு செய்"],"Current plant health":["पौधे की वर्तमान सेहत","தற்போதைய தாவர ஆரோக்கியம்"],"Observation notes":["अवलोकन टिप्पणियाँ","கவனிப்புக் குறிப்புகள்"],"Complete follow-up":["फ़ॉलो-अप पूरा करें","பின்தொடர்தலை முடி"],"Healthier crops · Stronger farmers":["स्वस्थ फसलें · मजबूत किसान","ஆரோக்கியமான பயிர்கள் · வலிமையான விவசாயிகள்"],"Home":["होम","முகப்பு"],"Register":["पंजीकरण","பதிவு"],"Tasks":["कार्य","பணிகள்"],"Profile":["प्रोफ़ाइल","சுயவிவரம்"],"Image is larger than 10 MB.":["फोटो 10 MB से बड़ी है।","படம் 10 MB-ஐ விட பெரியது."],"Resolution is low; use a closer, sharper photo.":["रिज़ॉल्यूशन कम है; पास से ली गई, साफ़ फोटो इस्तेमाल करें।","தெளிவுத்திறன் குறைவு; அருகில் எடுத்த, தெளிவான படத்தைப் பயன்படுத்துங்கள்."],"Image appears suitable for analysis.":["फोटो विश्लेषण के लिए उपयुक्त लगती है।","படம் பகுப்பாய்வுக்கு ஏற்றதாகத் தெரிகிறது."],"Signing in…":["साइन इन हो रहा है…","உள்நுழைகிறது…"],"Welcome back!":["फिर स्वागत है!","மீண்டும் வருக!"],"Creating account…":["खाता बन रहा है…","கணக்கு உருவாக்கப்படுகிறது…"],"All plots / general":["सभी प्लॉट / सामान्य","அனைத்து நிலங்கள் / பொது"],"Unable to load plots":["प्लॉट लोड नहीं हो सके","நிலங்களை ஏற்ற முடியவில்லை"],"Please capture or choose a leaf photo first":["कृपया पहले पत्ती की फोटो लें या चुनें","முதலில் இலைப் படத்தை எடுக்கவும் அல்லது தேர்ந்தெடுக்கவும்"],"Analyzing with AI…":["AI विश्लेषण कर रहा है…","AI பகுப்பாய்வு செய்கிறது…"],"Analysis complete":["विश्लेषण पूरा हुआ","பகுப்பாய்வு முடிந்தது"],"We couldn't confidently identify this condition.":["हम इस स्थिति की भरोसे के साथ पहचान नहीं कर सके।","இந்த நிலையை உறுதியாக அடையாளம் காண முடியவில்லை."],"Scanning your leaf…":["आपकी पत्ती स्कैन हो रही है…","உங்கள் இலை ஸ்கேன் ஆகிறது…"],"Detecting disease…":["रोग की पहचान हो रही है…","நோய் கண்டறியப்படுகிறது…"],"Preparing your recovery plan…":["आपकी सुधार योजना तैयार हो रही है…","உங்கள் மீட்புத் திட்டம் தயாராகிறது…"],"Please keep this screen open. This usually takes a few seconds.":["कृपया यह स्क्रीन खुली रखें। इसमें आमतौर पर कुछ सेकंड लगते हैं।","இந்தத் திரையை திறந்தே வைத்திருங்கள். இதற்கு பொதுவாக சில விநாடிகள் ஆகும்."],"Detect":["पहचान","கண்டறி"],"Heal":["उपचार","குணப்படுத்து"],"Kenya Crop Health AI":["Kenya Crop Health AI","Kenya Crop Health AI"],"AI-powered crop disease detection":["AI आधारित फसल रोग पहचान","AI அடிப்படையிலான பயிர் நோய் கண்டறிதல்"],"Farmer Dashboard":["किसान डैशबोर्ड","விவசாயி டாஷ்போர்டு"],"Farm health overview":["खेत की सेहत का अवलोकन","பண்ணை ஆரோக்கிய கண்ணோட்டம்"],"AI disease detection workflow":["AI रोग पहचान प्रक्रिया","AI நோய் கண்டறிதல் பணிப்போக்கு"],"Diagnosis and recommendations":["निदान और सिफ़ारिशें","நோயறிதல் மற்றும் பரிந்துரைகள்"],"Farm Management":["खेत प्रबंधन","பண்ணை மேலாண்மை"],"Locations and crop plots":["स्थान और फसल प्लॉट","இடங்கள் மற்றும் பயிர் நிலங்கள்"],"Farm Details":["खेत का विवरण","பண்ணை விவரங்கள்"],"Crop plots and scan activity":["फसल प्लॉट और स्कैन गतिविधि","பயிர் நிலங்கள் மற்றும் ஸ்கேன் செயல்பாடு"],"Follow-ups":["फ़ॉलो-अप","பின்தொடர்தல்"],"Alerts and expert updates":["चेतावनियाँ और विशेषज्ञ अपडेट","எச்சரிக்கைகள் மற்றும் நிபுணர் புதுப்பிப்புகள்"],"Expert Review":["विशेषज्ञ समीक्षा","நிபுணர் மதிப்பாய்வு"],"Human verification queue":["मानव सत्यापन कतार","மனித சரிபார்ப்பு வரிசை"],"Admin Dashboard":["एडमिन डैशबोर्ड","நிர்வாக டாஷ்போர்டு"],"Platform analytics":["प्लेटफ़ॉर्म विश्लेषण","தள பகுப்பாய்வு"],"Disease Surveillance":["रोग निगरानी","நோய் கண்காணிப்பு"],"County-level intelligence":["काउंटी स्तर की जानकारी","கவுண்டி அளவிலான தகவல்"],"Account settings":["खाता सेटिंग्स","கணக்கு அமைப்புகள்"]};

function langInfo(code = state.lang) {
  return LANGS.find(l => l.code === code) || LANGS[0];
}

/* tr(english, swahili): Swahili text lives next to the English string in the code;
   Hindi and Tamil come from EXTRA_TR (keyed by the English string). Falls back to English. */
function tr(en, sw) {
  if (state.lang === 'sw') return sw;
  if (state.lang === 'hi') return EXTRA_TR[en]?.[0] ?? en;
  if (state.lang === 'ta') return EXTRA_TR[en]?.[1] ?? en;
  return en;
}

/* The backend only knows 'en' and 'sw'. Hindi/Tamil are UI-only, so API fields
   receive 'en' for them and the API contract is unchanged. */
function apiLang(code = state.lang) {
  return code === 'sw' ? 'sw' : 'en';
}

function isSwahili() {
  return state.lang === 'sw';
}

function cropLabel(crop) {
  const key = String(crop || '').toLowerCase();
  if (key === 'maize') return tr('Maize', 'Mahindi');
  if (key === 'potato') return tr('Potato', 'Viazi');
  if (key === 'tomato') return tr('Tomato', 'Nyanya');
  return crop ? esc(crop) : (tr('Leaf', 'Jani'));
}

function formatDiseaseName(raw) {
  if (!raw) return tr('Unknown', 'Haijulikani');
  const clean = String(raw).trim();
  if (clean.endsWith('_healthy')) {
    return `${cropLabel(clean.split('_')[0])} · ${tr('Healthy', 'Hali Njema')}`;
  }
  return clean.replaceAll('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function isHealthyScan(scan) {
  return Boolean(scan?.predicted_label && String(scan.predicted_label).endsWith('_healthy'));
}

function getSeverityBadge(cat) {
  const c = String(cat || '').toLowerCase();
  if (c.includes('healthy') || c === 'none') return '<span class="badge badge-healthy">Healthy</span>';
  if (c.includes('mild')) return '<span class="badge badge-mild">Mild</span>';
  if (c.includes('moderate')) return '<span class="badge badge-moderate">Moderate</span>';
  if (c.includes('severe')) return '<span class="badge badge-severe">Severe</span>';
  if (c.includes('uncertain') || !cat) return '<span class="badge badge-uncertain">Uncertain</span>';
  return `<span class="badge badge-uncertain">${esc(cat)}</span>`;
}

function getConfidenceMeta(confidence, accepted = true) {
  if (!accepted) return { label: tr('Below threshold', 'Uhakika wa chini'), tone: 'warning' };
  const n = Number(confidence);
  if (!Number.isFinite(n)) return { label: 'N/A', tone: 'neutral' };
  const pct = n > 1 ? n : n * 100;
  if (pct >= 85) return { label: tr('High confidence', 'Uhakika wa juu'), tone: 'success' };
  if (pct >= 70) return { label: tr('Confident', 'Uhakika wa kutosha'), tone: 'success' };
  return { label: tr('Low confidence', 'Uhakika wa chini'), tone: 'warning' };
}

// Existing API contracts — routes and methods intentionally unchanged.
const api = {
  async req(endpoint, options = {}) {
    const headers = { ...(options.headers || {}) };
    if (state.token && !headers.Authorization) headers.Authorization = `Bearer ${state.token}`;
    if (!(options.body instanceof FormData) && !headers['Content-Type']) headers['Content-Type'] = 'application/json';

    try {
      const res = await fetch(`/api/v1${endpoint}`, { ...options, headers });
      if (res.status === 401) {
        if (state.token) {
          this.logout(false);
          toast('Session expired. Please sign in again.', 'error');
        }
        throw new Error('Not authenticated');
      }
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || errData.message || `Request failed (${res.status})`);
      }
      if (res.status === 204) return null;
      return await res.json();
    } catch (err) {
      console.error(`API Error [${endpoint}]:`, err);
      throw err;
    }
  },
  async login(phone_number, password) {
    const res = await this.req('/auth/login', { method: 'POST', body: JSON.stringify({ phone_number, password }) });
    state.token = res.access_token;
    localStorage.setItem('token', res.access_token);
    const user = await this.getMe();
    state.user = user;
    localStorage.setItem('user', JSON.stringify(user));
    return user;
  },
  async register(data) {
    const res = await this.req('/auth/register', { method: 'POST', body: JSON.stringify(data) });
    state.token = res.access_token;
    localStorage.setItem('token', res.access_token);
    const user = await this.getMe();
    state.user = user;
    localStorage.setItem('user', JSON.stringify(user));
    return user;
  },
  logout(showToast = true) {
    state.token = null;
    state.user = null;
    state.notificationsCount = 0;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (showToast) toast(tr('Signed out', 'Umetoka kwenye akaunti'), 'info');
    updateNav();
    navigate('#/');
  },
  async health() {
    const res = await fetch('/health');
    if (!res.ok) throw new Error(`Health check failed (${res.status})`);
    return res.json();
  },
  async legacyAnalyze(formData) {
    const res = await fetch('/api/analyze', { method: 'POST', body: formData });
    if (!res.ok) { const data = await res.json().catch(() => ({})); throw new Error(data.detail || `Legacy analyze failed (${res.status})`); }
    return res.json();
  },
  async getMe() { return this.req('/auth/me'); },
  async updateMe(data) { return this.req('/auth/me', { method: 'PUT', body: JSON.stringify(data) }); },
  async changePassword(current_password, new_password) { return this.req('/auth/me/change-password', { method: 'POST', body: JSON.stringify({ current_password, new_password }) }); },
  async getPublicStats() { return this.req('/analytics/public-stats'); },
  async getDashboardStats() { return this.req('/analytics/dashboard'); },
  async getHealthTrend(days = 30) { return this.req(`/analytics/health-trend?days=${encodeURIComponent(days)}`); },
  async getFarmTimeline(farmId = '', limit = 50) { return this.req(`/analytics/farm-timeline?${farmId ? `farm_id=${encodeURIComponent(farmId)}&` : ''}limit=${encodeURIComponent(limit)}`); },
  async getFarms() { return this.req('/farms'); },
  async getFarm(id) { return this.req(`/farms/${id}`); },
  async createFarm(data) { return this.req('/farms', { method: 'POST', body: JSON.stringify(data) }); },
  async updateFarm(id, data) { return this.req(`/farms/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
  async deleteFarm(id) { return this.req(`/farms/${id}`, { method: 'DELETE' }); },
  async getPlots(farmId) { return this.req(`/farms/${farmId}/plots`); },
  async getPlot(farmId, plotId) { return this.req(`/farms/${farmId}/plots/${plotId}`); },
  async createPlot(farmId, data) { return this.req(`/farms/${farmId}/plots`, { method: 'POST', body: JSON.stringify(data) }); },
  async updatePlot(farmId, plotId, data) { return this.req(`/farms/${farmId}/plots/${plotId}`, { method: 'PUT', body: JSON.stringify(data) }); },
  async deletePlot(farmId, plotId) { return this.req(`/farms/${farmId}/plots/${plotId}`, { method: 'DELETE' }); },
  async submitScan(formData) { return this.req('/scans', { method: 'POST', body: formData }); },
  async getScans(params = '') { return this.req(`/scans${params}`); },
  async getScan(id) { return this.req(`/scans/${id}`); },
  async createFollowUp(scanId, data) { return this.req(`/scans/${scanId}/follow-ups`, { method: 'POST', body: JSON.stringify({ scan_id: scanId, ...data }) }); },
  async getScanFollowUps(scanId) { return this.req(`/scans/${scanId}/follow-ups`); },
  async updateFollowUp(scanId, fuId, data) { return this.req(`/scans/${scanId}/follow-ups/${fuId}`, { method: 'PUT', body: JSON.stringify(data) }); },
  async submitFeedback(scanId, data) { return this.req(`/scans/${scanId}/feedback`, { method: 'POST', body: JSON.stringify(data) }); },
  async getFeedback(scanId) { return this.req(`/scans/${scanId}/feedback`); },
  async getFollowUps(status = '') { return this.req(`/follow-ups${status ? `?status=${encodeURIComponent(status)}` : ''}`); },
  async getOverdueFollowUps() { return this.req('/follow-ups/overdue'); },
  async getNotifications(unreadOnly = false) { return this.req(`/notifications${unreadOnly ? '?unread_only=true' : ''}`); },
  async getNotificationCount() { return this.req('/notifications/count'); },
  async markNotificationRead(id) { return this.req(`/notifications/${id}/read`, { method: 'POST' }); },
  async markAllNotificationsRead() { return this.req('/notifications/read-all', { method: 'POST' }); },
  async getPendingReviews() { return this.req('/expert/pending'); },
  async getLowConfidenceReviews(threshold = 0.8) { return this.req(`/expert/low-confidence?threshold=${encodeURIComponent(threshold)}`); },
  async getSevereReviews() { return this.req('/expert/severe'); },
  async getExpertReview(scanId) { return this.req(`/expert/scans/${scanId}/review`); },
  async submitExpertReview(scanId, data) { return this.req(`/expert/scans/${scanId}/review`, { method: 'POST', body: JSON.stringify(data) }); },
  async updateExpertReview(scanId, data) { return this.req(`/expert/scans/${scanId}/review`, { method: 'PUT', body: JSON.stringify(data) }); },
  async getAdminStats() { return this.req('/analytics/admin'); },
  async getSurveillanceData() { return this.req('/analytics/surveillance'); },
  async getModelVersions() { return this.req('/admin/model-versions'); },
  async getAdminUsers(skip = 0, limit = 100) { return this.req(`/admin/users?skip=${skip}&limit=${limit}`); },
  async getAdminUser(id) { return this.req(`/admin/users/${id}`); },
  async deactivateUser(id) { return this.req(`/admin/users/${id}/deactivate`, { method: 'POST' }); },
  async getAdminScans(skip = 0, limit = 100) { return this.req(`/admin/scans?skip=${skip}&limit=${limit}`); },
  async getAdminFollowUps(skip = 0, limit = 100) { return this.req(`/admin/follow-ups?skip=${skip}&limit=${limit}`); }
};

const TOAST_ICONS = {
  success: icon('check', 18),
  error: icon('warning', 18),
  warning: icon('warning', 18),
  info: icon('info', 18)
};

function toast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = `${TOAST_ICONS[type] || TOAST_ICONS.info}<span>${esc(message)}</span>`;
  container.appendChild(el);
  window.setTimeout(() => {
    el.classList.add('toast-leaving');
    window.setTimeout(() => el.remove(), 240);
  }, 4600);
}

function showModal(title, contentHtml) {
  const root = document.getElementById('modal-root');
  if (!root) return;
  root.innerHTML = `
    <div class="modal-overlay" id="modal-overlay">
      <section class="modal-content" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <header class="modal-header">
          <h2 id="modal-title">${esc(title)}</h2>
          <button class="modal-close" type="button" onclick="closeModal()" aria-label="Close dialog">×</button>
        </header>
        <div class="modal-body">${contentHtml}</div>
      </section>
    </div>`;
  root.hidden = false;
  document.body.classList.add('modal-open');
  document.getElementById('modal-overlay')?.addEventListener('click', event => {
    if (event.target.id === 'modal-overlay') closeModal();
  });
  window.setTimeout(() => root.querySelector('input, select, textarea, button:not(.modal-close)')?.focus(), 80);
}

function closeModal() {
  const root = document.getElementById('modal-root');
  if (!root) return;
  root.innerHTML = '';
  root.hidden = true;
  document.body.classList.remove('modal-open');
}


async function fetchProtectedBlob(path) {
  const headers = {};
  if (state.token) headers.Authorization = `Bearer ${state.token}`;
  const res = await fetch(path, { headers });
  if (res.status === 401) {
    api.logout(false);
    throw new Error('Session expired. Please sign in again.');
  }
  if (!res.ok) throw new Error(`Unable to load protected resource (${res.status})`);
  return res.blob();
}

async function hydrateProtectedMedia(root = document) {
  const images = [...root.querySelectorAll('img[data-secure-src]')];
  await Promise.all(images.map(async img => {
    const path = img.dataset.secureSrc;
    if (!path) return;
    try {
      const blob = await fetchProtectedBlob(path);
      const url = URL.createObjectURL(blob);
      img.src = url;
      img.dataset.objectUrl = url;
      img.addEventListener('load', () => {}, { once: true });
    } catch (err) {
      console.warn('Protected image failed:', path, err);
      img.alt = `${img.alt || 'Image'} unavailable`;
      img.classList.add('media-load-failed');
    }
  }));
}

window.downloadProtectedFile = async function downloadProtectedFile(path, filename = 'download') {
  try {
    const blob = await fetchProtectedBlob(path);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (err) {
    toast(err.message || 'Unable to download file', 'error');
  }
};

async function loadLocales(lang) {
  if (!LANGS.some(l => l.code === lang)) lang = 'en';
  const embedded = DEFAULT_I18N;
  let remote = {};
  for (const path of [`/locales/${lang}.json`, `/static/locales/${lang}.json`]) {
    try {
      const res = await fetch(path, { cache: 'no-store' });
      if (res.ok) {
        remote = await res.json();
        break;
      }
    } catch (_) {}
  }
  state.i18n = mergeDeep(embedded, remote);
  state.lang = lang;
  localStorage.setItem('lang', lang);
  document.documentElement.lang = lang;
}

function mergeDeep(base, override) {
  const output = { ...base };
  for (const [key, value] of Object.entries(override || {})) {
    output[key] = value && typeof value === 'object' && !Array.isArray(value)
      ? mergeDeep(base?.[key] || {}, value)
      : value;
  }
  return output;
}

function t(keyPath, fallback = '') {
  let current = state.i18n;
  for (const key of keyPath.split('.')) {
    if (current && current[key] !== undefined) current = current[key];
    else return fallback || keyPath;
  }
  return current;
}

async function toggleLanguage(target) {
  const codes = LANGS.map(l => l.code);
  const next = typeof target === 'string' && codes.includes(target)
    ? target
    : codes[(codes.indexOf(state.lang) + 1) % codes.length];
  if (next === state.lang) return;
  await loadLocales(next);
  toast(langInfo().toast, 'success');
  updateNav();
  await renderCurrentRoute();
}

function onLanguageToggleClick(event) {
  const seg = event.target.closest?.('.seg[data-l]');
  toggleLanguage(seg ? seg.dataset.l : undefined);
}

function parseHash() {
  const hash = window.location.hash || '#/';
  const route = hash.split('?')[0];
  const cleanRoute = route.startsWith('#') ? route.slice(1) : route;
  const parts = cleanRoute.split('/').filter(Boolean);
  if (parts.length === 2 && parts[0] === 'scans') return { route: '#/scans/:id', params: { id: parts[1] } };
  if (parts.length === 2 && parts[0] === 'farms') return { route: '#/farms/:id', params: { id: parts[1] } };
  return { route, params: {} };
}

function navigate(targetHash) {
  if (window.location.hash === targetHash) renderCurrentRoute();
  else window.location.hash = targetHash;
}

function renderPageHeader({ eyebrow, title, description, actions = '' }) {
  return `
    <header class="page-header">
      <div>
        ${eyebrow ? `<p class="page-eyebrow">${esc(eyebrow)}</p>` : ''}
        <h1>${title}</h1>
        ${description ? `<p>${description}</p>` : ''}
      </div>
      ${actions ? `<div class="page-actions">${actions}</div>` : ''}
    </header>`;
}

function renderStatCard({ label, value, sublabel = '', iconName = 'leaf', tone = 'green' }) {
  return `
    <article class="stat-card stat-${tone}">
      <span class="stat-icon">${icon(iconName, 20)}</span>
      <div>
        <p class="stat-label">${esc(label)}</p>
        <strong class="stat-value">${esc(value)}</strong>
        ${sublabel ? `<span class="stat-sub">${esc(sublabel)}</span>` : ''}
      </div>
    </article>`;
}

function renderEmptyState({ iconName = 'leaf', title, body, action = '' }) {
  return `
    <div class="empty-state">
      <span class="empty-icon">${icon(iconName, 28)}</span>
      <h3>${esc(title)}</h3>
      <p>${esc(body)}</p>
      ${action}
    </div>`;
}

function renderErrorState(title, message) {
  return `
    <div class="state-card state-error" role="alert">
      <span class="empty-icon">${icon('warning', 28)}</span>
      <h2>${esc(title)}</h2>
      <p>${esc(message || 'Please check your connection and try again.')}</p>
      <button class="btn btn-secondary" type="button" onclick="renderCurrentRoute()">${icon('refresh', 16)} Retry</button>
    </div>`;
}

function destroyCharts() {
  state.charts.forEach(chart => chart?.destroy?.());
  state.charts = [];
}

function monthlyTrend(scans) {
  const now = new Date();
  const buckets = [];
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString('en', { month: 'short' }), healthy: 0, diseased: 0 });
  }
  const byKey = Object.fromEntries(buckets.map(b => [b.key, b]));
  (scans || []).forEach(scan => {
    const d = new Date(scan.timestamp);
    if (Number.isNaN(d.getTime())) return;
    const bucket = byKey[`${d.getFullYear()}-${d.getMonth()}`];
    if (!bucket || scan.status === 'uncertain') return;
    if (isHealthyScan(scan)) bucket.healthy += 1;
    else bucket.diseased += 1;
  });
  return buckets;
}

function initializeDashboardChart(scans) {
  const canvas = document.getElementById('crop-trend-chart');
  if (!canvas || !window.Chart) return;
  const data = monthlyTrend(scans);
  if (!data.some(d => d.healthy || d.diseased)) return;
  const chart = new Chart(canvas, {
    type: 'line',
    data: {
      labels: data.map(d => d.label),
      datasets: [
        { label: 'Healthy scans', data: data.map(d => d.healthy), borderColor: '#17724a', backgroundColor: 'rgba(23,114,74,.12)', fill: true, tension: .35, pointRadius: 4, pointBackgroundColor: '#17724a' },
        { label: 'Diseased scans', data: data.map(d => d.diseased), borderColor: '#c94f45', backgroundColor: 'rgba(201,79,69,.08)', fill: true, tension: .35, pointRadius: 4, pointBackgroundColor: '#c94f45' }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'top', align: 'start', labels: { boxWidth: 10, usePointStyle: true } } },
      scales: { y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: 'rgba(31,61,48,.08)' } }, x: { grid: { display: false } } }
    }
  });
  state.charts.push(chart);
}

function initializeAdminChart(id, labels, values, color) {
  const canvas = document.getElementById(id);
  if (!canvas || !window.Chart || !labels.length) return;
  const chart = new Chart(canvas, {
    type: 'bar',
    data: { labels, datasets: [{ data: values, backgroundColor: color, borderRadius: 8, maxBarThickness: 28 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: 'rgba(31,61,48,.08)' } }, x: { grid: { display: false } } } }
  });
  state.charts.push(chart);
}

// 1. Public landing page
async function renderLanding() {
  let stats = null;
  let statsError = false;
  try {
    stats = await api.getPublicStats();
  } catch (_) {
    statsError = true;
  }
  const isSw = isSwahili();
  const showStats = stats && (Number(stats.registered_farmers) > 0 || Number(stats.total_scans) > 0);

  return `
    <div class="landing-page">
      <section class="hero-panel">
        <div class="hero-content">
          <span class="eyebrow-pill">${icon('leaf', 16)} ${tr('AI-powered crop disease detection for Kenya', 'AI kwa usalama wa chakula Kenya')}</span>
          <h1>${tr('Healthier crops. Stronger farmers. A greener Kenya.', 'Afya bora ya mazao. Wakulima imara. Kenya yenye usalama wa chakula.')}</h1>
          <p>${tr('Photograph a leaf, receive confidence-aware screening, Kenya-grounded agronomic guidance, and recovery follow-up in one trusted platform.', 'Piga picha ya jani, pokea uchambuzi wenye uhakika, mwongozo wa kilimo, na ufuatiliaji wa kupona — yote katika jukwaa moja.')}</p>
          <div class="hero-actions">
            <a class="btn btn-primary btn-lg" href="#/scan">${icon('camera', 18)} ${tr('Scan a Crop', 'Pima Zao')}</a>
            ${state.user
              ? `<a class="btn btn-secondary btn-lg" href="#/dashboard">${tr('Open Dashboard', 'Fungua Dashibodi')} ${icon('arrow', 16)}</a>`
              : `<a class="btn btn-secondary btn-lg" href="#/login">${tr('Sign In', 'Ingia')} ${icon('arrow', 16)}</a>`}
          </div>
          ${showStats ? `
            <dl class="hero-metrics">
              <div><dt>${tr('Registered farmers', 'Wakulima')}</dt><dd>${formatNumber(stats.registered_farmers)}</dd></div>
              <div><dt>${tr('Crop scans', 'Vipimo')}</dt><dd>${formatNumber(stats.total_scans)}</dd></div>
              <div><dt>${tr('Supported crops', 'Mazao')}</dt><dd>3</dd></div>
            </dl>` : `
            <div class="hero-note ${statsError ? 'hero-note-warning' : ''}">
              ${statsError
                ? (tr('Live platform statistics are temporarily unavailable.', 'Takwimu za jukwaa hazipatikani kwa sasa.'))
                : (tr('The platform is ready for early field deployment and farmer onboarding.', 'Jukwaa liko tayari kwa matumizi ya awali na usajili wa wakulima.'))}
            </div>`}
        </div>
        <div class="hero-visual" aria-label="Crop scan result preview">
          <div class="phone-frame">
            <div class="phone-status"><span>9:41</span><span></span></div>
            <div class="phone-title">${tr('Scan Result', 'Matokeo ya Kipimo')}</div>
            <div class="leaf-illustration" aria-hidden="true">
              <span class="leaf-shape"></span><span class="scan-ring"></span>
            </div>
            <div class="result-card-mini">
              <span class="badge badge-severe">${tr('Disease detected', 'Ugonjwa Umegunduliwa')}</span>
              <h3>Tomato Late Blight</h3>
              <div class="mini-metrics"><span>99.7%<small>Confidence</small></span><span>Mild<small>Severity</small></span></div>
            </div>
          </div>
        </div>
      </section>

      <section class="section-block">
        <div class="section-heading-row">
          <span class="section-kicker">${tr('Field workflow', 'Mtiririko wa kazi')}</span>
          <h2>${tr('From field photo to the right action', 'Kutoka shambani hadi hatua sahihi')}</h2>
        </div>
        <div class="workflow-grid">
          ${[
            ['camera', tr('Capture leaf', 'Piga picha'), tr('Use the phone camera or upload a sharp leaf photo.', 'Tumia kamera ya simu au pakia picha iliyo wazi.')],
            ['microscope', tr('AI screening', 'Uchambuzi wa AI'), tr('Receive prediction, confidence, severity, and Grad-CAM explanation.', 'Pata utabiri, uhakika, ukali, na Grad-CAM.')],
            ['sprout', tr('Act locally', 'Mwongozo'), tr('Management and prevention steps grounded in Kenyan field conditions.', 'Hatua za udhibiti zinazofaa hali ya Kenya.')],
            ['tasks', tr('Monitor recovery', 'Fuatilia'), tr('Complete reminders and record whether symptoms improve.', 'Rekodi maendeleo na malizia vikumbusho.')]
          ].map(([iconName, title, body], index) => `
            <article class="workflow-card">
              <span class="workflow-number">${String(index + 1).padStart(2, '0')}</span>
              <span class="workflow-icon">${icon(iconName, 22)}</span>
              <h3>${title}</h3><p>${body}</p>
            </article>`).join('')}
        </div>
      </section>

      <section class="section-block split-feature">
        <div>
          <span class="section-kicker">${tr('Supported crops', 'Mazao yanayolengwa')}</span>
          <h2>${tr('Maize, Irish potato, and tomato', 'Mahindi, viazi mviringo, na nyanya')}</h2>
          <p>${tr('Focused on priority food-security and income crops for Kenyan smallholder farmers.', 'Lengo ni kusaidia mazao muhimu ya chakula na mapato kwa wakulima wadogo Kenya.')}</p>
        </div>
        <div class="crop-list">
          <article><strong>Maize</strong><span>Gray Leaf Spot · Common Rust · Northern Leaf Blight</span></article>
          <article><strong>Irish Potato</strong><span>Early Blight · Late Blight</span></article>
          <article><strong>Tomato</strong><span>Bacterial Spot · Early Blight · Late Blight</span></article>
        </div>
      </section>

      <section class="trust-grid">
        ${[
          ['shield', tr('Confidence-aware by design', 'Uchunguzi unaojali uhakika'), tr('Uncertain results are clearly flagged instead of forcing a diagnosis.', 'Matokeo yasiyo na uhakika huonyeshwa wazi badala ya kulazimisha utabiri.')],
          ['eye', tr('Explainable predictions', 'Ufafanuzi wa visual'), tr('Grad-CAM shows which leaf regions influenced the result.', 'Grad-CAM huonyesha sehemu za jani zilizoathiri uamuzi.')],
          ['users', tr('Human expert safety net', 'Mtandao wa binadamu'), tr('Extension officers can review queued cases and verify or correct labels.', 'Maafisa ugani wanaweza kukagua kesi zilizo kwenye foleni.')]
        ].map(([iconName, title, body]) => `<article class="trust-card"><span>${icon(iconName, 22)}</span><h3>${title}</h3><p>${body}</p></article>`).join('')}
      </section>

      <aside class="responsible-ai">
        <span>${icon('warning', 22)}</span>
        <div>
          <h2>${tr('AI assists — it does not replace agronomic expertise', 'AI husaidia — haibadilishi mtaalamu')}</h2>
          <p>${tr('Results are based on a single leaf image and may be incorrect. For major treatment decisions or spreading crop loss, consult a qualified extension officer or plant pathologist.', 'Matokeo yanategemea picha moja na yanaweza kukosea. Kwa uamuzi mkubwa wa dawa au uhasara mkubwa, wasiliana na afisa ugani.')}</p>
        </div>
      </aside>
    </div>`;
}

// 2. Authentication
function renderLogin() {
  const isSw = isSwahili();
  return `
    <div class="auth-page">
      <aside class="auth-aside">
        <div class="auth-aside-content">
          <span class="auth-leaf-mark">${icon('leaf', 34)}</span>
          <p class="page-eyebrow">Kenya Crop Health AI</p>
          <h1>${tr('Welcome back to the field', 'Karibu tena shambani')}</h1>
          <p>${tr('Continue tracking farms, crop scans, and practical agronomic guidance.', 'Endelea kufuatilia mashamba, vipimo, na mapendekezo ya kilimo.')}</p>
          <ul class="auth-benefits">
            <li>${icon('check', 16)} ${tr('Confidence-aware AI results', 'Matokeo ya AI yenye uhakika')}</li>
            <li>${icon('check', 16)} ${tr('Grad-CAM and severity metrics', 'Grad-CAM na vipimo vya ukali')}</li>
            <li>${icon('check', 16)} ${tr('Follow-up and expert verification', 'Ufuatiliaji na uhakiki wa wataalam')}</li>
          </ul>
        </div>
      </aside>
      <section class="auth-panel">
        <div class="auth-card">
          <div class="auth-heading">
            <p class="page-eyebrow">${tr('Secure account access', 'Akaunti ya mkulima')}</p>
            <h1>${tr('Sign in to your account', 'Ingia kwenye akaunti')}</h1>
            <p>${tr('Use your phone number and password.', 'Tumia nambari ya simu na nenosiri lako.')}</p>
          </div>
          <form id="login-form" novalidate>
            <div class="form-group">
              <label class="form-label" for="login-phone">${tr('Phone number', 'Nambari ya simu')}</label>
              <input class="form-control" id="login-phone" type="tel" autocomplete="tel" inputmode="tel" placeholder="+254712345678" required>
              <p class="form-hint">${tr('Example: +254712345678 or 0712345678', 'Mfano: +254712345678 au 0712345678')}</p>
            </div>
            <div class="form-group">
              <label class="form-label" for="login-password">${tr('Password', 'Nenosiri')}</label>
              <div class="password-wrapper">
                <input class="form-control" id="login-password" type="password" autocomplete="current-password" placeholder="••••••••" required>
                <button class="password-toggle" type="button" onclick="togglePasswordVisibility('login-password', this)" aria-label="Toggle password visibility">${icon('eye', 18)}</button>
              </div>
            </div>
            <button class="btn btn-primary btn-lg btn-full" id="login-btn" type="submit">${tr('Sign In', 'Ingia')}</button>
          </form>
          <p class="auth-switch">${tr('No account yet?', 'Huna akaunti?')} <a href="#/register">${tr('Create one', 'Jisajili bure')}</a></p>
        </div>
      </section>
    </div>`;
}

function renderRegister() {
  const isSw = isSwahili();
  return `
    <div class="narrow-page">
      <section class="form-hero-card">
        <div class="auth-heading">
          <p class="page-eyebrow">${tr('Join the platform', 'Jiunge na jukwaa')}</p>
          <h1>${tr('Create your Crop Health AI account', 'Fungua akaunti ya Crop Health AI')}</h1>
          <p>${tr('Register farms, scan crops, and track recovery over time.', 'Sajili mashamba, pima mazao, na fuatilia kupona.')}</p>
        </div>
        <form id="register-form" novalidate>
          <div class="form-group">
            <label class="form-label" for="reg-name">${tr('Full name', 'Jina kamili')} <span aria-hidden="true">*</span></label>
            <input class="form-control" id="reg-name" type="text" autocomplete="name" placeholder="Wanjiku Mwangi" required>
          </div>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label" for="reg-phone">${tr('Phone number', 'Nambari ya simu')} <span aria-hidden="true">*</span></label>
              <input class="form-control" id="reg-phone" type="tel" autocomplete="tel" inputmode="tel" placeholder="+254712345678" required>
            </div>
            <div class="form-group">
              <label class="form-label" for="reg-email">${tr('Email', 'Barua pepe')} <span class="optional">${tr('optional', 'hiari')}</span></label>
              <input class="form-control" id="reg-email" type="email" autocomplete="email" placeholder="farmer@example.com">
            </div>
          </div>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label" for="reg-county">${tr('County', 'Kaunti')} <span aria-hidden="true">*</span></label>
              <select class="form-select" id="reg-county" required>
                <option value="">${tr('Select county', 'Chagua kaunti')}</option>
                ${Object.keys(KENYA_COUNTIES).map(county => `<option value="${esc(county)}">${esc(county)}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="reg-subcounty">Sub-County <span class="optional">${tr('optional', 'hiari')}</span></label>
              <input class="form-control" id="reg-subcounty" type="text" placeholder="Njoro, Mwea">
            </div>
          </div>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label" for="reg-role">${tr('Your role', 'Nafasi yako')}</label>
              <select class="form-select" id="reg-role">
                <option value="farmer">${tr('Farmer', 'Mkulima')}</option>
                <option value="extension_officer">${tr('Extension officer', 'Afisa ugani')}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="reg-lang">${tr('Preferred language', 'Lugha')}</label>
              <select class="form-select" id="reg-lang">
                ${LANGS.map(l => `<option value="${l.code}" ${state.lang === l.code ? 'selected' : ''}>${l.name}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label" for="reg-password">${tr('Password', 'Nenosiri')} <span aria-hidden="true">*</span></label>
            <div class="password-wrapper">
              <input class="form-control" id="reg-password" type="password" minlength="8" autocomplete="new-password" placeholder="8+ characters" required>
              <button class="password-toggle" type="button" onclick="togglePasswordVisibility('reg-password', this)" aria-label="Toggle password visibility">${icon('eye', 18)}</button>
            </div>
          </div>
          <button class="btn btn-primary btn-lg btn-full" id="reg-btn" type="submit">${tr('Create Account', 'Kamilisha usajili')}</button>
        </form>
        <p class="auth-switch">${tr('Already registered?', 'Tayari una akaunti?')} <a href="#/login">${tr('Sign in', 'Ingia')}</a></p>
      </section>
    </div>`;
}

window.togglePasswordVisibility = function togglePasswordVisibility(inputId, button) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.type = input.type === 'password' ? 'text' : 'password';
  button.setAttribute('aria-label', input.type === 'password' ? 'Show password' : 'Hide password');
};

// 3. Farmer dashboard
async function renderDashboard() {
  if (!state.user) { navigate('#/login'); return ''; }
  let stats, scans = [], followUps = [], notifications = [], latestDetail = null;
  try {
    [stats, scans, followUps, notifications] = await Promise.all([
      api.getDashboardStats(), api.getScans('?limit=50'), api.getFollowUps(), api.getNotifications()
    ]);
    if (scans[0]?.id) latestDetail = await api.getScan(scans[0].id).catch(() => null);
  } catch (err) {
    return renderErrorState('Unable to load dashboard', err.message);
  }

  state.notificationsCount = notifications.filter(n => !n.is_read).length;
  updateNav();

  const isSw = isSwahili();
  const firstName = esc((state.user.full_name || 'Farmer').split(' ')[0]);
  const pending = followUps.filter(f => f.status === 'pending');
  const overdue = pending.filter(f => new Date(f.due_date) < new Date());
  const alerts = scans.filter(s => s.status === 'uncertain' || !isHealthyScan(s)).slice(0, 4);
  const recommendations = latestDetail?.recommendation_snapshot?.management || [];

  return `
    <div class="dashboard-page">
      ${renderPageHeader({
        eyebrow: tr('Farm overview', 'Muhtasari wa shamba'),
        title: `${tr('Welcome back', 'Karibu')}, ${firstName}`,
        description: `${tr('Here is your crop health position today', 'Hali ya mashamba yako leo')} · ${esc(state.user.county || 'Kenya')}`,
        actions: `<a class="btn btn-primary" href="#/scan">${icon('camera', 17)} ${tr('Scan Crop', 'Pima Zao')}</a><a class="btn btn-secondary" href="#/farms">${icon('farms', 17)} ${tr('Farms', 'Mashamba')}</a>`
      })}

      ${overdue.length ? `<div class="alert-box alert-danger">${icon('warning', 20)}<div><strong>${formatNumber(overdue.length)} ${tr('follow-up reminders overdue', 'vikumbusho vimepitiliza muda')}</strong><p>${tr('Complete field checks to prevent further spread.', 'Kamilisha ukaguzi ili kuzuia kuenea zaidi.')}</p></div><a class="btn btn-sm btn-danger" href="#/follow-ups">${tr('Review', 'Angalia')}</a></div>` : ''}

      <section class="stats-grid stats-grid-six" aria-label="Farm health metrics">
        ${renderStatCard({ label: tr('Farms', 'Mashamba'), value: formatNumber(stats.total_farms), sublabel: tr('registered', 'yaliyosajiliwa'), iconName: 'farms' })}
        ${renderStatCard({ label: tr('Crop plots', 'Vipande'), value: formatNumber(stats.total_plots), sublabel: tr('under monitoring', 'vinavyofuatiliwa'), iconName: 'sprout' })}
        ${renderStatCard({ label: tr('Total scans', 'Vipimo vyote'), value: formatNumber(stats.total_scans), sublabel: tr('AI records', 'rekodi za AI'), iconName: 'scan', tone: 'blue' })}
        ${renderStatCard({ label: tr('Active issues', 'Masuala'), value: formatNumber(stats.active_issues), sublabel: tr('requiring action', 'yanayohitaji hatua'), iconName: 'warning', tone: 'red' })}
        ${renderStatCard({ label: tr('Healthy scans', 'Vipimo salama'), value: formatNumber(stats.healthy_scans), sublabel: stats.total_scans ? `${Math.round((stats.healthy_scans / stats.total_scans) * 100)}% ${tr('healthy', 'salama')}` : (tr('no disease detected', 'bila ugonjwa')), iconName: 'check' })}
        ${renderStatCard({ label: tr('Pending follow-ups', 'Ufuatiliaji'), value: formatNumber(stats.pending_follow_ups ?? pending.length), sublabel: overdue.length ? `${formatNumber(overdue.length)} ${tr('overdue', 'zimechelewa')}` : (tr('open reminders', 'vikumbusho')), iconName: 'tasks', tone: 'amber' })}
      </section>

      <section class="quick-action-grid" aria-label="Quick actions">
        <a class="quick-action quick-action-primary" href="#/scan">
          <span>${icon('camera', 22)}</span>
          <div><strong>${tr('Scan Crop', 'Pima zao')}</strong><small>${tr('Detect crop disease with AI', 'Tambua magonjwa kwa AI')}</small></div>${icon('arrow', 18)}
        </a>
        <a class="quick-action" href="#/farms">
          <span>${icon('farms', 22)}</span>
          <div><strong>${tr('Add Farm', 'Ongeza shamba')}</strong><small>${tr('Register and organize plots', 'Panga vipande vya mazao')}</small></div>${icon('arrow', 18)}
        </a>
        <a class="quick-action" href="#/history">
          <span>${icon('history', 22)}</span>
          <div><strong>${tr('View History', 'Historia')}</strong><small>${tr('Review past scans and actions', 'Fungua matokeo ya zamani')}</small></div>${icon('arrow', 18)}
        </a>
      </section>

      <div class="dashboard-grid">
        <section class="card">
          <div class="card-header">
            <div><h2>${tr('Recent Scans', 'Vipimo vya hivi karibuni')}</h2><p>${tr('Latest records from your live account', 'Matokeo ya mwisho kutoka kwa API')}</p></div>
            <a class="btn btn-secondary btn-sm" href="#/history">${tr('View all', 'Yote')}</a>
          </div>
          ${scans.length ? renderRecentScansTable(scans.slice(0, 5), isSw) :
            renderEmptyState({ iconName: 'camera', title: tr('No scans yet', 'Hakuna vipimo bado'), body: tr('Start by photographing an affected leaf.', 'Anza kwa kupiga picha ya jani lililoathirika.'), action: `<a class="btn btn-primary" href="#/scan">${tr('Start first scan', 'Pima kwanza')}</a>` })}
        </section>

        <section class="card trend-card">
          <div class="card-header">
            <div><h2>${tr('Crop Health Trend', 'Mwelekeo wa afya')}</h2><p>${tr('Last six months · real scan counts', 'Miezi 6 iliyopita')}</p></div>
          </div>
          ${scans.length ? `<div class="chart-frame"><canvas id="crop-trend-chart" aria-label="Healthy and diseased scan trend"></canvas></div>` :
            renderEmptyState({ iconName: 'chart', title: tr('No trend yet', 'Hakuna mwelekeo bado'), body: tr('Trends appear after scans are recorded.', 'Mwelekeo utaonekana baada ya vipimo.') })}
        </section>
      </div>

      <div class="dashboard-grid dashboard-grid-secondary">
        <section class="card">
          <div class="card-header"><div><h2>${tr('Disease Alerts', 'Arifa za magonjwa')}</h2><p>${tr('Recent cases from your scans', 'Kesi za hivi karibuni')}</p></div></div>
          ${alerts.length ? alerts.map(scan => `
            <article class="alert-row">
              <img class="alert-thumb" data-secure-src="/api/v1/scans/${encodeURIComponent(scan.id)}/image" alt="" loading="lazy">
              <div><strong>${scan.status === 'uncertain' ? (tr('Uncertain condition', 'Uchunguzi usio na uhakika')) : esc(formatDiseaseName(scan.predicted_label))}</strong><p>${cropLabel(scan.crop_hint)} · ${formatDate(scan.timestamp)}</p></div>
              ${getSeverityBadge(scan.severity_category)}
            </article>`).join('') :
            renderEmptyState({ iconName: 'shield', title: tr('No disease alerts', 'Hakuna arifa'), body: tr('Recent scans have not detected disease.', 'Vipimo vya hivi karibuni havijaonyesha ugonjwa.') })}
        </section>

        <section class="card">
          <div class="card-header"><div><h2>${tr('Follow-up Reminders', 'Vikumbusho')}</h2><p>${formatNumber(pending.length)} ${tr('pending', 'vinasubiri')}</p></div><a class="btn btn-secondary btn-sm" href="#/follow-ups">${tr('All tasks', 'Yote')}</a></div>
          ${pending.length ? pending.slice(0, 4).map(f => renderFollowUpCompact(f)).join('') :
            renderEmptyState({ iconName: 'check', title: tr('No follow-ups due', 'Hakuna kazi'), body: tr('Reminders are created when disease is detected.', 'Vikumbusho huundwa ugonjwa unapogunduliwa.') })}
        </section>
      </div>

      <section class="recommendation-panel">
        <div class="recommendation-icon">${icon('sprout', 24)}</div>
        <div>
          <p class="page-eyebrow">${tr('AI Recommendation', 'Mapendekezo ya AI')}</p>
          <h2>${latestDetail ? esc(formatDiseaseName(latestDetail.predicted_label || latestDetail.status)) : (tr('Recommendations appear after your first scan', 'Mapendekezo yataonekana baada ya kipimo'))}</h2>
          ${recommendations.length ? `<ul>${recommendations.slice(0, 3).map(item => `<li>${icon('check', 15)} ${esc(item)}</li>`).join('')}</ul>` : `<p>${tr('Scan a leaf to receive agronomic steps based on your live result.', 'Pima jani ili kupata hatua za kilimo zinazotegemea matokeo halisi.')}</p>`}
        </div>
        ${latestDetail ? `<a class="btn btn-secondary" href="#/scans/${encodeURIComponent(latestDetail.id)}">${tr('Open result', 'Fungua matokeo')}</a>` : `<a class="btn btn-primary" href="#/scan">${tr('Start scan', 'Anza kipimo')}</a>`}
      </section>
    </div>`;
}

function renderRecentScansTable(list, isSw) {
  const rows = list.map(scan => {
    const healthy = isHealthyScan(scan);
    const dot = scan.status === 'uncertain' ? 'is-uncertain' : (healthy ? 'is-healthy' : 'is-diseased');
    return `
      <tr class="scan-row" onclick="location.hash='#/scans/${encodeURIComponent(scan.id)}'">
        <td data-label="${tr('Image', 'Picha')}"><img class="scan-thumb" data-secure-src="/api/v1/scans/${encodeURIComponent(scan.id)}/image" alt="" loading="lazy"></td>
        <td data-label="${tr('Crop', 'Zao')}"><strong>${cropLabel(scan.crop_hint)}</strong></td>
        <td data-label="${tr('Result', 'Matokeo')}"><a class="result-link ${dot}" href="#/scans/${encodeURIComponent(scan.id)}"><i></i>${esc(formatDiseaseName(scan.predicted_label || scan.status))}</a></td>
        <td data-label="${tr('Confidence', 'Uhakika')}" class="num">${formatPercent(scan.confidence)}</td>
        <td data-label="${tr('Severity', 'Ukali')}">${getSeverityBadge(scan.severity_category)}</td>
        <td data-label="${tr('Date', 'Tarehe')}" class="date">${formatDateTime(scan.timestamp)}</td>
      </tr>`;
  }).join('');
  return `<div class="table-responsive scan-table-wrap"><table class="scan-table"><thead><tr><th>${tr('Image', 'Picha')}</th><th>${tr('Crop', 'Zao')}</th><th>${tr('Result', 'Matokeo')}</th><th>${tr('Confidence', 'Uhakika')}</th><th>${tr('Severity', 'Ukali')}</th><th>${tr('Date', 'Tarehe')}</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

function renderScanListItem(scan) {
  const statusIcon = scan.status === 'uncertain' ? 'info' : (isHealthyScan(scan) ? 'check' : 'warning');
  const statusTone = scan.status === 'uncertain' ? 'blue' : (isHealthyScan(scan) ? 'green' : 'red');
  return `
    <a class="scan-list-item" href="#/scans/${encodeURIComponent(scan.id)}">
      <span class="scan-status-icon scan-status-${statusTone}">${icon(statusIcon, 18)}</span>
      <span class="scan-list-main"><strong>${esc(formatDiseaseName(scan.predicted_label || scan.status))}</strong><small>${cropLabel(scan.crop_hint)} · ${formatDateTime(scan.timestamp)}</small></span>
      <span class="scan-list-meta">${formatPercent(scan.confidence)}</span>
      ${getSeverityBadge(scan.severity_category)}
    </a>`;
}

function renderFollowUpCompact(item) {
  const overdue = item.status === 'pending' && new Date(item.due_date) < new Date();
  return `
    <article class="followup-compact ${overdue ? 'is-overdue' : ''}">
      <div><strong>${formatDate(item.due_date)}</strong><p>${esc(item.notes || 'Check affected plant progress')}</p></div>
      <a class="btn btn-sm btn-secondary" href="#/scans/${encodeURIComponent(item.scan_id)}">${tr('Scan', 'Kipimo')}</a>
    </article>`;
}

// 4. Scan upload workflow
/* ---------- analyzing step: scan > detect > heal animation (visual only, no API calls) ---------- */
function analyzingLeafSVG() {
  const LEAF = 'M150 18C262 92 276 228 150 346 24 228 38 92 150 18Z';
  const spots = [[118, 128, 20, .9], [188, 196, 26, 1.4], [108, 244, 16, 1.75], [186, 118, 13, .85]];
  const sprouts = [[110, 300, 0], [150, 320, .5], [190, 300, 1], [130, 270, 1.4], [175, 250, .8]];
  return `<svg class="pf-art an-art" viewBox="0 0 300 370" aria-hidden="true" focusable="false"><defs>
    <linearGradient id="anG1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color=" #37a66f"/><stop offset="1" stop-color="#0d4f35"/></linearGradient>
    <linearGradient id="anG2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#73d89c"/><stop offset=".55" stop-color="#3DDC97"/><stop offset="1" stop-color="#0f7a5a"/></linearGradient>
    <linearGradient id="anSw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#73d89c" stop-opacity="0"/><stop offset=".85" stop-color="#73d89c" stop-opacity=".4"/><stop offset="1" stop-color="#c9f4d9" stop-opacity=".95"/></linearGradient>
    <radialGradient id="anSp"><stop offset="0" stop-color="#5a230a"/><stop offset=".6" stop-color="#d9731a"/><stop offset="1" stop-color="#ffb454" stop-opacity="0"/></radialGradient>
    <clipPath id="anClip"><path d="${LEAF}"/></clipPath></defs>
    <g class="pf-leaf-sway"><g class="pf-leaf">
      <path d="${LEAF}" fill="url(#anG1)" stroke="#73d89c" stroke-opacity=".6" stroke-width="2"/>
      <path class="pf-heal" d="${LEAF}" fill="url(#anG2)"/>
      <g stroke="#c9f4d9" stroke-opacity=".38" fill="none" stroke-linecap="round" stroke-width="1.6"><path d="M150 30V340"/>
        <path d="M150 100C190 112 214 132 232 158M150 100C110 112 86 132 68 158"/><path d="M150 160C196 174 222 198 240 232M150 160C104 174 78 198 60 232"/>
        <path d="M150 220C184 232 204 252 214 280M150 220C116 232 96 252 86 280"/></g>
      <g clip-path="url(#anClip)"><rect class="pf-sweep" x="0" y="-80" width="300" height="80" fill="url(#anSw)"/></g>
      ${spots.map(p => `<g transform="translate(${p[0]} ${p[1]})"><g class="pf-sp" style="animation-delay:${p[3]}s"><circle r="${p[2]}" fill="url(#anSp)"/><circle r="${(p[2] * .42).toFixed(1)}" fill="#4a1d08" opacity=".75"/><circle class="pf-ring" r="${p[2] + 9}"/></g></g>`).join('')}
    </g></g>
    ${sprouts.map(q => `<g transform="translate(${q[0]} ${q[1]})"><path class="pf-sprout" style="animation-delay:${q[2]}s" d="M0 0C7-6 7-15 0-22-7-15-7-6 0 0Z"/></g>`).join('')}
  </svg>`;
}

function analyzingPanelHTML() {
  return `
    <section class="scan-analyzing" id="scan-analyzing" role="status" aria-live="polite" aria-busy="true">
      <div class="an-stage">${analyzingLeafSVG()}</div>
      <h2 class="an-title">${esc(tr('Analyzing with AI…', 'AI inachambua…'))}</h2>
      <div class="an-phases" aria-hidden="true">
        <span class="an-ph an-ph1">${esc(tr('Scanning your leaf…', 'Inachanganua jani lako…'))}</span>
        <span class="an-ph an-ph2">${esc(tr('Detecting disease…', 'Inatambua ugonjwa…'))}</span>
        <span class="an-ph an-ph3">${esc(tr('Preparing your recovery plan…', 'Inaandaa mpango wa kupona…'))}</span>
      </div>
      <ol class="an-dots" aria-hidden="true">
        <li class="an-d1"><i></i>${esc(tr('Scan', 'Pima'))}</li>
        <li class="an-d2"><i></i>${esc(tr('Detect', 'Tambua'))}</li>
        <li class="an-d3"><i></i>${esc(tr('Heal', 'Ponya'))}</li>
      </ol>
      <div class="an-bar" aria-hidden="true"><i></i></div>
      <p class="an-note">${esc(tr('Please keep this screen open. This usually takes a few seconds.', 'Tafadhali acha skrini hii wazi. Kwa kawaida huchukua sekunde chache.'))}</p>
    </section>`;
}

function showAnalyzing(form) {
  if (!form || document.getElementById('scan-analyzing')) return;
  form.insertAdjacentHTML('beforebegin', analyzingPanelHTML());
  form.style.display = 'none';
  const panel = document.getElementById('scan-analyzing');
  const calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  panel?.scrollIntoView({ block: 'center', behavior: calm ? 'auto' : 'smooth' });
}

function hideAnalyzing(form) {
  document.getElementById('scan-analyzing')?.remove();
  if (form) form.style.display = '';
}

async function renderScan() {
  if (!state.user) { navigate('#/login'); return ''; }
  let farms = [];
  try { farms = await api.getFarms(); }
  catch (err) { return renderErrorState('Unable to load farms', err.message); }
  const isSw = isSwahili();

  return `
    <div class="scan-page">
      ${renderPageHeader({
        eyebrow: tr('AI screening workflow', 'Uchunguzi wa AI'),
        title: tr('Scan a crop leaf', 'Pima jani la mmea'),
        description: tr('Choose the farm context, add a clear leaf image, then run analysis.', 'Chagua shamba, weka picha safi, kisha tumia uchambuzi.')
      })}

      <div class="scan-layout">
        <section class="card scan-card">
          <ol class="stepper" aria-label="Scan workflow">
            <li><span>1</span>${tr('Farm', 'Shamba')}</li>
            <li><span>2</span>${tr('Crop', 'Zao')}</li>
            <li><span>3</span>${tr('Photo', 'Picha')}</li>
            <li><span>4</span>${tr('Analyze', 'Chambua')}</li>
          </ol>

          <form id="scan-form" novalidate>
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label" for="scan-farm">${tr('Farm', 'Shamba')}</label>
                <select class="form-select" id="scan-farm">
                  <option value="">${tr('General / unassigned', 'Bila shamba maalum')}</option>
                  ${farms.map(f => `<option value="${esc(f.id)}">${esc(f.name)} · ${esc(f.county)}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" for="scan-plot">${tr('Crop plot', 'Kipande')}</label>
                <select class="form-select" id="scan-plot" disabled><option value="">${tr('Select farm first', 'Chagua shamba kwanza')}</option></select>
              </div>
            </div>
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label" for="scan-crop">${tr('Crop type', 'Aina ya zao')}</label>
                <select class="form-select" id="scan-crop" required>
                  <option value="">${tr('Select crop', 'Chagua zao')}</option>
                  <option value="maize">${tr('Maize', 'Mahindi')}</option>
                  <option value="potato">${tr('Irish potato', 'Viazi mviringo')}</option>
                  <option value="tomato">${tr('Tomato', 'Nyanya')}</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" for="scan-stage">${tr('Growth stage', 'Hatua ya ukuaji')}</label>
                <select class="form-select" id="scan-stage">
                  <option value="">${tr('Select', 'Chagua')}</option>
                  <option value="Seedling / Nursery">${tr('Seedling / nursery', 'Miche / kitalu')}</option>
                  <option value="Vegetative">${tr('Vegetative', 'Ukuaji wa majani')}</option>
                  <option value="Flowering / Tasseling">${tr('Flowering / tasseling', 'Maua / mbelewele')}</option>
                  <option value="Fruiting / Grain Filling">${tr('Fruiting / grain filling', 'Matunda / nafaka')}</option>
                  <option value="Maturation">${tr('Maturation', 'Kukomaa')}</option>
                </select>
              </div>
            </div>

            <div class="form-group scan-photo-section">
              <div class="scan-photo-heading">
                <div>
                  <span class="scan-kicker">${icon('leaf', 15)} ${tr('Leaf intelligence', 'Uchambuzi wa jani')}</span>
                  <label class="form-label">${tr('Leaf photo', 'Picha ya jani')} <span aria-hidden="true">*</span></label>
                </div>
                <span class="scan-secure-note">${icon('shield', 14)} ${tr('Private AI screening', 'Uchunguzi salama wa AI')}</span>
              </div>

              <div class="scan-source-tabs" role="tablist" aria-label="Image source">
                <button type="button" class="scan-source-tab active" id="upload-tab-btn" onclick="switchScanSource('upload')">${icon('upload', 17)} ${tr('Upload image', 'Pakia picha')}</button>
                <button type="button" class="scan-source-tab" id="camera-tab-btn" onclick="switchScanSource('camera')">${icon('camera', 17)} ${tr('Use camera', 'Tumia kamera')}</button>
              </div>

              <div id="upload-scan-panel" class="scan-source-panel">
                <div class="upload-dropzone premium-dropzone" id="upload-dropzone" role="button" tabindex="0" aria-label="Upload leaf image">
                  <span class="upload-icon">${icon('leaf', 30)}</span>
                  <strong>${tr('Choose a clear leaf photo', 'Chagua picha wazi ya jani')}</strong>
                  <p>${tr('One leaf, natural light, sharp focus. JPEG, PNG, or WebP up to 10 MB.', 'Jani moja, mwanga wa kawaida, picha iliyo wazi.')}</p>
                  <input id="scan-file" name="file" type="file" accept="image/jpeg,image/png,image/webp">
                </div>
              </div>

              <div id="camera-scan-panel" class="scan-source-panel" hidden>
                <div class="camera-shell">
                  <div class="camera-leaf leaf-one">${icon('leaf', 34)}</div>
                  <div class="camera-leaf leaf-two">${icon('leaf', 26)}</div>
                  <div id="camera-area" class="camera-area">
                    <video id="camera-preview" autoplay muted playsinline></video>
                    <div class="camera-guide" aria-hidden="true">
                      <div class="camera-guide-box"></div>
                      <span>${tr('Place one leaf inside the frame', 'Weka jani moja ndani ya fremu')}</span>
                    </div>
                  </div>
                  <canvas id="camera-canvas" hidden></canvas>

                  <div id="camera-photo-wrapper" class="camera-photo-wrapper" hidden>
                    <img id="camera-photo-preview" alt="Captured leaf preview">
                    <div class="camera-photo-badge">${icon('check', 15)} ${tr('Captured and ready', 'Picha iko tayari')}</div>
                  </div>

                  <div class="camera-buttons">
                    <button type="button" class="btn btn-secondary" id="open-camera-btn" onclick="startCamera()">${icon('camera', 17)} ${tr('Open camera', 'Fungua kamera')}</button>
                    <button type="button" class="btn btn-primary" id="camera-capture-btn" onclick="captureLeafFromCamera()" disabled>${icon('scan', 17)} ${tr('Capture leaf', 'Piga picha ya jani')}</button>
                    <button type="button" class="btn btn-secondary" id="camera-retake-btn" onclick="retakeCameraPhoto()" hidden>${icon('refresh', 17)} ${tr('Retake', 'Piga tena')}</button>
                  </div>
                </div>
              </div>
            </div>

            <div class="preview-panel" id="preview-container" hidden>
              <div class="preview-image-wrap"><img id="preview-img" alt="Selected leaf preview"></div>
              <div class="preview-side">
                <div id="quality-feedback"></div>
                <div class="preview-actions">
                  <button class="btn btn-secondary btn-sm" type="button" onclick="document.getElementById('scan-file').click()">${tr('Replace', 'Badilisha')}</button>
                  <button class="btn btn-danger btn-sm" type="button" onclick="removeScanImage()">${tr('Remove', 'Ondoa')}</button>
                </div>
              </div>
            </div>

            <button class="btn btn-primary btn-lg btn-full" id="submit-scan-btn" type="submit">${icon('microscope', 18)} ${tr('Analyze Leaf with AI', 'Chambua kwa AI')}</button>
          </form>
        </section>

        <aside class="scan-guidance">
          <section class="card guidance-card">
            <h2>${tr('Image-quality tips', 'Vidokezo vya picha bora')}</h2>
            <ul class="check-list">
              <li>${icon('check', 16)} ${tr('Fill most of the frame with one leaf', 'Jaza sehemu kubwa ya picha na jani moja')}</li>
              <li>${icon('check', 16)} ${tr('Use natural light without harsh shadow', 'Tumia mwanga wa asili bila kivuli kikali')}</li>
              <li>${icon('check', 16)} ${tr('Hold steady and avoid blur', 'Shikilia simu imara na epuka ukungu')}</li>
              <li>${icon('check', 16)} ${tr('Include lesions and healthy tissue', 'Onyesha madoa na sehemu yenye afya')}</li>
            </ul>
          </section>
          <section class="field-note-card">
            <span>${icon('shield', 22)}</span>
            <h3>${tr('Below-threshold results', 'Matokeo ya chini ya kigezo')}</h3>
            <p>${tr('If confidence is below threshold, you will be guided to retake the photo or seek expert review.', 'Ikiwa mfumo hautakuwa na uhakika, utaelekezwa kupiga picha nyingine au kupata mapitio ya mtaalamu.')}</p>
          </section>
        </aside>
      </div>
    </div>`;
}

async function startCamera() {
  const video = document.getElementById('camera-preview');
  const captureBtn = document.getElementById('camera-capture-btn');
  const openBtn = document.getElementById('open-camera-btn');
  const retakeBtn = document.getElementById('camera-retake-btn');
  const photoWrapper = document.getElementById('camera-photo-wrapper');
  const cameraArea = document.getElementById('camera-area');

  if (!video) return;
  if (!navigator.mediaDevices?.getUserMedia) {
    toast(tr('Camera access is not supported in this browser.', 'Kamera haitumiki kwenye kivinjari hiki.'), 'error');
    return;
  }

  try {
    stopCamera();
    if (photoWrapper) photoWrapper.hidden = true;
    if (cameraArea) cameraArea.hidden = false;
    if (retakeBtn) retakeBtn.hidden = true;
    if (captureBtn) captureBtn.disabled = true;

    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1280 },
        height: { ideal: 960 }
      },
      audio: false
    });

    video.srcObject = cameraStream;
    await video.play();
    if (captureBtn) captureBtn.disabled = false;
    if (openBtn) openBtn.hidden = true;
    toast(tr('Camera ready. Center one leaf in the guide.', 'Kamera iko tayari. Weka jani moja katikati.'), 'success');
  } catch (error) {
    console.error('Camera error:', error);
    toast(tr('Unable to open camera. Allow camera permission and try again.', 'Imeshindwa kufungua kamera. Ruhusu kamera kisha jaribu tena.'), 'error');
  }
}

function stopCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
    cameraStream = null;
  }
  const video = document.getElementById('camera-preview');
  if (video) video.srcObject = null;
}

function captureLeafFromCamera() {
  const video = document.getElementById('camera-preview');
  const canvas = document.getElementById('camera-canvas');
  const preview = document.getElementById('camera-photo-preview');
  const photoWrapper = document.getElementById('camera-photo-wrapper');
  const cameraArea = document.getElementById('camera-area');
  const captureBtn = document.getElementById('camera-capture-btn');
  const openBtn = document.getElementById('open-camera-btn');
  const retakeBtn = document.getElementById('camera-retake-btn');

  if (!video?.videoWidth || !video?.videoHeight || !canvas) {
    toast(tr('Camera is still starting. Please try again.', 'Kamera bado inaanza. Jaribu tena.'), 'error');
    return;
  }

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  canvas.toBlob(blob => {
    if (!blob) {
      toast(tr('Could not capture the image.', 'Imeshindwa kupiga picha.'), 'error');
      return;
    }

    capturedCameraFile = new File([blob], `leaf-camera-${Date.now()}.jpg`, {
      type: 'image/jpeg',
      lastModified: Date.now()
    });

    if (preview) preview.src = URL.createObjectURL(blob);
    if (photoWrapper) photoWrapper.hidden = false;
    if (cameraArea) cameraArea.hidden = true;
    if (captureBtn) captureBtn.disabled = true;
    if (captureBtn) captureBtn.hidden = true;
    if (openBtn) openBtn.hidden = true;
    if (retakeBtn) retakeBtn.hidden = false;

    stopCamera();
    handleScanFile(capturedCameraFile);
    toast(tr('Leaf captured. Ready for AI analysis.', 'Jani limepigwa picha. Tayari kwa uchambuzi wa AI.'), 'success');
  }, 'image/jpeg', 0.92);
}

function retakeCameraPhoto() {
  capturedCameraFile = null;
  const captureBtn = document.getElementById('camera-capture-btn');
  if (captureBtn) captureBtn.hidden = false;
  startCamera();
}

function switchScanSource(source) {
  const uploadPanel = document.getElementById('upload-scan-panel');
  const cameraPanel = document.getElementById('camera-scan-panel');
  const uploadBtn = document.getElementById('upload-tab-btn');
  const cameraBtn = document.getElementById('camera-tab-btn');

  if (!uploadPanel || !cameraPanel) return;

  if (source === 'camera') {
    uploadPanel.hidden = true;
    cameraPanel.hidden = false;
    uploadBtn?.classList.remove('active');
    cameraBtn?.classList.add('active');
    capturedCameraFile = null;
    startCamera();
  } else {
    cameraPanel.hidden = true;
    uploadPanel.hidden = false;
    cameraBtn?.classList.remove('active');
    uploadBtn?.classList.add('active');
    capturedCameraFile = null;
    stopCamera();
  }
}

window.removeScanImage = function removeScanImage() {
  const input = document.getElementById('scan-file');
  const preview = document.getElementById('preview-container');
  const image = document.getElementById('preview-img');
  if (state.previewObjectUrl) URL.revokeObjectURL(state.previewObjectUrl);
  state.previewObjectUrl = null;
  if (input) input.value = '';
  if (image) image.removeAttribute('src');
  if (preview) preview.hidden = true;
};

// 5. Diagnosis result
async function renderScanDetails(scanId) {
  let scan;
  try { scan = await api.getScan(scanId); }
  catch (err) { return renderErrorState('Unable to load scan result', err.message); }

  const isSw = isSwahili();
  const recs = scan.recommendation_snapshot || {};
  const isUncertain = scan.is_accepted === false || scan.status === 'uncertain' || !scan.predicted_label;
  const healthy = isHealthyScan(scan);
  const confidence = getConfidenceMeta(scan.confidence, !isUncertain);
  const title = isUncertain
    ? (tr("We couldn't confidently identify this condition.", 'Hatuwezi kutambua hali hii kwa uhakika.'))
    : esc(formatDiseaseName(scan.predicted_label || scan.status));
  const alternatives = scan.top3 || scan.top_predictions || scan.alternatives || scan.top_k || [];
  const qualityFeedback = scan.quality_info || scan.image_quality_feedback || scan.image_quality || scan.quality_feedback;

  return `
    <div class="result-page">
      <div class="result-toolbar">
        <a class="btn btn-secondary btn-sm" href="#/history">← ${tr('Back to history', 'Historia')}</a>
        <div class="result-actions">
          <button class="btn btn-outline btn-sm" type="button" onclick="downloadProtectedFile('/api/v1/scans/${encodeURIComponent(scan.id)}/report.pdf', 'crop-health-report-${encodeURIComponent(scan.id)}.pdf')">${icon('download', 16)} PDF</button>
          <button class="btn btn-secondary btn-sm" type="button" onclick="openCreateFollowUpModal('${esc(scan.id)}')">${icon('tasks', 16)} ${tr('Schedule follow-up', 'Panga ufuatiliaji')}</button>${state.user && (state.user.role === 'extension_officer' || state.user.role === 'admin') ? `<button class="btn btn-secondary btn-sm" type="button" onclick="openReviewModal('${esc(scan.id)}', '${esc(scan.predicted_label || scan.status)}')">${icon('users', 16)} Expert review</button>` : ''}
        </div>
      </div>

      <section class="diagnosis-hero ${isUncertain ? 'is-uncertain' : healthy ? 'is-healthy' : 'is-diseased'}">
        <div class="diagnosis-heading">
          <p class="page-eyebrow">${tr('Diagnostic result', 'Matokeo ya uchunguzi')} · ${formatDateTime(scan.timestamp)}</p>
          <h1>${title}</h1>
          <p>${esc(scan.county || 'Kenya')} · ${cropLabel(scan.crop_hint)}</p>
        </div>
        <div class="diagnosis-badges">
          ${isUncertain ? '<span class="badge badge-moderate">Needs review</span>' : getSeverityBadge(scan.severity_category)}
          <span class="badge badge-${confidence.tone === 'success' ? 'healthy' : confidence.tone === 'warning' ? 'moderate' : 'uncertain'}">${esc(confidence.label)}</span>
        </div>
        <dl class="result-metrics">
          <div><dt>${tr('Confidence', 'Uhakika')}</dt><dd>${formatPercent(scan.confidence)}</dd><small>${esc(confidence.label)}</small></div>
          <div><dt>${tr('Severity', 'Ukali')}</dt><dd>${scan.severity_category ? esc(formatDiseaseName(scan.severity_category)) : 'N/A'}</dd><small>${tr('severity band', 'kategoria')}</small></div>
          <div><dt>${tr('Affected area', 'Eneo lililoathirika')}</dt><dd>${scan.affected_percent === null || scan.affected_percent === undefined ? 'N/A' : `${Number(scan.affected_percent).toFixed(1)}%`}</dd><small>${tr('image estimate', 'kadirio la picha')}</small></div>
        </dl>
      </section>

      ${isUncertain ? `
        <section class="card uncertainty-card">
          <div class="uncertainty-icon">${icon('info', 24)}</div>
          <div>
            <h2>${tr('Recommended next step', 'Hatua inayopendekezwa')}</h2>
            <p>${tr('Retake a sharp image of the affected leaf. Include symptomatic and healthy tissue where possible, avoiding blur and harsh shadow.', 'Piga picha nyingine iliyo wazi ya jani lililoathirika. Ikiwezekana weka sehemu yenye dalili na sehemu yenye afya, bila ukungu au kivuli.')}</p>
            ${renderImageQualityFeedback(qualityFeedback)}
            ${alternatives.length ? `<div class="alternative-list"><h3>${tr('Top alternatives', 'Uwezekano mwingine')}</h3>${alternatives.map(item => `<span class="badge badge-uncertain">${esc(formatDiseaseName(item.label || item.predicted_label || item))}${item.confidence !== undefined ? ` · ${formatPercent(item.confidence)}` : ''}</span>`).join('')}</div>` : ''}
            <div class="action-row"><a class="btn btn-primary" href="#/scan">${icon('camera', 17)} ${tr('Retake photo', 'Piga picha nyingine')}</a></div>
          </div>
        </section>` : ''}

      <section class="card visual-analysis-card">
        <div class="card-header">
          <div><h2>${tr('Visual analysis', 'Uchambuzi wa picha')}</h2><p>${tr('Original image and Grad-CAM explanation', 'Picha asili na ramani ya Grad-CAM')}</p></div>
        </div>
        <div class="visual-grid ${scan.gradcam_path ? '' : 'single'}">
          <figure>
            <img data-secure-src="/api/v1/scans/${encodeURIComponent(scan.id)}/image" alt="Original uploaded crop leaf" loading="lazy">
            <figcaption>${tr('Uploaded image', 'Picha halisi')}</figcaption>
          </figure>
          ${scan.gradcam_path ? `<figure><img data-secure-src="/api/v1/scans/${encodeURIComponent(scan.id)}/gradcam" alt="Grad-CAM heatmap highlighting regions used by the AI" loading="lazy"><figcaption>AI Heatmap (Grad-CAM)</figcaption></figure>` : ''}
        </div>
      </section>

      ${scan.ground_truth_status === 'expert_verified' ? `
        <section class="expert-verified-card">
          <span>${icon('users', 24)}</span>
          <div><h2>${tr('Verified by an extension officer', 'Imethibitishwa na afisa ugani')}</h2><p><strong>${tr('Decision', 'Uamuzi')}:</strong> ${scan.verified_label ? esc(formatDiseaseName(scan.verified_label)) : 'Confirmed'}</p><small>${formatDateTime(scan.verification_timestamp)}</small></div>
        </section>` : ''}

      ${renderRecommendationSections(recs, isSw)}

      <section class="card feedback-card" id="feedback-card">
        <div class="card-header"><div><h2>${t('headers.feedback')}</h2><p>${tr('Your field feedback helps improve the service', 'Mrejesho wako husaidia kuboresha huduma')}</p></div></div>
        <form id="feedback-form" data-scan-id="${esc(scan.id)}">
          <div class="form-group">
            <span class="form-label">${t('feedback.helpful_question')}</span>
            <div class="radio-row">
              <label><input type="radio" name="helpful" value="yes" required> ${t('feedback.yes')}</label>
              <label><input type="radio" name="helpful" value="no"> ${t('feedback.no')}</label>
              <label><input type="radio" name="helpful" value="not_sure"> ${t('feedback.not_sure')}</label>
            </div>
          </div>
          <div class="form-grid">
            <div class="form-group"><label class="form-label" for="feedback-outcome">${t('feedback.outcome_question')}</label><select class="form-select" id="feedback-outcome" name="outcome"><option value="">Select</option><option value="improved">${t('feedback.improved')}</option><option value="unchanged">${t('feedback.unchanged')}</option><option value="worsened">${t('feedback.worsened')}</option></select></div>
            <div class="form-group"><label class="form-label" for="feedback-notes">${tr('Notes', 'Maelezo')}</label><input class="form-control" id="feedback-notes" name="notes" placeholder="${tr('Changes after 3–5 days…', 'Mabadiliko baada ya siku 3–5…')}"></div>
          </div>
          <button class="btn btn-secondary" id="submit-feedback-btn" type="submit">${t('feedback.submit')}</button>
        </form>
      </section>

      <p class="legal-note">${esc(t('disclaimer_text'))}</p>
    </div>`;
}

function renderImageQualityFeedback(feedback) {
  if (!feedback) return '';
  if (Array.isArray(feedback)) {
    return `<ul class="check-list warning-list">${feedback.map(item => `<li>${icon('warning', 15)} ${esc(item)}</li>`).join('')}</ul>`;
  }
  if (typeof feedback === 'object') {
    return `<ul class="check-list warning-list">${Object.entries(feedback).map(([key, value]) => `<li>${icon('warning', 15)} <strong>${esc(formatDiseaseName(key))}:</strong> ${esc(value)}</li>`).join('')}</ul>`;
  }
  return `<p class="quality-note">${esc(feedback)}</p>`;
}

function renderRecommendationSections(recs, isSw) {
  const sections = [
    ['management', 'warning', t('headers.what_to_do_now'), recs.management],
    ['prevention', 'shield', t('headers.prevention'), recs.prevention],
    ['monitoring', 'eye', t('headers.monitoring'), recs.monitoring],
    ['escalation', 'users', t('headers.escalation'), recs.escalation]
  ].filter(([, , , items]) => Array.isArray(items) && items.length);

  if (!sections.length && !recs.kenya_notes && !recs.safety) {
    return `<section class="card">${renderEmptyState({ iconName: 'sprout', title: tr('No recommendation snapshot available', 'Hakuna mwongozo uliopatikana'), body: tr('This record does not include stored agronomic guidance.', 'Rekodi hii haina mapendekezo yaliyohifadhiwa.') })}</section>`;
  }

  return `
    <section class="recommendations-stack" aria-label="Agronomic recommendations">
      ${sections.map(([key, iconName, title, items]) => `
        <article class="recommendation-section rec-${key}">
          <div class="recommendation-title"><span>${icon(iconName, 19)}</span><h2>${esc(title)}</h2></div>
          <ol>${items.map(item => `<li>${esc(item)}</li>`).join('')}</ol>
        </article>`).join('')}
      ${recs.kenya_notes ? `<aside class="kenya-note"><strong>Kenya field note</strong><p>${esc(recs.kenya_notes)}</p></aside>` : ''}
      ${recs.sources?.length ? `<div class="source-list"><h3>${esc(t('headers.sources'))}</h3>${recs.sources.map(source => `<a href="${safeUrl(source)}" target="_blank" rel="noopener">${esc(source)}</a>`).join('')}</div>` : ''}
      ${recs.safety ? `<aside class="safety-note"><strong>${tr('Chemical stewardship', 'Usalama wa kemikali')}</strong><p>${esc(recs.safety)}</p></aside>` : ''}
    </section>`;
}

// 6. Farms and plots
async function renderFarms() {
  if (!state.user) { navigate('#/login'); return ''; }
  let farms = [];
  try { farms = await api.getFarms(); }
  catch (err) { return renderErrorState('Unable to load farms', err.message); }
  const isSw = isSwahili();

  return `
    <div class="content-page">
      ${renderPageHeader({
        eyebrow: tr('Farm management', 'Usimamizi wa mashamba'),
        title: tr('My Farms', 'Mashamba yangu'),
        description: tr('Manage locations and crop parcels.', 'Panga maeneo na vipande vya mazao.'),
        actions: `<button class="btn btn-primary" type="button" onclick="openAddFarmModal()">${icon('plus', 16)} ${tr('Add Farm', 'Ongeza shamba')}</button>`
      })}
      ${farms.length ? `<div class="farm-grid">${farms.map(farm => renderFarmCard(farm, isSw)).join('')}</div>` :
        `<section class="card">${renderEmptyState({ iconName: 'farms', title: tr('No farms yet', 'Hakuna mashamba bado'), body: tr('Register your first farm to organize plots and scans.', 'Sajili shamba la kwanza ili kuanza kufuatilia vipande.'), action: `<button class="btn btn-primary" type="button" onclick="openAddFarmModal()">${tr('Add first farm', 'Sajili shamba')}</button>` })}</section>`}
    </div>`;
}

function renderFarmCard(farm, isSw) {
  return `
    <article class="farm-card">
      <div class="farm-card-top"><span class="farm-icon">${icon('farms', 24)}</span><span class="badge badge-healthy">${esc(farm.county)}</span></div>
      <h2>${esc(farm.name)}</h2>
      <p>${esc([farm.sub_county, farm.approximate_location].filter(Boolean).join(' · ') || (tr('Location not specified', 'Eneo halijawekwa')))}</p>
      <dl class="farm-metrics">
        <div><dt>${tr('Plots', 'Vipande')}</dt><dd>${formatNumber(farm.plot_count)}</dd></div>
        <div><dt>${tr('Scans', 'Vipimo')}</dt><dd>${formatNumber(farm.scan_count)}</dd></div>
        <div><dt>${tr('Size', 'Ukubwa')}</dt><dd>${farm.size_value ? `${esc(farm.size_value)} ${esc(farm.size_unit || '')}` : 'N/A'}</dd></div>
      </dl>
      <a class="btn btn-outline btn-full" href="#/farms/${encodeURIComponent(farm.id)}">${tr('View plots & history', 'Fungua shamba')}</a>
    </article>`;
}

async function renderFarmDetails(farmId) {
  let farm, plots = [];
  try { [farm, plots] = await Promise.all([api.getFarm(farmId), api.getPlots(farmId)]); }
  catch (err) { return renderErrorState('Unable to load farm', err.message); }
  const isSw = isSwahili();

  return `
    <div class="content-page">
      ${renderPageHeader({
        eyebrow: tr('Farm', 'Shamba'),
        title: esc(farm.name),
        description: `${esc(farm.county)}${farm.sub_county ? ` · ${esc(farm.sub_county)}` : ''}${farm.approximate_location ? ` · ${esc(farm.approximate_location)}` : ''}`,
        actions: `<div class="action-row"><button class="btn btn-secondary" type="button" onclick="openEditFarmModal('${esc(farm.id)}')">Edit Farm</button><button class="btn btn-primary" type="button" onclick="openAddPlotModal('${esc(farm.id)}')">${icon('plus', 16)} ${tr('Add Crop Plot', 'Ongeza kipande')}</button><button class="btn btn-danger" type="button" onclick="deleteFarmConfirmed('${esc(farm.id)}')">Delete</button></div>`
      })}
      ${plots.length ? `<div class="plot-grid">${plots.map(plot => renderPlotCard(plot, isSw)).join('')}</div>` :
        `<section class="card">${renderEmptyState({ iconName: 'sprout', title: tr('No crop plots yet', 'Hakuna vipande bado'), body: tr('Add maize, potato, or tomato to begin crop monitoring.', 'Ongeza mahindi, viazi, au nyanya ili kufuatilia afya ya mazao.'), action: `<button class="btn btn-primary" type="button" onclick="openAddPlotModal('${esc(farm.id)}')">${tr('Add first plot', 'Ongeza kipande')}</button>` })}</section>`}
    </div>`;
}

function renderPlotCard(plot, isSw) {
  const crop = String(plot.crop_type || '').toLowerCase();
  return `
    <article class="plot-card crop-${esc(crop)}">
      <div class="plot-head"><span class="crop-icon">${icon('sprout', 22)}</span><span class="badge ${plot.status === 'active' ? 'badge-healthy' : 'badge-uncertain'}">${esc(plot.status || 'active')}</span></div>
      <h2>${cropLabel(crop)}</h2>
      <p>${esc(plot.variety || (tr('Standard variety', 'Aina ya kawaida')))}</p>
      <dl class="plot-details">
        <div><dt>${tr('Stage', 'Hatua')}</dt><dd>${esc(plot.growth_stage || 'Not specified')}</dd></div>
        <div><dt>${tr('Size', 'Ukubwa')}</dt><dd>${plot.field_size_value ? `${esc(plot.field_size_value)} ${esc(plot.field_size_unit || 'acres')}` : 'N/A'}</dd></div>
        <div><dt>${tr('Scans', 'Vipimo')}</dt><dd>${formatNumber(plot.scan_count)}</dd></div>
      </dl>
      <div class="plot-actions"><a class="btn btn-outline" href="#/scan">${icon('camera', 16)} ${tr('Scan this crop', 'Pima zao hili')}</a><button class="btn btn-secondary btn-sm" type="button" onclick="openEditPlotModal('${esc(plot.farm_id)}', '${esc(plot.id)}')">Edit</button><button class="btn btn-danger btn-sm" type="button" onclick="deletePlotConfirmed('${esc(plot.farm_id)}', '${esc(plot.id)}')">Delete</button></div>
    </article>`;
}

// 7. History
async function renderHistory() {
  if (!state.user) { navigate('#/login'); return ''; }
  let scans = [];
  try { scans = await api.getScans('?limit=100'); }
  catch (err) { return renderErrorState('Unable to load scan history', err.message); }
  const isSw = isSwahili();

  return `
    <div class="content-page">
      ${renderPageHeader({
        eyebrow: tr('Diagnostic records', 'Rekodi za uchunguzi'),
        title: tr('Scan History', 'Historia ya vipimo'),
        description: tr('All leaf scans and verification states.', 'Vipimo vyote na hali ya uhakiki.'),
        actions: `<a class="btn btn-primary" href="#/scan">${icon('camera', 16)} ${tr('New Scan', 'Pima zao')}</a>`
      })}
      <section class="card table-card">
        ${scans.length ? `<div class="table-responsive"><table class="table"><thead><tr><th>${tr('Date', 'Tarehe')}</th><th>${tr('Crop', 'Zao')}</th><th>${tr('Condition', 'Matokeo')}</th><th>${tr('Confidence', 'Uhakika')}</th><th>${tr('Severity', 'Ukali')}</th><th>${tr('Status', 'Hali')}</th><th></th></tr></thead><tbody>
          ${scans.map(scan => `<tr><td>${formatDate(scan.timestamp)}</td><td><strong>${cropLabel(scan.crop_hint)}</strong></td><td>${esc(formatDiseaseName(scan.predicted_label || scan.status))}</td><td>${formatPercent(scan.confidence)}</td><td>${getSeverityBadge(scan.severity_category)}</td><td>${scan.ground_truth_status === 'expert_verified' ? '<span class="badge badge-healthy">Expert verified</span>' : '<span class="badge badge-uncertain">AI screening</span>'}</td><td><a class="btn btn-secondary btn-sm" href="#/scans/${encodeURIComponent(scan.id)}">${tr('View', 'Tazama')}</a></td></tr>`).join('')}
        </tbody></table></div>` :
        renderEmptyState({ iconName: 'history', title: t('stats.no_scans_yet', 'No scans yet'), body: tr('Records will appear after your first scan.', 'Rekodi zitaonekana baada ya kipimo cha kwanza.'), action: `<a class="btn btn-primary" href="#/scan">${tr('Scan now', 'Pima sasa')}</a>` })}
      </section>
    </div>`;
}

// 8. Follow-ups
async function renderFollowUps() {
  if (!state.user) { navigate('#/login'); return ''; }
  let followUps = [];
  try { followUps = await api.getFollowUps(); }
  catch (err) { return renderErrorState('Unable to load follow-ups', err.message); }
  const isSw = isSwahili();

  return `
    <div class="content-page">
      ${renderPageHeader({ eyebrow: tr('Recovery monitoring', 'Ufuatiliaji wa kupona'), title: tr('Follow-up Tracker', 'Ratiba ya ufuatiliaji'), description: tr('Record whether symptoms are improving, unchanged, or worsening.', 'Rekodi iwapo dalili zimepungua, zimebaki, au zimezidi.') })}
      <section class="card table-card">
        ${followUps.length ? `<div class="table-responsive"><table class="table"><thead><tr><th>${tr('Due date', 'Tarehe')}</th><th>${tr('Instructions', 'Maelekezo')}</th><th>${tr('Status', 'Hali')}</th><th>${tr('Outcome', 'Matokeo')}</th><th></th></tr></thead><tbody>
          ${followUps.map(item => {
            const overdue = item.status === 'pending' && new Date(item.due_date) < new Date();
            return `<tr class="${overdue ? 'row-overdue' : ''}"><td><strong>${formatDate(item.due_date)}</strong>${overdue ? ' <span class="badge badge-severe">Overdue</span>' : ''}</td><td>${esc(item.notes || 'Check plant progress')}</td><td><span class="badge ${item.status === 'completed' ? 'badge-healthy' : 'badge-moderate'}">${esc(item.status)}</span></td><td>${item.outcome ? `<span class="badge badge-healthy">${esc(item.outcome)}</span>` : '—'}</td><td><div class="table-actions">${item.status === 'pending' ? `<button class="btn btn-primary btn-sm" type="button" onclick="openCompleteFollowUpModal('${esc(item.scan_id)}', '${esc(item.id)}')">${tr('Record', 'Rekodi')}</button>` : ''}<a class="btn btn-secondary btn-sm" href="#/scans/${encodeURIComponent(item.scan_id)}">${tr('Scan', 'Kipimo')}</a></div></td></tr>`;
          }).join('')}
        </tbody></table></div>` :
        renderEmptyState({ iconName: 'tasks', title: tr('No follow-up tasks', 'Hakuna ufuatiliaji'), body: tr('Reminders are scheduled automatically after detection.', 'Vikumbusho huundwa kiotomatiki baada ya uchunguzi.') })}
      </section>
    </div>`;
}

// 9. Notifications
async function renderNotifications() {
  if (!state.user) { navigate('#/login'); return ''; }
  let notifications = [];
  try { notifications = await api.getNotifications(); }
  catch (err) { return renderErrorState('Unable to load notifications', err.message); }
  state.notificationsCount = notifications.filter(n => !n.is_read).length;
  updateNav();
  const isSw = isSwahili();

  return `
    <div class="narrow-page">
      ${renderPageHeader({
        eyebrow: tr('Communication', 'Mawasiliano'),
        title: tr('Notifications', 'Taarifa'),
        description: tr('Reminders and expert review updates.', 'Vikumbusho na majibu ya uhakiki.'),
        actions: notifications.length ? `<button class="btn btn-secondary" type="button" onclick="markAllRead()">${tr('Mark all read', 'Zote zimesomwa')}</button>` : ''
      })}
      <section class="notification-list">
        ${notifications.length ? notifications.map(item => `
          <article class="notification-item ${item.is_read ? '' : 'unread'}">
            <span class="notification-dot" aria-hidden="true"></span>
            <div><h2>${esc(item.title)}</h2><p>${esc(item.body)}</p><small>${formatDateTime(item.created_at)}</small>
              <div class="action-row">${item.related_scan_id ? `<a class="btn btn-secondary btn-sm" href="#/scans/${encodeURIComponent(item.related_scan_id)}">${tr('View scan', 'Tazama kipimo')}</a>` : ''}${!item.is_read ? `<button class="btn btn-outline btn-sm" type="button" onclick="markRead('${esc(item.id)}')">${tr('Mark read', 'Imesomwa')}</button>` : ''}</div>
            </div>
          </article>`).join('') :
          `<section class="card">${renderEmptyState({ iconName: 'bell', title: tr('No notifications', 'Hakuna taarifa'), body: tr('New alerts and updates will appear here.', 'Taarifa mpya zitaonekana hapa.') })}</section>`}
      </section>
    </div>`;
}

// 10. Extension officer review
async function renderExpert() {
  if (!state.user || (state.user.role !== 'extension_officer' && state.user.role !== 'admin')) {
    return `<section class="card access-card">${icon('shield', 34)}<h1>Access denied</h1><p>Extension officer or administrator privileges are required.</p></section>`;
  }
  let pending = [], lowConfidenceItems = [], severeItems = [];
  try { [pending, lowConfidenceItems, severeItems] = await Promise.all([api.getPendingReviews(), api.getLowConfidenceReviews(), api.getSevereReviews()]); }
  catch (err) { return renderErrorState('Unable to load review queue', err.message); }
  const lowConfidence = lowConfidenceItems.length;
  const severe = severeItems.length;

  return `
    <div class="content-page">
      ${renderPageHeader({ eyebrow: 'Expert verification', title: 'Extension Officer Review', description: 'Validate AI screening, correct labels, and request clearer field images.', actions: `<a class="btn btn-secondary" href="#/admin-analytics">${icon('map', 16)} Surveillance</a>` })}
      <section class="stats-grid">
        ${renderStatCard({ label: 'Pending reviews', value: formatNumber(pending.length), sublabel: 'live queue', iconName: 'users', tone: 'blue' })}
        ${renderStatCard({ label: 'Low confidence', value: formatNumber(lowConfidence), sublabel: 'careful review', iconName: 'info', tone: 'amber' })}
        ${renderStatCard({ label: 'Severe cases', value: formatNumber(severe), sublabel: 'urgent attention', iconName: 'warning', tone: 'red' })}
      </section>
      <section class="card table-card">
        <div class="card-header"><div><h2>Pending Review Queue</h2><p>Farmer scans awaiting human verification</p></div></div>
        ${pending.length ? `<div class="table-responsive"><table class="table"><thead><tr><th>Date</th><th>County</th><th>Leaf</th><th>AI result</th><th>Confidence</th><th>Severity</th><th></th></tr></thead><tbody>
          ${pending.map(item => `<tr><td>${formatDate(item.timestamp)}</td><td><strong>${esc(item.county || 'Unspecified')}</strong></td><td><img class="leaf-thumb" data-secure-src="/api/v1/scans/${encodeURIComponent(item.id)}/image" alt="Leaf awaiting expert review" loading="lazy"></td><td><strong>${esc(formatDiseaseName(item.predicted_label || item.status))}</strong></td><td>${formatPercent(item.confidence)}</td><td>${getSeverityBadge(item.severity_category)}</td><td><button class="btn btn-primary btn-sm" type="button" onclick="openReviewModal('${esc(item.id)}', '${esc(item.predicted_label || item.status)}')">Review</button></td></tr>`).join('')}
        </tbody></table></div>` :
        renderEmptyState({ iconName: 'check', title: 'Review queue is clear', body: 'There are no pending farmer scans requiring verification.' })}
      </section>
    </div>`;
}

// 11. Admin analytics
async function renderAdmin() {
  if (!state.user || state.user.role !== 'admin') {
    return `<section class="card access-card">${icon('shield', 34)}<h1>Access denied</h1><p>Platform administrator access is required.</p></section>`;
  }
  let stats, versions = [], users = [], adminScans = [], adminFollowUps = [];
  try { [stats, versions, users, adminScans, adminFollowUps] = await Promise.all([api.getAdminStats(), api.getModelVersions(), api.getAdminUsers(), api.getAdminScans(0, 20), api.getAdminFollowUps(0, 20)]); }
  catch (err) { return renderErrorState('Unable to load administration analytics', err.message); }

  const diseaseEntries = Object.entries(stats.scans_by_disease || {});
  const cropEntries = Object.entries(stats.scans_by_crop || {});
  const countyEntries = Object.entries(stats.scans_by_county || {});

  return `
    <div class="content-page admin-page">
      ${renderPageHeader({ eyebrow: 'Platform administration', title: 'Admin & Disease Surveillance', description: 'Live platform analytics, model metadata, and county-level disease intelligence.', actions: `<a class="btn btn-primary" href="#/admin-analytics">${icon('map', 16)} Open Kenya Map</a>` })}
      <section class="stats-grid stats-grid-eight">
        ${renderStatCard({ label: 'Registered farmers', value: formatNumber(stats.registered_farmers), sublabel: `${formatNumber(stats.active_farmers_7d)} active · 7 days`, iconName: 'users' })}
        ${renderStatCard({ label: 'Total farms', value: formatNumber(stats.total_farms), sublabel: `${formatNumber(stats.total_plots)} plots`, iconName: 'farms' })}
        ${renderStatCard({ label: 'Total scans', value: formatNumber(stats.total_scans), sublabel: `${formatNumber(stats.disease_detections)} detections`, iconName: 'scan', tone: 'blue' })}
        ${renderStatCard({ label: 'Low confidence', value: formatNumber(stats.low_confidence_scans), sublabel: 'review queue signal', iconName: 'info', tone: 'amber' })}
        ${renderStatCard({ label: 'Expert reviewed', value: formatNumber(stats.expert_reviewed_scans), sublabel: 'verified scans', iconName: 'shield' })}
        ${renderStatCard({ label: 'Average confidence', value: formatPercent(stats.average_confidence), sublabel: 'accepted predictions', iconName: 'chart', tone: 'blue' })}
        ${renderStatCard({ label: 'Follow-up completion', value: formatPercent(stats.follow_up_completion_rate), sublabel: 'recorded outcomes', iconName: 'tasks' })}
        ${renderStatCard({ label: 'Counties reporting', value: formatNumber(countyEntries.length), sublabel: 'aggregate reports', iconName: 'map', tone: 'red' })}
      </section>

      <div class="admin-chart-grid">
        ${renderAdminChartCard('disease-chart', 'Scans by disease', 'Live disease distribution', diseaseEntries)}
        ${renderAdminChartCard('crop-chart', 'Scans by crop', 'Crop coverage across the platform', cropEntries)}
      </div>

      <div class="dashboard-grid">
        <section class="card table-card"><div class="card-header"><div><h2>Detections by County</h2><p>Aggregated county totals</p></div></div>${renderKeyValueTable(countyEntries, 'County', 'Scans', value => esc(value), false)}</section>
        <section class="card table-card"><div class="card-header"><div><h2>Detections by Disease</h2><p>Live database distribution</p></div></div>${renderKeyValueTable(diseaseEntries, 'Disease', 'Count', value => esc(formatDiseaseName(value)), false)}</section>
      </div>

      <section class="card table-card">
        <div class="card-header"><div><h2>Model Metadata</h2><p>Held-out evaluation values returned by the backend</p></div></div>
        ${versions.length ? `<div class="table-responsive"><table class="table"><thead><tr><th>Model</th><th>Version</th><th>Accuracy</th><th>Macro F1</th><th>Threshold</th><th>Artifact</th></tr></thead><tbody>
          ${versions.map(v => `<tr><td><strong>${esc(v.model_name)}</strong></td><td>${esc(v.version)}</td><td>${v.test_accuracy === null || v.test_accuracy === undefined ? 'N/A' : formatPercent(v.test_accuracy)}</td><td>${v.macro_f1 === null || v.macro_f1 === undefined ? 'N/A' : formatPercent(v.macro_f1)}</td><td>${esc(v.confidence_threshold ?? 'N/A')}</td><td><code>${esc(v.artifact_path || 'N/A')}</code></td></tr>`).join('')}
        </tbody></table></div>` : renderEmptyState({ iconName: 'microscope', title: 'No model metadata returned', body: 'The active model registry did not return any records.' })}
      </section>

      <section class="card table-card">
        <div class="card-header"><div><h2>Registered Users</h2><p>${formatNumber(users.length)} platform accounts</p></div></div>
        ${users.length ? `<div class="table-responsive"><table class="table"><thead><tr><th>Name</th><th>Phone</th><th>Role</th><th>County</th><th>Registered</th><th></th></tr></thead><tbody>
          ${users.map(user => `<tr><td><strong>${esc(user.full_name)}</strong></td><td>${esc(user.phone_number)}</td><td><span class="badge ${user.role === 'admin' ? 'badge-severe' : user.role === 'extension_officer' ? 'badge-info' : 'badge-healthy'}">${esc(user.role)}</span></td><td>${esc(user.county || 'Unspecified')}</td><td>${formatDate(user.created_at)}</td><td>${user.is_active === false ? '<span class="badge badge-uncertain">Inactive</span>' : user.role !== 'admin' ? `<button class="btn btn-danger btn-sm" type="button" onclick="deactivateUserConfirmed('${esc(user.id)}')">Deactivate</button>` : ''}</td></tr>`).join('')}
        </tbody></table></div>` : renderEmptyState({ iconName: 'users', title: 'No users returned', body: 'The user registry is empty.' })}
      </section>

      <div class="dashboard-grid">
        <section class="card table-card"><div class="card-header"><div><h2>Recent Platform Scans</h2><p>Latest records from the admin scan API</p></div></div>${adminScans.length ? `<div class="table-responsive"><table class="table"><thead><tr><th>Date</th><th>Result</th><th>Confidence</th><th>County</th></tr></thead><tbody>${adminScans.slice(0,10).map(scan => `<tr><td>${formatDate(scan.timestamp)}</td><td>${esc(formatDiseaseName(scan.predicted_label || scan.status))}</td><td>${formatPercent(scan.confidence)}</td><td>${esc(scan.county || '—')}</td></tr>`).join('')}</tbody></table></div>` : renderEmptyState({ iconName: 'scan', title: 'No scans', body: 'No scan records returned.' })}</section>
        <section class="card table-card"><div class="card-header"><div><h2>Recent Follow-ups</h2><p>Latest records from the admin follow-up API</p></div></div>${adminFollowUps.length ? `<div class="table-responsive"><table class="table"><thead><tr><th>Due</th><th>Status</th><th>Outcome</th></tr></thead><tbody>${adminFollowUps.slice(0,10).map(item => `<tr><td>${formatDate(item.due_date)}</td><td>${esc(item.status)}</td><td>${esc(item.outcome || '—')}</td></tr>`).join('')}</tbody></table></div>` : renderEmptyState({ iconName: 'tasks', title: 'No follow-ups', body: 'No follow-up records returned.' })}</section>
      </div>
    </div>`;
}

function renderAdminChartCard(id, title, subtitle, entries) {
  return `<section class="card chart-card"><div class="card-header"><div><h2>${esc(title)}</h2><p>${esc(subtitle)}</p></div></div>${entries.length ? `<div class="chart-frame"><canvas id="${id}" aria-label="${esc(title)}"></canvas></div>` : renderEmptyState({ iconName: 'chart', title: 'No chart data yet', body: 'Data will appear when the backend reports records.' })}</section>`;
}

function renderKeyValueTable(entries, keyLabel, valueLabel, keyFormatter, isDisease = true) {
  if (!entries.length) return renderEmptyState({ iconName: 'chart', title: 'No records yet', body: 'This table updates when the backend returns data.' });
  return `<div class="table-responsive"><table class="table"><thead><tr><th>${esc(keyLabel)}</th><th class="table-number">${esc(valueLabel)}</th></tr></thead><tbody>${entries.map(([key, value]) => `<tr><td><strong>${keyFormatter ? keyFormatter(key) : esc(key)}</strong></td><td class="table-number">${formatNumber(value)}</td></tr>`).join('')}</tbody></table></div>`;
}

// 12. Surveillance map
async function renderSurveillanceMap() {
  if (!state.user || (state.user.role !== 'admin' && state.user.role !== 'extension_officer')) {
    return `<section class="card access-card">${icon('shield', 34)}<h1>Access denied</h1><p>Extension officer or administrator access is required.</p></section>`;
  }
  let surveillance = { by_county: {}, by_disease_week: {} };
  try { surveillance = await api.getSurveillanceData(); }
  catch (err) { return renderErrorState('Unable to load surveillance data', err.message); }
  window.setTimeout(() => initKenyaMap(surveillance.by_county), 120);

  const entries = Object.entries(surveillance.by_county || {});
  return `
    <div class="content-page">
      ${renderPageHeader({ eyebrow: 'County intelligence', title: 'Kenya Disease Surveillance', description: 'Aggregated county-level reports. Exact farmer locations are not exposed.', actions: `<a class="btn btn-secondary" href="#/admin">← Admin</a>` })}
      <section class="map-card"><div id="kenya-map-container" role="img" aria-label="Kenya county disease surveillance map"></div></section>
      <section class="card table-card"><div class="card-header"><div><h2>County Aggregate Detections</h2><p>Reports returned by the surveillance API</p></div></div>
        ${entries.length ? `<div class="table-responsive"><table class="table"><thead><tr><th>County</th><th>Disease breakdown</th><th class="table-number">Total</th></tr></thead><tbody>
          ${entries.map(([county, diseases]) => { const total = Object.values(diseases).reduce((a, b) => a + b, 0); return `<tr><td><strong>${esc(county)}</strong></td><td>${Object.entries(diseases).map(([disease, count]) => `${esc(formatDiseaseName(disease))}: ${formatNumber(count)}`).join(' · ')}</td><td class="table-number"><strong>${formatNumber(total)}</strong></td></tr>`; }).join('')}
        </tbody></table></div>` : renderEmptyState({ iconName: 'map', title: 'No county reports yet', body: 'Disease markers appear after the backend returns verified county reports.' })}
      </section>
    </div>`;
}

function initKenyaMap(byCountyData = {}) {
  const container = document.getElementById('kenya-map-container');
  if (!container || !window.L) return;
  container.innerHTML = '';
  const map = L.map('kenya-map-container', { scrollWheelZoom: false }).setView([0.0236, 37.9062], 7);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© OpenStreetMap contributors' }).addTo(map);
  Object.entries(byCountyData).forEach(([countyName, diseases]) => {
    const coords = KENYA_COUNTIES[countyName];
    if (!coords) return;
    const total = Object.values(diseases).reduce((a, b) => a + b, 0);
    const marker = L.circleMarker(coords, { radius: Math.min(25, 8 + total * 3), fillColor: '#c94f45', color: '#7f2d2d', weight: 2, opacity: .95, fillOpacity: .7 }).addTo(map);
    marker.bindPopup(`<strong>${esc(countyName)} County</strong><br>Total detections: ${formatNumber(total)}<ul>${Object.entries(diseases).map(([d, c]) => `<li>${esc(formatDiseaseName(d))}: ${formatNumber(c)}</li>`).join('')}</ul>`);
  });
}

// 13. Profile
function renderProfile() {
  if (!state.user) { navigate('#/login'); return ''; }
  const user = state.user;
  const isSw = isSwahili();
  const initials = (user.full_name || 'U').split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase();
  return `
    <div class="narrow-page">
      <section class="profile-card">
        <div class="profile-avatar" aria-hidden="true">${esc(initials)}</div>
        <div class="profile-heading"><p class="page-eyebrow">${tr('Account profile', 'Wasifu')}</p><h1>${esc(user.full_name)}</h1><span class="badge badge-healthy">${esc(user.role)}</span></div>
        <dl class="profile-fields">
          <div><dt>${tr('Phone', 'Simu')}</dt><dd>${esc(user.phone_number)}</dd></div>
          <div><dt>${tr('Email', 'Barua pepe')}</dt><dd>${esc(user.email || 'Not provided')}</dd></div>
          <div><dt>${tr('County', 'Kaunti')}</dt><dd>${esc(user.county || 'Not set')}</dd></div>
          <div><dt>${tr('Member since', 'Mwanachama tangu')}</dt><dd>${formatDate(user.created_at)}</dd></div>
        </dl>
        <div class="profile-actions"><button class="btn btn-primary" type="button" onclick="openEditProfileModal()">${icon('profile', 16)} ${tr('Edit profile', 'Hariri wasifu')}</button><button class="btn btn-secondary" type="button" onclick="openChangePasswordModal()">${icon('shield', 16)} ${tr('Change password', 'Badili nenosiri')}</button><button class="btn btn-secondary" type="button" onclick="toggleLanguage()">${icon('refresh', 16)} ${tr('Switch language', 'Badilisha lugha')}</button><button class="btn btn-danger" type="button" onclick="api.logout()">${icon('logout', 16)} ${tr('Sign out', 'Toka')}</button></div>
      </section>
    </div>`;
}


// Backend-integrated modal workflows
window.openCreateFollowUpModal = function openCreateFollowUpModal(scanId) {
  const defaultDue = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
  const local = new Date(defaultDue.getTime() - defaultDue.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  showModal(tr('Schedule follow-up', 'Panga ufuatiliaji'), `
    <form id="create-follow-up-form">
      <div class="form-group"><label class="form-label" for="follow-up-date">${tr('Due date & time', 'Tarehe na muda')} *</label><input class="form-control" id="follow-up-date" type="datetime-local" value="${local}" required></div>
      <div class="form-group"><label class="form-label" for="follow-up-notes">${tr('Notes', 'Maelezo')}</label><textarea class="form-textarea" id="follow-up-notes" placeholder="Re-check lesions and compare progression"></textarea></div>
      <button class="btn btn-primary btn-full" type="submit">${tr('Schedule follow-up', 'Hifadhi')}</button>
    </form>`);
  document.getElementById('create-follow-up-form')?.addEventListener('submit', async event => {
    event.preventDefault();
    try {
      const dueDate = new Date(document.getElementById('follow-up-date').value);
      await api.createFollowUp(scanId, { due_date: dueDate.toISOString(), notes: document.getElementById('follow-up-notes').value.trim() || null });
      closeModal(); toast('Follow-up scheduled', 'success');
    } catch (err) { toast(err.message, 'error'); }
  });
};

window.openEditFarmModal = async function openEditFarmModal(farmId) {
  try {
    const farm = await api.getFarm(farmId);
    showModal('Edit farm', `
      <form id="edit-farm-form">
        <div class="form-group"><label class="form-label" for="edit-farm-name">Farm name *</label><input class="form-control" id="edit-farm-name" value="${esc(farm.name)}" required></div>
        <div class="form-grid"><div class="form-group"><label class="form-label" for="edit-farm-county">County *</label><input class="form-control" id="edit-farm-county" value="${esc(farm.county)}" required></div><div class="form-group"><label class="form-label" for="edit-farm-subcounty">Sub-county</label><input class="form-control" id="edit-farm-subcounty" value="${esc(farm.sub_county || '')}"></div></div>
        <div class="form-grid"><div class="form-group"><label class="form-label" for="edit-farm-size">Size</label><input class="form-control" id="edit-farm-size" type="number" min="0" step="0.01" value="${esc(farm.size_value ?? '')}"></div><div class="form-group"><label class="form-label" for="edit-farm-unit">Unit</label><input class="form-control" id="edit-farm-unit" value="${esc(farm.size_unit || 'acres')}"></div></div>
        <div class="form-group"><label class="form-label" for="edit-farm-location">Approximate location</label><input class="form-control" id="edit-farm-location" value="${esc(farm.approximate_location || '')}"></div>
        <div class="form-group"><label class="form-label" for="edit-farm-notes">Notes</label><textarea class="form-textarea" id="edit-farm-notes">${esc(farm.notes || '')}</textarea></div>
        <button class="btn btn-primary btn-full" type="submit">Save changes</button>
      </form>`);
    document.getElementById('edit-farm-form')?.addEventListener('submit', async event => {
      event.preventDefault();
      try {
        await api.updateFarm(farmId, {
          name: document.getElementById('edit-farm-name').value.trim(),
          county: document.getElementById('edit-farm-county').value.trim(),
          sub_county: document.getElementById('edit-farm-subcounty').value.trim() || null,
          approximate_location: document.getElementById('edit-farm-location').value.trim() || null,
          size_value: parseFloat(document.getElementById('edit-farm-size').value) || null,
          size_unit: document.getElementById('edit-farm-unit').value.trim() || 'acres',
          notes: document.getElementById('edit-farm-notes').value.trim() || null
        });
        closeModal(); toast('Farm updated', 'success'); await renderCurrentRoute();
      } catch (err) { toast(err.message, 'error'); }
    });
  } catch (err) { toast(err.message, 'error'); }
};

window.deleteFarmConfirmed = async function deleteFarmConfirmed(farmId) {
  if (!window.confirm('Delete this farm? This action may be blocked if related records must be retained.')) return;
  try { await api.deleteFarm(farmId); toast('Farm deleted', 'success'); navigate('#/farms'); }
  catch (err) { toast(err.message, 'error'); }
};

window.openEditPlotModal = async function openEditPlotModal(farmId, plotId) {
  try {
    const plot = await api.getPlot(farmId, plotId);
    showModal('Edit crop plot', `
      <form id="edit-plot-form">
        <div class="form-grid"><div class="form-group"><label class="form-label" for="edit-plot-crop">Crop</label><select class="form-select" id="edit-plot-crop"><option value="maize" ${plot.crop_type === 'maize' ? 'selected' : ''}>Maize</option><option value="potato" ${plot.crop_type === 'potato' ? 'selected' : ''}>Potato</option><option value="tomato" ${plot.crop_type === 'tomato' ? 'selected' : ''}>Tomato</option></select></div><div class="form-group"><label class="form-label" for="edit-plot-status">Status</label><select class="form-select" id="edit-plot-status">${['active','harvested','fallow','abandoned'].map(v => `<option value="${v}" ${plot.status === v ? 'selected' : ''}>${v}</option>`).join('')}</select></div></div>
        <div class="form-grid"><div class="form-group"><label class="form-label" for="edit-plot-variety">Variety</label><input class="form-control" id="edit-plot-variety" value="${esc(plot.variety || '')}"></div><div class="form-group"><label class="form-label" for="edit-plot-stage">Growth stage</label><input class="form-control" id="edit-plot-stage" value="${esc(plot.growth_stage || '')}"></div></div>
        <div class="form-group"><label class="form-label" for="edit-plot-notes">Notes</label><textarea class="form-textarea" id="edit-plot-notes">${esc(plot.notes || '')}</textarea></div>
        <button class="btn btn-primary btn-full" type="submit">Save plot</button>
      </form>`);
    document.getElementById('edit-plot-form')?.addEventListener('submit', async event => {
      event.preventDefault();
      try {
        await api.updatePlot(farmId, plotId, { crop_type: document.getElementById('edit-plot-crop').value, variety: document.getElementById('edit-plot-variety').value.trim() || null, growth_stage: document.getElementById('edit-plot-stage').value.trim() || null, status: document.getElementById('edit-plot-status').value, notes: document.getElementById('edit-plot-notes').value.trim() || null });
        closeModal(); toast('Plot updated', 'success'); await renderCurrentRoute();
      } catch (err) { toast(err.message, 'error'); }
    });
  } catch (err) { toast(err.message, 'error'); }
};

window.deletePlotConfirmed = async function deletePlotConfirmed(farmId, plotId) {
  if (!window.confirm('Delete this crop plot?')) return;
  try { await api.deletePlot(farmId, plotId); toast('Plot deleted', 'success'); await renderCurrentRoute(); }
  catch (err) { toast(err.message, 'error'); }
};

window.openEditProfileModal = function openEditProfileModal() {
  const user = state.user;
  if (!user) return;
  showModal('Edit profile', `
    <form id="edit-profile-form">
      <div class="form-group"><label class="form-label" for="profile-name">Full name *</label><input class="form-control" id="profile-name" value="${esc(user.full_name)}" required></div>
      <div class="form-group"><label class="form-label" for="profile-email">Email</label><input class="form-control" id="profile-email" type="email" value="${esc(user.email || '')}"></div>
      <div class="form-grid"><div class="form-group"><label class="form-label" for="profile-county">County</label><input class="form-control" id="profile-county" value="${esc(user.county || '')}"></div><div class="form-group"><label class="form-label" for="profile-subcounty">Sub-county</label><input class="form-control" id="profile-subcounty" value="${esc(user.sub_county || '')}"></div></div>
      <div class="form-group"><label class="form-label" for="profile-lang">Preferred language</label><select class="form-select" id="profile-lang">${LANGS.map(l => `<option value="${l.code}" ${state.lang === l.code ? 'selected' : ''}>${l.name}</option>`).join('')}</select></div>
      <button class="btn btn-primary btn-full" type="submit">Save profile</button>
    </form>`);
  document.getElementById('edit-profile-form')?.addEventListener('submit', async event => {
    event.preventDefault();
    try {
      state.user = await api.updateMe({ full_name: document.getElementById('profile-name').value.trim(), email: document.getElementById('profile-email').value.trim() || null, county: document.getElementById('profile-county').value.trim() || null, sub_county: document.getElementById('profile-subcounty').value.trim() || null, preferred_language: apiLang(document.getElementById('profile-lang').value) });
      localStorage.setItem('user', JSON.stringify(state.user));
      const profLang = document.getElementById('profile-lang').value;
      if (profLang !== state.lang) await loadLocales(profLang);
      closeModal(); toast('Profile updated', 'success'); updateNav(); await renderCurrentRoute();
    } catch (err) { toast(err.message, 'error'); }
  });
};

window.openChangePasswordModal = function openChangePasswordModal() {
  showModal('Change password', `
    <form id="change-password-form">
      <div class="form-group"><label class="form-label" for="current-password">Current password *</label><input class="form-control" id="current-password" type="password" required></div>
      <div class="form-group"><label class="form-label" for="new-password">New password *</label><input class="form-control" id="new-password" type="password" minlength="8" required></div>
      <button class="btn btn-primary btn-full" type="submit">Update password</button>
    </form>`);
  document.getElementById('change-password-form')?.addEventListener('submit', async event => {
    event.preventDefault();
    try { await api.changePassword(document.getElementById('current-password').value, document.getElementById('new-password').value); closeModal(); toast('Password changed', 'success'); }
    catch (err) { toast(err.message, 'error'); }
  });
};

// Modal workflows
window.openAddFarmModal = function openAddFarmModal() {
  const isSw = isSwahili();
  showModal(tr('Add new farm', 'Ongeza shamba jipya'), `
    <form id="add-farm-form">
      <div class="form-group"><label class="form-label" for="farm-name">${tr('Farm name', 'Jina la shamba')} *</label><input class="form-control" id="farm-name" required placeholder="Shamba la Njoro"></div>
      <div class="form-grid"><div class="form-group"><label class="form-label" for="farm-county">${tr('County', 'Kaunti')} *</label><select class="form-select" id="farm-county" required>${Object.keys(KENYA_COUNTIES).map(c => `<option value="${esc(c)}" ${state.user?.county === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></div><div class="form-group"><label class="form-label" for="farm-subcounty">Sub-County</label><input class="form-control" id="farm-subcounty" placeholder="Molo, Njoro"></div></div>
      <div class="form-grid"><div class="form-group"><label class="form-label" for="farm-size">${tr('Size', 'Ukubwa')}</label><input class="form-control" id="farm-size" type="number" min="0" step="0.1" placeholder="2.5"></div><div class="form-group"><label class="form-label" for="farm-unit">${tr('Unit', 'Kipimo')}</label><select class="form-select" id="farm-unit"><option value="acres">Acres</option><option value="hectares">Hectares</option></select></div></div>
      <div class="form-group"><label class="form-label" for="farm-loc">${tr('Approximate location', 'Eneo la makadirio')}</label><input class="form-control" id="farm-loc" placeholder="Near Njoro Centre"></div>
      <button class="btn btn-primary btn-full" type="submit">${tr('Save farm', 'Hifadhi shamba')}</button>
    </form>`);
  document.getElementById('add-farm-form')?.addEventListener('submit', async event => {
    event.preventDefault();
    try {
      await api.createFarm({ name: document.getElementById('farm-name').value.trim(), county: document.getElementById('farm-county').value, sub_county: document.getElementById('farm-subcounty').value.trim() || null, size_value: parseFloat(document.getElementById('farm-size').value) || null, size_unit: document.getElementById('farm-unit').value, approximate_location: document.getElementById('farm-loc').value.trim() || null });
      closeModal(); toast('Farm added successfully', 'success'); await renderCurrentRoute();
    } catch (err) { toast(err.message, 'error'); }
  });
};

window.openAddPlotModal = function openAddPlotModal(farmId) {
  const isSw = isSwahili();
  showModal(tr('Add crop plot', 'Ongeza kipande cha zao'), `
    <form id="add-plot-form">
      <div class="form-group"><label class="form-label" for="plot-crop">${tr('Crop type', 'Aina ya zao')} *</label><select class="form-select" id="plot-crop" required><option value="maize">Maize</option><option value="potato">Irish Potato</option><option value="tomato">Tomato</option></select></div>
      <div class="form-group"><label class="form-label" for="plot-variety">${tr('Variety / hybrid', 'Aina / mbegu')}</label><input class="form-control" id="plot-variety" placeholder="H6213, Shangi, Anna F1"></div>
      <div class="form-grid"><div class="form-group"><label class="form-label" for="plot-stage">${tr('Growth stage', 'Hatua ya ukuaji')}</label><select class="form-select" id="plot-stage"><option value="Vegetative">Vegetative</option><option value="Flowering / Silking">Flowering / Silking</option><option value="Tuber Bulking / Fruit Set">Tuber Bulking / Fruit Set</option><option value="Maturation">Maturation</option></select></div><div class="form-group"><label class="form-label" for="plot-size">${tr('Plot size (acres)', 'Ukubwa (ekari)')}</label><input class="form-control" id="plot-size" type="number" min="0" step="0.1" placeholder="1.0"></div></div>
      <button class="btn btn-primary btn-full" type="submit">${tr('Save crop plot', 'Hifadhi kipande')}</button>
    </form>`);
  document.getElementById('add-plot-form')?.addEventListener('submit', async event => {
    event.preventDefault();
    try {
      await api.createPlot(farmId, { crop_type: document.getElementById('plot-crop').value, variety: document.getElementById('plot-variety').value.trim() || null, growth_stage: document.getElementById('plot-stage').value || null, field_size_value: parseFloat(document.getElementById('plot-size').value) || null });
      closeModal(); toast('Crop plot added successfully', 'success'); await renderCurrentRoute();
    } catch (err) { toast(err.message, 'error'); }
  });
};

window.openCompleteFollowUpModal = function openCompleteFollowUpModal(scanId, followUpId) {
  const isSw = isSwahili();
  showModal(tr('Record follow-up', 'Rekodi ufuatiliaji'), `
    <form id="complete-fu-form">
      <div class="form-group"><label class="form-label" for="fu-outcome">${tr('Current plant health', 'Hali ya mimea')} *</label><select class="form-select" id="fu-outcome" required><option value="improving">Improving / symptoms subsiding</option><option value="unchanged">Unchanged</option><option value="worsening">Worsening / spreading</option></select></div>
      <div class="form-group"><label class="form-label" for="fu-notes">${tr('Observation notes', 'Maelezo')}</label><textarea class="form-textarea" id="fu-notes" placeholder="Pruned affected leaves, no new lesions…"></textarea></div>
      <button class="btn btn-primary btn-full" type="submit">${tr('Complete follow-up', 'Kamilisha')}</button>
    </form>`);
  document.getElementById('complete-fu-form')?.addEventListener('submit', async event => {
    event.preventDefault();
    try {
      await api.updateFollowUp(scanId, followUpId, { status: 'completed', outcome: document.getElementById('fu-outcome').value, notes: document.getElementById('fu-notes').value.trim() || null });
      closeModal(); toast('Follow-up status recorded', 'success'); await renderCurrentRoute();
    } catch (err) { toast(err.message, 'error'); }
  });
};

window.openReviewModal = function openReviewModal(scanId, predictedLabel) {
  showModal('Extension Officer Review', `
    <form id="expert-review-form">
      <div class="review-ai-note"><span>${icon('microscope', 18)}</span><p>AI screening label: <strong>${esc(formatDiseaseName(predictedLabel))}</strong></p></div>
      <div class="form-group"><label class="form-label" for="rev-decision">Review decision *</label><select class="form-select" id="rev-decision" required><option value="confirmed">Confirm AI diagnosis</option><option value="corrected">Correct diagnosis label</option><option value="inconclusive">Inconclusive</option><option value="needs_new_image">Request clearer image</option></select></div>
      <div class="form-group" id="corrected-label-group" hidden><label class="form-label" for="rev-corrected-label">Corrected disease label</label><select class="form-select" id="rev-corrected-label">${['maize_gray_leaf_spot','maize_common_rust','maize_northern_leaf_blight','maize_healthy','potato_early_blight','potato_late_blight','potato_healthy','tomato_bacterial_spot','tomato_early_blight','tomato_late_blight','tomato_healthy'].map(label => `<option value="${label}">${formatDiseaseName(label)}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label" for="rev-notes">Extension officer notes</label><textarea class="form-textarea" id="rev-notes" placeholder="Agronomic instructions, stewardship advice, or field notes…"></textarea></div>
      <button class="btn btn-primary btn-full" type="submit">Submit expert verification</button>
    </form>`);
  const decision = document.getElementById('rev-decision');
  const correctedGroup = document.getElementById('corrected-label-group');
  decision?.addEventListener('change', () => { correctedGroup.hidden = decision.value !== 'corrected'; });
  document.getElementById('expert-review-form')?.addEventListener('submit', async event => {
    event.preventDefault();
    try {
      const value = decision.value;
      await api.submitExpertReview(scanId, { decision: value, corrected_label: value === 'corrected' ? document.getElementById('rev-corrected-label').value : null, notes: document.getElementById('rev-notes').value.trim() || null });
      closeModal(); toast('Expert verification submitted', 'success'); await renderCurrentRoute();
    } catch (err) { toast(err.message, 'error'); }
  });
};

window.markRead = async function markRead(notificationId) {
  try { await api.markNotificationRead(notificationId); await renderCurrentRoute(); }
  catch (err) { toast(err.message, 'error'); }
};

window.markAllRead = async function markAllRead() {
  try { await api.markAllNotificationsRead(); toast('All notifications marked as read', 'success'); await renderCurrentRoute(); }
  catch (err) { toast(err.message, 'error'); }
};

window.deactivateUserConfirmed = async function deactivateUserConfirmed(userId) {
  if (!window.confirm('Deactivate this user account?')) return;
  try { await api.deactivateUser(userId); toast('User deactivated', 'success'); await renderCurrentRoute(); }
  catch (err) { toast(err.message, 'error'); }
};

// Navigation and app shell
function navLink(route, iconName, label, active = false, badge = '') {
  return `<li><a class="nav-link ${active ? 'active' : ''}" href="${route}">${icon(iconName, 18)}<span>${esc(label)}</span>${badge}</a></li>`;
}

function bottomLink(route, iconName, label, active = false) {
  return `<a class="bottom-nav-item ${active ? 'active' : ''}" href="${route}">${icon(iconName, 21)}<span>${esc(label)}</span></a>`;
}

function updateNav() {
  const desktopNav = document.getElementById('desktop-nav-menu');
  const mobileNav = document.getElementById('mobile-bottom-nav');
  const footer = document.getElementById('sidebar-user-footer');
  const topbar = document.getElementById('desktop-top-bar');
  const topUser = document.getElementById('top-bar-user');
  const count = document.getElementById('top-notification-count');
  if (!desktopNav || !mobileNav) return;
  document.querySelectorAll('.language-toggle').forEach(b => {
    b.dataset.lang = state.lang;
    b.innerHTML = LANGS.map(l => `<span class="seg${l.code === state.lang ? ' is-active' : ''}" data-l="${l.code}" lang="${l.code}">${l.short}</span>`).join('');
    b.setAttribute('aria-label', tr('Switch language', 'Badilisha lugha'));
  });

  const route = state.currentRoute;
  const isSw = isSwahili();
  const brandSubtitle = document.getElementById('brand-subtitle');
  if (brandSubtitle) brandSubtitle.textContent = tr('Healthier crops · Stronger farmers', 'Mazao yenye afya · Wakulima imara');
  if (!state.user) {
    topbar?.classList.add('is-hidden');
    desktopNav.innerHTML = [
      navLink('#/', 'home', t('nav.home', 'Home'), route === '#/'),
      navLink('#/login', 'login', t('nav.login', 'Sign In'), route === '#/login'),
      navLink('#/register', 'register', t('nav.register', 'Register'), route === '#/register')
    ].join('');
    mobileNav.innerHTML = [
      bottomLink('#/', 'home', tr('Home', 'Nyumbani'), route === '#/'),
      bottomLink('#/login', 'login', tr('Sign In', 'Ingia'), route === '#/login'),
      bottomLink('#/register', 'register', tr('Register', 'Jiandikishe'), route === '#/register')
    ].join('');
    if (footer) footer.innerHTML = `<button class="sidebar-language" type="button" onclick="toggleLanguage()">${langInfo().short}<span>${langInfo().name}</span></button>`;
    return;
  }

  topbar?.classList.remove('is-hidden');
  const user = state.user;
  if (topUser) topUser.innerHTML = `<span class="top-user-avatar">${esc((user.full_name || 'U').split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase())}</span><span><strong>${esc(user.full_name)}</strong><small>${esc(user.role)}</small></span>`;
  if (count) {
    count.hidden = !state.notificationsCount;
    count.textContent = state.notificationsCount > 99 ? '99+' : state.notificationsCount;
  }

  const roleLinks = [];
  if (user.role === 'extension_officer' || user.role === 'admin') roleLinks.push(navLink('#/expert', 'users', t('nav.expert', 'Expert Review'), route === '#/expert'));
  if (user.role === 'admin') roleLinks.push(navLink('#/admin', 'shield', t('nav.admin', 'Admin'), route === '#/admin'));

  desktopNav.innerHTML = [
    navLink('#/dashboard', 'dashboard', t('nav.dashboard', 'Dashboard'), route === '#/dashboard'),
    navLink('#/scan', 'scan', t('nav.scan', 'Scan Crop'), route === '#/scan'),
    navLink('#/farms', 'farms', t('nav.farms', 'Farms'), route.startsWith('#/farms')),
    navLink('#/history', 'history', t('nav.history', 'History'), route === '#/history'),
    navLink('#/follow-ups', 'tasks', t('nav.follow_ups', 'Follow-ups'), route === '#/follow-ups'),
    navLink('#/notifications', 'bell', t('nav.notifications', 'Notifications'), route === '#/notifications', state.notificationsCount ? `<span class="nav-badge">${state.notificationsCount}</span>` : ''),
    ...roleLinks,
    navLink('#/profile', 'profile', t('nav.profile', 'Profile'), route === '#/profile')
  ].join('');

  mobileNav.innerHTML = [
    bottomLink('#/dashboard', 'dashboard', tr('Home', 'Nyumbani'), route === '#/dashboard'),
    bottomLink('#/scan', 'scan', tr('Scan', 'Pima'), route === '#/scan'),
    bottomLink('#/farms', 'farms', tr('Farms', 'Mashamba'), route.startsWith('#/farms')),
    bottomLink('#/follow-ups', 'tasks', tr('Tasks', 'Kazi'), route === '#/follow-ups'),
    bottomLink('#/profile', 'profile', tr('Profile', 'Wasifu'), route === '#/profile')
  ].join('');

  if (footer) footer.innerHTML = `
    <div class="sidebar-user"><span class="sidebar-avatar">${esc((user.full_name || 'U').split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase())}</span><div><strong>${esc(user.full_name)}</strong><small>${esc(user.role)}</small></div></div>
    <button class="sidebar-logout" type="button" onclick="api.logout()">${icon('logout', 16)} ${t('nav.logout', 'Sign Out')}</button>`;
}

function updateTopBar(route) {
  const title = document.getElementById('top-bar-title');
  const subtitle = document.getElementById('top-bar-subtitle');
  if (!title || !subtitle) return;
  const labels = {
    '#/': [tr('Kenya Crop Health AI', 'Kenya Crop Health AI'), tr('AI-powered crop disease detection', 'Utambuzi wa magonjwa ya mazao kwa AI')],
    '#/dashboard': [tr('Farmer Dashboard', 'Dashibodi ya Mkulima'), tr('Farm health overview', 'Muhtasari wa afya ya shamba')],
    '#/scan': [tr('Scan Crop', 'Pima Zao'), tr('AI disease detection workflow', 'Mchakato wa utambuzi wa magonjwa kwa AI')],
    '#/scans/:id': [tr('Scan Result', 'Matokeo ya Kipimo'), tr('Diagnosis and recommendations', 'Utambuzi na mapendekezo')],
    '#/farms': [tr('Farm Management', 'Usimamizi wa Shamba'), tr('Locations and crop plots', 'Maeneo na vipande vya mazao')],
    '#/farms/:id': [tr('Farm Details', 'Maelezo ya Shamba'), tr('Crop plots and scan activity', 'Vipande vya mazao na shughuli za kipimo')],
    '#/history': [tr('Scan History', 'Historia ya Vipimo'), tr('Diagnostic records', 'Rekodi za uchunguzi')],
    '#/follow-ups': [tr('Follow-ups', 'Ufuatiliaji'), tr('Recovery monitoring', 'Ufuatiliaji wa kupona')],
    '#/notifications': [tr('Notifications', 'Taarifa'), tr('Alerts and expert updates', 'Arifa na masasisho ya wataalamu')],
    '#/expert': [tr('Expert Review', 'Uhakiki wa Mtaalamu'), tr('Human verification queue', 'Foleni ya uhakiki wa binadamu')],
    '#/admin': [tr('Admin Dashboard', 'Dashibodi ya Usimamizi'), tr('Platform analytics', 'Uchambuzi wa jukwaa')],
    '#/admin-analytics': [tr('Disease Surveillance', 'Ufuatiliaji wa Magonjwa'), tr('County-level intelligence', 'Taarifa za kiwango cha kaunti')],
    '#/profile': [tr('Profile', 'Wasifu'), tr('Account settings', 'Mipangilio ya akaunti')]
  };
  const [pageTitle, pageSubtitle] = labels[route] || labels['#/'];
  title.textContent = pageTitle;
  subtitle.textContent = pageSubtitle;
}

async function renderCurrentRoute() {
  const { route, params } = parseHash();
  state.currentRoute = route;
  state.routeParams = params;
  destroyCharts();
  updateTopBar(route);
  updateNav();

  const content = document.getElementById('page-content');
  if (!content) return;
  content.innerHTML = `<div class="page-loading" role="status"><span class="loading-spinner"></span><p>Loading…</p></div>`;

  try {
    let html = '';
    switch (route) {
      case '#/': html = await renderLanding(); break;
      case '#/login': html = renderLogin(); break;
      case '#/register': html = renderRegister(); break;
      case '#/dashboard': html = await renderDashboard(); break;
      case '#/farms': html = await renderFarms(); break;
      case '#/farms/:id': html = await renderFarmDetails(params.id); break;
      case '#/scan': html = await renderScan(); break;
      case '#/scans/:id': html = await renderScanDetails(params.id); break;
      case '#/history': html = await renderHistory(); break;
      case '#/follow-ups': html = await renderFollowUps(); break;
      case '#/notifications': html = await renderNotifications(); break;
      case '#/expert': html = await renderExpert(); break;
      case '#/admin': html = await renderAdmin(); break;
      case '#/admin-analytics': html = await renderSurveillanceMap(); break;
      case '#/profile': html = renderProfile(); break;
      default: html = await renderLanding();
    }
    content.innerHTML = html;
    bindRouteEvents(route);
    afterRender(route);
  } catch (err) {
    console.error('Route render error:', err);
    content.innerHTML = renderErrorState('Page loading error', err.message);
  }
}

function afterRender(route) {
  hydrateProtectedMedia(document).catch(() => {});
  if (state.user) {
    api.getNotificationCount().then(data => {
      const count = Number(data?.count ?? data?.unread_count ?? data ?? 0);
      if (Number.isFinite(count)) { state.notificationsCount = count; updateNav(); }
    }).catch(() => {});
  }
  if (route === '#/dashboard') {
    api.getScans('?limit=50').then(initializeDashboardChart).catch(() => {});
  }
  if (route === '#/admin') {
    api.getAdminStats().then(stats => {
      const diseases = Object.entries(stats.scans_by_disease || {});
      const crops = Object.entries(stats.scans_by_crop || {});
      initializeAdminChart('disease-chart', diseases.map(([key]) => formatDiseaseName(key)), diseases.map(([, value]) => value), '#17724a');
      initializeAdminChart('crop-chart', crops.map(([key]) => cropLabel(key)), crops.map(([, value]) => value), '#d59b45');
    }).catch(() => {});
  }
}

function assessImageQuality(file, image) {
  const isSw = isSwahili();
  const messages = [];
  if (file.size > 10 * 1024 * 1024) messages.push(tr('Image is larger than 10 MB.', 'Picha ni kubwa kuliko 10 MB.'));
  if (image.naturalWidth < 512 || image.naturalHeight < 512) messages.push(tr('Resolution is low; use a closer, sharper photo.', 'Azimio ni dogo; tumia picha yenye umbali wa karibu na ukavu.'));
  if (!messages.length) messages.push(tr('Image appears suitable for analysis.', 'Picha inaonekana kutosha kwa uchambuzi.'));
  const isGood = messages.length === 1 && (messages[0].includes('suitable') || messages[0].includes('kutosha'));
  return `<div class="quality-box ${isGood ? 'good' : 'warning'}">${messages.map(message => `<p>${icon(isGood ? 'check' : 'warning', 16)} ${esc(message)}</p>`).join('')}<small>${esc(file.name)} · ${(file.size / 1024 / 1024).toFixed(2)} MB</small></div>`;
}

function handleScanFile(file) {
  if (!file) return;
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
    toast('Please use a JPEG, PNG, or WebP image', 'error');
    return;
  }
  if (state.previewObjectUrl) URL.revokeObjectURL(state.previewObjectUrl);
  state.previewObjectUrl = URL.createObjectURL(file);
  const preview = document.getElementById('preview-container');
  const image = document.getElementById('preview-img');
  const quality = document.getElementById('quality-feedback');
  if (!preview || !image || !quality) return;
  image.onload = () => { quality.innerHTML = assessImageQuality(file, image); };
  image.src = state.previewObjectUrl;
  preview.hidden = false;
}

function bindRouteEvents() {
  const loginForm = document.getElementById('login-form');
  loginForm?.addEventListener('submit', async event => {
    event.preventDefault();
    const button = document.getElementById('login-btn');
    const original = button.textContent;
    button.disabled = true; button.textContent = tr('Signing in…', 'Inaingia…');
    try {
      await api.login(document.getElementById('login-phone').value.trim(), document.getElementById('login-password').value);
      toast(tr('Welcome back!', 'Karibu tena!'), 'success'); navigate('#/dashboard');
    } catch (err) { toast(err.message, 'error'); button.disabled = false; button.textContent = original; }
  });

  const registerForm = document.getElementById('register-form');
  registerForm?.addEventListener('submit', async event => {
    event.preventDefault();
    const button = document.getElementById('reg-btn');
    const original = button.textContent;
    button.disabled = true; button.textContent = tr('Creating account…', 'Inasajili…');
    try {
      await api.register({ full_name: document.getElementById('reg-name').value.trim(), phone_number: document.getElementById('reg-phone').value.trim(), email: document.getElementById('reg-email').value.trim() || null, county: document.getElementById('reg-county').value, sub_county: document.getElementById('reg-subcounty').value.trim() || null, role: document.getElementById('reg-role').value, preferred_language: apiLang(document.getElementById('reg-lang').value), password: document.getElementById('reg-password').value });
      const regLang = document.getElementById('reg-lang').value;
      if (regLang !== state.lang) await loadLocales(regLang);
      toast('Account created successfully', 'success'); navigate('#/dashboard');
    } catch (err) { toast(err.message, 'error'); button.disabled = false; button.textContent = original; }
  });

  const farmSelect = document.getElementById('scan-farm');
  const plotSelect = document.getElementById('scan-plot');
  farmSelect?.addEventListener('change', async () => {
    const farmId = farmSelect.value;
    if (!farmId) { plotSelect.innerHTML = `<option value="">${tr('General / unassigned', 'Bila shamba maalum')}</option>`; plotSelect.disabled = true; return; }
    plotSelect.disabled = true; plotSelect.innerHTML = '<option>Loading plots…</option>';
    try {
      const plots = await api.getPlots(farmId);
      plotSelect.disabled = false;
      plotSelect.innerHTML = `<option value="">${tr('All plots / general', 'Vipande vyote')}</option>` + plots.map(plot => `<option value="${esc(plot.id)}">${cropLabel(plot.crop_type)} · ${esc(plot.variety || 'Plot')}</option>`).join('');
    } catch (err) { toast(err.message, 'error'); plotSelect.disabled = true; plotSelect.innerHTML = `<option value="">${tr('Unable to load plots', 'Haikuweza kupakia')}</option>`; }
  });

  const dropzone = document.getElementById('upload-dropzone');
  const fileInput = document.getElementById('scan-file');
  dropzone?.addEventListener('click', () => fileInput?.click());
  dropzone?.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); fileInput?.click(); } });
  ['dragenter', 'dragover'].forEach(name => dropzone?.addEventListener(name, event => { event.preventDefault(); dropzone.classList.add('drag-over'); }));
  ['dragleave', 'drop'].forEach(name => dropzone?.addEventListener(name, event => { event.preventDefault(); dropzone.classList.remove('drag-over'); }));
  dropzone?.addEventListener('drop', event => {
    const file = event.dataTransfer?.files?.[0];
    if (file && fileInput) { fileInput.files = event.dataTransfer.files; handleScanFile(file); }
  });
  fileInput?.addEventListener('change', () => handleScanFile(fileInput.files?.[0]));

  const scanForm = document.getElementById('scan-form');
  scanForm?.addEventListener('submit', async event => {
    event.preventDefault();

    const selectedFile = capturedCameraFile || fileInput?.files?.[0] || null;
    if (!selectedFile) {
      toast(tr('Please capture or choose a leaf photo first', 'Tafadhali weka picha ya jani kwanza'), 'error');
      return;
    }

    const cropSelect = document.getElementById('scan-crop');
    const crop = cropSelect?.value || '';
    if (!crop) {
      toast(tr('Please select Maize, Irish potato, or Tomato before analysis.', 'Tafadhali chagua Mahindi, Viazi mviringo, au Nyanya kabla ya uchambuzi.'), 'error');
      cropSelect?.focus();
      return;
    }

    const button = document.getElementById('submit-scan-btn');
    const original = button.innerHTML;
    button.disabled = true;
    button.innerHTML = `<span class="loading-spinner button-spinner"></span> ${tr('Analyzing with AI…', 'AI inachambua…')}`;
    showAnalyzing(scanForm);

    const formData = new FormData();
    formData.append('file', selectedFile);
    if (farmSelect?.value) formData.append('farm_id', farmSelect.value);
    if (plotSelect?.value) formData.append('plot_id', plotSelect.value);
    formData.append('crop', crop);
    const stage = document.getElementById('scan-stage')?.value;
    if (stage) formData.append('growth_stage', stage);
    formData.append('lang', apiLang(state.lang));

    try {
      const startedAt = Date.now();
      const result = await api.submitScan(formData);
      const remaining = Math.max(0, 1800 - (Date.now() - startedAt));
      if (remaining) await new Promise(resolve => setTimeout(resolve, remaining));
      capturedCameraFile = null;
      stopCamera();
      toast(tr('Analysis complete', 'Uchambuzi umekamilika'), 'success');
      navigate(`#/scans/${result.id}`);
    } catch (err) {
      hideAnalyzing(scanForm);
      toast(err.message, 'error');
      button.disabled = false;
      button.innerHTML = original;
    }
  });

  const feedbackForm = document.getElementById('feedback-form');
  feedbackForm?.addEventListener('submit', async event => {
    event.preventDefault();
    const button = document.getElementById('submit-feedback-btn');
    button.disabled = true;
    try {
      await api.submitFeedback(feedbackForm.dataset.scanId, { helpful: feedbackForm.querySelector('input[name="helpful"]:checked')?.value || null, outcome: feedbackForm.querySelector('select[name="outcome"]')?.value || null, notes: feedbackForm.querySelector('input[name="notes"]')?.value.trim() || null });
      document.getElementById('feedback-card').innerHTML = `<div class="feedback-success">${icon('check', 22)}<p>${esc(t('feedback.submitted', 'Thank you for your feedback!'))}</p></div>`;
      toast(t('feedback.submitted', 'Thank you for your feedback!'), 'success');
    } catch (err) { toast(err.message, 'error'); button.disabled = false; }
  });
}

window.runApiIntegrationCheck = async function runApiIntegrationCheck() {
  const checks = [
    ['health', () => api.health()],
    ['public stats', () => api.getPublicStats()]
  ];
  if (state.token) {
    checks.push(
      ['current user', () => api.getMe()],
      ['farms', () => api.getFarms()],
      ['scans', () => api.getScans('?limit=1')],
      ['dashboard analytics', () => api.getDashboardStats()],
      ['health trend', () => api.getHealthTrend(30)],
      ['farm timeline', () => api.getFarmTimeline('', 1)],
      ['follow-ups', () => api.getFollowUps()],
      ['overdue follow-ups', () => api.getOverdueFollowUps()],
      ['notifications', () => api.getNotifications()],
      ['notification count', () => api.getNotificationCount()]
    );
    if (state.user?.role === 'extension_officer' || state.user?.role === 'admin') {
      checks.push(
        ['expert pending', () => api.getPendingReviews()],
        ['expert low-confidence', () => api.getLowConfidenceReviews()],
        ['expert severe', () => api.getSevereReviews()],
        ['surveillance', () => api.getSurveillanceData()]
      );
    }
    if (state.user?.role === 'admin') {
      checks.push(
        ['admin analytics', () => api.getAdminStats()],
        ['admin users', () => api.getAdminUsers(0, 1)],
        ['admin scans', () => api.getAdminScans(0, 1)],
        ['admin follow-ups', () => api.getAdminFollowUps(0, 1)],
        ['model versions', () => api.getModelVersions()]
      );
    }
  }
  const results = [];
  for (const [name, fn] of checks) {
    try { await fn(); results.push({ endpoint: name, status: 'PASS' }); }
    catch (err) { results.push({ endpoint: name, status: 'FAIL', error: err.message }); }
  }
  console.table(results);
  return results;
};

window.addEventListener('hashchange', renderCurrentRoute);
window.addEventListener('keydown', event => { if (event.key === 'Escape') closeModal(); });

async function initApp() {
  await loadLocales(state.lang);
  document.getElementById('lang-toggle-btn')?.addEventListener('click', onLanguageToggleClick);
  document.getElementById('lang-toggle-mobile')?.addEventListener('click', onLanguageToggleClick);

  if (state.token) {
    try {
      state.user = await api.getMe();
      localStorage.setItem('user', JSON.stringify(state.user));
    } catch (_) {
      state.token = null; state.user = null;
      localStorage.removeItem('token'); localStorage.removeItem('user');
    }
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(err => console.warn('Service worker registration skipped:', err));
  }

  if (!window.location.hash) window.location.hash = '#/';
  await renderCurrentRoute();
}

window.addEventListener('DOMContentLoaded', initApp);
