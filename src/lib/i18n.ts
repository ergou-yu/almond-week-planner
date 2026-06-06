import type { AiSuggestion, EvaluationKey, TaskStatus, UserRole } from "@/types/planner";

export const languages = ["zh", "en", "ja", "ko"] as const;
export type Language = (typeof languages)[number];

export const languageLabels: Record<Language, string> = {
  zh: "中文",
  en: "English",
  ja: "日本語",
  ko: "한국어"
};

export const languageNames: Record<Language, string> = {
  zh: "Chinese",
  en: "English",
  ja: "Japanese",
  ko: "Korean"
};

type Primitive = string | number | boolean;

type TranslationTree = {
  appName: string;
  cloudReady: string;
  offlineMode: string;
  syncingSuffix: string;
  navDashboard: string;
  navNewPlan: string;
  navLogin: string;
  navAccount: string;
  language: string;
  heroKicker: string;
  heroTitleBefore: string;
  heroTitleEmphasis: string;
  heroTitleAfter: string;
  heroBody: string;
  enterDashboard: string;
  planRange: string;
  taskCount: string;
  markedCount: string;
  itemCount: string;
  dashboardTitle: string;
  dashboardHelp: string;
  create: string;
  duplicate: string;
  planTitle: string;
  currentRole: string;
  bigGoal: string;
  startDate: string;
  endDate: string;
  taskCards: string;
  taskCardsHelp: string;
  addTask: string;
  evaluationsTitle: string;
  evaluationsHelp: string;
  delete: string;
  taskTitle: string;
  taskDate: string;
  taskDetail: string;
  completionStatus: string;
  saveAndShare: string;
  syncNow: string;
  syncAfterLogin: string;
  createShareLink: string;
  exportPdf: string;
  exportHtml: string;
  shareHelpOnline: string;
  shareHelpOffline: string;
  shareToken: string;
  aiTitle: string;
  aiAnalyze: string;
  aiAnalyzing: string;
  suggestionStrengths: string;
  suggestionRisks: string;
  suggestionRevisions: string;
  suggestionNextSteps: string;
  login: string;
  register: string;
  emailOrUsername: string;
  email: string;
  username: string;
  displayName: string;
  password: string;
  loginAccount: string;
  registerAndEnter: string;
  wechatLogin: string;
  presetRole: string;
  signedIn: string;
  signOut: string;
  dockDashboard: string;
  dockNew: string;
  dockSave: string;
  dockShare: string;
  unset: string;
  noDate: string;
  noDetail: string;
  unnamedTask: string;
  unfilled: string;
  createdCopySuffix: string;
  notices: {
    initial: string;
    syncedCloud: string;
    syncFailed: string;
    loadedCloud: string;
    loadCloudFailed: string;
    planCreated: string;
    loginNeededToSync: string;
    loginNeededForShare: string;
    cloudMissingForShare: string;
    shareCreated: string;
    shareFailed: string;
    aiDone: string;
    aiFailed: string;
    pdfStarted: string;
    pdfFailed: string;
    htmlStarted: string;
    localRegister: string;
    localLogin: string;
    loginSuccess: string;
    registerSuccess: string;
    registerSubmitted: string;
    authFailed: string;
    signedOut: string;
    wechatTodo: string;
    requestFailed: string;
  };
  share: {
    loadingMessage: string;
    loadFailed: string;
    loadedMessage: string;
    syncFailed: string;
    synced: string;
    backHome: string;
    title: string;
    saving: string;
    loading: string;
    downloadPdf: string;
    downloadHtml: string;
    collaborationReviews: string;
  };
  export: {
    pdfTitleFallback: string;
    period: string;
    bigGoal: string;
    statusLegend: string;
    tasksAndStatus: string;
    date: string;
    evaluations: string;
    htmlGoal: string;
    offlineLoaded: string;
    syncingOnline: string;
    syncedOnline: string;
    syncOnlineFailed: string;
  };
};

