
import React, { useState, useCallback, useEffect, useLayoutEffect, useRef } from 'react';
// FIX: Switched to Firebase v8 compatible namespaced imports.
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
// Note: firestore is imported via db from ./firebase

import { db, auth, getUserProfile, updateUserProfileInFirestore, createUserProfileInFirestore, deleteUserFromFirestore, getSiteSettings, getAds, getUsers, updateSiteSettings as updateSiteSettingsInDb, addAd, updateAd, deleteAd, getPinnedContent, updatePinnedContentForPage } from './firebase'; 
import type { Content, User, Profile, Ad, PinnedItem, SiteSettings, View, LoginError, PinnedContentState, PageKey } from './types';
import { UserRole } from './types';
import { initialSiteSettings, defaultAvatar, pinnedContentData as initialPinned } from './data';

import Header from './components/Header';
import Footer from './components/Footer';
import DetailPage from './components/DetailPage';
import LoginModal from './components/LoginModal';
import AdminPanel from './components/AdminPanel';
import CreateAccountPage from './components/CreateAccountPage';
import MoviesPage from './components/MoviesPage';
import SeriesPage from './components/SeriesPage';
import ProfileSelector from './components/ProfileSelector';
import AccountSettingsPage from './components/AccountSettingsPage';
import KidsPage from './components/KidsPage';
import RamadanPage from './components/RamadanPage';
import SoonPage from './components/SoonPage';
import PrivacyPolicyPage from './components/PrivacyPolicyPage';
import CopyrightPage from './components/CopyrightPage';
import AboutPage from './components/AboutPage';
import MyListPage from './components/MyListPage';
import HomePage from './components/HomePage';
import BottomNavigation from './components/BottomNavigation';
import CategoryPage from './components/CategoryPage'; 
import RamadanRestrictedModal from './components/RamadanRestrictedModal';
import ProfileHubPage from './components/ProfileHubPage';
import MaintenancePage from './components/MaintenancePage';
import PWAInstallPrompt from './components/PWAInstallPrompt'; // PWA Component

// --- Toast Notification System ---

const CheckCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ExclamationCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CloseIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);


interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

// --- Routing Configuration ---
const VIEW_PATHS: Record<string, View> = {
    '/': 'home',
    '/movies': 'movies',
    '/series': 'series',
    '/kids': 'kids',
    '/ramadan': 'ramadan',
    '/soon': 'soon',
    '/admin': 'admin',
    '/login': 'login',
    '/register': 'register',
    '/mylist': 'myList',
    '/account': 'accountSettings',
    '/profile': 'profileHub',
    '/privacy': 'privacy',
    '/copyright': 'copyright',
    '/about': 'about',
    '/maintenance': 'maintenance'
};

const REVERSE_VIEW_PATHS: Record<string, string> = {
    'home': '/',
    'movies': '/movies',
    'series': '/series',
    'kids': '/kids',
    'ramadan': '/ramadan',
    'soon': '/soon',
    'admin': '/admin',
    'login': '/login',
    'register': '/register',
    'myList': '/mylist',
    'accountSettings': '/account',
    'profileHub': '/profile',
    'privacy': '/privacy',
    'copyright': '/copyright',
    'about': '/about',
    'detail': '/detail', 
    'profileSelector': '/profiles',
    'category': '/category',
    'maintenance': '/maintenance'
};

// --- Safe History Helpers ---
const safeHistoryPush = (path: string) => {
    try {
        if (window.location.protocol !== 'file:' && window.location.origin !== 'null') {
             window.history.pushState({}, '', path);
        }
    } catch (e) {
        // Sandbox environment detected
    }
};

const safeHistoryReplace = (path: string) => {
    try {
        if (window.location.protocol !== 'file:' && window.location.origin !== 'null') {
            window.history.replaceState({}, '', path);
        }
    } catch (e) {
        // Sandbox environment detected
    }
};

