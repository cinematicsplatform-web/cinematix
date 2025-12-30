
import React, { useState, useMemo, useEffect } from 'react';
import { db, generateSlug, getContentRequests, deleteContentRequest, getUserProfile, getPinnedContent, updatePinnedContentForPage, getStories, saveStory, deleteStory, serverTimestamp, getBroadcastHistory, deleteBroadcastNotification, getReports, deleteReport } from '../firebase';
import type { Content, User, Ad, PinnedItem, SiteSettings, View, PinnedContentState, Top10State, PageKey, ThemeType, Category, Genre, Season, Episode, Server, ContentRequest, Story, Notification, BroadcastNotification } from '../types';
import { ContentType, UserRole, adPlacementLabels } from '../types';
import ContentEditModal from './ContentEditModal'; 
import AdEditModal from './AdEditModal';
import ToggleSwitch from './ToggleSwitch';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import { CloseIcon } from './icons/CloseIcon';
import * as XLSX from 'xlsx'; 
import * as jsrsasign from 'jsrsasign'; 
import ManageStories from './ManageStories';
import { BellIcon } from './icons/BellIcon';
import { PlayIcon } from './icons/PlayIcon';
import SEO from './SEO';
import AppConfigTab from './admin/AppConfigTab';
import PeopleManagerTab from './admin/PeopleManagerTab';

// --- PROFESSIONAL ICONS FOR SIDEBAR ---
const HomeIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>
);
const FilmIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0 1 12 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25v1.5c0 .621.504 1.125 1.125 1.125m17.25-2.625h-7.5c-.621 0-1.125.504-1.125 1.125" /></svg>
);
const StarIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" /></svg>
);
const TrophyIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0V5.625a1.125 1.125 0 0 1 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v6.75c0 .621-.504 1.125-1.125 1.125H14.5M9.497 14.25V5.625a1.125 1.125 0 0 0-1.125-1.125H6.125A1.125 1.125 0 0 0 5 5.625v6.75a1.125 1.125 0 0 0 1.125 1.125h2.25c.621 0 1.125-.504 1.125-1.125Zm5-9h-9" /></svg>
);
const UsersIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /></svg>
);
const InboxIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 0 0-2.15-1.588H6.911a2.25 2.25 0 0 0-2.15 1.588L2.35 13.177a2.25 2.25 0 0 0-.1.661Z" /></svg>
);
const FlagIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" /></svg>
);
const MegaphoneIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 1 1 0-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.109-.463 1.109H8.625c-.522 0-.962-.371-1.07-885l-.106-.479m5.28 2.09c.278.278.39.64.293 1.021a11.91 11.91 0 0 1-1.282 3.02m0-8.22a11.92 11.92 0 0 0 1.282 3.02c.097.38.293.38.293 1.021m2.783 2.783a3 3 0 0 0 3-3v-2.25a3 3 0 0 0-3-3h-2.25" /></svg>
);
const PaintBrushIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.635l3.61 3.61a.75.75 0 0 1 0 1.06l-10.5 10.5a.75.75 0 0 1-1.06 0l-3.61-3.61a.75.75 0 0 1 0-1.06l4.635-4.764m0 0 4.635-4.764L13.82 2.72a.75.75 0 0 0-1.06 0l-3.61 3.61a.75.75 0 0 0 0 1.06l4.764 4.635Zm0 0-4.635 4.764" /></svg>
);
const CogIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 0 1 0 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 0 1 0-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
);
const ChartBarIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg>
);
const PlayCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 0 1 0 .656l-5.603 3.113a.375.375 0 0 1-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z" /></svg>
);
const DevicePhoneMobileIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg>
);
const UserGroupIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" /></svg>
);
const MenuIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
);

// Inner Content Icons
const ArrowUpTrayIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" /></svg>
);
const DocumentArrowDownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
);
const TableCellsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0 1 12 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25v1.5c0 .621.504 1.125 1.125 1.125m17.25-2.625h-7.5c-.621 0-1.125.504-1.125 1.125" /></svg>
);
const PaperAirplaneIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
);
const ExitIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
    </svg>
);
const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 0-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
);

type AdminTab = 'dashboard' | 'content' | 'top_content' | 'top10' | 'users' | 'requests' | 'reports' | 'ads' | 'themes' | 'settings' | 'analytics' | 'notifications' | 'stories' | 'app_config' | 'people';

const getAccessToken = async (serviceAccountJson: string): Promise<string | null> => {
    try {
        const serviceAccount = JSON.parse(serviceAccountJson);
        const { private_key, client_email } = serviceAccount;
        if (!private_key || !client_email) throw new Error("Invalid Service Account JSON");
        const now = Math.floor(Date.now() / 1000);
        const header = { alg: 'RS256', typ: 'JWT' };
        const claim = { iss: client_email, scope: 'https://www.googleapis.com/auth/firebase.messaging', aud: 'https://oauth2.googleapis.com/token', exp: now + 3600, iat: now };
        const sJWS = jsrsasign.KJUR.jws.JWS.sign(null, header, claim, private_key);
        const body = new URLSearchParams();
        body.append('grant_type', 'urn:ietf:params:oauth:grant-type:jwt-bearer');
        body.append('assertion', sJWS);
        const response = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body });
        const data = await response.json();
        return data.access_token;
    } catch (e) { console.error("Failed to generate Access Token:", e); return null; }
};

const sendFCMv1Message = async (token: string, notification: any, accessToken: string, projectId: string) => {
    const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;
    const message = { message: { token: token, notification: { title: notification.title, body: notification.body, image: notification.image }, data: notification.data || {} } };
    const response = await fetch(url, { method: 'POST', headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify(message) });
    if (!response.ok) { const err = await response.json(); throw new Error(JSON.stringify(err)); }
    return response.json();
};

