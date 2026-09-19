export type Language = 'en' | 'bn' | 'hi'

export interface TranslationDictionary {
  // Common & Header
  shopCounterOpen: string
  shopCounterClosed: string
  desktopAgentOnline: string
  desktopAgentOffline: string
  selectLanguage: string
  shopOfflineTitle: string
  shopOfflineMessage: string

  // How it works
  howItWorksTitle: string
  stepUpload: string
  stepUploadDesc: string
  stepCustomize: string
  stepCustomizeDesc: string
  stepPay: string
  stepPayDesc: string

  // Service Selector
  selectService: string
  selectServiceDesc: string
  choosePrintService: string
  allServicesAndRates: string
  standardPrint: string
  idCardService: string
  legalStampService: string
  customService: string
  perPage: string
  flatFee: string

  // Upload Dropzone
  dropzoneTitle: string
  dropzoneSubtitle: string
  browseFiles: string
  supportedFormats: string
  batchMode: string
  batchCount: string
  addMoreFiles: string
  clearAll: string
  openIdStudio: string
  openStampStudio: string

  // Print Options
  printOptionsTitle: string
  colorMode: string
  blackAndWhite: string
  fullColor: string
  sideOptions: string
  singleSided: string
  doubleSided: string
  numberOfCopies: string
  pageSelection: string
  allPages: string
  customPages: string
  customPagesPlaceholder: string
  calculatedPages: string

  // Price & Checkout
  estimatedTotal: string
  ratePerUnit: string
  proceedToPay: string
  processing: string

  // Payment Methods
  choosePaymentMethod: string
  choosePaymentDesc: string
  payAtCounter: string
  payAtCounterDesc: string
  upiDeeplink: string
  upiDeeplinkDesc: string
  onlineGateway: string
  onlineGatewayDesc: string
  cancel: string

  // Confirmation
  orderConfirmed: string
  orderConfirmedDesc: string
  jobToken: string
  statusQueued: string
  printAnother: string

  // Detailed options & controls
  totalMultiplier: string
  colorPrintTitle: string
  duplexTitle: string
  duplexDesc: string

  // Page selection options
  pagesToPrint: string
  oddPages: string
  evenPages: string
  specificPages: string
  pageRangeHelp: string

  // Dropzone options
  tapToUploadDoc: string
  tapToUploadDocNum: string
  dropDocHere: string
  dragAndDropLimits: string
  addAnotherLimit: string
  replaceFile: string
  countingPagesText: string
  uploadingDocText: string

  // PriceBar & Bottom checkout
  estimateBadge: string
  shopPausedBadge: string
  shopOffline: string
  analyzing: string
  readingPagesBadge: string
  uploadFileBtn: string
  payBtn: string
  sendingBtn: string
  docsMerged: string
  pagesWord: string
  pageWord: string
  copiesWord: string

  // Batch queue
  docsToPrint: string
  combinedBill: string
  tapDocToAdjust: string
  mergedTotal: string
  addAnotherDocBtn: string

  // Service selector cards
  fromPrice: string
  perPageSuffix: string
  colorBadge: string
  duplexBadge: string
}

