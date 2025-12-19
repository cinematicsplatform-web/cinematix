


// ... imports remain the same ...
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
import RamadanRestrictedModal from './components/RamadanRestrictedModal';
import ProfileHubPage from './components/ProfileHubPage';
import MaintenancePage from './components/MaintenancePage';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import AdPlacement from './components/AdPlacement';
import AdZone from './components/AdZone'; 
import RequestContentModal from './components/RequestContentModal';
import EpisodeWatchPage from './components/EpisodeWatchPage';
import SearchPage from './components/SearchPage';

// ... (Rest of the component code, mostly unchanged until fetchData)

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

// --- Safe History Helpers ---
const safeHistoryPush = (path: string) => {
    try {
        if (window.location.protocol === 'blob:') return; // Skip for blob URLs (AI Studio Preview)
        if (window.location.protocol !== 'file:' && window.location.origin !== 'null') {
             window.history.pushState({}, '', path);
        }
    } catch (e) {
        // Sandbox environment detected - suppress warning
    }
};

const safeHistoryReplace = (path: string) => {
    try {
        if (window.location.protocol === 'blob:') return; // Skip for blob URLs (AI Studio Preview)
        if (window.location.protocol !== 'file:' && window.location.origin !== 'null') {
            window.history.replaceState({}, '', path);
        }
    } catch (e) {
        // Sandbox environment detected - suppress warning
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
      // Check for Watch Route first (more specific)
      if (normalizedPath.match(/^\/مشاهدة\//)) {
          return 'watch';
      }
      if (normalizedPath.match(/^\/(?:series|مسلسل|movie|فيلم)\/([^\/]+)/)) {
          return 'detail';
      }
      return 'home';
  };

  const [view, setView] = useState<View>(getInitialView);
  
  // 1. Memory for Scroll Positions
  const scrollPositions = useRef<Record<string, number>>({});
  const prevViewRef = useRef<View>(getInitialView());
  
  // Track previous view for Back button logic
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
  
  // New State for Watch Page Params
  const [watchParams, setWatchParams] = useState<{ season: number, episode: number } | null>(null);
  // NEW: State for Detail Page Params (Target Season)
  const [detailParams, setDetailParams] = useState<{ seasonNumber: number } | null>(null);
  
  const [allContent, setAllContent] = useState<Content[]>([]);
  const [pinnedItems, setPinnedItems] = useState<PinnedContentState>(initialPinned);
  const [top10Items, setTop10Items] = useState<Top10State>(initialTop10);
  
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
  
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  
  // --- SEARCH OVERLAY STATE ---
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  // --- FORCE KIDS MODE LOGIC ---
  useEffect(() => {
      if (activeProfile?.isKid) {
          // List of allowed views for Kids
          const allowedKidsViews: View[] = ['kids', 'detail', 'watch', 'profileSelector', 'accountSettings', 'profileHub', 'myList', 'maintenance', 'search'];
          
          if (!allowedKidsViews.includes(view)) {
              // Redirect to Kids Home if user tries to access an adult view
              console.log("Blocking adult view for Kid profile, redirecting to Kids Home");
              setView('kids');
              safeHistoryReplace('/kids');
          }
      }
  }, [activeProfile, view]);

  // --- SMART POPUNDER ENGINE ---
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

              if (lastRun && (now - parseInt(lastRun) < oneDay)) {
                  return; 
              }

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
                      console.log(`Popunder [${ad.title}] triggered on [${triggerKey}]`);
                  } catch (err) {
                      console.error("Smart Popunder Error:", err);
                  }
              }
          });
      };

      window.addEventListener('click', handleSmartPopunder); 
      return () => window.removeEventListener('click', handleSmartPopunder);

  }, [ads, siteSettings.adsEnabled]);


  useEffect(() => {
      // CRITICAL: Prevent browser from auto-restoring scroll, we handle it manually
      if ('scrollRestoration' in window.history) {
          window.history.scrollRestoration = 'manual';
      }
  }, []);

  useLayoutEffect(() => {
      const prevView = prevViewRef.current;
      
      if (view === 'detail' || view === 'watch') {
          // Always scroll to top when entering Detail or Watch page.
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' as any });
      } 
      else if (prevView === 'detail' || prevView === 'watch') {
          // Returning from Detail/Watch page: Restore previous scroll position instantly
          const savedPosition = scrollPositions.current[view];
          if (savedPosition !== undefined) {
              window.scrollTo({ top: savedPosition, left: 0, behavior: 'instant' as any });
          } else {
              window.scrollTo({ top: 0, left: 0, behavior: 'instant' as any });
          }
      } 
      else {
          // Navigation between main tabs (Home <-> Movies etc)
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' as any });
      }

      prevViewRef.current = view;
  }, [view, selectedContent]); 

  const resolveContentFromUrl = useCallback((path: string, contentList: Content[]) => {
      const decodedPath = decodeURIComponent(path);
      
      // 1. Handle Watch URL: /مشاهدة/slug/الموسم/X/الحلقة/Y
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

      // 2. Handle Detail URL (standard or deep linked to season)
      const match = decodedPath.match(/^\/(?:series|مسلسل|movie|فيلم)\/([^\/]+)/);
      if (match && match[1]) {
          const slug = match[1];
          const foundContent = contentList.find(c => (c.slug === slug) || (c.id === slug));

          if (foundContent) {
              setSelectedContent(foundContent);
              
              // New: Check if Season is present in URL, otherwise DetailPage will handle default
              const seasonMatch = decodedPath.match(/\/(?:الموسم|season)\/(\d+)/i);
              // We don't necessarily need to set state here as DetailPage parses URL, 
              // but helps keep app state roughly in sync if needed.
              
              setView('detail');
          } else {
              if (contentList.length > 0) {
                 setView('home');
                 safeHistoryReplace('/');
              }
          }
      }
  }, []);

  useEffect(() => {
      const handlePopState = () => {
          // When hitting back button
          const newView = getInitialView();
          
          if (isSearchOpen) {
              setIsSearchOpen(false);
              // Don't change view if closing search overlay
              return;
          }

          setView(newView); 
          
          const path = decodeURIComponent(window.location.pathname);
          if (path.startsWith('/category/')) {
              setSelectedCategory(path.split('/category/')[1]);
          }

          if ((newView === 'detail' || newView === 'watch') && allContent.length > 0) {
              resolveContentFromUrl(window.location.pathname, allContent);
          }
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
              getAllContent(), // Use the new safe helper
              getSiteSettings(),
              getAds(),
              getPinnedContent(),
              getTop10Content()
          ]);

          setAllContent(contentList);

          setSiteSettings(prev => ({
              ...settings,
              activeTheme: settings.activeTheme || 'default'
          }));

          setAds(adsList);
          setPinnedItems(pinnedData);
          setTop10Items(top10Data);

      } catch (error) {
          console.error("Error fetching data", error);
          // Toast is removed here to avoid spamming if permissions are missing
          // addToast("فشل في تحميل البيانات من الخادم", "error");
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
          resolveContentFromUrl(window.location.pathname, allContent);
      }
  }, [allContent, resolveContentFromUrl]);

  // ... (Rest of the component remains the same)
  // [Render Logic below is cut for brevity but kept in final output]
  // ...
  
  useEffect(() => {
      const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
          try {
              if (firebaseUser) {
                  requestNotificationPermission(firebaseUser.uid);

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


  const handleSetView = (newView: View, category?: string, params?: any) => {
      // If we are leaving a list view (like home, movies, etc), save the scroll position
      if (view !== 'detail' && view !== 'watch') {
          scrollPositions.current[view] = window.scrollY;
      }

      setView(newView);
      if (category) setSelectedCategory(category);

      // Handle Watch Params specifically
      if (newView === 'watch' && params) {
          setWatchParams(params);
          setDetailParams(null); // Clear detail params
          if (selectedContent) {
              const slug = selectedContent.slug || selectedContent.id;
              // Format: /مشاهدة/slug/الموسم/X/الحلقة/Y
              const watchPath = `/مشاهدة/${slug}/الموسم/${params.season}/الحلقة/${params.episode}`;
              safeHistoryPush(watchPath);
          }
      } 
      else {
          // Clean up watch params when leaving watch page
          if (newView !== 'watch') setWatchParams(null);
          // Note: We don't clear detailParams here automatically because renderView needs it for 'detail' view

          let path = REVERSE_VIEW_PATHS[newView];
          
          if (newView === 'category' && category) {
              path = `/category/${category}`;
          }
          
          // Reconstruct detail path if navigating back to detail (via header for example)
          if (newView === 'detail' && selectedContent) {
              const slug = selectedContent.slug || selectedContent.id;
              const prefix = selectedContent.type === 'series' ? '/مسلسل/' : '/فيلم/';
              
              path = `${prefix}${slug}`;
              
              // Series: Always enforce Season 1 if no params exist, or use last known season
              if (selectedContent.type === 'series') {
                  // Use params if passed (e.g. from header), or fallback to existing detailParams, or 1
                  const sNum = params?.season || detailParams?.seasonNumber || 1;
                  path += `/الموسم/${sNum}`;
                  // Ensure detailParams is synced if we are navigating back
                  if (!detailParams || detailParams.seasonNumber !== sNum) {
                      setDetailParams({ seasonNumber: sNum });
                  }
              }
          } else {
              // If not detail view, clear detail params
              if (newView !== 'detail') setDetailParams(null);
          }
          
          if (path) {
              if (window.location.pathname !== path) {
                safeHistoryPush(path);
              }
          }
      }
  };

  const handleSelectContent = (content: Content, seasonNumber?: number, episodeNumber?: number) => {
      if (siteSettings.isRamadanModeEnabled && content.categories.includes('رمضان')) {
          const now = new Date().getTime();
          const countdown = new Date(siteSettings.countdownDate).getTime();
          
          if (now < countdown) {
              setRestrictedContent(content);
              setIsRamadanModalOpen(true);
              return;
          }
      }
      
      // Close search if open
      if (isSearchOpen) setIsSearchOpen(false);

      // Save current scroll position before switching to detail view
      scrollPositions.current[view] = window.scrollY;

      if (view !== 'detail') {
          setReturnView(view);
      }

      setSelectedContent(content);
      const slug = content.slug || content.id;

      if (content.type === 'series') {
          // --- UPDATED SMART ROUTING LOGIC ---
          // Case 1: Specific Season (Search/Direct) -> Respect `seasonNumber`
          // Case 2: Generic Entry (Home/Carousel) -> Find `Latest Season`
          
          let targetSeason = seasonNumber;
          
          if (!targetSeason && content.seasons && content.seasons.length > 0) {
              // No specific season requested, defaults to Latest Season
              // Sort seasons descending by season number
              const sortedSeasons = [...content.seasons].sort((a, b) => b.seasonNumber - a.seasonNumber);
              targetSeason = sortedSeasons[0].seasonNumber;
          }
          
          // Fallback to 1 if essentially empty or failed
          if (!targetSeason) targetSeason = 1; 
          
          if (episodeNumber) {
              // Direct watch navigation (e.g. from search result with specific episode)
              // Path: /مشاهدة/slug/الموسم/X/الحلقة/Y
              setWatchParams({ season: targetSeason, episode: episodeNumber });
              setDetailParams(null);
              setView('watch');
              safeHistoryPush(`/مشاهدة/${slug}/الموسم/${targetSeason}/الحلقة/${episodeNumber}`);
          } else {
              // Detail View (Standard) with specific season param
              // Path: /مسلسل/slug/الموسم/X
              setDetailParams({ seasonNumber: targetSeason }); // Store specific season to pass as prop
              setView('detail');
              safeHistoryPush(`/مسلسل/${slug}/الموسم/${targetSeason}`);
          }
      } else {
          // Movie Logic
          setDetailParams(null);
          setView('detail');
          safeHistoryPush(`/فيلم/${slug}`);
      }
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
      // Determine correct landing page based on profile type
      if (profile.isKid) {
          handleSetView('kids');
      } else {
          handleSetView('home');
      }
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

  const handleUpdateTop10Items = async (page: PageKey, items: PinnedItem[]) => {
      try {
          setTop10Items(prev => ({...prev, [page]: items}));
          await updateTop10ContentForPage(page, items);
          addToast('تم تحديث قائمة التوب 10 بنجاح', 'success');
      } catch(e) {
          console.error("Failed to update top 10 items:", e);
          addToast('فشل حفظ التوب 10. تأكد من الاتصال بالإنترنت.', 'error');
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

      const getContentWithMeta = (items: PinnedItem[]) => {
          return items.map((p): Content | null => {
              const content = allContent.find(c => c.id === p.contentId);
              if (!content) return null;
              
              let finalContent = { ...content };

              if (content.type === 'series' && content.seasons && content.seasons.length > 0) {
                  const latestSeason = [...content.seasons].sort((a, b) => b.seasonNumber - a.seasonNumber)[0];
                  
                  if (latestSeason) {
                      if (latestSeason.poster) finalContent.poster = latestSeason.poster;
                      if (latestSeason.backdrop) finalContent.backdrop = latestSeason.backdrop;
                      if (latestSeason.logoUrl) {
                          finalContent.logoUrl = latestSeason.logoUrl;
                          finalContent.isLogoEnabled = true;
                      }
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

      const getPinnedContentWithMeta = (page: PageKey) => getContentWithMeta(pinnedItems[page]);
      const getTop10ContentWithMeta = (page: PageKey) => getContentWithMeta(top10Items[page]);

      switch (view) {
          case 'home':
              return <HomePage 
                        allContent={allContent} 
                        pinnedContent={getPinnedContentWithMeta('home')}
                        top10Content={getTop10ContentWithMeta('home')} // Pass top10 explicitly
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
                        activeProfile={activeProfile}
                     />;
          case 'movies':
              return <MoviesPage 
                        allContent={allContent}
                        pinnedContent={getPinnedContentWithMeta('movies')}
                        top10Content={getTop10ContentWithMeta('movies')} // Pass top10 explicitly
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
                        top10Content={getTop10ContentWithMeta('series')} // Pass top10 explicitly
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
                        top10Content={getTop10ContentWithMeta('kids')} // Pass top10 explicitly (though kids might not use it heavily)
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
                        top10Content={getTop10ContentWithMeta('ramadan')} // Pass top10 explicitly
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
                        // Soon page typically doesn't have Top 10, but interface consistency
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
                        // Use prop to pass the specific season ID
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
               ) : (isContentLoading ? (
                 <LoadingSpinner />
               ) : (
                 <HomePage {...{allContent, pinnedContent: [], top10Content: [], onSelectContent: handleSelectContent, isLoggedIn: !!currentUser, myList: activeProfile?.myList, onToggleMyList: handleToggleMyList, ads, siteSettings, onNavigate: handleSetView, activeProfile}} isLoading={isContentLoading} />
               ));
           case 'watch':
               // Render the dedicated watch page
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
                        ads={ads}
                        adsEnabled={siteSettings.adsEnabled}
                        onRequestOpen={() => setIsRequestModalOpen(true)}
                      />;
           case 'admin':
                if (isAuthLoading) return <LoadingSpinner />;
                return currentUser?.role === UserRole.Admin ? (
                    <AdminPanel 
                        allUsers={allUsers}
                        allAds={ads}
                        pinnedItems={pinnedItems}
                        top10Items={top10Items}
                        siteSettings={siteSettings}
                        onSetSiteSettings={handleUpdateSiteSettings}
                        onSetPinnedItems={handleUpdatePinnedItems}
                        onSetTop10Items={handleUpdateTop10Items}
                        onSetView={handleSetView}
                        onUpdateAd={handleUpdateAd}
                        onDeleteAd={handleDeleteAd}
                        onAddAd={handleAddAd}
                        onAddAdmin={handleAddAdmin}
                        onDeleteUser={handleDeleteUser}
                        onContentChanged={fetchData}
                        addToast={addToast}
                    />
                ) : <HomePage {...{allContent, pinnedContent: [], top10Content: [], onSelectContent: handleSelectContent, isLoggedIn: !!currentUser, myList: activeProfile?.myList, onToggleMyList: handleToggleMyList, ads, siteSettings, onNavigate: handleSetView, activeProfile}} isLoading={isContentLoading} />;
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
                            // Removed confirm here
                            await deleteUserFromFirestore(currentUser.id);
                            await auth.currentUser?.delete();
                            handleSetView('home');
                            addToast('تم حذف الحساب', 'info');
                        }}
                        onSetView={handleSetView}
                        isRamadanTheme={isRamadanTheme}
                        isEidTheme={isEidTheme}
                        isCosmicTealTheme={isCosmicTealTheme}
                        isNetflixRedTheme={isNetflixRedTheme}
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
                        isRamadanTheme={isRamadanTheme}
                        isEidTheme={isEidTheme}
                        isCosmicTealTheme={isCosmicTealTheme}
                        isNetflixRedTheme={isNetflixRedTheme}
                    />
                ) : <LoginModal onSetView={handleSetView} onLogin={handleLogin} isRamadanTheme={isRamadanTheme} isEidTheme={isEidTheme} isCosmicTealTheme={isCosmicTealTheme} isNetflixRedTheme={isNetflixRedTheme} />;
            case 'privacy':
                return <PrivacyPolicyPage content={siteSettings.privacyPolicy} onSetView={handleSetView} />;
            case 'copyright':
                return <CopyrightPage content={siteSettings.copyrightPolicy} onSetView={handleSetView} />;
            case 'about':
                return <AboutPage onSetView={handleSetView} />;
            case 'search':
                // Keeping route for backward compat, but interaction uses overlay
                return (
                    <SearchPage 
                        allContent={allContent}
                        onSelectContent={handleSelectContent}
                        onSetView={handleSetView}
                        onClose={() => handleSetView('home')} // Route fallback
                    />
                );
          default:
              return <HomePage {...{allContent, pinnedContent: [], top10Content: [], onSelectContent: handleSelectContent, isLoggedIn: !!currentUser, myList: activeProfile?.myList, onToggleMyList: handleToggleMyList, ads, siteSettings, onNavigate: handleSetView, activeProfile}} isLoading={isContentLoading} />;
      }
  };

  // ... (Rest of component)
  // Logic to determine visibility on mobile and desktop
  const fullScreenViews = ['login', 'register', 'profileSelector', 'admin', 'detail', 'maintenance', 'watch', 'search'];
  const mobileCleanViews = ['myList', 'accountSettings', 'profileHub'];
  
  const showGlobalFooter = !isAuthLoading && !fullScreenViews.includes(view) && !siteSettings.is_maintenance_mode_enabled;
  
  // Bottom Nav is mobile only anyway (via CSS md:hidden), so simply exclude clean views
  const showBottomNav = showGlobalFooter && !mobileCleanViews.includes(view);
  
  // Footer visibility class: hide on mobile if it's a clean view, show on desktop always unless fullscreen
  const footerClass = mobileCleanViews.includes(view) ? 'hidden md:block' : '';

  // Bottom Ads Visibility: similar to footer logic, hide on clean mobile views
  const bottomAdClass = mobileCleanViews.includes(view) ? 'hidden md:block' : 'fixed bottom-0 left-0 w-full z-[1000] bg-black/80';
  const socialBarClass = mobileCleanViews.includes(view) ? 'hidden md:block' : 'fixed z-[90] bottom-20 left-4 right-4 md:bottom-4 md:left-4 md:right-auto md:w-auto pointer-events-auto';

  return (
    <div className={`min-h-screen text-white font-['Cairo'] ${view === 'detail' || view === 'watch' ? '' : 'pb-16 md:pb-0'}`}>
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

        {siteSettings.adsEnabled && <AdZone position="global_head" />}

        {!isAuthLoading && view !== 'login' && view !== 'register' && view !== 'profileSelector' && view !== 'admin' && view !== 'myList' && view !== 'accountSettings' && view !== 'category' && view !== 'profileHub' && view !== 'watch' && view !== 'search' && !siteSettings.is_maintenance_mode_enabled && (
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
                isKidProfile={activeProfile?.isKid}
                onOpenSearch={() => setIsSearchOpen(true)}
            />
        )}
        
        {/* Floating Social Bar */}
        <AdPlacement ads={ads} placement="global-social-bar" isEnabled={siteSettings.adsEnabled} className={socialBarClass} />
        
        {/* Sticky Footer Ad */}
        <AdPlacement ads={ads} placement="global-sticky-footer" isEnabled={siteSettings.adsEnabled} className={bottomAdClass} />

        {renderView()}

        {/* Global Search Overlay - Rendered conditionally */}
        {isSearchOpen && (
            <SearchPage 
                allContent={allContent}
                onSelectContent={handleSelectContent}
                onSetView={handleSetView}
                onClose={() => setIsSearchOpen(false)}
            />
        )}

        {showGlobalFooter && (
            <>
                <Footer 
                    socialLinks={siteSettings.socialLinks} 
                    onSetView={handleSetView} 
                    isRamadanFooter={siteSettings.activeTheme === 'ramadan'}
                    onRequestOpen={() => setIsRequestModalOpen(true)}
                    className={footerClass}
                />
                
                {showBottomNav && (
                    <>
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
            </>
        )}

        <RequestContentModal 
            isOpen={isRequestModalOpen}
            onClose={() => setIsRequestModalOpen(false)}
            currentUser={currentUser}
            addToast={addToast}
        />
    </div>
  );
};

export default App;