interface AdminPanelProps {
  allUsers: User[];
  allAds: Ad[];
  pinnedItems: PinnedContentState;
  top10Items: Top10State;
  stories: Story[];
  siteSettings: SiteSettings;
  onSetSiteSettings: (settings: SiteSettings) => void;
  onSetPinnedItems: (pageKey: PageKey, items: PinnedItem[]) => void;
  onSetTop10Items: (pageKey: PageKey, items: PinnedItem[]) => void;
  onSetView: (view: View) => void;
  onUpdateAd: (ad: Ad) => void;
  onDeleteAd: (adId: string) => void;
  onDeleteContent?: (contentId: string) => void;
  onAddAd: (ad: Omit<Ad, 'id' | 'updatedAt'>) => void;
  onAddAdmin: (admin: Omit<User, 'id' | 'role' | 'profiles'>) => Promise<void>;
  onDeleteUser: (userId: string) => void;
  onContentChanged: () => void;
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

// Helper for Arabic Labels and Colors
const getTypeMeta = (type: string) => {
    switch (type) {
        case ContentType.Movie: return { label: 'فيلم', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' };
        case ContentType.Series: return { label: 'مسلسل', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' };
        case ContentType.Program: return { label: 'برنامج', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' };
        case ContentType.Concert: return { label: 'حفلة', color: 'bg-teal-500/10 text-teal-400 border-teal-500/30' };
        case ContentType.Play: return { label: 'مسرحية', color: 'bg-pink-500/10 text-pink-400 border-pink-500/30' };
        default: return { label: type, color: 'bg-gray-500/10 text-gray-400 border-gray-500/30' };
    }
};

const AdminPanel: React.FC<AdminPanelProps> = (props) => {
    const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
    const [isContentModalOpen, setIsContentModalOpen] = useState(false);
    const [editingContent, setEditingContent] = useState<Content | null>(null);
    const [isAdModalOpen, setIsAdModalOpen] = useState(false);
    const [editingAd, setEditingAd] = useState<Ad | null>(null);
    const [allContent, setAllContent] = useState<Content[]>([]);
    const [isLoadingContent, setIsLoadingContent] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const [deleteModalState, setDeleteModalState] = useState<{ isOpen: boolean; type: 'content' | 'user' | 'ad' | 'pinned' | 'story' | 'broadcast' | 'report'; id: string; title?: string; meta?: any; }>({ isOpen: false, type: 'content', id: '' });

    useEffect(() => {
        const getContent = async () => {
            setIsLoadingContent(true);
            try {
                const data = await db.collection("content").orderBy("updatedAt", "desc").get();
                const contentData = data.docs.map(d => ({ ...d.data(), id: d.id })) as Content[];
                setAllContent(contentData);
            } catch (err) {
                console.error("Error fetching content:", err);
                props.addToast("حدث خطأ أثناء جلب المحتوى من قاعدة البيانات.", "error");
            }
            setIsLoadingContent(false);
        };
        getContent();
    }, []); 

    const totalMovies = allContent.filter(c => c.type === ContentType.Movie).length;
    const totalSeries = allContent.filter(c => c.type === ContentType.Series).length;
    const totalUsers = props.allUsers.length;
    
    const openContentModalForEdit = (c: Content) => { setEditingContent(c); setIsContentModalOpen(true); };
    const openContentModalForNew = () => { setEditingContent(null); setIsContentModalOpen(true); };
    
    const handleSaveContent = async (c: Content) => { try { const contentWithDate = { ...c, updatedAt: new Date().toISOString() }; if(editingContent) { const { id, ...contentData } = contentWithDate; await db.collection("content").doc(c.id).update(contentData); setAllContent(prev => { const filtered = prev.filter(item => item.id !== c.id); return [contentWithDate, ...filtered]; }); props.addToast("تم تعديل المحتوى وتصدر القائمة!", "success"); } else { const { id, ...contentData } = contentWithDate; const docRef = await db.collection("content").add(contentData); setAllContent(prev => [{...contentWithDate, id: docRef.id}, ...prev]); props.addToast("تم إضافة المحتوى وتصدر القائمة!", "success"); } props.onContentChanged(); setIsContentModalOpen(false); setEditingContent(null); } catch (err) { console.error("Error saving content:", err); props.addToast("حدث خطأ أثناء حفظ المحتوى.", "error"); } };
    
    const confirmDeleteContent = (contentId: string, contentTitle: string) => { setDeleteModalState({ isOpen: true, type: 'content', id: contentId, title: contentTitle }); };
    const confirmDeleteUser = (userId: string, userName: string) => { setDeleteModalState({ isOpen: true, type: 'user', id: userId, title: userName }); };
    const confirmDeleteAd = (adId: string, adTitle: string) => { setDeleteModalState({ isOpen: true, type: 'ad', id: adId, title: adTitle }); };
    const confirmDeleteBroadcast = (id: string, title: string) => { setDeleteModalState({ isOpen: true, type: 'broadcast', id, title }); };
    const confirmDeleteReport = (id: string, title: string) => { setDeleteModalState({ isOpen: true, type: 'report', id, title }); };
    
    const executeDelete = async () => { 
        const { type, id } = deleteModalState; 
        if (type === 'content') { 
            try { await db.collection("content").doc(id).delete(); setAllContent(prev => prev.filter(item => item.id !== id)); props.onContentChanged(); props.addToast('تم حذف المحتوى بنجاح.', 'success'); } catch (err) { console.error("Error deleting content:", err); props.addToast("حدث خطأ أثناء الحذف.", "error"); } 
        } else if (type === 'user') { 
            props.onDeleteUser(id); 
        } else if (type === 'ad') { 
            props.onDeleteAd(id); 
        } else if (type === 'broadcast') {
            try { await deleteBroadcastNotification(id); props.addToast('تم سحب الإشعار بنجاح.', 'success'); } catch (e) { props.addToast('فشل سحب الإشعار', 'error'); }
        } else if (type === 'report') {
            try { await deleteReport(id); props.addToast('تم حذف البلاغ بنجاح.', 'success'); } catch (e) { props.addToast('فشل حذف البلاغ', 'error'); }
        }
        setDeleteModalState(prev => ({ ...prev, isOpen: false })); 
    };
    
    const openAdModalForEdit = (ad: Ad) => { setEditingAd(ad); setIsAdModalOpen(true); };
    const openAdModalForNew = () => { setEditingAd(null); setIsAdModalOpen(true); };
    const handleSaveAd = (ad: Ad) => { if(editingAd) { props.onUpdateAd(ad); } else { const { id, updatedAt, ...newAdData } = ad; props.onAddAd(newAdData); } setIsAdModalOpen(false); };

    const renderTabContent = () => {
        switch(activeTab) {
            case 'content': return <ContentManagementTab content={allContent} onEdit={openContentModalForEdit} onNew={openContentModalForNew} onRequestDelete={confirmDeleteContent} isLoading={isLoadingContent} addToast={props.addToast} onBulkSuccess={props.onContentChanged} />;
            case 'users': return <UserManagementTab users={props.allUsers} onAddAdmin={props.onAddAdmin} onRequestDelete={confirmDeleteUser} addToast={props.addToast} />;
            case 'requests': return <RequestsTab addToast={props.addToast} serviceAccountJson={props.siteSettings.serviceAccountJson} />;
            case 'reports': return <ReportsManagementTab addToast={props.addToast} onRequestDelete={confirmDeleteReport} />;
            case 'ads': return <AdsManagementTab ads={props.allAds} onNew={openAdModalForNew} onEdit={openAdModalForEdit} onRequestDelete={confirmDeleteAd} onUpdateAd={props.onUpdateAd} />;
            case 'top_content': return <PinnedContentManagementTab allContent={allContent} pinnedState={props.pinnedItems} setPinnedItems={props.onSetPinnedItems} />;
            case 'top10': return <Top10ManagerTab allContent={allContent} pinnedState={props.top10Items} setPinnedItems={props.onSetTop10Items} />;
            case 'themes': return <ThemesTab siteSettings={props.siteSettings} onSetSiteSettings={props.onSetSiteSettings} />;
            case 'settings': return <SiteSettingsTab siteSettings={props.siteSettings} onSetSiteSettings={props.onSetSiteSettings} allContent={allContent} addToast={props.addToast} />;
            case 'notifications': return <NotificationTab addToast={props.addToast} serviceAccountJson={props.siteSettings.serviceAccountJson} allUsers={props.allUsers} onRequestDelete={confirmDeleteBroadcast} />;
            case 'stories': return <ManageStories addToast={props.addToast} />;
            case 'analytics': return <AnalyticsTab allContent={allContent} allUsers={props.allUsers}/>;
            case 'app_config': return <AppConfigTab settings={props.siteSettings} onUpdate={props.onSetSiteSettings} />;
            case 'people': return <PeopleManagerTab addToast={props.addToast} />;
            case 'dashboard': default: return <DashboardTab stats={{totalMovies, totalSeries, totalUsers}} allContent={allContent} />;
        }
    };

    if (isContentModalOpen) {
        return (
            <ContentEditModal 
                content={editingContent} 
                onClose={() => setIsContentModalOpen(false)} 
                onSave={handleSaveContent} 
                addToast={props.addToast} 
            />
        );
    }

    const navItems: {id: AdminTab, label: string, icon: any}[] = [
        { id: 'dashboard', label: 'نظرة عامة', icon: HomeIcon },
        { id: 'content', label: 'المحتوى', icon: FilmIcon },
        { id: 'top_content', label: 'المثبت (Hero)', icon: StarIcon },
        { id: 'top10', label: 'قائمة التوب 10', icon: TrophyIcon },
        { id: 'stories', label: 'إدارة الستوري', icon: PlayCircleIcon },
        { id: 'people', label: 'النجوم والطاقم', icon: UserGroupIcon },
        { id: 'users', label: 'المستخدمون', icon: UsersIcon },
        { id: 'requests', label: 'الطلبات', icon: InboxIcon },
        { id: 'reports', label: 'البلاغات', icon: FlagIcon },
        { id: 'ads', label: 'الإعلانات', icon: MegaphoneIcon },
        { id: 'themes', label: 'المظهر', icon: PaintBrushIcon },
        { id: 'settings', label: 'إعدادات الموقع', icon: CogIcon },
        { id: 'analytics', label: 'الإحصائيات', icon: ChartBarIcon },
        { id: 'notifications', label: 'إرسال إشعار', icon: BellIcon },
        { id: 'app_config', label: 'تطبيق الموبايل', icon: DevicePhoneMobileIcon },
    ];

    const currentTabLabel = navItems.find(i => i.id === activeTab)?.label;

    return (
        <div className="flex h-screen bg-[#090b10] text-gray-200 overflow-hidden font-sans selection:bg-[var(--color-accent)] selection:text-black" dir="rtl">
            <SEO title="لوحة التحكم - سينماتيكس" noIndex={true} />
            
            {/* Mobile Sidebar Backdrop */}
            <div 
                className={`fixed inset-0 bg-black/60 z-[90] lg:hidden transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
                onClick={() => setIsSidebarOpen(false)} 
            />

            {/* SIDEBAR */}
            <aside className={`fixed inset-y-0 right-0 z-[100] w-72 bg-[#0f1014] border-l border-gray-800 flex flex-col shadow-2xl transition-transform duration-300 lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}>
                {/* Center Logo Section */}
                <div className="p-8 border-b border-gray-800 flex flex-col items-center text-center gap-3">
                    <div className="text-3xl font-extrabold cursor-default flex flex-row items-baseline gap-1 justify-center">
                        <span className="text-white font-['Cairo']">سينما</span>
                        <span className="gradient-text font-['Lalezar'] tracking-wide text-4xl">تيكس</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-[11px] font-bold text-gray-400 bg-gray-900/50 px-3 py-1 rounded-full border border-gray-800/50 backdrop-blur-sm">
                            {currentTabLabel}
                        </span>
                    </div>
                </div>
                
                <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 px-2 text-right">Main Menu</div>
                    {navItems.map(item => (
                        <button 
                            key={item.id}
                            onClick={() => {
                                setActiveTab(item.id);
                                setIsSidebarOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === item.id ? 'bg-[#1a1f29] text-white border-r-2 border-[#00A7F8]' : 'text-gray-400 hover:bg-[#161b22] hover:text-white'}`}
                        >
                            <item.icon className="w-5 h-5"/>
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-800">
                     <button onClick={() => props.onSetView('home')} className="w-full flex items-center justify-center gap-2 rounded-lg bg-red-500/10 p-3 text-sm font-bold text-red-500 hover:bg-red-500 hover:text-white transition-all duration-200">
                        <ExitIcon className="w-5 h-5"/>
                        <span>الخروج من اللوحة</span>
                     </button>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 flex flex-col min-w-0 bg-[#090b10] relative">
                {/* Header */}
                <header className="h-20 border-b border-gray-800 bg-[#0f1014]/90 backdrop-blur-md flex items-center justify-between px-6 md:px-10 z-10 sticky top-0">
                    <div className="flex items-center gap-4">
                        {/* Hamburger for mobile */}
                        <button 
                            type="button" 
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
                            className="lg:hidden p-2 text-gray-400 hover:text-white transition-colors"
                        >
                            <MenuIcon className="w-6 h-6" />
                        </button>
                        
                        <div className="flex flex-col">
                             <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                {currentTabLabel}
                             </h2>
                             <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500 mt-1">
                                 <span>المسؤول</span>
                                 <span>/</span>
                                 <span className="text-[#00A7F8]">{currentTabLabel}</span>
                             </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="px-3 py-1 bg-gray-900 rounded border border-gray-800 font-mono text-xs text-gray-400">
                             v2.5.1
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar pb-32">
                    <div className="max-w-7xl mx-auto">
                        {renderTabContent()}
                    </div>
                </div>
            </main>
             
             {isAdModalOpen && <AdEditModal ad={editingAd} onClose={() => setIsAdModalOpen(false)} onSave={handleSaveAd} />}
             <DeleteConfirmationModal isOpen={deleteModalState.isOpen} onClose={() => setDeleteModalState(prev => ({ ...prev, isOpen: false }))} onConfirm={executeDelete} title={deleteModalState.type === 'content' ? 'حذف المحتوى' : deleteModalState.type === 'user' ? 'حذف المستخدم' : deleteModalState.type === 'ad' ? 'حذف الإعلان' : deleteModalState.type === 'story' ? 'حذف الستوري' : deleteModalState.type === 'broadcast' ? 'سحب الإشعار' : deleteModalState.type === 'report' ? 'حذف البلاغ' : 'حذف'} message={`هل أنت متأكد من حذف "${deleteModalState.title}"؟ لا يمكن التراجع عن هذا الإجراء.`} />
        </div>
    );
};

const DashboardTab: React.FC<{stats: {totalMovies: number, totalSeries: number, totalUsers: number}, allContent: Content[]}> = ({stats, allContent}) => {
    const recentlyAdded = [...allContent].sort((a, b) => { const dateA = new Date(a.updatedAt || a.createdAt).getTime(); const dateB = new Date(b.updatedAt || b.createdAt).getTime(); return dateB - dateA; }).slice(0, 5);
    return (
        <div className="space-y-8 animate-fade-in-up">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#1f2937] p-6 rounded-2xl border border-gray-700/50 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
                    <div className="flex items-center justify-between relative z-10"><h3 className="text-gray-400 text-sm font-bold uppercase tracking-wider">إجمالي الأفلام</h3><span className="text-2xl bg-blue-500/20 p-2 rounded-lg">🎬</span></div>
                    <p className="text-5xl font-black mt-4 text-white relative z-10">{stats.totalMovies}</p>
                    <p className="text-xs text-blue-400 mt-2 font-bold relative z-10">فيلم متاح</p>
                </div>
                <div className="bg-[#1f2937] p-6 rounded-2xl border border-gray-700/50 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
                    <div className="flex items-center justify-between relative z-10"><h3 className="text-gray-400 text-sm font-bold uppercase tracking-wider">إجمالي المسلسلات</h3><span className="text-2xl bg-purple-500/20 p-2 rounded-lg">📺</span></div>
                    <p className="text-5xl font-black mt-4 text-white relative z-10">{stats.totalSeries}</p>
                    <p className="text-xs text-purple-400 mt-2 font-bold relative z-10">مسلسل متاح</p>
                </div>
                <div className="bg-[#1f2937] p-6 rounded-2xl border border-gray-700/50 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
                    <div className="flex items-center justify-between relative z-10"><h3 className="text-gray-400 text-sm font-bold uppercase tracking-wider">المستخدمين</h3><span className="text-2xl bg-green-500/20 p-2 rounded-lg">👥</span></div>
                    <p className="text-5xl font-black mt-4 text-white relative z-10">{stats.totalUsers}</p>
                    <p className="text-xs text-green-400 mt-2 font-bold relative z-10">حساب نشط</p>
                </div>
            </div>
            
            <div className="bg-[#1f2937] rounded-2xl border border-gray-700/50 overflow-hidden shadow-xl">
                <div className="px-8 py-6 border-b border-gray-700/50 flex justify-between items-center">
                    <h3 className="font-bold text-xl text-white">أحدث الأنشطة</h3>
                    <span className="text-xs text-gray-500 bg-gray-800 px-3 py-1 rounded-full">آخر 5 إضافات</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right text-gray-300 whitespace-nowrap">
                        <thead className="bg-gray-800/50 text-xs uppercase font-bold text-gray-400">
                            <tr><th className="px-8 py-4">العنوان</th><th className="px-8 py-4">النوع</th><th className="px-8 py-4">تاريخ التعديل</th><th className="px-8 py-4">الحالة</th></tr>
                        </thead>
                        <tbody>
                            {recentlyAdded.length > 0 ? recentlyAdded.map(item => {
                                const meta = getTypeMeta(item.type);
                                return (
                                    <tr key={item.id} className="border-b border-gray-700/50 hover:bg-gray-700/20 transition-colors">
                                        <td className="px-8 py-4 font-bold text-white flex items-center gap-4">
                                            <div className="w-10 h-14 rounded-md overflow-hidden shadow-md">
                                                <img src={item.poster} alt={item.title} className="w-full h-full object-cover" />
                                            </div>
                                            {item.title}
                                        </td>
                                        <td className="px-8 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${meta.color}`}>{meta.label}</span>
                                        </td>
                                        <td className="px-8 py-4 dir-ltr text-right font-mono text-xs text-gray-400">{new Date(item.updatedAt || item.createdAt).toLocaleDateString('en-GB')}</td>
                                        <td className="px-8 py-4"><span className={`px-3 py-1 rounded-full text-xs font-bold ${item.visibility === 'general' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>{item.visibility === 'general' ? 'عام' : 'مقيد'}</span></td>
                                    </tr>
                                );
                            }) : (<tr><td colSpan={4} className="text-center py-12 text-gray-500">لا يوجد محتوى حديث</td></tr>)}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

const ContentManagementTab: React.FC<any> = ({content, onEdit, onNew, onRequestDelete, isLoading, addToast, onBulkSuccess}) => { 
    const [searchTerm, setSearchTerm] = useState(''); 
    const filteredContent = content.filter((c:any) => (c.title || '').toLowerCase().includes(searchTerm.toLowerCase())); 
    const excelInputRef = React.useRef<HTMLInputElement>(null); 
    const [processingExcel, setProcessingExcel] = useState(false); 
    const [progress, setProgress] = useState(''); 
    const API_KEY = 'b8d66e320b334f4d56728d98a7e39697'; 
    const LANG = 'ar-SA'; 
    const generateExcelTemplate = () => { const moviesHeader = ["TMDB_ID", "Title", "Description", "Year", "Rating", "Genres", "Poster_URL", "Backdrop_URL", "Logo_URL", "Watch_Server_1", "Watch_Server_2", "Watch_Server_3", "Watch_Server_4", "Download_Link"]; const episodesHeader = ["Series_TMDB_ID", "Series_Name", "Season_Number", "Episode_Number", "Episode_Title", "Watch_Server_1", "Watch_Server_2", "Download_Link"]; const wb = XLSX.utils.book_new(); const wsMovies = XLSX.utils.aoa_to_sheet([moviesHeader]); const wsEpisodes = XLSX.utils.aoa_to_sheet([episodesHeader]); XLSX.utils.book_append_sheet(wb, wsMovies, "Movies"); XLSX.utils.book_append_sheet(wb, wsEpisodes, "Episodes"); XLSX.writeFile(wb, "cinematix_import_template.xlsx"); }; 
    const fetchTMDBData = async (id: string, type: 'movie' | 'tv') => { if (!id) return null; try { const res = await fetch(`https://api.themoviedb.org/3/${type}/${id}?api_key=${API_KEY}&language=${LANG}&append_to_response=images,credits`); if (!res.ok) return null; return await res.json(); } catch (e) { console.error("TMDB Fetch Error:", e); return null; } }; 
    const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { 
        const file = e.target.files?.[0]; 
        if (!file) return; 
        setProcessingExcel(true); 
        setProgress('جاري قراءة الملف...'); 
        const reader = new FileReader(); 
        reader.onload = async (evt) => { 
            try { 
                const data = new Uint8Array(evt.target?.result as ArrayBuffer); 
                const workbook = XLSX.read(data, { type: 'array' }); 
                if (workbook.Sheets['Movies']) { 
                    const movies = XLSX.utils.sheet_to_json<any>(workbook.Sheets['Movies']); 
                    let count = 0; 
                    const batch = db.batch(); 
                    let batchCount = 0; 
                    for (const row of movies) { 
                        count++; 
                        setProgress(`معالجة الفيلم ${count} من ${movies.length}...`); 
                        let movieData: any = {}; 
                        if (row.TMDB_ID) { 
                            const tmdb = await fetchTMDBData(String(row.TMDB_ID), 'movie'); 
                            if (tmdb) { 
                                movieData = { 
                                    title: tmdb.title, 
                                    description: tmdb.overview, 
                                    poster: tmdb.poster_path ? `https://image.tmdb.org/t/p/w500${tmdb.poster_path}` : '', 
                                    backdrop: tmdb.backdrop_path ? `https://image.tmdb.org/t/p/original${tmdb.backdrop_path}` : '', 
                                    rating: tmdb.vote_average ? Number((tmdb.vote_average / 2).toFixed(1)) : 0, 
                                    releaseYear: tmdb.release_date ? new Date(tmdb.release_date).getFullYear() : new Date().getFullYear(), 
                                    genres: tmdb.genres?.map((g: any) => g.name) || [], 
                                    cast: tmdb.credits?.cast?.slice(0, 5).map((c: any) => c.name) || [] 
                                }; 
                            } 
                        } 
                        if (row.Title) movieData.title = row.Title; 
                        if (row.Description) movieData.description = row.Description; 
                        if (row.Year) movieData.releaseYear = parseInt(String(row.Year)); 
                        if (row.Rating) movieData.rating = parseFloat(String(row.Rating)); 
                        if (row.Poster_URL) movieData.poster = row.Poster_URL; 
                        if (row.Backdrop_URL) movieData.backdrop = row.Backdrop_URL; 
                        if (row.Logo_URL) { movieData.logoUrl = row.Logo_URL; movieData.isLogoEnabled = true; } 
                        if (row.Genres) movieData.genres = row.Genres.split(',').map((g: string) => g.trim()); 
                        const servers: Server[] = []; 
                        if (row.Watch_Server_1) servers.push({ id: 1, name: "سيرفر 1", url: row.Watch_Server_1, downloadUrl: "", isActive: true }); 
                        if (row.Watch_Server_2) servers.push({ id: 2, name: "سيرفر 2", url: row.Watch_Server_2, downloadUrl: "", isActive: true }); 
                        if (row.Watch_Server_3) servers.push({ id: 3, name: "سيرفر 3", url: row.Watch_Server_3, downloadUrl: "", isActive: true }); 
                        if (row.Watch_Server_4) servers.push({ id: 4, name: "سيرفر 4", url: row.Watch_Server_4, downloadUrl: "", isActive: true }); 
                        if (row.Download_Link) servers.forEach(s => s.downloadUrl = row.Download_Link); 
                        const finalMovie: Content = { 
                            id: row.TMDB_ID ? String(row.TMDB_ID) : String(Date.now() + Math.random()), 
                            type: ContentType.Movie, 
                            title: movieData.title || 'New Movie', 
                            description: movieData.description || '', 
                            poster: movieData.poster || '', 
                            backdrop: movieData.backdrop || '', 
                            rating: movieData.rating || 0, 
                            releaseYear: movieData.releaseYear || new Date().getFullYear(), 
                            genres: movieData.genres || [], 
                            categories: ['افلام اجنبية'], 
                            cast: movieData.cast || [], 
                            visibility: 'general', 
                            ageRating: '', 
                            servers: servers, 
                            seasons: [], 
                            createdAt: new Date().toISOString(), 
                            updatedAt: new Date().toISOString(), 
                            slug: generateSlug(movieData.title || ''), 
                            logoUrl: movieData.logoUrl, 
                            isLogoEnabled: movieData.isLogoEnabled 
                        }; 
                        const ref = db.collection("content").doc(finalMovie.id); 
                        batch.set(ref, finalMovie, { merge: true }); 
                        batchCount++; 
                        if (batchCount >= 400) { await batch.commit(); batchCount = 0; } 
                    } 
                    if (batchCount > 0) await batch.commit(); 
                } 
                if (workbook.Sheets['Episodes']) { 
                    const episodes = XLSX.utils.sheet_to_json<any>(workbook.Sheets['Episodes']); 
                    const seriesGroups: Record<string, any[]> = {}; 
                    episodes.forEach(ep => { 
                        const key = ep.Series_TMDB_ID || ep.Series_Name || 'Unknown'; 
                        if (!seriesGroups[key]) seriesGroups[key] = []; 
                        seriesGroups[key].push(ep); 
                    }); 
                    const epBatch = db.batch(); 
                    let epBatchCount = 0; 
                    let seriesCount = 0; 
                    for (const [seriesKey, epRows] of Object.entries(seriesGroups)) { 
                        seriesCount++; 
                        setProgress(`معالجة المسلسل ${seriesCount} من ${Object.keys(seriesGroups).length}...`); 
                        let seriesDoc: any = null; 
                        let seriesId = String(seriesKey); 
                        const existingSeries = content.find((c:any) => c.id === seriesId || c.title === seriesKey); 
                        if (existingSeries) { 
                            seriesDoc = { ...existingSeries }; 
                            seriesId = existingSeries.id; 
                        } else { 
                            let tmdbSeries: any = null; 
                            if (!isNaN(Number(seriesKey))) { 
                                tmdbSeries = await fetchTMDBData(String(seriesKey), 'tv'); 
                            } 
                            seriesDoc = { 
                                id: seriesId, 
                                type: ContentType.Series, 
                                title: tmdbSeries?.name || epRows[0].Series_Name || 'New Series', 
                                description: tmdbSeries?.overview || '', 
                                poster: tmdbSeries?.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbSeries.poster_path}` : '', 
                                backdrop: tmdbSeries?.backdrop_path ? `https://image.tmdb.org/t/p/original${tmdbSeries.backdrop_path}` : '', 
                                rating: tmdbSeries?.vote_average ? Number((tmdbSeries.vote_average / 2).toFixed(1)) : 0, 
                                releaseYear: tmdbSeries?.first_air_date ? new Date(tmdbSeries.first_air_date).getFullYear() : new Date().getFullYear(), 
                                genres: tmdbSeries?.genres?.map((g: any) => g.name) || [], 
                                categories: ['مسلسلات اجنبية'], 
                                seasons: [], 
                                visibility: 'general', 
                                createdAt: new Date().toISOString(), 
                                updatedAt: new Date().toISOString(), 
                                slug: generateSlug(tmdbSeries?.name || epRows[0].Series_Name || '') 
                            }; 
                        } 
                        if (!seriesDoc.seasons) seriesDoc.seasons = []; 
                        for (const ep of epRows) { 
                            const sNum = parseInt(String(ep.Season_Number)) || 1; 
                            const eNum = parseInt(String(ep.Episode_Number)) || 1; 
                            let season = seriesDoc.seasons.find((s: Season) => s.seasonNumber === sNum); 
                            if (!season) { 
                                season = { id: Date.now() + Math.random(), seasonNumber: sNum, title: `الموسم ${sNum}`, episodes: [] }; 
                                seriesDoc.seasons.push(season); 
                            } 
                            const episodeObj: Episode = { 
                                id: Date.now() + Math.random(), 
                                title: ep.Episode_Title || `الحلقة ${eNum}`, 
                                thumbnail: seriesDoc.backdrop || '', 
                                duration: "45:00", 
                                progress: 0, 
                                servers: [] 
                            }; 
                            if (ep.Watch_Server_1) episodeObj.servers.push({ id: 1, name: "سيرفر 1", url: ep.Watch_Server_1, downloadUrl: ep.Download_Link || "", isActive: true }); 
                            if (ep.Watch_Server_2) episodeObj.servers.push({ id: 2, name: "سيرفر 2", url: ep.Watch_Server_2, downloadUrl: "", isActive: true }); 
                            const existingEpIndex = season.episodes.findIndex((e: Episode) => e.title?.includes(`${eNum}`) || e.title === ep.Episode_Title); 
                            if (existingEpIndex > -1) { 
                                season.episodes[existingEpIndex] = { ...season.episodes[existingEpIndex], ...episodeObj, servers: [...season.episodes[existingEpIndex].servers, ...episodeObj.servers] }; 
                            } else { 
                                season.episodes.push(episodeObj); 
                            } 
                        } 
                        seriesDoc.seasons.sort((a: Season, b: Season) => a.seasonNumber - b.seasonNumber); 
                        seriesDoc.seasons.forEach((s: Season) => { 
                            s.episodes.sort((a: Episode, b: Episode) => { 
                                const numA = parseInt(a.title?.replace(/\D/g, '') || '0'); 
                                const numB = parseInt(b.title?.replace(/\D/g, '') || '0'); 
                                return numA - numB; 
                            }); 
                        }); 
                        const ref = db.collection("content").doc(seriesDoc.id); 
                        epBatch.set(ref, seriesDoc, { merge: true }); 
                        epBatchCount++; 
                        if (epBatchCount >= 300) { await epBatch.commit(); epBatchCount = 0; } 
                    } 
                    if (epBatchCount > 0) await epBatch.commit(); 
                } 
                addToast('تم استيراد البيانات من Excel بنجاح!', 'success'); 
                onBulkSuccess(); 
            } catch (err) { 
                console.error("Excel Import Error:", err); 
                addToast('حدث خطأ أثناء معالجة ملف Excel.', 'error'); 
            } finally { 
                setProcessingExcel(false); 
                setProgress(''); 
                if (excelInputRef.current) excelInputRef.current.value = ''; 
            } 
        }; 
        reader.readAsArrayBuffer(file); 
    }; 
    
    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#1f2937] p-6 rounded-2xl mb-8 border border-gray-700/50 shadow-lg">
                <input type="text" placeholder="ابحث عن فيلم أو مسلسل..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full md:w-auto md:min-w-[350px] bg-gray-900 border border-gray-700 rounded-xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-[#00A7F8] text-white placeholder-gray-500 shadow-inner"/>
                <div className="flex gap-3 w-full md:w-auto flex-wrap">
                    <button onClick={generateExcelTemplate} className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-5 rounded-xl transition-colors text-sm border border-gray-600" title="تحميل نموذج Excel"><TableCellsIcon /><span className="hidden sm:inline">تحميل نموذج Excel</span></button>
                    <input type="file" accept=".xlsx, .xls" ref={excelInputRef} onChange={handleExcelUpload} className="hidden" />
                    <button onClick={() => excelInputRef.current?.click()} disabled={processingExcel} className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-5 rounded-xl transition-colors text-sm disabled:opacity-50 border border-gray-600" title="استيراد من Excel"><ArrowUpTrayIcon /><span className="hidden sm:inline">{processingExcel ? 'جاري المعالجة...' : 'استيراد من Excel'}</span></button>
                    <button onClick={onNew} className="flex-1 md:flex-none bg-gradient-to-r from-[#00A7F8] to-[#00FFB0] text-black font-extrabold py-3 px-8 rounded-xl hover:shadow-[0_0_20px_rgba(0,167,248,0.4)] transition-all transform hover:scale-105 whitespace-nowrap">+ إضافة محتوى</button>
                </div>
            </div>
            {processingExcel && (<div className="mb-6 bg-[#1f2937] p-6 rounded-2xl border border-gray-700/50 animate-pulse shadow-lg"><div className="flex justify-between mb-3 text-sm text-[#00A7F8] font-bold"><span>جاري الاستيرار...</span><span>{progress}</span></div><div className="w-full bg-gray-800 rounded-full h-3"><div className="bg-[#00A7F8] h-3 rounded-full w-2/3 transition-all duration-500 shadow-[0_0_10px_#00A7F8]"></div></div><p className="text-xs text-gray-500 mt-3 text-center">الرجاء عدم إغلاق الصفحة حتى تكتمل العملية.</p></div>)}
            
            {isLoading ? (
                <div className="text-center py-32 text-gray-500">جاري تحميل المحتوى من قاعدة البيانات...</div> 
            ) : (
                <>
                    {filteredContent.length === 0 && (
                        <div className="text-center py-20 text-gray-500 border-2 border-dashed border-gray-800 rounded-3xl mb-8 flex flex-col items-center justify-center">
                            <span className="text-4xl mb-4 opacity-50">📂</span>
                            لا يوجد محتوى مطابق لبحثك.
                        </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {filteredContent.map((c:any) => {
                            const meta = getTypeMeta(c.type);
                            return (
                                <div key={c.id} className="group relative aspect-[2/3] rounded-2xl overflow-hidden cursor-pointer bg-gray-800 border border-gray-700/50 shadow-lg hover:shadow-[0_0_25px_rgba(0,167,248,0.2)] transition-all duration-300 hover:scale-[1.02]">
                                    <img src={c.poster} alt={c.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                                    <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
                                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold backdrop-blur-md border ${meta.color}`}>
                                            {meta.label}
                                        </span>
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <div className="absolute bottom-0 left-0 w-full p-4 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                                        <h3 className="text-white font-bold text-lg leading-tight line-clamp-1 mb-1 drop-shadow-md">{c.title}</h3>
                                        <div className="flex items-center justify-between text-xs text-gray-300 mb-3">
                                            <span className="font-mono">{c.releaseYear}</span>
                                            <span className={`font-bold ${c.visibility === 'general' ? 'text-green-400' : 'text-yellow-400'}`}>
                                                {c.visibility === 'general' ? 'عام' : 'مقيد'}
                                            </span>
                                        </div>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-4 group-hover:translate-y-0">
                                            <button onClick={(e) => { e.stopPropagation(); onEdit(c); }} className="flex-1 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white py-2 rounded-lg text-xs font-bold border border-white/10 transition-colors">تعديل</button>
                                            <button onClick={(e) => { e.stopPropagation(); onRequestDelete(c.id, c.title); }} className="flex-1 bg-red-500/20 hover:bg-red-500/40 backdrop-blur-md text-red-300 py-2 rounded-lg text-xs font-bold border border-red-500/20 transition-colors">حذف</button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    ); 
};
const RequestsTab: React.FC<any> = ({ addToast, serviceAccountJson }) => { const [requests, setRequests] = useState<ContentRequest[]>([]); const [loading, setLoading] = useState(true); useEffect(() => { fetchRequests(); }, []); const fetchRequests = async () => { setLoading(true); const data = await getContentRequests(); setRequests(data); setLoading(false); }; const handleFulfillRequest = async (req: ContentRequest) => { if (confirm(`هل أنت متأكد من تحديد طلب "${req.title}" كمكتمل؟ سيتم إرسال إشعار للمستخدم وحذف الطلب.`)) { try { let notificationSent = false; if (req.userId && serviceAccountJson) { try { const accessToken = await getAccessToken(serviceAccountJson); if (!accessToken) throw new Error("Could not generate access token"); const userProfile = await getUserProfile(req.userId); const tokens = userProfile?.fcmTokens || []; if (tokens.length > 0) { const parsedServiceAccount = JSON.parse(serviceAccountJson); const projectId = parsedServiceAccount.project_id; const notificationData = { title: 'تم تلبية طلبك! 🎉', body: `تمت إضافة "${req.title}" إلى الموقع. مشاهدة ممتعة!`, image: '/icon-192.png', data: { url: '/' } }; await Promise.all(tokens.map(async (token: string) => { await sendFCMv1Message(token, notificationData, accessToken, projectId); })); notificationSent = true; console.log('HTTP v1 Notification sent.'); } } catch (notifyErr) { console.error("Failed to send notification:", notifyErr); addToast('فشل إرسال الإشعار، لكن سيتم إكمال الطلب.', 'error'); } } else if (req.userId && !serviceAccountJson) { addToast('لم يتم إرسال الإشعار لعدم وجود ملف الخدمة (Service Account) في الإعدادات.', 'error'); } await deleteContentRequest(req.id); setRequests(prev => prev.filter(r => r.id !== req.id)); addToast(notificationSent ? 'تمت تلبية الطلب وإشعار المستخدم.' : 'تمت تلبية الطلب (بدون إشعار).', 'success'); } catch (error) { console.error(error); addToast('حدث خطأ أثناء معالجة الطلب.', 'error'); } } }; return (<div className="space-y-6">{!serviceAccountJson && (<div className="bg-yellow-900/20 border border-yellow-500/30 p-4 rounded-xl text-yellow-200 text-sm flex items-center gap-3"><span className="text-xl">⚠️</span><span>تنبيه: يجب إضافة "ملف الخدمة (Service Account JSON)" في تبويب "إعدادات الموقع" لتفعيل الإشعارات التلقائية عند تلبية الطلبات.</span></div>)}<div className="bg-[#1f2937] rounded-2xl border border-gray-700/50 overflow-hidden shadow-xl"><div className="px-8 py-6 border-b border-gray-700/50 flex justify-between items-center"><h3 className="font-bold text-lg text-white flex items-center gap-2"><InboxIcon />طلبات المحتوى ({requests.length})</h3><button onClick={fetchRequests} className="text-sm text-[#00A7F8] hover:text-[#00FFB0] font-bold transition-colors">تحديث القائمة</button></div>{loading ? (<div className="text-center py-12 text-gray-500">جاري التحميل...</div>) : requests.length === 0 ? (<div className="text-center py-20 text-gray-500 flex flex-col items-center gap-4"><span className="text-4xl opacity-50">📭</span>لا يوجد طلبات جديدة حالياً.</div>) : (<div className="overflow-x-auto"><table className="w-full text-sm text-right text-gray-300 whitespace-nowrap"><thead className="bg-gray-800/50 text-xs uppercase font-bold text-gray-400"><tr><th className="px-8 py-4">العنوان</th><th className="px-8 py-4">النوع</th><th className="px-8 py-4">ملاحظات</th><th className="px-8 py-4">التاريخ</th><th className="px-8 py-4">إجراءات</th></tr></thead><tbody>{requests.map(req => (<tr key={req.id} className="border-b border-gray-700/50 hover:bg-gray-700/20 transition-colors"><td className="px-8 py-4 font-bold text-white">{req.title}</td><td className="px-8 py-4"><span className={`px-3 py-1 rounded-full text-xs font-bold ${req.type === 'movie' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>{req.type === 'movie' ? 'فيلم' : 'مسلسل'}</span></td><td className="px-8 py-4 max-w-xs truncate text-gray-400" title={req.notes}>{req.notes || '-'}</td><td className="px-8 py-4 dir-ltr text-right text-xs font-mono">{new Date(req.createdAt).toLocaleDateString('en-GB')}</td><td className="px-8 py-4"><button onClick={() => handleFulfillRequest(req)} className="bg-green-500/10 hover:bg-green-500/20 text-green-400 font-bold py-2 px-4 rounded-lg text-xs transition-colors border border-green-500/20">✓ تمت الإضافة</button></td></tr>))}</tbody></table></div>)}</div></div>); };

const ReportsManagementTab: React.FC<any> = ({ addToast, onRequestDelete }) => {
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchReports(); }, []);

    const fetchReports = async () => {
        setLoading(true);
        const data = await getReports();
        setReports(data);
        setLoading(false);
    };

    const getReasonLabel = (reason: string) => {
        switch(reason) {
            case 'not_working': return 'الفيديو لا يعمل';
            case 'wrong_episode': return 'حلقة خاطئة';
            case 'sound_issue': return 'مشكلة في الصوت/الترجمة';
            case 'other': return 'أخرى';
            default: return reason;
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-[#1f2937] rounded-2xl border border-gray-700/50 overflow-hidden shadow-xl">
                <div className="px-8 py-6 border-b border-gray-700/50 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-white flex items-center gap-2">⚠️ بلاغات الأعطال ({reports.length})</h3>
                    <button onClick={fetchReports} className="text-sm text-[#00A7F8] hover:text-[#00FFB0] font-bold transition-colors">تحديث</button>
                </div>
                {loading ? (
                    <div className="text-center py-12 text-gray-500">جاري التحميل...</div>
                ) : reports.length === 0 ? (
                    <div className="text-center py-20 text-gray-500 flex flex-col items-center gap-4">
                        <span className="text-4xl opacity-50">✅</span>
                        لا توجد بلاغات أعطال حالياً.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-right text-gray-300">
                            <thead className="bg-gray-800/50 text-xs uppercase font-bold text-gray-400">
                                <tr>
                                    <th className="px-8 py-4">المحتوى</th>
                                    <th className="px-8 py-4">المشكلة</th>
                                    <th className="px-8 py-4">التفاصيل</th>
                                    <th className="px-8 py-4">التاريخ</th>
                                    <th className="px-8 py-4">إجراء</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reports.map(report => (
                                    <tr key={report.id} className="border-b border-gray-700/50 hover:bg-gray-700/20 transition-colors">
                                        <td className="px-8 py-4 font-bold text-white">
                                            {report.contentTitle} 
                                            {report.episode && <span className="block text-[10px] text-[#00A7F8] mt-1">{report.episode}</span>}
                                        </td>
                                        <td className="px-8 py-4">
                                            <span className="bg-red-500/10 text-red-400 px-3 py-1 rounded-full text-xs font-bold">{getReasonLabel(report.reason)}</span>
                                        </td>
                                        <td className="px-8 py-4 text-xs text-gray-400 max-w-xs truncate" title={report.description}>{report.description || '-'}</td>
                                        <td className="px-8 py-4 dir-ltr text-right text-xs font-mono">{new Date(report.createdAt).toLocaleDateString('en-GB')}</td>
                                        <td className="px-8 py-4">
                                            <button onClick={() => onRequestDelete(report.id, `بلاغ: ${report.contentTitle}`)} className="text-red-400 hover:text-red-300 p-2"><TrashIcon /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

const UserManagementTab: React.FC<any> = ({users, onAddAdmin, onRequestDelete, addToast}) => { const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [firstName, setFirstName] = useState(''); const handleAddAdminSubmit = async (e: React.FormEvent) => { e.preventDefault(); if (email && password) { try { await onAddAdmin({email, password, firstName}); setEmail(''); setPassword(''); setFirstName(''); addToast('تمت إضافة المستخدم بنجاح.', 'success'); } catch (error: any) { addToast(error.message, 'error'); } } }; return (<div className="space-y-8"><div className="bg-[#1f2937] p-8 rounded-2xl border border-gray-700/50 shadow-xl"><h3 className="text-xl font-bold mb-6 text-[#00FFB0]">إضافة مستخدم جديد</h3><form onSubmit={handleAddAdminSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end"><div className="w-full"><label className="block text-xs font-bold text-gray-400 mb-2">الاسم</label><input value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00A7F8] text-white placeholder-gray-600" required/></div><div className="w-full"><label className="block text-xs font-bold text-gray-400 mb-2">البريد الإلكتروني</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00A7F8] text-white placeholder-gray-600" required/></div><div className="flex gap-4 w-full"><div className="flex-1"><label className="block text-xs font-bold text-gray-400 mb-2">كلمة المرور</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00A7F8] text-white placeholder-gray-600" required/></div><button type="submit" className="bg-gradient-to-r from-[#00A7F8] to-[#00FFB0] text-black font-bold py-3 px-6 rounded-xl hover:shadow-[0_0_15px_rgba(0,167,248,0.4)] transition-all transform hover:scale-105 h-[48px] mt-auto">إضافة</button></div></form></div><div className="overflow-x-auto bg-[#1f2937] rounded-2xl border border-gray-700/50 shadow-xl"><table className="min-w-full text-sm text-right text-gray-300 whitespace-nowrap"><thead className="bg-gray-800/50 text-xs uppercase font-bold text-gray-400"><tr><th scope="col" className="px-8 py-4">الاسم</th><th scope="col" className="px-8 py-4">البريد الإلكتروني</th><th scope="col" className="px-8 py-4">الدور</th><th scope="col" className="px-8 py-4">إجراءات</th></tr></thead><tbody>{users.map((user:any) => (<tr key={user.id} className="border-b border-gray-700/50 hover:bg-gray-700/20 transition-colors"><td className="px-8 py-4 font-bold text-white">{user.firstName} {user.lastName || ''}</td><td className="px-8 py-4">{user.email}</td><td className="px-8 py-4"><span className={`px-3 py-1 rounded-full text-xs font-bold ${user.role === UserRole.Admin ? 'bg-yellow-500/10 text-yellow-400' : 'bg-gray-700 text-gray-400'}`}>{user.role === UserRole.Admin ? 'مسؤول' : 'مستخدم'}</span></td><td className="px-8 py-4"><button onClick={() => onRequestDelete(user.id, user.email)} className="text-red-400 hover:text-red-300 font-bold text-xs bg-red-500/10 px-3 py-1.5 rounded-lg hover:bg-red-500/20 transition-colors">حذف</button></td></tr>))}</tbody></table></div></div>); };
const PinnedContentManagementTab: React.FC<any> = ({ allContent, pinnedState, setPinnedItems }) => { const [selectedPage, setSelectedPage] = useState<PageKey>('home'); const [searchTerm, setSearchTerm] = useState(''); const [localPinnedItems, setLocalPinnedItems] = useState<PinnedItem[]>([]); const [draggedItem, setDraggedItem] = useState<PinnedItem | null>(null); const [dragOverItem, setDraggedOverItem] = useState<PinnedItem | null>(null); useEffect(() => { setLocalPinnedItems(pinnedState[selectedPage] || []); }, [pinnedState, selectedPage]); const isDirty = JSON.stringify(localPinnedItems) !== JSON.stringify(pinnedState[selectedPage] || []); const pinnedContentDetails = useMemo(() => localPinnedItems.map(pin => { const content = allContent.find((c:any) => c.id === pin.contentId); return content ? { ...pin, contentDetails: content } : null; }).filter((item): item is { contentDetails: Content } & PinnedItem => item !== null), [localPinnedItems, allContent]); const availableContent = useMemo(() => { const pinnedIds = new Set(localPinnedItems.map(p => p.contentId)); let filtered = allContent.filter((c:any) => !pinnedIds.has(c.id)); if (selectedPage === 'movies') filtered = filtered.filter((c:any) => c.type === ContentType.Movie); else if (selectedPage === 'series') filtered = filtered.filter((c:any) => c.type === ContentType.Series); else if (selectedPage === 'kids') filtered = filtered.filter((c:any) => c.categories.includes('افلام أنميشن') || c.visibility === 'kids' || c.genres.includes('أطفال')); else if (selectedPage === 'ramadan') filtered = filtered.filter((c:any) => c.categories.includes('رمضان')); else if (selectedPage === 'soon') filtered = filtered.filter((c:any) => c.categories.includes('قريباً')); return filtered.filter((c:any) => (c.title || '').toLowerCase().includes(searchTerm.toLowerCase())); }, [allContent, localPinnedItems, searchTerm, selectedPage]); const handlePin = (contentId: string) => { if (pinnedContentDetails.length >= 10) { alert('يمكنك تثبيت 10 عناصر كحد أقصى.'); return; } setLocalPinnedItems([...localPinnedItems, { contentId, bannerNote: '' }]); }; const handleUnpin = (contentId: string) => { setLocalPinnedItems(localPinnedItems.filter(p => p.contentId !== contentId)); }; const handleBannerNoteChange = (contentId: string, note: string) => { setLocalPinnedItems(localPinnedItems.map(p => p.contentId === contentId ? { ...p, bannerNote: note } : p)); }; const onDragStart = (e: React.DragEvent<HTMLLIElement>, item: PinnedItem) => { setDraggedItem(item); e.dataTransfer.effectAllowed = 'move'; }; const onDragOver = (e: React.DragEvent<HTMLLIElement>, item: PinnedItem) => { e.preventDefault(); if (draggedItem?.contentId !== item.contentId) { setDraggedOverItem(item); } }; const onDrop = () => { if (!draggedItem || !dragOverItem) return; const currentItems = [...localPinnedItems]; const fromIndex = currentItems.findIndex(p => p.contentId === draggedItem.contentId); const toIndex = currentItems.findIndex(p => p.contentId === dragOverItem.contentId); if (fromIndex === -1 || toIndex === -1) return; const updatedItems = [...currentItems]; const [movedItem] = updatedItems.splice(fromIndex, 1); updatedItems.splice(toIndex, 0, movedItem); setLocalPinnedItems(updatedItems); setDraggedItem(null); setDraggedOverItem(null); }; const onDragEnd = () => { setDraggedItem(null); setDraggedOverItem(null); }; const pageLabels: Record<string, string> = { home: 'الصفحة الرئيسية', movies: 'صفحة الأفلام', series: 'صفحة المسلسلات', ramadan: 'صفحة رمضان', soon: 'صفحة قريباً', kids: 'صفحة الأطفال' }; return ( <div className="grid grid-cols-1 lg:grid-cols-3 gap-6"> <div className="lg:col-span-3 bg-[#1f2937] p-6 rounded-2xl border border-gray-700/50 mb-2 shadow-lg"><h3 className="text-gray-400 mb-4 text-sm font-bold uppercase tracking-wider">اختر الصفحة للتحكم في (Hero Slider):</h3><div className="flex flex-wrap gap-3">{(Object.keys(pageLabels) as PageKey[]).map(key => (<button key={key} onClick={() => setSelectedPage(key)} className={`px-6 py-3 rounded-xl text-sm font-bold transition-all border ${selectedPage === key ? 'bg-[#00A7F8]/20 border-[#00A7F8] text-[#00A7F8] shadow-[0_0_15px_rgba(0,167,248,0.2)]' : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white hover:border-gray-500'}`}>{pageLabels[key]}</button>))}</div></div> <div className="lg:col-span-2 bg-[#1f2937] p-6 rounded-2xl border border-gray-700/50 shadow-xl"><div className="flex justify-between items-center mb-6"><div><h3 className="text-xl font-bold text-[#00FFB0]">المحتوى المميز (Hero): {pageLabels[selectedPage]}</h3><p className="text-sm text-gray-400 mt-1">يتحكم هذا في سلايدر الهيرو (أول 5).</p></div><button onClick={() => setPinnedItems(selectedPage, localPinnedItems)} disabled={!isDirty} className="bg-gradient-to-r from-[#00A7F8] to-[#00FFB0] text-black font-bold py-2 px-6 rounded-xl hover:shadow-[0_0_15px_rgba(0,167,248,0.4)] transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none">حفظ التغييرات</button></div>{pinnedContentDetails.length > 0 ? (<ul onDrop={onDrop} onDragLeave={() => setDraggedOverItem(null)} className="space-y-4">{pinnedContentDetails.map((item, index) => (<li key={item.contentId} draggable onDragStart={(e) => onDragStart(e, item)} onDragOver={(e) => onDragOver(e, item)} onDragEnd={onDragEnd} className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-200 cursor-grab border ${draggedItem?.contentId === item.contentId ? 'opacity-50' : ''} ${dragOverItem?.contentId === item.contentId ? 'bg-gray-700 border-[#00A7F8]' : 'bg-gray-800/50 border-gray-700'}`}><div className="flex flex-col items-center justify-center w-8 text-gray-600 cursor-grab"><div className="w-1.5 h-1.5 bg-gray-600 rounded-full mb-1"></div><div className="w-1.5 h-1.5 bg-gray-600 rounded-full mb-1"></div><div className="w-1.5 h-1.5 bg-gray-600 rounded-full"></div></div><img src={item.contentDetails.poster} alt={item.contentDetails.title} className="w-12 h-16 object-cover rounded-lg bg-gray-900 shadow-sm" /><div className="flex-1 min-w-0"><p className="font-bold text-white text-base truncate mb-1">{item.contentDetails.title}</p><input type="text" placeholder="نص مميز (اختياري)" value={item.bannerNote || ''} onChange={(e) => handleBannerNoteChange(item.contentId, e.target.value)} className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-xs w-full text-gray-300 focus:outline-none focus:border-[#00A7F8] transition-colors"/></div><button onClick={() => handleUnpin(item.contentId)} className="text-red-400 hover:text-red-300 p-2 bg-red-500/10 rounded-lg hover:bg-red-500/20 transition-colors"><CloseIcon className="w-5 h-5" /></button></li>))}</ul>) : (<div className="text-center py-20 text-gray-500 border-2 border-dashed border-gray-700 rounded-3xl flex flex-col items-center justify-center gap-2"><span className="text-4xl opacity-30">📌</span>لا يوجد محتوى مثبت في هذه الصفحة.</div>)}</div> <div className="bg-[#1f2937] p-6 rounded-2xl border border-gray-700/50 shadow-xl h-fit"><h3 className="font-bold text-[#00A7F8] mb-4 text-lg">إضافة محتوى للمثبت</h3><input type="text" placeholder="ابحث لإضافة..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 mb-4 text-white focus:outline-none focus:ring-2 focus:ring-[#00A7F8] placeholder-gray-600"/><div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">{availableContent.slice(0, 20).map((c:any) => (<div key={c.id} className="flex items-center gap-3 p-3 hover:bg-gray-800 rounded-xl transition-colors border border-transparent hover:border-gray-700 cursor-pointer group"><img src={c.poster} alt={c.title} className="w-10 h-14 object-cover rounded-lg bg-gray-900 shadow-sm" /><div className="flex-1 min-w-0"><p className="text-sm font-bold truncate text-white group-hover:text-[#00A7F8] transition-colors">{c.title}</p><p className="text-xs text-gray-500 font-mono">{c.releaseYear}</p></div><button onClick={() => handlePin(c.id)} className="bg-[#00A7F8]/10 text-[#00A7F8] hover:bg-[#00A7F8] hover:text-black font-bold text-xl w-8 h-8 rounded-lg flex items-center justify-center transition-all">+</button></div>))}</div></div> </div> ); };
const Top10ManagerTab: React.FC<any> = ({ allContent, pinnedState, setPinnedItems }) => { const [selectedPage, setSelectedPage] = useState<PageKey>('home'); const [searchTerm, setSearchTerm] = useState(''); const [localPinnedItems, setLocalPinnedItems] = useState<PinnedItem[]>([]); const [draggedItem, setDraggedItem] = useState<PinnedItem | null>(null); const [dragOverItem, setDraggedOverItem] = useState<PinnedItem | null>(null); useEffect(() => { setLocalPinnedItems(pinnedState[selectedPage] || []); }, [pinnedState, selectedPage]); const isDirty = JSON.stringify(localPinnedItems) !== JSON.stringify(pinnedState[selectedPage] || []); const pinnedContentDetails = useMemo(() => localPinnedItems.map(pin => { const content = allContent.find((c:any) => c.id === pin.contentId); return content ? { ...pin, contentDetails: content } : null; }).filter((item): item is { contentDetails: Content } & PinnedItem => item !== null), [localPinnedItems, allContent]); const availableContent = useMemo(() => { const pinnedIds = new Set(localPinnedItems.map(p => p.contentId)); let filtered = allContent.filter((c:any) => !pinnedIds.has(c.id)); if (selectedPage === 'movies') filtered = filtered.filter((c:any) => c.type === ContentType.Movie); else if (selectedPage === 'series') filtered = filtered.filter((c:any) => c.type === ContentType.Series); else if (selectedPage === 'kids') filtered = filtered.filter((c:any) => c.categories.includes('افلام أنميشن') || c.visibility === 'kids' || c.genres.includes('أطفال')); else if (selectedPage === 'ramadan') filtered = filtered.filter((c:any) => c.categories.includes('رمضان')); else if (selectedPage === 'soon') filtered = filtered.filter((c:any) => c.categories.includes('قريباً')); return filtered.filter((c:any) => (c.title || '').toLowerCase().includes(searchTerm.toLowerCase())); }, [allContent, localPinnedItems, searchTerm, selectedPage]); const handlePin = (contentId: string) => { if (pinnedContentDetails.length >= 10) { alert('يمكنك إضافة 10 عناصر كحد أقصى للتوب 10.'); return; } setLocalPinnedItems([...localPinnedItems, { contentId, bannerNote: '' }]); }; const handleUnpin = (contentId: string) => { setLocalPinnedItems(localPinnedItems.filter(p => p.contentId !== contentId)); }; const onDragStart = (e: React.DragEvent<HTMLLIElement>, item: PinnedItem) => { setDraggedItem(item); e.dataTransfer.effectAllowed = 'move'; }; const onDragOver = (e: React.DragEvent<HTMLLIElement>, item: PinnedItem) => { e.preventDefault(); if (draggedItem?.contentId !== item.contentId) { setDraggedOverItem(item); } }; const onDrop = () => { if (!draggedItem || !dragOverItem) return; const currentItems = [...localPinnedItems]; const fromIndex = currentItems.findIndex(p => p.contentId === draggedItem.contentId); const toIndex = currentItems.findIndex(p => p.contentId === dragOverItem.contentId); if (fromIndex === -1 || toIndex === -1) return; const updatedItems = [...currentItems]; const [movedItem] = updatedItems.splice(fromIndex, 1); updatedItems.splice(toIndex, 0, movedItem); setLocalPinnedItems(updatedItems); setDraggedItem(null); setDraggedOverItem(null); }; const onDragEnd = () => { setDraggedItem(null); setDraggedOverItem(null); }; const pageLabels: Record<string, string> = { home: 'الصفحة الرئيسية', movies: 'صفحة الأفلام', series: 'صفحة المسلسلات', ramadan: 'صفحة رمضان', soon: 'صفحة قريباً', kids: 'صفحة الأطفال' }; return ( <div className="grid grid-cols-1 lg:grid-cols-3 gap-6"> <div className="lg:col-span-3 bg-[#1f2937] p-6 rounded-2xl border border-gray-700/50 mb-2 shadow-lg"><h3 className="text-gray-400 mb-4 text-sm font-bold uppercase tracking-wider">اختر الصفحة للتحكم في (Top 10 List):</h3><div className="flex flex-wrap gap-3">{(Object.keys(pageLabels) as PageKey[]).map(key => (<button key={key} onClick={() => setSelectedPage(key)} className={`px-6 py-3 rounded-xl text-sm font-bold transition-all border ${selectedPage === key ? 'bg-[#FFD700]/20 border-[#FFD700] text-[#FFD700] shadow-[0_0_15px_rgba(245,215,0,0.2)]' : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white hover:border-gray-500'}`}>{pageLabels[key]}</button>))}</div></div> <div className="lg:col-span-2 bg-[#1f2937] p-6 rounded-2xl border border-gray-700/50 shadow-xl"><div className="flex justify-between items-center mb-6"><div><h3 className="text-xl font-bold text-[#FFD700]">قائمة التوب 10 في: {pageLabels[selectedPage]}</h3><p className="text-sm text-gray-400 mt-1">يتحكم هذا في قائمة أفضل 10 أعمال.</p></div><button onClick={() => setPinnedItems(selectedPage, localPinnedItems)} disabled={!isDirty} className="bg-gradient-to-r from-[#FFD700] to-[#F59E0B] text-black font-bold py-2 px-6 rounded-xl hover:shadow-[0_0_15px_rgba(255,215,0,0.4)] transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none">حفظ التغييرات</button></div>{pinnedContentDetails.length > 0 ? (<ul onDrop={onDrop} onDragLeave={() => setDraggedOverItem(null)} className="space-y-4">{pinnedContentDetails.map((item, index) => (<li key={item.contentId} draggable onDragStart={(e) => onDragStart(e, item)} onDragOver={(e) => onDragOver(e, item)} onDragEnd={onDragEnd} className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-200 cursor-grab border ${draggedItem?.contentId === item.contentId ? 'opacity-50' : ''} ${dragOverItem?.contentId === item.contentId ? 'bg-gray-700 border-[#FFD700]' : 'bg-gray-800/50 border-gray-700'}`}><div className="flex flex-col items-center justify-center w-8 text-gray-600 cursor-grab"><div className="rank-font font-black text-xl text-[#FFD700]">#{index + 1}</div></div><img src={item.contentDetails.poster} alt={item.contentDetails.title} className="w-12 h-16 object-cover rounded-lg bg-gray-900 shadow-sm" /><div className="flex-1 min-w-0"><p className="font-bold text-white text-base truncate mb-1">{item.contentDetails.title}</p></div><button onClick={() => handleUnpin(item.contentId)} className="text-red-400 hover:text-red-300 p-2 bg-red-500/10 rounded-lg hover:bg-red-500/20 transition-colors"><CloseIcon className="w-5 h-5" /></button></li>))}</ul>) : (<div className="text-center py-20 text-gray-500 border-2 border-dashed border-gray-700 rounded-3xl flex flex-col items-center justify-center gap-2"><span className="text-4xl opacity-30">🏆</span>لا يوجد محتوى في قائمة التوب 10 لهذه الصفحة.</div>)}</div> <div className="bg-[#1f2937] p-6 rounded-2xl border border-gray-700/50 shadow-xl h-fit"><h3 className="font-bold text-[#FFD700] mb-4 text-lg">إضافة محتوى للتوب 10</h3><input type="text" placeholder="ابحث لإضافة..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 mb-4 text-white focus:outline-none focus:ring-2 focus:ring-[#FFD700] placeholder-gray-600"/><div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">{availableContent.slice(0, 20).map((c:any) => (<div key={c.id} className="flex items-center gap-3 p-3 hover:bg-gray-800 rounded-xl transition-colors border border-transparent hover:border-gray-700 cursor-pointer group"><img src={c.poster} alt={c.title} className="w-10 h-14 object-cover rounded-lg bg-gray-900 shadow-sm" /><div className="flex-1 min-w-0"><p className="text-sm font-bold truncate text-white group-hover:text-[#FFD700] transition-colors">{c.title}</p><p className="text-xs text-gray-500 font-mono">{c.releaseYear}</p></div><button onClick={() => handlePin(c.id)} className="bg-[#FFD700]/10 text-[#FFD700] hover:bg-[#FFD700] hover:text-black font-bold text-xl w-8 h-8 rounded-lg flex items-center justify-center transition-all">+</button></div>))}</div></div> </div> ); };
const AdsManagementTab: React.FC<any> = ({ ads, onNew, onEdit, onRequestDelete, onUpdateAd }) => { return ( <div> <div className="flex justify-between items-center mb-8 bg-[#1f2937] p-6 rounded-2xl border border-gray-700/50 shadow-lg"> <h3 className="text-xl font-bold text-white">إدارة الإعلانات</h3> <button onClick={onNew} className="bg-gradient-to-r from-[#00A7F8] to-[#00FFB0] text-black font-bold py-3 px-6 rounded-xl hover:shadow-[0_0_15px_rgba(0,167,248,0.4)] transition-all transform hover:scale-105">إضافة إعلان جديد</button> </div> <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"> {ads.map((ad:any) => ( <div key={ad.id} className="bg-[#1f2937] border border-gray-700/50 p-6 rounded-2xl flex flex-col justify-between shadow-lg hover:border-[#00A7F8]/30 transition-all"> <div> <div className="flex justify-between items-start mb-4"> <h4 className="font-bold text-white text-lg">{ad.title}</h4> <div className="flex gap-2"> <span className={`px-2 py-1 rounded-md text-[10px] border font-bold uppercase tracking-wider ${ad.targetDevice === 'mobile' ? 'bg-blue-500/10 text-blue-400' : ad.targetDevice === 'desktop' ? 'bg-purple-500/10 text-purple-400' : 'bg-gray-700 text-gray-400 border-gray-600'}`}>{ad.targetDevice === 'mobile' ? 'موبايل' : ad.targetDevice === 'desktop' ? 'كمبيوتر' : 'الكل'}</span> <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${ad.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{ad.status === 'active' ? 'نشط' : 'معطل'}</span> </div> </div> <p className="text-xs text-gray-400 mb-3 font-mono bg-gray-900/50 p-2 rounded border border-gray-700">{adPlacementLabels[ad.placement as keyof typeof adPlacementLabels]}</p> <div className="bg-gray-900 p-3 rounded-lg text-xs text-gray-500 font-mono truncate mb-6 border border-gray-800">{ad.code}</div> </div> <div className="flex justify-end gap-3 pt-4 border-t border-gray-700/50 items-center"> <ToggleSwitch checked={ad.status === 'active'} onChange={(c) => onUpdateAd({...ad, status: c ? 'active' : 'disabled'})} className="mr-auto scale-90" /> <button onClick={() => onEdit(ad)} className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors">تعديل</button> <button onClick={() => onRequestDelete(ad.id, ad.title)} className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2 rounded-lg text-xs font-bold transition-colors">حذف</button> </div> </div> ))} {ads.length === 0 && ( <div className="col-span-full text-center py-20 text-gray-500 border-2 border-dashed border-gray-700 rounded-3xl flex flex-col items-center justify-center gap-2"><span className="text-4xl opacity-30">📢</span>لا توجد إعلانات.</div> )} </div> </div> ); }
const ThemesTab: React.FC<any> = ({ siteSettings, onSetSiteSettings }) => { const changeTheme = (theme: ThemeType) => { onSetSiteSettings({ ...siteSettings, activeTheme: theme }); }; return ( <div className="space-y-6 max-w-5xl mx-auto animate-fade-in-up"> <div className="bg-[#1f2937] p-8 rounded-2xl border border-gray-700/50 space-y-8 shadow-xl"> <h3 className="text-xl font-bold text-[#00A7F8] mb-4 border-b border-gray-700 pb-4">إعدادات المظهر (Themes)</h3> <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"> <div onClick={() => changeTheme('default')} className={`p-5 border rounded-2xl cursor-pointer transition-all hover:scale-[1.02] ${siteSettings.activeTheme === 'default' ? 'border-[#00A7F8] bg-[#00A7F8]/5 shadow-[0_0_20px_rgba(0,167,248,0.1)]' : 'border-gray-700 bg-gray-800 hover:border-gray-500'}`}><div className="h-24 bg-gradient-to-r from-[#00A7F8] to-[#00FFB0] rounded-xl mb-4 shadow-lg"></div><h4 className="font-bold text-white text-lg">الافتراضي (السايبر)</h4><p className="text-xs text-gray-400 mt-2 leading-relaxed">الثيم الأساسي باللون الأزرق والأخضر.</p>{siteSettings.activeTheme === 'default' && <div className="mt-3 text-[#00A7F8] text-xs font-bold bg-[#00A7F8]/10 px-2 py-1 rounded w-fit">✓ مفعل</div>}</div> <div onClick={() => changeTheme('netflix-red')} className={`p-5 border rounded-2xl cursor-pointer transition-all hover:scale-[1.02] ${siteSettings.activeTheme === 'netflix-red' ? 'border-[#E50914] bg-[#E50914]/5 shadow-[0_0_20px_rgba(229,9,20,0.1)]' : 'border-gray-700 bg-gray-800 hover:border-gray-500'}`}><div className="h-24 bg-[#141414] rounded-xl mb-4 shadow-lg flex items-center justify-center border-b-4 border-[#E50914]"><span className="text-[#E50914] text-3xl font-black tracking-tighter">N</span></div><h4 className="font-bold text-white text-lg">الأحمر الداكن (Netflix)</h4><p className="text-xs text-gray-400 mt-2 leading-relaxed">تطميم سينمائي باللون الأسود والأحمر.</p>{siteSettings.activeTheme === 'netflix-red' && <div className="mt-3 text-[#E50914] text-xs font-bold bg-[#E50914]/10 px-2 py-1 rounded w-fit">✓ مفعل</div>}</div> <div onClick={() => changeTheme('cosmic-teal')} className={`p-5 border rounded-2xl cursor-pointer transition-all hover:scale-[1.02] ${siteSettings.activeTheme === 'cosmic-teal' ? 'border-[#35F18B] bg-[#35F18B]/5 shadow-[0_0_20px_rgba(53,241,139,0.1)]' : 'border-gray-700 bg-gray-800 hover:border-gray-500'}`}><div className="h-24 bg-gradient-to-br from-[#35F18B] to-[#2596be] rounded-xl mb-4 shadow-lg flex items-center justify-center text-3xl relative overflow-hidden"><div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534796636912-3b95ab3ab5986?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80')] opacity-50 bg-cover"></div><span className="relative z-10">✨</span></div><h4 className="font-bold text-white text-lg">الكوني (Cosmic Teal)</h4><p className="text-xs text-gray-400 mt-2 leading-relaxed">تصميم عصري بألوان الأخضر الزاهي.</p>{siteSettings.activeTheme === 'cosmic-teal' && <div className="mt-3 text-[#35F18B] text-xs font-bold bg-[#35F18B]/10 px-2 py-1 rounded w-fit">✓ مفعل</div>}</div> <div onClick={() => changeTheme('ramadan')} className={`p-5 border rounded-2xl cursor-pointer transition-all hover:scale-[1.02] ${siteSettings.activeTheme === 'ramadan' ? 'border-amber-500 bg-amber-500/5 shadow-[0_0_20px_rgba(245,158,11,0.1)]' : 'border-gray-700 bg-gray-800 hover:border-gray-500'}`}><div className="h-24 bg-gradient-to-br from-[#D4AF37] to-[#F59E0B] rounded-xl mb-4 shadow-lg flex items-center justify-center text-3xl">🌙</div><h4 className="font-bold text-white text-lg">رمضان الذهبي</h4><p className="text-xs text-gray-400 mt-2 leading-relaxed">ألوان ذهبية دافئة للأجواء الرمضانية.</p>{siteSettings.activeTheme === 'ramadan' && <div className="mt-3 text-amber-500 text-xs font-bold bg-amber-500/10 px-2 py-1 rounded w-fit">✓ مفعل</div>}</div> <div onClick={() => changeTheme('eid')} className={`p-5 border rounded-2xl cursor-pointer transition-all hover:scale-[1.02] ${siteSettings.activeTheme === 'eid' ? 'border-purple-500 bg-purple-500/5 shadow-[0_0_20px_rgba(168,85,247,0.1)]' : 'border-gray-700 bg-gray-800 hover:border-gray-500'}`}><div className="h-24 bg-gradient-to-br from-[#6A0DAD] to-[#C0C0C0] rounded-xl mb-4 shadow-lg flex items-center justify-center text-3xl">🎉</div><h4 className="font-bold text-white text-lg">العيد (بنفسجي)</h4><p className="text-xs text-gray-400 mt-2 leading-relaxed">ألوان احتفالية مبهجة للمناسبات.</p>{siteSettings.activeTheme === 'eid' && <div className="mt-3 text-purple-500 text-xs font-bold bg-purple-500/10 px-2 py-1 rounded w-fit">✓ مفعل</div>}</div> <div onClick={() => changeTheme('ios')} className={`p-5 border rounded-2xl cursor-pointer transition-all hover:scale-[1.02] ${siteSettings.activeTheme === 'ios' ? 'border-[#00C6FF] bg-[#00C6FF]/5 shadow-[0_0_20px_rgba(0,198,255,0.1)]' : 'border-gray-700 bg-gray-800 hover:border-gray-500'}`}><div className="h-24 bg-gradient-to-r from-[#00C6FF] to-[#0072FF] rounded-xl mb-4 shadow-lg relative overflow-hidden"><div className="absolute inset-0 bg-white/20 backdrop-blur-sm"></div></div><h4 className="font-bold text-white text-lg">iOS Glass</h4><p className="text-xs text-gray-400 mt-2 leading-relaxed">تصميم زجاجي عصري مع تدرجات سماوية.</p>{siteSettings.activeTheme === 'ios' && <div className="mt-3 text-[#00C6FF] text-xs font-bold bg-[#00C6FF]/10 px-2 py-1 rounded w-fit">✓ مفعل</div>}</div> <div onClick={() => changeTheme('night-city')} className={`p-5 border rounded-2xl cursor-pointer transition-all hover:scale-[1.02] ${siteSettings.activeTheme === 'night-city' ? 'border-[#FF00FF] bg-[#FF00FF]/5 shadow-[0_0_20px_rgba(255,0,255,0.1)]' : 'border-gray-700 bg-gray-800 hover:border-gray-500'}`}><div className="h-24 bg-black rounded-xl mb-4 shadow-[0_0_15px_#FF00FF] relative border border-[#00FFFF]"><div className="absolute inset-0 bg-gradient-to-r from-[#FF00FF]/30 to-[#00FFFF]/30"></div></div><h4 className="font-bold text-white text-lg">Night City</h4><p className="text-xs text-gray-400 mt-2 leading-relaxed">ألوان نيون حيوية ومظهر مستقبلي.</p>{siteSettings.activeTheme === 'night-city' && <div className="mt-3 text-[#FF00FF] text-xs font-bold bg-[#FF00FF]/10 px-2 py-1 rounded w-fit">✓ مفعل</div>}</div> <div onClick={() => changeTheme('nature')} className={`p-5 border rounded-2xl cursor-pointer transition-all hover:scale-[1.02] ${siteSettings.activeTheme === 'nature' ? 'border-[#8FBC8F] bg-[#8FBC8F]/5 shadow-[0_0_20px_rgba(143,188,143,0.1)]' : 'border-gray-700 bg-gray-800 hover:border-gray-500'}`}><div className="h-24 bg-gradient-to-br from-[#2F4F4F] to-[#8FBC8F] rounded-xl mb-4 shadow-lg"></div><h4 className="font-bold text-white text-lg">Nature</h4><p className="text-xs text-gray-400 mt-2 leading-relaxed">ألوان طبيعية هادئة مستوحاة من الغابات.</p>{siteSettings.activeTheme === 'nature' && <div className="mt-3 text-[#8FBC8F] text-xs font-bold bg-[#8FBC8F]/10 px-2 py-1 rounded w-fit">✓ مفعل</div>}</div> </div> </div> </div> ); }

const SiteSettingsTab: React.FC<{
    siteSettings: SiteSettings;
    onSetSiteSettings: (s: SiteSettings) => void;
    allContent: Content[];
    addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}> = ({ siteSettings, onSetSiteSettings, allContent, addToast }) => {
    
    const handleChange = (field: keyof SiteSettings, value: any) => { onSetSiteSettings({ ...siteSettings, [field]: value }); };
    const handleNestedChange = (parent: keyof SiteSettings, child: string, value: any) => { onSetSiteSettings({ ...siteSettings, [parent]: { ...(siteSettings[parent] as any), [child]: value } }); };
    
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        addToast('تم نسخ الرابط إلى الحافظة', 'success');
    };

    const generateSpecificSitemap = (type: 'index' | 'movies' | 'series' | 'seasons' | 'episodes') => {
        const baseUrl = 'https://cinematix.watch';
        const date = new Date().toISOString().split('T')[0];
        const escapeXml = (unsafe: string) => {
            return unsafe.replace(/[<>&'"]/g, function (c) {
                switch (c) {
                    case '<': return '&lt;';
                    case '>': return '&gt;';
                    case '&': return '&amp;';
                    case '\'': return '&apos;';
                    case '"': return '&quot;';
                    default: return c;
                }
            });
        };
        let xmlContent = '';
        let fileName = '';
        if (type === 'index') {
            fileName = 'sitemap-index.xml';
            xmlContent = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <sitemap>\n    <loc>${escapeXml(`${baseUrl}/movie-sitemap.xml`)}</loc>\n    <lastmod>${date}</lastmod>\n  </sitemap>\n  <sitemap>\n    <loc>${escapeXml(`${baseUrl}/series-sitemap.xml`)}</loc>\n    <lastmod>${date}</lastmod>\n  </sitemap>\n  <sitemap>\n    <loc>${escapeXml(`${baseUrl}/season-sitemap.xml`)}</loc>\n    <lastmod>${date}</lastmod>\n  </sitemap>\n  <sitemap>\n    <loc>${escapeXml(`${baseUrl}/episode-sitemap.xml`)}</loc>\n    <lastmod>${date}</lastmod>\n  </sitemap>\n</sitemapindex>`;
        } else {
            xmlContent = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">\n`;
            if (type === 'movies') {
                fileName = 'movie-sitemap.xml';
                allContent.filter(c => c.type === 'movie').forEach(item => {
                    const slug = item.slug || item.id;
                    xmlContent += `  <url>\n    <loc>${escapeXml(`${baseUrl}/فيلم/${slug}`)}</loc>\n    <lastmod>${item.updatedAt ? item.updatedAt.split('T')[0] : date}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.9</priority>\n    <video:video>\n      <video:thumbnail_loc>${escapeXml(item.poster || '')}</video:thumbnail_loc>\n      <video:title>${escapeXml(item.title)}</video:title>\n      <video:description>${escapeXml(item.description || item.title).substring(0, 1000)}</video:description>\n      <video:publication_date>${item.releaseYear}-01-01T00:00:00+00:00</video:publication_date>\n    </video:video>\n  </url>\n`;
                });
            } else if (type === 'series') {
                fileName = 'series-sitemap.xml';
                allContent.filter(c => c.type === 'series').forEach(item => {
                    xmlContent += `  <url>\n    <loc>${escapeXml(`${baseUrl}/مسلسل/${item.slug || item.id}`)}</loc>\n    <lastmod>${item.updatedAt ? item.updatedAt.split('T')[0] : date}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;
                });
            } else if (type === 'seasons') {
                fileName = 'season-sitemap.xml';
                allContent.filter(c => c.type === 'series').forEach(item => {
                    item.seasons?.forEach(season => {
                        xmlContent += `  <url>\n    <loc>${escapeXml(`${baseUrl}/مسلسل/${item.slug || item.id}/الموسم/${season.seasonNumber}`)}</loc>\n    <lastmod>${item.updatedAt ? item.updatedAt.split('T')[0] : date}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
                    });
                });
            } else if (type === 'episodes') {
                fileName = 'episode-sitemap.xml';
                allContent.filter(c => c.type === 'series').forEach(item => {
                    item.seasons?.forEach(season => {
                        season.episodes.forEach((ep, index) => {
                            const epNum = index + 1;
                            xmlContent += `  <url>\n    <loc>${escapeXml(`${baseUrl}/مسلسل/${item.slug || item.id}/الموسم/${season.seasonNumber}/الحلقة/${epNum}`)}</loc>\n    <lastmod>${item.updatedAt ? item.updatedAt.split('T')[0] : date}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n    <video:video>\n      <video:thumbnail_loc>${escapeXml(ep.thumbnail || item.poster || '')}</video:thumbnail_loc>\n      <video:title>${escapeXml(`${item.title} - الموسم ${season.seasonNumber} الحلقة ${epNum}`)}</video:title>\n      <video:description>${escapeXml(item.description || item.title).substring(0, 1000)}</video:description>\n      <video:publication_date>${item.releaseYear}-01-01T00:00:00+00:00</video:publication_date>\n    </video:video>\n  </url>\n`;
                        });
                    });
                });
            }
            xmlContent += `</urlset>`;
        }
        const blob = new Blob([xmlContent], { type: 'text/xml' });
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = blobUrl; a.download = fileName; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(blobUrl);
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="bg-[#1f2937] p-8 rounded-2xl border border-gray-700/50 shadow-xl">
                <h3 className="text-xl font-bold text-[#00A7F8] mb-6">تحسين محركات البحث (SEO)</h3>
                <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-600/50 mb-4">
                    <h4 className="font-bold text-white mb-2">مولد خرائط الموقع (Split Sitemaps)</h4>
                    <p className="text-xs text-gray-400 mb-6 leading-relaxed">قم بتنزيل الملفات التالية ورفعها إلى مجلد `public` في مشروعك لضمان الفهرسة الكاملة في جوجل.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <button onClick={() => generateSpecificSitemap('index')} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-lg"><DocumentArrowDownIcon /> 1. Sitemap Index</button>
                        <button onClick={() => generateSpecificSitemap('movies')} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 border border-gray-600"><DocumentArrowDownIcon /> 2. Movies XML</button>
                        <button onClick={() => generateSpecificSitemap('series')} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 border border-gray-600"><DocumentArrowDownIcon /> 3. Series XML</button>
                        <button onClick={() => generateSpecificSitemap('seasons')} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 border border-gray-600"><DocumentArrowDownIcon /> 4. Seasons XML</button>
                        <button onClick={() => generateSpecificSitemap('episodes')} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 border border-gray-600"><DocumentArrowDownIcon /> 5. Episodes XML</button>
                    </div>
                </div>
            </div>
            
            {/* Ramadan & Countdown Settings Section */}
            <div className="bg-[#1f2937] p-8 rounded-2xl border border-gray-700/50 space-y-6 shadow-xl">
                <h3 className="text-xl font-bold text-amber-500 mb-4 flex items-center gap-2">
                    <span>🌙</span> إعدادات شهر رمضان (العد التنازلي)
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2">تاريخ ووقت انتهاء العد التنازلي</label>
                        <input 
                            type="datetime-local" 
                            value={siteSettings.countdownDate ? siteSettings.countdownDate.substring(0, 16) : ''} 
                            onChange={(e) => handleChange('countdownDate', e.target.value)} 
                            className="w-full bg-[#0f1014] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all duration-300"
                        />
                        <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">حدد الموعد الذي سيختفي عنده العداد تلقائياً (بداية رمضان).</p>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
                            <div className="flex flex-col">
                                <span className="font-bold text-sm">تفعيل العداد التنازلي</span>
                                <span className="text-[10px] text-gray-500">إظهار أو إخفاء (إيقاف) العداد في صفحة رمضان.</span>
                            </div>
                            <ToggleSwitch checked={siteSettings.isCountdownVisible} onChange={(c) => handleChange('isCountdownVisible', c)} />
                        </div>
                        
                        <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
                            <div className="flex flex-col">
                                <span className="font-bold text-sm">عرض كاروسيل رمضان في الرئيسية</span>
                                <span className="text-[10px] text-gray-500">تفعيل القسم الخاص بأعمال رمضان في الصفحة الرئيسية.</span>
                            </div>
                            <ToggleSwitch checked={siteSettings.isShowRamadanCarousel} onChange={(c) => handleChange('isShowRamadanCarousel', c)} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-[#1f2937] p-8 rounded-2xl border border-gray-700/50 space-y-6 shadow-xl"><h3 className="text-xl font-bold text-[#00A7F8] mb-4">أوضاع الموقع</h3><div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700/50"><span>وضع الصيانة (يغلق الموقع للزوار)</span><ToggleSwitch checked={siteSettings.is_maintenance_mode_enabled} onChange={(c) => handleChange('is_maintenance_mode_enabled', c)} /></div><div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700/50"><span>تفعيل الإعلانات في الموقع</span><ToggleSwitch checked={siteSettings.adsEnabled} onChange={(c) => handleChange('adsEnabled', c)} /></div></div>
            <div className="bg-[#1f2937] p-8 rounded-2xl border border-gray-700/50 shadow-xl"><div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold text-[#00A7F8]">شريط الإعلانات العلوي (ShoutBar)</h3><ToggleSwitch checked={siteSettings.shoutBar.isVisible} onChange={(c) => handleNestedChange('shoutBar', 'isVisible', c)} /></div><input value={siteSettings.shoutBar.text} onChange={(e) => handleNestedChange('shoutBar', 'text', e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-5 py-3 text-white focus:outline-none focus:border-[#00A7F8]" placeholder="نص الشريط المتحرك..."/></div>
            <div className="bg-[#1f2937] p-8 rounded-2xl border border-gray-700/50 shadow-xl"><h3 className="text-xl font-bold text-[#00A7F8] mb-6">روابط التواصل الاجتماعي</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-6">{Object.keys(siteSettings.socialLinks).map((key) => (<div key={key}><label className="block text-xs font-bold text-gray-400 mb-2 capitalize">{key}</label><input value={(siteSettings.socialLinks as any)[key]} onChange={(e) => handleNestedChange('socialLinks', key, e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00A7F8] text-white dir-ltr"/></div>))}</div></div>
            <div className="bg-[#1f2937] p-8 rounded-2xl border border-gray-700/50 shadow-xl"><h3 className="text-xl font-bold text-[#00A7F8] mb-6">إعدادات الإشعارات (Firebase Cloud Messaging)</h3><div className="bg-gray-800/50 p-6 rounded-xl border border-gray-600/50"><label className="block text-xs font-bold text-gray-300 mb-3">Service Account JSON (مطلوب لـ FCM HTTP v1)</label><textarea value={siteSettings.serviceAccountJson || ''} onChange={(e) => handleChange('serviceAccountJson', e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white font-mono text-xs focus:border-[#00A7F8] focus:outline-none h-48 dir-ltr" placeholder='{ "type": "service_account", "project_id": "...", ... }'/><p className="text-[10px] text-gray-400 mt-3 leading-relaxed">انسخ محتوى ملف JSON الخاص بـ Service Account هنا. هذا مطلوب لإرسال الإشعارات عبر API v1 الجديد.</p></div></div>
            <div className="bg-[#1f2937] p-8 rounded-2xl border border-gray-700/50 shadow-xl"><h3 className="text-xl font-bold text-[#00A7F8] mb-6">سياسة الخصوصية</h3><textarea value={siteSettings.privacyPolicy} onChange={(e) => handleChange('privacyPolicy', e.target.value)} className="w-full h-48 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00A7F8]"/></div>
            <div className="bg-[#1f2937] p-8 rounded-2xl border border-gray-700/50 shadow-xl"><h3 className="text-xl font-bold text-[#00A7F8] mb-4">سياسة حقوق الملكية</h3><textarea value={siteSettings.copyrightPolicy || ''} onChange={(e) => handleChange('copyrightPolicy', e.target.value)} className="w-full h-48 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00A7F8]" placeholder="أدخل نص سياسة حقوق الملكية هنا..."/></div>
        </div>
    );
};

const NotificationTab: React.FC<any> = ({ addToast, serviceAccountJson, allUsers, onRequestDelete }) => {
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [image, setImage] = useState('');
    const [url, setUrl] = useState('/');
    const [type, setType] = useState<'info' | 'play' | 'alert' | 'new_content'>('new_content');
    const [sending, setSending] = useState(false);
    const [history, setHistory] = useState<BroadcastNotification[]>([]);

    useEffect(() => { fetchHistory(); }, []);

    const fetchHistory = async () => {
        const data = await getBroadcastHistory();
        setHistory(data);
    };

    const handleSendNotification = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);
        try {
            const broadcastId = String(Date.now());
            
            // 1. Send via FCM if service account available
            if (serviceAccountJson) {
                const accessToken = await getAccessToken(serviceAccountJson);
                if (accessToken) {
                    const parsedServiceAccount = JSON.parse(serviceAccountJson);
                    const projectId = parsedServiceAccount.project_id;
                    const allTokens: string[] = [];
                    allUsers.forEach((u: any) => {
                        if (u.fcmTokens && Array.isArray(u.fcmTokens)) allTokens.push(...u.fcmTokens);
                    });
                    const uniqueTokens = Array.from(new Set(allTokens));
                    const notificationData = { title, body, image: image || '/icon-192.png', data: { url } };
                    await Promise.all(uniqueTokens.map(token => sendFCMv1Message(token, notificationData, accessToken, projectId)));
                }
            }

            // 2. IMPORTANT: Create Firestore records for ALL users
            const batch = db.batch();
            allUsers.forEach((user: any) => {
                const notifRef = db.collection('notifications').doc();
                const newNotif: Omit<Notification, 'id'> = {
                    userId: user.id,
                    title,
                    body,
                    type,
                    isRead: false,
                    createdAt: new Date().toISOString(),
                    targetUrl: url || undefined,
                    imageUrl: image || undefined,
                    broadcastId: broadcastId
                };
                batch.set(notifRef, newNotif);
            });

            // 3. Save to Broadcast History
            const historyRef = db.collection('broadcast_history').doc(broadcastId);
            batch.set(historyRef, {
                title, body, type, imageUrl: image || null, targetUrl: url || null,
                createdAt: new Date().toISOString(),
                recipientCount: allUsers.length
            });

            await batch.commit();

            addToast(`تم إرسال الإشعار لـ ${allUsers.length} مستخدم بنجاح!`, 'success');
            setTitle(''); setBody(''); setImage(''); setUrl('/'); setType('new_content');
            fetchHistory();
        } catch (error: any) { 
            addToast('فشل إرسال الإشعارات: ' + error.message, 'error'); 
        } finally { 
            setSending(false); 
        }
    };

    const getIcon = (t: string) => {
        switch(t) {
            case 'new_content': return <div className="p-2 bg-green-500/10 text-green-500 rounded-lg"><PlayIcon className="w-5 h-5"/></div>;
            case 'alert': return <div className="p-2 bg-red-500/10 text-red-500 rounded-lg">⚠️</div>;
            default: return <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">ℹ️</div>;
        }
    };

    const getAccentPreview = (t: string) => {
        switch(t) {
            case 'new_content': return 'bg-green-500/10 border-green-500/20';
            case 'alert': return 'bg-red-500/10 border-red-500/20';
            default: return 'bg-blue-500/10 border-blue-500/20';
        }
    };

    return (
        <div className="space-y-10 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* FORM SECTION */}
                <div className="lg:col-span-7 bg-[#1f2937] p-8 rounded-3xl border border-gray-700/50 shadow-xl">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2"><PaperAirplaneIcon /> إرسال إشعار جماعي</h3>
                        <button type="button" onClick={() => {setTitle(''); setBody(''); setImage(''); setUrl('/');}} className="text-xs text-gray-500 hover:text-white">مسح الحقول</button>
                    </div>
                    <form onSubmit={handleSendNotification} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-2">عنوان الإشعار</label>
                                <input value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-[#00A7F8] outline-none" required placeholder="مثال: تم إضافة فيلم أفاتار 2"/>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-2">نوع الإشعار</label>
                                <select value={type} onChange={e => setType(e.target.value as any)} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-[#00A7F8] outline-none">
                                    <option value="new_content">🟢 محتوى جديد</option>
                                    <option value="alert">🟡 تنبيه (System)</option>
                                    <option value="info">🔵 خبر (Info)</option>
                                </select>
                            </div>
                        </div>
                        <div><label className="block text-xs font-bold text-gray-400 mb-2">نص الرسالة</label><textarea value={body} onChange={e => setBody(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white h-24 outline-none focus:border-[#00A7F8]" required placeholder="التفاصيل..."/></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className="block text-xs font-bold text-gray-400 mb-2">رابط الصورة (بوستر)</label><input value={image} onChange={e => setImage(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white dir-ltr" placeholder="https://..."/></div>
                            <div><label className="block text-xs font-bold text-gray-400 mb-2">رابط التوجيه (URL)</label><input value={url} onChange={e => setUrl(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white dir-ltr" placeholder="/watch/movie/123"/></div>
                        </div>
                        <button type="submit" disabled={sending || !title} className="w-full bg-gradient-to-r from-[#00A7F8] to-[#00FFB0] text-black font-black py-4 rounded-2xl shadow-lg hover:shadow-[#00A7F8]/40 transition-all transform hover:scale-[1.01] disabled:opacity-50">
                            {sending ? 'جاري الإرسال...' : `🚀 إرسال إلى ${allUsers.length} مستخدم`}
                        </button>
                    </form>
                </div>

                {/* PREVIEW SECTION */}
                <div className="lg:col-span-5">
                    <div className="sticky top-28">
                        <label className="block text-xs font-bold text-gray-500 mb-4 uppercase tracking-widest text-center">المعاينة الحية (Mobile Preview)</label>
                        <div className="relative mx-auto w-[280px] h-[580px] bg-[#000] border-[8px] border-[#1f2937] rounded-[3rem] shadow-2xl overflow-hidden">
                            <div className="absolute top-0 w-full h-6 bg-[#1f2937] flex justify-center items-end pb-1"><div className="w-16 h-3 bg-black rounded-full"></div></div>
                            <div className="p-4 pt-10">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="w-8 h-8 rounded-full bg-gray-800"></div>
                                    <div className="relative"><BellIcon className="w-6 h-6 text-gray-500"/><div className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full flex items-center justify-center text-[8px] font-bold">1</div></div>
                                </div>
                                
                                <div className={`border rounded-[1.5rem] shadow-lg animate-fade-in-up overflow-hidden ${getAccentPreview(type)}`}>
                                    <div className="flex items-stretch">
                                        {image && (
                                            <div className="w-20 flex-shrink-0 self-stretch border-l border-white/10 bg-black">
                                                <img src={image} className="w-full h-full object-cover" />
                                            </div>
                                        )}

                                        <div className="flex-1 p-3 min-w-0">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-[7px] font-bold text-gray-400 uppercase tracking-tighter">تحديث</span>
                                                <span className="text-[7px] text-gray-500 font-bold">الآن</span>
                                            </div>
                                            
                                            <div className="flex gap-2 items-start">
                                                 <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 bg-white/5">
                                                    {getIcon(type)}
                                                 </div>
                                                 <div className="flex-1 min-w-0">
                                                     <h4 className="text-[10px] font-bold text-white truncate">{title || 'عنوان الإشعار يظهر هنا'}</h4>
                                                     <p className="text-[8px] text-gray-400 line-clamp-2 mt-0.5 leading-tight">{body || 'نص الرسالة التفصيلي سيظهر في هذا المكان...'}</p>
                                                     
                                                     {url !== '/' && (
                                                         <div className="mt-2 flex items-center gap-1 text-[#00A7F8] font-bold text-[7px]">
                                                             <span>اكتشف الآن</span>
                                                             <span className="scale-75 transform rotate-180">→</span>
                                                         </div>
                                                     )}
                                                 </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* HISTORY SECTION */}
            <div className="bg-[#1f2937] rounded-3xl border border-gray-700/50 shadow-xl overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-700/50 flex justify-between items-center bg-black/10">
                    <h3 className="font-bold text-lg text-white">آخر الإشعارات المرسلة</h3>
                    <span className="text-xs text-gray-500">تلقائياً يتم حذف السجلات القديمة</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right text-gray-300">
                        <thead className="bg-gray-800/50 text-xs font-bold text-gray-400 uppercase">
                            <tr><th className="px-8 py-4">النوع</th><th className="px-8 py-4">العنوان</th><th className="px-8 py-4">المستلمون</th><th className="px-8 py-4">التاريخ</th><th className="px-8 py-4">إجراء</th></tr>
                        </thead>
                        <tbody>
                            {history.map(item => (
                                <tr key={item.id} className="border-b border-gray-700/30 hover:bg-gray-700/20 transition-colors group">
                                    <td className="px-8 py-4">{getIcon(item.type)}</td>
                                    <td className="px-8 py-4 font-bold text-white">{item.title}</td>
                                    <td className="px-8 py-4"><span className="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded text-xs">{item.recipientCount}</span></td>
                                    <td className="px-8 py-4 text-xs font-mono text-gray-500">{new Date(item.createdAt).toLocaleDateString('en-GB')}</td>
                                    <td className="px-8 py-4"><button onClick={() => onRequestDelete(item.id, item.title)} className="p-2 text-red-500/40 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"><TrashIcon/></button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const AnalyticsTab: React.FC<any> = ({ allContent, allUsers }) => {
    const totalMovies = allContent.filter((c: any) => c.type === 'movie').length;
    const totalSeries = allContent.filter((c: any) => c.type === 'series').length;
    const totalUsersCount = allUsers.length;
    const genreStats = useMemo(() => {
        const stats: Record<string, number> = {};
        allContent.forEach((c: any) => { if (c.genres) c.genres.forEach((g: string) => { stats[g] = (stats[g] || 0) + 1; }); });
        return Object.entries(stats).sort((a, b) => b[1] - a[1]);
    }, [allContent]);
    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-[#1f2937] p-8 rounded-2xl border border-gray-700/50 shadow-xl">
                    <h3 className="text-xl font-bold mb-6 text-[#00FFB0]">توزيع المحتوى حسب النوع</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center"><span className="text-gray-400">أفلام</span><div className="flex-1 mx-4 h-2 bg-gray-800 rounded-full overflow-hidden"><div className="bg-blue-500 h-full" style={{ width: `${(totalMovies / (totalMovies + totalSeries || 1)) * 100}%` }}></div></div><span className="font-bold">{totalMovies}</span></div>
                        <div className="flex justify-between items-center"><span className="text-gray-400">مسلسلات</span><div className="flex-1 mx-4 h-2 bg-gray-800 rounded-full overflow-hidden"><div className="bg-purple-500 h-full" style={{ width: `${(totalSeries / (totalMovies + totalSeries || 1)) * 100}%` }}></div></div><span className="font-bold">{totalSeries}</span></div>
                    </div>
                </div>
                <div className="bg-[#1f2937] p-8 rounded-2xl border border-gray-700/50 shadow-xl">
                    <h3 className="text-xl font-bold mb-6 text-[#00A7F8]">أكثر التصنيفات انتشاراً</h3>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {genreStats.slice(0, 10).map(([genre, count]) => (<div key={genre} className="flex justify-between items-center p-3 bg-gray-800/50 rounded-xl border border-gray-700"><span className="text-gray-300 font-bold">{genre}</span><span className="bg-gray-700 px-3 py-1 rounded-lg text-xs font-mono">{count}</span></div>))}
                    </div>
                </div>
            </div>
            <div className="bg-[#1f2937] p-8 rounded-2xl border border-gray-700/50 shadow-xl">
                <h3 className="text-xl font-bold mb-6 text-white">إجمالي المستخدمين المسجلين</h3>
                <div className="flex items-center gap-6"><div className="text-5xl font-black text-[#00FFB0]">{totalUsersCount}</div><div className="text-gray-400">مستخدم مسجل في القاعدة</div></div>
            </div>
        </div>
    );
};

export default AdminPanel;
