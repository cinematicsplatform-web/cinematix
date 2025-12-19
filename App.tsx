import React, { useState, useCallback, useEffect, useLayoutEffect, useRef } from 'react';
// FIX: Switched to Firebase v8 compatible namespaced imports.
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
// Note: firestore is imported via db from ./firebase

import { db, auth, getUserProfile, updateUserProfileInFirestore, createUserProfileInFirestore, deleteUserFromFirestore, getSiteSettings, getAds, getUsers, updateSiteSettings as updateSiteSettingsInDb, addAd, updateAd, deleteAd, getPinnedContent, updatePinnedContentForPage, getTop10Content, updateTop10ContentForPage, requestNotificationPermission, getAllContent } from './firebase'; 
import type { Content, User, Profile, Ad, PinnedItem, SiteSettings, View, LoginError, PinnedContentState, Top10State, PageKey } from './types';
import { UserRole, triggerSelectors } from './types';
import { initialSiteSettings, defaultAvatar, pinnedContentData as initialPinned, top10ContentData as initialTop10 } from './data';

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
import ProfileHubPage from './components/ProfileHubPage';
import MaintenancePage from './components/MaintenancePage';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import AdPlacement from './components/AdPlacement';
import AdZone from './components/AdZone'; 
import RequestContentModal from './components/RequestContentModal';
import EpisodeWatchPage from './components/EpisodeWatchPage';
import SearchPage from './components/SearchPage';

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

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

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
    '/maintenance': 'maintenance',
    '/search': 'search'
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
    'maintenance': '/maintenance',
    'search': '/search'
};

const safeHistoryPush = (path: string) => {
    try {
        if (window.location.protocol === 'blob:') return;
        if (window.location.protocol !== 'file:' && window.location.origin !== 'null') {
             window.history.pushState({}, '', path);
        }
    } catch (e) {}
};

const safeHistoryReplace = (path: string) => {
    try {
        if (window.location.protocol === 'blob:') return;
        if (window.location.protocol !== 'file:' && window.location.origin !== 'null') {
            window.history.replaceState({}, '', path);
        }
    } catch (e) {}
};

