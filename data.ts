


import { Content, ContentType, Server, User, UserRole, Profile, Ad, PinnedContentState, SiteSettings, CarouselRow, Top10State } from './types';

// Empty initial states for application bootstrapping
// All actual data must come from Firestore

export const contentData: Record<string, Content> = {};

export const pinnedContentData: PinnedContentState = {
    home: [],
    movies: [],
    series: [],
    kids: [],
    ramadan: [],
    soon: []
};

export const top10ContentData: Top10State = {
    home: [],
    movies: [],
    series: [],
    kids: [],
    ramadan: [],
    soon: []
};

export const usersData: User[] = [];

export const carouselsByPage: Record<string, CarouselRow[]> = {
  home: [
    { id: 'h1', title: 'مسلسلات عربية', contentIds: [] },
    { id: 'h2', title: 'مسلسلات تركية', contentIds: [] },
    { id: 'h3', title: 'مسلسلات اجنبية', contentIds: [] },
    { id: 'h4', title: 'افلام عربية', contentIds: [] },
    { id: 'h5', title: 'افلام تركية', contentIds: [] },
    { id: 'h6', title: 'افلام اجنبية', contentIds: [] },
    { id: 'h7', title: 'افلام هندية', contentIds: [] },
    { id: 'h8', title: 'افلام أنميشن', contentIds: [] },
    { id: 'h9', title: 'قريباً', contentIds: [] },
  ],
  movies: [
    { id: 'm1', title: 'أفلام عربية', contentIds: [] },
    { id: 'm2', title: 'أفلام تركية', contentIds: [] },
    { id: 'm3', title: 'أفلام أجنبية', contentIds: [] },
    { id: 'm5', title: 'أفلام هندية', contentIds: [] },
    { id: 'm6', title: 'افلام أنميشن', contentIds: [] },
    { id: 'm4', title: 'الأكثر مشاهدة هذا الأسبوع', contentIds: [] },
  ],
  series: [
    { id: 's1', title: 'مسلسلات عربية', contentIds: [] },
    { id: 's2', title: 'مسلسلات تركية', contentIds: [] },
    { id: 's3', title: 'مسلسلات اجنبية', contentIds: [] },
    { id: 's4', title: ' الأعلى تقييماً', contentIds: [] },
  ],
  kids: [
    { id: 'k1', title: 'مغامرات شيقة', contentIds: [] },
    { id: 'k2', title: 'ضحك ولعب', contentIds: [] },
    { id: 'k4', title: 'افلام أنميشن', contentIds: [] },
    { id: 'k3', title: 'كل برامج الأطفال', contentIds: [] },
  ],
  ramadan: [
    { id: 'r1', title: 'حصرياً لرمضان', contentIds: [] },
    { id: 'r2', title: 'أعمال تاريخية', contentIds: [] },
    { id: 'r3', title: 'دراما اجتماعية', contentIds: [] },
  ],
  soon: [
    { id: 'u1', title: 'قريباً', contentIds: [] },
  ]
};

export const adsData: Ad[] = [];

// --- New Avatar Arrays ---

export const maleAvatars = [
    "https://shahid.mbc.net/mediaObject/avatar-v3/Male/Male-4/original/Male-4.png?height=550&width=550&croppingPoint=&version=1&type=avif",
    "https://shahid.mbc.net/mediaObject/avatar-v3/Male/Male-3/original/Male-3.png?height=550&width=550&croppingPoint=&version=1&type=avif",
    "https://shahid.mbc.net/mediaObject/avatar-v3/Male/Male-2/original/Male-2.png?height=550&width=550&croppingPoint=&version=1&type=avif",
    "https://shahid.mbc.net/mediaObject/avatar-v3/Male/Male-6/original/Male-6.png?height=550&width=550&croppingPoint=&version=1&type=avif",
    "https://shahid.mbc.net/mediaObject/avatar-v3/Male/Male-5/original/Male-5.png?height=550&width=550&croppingPoint=&version=1&type=avif",
    "https://shahid.mbc.net/mediaObject/avatar-v3/Male/Male-11/original/Male-11.png?height=550&width=550&croppingPoint=&version=1&type=avif",
    "https://shahid.mbc.net/mediaObject/avatar-v3/Male/Male-16/original/Male-16.png?height=550&width=550&croppingPoint=&version=1&type=avif",
    "https://shahid.mbc.net/mediaObject/avatar-v3/Male/Male-17/original/Male-17.png?height=550&width=550&croppingPoint=&version=1&type=avif"
];

