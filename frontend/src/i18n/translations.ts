// Lumina — i18n translation strings.
// Keep keys short + hierarchical. Every English string has a French equivalent.
// Placeholders use {name} syntax and are interpolated by t() in i18n/index.tsx.

export const SUPPORTED_LANGS = ["en", "fr"] as const;
export type Lang = (typeof SUPPORTED_LANGS)[number];

export const LANG_NAMES: Record<Lang, string> = {
  en: "English",
  fr: "Français",
};

export const LANG_FLAGS: Record<Lang, string> = {
  en: "🇬🇧",
  fr: "🇫🇷",
};

// LLM output language names (sent to Claude in the system prompt).
export const LLM_LANG_NAME: Record<Lang, string> = {
  en: "English",
  fr: "French (français)",
};

export type Translations = {
  auth: {
    brand: string;
    loginTitle: string;
    loginSubtitle: string;
    registerTitle: string;
    registerSubtitle: string;
    email: string;
    username: string;
    usernameHint: string;
    password: string;
    passwordHint: string;
    enter: string;
    entering: string;
    create: string;
    creating: string;
    or: string;
    google: string;
    connecting: string;
    noAccount: string;
    makeOne: string;
    haveAccount: string;
    signIn: string;
    errPasswordLen: string;
    errUsernameLen: string;
    errLoginGeneric: string;
    errRegisterGeneric: string;
    errGoogleGeneric: string;
  };
  onboarding: {
    step: string; // "STEP {n} / {total}"
    dateTitle: string;
    dateSubtitle: string;
    datePlaceholder: string;
    hourTitle: string;
    hourSubtitle: string;
    hourPlaceholder: string;
    whereTitle: string;
    whereSubtitle: string;
    selectCity: string;
    back: string;
    next: string;
    calculate: string;
    citySearchTitle: string;
    citySearchPlaceholder: string;
    close: string;
    errSaveGeneric: string;
  };
  home: {
    hi: string; // "Hi, {name}."
    todaysHoroscope: string;
    dailyPull: string;
    reversedSuffix: string; // " · Reversed"
    drawAnother: string;
    errLoad: string;
  };
  tarot: {
    label: string;
    title: string;
    subtitle: string;
    questionLabel: string;
    questionPlaceholder: string;
    draw: string;
    drawing: string;
    close: string;
    freeNote: string;
    errDraw: string;
  };
  friends: {
    label: string;
    title: string;
    add: string;
    adding: string;
    addFriendTitle: string;
    addFriendHint: string;
    usernamePlaceholder: string;
    empty: string;
    tapToCompute: string;
    compatibility: string; // "Compatibility: {n}%"
    view: string;
    run: string;
    close: string;
    compatLabel: string;
    youAnd: string; // "You & @{name}"
  };
  journal: {
    label: string;
    title: string;
    empty: string;
    daily: string;
    manual: string;
  };
  profile: {
    label: string;
    goPremium: string;
    premiumBadge: string;
    birthData: string;
    date: string;
    time: string;
    place: string;
    natalPlacements: string;
    unavailable: string;
    sun: string;
    moon: string;
    rising: string;
    dailyReminder: string;
    dailyReminderHint: string;
    reminderCurrent: string; // "Currently: {time}"
    notOnWebTitle: string;
    notOnWebBody: string;
    permDeniedTitle: string;
    permDeniedBody: string;
    permNeededTitle: string;
    permNeededBody: string;
    openSettings: string;
    cancel: string;
    signOut: string;
    language: string;
    languageHint: string;
  };
  paywall: {
    label: string;
    title: string;
    subtitle: string;
    benefit1Title: string;
    benefit1Desc: string;
    benefit2Title: string;
    benefit2Desc: string;
    benefit3Title: string;
    benefit3Desc: string;
    benefit4Title: string;
    benefit4Desc: string;
    perMonth: string;
    unlock: string;
    verifying: string;
    fine: string;
    errCheckout: string;
    successVerifying: string;
    successTitle: string;
    successBody: string;
    continueBtn: string;
    stillVerifying: string;
    sidewaysTitle: string;
    sidewaysBody: string;
    back: string;
    canceledLabel: string;
    canceledTitle: string;
    canceledBody: string;
    ok: string;
  };
  tabs: {
    today: string;
    tarot: string;
    friends: string;
    journal: string;
    profile: string;
  };
};

