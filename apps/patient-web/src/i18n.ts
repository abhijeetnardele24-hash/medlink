import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "booking": {
        "bookAppointment": "Book Appointment",
        "consultationFee": "Consultation Fee",
        "about": "About",
        "languagesSpoken": "Languages Spoken",
        "selectReason": "Select Reason for Visit",
        "availableTimeSlots": "Available Time Slots",
        "noSlots": "No available slots found for this doctor."
      },
      "consultation": {
        "hqConnection": "HQ Connection",
        "poorConnection": "Poor Connection",
        "audioOnly": "Audio Only",
        "live": "Live",
        "waiting": "Waiting"
      },
      "pharmacy": {
        "title": "MedLink Pharmacy",
        "prescriptionAttached": "Prescription Attached",
        "searchMedicines": "Search medicines...",
        "rxRequired": "Rx Required",
        "addToCart": "Add to Cart",
        "yourCart": "Your Cart",
        "emptyCart": "Your cart is empty",
        "total": "Total",
        "deliveryAddress": "Delivery Address",
        "checkout": "Checkout"
      }
    }
  },
  hi: {
    translation: {
      "booking": {
        "bookAppointment": "अपॉइंटमेंट बुक करें",
        "consultationFee": "परामर्श शुल्क",
        "about": "के बारे में",
        "languagesSpoken": "बोली जाने वाली भाषाएं",
        "selectReason": "यात्रा का कारण चुनें",
        "availableTimeSlots": "उपलब्ध समय स्लॉट",
        "noSlots": "इस डॉक्टर के लिए कोई उपलब्ध स्लॉट नहीं मिला।"
      },
      "consultation": {
        "hqConnection": "उच्च गुणवत्ता कनेक्शन",
        "poorConnection": "कमज़ोर कनेक्शन",
        "audioOnly": "केवल ऑडियो",
        "live": "लाइव",
        "waiting": "प्रतीक्षा में"
      },
      "pharmacy": {
        "title": "मेडलिंक फार्मेसी",
        "prescriptionAttached": "पर्चा संलग्न है",
        "searchMedicines": "दवाएं खोजें...",
        "rxRequired": "पर्चा आवश्यक",
        "addToCart": "कार्ट में डालें",
        "yourCart": "आपका कार्ट",
        "emptyCart": "आपका कार्ट खाली है",
        "total": "कुल",
        "deliveryAddress": "वितरण का पता",
        "checkout": "चेकआउट"
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en", // fallback language is english
    fallbackLng: "en",
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