const dictionaries: Record<Language, TranslationTree> = {
  zh: {
    appName: "杏花周计划",
    cloudReady: "云同步可用",
    offlineMode: "离线体验模式",
    syncingSuffix: " · 同步中",
    navDashboard: "仪表盘",
    navNewPlan: "新计划",
    navLogin: "登录",
    navAccount: "账号",
    language: "语言",
    heroKicker: "梵高杏花灵感 · 可协作周计划",
    heroTitleBefore: "把这一周拆成",
    heroTitleEmphasis: "可以完成",
    heroTitleAfter: "的小计划",
    heroBody: "写大目标、拆小任务、标记高质完成/基本完成/停止/推迟，导出互动 PDF，也能用分享链接让家长或老师协作评价。",
    enterDashboard: "进入仪表盘",
    planRange: "计划周期",
    taskCount: "小计划",
    markedCount: "已标记",
    itemCount: "{count} 项",
    dashboardTitle: "仪表盘",
    dashboardHelp: "选择一个计划继续编辑，或复制当前计划作为新的一周。",
    create: "新建",
    duplicate: "复制",
    planTitle: "计划标题",
    currentRole: "当前角色",
    bigGoal: "这一周的大计划",
    startDate: "开始时间",
    endDate: "结束时间",
    taskCards: "小计划卡片",
    taskCardsHelp: "每个任务都可以单独标记完成状态。",
    addTask: "添加小计划",
    evaluationsTitle: "评价区",
    evaluationsHelp: "这些内容会进入 PDF，也会在分享链接里保留。",
    delete: "删除",
    taskTitle: "任务名称",
    taskDate: "任务日期",
    taskDetail: "任务说明",
    completionStatus: "完成状态",
    saveAndShare: "保存与分享",
    syncNow: "立即同步",
    syncAfterLogin: "登录后同步",
    createShareLink: "生成在线协作链接",
    exportPdf: "导出互动 PDF",
    exportHtml: "导出独立 HTML",
    shareHelpOnline: "在线链接需要登录后生成；协作者可改状态和评价，不会改动任务内容。",
    shareHelpOffline: "当前未配置 Supabase，不能生成在线链接；可用独立 HTML 文件分享离线版本。",
    shareToken: "分享 token：{token}",
    aiTitle: "AI 合理性建议",
    aiAnalyze: "让 AI 看看是否合理",
    aiAnalyzing: "分析中",
    suggestionStrengths: "优点",
    suggestionRisks: "风险",
    suggestionRevisions: "修改建议",
    suggestionNextSteps: "下一步",
    login: "登录",
    register: "注册新账号",
    emailOrUsername: "邮箱或用户名",
    email: "邮箱",
    username: "用户名",
    displayName: "显示名称",
    password: "密码",
    loginAccount: "登录账号",
    registerAndEnter: "注册并进入",
    wechatLogin: "微信登录（待配置）",
    presetRole: "预设角色",
    signedIn: "账号已登录",
    signOut: "退出登录",
    dockDashboard: "仪表盘",
    dockNew: "新建",
    dockSave: "保存",
    dockShare: "分享",
    unset: "未设置",
    noDate: "未指定日期",
    noDetail: "没有补充说明",
    unnamedTask: "未命名任务",
    unfilled: "未填写",
    createdCopySuffix: "副本",
    notices: {
      initial: "可以先用预设角色离线创建计划；配置 Supabase 后可注册账号、跨设备同步和分享协作。",
      syncedCloud: "已同步到云端账号。",
      syncFailed: "云同步失败。",
      loadedCloud: "已读取你的云端周计划。",
      loadCloudFailed: "读取云端计划失败。",
      planCreated: "新的周计划已经创建。",
      loginNeededToSync: "还没有登录。当前计划已保存在本机，可以先注册或登录后再同步。",
      loginNeededForShare: "在线链接分享需要先登录真实账号并同步计划。登录后再点这里，会生成可协作的 /share 链接。",
      cloudMissingForShare: "当前没有配置 Supabase 云端，所以不能生成在线协作链接。你可以先导出独立 HTML 文件分享。",
      shareCreated: "分享链接已生成并尝试复制：{url}",
      shareFailed: "生成分享链接失败。",
      aiDone: "AI 已给出计划建议。",
      aiFailed: "AI 建议生成失败。",
      pdfStarted: "PDF 已开始下载，里面包含可勾选状态和评价输入区。",
      pdfFailed: "PDF 导出失败。",
      htmlStarted: "独立 HTML 文件已开始下载。",
      localRegister: "已用本地账号进入。当前计划会保存在这个浏览器里；配置 Supabase 后可开启云同步。",
      localLogin: "已用本地模式进入。当前计划会保存在这个浏览器里。",
      loginSuccess: "登录成功，正在读取云端计划。",
      registerSuccess: "注册成功，已经登录。",
      registerSubmitted: "注册已提交。当前项目可能开启了邮箱确认，我先让你进入本地模式继续使用。",
      authFailed: "账号操作失败。",
      signedOut: "已退出登录，本地计划仍会保留。",
      wechatTodo: "微信登录入口已保留。接入真实微信 OAuth 需要 AppID、Secret 和回调域名。",
      requestFailed: "请求失败"
    },
    share: {
      loadingMessage: "正在读取分享计划...",
      loadFailed: "分享链接读取失败。",
      loadedMessage: "分享计划已加载。你可以修改任务状态和评价，刷新后也会保留。",
      syncFailed: "同步失败。",
      synced: "已同步到分享计划。",
      backHome: "返回首页",
      title: "协作分享链接",
      saving: "同步中",
      loading: "正在加载",
      downloadPdf: "下载 PDF",
      downloadHtml: "下载 HTML",
      collaborationReviews: "协作评价"
    },
    export: {
      pdfTitleFallback: "我的周计划",
      period: "计划周期：{start} 至 {end}",
      bigGoal: "大计划：{goal}",
      statusLegend: "状态说明",
      tasksAndStatus: "小计划与完成状态",
      date: "日期：{date}",
      evaluations: "评价区",
      htmlGoal: "大计划",
      offlineLoaded: "离线文件已加载。修改会保存在这个浏览器里；如果包含在线分享 token，也会尝试同步。",
      syncingOnline: "正在同步在线状态...",
      syncedOnline: "已同步到在线分享链接。",
      syncOnlineFailed: "在线同步失败，但本地文件状态已保存。"
    }
  },
  en: {
    appName: "Almond Weekly Planner",
    cloudReady: "Cloud sync ready",
    offlineMode: "Offline demo mode",
    syncingSuffix: " · Syncing",
    navDashboard: "Dashboard",
    navNewPlan: "New Plan",
    navLogin: "Log In",
    navAccount: "Account",
    language: "Language",
    heroKicker: "Van Gogh almond blossom inspired · Collaborative weekly planner",
    heroTitleBefore: "Turn this week into",
    heroTitleEmphasis: "doable",
    heroTitleAfter: "small plans",
    heroBody: "Write one big goal, break it into tasks, mark excellent/basic/stopped/postponed, export an interactive PDF, and invite parents or teachers to review by link.",
    enterDashboard: "Open Dashboard",
    planRange: "Plan Dates",
    taskCount: "Tasks",
    markedCount: "Marked",
    itemCount: "{count} items",
    dashboardTitle: "Dashboard",
    dashboardHelp: "Pick a plan to keep editing, or duplicate the current one for a new week.",
    create: "Create",
    duplicate: "Duplicate",
    planTitle: "Plan Title",
    currentRole: "Current Role",
    bigGoal: "Big Goal This Week",
    startDate: "Start Date",
    endDate: "End Date",
    taskCards: "Task Cards",
    taskCardsHelp: "Each task can have its own completion status.",
    addTask: "Add Task",
    evaluationsTitle: "Review Area",
    evaluationsHelp: "These notes are included in the PDF and preserved in shared links.",
    delete: "Delete",
    taskTitle: "Task Name",
    taskDate: "Task Date",
    taskDetail: "Task Notes",
    completionStatus: "Completion Status",
    saveAndShare: "Save & Share",
    syncNow: "Sync Now",
    syncAfterLogin: "Log In to Sync",
    createShareLink: "Create Collaboration Link",
    exportPdf: "Export Interactive PDF",
    exportHtml: "Export Standalone HTML",
    shareHelpOnline: "Create a link after logging in; collaborators can update status and reviews without editing task content.",
    shareHelpOffline: "Supabase is not configured, so online links are unavailable. You can export a standalone HTML file instead.",
    shareToken: "Share token: {token}",
    aiTitle: "AI Reasonableness Check",
    aiAnalyze: "Ask AI to Review",
    aiAnalyzing: "Analyzing",
    suggestionStrengths: "Strengths",
    suggestionRisks: "Risks",
    suggestionRevisions: "Revision Ideas",
    suggestionNextSteps: "Next Steps",
    login: "Log In",
    register: "Create Account",
    emailOrUsername: "Email or Username",
    email: "Email",
    username: "Username",
    displayName: "Display Name",
    password: "Password",
    loginAccount: "Log In",
    registerAndEnter: "Create & Enter",
    wechatLogin: "WeChat Login (not configured)",
    presetRole: "Preset Role",
    signedIn: "Signed In",
    signOut: "Sign Out",
    dockDashboard: "Dashboard",
    dockNew: "New",
    dockSave: "Save",
    dockShare: "Share",
    unset: "Not set",
    noDate: "No date",
    noDetail: "No extra notes",
    unnamedTask: "Untitled task",
    unfilled: "Not filled",
    createdCopySuffix: "copy",
    notices: {
      initial: "You can start offline with a preset role; with Supabase, accounts, cross-device sync, and sharing are enabled.",
      syncedCloud: "Synced to your cloud account.",
      syncFailed: "Cloud sync failed.",
      loadedCloud: "Loaded your cloud weekly plans.",
      loadCloudFailed: "Failed to load cloud plans.",
      planCreated: "A new weekly plan has been created.",
      loginNeededToSync: "You are not logged in. This plan is saved locally; sign up or log in to sync it.",
      loginNeededForShare: "Online sharing requires logging in and syncing the plan first. Then this button creates a collaborative /share link.",
      cloudMissingForShare: "Supabase is not configured, so online collaboration links are unavailable. Export standalone HTML instead.",
      shareCreated: "Share link created and copy attempted: {url}",
      shareFailed: "Failed to create share link.",
      aiDone: "AI returned suggestions.",
      aiFailed: "AI suggestion failed.",
      pdfStarted: "PDF download started, with clickable status boxes and review fields.",
      pdfFailed: "PDF export failed.",
      htmlStarted: "Standalone HTML download started.",
      localRegister: "Entered with a local account. This plan is saved in this browser; Supabase enables cloud sync later.",
      localLogin: "Entered local mode. This plan is saved in this browser.",
      loginSuccess: "Logged in. Loading cloud plans.",
      registerSuccess: "Account created and signed in.",
      registerSubmitted: "Signup submitted. Email confirmation may be enabled, so local mode is available for now.",
      authFailed: "Account action failed.",
      signedOut: "Signed out. Local plans are still kept.",
      wechatTodo: "WeChat login is reserved. Real OAuth needs AppID, Secret, and a callback domain.",
      requestFailed: "Request failed"
    },
    share: {
      loadingMessage: "Loading shared plan...",
      loadFailed: "Failed to load shared link.",
      loadedMessage: "Shared plan loaded. You can update task status and reviews; changes persist after refresh.",
      syncFailed: "Sync failed.",
      synced: "Synced to shared plan.",
      backHome: "Back Home",
      title: "Collaboration Link",
      saving: "Syncing",
      loading: "Loading",
      downloadPdf: "Download PDF",
      downloadHtml: "Download HTML",
      collaborationReviews: "Collaborative Reviews"
    },
    export: {
      pdfTitleFallback: "My Weekly Plan",
      period: "Plan period: {start} to {end}",
      bigGoal: "Big goal: {goal}",
      statusLegend: "Status Legend",
      tasksAndStatus: "Tasks & Completion Status",
      date: "Date: {date}",
      evaluations: "Reviews",
      htmlGoal: "Big Goal",
      offlineLoaded: "Offline file loaded. Changes are saved in this browser; if an online share token exists, syncing will be attempted.",
      syncingOnline: "Syncing online status...",
      syncedOnline: "Synced to online shared link.",
      syncOnlineFailed: "Online sync failed, but local file state was saved."
    }
  },
  ja: {
    appName: "杏の花 週間プラン",
    cloudReady: "クラウド同期可",
    offlineMode: "オフライン体験",
    syncingSuffix: " · 同期中",
    navDashboard: "ダッシュボード",
    navNewPlan: "新規プラン",
    navLogin: "ログイン",
    navAccount: "アカウント",
    language: "言語",
    heroKicker: "ゴッホの杏の花に着想 · 共同編集できる週間プラン",
    heroTitleBefore: "今週を",
    heroTitleEmphasis: "実行できる",
    heroTitleAfter: "小さな計画へ",
    heroBody: "大きな目標を書き、小さなタスクに分け、上質完了/基本完了/停止/延期を記録。インタラクティブ PDF と共有リンクで保護者や先生の評価も受け取れます。",
    enterDashboard: "ダッシュボードへ",
    planRange: "期間",
    taskCount: "小計画",
    markedCount: "記録済み",
    itemCount: "{count} 件",
    dashboardTitle: "ダッシュボード",
    dashboardHelp: "プランを選んで編集を続けるか、今のプランを複製して新しい週を作ります。",
    create: "新規",
    duplicate: "複製",
    planTitle: "プラン名",
    currentRole: "現在の役割",
    bigGoal: "今週の大きな目標",
    startDate: "開始日",
    endDate: "終了日",
    taskCards: "小計画カード",
    taskCardsHelp: "各タスクに個別の完了状態を付けられます。",
    addTask: "小計画を追加",
    evaluationsTitle: "評価欄",
    evaluationsHelp: "この内容は PDF と共有リンクに保存されます。",
    delete: "削除",
    taskTitle: "タスク名",
    taskDate: "日付",
    taskDetail: "説明",
    completionStatus: "完了状態",
    saveAndShare: "保存と共有",
    syncNow: "今すぐ同期",
    syncAfterLogin: "ログインして同期",
    createShareLink: "共同編集リンクを作成",
    exportPdf: "インタラクティブ PDF 出力",
    exportHtml: "単体 HTML 出力",
    shareHelpOnline: "リンクはログイン後に作成できます。共同編集者は状態と評価だけを変更でき、タスク本文は変更できません。",
    shareHelpOffline: "Supabase が未設定のためオンラインリンクは使えません。単体 HTML を共有できます。",
    shareToken: "共有 token：{token}",
    aiTitle: "AI 妥当性チェック",
    aiAnalyze: "AI に確認してもらう",
    aiAnalyzing: "分析中",
    suggestionStrengths: "良い点",
    suggestionRisks: "リスク",
    suggestionRevisions: "改善案",
    suggestionNextSteps: "次の一歩",
    login: "ログイン",
    register: "新規登録",
    emailOrUsername: "メールまたはユーザー名",
    email: "メール",
    username: "ユーザー名",
    displayName: "表示名",
    password: "パスワード",
    loginAccount: "ログイン",
    registerAndEnter: "登録して入る",
    wechatLogin: "WeChat ログイン（未設定）",
    presetRole: "役割プリセット",
    signedIn: "ログイン中",
    signOut: "ログアウト",
    dockDashboard: "画面",
    dockNew: "新規",
    dockSave: "保存",
    dockShare: "共有",
    unset: "未設定",
    noDate: "日付なし",
    noDetail: "補足なし",
    unnamedTask: "無題のタスク",
    unfilled: "未入力",
    createdCopySuffix: "コピー",
    notices: {
      initial: "まずは役割プリセットでオフライン作成できます。Supabase 設定後は登録、端末間同期、共有が使えます。",
      syncedCloud: "クラウドアカウントに同期しました。",
      syncFailed: "クラウド同期に失敗しました。",
      loadedCloud: "クラウドの週間プランを読み込みました。",
      loadCloudFailed: "クラウドプランの読み込みに失敗しました。",
      planCreated: "新しい週間プランを作成しました。",
      loginNeededToSync: "まだログインしていません。プランは端末に保存済みです。登録またはログイン後に同期できます。",
      loginNeededForShare: "オンライン共有にはログインと同期が必要です。その後、共同編集用の /share リンクを作成できます。",
      cloudMissingForShare: "Supabase が未設定のためオンライン共有リンクは作成できません。単体 HTML を出力できます。",
      shareCreated: "共有リンクを作成し、コピーを試みました：{url}",
      shareFailed: "共有リンクの作成に失敗しました。",
      aiDone: "AI が提案を返しました。",
      aiFailed: "AI 提案の生成に失敗しました。",
      pdfStarted: "PDF のダウンロードを開始しました。状態チェックと評価入力欄を含みます。",
      pdfFailed: "PDF 出力に失敗しました。",
      htmlStarted: "単体 HTML のダウンロードを開始しました。",
      localRegister: "ローカルアカウントで入りました。このブラウザに保存されます。Supabase 設定後にクラウド同期できます。",
      localLogin: "ローカルモードで入りました。このブラウザに保存されます。",
      loginSuccess: "ログインしました。クラウドプランを読み込みます。",
      registerSuccess: "登録成功、ログイン済みです。",
      registerSubmitted: "登録を送信しました。メール確認が有効な場合があるため、先にローカルモードで使えます。",
      authFailed: "アカウント操作に失敗しました。",
      signedOut: "ログアウトしました。ローカルプランは保持されます。",
      wechatTodo: "WeChat ログイン入口は予約済みです。実装には AppID、Secret、コールバックドメインが必要です。",
      requestFailed: "リクエストに失敗しました"
    },
    share: {
      loadingMessage: "共有プランを読み込み中...",
      loadFailed: "共有リンクの読み込みに失敗しました。",
      loadedMessage: "共有プランを読み込みました。状態と評価を変更でき、更新後も保持されます。",
      syncFailed: "同期に失敗しました。",
      synced: "共有プランに同期しました。",
      backHome: "ホームへ戻る",
      title: "共同編集リンク",
      saving: "同期中",
      loading: "読み込み中",
      downloadPdf: "PDF をダウンロード",
      downloadHtml: "HTML をダウンロード",
      collaborationReviews: "共同評価"
    },
    export: {
      pdfTitleFallback: "私の週間プラン",
      period: "期間：{start} から {end}",
      bigGoal: "大きな目標：{goal}",
      statusLegend: "状態説明",
      tasksAndStatus: "小計画と完了状態",
      date: "日付：{date}",
      evaluations: "評価欄",
      htmlGoal: "大きな目標",
      offlineLoaded: "オフラインファイルを読み込みました。変更はこのブラウザに保存され、共有 token があればオンライン同期も試みます。",
      syncingOnline: "オンライン状態を同期中...",
      syncedOnline: "オンライン共有リンクに同期しました。",
      syncOnlineFailed: "オンライン同期に失敗しましたが、ローカル状態は保存されました。"
    }
  },
  ko: {
    appName: "아몬드꽃 주간 계획",
    cloudReady: "클라우드 동기화 가능",
    offlineMode: "오프라인 체험 모드",
    syncingSuffix: " · 동기화 중",
    navDashboard: "대시보드",
    navNewPlan: "새 계획",
    navLogin: "로그인",
    navAccount: "계정",
    language: "언어",
    heroKicker: "반 고흐 아몬드꽃 영감 · 협업 주간 계획",
    heroTitleBefore: "이번 주를",
    heroTitleEmphasis: "실행 가능한",
    heroTitleAfter: "작은 계획으로",
    heroBody: "큰 목표를 쓰고 작은 과제로 나누며, 고품질 완료/기본 완료/중지/연기를 표시하세요. 인터랙티브 PDF로 내보내고 링크로 부모님이나 선생님의 평가를 받을 수 있습니다.",
    enterDashboard: "대시보드 열기",
    planRange: "계획 기간",
    taskCount: "작은 계획",
    markedCount: "표시됨",
    itemCount: "{count}개",
    dashboardTitle: "대시보드",
    dashboardHelp: "계획을 선택해 계속 편집하거나 현재 계획을 복제해 새 주를 시작하세요.",
    create: "새로 만들기",
    duplicate: "복제",
    planTitle: "계획 제목",
    currentRole: "현재 역할",
    bigGoal: "이번 주 큰 계획",
    startDate: "시작일",
    endDate: "종료일",
    taskCards: "작은 계획 카드",
    taskCardsHelp: "각 과제마다 완료 상태를 따로 표시할 수 있습니다.",
    addTask: "작은 계획 추가",
    evaluationsTitle: "평가 영역",
    evaluationsHelp: "이 내용은 PDF와 공유 링크에 함께 저장됩니다.",
    delete: "삭제",
    taskTitle: "과제 이름",
    taskDate: "과제 날짜",
    taskDetail: "과제 설명",
    completionStatus: "완료 상태",
    saveAndShare: "저장 및 공유",
    syncNow: "지금 동기화",
    syncAfterLogin: "로그인 후 동기화",
    createShareLink: "협업 링크 만들기",
    exportPdf: "인터랙티브 PDF 내보내기",
    exportHtml: "단일 HTML 내보내기",
    shareHelpOnline: "온라인 링크는 로그인 후 생성됩니다. 협업자는 상태와 평가만 수정할 수 있고 과제 내용은 바꾸지 못합니다.",
    shareHelpOffline: "Supabase가 설정되지 않아 온라인 링크를 만들 수 없습니다. 단일 HTML 파일로 공유할 수 있습니다.",
    shareToken: "공유 token: {token}",
    aiTitle: "AI 합리성 제안",
    aiAnalyze: "AI에게 검토 요청",
    aiAnalyzing: "분석 중",
    suggestionStrengths: "장점",
    suggestionRisks: "위험",
    suggestionRevisions: "수정 제안",
    suggestionNextSteps: "다음 단계",
    login: "로그인",
    register: "새 계정 만들기",
    emailOrUsername: "이메일 또는 사용자 이름",
    email: "이메일",
    username: "사용자 이름",
    displayName: "표시 이름",
    password: "비밀번호",
    loginAccount: "로그인",
    registerAndEnter: "가입하고 들어가기",
    wechatLogin: "WeChat 로그인(미설정)",
    presetRole: "기본 역할",
    signedIn: "로그인됨",
    signOut: "로그아웃",
    dockDashboard: "보드",
    dockNew: "새로",
    dockSave: "저장",
    dockShare: "공유",
    unset: "미설정",
    noDate: "날짜 없음",
    noDetail: "추가 설명 없음",
    unnamedTask: "이름 없는 과제",
    unfilled: "미입력",
    createdCopySuffix: "복사본",
    notices: {
      initial: "기본 역할로 먼저 오프라인 계획을 만들 수 있습니다. Supabase 설정 후 계정, 기기 간 동기화, 공유가 가능합니다.",
      syncedCloud: "클라우드 계정에 동기화했습니다.",
      syncFailed: "클라우드 동기화에 실패했습니다.",
      loadedCloud: "클라우드 주간 계획을 불러왔습니다.",
      loadCloudFailed: "클라우드 계획을 불러오지 못했습니다.",
      planCreated: "새 주간 계획을 만들었습니다.",
      loginNeededToSync: "아직 로그인하지 않았습니다. 현재 계획은 이 기기에 저장되어 있으며, 가입 또는 로그인 후 동기화할 수 있습니다.",
      loginNeededForShare: "온라인 공유는 먼저 로그인하고 계획을 동기화해야 합니다. 이후 협업용 /share 링크를 만들 수 있습니다.",
      cloudMissingForShare: "Supabase가 설정되지 않아 온라인 협업 링크를 만들 수 없습니다. 단일 HTML 파일을 내보낼 수 있습니다.",
      shareCreated: "공유 링크를 만들고 복사를 시도했습니다: {url}",
      shareFailed: "공유 링크 만들기에 실패했습니다.",
      aiDone: "AI가 제안을 반환했습니다.",
      aiFailed: "AI 제안 생성에 실패했습니다.",
      pdfStarted: "PDF 다운로드를 시작했습니다. 상태 체크와 평가 입력 영역이 포함됩니다.",
      pdfFailed: "PDF 내보내기에 실패했습니다.",
      htmlStarted: "단일 HTML 다운로드를 시작했습니다.",
      localRegister: "로컬 계정으로 들어왔습니다. 이 브라우저에 저장되며 Supabase 설정 후 클라우드 동기화가 가능합니다.",
      localLogin: "로컬 모드로 들어왔습니다. 이 브라우저에 저장됩니다.",
      loginSuccess: "로그인 성공. 클라우드 계획을 불러옵니다.",
      registerSuccess: "가입 성공, 로그인되었습니다.",
      registerSubmitted: "가입 요청을 보냈습니다. 이메일 확인이 켜져 있을 수 있어 우선 로컬 모드로 사용할 수 있습니다.",
      authFailed: "계정 작업에 실패했습니다.",
      signedOut: "로그아웃했습니다. 로컬 계획은 그대로 유지됩니다.",
      wechatTodo: "WeChat 로그인入口은 남겨두었습니다. 실제 OAuth에는 AppID, Secret, 콜백 도메인이 필요합니다.",
      requestFailed: "요청 실패"
    },
    share: {
      loadingMessage: "공유 계획을 불러오는 중...",
      loadFailed: "공유 링크를 불러오지 못했습니다.",
      loadedMessage: "공유 계획을 불러왔습니다. 과제 상태와 평가를 수정할 수 있고 새로고침 후에도 유지됩니다.",
      syncFailed: "동기화 실패.",
      synced: "공유 계획에 동기화했습니다.",
      backHome: "홈으로",
      title: "협업 공유 링크",
      saving: "동기화 중",
      loading: "불러오는 중",
      downloadPdf: "PDF 다운로드",
      downloadHtml: "HTML 다운로드",
      collaborationReviews: "협업 평가"
    },
    export: {
      pdfTitleFallback: "내 주간 계획",
      period: "계획 기간: {start} ~ {end}",
      bigGoal: "큰 계획: {goal}",
      statusLegend: "상태 설명",
      tasksAndStatus: "작은 계획과 완료 상태",
      date: "날짜: {date}",
      evaluations: "평가 영역",
      htmlGoal: "큰 계획",
      offlineLoaded: "오프라인 파일을 불러왔습니다. 변경 사항은 이 브라우저에 저장되며 온라인 공유 token이 있으면 동기화를 시도합니다.",
      syncingOnline: "온라인 상태 동기화 중...",
      syncedOnline: "온라인 공유 링크에 동기화했습니다.",
      syncOnlineFailed: "온라인 동기화에 실패했지만 로컬 파일 상태는 저장되었습니다."
    }
  }
};

