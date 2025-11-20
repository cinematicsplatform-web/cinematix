

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

const App: React.FC = () => {
  
  // Initialize View based on URL (Strict Matching + Dynamic Slugs)
  const getInitialView = (): View => {
      const path = window.location.pathname;
      const normalizedPath = path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
      
      // 1. Direct Match from Static Map
      if (VIEW_PATHS[normalizedPath]) {
          return VIEW_PATHS[normalizedPath];
      }

      // 2. Check for Series Dynamic Route: /series/{slug}
      if (normalizedPath.startsWith('/series/')) {
          return 'detail';
      }

      // 3. Check for Movie Dynamic Route: /{slug} (Root level, assuming not in VIEW_PATHS)
      // Ensure it's not just a random path, though practically we treat unknown root paths as potential movie slugs
      // or show 404 (fallback to home in this logic)
      if (path !== '/' && path.split('/').length === 2) {
          return 'detail';
      }
      
      // Fallback for unknown routes -> Home
      return 'home';
  };

  const [view, setView] = useState<View>(getInitialView);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
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
          if (savedRamadan !== null) {
              settings = { ...settings, isRamadanModeEnabled: savedRamadan === 'true' };
          }
      } catch (e) { console.error(e); }
      return settings;
  });

  const [ads, setAds] = useState<Ad[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]); // For Admin
  
  // Explicit Loading State for Content
  const [isContentLoading, setIsContentLoading] = useState(true);

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
      // Decode path to handle Arabic slugs correctly
      const decodedPath = decodeURIComponent(path);
      const normalizedPath = decodedPath.length > 1 && decodedPath.endsWith('/') ? decodedPath.slice(0, -1) : decodedPath;
      
      let foundContent: Content | undefined;
      
      // Check /series/{slug}
      if (normalizedPath.startsWith('/series/')) {
          const slug = normalizedPath.replace('/series/', '');
          foundContent = contentList.find(c => c.slug === slug || c.id === slug);
      } 
      // Check /{slug} (Movies)
      else if (!VIEW_PATHS[normalizedPath] && normalizedPath !== '/') {
          const slug = normalizedPath.substring(1); // Remove leading slash
          foundContent = contentList.find(c => c.slug === slug || c.id === slug);
      }

      if (foundContent) {
          setSelectedContent(foundContent);
          // Ensure view is set to detail if it wasn't already
          setView('detail');
      } else if (view === 'detail') {
          // If we thought it was a detail view but found no content, revert to home
          // unless it's still loading.
          if (contentList.length > 0) {
             setView('home');
             window.history.replaceState({}, '', '/');
          }
      }
  };

  // --- Browser History Handling (Popstate) ---
  useEffect(() => {
      const handlePopState = () => {
          const newView = getInitialView();
          setView(newView);
          // Re-sync content if going back to a detail page
          if (newView === 'detail' && allContent.length > 0) {
              resolveContentFromUrl(window.location.pathname, allContent);
          }
      };
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
  }, [allContent]); // Added allContent dependency to ensure it's available inside closure

  // --- Global Theme Effect ---
  useEffect(() => {
      if (siteSettings.isRamadanModeEnabled) {
          document.body.classList.add('theme-ramadan');
          localStorage.setItem('cinematix_theme_ramadan', 'true');
      } else {
          document.body.classList.remove('theme-ramadan');
          localStorage.setItem('cinematix_theme_ramadan', 'false');
      }
  }, [siteSettings.isRamadanModeEnabled]);

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

          // Process Settings - Update state but preserve local Ramadan pref if needed logic
          setSiteSettings(settings);

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

      // 1. Safety Timeout
      const safetyTimer = setTimeout(() => {
          hideLoader();
      }, 5000);

      // 2. Fetch Data and hide loader after a delay
      fetchData().finally(() => {
          setTimeout(() => {
              hideLoader();
          }, 1000);
      });

      return () => clearTimeout(safetyTimer);
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
      
      // Special case for detail view handled in handleSelectContent, 
      // but if navigating back from it to a standard view:
      if (path) {
          if (window.location.pathname !== path) {
            window.history.pushState({}, '', path);
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

      // Generate SEO Friendly URL
      // Encode URI component not needed for slug if it contains arabic, modern browsers handle utf-8 in URL path
      const slug = content.slug || content.id; 
      const path = content.type === 'series' ? `/series/${slug}` : `/${slug}`;
      
      window.history.pushState({}, '', path);
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
          addToast('تمت الإزالة من القائمة', 'info');
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
          await updateSiteSettingsInDb(newSettings);
          setSiteSettings(newSettings);
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

      // Maintenance Mode Check
      if (isMaintenance) {
          if (!isAdmin) {
              if (view === 'login') {
                  return <LoginModal onSetView={handleSetView} onLogin={handleLogin} isRamadanTheme={siteSettings.isRamadanModeEnabled} />;
              }
              return <MaintenancePage socialLinks={siteSettings.socialLinks} onSetView={handleSetView} />;
          }
      }

      // Check for Profile Selection
      if (currentUser && !activeProfile && view !== 'profileSelector' && view !== 'accountSettings' && view !== 'admin') {
          return <ProfileSelector user={currentUser} onSelectProfile={handleProfileSelect} onSetView={handleSetView} />;
      }

      switch (view) {
          case 'home':
              return <HomePage 
                        allContent={allContent} 
                        pinnedContent={pinnedItems.home.map(p => allContent.find(c => c.id === p.contentId)).filter((c): c is Content => !!c)}
                        onSelectContent={handleSelectContent} 
                        isLoggedIn={!!currentUser} 
                        myList={activeProfile?.myList} 
                        onToggleMyList={handleToggleMyList} 
                        ads={ads} 
                        siteSettings={siteSettings}
                        onNavigate={handleSetView}
                     />;
          case 'movies':
              return <MoviesPage 
                        allContent={allContent}
                        pinnedContent={pinnedItems.movies.map(p => allContent.find(c => c.id === p.contentId)).filter((c): c is Content => !!c)}
                        onSelectContent={handleSelectContent}
                        isLoggedIn={!!currentUser}
                        myList={activeProfile?.myList}
                        onToggleMyList={handleToggleMyList}
                        ads={ads}
                        adsEnabled={siteSettings.adsEnabled}
                        onNavigate={handleSetView}
                        isLoading={isContentLoading}
                        isRamadanTheme={siteSettings.isRamadanModeEnabled}
                     />;
          case 'series':
              return <SeriesPage
                        allContent={allContent}
                        pinnedContent={pinnedItems.series.map(p => allContent.find(c => c.id === p.contentId)).filter((c): c is Content => !!c)}
                        onSelectContent={handleSelectContent}
                        isLoggedIn={!!currentUser}
                        myList={activeProfile?.myList}
                        onToggleMyList={handleToggleMyList}
                        ads={ads}
                        adsEnabled={siteSettings.adsEnabled}
                        onNavigate={handleSetView}
                        isLoading={isContentLoading}
                        isRamadanTheme={siteSettings.isRamadanModeEnabled}
                     />;
          case 'kids':
              return <KidsPage
                        allContent={allContent}
                        pinnedContent={pinnedItems.kids.map(p => allContent.find(c => c.id === p.contentId)).filter((c): c is Content => !!c)}
                        onSelectContent={handleSelectContent}
                        isLoggedIn={!!currentUser}
                        myList={activeProfile?.myList}
                        onToggleMyList={handleToggleMyList}
                        ads={ads}
                        adsEnabled={siteSettings.adsEnabled}
                        onNavigate={handleSetView}
                        isLoading={isContentLoading}
                        isRamadanTheme={siteSettings.isRamadanModeEnabled}
                     />;
           case 'ramadan':
              return <RamadanPage
                        allContent={allContent}
                        pinnedContent={pinnedItems.ramadan.map(p => allContent.find(c => c.id === p.contentId)).filter((c): c is Content => !!c)}
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
                        pinnedContent={pinnedItems.soon.map(p => allContent.find(c => c.id === p.contentId)).filter((c): c is Content => !!c)}
                        onSelectContent={handleSelectContent}
                        isLoggedIn={!!currentUser}
                        myList={activeProfile?.myList}
                        onToggleMyList={handleToggleMyList}
                        ads={ads}
                        adsEnabled={siteSettings.adsEnabled}
                        isLoading={isContentLoading}
                        isRamadanTheme={siteSettings.isRamadanModeEnabled}
                      />;
           case 'detail':
               return selectedContent ? (
                   <DetailPage 
                        content={selectedContent}
                        ads={ads}
                        adsEnabled={siteSettings.adsEnabled}
                        allContent={allContent}
                        onSelectContent={handleSelectContent}
                        isLoggedIn={!!currentUser}
                        myList={activeProfile?.myList}
                        onToggleMyList={handleToggleMyList}
                        onSetView={handleSetView}
                        isRamadanTheme={siteSettings.isRamadanModeEnabled}
                   />
               ) : (isContentLoading ? (
                 <div className="min-h-screen flex items-center justify-center bg-[var(--bg-body)]">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00A7F8]"></div>
                 </div>
               ) : (
                 // If no content found and not loading, 404 fallback to home
                 <HomePage {...{allContent, pinnedContent: [], onSelectContent: handleSelectContent, isLoggedIn: !!currentUser, myList: activeProfile?.myList, onToggleMyList: handleToggleMyList, ads, siteSettings, onNavigate: handleSetView}} />
               ));
           case 'login':
               return <LoginModal onSetView={handleSetView} onLogin={handleLogin} isRamadanTheme={siteSettings.isRamadanModeEnabled} />;
           case 'register':
               return <CreateAccountPage onSetView={handleSetView} onRegister={handleRegister} />;
           case 'profileSelector':
               return currentUser ? <ProfileSelector user={currentUser} onSelectProfile={handleProfileSelect} onSetView={handleSetView} /> : <LoginModal onSetView={handleSetView} onLogin={handleLogin} isRamadanTheme={siteSettings.isRamadanModeEnabled} />;
           case 'myList':
               return activeProfile ? (
                   <MyListPage 
                        allContent={allContent}
                        activeProfile={activeProfile}
                        onSelectContent={handleSelectContent}
                        isLoggedIn={!!currentUser}
                        myList={activeProfile.myList}
                        onToggleMyList={handleToggleMyList}
                        onSetView={handleSetView}
                        isRamadanTheme={siteSettings.isRamadanModeEnabled}
                   />
               ) : <LoginModal onSetView={handleSetView} onLogin={handleLogin} isRamadanTheme={siteSettings.isRamadanModeEnabled} />;
           case 'category':
               return <CategoryPage 
                        categoryTitle={selectedCategory}
                        allContent={allContent}
                        onSelectContent={handleSelectContent}
                        isLoggedIn={!!currentUser}
                        myList={activeProfile?.myList}
                        onToggleMyList={handleToggleMyList}
                        onSetView={handleSetView}
                        isRamadanTheme={siteSettings.isRamadanModeEnabled}
                      />;
           case 'admin':
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
                ) : <HomePage {...{allContent, pinnedContent: [], onSelectContent: handleSelectContent, isLoggedIn: !!currentUser, myList: activeProfile?.myList, onToggleMyList: handleToggleMyList, ads, siteSettings, onNavigate: handleSetView}} />;
           case 'accountSettings':
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
                    />
               ) : <LoginModal onSetView={handleSetView} onLogin={handleLogin} isRamadanTheme={siteSettings.isRamadanModeEnabled} />;
            case 'profileHub':
                return (currentUser && activeProfile) ? (
                    <ProfileHubPage 
                        user={currentUser}
                        activeProfile={activeProfile}
                        onSetView={handleSetView}
                        onLogout={handleLogout}
                    />
                ) : <LoginModal onSetView={handleSetView} onLogin={handleLogin} isRamadanTheme={siteSettings.isRamadanModeEnabled} />;
            case 'privacy':
                return <PrivacyPolicyPage content={siteSettings.privacyPolicy} onSetView={handleSetView} />;
            case 'about':
                return <AboutPage onSetView={handleSetView} />;
            case 'maintenance':
                return <MaintenancePage socialLinks={siteSettings.socialLinks} onSetView={handleSetView} />;
           default:
               return <HomePage {...{allContent, pinnedContent: [], onSelectContent: handleSelectContent, isLoggedIn: !!currentUser, myList: activeProfile?.myList, onToggleMyList: handleToggleMyList, ads, siteSettings, onNavigate: handleSetView}} />;
      }
  };

  const isFullPageLayout = view === 'login' || view === 'register' || view === 'admin' || view === 'profileSelector' || view === 'profileHub';
  const isMaintenanceActive = siteSettings.is_maintenance_mode_enabled && currentUser?.role !== UserRole.Admin && view !== 'login';
  const showHeader = !isFullPageLayout && view !== 'myList' && !isMaintenanceActive;
  const showFooter = !isFullPageLayout && !isMaintenanceActive;

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
            isRamadanTheme={siteSettings.isRamadanModeEnabled}
        />
      )}

      {renderView()}
      
      {showFooter && <Footer socialLinks={siteSettings.socialLinks} onSetView={handleSetView} isRamadanFooter={view === 'ramadan'} />}
      
      {['home', 'movies', 'series', 'kids', 'ramadan', 'soon', 'profileHub'].includes(view) && !isMaintenanceActive && (
          <BottomNavigation 
             currentView={view} 
             onSetView={handleSetView} 
             activeProfile={activeProfile}
             isLoggedIn={!!currentUser}
             isRamadanTheme={siteSettings.isRamadanModeEnabled}
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