const App: React.FC = () => {
  
  const getInitialView = (): View => {
      const path = decodeURIComponent(window.location.pathname);
      const normalizedPath = path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
      
      if (VIEW_PATHS[normalizedPath]) return VIEW_PATHS[normalizedPath];
      if (normalizedPath.startsWith('/category/')) return 'category';
      if (normalizedPath.match(/^\/مشاهدة\//)) return 'watch';
      if (normalizedPath.match(/^\/(?:series|مسلسل|movie|فيلم)\/([^\/]+)/)) return 'detail';
      return 'home';
  };

  const [view, setView] = useState<View>(getInitialView);
  const scrollPositions = useRef<Record<string, number>>({});
  const prevViewRef = useRef<View>(getInitialView());
  const [returnView, setReturnView] = useState<View>('home');
  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
      const path = decodeURIComponent(window.location.pathname);
      if (path.startsWith('/category/')) return path.split('/category/')[1];
      return '';
  });

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [watchParams, setWatchParams] = useState<{ season: number, episode: number } | null>(null);
  const [detailParams, setDetailParams] = useState<{ seasonNumber: number } | null>(null);
  
  const [allContent, setAllContent] = useState<Content[]>([]);
  const [pinnedItems, setPinnedItems] = useState<PinnedContentState>(initialPinned);
  const [top10Items, setTop10Items] = useState<Top10State>(initialTop10);
  
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(() => {
      let settings = initialSiteSettings;
      try {
          const savedRamadan = localStorage.getItem('cinematix_theme_ramadan');
          const savedTheme = localStorage.getItem('cinematix_active_theme');
          if (savedTheme) settings = { ...settings, activeTheme: savedTheme as any };
          else if (savedRamadan !== null) settings = { ...settings, isRamadanModeEnabled: savedRamadan === 'true', activeTheme: savedRamadan === 'true' ? 'ramadan' : 'default' };
      } catch (e) {}
      return settings;
  });

  const [ads, setAds] = useState<Ad[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isContentLoading, setIsContentLoading] = useState(true);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  useEffect(() => {
      if (activeProfile?.isKid) {
          const allowedKidsViews: View[] = ['kids', 'detail', 'watch', 'profileSelector', 'accountSettings', 'profileHub', 'myList', 'maintenance', 'search'];
          if (!allowedKidsViews.includes(view)) {
              setView('kids');
              safeHistoryReplace('/kids');
          }
      }
  }, [activeProfile, view]);

  useEffect(() => {
      if (!siteSettings.adsEnabled) return;
      const handleSmartPopunder = (e: MouseEvent) => {
          const activePopunders = ads.filter(a => a.placement === 'global-popunder' && a.status === 'active');
          const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
          const isMobile = /android|iPad|iPhone|iPod/i.test(userAgent) || window.innerWidth <= 768;
          activePopunders.forEach(ad => {
              const targetDevice = ad.targetDevice || 'all';
              if (targetDevice === 'mobile' && !isMobile) return;
              if (targetDevice === 'desktop' && isMobile) return;
              const lastRun = localStorage.getItem(`popunder_last_run_${ad.id}`);
              const now = Date.now();
              const oneDay = 24 * 60 * 60 * 1000;
              if (lastRun && (now - parseInt(lastRun) < oneDay)) return; 
              const triggerKey = ad.triggerTarget || 'all';
              const selector = triggerSelectors[triggerKey];
              const targetElement = (e.target as Element).closest(selector);
              if (targetElement) {
                  const div = document.createElement('div');
                  div.style.display = 'none';
                  div.className = `smart-popunder-${ad.id}`;
                  try {
                      const range = document.createRange();
                      const fragment = range.createContextualFragment(ad.code || '');
                      div.appendChild(fragment);
                      document.body.appendChild(div);
                      localStorage.setItem(`popunder_last_run_${ad.id}`, now.toString());
                  } catch (err) {}
              }
          });
      };
      window.addEventListener('click', handleSmartPopunder); 
      return () => window.removeEventListener('click', handleSmartPopunder);
  }, [ads, siteSettings.adsEnabled]);

  useEffect(() => {
      if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
  }, []);

  useLayoutEffect(() => {
      const prevView = prevViewRef.current;
      if (view === 'detail' || view === 'watch') window.scrollTo({ top: 0, left: 0, behavior: 'instant' as any });
      else if (prevView === 'detail' || prevView === 'watch') {
          const savedPosition = scrollPositions.current[view];
          window.scrollTo({ top: savedPosition || 0, left: 0, behavior: 'instant' as any });
      } else window.scrollTo({ top: 0, left: 0, behavior: 'instant' as any });
      prevViewRef.current = view;
  }, [view, selectedContent]); 

  const resolveContentFromUrl = useCallback((path: string, contentList: Content[]) => {
      const decodedPath = decodeURIComponent(path);
      const watchMatch = decodedPath.match(/^\/مشاهدة\/([^\/]+)\/الموسم\/(\d+)\/الحلقة\/(\d+)/);
      if (watchMatch) {
          const slug = watchMatch[1];
          const season = parseInt(watchMatch[2]);
          const episode = parseInt(watchMatch[3]);
          const foundContent = contentList.find(c => (c.slug === slug) || (c.id === slug));
          if (foundContent) {
              setSelectedContent(foundContent);
              setWatchParams({ season, episode });
              setView('watch');
              return;
          }
      }
      const match = decodedPath.match(/^\/(?:series|مسلسل|movie|فيلم)\/([^\/]+)/);
      if (match && match[1]) {
          const slug = match[1];
          const foundContent = contentList.find(c => (c.slug === slug) || (c.id === slug));
          if (foundContent) {
              setSelectedContent(foundContent);
              setView('detail');
          } else if (contentList.length > 0) {
              setView('home');
              safeHistoryReplace('/');
          }
      }
  }, []);

  useEffect(() => {
      const handlePopState = () => {
          const newView = getInitialView();
          if (isSearchOpen) { setIsSearchOpen(false); return; }
          setView(newView); 
          const path = decodeURIComponent(window.location.pathname);
          if (path.startsWith('/category/')) setSelectedCategory(path.split('/category/')[1]);
          if ((newView === 'detail' || newView === 'watch') && allContent.length > 0) resolveContentFromUrl(window.location.pathname, allContent);
      };
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
  }, [allContent, resolveContentFromUrl, isSearchOpen]);

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
          const [contentList, settings, adsList, pinnedData, top10Data] = await Promise.all([
              getAllContent(),
              getSiteSettings(),
              getAds(),
              getPinnedContent(),
              getTop10Content()
          ]);
          setAllContent(contentList);
          setSiteSettings(prev => ({...settings, activeTheme: settings.activeTheme || 'default'}));
          setAds(adsList);
          setPinnedItems(pinnedData);
          setTop10Items(top10Data);
      } catch (error) {
          console.error("Error fetching data", error);
      } finally {
          setIsContentLoading(false);
      }
  }, []);

  useEffect(() => {
      const hideLoader = () => {
        const preloader = document.getElementById('preloader');
        if (preloader && !preloader.classList.contains('preloader-hidden')) {
            preloader.classList.add('preloader-hidden');
            setTimeout(() => { if (preloader) preloader.style.display = 'none'; }, 500);
        }
      };
      const isHomePage = window.location.pathname === '/';
      if (!isHomePage) { hideLoader(); fetchData(); return; }
      const safetyTimer = setTimeout(() => { hideLoader(); }, 3000);
      fetchData().finally(() => { clearTimeout(safetyTimer); hideLoader(); });
  }, [fetchData]);
  
  useEffect(() => {
      if (allContent.length > 0) resolveContentFromUrl(window.location.pathname, allContent);
  }, [allContent, resolveContentFromUrl]);

  useEffect(() => {
      const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
          try {
              if (firebaseUser) {
                  requestNotificationPermission(firebaseUser.uid);
                  const profile = await getUserProfile(firebaseUser.uid);
                  if (profile) {
                      const user: User = { id: firebaseUser.uid, email: firebaseUser.email || '', role: profile.role || UserRole.User, profiles: profile.profiles || [], firstName: profile.firstName, lastName: profile.lastName };
                      setCurrentUser(user);
                      const savedProfileId = localStorage.getItem('cinematix_active_profile');
                      if (savedProfileId) {
                          const savedProfile = user.profiles.find(p => p.id === Number(savedProfileId));
                          if (savedProfile) setActiveProfile(savedProfile);
                      }
                      if (user.role === UserRole.Admin) {
                           const usersList = await getUsers();
                           setAllUsers(usersList);
                      }
                  }
              } else { setCurrentUser(null); setActiveProfile(null); localStorage.removeItem('cinematix_active_profile'); }
          } finally { setIsAuthLoading(false); }
      });
      return () => unsubscribe();
  }, []);

  const handleSetView = (newView: View, category?: string, params?: any) => {
      if (view !== 'detail' && view !== 'watch') scrollPositions.current[view] = window.scrollY;
      setView(newView);
      if (category) setSelectedCategory(category);
      if (newView === 'watch' && params) {
          setWatchParams(params);
          setDetailParams(null);
          if (selectedContent) safeHistoryPush(`/مشاهدة/${selectedContent.slug || selectedContent.id}/الموسم/${params.season}/الحلقة/${params.episode}`);
      } else {
          if (newView !== 'watch') setWatchParams(null);
          let path = REVERSE_VIEW_PATHS[newView];
          if (newView === 'category' && category) path = `/category/${category}`;
          if (newView === 'detail' && selectedContent) {
              const slug = selectedContent.slug || selectedContent.id;
              path = `${selectedContent.type === 'series' ? '/مسلسل/' : '/فيلم/'}${slug}`;
              if (selectedContent.type === 'series') {
                  const sNum = params?.season || detailParams?.seasonNumber || 1;
                  path += `/الموسم/${sNum}`;
                  if (!detailParams || detailParams.seasonNumber !== sNum) setDetailParams({ seasonNumber: sNum });
              }
          } else if (newView !== 'detail') setDetailParams(null);
          if (path && window.location.pathname !== path) safeHistoryPush(path);
      }
  };

  const handleSelectContent = (content: Content, seasonNumber?: number, episodeNumber?: number) => {
      if (isSearchOpen) setIsSearchOpen(false);
      scrollPositions.current[view] = window.scrollY;
      if (view !== 'detail') setReturnView(view);
      setSelectedContent(content);
      const slug = content.slug || content.id;
      if (content.type === 'series') {
          let targetSeason = seasonNumber;
          if (!targetSeason && content.seasons && content.seasons.length > 0) targetSeason = [...content.seasons].sort((a, b) => b.seasonNumber - a.seasonNumber)[0].seasonNumber;
          if (!targetSeason) targetSeason = 1; 
          if (episodeNumber) {
              setWatchParams({ season: targetSeason, episode: episodeNumber });
              setDetailParams(null);
              setView('watch');
              safeHistoryPush(`/مشاهدة/${slug}/الموسم/${targetSeason}/الحلقة/${episodeNumber}`);
          } else {
              setDetailParams({ seasonNumber: targetSeason });
              setView('detail');
              safeHistoryPush(`/مسلسل/${slug}/الموسم/${targetSeason}`);
          }
      } else { setDetailParams(null); setView('detail'); safeHistoryPush(`/فيلم/${slug}`); }
  };

  const handleLogin = async (email: string, pass: string): Promise<LoginError> => {
      try { await auth.signInWithEmailAndPassword(email, pass); return 'none'; }
      catch (error: any) { return (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') ? error.code.replace('auth/', '') as any : 'userNotFound'; }
  };

  const handleRegister = async (newUser: Omit<User, 'id' | 'role' | 'profiles'>) => {
      try {
          const cred = await auth.createUserWithEmailAndPassword(newUser.email, newUser.password || '');
          if (cred.user) {
               const defaultProfile: Profile = { id: Date.now(), name: newUser.firstName || 'المستخدم', avatar: defaultAvatar, isKid: false, watchHistory: [], myList: [] };
               // FIX: Removed 'role' property from the object literal because createUserProfileInFirestore expects Omit<User, 'id' | 'role' | 'password'>.
               await createUserProfileInFirestore(cred.user.uid, { firstName: newUser.firstName, lastName: newUser.lastName, email: newUser.email, profiles: [defaultProfile] });
               addToast('تم إنشاء الحساب بنجاح!', 'success');
               handleSetView('profileSelector');
          }
      } catch (error: any) { addToast(error.message, 'error'); }
  };

  const handleLogout = async () => { localStorage.removeItem('cinematix_active_profile'); await auth.signOut(); setCurrentUser(null); setActiveProfile(null); handleSetView('home'); addToast('تم تسجيل الخروج.', 'info'); };
  const handleProfileSelect = (profile: Profile) => { localStorage.setItem('cinematix_active_profile', String(profile.id)); setActiveProfile(profile); if (profile.isKid) handleSetView('kids'); else handleSetView('home'); };
  const handleToggleMyList = async (contentId: string) => {
      if (!currentUser || !activeProfile) { handleSetView('login'); return; }
      const currentList = activeProfile.myList || [];
      const newList = currentList.includes(contentId) ? currentList.filter(id => id !== contentId) : [...currentList, contentId];
      if (!currentList.includes(contentId)) addToast('تمت الإضافة إلى القائمة', 'success');
      const updatedProfile = { ...activeProfile, myList: newList };
      setActiveProfile(updatedProfile);
      const updatedProfiles = currentUser.profiles.map(p => p.id === activeProfile.id ? updatedProfile : p);
      setCurrentUser({ ...currentUser, profiles: updatedProfiles });
      await updateUserProfileInFirestore(currentUser.id, { profiles: updatedProfiles });
  };

  // --- Missing Admin Handlers ---
  // FIX: Added the following functions which were being passed as props to AdminPanel but were not defined: handleUpdateSiteSettings, handleUpdatePinnedItems, handleUpdateTop10Items, handleUpdateAd, handleDeleteAd, handleAddAd, handleAddAdmin, and handleDeleteUser.

  const handleUpdateSiteSettings = async (settings: SiteSettings) => {
      try {
          await updateSiteSettingsInDb(settings);
          setSiteSettings(settings);
          addToast('تم حفظ الإعدادات بنجاح', 'success');
      } catch (e) {
          addToast('فشل حفظ الإعدادات', 'error');
      }
  };

  const handleUpdatePinnedItems = async (pageKey: PageKey, items: PinnedItem[]) => {
      try {
          await updatePinnedContentForPage(pageKey, items);
          setPinnedItems(prev => ({ ...prev, [pageKey]: items }));
          addToast('تم تحديث المحتوى المثبت', 'success');
      } catch (e) {
          addToast('فشل التحديث', 'error');
      }
  };

  const handleUpdateTop10Items = async (pageKey: PageKey, items: PinnedItem[]) => {
      try {
          await updateTop10ContentForPage(pageKey, items);
          setTop10Items(prev => ({ ...prev, [pageKey]: items }));
          addToast('تم تحديث قائمة التوب 10', 'success');
      } catch (e) {
          addToast('فشل التحديث', 'error');
      }
  };

  const handleUpdateAd = async (ad: Ad) => {
      try {
          await updateAd(ad.id, ad);
          setAds(prev => prev.map(a => a.id === ad.id ? ad : a));
          addToast('تم تحديث الإعلان', 'success');
      } catch (e) {
          addToast('فشل تحديث الإعلان', 'error');
      }
  };

  const handleDeleteAd = async (adId: string) => {
      try {
          await deleteAd(adId);
          setAds(prev => prev.filter(a => a.id !== adId));
          addToast('تم حذف الإعلان', 'success');
      } catch (e) {
          addToast('فشل حذف الإعلان', 'error');
      }
  };

  const handleAddAd = async (adData: Omit<Ad, 'id' | 'updatedAt'>) => {
      try {
          const id = await addAd(adData);
          const newAd: Ad = { ...adData, id, updatedAt: new Date().toISOString() };
          setAds(prev => [newAd, ...prev]);
          addToast('تم إضافة الإعلان بنجاح', 'success');
      } catch (e) {
          addToast('فشل إضافة الإعلان', 'error');
      }
  };

  const handleAddAdmin = async (newAdmin: Omit<User, 'id' | 'role' | 'profiles'>) => {
      try {
          const cred = await auth.createUserWithEmailAndPassword(newAdmin.email, newAdmin.password || '');
          if (cred.user) {
              const defaultProfile: Profile = { id: Date.now(), name: newAdmin.firstName || 'المسؤول', avatar: defaultAvatar, isKid: false, watchHistory: [], myList: [] };
              await createUserProfileInFirestore(cred.user.uid, { firstName: newAdmin.firstName, email: newAdmin.email, profiles: [defaultProfile] });
              await updateUserProfileInFirestore(cred.user.uid, { role: UserRole.Admin });
              addToast('تم إضافة المسؤول بنجاح!', 'success');
              const usersList = await getUsers();
              setAllUsers(usersList);
          }
      } catch (error: any) {
          addToast(error.message, 'error');
          throw error;
      }
  };

  const handleDeleteUser = async (userId: string) => {
      try {
          await deleteUserFromFirestore(userId);
          setAllUsers(prev => prev.filter(u => u.id !== userId));
          addToast('تم حذف المستخدم بنجاح', 'success');
      } catch (e) {
          addToast('فشل حذف المستخدم', 'error');
      }
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

      if (isMaintenance && !isAdmin) {
          if (view === 'login') return <LoginModal onSetView={handleSetView} onLogin={handleLogin} isRamadanTheme={isRamadanTheme} isEidTheme={isEidTheme} isCosmicTealTheme={isCosmicTealTheme} isNetflixRedTheme={isNetflixRedTheme} />;
          return <MaintenancePage socialLinks={siteSettings.socialLinks} onSetView={handleSetView} />;
      }
      if (!isAuthLoading && currentUser && !activeProfile && view !== 'profileSelector' && view !== 'accountSettings' && view !== 'admin') return <ProfileSelector user={currentUser} onSelectProfile={handleProfileSelect} onSetView={handleSetView} />;

      const getContentWithMeta = (items: PinnedItem[]) => items.map((p): Content | null => {
          const content = allContent.find(c => c.id === p.contentId);
          if (!content) return null;
          let finalContent = { ...content };
          if (content.type === 'series' && content.seasons && content.seasons.length > 0) {
              const latestSeason = [...content.seasons].sort((a, b) => b.seasonNumber - a.seasonNumber)[0];
              if (latestSeason) {
                  if (latestSeason.poster) finalContent.poster = latestSeason.poster;
                  if (latestSeason.backdrop) finalContent.backdrop = latestSeason.backdrop;
                  if (latestSeason.logoUrl) { finalContent.logoUrl = latestSeason.logoUrl; finalContent.isLogoEnabled = true; }
                  if (latestSeason.description) finalContent.description = latestSeason.description;
                  if (latestSeason.releaseYear) finalContent.releaseYear = latestSeason.releaseYear;
              }
          }
          return { ...finalContent, bannerNote: p.bannerNote || finalContent.bannerNote };
      }).filter((c): c is Content => !!c);

      const getPinnedContentWithMeta = (page: PageKey) => getContentWithMeta(pinnedItems[page]);
      const getTop10ContentWithMeta = (page: PageKey) => getContentWithMeta(top10Items[page]);

      switch (view) {
          case 'home': return <HomePage allContent={allContent} pinnedContent={getPinnedContentWithMeta('home')} top10Content={getTop10ContentWithMeta('home')} onSelectContent={handleSelectContent} isLoggedIn={!!currentUser} myList={activeProfile?.myList} onToggleMyList={handleToggleMyList} ads={ads} siteSettings={siteSettings} onNavigate={handleSetView} isLoading={isContentLoading} isRamadanTheme={isRamadanTheme} isEidTheme={isEidTheme} isCosmicTealTheme={isCosmicTealTheme} isNetflixRedTheme={isNetflixRedTheme} activeProfile={activeProfile} />;
          case 'movies': return <MoviesPage allContent={allContent} pinnedContent={getPinnedContentWithMeta('movies')} top10Content={getTop10ContentWithMeta('movies')} onSelectContent={handleSelectContent} isLoggedIn={!!currentUser} myList={activeProfile?.myList} onToggleMyList={handleToggleMyList} ads={ads} adsEnabled={siteSettings.adsEnabled} onNavigate={handleSetView} isLoading={isContentLoading} isRamadanTheme={isRamadanTheme} isEidTheme={isEidTheme} isCosmicTealTheme={isCosmicTealTheme} isNetflixRedTheme={isNetflixRedTheme} siteSettings={siteSettings} />;
          case 'series': return <SeriesPage allContent={allContent} pinnedContent={getPinnedContentWithMeta('series')} top10Content={getTop10ContentWithMeta('series')} onSelectContent={handleSelectContent} isLoggedIn={!!currentUser} myList={activeProfile?.myList} onToggleMyList={handleToggleMyList} ads={ads} adsEnabled={siteSettings.adsEnabled} siteSettings={siteSettings} onNavigate={handleSetView} isLoading={isContentLoading} isRamadanTheme={isRamadanTheme} isEidTheme={isEidTheme} isCosmicTealTheme={isCosmicTealTheme} isNetflixRedTheme={isNetflixRedTheme} />;
          case 'kids': return <KidsPage allContent={allContent} pinnedContent={getPinnedContentWithMeta('kids')} top10Content={getTop10ContentWithMeta('kids')} onSelectContent={handleSelectContent} isLoggedIn={!!currentUser} myList={activeProfile?.myList} onToggleMyList={handleToggleMyList} ads={ads} adsEnabled={siteSettings.adsEnabled} onNavigate={handleSetView} isLoading={isContentLoading} isRamadanTheme={isRamadanTheme} isEidTheme={isEidTheme} isCosmicTealTheme={isCosmicTealTheme} isNetflixRedTheme={isNetflixRedTheme} />;
          case 'ramadan': return <RamadanPage allContent={allContent} pinnedContent={getPinnedContentWithMeta('ramadan')} top10Content={getTop10ContentWithMeta('ramadan')} onSelectContent={handleSelectContent} isLoggedIn={!!currentUser} myList={activeProfile?.myList} onToggleMyList={handleToggleMyList} ads={ads} adsEnabled={siteSettings.adsEnabled} siteSettings={siteSettings} onNavigate={handleSetView} isLoading={isContentLoading} />;
          case 'soon': return <SoonPage allContent={allContent} pinnedContent={getPinnedContentWithMeta('soon')} onSelectContent={handleSelectContent} isLoggedIn={!!currentUser} myList={activeProfile?.myList} onToggleMyList={handleToggleMyList} ads={ads} adsEnabled={siteSettings.adsEnabled} isLoading={isContentLoading} isRamadanTheme={isRamadanTheme} isEidTheme={isEidTheme} isCosmicTealTheme={isCosmicTealTheme} isNetflixRedTheme={isNetflixRedTheme} />;
          case 'detail':
               // UPDATED: Always render the DetailPage component shell to avoid full-screen flickering bar
               // The component handles empty state gracefully or displays data if already resolved
               return selectedContent ? (
                   <DetailPage 
                        key={window.location.pathname}
                        locationPath={window.location.pathname}
                        content={selectedContent}
                        initialSeasonNumber={detailParams?.seasonNumber}
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
               ) : (isContentLoading ? <LoadingSpinner /> : <HomePage allContent={allContent} pinnedContent={[]} onSelectContent={handleSelectContent} isLoggedIn={!!currentUser} myList={activeProfile?.myList} onToggleMyList={handleToggleMyList} ads={ads} siteSettings={siteSettings} onNavigate={handleSetView} activeProfile={activeProfile} isLoading={isContentLoading} />);
          case 'watch':
               // UPDATED: Same immediate rendering logic for watch page
               return (selectedContent && watchParams) ? (
                   <EpisodeWatchPage 
                       content={selectedContent}
                       seasonNumber={watchParams.season}
                       episodeNumber={watchParams.episode}
                       allContent={allContent}
                       onSetView={handleSetView}
                       ads={ads}
                       adsEnabled={siteSettings.adsEnabled}
                       isRamadanTheme={isRamadanTheme}
                       isEidTheme={isEidTheme}
                       isCosmicTealTheme={isCosmicTealTheme}
                       isNetflixRedTheme={isNetflixRedTheme}
                   />
               ) : <LoadingSpinner />;
           case 'login': if (isAuthLoading) return <LoadingSpinner />; return <LoginModal onSetView={handleSetView} onLogin={handleLogin} isRamadanTheme={isRamadanTheme} isEidTheme={isEidTheme} isCosmicTealTheme={isCosmicTealTheme} isNetflixRedTheme={isNetflixRedTheme} />;
           case 'register': if (isAuthLoading) return <LoadingSpinner />; return <CreateAccountPage onSetView={handleSetView} onRegister={handleRegister} isRamadanTheme={isRamadanTheme} isEidTheme={isEidTheme} isCosmicTealTheme={isCosmicTealTheme} isNetflixRedTheme={isNetflixRedTheme} />;
           case 'profileSelector': if (isAuthLoading) return <LoadingSpinner />; return currentUser ? <ProfileSelector user={currentUser} onSelectProfile={handleProfileSelect} onSetView={handleSetView} /> : <LoginModal onSetView={handleSetView} onLogin={handleLogin} isRamadanTheme={isRamadanTheme} isEidTheme={isEidTheme} isCosmicTealTheme={isCosmicTealTheme} isNetflixRedTheme={isNetflixRedTheme} />;
           case 'myList': if (isAuthLoading) return <LoadingSpinner />; return activeProfile ? <MyListPage allContent={allContent} activeProfile={activeProfile} onSelectContent={handleSelectContent} isLoggedIn={!!currentUser} myList={activeProfile.myList} onToggleMyList={handleToggleMyList} onSetView={handleSetView} isRamadanTheme={isRamadanTheme} isEidTheme={isEidTheme} isCosmicTealTheme={isCosmicTealTheme} isNetflixRedTheme={isNetflixRedTheme} /> : <LoginModal onSetView={handleSetView} onLogin={handleLogin} isRamadanTheme={isRamadanTheme} isEidTheme={isEidTheme} isCosmicTealTheme={isCosmicTealTheme} isNetflixRedTheme={isNetflixRedTheme} />;
           case 'category': return <CategoryPage categoryTitle={selectedCategory} allContent={allContent} onSelectContent={handleSelectContent} isLoggedIn={!!currentUser} myList={activeProfile?.myList} onToggleMyList={handleToggleMyList} onSetView={handleSetView} isRamadanTheme={isRamadanTheme} isEidTheme={isEidTheme} isCosmicTealTheme={isCosmicTealTheme} isNetflixRedTheme={isNetflixRedTheme} ads={ads} adsEnabled={siteSettings.adsEnabled} onRequestOpen={() => setIsRequestModalOpen(true)} />;
           case 'admin': if (isAuthLoading) return <LoadingSpinner />; return isAdmin ? <AdminPanel allUsers={allUsers} allAds={ads} pinnedItems={pinnedItems} top10Items={top10Items} siteSettings={siteSettings} onSetSiteSettings={handleUpdateSiteSettings} onSetPinnedItems={handleUpdatePinnedItems} onSetTop10Items={handleUpdateTop10Items} onSetView={handleSetView} onUpdateAd={handleUpdateAd} onDeleteAd={handleDeleteAd} onAddAd={handleAddAd} onAddAdmin={handleAddAdmin} onDeleteUser={handleDeleteUser} onContentChanged={fetchData} addToast={addToast} /> : <HomePage allContent={allContent} pinnedContent={[]} onSelectContent={handleSelectContent} isLoggedIn={!!currentUser} myList={activeProfile?.myList} onToggleMyList={handleToggleMyList} ads={ads} siteSettings={siteSettings} onNavigate={handleSetView} activeProfile={activeProfile} isLoading={isContentLoading} />;
           case 'accountSettings': if (isAuthLoading) return <LoadingSpinner />; return currentUser ? <AccountSettingsPage user={currentUser} onUpdateProfile={async (p) => { const updatedProfiles = currentUser.profiles.map(prof => prof.id === p.id ? p : prof); if (!currentUser.profiles.find(prof => prof.id === p.id)) updatedProfiles.push(p); const updatedUser = { ...currentUser, profiles: updatedProfiles }; setCurrentUser(updatedUser); if (activeProfile?.id === p.id) setActiveProfile(p); await updateUserProfileInFirestore(currentUser.id, { profiles: updatedProfiles }); addToast('تم تحديث الملف الشخصي', 'success'); }} onDeleteProfile={async (pid) => { const updatedProfiles = currentUser.profiles.filter(p => p.id !== pid); setCurrentUser({ ...currentUser, profiles: updatedProfiles }); await updateUserProfileInFirestore(currentUser.id, { profiles: updatedProfiles }); if (activeProfile?.id === pid) setActiveProfile(null); addToast('تم حذف الملف الشخصي', 'success'); }} onUpdatePassword={async (oldP, newP) => { try { const cred = firebase.auth.EmailAuthProvider.credential(currentUser.email, oldP); await auth.currentUser?.reauthenticateWithCredential(cred); await auth.currentUser?.updatePassword(newP); addToast('تم تغيير كلمة المرور', 'success'); return true; } catch (e) { addToast('كلمة المرور القديمة غير صحيحة', 'error'); return false; } }} onDeleteAccount={async () => { await deleteUserFromFirestore(currentUser.id); await auth.currentUser?.delete(); handleSetView('home'); addToast('تم حذف الحساب', 'info'); }} onSetView={handleSetView} isRamadanTheme={isRamadanTheme} isEidTheme={isEidTheme} isCosmicTealTheme={isCosmicTealTheme} isNetflixRedTheme={isNetflixRedTheme} /> : <LoginModal onSetView={handleSetView} onLogin={handleLogin} isRamadanTheme={isRamadanTheme} isEidTheme={isEidTheme} isCosmicTealTheme={isCosmicTealTheme} isNetflixRedTheme={isNetflixRedTheme} />;
           case 'profileHub': if (isAuthLoading) return <LoadingSpinner />; return (currentUser && activeProfile) ? <ProfileHubPage user={currentUser} activeProfile={activeProfile} onSetView={handleSetView} onLogout={handleLogout} isRamadanTheme={isRamadanTheme} isEidTheme={isEidTheme} isCosmicTealTheme={isCosmicTealTheme} isNetflixRedTheme={isNetflixRedTheme} /> : <LoginModal onSetView={handleSetView} onLogin={handleLogin} isRamadanTheme={isRamadanTheme} isEidTheme={isEidTheme} isCosmicTealTheme={isCosmicTealTheme} isNetflixRedTheme={isNetflixRedTheme} />;
           case 'privacy': return <PrivacyPolicyPage content={siteSettings.privacyPolicy} onSetView={handleSetView} />;
           case 'copyright': return <CopyrightPage content={siteSettings.copyrightPolicy} onSetView={handleSetView} />;
           case 'about': return <AboutPage onSetView={handleSetView} />;
           case 'search': return <SearchPage allContent={allContent} onSelectContent={handleSelectContent} onSetView={handleSetView} onClose={() => handleSetView('home')} />;
          default: return <HomePage allContent={allContent} pinnedContent={[]} onSelectContent={handleSelectContent} isLoggedIn={!!currentUser} myList={activeProfile?.myList} onToggleMyList={handleToggleMyList} ads={ads} siteSettings={siteSettings} onNavigate={handleSetView} activeProfile={activeProfile} isLoading={isContentLoading} />;
      }
  };

  const fullScreenViews = ['login', 'register', 'profileSelector', 'admin', 'detail', 'maintenance', 'watch', 'search'];
  const mobileCleanViews = ['myList', 'accountSettings', 'profileHub'];
  const showGlobalFooter = !isAuthLoading && !fullScreenViews.includes(view) && !siteSettings.is_maintenance_mode_enabled;
  const showBottomNav = showGlobalFooter && !mobileCleanViews.includes(view);
  const footerClass = mobileCleanViews.includes(view) ? 'hidden md:block' : '';
  const bottomAdClass = mobileCleanViews.includes(view) ? 'hidden md:block' : 'fixed bottom-0 left-0 w-full z-[1000] bg-black/80';
  const socialBarClass = mobileCleanViews.includes(view) ? 'hidden md:block' : 'fixed z-[90] bottom-20 left-4 right-4 md:bottom-4 md:left-4 md:right-auto md:w-auto pointer-events-auto';

  return (
    <div className={`min-h-screen text-white font-['Cairo'] ${view === 'detail' || view === 'watch' ? '' : 'pb-16 md:pb-0'}`}>
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
            {toasts.map(toast => (
                <div key={toast.id} className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg animate-fade-in-up transition-all duration-300 ${toast.type === 'success' ? 'bg-green-600 text-white' : toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'}`}>
                    {toast.type === 'success' ? <CheckCircleIcon /> : toast.type === 'error' ? <ExclamationCircleIcon /> : null}
                    <span className="text-sm font-bold">{toast.message}</span>
                </div>
            ))}
        </div>
        {siteSettings.adsEnabled && <AdZone position="global_head" />}
        {!isAuthLoading && view !== 'login' && view !== 'register' && view !== 'profileSelector' && view !== 'admin' && view !== 'myList' && view !== 'accountSettings' && view !== 'category' && view !== 'profileHub' && view !== 'watch' && view !== 'search' && !siteSettings.is_maintenance_mode_enabled && (
            <Header onSetView={handleSetView} currentUser={currentUser} activeProfile={activeProfile} onLogout={handleLogout} allContent={allContent} onSelectContent={handleSelectContent} currentView={view} isRamadanTheme={siteSettings.activeTheme === 'ramadan'} isEidTheme={siteSettings.activeTheme === 'eid'} isCosmicTealTheme={siteSettings.activeTheme === 'cosmic-teal'} isNetflixRedTheme={siteSettings.activeTheme === 'netflix-red'} returnView={returnView} isKidProfile={activeProfile?.isKid} onOpenSearch={() => setIsSearchOpen(true)} />
        )}
        <AdPlacement ads={ads} placement="global-social-bar" isEnabled={siteSettings.adsEnabled} className={socialBarClass} />
        <AdPlacement ads={ads} placement="global-sticky-footer" isEnabled={siteSettings.adsEnabled} className={bottomAdClass} />
        {renderView()}
        {isSearchOpen && <SearchPage allContent={allContent} onSelectContent={handleSelectContent} onSetView={handleSetView} onClose={() => setIsSearchOpen(false)} />}
        {showGlobalFooter && (
            <>
                <Footer socialLinks={siteSettings.socialLinks} onSetView={handleSetView} isRamadanFooter={siteSettings.activeTheme === 'ramadan'} onRequestOpen={() => setIsRequestModalOpen(true)} className={footerClass} />
                {showBottomNav && ( <> <BottomNavigation currentView={view} onSetView={handleSetView} activeProfile={activeProfile} isLoggedIn={!!currentUser} isRamadanTheme={siteSettings.activeTheme === 'ramadan'} isEidTheme={siteSettings.activeTheme === 'eid'} isCosmicTealTheme={siteSettings.activeTheme === 'cosmic-teal'} isNetflixRedTheme={siteSettings.activeTheme === 'netflix-red'} /> <PWAInstallPrompt /> </> )}
            </>
        )}
        <RequestContentModal isOpen={isRequestModalOpen} onClose={() => setIsRequestModalOpen(false)} currentUser={currentUser} addToast={addToast} />
    </div>
  );
};

export default App;