export const normalizeLanguage = (value?: string | null): Language => {
  if (value && (languages as readonly string[]).includes(value)) {
    return value as Language;
  }
  return "zh";
};

export const getBrowserLanguage = (): Language => {
  if (typeof window === "undefined") {
    return "zh";
  }

  const stored = window.localStorage.getItem("almond-language");
  if (stored) {
    return normalizeLanguage(stored);
  }

  const navigatorLanguage = window.navigator.language.toLowerCase();
  if (navigatorLanguage.startsWith("ja")) return "ja";
  if (navigatorLanguage.startsWith("ko")) return "ko";
  if (navigatorLanguage.startsWith("en")) return "en";
  return "zh";
};

const interpolate = (text: string, vars?: Record<string, Primitive>) => {
  if (!vars) {
    return text;
  }
  return Object.entries(vars).reduce((current, [key, value]) => current.replaceAll(`{${key}}`, String(value)), text);
};

export const t = (language: Language, key: string, vars?: Record<string, Primitive>): string => {
  const parts = key.split(".");
  let value: unknown = dictionaries[language];

  for (const part of parts) {
    value = (value as Record<string, unknown>)?.[part];
  }

  if (typeof value !== "string") {
    value = parts.reduce<unknown>((current, part) => (current as Record<string, unknown>)?.[part], dictionaries.zh);
  }

  return typeof value === "string" ? interpolate(value, vars) : key;
};

