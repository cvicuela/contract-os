const en = {
  // Common
  brand: 'ContractOS',
  poweredBy: 'Powered by Claude AI',
  loading: 'Loading...',
  error: 'Error',
  close: 'Close',
  save: 'Save',
  cancel: 'Cancel',
  delete: 'Delete',
  view: 'View',
  back: 'Back',
  search: 'Search',
  download: 'Download',
  print: 'Print',
  noResults: 'No results',
  showingXofY: 'Showing {x} of {y}',

  // Navigation
  nav: {
    overview: 'Overview',
    management: 'Management',
    dashboard: 'Dashboard',
    contracts: 'Contracts',
    alerts: 'Alerts',
    calendar: 'Calendar',
    newContract: 'New Contract',
    closeMenu: 'Close menu',
    openMenu: 'Open menu',
  },

  // Dashboard
  dashboard: {
    title: 'Dashboard',
    greeting: {
      morning: 'Good morning',
      afternoon: 'Good afternoon',
      evening: 'Good evening',
    },
    subtitle: 'overview of your contract portfolio',
    totalContracts: 'Total Contracts',
    activeContracts: 'Active Contracts',
    expiringSoon: 'Expiring Soon',
    highRisk: 'High Risk',
    pendingAlerts: 'Pending Alerts',
    overdueObligations: 'Overdue Obligations',
    runChecks: 'Run Checks',
    running: 'Running...',
    checksComplete: 'Checks complete: {alerts} new alert(s) created, {obligations} obligation(s) marked overdue.',
    checksFailed: 'Checks failed. Please try again.',
    recentContracts: 'Recent Contracts',
    viewAll: 'View all',
    noContracts: 'No contracts yet',
    activeAlerts: 'Active Alerts',
    noActiveAlerts: 'No active alerts',
    dismiss: 'Dismiss',
    failedToLoad: 'Failed to load dashboard',
  },

  // Charts
  charts: {
    contractsByStatus: 'Contracts by Status',
    riskDistribution: 'Risk Distribution',
    contractsByType: 'Contracts by Type',
    expiryTimeline: 'Expiring Contracts (Next 12 Months)',
    totalValue: 'Total Contract Value (Top 10)',
    pricePerUnit: 'Price per {unit} (Top 10)',
    uploadToSee: 'Upload contracts to see analytics',
    contracts: 'contract(s)',
  },

  // Contract Timeline Chart
  contractTimeline: {
    title: 'Contract Timeline',
    value: 'Cumulative Value',
    priceUnit: 'Price/Unit',
    renewals: 'Price by Renewal',
    renewal: 'Renewal',
    escalation: 'Annual escalation',
    obligationDue: 'Obligation due',
    today: 'Today',
  },

  // Table headers
  table: {
    name: 'Name',
    type: 'Type',
    parties: 'Parties',
    partyA: 'Party A',
    partyB: 'Party B',
    startDate: 'Start Date',
    endDate: 'End Date',
    duration: 'Duration',
    risk: 'Risk',
    riskScore: 'Risk Score',
    status: 'Status',
    daysLeft: 'Days Left',
    actions: 'Actions',
    createdAt: 'Created At',
    description: 'Description',
    frequency: 'Frequency',
    nextDue: 'Next Due',
    riskLevel: 'Risk Level',
    daysOverdue: 'Days Overdue',
    aiSummary: 'AI Summary',
  },

  // Statuses
  status: {
    active: 'Active',
    expired: 'Expired',
    expiring: 'Expiring',
    pending: 'Pending',
    cancelled: 'Cancelled',
    draft: 'Draft',
    completed: 'Completed',
    overdue: 'Overdue',
  },

  // Risk
  risk: {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    critical: 'Critical',
  },

  // Severity
  severity: {
    info: 'Info',
    warning: 'Warning',
    critical: 'Critical',
  },

  // Days
  days: {
    left: '{n}d',
    ago: '{n}d ago',
    leftFull: '{n}d left',
    overdue: '{n}d overdue',
    expiresToday: 'Expires today',
  },

  // Contracts page
  contractsPage: {
    title: 'Contracts',
    subtitle: 'Manage and analyze your contracts',
    uploadContract: 'Upload Contract',
    searchPlaceholder: 'Search contracts...',
    filterAll: 'All',
    filterActive: 'Active',
    filterExpiring: 'Expiring',
    filterHighRisk: 'High Risk',
    filterExpired: 'Expired',
    noMatch: 'No contracts match your search',
    noContracts: 'No contracts yet — upload one to get started',
    showingContracts: 'Showing {x} of {y} contracts',
  },

  // Upload
  upload: {
    title: 'Upload Contract',
    contractName: 'Contract Name',
    pasteText: 'Paste Text',
    uploadFile: 'Upload File',
    contractText: 'Contract Text',
    pastePlaceholder: 'Paste the full contract text here...',
    dropFile: 'Drop a file here, or browse',
    fileTypes: 'PDF, DOC, DOCX, TXT',
    analyzing: 'Claude is analyzing...',
    analyzeButton: 'Analyze with Claude AI',
    enterName: 'Please enter a contract name.',
    enterText: 'Please paste contract text.',
    selectFile: 'Please select a file.',
    success: 'Contract Analyzed Successfully',
    viewContract: 'View Contract',
    uploadAnother: 'Upload Another',
    failed: 'Upload failed',
  },

  // Contract detail
  contractDetail: {
    backToContracts: 'Back to Contracts',
    addToCalendar: 'Add to Calendar',
    addExpiryToCalendar: 'Add expiry to Google Calendar',
    contractDetails: 'Contract Details',
    renewalType: 'Renewal Type',
    noticeDays: 'Notice Days',
    daysNotice: '{n} days',
    added: 'Added {date}',
    riskLabel: 'Risk: {score}/10 — {level}',
    aiSummary: 'AI Summary',
    improvementTitle: 'How to improve this contract to 10/10',
    improvement: 'Improvement {n}',
    obligations: 'Contract Obligations',
    noObligations: 'No obligations yet',
    markComplete: 'Mark Complete',
    alertsOnContract: 'Alerts on this contract',
    noAlerts: 'No alerts',
    confirmDelete: 'Are you sure you want to delete this contract? This cannot be undone.',
    notFound: 'Contract not found',
    failedToLoad: 'Failed to load contract',
  },

  // Alerts page
  alertsPage: {
    title: 'Alerts',
    subtitle: 'Monitor contract deadlines and risks',
    filterAll: 'All',
    filterUnread: 'Unread',
    filterCritical: 'Critical',
    filterWarning: 'Warning',
    filterSnoozed: 'Snoozed',
    new: 'New',
    snoozedUntil: 'Snoozed until {date}',
    contract: 'Contract: {name}',
    triggers: 'Triggers: {date}',
    deadline: 'Deadline: {date}',
    markRead: 'Mark Read',
    dismiss: 'Dismiss',
    noAlerts: 'No alerts',
    noSnoozed: 'No snoozed alerts',
    allCaughtUp: 'All caught up — no active alerts',
    nothingSnoozed: 'Nothing is snoozed right now',
    noFiltered: 'No {filter} alerts',
    failedToLoad: 'Failed to load alerts',
  },

  // Calendar
  calendarPage: {
    title: 'Calendar',
    subtitle: 'Contract deadlines, obligations & alerts at a glance',
    expiry: 'Expiry',
    noticeDeadline: 'Notice Deadline',
    obligation: 'Obligation',
    alert: 'Alert',
    noEvents: 'No events',
    eventsThisMonth: '{month} — {count} event(s)',
    noEventsThisMonth: 'No events this month',
    addToGoogleCalendar: 'Add to Google Calendar',
    viewContract: 'View contract',
    loadingEvents: 'Loading events...',
    weekDays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    weekDaysShort: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
    months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  },

  // Snooze
  snooze: {
    snooze: 'Snooze',
    snoozeUntil: 'Snooze until',
    deadline: 'Deadline: {date}',
    snoozedUntil: 'Snoozed until {date}',
    tomorrow: 'Tomorrow',
    in3Days: 'In 3 days',
    in1Week: 'In 1 week',
    in2Weeks: 'In 2 weeks',
    dayBeforeDeadline: 'Day before deadline ({date})',
  },

  // User menu
  userMenu: {
    demoMode: 'Demo Mode',
    signUpFree: 'Sign up free',
    unknownUser: 'Unknown user',
    freeTrial: 'Free Trial',
    upgradePlan: 'Upgrade plan',
    signOut: 'Sign out',
    openMenu: 'Open user menu',
    settings: 'AI Settings',
  },

  // Settings
  settings: {
    title: 'Settings',
    subtitle: 'Manage your AI configuration and preferences',
    aiConfig: 'AI Configuration',
    aiProvider: 'AI Provider',
    apiKey: 'API Key',
    apiKeyPlaceholder: 'Paste your API key here',
    saveKey: 'Save Key',
    deleteKey: 'Remove',
    noKeyConfigured: 'No AI key configured',
    keyConfigured: 'Key configured',
    keyHint: 'Key ending in {hint}',
    encryptionNote: 'Your key is stored encrypted and never visible after saving.',
    providerAnthropic: 'Anthropic Claude',
    providerOpenAI: 'OpenAI GPT',
    providerGemini: 'Google Gemini',
    keySaved: 'API key saved successfully',
    keyDeleted: 'API key removed',
    keyError: 'Failed to save API key',
    getKeyHelp: 'Get your API key',
    basicAnalysisNote: 'Contracts will be uploaded with basic analysis only. Add a key for full AI analysis.',
    configureKeyPrompt: 'Configure your AI key in Settings for full AI-powered analysis.',
  },

  // Modals
  modals: {
    allContracts: {
      title: 'All Contracts',
      total: 'Total: {n} contracts',
      downloadCSV: 'Download CSV',
      sortHint: 'Click headers to sort',
      noContracts: 'No contracts found',
      failedToLoad: 'Failed to load contracts',
    },
    expiring: {
      title: 'Expiring Soon',
      subtitle: 'Contracts expiring within 90 days',
      downloadCSV: 'Download CSV',
      noExpiring: 'No expiring contracts',
      failedToLoad: 'Failed to load contracts',
    },
    highRisk: {
      title: 'High Risk Contracts',
      subtitle: 'Contracts with a risk score of 7 or higher',
      downloadCSV: 'Download CSV',
      noHighRisk: 'No high-risk contracts',
      failedToLoad: 'Failed to load contracts',
    },
    alerts: {
      title: 'All Alerts',
      total: 'Total: {n} pending alerts',
      markRead: 'Mark Read',
      dismiss: 'Dismiss',
      noAlerts: 'No pending alerts',
      failedToLoad: 'Failed to load alerts',
    },
    obligations: {
      title: 'Overdue Obligations',
      subtitle: 'Mark obligations as completed',
      markComplete: 'Mark Complete',
      noOverdue: 'No overdue obligations',
      failedToLoad: 'Failed to load overdue obligations',
    },
  },

  // Login page
  login: {
    liveDemo: 'Live Demo',
    signIn: 'Sign In',
    heroTagline: 'Powered by Claude AI for accurate contract intelligence',
    heroTitle: 'Your contracts, finally under control',
    heroDescription: 'Upload any contract and get a full AI analysis — risk score, obligations, and an action plan — in under 30 seconds.',
    startFreeTrial: 'Start Free Trial',
    tryLiveDemo: 'Try Live Demo',
    loadingDemo: 'Loading demo...',
    trialNote: 'Free trial \u00b7 No credit card required \u00b7 1 contract included',
    featuresTitle: 'Everything you need to manage contracts',
    featuresSubtitle: 'From upload to insight in under 30 seconds.',
    features: {
      aiAnalysis: { title: 'AI Contract Analysis', desc: 'Claude AI reads your contract, extracts key terms, identifies parties, and summarizes everything in seconds.' },
      riskScoring: { title: 'Risk Scoring', desc: 'Every contract gets a risk score from 1 to 10, with specific factors that drive the rating.' },
      report: { title: '10/10 Report', desc: 'Get specific, actionable tips to improve any contract to a perfect score.' },
      obligationAlerts: { title: 'Obligation Alerts', desc: 'Never miss a deadline — automatic tracking of obligations, renewals, and notice periods.' },
      calendarSync: { title: 'Calendar Sync', desc: 'One-click Google Calendar integration for every contract deadline.' },
      printReports: { title: 'Print-Ready Reports', desc: 'Generate professional PDF reports for any contract — formatted for lawyers, executives, or audit reviews.' },
    },
    billingMonthly: 'Monthly',
    billingAnnual: 'Annual',
    billingSave: 'Save 20%',
    twoMonthsFree: '2 months free',
    pricingTitle: 'Simple, transparent pricing',
    pricingSubtitle: 'Start free. Upgrade when you\'re ready.',
    plans: {
      trial: { name: 'Free Trial', price: '$0', period: '30 days', contracts: '1 contract', cta: 'Start Free Trial', annualPrice: '$0', annualPeriod: '30 days' },
      starter: { name: 'Starter', price: '$29', period: 'per month', contracts: '10 contracts', cta: 'Subscribe — $29/mo', annualPrice: '$23', annualPeriod: 'per month, billed annually' },
      professional: { name: 'Professional', price: '$79', period: 'per month', contracts: '25 contracts', cta: 'Go Professional', annualPrice: '$63', annualPeriod: 'per month, billed annually' },
    },
    mostPopular: 'Most Popular',
    billingNote: 'Billed via PayPal — cancel anytime',
    enterprise: {
      title: 'Enterprise',
      description: 'Custom contracts, SSO, SLA, API access, and a dedicated account manager.',
      contact: 'Contact Sales',
    },
    footer: {
      copyright: 'ContractOS \u00a9 2026 \u00b7 Contract Intelligence Platform',
      contact: 'Contact',
      terms: 'Terms',
      privacy: 'Privacy',
    },
  },
}

type DeepStringify<T> = {
  [K in keyof T]: T[K] extends string
    ? string
    : T[K] extends readonly string[]
      ? string[]
      : T[K] extends object
        ? DeepStringify<T[K]>
        : T[K]
}

export type Translations = DeepStringify<typeof en>
export default en as Translations
