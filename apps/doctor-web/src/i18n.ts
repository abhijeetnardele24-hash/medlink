import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "consultation": {
        "commandCenter": "Doctor's Command Center",
        "connectedE2E": "Connected E2EE",
        "waiting": "Waiting for connection",
        "uploadRecording": "Upload Recording",
        "uploading": "Uploading to Cloud..."
      }
    }
  },
  hi: {
    translation: {
      "consultation": {
        "commandCenter": "डॉक्टर का कमांड सेंटर",
        "connectedE2E": "कनेक्टेड E2EE",
        "waiting": "कनेक्शन की प्रतीक्षा कर रहा है",
        "uploadRecording": "रिकॉर्डिंग अपलोड करें",
        "uploading": "क्लाउड पर अपलोड हो रहा है..."
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