export const en: Translations = {
  auth: {
    brand: "LUMINA",
    loginTitle: "Welcome\nback.",
    loginSubtitle: "The universe noticed your absence.",
    registerTitle: "Arrive.",
    registerSubtitle: "The stars require a witness. Be one.",
    email: "Email",
    username: "Username",
    usernameHint: "What friends will find you by",
    password: "Password",
    passwordHint: "6+ characters",
    enter: "ENTER",
    entering: "ENTERING...",
    create: "CREATE ACCOUNT",
    creating: "CREATING...",
    or: "OR",
    google: "CONTINUE WITH GOOGLE",
    connecting: "CONNECTING...",
    noAccount: "No account?",
    makeOne: "Make one",
    haveAccount: "Already exist?",
    signIn: "Sign in",
    errPasswordLen: "Password must be 6+ characters.",
    errUsernameLen: "Username must be 3+ characters.",
    errLoginGeneric: "Login failed",
    errRegisterGeneric: "Registration failed",
    errGoogleGeneric: "Google sign-in failed",
  },
  onboarding: {
    step: "STEP {n} / {total}",
    dateTitle: "When\ndid you\narrive?",
    dateSubtitle: "Your birth date. Be precise. Vague entries get vague readings.",
    datePlaceholder: "YYYY-MM-DD",
    hourTitle: "What\nhour?",
    hourSubtitle:
      "Local time of birth. If you don't know, guess noon. The rising sign will be a lie.",
    hourPlaceholder: "HH:MM (24h)",
    whereTitle: "Where?",
    whereSubtitle: "Geography matters. The sky was different over you.",
    selectCity: "Select a city",
    back: "BACK",
    next: "NEXT",
    calculate: "CALCULATE",
    citySearchTitle: "Select city",
    citySearchPlaceholder: "Search",
    close: "CLOSE",
    errSaveGeneric: "Could not save",
  },
  home: {
    hi: "Hi, {name}.",
    todaysHoroscope: "Today's horoscope",
    dailyPull: "Daily pull",
    reversedSuffix: " · Reversed",
    drawAnother: "DRAW ANOTHER CARD →",
    errLoad: "Could not load",
  },
  tarot: {
    label: "TAROT",
    title: "Draw\na card.",
    subtitle: "Face it. The deck owes you nothing.",
    questionLabel: "Your question (optional)",
    questionPlaceholder: "Why do I keep doing this?",
    draw: "DRAW",
    drawing: "DRAWING...",
    close: "CLOSE ×",
    freeNote: "Free: 1 manual draw / day. Premium: unlimited.",
    errDraw: "Could not draw",
  },
  friends: {
    label: "FRIENDS",
    title: "Match maps.",
    add: "+ ADD",
    adding: "ADDING...",
    addFriendTitle: "Add friend",
    addFriendHint: "Their username. They must be onboarded.",
    usernamePlaceholder: "username",
    empty: "No one. Yet. Add someone by username.",
    tapToCompute: "Tap to compute",
    compatibility: "Compatibility: {n}%",
    view: "VIEW →",
    run: "RUN →",
    close: "CLOSE ×",
    compatLabel: "COMPATIBILITY",
    youAnd: "You & @{name}",
  },
  journal: {
    label: "JOURNAL",
    title: "The receipts.",
    empty: "Nothing here yet. Draw a card.",
    daily: "DAILY",
    manual: "MANUAL",
  },
  profile: {
    label: "PROFILE",
    goPremium: "GO PREMIUM",
    premiumBadge: "LUMINA PREMIUM",
    birthData: "Birth data",
    date: "Date",
    time: "Time",
    place: "Place",
    natalPlacements: "Natal placements",
    unavailable: "Unavailable.",
    sun: "SUN",
    moon: "MOON",
    rising: "RISING",
    dailyReminder: "Daily reminder",
    dailyReminderHint:
      "A local nudge, once a day, to check your horoscope and pull a card.",
    reminderCurrent: "Currently: {time}",
    notOnWebTitle: "Not on web",
    notOnWebBody:
      "Daily reminders are a mobile-only feature. Open Lumina on your phone.",
    permDeniedTitle: "Permission denied",
    permDeniedBody:
      "Enable notifications for Lumina from the system settings.",
    permNeededTitle: "Permission needed",
    permNeededBody: "Allow notifications to receive daily nudges.",
    openSettings: "Open Settings",
    cancel: "Cancel",
    signOut: "SIGN OUT",
    language: "Language",
    languageHint: "Interface and readings will use this language.",
  },
  paywall: {
    label: "LUMINA PREMIUM",
    title: "Truth\ncosts.",
    subtitle:
      "Unlock the deck. Lose the limits. Let the planets actually pull their weight.",
    benefit1Title: "Unlimited tarot draws",
    benefit1Desc: "No daily cap. Pull until you find the truth.",
    benefit2Title: "Deeper interpretations",
    benefit2Desc: "Readings that don't soften the edges.",
    benefit3Title: "Compatibility deep-dives",
    benefit3Desc: "See every friction point. Not just the score.",
    benefit4Title: "Priority for new readings",
    benefit4Desc: "Future spreads land in your deck first.",
    perMonth: "PER MONTH · CANCEL ANYTIME",
    unlock: "UNLOCK",
    verifying: "VERIFYING...",
    fine: "You will be redirected to Stripe. Test mode in preview. Cancel anytime from settings.",
    errCheckout: "Could not start checkout",
    successVerifying: "VERIFYING",
    successTitle: "Welcome.",
    successBody: "You're premium. The deck is yours.",
    continueBtn: "CONTINUE",
    stillVerifying: "Still verifying...",
    sidewaysTitle: "Something went sideways.",
    sidewaysBody: "If your card was charged, premium will activate shortly.",
    back: "BACK",
    canceledLabel: "CANCELED",
    canceledTitle: "You backed out.",
    canceledBody: "The stars noticed. Try again whenever.",
    ok: "OK",
  },
  tabs: {
    today: "Today",
    tarot: "Tarot",
    friends: "Friends",
    journal: "Journal",
    profile: "Profile",
  },
};