export const femaleAvatars = [
    "https://shahid.mbc.net/mediaObject/avatar-v3/Female/Female-7a/original/Female-7a.png?height=550&width=550&croppingPoint=&version=1&type=avif",
    "https://shahid.mbc.net/mediaObject/avatar-v3/Female/Female-5/original/Female-5.png?height=550&width=550&croppingPoint=&version=1&type=avif",
    "https://shahid.mbc.net/mediaObject/avatar-v3/Female/Female-9/original/Female-9.png?height=550&width=550&croppingPoint=&version=1&type=avif",
    "https://shahid.mbc.net/mediaObject/avatar-v3/Female/Female-8/original/Female-8.png?height=550&width=550&croppingPoint=&version=1&type=avif",
    "https://shahid.mbc.net/mediaObject/avatar-v3/Female/Female-19/original/Female-19.png?height=550&width=550&croppingPoint=&version=1&type=avif",
    "https://shahid.mbc.net/mediaObject/avatar-v3/Female/Female-21/original/Female-21.png?height=550&width=550&croppingPoint=&version=1&type=avif",
    "https://shahid.mbc.net/mediaObject/avatar-v3/Female/Female-15/original/Female-15.png?height=550&width=550&croppingPoint=&version=1&type=avif",
    "https://shahid.mbc.net/mediaObject/avatar-v3/Female/Female-2/original/Female-2.png?height=550&width=550&croppingPoint=&version=1&type=avif"
];

export const defaultAvatar = "https://shahid.mbc.net/mediaObject/avatar-v3/Male/Male-11/original/Male-11.png?height=550&width=550&croppingPoint=&version=1&type=avif";

// Keeping old arrays for backward compatibility if needed, but mapped to new ones or empty
export const adultAvatars = maleAvatars;
export const kidAvatars = femaleAvatars; // Just mapping to avoid break, logic changed in component

const privacyPolicyText = `
سياسة الخصوصية لمنصة سينماتيكس
آخر تحديث: 24 يوليو 2024

1. مقدمة
نحن في سينماتيكس ("نحن"، "المنصة") نلتزم بحماية خصوصيتك. توضح سياسة الخصوصية هذه كيفية جمعنا واستخدامنا والكشف عن معلوماتك عند استخدامك لموقعنا وتطبيقاتنا ("الخدمة").

2. المعلومات التي نجمعها
أ. المعلومات التي تقدمها لنا:
- معلومات الحساب: عند إنشاء حساب، نجمع اسمك، بريدك الإلكتروني، وكلمة المرور.
- معلومات الملف الشخصي: يمكنك إنشاء ملفات شخصية متعددة بأسماء وصور رمزية مختلفة.
ب. المعلومات التي نجمعها تلقائياً:
- سجل المشاهدة: نتتبع الأفلام والمسلسلات التي تشاهدها، وتقدمك فيها، لتقديم ميزات مثل "متابعة المشاهدة".
- معلومات الجهاز والاستخدام: نجمع معلومات حول جهازك (مثل نوعه ونظام التشغيل) وعنوان IP، وتفاعلاتك مع خدمتنا.

3. كيف نستخدم معلوماتك
- لتقديم وتخصيص خدماتنا.
- للتواصل معك بخصوص حسابك أو تحديثات الخدمة.
- لتحسين خدمتنا وتطوير ميزات جديدة.
- لمنع الاحتيال وضمان أمن منصتنا.

4. مشاركة معلوماتك
نحن لا نبيع معلوماتك الشخصية لأطراف ثالثة. قد نشارك معلوماتك مع:
- مزودي الخدمة الذين يساعدوننا في تشغيل المنصة (مثل خدمات الاستضافة).
- الجهات القانونية إذا طُلب منا ذلك بموجب القانون.

5. أمن البيانات
نتخذ تدابير أمنية معقولة لحماية معلوماتك من الوصول غير المصرح به. ومع ذلك، لا توجد طريقة نقل عبر الإنترنت آمنة 100%.

6. حقوقك
لديك الحق في الوصول إلى معلوماتك الشخصية وتحديثها أو حذفها من خلال صفحة إعدادات الحساب.

7. التغييرات على سياسة الخصوصية
قد نقوم بتحديث سياسة الخصوصية هذه من وقت لآخر. سنعلمك بأي تغييرات عن طريق نشر السياسة الجديدة على هذه الصفحة.

8. اتصل بنا
إذا كانت لديك أي أسئلة حول سياسة الخصوصية هذه، يرجى الاتصال بنا عبر [رابط صفحة اتصل بنا].
`;