export const getStatusMeta = (language: Language): Record<
  TaskStatus,
  {
    label: string;
    description: string;
    color: string;
    bg: string;
    border: string;
  }
> => {
  const labels: Record<Language, Record<TaskStatus, { label: string; description: string }>> = {
    zh: {
      pending: { label: "未标记", description: "尚未选择完成状态" },
      excellent: { label: "高质完成", description: "按计划完成，并且质量高于预期" },
      basic: { label: "基本完成", description: "完成主要内容，但仍有可改进部分" },
      stopped: { label: "停止", description: "任务中止或暂时不再推进" },
      postponed: { label: "推迟", description: "延后执行，需要重新安排时间" }
    },
    en: {
      pending: { label: "Unmarked", description: "No completion status selected yet" },
      excellent: { label: "Excellent", description: "Completed as planned with quality above expectations" },
      basic: { label: "Basic", description: "Main work completed, with room to improve" },
      stopped: { label: "Stopped", description: "Task stopped or no longer moving forward" },
      postponed: { label: "Postponed", description: "Delayed and needs a new time" }
    },
    ja: {
      pending: { label: "未記録", description: "完了状態はまだ選択されていません" },
      excellent: { label: "上質完了", description: "計画通り、期待以上の品質で完了" },
      basic: { label: "基本完了", description: "主な内容は完了、改善余地あり" },
      stopped: { label: "停止", description: "タスクを中止、または一時的に進めない" },
      postponed: { label: "延期", description: "実行を延期し、再調整が必要" }
    },
    ko: {
      pending: { label: "미표시", description: "아직 완료 상태를 선택하지 않았습니다" },
      excellent: { label: "고품질 완료", description: "계획대로 완료했고 기대보다 품질이 높습니다" },
      basic: { label: "기본 완료", description: "주요 내용은 완료했지만 개선 여지가 있습니다" },
      stopped: { label: "중지", description: "과제가 중단되었거나 당분간 진행하지 않습니다" },
      postponed: { label: "연기", description: "실행을 미루었고 다시 일정을 잡아야 합니다" }
    }
  };

  const colors = {
    pending: { color: "#64748b", bg: "#f8fafc", border: "#cbd5e1" },
    excellent: { color: "#15803d", bg: "#dcfce7", border: "#86efac" },
    basic: { color: "#a16207", bg: "#fef3c7", border: "#facc15" },
    stopped: { color: "#b91c1c", bg: "#fee2e2", border: "#fca5a5" },
    postponed: { color: "#7e22ce", bg: "#f3e8ff", border: "#d8b4fe" }
  } satisfies Record<TaskStatus, { color: string; bg: string; border: string }>;

  return Object.fromEntries(
    (Object.keys(colors) as TaskStatus[]).map((status) => [status, { ...labels[language][status], ...colors[status] }])
  ) as ReturnType<typeof getStatusMeta>;
};