export const translations: Record<Language, TranslationDictionary> = {
  en: {
    shopCounterOpen: 'Counter Open & Live',
    shopCounterClosed: 'Counter Currently Paused',
    desktopAgentOnline: 'Printer Workstation Online',
    desktopAgentOffline: 'Workstation Offline',
    selectLanguage: 'Language',
    shopOfflineTitle: 'Shop is Currently Not Accepting Orders',
    shopOfflineMessage: 'The shop counter is currently offline or paused. Please check back shortly or speak directly with the storekeeper.',

    howItWorksTitle: 'Instant Self-Service Printing in 3 Simple Steps',
    stepUpload: '1. Upload Files',
    stepUploadDesc: 'Select PDF, DOCX, or images directly from your mobile or laptop',
    stepCustomize: '2. Choose Options',
    stepCustomizeDesc: 'Color or B&W, duplex double-sided, number of copies',
    stepPay: '3. Pay & Print',
    stepPayDesc: 'Pay via UPI, Card, or Cash at the counter — printing starts automatically',

    selectService: 'Select Print Service',
    selectServiceDesc: 'Choose what kind of document or card you would like to print',
    choosePrintService: 'Choose Print Service',
    allServicesAndRates: 'All Services & Rates',
    standardPrint: 'Standard Document (A4)',
    idCardService: 'Smart ID Card & Lamination',
    legalStampService: 'Legal / Stamp Paper Print',
    customService: 'Custom Print Service',
    perPage: 'per page',
    flatFee: 'flat rate',

    dropzoneTitle: 'Drag & Drop your files here',
    dropzoneSubtitle: 'or click to browse from your device',
    browseFiles: 'Browse Files',
    supportedFormats: 'Supports PDF, Word (DOC/DOCX), JPG, PNG',
    batchMode: 'Batch Document Mode',
    batchCount: 'files uploaded',
    addMoreFiles: '+ Add More Files',
    clearAll: 'Clear All',
    openIdStudio: 'Open Smart ID Card Studio (2-Side A4)',
    openStampStudio: 'Open Legal Stamp Margins Studio',

    printOptionsTitle: 'Print Settings & Preferences',
    colorMode: 'Color Mode',
    blackAndWhite: 'Black & White (Monochrome)',
    fullColor: 'Full Color (High Quality)',
    sideOptions: 'Sides',
    singleSided: 'Single Sided',
    doubleSided: 'Both Sides (Duplex)',
    numberOfCopies: 'Number of Copies',
    pageSelection: 'Page Range',
    allPages: 'All Pages',
    customPages: 'Custom Pages',
    customPagesPlaceholder: 'e.g. 1-5, 8, 11-13',
    calculatedPages: 'Calculated Pages',

    estimatedTotal: 'Estimated Total',
    ratePerUnit: 'Rate',
    proceedToPay: 'Proceed to Print & Pay',
    processing: 'Processing Order…',

    choosePaymentMethod: 'Select Payment Method',
    choosePaymentDesc: 'Select how you would like to pay for your print job',
    payAtCounter: 'Pay at Counter (Cash)',
    payAtCounterDesc: 'Pay cash to the storekeeper when collecting your prints',
    upiDeeplink: 'UPI Instant Pay (QR / App)',
    upiDeeplinkDesc: 'Pay directly via GPay, PhonePe, Paytm, or BHIM',
    onlineGateway: 'Online Payment Gateway',
    onlineGatewayDesc: 'Pay using Credit/Debit Card, Netbanking, or Wallets',
    cancel: 'Cancel',

    orderConfirmed: 'Print Job Sent to Queue!',
    orderConfirmedDesc: 'Your file has been sent to the shop printer workstation.',
    jobToken: 'Order Job Token',
    statusQueued: 'Status: Queued for Printing',
    printAnother: 'Print Another Document',

    // Detailed options & controls
    totalMultiplier: 'Total set multiplier',
    colorPrintTitle: 'Color Print',
    duplexTitle: 'Double-Sided (Duplex)',
    duplexDesc: 'Prints on both sides of each sheet',

    // Page selection options
    pagesToPrint: 'Pages to print',
    oddPages: 'Odd pages',
    evenPages: 'Even pages',
    specificPages: 'Specific pages',
    pageRangeHelp: 'Use individual pages or ranges, separated by commas.',

    // Dropzone options
    tapToUploadDoc: 'Tap to Upload Document',
    tapToUploadDocNum: 'Tap to Upload Document',
    dropDocHere: 'Drop your document here',
    dragAndDropLimits: 'Drag & drop or tap here • PDF & Images (Max 40 MB)',
    addAnotherLimit: 'Add another PDF or Image • Max 40 MB',
    replaceFile: 'Replace',
    countingPagesText: 'Counting pages...',
    uploadingDocText: 'Uploading Document...',

    // PriceBar & Bottom checkout
    estimateBadge: 'Estimate',
    shopPausedBadge: 'Shop Paused',
    shopOffline: 'Shop Offline',
    analyzing: 'Analyzing…',
    readingPagesBadge: 'Reading Pages…',
    uploadFileBtn: 'Upload File',
    payBtn: 'Pay',
    sendingBtn: 'Sending…',
    docsMerged: 'Documents',
    pagesWord: 'Pages',
    pageWord: 'Page',
    copiesWord: 'copies',

    // Batch queue
    docsToPrint: 'Your Documents to Print',
    combinedBill: '1 Combined Bill',
    tapDocToAdjust: 'Tap any document to adjust copies or color options',
    mergedTotal: 'Merged Total',
    addAnotherDocBtn: '+ Add Another Document (Pay All Together)',

    // Service selector cards
    fromPrice: 'From',
    perPageSuffix: '/page',
    colorBadge: 'Color',
    duplexBadge: 'Duplex',
  },

  bn: {
    shopCounterOpen: 'দোকান খোলা ও সক্রিয়',
    shopCounterClosed: 'কাউন্টার সাময়িকভাবে বন্ধ',
    desktopAgentOnline: 'প্রিন্টার ওয়ার্কস্টেশন অনলাইন',
    desktopAgentOffline: 'ওয়ার্কস্টেশন অফলাইন',
    selectLanguage: 'ভাষা',
    shopOfflineTitle: 'দোকানটি বর্তমানে নতুন অর্ডার গ্রহণ করছে না',
    shopOfflineMessage: 'কাউন্টারটি বর্তমানে সাময়িকভাবে বন্ধ রয়েছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন অথবা দোকানদারের সাথে যোগাযোগ করুন।',

    howItWorksTitle: 'সহজ ৩ ধাপে তাৎক্ষণিক সেলফ-সার্ভিস প্রিন্ট',
    stepUpload: '১. ফাইল আপলোড করুন',
    stepUploadDesc: 'মোবাইল বা ল্যাপটপ থেকে সরাসরি PDF, DOCX বা ছবি নির্বাচন করুন',
    stepCustomize: '২. প্রিন্ট বিকল্প বেছে নিন',
    stepCustomizeDesc: 'রঙিন বা সাদা-কালো, উভয় পিঠ প্রিন্ট, কপির সংখ্যা নির্বাচন করুন',
    stepPay: '৩. পেমেন্ট ও প্রিন্ট',
    stepPayDesc: 'UPI, কার্ড বা কাউন্টারে নগদ টাকা দিয়ে পরিশোধ করুন — প্রিন্ট শুরু হবে',

    selectService: 'প্রিন্ট সেবা নির্বাচন করুন',
    selectServiceDesc: 'আপনি কী ধরনের নথি বা কার্ড প্রিন্ট করতে চান তা বেছে নিন',
    choosePrintService: 'প্রিন্ট সেবা নির্বাচন করুন',
    allServicesAndRates: 'সকল সেবা ও রেট তালিকা',
    standardPrint: 'সাধারণ ডকুমেন্ট প্রিন্ট (A4)',
    idCardService: 'স্মার্ট আইডি কার্ড ও লেমিনেশন',
    legalStampService: 'আইনি / স্ট্যাম্প পেপার প্রিন্ট',
    customService: 'অন্যান্য প্রিন্ট সেবা',
    perPage: 'প্রতি পৃষ্ঠা',
    flatFee: 'নির্দিষ্ট ফি',

    dropzoneTitle: 'আপনার ফাইল এখানে ড্র্যাগ ও ড্রপ করুন',
    dropzoneSubtitle: 'অথবা ফাইল বেছে নিতে ক্লিক করুন',
    browseFiles: 'ফাইল ব্রাউজ করুন',
    supportedFormats: 'PDF, Word (DOC/DOCX), JPG, PNG সমর্থিত',
    batchMode: 'একাধিক নথি মোড',
    batchCount: 'টি ফাইল যুক্ত হয়েছে',
    addMoreFiles: '+ আরও ফাইল যোগ করুন',
    clearAll: 'সব মুছে ফেলুন',
    openIdStudio: 'স্মার্ট আইডি কার্ড স্টুডিও খুলুন (২-সাইড A4)',
    openStampStudio: 'স্ট্যাম্প পেপার মার্জিন স্টুডিও খুলুন',

    printOptionsTitle: 'প্রিন্ট সেটিংস ও পছন্দসমূহ',
    colorMode: 'রঙের মোড',
    blackAndWhite: 'সাদা-কালো (Black & White)',
    fullColor: 'সম্পূর্ণ রঙিন (Color)',
    sideOptions: 'পৃষ্ঠার পিঠ',
    singleSided: 'এক পিঠ (Single Sided)',
    doubleSided: 'উভয় পিঠ (Duplex Print)',
    numberOfCopies: 'কপির সংখ্যা',
    pageSelection: 'পৃষ্ঠার পরিসীমা',
    allPages: 'সকল পৃষ্ঠা',
    customPages: 'নির্দিষ্ট পৃষ্ঠা',
    customPagesPlaceholder: 'যেমন: ১-৫, ৮, ১১-১৩',
    calculatedPages: 'মোট গণনাকৃত পৃষ্ঠা',

    estimatedTotal: 'আনুমানিক মোট মূল্য',
    ratePerUnit: 'দর',
    proceedToPay: 'পেমেন্ট করুন ও প্রিন্ট শুরু করুন',
    processing: 'অর্ডার প্রস্তুত করা হচ্ছে…',

    choosePaymentMethod: 'পেমেন্টের মাধ্যম নির্বাচন করুন',
    choosePaymentDesc: 'আপনার প্রিন্ট অর্ডারের জন্য কীভাবে পরিশোধ করতে চান তা বেছে নিন',
    payAtCounter: 'কাউন্টারে নগদ প্রদান (Cash)',
    payAtCounterDesc: 'প্রিন্ট নেওয়ার সময় দোকানে সরাসরি নগদ টাকা প্রদান করুন',
    upiDeeplink: 'UPI তাৎক্ষণিক পেমেন্ট (QR / অ্যাপ)',
    upiDeeplinkDesc: 'GPay, PhonePe, Paytm বা BHIM-এর মাধ্যমে সরাসরি পরিশোধ করুন',
    onlineGateway: 'অনলাইন পেমেন্ট গেটওয়ে',
    onlineGatewayDesc: 'ডেবিট/ক্রেডিট কার্ড, নেটব্যাঙ্কিং বা ওয়ালেট ব্যবহার করুন',
    cancel: 'বাতিল',

    orderConfirmed: 'প্রিন্ট অর্ডার কিউ-তে যুক্ত হয়েছে!',
    orderConfirmedDesc: 'আপনার ফাইলটি দোকানের প্রিন্টার সিস্টেমে সফলভাবে পাঠানো হয়েছে।',
    jobToken: 'অর্ডার টোকেন নম্বর',
    statusQueued: 'অবস্থা: প্রিন্টিং অপেক্ষায় রয়েছে',
    printAnother: 'আরেকটি নথি প্রিন্ট করুন',

    // Detailed options & controls
    totalMultiplier: 'মোট কপির গুণক',
    colorPrintTitle: 'রঙিন প্রিন্ট (Color Print)',
    duplexTitle: 'উভয় পিঠ প্রিন্ট (Duplex)',
    duplexDesc: 'কাগজের উভয় পিঠে প্রিন্ট করা হবে',

    // Page selection options
    pagesToPrint: 'যে পৃষ্ঠাগুলি প্রিন্ট করবেন',
    oddPages: 'বিজোড় পৃষ্ঠা (Odd Pages)',
    evenPages: 'জোড় পৃষ্ঠা (Even Pages)',
    specificPages: 'নির্দিষ্ট পৃষ্ঠা',
    pageRangeHelp: 'কমা দিয়ে নির্দিষ্ট পৃষ্ঠা বা রেঞ্জ লিখুন (যেমন: ১-৩, ৫, ৮-১০)',

    // Dropzone options
    tapToUploadDoc: 'ডকুমেন্ট আপলোড করতে ক্লিক করুন',
    tapToUploadDocNum: 'ডকুমেন্ট আপলোড করতে ক্লিক করুন',
    dropDocHere: 'আপনার ডকুমেন্ট এখানে ড্রপ করুন',
    dragAndDropLimits: 'ড্র্যাগ ও ড্রপ অথবা ক্লিক করুন • PDF ও ছবি (সর্বোচ্চ ৪০ MB)',
    addAnotherLimit: 'আরেকটি PDF বা ছবি যোগ করুন • সর্বোচ্চ ৪০ MB',
    replaceFile: 'বদল করুন',
    countingPagesText: 'পৃষ্ঠা গণনা করা হচ্ছে...',
    uploadingDocText: 'ডকুমেন্ট আপলোড হচ্ছে...',

    // PriceBar & Bottom checkout
    estimateBadge: 'আনুমানিক',
    shopPausedBadge: 'দোকান সাময়িক বন্ধ',
    shopOffline: 'দোকান অফলাইন',
    analyzing: 'যাচাই হচ্ছে…',
    readingPagesBadge: 'পৃষ্ঠা যাচাই হচ্ছে…',
    uploadFileBtn: 'ফাইল আপলোড করুন',
    payBtn: 'পরিশোধ করুন',
    sendingBtn: 'পাঠানো হচ্ছে…',
    docsMerged: 'টি ফাইল',
    pagesWord: 'পৃষ্ঠা',
    pageWord: 'পৃষ্ঠা',
    copiesWord: 'কপি',

    // Batch queue
    docsToPrint: 'আপনার প্রিন্ট করার ফাইলসমূহ',
    combinedBill: '১টি সম্মিলিত বিল',
    tapDocToAdjust: 'কপি সংখ্যা বা কালার পরিবর্তন করতে নথিতে ক্লিক করুন',
    mergedTotal: 'সর্বমোট মূল্য',
    addAnotherDocBtn: '+ আরেকটি ফাইল যোগ করুন (একসাথে পেমেন্ট)',

    // Service selector cards
    fromPrice: 'শুরু',
    perPageSuffix: '/পৃষ্ঠা',
    colorBadge: 'রঙিন',
    duplexBadge: 'উভয় পিঠ',
  },

  hi: {
    shopCounterOpen: 'दुकान चालू और सक्रिय है',
    shopCounterClosed: 'काउंटर अभी अस्थायी रूप से बंद है',
    desktopAgentOnline: 'प्रिंटर वर्कस्टेशन ऑनलाइन',
    desktopAgentOffline: 'वर्कस्टेशन ऑफलाइन',
    selectLanguage: 'भाषा',
    shopOfflineTitle: 'दुकान फिलहाल नए प्रिंट ऑर्डर स्वीकार नहीं कर रही है',
    shopOfflineMessage: 'दुकान काउंटर वर्तमान में ऑफलाइन है। कृपया कुछ समय बाद पुनः प्रयास करें या सीधे दुकानदार से संपर्क करें।',

    howItWorksTitle: 'आसान 3 चरणों में त्वरित सेल्फ-सर्विस प्रिंटिंग',
    stepUpload: '1. फाइल अपलोड करें',
    stepUploadDesc: 'मोबाइल या लैपटॉप से सीधे PDF, DOCX या फोटो चुनें',
    stepCustomize: '2. प्रिंट विकल्प चुनें',
    stepCustomizeDesc: 'रंगीन या ब्लैक एंड व्हाइट, दोनों तरफ प्रिंट, प्रतियों की संख्या',
    stepPay: '3. भुगतान और प्रिंट',
    stepPayDesc: 'UPI, कार्ड या काउंटर पर नकद भुगतान करें — प्रिंट तुरंत शुरू होगा',

    selectService: 'प्रिंट सेवा का चयन करें',
    selectServiceDesc: 'चुनें कि आप किस प्रकार का दस्तावेज़ या कार्ड प्रिंट करना चाहते हैं',
    choosePrintService: 'प्रिंट सेवा चुनें',
    allServicesAndRates: 'सभी सेवाएं और दर सूची',
    standardPrint: 'सामान्य दस्तावेज़ प्रिंट (A4)',
    idCardService: 'स्मार्ट आईडी कार्ड और लेमिनेशन',
    legalStampService: 'लीगल / स्टाम्प पेपर प्रिंट',
    customService: 'अन्य प्रिंट सेवा',
    perPage: 'प्रति पृष्ठ',
    flatFee: 'निश्चित शुल्क',

    dropzoneTitle: 'अपनी फाइलें यहाँ ड्रैग और ड्रॉप करें',
    dropzoneSubtitle: 'या अपने डिवाइस से फाइल चुनने के लिए क्लिक करें',
    browseFiles: 'फाइलें चुनें',
    supportedFormats: 'PDF, Word (DOC/DOCX), JPG, PNG समर्थित हैं',
    batchMode: 'मल्टीपल दस्तावेज़ मोड',
    batchCount: 'फाइलें जोड़ी गईं',
    addMoreFiles: '+ और फाइलें जोड़ें',
    clearAll: 'सभी हटाएं',
    openIdStudio: 'स्मार्ट आईडी कार्ड स्टूडियो खोलें (2-साइड A4)',
    openStampStudio: 'स्टाम्प पेपर मार्जिन स्टूडियो खोलें',

    printOptionsTitle: 'प्रिंट सेटिंग्स और प्राथमिकताएं',
    colorMode: 'कलर मोड',
    blackAndWhite: 'ब्लैक एंड व्हाइट (Monochrome)',
    fullColor: 'फुल कलर (Color Print)',
    sideOptions: 'प्रिंट साइड',
    singleSided: 'एक तरफ (Single Sided)',
    doubleSided: 'दोनों तरफ (Duplex Print)',
    numberOfCopies: 'प्रतियों की संख्या (Copies)',
    pageSelection: 'पेज रेंज',
    allPages: 'सभी पेज',
    customPages: 'कस्टम पेज',
    customPagesPlaceholder: 'उदा. 1-5, 8, 11-13',
    calculatedPages: 'कुल गिने गए पृष्ठ',

    estimatedTotal: 'अनुमानित कुल राशि',
    ratePerUnit: 'दर',
    proceedToPay: 'भुगतान करें और प्रिंट लें',
    processing: 'ऑर्डर प्रोसेस हो रहा है…',

    choosePaymentMethod: 'भुगतान का तरीका चुनें',
    choosePaymentDesc: 'चुनें कि आप अपने प्रिंट के लिए कैसे भुगतान करना चाहते हैं',
    payAtCounter: 'काउंटर पर नकद भुगतान (Cash)',
    payAtCounterDesc: 'प्रिंट लेते समय काउंटर पर सीधे नकद भुगतान करें',
    upiDeeplink: 'UPI त्वरित भुगतान (QR / App)',
    upiDeeplinkDesc: 'GPay, PhonePe, Paytm या BHIM से तुरंत भुगतान करें',
    onlineGateway: 'ऑनलाइन पेमेंट गेटवे',
    onlineGatewayDesc: 'डेबिट/क्रेडिट कार्ड, नेटबैंकिंग या वॉलेट से भुगतान करें',
    cancel: 'रद्द करें',

    orderConfirmed: 'प्रिंट ऑर्डर सफलतापूर्वक भेजा गया!',
    orderConfirmedDesc: 'आपकी फाइल दुकान के प्रिंटर सिस्टम में भेज दी गई है।',
    jobToken: 'ऑर्डर टोकन नंबर',
    statusQueued: 'स्थिति: प्रिंटिंग कतार में है',
    printAnother: 'एक और दस्तावेज़ प्रिंट करें',

    // Detailed options & controls
    totalMultiplier: 'कुल प्रतियों का गुणक',
    colorPrintTitle: 'कलर प्रिंट (Color Print)',
    duplexTitle: 'दोनों तरफ प्रिंट (Duplex)',
    duplexDesc: 'कागज के दोनों तरफ प्रिंट होगा',

    // Page selection options
    pagesToPrint: 'प्रिंट करने के लिए पृष्ठ',
    oddPages: 'विषम पृष्ठ (Odd Pages)',
    evenPages: 'सम पृष्ठ (Even Pages)',
    specificPages: 'विशिष्ट पृष्ठ',
    pageRangeHelp: 'अल्पविराम से अलग किए गए विशिष्ट पृष्ठ या श्रेणी दर्ज करें (उदा. 1-3, 5, 8-10)',

    // Dropzone options
    tapToUploadDoc: 'दस्तावेज़ अपलोड करने के लिए टैप करें',
    tapToUploadDocNum: 'दस्तावेज़ अपलोड करने के लिए टैप करें',
    dropDocHere: 'अपना दस्तावेज़ यहाँ छोड़ें',
    dragAndDropLimits: 'ड्रैग और ड्रॉप करें या क्लिक करें • PDF और फोटो (अधिकतम 40 MB)',
    addAnotherLimit: 'अन्य PDF या फोटो जोड़ें • अधिकतम 40 MB',
    replaceFile: 'बदलें',
    countingPagesText: 'पृष्ठ गिने जा रहे हैं...',
    uploadingDocText: 'दस्तावेज़ अपलोड हो रहा है...',

    // PriceBar & Bottom checkout
    estimateBadge: 'अनुमानित',
    shopPausedBadge: 'दुकान रोकी गई है',
    shopOffline: 'दुकान ऑफलाइन',
    analyzing: 'जाँच जारी है…',
    readingPagesBadge: 'पेज गिने जा रहे हैं…',
    uploadFileBtn: 'फाइल अपलोड करें',
    payBtn: 'भुगतान करें',
    sendingBtn: 'भेजा जा रहा है…',
    docsMerged: 'दस्तावेज़',
    pagesWord: 'पृष्ठ',
    pageWord: 'पृष्ठ',
    copiesWord: 'प्रतियां',

    // Batch queue
    docsToPrint: 'आपके प्रिंट किए जाने वाले दस्तावेज़',
    combinedBill: '1 संयुक्त बिल',
    tapDocToAdjust: 'प्रतियों की संख्या या रंग बदलने के लिए दस्तावेज़ पर टैप करें',
    mergedTotal: 'कुल योग',
    addAnotherDocBtn: '+ एक और दस्तावेज़ जोड़ें (एक साथ भुगतान)',

    // Service selector cards
    fromPrice: 'प्रारंभिक',
    perPageSuffix: '/पेज',
    colorBadge: 'रंगीन',
    duplexBadge: 'दोनों तरफ',
  },
}
