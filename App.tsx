
import React, { useState, useCallback, useMemo, useEffect } from 'react';
// FIX: Switched to Firebase v8 compatible namespaced imports.
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
// Note: firestore is imported via db from ./firebase

import { db, auth, getUserProfile, updateUserProfileInFirestore, createUserProfileInFirestore, deleteUserFromFirestore, getSiteSettings, getAds, getUsers, updateSiteSettings as updateSiteSettingsInDb, addAd, updateAd, deleteAd, getPinnedContent, updatePinnedContentForPage } from './firebase'; 
import type { Content, User, Profile, Ad, PinnedItem, SiteSettings, View, LoginError, WatchHistoryItem, PinnedContentState, PageKey } from './types';
import { UserRole } from './types';
import { contentData as initialContent, pinnedContentData as initialPinned, initialSiteSettings, defaultAvatar } from './data';

import Header from './components/Header';
import Hero from './components/Hero';
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
import AboutPage from './components/AboutPage';
import MyListPage from './components/MyListPage';
import HomePage from './components/HomePage';
import BottomNavigation from './components/BottomNavigation';
import CategoryPage from './components/CategoryPage'; 
import RamadanRestrictedModal from './components/RamadanRestrictedModal';
import ProfileHubPage from './components/ProfileHubPage';
import MaintenancePage from './components/MaintenancePage';

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
// Defined explicitly to ensure strict matching
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
    'about': '/about',
    'detail': '/detail', // NOTE: Detail paths are dynamic, handled in handleSetView
    'profileSelector': '/profiles',
    'category': '/category',
    'maintenance': '/maintenance'
};

// --- Safe History Helpers ---
// Updated: Silently catch errors to avoid spamming console in sandboxed environments (like blob URLs or restricted iframes)
const safeHistoryPush = (path: string) => {
    try {
        if (window.location.protocol !== 'file:' && window.location.origin !== 'null') {
             window.history.pushState({}, '', path);
        }
    } catch (e) {
        // Sandbox environment detected, ignoring pushState error
    }
};

const safeHistoryReplace = (path: string) => {
    try {
        if (window.location.protocol !== 'file:' && window.location.origin !== 'null') {
            window.history.replaceState({}, '', path);
        }
    } catch (e) {
        // Sandbox environment detected, ignoring replaceState error
    }
};