export const getRoleMeta = (language: Language): Record<UserRole, { label: string; description: string }> => {
  const values: Record<Language, Record<UserRole, { label: string; description: string }>> = {
    zh: {
      student: { label: "学生", description: "制定计划、更新状态、填写自我评价" },
      parent: { label: "家长", description: "监督完成情况并填写家长评价" },
      teacher: { label: "老师", description: "查看计划并给出学习反馈" },
      institution: { label: "机构", description: "用于机构导师或学习顾问跟进" }
    },
    en: {
      student: { label: "Student", description: "Create plans, update status, and write self reviews" },
      parent: { label: "Parent", description: "Monitor progress and write parent reviews" },
      teacher: { label: "Teacher", description: "Review plans and give learning feedback" },
      institution: { label: "Institution", description: "For mentors, tutors, or learning advisors" }
    },
    ja: {
      student: { label: "生徒", description: "計画作成、状態更新、自己評価を行う" },
      parent: { label: "保護者", description: "進捗を見守り、保護者評価を書く" },
      teacher: { label: "先生", description: "計画を確認し学習フィードバックを行う" },
      institution: { label: "機関", description: "塾・メンター・学習アドバイザー向け" }
    },
    ko: {
      student: { label: "학생", description: "계획을 세우고 상태와 자기 평가를 작성" },
      parent: { label: "부모", description: "진행을 지켜보고 부모 평가를 작성" },
      teacher: { label: "교사", description: "계획을 확인하고 학습 피드백 제공" },
      institution: { label: "기관", description: "멘토, 튜터, 학습 상담자용" }
    }
  };

  return values[language];
};

