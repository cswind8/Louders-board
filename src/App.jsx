/* eslint-disable */
import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, ChevronLeft, ChevronRight, PenSquare, FileText, Paperclip, 
  Settings, Menu, User, Plus, Trash2, LayoutDashboard, MessageSquare, Megaphone, X,
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, List, ListOrdered, Indent, Outdent,
  Eye, Calendar, UserCircle, ArrowLeft, Edit, ArrowUp, ArrowDown, CheckSquare, AlertCircle, 
  ChevronDown, ChevronUp, FolderPlus, Folder, RefreshCcw, File, Download, Palette, Type, Loader2,
  Heading1, Heading2, Heading3, Star, MessageCircle, Send, Save, Users, Key, Database, Upload, FileSpreadsheet, Filter, LogOut, Lock,
  ChevronsLeft, ChevronsRight, Printer, Strikethrough, RotateCcw, RotateCw, MoreHorizontal, Eraser, Check, ExternalLink
} from 'lucide-react';

// [중요] Firebase 관련 import
import { initializeApp } from "firebase/app";
import { 
  getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, setDoc,
  getDocs, query, orderBy, writeBatch, increment, limit, startAfter, 
  where, getCountFromServer, onSnapshot, getDoc, arrayUnion, arrayRemove
} from "firebase/firestore";

