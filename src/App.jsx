/* eslint-disable */
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
  onSnapshot, query, orderBy, writeBatch, increment, getDoc
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

// [수정] 파일 다운로드 헬퍼 함수
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

const InternalBoard = () => {
  // 1. 상태(State) 선언부
  
  const [viewMode, setViewMode] = useState('login');
  const [currentUser, setCurrentUser] = useState(null);
  const [loginId, setLoginId] = useState('');
  const [loginPw, setLoginPw] = useState('');
  const apiKey = ""; 

  // 게시글 데이터 (DB에서 불러옴)
  const [posts, setPosts] = useState([]);
  
  // 선택된 게시글 및 체크박스
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]); 
  
  // 페이지네이션
  const [activePage, setActivePage] = useState(1);
  const postsPerPage = 15;

  // 엑셀 라이브러리 로드 상태
  const [isXlsxLoaded, setIsXlsxLoaded] = useState(false);

  // 게시판 카테고리
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

  // 회원 데이터
  const [users, setUsers] = useState([
    { id: 1, name: '관리자', userId: 'admin', password: '0802', dept: '시스템 운영팀', position: '관리자' },
    { id: 2, name: '김철수', userId: 'kimcs', password: 'user1234', dept: '생산관리팀', position: '대리' },
    { id: 3, name: '이영희', userId: 'leeyh', password: 'user5678', dept: '영업팀', position: '사원' },
  ]);

  // UI 상태
  const [activeBoardId, setActiveBoardId] = useState(11);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState('board'); 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 입력 폼 상태
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newBoardInput, setNewBoardInput] = useState({ categoryId: '', name: '' });
  const [editingItem, setEditingItem] = useState(null);
  const [newUser, setNewUser] = useState({ name: '', userId: '', password: '', dept: '', position: '' });
  const [modalConfig, setModalConfig] = useState({ isOpen: false, type: '', message: '', onConfirm: null });

  // 검색 상태
  const [searchInput, setSearchInput] = useState(''); 
  const [searchQuery, setSearchQuery] = useState(''); 
  const [searchFilterBoardId, setSearchFilterBoardId] = useState('all'); 
  const [periodFilter, setPeriodFilter] = useState('all'); 

  // 글쓰기 폼 상태
  const [writeForm, setWriteForm] = useState({
    id: null, docId: null, 
    title: '', content: '', 
    titleColor: 'text-rose-600', 
    titleSize: 'text-[14pt]', 
    attachments: [] 
  });

  const [commentInput, setCommentInput] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFontSizePicker, setShowFontSizePicker] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Refs
  const fileInputRef = useRef(null);
  const importFileRef = useRef(null); 
  const excelInputRef = useRef(null); 
  const contentRef = useRef(null);
  const savedSelection = useRef(null);

  // 2. Effects & Helpers

  // 엑셀 라이브러리 자동 로딩 (CDN)
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
    if (typeof window !== 'undefined' && window.XLSX) return window.XLSX;
    return null;
  };

  // Firebase 데이터 실시간 불러오기
  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("id", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dbPosts = snapshot.docs.map(doc => ({
        ...doc.data(),
        docId: doc.id 
      }));
      setPosts(dbPosts);
      
      if (selectedPost) {
        const current = dbPosts.find(p => p.id === selectedPost.id);
        if (current) setSelectedPost(current);
      }
    });
    return () => unsubscribe();
  }, [selectedPost?.id]);

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

  const getTodayString = () => { const d = new Date(); return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`; };
  const formatDisplayDate = (full) => { if (!full) return ''; const [d, t] = full.split(' '); return d === getTodayString() ? t : d; };
  const stripHtml = (html) => { const tmp = document.createElement("DIV"); tmp.innerHTML = html; return tmp.textContent || tmp.innerText || ""; };
  const textToHtmlWithLineBreaks = (text) => { if (!text) return ''; if (typeof text !== 'string') return String(text); return text.replace(/\r\n/g, "<br/>").replace(/\n/g, "<br/>"); };
  const htmlToTextWithLineBreaks = (html) => { if (!html) return ""; let t = html.replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n").replace(/<\/div>/gi, "\n").replace(/<\/li>/gi, "\n"); const tmp = document.createElement("DIV"); tmp.innerHTML = t; return (tmp.textContent || tmp.innerText || "").trim(); };

  // --- 로그인/아웃 ---
  const handleLogin = (e) => { e.preventDefault(); const user = users.find(u => u.userId === loginId && u.password === loginPw); if (user) { setCurrentUser(user); setViewMode('list'); setLoginId(''); setLoginPw(''); } else showAlert("정보가 올바르지 않습니다."); };
  const handleLogout = () => showConfirm("로그아웃 하시겠습니까?", () => { setCurrentUser(null); setViewMode('login'); });

  // --- 글쓰기/수정 ---
  const handleWriteSubmit = async () => {
    if (!writeForm.title.trim()) { showAlert("제목을 입력해주세요."); return; }
    const today = new Date();
    const dateString = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')} ${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`;
    const postData = {
        title: writeForm.title, content: writeForm.content, 
        titleColor: writeForm.titleColor, titleSize: writeForm.titleSize,
        attachments: writeForm.attachments, boardId: activeBoardId, category: activeBoard.name,
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
    } catch (e) { console.error(e); showAlert("저장 실패: " + e.message); }
  };

  // --- 삭제/복구 ---
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

  // [수정] 삭제 메시지 변경 (공손한 표현)
  const handleDeleteSelected = () => {
      if (selectedIds.length === 0) return;
      const processBatch = async (actionType) => {
          const batch = writeBatch(db);
          const targets = posts.filter(p => selectedIds.includes(p.docId));
          targets.forEach(p => {
              const ref = doc(db, "posts", p.docId);
              if (actionType === 'del') batch.delete(ref);
              else if (actionType === 'soft') batch.update(ref, { isDeleted: true });
              else batch.update(ref, { isDeleted: false });
          });
          await batch.commit();
          setSelectedIds([]);
          showAlert("처리되었습니다.");
      };
      // [수정] 문구 변경
      if (activeBoardId === 'trash') showConfirm("선택한 게시글을 영구 삭제하시겠습니까?", () => processBatch('del'));
      else showConfirm("선택한 게시글을 휴지통으로 이동하시겠습니까?", () => processBatch('soft'));
  };

  const handleRestoreSelected = () => {
      if (selectedIds.length === 0) return;
      showConfirm("선택한 게시글을 복구하시겠습니까?", async () => {
          const batch = writeBatch(db);
          const targets = posts.filter(p => selectedIds.includes(p.docId));
          targets.forEach(p => batch.update(doc(db, "posts", p.docId), { isDeleted: false }));
          await batch.commit();
          setSelectedIds([]);
      });
  };

  const handleMoveContent = async (direction) => {
    if (activeBoardId === 'trash' || viewMode === 'search') { showAlert("이 목록에서는 이동 기능을 사용할 수 없습니다."); return; }
    if (selectedIds.length === 0) { showAlert("선택된 게시글이 없습니다."); return; }
    
    const currentList = [...filteredPosts];
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
        itemsToSwap.forEach(([itemA, itemB]) => {
            const refA = doc(db, "posts", itemA.docId);
            const refB = doc(db, "posts", itemB.docId);
            batch.update(refA, { id: itemB.id, isMoved: true });
            batch.update(refB, { id: itemA.id });
        });
        await batch.commit();
    }
  };

  const handlePostClick = async (post) => {
    if (post.docId) {
        const postRef = doc(db, "posts", post.docId);
        updateDoc(postRef, { views: increment(1) });
    }
    setSelectedPost(post);
    setViewMode('detail');
  };

  const handleToggleBookmark = async (post) => {
    try { await updateDoc(doc(db, "posts", post.docId), { isBookmarked: !post.isBookmarked }); } catch (e) { console.error(e); }
  };

  const handleAddComment = async () => {
    if (!commentInput.trim()) return;
    const newComment = { id: Date.now(), author: currentUser ? currentUser.name : '익명', content: commentInput, date: getTodayString() };
    const newComments = [...(selectedPost.comments || []), newComment];
    await updateDoc(doc(db, "posts", selectedPost.docId), { comments: newComments });
    setCommentInput('');
  };

  const handleDeleteComment = async (cid) => {
    if (!window.confirm("삭제하시겠습니까?")) return;
    const newComments = selectedPost.comments.filter(c => c.id !== cid);
    await updateDoc(doc(db, "posts", selectedPost.docId), { comments: newComments });
  };

  // --- 관리자 기능 ---
  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    const newCat = { id: `cat_${Date.now()}`, name: newCategoryName, isExpanded: true, boards: [] };
    setCategories([...categories, newCat]);
    setNewCategoryName('');
  };

  const handleDeleteCategory = (catId) => {
    const targetCat = categories.find(c => c.id === catId);
    if (!targetCat) return;
    if (targetCat.boards.length > 0) { showAlert("게시판이 포함된 카테고리는 삭제할 수 없습니다."); return; }
    if (categories.length <= 1) { showAlert("최소 하나의 카테고리는 존재해야 합니다."); return; }
    setCategories(categories.filter(c => c.id !== catId));
  };

  const handleAddBoardToCategory = () => {
    if (!newBoardInput.categoryId || !newBoardInput.name.trim()) { showAlert("카테고리를 선택하고 게시판 이름을 입력해주세요."); return; }
    setCategories(categories.map(cat => {
      if (cat.id === newBoardInput.categoryId) {
        return { ...cat, boards: [...cat.boards, { id: Date.now(), name: newBoardInput.name, type: 'normal', defaultContent: '' }] };
      }
      return cat;
    }));
    setNewBoardInput({ categoryId: '', name: '' });
  };

  const handleDeleteBoard = (boardId) => {
    const totalBoards = categories.reduce((acc, cat) => acc + cat.boards.length, 0);
    if (totalBoards <= 1) { showAlert("최소 하나의 게시판은 존재해야 합니다."); return; }
    setCategories(categories.map(cat => ({ ...cat, boards: cat.boards.filter(b => b.id !== boardId) })));
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
    if (editingItem.type === 'category') {
      setCategories(categories.map(cat => 
        cat.id === editingItem.id ? { ...cat, name: editingItem.name } : cat
      ));
    } else if (editingItem.type === 'board') {
      setCategories(categories.map(cat => ({
        ...cat,
        boards: cat.boards.map(b => 
          b.id === editingItem.id ? { ...b, name: editingItem.name, defaultContent: editingItem.defaultContent } : b
        )
      })));
    }
    setEditingItem(null);
  };

  const handleAddUser = () => {
    if (!newUser.name || !newUser.userId || !newUser.password) {
      showAlert("이름, 아이디, 비밀번호는 필수입니다.");
      return;
    }
    setUsers([...users, { id: Date.now(), ...newUser }]);
    setNewUser({ name: '', userId: '', password: '', dept: '', position: '' });
  };

  const handleDeleteUser = (userId) => {
    if (currentUser && currentUser.id === userId) {
      showAlert("현재 로그인된 계정은 삭제할 수 없습니다.");
      return;
    }
    showConfirm("정말 이 사용자를 삭제하시겠습니까?", () => {
      setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
    });
  };

  // --- 엑셀 및 데이터 처리 로직 수정 (DB 저장 포함) ---
  
  // [수정] DB에 일괄 저장하는 함수 (기존 데이터 삭제 후 추가)
  const saveImportedDataToDB = async (importedPosts) => {
    try {
        // 1. 기존 데이터 삭제를 위한 Batch 생성
        const deleteBatch = writeBatch(db);
        let deleteCount = 0;
        
        // 현재 posts(DB에서 불러온 전체 데이터)를 모두 삭제 대기열에 추가
        posts.forEach(post => {
            if (post.docId) { // docId가 있는 실제 DB 문서만
                const ref = doc(db, "posts", post.docId);
                deleteBatch.delete(ref);
                deleteCount++;
            }
        });
        
        // 삭제 실행 (최대 500개 제한 고려, 여기선 단순화)
        if (deleteCount > 0) {
            await deleteBatch.commit();
        }

        // 2. 새 데이터 추가를 위한 새 Batch 생성
        const addBatch = writeBatch(db);
        let addCount = 0;
        const limit = 450; // 안전하게 제한
        
        for (const post of importedPosts) {
            if (addCount >= limit) break;
            
            const newDocRef = doc(collection(db, "posts")); // 새 문서 ID 자동 생성
            // 엑셀에서 가져온 데이터 정리
            const { docId, ...postData } = post; 
            
            const dataToSave = {
                ...postData,
                // SystemID가 있으면 그걸 쓰고, 없으면 새로 생성 (정렬 보존)
                id: post.id || Date.now() + addCount, 
                date: post.date || getTodayString(),
                views: post.views || 0,
                type: post.type || 'normal',
                file: post.file || false,
                isMoved: false,
                isDeleted: false,
                isBookmarked: false,
                comments: []
            };
            
            addBatch.set(newDocRef, dataToSave);
            addCount++;
        }
        
        await addBatch.commit();
        showAlert(`기존 데이터를 삭제하고 ${addCount}건의 데이터를 새로 등록했습니다.`);
    } catch (e) {
        console.error(e);
        showAlert("데이터 처리 중 오류가 발생했습니다: " + e.message);
    }
  };

  const handleExportExcel = () => {
    const XLSX_LIB = getXLSX();
    if (!XLSX_LIB) { showAlert("엑셀 도구 로딩 중..."); return; }
    
    // [수정] 내보낼 때 '순번'을 계산해서 포함
    const activePosts = posts.filter(p => !p.isDeleted);
    const data = activePosts.map((p, idx) => ({
        '순번': activePosts.length - idx, 
        '분류': p.category, 
        '제목': p.title, 
        '작성자': p.author, 
        '등록일': p.date, 
        '조회수': p.views, 
        '내용': htmlToTextWithLineBreaks(p.content),
        'SystemID': p.id // 복원 시 정렬 유지용
    }));
    
    const ws = XLSX_LIB.utils.json_to_sheet(data);
    const wb = XLSX_LIB.utils.book_new();
    XLSX_LIB.utils.book_append_sheet(wb, ws, "게시글");
    XLSX_LIB.writeFile(wb, `LOUDERS_Board_Backup_${new Date().toLocaleDateString()}.xlsx`);
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
        
        const boardNameMap = {}; 
        categories.forEach(cat => cat.boards.forEach(board => boardNameMap[board.name] = board.id));
        
        const parsedPosts = jsonData.filter(row => row['제목']).map(row => ({
            id: row['SystemID'] || Date.now(), 
            category: row['분류'] || '기타', 
            boardId: boardNameMap[row['분류']] || 11,
            title: row['제목'], 
            author: row['작성자'] || '익명', 
            date: row['등록일'] || getTodayString(), 
            views: row['조회수'] || 0,
            content: row['내용'] ? textToHtmlWithLineBreaks(row['내용']) : '', 
            type: 'normal', file: false, attachments: [], 
            titleColor: 'text-slate-900', titleSize: 'text-[14pt]', 
            isMoved: false, isDeleted: false, isBookmarked: false, comments: []
        }));
        
        showConfirm(`주의: 기존 게시글을 모두 삭제하고\n엑셀 데이터 ${parsedPosts.length}건으로 교체하시겠습니까?`, () => { 
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
                showConfirm(`주의: 기존 게시글을 모두 삭제하고\n백업 파일의 ${importedData.length}건으로 교체하시겠습니까?`, () => { 
                    saveImportedDataToDB(importedData);
                }); 
            }
        } catch (error) { showAlert("파일 오류"); } 
    };
    reader.readAsText(file); e.target.value = ''; 
  };
  
  const handleExportJSON = () => { 
    const activePosts = posts.filter(post => !post.isDeleted); 
    const jsonContent = JSON.stringify(activePosts, null, 2); 
    downloadFile(jsonContent, `LOUDERS_Board_Backup_${new Date().toLocaleDateString()}.json`, 'application/json'); 
  };

  // UI 핸들러
  const handleGlobalSearch = () => { if(!searchInput.trim()) return; setSearchQuery(searchInput); setViewMode('search'); setSearchFilterBoardId('all'); setActivePage(1); };
  
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

  const getFilteredPosts = () => posts.filter(p => {
      if (activeBoardId === 'trash') return p.isDeleted;
      if (activeBoardId === 'bookmark') return p.isBookmarked && !p.isDeleted;
      if (activeBoardId && activeBoardId !== 'trash' && activeBoardId !== 'bookmark') return p.boardId === activeBoardId && !p.isDeleted;
      return !p.isDeleted;
  });

  const filteredPosts = viewMode === 'search' ? currentSearchResults : getFilteredPosts();
  
  const indexOfLastPost = activePage * postsPerPage; const indexOfFirstPost = indexOfLastPost - postsPerPage; 
  const currentPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost); 
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
  const pageGroupSize = 10; const startPage = (Math.ceil(activePage / pageGroupSize) - 1) * pageGroupSize + 1; const endPage = Math.min(startPage + pageGroupSize - 1, totalPages);

  const toggleCategory = (id) => setCategories(categories.map(c => c.id === id ? { ...c, isExpanded: !c.isExpanded } : c));
  const handleBackToList = () => { 
      if (viewMode === 'detail' && searchQuery) { setViewMode('search'); setSelectedPost(null); }
      else { setViewMode('list'); setSelectedPost(null); setSelectedIds([]); setWriteForm({ id: null, docId: null, title: '', content: '', titleColor: 'text-rose-600', titleSize: 'text-[14pt]', attachments: [] }); }
  };
  const handleGoToWrite = () => { let content = ''; const ab = getActiveBoard(); if(ab && ab.defaultContent) content = textToHtmlWithLineBreaks(ab.defaultContent); setWriteForm({ id: null, docId: null, title: '', content, titleColor: 'text-rose-600', titleSize: 'text-[14pt]', attachments: [] }); setViewMode('write'); };
  
  const handleEditPost = () => { 
    if(!selectedPost) return; 
    setWriteForm({ 
        id: selectedPost.id, docId: selectedPost.docId, 
        title: selectedPost.title, content: selectedPost.content, 
        titleColor: selectedPost.titleColor || 'text-slate-900', 
        titleSize: selectedPost.titleSize || 'text-[14pt]', 
        attachments: selectedPost.attachments || [] 
    }); 
    setViewMode('write'); 
  };
  const handleTempSave = () => { localStorage.setItem('internalBoard_temp', JSON.stringify(writeForm)); showAlert("임시 저장됨"); };
  
  const handleSelectAllCheckbox = (e) => setSelectedIds(e.target.checked ? filteredPosts.map(p => p.docId) : []);
  const toggleSelection = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  
  const handleFileChange = (e) => { if(e.target.files) setWriteForm(p => ({...p, attachments:[...p.attachments, ...Array.from(e.target.files).map(f=>({name:f.name, size:(f.size/1024).toFixed(1)+'KB'}))]})); };
  const removeAttachment = (i) => setWriteForm(p => ({...p, attachments: p.attachments.filter((_, idx) => idx !== i)}));
  
  const callGeminiAI = async (prompt) => { setIsAiLoading(true); try { const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({contents:[{parts:[{text:prompt}]}]}) }); const d = await r.json(); return d.candidates?.[0]?.content?.parts?.[0]?.text || null; } catch(e){ return null; } finally { setIsAiLoading(false); } };
  const handleAiRefine = async () => { 
    const txt = stripHtml(writeForm.content).trim();
    if(!txt && !writeForm.title) { showAlert("내용 입력 필요"); return; }
    const prompt = txt ? `다음 내용을 업무용으로 다듬어줘(HTML태그포함): "${txt}"` : `제목 "${writeForm.title}"에 맞는 공지사항 써줘`;
    const result = await callGeminiAI(prompt);
    if(result) {
        const cleaned = result.replace(/```html|```/g, "").trim();
        setWriteForm(p => ({...p, content: cleaned}));
        if(contentRef.current) contentRef.current.innerHTML = cleaned;
    }
  };

  const applyFormatBlock = (tag) => document.execCommand('formatBlock', false, tag);
  const applyFontSize = (size) => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (range.collapsed) return;
      const span = document.createElement("span");
      span.style.fontSize = size;
      try {
        const content = range.extractContents();
        span.appendChild(content);
        range.insertNode(span);
      } catch (e) { console.error(e); }
    }
  };

  const handleToolbarAction = (act, val, e) => { 
      e?.preventDefault(); 
      if (act === 'customFontSize') { applyFontSize(val); setShowFontSizePicker(false); }
      else if (act === 'formatBlock') applyFormatBlock(val);
      else document.execCommand(act, false, val); 
      
      if(contentRef.current) setWriteForm(p => ({...p, content: contentRef.current.innerHTML})); 
  };
  
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
        
        {/* 사이드바 스크롤바 숨김 클래스 적용 */}
        <div className="flex-1 overflow-y-auto py-6 px-3 custom-scrollbar [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
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
          <div className="flex-1 max-w-xl mx-auto relative group"><input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleGlobalSearch()} placeholder="제목 + 내용 검색" className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            {searchInput && (<button onClick={() => setSearchInput('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X size={14} /></button>)}
          </div>
          <div className="flex items-center gap-2"><button onClick={() => setIsSettingsOpen(true)} className="p-2 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 rounded-full"><Settings size={18} /></button></div>
        </header>

        <main className="flex-1 overflow-y-auto p-3 md:p-6">
          {(viewMode === 'list' || viewMode === 'search') && (
            <div className={`max-w-7xl mx-auto bg-white rounded-xl shadow-sm border overflow-hidden ${activeBoardId === 'trash' ? 'border-rose-200' : 'border-slate-200'}`}>
              <div className={`p-3 border-b flex flex-col gap-3 ${activeBoardId === 'trash' ? 'bg-rose-50 border-rose-100' : 'bg-white border-slate-100'}`}>
                <div className="flex flex-col xl:flex-row justify-between items-center gap-3">
                  <div className="flex items-center gap-2 w-full xl:w-auto">
                    {viewMode === 'search' ? (
                        <div className="flex flex-col gap-1 w-full">
                            <div className="flex items-center gap-2 text-indigo-700 font-bold">
                                <Search className="w-5 h-5" />
                                <span className="text-lg">'{searchQuery}' 검색 결과</span>
                                <span className="text-sm bg-indigo-100 px-2 py-0.5 rounded-full text-indigo-600">{searchResults.length}건</span>
                            </div>
                            {/* [복구] 게시판별 필터링 버튼 */}
                            {searchResults.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    <button 
                                        onClick={() => setSearchFilterBoardId('all')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${searchFilterBoardId === 'all' ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                                    >
                                        전체보기 ({searchResults.length}건)
                                    </button>
                                    {Object.entries(searchBoardStats).map(([boardId, count]) => {
                                        let boardName = '기타';
                                        let found = false;
                                        for (const cat of categories) {
                                            const b = cat.boards.find(b => b.id === parseInt(boardId));
                                            if (b) { boardName = b.name; found = true; break; }
                                        }
                                        if (!found && boardId === 'bookmark') boardName = '북마크';
                                        return (
                                            <button 
                                                key={boardId}
                                                onClick={() => setSearchFilterBoardId(boardId)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${String(searchFilterBoardId) === String(boardId) ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                                            >
                                                {boardName} ({count}건)
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className={`p-1.5 rounded-lg ${activeBoardId === 'trash' ? 'bg-rose-100' : 'bg-indigo-50'}`}>
                                {activeBoardId === 'trash' ? <Trash2 className="w-4 h-4 text-rose-600" /> : activeBoardId === 'bookmark' ? <Star className="w-4 h-4 text-yellow-600" /> : <FileText className="w-4 h-4 text-indigo-600" />}
                            </div>
                            <h1 className={`text-lg font-bold ${activeBoardId === 'trash' ? 'text-rose-900' : 'text-slate-900'} whitespace-nowrap`}>{activeBoard.name}</h1>
                        </>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                     {activeBoardId === 'trash' ? 
                     <>
                        <button onClick={handleRestoreSelected} className="flex items-center gap-1 bg-white border border-rose-200 text-green-600 hover:bg-green-50 px-3 py-1.5 rounded-md text-xs font-bold shadow-sm whitespace-nowrap"><RefreshCcw className="w-3.5 h-3.5" /> 복구</button>
                        <button onClick={handleDeleteSelected} className="flex items-center gap-1 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-md text-xs font-bold shadow-sm whitespace-nowrap"><Trash2 className="w-3.5 h-3.5" /> 영구삭제</button>
                     </> 
                     : viewMode === 'search' ? (
                        <button onClick={() => setViewMode('list')} className="flex items-center gap-1 bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 px-3 py-1.5 rounded-md text-xs font-bold shadow-sm whitespace-nowrap"><ArrowLeft className="w-3.5 h-3.5" /> 목록으로 돌아가기</button>
                     ) : (
                     <>
                        <button onClick={() => handleMoveContent('up')} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md" title="위로"><ArrowUp size={16} /></button>
                        <button onClick={() => handleMoveContent('down')} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md" title="아래로"><ArrowDown size={16} /></button>
                        <button onClick={handleDeleteSelected} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md" title="삭제"><Trash2 size={16} /></button>
                        <button onClick={handleGoToWrite} className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md text-xs font-bold shadow-sm"><PenSquare size={14} /> 글쓰기</button>
                     </>)}
                  </div>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] table-fixed">
                  <colgroup><col className="w-10"/><col className="w-16"/><col/><col className="w-12"/><col className="w-24"/><col className="w-32"/><col className="w-16"/></colgroup>
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase"><th className="py-2"><input type="checkbox" onChange={handleSelectAllCheckbox} checked={currentPosts.length > 0 && currentPosts.every(p => selectedIds.includes(p.docId))} /></th><th>번호</th><th>제목</th><th>첨부</th><th>작성자</th><th>등록일</th><th>조회</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentPosts.length > 0 ? currentPosts.map((post, idx) => (
                        <tr key={post.docId} onClick={() => handlePostClick(post)} className={`hover:bg-indigo-50/60 cursor-pointer text-sm ${selectedIds.includes(post.docId) ? 'bg-indigo-50' : ''}`}>
                            <td className="py-2 text-center" onClick={(e) => {e.stopPropagation(); toggleSelection(post.docId);}}><input type="checkbox" checked={selectedIds.includes(post.docId)} onChange={() => {}} className="cursor-pointer" /></td>
                            {/* [수정] 번호 표시: 전체 글 개수 - (현재 페이지 * 페이지당 개수) - 인덱스 */}
                            <td className="text-center text-slate-500">{filteredPosts.length - (activePage - 1) * postsPerPage - idx}</td>
                            <td className="py-2 px-3">
                                <div className="flex items-center gap-1.5">
                                    {/* [추가] 검색 모드이거나 휴지통일 때 게시판 이름 배지 표시 */}
                                    {(viewMode === 'search' || activeBoardId === 'trash') && (
                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200 whitespace-nowrap">
                                            {post.category}
                                        </span>
                                    )}
                                    {post.type === 'notice' && <span className="bg-rose-100 text-rose-600 text-[10px] px-1 rounded font-bold">공지</span>}
                                    <span className={`font-medium line-clamp-1 ${post.titleColor}`}>{post.title}</span>
                                    {post.isBookmarked && <Star size={12} className="text-yellow-500 fill-yellow-500" />}
                                </div>
                            </td>
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
               {/* 리스트 스타일 및 헤딩 적용 CSS */}
              <style>{`
                .wysiwyg-content ul { list-style-type: disc; padding-left: 20px; }
                .wysiwyg-content ol { list-style-type: decimal; padding-left: 20px; }
                .wysiwyg-content li { margin-bottom: 4px; }
                .wysiwyg-content p { margin-bottom: 1em; line-height: 1.7; }
                .wysiwyg-content h1 { font-size: 2em; font-weight: bold; margin-top: 0.5em; margin-bottom: 0.5em; }
                .wysiwyg-content h2 { font-size: 1.5em; font-weight: bold; margin-top: 0.5em; margin-bottom: 0.5em; }
              `}</style>
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
                <div className="flex items-center gap-3 w-full">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2 whitespace-nowrap">
                        <PenSquare className="w-6 h-6 text-indigo-600" />
                        {writeForm.id ? '게시글 수정' : '새 글 작성'}
                    </h3>
                    <button onClick={handleTempSave} className="ml-auto px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-xs font-bold flex items-center gap-1 transition-colors"><Save size={14}/> 임시저장</button>
                    <div className="h-6 w-px bg-slate-200 mx-2"></div>
                    <div className="flex-1 flex items-center bg-indigo-50/50 rounded-full px-3 py-1.5 border border-indigo-100/50">
                        <Sparkles className="w-4 h-4 text-indigo-600 mr-2" /><span className="text-xs font-bold text-indigo-700 mr-2">AI Assistant</span>
                        <button onClick={handleAiRefine} disabled={isAiLoading} className="text-xs text-slate-600 hover:text-indigo-700 underline decoration-indigo-200 hover:decoration-indigo-500 transition-all disabled:opacity-50">{isAiLoading ? "작성 중..." : "글 다듬기 / 초안 작성"}</button>
                    </div>
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
                    {/* 에디터 툴바 */}
                    <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center gap-1.5 flex-shrink-0 flex-wrap relative">
                        <div className="flex items-center gap-0.5 border-r border-slate-200 pr-1.5 mr-1.5">
                            <button onMouseDown={(e) => handleToolbarAction('formatBlock', 'H1', e)} className="p-1.5 hover:bg-white hover:text-indigo-600 rounded text-slate-600" title="제목 1"><Heading1 size={16} /></button>
                            <button onMouseDown={(e) => handleToolbarAction('formatBlock', 'H2', e)} className="p-1.5 hover:bg-white hover:text-indigo-600 rounded text-slate-600" title="제목 2"><Heading2 size={16} /></button>
                            <button onMouseDown={(e) => handleToolbarAction('formatBlock', 'P', e)} className="p-1.5 hover:bg-white hover:text-indigo-600 rounded text-slate-600 text-xs font-bold" title="본문">P</button>
                        </div>
                      <button onMouseDown={(e) => handleToolbarAction('bold', null, e)} className="p-1.5 hover:bg-white hover:text-indigo-600 rounded text-slate-600" title="굵게"><Bold size={16} /></button>
                      <button onMouseDown={(e) => handleToolbarAction('italic', null, e)} className="p-1.5 hover:bg-white hover:text-indigo-600 rounded text-slate-600" title="기울임"><Italic size={16} /></button>
                      <button onMouseDown={(e) => handleToolbarAction('underline', null, e)} className="p-1.5 hover:bg-white hover:text-indigo-600 rounded text-slate-600" title="밑줄"><Underline size={16} /></button>
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
                      {/* ... 기타 툴바 버튼 (생략 없이 유지) */}
                      <button onClick={() => fileInputRef.current?.click()} className="p-1.5 hover:bg-white hover:text-indigo-600 rounded text-slate-600 relative" title="파일 첨부"><Paperclip size={16} /><input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple /></button>
                    </div>
                    {/* 위지윅 에디터 영역 */}
                    <div
                      ref={contentRef}
                      contentEditable
                      suppressContentEditableWarning
                      className="wysiwyg-content w-full flex-1 px-6 py-5 border-none focus:ring-0 text-base leading-relaxed overflow-y-auto bg-white font-normal text-slate-700 outline-none list-disc list-inside"
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

          {/* ================= DETAIL VIEW (생략 없이 유지) ================= */}
          {viewMode === 'detail' && selectedPost && (
            <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
               {/* 리스트 스타일 적용을 위한 CSS */}
               <style>{`
                .wysiwyg-content ul { list-style-type: disc; padding-left: 20px; }
                .wysiwyg-content ol { list-style-type: decimal; padding-left: 20px; }
                .wysiwyg-content li { margin-bottom: 4px; }
                .wysiwyg-content p { margin-bottom: 1em; line-height: 1.7; }
                .wysiwyg-content h1 { font-size: 2em; font-weight: bold; margin-top: 0.5em; margin-bottom: 0.5em; }
                .wysiwyg-content h2 { font-size: 1.5em; font-weight: bold; margin-top: 0.5em; margin-bottom: 0.5em; }
                .wysiwyg-content h3 { font-size: 1.25em; font-weight: bold; margin-top: 0.5em; margin-bottom: 0.5em; }
              `}</style>
              
              {/* Top Navigation Bar */}
              <div className="p-4 px-6 border-b border-slate-200 flex justify-between items-center bg-white sticky top-0 z-10">
                <button onClick={handleBackToList} className="flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 font-bold text-sm transition-colors group"><ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> 목록으로 돌아가기</button>
                <div className="flex items-center gap-2">
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

              {/* Header Section (Title & Meta) - Distinguishable Background */}
              <div className="bg-slate-50 px-8 py-8 border-b border-slate-200">
                <div className="flex justify-between items-start gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-slate-400 text-xs font-mono bg-white px-2 py-1 rounded border border-slate-200">No. {selectedPost.id}</span>
                            <span className={`px-2.5 py-1 rounded-md text-xs font-bold border bg-white text-slate-600 border-slate-200`}>{selectedPost.category}</span>
                        </div>
                        {/* 상세 페이지에서는 선택한 제목 크기를 반영 */}
                        <h1 className={`font-extrabold leading-tight mb-6 ${selectedPost.titleColor || 'text-slate-900'} ${selectedPost.titleSize || 'text-2xl'} ${selectedPost.isDeleted ? 'line-through text-slate-400' : ''}`}>{selectedPost.title}</h1>
                    </div>
                    <button onClick={() => handleToggleBookmark(selectedPost)} className="p-2 hover:bg-white rounded-full transition-colors flex-shrink-0 mt-1">
                        <Star size={28} className={selectedPost.isBookmarked ? "fill-yellow-400 text-yellow-400" : "text-slate-300"} />
                    </button>
                </div>
                
                <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-slate-200 shadow-sm"><UserCircle size={16} className="text-indigo-500" /><span className="text-slate-700 font-bold">{selectedPost.author}</span></div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-slate-200 shadow-sm"><Calendar size={16} className="text-slate-400" /><span className="font-medium">{selectedPost.date}</span></div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-slate-200 shadow-sm"><Eye size={16} className="text-slate-400" /><span className="font-medium">{selectedPost.views} 읽음</span></div>
                </div>
              </div>

              {/* Content Section - White Background */}
              <div className="p-8 md:p-10 bg-white min-h-[500px]">
                {/* AI 요약 표시 영역 삭제됨, 본문 내용 상단 배치 */}
                <div className="wysiwyg-content text-slate-800 text-lg px-2" dangerouslySetInnerHTML={{ __html: selectedPost.content || "본문 내용이 없습니다." }} />
                
                {selectedPost.attachments && selectedPost.attachments.length > 0 && (
                  <div className="mt-16 bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
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
              </div>

              {/* 댓글 섹션 */}
              <div className="bg-slate-50 border-t border-slate-200 p-8">
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

          <div className="max-w-7xl mx-auto mt-6 text-right text-xs text-slate-400 font-medium">© 2026 LOUDERS Corp. All rights reserved.</div>
        </main>
      </div>
      
      {/* (설정 모달 및 알림 모달 코드는 기존과 동일하여 생략하지 않고 유지) */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2.5"><div className="p-2 bg-indigo-50 rounded-lg"><Settings className="w-5 h-5 text-indigo-600" /></div>게시판 관리 설정</h3>
                <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"><X size={24} /></button>
            </div>
            
            {/* 탭 버튼 */}
            <div className="flex border-b border-slate-200">
                <button onClick={() => setSettingsTab('board')} className={`flex-1 py-3 text-sm font-bold transition-colors ${settingsTab === 'board' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>게시판 관리</button>
                <button onClick={() => setSettingsTab('user')} className={`flex-1 py-3 text-sm font-bold transition-colors ${settingsTab === 'user' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>회원 관리</button>
                {/* 백업 탭 추가 */}
                <button onClick={() => setSettingsTab('backup')} className={`flex-1 py-3 text-sm font-bold transition-colors ${settingsTab === 'backup' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>데이터 관리</button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
              {settingsTab === 'board' ? (
                  /* 게시판 관리 UI (기존 동일) */
                  <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* ... 카테고리/게시판 추가 UI ... */}
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
                  {/* ... 트리 구조 관리 UI ... */}
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
                                        // [수정] 플레이스홀더 텍스트 변경
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
                  /* 회원 관리 UI */
                  <div className="space-y-6">
                      <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
                          <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2"><Users size={18} className="text-blue-500" />사용자 추가</h4>
                          <div className="grid grid-cols-2 gap-3">
                              <input type="text" placeholder="이름" className="px-3 py-2 border border-slate-200 rounded text-sm" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
                              <input type="text" placeholder="아이디" className="px-3 py-2 border border-slate-200 rounded text-sm" value={newUser.userId} onChange={e => setNewUser({...newUser, userId: e.target.value})} />
                              <input type="password" placeholder="비밀번호" className="px-3 py-2 border border-slate-200 rounded text-sm" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
                              <input type="text" placeholder="부서" className="px-3 py-2 border border-slate-200 rounded text-sm" value={newUser.dept} onChange={e => setNewUser({...newUser, dept: e.target.value})} />
                              <input type="text" placeholder="직급" className="px-3 py-2 border border-slate-200 rounded text-sm" value={newUser.position} onChange={e => setNewUser({...newUser, position: e.target.value})} />
                              <button onClick={handleAddUser} className="bg-blue-600 text-white rounded text-sm font-bold">추가</button>
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
                                      <tr key={user.id} className="hover:bg-slate-50">
                                          <td className="px-4 py-3 font-medium text-slate-700">{user.name}</td>
                                          <td className="px-4 py-3 text-slate-500">{user.userId}</td>
                                          <td className="px-4 py-3 text-slate-500">{user.dept} {user.position}</td>
                                          <td className="px-4 py-3 text-center">
                                              <button onClick={() => handleDeleteUser(user.id)} className="text-rose-500 hover:bg-rose-50 p-1.5 rounded"><Trash2 size={14} /></button>
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  </div>
              ) : (
                  /* 데이터 백업 UI (재구성됨) */
                  <div className="space-y-8">
                      <div className="flex items-center gap-3 mb-2">
                          <Database size={24} className="text-slate-700" />
                          <h4 className="text-lg font-bold text-slate-800">데이터 관리 센터</h4>
                      </div>

                      {/* 1. 데이터 백업 (내보내기) 섹션 */}
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
                                      <span className="text-xs text-slate-400 mt-1">(.xlsx) - 줄바꿈 유지</span>
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

                      {/* 2. 데이터 복원 (불러오기) 섹션 */}
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

      {/* 커스텀 모달 (동일) */}
      {modalConfig.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-100">
            <div className="p-8 text-center">
              <div className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-4 ${modalConfig.type === 'confirm' ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'}`}><AlertCircle size={28} /></div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">{modalConfig.type === 'confirm' ? '확인해 주세요' : '알림'}</h3>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">{modalConfig.message}</p>
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
};

export default InternalBoard;