export const getEvaluationMeta = (language: Language): Record<EvaluationKey, { label: string; placeholder: string }> => {
  const values: Record<Language, Record<EvaluationKey, { label: string; placeholder: string }>> = {
    zh: {
      self: { label: "自我评价", placeholder: "我这周做得好的地方、遇到的困难、下周要调整的行动..." },
      parent: { label: "家长评价", placeholder: "观察到的完成情况、鼓励和建议..." },
      teacher: { label: "老师评价", placeholder: "学习方法、任务质量、下一步建议..." },
      institution: { label: "机构/老师评价", placeholder: "机构或导师的综合反馈..." }
    },
    en: {
      self: { label: "Self Review", placeholder: "What went well, what was difficult, and what to adjust next week..." },
      parent: { label: "Parent Review", placeholder: "Observed progress, encouragement, and suggestions..." },
      teacher: { label: "Teacher Review", placeholder: "Learning method, task quality, and next-step advice..." },
      institution: { label: "Institution / Mentor Review", placeholder: "Overall feedback from an institution or mentor..." }
    },
    ja: {
      self: { label: "自己評価", placeholder: "今週よかった点、難しかった点、来週調整したい行動..." },
      parent: { label: "保護者評価", placeholder: "見えた進捗、励まし、提案..." },
      teacher: { label: "先生の評価", placeholder: "学習方法、タスク品質、次の助言..." },
      institution: { label: "機関/先生の評価", placeholder: "機関またはメンターからの総合フィードバック..." }
    },
    ko: {
      self: { label: "자기 평가", placeholder: "이번 주 잘한 점, 어려웠던 점, 다음 주 조정할 행동..." },
      parent: { label: "부모 평가", placeholder: "관찰한 진행 상황, 격려와 제안..." },
      teacher: { label: "교사 평가", placeholder: "학습 방법, 과제 품질, 다음 단계 조언..." },
      institution: { label: "기관/교사 평가", placeholder: "기관 또는 멘토의 종합 피드백..." }
    }
  };

  return values[language];
};