const App: React.FC = () => {
  
  // Initialize View based on URL (Strict Matching + Dynamic Slugs)
  const getInitialView = (): View => {
      const path = decodeURIComponent(window.location.pathname);
      const normalizedPath = path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
      
      // 1. Direct Match from Static Map
      if (VIEW_PATHS[normalizedPath]) {
          return VIEW_PATHS[normalizedPath];
      }

      // 2. Check for Category Route
      if (normalizedPath.startsWith('/category/')) {
          return 'category';
      }

      // 3. Check for Semantic Dynamic Routes
      // Supports: /movie/{slug}, /فيلم/{slug}, /series/{slug}, /مسلسل/{slug}
      if (normalizedPath.match(/^\/(?:series|مسلسل|movie|فيلم)\/([^\/]+)/)) {
          return 'detail';
      }

      // Fallback Legacy Check (if any) or unknown -> Home
      return 'home';
  };

  const [view, setView] = useState<View>(getInitialView);
  
  // Initialize selectedCategory from URL if present
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
  
  // Initialize settings from localStorage if available to prevent theme flashing
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(() => {
      let settings = initialSiteSettings;
      try {
          const savedRamadan = localStorage.getItem('cinematix_theme_ramadan');
          const savedTheme = localStorage.getItem('cinematix_active_theme');
          
          if (savedTheme) {
              settings = { ...settings, activeTheme: savedTheme as any };
          } else if (savedRamadan !== null) {
              // Backward compatibility
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
  const [allUsers, setAllUsers] = useState<User[]>([]); // For Admin
  
  // Explicit Loading States
  const [isContentLoading, setIsContentLoading] = useState(true);
  const [isAuthLoading, setIsAuthLoading] = useState(true); // New: Prevent login modal flash

  // Ramadan Restricted Modal State
  const [isRamadanModalOpen, setIsRamadanModalOpen] = useState(false);
  const [restrictedContent, setRestrictedContent] = useState<Content | null>(null);
  
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Toast Helper
  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  // --- Deep Linking Logic: Resolve Content from URL after data fetch ---
  const resolveContentFromUrl = (path: string, contentList: Content[]) => {
      // Decode path to handle Arabic slugs correctly (e.g. %D9%81%D9%8A%D9%84%D9%85 -> فيلم)
      const decodedPath = decodeURIComponent(path);
      
      // Regex to capture the slug (second segment)
      // Matches /فيلم/slug or /مسلسل/slug or /movie/slug
      const match = decodedPath.match(/^\/(?:series|مسلسل|movie|فيلم)\/([^\/]+)/);
      
      let slug = '';
      if (match && match[1]) {
          slug = match[1];
      }

      let foundContent: Content | undefined;

      if (slug) {
          // Try matching by slug first (Priority), then ID as fallback
          foundContent = contentList.find(c => (c.slug === slug) || (c.id === slug));
      }

      if (foundContent) {
          setSelectedContent(foundContent);
          // Ensure view is set to detail
          if(view !== 'detail') setView('detail');
      } else if (view === 'detail') {
          // If we are in detail view but can't resolve content (and content is loaded), revert to home
          if (contentList.length > 0) {
             setView('home');
             safeHistoryReplace('/');
          }
      }
  };

  // --- Browser History Handling (Popstate) ---
  useEffect(() => {
      const handlePopState = () => {
          const newView = getInitialView();
          setView(newView);
          
          // Handle Category State Update on Back/Forward
          const path = decodeURIComponent(window.location.pathname);
          if (path.startsWith('/category/')) {
              setSelectedCategory(path.split('/category/')[1]);
          }

          // Re-sync content if going back to a detail page
          if (newView === 'detail' && allContent.length > 0) {
              resolveContentFromUrl(window.location.pathname, allContent);
          }
      };
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
  }, [allContent]);

  // --- Global Theme Effect ---
  useEffect(() => {
      // CRITICAL SECURITY: Isolate Admin Panel from themes.
      // If we are in admin view, remove all theme classes.
      if (view === 'admin') {
          document.body.classList.remove('theme-ramadan', 'theme-ios', 'theme-night-city', 'theme-nature', 'theme-eid', 'theme-cosmic-teal');
          return;
      }

      // Clear all themes first
      document.body.classList.remove('theme-ramadan', 'theme-ios', 'theme-night-city', 'theme-nature', 'theme-eid', 'theme-cosmic-teal');

      // Apply specific theme
      const active = siteSettings.activeTheme;
      if (active === 'ramadan') {
          document.body.classList.add('theme-ramadan');
      } else if (active === 'ios') {
          document.body.classList.add('theme-ios');
      } else if (active === 'night-city') {
          document.body.classList.add('theme-night-city');
      } else if (active === 'nature') {
          document.body.classList.add('theme-nature');
      } else if (active === 'eid') {
          document.body.classList.add('theme-eid');
      } else if (active === 'cosmic-teal') {
          document.body.classList.add('theme-cosmic-teal');
      }

      // Persistence
      localStorage.setItem('cinematix_active_theme', active);
      // Backward compatibility sync
      localStorage.setItem('cinematix_theme_ramadan', active === 'ramadan' ? 'true' : 'false');

  }, [siteSettings.activeTheme, view]); 

  // Data Fetching
  const fetchData = useCallback(async () => {
      try {
          setIsContentLoading(true);
          // Execute all fetches in parallel for better performance and synchronization
          const [contentSnap, settings, adsList, pinnedData] = await Promise.all([
              db.collection('content').get(),
              getSiteSettings(),
              getAds(),
              getPinnedContent()
          ]);

          // Process Content
          const contentList = contentSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Content));
          setAllContent(contentList);

          // Process Settings
          setSiteSettings(prev => ({
              ...settings,
              // Ensure we respect locally saved theme preference if valid, otherwise use server setting
              activeTheme: settings.activeTheme || 'default'
          }));

          // Process Ads
          setAds(adsList);
          
          // Process Pinned Items
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
            // Remove from DOM after transition for better performance
            setTimeout(() => {
                if (preloader) preloader.style.display = 'none';
            }, 500);
        }
      };

      // UX IMPROVEMENT: Only show splash screen on Home Page ('/')
      // On sub-pages, hide immediately to show the page's local loading state
      const isHomePage = window.location.pathname === '/';

      if (!isHomePage) {
          hideLoader();
          fetchData();
          return; // Skip timers
      }

      // --- CRITICAL FIX: 3-Second Safety Timeout ---
      // Prevents infinite loading screen if Firebase connection hangs
      const safetyTimer = setTimeout(() => {
          hideLoader();
      }, 3000);

      fetchData().finally(() => {
          clearTimeout(safetyTimer); // Clear timeout if data loads fast
          hideLoader();
      });

  }, [fetchData]);
  
  // Trigger resolution when content loads or view is initialized
  useEffect(() => {
      if (allContent.length > 0) {
          resolveContentFromUrl(window.location.pathname, allContent);
      }
  }, [allContent]); // Run once when content is populated

  // Auth Listener
  useEffect(() => {
      const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
          try {
              if (firebaseUser) {
                  const profile = await getUserProfile(firebaseUser.uid);
                  if (profile) {
                      // Construct full User object
                      const user: User = {
                          id: firebaseUser.uid,
                          email: firebaseUser.email || '',
                          role: profile.role || UserRole.User,
                          profiles: profile.profiles || [],
                          firstName: profile.firstName,
                          lastName: profile.lastName
                      };
                      setCurrentUser(user);
                      
                      // UX FIX: Check Local Storage for saved active profile
                      const savedProfileId = localStorage.getItem('cinematix_active_profile');
                      if (savedProfileId) {
                          const savedProfile = user.profiles.find(p => p.id === Number(savedProfileId));
                          if (savedProfile) {
                              setActiveProfile(savedProfile);
                          }
                      }
                      
                      // If admin, fetch users
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
              // Auth check complete, stop loading to show content or login form
              setIsAuthLoading(false);
          }
      });
      return () => unsubscribe();
  }, []);


  // Handlers
  const handleSetView = (newView: View, category?: string) => {
      setView(newView);
      if (category) setSelectedCategory(category);
      window.scrollTo(0, 0);

      // Update URL History (Deep Linking)
      let path = REVERSE_VIEW_PATHS[newView];
      
      // Dynamic Category Route Handling
      if (newView === 'category' && category) {
          path = `/category/${category}`;
      }
      
      // Special case for detail view handled in handleSelectContent, 
      // but if navigating back from it to a standard view:
      if (path) {
          if (window.location.pathname !== path) {
            safeHistoryPush(path);
          }
      }
  };

  const handleSelectContent = (content: Content) => {
      // Ramadan Content Locking Logic
      if (siteSettings.isRamadanModeEnabled && content.categories.includes('رمضان')) {
          // Check current date vs countdown date
          const now = new Date().getTime();
          const countdown = new Date(siteSettings.countdownDate).getTime();
          
          if (now < countdown) {
              // Content is restricted
              setRestrictedContent(content);
              setIsRamadanModalOpen(true);
              return; // Stop execution, do not navigate
          }
      }
      
      // Normal selection if not restricted
      setSelectedContent(content);
      setView('detail');
      window.scrollTo(0, 0);

      // Generate Semantic URL
      // Fallback to ID if slug is missing, but slug should be there.
      const slug = content.slug || content.id; 
      const prefix = content.type === 'series' ? '/مسلسل/' : '/فيلم/';
      const path = `${prefix}${slug}`;
      
      safeHistoryPush(path);
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
               // Create a default profile automatically
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

  // My List Logic
  const handleToggleMyList = async (contentId: string) => {
      if (!currentUser || !activeProfile) {
          handleSetView('login');
          return;
      }
      
      const currentList = activeProfile.myList || [];
      let newList;
      if (currentList.includes(contentId)) {
          newList = currentList.filter(id => id !== contentId);
          // Removed toast notification for removal as per user request
      } else {
          newList = [...currentList, contentId];
          addToast('تمت الإضافة إلى القائمة', 'success');
      }
      
      // Optimistic UI update
      const updatedProfile = { ...activeProfile, myList: newList };
      setActiveProfile(updatedProfile);
      
      // Update User state
      const updatedProfiles = currentUser.profiles.map(p => p.id === activeProfile.id ? updatedProfile : p);
      setCurrentUser({ ...currentUser, profiles: updatedProfiles });

      // Update Firestore
      await updateUserProfileInFirestore(currentUser.id, { profiles: updatedProfiles });
  };

  // Admin Handlers
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
          // Keep backward compatibility for now
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
             console.warn("Client-side admin creation not fully supported without re-auth. Implementing mock success.");
             addToast('يتطلب إضافة مسؤول استخدام وظائف سحابية (Cloud Functions). تم محاكاة العملية.', 'info');
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


  // Render Logic
  const renderView = () => {
      const isAdmin = currentUser?.role === UserRole.Admin;
      const isMaintenance = siteSettings.is_maintenance_mode_enabled;
      const isRamadanTheme = siteSettings.activeTheme === 'ramadan';
      const isEidTheme = siteSettings.activeTheme === 'eid';
      const isCosmicTealTheme = siteSettings.activeTheme === 'cosmic-teal';

      // Helper for Loading State
      const LoadingSpinner = () => (
          <div className="min-h-screen flex items-center justify-center bg-[var(--bg-body)]">
              <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${isCosmicTealTheme ? 'border-[#35F18B]' : 'border-[#00A7F8]'}`}></div>
          </div>
      );

      // Maintenance Mode Check
      if (isMaintenance) {
          if (!isAdmin) {
              if (view === 'login') {
                  return <LoginModal onSetView={handleSetView} onLogin={handleLogin} isRamadanTheme={isRamadanTheme} isEidTheme={isEidTheme} isCosmicTealTheme={isCosmicTealTheme} />;
              }
              return <MaintenancePage socialLinks={siteSettings.socialLinks} onSetView={handleSetView} />;
          }
      }

      // Check for Profile Selection
      // Only show Profile Selector if: 
      // 1. We have a User 
      // 2. No Active Profile selected yet
      // 3. Not in specific auth/admin/account views 
      // 4. Auth loading is finished (to prevent premature showing)
      if (!isAuthLoading && currentUser && !activeProfile && view !== 'profileSelector' && view !== 'accountSettings' && view !== 'admin') {
          return <ProfileSelector user={currentUser} onSelectProfile={handleProfileSelect} onSetView={handleSetView} />;
      }

      // --- DATA PROCESSING HELPER ---
      // Merges pinned item configuration (like bannerNote) into the actual content object
      // UPDATED: For Series, it overrides metadata (Poster, Backdrop, Logo, etc.) with the LATEST SEASON's data if available.
      const getPinnedContentWithMeta = (page: PageKey) => {
          return pinnedItems[page].map(p => {
              const content = allContent.find(c => c.id === p.contentId);
              if (!content) return null;
              
              let finalContent = { ...content };

              // Series Specific Logic: Promote Latest Season Metadata
              if (content.type === 'series' && content.seasons && content.seasons.length > 0) {
                  // 1. Find Latest Season (Highest Season Number)
                  const latestSeason = [...content.seasons].sort((a, b) => b.seasonNumber - a.seasonNumber)[0];
                  
                  if (latestSeason) {
                      // 2. Override properties if they exist in the season
                      // Note: We check if the string is truthy (not empty)
                      if (latestSeason.poster) finalContent.poster = latestSeason.poster;
                      if (latestSeason.backdrop) finalContent.backdrop = latestSeason.backdrop;
                      if (latestSeason.logoUrl) finalContent.logoUrl = latestSeason.logoUrl;
                      if (latestSeason.description) finalContent.description = latestSeason.description;
                      if (latestSeason.releaseYear) finalContent.releaseYear = latestSeason.releaseYear;
                      if (latestSeason.cast && latestSeason.cast.length > 0) finalContent.cast = latestSeason.cast;
                  }
              }

              // Merge bannerNote from pinned item configuration if exists, otherwise use content's default
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
                        siteSettings={siteSettings} // Added siteSettings prop
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
                      />;
           case 'detail':
               return selectedContent ? (
                   <DetailPage 
                        key={window.location.pathname} // Force remount when URL changes (deep linking refresh)
                        locationPath={window.location.pathname} // Pass current path for deep link parsing
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
                   />
               ) : (isContentLoading ? (
                 <LoadingSpinner />
               ) : (
                 // If no content found and not loading, 404 fallback to home
                 <HomePage {...{allContent, pinnedContent: [], onSelectContent: handleSelectContent, isLoggedIn: !!currentUser, myList: activeProfile?.myList, onToggleMyList: handleToggleMyList, ads, siteSettings, onNavigate: handleSetView}} isLoading={isContentLoading} />
               ));
           case 'login':
               if (isAuthLoading) return <LoadingSpinner />;
               return <LoginModal onSetView={handleSetView} onLogin={handleLogin} isRamadanTheme={isRamadanTheme} isEidTheme={isEidTheme} isCosmicTealTheme={isCosmicTealTheme} />;
           case 'register':
               if (isAuthLoading) return <LoadingSpinner />;
               return <CreateAccountPage onSetView={handleSetView} onRegister={handleRegister} isRamadanTheme={isRamadanTheme} isEidTheme={isEidTheme} isCosmicTealTheme={isCosmicTealTheme} />;
           case 'profileSelector':
               if (isAuthLoading) return <LoadingSpinner />;
               return currentUser ? <ProfileSelector user={currentUser} onSelectProfile={handleProfileSelect} onSetView={handleSetView} /> : <LoginModal onSetView={handleSetView} onLogin={handleLogin} isRamadanTheme={isRamadanTheme} isEidTheme={isEidTheme} isCosmicTealTheme={isCosmicTealTheme} />;
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
                   />
               ) : <LoginModal onSetView={handleSetView} onLogin={handleLogin} isRamadanTheme={isRamadanTheme} isEidTheme={isEidTheme} isCosmicTealTheme={isCosmicTealTheme} />;
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
               ) : <LoginModal onSetView={handleSetView} onLogin={handleLogin} isRamadanTheme={isRamadanTheme} isEidTheme={isEidTheme} isCosmicTealTheme={isCosmicTealTheme} />;
            case 'profileHub':
                if (isAuthLoading) return <LoadingSpinner />;
                return (currentUser && activeProfile) ? (
                    <ProfileHubPage 
                        user={currentUser}
                        activeProfile={activeProfile}
                        onSetView={handleSetView}
                        onLogout={handleLogout}
                    />
                ) : <LoginModal onSetView={handleSetView} onLogin={handleLogin} isRamadanTheme={isRamadanTheme} isEidTheme={isEidTheme} isCosmicTealTheme={isCosmicTealTheme} />;
            case 'privacy':
                return <PrivacyPolicyPage content={siteSettings.privacyPolicy} onSetView={handleSetView} />;
            case 'about':
                return <AboutPage onSetView={handleSetView} />;
            case 'maintenance':
                return <MaintenancePage socialLinks={siteSettings.socialLinks} onSetView={handleSetView} />;
           default:
               return <HomePage {...{allContent, pinnedContent: [], onSelectContent: handleSelectContent, isLoggedIn: !!currentUser, myList: activeProfile?.myList, onToggleMyList: handleToggleMyList, ads, siteSettings, onNavigate: handleSetView}} isLoading={isContentLoading} />;
      }
  };

  const isFullPageLayout = view === 'login' || view === 'register' || view === 'admin' || view === 'profileSelector' || view === 'profileHub';
  const isMaintenanceActive = siteSettings.is_maintenance_mode_enabled && currentUser?.role !== UserRole.Admin && view !== 'login';
  // UPDATED: Added `view !== 'accountSettings'` to exclude global header from account settings page
  const showHeader = !isFullPageLayout && view !== 'myList' && view !== 'category' && view !== 'accountSettings' && !isMaintenanceActive && !isContentLoading; 
  const showFooter = !isFullPageLayout && !isMaintenanceActive;
  const isRamadanTheme = siteSettings.activeTheme === 'ramadan';
  const isEidTheme = siteSettings.activeTheme === 'eid';
  const isCosmicTealTheme = siteSettings.activeTheme === 'cosmic-teal';

  return (
    <div className="bg-[var(--bg-body)] min-h-screen text-white font-sans selection:bg-[var(--color-accent)] selection:text-black transition-colors duration-500">
      
      {/* Toast Container */}
      <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 w-full max-w-sm px-4">
         {toasts.map(toast => (
             <div 
                key={toast.id} 
                className={`
                    flex items-center gap-3 p-4 rounded-xl shadow-2xl backdrop-blur-md border transition-all duration-500 animate-slide-in-top
                    ${toast.type === 'success' ? 'bg-green-500/20 border-green-500 text-green-100' : ''}
                    ${toast.type === 'error' ? 'bg-red-500/20 border-red-500 text-red-100' : ''}
                    ${toast.type === 'info' ? 'bg-blue-500/20 border-blue-500 text-blue-100' : ''}
                `}
             >
                 {toast.type === 'success' && <CheckCircleIcon className="w-6 h-6" />}
                 {toast.type === 'error' && <ExclamationCircleIcon className="w-6 h-6" />}
                 {toast.type === 'info' && <div className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center font-bold text-xs">i</div>}
                 <p className="font-medium text-sm flex-1">{toast.message}</p>
                 <button onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} className="opacity-70 hover:opacity-100">
                     <CloseIcon />
                 </button>
             </div>
         ))}
      </div>

      {showHeader && (
        <Header 
            onSetView={handleSetView} 
            currentUser={currentUser} 
            activeProfile={activeProfile} 
            onLogout={handleLogout}
            allContent={allContent}
            onSelectContent={handleSelectContent}
            currentView={view}
            isRamadanTheme={isRamadanTheme}
            isEidTheme={isEidTheme}
            isCosmicTealTheme={isCosmicTealTheme}
        />
      )}

      {renderView()}
      
      {showFooter && <Footer socialLinks={siteSettings.socialLinks} onSetView={handleSetView} isRamadanFooter={view === 'ramadan'} />}
      
      {/* UPDATED: Added !isContentLoading to the condition */}
      {['home', 'movies', 'series', 'kids', 'ramadan', 'soon', 'profileHub'].includes(view) && !isMaintenanceActive && !isContentLoading && (
          <BottomNavigation 
             currentView={view} 
             onSetView={handleSetView} 
             activeProfile={activeProfile}
             isLoggedIn={!!currentUser}
             isRamadanTheme={isRamadanTheme}
             isEidTheme={isEidTheme}
             isCosmicTealTheme={isCosmicTealTheme}
          />
      )}

      {isRamadanModalOpen && restrictedContent && (
        <RamadanRestrictedModal 
            isOpen={isRamadanModalOpen}
            onClose={() => setIsRamadanModalOpen(false)}
            content={restrictedContent}
        />
      )}

    </div>
  );
};

export default App;