const copyrightPolicyText = `
حقوق الملكية الفكرية - سينماتيكس

1. حقوق النشر
جميع المحتويات المعروضة على منصة سينماتيكس، بما في ذلك النصوص، والرسومات، والشعارات، والأيقونات، والصور، والمقاطع الصوتية، والتنزيلات الرقمية، وتجميع البيانات، والبرمجيات، هي ملك لسينماتيكس أو لموردي محتواها ومحمية بموجب قوانين حقوق النشر الدولية والمحلية.

2. العلامات التجارية
"سينماتيكس" والشعارات والرسومات والعناوين المرتبطة بها هي علامات تجارية أو مظهر تجاري لسينماتيكس. لا يجوز استخدام علاماتنا التجارية أو مظهرنا التجاري فيما يتعلق بأي منتج أو خدمة ليست تابعة لسينماتيكس.

3. استخدام المحتوى
يُمنح المستخدمون ترخيصاً محدوداً للوصول إلى المحتوى واستخدامه الشخصي وغير التجاري. لا يجوز لك تحميل (بغير طرق التخزين المؤقت للصفحات)، أو تعديل، أو إعادة إنتاج، أو نسخ، أو بيع، أو استغلال أي جزء من المحتوى لأغراض تجارية دون موافقة كتابية صريحة من سينماتيكس.

4. الإبلاغ عن انتهاك الحقوق
نحن نحترم حقوق الملكية الفكرية للآخرين. إذا كنت تعتقد أن عملك قد تم نسخه بطريقة تشكل انتهاكاً لحقوق النشر، يرجى تزويدنا بالمعلومات التالية عبر صفحة "اتصل بنا":
- وصف للعمل المحمي بحقوق النشر الذي تدعي أنه قد تم انتهاكه.
- وصف لمكان وجود المادة التي تدعي أنها تنتهك الحقوق على الموقع.
- عنوانك ورقم هاتفك وعنوان بريدك الإلكتروني.
- بيان منك بأن لديك اعتقاد حسن النية بأن الاستخدام المتنازع عليه غير مصرح به.

5. التغييرات
تحتفظ سينماتيكس بالحق في تعديل هذه السياسة في أي وقت. يرجى مراجعة هذه الصفحة بشكل دوري للاطلاع على أي تغييرات.
`;


export const initialSiteSettings: SiteSettings = {
    shoutBar: {
        text: '🎉 عرض خاص: اشترك الآن واحصل على شهر مجاني! 🎉 تابع أحدث المسلسلات والأفلام حصرياً على سينماتيكس. 🎉',
        isVisible: true,
    },
    socialLinks: {
        facebook: 'https://facebook.com',
        instagram: 'https://instagram.com',
        twitter: 'https://twitter.com',
        facebookGroup: 'https://facebook.com/groups',
        contactUs: '#',
    },
    countdownDate: '2026-03-01T00:00:00',
    adsEnabled: true,
    privacyPolicy: privacyPolicyText.trim(),
    copyrightPolicy: copyrightPolicyText.trim(), // Initialize New Field
    isCountdownVisible: true,
    isRamadanModeEnabled: false,
    activeTheme: 'default', // Default theme
    isShowRamadanCarousel: false,
    is_maintenance_mode_enabled: false,
    showTop10Home: true,
    showTop10Movies: true,
    showTop10Series: true,
    serviceAccountJson: '', // Initialized empty
};