export const getDefaultPlanText = (language: Language) => {
  const values: Record<
    Language,
    {
      taskTitle: string;
      planTitle: string;
      bigGoal: string;
      tasks: Array<{ title: string; detail: string }>;
    }
  > = {
    zh: {
      taskTitle: "新的小计划",
      planTitle: "我的杏花周计划",
      bigGoal: "写下这周最重要的大目标，并把它拆成可以完成的小计划。",
      tasks: [
        { title: "明确本周最重要的一件事", detail: "把大目标写成一句可以检查结果的话。" },
        { title: "安排每天的一个关键行动", detail: "每天只保留一个必须完成的核心任务。" },
        { title: "周末复盘并填写评价", detail: "记录高质完成、基本完成、停止和推迟的原因。" }
      ]
    },
    en: {
      taskTitle: "New small plan",
      planTitle: "My Almond Weekly Plan",
      bigGoal: "Write the most important goal for this week, then break it into doable small plans.",
      tasks: [
        { title: "Define the most important result this week", detail: "Turn the big goal into one outcome you can check." },
        { title: "Schedule one key action each day", detail: "Keep one must-do core action for each day." },
        { title: "Review the week and write reflections", detail: "Record why tasks were excellent, basic, stopped, or postponed." }
      ]
    },
    ja: {
      taskTitle: "新しい小計画",
      planTitle: "私の杏の花 週間プラン",
      bigGoal: "今週いちばん大切な目標を書き、実行できる小計画に分けましょう。",
      tasks: [
        { title: "今週もっとも大切な成果を決める", detail: "大きな目標を、結果を確認できる一文にします。" },
        { title: "毎日の重要アクションを一つ決める", detail: "各日に必ず進める核心タスクを一つだけ置きます。" },
        { title: "週末に振り返りと評価を書く", detail: "上質完了、基本完了、停止、延期の理由を記録します。" }
      ]
    },
    ko: {
      taskTitle: "새 작은 계획",
      planTitle: "나의 아몬드꽃 주간 계획",
      bigGoal: "이번 주 가장 중요한 큰 목표를 쓰고 실행 가능한 작은 계획으로 나누세요.",
      tasks: [
        { title: "이번 주 가장 중요한 결과 정하기", detail: "큰 목표를 확인 가능한 한 문장으로 바꿉니다." },
        { title: "매일 하나의 핵심 행동 정하기", detail: "하루에 반드시 할 핵심 과제 하나만 남깁니다." },
        { title: "주말에 회고와 평가 작성하기", detail: "고품질 완료, 기본 완료, 중지, 연기의 이유를 기록합니다." }
      ]
    }
  };

  return values[language];
};

