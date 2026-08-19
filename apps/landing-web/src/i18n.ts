import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// the translations
const resources = {
  en: {
    translation: {
      "nav": {
        "architecture": "Architecture",
        "capabilities": "Capabilities",
        "solutions": "Solutions",
        "patientApp": "Patient App",
        "patientAppDesc": "Self-service booking & video.",
        "doctorHub": "Doctor Hub",
        "doctorHubDesc": "WebRTC hub with prescribing.",
        "adminConsole": "Admin Console",
        "adminConsoleDesc": "Centralized global hospital operations.",
        "pharmacyPortal": "Pharmacy Portal",
        "pharmacyPortalDesc": "Enterprise medicine marketplace.",
        "videoEngine": "Video Engine",
        "patientLogin": "Patient Login",
        "doctorPortal": "Doctor Portal"
      },
      "hero": {
        "title1": "Healthcare, ",
        "title2": "unified.",
        "subtitle": "Experience resilient, enterprise-grade healthcare delivery. Featuring real-time video degradation and offline sync, MedLink connects patients and doctors across the globe seamlessly.",
        "exploreBtn": "Explore the Architecture",
        "doctorDemoBtn": "Doctor Demo",
        "trust1": "HIPAA Compliant",
        "trust2": "SOC-2 Certified",
        "trust3": "99.99% Uptime"
      },
      "capabilities": {
        "title": "Core Capabilities",
        "subtitle": "Engineered for scale and reliability, MedLink provides the essential building blocks for modern healthcare delivery systems.",
        "card1Title": "Resilient WebRTC",
        "card1Desc": "Adaptive bitrate streaming ensures crystal clear consultations even on 3G mobile networks. Auto-reconnects on drop.",
        "card2Title": "Integrated E-Pharmacy",
        "card2Desc": "Digital prescriptions flow instantly to the pharmacy portal. Live inventory sync prevents prescribing out-of-stock medicine.",
        "card3Title": "Clinical Triage",
        "card3Desc": "Advanced routing algorithms match patients with the right specialists based on symptoms, availability, and specialty."
      },
      "workflow": {
        "title": "The Clinical Workflow",
        "subtitle": "How MedLink processes millions of remote encounters with zero friction, connecting four separate portals through a centralized API gateway.",
        "step1Title": "Patient Intake & Scheduling",
        "step1Desc": "Patients log into a secure, HIPAA-compliant gateway. They browse verified specialists, view real-time availability, and request appointments based on their specific health concern.",
        "step1App": "Patient Portal",
        "step1Tag1": "PostgreSQL Auth",
        "step1Tag2": "Node.js REST API",
        "step2Title": "Clinical Verification & Triage",
        "step2Desc": "Hospital administrators and coordinators monitor incoming requests globally. They verify patient records, manage doctor workloads, and ensure compliance before the encounter begins.",
        "step2App": "Coordinator Console",
        "step2Tag1": "Real-time Analytics",
        "step2Tag2": "Role-Based Access",
        "step3Title": "WebRTC Video Consultation",
        "step3Desc": "At the scheduled time, a peer-to-peer, end-to-end encrypted video room is instantiated. Doctors have access to in-call controls, split-screen patient history, and live recording.",
        "step3App": "Doctor & Patient",
        "step3Tag1": "Socket.io Signaling",
        "step3Tag2": "E2EE Video Streams",
        "step4Title": "Post-Encounter Processing",
        "step4Desc": "The encounter concludes. The video recording is automatically compressed and uploaded to secure cloud storage. The doctor finalizes clinical notes and issues digital prescriptions.",
        "step4App": "Doctor Portal",
        "step4Tag1": "Firebase Blob Storage",
        "step4Tag2": "Immutable Records",
        "step5Title": "Pharmacy Fulfillment",
        "step5Desc": "Digital prescriptions automatically flow into the secure Pharmacy marketplace. Registered pharmacists verify prescriptions, manage inventory, and process orders for patient pickup or delivery.",
        "step5App": "Pharmacy Portal",
        "step5Tag1": "Rx Verification",
        "step5Tag2": "Inventory Sync"
      },
      "trust": {
        "title": "Enterprise-Grade Security",
        "subtitle": "Patient data privacy is our absolute priority. MedLink implements AES-256 encryption at rest and TLS 1.3 in transit, fully complying with global healthcare regulations including HIPAA and GDPR.",
        "hipaa": "HIPAA",
        "compliant": "Compliant",
        "iso": "ISO 27001",
        "certified": "Certified",
        "e2e": "End-to-End",
        "encryption": "Encryption"
      },
      "architecture": {
        "title": "Built for massive throughput.",
        "subtitle": "MedLink operates on a microservices-inspired architecture. A centralized Node.js API gateway handles requests from four distinct React applications, ensuring complete data isolation and strict role-based access control. Video streams flow directly peer-to-peer for maximum performance.",
        "adminBtn": "Login to Admin Console"
      },
      "footer": {
        "desc": "Enterprise Telemedicine Infrastructure built for the modern health system.",
        "portals": "Portals",
        "patientGateway": "Patient Gateway",
        "doctorHub": "Doctor Hub",
        "adminConsole": "Admin Console",
        "pharmacyPortal": "Pharmacy Portal",
        "company": "Company",
        "documentation": "Documentation",
        "securityProtocol": "Security Protocol",
        "contactSales": "Contact Sales",
        "copyright": "© 2024 MedLink Enterprise. All rights reserved.",
        "systemStatus": "System Status: Operational"
      }
    }
  },
  hi: {
    translation: {
      "nav": {
        "architecture": "तकनीक (Architecture)",
        "capabilities": "सुविधाएं",
        "solutions": "सेवाएं",
        "patientApp": "मरीज़ ऐप",
        "patientAppDesc": "खुद से बुकिंग और वीडियो कॉल।",
        "doctorHub": "डॉक्टर हब",
        "doctorHubDesc": "प्रिस्क्रिप्शन और वीडियो कॉल।",
        "adminConsole": "एडमिन पैनल",
        "adminConsoleDesc": "अस्पताल के सारे काम एक जगह से संभालें।",
        "pharmacyPortal": "फार्मेसी पोर्टल",
        "pharmacyPortalDesc": "दवाइयों का ऑनलाइन स्टोर।",
        "videoEngine": "वीडियो इंजन",
        "patientLogin": "मरीज़ लॉगिन",
        "doctorPortal": "डॉक्टर पोर्टल"
      },
      "hero": {
        "title1": "बेहतर स्वास्थ्य सेवा, ",
        "title2": "अब सबके लिए आसान।",
        "subtitle": "भरोसेमंद और सुरक्षित स्वास्थ्य सेवा का अनुभव करें। बिना रुके वीडियो कॉल और बेहतरीन तकनीक के साथ, MedLink दुनिया भर में मरीजों और डॉक्टरों को बहुत आसानी से जोड़ता है।",
        "exploreBtn": "हमारी तकनीक के बारे में जानें",
        "doctorDemoBtn": "डॉक्टर डेमो देखें",
        "trust1": "HIPAA नियमों का पालन",
        "trust2": "SOC-2 सर्टिफाइड",
        "trust3": "हमेशा चालू (99.99%)"
      },
      "capabilities": {
        "title": "हमारी मुख्य सुविधाएं",
        "subtitle": "MedLink को बहुत ही भरोसेमंद बनाया गया है, ताकि आपको एक बेहतरीन और सुरक्षित स्वास्थ्य सेवा मिल सके।",
        "card1Title": "बिना रुके वीडियो कॉल",
        "card1Desc": "धीमे इंटरनेट (3G) पर भी एकदम साफ़ वीडियो कॉल। नेटवर्क कटने पर अपने आप दोबारा जुड़ जाता है।",
        "card2Title": "ऑनलाइन फार्मेसी (दवाइयां)",
        "card2Desc": "डॉक्टर का पर्चा सीधे फार्मेसी के पास पहुंच जाता है। स्टॉक में मौजूद दवाइयां ही लिखी जाती हैं।",
        "card3Title": "सही डॉक्टर से मिलान",
        "card3Desc": "बीमारी के लक्षणों और समय के हिसाब से मरीज़ों को अपने आप सबसे सही डॉक्टर से मिलाया जाता है।"
      },
      "workflow": {
        "title": "यह कैसे काम करता है?",
        "subtitle": "MedLink का इस्तेमाल करना बहुत आसान है। देखिए कैसे यह सिस्टम बिना किसी परेशानी के रोज़ाना लाखों मरीज़ों की मदद करता है।",
        "step1Title": "मरीज़ की बुकिंग",
        "step1Desc": "मरीज़ हमारे सुरक्षित पोर्टल में लॉगिन करते हैं। वे अच्छे डॉक्टरों को खोजकर अपनी बीमारी के हिसाब से आसानी से अपॉइंटमेंट बुक कर सकते हैं।",
        "step1App": "मरीज़ पोर्टल",
        "step1Tag1": "सुरक्षित लॉगिन",
        "step1Tag2": "Node.js API",
        "step2Title": "जांच और तैयारी",
        "step2Desc": "अस्पताल का स्टाफ आने वाले अनुरोधों को देखता है। वे मरीज़ की जानकारी चेक करते हैं और डॉक्टर का समय तय करते हैं।",
        "step2App": "कोऑर्डिनेटर पैनल",
        "step2Tag1": "लाइव डेटा",
        "step2Tag2": "सुरक्षित एक्सेस",
        "step3Title": "डॉक्टर से वीडियो कॉल",
        "step3Desc": "तय समय पर डॉक्टर और मरीज़ की सुरक्षित वीडियो कॉल शुरू हो जाती है। कॉल के दौरान डॉक्टर मरीज़ की पुरानी रिपोर्ट भी देख सकते हैं।",
        "step3App": "डॉक्टर और मरीज़",
        "step3Tag1": "Socket.io",
        "step3Tag2": "सुरक्षित वीडियो",
        "step4Title": "कॉल के बाद का काम",
        "step4Desc": "कॉल खत्म होने के बाद, वीडियो सुरक्षित जगह पर सेव हो जाता है। डॉक्टर अपनी सलाह और दवाइयों का पर्चा ऑनलाइन लिख देते हैं।",
        "step4App": "डॉक्टर पोर्टल",
        "step4Tag1": "क्लाउड स्टोरेज",
        "step4Tag2": "सुरक्षित रिकॉर्ड",
        "step5Title": "दवाइयों की डिलीवरी",
        "step5Desc": "डॉक्टर का पर्चा सीधे हमारी ऑनलाइन फार्मेसी में चला जाता है। वहां फार्मासिस्ट दवाइयां पैक करके मरीज़ के घर भिजवा देते हैं।",
        "step5App": "फार्मेसी पोर्टल",
        "step5Tag1": "पर्चा चेक करना",
        "step5Tag2": "स्टॉक अपडेट"
      },
      "trust": {
        "title": "आपकी सुरक्षा हमारी जिम्मेदारी",
        "subtitle": "मरीज़ों के डेटा की सुरक्षा हमारे लिए सबसे ज़रूरी है। MedLink दुनिया के सबसे कड़े सुरक्षा नियमों (HIPAA और GDPR) का पालन करता है ताकि आपका डेटा हमेशा सुरक्षित रहे।",
        "hipaa": "HIPAA",
        "compliant": "नियमों का पालन",
        "iso": "ISO 27001",
        "certified": "सर्टिफाइड",
        "e2e": "एंड-टू-एंड",
        "encryption": "एन्क्रिप्शन (सुरक्षा)"
      },
      "architecture": {
        "title": "बड़े पैमाने पर काम करने के लिए तैयार।",
        "subtitle": "MedLink को एक बहुत ही मज़बूत और सुरक्षित तकनीक पर बनाया गया है। इसमें 4 अलग-अलग ऐप्स हैं जो एक मेन सिस्टम से जुड़े हैं, ताकि सबका डेटा अलग और सुरक्षित रहे।",
        "adminBtn": "एडमिन पैनल में लॉगिन करें"
      },
      "footer": {
        "desc": "आधुनिक अस्पतालों के लिए बनाई गई सबसे अच्छी टेलीमेडिसिन तकनीक।",
        "portals": "हमारे पोर्टल",
        "patientGateway": "मरीज़ पोर्टल",
        "doctorHub": "डॉक्टर हब",
        "adminConsole": "एडमिन पैनल",
        "pharmacyPortal": "फार्मेसी पोर्टल",
        "company": "कंपनी के बारे में",
        "documentation": "जानकारी पढ़ें",
        "securityProtocol": "सुरक्षा के नियम",
        "contactSales": "हमसे संपर्क करें",
        "copyright": "© 2024 MedLink Enterprise. सर्वाधिकार सुरक्षित।",
        "systemStatus": "सिस्टम की स्थिति: सही चल रहा है"
      }
    }
  },
  mr: {
    translation: {
      "nav": {
        "architecture": "तंत्रज्ञान (Architecture)",
        "capabilities": "सुविधा",
        "solutions": "सेवा",
        "patientApp": "रुग्ण ॲप",
        "patientAppDesc": "स्वतः बुकिंग आणि व्हिडिओ कॉल.",
        "doctorHub": "डॉक्टर हब",
        "doctorHubDesc": "प्रिस्क्रिप्शन आणि व्हिडिओ कॉल.",
        "adminConsole": "ॲडमिन पॅनेल",
        "adminConsoleDesc": "रुग्णालयाची सर्व कामे एकाच ठिकाणाहून करा.",
        "pharmacyPortal": "फार्मसी पोर्टल",
        "pharmacyPortalDesc": "औषधांचे ऑनलाइन स्टोअर.",
        "videoEngine": "व्हिडिओ इंजिन",
        "patientLogin": "रुग्ण लॉगिन",
        "doctorPortal": "डॉक्टर पोर्टल"
      },
      "hero": {
        "title1": "उत्तम आरोग्य सेवा, ",
        "title2": "आता सर्वांसाठी सोपी.",
        "subtitle": "सुरक्षित आणि विश्वासार्ह आरोग्य सेवेचा अनुभव घ्या. अखंड व्हिडिओ कॉल आणि अत्याधुनिक तंत्रज्ञानासह, MedLink जगभरातील रुग्णांना आणि डॉक्टरांना अगदी सहज जोडते.",
        "exploreBtn": "आमचे तंत्रज्ञान जाणून घ्या",
        "doctorDemoBtn": "डॉक्टर डेमो पहा",
        "trust1": "HIPAA नियमांचे पालन",
        "trust2": "SOC-2 सर्टिफाइड",
        "trust3": "नेहमी सुरू (99.99%)"
      },
      "capabilities": {
        "title": "आमची मुख्य वैशिष्ट्ये",
        "subtitle": "तुम्हाला एक उत्तम आणि सुरक्षित आरोग्य सेवा मिळावी यासाठी MedLink अतिशय विश्वासार्ह बनवण्यात आले आहे.",
        "card1Title": "अखंड व्हिडिओ कॉल",
        "card1Desc": "कमी इंटरनेट (3G) स्पीडवरही एकदम स्पष्ट व्हिडिओ कॉल. नेटवर्क तुटल्यास आपोआप पुन्हा जोडले जाते.",
        "card2Title": "ऑनलाइन फार्मसी (औषधे)",
        "card2Desc": "डॉक्टरांचे प्रिस्क्रिप्शन थेट फार्मसीकडे पोहोचते. स्टॉकमध्ये असलेली औषधेच दिली जातात.",
        "card3Title": "योग्य डॉक्टरांशी जुळवणी",
        "card3Desc": "आजार आणि वेळेनुसार रुग्णांना त्यांच्यासाठी सर्वात योग्य डॉक्टरांशी आपोआप जोडले जाते."
      },
      "workflow": {
        "title": "हे कसे काम करते?",
        "subtitle": "MedLink वापरणे खूप सोपे आहे. रोज लाखो रुग्णांना या सिस्टीमचा कसा सहज फायदा होतो ते पहा.",
        "step1Title": "रुग्ण बुकिंग",
        "step1Desc": "रुग्ण आमच्या सुरक्षित पोर्टलवर लॉग इन करतात. ते चांगल्या डॉक्टरांना शोधून आपल्या आजारानुसार सहज अपॉइंटमेंट बुक करू शकतात.",
        "step1App": "रुग्ण पोर्टल",
        "step1Tag1": "सुरक्षित लॉगिन",
        "step1Tag2": "Node.js API",
        "step2Title": "तपासणी आणि तयारी",
        "step2Desc": "रुग्णालयातील कर्मचारी येणाऱ्या विनंत्या पाहतात. ते रुग्णाची माहिती तपासून डॉक्टरांची वेळ निश्चित करतात.",
        "step2App": "कोऑर्डिनेटर पॅनेल",
        "step2Tag1": "थेट डेटा",
        "step2Tag2": "सुरक्षित अ‍ॅक्सेस",
        "step3Title": "डॉक्टरांशी व्हिडिओ कॉल",
        "step3Desc": "ठरलेल्या वेळी डॉक्टर आणि रुग्णाचा सुरक्षित व्हिडिओ कॉल सुरू होतो. या वेळी डॉक्टर रुग्णाचे जुने रिपोर्टही पाहू शकतात.",
        "step3App": "डॉक्टर आणि रुग्ण",
        "step3Tag1": "Socket.io",
        "step3Tag2": "सुरक्षित व्हिडिओ",
        "step4Title": "कॉल नंतरची कामे",
        "step4Desc": "कॉल संपल्यानंतर, व्हिडिओ एका सुरक्षित ठिकाणी सेव्ह होतो. डॉक्टर आपला सल्ला आणि औषधांचे प्रिस्क्रिप्शन ऑनलाइन लिहून देतात.",
        "step4App": "डॉक्टर पोर्टल",
        "step4Tag1": "क्लाउड स्टोरेज",
        "step4Tag2": "सुरक्षित रेकॉर्ड",
        "step5Title": "औषधांची डिलिव्हरी",
        "step5Desc": "डॉक्टरांचे प्रिस्क्रिप्शन थेट आमच्या ऑनलाइन फार्मसीमध्ये जाते. तेथून फार्मासिस्ट औषधे पॅक करून रुग्णाच्या घरी पोहोचवतात.",
        "step5App": "फार्मसी पोर्टल",
        "step5Tag1": "प्रिस्क्रिप्शन तपासणी",
        "step5Tag2": "स्टॉक अपडेट"
      },
      "trust": {
        "title": "तुमची सुरक्षा आमची जबाबदारी",
        "subtitle": "रुग्णांच्या डेटाची सुरक्षा आमच्यासाठी सर्वात महत्त्वाची आहे. आपला डेटा नेहमी सुरक्षित राहावा यासाठी MedLink जगातील सर्वात कडक सुरक्षा नियमांचे (HIPAA आणि GDPR) पालन करते.",
        "hipaa": "HIPAA",
        "compliant": "नियमांचे पालन",
        "iso": "ISO 27001",
        "certified": "सर्टिफाइड",
        "e2e": "एंड-टू-एंड",
        "encryption": "एन्क्रिप्शन (सुरक्षा)"
      },
      "architecture": {
        "title": "मोठ्या प्रमाणात काम करण्यासाठी तयार.",
        "subtitle": "MedLink एका अतिशय मजबूत आणि सुरक्षित तंत्रज्ञानावर तयार केले आहे. यात 4 वेगवेगळे ॲप्स एका मुख्य सिस्टीमला जोडलेले आहेत, जेणेकरून सर्वांचा डेटा स्वतंत्र आणि सुरक्षित राहतो.",
        "adminBtn": "ॲडमिन पॅनेलमध्ये लॉग इन करा"
      },
      "footer": {
        "desc": "आधुनिक रुग्णालयांसाठी बनवलेले सर्वोत्तम टेलिमेडिसिन तंत्रज्ञान.",
        "portals": "आमचे पोर्टल",
        "patientGateway": "रुग्ण पोर्टल",
        "doctorHub": "डॉक्टर हब",
        "adminConsole": "ॲडमिन पॅनेल",
        "pharmacyPortal": "फार्मसी पोर्टल",
        "company": "कंपनीबद्दल",
        "documentation": "माहिती वाचा",
        "securityProtocol": "सुरक्षेचे नियम",
        "contactSales": "आमच्याशी संपर्क साधा",
        "copyright": "© 2024 MedLink Enterprise. सर्व हक्क राखीव.",
        "systemStatus": "सिस्टीमची स्थिती: उत्तम चालत आहे"
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