export const fr: Translations = {
  auth: {
    brand: "LUMINA",
    loginTitle: "Bienvenue\nà nouveau.",
    loginSubtitle: "L'univers a remarqué ton absence.",
    registerTitle: "Arrive.",
    registerSubtitle: "Les étoiles réclament un témoin. Sois-en un.",
    email: "Email",
    username: "Nom d'utilisateur",
    usernameHint: "Le nom sous lequel tes amis te trouveront",
    password: "Mot de passe",
    passwordHint: "6 caractères minimum",
    enter: "ENTRER",
    entering: "CONNEXION...",
    create: "CRÉER UN COMPTE",
    creating: "CRÉATION...",
    or: "OU",
    google: "CONTINUER AVEC GOOGLE",
    connecting: "CONNEXION...",
    noAccount: "Pas de compte ?",
    makeOne: "En créer un",
    haveAccount: "Déjà inscrit ?",
    signIn: "Se connecter",
    errPasswordLen: "Le mot de passe doit faire 6+ caractères.",
    errUsernameLen: "Le nom d'utilisateur doit faire 3+ caractères.",
    errLoginGeneric: "Échec de la connexion",
    errRegisterGeneric: "Échec de l'inscription",
    errGoogleGeneric: "Échec de la connexion Google",
  },
  onboarding: {
    step: "ÉTAPE {n} / {total}",
    dateTitle: "Quand\nes-tu\narrivé·e ?",
    dateSubtitle:
      "Ta date de naissance. Sois précis·e. Les entrées vagues donnent des lectures vagues.",
    datePlaceholder: "AAAA-MM-JJ",
    hourTitle: "À quelle\nheure ?",
    hourSubtitle:
      "L'heure locale de naissance. Si tu ne sais pas, dis midi. L'ascendant sera un mensonge.",
    hourPlaceholder: "HH:MM (24h)",
    whereTitle: "Où ?",
    whereSubtitle: "La géographie compte. Le ciel n'était pas le même au-dessus de toi.",
    selectCity: "Choisir une ville",
    back: "RETOUR",
    next: "SUIVANT",
    calculate: "CALCULER",
    citySearchTitle: "Choisir une ville",
    citySearchPlaceholder: "Rechercher",
    close: "FERMER",
    errSaveGeneric: "Impossible d'enregistrer",
  },
  home: {
    hi: "Salut, {name}.",
    todaysHoroscope: "Horoscope du jour",
    dailyPull: "Tirage du jour",
    reversedSuffix: " · Inversée",
    drawAnother: "TIRER UNE AUTRE CARTE →",
    errLoad: "Impossible de charger",
  },
  tarot: {
    label: "TAROT",
    title: "Tire\nune carte.",
    subtitle: "Regarde-la. Le jeu ne te doit rien.",
    questionLabel: "Ta question (facultatif)",
    questionPlaceholder: "Pourquoi je continue à faire ça ?",
    draw: "TIRER",
    drawing: "TIRAGE...",
    close: "FERMER ×",
    freeNote: "Gratuit : 1 tirage manuel / jour. Premium : illimité.",
    errDraw: "Impossible de tirer",
  },
  friends: {
    label: "AMIS",
    title: "Croise les cartes du ciel.",
    add: "+ AJOUTER",
    adding: "AJOUT...",
    addFriendTitle: "Ajouter un ami",
    addFriendHint: "Son nom d'utilisateur. Il doit avoir terminé l'onboarding.",
    usernamePlaceholder: "nom d'utilisateur",
    empty: "Personne. Pour l'instant. Ajoute quelqu'un par son nom.",
    tapToCompute: "Toucher pour calculer",
    compatibility: "Compatibilité : {n}%",
    view: "VOIR →",
    run: "LANCER →",
    close: "FERMER ×",
    compatLabel: "COMPATIBILITÉ",
    youAnd: "Toi & @{name}",
  },
  journal: {
    label: "JOURNAL",
    title: "Les traces.",
    empty: "Rien ici pour l'instant. Tire une carte.",
    daily: "QUOTIDIEN",
    manual: "MANUEL",
  },
  profile: {
    label: "PROFIL",
    goPremium: "PASSER PREMIUM",
    premiumBadge: "LUMINA PREMIUM",
    birthData: "Données de naissance",
    date: "Date",
    time: "Heure",
    place: "Lieu",
    natalPlacements: "Placements natals",
    unavailable: "Indisponible.",
    sun: "SOLEIL",
    moon: "LUNE",
    rising: "ASCENDANT",
    dailyReminder: "Rappel quotidien",
    dailyReminderHint:
      "Une notification locale, une fois par jour, pour ton horoscope et ton tirage.",
    reminderCurrent: "Actuellement : {time}",
    notOnWebTitle: "Non disponible sur le web",
    notOnWebBody:
      "Les rappels quotidiens fonctionnent uniquement sur mobile. Ouvre Lumina sur ton téléphone.",
    permDeniedTitle: "Permission refusée",
    permDeniedBody:
      "Active les notifications pour Lumina dans les réglages système.",
    permNeededTitle: "Permission requise",
    permNeededBody: "Autorise les notifications pour recevoir tes rappels quotidiens.",
    openSettings: "Ouvrir les réglages",
    cancel: "Annuler",
    signOut: "SE DÉCONNECTER",
    language: "Langue",
    languageHint: "L'interface et les lectures utiliseront cette langue.",
  },
  paywall: {
    label: "LUMINA PREMIUM",
    title: "La vérité\na un prix.",
    subtitle:
      "Débloque le jeu entier. Supprime les limites. Fais enfin travailler les planètes.",
    benefit1Title: "Tirages tarot illimités",
    benefit1Desc: "Aucun plafond quotidien. Tire jusqu'à trouver.",
    benefit2Title: "Interprétations plus profondes",
    benefit2Desc: "Des lectures qui n'adoucissent rien.",
    benefit3Title: "Analyses de compatibilité poussées",
    benefit3Desc: "Chaque point de friction. Pas juste le score.",
    benefit4Title: "Priorité sur les nouveaux tirages",
    benefit4Desc: "Les prochains spreads arrivent dans ton jeu en premier.",
    perMonth: "PAR MOIS · ANNULATION À TOUT MOMENT",
    unlock: "DÉBLOQUER",
    verifying: "VÉRIFICATION...",
    fine: "Tu vas être redirigé·e vers Stripe. Mode test en preview. Annulation possible à tout moment.",
    errCheckout: "Impossible de démarrer le paiement",
    successVerifying: "VÉRIFICATION",
    successTitle: "Bienvenue.",
    successBody: "Tu es premium. Le jeu t'appartient.",
    continueBtn: "CONTINUER",
    stillVerifying: "Vérification en cours...",
    sidewaysTitle: "Quelque chose a dérapé.",
    sidewaysBody: "Si ta carte a été débitée, premium s'activera sous peu.",
    back: "RETOUR",
    canceledLabel: "ANNULÉ",
    canceledTitle: "Tu as reculé.",
    canceledBody: "Les étoiles l'ont noté. Réessaie quand tu veux.",
    ok: "OK",
  },
  tabs: {
    today: "Aujourd'hui",
    tarot: "Tarot",
    friends: "Amis",
    journal: "Journal",
    profile: "Profil",
  },
};

export const dict: Record<Lang, Translations> = { en, fr };
