import {defineType, defineField} from 'sanity'
import {TranslateIcon} from '@sanity/icons'

export const uiStrings = defineType({
  name: 'uiStrings',
  title: 'UI Strings',
  type: 'document',
  icon: TranslateIcon,
  __experimental_actions: ['update', 'publish'],
  fields: [
    // ── Navigation ──
    defineField({name: 'nav_back_en', title: 'Back label (English)', type: 'string', group: 'nav', initialValue: 'Journeys'}),
    defineField({name: 'nav_back_tc', title: 'Back label (繁中)', type: 'string', group: 'nav', initialValue: '旅程'}),

    // ── Home Screen ──
    defineField({name: 'choose_journey_en', title: 'Choose Journey label (English)', type: 'string', group: 'home', initialValue: 'Choose your journey'}),
    defineField({name: 'choose_journey_tc', title: 'Choose Journey label (繁中)', type: 'string', group: 'home', initialValue: '選擇你的旅程'}),
    defineField({name: 'btn_start_en', title: 'Start button (English)', type: 'string', group: 'home', initialValue: 'Start →'}),
    defineField({name: 'btn_start_tc', title: 'Start button (繁中)', type: 'string', group: 'home', initialValue: '開始 →'}),
    defineField({name: 'btn_coming_soon_en', title: 'Coming Soon label (English)', type: 'string', group: 'home', initialValue: 'Coming soon'}),
    defineField({name: 'btn_coming_soon_tc', title: 'Coming Soon label (繁中)', type: 'string', group: 'home', initialValue: '即將推出'}),
    defineField({name: 'meta_headphones_en', title: 'Meta bullet: headphones (English)', type: 'string', group: 'home', initialValue: 'Headphones recommended'}),
    defineField({name: 'meta_headphones_tc', title: 'Meta bullet: headphones (繁中)', type: 'string', group: 'home', initialValue: '建議佩戴耳機'}),
    defineField({name: 'meta_offline_en', title: 'Meta bullet: offline (English)', type: 'string', group: 'home', initialValue: 'Offline-ready'}),
    defineField({name: 'meta_offline_tc', title: 'Meta bullet: offline (繁中)', type: 'string', group: 'home', initialValue: '支援離線'}),

    // ── Journey Screen ──
    defineField({name: 'play_all_en', title: 'Play All button (English)', type: 'string', group: 'journey', initialValue: 'Play all chapters in order'}),
    defineField({name: 'play_all_tc', title: 'Play All button (繁中)', type: 'string', group: 'journey', initialValue: '順序播放全部章節'}),
    defineField({name: 'chapter_label_en', title: 'Chapter prefix (English)', type: 'string', group: 'journey', initialValue: 'Chapter'}),
    defineField({name: 'chapter_label_tc', title: 'Chapter prefix (繁中)', type: 'string', group: 'journey', initialValue: '第'}),
    defineField({name: 'chapter_suffix_tc', title: 'Chapter suffix (繁中)', type: 'string', group: 'journey', initialValue: '章'}),
    defineField({name: 'practice_label_en', title: 'Mindful Practice label (English)', type: 'string', group: 'journey', initialValue: 'Mindful Practice'}),
    defineField({name: 'practice_label_tc', title: 'Mindful Practice label (繁中)', type: 'string', group: 'journey', initialValue: '正念練習'}),
    defineField({name: 'transcript_label_en', title: 'Transcript label (English)', type: 'string', group: 'journey', initialValue: 'Audio Transcript'}),
    defineField({name: 'transcript_label_tc', title: 'Transcript label (繁中)', type: 'string', group: 'journey', initialValue: '音頻文字稿'}),
    defineField({name: 'transcript_en_note', title: 'Transcript EN-only note', type: 'string', group: 'journey', initialValue: 'Transcript is available in Chinese only.'}),
    defineField({name: 'map_label_en', title: 'Map label (English)', type: 'string', group: 'journey', initialValue: 'Map'}),
    defineField({name: 'map_label_tc', title: 'Map label (繁中)', type: 'string', group: 'journey', initialValue: '地圖'}),
    defineField({name: 'speaker_section_en', title: 'Speaker section title (English)', type: 'string', group: 'journey', initialValue: 'About your guide'}),
    defineField({name: 'speaker_section_tc', title: 'Speaker section title (繁中)', type: 'string', group: 'journey', initialValue: '關於你的導師'}),

    // ── Completion ──
    defineField({name: 'btn_home_en', title: 'Back to journeys button (English)', type: 'string', group: 'completion', initialValue: 'Back to all journeys'}),
    defineField({name: 'btn_home_tc', title: 'Back to journeys button (繁中)', type: 'string', group: 'completion', initialValue: '返回所有旅程'}),

    // ── Player ──
    defineField({name: 'playlist_en', title: 'Playlist label (English)', type: 'string', group: 'player', initialValue: 'PLAYLIST'}),
    defineField({name: 'playlist_tc', title: 'Playlist label (繁中)', type: 'string', group: 'player', initialValue: '播放列表'}),

    // ── Install ──
    defineField({name: 'install_title_en', title: 'Install block title (English)', type: 'string', group: 'install', initialValue: 'Save to Home Screen'}),
    defineField({name: 'install_title_tc', title: 'Install block title (繁中)', type: 'string', group: 'install', initialValue: '加至主畫面'}),
    defineField({name: 'install_subtitle_en', title: 'Install block subtitle (English)', type: 'string', group: 'install', initialValue: 'Listen offline · No App Store needed'}),
    defineField({name: 'install_subtitle_tc', title: 'Install block subtitle (繁中)', type: 'string', group: 'install', initialValue: '可離線收聽 · 無需應用程式商店'}),
    // iOS steps
    defineField({name: 'ios_step1_en', title: 'iOS Step 1 (English)', type: 'string', group: 'install', initialValue: 'Open this page in Safari (not Chrome)'}),
    defineField({name: 'ios_step1_tc', title: 'iOS Step 1 (繁中)', type: 'string', group: 'install', initialValue: '請使用 Safari 開啟此頁面（非 Chrome）'}),
    defineField({name: 'ios_step2_en', title: 'iOS Step 2 (English)', type: 'string', group: 'install', initialValue: 'Tap the Share ↑ icon at the bottom of Safari'}),
    defineField({name: 'ios_step2_tc', title: 'iOS Step 2 (繁中)', type: 'string', group: 'install', initialValue: '點擊 Safari 底部的分享 ↑ 圖示'}),
    defineField({name: 'ios_step3_en', title: 'iOS Step 3 (English)', type: 'string', group: 'install', initialValue: 'Scroll down and tap "Add to Home Screen"'}),
    defineField({name: 'ios_step3_tc', title: 'iOS Step 3 (繁中)', type: 'string', group: 'install', initialValue: '向下捲動並點選「加至主畫面」'}),
    defineField({name: 'ios_step4_en', title: 'iOS Step 4 (English)', type: 'string', group: 'install', initialValue: 'Tap "Add" — then you can save this web app to your home page'}),
    defineField({name: 'ios_step4_tc', title: 'iOS Step 4 (繁中)', type: 'string', group: 'install', initialValue: '點選「加入」——即可將此網頁應用程式儲存至主畫面'}),
    defineField({name: 'ios_step5_en', title: 'iOS Step 5 (English)', type: 'string', group: 'install', initialValue: 'Afterwards, tap the top right ☰ menu to download all audio files and listen offline'}),
    defineField({name: 'ios_step5_tc', title: 'iOS Step 5 (繁中)', type: 'string', group: 'install', initialValue: '之後，點擊右上角 ☰ 選單下載所有音頻，即可離線收聽'}),
    // Android steps
    defineField({name: 'android_step1_en', title: 'Android Step 1 (English)', type: 'string', group: 'install', initialValue: 'Open this page in Chrome on your Android phone'}),
    defineField({name: 'android_step1_tc', title: 'Android Step 1 (繁中)', type: 'string', group: 'install', initialValue: '使用 Android 手機的 Chrome 開啟此頁面'}),
    defineField({name: 'android_step2_en', title: 'Android Step 2 (English)', type: 'string', group: 'install', initialValue: 'Tap the three dots ⋮ menu at the top right'}),
    defineField({name: 'android_step2_tc', title: 'Android Step 2 (繁中)', type: 'string', group: 'install', initialValue: '點擊右上角的三點選單 ⋮'}),
    defineField({name: 'android_step3_en', title: 'Android Step 3 (English)', type: 'string', group: 'install', initialValue: 'Tap "Add to Home Screen" or "Install App"'}),
    defineField({name: 'android_step3_tc', title: 'Android Step 3 (繁中)', type: 'string', group: 'install', initialValue: '點選「加至主畫面」或「安裝應用程式」'}),
    defineField({name: 'android_step4_en', title: 'Android Step 4 (English)', type: 'string', group: 'install', initialValue: 'Confirm the name and tap "Add" — then you can save this web app to your home page'}),
    defineField({name: 'android_step4_tc', title: 'Android Step 4 (繁中)', type: 'string', group: 'install', initialValue: '確認名稱後點選「加入」——即可將此網頁應用程式儲存至主畫面'}),
    defineField({name: 'android_step5_en', title: 'Android Step 5 (English)', type: 'string', group: 'install', initialValue: 'Afterwards, tap the top right ☰ menu to download all audio files and listen offline'}),
    defineField({name: 'android_step5_tc', title: 'Android Step 5 (繁中)', type: 'string', group: 'install', initialValue: '之後，點擊右上角 ☰ 選單下載所有音頻，即可離線收聽'}),

    // ── Offline / Updates ──
    defineField({name: 'offline_playing_en', title: 'Offline mode notice (English)', type: 'string', group: 'offline', initialValue: 'Offline — playing from cache'}),
    defineField({name: 'offline_playing_tc', title: 'Offline mode notice (繁中)', type: 'string', group: 'offline', initialValue: '離線模式 — 從緩存播放'}),
    defineField({name: 'update_available_en', title: 'Update available notice (English)', type: 'string', group: 'offline', initialValue: 'New version available. Refresh to update.'}),
    defineField({name: 'update_available_tc', title: 'Update available notice (繁中)', type: 'string', group: 'offline', initialValue: '有新版本。重新整理以更新。'}),
    defineField({name: 'btn_update_en', title: 'Update button (English)', type: 'string', group: 'offline', initialValue: 'Refresh'}),
    defineField({name: 'btn_update_tc', title: 'Update button (繁中)', type: 'string', group: 'offline', initialValue: '更新'}),

    // ── Download ──
    defineField({name: 'download_label_en', title: 'Download button (English)', type: 'string', group: 'download', initialValue: 'Download audio chapters'}),
    defineField({name: 'download_label_tc', title: 'Download button (繁中)', type: 'string', group: 'download', initialValue: '下載音頻章節'}),
    defineField({name: 'download_note_en', title: 'Download warning note (English)', type: 'text', rows: 2, group: 'download', initialValue: 'Please add this app to your Home Screen first — otherwise audio will not play offline even after downloading.'}),
    defineField({name: 'download_note_tc', title: 'Download warning note (繁中)', type: 'text', rows: 2, group: 'download', initialValue: '請先將此應用程式加至主畫面，否則即使下載後仍無法離線收聽。'}),
    defineField({name: 'delete_download_en', title: 'Delete download button (English)', type: 'string', group: 'download', initialValue: 'Delete downloaded audio'}),
    defineField({name: 'delete_download_tc', title: 'Delete download button (繁中)', type: 'string', group: 'download', initialValue: '刪除已下載音頻'}),
  ],
  groups: [
    {name: 'nav', title: '🧭 Navigation'},
    {name: 'home', title: '🏠 Home Screen'},
    {name: 'journey', title: '🌿 Journey Page'},
    {name: 'completion', title: '✅ Completion'},
    {name: 'player', title: '▶️ Player'},
    {name: 'install', title: '📲 Install Instructions'},
    {name: 'offline', title: '📵 Offline & Updates'},
    {name: 'download', title: '⬇️ Download'},
  ],
})