const App: React.FC = () => {
  
  const getInitialView = (): View => {
      const path = decodeURIComponent(window.location.pathname);
      const normalizedPath = path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
      
      if (VIEW_PATHS[normalizedPath]) {
          return VIEW_PATHS[normalizedPath];
      }
      if (normalizedPath.startsWith('/category/')) {
          return 'category';
      }
      if (normalizedPath.match(/^\/(?:series|مسلسل|movie|فيلم)\/([^\/]+)/)) {
          return 'detail';
      }
      return 'home';
  };

  const [view, setView] = useState<View>(getInitialView);
  
  // 1. تعريف الذاكرة (State)
  const scrollPositions = useRef<Record<string, number>>({});
  const prevViewRef = useRef<View>(getInitialView());
  
  // Track previous view for Back Button logic (e.g. returning from Detail to List)
  const [returnView, setReturnView] = useState<View>('home');

  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
      const path = decodeURIComponent(window.location.pathname);
      if (path.startsWith('/category/')) {
          return path.split('/category/')[1];
      }
      return '';
  });

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  
  const [allContent, setAllContent] = useState<Content[]>([]);
  const [pinnedItems, setPinnedItems] = useState<PinnedContentState>(initialPinned);
  
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(() => {
      let settings = initialSiteSettings;
      try {
          const savedRamadan = localStorage.getItem('cinematix_theme_ramadan');
          const savedTheme = localStorage.getItem('cinematix_active_theme');
          
          if (savedTheme) {
              settings = { ...settings, activeTheme: savedTheme as any };
          } else if (savedRamadan !== null) {
              settings = { 
                  ...settings, 
                  isRamadanModeEnabled: savedRamadan === 'true',
                  activeTheme: savedRamadan === 'true' ? 'ramadan' : 'default'
              };
          }
      } catch (e) { console.error(e); }
      return settings;
  });

  const [ads, setAds] = useState<Ad[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  
  const [isContentLoading, setIsContentLoading] = useState(true);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const [isRamadanModalOpen, setIsRamadanModalOpen] = useState(false);
  const [restrictedContent, setRestrictedContent] = useState<Content | null>(null);
  
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  // FORCE MANUAL SCROLL RESTORATION
  useEffect(() => {
      if ('scrollRestoration' in window.history) {
          window.history.scrollRestoration = 'manual';
      }
  }, []);

  // 2. تعديل useLayoutEffect
  useLayoutEffect(() => {
      const prevView = prevViewRef.current;
      
      // الحالة 1: نحن الآن في صفحة المشاهدة (سواء دخلنا جديد أو انتقلنا لفيلم آخر)
      if (view === 'detail') {
          window.scrollTo(0, 0); // إجبار البدء من الأعلى دائماً
      } 
      // الحالة 2: كنا في المشاهدة ورجعنا للقوائم (Home/Movies)
      else if (prevView === 'detail') {
          // راجع من فيلم؟ استرجع مكانك القديم
          const savedPosition = scrollPositions.current[view];
          window.scrollTo(0, savedPosition || 0); // استرجع المكان القديم
      } 
      // الحالة 3: تنقل عادي بين القوائم
      else {
          window.scrollTo(0, 0);
      }

      prevViewRef.current = view;
  }, [view, selectedContent]); // <--- تمت إضافة selectedContent هنا لضمان تصفير السكرول عند تغيير الفيلم

  // FIX: Removed 'view' dependency to prevent circular logic/race condition when navigating
  const resolveContentFromUrl = useCallback((path: string, contentList: Content[]) => {
      const decodedPath = decodeURIComponent(path);
      const match = decodedPath.match(/^\/(?:series|مسلسل|movie|فيلم)\/([^\/]+)/);
      
      if (match && match[1]) {
          const slug = match[1];
          const foundContent = contentList.find(c => (c.slug === slug) || (c.id === slug));

          if (foundContent) {
              setSelectedContent(foundContent);
              setView('detail');
          } else {
              // URL looks like a detail page, but content not found.
              // Only redirect to home if we actually have content loaded (not empty list)
              if (contentList.length > 0) {
                 setView('home');
                 safeHistoryReplace('/');
              }
          }
      }
  }, []);

  useEffect(() => {
      const handlePopState = () => {
          const newView = getInitialView();
          setView(newView); 
          
          const path = decodeURIComponent(window.location.pathname);
          if (path.startsWith('/category/')) {
              setSelectedCategory(path.split('/category/')[1]);
          }

          // Only attempt to resolve content if we are navigating TO a detail view via Back/Forward
          if (newView === 'detail' && allContent.length > 0) {
              resolveContentFromUrl(window.location.pathname, allContent);
          }
      };
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
  }, [allContent, resolveContentFromUrl]);

  useEffect(() => {
      if (view === 'admin') {
          document.body.classList.remove('theme-ramadan', 'theme-ios', 'theme-night-city', 'theme-nature', 'theme-eid', 'theme-cosmic-teal', 'theme-netflix-red');
          return;
      }

      document.body.classList.remove('theme-ramadan', 'theme-ios', 'theme-night-city', 'theme-nature', 'theme-eid', 'theme-cosmic-teal', 'theme-netflix-red');

      const active = siteSettings.activeTheme;
      if (active === 'ramadan') document.body.classList.add('theme-ramadan');
      else if (active === 'ios') document.body.classList.add('theme-ios');
      else if (active === 'night-city') document.body.classList.add('theme-night-city');
      else if (active === 'nature') document.body.classList.add('theme-nature');
      else if (active === 'eid') document.body.classList.add('theme-eid');
      else if (active === 'cosmic-teal') document.body.classList.add('theme-cosmic-teal');
      else if (active === 'netflix-red') document.body.classList.add('theme-netflix-red');

      localStorage.setItem('cinematix_active_theme', active);
      localStorage.setItem('cinematix_theme_ramadan', active === 'ramadan' ? 'true' : 'false');

  }, [siteSettings.activeTheme, view]); 

  const fetchData = useCallback(async () => {
      try {
          setIsContentLoading(true);
          const [contentSnap, settings, adsList, pinnedData] = await Promise.all([
              db.collection('content').get(),
              getSiteSettings(),
              getAds(),
              getPinnedContent()
          ]);

          const contentList = contentSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Content));
          setAllContent(contentList);

          setSiteSettings(prev => ({
              ...settings,
              activeTheme: settings.activeTheme || 'default'
          }));

          setAds(adsList);
          setPinnedItems(pinnedData);

      } catch (error) {
          console.error("Error fetching data", error);
          addToast("فشل في تحميل البيانات من الخادم", "error");
      } finally {
          setIsContentLoading(false);
      }
  }, [addToast]);

  useEffect(() => {
      const hideLoader = () => {
        const preloader = document.getElementById('preloader');
        if (preloader && !preloader.classList.contains('preloader-hidden')) {
            preloader.classList.add('preloader-hidden');
            setTimeout(() => {
                if (preloader) preloader.style.display = 'none';
            }, 500);
        }
      };

      const isHomePage = window.location.pathname === '/';

      if (!isHomePage) {
          hideLoader();
          fetchData();
          return;
      }

      const safetyTimer = setTimeout(() => {
          hideLoader();
      }, 3000);

      fetchData().finally(() => {
          clearTimeout(safetyTimer);
          hideLoader();
      });

  }, [fetchData]);
  
  useEffect(() => {
      if (allContent.length > 0) {
          // Run once on initial load / content load to handle deep linking
          resolveContentFromUrl(window.location.pathname, allContent);
      }
  }, [allContent, resolveContentFromUrl]);

  useEffect(() => {
      const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
          try {
              if (firebaseUser) {
                  const profile = await getUserProfile(firebaseUser.uid);
                  if (profile) {
                      const user: User = {
                          id: firebaseUser.uid,
                          email: firebaseUser.email || '',
                          role: profile.role || UserRole.User,
                          profiles: profile.profiles || [],
                          firstName: profile.firstName,
                          lastName: profile.lastName
                      };
                      setCurrentUser(user);
                      
                      const savedProfileId = localStorage.getItem('cinematix_active_profile');
                      if (savedProfileId) {
                          const savedProfile = user.profiles.find(p => p.id === Number(savedProfileId));
                          if (savedProfile) {
                              setActiveProfile(savedProfile);
                          }
                      }
                      
                      if (user.role === UserRole.Admin) {
                           const usersList = await getUsers();
                           setAllUsers(usersList);
                      }
                  }
              } else {
                  setCurrentUser(null);
                  setActiveProfile(null);
                  localStorage.removeItem('cinematix_active_profile');
              }
          } finally {
              setIsAuthLoading(false);
          }
      });
      return () => unsubscribe();
  }, []);


  const handleSetView = (newView: View, category?: string) => {
      setView(newView);
      if (category) setSelectedCategory(category);

      let path = REVERSE_VIEW_PATHS[newView];
      
      if (newView === 'category' && category) {
          path = `/category/${category}`;
      }
      
      if (path) {
          if (window.location.pathname !== path) {
            safeHistoryPush(path);
            // Scroll is handled by useLayoutEffect
          }
      }
  };

  // 3. تعديل دالة handleSelectContent
  const handleSelectContent = (content: Content) => {
      if (siteSettings.isRamadanModeEnabled && content.categories.includes('رمضان')) {
          const now = new Date().getTime();
          const countdown = new Date(siteSettings.countdownDate).getTime();
          
          if (now < countdown) {
              setRestrictedContent(content);
              setIsRamadanModalOpen(true);
              return;
          }
      }
      
      // 1. احفظ مكان السكرول للصفحة الحالية (Home, Movies, Series...)
      // هذا يضمن أننا لو رجعنا لها نجدها في مكانها
      scrollPositions.current[view] = window.scrollY;

      // Keep returnView logic for Back button support in Header
      if (view !== 'detail') {
          setReturnView(view);
      }

      // 2. تحديث المحتوى والفيو
      setSelectedContent(content);
      setView('detail');

      // 3. التنقل (Push)
      const slug = content.slug || content.id;
      const prefix = content.type === 'series' ? '/مسلسل/' : '/فيلم/';
      const newPath = `${prefix}${slug}`;

      safeHistoryPush(newPath);

      // 4. (تأكيد إضافي) اجبار السكرول للأعلى فوراً
      window.scrollTo(0, 0);
  };

  const handleLogin = async (email: string, pass: string): Promise<LoginError> => {
      try {
          await auth.signInWithEmailAndPassword(email, pass);
          return 'none';
      } catch (error: any) {
          if (error.code === 'auth/user-not-found') return 'userNotFound';
          if (error.code === 'auth/wrong-password') return 'wrongPassword';
          return 'userNotFound';
      }
  };

  const handleRegister = async (newUser: Omit<User, 'id' | 'role' | 'profiles'>) => {
      try {
          const cred = await auth.createUserWithEmailAndPassword(newUser.email, newUser.password || '');
          if (cred.user) {
               const defaultProfile: Profile = {
                   id: Date.now(),
                   name: newUser.firstName || 'المستخدم',
                   avatar: defaultAvatar,
                   isKid: false,
                   watchHistory: [],
                   myList: []
               };

               const userToSave = {
                   firstName: newUser.firstName,
                   lastName: newUser.lastName,
                   email: newUser.email,
                   profiles: [defaultProfile],
                   role: UserRole.User
               };
               await createUserProfileInFirestore(cred.user.uid, userToSave);
               addToast('تم إنشاء الحساب بنجاح!', 'success');
               handleSetView('profileSelector');
          }
      } catch (error: any) {
          addToast(error.message, 'error');
      }
  };

  const handleLogout = async () => {
      localStorage.removeItem('cinematix_active_profile');
      await auth.signOut();
      setCurrentUser(null);
      setActiveProfile(null);
      handleSetView('home');
      addToast('تم تسجيل الخروج.', 'info');
  };

  const handleProfileSelect = (profile: Profile) => {
      localStorage.setItem('cinematix_active_profile', String(profile.id));
      setActiveProfile(profile);
      handleSetView('home');
  };

  const handleToggleMyList = async (contentId: string) => {
      if (!currentUser || !activeProfile) {
          handleSetView('login');
          return;
      }
      
      const currentList = activeProfile.myList || [];
      let newList;
      if (currentList.includes(contentId)) {
          newList = currentList.filter(id => id !== contentId);
      } else {
          newList = [...currentList, contentId];
          addToast('تمت الإضافة إلى القائمة', 'success');
      }
      
      const updatedProfile = { ...activeProfile, myList: newList };
      setActiveProfile(updatedProfile);
      
      const updatedProfiles = currentUser.profiles.map(p => p.id === activeProfile.id ? updatedProfile : p);
      setCurrentUser({ ...currentUser, profiles: updatedProfiles });

      await updateUserProfileInFirestore(currentUser.id, { profiles: updatedProfiles });
  };

  const handleUpdateAd = async (ad: Ad) => {
      try {
          await updateAd(ad.id, ad);
          setAds(prev => prev.map(a => a.id === ad.id ? ad : a));
          addToast('تم تحديث الإعلان', 'success');
      } catch(e) { addToast('خطأ في التحديث', 'error'); }
  };
  
  const handleAddAd = async (ad: Omit<Ad, 'id' | 'updatedAt'>) => {
      try {
         const id = await addAd(ad);
         const newAd = { ...ad, id, updatedAt: new Date().toISOString() };
         setAds(prev => [newAd, ...prev]);
         addToast('تم إضافة الإعلان', 'success');
      } catch(e) { addToast('خطأ في الإضافة', 'error'); }
  };

  const handleDeleteAd = async (id: string) => {
      try {
          await deleteAd(id);
          setAds(prev => prev.filter(a => a.id !== id));
          addToast('تم حذف الإعلان', 'success');
      } catch(e) { addToast('خطأ في الحذف', 'error'); }
  };
  
  const handleUpdateSiteSettings = async (newSettings: SiteSettings) => {
      try {
          const compatSettings = {
              ...newSettings,
              isRamadanModeEnabled: newSettings.activeTheme === 'ramadan'
          };
          await updateSiteSettingsInDb(compatSettings);
          setSiteSettings(compatSettings);
          addToast('تم حفظ الإعدادات', 'success');
      } catch(e) { addToast('خطأ في الحفظ', 'error'); }
  };

  const handleUpdatePinnedItems = async (page: PageKey, items: PinnedItem[]) => {
      try {
          setPinnedItems(prev => ({...prev, [page]: items}));
          await updatePinnedContentForPage(page, items);
          addToast('تم تحديث المحتوى المثبت بنجاح', 'success');
      } catch(e) {
          console.error("Failed to pin items:", e);
          addToast('فشل حفظ المحتوى المثبت. تأكد من الاتصال بالإنترنت.', 'error');
          fetchData(); 
      }
  };

  const handleAddAdmin = async (newAdmin: Omit<User, 'id' | 'role' | 'profiles'>) => {
        try {
             console.warn("Client-side admin creation simulated.");
             addToast('تم محاكاة إضافة المسؤول.', 'info');
             setAllUsers(prev => [...prev, { ...newAdmin, id: 'mock-id-' + Date.now(), role: UserRole.Admin, profiles: [] }]);
        } catch (error: any) {
            addToast(error.message, 'error');
        }
  };

  const handleDeleteUser = async (userId: string) => {
      try {
          await deleteUserFromFirestore(userId);
          setAllUsers(prev => prev.filter(u => u.id !== userId));
          addToast('تم حذف المستخدم', 'success');
      } catch(e) { addToast('خطأ في حذف المستخدم', 'error'); }
  };


  const renderView = () => {
      const isAdmin = currentUser?.role === UserRole.Admin;
      const isMaintenance = siteSettings.is_maintenance_mode_enabled;
      const isRamadanTheme = siteSettings.activeTheme === 'ramadan';
      const isEidTheme = siteSettings.activeTheme === 'eid';
      const isCosmicTealTheme = siteSettings.activeTheme === 'cosmic-teal';
      const isNetflixRedTheme = siteSettings.activeTheme === 'netflix-red';

      const LoadingSpinner = () => (
          <div className="min-h-screen flex items-center justify-center bg-[var(--bg-body)]">
              <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${isCosmicTealTheme ? 'border-[#35F18B]' : isNetflixRedTheme ? 'border-[#E50914]' : 'border-[#00A7F8]'}`}></div>
          </div>
      );

      if (isMaintenance) {
          if (!isAdmin) {
              if (view === 'login') {
                  return <LoginModal onSetView={handleSetView} onLogin={handleLogin} isRamadanTheme={isRamadanTheme} isEidTheme={isEidTheme} isCosmicTealTheme={isCosmicTealTheme} isNetflixRedTheme={isNetflixRedTheme} />;
              }
              return <MaintenancePage socialLinks={siteSettings.socialLinks} onSetView={handleSetView} />;
          }
      }

      if (!isAuthLoading && currentUser && !activeProfile && view !== 'profileSelector' && view !== 'accountSettings' && view !== 'admin') {
          return <ProfileSelector user={currentUser} onSelectProfile={handleProfileSelect} onSetView={handleSetView} />;
      }

      const getPinnedContentWithMeta = (page: PageKey) => {
          return pinnedItems[page].map((p): Content | null => {
              const content = allContent.find(c => c.id === p.contentId);
              if (!content) return null;
              
              let finalContent = { ...content };

              if (content.type === 'series' && content.seasons && content.seasons.length > 0) {
                  const latestSeason = [...content.seasons].sort((a, b) => b.seasonNumber - a.seasonNumber)[0];
                  
                  if (latestSeason) {
                      if (latestSeason.poster) finalContent.poster = latestSeason.poster;
                      if (latestSeason.backdrop) finalContent.backdrop = latestSeason.backdrop;
                      if (latestSeason.logoUrl) finalContent.logoUrl = latestSeason.logoUrl;
                      if (latestSeason.description) finalContent.description = latestSeason.description;
                      if (latestSeason.releaseYear) finalContent.releaseYear = latestSeason.releaseYear;
                      if (latestSeason.cast && latestSeason.cast.length > 0) finalContent.cast = latestSeason.cast;
                  }
              }

              return { 
                  ...finalContent, 
                  bannerNote: p.bannerNote || finalContent.bannerNote 
              };
          }).filter((c): c is Content => !!c);
      };

      switch (view) {
          case 'home':
              return <HomePage 
                        allContent={allContent} 
                        pinnedContent={getPinnedContentWithMeta('home')}
                        onSelectContent={handleSelectContent} 
                        isLoggedIn={!!currentUser} 
                        myList={activeProfile?.myList} 
                        onToggleMyList={handleToggleMyList} 
                        ads={ads} 
                        siteSettings={siteSettings}
                        onNavigate={handleSetView}
                        isLoading={isContentLoading}
                        isRamadanTheme={isRamadanTheme}
                        isEidTheme={isEidTheme}
                        isCosmicTealTheme={isCosmicTealTheme}
                        isNetflixRedTheme={isNetflixRedTheme}
                     />;
          case 'movies':
              return <MoviesPage 
                        allContent={allContent}
                        pinnedContent={getPinnedContentWithMeta('movies')}
                        onSelectContent={handleSelectContent}
                        isLoggedIn={!!currentUser}
                        myList={activeProfile?.myList}
                        onToggleMyList={handleToggleMyList}
                        ads={ads}
                        adsEnabled={siteSettings.adsEnabled}
                        onNavigate={handleSetView}
                        isLoading={isContentLoading}
                        isRamadanTheme={isRamadanTheme}
                        isEidTheme={isEidTheme}
                        isCosmicTealTheme={isCosmicTealTheme}
                        isNetflixRedTheme={isNetflixRedTheme}
                        siteSettings={siteSettings}
                     />;
          case 'series':
              return <SeriesPage
                        allContent={allContent}
                        pinnedContent={getPinnedContentWithMeta('series')}
                        onSelectContent={handleSelectContent}
                        isLoggedIn={!!currentUser}
                        myList={activeProfile?.myList}
                        onToggleMyList={handleToggleMyList}
                        ads={ads}
                        adsEnabled={siteSettings.adsEnabled}
                        siteSettings={siteSettings}
                        onNavigate={handleSetView}
                        isLoading={isContentLoading}
                        isRamadanTheme={isRamadanTheme}
                        isEidTheme={isEidTheme}
                        isCosmicTealTheme={isCosmicTealTheme}
                        isNetflixRedTheme={isNetflixRedTheme}
                     />;
          case 'kids':
              return <KidsPage
                        allContent={allContent}
                        pinnedContent={getPinnedContentWithMeta('kids')}
                        onSelectContent={handleSelectContent}
                        isLoggedIn={!!currentUser}
                        myList={activeProfile?.myList}
                        onToggleMyList={handleToggleMyList}
                        ads={ads}
                        adsEnabled={siteSettings.adsEnabled}
                        onNavigate={handleSetView}
                        isLoading={isContentLoading}
                        isRamadanTheme={isRamadanTheme}
                        isEidTheme={isEidTheme}
                        isCosmicTealTheme={isCosmicTealTheme}
                        isNetflixRedTheme={isNetflixRedTheme}
                     />;
           case 'ramadan':
              return <RamadanPage
                        allContent={allContent}
                        pinnedContent={getPinnedContentWithMeta('ramadan')}
                        onSelectContent={handleSelectContent}
                        isLoggedIn={!!currentUser}
                        myList={activeProfile?.myList}
                        onToggleMyList={handleToggleMyList}
                        ads={ads}
                        adsEnabled={siteSettings.adsEnabled}
                        siteSettings={siteSettings}
                        onNavigate={handleSetView}
                        isLoading={isContentLoading}
                     />;
           case 'soon':
               return <SoonPage
                        allContent={allContent}
                        pinnedContent={getPinnedContentWithMeta('soon')}
                        onSelectContent={handleSelectContent}
                        isLoggedIn={!!currentUser}
                        myList={activeProfile?.myList}
                        onToggleMyList={handleToggleMyList}
                        ads={ads}
                        adsEnabled={siteSettings.adsEnabled}
                        isLoading={isContentLoading}
                        isRamadanTheme={isRamadanTheme}
                        isEidTheme={isEidTheme}
                        isCosmicTealTheme={isCosmicTealTheme}
                        isNetflixRedTheme={isNetflixRedTheme}
                      />;
           case 'detail':
               return selectedContent ? (
                   <DetailPage 
                        key={window.location.pathname}
                        locationPath={window.location.pathname}
                        content={selectedContent}
                        ads={ads}
                        adsEnabled={siteSettings.adsEnabled}
                        allContent={allContent}
                        onSelectContent={handleSelectContent}
                        isLoggedIn={!!currentUser}
                        myList={activeProfile?.myList}
                        onToggleMyList={handleToggleMyList}
                        onSetView={handleSetView}
                        isRamadanTheme={isRamadanTheme}
                        isEidTheme={isEidTheme}
                        isCosmicTealTheme={isCosmicTealTheme}
                        isNetflixRedTheme={isNetflixRedTheme}
                   />
               ) : (isContentLoading ? (
                 <LoadingSpinner />
               ) : (
                 <HomePage {...{allContent, pinnedContent: [], onSelectContent: handleSelectContent, isLoggedIn: !!currentUser, myList: activeProfile?.myList, onToggleMyList: handleToggleMyList, ads, siteSettings, onNavigate: handleSetView}} isLoading={isContentLoading} />
               ));
           case 'login':
               if (isAuthLoading) return <LoadingSpinner />;
               return <LoginModal onSetView={handleSetView} onLogin={handleLogin} isRamadanTheme={isRamadanTheme} isEidTheme={isEidTheme} isCosmicTealTheme={isCosmicTealTheme} isNetflixRedTheme={isNetflixRedTheme} />;
           case 'register':
               if (isAuthLoading) return <LoadingSpinner />;
               return <CreateAccountPage onSetView={handleSetView} onRegister={handleRegister} isRamadanTheme={isRamadanTheme} isEidTheme={isEidTheme} isCosmicTealTheme={isCosmicTealTheme} isNetflixRedTheme={isNetflixRedTheme} />;
           case 'profileSelector':
               if (isAuthLoading) return <LoadingSpinner />;
               return currentUser ? <ProfileSelector user={currentUser} onSelectProfile={handleProfileSelect} onSetView={handleSetView} /> : <LoginModal onSetView={handleSetView} onLogin={handleLogin} isRamadanTheme={isRamadanTheme} isEidTheme={isEidTheme} isCosmicTealTheme={isCosmicTealTheme} isNetflixRedTheme={isNetflixRedTheme} />;
           case 'myList':
               if (isAuthLoading) return <LoadingSpinner />;
               return activeProfile ? (
                   <MyListPage 
                        allContent={allContent}
                        activeProfile={activeProfile}
                        onSelectContent={handleSelectContent}
                        isLoggedIn={!!currentUser}
                        myList={activeProfile.myList}
                        onToggleMyList={handleToggleMyList}
                        onSetView={handleSetView}
                        isRamadanTheme={isRamadanTheme}
                        isEidTheme={isEidTheme}
                        isCosmicTealTheme={isCosmicTealTheme}
                        isNetflixRedTheme={isNetflixRedTheme}
                   />
               ) : <LoginModal onSetView={handleSetView} onLogin={handleLogin} isRamadanTheme={isRamadanTheme} isEidTheme={isEidTheme} isCosmicTealTheme={isCosmicTealTheme} isNetflixRedTheme={isNetflixRedTheme} />;
           case 'category':
               return <CategoryPage 
                        categoryTitle={selectedCategory}
                        allContent={allContent}
                        onSelectContent={handleSelectContent}
                        isLoggedIn={!!currentUser}
                        myList={activeProfile?.myList}
                        onToggleMyList={handleToggleMyList}
                        onSetView={handleSetView}
                        isRamadanTheme={isRamadanTheme}
                        isEidTheme={isEidTheme}
                        isCosmicTealTheme={isCosmicTealTheme}
                        isNetflixRedTheme={isNetflixRedTheme}
                      />;
           case 'admin':
                if (isAuthLoading) return <LoadingSpinner />;
                return currentUser?.role === UserRole.Admin ? (
                    <AdminPanel 
                        allUsers={allUsers}
                        allAds={ads}
                        pinnedItems={pinnedItems}
                        siteSettings={siteSettings}
                        onSetSiteSettings={handleUpdateSiteSettings}
                        onSetPinnedItems={handleUpdatePinnedItems}
                        onSetView={handleSetView}
                        onUpdateAd={handleUpdateAd}
                        onDeleteAd={handleDeleteAd}
                        onAddAd={handleAddAd}
                        onAddAdmin={handleAddAdmin}
                        onDeleteUser={handleDeleteUser}
                        onContentChanged={fetchData}
                        addToast={addToast}
                    />
                ) : <HomePage {...{allContent, pinnedContent: [], onSelectContent: handleSelectContent, isLoggedIn: !!currentUser, myList: activeProfile?.myList, onToggleMyList: handleToggleMyList, ads, siteSettings, onNavigate: handleSetView}} isLoading={isContentLoading} />;
           case 'accountSettings':
               if (isAuthLoading) return <LoadingSpinner />;
               return currentUser ? (
                    <AccountSettingsPage 
                        user={currentUser}
                        onUpdateProfile={async (p) => {
                            const updatedProfiles = currentUser.profiles.map(prof => prof.id === p.id ? p : prof);
                            if (!currentUser.profiles.find(prof => prof.id === p.id)) {
                                updatedProfiles.push(p);
                            }
                            const updatedUser = { ...currentUser, profiles: updatedProfiles };
                            setCurrentUser(updatedUser);
                            if (activeProfile?.id === p.id) setActiveProfile(p);
                            await updateUserProfileInFirestore(currentUser.id, { profiles: updatedProfiles });
                            addToast('تم تحديث الملف الشخصي', 'success');
                        }}
                        onDeleteProfile={async (pid) => {
                            const updatedProfiles = currentUser.profiles.filter(p => p.id !== pid);
                            setCurrentUser({ ...currentUser, profiles: updatedProfiles });
                            await updateUserProfileInFirestore(currentUser.id, { profiles: updatedProfiles });
                            if (activeProfile?.id === pid) setActiveProfile(null);
                             addToast('تم حذف الملف الشخصي', 'success');
                        }}
                        onUpdatePassword={async (oldP, newP) => {
                             try {
                                 const cred = firebase.auth.EmailAuthProvider.credential(currentUser.email, oldP);
                                 await auth.currentUser?.reauthenticateWithCredential(cred);
                                 await auth.currentUser?.updatePassword(newP);
                                 addToast('تم تغيير كلمة المرور', 'success');
                                 return true;
                             } catch (e) {
                                 addToast('كلمة المرور القديمة غير صحيحة', 'error');
                                 return false;
                             }
                        }}
                        onDeleteAccount={async () => {
                            if (confirm('هل أنت متأكد؟')) {
                                await deleteUserFromFirestore(currentUser.id);
                                await auth.currentUser?.delete();
                                handleSetView('home');
                                addToast('تم حذف الحساب', 'info');
                            }
                        }}
                        onSetView={handleSetView}
                    />
               ) : <LoginModal onSetView={handleSetView} onLogin={handleLogin} isRamadanTheme={isRamadanTheme} isEidTheme={isEidTheme} isCosmicTealTheme={isCosmicTealTheme} isNetflixRedTheme={isNetflixRedTheme} />;
            case 'profileHub':
                if (isAuthLoading) return <LoadingSpinner />;
                return (currentUser && activeProfile) ? (
                    <ProfileHubPage 
                        user={currentUser}
                        activeProfile={activeProfile}
                        onSetView={handleSetView}
                        onLogout={handleLogout}
                    />
                ) : <LoginModal onSetView={handleSetView} onLogin={handleLogin} isRamadanTheme={isRamadanTheme} isEidTheme={isEidTheme} isCosmicTealTheme={isCosmicTealTheme} isNetflixRedTheme={isNetflixRedTheme} />;
            case 'privacy':
                return <PrivacyPolicyPage content={siteSettings.privacyPolicy} onSetView={handleSetView} />;
            case 'copyright':
                return <CopyrightPage content={siteSettings.copyrightPolicy} onSetView={handleSetView} />;
            case 'about':
                return <AboutPage onSetView={handleSetView} />;
          default:
              return <HomePage {...{allContent, pinnedContent: [], onSelectContent: handleSelectContent, isLoggedIn: !!currentUser, myList: activeProfile?.myList, onToggleMyList: handleToggleMyList, ads, siteSettings, onNavigate: handleSetView}} isLoading={isContentLoading} />;
      }
  };

  return (
    // FIX: Remove bottom padding (pb-16) when in detail view to avoid empty footer space
    <div className={`min-h-screen text-white font-['Cairo'] ${view === 'detail' ? '' : 'pb-16 md:pb-0'}`}>
        {/* Toast Container */}
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
            {toasts.map(toast => (
                <div 
                    key={toast.id} 
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg animate-fade-in-up transition-all duration-300 
                        ${toast.type === 'success' ? 'bg-green-600 text-white' : 
                          toast.type === 'error' ? 'bg-red-600 text-white' : 
                          'bg-blue-600 text-white'}`}
                >
                    {toast.type === 'success' ? <CheckCircleIcon /> : toast.type === 'error' ? <ExclamationCircleIcon /> : null}
                    <span className="text-sm font-bold">{toast.message}</span>
                </div>
            ))}
        </div>

        {!isAuthLoading && view !== 'login' && view !== 'register' && view !== 'profileSelector' && view !== 'admin' && view !== 'myList' && view !== 'accountSettings' && !siteSettings.is_maintenance_mode_enabled && (
            <Header 
                onSetView={handleSetView} 
                currentUser={currentUser} 
                activeProfile={activeProfile} 
                onLogout={handleLogout} 
                allContent={allContent}
                onSelectContent={handleSelectContent}
                currentView={view}
                isRamadanTheme={siteSettings.activeTheme === 'ramadan'}
                isEidTheme={siteSettings.activeTheme === 'eid'}
                isCosmicTealTheme={siteSettings.activeTheme === 'cosmic-teal'}
                isNetflixRedTheme={siteSettings.activeTheme === 'netflix-red'}
                returnView={returnView}
            />
        )}
        
        {renderView()}

        {!isAuthLoading && view !== 'login' && view !== 'register' && view !== 'profileSelector' && view !== 'admin' && view !== 'detail' && !siteSettings.is_maintenance_mode_enabled && (
            <>
                <Footer 
                    socialLinks={siteSettings.socialLinks} 
                    onSetView={handleSetView} 
                    isRamadanFooter={siteSettings.activeTheme === 'ramadan'}
                />
                <BottomNavigation 
                    currentView={view} 
                    onSetView={handleSetView} 
                    activeProfile={activeProfile} 
                    isLoggedIn={!!currentUser}
                    isRamadanTheme={siteSettings.activeTheme === 'ramadan'}
                    isEidTheme={siteSettings.activeTheme === 'eid'}
                    isCosmicTealTheme={siteSettings.activeTheme === 'cosmic-teal'}
                    isNetflixRedTheme={siteSettings.activeTheme === 'netflix-red'}
                />
                <PWAInstallPrompt />
            </>
        )}
    </div>
  );
};

export default App;
