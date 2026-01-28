import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, ChevronLeft, ChevronRight, PenSquare, FileText, Paperclip, 
  Settings, Menu, User, Plus, Trash2, LayoutDashboard, MessageSquare, Megaphone, X,
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, List, ListOrdered, Indent, Outdent,
  Eye, Calendar, UserCircle, ArrowLeft, Edit, ArrowUp, ArrowDown, CheckSquare, AlertCircle, 
  ChevronDown, ChevronUp, FolderPlus, Folder, RefreshCcw, File, Download, Palette, Type, Sparkles, Loader2,
  Heading1, Heading2, Star, MessageCircle, Send, Save, Users, Key, Database, Upload, FileSpreadsheet, Filter, LogOut, Lock,
  ChevronsLeft, ChevronsRight 
} from 'lucide-react';

// [중요] 로컬(내 컴퓨터)에서 실행할 때는 아래 줄의 주석(//)을 지우고 사용하세요!
// import * as XLSX from 'xlsx';

// [중요] Firebase 관련 import
import { initializeApp } from "firebase/app";
import { 
  getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, 
  onSnapshot, query, orderBy, writeBatch, increment 
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

const InternalBoard = () => {
  const [viewMode, setViewMode] = useState('login');
  const [currentUser, setCurrentUser] = useState(null);
  const [loginId, setLoginId] = useState('');
  const [loginPw, setLoginPw] = useState('');
  const apiKey = ""; 

  // [추가] 엑셀 라이브러리 로드 상태
  const [isXlsxLoaded, setIsXlsxLoaded] = useState(false);

  // [추가] 엑셀 라이브러리 자동 로딩 (CDN) - 로컬/웹 호환성 확보
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

  // 엑셀 객체 가져오기
  const getXLSX = () => {
    // import된 XLSX가 있다면 그것을 사용 (주석 해제 시)
    // if (typeof XLSX !== 'undefined') return XLSX; 
    
    // window 객체에 로드된 XLSX 사용 (CDN)
    if (typeof window !== 'undefined' && window.XLSX) return window.XLSX;
    return null;
  };

  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([
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
  ]);

  const [users, setUsers] = useState([
    { id: 1, name: '관리자', userId: 'admin', password: '0802', dept: '시스템 운영팀', position: '관리자' },
    { id: 2, name: '김철수', userId: 'kimcs', password: 'user1234', dept: '생산관리팀', position: '대리' },
    { id: 3, name: '이영희', userId: 'leeyh', password: 'user5678', dept: '영업팀', position: '사원' },
  ]);

  const [activeBoardId, setActiveBoardId] = useState(11);
  
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

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState('board'); 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [newCategoryName, setNewCategoryName] = useState('');
  const [newBoardInput, setNewBoardInput] = useState({ categoryId: '', name: '' });
  const [editingItem, setEditingItem] = useState(null);
  const [newUser, setNewUser] = useState({ name: '', userId: '', password: '', dept: '', position: '' });
  const [modalConfig, setModalConfig] = useState({ isOpen: false, type: '', message: '', onConfirm: null });

  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilterBoardId, setSearchFilterBoardId] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');

  const [writeForm, setWriteForm] = useState({
    id: null, docId: null, title: '', content: '', titleColor: 'text-rose-600', titleSize: 'text-[14pt]', attachments: [] 
  });

  const [commentInput, setCommentInput] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFontSizePicker, setShowFontSizePicker] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const fileInputRef = useRef(null);
  const importFileRef = useRef(null);
  const excelInputRef = useRef(null);
  const contentRef = useRef(null);
  const savedSelection = useRef(null);

  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [activePage, setActivePage] = useState(1);
  const postsPerPage = 15;

  // Firebase 실시간 데이터 구독
  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("id", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postData = snapshot.docs.map(doc => ({
        ...doc.data(),
        docId: doc.id 
      }));
      setPosts(postData);
      
      if (selectedPost) {
        const currentDoc = postData.find(p => p.id === selectedPost.id);
        if (currentDoc) setSelectedPost(currentDoc);
      }
    });
    return () => unsubscribe();
  }, [selectedPost?.id]);

  const getTodayString = () => {
    const d = new Date();
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };
  const formatDisplayDate = (fullDateString) => {
    if (!fullDateString) return '';
    const [datePart, timePart] = fullDateString.split(' ');
    return datePart === getTodayString() ? timePart : datePart;
  };
  const stripHtml = (html) => {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };
  const textToHtmlWithLineBreaks = (text) => {
    if (!text) return '';
    if (typeof text !== 'string') return String(text);
    return text.replace(/\r\n/g, "<br/>").replace(/\n/g, "<br/>");
  };
  const htmlToTextWithLineBreaks = (html) => {
    if (!html) return "";
    let text = html.replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n").replace(/<\/div>/gi, "\n").replace(/<\/li>/gi, "\n");
    const tmp = document.createElement("DIV");
    tmp.innerHTML = text;
    return (tmp.textContent || tmp.innerText || "").trim();
  };

  const handleLogin = (e) => {
    e.preventDefault();
    const user = users.find(u => u.userId === loginId && u.password === loginPw);
    if (user) {
        setCurrentUser(user);
        setViewMode('list');
        setLoginId('');
        setLoginPw('');
    } else {
        showAlert("아이디 또는 비밀번호가 올바르지 않습니다.");
    }
  };
  const handleLogout = () => showConfirm("로그아웃 하시겠습니까?", () => { setCurrentUser(null); setViewMode('login'); });

  const handleWriteSubmit = async () => {
    if (!writeForm.title.trim()) { showAlert("제목을 입력해주세요."); return; }
    const today = new Date();
    const dateString = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')} ${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`;
    const postData = {
        title: writeForm.title, content: writeForm.content, titleColor: writeForm.titleColor, 
        titleSize: writeForm.titleSize, attachments: writeForm.attachments, boardId: activeBoardId, category: activeBoard.name,
    };
    try {
        if (writeForm.docId) {
            await updateDoc(doc(db, "posts", writeForm.docId), postData);
            setViewMode('detail');
        } else {
            const newId = Date.now();
            await addDoc(collection(db, "posts"), {
                id: newId, type: 'normal', author: currentUser ? currentUser.name : '관리자', 
                date: dateString, views: 0, file: writeForm.attachments.length > 0, 
                isMoved: false, isDeleted: false, isBookmarked: false, comments: [], ...postData
            });
            setViewMode('list');
        }
        localStorage.removeItem('internalBoard_temp');
        setWriteForm({ id: null, docId: null, title: '', content: '', titleColor: 'text-rose-600', titleSize: 'text-[14pt]', attachments: [] });
    } catch (error) {
        console.error("Error adding/updating document: ", error);
        showAlert("저장 중 오류가 발생했습니다.");
    }
  };

  const handleDeletePost = async () => {
    if (!selectedPost) return;
    try {
        if (activeBoardId === 'trash') {
            showConfirm("정말로 영구 삭제하시겠습니까?", async () => {
                await deleteDoc(doc(db, "posts", selectedPost.docId));
                handleBackToList();
            });
        } else {
            showConfirm("휴지통으로 이동하시겠습니까?", async () => {
                await updateDoc(doc(db, "posts", selectedPost.docId), { isDeleted: true });
                handleBackToList();
            });
        }
    } catch (e) { showAlert("삭제 중 오류 발생"); }
  };

  const handleDeleteSelected = () => {
      if (selectedIds.length === 0) return;
      const processBatch = async (actionType) => {
          const batch = writeBatch(db);
          const selectedDocs = posts.filter(p => selectedIds.includes(p.id));
          selectedDocs.forEach(post => {
              const ref = doc(db, "posts", post.docId);
              if (actionType === 'permanent') batch.delete(ref);
              else if (actionType === 'soft') batch.update(ref, { isDeleted: true });
              else if (actionType === 'restore') batch.update(ref, { isDeleted: false });
          });
          await batch.commit();
          setSelectedIds([]);
          showAlert("처리되었습니다.");
      };
      if (activeBoardId === 'trash') showConfirm("영구 삭제하시겠습니까?", () => processBatch('permanent'));
      else showConfirm("삭제하시겠습니까?", () => processBatch('soft'));
  };

  const handleRestoreSelected = () => {
      if (selectedIds.length === 0) return;
      showConfirm("복구하시겠습니까?", async () => {
          const batch = writeBatch(db);
          const selectedDocs = posts.filter(p => selectedIds.includes(p.id));
          selectedDocs.forEach(post => batch.update(doc(db, "posts", post.docId), { isDeleted: false }));
          await batch.commit();
          setSelectedIds([]);
      });
  };

  const handlePostClick = async (post) => {
    const postRef = doc(db, "posts", post.docId);
    updateDoc(postRef, { views: increment(1) });
    setSelectedPost(post);
    setViewMode('detail');
  };

  const handleToggleBookmark = async (post) => {
    try { await updateDoc(doc(db, "posts", post.docId), { isBookmarked: !post.isBookmarked }); } catch (e) { console.error(e); }
  };

  const handleAddComment = async () => {
    if (!commentInput.trim()) return;
    const newComment = {
        id: Date.now(), author: currentUser ? currentUser.name : '익명', 
        content: commentInput, date: getTodayString() + ' ' + new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
    };
    const updatedComments = [...(selectedPost.comments || []), newComment];
    await updateDoc(doc(db, "posts", selectedPost.docId), { comments: updatedComments });
    setCommentInput('');
  };

  const handleDeleteComment = async (commentId) => {
      if(!window.confirm("삭제하시겠습니까?")) return;
      const updatedComments = selectedPost.comments.filter(c => c.id !== commentId);
      await updateDoc(doc(db, "posts", selectedPost.docId), { comments: updatedComments });
  };

  const handleExportExcel = () => {
    const XLSX_LIB = getXLSX();
    if (!XLSX_LIB) { showAlert("엑셀 라이브러리가 로드되지 않았습니다. 잠시 후 다시 시도해주세요."); return; }
    
    const activePosts = posts.filter(post => !post.isDeleted);
    const excelData = activePosts.map(post => ({
        '번호': post.id, '분류': post.category, '제목': post.title, '작성자': post.author,
        '등록일': post.date, '조회수': post.views, '내용': htmlToTextWithLineBreaks(post.content) 
    }));
    const worksheet = XLSX_LIB.utils.json_to_sheet(excelData);
    const workbook = XLSX_LIB.utils.book_new();
    XLSX_LIB.utils.book_append_sheet(workbook, worksheet, "게시글 목록");
    XLSX_LIB.writeFile(workbook, `LOUDERS_Board_Backup_${new Date().toLocaleDateString()}.xlsx`);
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
        const firstSheetName = workbook.SheetNames[0];
        const jsonData = XLSX_LIB.utils.sheet_to_json(workbook.Sheets[firstSheetName]);
        if (jsonData.length === 0) { showAlert("데이터 없음"); return; }
        const boardNameMap = {}; categories.forEach(cat => cat.boards.forEach(board => boardNameMap[board.name] = board.id));
        const parsedPosts = jsonData.filter(row => row['제목']).map(row => ({
            id: row['번호'] || Date.now(), category: row['분류'] || '기타', boardId: boardNameMap[row['분류']] || 11,
            title: row['제목'], author: row['작성자'] || '익명', date: row['등록일'] || getTodayString(), views: row['조회수'] || 0,
            content: row['내용'] ? textToHtmlWithLineBreaks(row['내용']) : '', type: 'normal', file: false, attachments: [], 
            titleColor: 'text-slate-900', titleSize: 'text-[14pt]', isMoved: false, isDeleted: false, isBookmarked: false, comments: []
        }));
        showConfirm(`엑셀 데이터 ${parsedPosts.length}건을 불러오시겠습니까?`, () => { setPosts(parsedPosts.sort((a, b) => b.id - a.id)); setTimeout(() => showAlert("동기화 완료"), 300); });
      } catch (error) { showAlert("엑셀 처리 오류"); }
    };
    reader.readAsArrayBuffer(file); e.target.value = '';
  };

  // 나머지 기능
  const handleImportClick = () => importFileRef.current?.click();
  const handleImportFileChange = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => { try { const importedData = JSON.parse(event.target.result); if (Array.isArray(importedData)) showConfirm(`데이터 ${importedData.length}개 복원?`, () => { setPosts(importedData.sort((a, b) => b.id - a.id)); setTimeout(() => showAlert("완료"), 300); }); } catch (error) { showAlert("파일 오류"); } };
    reader.readAsText(file); e.target.value = ''; 
  };
  const handleExportJSON = () => { const activePosts = posts.filter(post => !post.isDeleted); const jsonContent = JSON.stringify(activePosts, null, 2); downloadFile(jsonContent, `LOUDERS_Board_Backup_${new Date().toLocaleDateString()}.json`, 'application/json'); };
  const downloadFile = (content, fileName, mimeType) => { const blob = new Blob([content], { type: mimeType }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = fileName; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); };

  const handleGlobalSearch = () => { if (!searchInput.trim()) { showAlert("검색어 입력"); return; } setSearchQuery(searchInput); setViewMode('search'); setSearchFilterBoardId('all'); setActivePage(1); };
  const getFilteredPosts = () => posts.filter(post => { if (activeBoardId === 'trash') return post.isDeleted; if (activeBoardId === 'bookmark') return post.isBookmarked && !post.isDeleted; if (activeBoardId && activeBoardId !== 'trash' && activeBoardId !== 'bookmark') return post.boardId === activeBoardId && !post.isDeleted; return !post.isDeleted; });
  const filteredPosts = viewMode === 'search' ? posts.filter(p => !p.isDeleted && (p.title.includes(searchQuery) || stripHtml(p.content).includes(searchQuery))) : getFilteredPosts();
  const indexOfLastPost = activePage * postsPerPage; const indexOfFirstPost = indexOfLastPost - postsPerPage; const currentPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost); const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
  const pageGroupSize = 10; const startPage = (Math.ceil(activePage / pageGroupSize) - 1) * pageGroupSize + 1; const endPage = Math.min(startPage + pageGroupSize - 1, totalPages);

  const handleMoveContent = () => showAlert("DB 연동 모드에서는 순서 이동이 제한됩니다."); 
  const toggleCategory = (id) => setCategories(categories.map(c => c.id === id ? { ...c, isExpanded: !c.isExpanded } : c));
  const handleBackToList = () => { setViewMode('list'); setSelectedPost(null); setSelectedIds([]); setWriteForm({ id: null, docId: null, title: '', content: '', titleColor: 'text-rose-600', titleSize: 'text-[14pt]', attachments: [] }); };
  const handleGoToWrite = () => { let defaultContent = ''; const ab = getActiveBoard(); if (ab && ab.defaultContent) defaultContent = textToHtmlWithLineBreaks(ab.defaultContent); setWriteForm({ id: null, docId: null, title: '', content: defaultContent, titleColor: 'text-rose-600', titleSize: 'text-[14pt]', attachments: [] }); setViewMode('write'); };
  const handleEditPost = () => { if (!selectedPost) return; setWriteForm({ id: selectedPost.id, docId: selectedPost.docId, title: selectedPost.title, content: selectedPost.content, titleColor: selectedPost.titleColor || 'text-slate-900', titleSize: selectedPost.titleSize || 'text-[14pt]', attachments: selectedPost.attachments || [] }); setViewMode('write'); };
  const handleTempSave = () => { localStorage.setItem('internalBoard_temp', JSON.stringify(writeForm)); showAlert("임시 저장됨"); };
  const handleSelectAllCheckbox = (e) => setSelectedIds(e.target.checked ? filteredPosts.map(p => p.id) : []);
  const toggleSelection = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const handleFileChange = (e) => { if (e.target.files) setWriteForm(prev => ({ ...prev, attachments: [...prev.attachments, ...Array.from(e.target.files).map(f => ({ name: f.name, size: (f.size/1024).toFixed(1)+'KB' }))] })); };
  const removeAttachment = (i) => setWriteForm(prev => ({ ...prev, attachments: prev.attachments.filter((_, idx) => idx !== i) }));
  
  const callGeminiAI = async (prompt) => { setIsAiLoading(true); try { const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) }); const data = await response.json(); return data.candidates?.[0]?.content?.parts?.[0]?.text || null; } catch (error) { showAlert("AI 오류: " + error.message); return null; } finally { setIsAiLoading(false); } };
  
  const handleAiRefine = async () => { 
    const plainText = stripHtml(writeForm.content).trim(); 
    if (!plainText && !writeForm.title.trim()) { 
      showAlert("내용을 입력해주세요."); 
      return; 
    } 
    const prompt = plainText 
      ? `다음 내용을 사내 게시판용으로 정중하게 다듬어줘(HTML 태그 포함): "${plainText}"` 
      : `제목 "${writeForm.title}"에 어울리는 공지사항 초안 작성해줘(HTML 태그 포함).`; 
      
    const result = await callGeminiAI(prompt); 
    
    if (result) { 
        const cleaned = result.replace(/```html|```/g, "").trim();
        setWriteForm(prev => ({ ...prev, content: cleaned })); 
        if (contentRef.current) contentRef.current.innerHTML = cleaned; 
    } 
  };

  const applyFormatBlock = (tag) => document.execCommand('formatBlock', false, tag);
  const handleToolbarAction = (act, val, e) => { e?.preventDefault(); document.execCommand(act, false, val); if (contentRef.current) setWriteForm(p => ({...p, content: contentRef.current.innerHTML})); };
  const titleColors = [{ name: 'Red', class: 'text-rose-600', bg: 'bg-rose-600' }, { name: 'Black', class: 'text-slate-900', bg: 'bg-slate-900' }, { name: 'Blue', class: 'text-indigo-600', bg: 'bg-indigo-600' }, { name: 'Green', class: 'text-emerald-600', bg: 'bg-emerald-600' }, { name: 'Amber', class: 'text-amber-600', bg: 'bg-amber-600' }, { name: 'Purple', class: 'text-purple-600', bg: 'bg-purple-600' }];
  
  const showAlert = (message) => setModalConfig({ isOpen: true, type: 'alert', message, onConfirm: null });
  const showConfirm = (message, onConfirm) => setModalConfig({ isOpen: true, type: 'confirm', message, onConfirm });
  const closeModal = () => setModalConfig(prev => ({ ...prev, isOpen: false }));
  const handleConfirmAction = () => { if (modalConfig.onConfirm) modalConfig.onConfirm(); closeModal(); };

  if (viewMode === 'login') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-300">
          <div className="text-center mb-8"><div className="w-16 h-16 bg-indigo-600 rounded-2xl mx-auto flex items-center justify-center text-white shadow-lg mb-4"><LayoutDashboard size={32} /></div><h2 className="text-2xl font-bold text-slate-800">LOUDERS</h2><p className="text-slate-500 text-sm mt-1">사내 인트라넷 시스템 (Cloud Ver.)</p></div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div><label className="block text-xs font-bold text-slate-500 mb-1 ml-1">아이디</label><div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" /><input type="text" value={loginId} onChange={(e) => setLoginId(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="아이디" /></div></div>
            <div><label className="block text-xs font-bold text-slate-500 mb-1 ml-1">비밀번호</label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" /><input type="password" value={loginPw} onChange={(e) => setLoginPw(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="비밀번호" /></div></div>
            <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-transform hover:scale-[1.02]">로그인</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden relative">
      <aside className={`absolute lg:relative w-64 bg-slate-900 border-r border-slate-800 flex-shrink-0 flex flex-col z-30 h-full transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 border-b border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3"><div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg"><LayoutDashboard size={20} /></div><span className="text-lg font-bold text-white tracking-tight">LOUDERS</span></div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden text-slate-400 hover:text-white"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto py-6 px-3 custom-scrollbar">
          {categories.map((cat) => (
            <div key={cat.id} className="mb-6">
              <button onClick={() => toggleCategory(cat.id)} className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-slate-400 hover:text-white uppercase tracking-wider mb-2"><span>{cat.name}</span>{cat.isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</button>
              {cat.isExpanded && <div className="space-y-1">{cat.boards.map(board => (<button key={board.id} onClick={() => { setActiveBoardId(board.id); setViewMode('list'); setSearchInput(''); setSearchQuery(''); setActivePage(1); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${activeBoardId === board.id && viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>{board.id === 'bookmark' ? <Star size={18} className="text-yellow-400" /> : board.type === 'notice' ? <Megaphone size={18} /> : <MessageSquare size={18} />}{board.name}</button>))}</div>}
            </div>
          ))}
        </div>
        <div className="p-3 border-t border-slate-800"><button onClick={() => { setActiveBoardId('trash'); setViewMode('list'); }} className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${activeBoardId === 'trash' ? 'bg-rose-900/50 text-rose-200 border border-rose-800' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}><Trash2 size={18} />휴지통</button></div>
        <div className="p-4 border-t border-slate-800 bg-slate-900/50"><div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white"><User size={18} /></div><div className="flex-1 min-w-0"><p className="text-sm font-bold text-white truncate">{currentUser?.name}</p><p className="text-xs text-slate-400 truncate">{currentUser?.dept}</p></div></div><button onClick={handleLogout} className="text-slate-400 hover:text-white"><LogOut size={16} /></button></div></div>
      </aside>
      
      {isMobileMenuOpen && (<div className="fixed inset-0 bg-black/50 z-20 lg:hidden backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />)}

      <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 shadow-sm z-10 gap-4">
          <div className="flex items-center gap-4"><button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden text-slate-500"><Menu size={20} /></button><h2 className="text-lg font-bold text-slate-800 hidden md:block">{viewMode === 'search' ? '통합 검색' : activeBoard.name}</h2></div>
          <div className="flex-1 max-w-xl mx-auto relative group"><input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleGlobalSearch()} placeholder="검색..." className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /></div>
          <div className="flex items-center gap-2"><button onClick={() => setIsSettingsOpen(true)} className="p-2 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 rounded-full"><Settings size={18} /></button></div>
        </header>

        <main className="flex-1 overflow-y-auto p-3 md:p-6">
          {(viewMode === 'list' || viewMode === 'search') && (
            <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-3 border-b flex flex-col gap-3 bg-white border-slate-100">
                <div className="flex justify-between items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${activeBoardId === 'trash' ? 'bg-rose-100 text-rose-600' : 'bg-indigo-50 text-indigo-600'}`}>{activeBoardId === 'trash' ? <Trash2 size={16} /> : <FileText size={16} />}</div>
                    <h1 className="text-lg font-bold text-slate-900">{activeBoard.name}</h1>
                  </div>
                  <div className="flex items-center gap-2">
                     {activeBoardId === 'trash' ? <button onClick={handleDeleteSelected} className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded font-bold text-xs">영구삭제</button> : <button onClick={handleGoToWrite} className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md text-xs font-bold shadow-sm"><PenSquare size={14} /> 글쓰기</button>}
                  </div>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] table-fixed">
                  <colgroup><col className="w-10"/><col className="w-16"/><col/><col className="w-12"/><col className="w-24"/><col className="w-32"/><col className="w-16"/></colgroup>
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase"><th className="py-2"><input type="checkbox" onChange={handleSelectAllCheckbox} /></th><th>번호</th><th>제목</th><th>첨부</th><th>작성자</th><th>등록일</th><th>조회</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentPosts.length > 0 ? currentPosts.map(post => (
                        <tr key={post.id} onClick={() => handlePostClick(post)} className={`hover:bg-indigo-50/60 cursor-pointer text-sm ${selectedIds.includes(post.id) ? 'bg-indigo-50' : ''}`}>
                            <td className="py-2 text-center" onClick={(e) => {e.stopPropagation(); toggleSelection(post.id);}}><input type="checkbox" checked={selectedIds.includes(post.id)} onChange={() => {}} className="cursor-pointer" /></td>
                            <td className="text-center text-slate-500">{post.id}</td>
                            <td className="py-2 px-3"><div className="flex items-center gap-1.5">{post.type === 'notice' && <span className="bg-rose-100 text-rose-600 text-[10px] px-1 rounded font-bold">공지</span>}<span className={`font-medium line-clamp-1 ${post.titleColor}`}>{post.title}</span>{post.isBookmarked && <Star size={12} className="text-yellow-500 fill-yellow-500" />}</div></td>
                            <td className="text-center">{(post.attachments?.length > 0 || post.file) && <Paperclip size={14} className="text-slate-400 inline" />}</td>
                            <td className="text-center text-slate-600">{post.author}</td>
                            <td className="text-center text-slate-500 font-light">{formatDisplayDate(post.date)}</td>
                            <td className="text-center text-slate-500 font-light">{post.views}</td>
                        </tr>
                    )) : <tr><td colSpan="7" className="py-8 text-center text-slate-400">게시글이 없습니다.</td></tr>}
                  </tbody>
                </table>
              </div>

              {/* 페이지네이션 */}
              <div className="p-3 border-t border-slate-200 bg-white flex justify-center items-center gap-1">
                 <button onClick={() => setActivePage(1)} disabled={activePage === 1} className="p-1 border rounded disabled:opacity-30"><ChevronsLeft size={14} /></button>
                 <button onClick={() => setActivePage(Math.max(1, startPage - 1))} disabled={startPage === 1} className="p-1 border rounded disabled:opacity-30"><ChevronLeft size={14} /></button>
                 {Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map(p => (
                   <button key={p} onClick={() => setActivePage(p)} className={`w-6 h-6 flex items-center justify-center rounded text-xs font-bold ${activePage === p ? 'bg-indigo-600 text-white' : 'border'}`}>{p}</button>
                 ))}
                 <button onClick={() => setActivePage(Math.min(totalPages, endPage + 1))} disabled={endPage >= totalPages || totalPages === 0} className="p-1 border rounded disabled:opacity-30"><ChevronRight size={14} /></button>
                 <button onClick={() => setActivePage(totalPages)} disabled={activePage === totalPages || totalPages === 0} className="p-1 border rounded disabled:opacity-30"><ChevronsRight size={14} /></button>
              </div>
            </div>
          )}

          {viewMode === 'write' && (
            <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {/* 에디터 상단 바 */}
                <div className="p-4 border-b flex justify-between items-center bg-white"><h3 className="font-bold text-lg">글쓰기</h3><button onClick={handleBackToList}><X /></button></div>
                <div className="p-6 space-y-4">
                    <input type="text" value={writeForm.title} onChange={e => setWriteForm({...writeForm, title: e.target.value})} placeholder="제목" className="w-full p-3 border rounded-xl font-bold" />
                    {/* 툴바 */}
                    <div className="border rounded-xl overflow-hidden h-[400px] flex flex-col">
                        <div className="bg-slate-50 border-b p-2 flex gap-1">
                            <button onMouseDown={e => handleToolbarAction('bold', null, e)} className="p-1.5 hover:bg-white rounded"><Bold size={16}/></button>
                            <button onMouseDown={e => handleToolbarAction('underline', null, e)} className="p-1.5 hover:bg-white rounded"><Underline size={16}/></button>
                            {/* ... 기타 툴바 버튼들 ... */}
                        </div>
                        <div ref={contentRef} contentEditable className="flex-1 p-4 outline-none overflow-y-auto" onInput={e => setWriteForm({...writeForm, content: e.currentTarget.innerHTML})} />
                    </div>
                    {/* 파일 첨부 영역 등 ... */}
                </div>
                <div className="p-4 border-t flex justify-end gap-2"><button onClick={handleBackToList} className="px-4 py-2 border rounded-lg">취소</button><button onClick={handleWriteSubmit} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">등록</button></div>
            </div>
          )}

          {viewMode === 'detail' && selectedPost && (
            <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b flex justify-between"><button onClick={handleBackToList} className="flex items-center gap-1"><ArrowLeft size={16}/>목록</button><div className="flex gap-2"><button onClick={handleEditPost} className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded text-xs font-bold">수정</button><button onClick={handleDeletePost} className="px-3 py-1 bg-rose-50 text-rose-600 rounded text-xs font-bold">삭제</button></div></div>
                <div className="p-8 border-b bg-slate-50">
                    <h1 className={`text-2xl font-bold mb-4 ${selectedPost.titleColor}`}>{selectedPost.title}</h1>
                    <div className="flex gap-4 text-sm text-slate-500"><span>{selectedPost.author}</span><span>{selectedPost.date}</span><span>{selectedPost.views} 읽음</span></div>
                </div>
                <div className="p-8 min-h-[300px]" dangerouslySetInnerHTML={{ __html: selectedPost.content }} />
                {/* 댓글 영역 */}
                <div className="p-8 bg-slate-50 border-t">
                    <h4 className="font-bold mb-4">댓글 ({selectedPost.comments?.length || 0})</h4>
                    <div className="space-y-3 mb-4">
                        {selectedPost.comments?.map(c => (<div key={c.id} className="bg-white p-3 rounded border shadow-sm"><div className="flex justify-between text-xs mb-1"><span className="font-bold">{c.author}</span><button onClick={() => handleDeleteComment(c.id)}><X size={12}/></button></div>{c.content}</div>))}
                    </div>
                    <div className="flex gap-2"><input type="text" value={commentInput} onChange={e => setCommentInput(e.target.value)} className="flex-1 p-2 border rounded" placeholder="댓글..." /><button onClick={handleAddComment} className="px-4 py-2 bg-indigo-600 text-white rounded">등록</button></div>
                </div>
            </div>
          )}
        </main>
      </div>

      {modalConfig.isOpen && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-sm text-center">
                <div className="mb-4 font-bold">{modalConfig.message}</div>
                <div className="flex gap-2 justify-center">
                    {modalConfig.type === 'confirm' && <button onClick={closeModal} className="px-4 py-2 border rounded">취소</button>}
                    <button onClick={handleConfirmAction} className="px-4 py-2 bg-indigo-600 text-white rounded">확인</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default InternalBoard;