export const getFallbackSuggestion = (language: Language): AiSuggestion => {
  const values: Record<Language, AiSuggestion> = {
    zh: {
      summary: "AI 建议暂时不可用，但你仍然可以先按大目标、关键行动和复盘评价推进。",
      strengths: ["计划已经包含大目标、小计划、日期和状态，具备复盘基础。"],
      risks: ["如果小计划过多或描述过宽，执行时可能难以判断是否完成。"],
      revisions: ["把每个小计划改成可观察的行动，例如“完成 20 道题并订正错题”。"],
      nextSteps: ["先选择本周最重要的 3 个任务，再安排每天的具体时间。"]
    },
    en: {
      summary: "AI suggestions are temporarily unavailable, but you can still move forward with the big goal, key actions, and reviews.",
      strengths: ["The plan already includes a big goal, tasks, dates, and status tracking."],
      risks: ["If tasks are too broad or too many, it may be hard to judge completion."],
      revisions: ["Rewrite each task as an observable action, such as “finish 20 questions and correct mistakes.”"],
      nextSteps: ["Choose the 3 most important tasks for this week, then schedule concrete time for each day."]
    },
    ja: {
      summary: "AI 提案は一時的に利用できませんが、大きな目標、重要アクション、振り返りで進められます。",
      strengths: ["大きな目標、小計画、日付、状態があり、振り返りの土台があります。"],
      risks: ["小計画が多すぎたり広すぎたりすると、完了判断が難しくなります。"],
      revisions: ["各小計画を「20問解いて間違いを直す」のように観察できる行動へ直しましょう。"],
      nextSteps: ["今週もっとも大切な3つのタスクを選び、毎日の具体的な時間を決めましょう。"]
    },
    ko: {
      summary: "AI 제안은 일시적으로 사용할 수 없지만, 큰 목표와 핵심 행동, 회고 평가로 진행할 수 있습니다.",
      strengths: ["계획에 큰 목표, 작은 계획, 날짜, 상태가 포함되어 회고 기반이 있습니다."],
      risks: ["작은 계획이 너무 많거나 넓으면 완료 여부를 판단하기 어려울 수 있습니다."],
      revisions: ["각 작은 계획을 “문제 20개 풀고 오답 고치기”처럼 관찰 가능한 행동으로 바꿔 보세요."],
      nextSteps: ["이번 주 가장 중요한 과제 3개를 고른 뒤, 매일의 구체적인 시간을 정하세요."]
    }
  };

  return values[language];
};