// 선생님의 Firebase 설정값
const firebaseConfig = {
  apiKey: "AIzaSyAyUyvbqOXdE0Sq6QIQg-pzSVkTWQ_I9y4",
  authDomain: "louders-board.firebaseapp.com",
  projectId: "louders-board",
  storageBucket: "louders-board.firebasestorage.app",
  messagingSenderId: "266997924144",
  appId: "1:266997924144:web:da9207aee0870a9234c8f5",
  measurementId: "G-Y8Z2NFN1BW"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 캐시 키 상수
const CACHE_KEY_PREFIX = 'board_cache_v49_'; 

// 기본 카테고리 구조 (초기화용)
const DEFAULT_CATEGORIES = [
  {
    id: 'cat_my',
    name: '마이 메뉴',
    isExpanded: true,
    boards: [
      { id: 'bookmark', name: '북마크(보관함)', type: 'system' }
    ]
  },
  {
    id: 'cat_factory',
    name: '공장 게시판',
    isExpanded: true,
    defaultContent: '[생산/출고 보고]\n- 일자: \n- 품목: \n- 수량: \n- 특이사항: ',
    boards: [
      { id: 11, name: '공장출고', type: 'normal' },
      { id: 12, name: '민수매출', type: 'normal' },
      { id: 13, name: '조달매출', type: 'normal' },
      { id: 14, name: 'OEM매출', type: 'normal' },
      { id: 15, name: '공장생산', type: 'normal' },
      { id: 16, name: '샘플/불량 출고', type: 'normal' }
    ]
  },
  {
    id: 'cat_order',
    name: '발주서관련 업무',
    isExpanded: true,
    defaultContent: '[발주/입금 현황]\n- 거래처명: \n- 발주금액: \n- 입금예정일: ',
    boards: [
      { id: 21, name: '매입/매출/입금현황', type: 'normal' },
      { id: 22, name: '발주서 현황', type: 'normal' }
    ]
  }
];

// 기본 사용자 목록 (초기화용)
const DEFAULT_USERS = [
    { id: 1, name: '관리자', userId: 'admin', password: '0802', dept: '시스템 운영팀', position: '관리자' },
    { id: 2, name: '김철수', userId: 'kimcs', password: 'user1234', dept: '생산관리팀', position: '대리' },
    { id: 3, name: '이영희', userId: 'leeyh', password: 'user5678', dept: '영업팀', position: '사원' },
];

// ==================================================================================
// [중요] 보조 함수들을 컴포넌트 외부로 이동
// ==================================================================================

const normalizeText = (text) => String(text || '').replace(/\s+/g, '').trim();

const downloadFile = (content, fileName, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const getTodayString = () => { const d = new Date(); return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`; };

const formatDisplayDate = (full) => { if (!full) return ''; const [d, t] = full.split(' '); return d === getTodayString() ? t : d; };

const stripHtml = (html) => { 
    if (typeof document === 'undefined') return html || ""; 
    const tmp = document.createElement("DIV"); 
    tmp.innerHTML = html; 
    return tmp.textContent || tmp.innerText || ""; 
};

const textToHtmlWithLineBreaks = (text) => { if (!text) return ''; if (typeof text !== 'string') return String(text); return text.replace(/\r\n/g, "<br/>").replace(/\n/g, "<br/>"); };

const htmlToTextWithLineBreaks = (html) => { if (!html) return ""; let t = html.replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n").replace(/<\/div>/gi, "\n").replace(/<\/li>/gi, "\n"); const tmp = document.createElement("DIV"); tmp.innerHTML = t; return (tmp.textContent || tmp.innerText || "").trim(); };

const getBoardColor = (boardId) => {
  const bid = Number(boardId);
  
  // [수정] badge 속성 추가: 연한 배경색 + 진한 텍스트 + 연한 테두리
  if (bid === 11) return { bg: 'bg-orange-600', text: 'text-white', border: 'border-orange-700', active: 'bg-orange-800', activeText: 'text-white', badge: 'bg-orange-50 text-orange-700 border-orange-200' };
  if (bid === 12) return { bg: 'bg-blue-600', text: 'text-white', border: 'border-blue-700', active: 'bg-blue-800', activeText: 'text-white', badge: 'bg-blue-50 text-blue-700 border-blue-200' };
  if (bid === 13) return { bg: 'bg-green-600', text: 'text-white', border: 'border-green-700', active: 'bg-green-800', activeText: 'text-white', badge: 'bg-green-50 text-green-700 border-green-200' };
  if (bid === 14) return { bg: 'bg-slate-500', text: 'text-white', border: 'border-slate-600', active: 'bg-slate-700', activeText: 'text-white', badge: 'bg-slate-100 text-slate-700 border-slate-200' };
  if (bid === 15) return { bg: 'bg-red-600', text: 'text-white', border: 'border-red-700', active: 'bg-red-800', activeText: 'text-white', badge: 'bg-red-50 text-red-700 border-red-200' };
  if (bid === 16) return { bg: 'bg-purple-600', text: 'text-white', border: 'border-purple-700', active: 'bg-purple-800', activeText: 'text-white', badge: 'bg-purple-50 text-purple-700 border-purple-200' };
  if (bid >= 20) return { bg: 'bg-indigo-600', text: 'text-white', border: 'border-indigo-700', active: 'bg-indigo-800', activeText: 'text-white', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
  if (boardId === 'all') return { bg: 'bg-slate-800', text: 'text-white', border: 'border-slate-900', active: 'bg-black', activeText: 'text-white', badge: 'bg-slate-100 text-slate-700 border-slate-200' };
  if (boardId === 'bookmark') return { bg: 'bg-yellow-500', text: 'text-slate-900', border: 'border-yellow-600', active: 'bg-yellow-600', activeText: 'text-black', badge: 'bg-yellow-50 text-yellow-700 border-yellow-200' };

  return { bg: 'bg-slate-400', text: 'text-white', border: 'border-slate-500', active: 'bg-slate-600', activeText: 'text-white', badge: 'bg-slate-100 text-slate-600 border-slate-200' };
};


const InternalBoard = () => {
  // ... (상태 변수들은 그대로 유지)
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem('board_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('board_user') ? 'list' : 'login';
  });

  const [loginId, setLoginId] = useState('');
  const [loginPw, setLoginPw] = useState('');
  
  // [보안] Google API Key 및 관련 상태 제거됨

  const [posts, setPosts] = useState([]);
  const [allBoardPosts, setAllBoardPosts] = useState([]); 
  const [hasMore, setHasMore] = useState(true); 
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [boardTotalCount, setBoardTotalCount] = useState(0); 
  
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]); 
  
  const [activePage, setActivePage] = useState(1);
  const postsPerPage = 15;
  const fetchLimit = 50; 

  const [isXlsxLoaded, setIsXlsxLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [users, setUsers] = useState([]);

  const [activeBoardId, setActiveBoardId] = useState(11);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState('board'); 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [newCategoryName, setNewCategoryName] = useState('');
  const [newBoardInput, setNewBoardInput] = useState({ categoryId: '', name: '' });
  const [editingItem, setEditingItem] = useState(null);
  
  const [editingUser, setEditingUser] = useState(null); 
  const [newUser, setNewUser] = useState({ name: '', userId: '', password: '', dept: '', position: '' });
  
  const [modalConfig, setModalConfig] = useState({ isOpen: false, type: 'alert', message: '', onConfirm: null });

  const [searchInput, setSearchInput] = useState(''); 
  const [searchQuery, setSearchQuery] = useState(''); 
  const [searchFilterBoardId, setSearchFilterBoardId] = useState('all'); 

  const [writeForm, setWriteForm] = useState({
    id: null, docId: null, 
    title: '', content: '', 
    titleColor: 'text-rose-600', 
    titleSize: 'text-[12pt]', 
    attachments: [] 
  });

  const [commentInput, setCommentInput] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  
  // [보안] AI 로딩 상태 제거됨

  const fileInputRef = useRef(null);
  const importFileRef = useRef(null); 
  const excelInputRef = useRef(null); 
  const contentRef = useRef(null);
  
  // ==================================================================================
  // 2. Effects & Helpers
  // ==================================================================================

  useEffect(() => {
    const settingsDocRef = doc(db, 'settings', 'board_config');
    const unsubscribe = onSnapshot(settingsDocRef, async (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        if (data.categories) {
          setCategories(data.categories);
        }
      } else {
        let initialCategories = DEFAULT_CATEGORIES;
        const localData = localStorage.getItem('board_categories');
        if (localData) {
          try {
            initialCategories = JSON.parse(localData);
          } catch(e) { console.error(e); }
        }
        await setDoc(settingsDocRef, { categories: initialCategories });
        setCategories(initialCategories);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const usersDocRef = doc(db, 'settings', 'users_config');
    const unsubscribe = onSnapshot(usersDocRef, async (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        if (data.list) {
          setUsers(data.list);
        }
      } else {
        await setDoc(usersDocRef, { list: DEFAULT_USERS });
        setUsers(DEFAULT_USERS);
      }
    });
    return () => unsubscribe();
  }, []);

  const updateCategories = async (newCategories) => {
    setCategories(newCategories);
    try {
        await setDoc(doc(db, 'settings', 'board_config'), { categories: newCategories }, { merge: true });
    } catch (e) {
        console.error("Failed to save settings:", e);
        showAlert("설정 저장에 실패했습니다.");
    }
  };

  const updateUsers = async (newList) => {
    setUsers(newList);
    try {
        await setDoc(doc(db, 'settings', 'users_config'), { list: newList }, { merge: true });
    } catch (e) {
        console.error(e);
        showAlert("회원 정보 저장 실패");
    }
  };

  useEffect(() => {
    if (viewMode === 'write' && contentRef.current) {
        contentRef.current.innerHTML = writeForm.content || '';
    }
  }, [viewMode]); 

  useEffect(() => {
    if (viewMode === 'detail' || viewMode === 'write' || viewMode === 'search') {
      window.history.pushState({ page: viewMode }, "", "");
    }
    const handlePopState = (event) => {
      if (viewMode !== 'list' && viewMode !== 'login') {
        setViewMode('list');
        setSelectedPost(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [viewMode]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.XLSX) {
      setIsXlsxLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    script.async = true;
    script.onload = () => setIsXlsxLoaded(true);
    document.body.appendChild(script);
  }, []);

  const getXLSX = () => {
    if (typeof window !== 'undefined' && window.XLSX) return window.XLSX;
    return null;
  };

  const clearCache = () => {
    Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith(CACHE_KEY_PREFIX)) {
            sessionStorage.removeItem(key);
        }
    });
  };

  const fetchBoardCount = async () => {
    if (!currentUser) return;
    
    let q;
    const postsRef = collection(db, "posts");
    
    if (activeBoardId === 'trash') {
        q = query(postsRef, where("isDeleted", "==", true));
    } else if (activeBoardId === 'bookmark') {
        q = query(postsRef, where("bookmarkedBy", "array-contains", currentUser.userId));
    } else {
        q = query(postsRef, where("boardId", "==", Number(activeBoardId)), where("isDeleted", "==", false));
    }

    try {
        const snapshot = await getCountFromServer(q);
        setBoardTotalCount(snapshot.data().count);
    } catch (e) {
        console.error("Count fetch error:", e);
        setBoardTotalCount(0);
    }
  };

  const fetchInitialPosts = async (forceRefresh = false) => {
    if (!currentUser) { setPosts([]); return; }
    
    fetchBoardCount();

    const cacheKey = `${CACHE_KEY_PREFIX}${activeBoardId}_${currentUser.userId}`; 

    if (!forceRefresh) {
        const cachedData = sessionStorage.getItem(cacheKey);
        if (cachedData) {
            try {
                const { posts, timestamp, count } = JSON.parse(cachedData);
                if (Date.now() - timestamp < 30 * 60 * 1000) {
                    setPosts(posts);
                    setAllBoardPosts(posts);
                    setBoardTotalCount(count); 
                    setHasMore(false); 
                    return; 
                }
            } catch (e) { console.error("Cache parsing error", e); }
        }
    }

    setIsLoadingPosts(true);
    try {
        const postsRef = collection(db, "posts");
        let q;

        if (activeBoardId === 'trash') {
             q = query(postsRef, where("isDeleted", "==", true));
        } else if (activeBoardId === 'bookmark') {
             q = query(postsRef, where("bookmarkedBy", "array-contains", currentUser.userId));
        } else {
             q = query(postsRef, where("boardId", "==", Number(activeBoardId)));
        }
        
        const documentSnapshots = await getDocs(q);
        let loadedPosts = documentSnapshots.docs.map(doc => {
            const data = doc.data();
            const isBookmarked = data.bookmarkedBy?.includes(currentUser.userId);
            return { ...data, docId: doc.id, isBookmarked };
        });

        if (activeBoardId !== 'trash') {
             loadedPosts = loadedPosts.filter(p => !p.isDeleted);
        }
        
        loadedPosts.sort((a, b) => b.id - a.id);
        
        setAllBoardPosts(loadedPosts);

        const initialView = loadedPosts.slice(0, fetchLimit);
        setPosts(initialView);
        
        setHasMore(loadedPosts.length > fetchLimit);
        
        sessionStorage.setItem(cacheKey, JSON.stringify({
            posts: initialView,
            timestamp: Date.now(),
            count: loadedPosts.length 
        }));
        
    } catch (error) {
        console.error("Error fetching posts:", error);
        showAlert("데이터 로딩 실패: " + error.message);
    } finally {
        setIsLoadingPosts(false);
    }
  };

  const fetchMorePosts = async () => {
    const currentLength = posts.length;
    const totalLength = allBoardPosts.length;

    if (currentLength >= totalLength) {
        setHasMore(false);
        return;
    }

    setIsLoadingPosts(true);
    const nextBatch = allBoardPosts.slice(currentLength, currentLength + fetchLimit);
    setPosts(prev => [...prev, ...nextBatch]);
    setHasMore(currentLength + nextBatch.length < totalLength);
    setIsLoadingPosts(false);
  };

  const getSearchResults = () => {
    if (!searchQuery) return [];
    const query = searchQuery.toLowerCase();
    return posts.filter(post => {
        if (post.isDeleted) return false;
        const textContent = stripHtml(post.content).toLowerCase();
        return post.title.toLowerCase().includes(query) || textContent.includes(query);
    });
  };
  const searchResults = getSearchResults();
  
  const searchBoardStats = searchResults.reduce((acc, post) => {
    acc[post.boardId] = (acc[post.boardId] || 0) + 1;
    return acc;
  }, {});

  const getFilteredSearchResults = () => {
      if (searchFilterBoardId === 'all') return searchResults;
      return searchResults.filter(p => p.boardId === parseInt(searchFilterBoardId));
  };
  const currentSearchResults = getFilteredSearchResults();

  const getFilteredPosts = () => {
      if (viewMode === 'search') return currentSearchResults;

      return posts.filter(p => {
          if (activeBoardId === 'trash') return p.isDeleted;
          if (activeBoardId === 'bookmark') return p.isBookmarked && !p.isDeleted; 
          if (activeBoardId && activeBoardId !== 'trash' && activeBoardId !== 'bookmark') return p.boardId == activeBoardId && !p.isDeleted;
          return !p.isDeleted;
      });
  };

  const filteredPosts = getFilteredPosts();
  
  const indexOfLastPost = activePage * postsPerPage; 
  const indexOfFirstPost = indexOfLastPost - postsPerPage; 
  const currentPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost); 
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
  const pageGroupSize = 10; 
  const startPage = (Math.ceil(activePage / pageGroupSize) - 1) * pageGroupSize + 1; 
  const endPage = Math.min(startPage + pageGroupSize - 1, totalPages);

  const toggleCategory = (id) => {
    setCategories(categories.map(c => c.id === id ? { ...c, isExpanded: !c.isExpanded } : c));
  };

  useEffect(() => {
    fetchInitialPosts(true);
  }, [currentUser, activeBoardId]);
  
  const handleRefresh = () => {
    setActivePage(1);
    fetchInitialPosts(true); 
    showAlert("최신 목록을 불러왔습니다.");
  };

  const getActiveBoard = () => {
    if (activeBoardId === 'trash') return { id: 'trash', name: '휴지통', type: 'system' };
    if (activeBoardId === 'bookmark') return { id: 'bookmark', name: '북마크(보관함)', type: 'system' };
    for (const cat of categories) {
      const found = cat.boards.find(b => b.id === activeBoardId);
      if (found) return found;
    }
    return categories[1]?.boards[0] || { id: 0, name: '게시판 없음' };
  };
  const activeBoard = getActiveBoard();

  const handleLogin = (e) => { 
    e.preventDefault(); 
    const id = loginId.trim();
    const pw = loginPw.trim();
    const user = users.find(u => u.userId === id && u.password === pw); 
    if (user) { 
        setCurrentUser(user); 
        localStorage.setItem('board_user', JSON.stringify(user));
        setModalConfig({ isOpen: false, type: 'alert', message: '', onConfirm: null });
        setViewMode('list'); 
        setLoginId(''); 
        setLoginPw(''); 
    } else { 
        showAlert("정보가 올바르지 않습니다."); 
    } 
  };
  
  const handleLogout = () => showConfirm("로그아웃 하시겠습니까?", () => { 
      setCurrentUser(null); 
      localStorage.removeItem('board_user');
      setPosts([]); 
      clearCache();
      setViewMode('login'); 
  });

  const handleGoToWrite = () => { 
    let content = ''; 
    const ab = categories.flatMap(c => c.boards).find(b => b.id === activeBoardId);
    if(ab && ab.defaultContent) content = textToHtmlWithLineBreaks(ab.defaultContent); 
    setWriteForm({ id: null, docId: null, title: '', content, titleColor: 'text-rose-600', titleSize: 'text-[12pt]', attachments: [] }); 
    setViewMode('write'); 
  };

  const handleWriteSubmit = async () => {
    if (!writeForm.title.trim()) { showAlert("제목을 입력해주세요."); return; }
    const today = new Date();
    const dateString = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')} ${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`;
    
    const ab = categories.flatMap(c => c.boards).find(b => b.id === activeBoardId);
    const categoryName = ab ? ab.name : '기타';

    const postData = {
        title: writeForm.title, content: writeForm.content, titleColor: writeForm.titleColor, 
        titleSize: writeForm.titleSize, attachments: writeForm.attachments, 
        boardId: Number(activeBoardId), 
        category: categoryName,
    };

    try {
        clearCache();

        if (writeForm.docId) {
            await updateDoc(doc(db, "posts", writeForm.docId), postData);
            setPosts(posts.map(p => p.docId === writeForm.docId ? { ...p, ...postData } : p));
            if (selectedPost && selectedPost.docId === writeForm.docId) {
                setSelectedPost({ ...selectedPost, ...postData });
            }
            setViewMode('detail');
        } else {
            const newId = Date.now(); 
            const newPost = {
                id: newId, type: 'normal', author: currentUser ? currentUser.name : '관리자', 
                date: dateString, views: 0, file: writeForm.attachments.length > 0, 
                isMoved: false, isDeleted: false, 
                bookmarkedBy: [], 
                comments: [], ...postData
            };
            
            const docRef = await addDoc(collection(db, "posts"), newPost);
            
            setBoardTotalCount(prev => prev + 1);
            setPosts([{ ...newPost, docId: docRef.id }, ...posts]);
            setViewMode('list');
        }
        
        localStorage.removeItem('internalBoard_temp');
        setWriteForm({ id: null, docId: null, title: '', content: '', titleColor: 'text-rose-600', titleSize: 'text-[12pt]', attachments: [] });
    } catch (e) { console.error(e); showAlert("저장 실패: " + String(e.message)); }
  };
  
  const handleEditPost = () => { 
    if(!selectedPost) return; 
    setWriteForm({ 
        id: selectedPost.id, docId: selectedPost.docId, 
        title: selectedPost.title, content: selectedPost.content, 
        titleColor: selectedPost.titleColor || 'text-slate-900', 
        titleSize: selectedPost.titleSize || 'text-[12pt]', 
        attachments: selectedPost.attachments || [] 
    }); 
    setViewMode('write'); 
  };
  
  const handleTempSave = () => { localStorage.setItem('internalBoard_temp', JSON.stringify(writeForm)); showAlert("임시 저장됨"); };
  
  const handleSelectAllCheckbox = (e) => setSelectedIds(e.target.checked ? filteredPosts.map(p => p.docId) : []);
  const toggleSelection = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  
  const handleFileChange = (e) => { if(e.target.files) setWriteForm(p => ({...p, attachments:[...p.attachments, ...Array.from(e.target.files).map(f=>({name:f.name, size:(f.size/1024).toFixed(1)+'KB'}))]})); };
  const removeAttachment = (i) => setWriteForm(p => ({...p, attachments: p.attachments.filter((_, idx) => idx !== i)}));
  
  // [보안] AI 호출 함수 제거됨

  const handleToolbarAction = (act, val, e) => { 
      if (e) e.preventDefault(); 
      if (act === 'formatBlock') applyFormatBlock(val);
      else document.execCommand(act, false, val); 
      
      if(contentRef.current) {
          setWriteForm(p => ({...p, content: contentRef.current.innerHTML})); 
      }
  };

  const handleResetStyles = () => {
    if (!contentRef.current) return;

    const cleanNode = (node) => {
        if (node.nodeType !== 1) return; 

        node.removeAttribute('style');
        node.removeAttribute('class');
        node.removeAttribute('color');
        node.removeAttribute('face');
        node.removeAttribute('size');

        Array.from(node.childNodes).forEach(cleanNode);

        const unwrapTags = ['B', 'STRONG', 'I', 'EM', 'U', 'S', 'STRIKE', 'SPAN', 'FONT', 'SMALL', 'BIG', 'MARK', 'CODE'];
        const headingTags = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'PRE'];

        if (unwrapTags.includes(node.tagName)) {
            const parent = node.parentNode;
            while (node.firstChild) {
                parent.insertBefore(node.firstChild, node);
            }
            parent.removeChild(node);
        } else if (headingTags.includes(node.tagName)) {
            const p = document.createElement('p');
            p.innerHTML = node.innerHTML;
            node.parentNode.replaceChild(p, node);
        }
    };

    Array.from(contentRef.current.children).forEach(cleanNode);
    
    setWriteForm(prev => ({...prev, content: contentRef.current.innerHTML}));
    // [수정] 알림창 삭제 요청 반영: showAlert("모든 서식(제목, 굵게, 색상 등)을 초기화했습니다.");
  };
  
  const applyFormatBlock = (tag) => document.execCommand('formatBlock', false, tag);
  
  const titleColors = [{ name: 'Red', class: 'text-rose-600', bg: 'bg-rose-600' }, { name: 'Black', class: 'text-slate-900', bg: 'bg-slate-900' }, { name: 'Blue', class: 'text-indigo-600', bg: 'bg-indigo-600' }, { name: 'Green', class: 'text-emerald-600', bg: 'bg-emerald-600' }, { name: 'Amber', class: 'text-amber-600', bg: 'bg-amber-600' }, { name: 'Purple', class: 'text-purple-600', bg: 'bg-purple-600' }];
  
  const showAlert = (message) => setModalConfig({ isOpen: true, type: 'alert', message: String(message), onConfirm: null });
  const showConfirm = (message, onConfirm) => setModalConfig({ isOpen: true, type: 'confirm', message: String(message), onConfirm });
  const closeModal = () => setModalConfig(prev => ({ ...prev, isOpen: false }));
  const handleConfirmAction = () => { if (modalConfig.onConfirm) modalConfig.onConfirm(); closeModal(); };

  const handleGlobalSearch = async () => { 
      if(!searchInput.trim()) {
          showAlert("검색어를 입력해주세요.");
          return;
      }
      
      setIsLoadingPosts(true);
      try {
          const postsRef = collection(db, "posts");
          const q = query(postsRef); 
          const snapshot = await getDocs(q);
          const allPosts = snapshot.docs.map(doc => ({...doc.data(), docId: doc.id}));
          
          allPosts.sort((a, b) => b.id - a.id);
          
          setPosts(allPosts);
          setHasMore(false); 
          
          setSearchQuery(searchInput); 
          setViewMode('search'); 
          setSearchFilterBoardId('all'); 
          setActivePage(1);
          
          const found = allPosts.filter(post => {
                if (post.isDeleted) return false;
                const textContent = (post.content || '').replace(/<[^>]*>/g, '').toLowerCase();
                return post.title.toLowerCase().includes(searchInput.toLowerCase()) || textContent.includes(searchInput.toLowerCase());
          });

          if (found.length === 0) {
             showAlert("조건에 맞는 검색 결과가 없습니다.");
          }

      } catch(e) {
          showAlert("검색 중 오류 발생: " + e.message);
      } finally {
          setIsLoadingPosts(false);
      }
  };

  const handleBackToList = () => { 
      if (viewMode === 'detail' && searchQuery) { 
          setViewMode('search'); 
          setSelectedPost(null); 
      } else { 
          setSearchQuery('');
          setSearchInput('');
          setViewMode('list'); 
          setSelectedPost(null); 
          setSelectedIds([]); 
          setWriteForm({ id: null, docId: null, title: '', content: '', titleColor: 'text-rose-600', titleSize: 'text-[12pt]', attachments: [] }); 
          fetchInitialPosts(true);
      }
  };

  const handleDeletePost = async () => {
    if (!selectedPost) return;
    try {
        clearCache();
        if (activeBoardId === 'trash') {
            showConfirm("정말로 영구 삭제하시겠습니까?", async () => {
                await deleteDoc(doc(db, "posts", selectedPost.docId));
                setBoardTotalCount(prev => Math.max(0, prev - 1));
                setPosts(posts.filter(p => p.docId !== selectedPost.docId)); 
                handleBackToList();
            });
        } else {
            showConfirm("휴지통으로 이동하시겠습니까?", async () => {
                await updateDoc(doc(db, "posts", selectedPost.docId), { isDeleted: true });
                setBoardTotalCount(prev => Math.max(0, prev - 1));
                setPosts(posts.filter(p => p.docId !== selectedPost.docId));
                handleBackToList();
            });
        }
    } catch (e) { showAlert("삭제 중 오류 발생"); }
  };
  
  const handleDeleteSelected = () => {
      if (selectedIds.length === 0) return;
      const processBatch = async (actionType) => {
          clearCache();
          const batch = writeBatch(db);
          const targets = posts.filter(p => selectedIds.includes(p.docId));
          targets.forEach(p => {
              const ref = doc(db, "posts", p.docId);
              if (actionType === 'del') batch.delete(ref);
              else if (actionType === 'soft') batch.update(ref, { isDeleted: true });
              else batch.update(ref, { isDeleted: false });
          });
          await batch.commit();
          
          if (actionType === 'del' || actionType === 'soft') {
            setPosts(posts.filter(p => !selectedIds.includes(p.docId)));
            if (activeBoardId !== 'trash') setBoardTotalCount(prev => Math.max(0, prev - targets.length));
          } else {
            setPosts(posts.map(p => selectedIds.includes(p.docId) ? { ...p, isDeleted: false } : p));
            if (activeBoardId === 'trash') {
                 setPosts(posts.filter(p => !selectedIds.includes(p.docId)));
            }
          }
          setSelectedIds([]);
          showAlert("처리되었습니다.");
      };
      if (activeBoardId === 'trash') showConfirm("선택한 게시글을 영구 삭제하시겠습니까?", () => processBatch('del'));
      else showConfirm("선택한 게시글을 휴지통으로 이동하시겠습니까?", () => processBatch('soft'));
  };

  const handleRestoreSelected = () => {
    if (selectedIds.length === 0) return;
      showConfirm("선택한 게시글을 복구하시겠습니까?", async () => {
          clearCache();
          const batch = writeBatch(db);
          const targets = posts.filter(p => selectedIds.includes(p.docId));
          targets.forEach(p => batch.update(doc(db, "posts", p.docId), { isDeleted: false }));
          await batch.commit();
          
          if (activeBoardId === 'trash') {
               setPosts(posts.filter(p => !selectedIds.includes(p.docId)));
          }
          setSelectedIds([]);
      });
  };

  const handleMoveContent = async (direction) => {
    if (activeBoardId === 'trash' || viewMode === 'search') { showAlert("이 목록에서는 이동 기능을 사용할 수 없습니다."); return; }
    if (selectedIds.length === 0) { showAlert("선택된 게시글이 없습니다."); return; }
    
    const currentList = [...posts];
    let itemsToSwap = [];

    if (direction === 'up') {
      for (let i = 1; i < currentList.length; i++) {
        if (selectedIds.includes(currentList[i].docId) && !selectedIds.includes(currentList[i - 1].docId)) {
            itemsToSwap.push([currentList[i], currentList[i-1]]);
        }
      }
    } else if (direction === 'down') {
      for (let i = currentList.length - 2; i >= 0; i--) {
        if (selectedIds.includes(currentList[i].docId) && !selectedIds.includes(currentList[i + 1].docId)) {
            itemsToSwap.push([currentList[i], currentList[i+1]]);
        }
      }
    }

    if (itemsToSwap.length > 0) {
        const batch = writeBatch(db);
        const newPosts = [...posts];

        itemsToSwap.forEach(([itemA, itemB]) => {
            const refA = doc(db, "posts", itemA.docId);
            const refB = doc(db, "posts", itemB.docId);
            batch.update(refA, { id: itemB.id, isMoved: true });
            batch.update(refB, { id: itemA.id });

            const indexA = newPosts.findIndex(p => p.docId === itemA.docId);
            const indexB = newPosts.findIndex(p => p.docId === itemB.docId);
            
            if (indexA !== -1 && indexB !== -1) {
                const tempId = newPosts[indexA].id;
                newPosts[indexA] = { ...newPosts[indexA], id: newPosts[indexB].id, isMoved: true };
                newPosts[indexB] = { ...newPosts[indexB], id: tempId };
            }
        });
        await batch.commit();
        
        // 재정렬
        newPosts.sort((a, b) => b.id - a.id);
        setPosts(newPosts);
        clearCache();
    }
  };

  const handlePostClick = async (post) => {
    if (!post) return;
    
    setSelectedPost(post);
    setViewMode('detail');

    if (post.docId) {
        try {
            const storageKey = `read_post_${post.docId}`;
            const alreadyRead = sessionStorage.getItem(storageKey);

            if (!alreadyRead) {
                const postRef = doc(db, "posts", post.docId);
                updateDoc(postRef, { views: increment(1) }).catch(e => console.warn("View update failed", e));
                sessionStorage.setItem(storageKey, 'true');
                
                setPosts(prevPosts => 
                  prevPosts.map(p => p.docId === post.docId ? { ...p, views: (p.views || 0) + 1 } : p)
                );
            }
        } catch (e) {
            console.error("Post click logic error:", e);
        }
    }
  };

  const handleToggleBookmark = async (post) => {
    if (!currentUser) return;
    try { 
        const newStatus = !post.isBookmarked;
        
        setPosts(posts.map(p => p.docId === post.docId ? { ...p, isBookmarked: newStatus } : p));
        if (selectedPost && selectedPost.docId === post.docId) {
             setSelectedPost({ ...selectedPost, isBookmarked: newStatus });
        }

        const postRef = doc(db, "posts", post.docId);
        if (newStatus) {
            await updateDoc(postRef, { bookmarkedBy: arrayUnion(currentUser.userId) });
        } else {
            await updateDoc(postRef, { bookmarkedBy: arrayRemove(currentUser.userId) });
        }
        
        clearCache();
    } catch (e) { console.error("Bookmark error", e); }
  };

  const handleAddComment = async () => {
    if (!commentInput.trim()) return;
    const newComment = { id: Date.now(), author: currentUser ? currentUser.name : '익명', content: commentInput, date: getTodayString() };
    const newComments = [...(selectedPost.comments || []), newComment];
    await updateDoc(doc(db, "posts", selectedPost.docId), { comments: newComments });
    
    const updatedPost = { ...selectedPost, comments: newComments };
    setSelectedPost(updatedPost);
    setPosts(posts.map(p => p.docId === selectedPost.docId ? updatedPost : p));
    setCommentInput('');
  };

  const handleDeleteComment = async (cid) => {
    if (!window.confirm("삭제하시겠습니까?")) return;
    const newComments = selectedPost.comments.filter(c => c.id !== cid);
    await updateDoc(doc(db, "posts", selectedPost.docId), { comments: newComments });
    
    const updatedPost = { ...selectedPost, comments: newComments };
    setSelectedPost(updatedPost);
    setPosts(posts.map(p => p.docId === selectedPost.docId ? updatedPost : p));
  };


  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    const newCat = { id: `cat_${Date.now()}`, name: newCategoryName, isExpanded: true, boards: [] };
    
    const newCategories = [...categories, newCat];
    updateCategories(newCategories);
    setNewCategoryName('');
  };

  const handleDeleteCategory = (catId) => {
    const targetCat = categories.find(c => c.id === catId);
    if (!targetCat) return;
    if (targetCat.boards.length > 0) { showAlert("게시판이 포함된 카테고리는 삭제할 수 없습니다."); return; }
    if (categories.length <= 1) { showAlert("최소 하나의 카테고리는 존재해야 합니다."); return; }
    
    const newCategories = categories.filter(c => c.id !== catId);
    updateCategories(newCategories);
  };

  const handleAddBoardToCategory = () => {
    if (!newBoardInput.categoryId || !newBoardInput.name.trim()) { showAlert("카테고리를 선택하고 게시판 이름을 입력해주세요."); return; }
    
    const newCategories = categories.map(cat => {
      if (cat.id === newBoardInput.categoryId) {
        return { ...cat, boards: [...cat.boards, { id: Date.now(), name: newBoardInput.name, type: 'normal', defaultContent: '' }] };
      }
      return cat;
    });
    
    updateCategories(newCategories);
    setNewBoardInput({ categoryId: '', name: '' });
  };

  const handleDeleteBoard = (boardId) => {
    const totalBoards = categories.reduce((acc, cat) => acc + cat.boards.length, 0);
    if (totalBoards <= 1) { showAlert("최소 하나의 게시판은 존재해야 합니다."); return; }
    
    const newCategories = categories.map(cat => ({ ...cat, boards: cat.boards.filter(b => b.id !== boardId) }));
    updateCategories(newCategories);
    
    if (activeBoardId === boardId) {
      const firstValidBoard = categories.find(c => c.boards.length > 0)?.boards[0];
      if (firstValidBoard) setActiveBoardId(firstValidBoard.id);
    }
  };

  const startEditing = (type, id, currentName, currentDefaultContent = '') => {
    setEditingItem({ type, id, name: currentName, defaultContent: currentDefaultContent });
  };

  const saveEditing = () => {
    if (!editingItem || !editingItem.name.trim()) return;
    let newCategories;
    
    if (editingItem.type === 'category') {
      newCategories = categories.map(cat => 
        cat.id === editingItem.id ? { ...cat, name: editingItem.name } : cat
      );
    } else if (editingItem.type === 'board') {
      newCategories = categories.map(cat => ({
        ...cat,
        boards: cat.boards.map(b => 
          b.id === editingItem.id ? { ...b, name: editingItem.name, defaultContent: editingItem.defaultContent } : b
        )
      }));
    }
    
    if (newCategories) updateCategories(newCategories);
    setEditingItem(null);
  };

  // [수정] 사용자 추가/수정 통합 핸들러
  const handleSaveUser = () => {
    if (!newUser.name || !newUser.userId || !newUser.password) {
      showAlert("이름, 아이디, 비밀번호는 필수입니다.");
      return;
    }

    let newUsersList;
    if (editingUser) {
        // 수정 모드
        newUsersList = users.map(u => u.id === editingUser.id ? { ...u, ...newUser } : u);
    } else {
        // 추가 모드
        // 아이디 중복 체크
        if (users.some(u => u.userId === newUser.userId)) {
            showAlert("이미 존재하는 아이디입니다.");
            return;
        }
        newUsersList = [...users, { id: Date.now(), ...newUser }];
    }
    
    updateUsers(newUsersList);
    setNewUser({ name: '', userId: '', password: '', dept: '', position: '' });
    setEditingUser(null); // 수정 모드 종료
  };

  const handleEditUserClick = (user) => {
    setEditingUser(user);
    setNewUser({ 
        name: user.name, 
        userId: user.userId, 
        password: user.password, 
        dept: user.dept, 
        position: user.position 
    });
  };

  const handleCancelUserEdit = () => {
      setEditingUser(null);
      setNewUser({ name: '', userId: '', password: '', dept: '', position: '' });
  };

  const handleDeleteUser = (userId) => {
    if (currentUser && currentUser.id === userId) {
      showAlert("현재 로그인된 계정은 삭제할 수 없습니다.");
      return;
    }
    showConfirm("정말 이 사용자를 삭제하시겠습니까?", () => {
      const newUsersList = users.filter(u => u.id !== userId);
      updateUsers(newUsersList);
    });
  };

  const saveImportedDataToDB = async (importedPosts) => {
    setIsProcessing(true); 
    try {
        clearCache(); 

        const postsRef = collection(db, "posts");
        const snapshot = await getDocs(postsRef); 
        
        if (!snapshot.empty) {
            const deleteChunkSize = 400; 
            const allDocs = snapshot.docs;
            const chunks = [];

            for (let i = 0; i < allDocs.length; i += deleteChunkSize) {
                chunks.push(allDocs.slice(i, i + deleteChunkSize));
            }
            
            for (const chunk of chunks) {
                const batch = writeBatch(db);
                chunk.forEach(docSnap => {
                    batch.delete(docSnap.ref);
                });
                await batch.commit();
            }
        }

        const addChunkSize = 400;
        const addBatches = [];
        
        for (let i = 0; i < importedPosts.length; i += addChunkSize) {
            const batch = writeBatch(db);
            const chunk = importedPosts.slice(i, i + addChunkSize);
            
            chunk.forEach((post) => {
                const newDocRef = doc(collection(db, "posts")); 
                const { docId, ...postData } = post; 
                
                const dataToSave = {
                    ...postData,
                    id: post.id || Date.now() + Math.random(),
                    date: post.date || getTodayString(),
                    views: post.views || 0,
                    type: post.type || 'normal',
                    file: post.file || false,
                    isMoved: false,
                    isDeleted: false,
                    bookmarkedBy: [], // 리셋
                    comments: []
                };
                
                batch.set(newDocRef, dataToSave);
            });
            addBatches.push(batch.commit());
        }
        
        await Promise.all(addBatches);
        setIsProcessing(false); 
        
        showAlert(`기존 데이터를 모두 삭제하고 총 ${importedPosts.length}건의 데이터를 성공적으로 업로드했습니다.`);
        fetchInitialPosts(true); 
    } catch (e) {
        setIsProcessing(false); 
        console.error(e);
        showAlert("데이터 처리 중 오류가 발생했습니다: " + e.message);
    }
  };

  const getDatabaseStats = async () => {
    try {
        const stats = {};
        const postsRef = collection(db, "posts");
        let total = 0;

        const countPromises = [];
        const boardNames = [];

        categories.forEach(cat => {
            cat.boards.forEach(board => {
                if (board.id !== 'bookmark' && board.id !== 'trash') {
                    const q = query(postsRef, where("boardId", "==", board.id), where("isDeleted", "==", false));
                    countPromises.push(getCountFromServer(q));
                    boardNames.push(board.name);
                }
            });
        });

        const snapshots = await Promise.all(countPromises);
        
        snapshots.forEach((snap, idx) => {
            const count = snap.data().count;
            if (count > 0) {
                stats[boardNames[idx]] = count;
                total += count;
            }
        });

        return { stats, total };
    } catch (e) {
        console.error("Failed to get stats:", e);
        return null;
    }
  };


  const handleExportExcel = async () => {
    setIsProcessing(true);
    const dbStats = await getDatabaseStats();
    setIsProcessing(false);

    let confirmMsg = "전체 게시글 데이터를 다운로드하시겠습니까?\n\n";
    if (dbStats && dbStats.total > 0) {
        confirmMsg += "[서버 데이터 현황]\n";
        for (const [name, count] of Object.entries(dbStats.stats)) {
             confirmMsg += `- ${name}: ${count}건\n`;
        }
        confirmMsg += `\n총 ${dbStats.total}건 (예상)\n`;
    } else {
        confirmMsg += "(데이터 통계를 불러오지 못했거나 데이터가 없습니다.)\n";
    }
    confirmMsg += "\n[주의] '확인'을 누르면 전체 데이터를 읽어오므로 데이터 사용량이 발생합니다.";

    showConfirm(confirmMsg, processExportExcel);
  };

  const processExportExcel = async () => {
    const XLSX_LIB = getXLSX();
    if (!XLSX_LIB) { showAlert("엑셀 도구 로딩 중..."); return; }
    
    setIsProcessing(true);
    try {
        const q = query(collection(db, "posts"), orderBy("id", "desc"));
        const snapshot = await getDocs(q);
        const allPosts = snapshot.docs.map(doc => ({ ...doc.data(), docId: doc.id }));
        const activePosts = allPosts.filter(p => !p.isDeleted);
        
        const groupedData = {};
        activePosts.forEach((post) => {
            const category = post.category || '기타';
            if (!groupedData[category]) groupedData[category] = [];
            groupedData[category].push(post);
        });

        const wb = XLSX_LIB.utils.book_new();
        
        if (Object.keys(groupedData).length === 0) {
            const ws = XLSX_LIB.utils.json_to_sheet([]);
            XLSX_LIB.utils.book_append_sheet(wb, ws, "데이터없음");
        } else {
            Object.keys(groupedData).forEach(category => {
                const postsInCategory = groupedData[category];
                const sheetData = postsInCategory.map((post, idx) => ({
                    '번호': postsInCategory.length - idx, 
                    '분류': post.category, 
                    '제목': post.title, 
                    '작성자': post.author, 
                    '등록일': post.date, 
                    '조회수': post.views, 
                    '내용': htmlToTextWithLineBreaks(post.content),
                    'SystemID': post.id
                }));

                const safeSheetName = category.replace(/[\\/?*[\]]/g, "").substring(0, 30) || "Sheet";
                const ws = XLSX_LIB.utils.json_to_sheet(sheetData);
                XLSX_LIB.utils.book_append_sheet(wb, ws, safeSheetName);
            });
        }
        
        XLSX_LIB.writeFile(wb, `LOUDERS_Board_Backup_${new Date().toLocaleDateString()}.xlsx`);
    } catch (e) {
        console.error(e);
        showAlert("백업 중 오류가 발생했습니다: " + e.message);
    } finally {
        setIsProcessing(false);
    }
  };

  const handleImportExcelClick = () => { 
      if (!getXLSX()) { showAlert("엑셀 라이브러리 로딩 중..."); return; } 
      excelInputRef.current?.click(); 
  };
  
  const handleImportExcelChange = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const XLSX_LIB = getXLSX();
    if (!XLSX_LIB) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX_LIB.read(data, { type: 'array' });
        
        let jsonData = [];
        workbook.SheetNames.forEach(sheetName => {
            const sheetData = XLSX_LIB.utils.sheet_to_json(workbook.Sheets[sheetName]);
            jsonData = [...jsonData, ...sheetData];
        });
        
        if (jsonData.length === 0) { showAlert("데이터 없음"); return; }
        
        const boardNameMap = {}; 
        categories.forEach(cat => cat.boards.forEach(board => {
            boardNameMap[normalizeText(board.name)] = board.id;
        }));
        
        const baseTimestamp = Date.now();
        const importStats = {}; 

        const parsedPosts = jsonData.filter(row => row['제목'] || row['Title']).map((row, index) => {
            const headers = Object.keys(row);
            const categoryKey = headers.find(h => normalizeText(h) === '분류') || '분류';
            const titleKey = headers.find(h => normalizeText(h) === '제목') || '제목';
            const authorKey = headers.find(h => normalizeText(h) === '작성자') || '작성자';
            const dateKey = headers.find(h => normalizeText(h) === '등록일') || '등록일';
            const viewsKey = headers.find(h => normalizeText(h) === '조회수') || '조회수';
            const contentKey = headers.find(h => normalizeText(h) === '내용') || '내용';

            const rawCategory = row[categoryKey] || '기타';
            const categoryName = String(rawCategory).trim();
            const normalizedCategoryName = normalizeText(categoryName);
            
            let matchedBoardId = boardNameMap[normalizedCategoryName];
            if (!matchedBoardId) matchedBoardId = 11; 

            importStats[categoryName] = (importStats[categoryName] || 0) + 1;

            return {
                id: baseTimestamp + (jsonData.length - index),
                category: categoryName, 
                boardId: matchedBoardId,
                title: row[titleKey], 
                author: row[authorKey] || '익명', 
                date: row[dateKey] || getTodayString(), 
                views: row[viewsKey] || 0,
                content: row[contentKey] ? textToHtmlWithLineBreaks(row[contentKey]) : '', 
                type: 'normal', file: false, attachments: [], 
                titleColor: 'text-slate-900', titleSize: 'text-[12pt]', 
                isMoved: false, isDeleted: false, 
                bookmarkedBy: [], 
                comments: []
            };
        });
        
        let statsMsg = "📊 [엑셀 파일 분석 결과]\n\n";
        for (const [cat, count] of Object.entries(importStats)) {
            statsMsg += `• ${cat}: ${count}건\n`;
        }
        statsMsg += `\n----------------------------\n`;
        statsMsg += `📌 총 발견 데이터: ${parsedPosts.length}건\n\n`;
        statsMsg += `⚠️ [주의] '확인'을 누르면:\n`;
        statsMsg += `1. 기존 게시글이 모두 삭제됩니다.\n`;
        statsMsg += `2. 위 데이터로 새로 작성됩니다.\n\n`;
        statsMsg += `진행하시겠습니까?`;

        showConfirm(statsMsg, () => {
             saveImportedDataToDB(parsedPosts);
        });

      } catch (error) { showAlert("엑셀 처리 오류: " + error.message); }
    };
    reader.readAsArrayBuffer(file); e.target.value = '';
  };

  const handleImportClick = () => importFileRef.current?.click();
  const handleImportFileChange = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => { 
        try { 
            const importedData = JSON.parse(event.target.result); 
            if (Array.isArray(importedData)) {
                const importStats = {};
                importedData.forEach(post => {
                    const cat = post.category || '기타';
                    importStats[cat] = (importStats[cat] || 0) + 1;
                });

                let statsMsg = "📄 [JSON 파일 분석 결과]\n\n";
                for (const [cat, count] of Object.entries(importStats)) {
                    statsMsg += `• ${cat}: ${count}건\n`;
                }
                statsMsg += `\n----------------------------\n`;
                statsMsg += `📌 총 발견 데이터: ${importedData.length}건\n\n`;
                statsMsg += `⚠️ [주의] '확인'을 누르면:\n`;
                statsMsg += `1. 기존 게시글이 모두 삭제됩니다.\n`;
                statsMsg += `2. 파일 내용으로 덮어씌워집니다.\n\n`;
                statsMsg += `진행하시겠습니까?`;

                showConfirm(statsMsg, () => { 
                    saveImportedDataToDB(importedData);
                }); 
            } else {
                showAlert("올바른 JSON 파일 형식이 아닙니다 (배열 아님).");
            }
        } catch (error) { showAlert("파일 오류: " + error.message); } 
    };
    reader.readAsText(file); e.target.value = ''; 
  };
  
  const handleExportJSON = async () => {
    setIsProcessing(true);
    const dbStats = await getDatabaseStats();
    setIsProcessing(false);

    let confirmMsg = "전체 데이터 백업(JSON)을 진행하시겠습니까?\n\n";
    if (dbStats && dbStats.total > 0) {
        confirmMsg += "[서버 데이터 현황]\n";
        for (const [name, count] of Object.entries(dbStats.stats)) {
             confirmMsg += `- ${name}: ${count}건\n`;
        }
        confirmMsg += `\n총 ${dbStats.total}건 (예상)\n`;
    }
    confirmMsg += "\n[주의] '확인'을 누르면 전체 데이터를 읽어오므로 데이터 사용량이 발생합니다.";

    showConfirm(confirmMsg, processExportJSON);
  };

  const processExportJSON = async () => { 
    setIsProcessing(true);
    try {
        const q = query(collection(db, "posts"), orderBy("id", "desc"));
        const snapshot = await getDocs(q);
        const allPosts = snapshot.docs.map(doc => ({ ...doc.data(), docId: doc.id }));
        const activePosts = allPosts.filter(post => !post.isDeleted); 
        const jsonContent = JSON.stringify(activePosts, null, 2); 
        downloadFile(jsonContent, `LOUDERS_Board_Backup_${new Date().toLocaleDateString()}.json`, 'application/json'); 
    } catch (e) {
        console.error(e);
        showAlert("백업 중 오류가 발생했습니다: " + e.message);
    } finally {
        setIsProcessing(false);
    }
  };

  const handlePrint = () => {
    if (!selectedPost) return;
    const printWindow = window.open('', '_blank', 'width=900,height=800,scrollbars=yes');
    if (!printWindow) { showAlert("팝업 차단 해제 필요"); return; }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>인쇄 미리보기 - ${selectedPost.title}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap');
          body { font-family: 'Noto Sans KR', sans-serif; padding: 40px; font-size: 13px; line-height: 1.5; }
          .print-controls { position: fixed; top: 0; left: 0; width: 100%; background: #f1f5f9; border-bottom: 1px solid #cbd5e1; padding: 10px 20px; display: flex; justify-content: flex-end; gap: 10px; z-index: 1000; }
          .btn { padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer; border: 1px solid transparent; }
          .btn-print { background: #4f46e5; color: white; }
          .btn-close { background: white; border: 1px solid #cbd5e1; color: #475569; }
          .content-wrapper { margin-top: 50px; }
          .wysiwyg-content ul { list-style-type: disc; padding-left: 20px; margin-bottom: 8px; }
          .wysiwyg-content ol { list-style-type: decimal; padding-left: 20px; margin-bottom: 8px; }
          .wysiwyg-content p { margin-bottom: 8px; line-height: 1.6; }
          .wysiwyg-content h1 { font-size: 1.6em; font-weight: bold; margin: 16px 0 8px 0; }
          .wysiwyg-content h2 { font-size: 1.3em; font-weight: bold; margin: 14px 0 8px 0; }
          .wysiwyg-content table { border-collapse: collapse; width: 100%; margin: 8px 0; font-size: 12px; }
          .wysiwyg-content th, .wysiwyg-content td { border: 1px solid #e2e8f0; padding: 6px; }
          @media print { 
            body { padding: 0; font-size: 13px; } 
            .print-controls { display: none !important; } 
            .content-wrapper { margin-top: 0; } 
            /* [수정] 출력 시 제목 1.2배 확대 (1.5배 -> 1.2배 조정) */
            h1 { font-size: 1.8em !important; }
            /* [수정] 본문 폰트 크기 13px로 조정 */
            .wysiwyg-content { font-size: 13px !important; }
          }
        </style>
      </head>
      <body class="bg-white text-slate-800">
        <div class="print-controls"><button onclick="window.close()" class="btn btn-close">닫기</button><button onclick="window.print()" class="btn btn-print">🖨️ 인쇄하기</button></div>
        <div class="max-w-4xl mx-auto content-wrapper">
          <div class="border-b-2 border-slate-800 pb-4 mb-6 doc-header">
            <div class="flex justify-between items-start mb-3"><span class="px-2 py-1 bg-slate-100 border border-slate-200 rounded text-[11px] font-bold text-slate-600">${selectedPost.category}</span><span class="text-[11px] text-slate-400">No. ${selectedPost.id}</span></div>
            <h1 class="font-extrabold text-slate-900 leading-tight">${selectedPost.title}</h1>
            <div class="flex items-center gap-6 doc-meta text-slate-500"><div class="flex items-center gap-2"><span class="font-bold text-slate-700">작성자:</span> ${selectedPost.author}</div><div class="flex items-center gap-2"><span class="font-bold text-slate-700">등록일:</span> ${selectedPost.date}</div></div>
          </div>
          <div class="wysiwyg-content min-h-[200px]">${selectedPost.content}</div>
          <div class="mt-8 pt-4 border-t border-slate-200 text-center"><p class="text-[10px] text-slate-400">위 문서는 LOUDERS 사내 시스템에서 출력되었습니다.</p><p class="text-[10px] text-slate-400 mt-1">출력일시: ${new Date().toLocaleString()}</p></div>
        </div>
      </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  if (viewMode === 'login') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-300">
          <div className="text-center mb-8"><div className="w-16 h-16 bg-indigo-600 rounded-2xl mx-auto flex items-center justify-center text-white shadow-lg mb-4"><LayoutDashboard size={32} /></div><h2 className="text-2xl font-bold text-slate-800">LOUDERS</h2><p className="text-slate-500 text-sm mt-1">사내 인트라넷 시스템 (Cloud Ver.)</p></div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div><label className="block text-xs font-bold text-slate-500 mb-1 ml-1">아이디</label><div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" /><input type="text" value={loginId} onChange={(e) => setLoginId(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="아이디" autoComplete="username" /></div></div>
            <div><label className="block text-xs font-bold text-slate-500 mb-1 ml-1">비밀번호</label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" /><input type="password" value={loginPw} onChange={(e) => setLoginPw(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="비밀번호" autoComplete="current-password" /></div></div>
            <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-transform hover:scale-[1.02]">로그인</button>
          </form>
        </div>
        {modalConfig.isOpen && (
            <div className="fixed inset-0 bg-slate-900/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-100">
                <div className="p-8 text-center">
                <div className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-4 ${modalConfig.type === 'confirm' ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'}`}><AlertCircle size={28} /></div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{modalConfig.type === 'confirm' ? '확인해 주세요' : '알림'}</h3>
                {/* [수정] 줄바꿈(whitespace-pre-wrap) 적용 */}
                <p className="text-sm text-slate-500 leading-relaxed font-medium whitespace-pre-wrap">{modalConfig.message}</p>
                </div>
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
                {modalConfig.type === 'confirm' && <button onClick={closeModal} className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm">취소</button>}
                <button onClick={handleConfirmAction} className={`flex-1 px-4 py-2.5 text-white text-sm font-bold rounded-xl shadow-md transition-all transform active:scale-95 ${modalConfig.type === 'confirm' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200' : 'bg-slate-800 hover:bg-slate-900 shadow-slate-200'}`}>확인</button>
                </div>
            </div>
            </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden relative">
      <style>{`
        @media print {
            @page { size: auto; margin: 20mm; }
            html, body { height: auto !important; overflow: visible !important; background: white !important; }
            aside, header, .print-hidden, .fixed { display: none !important; }
            #root, .flex-col, .flex, main { display: block !important; width: 100% !important; height: auto !important; overflow: visible !important; position: static !important; margin: 0 !important; padding: 0 !important; background: white !important; }
            .print-content { display: block !important; width: 100% !important; height: auto !important; margin: 0 auto !important; padding: 0 !important; border: none !important; box-shadow: none !important; overflow: visible !important; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-shadow: none !important; }
        }
      `}</style>
      <aside className={`absolute lg:relative w-64 bg-slate-900 border-r border-slate-800 flex-shrink-0 flex flex-col z-30 h-full transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 border-b border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3"><div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg"><LayoutDashboard size={20} /></div><span className="text-lg font-bold text-white tracking-tight">LOUDERS</span></div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden text-slate-400 hover:text-white"><X size={20} /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-3 custom-scrollbar [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
          {categories.map((cat) => (
            <div key={cat.id} className="mb-6">
              <button onClick={() => toggleCategory(cat.id)} className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-slate-400 hover:text-white uppercase tracking-wider mb-2"><span>{cat.name}</span>{cat.isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</button>
              {cat.isExpanded && <div className="space-y-1">{cat.boards.map(board => (<button key={board.id} onClick={() => { 
                  // 1. 상태 초기화
                  setPosts([]); 
                  setSearchInput(''); 
                  setSearchQuery(''); 
                  setSearchFilterBoardId('all');
                  setViewMode('list'); 
                  setActivePage(1); 
                  setIsMobileMenuOpen(false); 
                  
                  // 2. 게시판 변경
                  setActiveBoardId(board.id); 
                  
                  // [핵심] 같은 게시판 재클릭 시 강제 리로드
                  if (activeBoardId === board.id) {
                      fetchInitialPosts(true);
                  }
              }} className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${activeBoardId === board.id && viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>{board.id === 'bookmark' ? <Star size={18} className="text-yellow-400" /> : board.type === 'notice' ? <Megaphone size={18} /> : <MessageSquare size={18} />}{board.name}</button>))}</div>}
            </div>
          ))}
        </div>
        
        {/* [추가] 재고표 사이트 링크 */}
        <div className="p-3 border-t border-slate-800 space-y-1">
            <a 
                href="https://louders-erp.vercel.app/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all"
            >
                <ExternalLink size={18} /> 재고표 사이트
            </a>
            <button 
                onClick={() => { setActiveBoardId('trash'); setViewMode('list'); }} 
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${activeBoardId === 'trash' ? 'bg-rose-900/50 text-rose-200 border border-rose-800' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
            >
                <Trash2 size={18} />휴지통
            </button>
        </div>
        
        <div className="p-4 border-t border-slate-800 bg-slate-900/50"><div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white"><User size={18} /></div><div className="flex-1 min-w-0"><p className="text-sm font-bold text-white truncate">{currentUser?.name}</p><p className="text-xs text-slate-400 truncate">{currentUser?.dept}</p></div></div><button onClick={handleLogout} className="text-slate-400 hover:text-white"><LogOut size={16} /></button></div></div>
      </aside>
      
      {isMobileMenuOpen && (<div className="fixed inset-0 bg-black/50 z-20 lg:hidden backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />)}

      <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 shadow-sm z-10 gap-4">
          <div className="flex items-center gap-4"><button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden text-slate-500"><Menu size={20} /></button><h2 className="text-lg font-bold text-slate-800 hidden md:block">{viewMode === 'search' ? '통합 검색' : activeBoard.name}</h2></div>
          
          {/* [수정] 검색창 내부 버튼 통합 및 파란색 적용 */}
          <div className="flex-1 max-w-xl mx-auto relative">
              <div className="relative group">
                  <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleGlobalSearch()} placeholder="제목 + 내용 검색 (전체 데이터 검색)" className="w-full pl-10 pr-16 py-2.5 bg-slate-100 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  
                  <div className="absolute right-1.5 top-1.5 bottom-1.5 flex items-center gap-1">
                      {searchInput && (<button onClick={() => setSearchInput('')} className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors"><X size={14} /></button>)}
                      <button 
                          onClick={handleGlobalSearch} 
                          className="bg-indigo-600 hover:bg-indigo-700 text-white p-1.5 rounded-full shadow-sm transition-all"
                          title="검색"
                      >
                          <Search size={16} />
                      </button>
                  </div>
              </div>
          </div>

          <div className="flex items-center gap-2"><button onClick={() => setIsSettingsOpen(true)} className="p-2 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 rounded-full"><Settings size={18} /></button></div>
        </header>

        <main className="flex-1 overflow-y-auto p-3 md:p-6" id="main-content">
          {viewMode === 'list' && (
            <div className={`max-w-7xl mx-auto bg-white rounded-xl shadow-sm border overflow-hidden ${activeBoardId === 'trash' ? 'border-rose-200' : 'border-slate-200'}`}>
              <div className={`p-3 border-b flex flex-col gap-3 ${activeBoardId === 'trash' ? 'bg-rose-50 border-rose-100' : 'bg-white border-slate-100'}`}>
                <div className="flex flex-col xl:flex-row justify-between items-center gap-3">
                  <div className="flex items-center gap-2 w-full xl:w-auto">
                        <div className={`p-1.5 rounded-lg ${activeBoardId === 'trash' ? 'bg-rose-100' : 'bg-indigo-50'}`}>
                            {activeBoardId === 'trash' ? <Trash2 className="w-4 h-4 text-rose-600" /> : activeBoardId === 'bookmark' ? <Star className="w-4 h-4 text-yellow-600" /> : <FileText className="w-4 h-4 text-indigo-600" />}
                        </div>
                        <h1 className={`text-lg font-bold ${activeBoardId === 'trash' ? 'text-rose-900' : 'text-slate-900'} whitespace-nowrap`}>{activeBoard.name}</h1>
                        <button onClick={handleRefresh} className="ml-2 p-1.5 text-slate-400 hover:text-indigo-600 rounded-full hover:bg-slate-100 transition-colors" title="목록 새로고침"><RotateCcw size={14} /></button>
                  </div>

                  <div className="flex items-center gap-2">
                     {activeBoardId === 'trash' ? 
                     <>
                        <button onClick={handleRestoreSelected} className="flex items-center gap-1 bg-white border border-rose-200 text-green-600 hover:bg-green-50 px-3 py-1.5 rounded-md text-xs font-bold shadow-sm whitespace-nowrap"><RefreshCcw className="w-3.5 h-3.5" /> 복구</button>
                        <button onClick={handleDeleteSelected} className="flex items-center gap-1 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-md text-xs font-bold shadow-sm whitespace-nowrap"><Trash2 className="w-3.5 h-3.5" /> 영구삭제</button>
                     </> 
                     : (
                     <>
                        <button onClick={() => handleMoveContent('up')} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md" title="위로"><ArrowUp size={16} /></button>
                        <button onClick={() => handleMoveContent('down')} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md" title="아래로"><ArrowDown size={16} /></button>
                        <button onClick={handleDeleteSelected} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md" title="삭제"><Trash2 size={16} /></button>
                        <button onClick={handleGoToWrite} className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md text-xs font-bold shadow-sm"><PenSquare size={14} /> 글쓰기</button>
                     </>)}
                  </div>
                </div>
              </div>
              
              <div className="w-full">
                <table className="w-full table-fixed">
                  <colgroup>
                    <col className="w-10"/>
                    <col className="w-12 md:w-16"/>
                    <col/>
                    <col className="hidden md:table-column w-12"/>
                    <col className="hidden md:table-column w-24"/>
                    <col className="w-20 md:w-32"/>
                    <col className="hidden md:table-column w-16"/>
                  </colgroup>
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase">
                        <th className="py-2"><input type="checkbox" onChange={handleSelectAllCheckbox} checked={currentPosts.length > 0 && currentPosts.every(p => selectedIds.includes(p.docId))} /></th>
                        <th>번호</th>
                        <th>제목</th>
                        <th className="hidden md:table-cell">첨부</th>
                        <th className="hidden md:table-cell">작성자</th>
                        <th>등록일</th>
                        <th className="hidden md:table-cell">조회</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentPosts.length > 0 ? currentPosts.map((post, idx) => (
                        <tr key={post.docId} onClick={() => handlePostClick(post)} className={`hover:bg-indigo-50/60 cursor-pointer text-sm ${selectedIds.includes(post.docId) ? 'bg-indigo-50' : ''}`}>
                            <td className="py-2 text-center" onClick={(e) => {e.stopPropagation(); toggleSelection(post.docId);}}><input type="checkbox" checked={selectedIds.includes(post.docId)} onChange={() => {}} className="cursor-pointer" /></td>
                            <td className="text-center text-slate-500">
                                {(boardTotalCount || posts.length) - (activePage - 1) * postsPerPage - idx}
                            </td>
                            <td className="py-2 px-3">
                                <div className="flex items-center gap-1.5">
                                    {post.type === 'notice' && <span className="bg-rose-100 text-rose-600 text-[10px] px-1 rounded font-bold">공지</span>}
                                    <span className={`font-medium line-clamp-1 ${post.titleColor}`}>{post.title}</span>
                                    {post.isBookmarked && <Star size={12} className="text-yellow-500 fill-yellow-500" />}
                                </div>
                            </td>
                            <td className="text-center hidden md:table-cell">{(post.attachments?.length > 0 || post.file) && <Paperclip size={14} className="text-slate-400 inline" />}</td>
                            <td className="text-center text-slate-600 hidden md:table-cell">{post.author}</td>
                            <td className="text-center text-slate-500 font-light">{formatDisplayDate(post.date)}</td>
                            <td className="text-center text-slate-500 font-light hidden md:table-cell">{post.views}</td>
                        </tr>
                    )) : <tr><td colSpan="7" className="py-8 text-center text-slate-400">
                        {isLoadingPosts ? "데이터 불러오는 중..." : "게시글이 없습니다."}
                    </td></tr>}
                  </tbody>
                </table>
              </div>

              {/* 페이지네이션 및 더보기 */}
              <div className="p-3 border-t border-slate-200 bg-white flex justify-between items-center">
                 <div className="flex-1"></div> 
                 <div className="flex justify-center items-center gap-1">
                    <button onClick={() => setActivePage(1)} disabled={activePage === 1} className="p-1 border rounded disabled:opacity-30"><ChevronsLeft size={14} /></button>
                    <button onClick={() => setActivePage(Math.max(1, startPage - 1))} disabled={startPage === 1} className="p-1 border rounded disabled:opacity-30"><ChevronLeft size={14} /></button>
                    {Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map(p => (
                    <button key={p} onClick={() => setActivePage(p)} className={`w-6 h-6 flex items-center justify-center rounded text-xs font-bold ${activePage === p ? 'bg-indigo-600 text-white' : 'border'}`}>{p}</button>
                    ))}
                    <button onClick={() => setActivePage(Math.min(totalPages, endPage + 1))} disabled={endPage >= totalPages || totalPages === 0} className="p-1 border rounded disabled:opacity-30"><ChevronRight size={14} /></button>
                    <button onClick={() => setActivePage(totalPages)} disabled={activePage === totalPages || totalPages === 0} className="p-1 border rounded disabled:opacity-30"><ChevronsRight size={14} /></button>
                 </div>
                 {/* [복구] 더 보기 버튼 */}
                 <div className="flex-1 flex justify-end">
                    {hasMore && viewMode === 'list' && activeBoardId !== 'trash' && (
                        <button 
                            onClick={fetchMorePosts} 
                            disabled={isLoadingPosts}
                            className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                        >
                            {isLoadingPosts ? <Loader2 size={14} className="animate-spin" /> : <MoreHorizontal size={14} />}
                            이전 글 더 불러오기
                        </button>
                    )}
                 </div>
              </div>
            </div>
          )}

          {/* [검색 결과 화면] */}
          {viewMode === 'search' && (
            <div className="space-y-6">
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Search className="w-6 h-6 text-indigo-600" />
                            '{searchQuery}' 검색 결과
                        </h2>
                        <button onClick={handleBackToList} className="flex items-center gap-1 px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 text-sm font-bold text-slate-600 transition-colors">
                            <ArrowLeft size={16} /> 목록으로 돌아가기
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-2 pb-2 border-b border-slate-200">
                        <button 
                            onClick={() => setSearchFilterBoardId('all')}
                            className={`px-4 py-2 rounded-full text-sm font-bold transition-all shadow-sm flex items-center gap-2 border ${searchFilterBoardId === 'all' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                        >
                            전체보기 <span className={`text-xs px-1.5 py-0.5 rounded-full ${searchFilterBoardId === 'all' ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>{searchResults.length}</span>
                        </button>
                        
                        {Object.entries(searchBoardStats).map(([boardId, count]) => {
                            let boardName = '기타';
                            const foundBoard = categories.flatMap(c => c.boards).find(b => b.id == boardId);
                            if (foundBoard) boardName = foundBoard.name;
                            if (boardId === 'bookmark') boardName = '북마크';
                            
                            // [수정] 게시판별 직관적인(진한) 색상 적용
                            const color = getBoardColor(boardId);
                            
                            return (
                                <button 
                                    key={boardId}
                                    onClick={() => setSearchFilterBoardId(boardId)}
                                    // [수정] 버튼 스타일을 'badge' 스타일(연한 파스텔톤)로 통일
                                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm flex items-center gap-2 border ${
                                        String(searchFilterBoardId) === String(boardId) 
                                        ? `${color.badge} ring-2 ring-offset-1 ring-indigo-500 opacity-100` 
                                        : `${color.badge} opacity-60 hover:opacity-100`
                                    }`}
                                >
                                    {boardName} <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/50">{count}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="w-full">
                        <table className="w-full table-fixed text-sm">
                            <colgroup>
                                <col className="w-10"/>
                                <col className="w-12 md:w-16"/>
                                <col/>
                                <col className="hidden md:table-column w-12"/>
                                <col className="hidden md:table-column w-24"/>
                                <col className="w-20 md:w-32"/>
                                <col className="hidden md:table-column w-16"/>
                            </colgroup>
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase">
                                <tr>
                                    <th className="py-2"></th>
                                    <th className="py-2">번호</th>
                                    <th className="py-2">제목</th>
                                    <th className="py-2 hidden md:table-cell">첨부</th>
                                    <th className="py-2 hidden md:table-cell">작성자</th>
                                    <th className="py-2">등록일</th>
                                    <th className="py-2 hidden md:table-cell">조회</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {currentSearchResults.length > 0 ? currentSearchResults.map((post, idx) => {
                                    const realNumber = posts.length - posts.findIndex(p => p.docId === post.docId);
                                    // [수정] 리스트 아이콘(뱃지) 색상 적용
                                    const color = getBoardColor(post.boardId);
                                    
                                    return (
                                    <tr key={post.docId} onClick={() => handlePostClick(post)} className="border-b hover:bg-slate-50 cursor-pointer text-sm">
                                        <td className="py-2 text-center" onClick={(e) => {e.stopPropagation();}}></td>
                                        <td className="text-center py-2 text-slate-500">
                                            {realNumber}
                                        </td>
                                        <td className="py-2 px-3">
                                            <div className="flex items-center gap-1.5">
                                                {/* [수정] 검색 목록에서는 연한 파스텔톤 뱃지(badge) 스타일 적용 */}
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border whitespace-nowrap ${color.badge}`}>
                                                    {post.category}
                                                </span>
                                                <span className={`font-medium line-clamp-1 ${post.titleColor}`}>{post.title}</span>
                                            </div>
                                        </td>
                                        <td className="text-center hidden md:table-cell">{(post.attachments?.length > 0 || post.file) && <Paperclip size={14} className="text-slate-400 inline" />}</td>
                                        <td className="text-center text-slate-600 hidden md:table-cell">{post.author}</td>
                                        <td className="text-center text-slate-500 font-light">{formatDisplayDate(post.date)}</td>
                                        <td className="text-center text-slate-500 font-light hidden md:table-cell">{post.views}</td>
                                    </tr>
                                )}) : (
                                    <tr>
                                        <td colSpan="7" className="py-12 text-center text-slate-400">
                                            <Search className="w-10 h-10 mx-auto mb-2 text-slate-200" />
                                            선택하신 분류에 해당하는 검색 결과가 없습니다.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
          )}

          {viewMode === 'write' && (
            <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
               <style>{`
                .wysiwyg-content ul { list-style-type: disc; padding-left: 20px; }
                .wysiwyg-content ol { list-style-type: decimal; padding-left: 20px; }
                .wysiwyg-content li { margin-bottom: 4px; }
                .wysiwyg-content p { margin: 0; }
                .wysiwyg-content h1 { font-size: 2em; font-weight: bold; margin-top: 0.5em; margin-bottom: 0.5em; }
                .wysiwyg-content h2 { font-size: 1.5em; font-weight: bold; margin-top: 0.5em; margin-bottom: 0.5em; }
                .wysiwyg-content h3 { font-size: 1.25em; font-weight: bold; margin-top: 0.5em; margin-bottom: 0.5em; }
              `}</style>
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
                <div className="flex items-center gap-3 w-full">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2 whitespace-nowrap">
                        <PenSquare className="w-6 h-6 text-indigo-600" />
                        {writeForm.id ? '게시글 수정' : '새 글 작성'}
                    </h3>
                    <button onClick={handleTempSave} className="ml-auto px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-xs font-bold flex items-center gap-1 transition-colors"><Save size={14}/> 임시저장</button>
                    {/* [보안] AI Assistant 버튼 제거됨 */}
                    <button onClick={handleBackToList} className="text-slate-400 hover:text-slate-700 flex items-center gap-1 text-sm font-medium transition-colors ml-3"><X size={20} /> 취소</button>
                </div>
              </div>
              
              <div className="p-8 space-y-6">
                 <div className="flex gap-6 items-end">
                    <div className="flex-1">
                        <label className="block text-sm font-bold text-slate-700 mb-2">제목</label>
                        <input type="text" value={writeForm.title} onChange={(e) => setWriteForm({...writeForm, title: e.target.value})} placeholder="제목을 입력하세요" className={`w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${writeForm.titleColor} ${writeForm.titleSize}`} />
                    </div>
                    <div className="flex flex-col gap-2">
                         <label className="text-xs font-bold text-slate-500">제목 스타일</label>
                         <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                            <div className="flex gap-1.5 mr-2">
                                {titleColors.map((color) => (<button key={color.name} onClick={() => setWriteForm({...writeForm, titleColor: color.class})} className={`w-5 h-5 rounded-full border border-black/10 transition-transform hover:scale-110 ${color.bg} ${writeForm.titleColor === color.class ? 'ring-2 ring-offset-1 ring-slate-400' : ''}`} title={color.name} />))}
                            </div>
                            <div className="w-px h-4 bg-slate-300"></div>
                            <select value={writeForm.titleSize} onChange={(e) => setWriteForm({...writeForm, titleSize: e.target.value})} className="text-xs bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer">
                                <option value="text-[10pt]">10pt</option><option value="text-[11pt]">11pt</option><option value="text-[12pt]">12pt</option><option value="text-[13pt]">13pt</option><option value="text-[14pt]">14pt</option><option value="text-[15pt]">15pt</option>
                            </select>
                         </div>
                    </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">내용</label>
                  <div className="border border-slate-300 rounded-xl overflow-hidden transition-all focus-within:ring-2 focus-within:ring-indigo-500 h-[500px] flex flex-col shadow-sm">
                    <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center gap-1.5 flex-shrink-0 flex-wrap relative">
                        {/* [수정] 지우개 버튼 텍스트 변경: 서식지우개 -> 서식 */}
                        <button 
                            onMouseDown={(e) => { e.preventDefault(); handleResetStyles(); }} 
                            className="flex items-center gap-1 px-2 py-1.5 bg-white border border-slate-300 rounded hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-600 text-xs font-bold transition-colors mr-2" 
                            title="모든 서식 초기화"
                        >
                            <Eraser size={14} /> 서식
                        </button>
                        <div className="w-px h-4 bg-slate-300 mx-1"></div>

                        <div className="flex items-center gap-0.5 border-r border-slate-200 pr-1.5 mr-1.5">
                             <button onMouseDown={(e) => handleToolbarAction('undo', null, e)} className="p-1.5 hover:bg-white hover:text-indigo-600 rounded text-slate-600" title="실행 취소"><RotateCcw size={14} /></button>
                             <button onMouseDown={(e) => handleToolbarAction('redo', null, e)} className="p-1.5 hover:bg-white hover:text-indigo-600 rounded text-slate-600" title="다시 실행"><RotateCw size={14} /></button>
                        </div>
                        
                      <button onMouseDown={(e) => handleToolbarAction('bold', null, e)} className="p-1.5 hover:bg-white hover:text-indigo-600 rounded text-slate-600" title="굵게"><Bold size={16} /></button>
                      <button onMouseDown={(e) => handleToolbarAction('italic', null, e)} className="p-1.5 hover:bg-white hover:text-indigo-600 rounded text-slate-600" title="기울임"><Italic size={16} /></button>
                      <button onMouseDown={(e) => handleToolbarAction('underline', null, e)} className="p-1.5 hover:bg-white hover:text-indigo-600 rounded text-slate-600" title="밑줄"><Underline size={16} /></button>
                      <button onMouseDown={(e) => handleToolbarAction('strikeThrough', null, e)} className="p-1.5 hover:bg-white hover:text-indigo-600 rounded text-slate-600" title="취소선"><Strikethrough size={16} /></button>

                      <div className="relative inline-block">
                        <button 
                            onMouseDown={(e) => { e.preventDefault(); setShowColorPicker(!showColorPicker); }} 
                            className="p-1.5 hover:bg-white hover:text-indigo-600 rounded text-slate-600" 
                            title="글자 색상"
                        >
                            <Palette size={16} />
                        </button>
                        {showColorPicker && (
                            <div className="absolute top-full left-0 mt-1 p-2 bg-white border border-slate-200 rounded-lg shadow-xl grid grid-cols-5 gap-1 z-50 w-[140px]">
                                {['#000000', '#334155', '#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e'].map(color => (
                                    <button
                                        key={color}
                                        onMouseDown={(e) => {
                                            handleToolbarAction('foreColor', color, e);
                                            setShowColorPicker(false);
                                        }}
                                        className="w-5 h-5 rounded-full border border-slate-200 hover:scale-125 transition-transform"
                                        style={{ backgroundColor: color }}
                                        title={color}
                                    />
                                ))}
                            </div>
                        )}
                      </div>

                      <div className="w-px h-4 bg-slate-300 mx-1"></div>
                      <button onMouseDown={(e) => handleToolbarAction('justifyLeft', null, e)} className="p-1.5 hover:bg-white hover:text-indigo-600 rounded text-slate-600" title="왼쪽 정렬"><AlignLeft size={16} /></button>
                      <button onMouseDown={(e) => handleToolbarAction('justifyCenter', null, e)} className="p-1.5 hover:bg-white hover:text-indigo-600 rounded text-slate-600" title="가운데 정렬"><AlignCenter size={16} /></button>
                      <button onMouseDown={(e) => handleToolbarAction('justifyRight', null, e)} className="p-1.5 hover:bg-white hover:text-indigo-600 rounded text-slate-600" title="오른쪽 정렬"><AlignRight size={16} /></button>
                      <div className="w-px h-4 bg-slate-300 mx-1"></div>
                      <button onMouseDown={(e) => handleToolbarAction('insertUnorderedList', null, e)} className="p-1.5 hover:bg-white hover:text-indigo-600 rounded text-slate-600" title="글머리 기호"><List size={16} /></button>
                      <button onMouseDown={(e) => handleToolbarAction('insertOrderedList', null, e)} className="p-1.5 hover:bg-white hover:text-indigo-600 rounded text-slate-600" title="번호 매기기"><ListOrdered size={16} /></button>
                      <button onMouseDown={(e) => handleToolbarAction('indent', null, e)} className="p-1.5 hover:bg-white hover:text-indigo-600 rounded text-slate-600" title="들여쓰기"><Indent size={16} /></button>
                      <button onMouseDown={(e) => handleToolbarAction('outdent', null, e)} className="p-1.5 hover:bg-white hover:text-indigo-600 rounded text-slate-600" title="내어쓰기"><Outdent size={16} /></button>
                      <div className="w-px h-4 bg-slate-300 mx-1"></div>
                      <button onClick={() => fileInputRef.current?.click()} className="p-1.5 hover:bg-white hover:text-indigo-600 rounded text-slate-600 relative" title="파일 첨부"><Paperclip size={16} /><input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple /></button>
                    </div>
                    {/* [수정] 본문 기본 폰트 크기 text-sm (14px), 줄간격 leading-loose 추가 */}
                    <div
                      ref={contentRef}
                      contentEditable
                      suppressContentEditableWarning
                      className="wysiwyg-content w-full flex-1 px-6 py-5 border-none focus:ring-0 text-sm leading-loose overflow-y-auto bg-white font-normal text-slate-700 outline-none list-disc list-inside"
                      onInput={(e) => setWriteForm({ ...writeForm, content: e.currentTarget.innerHTML })}
                    />
                    <div className="px-4 py-2 border-t border-slate-100 text-xs text-slate-400 bg-slate-50 flex justify-end">글자 수: {stripHtml(writeForm.content).length}자</div>
                  </div>
                </div>
                {writeForm.attachments.length > 0 && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2"><Paperclip size={16} /> 첨부된 파일 ({writeForm.attachments.length})</h4>
                    <div className="space-y-2">
                      {writeForm.attachments.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 text-sm">
                          <div className="flex items-center gap-2 overflow-hidden"><File size={16} className="text-slate-400 flex-shrink-0" /><span className="truncate text-slate-700">{file.name}</span><span className="text-xs text-slate-400">({file.size})</span></div>
                          <button onClick={() => removeAttachment(idx)} className="text-rose-500 hover:bg-rose-50 p-1 rounded"><X size={14} /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                <button onClick={handleBackToList} className="px-6 py-2.5 bg-white border border-slate-300 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 transition-colors">취소</button>
                <button onClick={handleWriteSubmit} className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">{writeForm.id ? '수정완료' : '등록하기'}</button>
              </div>
            </div>
          )}

          {viewMode === 'detail' && selectedPost && (
            <div className={`max-w-6xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print-content`}>
               <style>{`
                .wysiwyg-content ul { list-style-type: disc; padding-left: 20px; }
                .wysiwyg-content ol { list-style-type: decimal; padding-left: 20px; }
                .wysiwyg-content li { margin-bottom: 4px; }
                .wysiwyg-content p { margin: 0; }
                .wysiwyg-content h1 { font-size: 2em; font-weight: bold; margin-top: 0.5em; margin-bottom: 0.5em; }
                .wysiwyg-content h2 { font-size: 1.5em; font-weight: bold; margin-top: 0.5em; margin-bottom: 0.5em; }
                .wysiwyg-content h3 { font-size: 1.25em; font-weight: bold; margin-top: 0.5em; margin-bottom: 0.5em; }
              `}</style>
              
              <div className="p-4 px-6 border-b border-slate-200 flex justify-between items-center bg-white sticky top-0 z-10 print-hidden">
                <button onClick={handleBackToList} className="flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 font-bold text-sm transition-colors group"><ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> 목록으로 돌아가기</button>
                <div className="flex items-center gap-2">
                  <button onClick={handlePrint} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"><Printer size={14} /> 출력</button>
                  {selectedPost.isDeleted ? (
                    <>
                      <button onClick={() => { showConfirm("이 게시글을 복구하시겠습니까?", () => { setPosts(posts.map(p => p.id === selectedPost.id ? { ...p, isDeleted: false } : p)); handleBackToList(); }); }} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-green-700 bg-green-50 border border-green-100 rounded-lg hover:bg-green-100 transition-colors"><RefreshCcw size={14} /> 복구</button>
                      <button onClick={handleDeletePost} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-100 rounded-lg hover:bg-rose-100 transition-colors"><Trash2 size={14} /> 영구삭제</button>
                    </>
                  ) : (
                    <>
                      <button onClick={handleEditPost} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100 transition-colors"><Edit size={14} /> 수정</button>
                      <button onClick={handleDeletePost} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-100 rounded-lg hover:bg-rose-100 transition-colors"><Trash2 size={14} /> 삭제</button>
                    </>
                  )}
                </div>
              </div>

              <div className="bg-slate-50 px-8 py-8 border-b border-slate-200">
                <div className="flex justify-between items-start gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-slate-400 text-xs font-mono bg-white px-2 py-1 rounded border border-slate-200">No. {selectedPost.id}</span>
                            <span className={`px-2.5 py-1 rounded-md text-xs font-bold border bg-white text-slate-600 border-slate-200`}>{selectedPost.category}</span>
                        </div>
                        <h1 className={`font-extrabold leading-tight mb-6 ${selectedPost.titleColor || 'text-slate-900'} ${selectedPost.titleSize || 'text-2xl'} ${selectedPost.isDeleted ? 'line-through text-slate-400' : ''}`}>{selectedPost.title}</h1>
                    </div>
                    <button onClick={() => handleToggleBookmark(selectedPost)} className="p-2 hover:bg-white rounded-full transition-colors flex-shrink-0 mt-1 print-hidden">
                        <Star size={28} className={selectedPost.isBookmarked ? "fill-yellow-400 text-yellow-400" : "text-slate-300"} />
                    </button>
                </div>
                
                <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-slate-200 shadow-sm"><UserCircle size={16} className="text-indigo-500" /><span className="text-slate-700 font-bold">{selectedPost.author}</span></div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-slate-200 shadow-sm"><Calendar size={16} className="text-slate-400" /><span className="font-medium">{selectedPost.date}</span></div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-slate-200 shadow-sm"><Eye size={16} className="text-slate-400" /><span className="font-medium">{selectedPost.views} 읽음</span></div>
                </div>
              </div>

              <div className="p-8 md:p-10 bg-white min-h-[500px]">
                {/* [수정] 상세보기 폰트 크기를 text-sm (14px)로 변경, 줄간격 leading-loose 추가 */}
                <div className="wysiwyg-content text-slate-800 text-sm leading-loose px-2" dangerouslySetInnerHTML={{ __html: selectedPost.content || "본문 내용이 없습니다." }} />
                
                {selectedPost.attachments && selectedPost.attachments.length > 0 && (
                  <div className="mt-16 bg-slate-50 rounded-xl border border-slate-200 overflow-hidden print-hidden">
                    <div className="px-5 py-3 border-b border-slate-200 bg-slate-100/50 flex items-center gap-2"><Paperclip size={16} className="text-slate-500" /><span className="text-sm font-bold text-slate-700">첨부파일 ({selectedPost.attachments.length})</span></div>
                    <div className="divide-y divide-slate-100">
                      {selectedPost.attachments.map((file, idx) => (
                        <div key={idx} className="p-4 flex items-center justify-between hover:bg-white transition-colors">
                          <div className="flex items-center gap-3"><div className="p-2 bg-white rounded-lg shadow-sm text-indigo-600"><File size={20} /></div><div><p className="text-sm font-bold text-slate-700">{file.name}</p><p className="text-xs text-slate-500">{file.size}</p></div></div>
                          <button onClick={() => showAlert(`${file.name} 다운로드가 시작됩니다.`)} className="px-4 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm flex items-center gap-2"><Download size={14} /> 다운로드</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-12 pt-6 border-t border-slate-100 flex justify-end items-center gap-2 print-hidden">
                     <button onClick={handleBackToList} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-50 transition-colors">목록</button>
                     <button onClick={handlePrint} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"><Printer size={16} /> 출력</button>
                     {selectedPost.isDeleted ? (
                        <>
                          <button onClick={() => { showConfirm("이 게시글을 복구하시겠습니까?", () => { setPosts(posts.map(p => p.id === selectedPost.id ? { ...p, isDeleted: false } : p)); handleBackToList(); }); }} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-green-700 bg-green-50 border border-green-100 rounded-lg hover:bg-green-100 transition-colors"><RefreshCcw size={16} /> 복구</button>
                          <button onClick={handleDeletePost} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-rose-700 bg-rose-50 border border-rose-100 rounded-lg hover:bg-rose-100 transition-colors"><Trash2 size={16} /> 영구삭제</button>
                        </>
                      ) : (
                        <>
                          <button onClick={handleEditPost} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100 transition-colors"><Edit size={16} /> 수정</button>
                          <button onClick={handleDeletePost} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-rose-700 bg-rose-50 border border-rose-100 rounded-lg hover:bg-rose-100 transition-colors"><Trash2 size={14} /> 삭제</button>
                        </>
                      )}
                </div>
              </div>

              <div className="bg-slate-50 border-t border-slate-200 p-8 print-hidden">
                 <h4 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><MessageCircle size={20} /> 댓글 <span className="text-indigo-600">{selectedPost.comments?.length || 0}</span></h4>
                 <div className="space-y-4 mb-8">
                    {selectedPost.comments && selectedPost.comments.length > 0 ? (
                        selectedPost.comments.map((comment) => (
                            <div key={comment.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2"><span className="font-bold text-slate-700 text-sm">{comment.author}</span><span className="text-xs text-slate-400">{comment.date}</span></div>
                                    <button onClick={() => handleDeleteComment(comment.id)} className="text-slate-400 hover:text-rose-500"><X size={14} /></button>
                                </div>
                                <p className="text-slate-600 text-sm">{comment.content}</p>
                            </div>
                        ))
                    ) : (<div className="text-center py-8 text-slate-400 text-sm">작성된 댓글이 없습니다.</div>)}
                 </div>
                 <div className="flex gap-3">
                    <input type="text" value={commentInput} onChange={(e) => setCommentInput(e.target.value)} placeholder="댓글을 입력하세요..." className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" onKeyPress={(e) => e.key === 'Enter' && handleAddComment()} />
                    <button onClick={handleAddComment} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-sm"><Send size={16} /> 등록</button>
                 </div>
              </div>
            </div>
          )}

          <div className="max-w-7xl mx-auto mt-6 text-right text-xs text-slate-400 font-medium print-hidden">© 2026 LOUDERS Corp. All rights reserved.</div>
        </main>
      </div>
      
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2.5"><div className="p-2 bg-indigo-50 rounded-lg"><Settings className="w-5 h-5 text-indigo-600" /></div>게시판 관리 설정</h3>
                <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"><X size={24} /></button>
            </div>
            
            <div className="flex border-b border-slate-200">
                <button onClick={() => setSettingsTab('board')} className={`flex-1 py-3 text-sm font-bold transition-colors ${settingsTab === 'board' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>게시판 관리</button>
                <button onClick={() => setSettingsTab('user')} className={`flex-1 py-3 text-sm font-bold transition-colors ${settingsTab === 'user' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>회원 관리</button>
                <button onClick={() => setSettingsTab('backup')} className={`flex-1 py-3 text-sm font-bold transition-colors ${settingsTab === 'backup' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>데이터 관리</button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
              {settingsTab === 'board' ? (
                  <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2"><FolderPlus size={18} className="text-blue-500" />새 카테고리 추가</h4>
                    <div className="space-y-3"><input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="카테고리명 입력" className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50 focus:bg-white transition-colors" /><button onClick={handleAddCategory} className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"><Plus size={16} /> 카테고리 생성</button></div>
                    </div>
                    <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2"><LayoutDashboard size={18} className="text-emerald-500" />하위 게시판 추가</h4>
                    <div className="space-y-3">
                        <select value={newBoardInput.categoryId} onChange={(e) => setNewBoardInput({ ...newBoardInput, categoryId: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-slate-50 focus:bg-white transition-colors appearance-none"><option value="">카테고리 선택</option>{categories.map(cat => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}</select>
                        <div className="flex gap-2"><input type="text" value={newBoardInput.name} onChange={(e) => setNewBoardInput({ ...newBoardInput, name: e.target.value })} placeholder="게시판명 입력" className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-slate-50 focus:bg-white transition-colors" /><button onClick={handleAddBoardToCategory} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm"><Plus size={18} /></button></div>
                    </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 text-sm font-bold text-slate-700 flex items-center gap-2"><List size={16} className="text-slate-400" />현재 게시판 구조 관리</div>
                    <div className="p-4 space-y-3">
                    {categories.map((cat) => (
                        <div key={cat.id} className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                        <div className="p-4 bg-slate-50 border-b border-slate-100/50">
                            <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3 flex-1">
                                <Folder size={18} className="text-slate-400" />
                                {editingItem?.type === 'category' && editingItem?.id === cat.id ? (
                                <div className="flex gap-2 flex-1 animate-in fade-in slide-in-from-left-2 duration-200">
                                    <input type="text" value={editingItem.name} onChange={(e) => setEditingItem({...editingItem, name: e.target.value})} className="flex-1 px-3 py-1.5 text-sm border border-indigo-500 rounded-md shadow-sm outline-none" autoFocus />
                                    <button onClick={saveEditing} className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-md hover:bg-indigo-700 transition-colors">저장</button>
                                </div>
                                ) : (
                                <span className="text-sm font-bold text-slate-800">{cat.name}</span>
                                )}
                            </div>
                            <div className="flex items-center gap-1">
                                <button onClick={() => startEditing('category', cat.id, cat.name)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="이름 수정"><Edit size={15} /></button>
                                <button onClick={() => handleDeleteCategory(cat.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="삭제"><Trash2 size={15} /></button>
                            </div>
                            </div>
                        </div>
                        <div className="bg-white pl-10 pr-4 py-3 space-y-2">
                            {cat.boards.length > 0 ? (
                            cat.boards.map(board => (
                                <div key={board.id} className="flex flex-col p-2.5 hover:bg-slate-50 rounded-lg group border border-transparent hover:border-slate-100 transition-all">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className="w-1.5 h-1.5 bg-slate-300 rounded-full group-hover:bg-indigo-400 transition-colors"></div>
                                        {editingItem?.type === 'board' && editingItem?.id === board.id ? (
                                        <div className="flex gap-2 flex-1 animate-in fade-in slide-in-from-left-2 duration-200">
                                            <input type="text" value={editingItem.name} onChange={(e) => setEditingItem({...editingItem, name: e.target.value})} className="flex-1 px-3 py-1.5 text-sm border border-indigo-500 rounded-md shadow-sm outline-none" autoFocus />
                                            <button onClick={saveEditing} className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-md hover:bg-indigo-700 transition-colors">저장</button>
                                        </div>
                                        ) : (
                                        <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">{board.name}</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                        <button onClick={() => startEditing('board', board.id, board.name, board.defaultContent)} className="p-1.5 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title="이름/양식 수정"><Edit size={13} /></button>
                                        <button onClick={() => handleDeleteBoard(board.id)} className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors" title="삭제"><Trash2 size={13} /></button>
                                    </div>
                                </div>
                                {editingItem?.type === 'board' && editingItem?.id === board.id && (
                                    <div className="mt-2 pl-4">
                                    <label className="block text-xs font-bold text-slate-500 mb-1">기본 내용(양식)</label>
                                    <textarea 
                                        value={editingItem.defaultContent || ''} 
                                        onChange={(e) => setEditingItem({...editingItem, defaultContent: e.target.value})} 
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:ring-2 focus:ring-indigo-500 outline-none h-20" 
                                        placeholder="기본 양식을 입력하세요 (줄바꿈이 적용됩니다)" 
                                    />
                                    </div>
                                )}
                                </div>
                            ))
                            ) : (<div className="text-xs text-slate-400 py-2 italic flex items-center gap-2"><AlertCircle size={12} />하위 게시판이 없습니다.</div>)}
                        </div>
                        </div>
                    ))}
                    </div>
                  </div>
                  </>
              ) : settingsTab === 'user' ? (
                  <div className="space-y-6">
                      <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
                          {/* [수정] 제목 및 버튼 동적 변경 */}
                          <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                              {editingUser ? <Edit size={18} className="text-blue-500" /> : <Users size={18} className="text-blue-500" />}
                              {editingUser ? '사용자 정보 수정' : '사용자 추가'}
                          </h4>
                          <div className="grid grid-cols-2 gap-3">
                              <input type="text" placeholder="이름" className="px-3 py-2 border border-slate-200 rounded text-sm" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
                              <input type="text" placeholder="아이디" className="px-3 py-2 border border-slate-200 rounded text-sm" value={newUser.userId} onChange={e => setNewUser({...newUser, userId: e.target.value})} disabled={!!editingUser} />
                              <input type="text" placeholder="비밀번호" className="px-3 py-2 border border-slate-200 rounded text-sm" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
                              <input type="text" placeholder="부서" className="px-3 py-2 border border-slate-200 rounded text-sm" value={newUser.dept} onChange={e => setNewUser({...newUser, dept: e.target.value})} />
                              <input type="text" placeholder="직급" className="px-3 py-2 border border-slate-200 rounded text-sm" value={newUser.position} onChange={e => setNewUser({...newUser, position: e.target.value})} />
                              
                              {/* [수정] 버튼 그룹 (수정 시 취소 버튼 표시) */}
                              <div className="flex gap-2">
                                  {editingUser && (
                                      <button onClick={handleCancelUserEdit} className="flex-1 bg-slate-200 text-slate-700 rounded text-sm font-bold hover:bg-slate-300">취소</button>
                                  )}
                                  <button onClick={handleSaveUser} className={`flex-1 text-white rounded text-sm font-bold ${editingUser ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                                      {editingUser ? '수정 저장' : '추가'}
                                  </button>
                              </div>
                          </div>
                      </div>
                      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                          <table className="w-full text-sm text-left">
                              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                                  <tr>
                                      <th className="px-4 py-3">이름</th>
                                      <th className="px-4 py-3">아이디</th>
                                      <th className="px-4 py-3">부서/직급</th>
                                      <th className="px-4 py-3 text-center">관리</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                  {users.map(user => (
                                      <tr key={user.id} className={`hover:bg-slate-50 ${editingUser?.id === user.id ? 'bg-indigo-50' : ''}`}>
                                          <td className="px-4 py-3 font-medium text-slate-700">{user.name}</td>
                                          <td className="px-4 py-3 text-slate-500">{user.userId}</td>
                                          <td className="px-4 py-3 text-slate-500">{user.dept} {user.position}</td>
                                          <td className="px-4 py-3 text-center flex items-center justify-center gap-2">
                                              {/* [추가] 수정 버튼 */}
                                              <button onClick={() => handleEditUserClick(user)} className="text-indigo-500 hover:bg-indigo-50 p-1.5 rounded" title="수정"><Edit size={14} /></button>
                                              <button onClick={() => handleDeleteUser(user.id)} className="text-rose-500 hover:bg-rose-50 p-1.5 rounded" title="삭제"><Trash2 size={14} /></button>
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  </div>
              ) : (
                  <div className="space-y-8">
                      <div className="flex items-center gap-3 mb-2">
                          <Database size={24} className="text-slate-700" />
                          <h4 className="text-lg font-bold text-slate-800">데이터 관리 센터</h4>
                      </div>

                      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center gap-2">
                              <div className="p-1.5 bg-blue-100 rounded-lg text-blue-600">
                                  <Download size={18} />
                              </div>
                              <div>
                                  <h5 className="text-sm font-bold text-slate-800">데이터 백업 (내보내기)</h5>
                                  <p className="text-xs text-slate-500">현재 게시판의 모든 데이터를 파일로 저장하여 보관합니다.</p>
                              </div>
                          </div>
                          <div className="p-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <button onClick={handleExportExcel} className="flex flex-col items-center justify-center p-4 border border-slate-200 rounded-xl hover:bg-green-50 hover:border-green-200 transition-all group">
                                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-3 group-hover:scale-110 transition-transform">
                                          <FileSpreadsheet size={20} />
                                      </div>
                                      <span className="text-sm font-bold text-slate-700 group-hover:text-green-700">Excel 파일로 저장</span>
                                      <span className="text-xs text-slate-400 mt-1">(.xlsx) - 분류별 시트 생성</span>
                                  </button>
                                  
                                  <button onClick={handleExportJSON} className="flex flex-col items-center justify-center p-4 border border-slate-200 rounded-xl hover:bg-yellow-50 hover:border-yellow-200 transition-all group">
                                      <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 mb-3 group-hover:scale-110 transition-transform">
                                          <File size={20} />
                                      </div>
                                      <span className="text-sm font-bold text-slate-700 group-hover:text-yellow-700">전체 백업 파일 저장</span>
                                      <span className="text-xs text-slate-400 mt-1">(.json) - 시스템용</span>
                                  </button>
                              </div>
                          </div>
                      </div>

                      <div className="bg-white rounded-xl border-2 border-orange-100 shadow-sm overflow-hidden">
                          <div className="bg-orange-50/50 px-6 py-4 border-b border-orange-100 flex items-center gap-2">
                              <div className="p-1.5 bg-orange-100 rounded-lg text-orange-600">
                                  <Upload size={18} />
                              </div>
                              <div>
                                  <h5 className="text-sm font-bold text-slate-800">데이터 복원 (불러오기)</h5>
                                  <p className="text-xs text-orange-600 font-medium flex items-center gap-1">
                                      <AlertCircle size={12} /> 주의: 기존 데이터가 모두 삭제되고 파일 내용으로 교체됩니다.
                                  </p>
                              </div>
                          </div>
                          
                          <div className="p-6">
                              <div className="grid grid-cols-1 gap-4">
                                  <div className="flex gap-3">
                                      <button onClick={handleImportExcelClick} className="flex-1 flex items-center justify-center gap-3 py-3 px-4 bg-white border border-slate-200 border-b-2 border-b-slate-200 rounded-xl hover:bg-slate-50 hover:border-green-300 hover:text-green-700 transition-all text-sm font-bold text-slate-600 group">
                                          <FileSpreadsheet size={18} className="text-green-500 group-hover:scale-110 transition-transform" />
                                          Excel / xlsx 파일 불러오기
                                      </button>
                                      <input 
                                          type="file" 
                                          ref={excelInputRef} 
                                          onChange={handleImportExcelChange} 
                                          accept=".xlsx, .xls" 
                                          className="hidden" 
                                      />

                                      <button onClick={handleImportClick} className="flex-1 flex items-center justify-center gap-3 py-3 px-4 bg-white border border-slate-200 border-b-2 border-b-slate-200 rounded-xl hover:bg-slate-50 hover:border-indigo-300 hover:text-indigo-700 transition-all text-sm font-bold text-slate-600 group">
                                          <File size={18} className="text-indigo-500 group-hover:scale-110 transition-transform" />
                                          JSON 백업 파일 불러오기
                                      </button>
                                      <input 
                                          type="file" 
                                          ref={importFileRef} 
                                          onChange={handleImportFileChange} 
                                          accept=".json" 
                                          className="hidden" 
                                      />
                                  </div>
                                  <div className="text-center">
                                      <p className="text-[11px] text-slate-400">
                                          * 복원 시 데이터 구조가 맞지 않으면 오류가 발생할 수 있습니다. 백업 파일을 사용해 주세요.
                                      </p>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              )}
            </div>
            <div className="p-5 bg-white border-t border-slate-100 text-right"><button onClick={() => setIsSettingsOpen(false)} className="px-6 py-2.5 bg-slate-800 text-white text-sm font-bold rounded-xl hover:bg-slate-900 transition-all shadow-lg shadow-slate-200">닫기</button></div>
          </div>
        </div>
      )}

      {modalConfig.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-100">
            <div className="p-8 text-center">
              <div className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-4 ${modalConfig.type === 'confirm' ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'}`}><AlertCircle size={28} /></div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">{modalConfig.type === 'confirm' ? '확인해 주세요' : '알림'}</h3>
              {/* [수정] 줄바꿈(whitespace-pre-wrap) 적용 */}
              <p className="text-sm text-slate-500 leading-relaxed font-medium whitespace-pre-wrap">{modalConfig.message}</p>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
              {modalConfig.type === 'confirm' && <button onClick={closeModal} className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm">취소</button>}
              <button onClick={handleConfirmAction} className={`flex-1 px-4 py-2.5 text-white text-sm font-bold rounded-xl shadow-md transition-all transform active:scale-95 ${modalConfig.type === 'confirm' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200' : 'bg-slate-800 hover:bg-slate-900 shadow-slate-200'}`}>확인</button>
            </div>
          </div>
        </div>
      )}

      {isProcessing && (
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center flex-col gap-4 backdrop-blur-sm">
            <Loader2 className="w-12 h-12 text-white animate-spin" />
            <p className="text-white font-bold text-lg">데이터 처리 중입니다... 잠시만 기다려주세요.</p>
        </div>
      )}
    </div>
  );
};

export default InternalBoard;