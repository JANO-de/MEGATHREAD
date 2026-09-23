'use strict';

/**
 * Insert Image Plus
 *
 * 1. 挿入ピッカー（コマンド「画像を挿入する」）
 *    接頭辞（icon / logo …）を自動集計してカテゴリ選択 → サムネ一覧 → クリックで ![[…]] 挿入。
 * 2. 管理画面（コマンド「画像を管理する」／リボン）
 *    フォルダ × 接頭辞で絞る一覧＋詳細パネル。1枚ずつ：開く／リンクをコピー／リネーム／移動／WebP変換／削除。
 *    一括操作は持たない（検出できない参照がある以上、まとめて消す操作は事故の温床）。
 *
 * 参照数は Obsidian の metadataCache.resolvedLinks の逆引き。Markdown内の [[ ]] / ![[ ]] / []() だけが対象なので、
 * UIでは「未参照」と言わず「検出できた参照 N」と表示する（Canvas / frontmatterの素の文字列 / コードブロック内は対象外）。
 */

const {
  Plugin, PluginSettingTab, Setting, FuzzySuggestModal, Modal, Notice,
  MarkdownView, ItemView, TFile, TFolder, normalizePath, setIcon, Platform, getLanguage,
} = require('obsidian');

// ── 表示言語 ─────────────────────────────────────────
// Obsidian の言語設定（設定 → 一般 → 言語）に従う。日本語ならソースの原文をそのまま、それ以外は EN の英語を出す。
// キー＝日本語の原文。{name} のような置き場は vars で差し替える。getLanguage は Obsidian 1.8.7 以降（manifest の minAppVersion）。
const EN = {
  '画像を挿入する': 'Insert image',
  '画像を管理する': 'Manage images',
  'Insert Image Plus: 画像を管理する': 'Insert Image Plus: Manage images',
  'Insert Image Plus: 画像を挿入する': 'Insert Image Plus: Insert image',
  '挿入先がありません。ノート（編集モード）か Excalidraw を開いてから押してください。': 'Nothing to insert into. Open a note (editing mode) or an Excalidraw drawing first.',
  'Insert Image Plus: 対象ファイルが見つかりません。設定の種別トグル／フォルダを確認してください。': 'Insert Image Plus: No matching files. Check the file type toggles and folders in settings.',
  '最近使った': 'Recent',
  'すべて': 'All',
  '画像': 'Images',
  '挿入：{name}': 'Inserted: {name}',
  'Excalidrawプラグインが見つかりません。': 'Excalidraw plugin not found.',
  '前の挿入が終わるまで待ってください。': 'Please wait for the previous insert to finish.',
  'Excalidrawに配置：{name}': 'Placed on Excalidraw: {name}',
  'お使いの Excalidraw プラグインが古く、独立した挿入 API（getAPI）がありません。Excalidraw を更新してからお試しください。': 'Your Excalidraw plugin is too old and has no standalone insert API (getAPI). Update Excalidraw and try again.',
  'Excalidrawへの配置に失敗しました。コンソールを確認してください。': 'Failed to place on Excalidraw. Check the console.',
  '5MB超': 'Over 5MB',
  'この環境ではOS標準アプリで開けません。': 'Opening with the default app is not available here.',
  'この環境ではファイルの場所を表示できません。': 'Showing the file location is not available here.',
  'コピー：{text}': 'Copied: {text}',
  'クリップボードに書けませんでした。': 'Could not write to the clipboard.',
  'Obsidian設定「ファイルとリンク → 内部リンクを自動更新」がONのときだけリネームできます（OFFだとリンクが切れるため）。': 'Rename is available only while "Files and links → Automatically update internal links" is on in Obsidian settings (otherwise links would break).',
  'ファイル名を入力してください。': 'Enter a file name.',
  '使えない文字が入っています（\\ / : * ? " < > |）。': 'Contains characters that cannot be used (\\ / : * ? " < > |).',
  '同じ名前のファイルがあります。': 'A file with that name already exists.',
  'リネーム：{name}': 'Renamed: {name}',
  'Obsidian設定「ファイルとリンク → 内部リンクを自動更新」がONのときだけ移動できます（OFFだとリンクが切れるため）。': 'Move is available only while "Files and links → Automatically update internal links" is on in Obsidian settings (otherwise links would break).',
  'すでにそのフォルダにあります。': 'Already in that folder.',
  '移動先に同じ名前のファイルがあります。': 'A file with that name already exists in the destination.',
  '移動：{folder}': 'Moved to: {folder}',
  '（ルート）': '(root)',
  'この形式は変換しません：{name}': 'This format is not converted: {name}',
  'この環境の描画エンジンはWebP書き出しに対応していません。': 'The rendering engine here cannot export WebP.',
  '変換に失敗：{name}': 'Conversion failed: {name}',
  'WebPに変換：{name}（{size}・参照 {changed} 件を更新{failed}{fm}・元の画像は残しています）': 'Converted to WebP: {name} ({size}, {changed} references updated{failed}{fm}, original kept)',
  '・{n} 件は未更新': ', {n} not updated',
  '・frontmatter の参照 {n} 件は手で直してください': ', {n} frontmatter references need fixing by hand',
  '削除：{name}（Obsidian の削除設定に従って処理しました）': 'Deleted: {name} (per Obsidian\'s deleted-files setting)',
  'カテゴリ（接頭辞）を選ぶ… 例：icon / logo': 'Choose a category (prefix)… e.g. icon / logo',
  '← 戻る': '← Back',
  'ファイル名で絞り込み…': 'Filter by file name…',
  '{n} 件': '{n} files',
  '🔍 キーワードで検索してね（{n} 件・多すぎるので全表示はしません）': '🔍 Type to search ({n} files; too many to show all)',
  'ここにドロップして追加 → {target}': 'Drop here to add → {target}',
  '添付ファイルの既定フォルダ': 'Default attachment folder',
  '画像ファイル（png / jpg / svg / webp / gif / avif / bmp）だけ追加できます。': 'Only image files (png / jpg / svg / webp / gif / avif / bmp) can be added.',
  '画像以外の {n} 件は飛ばします。': 'Skipping {n} non-image files.',
  '追加に失敗：{name}': 'Failed to add: {name}',
  '{n} 件を追加しました → {target}': 'Added {n} files → {target}',
  'すべてのフォルダ（{n}）': 'All folders ({n})',
  '{dir}（{n}）': '{dir} ({n})',
  '名前順': 'Name',
  '作成日順': 'Created',
  '更新日順': 'Modified',
  'サイズ順': 'Size',
  '参照数順': 'References',
  '降順': 'Descending',
  '昇順': 'Ascending',
  '接頭辞なし': 'No prefix',
  '指定の接頭辞に一致するファイルがありません（設定で追加）': 'No files match the listed prefixes (add them in settings)',
  '「接頭辞 - 内容」の形のファイルがありません': 'No files named "prefix - name"',
  '該当するファイルがありません': 'No matching files',
  '{n} 参照': '{n} refs',
  '検出できた参照 {n}': 'Detected references: {n}',
  'Obsidianで開く': 'Open in Obsidian',
  'リンクをコピー': 'Copy link',
  'リネーム': 'Rename',
  '削除': 'Delete',
  '{name} を WebP に変換します。': 'Convert {name} to WebP.',
  '参照 {n} 件のリンクを新しいファイル名に張り替えます（書き換えられなかった分はそのまま残り、件数でお知らせします）。': 'Updates {n} references to the new file name (any that cannot be rewritten are left as they are, and you will be told how many).',
  '元ファイルは残します（このプラグインは元画像を消しません）。': 'The original file is kept (this plugin never deletes originals).',
  '品質：{q}%（設定で変更できます）': 'Quality: {q}% (change it in settings)',
  'WebPに変換': 'Convert to WebP',
  '参照情報を更新中です。少し待ってからもう一度お試しください。': 'Reference data is being updated. Wait a moment and try again.',
  '参照情報の解析完了をまだ確認できていません。どれかノートを1つ保存すると解析が走り、完了後に削除できるようになります。': 'Reference indexing has not been confirmed yet. Save any note to trigger indexing; deletion becomes available once it finishes.',
  '{n} 件のノートから参照されているため削除しません。参照を外してからお試しください。': 'Not deleted: referenced by {n} notes. Remove the references and try again.',
  '{name} を削除します。': 'Delete {name}.',
  'Obsidian の「削除したファイル」設定に従います（システムのゴミ箱／Vault内 .trash／完全削除）。': 'Follows Obsidian\'s "Deleted files" setting (system trash / vault .trash / permanent).',
  '検出できた参照は 0 件です。ただし Canvas・frontmatter の素の文字列・コードブロック内の参照、エディタで入力中でまだ保存されていない参照は検出できません。': 'Detected references: 0. Note that references in Canvas, plain frontmatter strings, code blocks, and unsaved editor text cannot be detected.',
  '削除する': 'Delete',
  '参照情報の準備が終わっていないため削除しません。': 'Not deleted: reference data is not ready.',
  '削除直前に {n} 件の参照が見つかったため削除しません。': 'Not deleted: {n} references were found just before deleting.',
  '画像を追加': 'Add image',
  '{n} 件の画像を追加': 'Add {n} images',
  '保存先：{target}': 'Save to: {target}',
  '（接頭辞なし）': '(no prefix)',
  '＋ 新しい接頭辞…': '+ New prefix…',
  '新しい接頭辞': 'New prefix',
  '内容': 'Name',
  '（複数：元のファイル名をそのまま使います）': '(multiple: original file names are kept)',
  ' など': ' etc.',
  '追加': 'Add',
  'キャンセル': 'Cancel',
  'Markdown内のリンク・埋め込みからは見つかりませんでした。': 'Not found in any Markdown links or embeds.',
  '※ Canvas / frontmatterの素の文字列 / コードブロック内は検出できません。': 'Note: Canvas, plain frontmatter strings, and code blocks cannot be detected.',
  '開く': 'Open',
  'OS標準アプリで開く': 'Open with default app',
  'ファイルの場所を表示': 'Show in system explorer',
  '整える': 'Organize',
  'Obsidian設定「ファイルとリンク → 内部リンクを自動更新」をONにすると使えます（OFFだとリンクが切れるため）': 'Available while "Files and links → Automatically update internal links" is on in Obsidian settings (otherwise links would break)',
  'リンク自動更新の設定を確認できないため無効にしています': 'Disabled because the link auto-update setting cannot be checked',
  '移動': 'Move',
  'この環境の描画エンジンはWebP書き出しに対応していません': 'The rendering engine here cannot export WebP',
  '対応確認中…': 'Checking support…',
  '削除（Obsidian の削除設定に従う）': 'Delete (per Obsidian\'s deleted-files setting)',
  '参照が {n} 件あるため削除できません。参照を外してからお試しください': 'Cannot delete: {n} references exist. Remove them and try again',
  '詳細': 'Details',
  'パス': 'Path',
  'サイズ': 'Size',
  '作成': 'Created',
  '更新': 'Modified',
  '移動先フォルダを選ぶ…': 'Choose a destination folder…',
  'ファイル名の頭に「接頭辞 - 」を付けるだけで、画像と Excalidraw の図がカテゴリ分けされ、一覧から選んで挿入できます。設定はこの3つだけ押さえれば使えます。': 'Start a file name with "prefix - " and your images and Excalidraw drawings are grouped into categories you can pick from and insert. These three settings are all you need.',
  '済み': 'Done',
  'まだ': 'Not yet',
  '名前で分ける': 'Group by name',
  '「icon - 矢印.png」「illustration - 図解の流れ.md」のように、名前の頭に「接頭辞 - 」を付けます。': 'Start file names with "prefix - ", like "icon - arrow.png" or "illustration - flow.md".',
  '接頭辞がそのまま一覧のカテゴリになります。まだ付いていないファイルは「画像を管理する」のリネームで付けられます。': 'The prefix becomes the category in the list. Files without one can be renamed from "Manage images".',
  '接頭辞付き {n} 枚': '{n} files with a prefix',
  '接頭辞付きのファイルがまだありません': 'No files with a prefix yet',
  '画像の種類を選ぶ': 'Choose image types',
  'Excalidraw の図も候補にする': 'Include Excalidraw drawings',
  'コミュニティプラグイン「Excalidraw」が必要です。': 'Requires the community plugin "Excalidraw".',
  '図は接頭辞（icon / illustration など）が付いたものだけ候補になります。作業中の図は一覧に混ざりません。': 'Only drawings with a prefix (icon, illustration, …) are listed, so work-in-progress drawings stay out of the list.',
  'Excalidraw プラグインが見つかりません': 'Excalidraw plugin not found',
  '候補の図 {n} 枚': '{n} drawings available',
  '候補になる図がまだありません': 'No drawings available yet',
  '図の候補を選ぶ': 'Choose drawings',
  '使う': 'Use',
  '画像 {a} 枚 / 図 {b} 枚': '{a} images / {b} drawings',
  'コマンドパレットからも呼べます：「{command}」。ホットキーは 設定 → ホットキー で付けられます。': 'Also available from the command palette: "{command}". Assign a hotkey under Settings → Hotkeys.',
  'ノートか Excalidraw を開いて、左のリボンのこのアイコンを押す': 'Open a note or an Excalidraw drawing and click this icon in the left ribbon',
  '→ カテゴリを選ぶ → 1枚選ぶ → その場に入る': '→ pick a category → pick one file → it is inserted at the cursor',
  '左のリボンのこのアイコンを押すと、画像と図の一覧がタブで開く': 'Click this icon in the left ribbon to open the list of images and drawings in a tab',
  '1枚ずつ手入れする（一括操作はない）': 'Work on files one at a time (there are no bulk actions)',
  'Finder から画像を落とす → 接頭辞を選んで保存': 'Drop images from your file manager → choose a prefix → save',
  'リネーム（接頭辞を付け直す）': 'Rename (change the prefix)',
  'フォルダへ移動': 'Move to a folder',
  'WebP に変換（元の画像は残す）': 'Convert to WebP (the original is kept)',
  '削除（検出できた参照が 0 件のときだけ・Obsidian の削除設定に従う）': 'Delete (only when no references are detected; follows Obsidian\'s deleted-files setting)',
  'どのノートで使っているか（参照）を見る': 'See which notes use it (references)',
  'はじめに': 'Get started',
  '一般': 'General',
  '挿入': 'Insert',
  '管理': 'Manage',
  '接頭辞の出し方': 'How prefixes are listed',
  '自動＝ファイル名の「接頭辞 - 内容」から集計。指定のみ＝下のリストにある接頭辞だけ。OFF＝カテゴリを出さない。': 'Auto = collected from "prefix - name" file names. Listed only = only the prefixes in the list below. Off = no categories.',
  '自動（全部）': 'Auto (all)',
  '指定の接頭辞のみ': 'Listed prefixes only',
  '指定する接頭辞': 'Listed prefixes',
  '1行に1つ書きます（Enterで改行）。ファイル名の「 - 」より前の部分と一致したものだけがカテゴリになります。': 'One per line (press Enter for a new line). Only prefixes matching the part before " - " in the file name become categories.',
  '対象にする画像': 'Image types',
  'OFF にした拡張子は一覧にも、ドラッグ＆ドロップの受付にも出ません。': 'Extensions turned off are excluded from the list and from drag and drop.',
  '対象にする Excalidraw': 'Excalidraw drawings',
  'Excalidraw の図を扱うには、コミュニティプラグイン「Excalidraw」が必要です（このVaultでは有効になっています）。': 'Handling Excalidraw drawings requires the community plugin "Excalidraw" (enabled in this vault).',
  'Excalidraw の図を扱うには、コミュニティプラグイン「Excalidraw」が必要です。このVaultでは見つからないため、図のサムネ表示とキャンバスへの配置は動きません。': 'Handling Excalidraw drawings requires the community plugin "Excalidraw". It was not found in this vault, so thumbnails and placing on the canvas will not work.',
  'Excalidraw を候補に入れる': 'Include Excalidraw drawings',
  '埋め込むと図がそのまま描画される。': 'Embedded drawings render as they are.',
  '接頭辞が付いた図だけ候補にする': 'Only drawings with a prefix',
  'ON＝下のリストの接頭辞（例：illustration - ○○）で始まる図だけ候補にします。作業中の図やメモの図が一覧に混ざりません。OFF＝Excalidraw と判定した図を全部出します。': 'On = only drawings starting with a listed prefix (e.g. "illustration - …") are included, so work-in-progress and memo drawings stay out. Off = every file detected as Excalidraw is included.',
  '候補にする図の接頭辞': 'Drawing prefixes',
  '1行に1つ書きます（Enterで改行）。ファイル名の「 - 」より前の部分と一致した図だけが候補になります。大文字小文字は区別しません。': 'One per line (press Enter for a new line). Only drawings whose part before " - " matches are included. Case-insensitive.',
  'Excalidraw の判定': 'Excalidraw detection',
  '名前だけ＝ファイル名が .excalidraw / .excalidraw.md のものだけ。名前＋frontmatter＝加えて、frontmatter に excalidraw-plugin を持つノートも Excalidraw として拾う（リネームで .excalidraw が消えた図も見つかる）。': 'Name only = files named .excalidraw / .excalidraw.md. Name + frontmatter = also notes with excalidraw-plugin in their frontmatter (finds drawings that lost .excalidraw when renamed).',
  '名前＋frontmatter': 'Name + frontmatter',
  '名前だけ': 'Name only',
  'Excalidraw のサムネを表示': 'Show Excalidraw thumbnails',
  '一覧のカードに図の中身を表示します。埋め込み画像を含めて 5MB を超える図は、表示が重くなるためサムネを描かず「5MB超」と表示します。一覧からは消えません。': 'Shows the drawing on its card. Drawings over 5MB including embedded images show "Over 5MB" instead of a thumbnail to keep things fast; they stay in the list.',
  'スコープ（任意）': 'Scope (optional)',
  '空＝Vault全体（既定）。ここに入れると、そのフォルダ配下だけが対象になります。': 'Empty = whole vault (default). Add folders to limit to those folders only.',
  '例：02_Configs/Extra': 'e.g. attachments/images',
  '＋ 絞り込むフォルダを追加': '+ Add folder',
  '挿入の仕方': 'Insertion',
  '一覧の横並び数（デスクトップ）': 'Columns (desktop)',
  '挿入ピッカーで1行に並べる枚数。少ないほど1枚が大きく見えます。既定 5。': 'Files per row in the picker. Fewer means larger thumbnails. Default 5.',
  '一覧の横並び数（スマホ）': 'Columns (mobile)',
  'スマホ版 Obsidian で開いたときの枚数。画面が狭いので少なめに。既定 3。': 'Files per row on mobile. Keep it low for narrow screens. Default 3.',
  '挿入形式': 'Insert format',
  'トランスクルージョン ![[…]] は埋め込み表示。リンク [[…]] はリンクだけ。': 'Transclusion ![[…]] embeds the file. Link [[…]] inserts a link only.',
  'トランスクルージョン ![[…]]': 'Transclusion ![[…]]',
  'リンク [[…]]': 'Link [[…]]',
  '既定の幅（px）': 'Default width (px)',
  '入れると ![[name|200]] のように幅つきで挿入。空なら幅なし。': 'If set, inserts with a width like ![[name|200]]. Empty = no width.',
  '例：200': 'e.g. 200',
  'Excalidraw に置くときの大きさ（接頭辞ごと）': 'Size on Excalidraw (per prefix)',
  'キャンバスに配置する画像の長辺（px）。1行に「接頭辞: 数字」。例：icon: 180。書いていない接頭辞は下の既定に従います。': 'Longest side (px) when placing on the canvas. One "prefix: number" per line, e.g. icon: 180. Prefixes not listed use the default below.',
  '上に無い接頭辞の大きさ（px）': 'Size for other prefixes (px)',
  '0（既定）＝Excalidraw に任せる（長辺 500px まで縮小）。': '0 (default) = let Excalidraw decide (shrinks to 500px on the longest side).',
  '0＝Excalidraw に任せる': '0 = let Excalidraw decide',
  '「最近使った」の保持数': 'Number of recent files to keep',
  '挿入ピッカーの接頭辞': 'Picker prefixes',
  '「画像を挿入する」のカテゴリ一覧に効きます。': 'Applies to the category list in "Insert image".',
  '管理画面の接頭辞': 'Manager prefixes',
  '「画像を管理する」の上部チップに効きます。': 'Applies to the chips at the top of "Manage images".',
  'カードと変換': 'Cards and conversion',
  'カードに参照数を表示': 'Show reference count on cards',
  'Markdown内のリンク・埋め込みから検出できた参照の数。0でも「使っていない」とは限りません。': 'Number of references detected from Markdown links and embeds. 0 does not necessarily mean unused.',
  'WebP変換の品質': 'WebP quality',
  '0.1〜1.0。高いほど綺麗で大きい。既定 0.8。': '0.1 to 1.0. Higher is better quality and larger. Default 0.8.',
};
function tr(ja, vars) {
  const lang = typeof getLanguage === 'function' ? getLanguage() : 'en';
  let s = lang === 'ja' ? ja : (EN[ja] ?? ja);
  if (vars) for (const k of Object.keys(vars)) s = s.split('{' + k + '}').join(String(vars[k]));
  return s;
}

// <img> でそのまま描画できる画像拡張子
const IMAGE_EXTS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'avif', 'bmp'];
// WebP に変換してよいラスタ形式（gif はアニメが失われる・svg はベクター・webp は済み → 対象外）
const WEBP_SOURCE_EXTS = ['png', 'jpg', 'jpeg', 'bmp', 'avif'];
const PREFIX_SEP = ' - '; // 「接頭辞 - 内容.png」の区切り
const MANAGER_VIEW_TYPE = 'yosuke-insert-image-manager';
// Excalidraw サムネを描く上限（図のファイル＋埋め込み画像の合計・バイト）。超える図は 📐 のまま（重い図で待たせない・設定には出さない）
const EXCALIDRAW_THUMB_MAX_BYTES = 5 * 1024 * 1024;
// サムネ（SVG文字列）のキャッシュ上限（件数・古い順に捨てる）
const SVG_CACHE_MAX = 120;

const DEFAULT_SETTINGS = {
  folders: [],                  // 空＝Vault全体（フォルダで縛らないのが既定）
  imageExts: [...IMAGE_EXTS],   // 対象にする画像の拡張子（拡張子ごとに ON/OFF。jpg と jpeg は一組）
  includeExcalidraw: true,      // Excalidraw の図
  excalidrawPrefixOnly: true,   // Excalidraw は下の接頭辞に一致する図だけ出す（作業場の図を一覧に流し込まない）
  excalidrawPrefixes: ['icon', 'illustration', 'logo', 'stick', 'slide'],
  excalidrawDetect: 'frontmatter', // 'name' = .excalidraw / .excalidraw.md の名前だけ / 'frontmatter' = 加えて frontmatter の excalidraw-plugin も見る
  insertFormat: 'transclusion', // 'transclusion' = ![[..]] / 'wikilink' = [[..]]
  defaultWidth: '',             // 例 "200" → ![[name|200]]（空なら幅なし）
  excalidrawInsertSize: 0,      // Excalidraw キャンバスに置くときの長辺（px）・接頭辞に一致しないときの既定。0＝Excalidraw に任せる（長辺 500px まで縮小）
  excalidrawInsertSizes: { icon: 180 }, // 接頭辞ごとの長辺（px）。例：icon は 180、slide/illustration は指定なし＝Excalidraw に任せる
  recentLimit: 40,
  recent: [],                   // 最近挿入したファイルパス（新しい順）
  batchSize: 80,                // グリッドの遅延ロード1回分
  pickerColumns: 5,             // 挿入ピッカーの横並び数（2〜8）・デスクトップ
  pickerColumnsMobile: 3,       // 同・スマホ（Platform.isMobile のとき）
  excalidrawThumbnails: true,   // Excalidrawをサムネ生成（5MB超の図は描かないので既定ON）
  // ── 管理画面 ──
  prefixMode: 'auto',           // 管理画面：'auto' = ファイル名から自動集計 / 'whitelist' = 指定の接頭辞のみ / 'off' = カテゴリ無し
  prefixWhitelist: [],          // 管理画面：prefixMode === 'whitelist' のときに出す接頭辞
  insertPrefixMode: 'auto',     // 挿入ピッカー：同上（管理画面とは別に持つ）
  insertPrefixWhitelist: [],    // 挿入ピッカー：同上
  showRefBadge: true,           // グリッドのカードに参照数バッジを出す
  webpQuality: 0.8,             // WebP変換の品質 0.1〜1.0
};

// fileKind が設定と metadataCache を引くためのプラグイン参照（onload で入る）
let pluginRef = null;

// ファイルの種別を判定：'image' / 'excalidraw' / null（それ以外は対象外）
function fileKind(file) {
  const ext = file.extension.toLowerCase();
  if (ext === 'excalidraw' || file.name.toLowerCase().endsWith('.excalidraw.md')) return 'excalidraw';
  if (IMAGE_EXTS.includes(ext)) return 'image';
  // 名前に .excalidraw が無い図（リネーム済み等）は frontmatter の excalidraw-plugin で拾う（設定で切替）
  if (ext === 'md' && pluginRef && pluginRef.settings.excalidrawDetect === 'frontmatter') {
    const fm = pluginRef.app.metadataCache.getFileCache(file)?.frontmatter;
    if (fm && fm['excalidraw-plugin']) return 'excalidraw';
  }
  return null;
}

// 参照1件のテキストを新しいリンク先へ書き換える。書けなければ null。
// original＝本文に書かれている生の文字列（例：![[a.png|200]] / ![alt](sub%20dir/a%20b.png)）、link＝メタデータキャッシュが解釈したリンク先
// ・Wikilink（[[…]]）は link をそのまま newTarget に置換（|幅 や #見出し は original 側に残る）
// ・Markdown（[…](…)）は URL 部分だけを encodeURI(newTarget) に置換（空白・日本語を含む名前でも構文が壊れない）
function rewriteRefText(original, link, newTarget) {
  const isMarkdown = /^!?\[[^\]]*\]\(/.test(original);
  if (isMarkdown) {
    const m = original.match(/^(!?\[[^\]]*\]\()([^)]*)(\).*)$/s);
    if (!m) return null;
    let url = m[2];
    const enc = encodeURI(link);
    if (url.includes(enc)) url = url.replace(enc, encodeURI(newTarget));
    else if (url.includes(link)) url = url.replace(link, encodeURI(newTarget));
    else return null;
    return m[1] + url + m[3];
  }
  if (!original.includes(link)) return null;
  return original.replace(link, newTarget);
}

// 「接頭辞 - 内容」を分解（接頭辞が無ければ prefix: null）
function splitPrefix(basename) {
  const idx = basename.indexOf(PREFIX_SEP);
  if (idx > 0) return { prefix: basename.slice(0, idx).trim(), body: basename.slice(idx + PREFIX_SEP.length) };
  return { prefix: null, body: basename };
}

function humanSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function formatDate(ms) {
  const d = new Date(ms);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

module.exports = class YosukeInsertImagePlugin extends Plugin {
  async onload() {
    pluginRef = this;
    await this.loadSettings();
    this.svgCache = new Map();   // Excalidrawサムネ：path → SVG文字列（id付け替え前）。挿入順＝古い順（LRU）
    this.svgVersion = new Map(); // path → 変更カウンタ。生成中に変更が入ったら結果を捨てる
    this.svgSeq = 0;
    this.thumbEA = null;         // サムネ専用の ExcalidrawAutomate（共有 ea は使わない）
    this.thumbQueue = Promise.resolve(); // サムネ生成の直列化
    // 図・埋め込み画像の変更でサムネを捨てる
    this.registerEvent(this.app.vault.on('modify', (f) => this.onVaultChange(f)));
    this.registerEvent(this.app.vault.on('delete', (f) => this.onVaultChange(f)));
    this.registerEvent(this.app.vault.on('rename', (f, old) => this.onVaultChange(f, old)));
    // 参照情報（resolvedLinks）の状態。削除の可否判断に使う。
    //  ready … このプラグインが 'resolved'（参照解析の完了）を一度受けてから true。有効化時点では解析完了を確認する公開APIが無いので、
    //          起動時ロードでも途中有効化でも「解析中に有効化」でも、必ず最初の 'resolved' を待つ（layoutReady 等から推定しない）。
    //          途中有効化で何も変更が無いと 'resolved' が来ないことがある → 削除を止めたまま「ノートを1つ保存すると解析が走る」と案内する
    //  dirty … ファイルの作成/変更/リネーム/削除の後、'resolved' が来るまで true（＝更新中。直前に足した参照が未反映かもしれない）
    //  注意 … 監視しているのは Vault の保存イベント。エディタで入力中・未保存の参照は見えない（削除ダイアログで明記）
    this.linksReady = false;
    this.linksDirty = false;
    const markDirty = () => { this.linksDirty = true; };
    this.registerEvent(this.app.vault.on('create', markDirty));
    this.registerEvent(this.app.vault.on('modify', markDirty));
    this.registerEvent(this.app.vault.on('rename', markDirty));
    this.registerEvent(this.app.vault.on('delete', markDirty));
    this.registerEvent(this.app.metadataCache.on('resolved', () => { this.linksReady = true; this.linksDirty = false; }));
    this.webpSupported = null; // null=未判定 / true / false
    this.detectWebpSupport();

    // mdエディタ／Excalidrawキャンバスの両方で有効。挿入先が無い場所ではパレットに出ない
    this.addCommand({
      id: 'insert-image',
      name: tr('画像を挿入する'),
      checkCallback: (checking) => {
        const target = this.getInsertTarget();
        if (checking) return !!target;
        if (target) this.startInsert(target);
        return true;
      },
    });

    // 管理画面（どこからでも開ける）
    this.registerView(MANAGER_VIEW_TYPE, (leaf) => new ImageManagerView(leaf, this));
    this.addCommand({
      id: 'open-image-manager',
      name: tr('画像を管理する'),
      callback: () => this.openManager(),
    });
    this.addRibbonIcon('gallery-thumbnails', tr('Insert Image Plus: 画像を管理する'), () => this.openManager());
    // 挿入もリボンから（開いているエディタ／Excalidrawに入れる。無ければ案内）
    this.addRibbonIcon('image-plus', tr('Insert Image Plus: 画像を挿入する'), () => {
      const target = this.getInsertTarget();
      if (target) this.startInsert(target);
      else new Notice(tr('挿入先がありません。ノート（編集モード）か Excalidraw を開いてから押してください。'));
    });

    this.addSettingTab(new YosukeInsertImageSettingTab(this.app, this));
  }

  onunload() {
    if (this.thumbEA && typeof this.thumbEA.destroy === 'function') { try { this.thumbEA.destroy(); } catch (e) { /* noop */ } }
    this.thumbEA = null;
    this.svgCache.clear();
    this.svgVersion.clear();
    pluginRef = null;
  }

  async openManager() {
    const existing = this.app.workspace.getLeavesOfType(MANAGER_VIEW_TYPE);
    let leaf;
    if (existing.length > 0) {
      leaf = existing[0];
    } else {
      leaf = this.app.workspace.getLeaf('tab');
      await leaf.setViewState({ type: MANAGER_VIEW_TYPE, active: true });
    }
    this.app.workspace.revealLeaf(leaf);
  }

  // WebP書き出しが「この描画エンジンで」できるかを1回だけ試す（OSでなくエンジンで決まる：Chromium=可 / WebKit=不可）
  async detectWebpSupport() {
    try {
      const c = document.createElement('canvas');
      c.width = 1; c.height = 1;
      const blob = await new Promise((resolve) => c.toBlob(resolve, 'image/webp', 0.8));
      this.webpSupported = !!blob && blob.type === 'image/webp';
    } catch (e) {
      this.webpSupported = false;
    }
  }

  // Excalidraw の図か（.excalidraw / .excalidraw.md の名前、または frontmatter の excalidraw-plugin キー）
  isExcalidrawFile(file) {
    if (!(file instanceof TFile)) return false;
    if (fileKind(file) === 'excalidraw') return true;
    if (file.extension !== 'md') return false;
    const fm = this.app.metadataCache.getFileCache(file)?.frontmatter;
    return !!(fm && fm['excalidraw-plugin']);
  }

  // Excalidraw プラグインの共有 ExcalidrawAutomate（存在確認と、専用インスタンスを作る元にだけ使う。状態は触らない）
  getEA() {
    const p = this.app.plugins.plugins['obsidian-excalidraw-plugin'];
    return p ? p.ea : null;
  }

  // サムネ専用の EA。プラグイン生存中に1つ。要素を足さない（createSVG に読ませるだけ）ので、他プラグイン・自分の挿入と状態が混ざらない。
  // getAPI（公開API・新しいインスタンスを返す）が無い古い Excalidraw では null＝サムネは描かない（共有 ea には戻らない）
  getThumbEA() {
    const base = this.getEA();
    if (!base || typeof base.getAPI !== 'function') return null;
    if (!this.thumbEA || this.thumbEA.destroyed) {
      this.thumbEA = base.getAPI();
    }
    return this.thumbEA;
  }

  // サムネ生成は1本ずつ。Excalidraw の createSVG は渡した imagesDict に図の埋め込み画像を書き込む（実装で確認・2.27.2）ため、
  // 並列に走らせると辞書を取り合う。→ 直列化し、毎回 clear()（elementsDict と imagesDict の両方を空にする・2.27.2 で確認）してから描き、
  // 使い終わったらもう一度 clear() して画像を持ち続けない
  thumbCreateSVG(path) {
    const run = async () => {
      const ea = this.getThumbEA();
      if (!ea) return null;
      ea.clear();
      try {
        return await ea.createSVG(path, false);
      } finally {
        ea.clear();
      }
    };
    const p = this.thumbQueue.then(run, run);
    this.thumbQueue = p.catch(() => {});
    return p;
  }

  // 挿入専用の EA。操作ごとに作って使い終わったら destroy（挿入先 view と画像一覧を操作ごとに分離）
  async withInsertEA(view, fn) {
    const base = this.getEA();
    if (!base) throw new Error('Excalidraw plugin not found');
    if (typeof base.getAPI === 'function') {
      const ea = base.getAPI(view);
      try {
        ea.reset();
        ea.setView(view);
        return await fn(ea);
      } finally {
        if (typeof ea.destroy === 'function') ea.destroy();
      }
    }
    // 旧 Excalidraw（getAPI 無し）：共有 ea には戻らない（状態分離の方針）。通知して止める
    throw new Error('EA_NO_GETAPI');
  }

  // いま挿入すべき先を判定：Excalidrawキャンバス優先、次にmdエディタ
  getInsertTarget() {
    const active = this.app.workspace.getActiveViewOfType(ItemView);
    const vt = active && active.getViewType && active.getViewType();
    if (vt === 'excalidraw' && this.getEA()) {
      return { mode: 'excalidraw', view: active };
    }
    const mdView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (mdView && mdView.editor) {
      return { mode: 'editor', editor: mdView.editor, sourcePath: mdView.file ? mdView.file.path : '' };
    }
    return null;
  }

  // Excalidraw の図が「指定した接頭辞」に一致するか（大文字小文字は無視・末尾の .excalidraw は外して判定）
  excalidrawPrefixMatches(file) {
    const list = (this.settings.excalidrawPrefixes || []).map((x) => x.toLowerCase());
    if (list.length === 0) return false;
    const base = file.basename.replace(/\.excalidraw$/i, '');
    const { prefix } = splitPrefix(base);
    return !!prefix && list.includes(prefix.toLowerCase());
  }

  // 対象ファイル一覧（Vault全体 or 任意フォルダ＋種別トグルで絞る）
  getSourceFiles() {
    const folders = (this.settings.folders || []).map((f) => f.replace(/\/+$/, '')).filter((f) => f !== '');
    const s = this.settings;
    return this.app.vault.getFiles().filter((f) => {
      const kind = fileKind(f);
      if (!kind) return false;
      if (kind === 'image' && !(s.imageExts || []).includes(f.extension.toLowerCase())) return false;
      if (kind === 'excalidraw' && !s.includeExcalidraw) return false;
      if (kind === 'excalidraw' && s.excalidrawPrefixOnly && !this.excalidrawPrefixMatches(f)) return false;
      if (folders.length === 0) return true; // Vault全体
      return folders.some((dir) => f.path === dir || f.path.startsWith(dir + '/'));
    });
  }

  // 接頭辞（' - ' の前）を集計 → [[prefix, count], …] 多い順
  detectPrefixes(files) {
    const counts = new Map();
    for (const f of files) {
      const { prefix } = splitPrefix(f.basename);
      if (prefix) counts.set(prefix, (counts.get(prefix) || 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }

  // 設定「接頭辞の出し方」を通した接頭辞一覧（挿入ピッカー・管理画面で共用）
  visiblePrefixes(files, scope = 'manager') {
    const s = this.settings;
    const mode = (scope === 'insert' ? s.insertPrefixMode : s.prefixMode) || 'auto';
    const list = scope === 'insert' ? s.insertPrefixWhitelist : s.prefixWhitelist;
    if (mode === 'off') return [];
    const detected = this.detectPrefixes(files);
    if (mode === 'whitelist') {
      const allow = new Set((list || []).map((p) => p.trim()).filter(Boolean));
      return detected.filter(([p]) => allow.has(p));
    }
    return detected;
  }

  // 参照情報が使える状態か：解析完了済み かつ 更新中でない（未準備・更新中は削除を止める）
  refsReady() {
    return this.linksReady && !this.linksDirty;
  }

  // file を参照しているノートのパス一覧を「今」の resolvedLinks から作る（画面のキャッシュを使わない）
  currentRefSources(file) {
    return [...(this.buildReverseLinks().get(file.path) || [])].sort();
  }

  // ── 参照（被リンク）：metadataCache.resolvedLinks の逆引き ─────────────
  // 戻り値：Map<targetPath, Set<sourcePath>>
  buildReverseLinks() {
    const rl = this.app.metadataCache.resolvedLinks || {};
    const rev = new Map();
    for (const src of Object.keys(rl)) {
      const targets = rl[src];
      for (const t of Object.keys(targets)) {
        if (!rev.has(t)) rev.set(t, new Set());
        rev.get(t).add(src);
      }
    }
    return rev;
  }

  // あるノートの中で file を指しているリンク・埋め込みを位置付きで返す
  // { removable: [{start,end,line,original,link}], frontmatter: n }
  collectRefsInNote(noteFile, targetFile) {
    const cache = this.app.metadataCache.getFileCache(noteFile);
    const out = { removable: [], frontmatter: 0 };
    if (!cache) return out;
    const hits = (ref) => {
      const dest = this.app.metadataCache.getFirstLinkpathDest(ref.link, noteFile.path);
      return dest && dest.path === targetFile.path;
    };
    for (const ref of [...(cache.links || []), ...(cache.embeds || [])]) {
      if (!ref.position || !hits(ref)) continue;
      out.removable.push({
        start: ref.position.start.offset,
        end: ref.position.end.offset,
        line: ref.position.start.line,
        original: ref.original,
        link: ref.link,
      });
    }
    for (const ref of (cache.frontmatterLinks || [])) {
      if (hits(ref)) out.frontmatter++;
    }
    out.removable.sort((a, b) => a.start - b.start);
    return out;
  }

  // ノート本文から file への参照だけを消す（行が空になれば行ごと消す）
  // oldFile への参照を newFile へ張り替える。戻り値 { changed, failed, frontmatter }（changed＝実際に書き換えた数）
  // ・Wikilink は fileToLinktext（曖昧なら経路付き）、Markdown リンクは encodeURI で書く
  // ・書く前に「新しいリンク文字列がこのノートから newFile に解決するか」を確かめ、しなければ触らず failed に数える
  async retargetRefsInNote(noteFile, oldFile, newFile) {
    const { removable, frontmatter } = this.collectRefsInNote(noteFile, oldFile);
    const res = { changed: 0, failed: 0, frontmatter };
    if (removable.length === 0) return res;
    const mc = this.app.metadataCache;
    const resolves = (text) => {
      const dest = mc.getFirstLinkpathDest(text, noteFile.path);
      return !!dest && dest.path === newFile.path;
    };
    // 候補：fileToLinktext（設定に従う）→ 名前だけ → Vault絶対パス。最初に解決するものを使う
    const candidates = [];
    if (typeof mc.fileToLinktext === 'function') candidates.push(mc.fileToLinktext(newFile, noteFile.path, false));
    candidates.push(newFile.name, newFile.path);
    const newTarget = candidates.find((c) => c && resolves(c));
    if (!newTarget) { res.failed = removable.length; return res; }
    await this.app.vault.process(noteFile, (content) => {
      let out = content;
      for (const r of [...removable].sort((a, b) => b.start - a.start)) {
        if (out.slice(r.start, r.end) !== r.original) { res.failed++; continue; } // キャッシュと本文がずれていたら触らない
        const replaced = rewriteRefText(r.original, r.link, newTarget);
        if (replaced === null) { res.failed++; continue; }
        out = out.slice(0, r.start) + replaced + out.slice(r.end);
        res.changed++;
      }
      return out;
    });
    return res;
  }

  // 「内部リンクを自動更新」設定（非公開API。読めなければ null）
  linksAutoUpdate() {
    try {
      const v = this.app.vault.getConfig && this.app.vault.getConfig('alwaysUpdateLinks');
      return typeof v === 'boolean' ? v : null;
    } catch (e) {
      return null;
    }
  }

  // ── 挿入ピッカー ─────────────────────────────────────
  startInsert(target) {
    const files = this.getSourceFiles();
    if (files.length === 0) {
      new Notice(tr('Insert Image Plus: 対象ファイルが見つかりません。設定の種別トグル／フォルダを確認してください。'));
      return;
    }

    // Step 1：カテゴリ（＝フィルタ軸）を選ぶ（接頭辞は設定「接頭辞の出し方」に従う）
    const prefixes = this.visiblePrefixes(files, 'insert');
    const categories = [];
    if ((this.settings.recent || []).length > 0) {
      categories.push({ id: '__recent__', label: tr('最近使った'), count: this.settings.recent.length });
    }
    categories.push({ id: '__all__', label: tr('すべて'), count: files.length });

    // 種別で絞る（有効かつ2種以上あるときだけ出す）
    const kindDefs = [
      { kind: 'image', label: tr('画像') },
      { kind: 'excalidraw', label: 'Excalidraw' },
    ];
    const kindCounts = {};
    for (const f of files) { const k = fileKind(f); kindCounts[k] = (kindCounts[k] || 0) + 1; }
    const presentKinds = kindDefs.filter((d) => kindCounts[d.kind] > 0);
    if (presentKinds.length >= 2) {
      for (const d of presentKinds) {
        categories.push({ id: 'kind:' + d.kind, label: d.label, count: kindCounts[d.kind] });
      }
    }

    for (const [prefix, count] of prefixes) {
      categories.push({ id: 'prefix:' + prefix, label: prefix, count });
    }

    new CategoryModal(this.app, categories, (cat) => {
      if (!cat) return;
      const filtered = this.filterByCategory(files, cat);
      this.openGrid(target, filtered, cat);
    }).open();
  }

  filterByCategory(files, cat) {
    if (cat.id === '__all__') return files;
    if (cat.id === '__recent__') {
      const map = new Map(files.map((f) => [f.path, f]));
      return (this.settings.recent || []).map((p) => map.get(p)).filter(Boolean);
    }
    if (cat.id.startsWith('kind:')) {
      const kind = cat.id.slice('kind:'.length);
      return files.filter((f) => fileKind(f) === kind);
    }
    if (cat.id.startsWith('prefix:')) {
      const prefix = cat.id.slice('prefix:'.length);
      return files.filter((f) => splitPrefix(f.basename).prefix === prefix);
    }
    return files;
  }

  openGrid(target, filtered, cat) {
    new ImageGridModal(this.app, this, {
      files: filtered,
      category: cat,
      onPick: (file) => this.insert(target, file),
      onBack: () => this.startInsert(target),
    }).open();
  }

  // 埋め込み用リンクターゲット。同名ファイルが別フォルダにあっても取り違えないよう、
  // Obsidian 公式の fileToLinktext（「新しいリンクの形式」設定に従い、曖昧なら経路付き）で作る。Excalidraw は .md を落とす
  linkTarget(file, sourcePath = '') {
    const mc = this.app.metadataCache;
    if (mc && typeof mc.fileToLinktext === 'function') return mc.fileToLinktext(file, sourcePath || '', true);
    return fileKind(file) === 'image' ? file.name : file.basename;
  }

  // 設定どおりの挿入テキスト
  linkText(file, sourcePath = '') {
    const width = (this.settings.defaultWidth || '').trim();
    const base = this.linkTarget(file, sourcePath);
    const inner = width ? `${base}|${width}` : base;
    return this.settings.insertFormat === 'wikilink' ? `[[${inner}]]` : `![[${inner}]]`;
  }

  insert(target, file) {
    if (target.mode === 'excalidraw') {
      this.insertToExcalidraw(target.view, file);
    } else {
      this.insertToEditor(target.editor, file, target.sourcePath);
    }
  }

  // mdエディタ：![[…]] をテキスト挿入
  insertToEditor(editor, file, sourcePath = '') {
    editor.replaceSelection(this.linkText(file, sourcePath));
    this.pushRecent(file);
    new Notice(tr('挿入：{name}', { name: file.name }));
  }

  // Excalidraw に置くときの長辺（px）。接頭辞ごとの指定 → 無ければ共通の既定。0＝Excalidraw に任せる
  excalidrawInsertSizeFor(file) {
    const base = file.basename.replace(/\.excalidraw$/i, '');
    const { prefix } = splitPrefix(base);
    const map = this.settings.excalidrawInsertSizes || {};
    if (prefix) {
      const key = Object.keys(map).find((k) => k.toLowerCase() === prefix.toLowerCase());
      if (key !== undefined) { const n = parseInt(map[key], 10); if (!isNaN(n)) return n; }
    }
    const n = parseInt(this.settings.excalidrawInsertSize, 10);
    return isNaN(n) ? 0 : n;
  }

  // Excalidrawキャンバス：画像エレメントとして配置
  async insertToExcalidraw(view, file) {
    const ea = this.getEA();
    if (!ea) {
      new Notice(tr('Excalidrawプラグインが見つかりません。'));
      return;
    }
    if (this.insertBusy) { new Notice(tr('前の挿入が終わるまで待ってください。')); return; }
    this.insertBusy = true;
    try {
      await this.withInsertEA(view, async (ea) => {
        // Excalidraw の addImage は「長辺 500px 超は 500px に縮小・以下はそのまま」の固定ルール。
        // 既定 0＝Excalidraw に任せる（長辺 500px）。小さく置きたい人は設定で長辺を指定できる
        const id = await ea.addImage(0, 0, file, true, true);
        const size = this.excalidrawInsertSizeFor(file);
        const el = id && typeof ea.getElement === 'function' ? ea.getElement(id) : null;
        if (el && size > 0) {
          const longest = Math.max(el.width || 0, el.height || 0);
          if (longest > 0) { const k = size / longest; el.width = el.width * k; el.height = el.height * k; }
        }
        await ea.addElementsToView(true, true);
      });
      this.pushRecent(file);
      new Notice(tr('Excalidrawに配置：{name}', { name: file.name }));
    } catch (e) {
      if (e && e.message === 'EA_NO_GETAPI') {
        new Notice(tr('お使いの Excalidraw プラグインが古く、独立した挿入 API（getAPI）がありません。Excalidraw を更新してからお試しください。'));
      } else {
        console.error('Insert Image Plus (Excalidraw) error:', e);
        new Notice(tr('Excalidrawへの配置に失敗しました。コンソールを確認してください。'));
      }
    } finally {
      this.insertBusy = false;
    }
  }

  pushRecent(file) {
    const recent = (this.settings.recent || []).filter((p) => p !== file.path);
    recent.unshift(file.path);
    this.settings.recent = recent.slice(0, this.settings.recentLimit || 40);
    this.saveSettings();
  }

  // Excalidraw の図の「重さ」＝ 図のファイル＋その図がリンクしている画像（## Embedded Files の [[…]]）の合計バイト。
  // metadataCache.resolvedLinks を引くだけなのでファイルは開かない。md 本体が小さくても埋め込み画像が数十MBの図があるため、合計で見る。
  excalidrawWeight(file) {
    let total = (file.stat && file.stat.size) || 0;
    const links = (this.app.metadataCache.resolvedLinks || {})[file.path] || {};
    for (const target of Object.keys(links)) {
      const t = this.app.vault.getAbstractFileByPath(target);
      if (t instanceof TFile && t.stat) total += t.stat.size || 0;
    }
    return total;
  }

  // ── サムネ描画（ピッカーと管理画面で共用） ────────────────
  // thumbEl に file のサムネを描く。img は遅延（io に登録）。
  renderThumb(thumbEl, file, io) {
    const kind = fileKind(file);
    const tooHeavy = kind === 'excalidraw' && this.excalidrawWeight(file) > EXCALIDRAW_THUMB_MAX_BYTES;
    const wantExcaliThumb = kind === 'excalidraw' && this.settings.excalidrawThumbnails && this.getEA() && !tooHeavy;
    if (kind === 'image') {
      const img = thumbEl.createEl('img');
      img.dataset.src = this.app.vault.getResourcePath(file);
      img.loading = 'lazy';
      if (io) io.observe(img); else img.src = img.dataset.src;
    } else if (wantExcaliThumb) {
      thumbEl.addClass('yosuke-ii-thumb--placeholder');
      thumbEl.dataset.exPath = file.path;
      thumbEl.createEl('div', { text: 'Excalidraw', cls: 'yosuke-ii-kind' });
      if (io) io.observe(thumbEl); else this.renderExcalidrawThumb(thumbEl);
    } else {
      thumbEl.addClass('yosuke-ii-thumb--placeholder');
      // 5MB超の図はサムネを描かない理由をカードに出す（「出ない」でなく「重いから出していない」と分かるように）
      thumbEl.createEl('div', { text: tooHeavy ? tr('5MB超') : 'Excalidraw', cls: 'yosuke-ii-kind' });
    }
  }

  // 見えた要素のサムネを遅延ロード（画像=src / Excalidraw=SVG生成）
  loadThumb(el) {
    if (el.tagName === 'IMG') {
      if (el.dataset.src && !el.src) el.src = el.dataset.src;
    } else if (el.dataset.exPath) {
      this.renderExcalidrawThumb(el);
    }
  }

  // ── サムネキャッシュ：path → SVG文字列。LRU（件数上限）＋版（生成中の変更を捨てる）。失敗は保持しない ──
  svgVersionOf(path) { return this.svgVersion.get(path) || 0; }
  invalidateSvg(path) {
    this.svgCache.delete(path);
    this.svgVersion.set(path, this.svgVersionOf(path) + 1);
  }
  svgCacheGet(path) {
    const v = this.svgCache.get(path);
    if (v !== undefined) { this.svgCache.delete(path); this.svgCache.set(path, v); } // 触ったものを新しい側へ
    return v;
  }
  svgCacheSet(path, xml) {
    this.svgCache.set(path, xml);
    while (this.svgCache.size > SVG_CACHE_MAX) this.svgCache.delete(this.svgCache.keys().next().value);
  }
  // Vault の変更：その図＋その画像を埋め込んでいる図のサムネを捨てる（リネームは旧パスも）
  onVaultChange(file, oldPath) {
    if (!file) return;
    // 早期 return はしない：初回生成中（キャッシュも版も空）に来た変更も版を進めて、古い生成結果を採用させない
    const paths = new Set([file.path]);
    if (oldPath) paths.add(oldPath);
    const rl = this.app.metadataCache.resolvedLinks || {};
    for (const src of Object.keys(rl)) {
      const t = rl[src];
      if (t[file.path] || (oldPath && t[oldPath])) paths.add(src);
    }
    for (const p of paths) this.invalidateSvg(p);
  }

  // Excalidraw をサムネ専用 EA の createSVG でその場描画（メモリのみ・ファイル生成なし）
  async renderExcalidrawThumb(thumb, attempt = 0) {
    const path = thumb.dataset.exPath;
    const ver = this.svgVersionOf(path);
    let xml = this.svgCacheGet(path);
    if (xml === undefined) {
      if (!this.getThumbEA()) return;
      let svg = null;
      try {
        svg = await this.thumbCreateSVG(path);
      } catch (e) {
        console.error('Insert Image Plus: Excalidraw thumbnail error', path, e);
        return; // 失敗はキャッシュしない（次に見えたときにもう一度試す）
      }
      if (!svg) return;
      svg.removeAttribute('width');
      svg.removeAttribute('height');
      xml = new XMLSerializer().serializeToString(svg);
      if (this.svgVersionOf(path) !== ver) {
        // 生成中に図が変わった → 古い結果は画面にもキャッシュにも出さず、新しい版で描き直す（2回まで）
        if (attempt < 2 && thumb.isConnected) return this.renderExcalidrawThumb(thumb, attempt + 1);
        return;
      }
      this.svgCacheSet(path, xml);
    }
    if (!thumb.isConnected) return; // 画面が閉じていたら描かない
    const el = this.isolateSvgIds(xml);
    if (!el) return; // 隔離できない SVG は描かない（混線を防ぐ方を優先）＝プレースホルダーのまま
    thumb.empty();
    thumb.removeClass('yosuke-ii-thumb--placeholder');
    const wrap = thumb.createDiv({ cls: 'yosuke-ii-svg' });
    wrap.appendChild(el);
  }

  // Excalidraw の SVG は埋め込み画像を <symbol id="image-…"> ＋ <use href="#image-…"> で持つ。
  // 同じ画面に何十枚もインラインで並べると id が重複し、ブラウザは最初の図の画像を全部の図に描いてしまう（画像の混線）。
  // → 複製ごとに id と参照（href="#…" / url(#…)）を一意な接頭辞で書き換えて隔離する
  // SVG文字列を受け取り、id を付け替えた要素を返す。失敗したら null（未隔離のまま描くことはしない）
  isolateSvgIds(xml) {
    const uid = 'ii' + (++this.svgSeq) + '-';
    const out = xml
      .replace(/\sid="([^"]+)"/g, (m, id) => ` id="${uid}${id}"`)
      .replace(/(xlink:href|href)="#([^"]+)"/g, (m, attr, id) => `${attr}="#${uid}${id}"`)
      .replace(/url\(#([^)]+)\)/g, (m, id) => `url(#${uid}${id})`);
    try {
      const doc = new DOMParser().parseFromString(out, 'image/svg+xml');
      const el = doc.documentElement;
      if (!el || el.nodeName === 'parsererror' || el.querySelector('parsererror')) return null;
      return document.importNode(el, true);
    } catch (e) {
      return null;
    }
  }

  // ── 1枚操作（管理画面から呼ぶ） ─────────────────────────
  openInObsidian(file) {
    this.app.workspace.getLeaf('tab').openFile(file);
  }

  openWithDefaultApp(file) {
    const fn = this.app.openWithDefaultApp;
    if (typeof fn !== 'function') { new Notice(tr('この環境ではOS標準アプリで開けません。')); return; }
    fn.call(this.app, file.path);
  }

  showInFolder(file) {
    const fn = this.app.showInFolder;
    if (typeof fn !== 'function') { new Notice(tr('この環境ではファイルの場所を表示できません。')); return; }
    fn.call(this.app, file.path);
  }

  async copyLink(file) {
    const active = this.app.workspace.getActiveFile();
    const text = this.linkText(file, active ? active.path : '');
    try {
      await navigator.clipboard.writeText(text);
      new Notice(tr('コピー：{text}', { text }));
    } catch (e) {
      new Notice(tr('クリップボードに書けませんでした。'));
    }
  }

  // リネーム（フォルダはそのまま。Obsidian がリンクを書き換える＝「内部リンクを自動更新」ON が前提）
  async renameFile(file, newBasenameWithoutExt) {
    if (this.linksAutoUpdate() !== true) { new Notice(tr('Obsidian設定「ファイルとリンク → 内部リンクを自動更新」がONのときだけリネームできます（OFFだとリンクが切れるため）。')); return null; }
    const folder = file.parent && file.parent.path && file.parent.path !== '/' ? file.parent.path + '/' : '';
    const ext = file.name.toLowerCase().endsWith('.excalidraw.md') ? 'excalidraw.md' : file.extension;
    let base = newBasenameWithoutExt.trim();
    if (ext === 'excalidraw.md') base = base.replace(/\.excalidraw$/i, '');
    if (!base) { new Notice(tr('ファイル名を入力してください。')); return null; }
    if (/[\\/:*?tr("<>|]/.test(base)) { new Notice('使えない文字が入っています（\\ / : * ? ") < > |）。'); return null; }
    const newPath = normalizePath(`${folder}${base}.${ext}`);
    if (newPath === file.path) return file;
    if (this.app.vault.getAbstractFileByPath(newPath)) { new Notice(tr('同じ名前のファイルがあります。')); return null; }
    await this.app.fileManager.renameFile(file, newPath);
    new Notice(tr('リネーム：{name}', { name: `${base}.${ext}` }));
    return this.app.vault.getAbstractFileByPath(newPath);
  }

  // 移動（同名衝突は止める）
  async moveFile(file, folder) {
    if (this.linksAutoUpdate() !== true) { new Notice(tr('Obsidian設定「ファイルとリンク → 内部リンクを自動更新」がONのときだけ移動できます（OFFだとリンクが切れるため）。')); return null; }
    const dir = folder.path === '/' ? '' : folder.path + '/';
    const newPath = normalizePath(`${dir}${file.name}`);
    if (newPath === file.path) { new Notice(tr('すでにそのフォルダにあります。')); return file; }
    if (this.app.vault.getAbstractFileByPath(newPath)) { new Notice(tr('移動先に同じ名前のファイルがあります。')); return null; }
    await this.app.fileManager.renameFile(file, newPath);
    new Notice(tr('移動：{folder}', { folder: folder.path === '/' ? tr('（ルート）') : folder.path }));
    return this.app.vault.getAbstractFileByPath(newPath);
  }

  // WebP変換：新ファイル作成 → 参照を張り替え（実行直前に取り直す）。元画像は常に残す（検出できない参照があり得るため、消す判断はしない）
  async convertToWebp(file) {
    const ext = file.extension.toLowerCase();
    if (!WEBP_SOURCE_EXTS.includes(ext)) { new Notice(tr('この形式は変換しません：{name}', { name: file.name })); return null; }
    if (this.webpSupported === false) { new Notice(tr('この環境の描画エンジンはWebP書き出しに対応していません。')); return null; }
    let buf;
    try {
      buf = await this.encodeToWebp(file);
    } catch (e) {
      console.error('Insert Image Plus: WebP encode failed', file.path, e);
      new Notice(tr('変換に失敗：{name}', { name: file.name }));
      return null;
    }
    const folder = file.parent && file.parent.path && file.parent.path !== '/' ? file.parent.path + '/' : '';
    let newPath = normalizePath(`${folder}${file.basename}.webp`);
    let n = 1;
    while (this.app.vault.getAbstractFileByPath(newPath)) {
      newPath = normalizePath(`${folder}${file.basename} ${n}.webp`);
      n++;
    }
    const newFile = await this.app.vault.createBinary(newPath, buf);
    // 参照は実行直前に取り直す（確認ダイアログを出している間に変わり得る）
    const refSources = [...(this.buildReverseLinks().get(file.path) || [])];
    const sum = { changed: 0, failed: 0, frontmatter: 0 };
    for (const srcPath of refSources) {
      const note = this.app.vault.getAbstractFileByPath(srcPath);
      if (!(note instanceof TFile)) continue;
      const r = await this.retargetRefsInNote(note, file, newFile);
      sum.changed += r.changed; sum.failed += r.failed; sum.frontmatter += r.frontmatter;
    }
    new Notice(tr('WebPに変換：{name}（{size}・参照 {changed} 件を更新{failed}{fm}・元の画像は残しています）', {
      name: newFile.name, size: humanSize(buf.byteLength), changed: sum.changed,
      failed: sum.failed ? tr('・{n} 件は未更新', { n: sum.failed }) : '',
      fm: sum.frontmatter ? tr('・frontmatter の参照 {n} 件は手で直してください', { n: sum.frontmatter }) : '',
    }));
    return newFile;
  }

  async encodeToWebp(file) {
    const buf = await this.app.vault.readBinary(file);
    const bitmap = await createImageBitmap(new Blob([buf]));
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    canvas.getContext('2d').drawImage(bitmap, 0, 0);
    if (bitmap.close) bitmap.close();
    const q = Math.min(1, Math.max(0.1, Number(this.settings.webpQuality) || 0.8));
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob null'))), 'image/webp', q);
    });
    if (blob.type !== 'image/webp') throw new Error('WebP not supported');
    return await blob.arrayBuffer();
  }

  // 削除（ゴミ箱へ＝Obsidianの「削除したファイル」設定に従う）
  async trashFile(file) {
    await this.app.fileManager.trashFile(file);
    this.settings.recent = (this.settings.recent || []).filter((p) => p !== file.path);
    await this.saveSettings();
    new Notice(tr('削除：{name}（Obsidian の削除設定に従って処理しました）', { name: file.name }));
  }

  async loadSettings() {
    const data = (await this.loadData()) || {};
    this.settings = Object.assign({}, DEFAULT_SETTINGS, data);
    // v0.2.0 の includeImages（1トグル）→ imageExts（拡張子ごと）へ移行
    if (!Array.isArray(data.imageExts)) this.settings.imageExts = data.includeImages === false ? [] : [...IMAGE_EXTS];
    delete this.settings.includeImages;
    delete this.settings.includeMd;
    delete this.settings.webpDeleteOriginal; // v0.3.0：WebP変換後の元画像は常に残す（設定を廃止）
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
};

// ── Step 1：カテゴリ選択 ─────────────────────────────
class CategoryModal extends FuzzySuggestModal {
  constructor(app, categories, onChoose) {
    super(app);
    this.categories = categories;
    this.onChoose = onChoose;
    this.setPlaceholder(tr('カテゴリ（接頭辞）を選ぶ… 例：icon / logo'));
  }
  getItems() { return this.categories; }
  getItemText(cat) { return `${cat.label} (${cat.count})`; }
  onChooseItem(cat) { this.onChoose(cat); }
}

// ── Step 2：ビジュアルグリッド（挿入ピッカー） ───────────────
class ImageGridModal extends Modal {
  constructor(app, plugin, { files, category, onPick, onBack }) {
    super(app);
    this.plugin = plugin;
    this.allFiles = files;
    this.category = category;
    this.onPick = onPick;
    this.onBack = onBack;
    this.rendered = 0;
    this.io = null;
    this.sentinelIo = null;
  }

  onOpen() {
    this.modalEl.addClass('yosuke-ii-modal');
    const { contentEl } = this;
    contentEl.empty();

    const header = contentEl.createEl('div', { cls: 'yosuke-ii-header' });
    const back = header.createEl('button', { text: tr('← 戻る'), cls: 'yosuke-ii-back' });
    back.addEventListener('click', () => { this.close(); this.onBack(); });
    header.createEl('span', { text: this.category.label, cls: 'yosuke-ii-cat' });
    this.countEl = header.createEl('span', { cls: 'yosuke-ii-count' });

    this.search = contentEl.createEl('input', { type: 'text', cls: 'yosuke-ii-search' });
    this.search.placeholder = tr('ファイル名で絞り込み…');
    this.search.addEventListener('input', () => this.applyFilter());
    this.search.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (this.filtered.length > 0) this.pick(this.filtered[0]);
      } else if (e.key === 'Escape') {
        this.close();
      }
    });

    this.grid = contentEl.createEl('div', { cls: 'yosuke-ii-grid' });
    const isMobile = !!(Platform && Platform.isMobile);
    const raw = isMobile ? this.plugin.settings.pickerColumnsMobile : this.plugin.settings.pickerColumns;
    const cols = Math.min(8, Math.max(2, parseInt(raw, 10) || (isMobile ? 3 : 5)));
    this.grid.style.setProperty('--yosuke-ii-cols', String(cols));
    // 追加読み込みの目印は「スクロールする要素＝grid」の中に置く（外だと IntersectionObserver の root から見えず発火しない）
    this.sentinel = this.grid.createEl('div', { cls: 'yosuke-ii-sentinel' });

    this.io = new IntersectionObserver((entries) => {
      for (const ent of entries) {
        if (ent.isIntersecting) {
          this.plugin.loadThumb(ent.target);
          this.io.unobserve(ent.target);
        }
      }
    }, { root: this.grid, rootMargin: '200px' });

    this.sentinelIo = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) this.renderMore();
    }, { root: this.grid, rootMargin: '300px' });
    this.sentinelIo.observe(this.sentinel);

    this.applyFilter();
    setTimeout(() => this.search.focus(), 0);
  }

  applyFilter() {
    const q = (this.search.value || '').toLowerCase().trim();
    this.rendered = 0;
    this.grid.empty();
    this.grid.appendChild(this.sentinel); // 検索で一覧を消しても目印は残す

    // 件数が多いカテゴリ（実質「すべて」）は検索ファースト
    const SEARCH_FIRST_THRESHOLD = 300;
    if (!q && this.allFiles.length > SEARCH_FIRST_THRESHOLD) {
      this.filtered = [];
      this.countEl.setText(tr('{n} 件', { n: this.allFiles.length }));
      this.grid.createEl('div', {
        text: tr('🔍 キーワードで検索してね（{n} 件・多すぎるので全表示はしません）', { n: this.allFiles.length }),
        cls: 'yosuke-ii-hint',
      });
      return;
    }

    this.filtered = q
      ? this.allFiles.filter((f) => f.basename.toLowerCase().includes(q))
      : this.allFiles.slice();
    this.countEl.setText(tr('{n} 件', { n: this.filtered.length }));
    this.renderMore();
  }

  renderMore() {
    const batch = this.plugin.settings.batchSize || 80;
    const end = Math.min(this.rendered + batch, this.filtered.length);
    for (let i = this.rendered; i < end; i++) {
      this.renderCell(this.filtered[i]);
    }
    this.rendered = end;
    this.grid.appendChild(this.sentinel); // 目印を常に末尾へ
    // まだ残りがあり、目印が見えたままなら次のバッチへ（observe し直すと現状で1回コールバックが来る）
    if (this.rendered < this.filtered.length && this.sentinelIo) {
      this.sentinelIo.unobserve(this.sentinel);
      this.sentinelIo.observe(this.sentinel);
    }
  }

  renderCell(file) {
    const kind = fileKind(file);
    const cell = this.grid.createEl('div', { cls: 'yosuke-ii-cell' });
    cell.setAttr('title', file.name);
    cell.addEventListener('click', () => this.pick(file));

    const thumb = cell.createEl('div', { cls: 'yosuke-ii-thumb' });
    this.plugin.renderThumb(thumb, file, this.io);

    // 名前（接頭辞は落として内容だけ表示）
    let display = file.basename;
    if (kind === 'excalidraw') display = display.replace(/\.excalidraw$/i, '');
    display = splitPrefix(display).body;
    cell.createEl('div', { text: display, cls: 'yosuke-ii-name' });
  }

  pick(file) {
    this.close();
    this.onPick(file);
  }

  onClose() {
    if (this.io) this.io.disconnect();
    if (this.sentinelIo) this.sentinelIo.disconnect();
    this.contentEl.empty();
  }
}

// ── 管理画面（タブとして開く） ───────────────────────────
class ImageManagerView extends ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.folder = '';          // '' = すべて
    this.prefix = null;        // null = すべて / '__none__' = 接頭辞なし / 文字列
    this.query = '';
    this.sortKey = 'name';     // 'name' | 'mtime' | 'size' | 'refs'
    this.sortDesc = false;
    this.rendered = 0;
    this.io = null;
    this.sentinelIo = null;
    this.refreshTimer = null;
    this.detail = null;        // 開いている DetailModal
  }

  getViewType() { return MANAGER_VIEW_TYPE; }
  getDisplayText() { return 'Insert Image Plus'; }
  getIcon() { return 'gallery-thumbnails'; }

  async onOpen() {
    const root = this.contentEl;
    root.empty();
    root.addClass('yosuke-im');

    this.topEl = root.createDiv({ cls: 'yosuke-im-top' });
    this.gridWrap = root.createDiv({ cls: 'yosuke-im-gridwrap' });
    this.grid = this.gridWrap.createDiv({ cls: 'yosuke-im-grid' });
    this.sentinel = this.gridWrap.createDiv({ cls: 'yosuke-ii-sentinel' });

    this.io = new IntersectionObserver((entries) => {
      for (const ent of entries) {
        if (ent.isIntersecting) {
          this.plugin.loadThumb(ent.target);
          this.io.unobserve(ent.target);
        }
      }
    }, { root: this.gridWrap, rootMargin: '200px' });
    this.sentinelIo = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) this.renderMore();
    }, { root: this.gridWrap, rootMargin: '300px' });
    this.sentinelIo.observe(this.sentinel);

    // Vault の変化で再描画（まとめて 300ms 後）
    const schedule = () => {
      if (this.refreshTimer) clearTimeout(this.refreshTimer);
      this.refreshTimer = setTimeout(() => this.refresh(), 300);
    };
    this.registerEvent(this.app.vault.on('create', schedule));
    this.registerEvent(this.app.vault.on('delete', schedule));
    this.registerEvent(this.app.vault.on('rename', schedule));
    this.registerEvent(this.app.metadataCache.on('resolved', schedule));

    this.setupDrop(root);
    this.refresh();
  }

  // ── OSからのドラッグ＆ドロップで画像を追加（Obsidian内部のドラッグは触らない） ──
  setupDrop(root) {
    this.dropOverlay = root.createDiv({ cls: 'yosuke-im-drop' });
    this.dropOverlay.createDiv({ cls: 'yosuke-im-drop-icon' });
    setIcon(this.dropOverlay.querySelector('.yosuke-im-drop-icon'), 'image-plus');
    this.dropText = this.dropOverlay.createDiv({ cls: 'yosuke-im-drop-text' });

    const hasOsFiles = (e) => e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files');
    let depth = 0;
    this.registerDomEvent(root, 'dragenter', (e) => {
      if (!hasOsFiles(e)) return;
      e.preventDefault();
      depth++;
      this.dropText.setText(tr('ここにドロップして追加 → {target}', { target: this.dropTargetLabel() }));
      root.addClass('is-dragover');
    });
    this.registerDomEvent(root, 'dragover', (e) => {
      if (!hasOsFiles(e)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    });
    this.registerDomEvent(root, 'dragleave', (e) => {
      if (!hasOsFiles(e)) return;
      depth = Math.max(0, depth - 1);
      if (depth === 0) root.removeClass('is-dragover');
    });
    this.registerDomEvent(root, 'drop', (e) => {
      if (!hasOsFiles(e)) return;
      e.preventDefault();
      depth = 0;
      root.removeClass('is-dragover');
      this.handleDrop(Array.from(e.dataTransfer.files || []));
    });
  }

  // 保存先：選択中のフォルダ。「すべて」のときは Obsidian の添付ファイル既定フォルダ
  dropTargetFolder() {
    if (this.folder && this.folder !== '/') return this.folder;
    return null;
  }
  dropTargetLabel() {
    const f = this.dropTargetFolder();
    return f ? f : tr('添付ファイルの既定フォルダ');
  }

  async handleDrop(files) {
    const exts = this.plugin.settings.imageExts || [];
    const images = files.filter((f) => exts.includes((f.name.split('.').pop() || '').toLowerCase()));
    if (images.length === 0) {
      new Notice(tr('画像ファイル（png / jpg / svg / webp / gif / avif / bmp）だけ追加できます。'));
      return;
    }
    if (images.length < files.length) new Notice(tr('画像以外の {n} 件は飛ばします。', { n: files.length - images.length }));
    const prefixes = this.plugin.detectPrefixes(this.allFiles).map(([p]) => p);
    const current = this.prefix && this.prefix !== '__none__' ? this.prefix : '';
    new DropNameModal(this.app, images, prefixes, current, this.dropTargetLabel(), async (prefix, singleBody) => {
      let done = 0;
      for (const f of images) {
        try {
          const ext = (f.name.split('.').pop() || '').toLowerCase();
          const origBase = f.name.replace(/\.[^.]+$/, '');
          const body = (images.length === 1 && singleBody) ? singleBody : origBase;
          const base = prefix ? `${prefix}${PREFIX_SEP}${body}` : body;
          const path = await this.resolveDropPath(base, ext);
          const buf = await f.arrayBuffer();
          await this.app.vault.createBinary(path, buf);
          done++;
        } catch (err) {
          console.error('Insert Image Plus: drop add failed', f.name, err);
          new Notice(tr('追加に失敗：{name}', { name: f.name }));
        }
      }
      if (done > 0) new Notice(tr('{n} 件を追加しました → {target}', { n: done, target: this.dropTargetLabel() }));
      if (prefix) this.prefix = prefix;
    }).open();
  }

  // 保存パスを決める（同名があれば末尾に番号）
  async resolveDropPath(base, ext) {
    const folder = this.dropTargetFolder();
    if (!folder) {
      // 添付ファイルの既定フォルダ（Obsidian設定に従う・衝突回避も任せる）
      return await this.app.fileManager.getAvailablePathForAttachment(`${base}.${ext}`, '');
    }
    let path = normalizePath(`${folder}/${base}.${ext}`);
    let n = 1;
    while (this.app.vault.getAbstractFileByPath(path)) {
      path = normalizePath(`${folder}/${base} ${n}.${ext}`);
      n++;
    }
    return path;
  }

  async onClose() {
    if (this.io) this.io.disconnect();
    if (this.sentinelIo) this.sentinelIo.disconnect();
    if (this.refreshTimer) clearTimeout(this.refreshTimer);
  }

  // データを取り直して全部描く
  refresh() {
    this.allFiles = this.plugin.getSourceFiles();
    this.reverse = this.plugin.buildReverseLinks();
    this.renderTop();
    this.applyFilter();
    if (this.detail) this.detail.refresh();
  }

  refCount(file) {
    const s = this.reverse.get(file.path);
    return s ? s.size : 0;
  }
  refSources(file) {
    return [...(this.reverse.get(file.path) || [])].sort();
  }

  folderOf(f) { return f.parent && f.parent.path ? f.parent.path : '/'; }

  // フォルダ候補：対象ファイルの親フォルダ（重複なし・パス順）
  folderOptions() {
    const set = new Set();
    for (const f of this.allFiles) set.add(this.folderOf(f));
    return [...set].sort((a, b) => a.localeCompare(b, 'ja'));
  }

  filesInFolder() {
    if (!this.folder) return this.allFiles;
    return this.allFiles.filter((f) => this.folderOf(f) === this.folder);
  }

  // 接頭辞候補（モードに従う）
  prefixOptions(files) {
    return this.plugin.visiblePrefixes(files, 'manager');
  }

  renderTop() {
    const top = this.topEl;
    top.empty();

    // タイトル：プラグイン名、その下に画面名
    const title = top.createDiv({ cls: 'yosuke-im-title' });
    title.createDiv({ cls: 'yosuke-im-brand', text: 'Insert Image Plus' });
    title.createDiv({ cls: 'yosuke-im-sub', text: tr('画像を管理する') });

    // 1段目：フォルダ／検索／並び替え／件数
    const row1 = top.createDiv({ cls: 'yosuke-im-row' });
    const folderSel = row1.createEl('select', { cls: 'dropdown yosuke-im-folder' });
    folderSel.createEl('option', { value: '', text: tr('すべてのフォルダ（{n}）', { n: this.allFiles.length }) });
    for (const dir of this.folderOptions()) {
      const n = this.allFiles.filter((f) => this.folderOf(f) === dir).length;
      folderSel.createEl('option', { value: dir, text: tr('{dir}（{n}）', { dir: dir === '/' ? tr('（ルート）') : dir, n }) });
    }
    folderSel.value = this.folder;
    folderSel.addEventListener('change', () => { this.folder = folderSel.value; this.prefix = null; this.renderTop(); this.applyFilter(); });

    const searchWrap = row1.createDiv({ cls: 'yosuke-im-searchwrap' });
    const sIcon = searchWrap.createSpan({ cls: 'yosuke-im-searchicon' }); setIcon(sIcon, 'search');
    const search = searchWrap.createEl('input', { type: 'search', cls: 'yosuke-im-search' });
    search.placeholder = tr('ファイル名で絞り込み…');
    search.value = this.query;
    search.addEventListener('input', () => { this.query = search.value; this.applyFilter(); });

    const sortSel = row1.createEl('select', { cls: 'dropdown yosuke-im-sort' });
    for (const [k, label] of [['name', tr('名前順')], ['ctime', tr('作成日順')], ['mtime', tr('更新日順')], ['size', tr('サイズ順')], ['refs', tr('参照数順')]]) {
      sortSel.createEl('option', { value: k, text: label });
    }
    sortSel.value = this.sortKey;
    sortSel.addEventListener('change', () => { this.sortKey = sortSel.value; this.applyFilter(); });
    const dirBtn = row1.createEl('button', { cls: 'clickable-icon yosuke-im-iconbtn' });
    setIcon(dirBtn, this.sortDesc ? 'arrow-down-wide-narrow' : 'arrow-up-narrow-wide');
    dirBtn.setAttr('aria-label', this.sortDesc ? tr('降順') : tr('昇順'));
    dirBtn.addEventListener('click', () => { this.sortDesc = !this.sortDesc; this.renderTop(); this.applyFilter(); });

    this.countEl = row1.createSpan({ cls: 'yosuke-im-count' });

    // 2段目：接頭辞チップ（＝この画面の主役）
    const files = this.filesInFolder();
    const prefixes = this.prefixOptions(files);
    const mode = this.plugin.settings.prefixMode || 'auto';
    if (mode !== 'off') {
      const row2 = top.createDiv({ cls: 'yosuke-im-row yosuke-im-chips' });
      const chip = (label, value, count) => {
        const b = row2.createEl('button', { cls: 'yosuke-im-chip' });
        b.createSpan({ text: label });
        if (count !== undefined) b.createSpan({ cls: 'yosuke-im-chip-n', text: String(count) });
        if (this.prefix === value) b.addClass('is-active');
        b.addEventListener('click', () => { this.prefix = value; this.renderTop(); this.applyFilter(); });
      };
      chip(tr('すべて'), null, files.length);
      for (const [p, n] of prefixes) chip(p, p, n);
      const none = files.filter((f) => !splitPrefix(f.basename).prefix).length;
      if (none > 0 && prefixes.length > 0) chip(tr('接頭辞なし'), '__none__', none);
      if (prefixes.length === 0) {
        row2.createSpan({
          cls: 'yosuke-im-muted',
          text: mode === 'whitelist' ? tr('指定の接頭辞に一致するファイルがありません（設定で追加）') : tr('「接頭辞 - 内容」の形のファイルがありません'),
        });
      }
    }
  }

  sortFiles(files) {
    const k = this.sortKey;
    const cmp = (a, b) => {
      if (k === 'ctime') return a.stat.ctime - b.stat.ctime;
      if (k === 'mtime') return a.stat.mtime - b.stat.mtime;
      if (k === 'size') return a.stat.size - b.stat.size;
      if (k === 'refs') return this.refCount(a) - this.refCount(b) || a.basename.localeCompare(b.basename, 'ja');
      return a.basename.localeCompare(b.basename, 'ja');
    };
    const out = files.slice().sort(cmp);
    return this.sortDesc ? out.reverse() : out;
  }

  applyFilter() {
    let files = this.filesInFolder();
    if (this.prefix === '__none__') files = files.filter((f) => !splitPrefix(f.basename).prefix);
    else if (this.prefix) files = files.filter((f) => splitPrefix(f.basename).prefix === this.prefix);
    const q = this.query.toLowerCase().trim();
    if (q) files = files.filter((f) => f.basename.toLowerCase().includes(q));
    this.filtered = this.sortFiles(files);
    this.countEl.setText(tr('{n} 件', { n: files.length }));
    this.rendered = 0;
    this.grid.empty();
    if (files.length === 0) {
      this.grid.createDiv({ text: tr('該当するファイルがありません'), cls: 'yosuke-ii-hint' });
      return;
    }
    this.renderMore();
  }

  renderMore() {
    if (!this.filtered) return;
    const batch = this.plugin.settings.batchSize || 80;
    const end = Math.min(this.rendered + batch, this.filtered.length);
    for (let i = this.rendered; i < end; i++) this.renderCell(this.filtered[i]);
    this.rendered = end;
    if (this.rendered < this.filtered.length && this.sentinelIo && this.sentinel) {
      this.sentinelIo.unobserve(this.sentinel);
      this.sentinelIo.observe(this.sentinel);
    }
  }

  renderCell(file) {
    const kind = fileKind(file);
    const card = this.grid.createDiv({ cls: 'yosuke-im-card' });
    card.dataset.path = file.path;
    card.setAttr('title', file.path);
    card.addEventListener('click', () => this.openDetail(file));
    card.addEventListener('dblclick', (e) => { e.stopPropagation(); this.plugin.openInObsidian(file); });

    // サムネ枠
    const frame = card.createDiv({ cls: 'yosuke-im-frame' });
    const thumb = frame.createDiv({ cls: 'yosuke-ii-thumb yosuke-im-thumb' });
    this.plugin.renderThumb(thumb, file, this.io);

    // 左上：参照数／右上：種別
    if (this.plugin.settings.showRefBadge) {
      const n = this.refCount(file);
      const badge = frame.createDiv({ cls: 'yosuke-im-badge' + (n === 0 ? ' is-zero' : '') });
      badge.setText(tr('{n} 参照', { n }));
      badge.setAttr('aria-label', tr('検出できた参照 {n}', { n }));
    }
    frame.createDiv({ cls: 'yosuke-im-ext', text: kind === 'excalidraw' ? 'EXCALIDRAW' : file.extension.toUpperCase() });

    // ホバー操作（4つ）
    const tools = frame.createDiv({ cls: 'yosuke-im-tools' });
    const tool = (icon, label, fn) => {
      const b = tools.createEl('button', { cls: 'clickable-icon yosuke-im-tool' });
      setIcon(b, icon);
      b.setAttr('aria-label', label);
      b.addEventListener('click', (e) => { e.stopPropagation(); fn(); });
    };
    tool('file', tr('Obsidianで開く'), () => this.plugin.openInObsidian(file));
    tool('copy', tr('リンクをコピー'), () => this.plugin.copyLink(file));
    tool('pencil', tr('リネーム'), () => this.openRename(file));
    tool('trash', tr('削除'), () => this.confirmDelete(file));

    // 名前（接頭辞はチップ・内容は本文）
    let display = file.basename;
    if (kind === 'excalidraw') display = display.replace(/\.excalidraw$/i, '');
    const { prefix, body } = splitPrefix(display);
    const nameRow = card.createDiv({ cls: 'yosuke-im-cardname' });
    if (prefix) nameRow.createSpan({ cls: 'yosuke-im-prefix', text: prefix });
    nameRow.createSpan({ cls: 'yosuke-im-cardbody', text: prefix ? body : display });

    // メタ（サイズ・更新日）
    const meta = card.createDiv({ cls: 'yosuke-im-cardmeta' });
    meta.createSpan({ text: humanSize(file.stat.size) });
    meta.createSpan({ text: formatDate(file.stat.mtime).slice(0, 10) });
  }

  // ── 詳細（モーダル） ──
  openDetail(file) {
    if (this.detail) this.detail.close();
    this.detail = new DetailModal(this.app, this.plugin, this, file);
    this.detail.open();
  }

  // ── 操作（カード・詳細の両方から呼ぶ） ──
  openRename(file, after) {
    const prefixes = this.plugin.detectPrefixes(this.allFiles).map(([p]) => p);
    new RenameModal(this.app, file, prefixes, async (newBase) => {
      const nf = await this.plugin.renameFile(file, newBase);
      if (after) after(nf instanceof TFile ? nf : null);
    }).open();
  }

  openMove(file, after) {
    new FolderSuggestModal(this.app, async (folder) => {
      const nf = await this.plugin.moveFile(file, folder);
      if (after) after(nf instanceof TFile ? nf : null);
    }).open();
  }

  confirmWebp(file, after) {
    const refs = this.refSources(file);
    const lines = [
      tr('{name} を WebP に変換します。', { name: file.name }),
      tr('参照 {n} 件のリンクを新しいファイル名に張り替えます（書き換えられなかった分はそのまま残り、件数でお知らせします）。', { n: refs.length }),
      tr('元ファイルは残します（このプラグインは元画像を消しません）。'),
      tr('品質：{q}%（設定で変更できます）', { q: Math.round((Number(this.plugin.settings.webpQuality) || 0.8) * 100) }),
    ];
    new ConfirmModal(this.app, tr('WebPに変換'), lines, refs, tr('WebPに変換'), async () => {
      const nf = await this.plugin.convertToWebp(file);
      if (after) after(nf instanceof TFile ? nf : null);
    }).open();
  }

  // 削除：検出できた参照が 0 件のときだけ。表示時と実行直前の両方で参照を取り直し、参照情報が未準備なら止める。
  // 削除方式は Obsidian の「削除したファイル」設定に従う（システムのゴミ箱／.trash／完全削除）ため「戻せる」とは言わない
  confirmDelete(file, after) {
    if (!this.plugin.refsReady()) {
      new Notice(this.plugin.linksDirty
        ? tr('参照情報を更新中です。少し待ってからもう一度お試しください。')
        : tr('参照情報の解析完了をまだ確認できていません。どれかノートを1つ保存すると解析が走り、完了後に削除できるようになります。'));
      return;
    }
    const sources = this.plugin.currentRefSources(file);
    if (sources.length > 0) {
      new Notice(tr('{n} 件のノートから参照されているため削除しません。参照を外してからお試しください。', { n: sources.length }));
      return;
    }
    const lines = [
      tr('{name} を削除します。', { name: file.name }),
      tr('Obsidian の「削除したファイル」設定に従います（システムのゴミ箱／Vault内 .trash／完全削除）。'),
      tr('検出できた参照は 0 件です。ただし Canvas・frontmatter の素の文字列・コードブロック内の参照、エディタで入力中でまだ保存されていない参照は検出できません。'),
    ];
    new ConfirmModal(this.app, tr('削除'), lines, [], tr('削除する'), async () => {
      // 実行直前にもう一度確認（ダイアログを開いている間に参照が付いたり、参照情報が変わったりし得る）
      if (!this.plugin.refsReady()) { new Notice(tr('参照情報の準備が終わっていないため削除しません。')); if (after) after(file); return; }
      const now = this.plugin.currentRefSources(file);
      if (now.length > 0) { new Notice(tr('削除直前に {n} 件の参照が見つかったため削除しません。', { n: now.length })); if (after) after(file); return; }
      await this.plugin.trashFile(file);
      if (after) after(null);
    }, true).open();
  }

  // 参照ノートを開き、該当行へ
  async jumpToRef(srcPath, file) {
    const note = this.app.vault.getAbstractFileByPath(srcPath);
    if (!(note instanceof TFile)) return;
    const leaf = this.app.workspace.getLeaf('tab');
    // Excalidraw は行の概念が無い（eState を渡すと「要素が見つからない」と出る）→ そのまま開く
    if (this.plugin.isExcalidrawFile(note)) { await leaf.openFile(note); return; }
    const { removable } = this.plugin.collectRefsInNote(note, file);
    const line = removable.length > 0 ? removable[0].line : 0;
    await leaf.openFile(note, { eState: { line } });
  }
}

// ── ドロップ時の命名（接頭辞を選ぶ・1枚なら内容も編集） ───────────
class DropNameModal extends Modal {
  constructor(app, files, prefixes, currentPrefix, targetLabel, onSubmit) {
    super(app);
    this.files = files; this.prefixes = prefixes; this.currentPrefix = currentPrefix;
    this.targetLabel = targetLabel; this.onSubmit = onSubmit;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('yosuke-im-modal');
    const single = this.files.length === 1;
    contentEl.createEl('h3', { text: single ? tr('画像を追加') : tr('{n} 件の画像を追加', { n: this.files.length }) });
    contentEl.createEl('p', { cls: 'yosuke-im-muted', text: tr('保存先：{target}', { target: this.targetLabel }) });

    const row = contentEl.createDiv({ cls: 'yosuke-im-rename' });
    const sel = row.createEl('select', { cls: 'dropdown' });
    sel.createEl('option', { value: '', text: tr('（接頭辞なし）') });
    for (const p of this.prefixes) sel.createEl('option', { value: p, text: p });
    sel.createEl('option', { value: '__new__', text: tr('＋ 新しい接頭辞…') });
    sel.value = this.currentPrefix && this.prefixes.includes(this.currentPrefix) ? this.currentPrefix : '';
    const newPrefix = row.createEl('input', { type: 'text', cls: 'yosuke-im-newprefix' });
    newPrefix.placeholder = tr('新しい接頭辞');
    newPrefix.hidden = true;
    row.createSpan({ text: PREFIX_SEP.trim(), cls: 'yosuke-im-sep' });
    const bodyInput = row.createEl('input', { type: 'text', cls: 'yosuke-im-body-input' });
    const origBase = this.files[0].name.replace(/\.[^.]+$/, '');
    bodyInput.value = single ? origBase : '';
    bodyInput.placeholder = single ? tr('内容') : tr('（複数：元のファイル名をそのまま使います）');
    bodyInput.disabled = !single;

    const preview = contentEl.createDiv({ cls: 'yosuke-im-muted yosuke-im-preview-name' });
    const prefixValue = () => (sel.value === '__new__' ? newPrefix.value.trim() : sel.value);
    const updatePreview = () => {
      const p = prefixValue();
      const sample = single ? (bodyInput.value.trim() || origBase) : origBase;
      const ext = this.files[0].name.split('.').pop();
      preview.setText(`→ ${p ? p + PREFIX_SEP : ''}${sample}.${ext}${single ? '' : tr(' など')}`);
    };
    sel.addEventListener('change', () => { newPrefix.hidden = sel.value !== '__new__'; if (!newPrefix.hidden) newPrefix.focus(); updatePreview(); });
    newPrefix.addEventListener('input', updatePreview);
    bodyInput.addEventListener('input', updatePreview);
    updatePreview();

    const submit = async () => { const p = prefixValue(); const b = bodyInput.value.trim(); this.close(); await this.onSubmit(p, b); };
    bodyInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } });
    const btns = contentEl.createDiv({ cls: 'yosuke-im-modal-btns' });
    const ok = btns.createEl('button', { text: tr('追加'), cls: 'mod-cta' });
    ok.addEventListener('click', submit);
    const cancel = btns.createEl('button', { text: tr('キャンセル') });
    cancel.addEventListener('click', () => this.close());
    setTimeout(() => { if (single) { bodyInput.focus(); bodyInput.select(); } else sel.focus(); }, 0);
  }
  onClose() { this.contentEl.empty(); }
}

// ── 詳細モーダル：大きなプレビュー＋参照＋操作＋詳細 ───────────
class DetailModal extends Modal {
  constructor(app, plugin, view, file) {
    super(app);
    this.plugin = plugin;
    this.view = view;
    this.file = file;
  }

  onOpen() {
    this.modalEl.addClass('yosuke-im-detailmodal');
    this.render();
  }

  // ファイルが差し替わった（リネーム・変換）ときに追従
  swap(newFile) {
    if (newFile) { this.file = newFile; this.render(); }
    else this.close();
  }

  refresh() {
    const still = this.app.vault.getAbstractFileByPath(this.file.path);
    if (still instanceof TFile) { this.file = still; this.render(); }
    else this.close();
  }

  render() {
    const { contentEl } = this;
    contentEl.empty();
    const file = this.file;
    const kind = fileKind(file);
    const refs = this.view.refSources(file);

    // ヘッダ：接頭辞チップ＋名前
    const head = contentEl.createDiv({ cls: 'yosuke-im-dhead' });
    let display = file.basename;
    if (kind === 'excalidraw') display = display.replace(/\.excalidraw$/i, '');
    const { prefix, body } = splitPrefix(display);
    if (prefix) head.createSpan({ cls: 'yosuke-im-prefix yosuke-im-prefix--lg', text: prefix });
    head.createSpan({ cls: 'yosuke-im-dtitle', text: prefix ? body : display });
    head.createSpan({ cls: 'yosuke-im-ext yosuke-im-ext--static', text: kind === 'excalidraw' ? 'EXCALIDRAW' : file.extension.toUpperCase() });

    // 本体：左プレビュー／右サイド
    const main = contentEl.createDiv({ cls: 'yosuke-im-dmain' });
    const stage = main.createDiv({ cls: 'yosuke-im-stage' });
    this.plugin.renderThumb(stage, file, null);

    const side = main.createDiv({ cls: 'yosuke-im-side' });

    // 参照
    side.createDiv({ cls: 'yosuke-im-section', text: tr('検出できた参照 {n}', { n: refs.length }) });
    if (refs.length === 0) {
      side.createDiv({ cls: 'yosuke-im-muted', text: tr('Markdown内のリンク・埋め込みからは見つかりませんでした。') });
    } else {
      const list = side.createDiv({ cls: 'yosuke-im-reflist' });
      for (const src of refs) {
        const item = list.createDiv({ cls: 'yosuke-im-refitem' });
        item.createDiv({ cls: 'yosuke-im-refname', text: src.split('/').pop().replace(/\.md$/, '') });
        item.createDiv({ cls: 'yosuke-im-refpath', text: src });
        item.addEventListener('click', () => { this.close(); this.view.jumpToRef(src, file); });
      }
    }
    side.createDiv({ cls: 'yosuke-im-muted yosuke-im-note', text: tr('※ Canvas / frontmatterの素の文字列 / コードブロック内は検出できません。') });

    // 操作
    const act = side.createDiv({ cls: 'yosuke-im-actions' });
    const btn = (label, icon, onClick, opts = {}) => {
      const b = act.createEl('button', { cls: 'yosuke-im-btn' + (opts.danger ? ' mod-warning' : '') });
      const i = b.createSpan({ cls: 'yosuke-im-btn-icon' }); setIcon(i, icon);
      b.createSpan({ text: label });
      if (opts.disabled) { b.disabled = true; if (opts.reason) b.setAttr('title', opts.reason); }
      else b.addEventListener('click', onClick);
      return b;
    };
    const after = (nf) => this.swap(nf);

    act.createDiv({ cls: 'yosuke-im-section', text: tr('開く') });
    btn(tr('Obsidianで開く'), 'file', () => { this.close(); this.plugin.openInObsidian(file); });
    btn(tr('OS標準アプリで開く'), 'external-link', () => this.plugin.openWithDefaultApp(file));
    btn(tr('ファイルの場所を表示'), 'folder-open', () => this.plugin.showInFolder(file));
    btn(tr('リンクをコピー'), 'copy', () => this.plugin.copyLink(file));

    act.createDiv({ cls: 'yosuke-im-section', text: tr('整える') });
    const auto = this.plugin.linksAutoUpdate();
    const linkGate = auto === true ? null
      : auto === false
        ? tr('Obsidian設定「ファイルとリンク → 内部リンクを自動更新」をONにすると使えます（OFFだとリンクが切れるため）')
        : tr('リンク自動更新の設定を確認できないため無効にしています');
    btn(tr('リネーム'), 'pencil', () => this.view.openRename(file, after), { disabled: !!linkGate, reason: linkGate });
    btn(tr('移動'), 'folder-input', () => this.view.openMove(file, after), { disabled: !!linkGate, reason: linkGate });
    if (linkGate) act.createDiv({ cls: 'yosuke-im-muted yosuke-im-note', text: linkGate });
    if (kind === 'image' && WEBP_SOURCE_EXTS.includes(file.extension.toLowerCase())) {
      const sup = this.plugin.webpSupported;
      const reason = sup === false ? tr('この環境の描画エンジンはWebP書き出しに対応していません') : sup === null ? tr('対応確認中…') : null;
      btn(tr('WebPに変換'), 'image-down', () => this.view.confirmWebp(file, after), { disabled: !!reason, reason });
    }

    act.createDiv({ cls: 'yosuke-im-section', text: tr('削除') });
    if (refs.length === 0) {
      btn(tr('削除（Obsidian の削除設定に従う）'), 'trash', () => this.view.confirmDelete(file, after), { danger: true });
    } else {
      btn(tr('削除'), 'trash', null, { disabled: true, reason: tr('参照が {n} 件あるため削除できません。参照を外してからお試しください', { n: refs.length }) });
    }

    // 詳細
    const info = contentEl.createDiv({ cls: 'yosuke-im-info' });
    info.createDiv({ cls: 'yosuke-im-section', text: tr('詳細') });
    const table = info.createDiv({ cls: 'yosuke-im-table' });
    const row = (k, v) => {
      const r = table.createDiv({ cls: 'yosuke-im-trow' });
      r.createSpan({ cls: 'yosuke-im-tk', text: k });
      r.createSpan({ cls: 'yosuke-im-tv', text: v });
    };
    row(tr('パス'), file.path);
    row(tr('サイズ'), humanSize(file.stat.size));
    row(tr('作成'), formatDate(file.stat.ctime));
    row(tr('更新'), formatDate(file.stat.mtime));
  }

  onClose() {
    this.contentEl.empty();
    if (this.view.detail === this) this.view.detail = null;
  }
}

// ── リネーム（命名規則アシスト：接頭辞 ＋ 内容） ─────────────
class RenameModal extends Modal {
  constructor(app, file, prefixes, onSubmit) {
    super(app);
    this.file = file;
    this.prefixes = prefixes;
    this.onSubmit = onSubmit;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('yosuke-im-modal');
    contentEl.createEl('h3', { text: tr('リネーム') });
    let base = this.file.basename;
    if (fileKind(this.file) === 'excalidraw') base = base.replace(/\.excalidraw$/i, '');
    const { prefix, body } = splitPrefix(base);

    const row = contentEl.createDiv({ cls: 'yosuke-im-rename' });
    const sel = row.createEl('select', { cls: 'dropdown' });
    sel.createEl('option', { value: '', text: tr('（接頭辞なし）') });
    for (const p of this.prefixes) sel.createEl('option', { value: p, text: p });
    sel.createEl('option', { value: '__new__', text: tr('＋ 新しい接頭辞…') });
    sel.value = prefix && this.prefixes.includes(prefix) ? prefix : '';
    const newPrefix = row.createEl('input', { type: 'text', cls: 'yosuke-im-newprefix' });
    newPrefix.placeholder = tr('新しい接頭辞');
    newPrefix.hidden = true;
    if (prefix && !this.prefixes.includes(prefix)) { sel.value = '__new__'; newPrefix.hidden = false; newPrefix.value = prefix; }
    row.createSpan({ text: PREFIX_SEP.trim(), cls: 'yosuke-im-sep' });
    const bodyInput = row.createEl('input', { type: 'text', cls: 'yosuke-im-body-input' });
    bodyInput.value = body;
    bodyInput.placeholder = tr('内容');

    sel.addEventListener('change', () => {
      newPrefix.hidden = sel.value !== '__new__';
      if (!newPrefix.hidden) newPrefix.focus();
      updatePreview();
    });
    const preview = contentEl.createDiv({ cls: 'yosuke-im-muted yosuke-im-preview-name' });
    const compose = () => {
      const p = sel.value === '__new__' ? newPrefix.value.trim() : sel.value;
      const b = bodyInput.value.trim();
      return p ? `${p}${PREFIX_SEP}${b}` : b;
    };
    const ext = this.file.name.toLowerCase().endsWith('.excalidraw.md') ? 'excalidraw.md' : this.file.extension;
    const updatePreview = () => preview.setText(`→ ${compose()}.${ext}`);
    newPrefix.addEventListener('input', updatePreview);
    bodyInput.addEventListener('input', updatePreview);
    updatePreview();

    const submit = async () => { const v = compose(); this.close(); await this.onSubmit(v); };
    bodyInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } });
    const btns = contentEl.createDiv({ cls: 'yosuke-im-modal-btns' });
    const ok = btns.createEl('button', { text: tr('リネーム'), cls: 'mod-cta' });
    ok.addEventListener('click', submit);
    const cancel = btns.createEl('button', { text: tr('キャンセル') });
    cancel.addEventListener('click', () => this.close());
    setTimeout(() => { bodyInput.focus(); bodyInput.select(); }, 0);
  }
  onClose() { this.contentEl.empty(); }
}

// ── 移動先フォルダ選択 ───────────────────────────────
class FolderSuggestModal extends FuzzySuggestModal {
  constructor(app, onChoose) {
    super(app);
    this.onChoose = onChoose;
    this.setPlaceholder(tr('移動先フォルダを選ぶ…'));
  }
  getItems() {
    return this.app.vault.getAllLoadedFiles()
      .filter((f) => f instanceof TFolder)
      .sort((a, b) => a.path.localeCompare(b.path, 'ja'));
  }
  getItemText(folder) { return folder.path === '/' ? tr('（ルート）') : folder.path; }
  onChooseItem(folder) { this.onChoose(folder); }
}

// ── 確認ダイアログ（対象ノート一覧つき） ───────────────
class ConfirmModal extends Modal {
  constructor(app, title, lines, sources, okLabel, onConfirm, danger = false) {
    super(app);
    this.title = title; this.lines = lines; this.sources = sources;
    this.okLabel = okLabel; this.onConfirm = onConfirm; this.danger = danger;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('yosuke-im-modal');
    contentEl.createEl('h3', { text: this.title });
    for (const l of this.lines) contentEl.createEl('p', { text: l });
    if (this.sources.length > 0) {
      const ul = contentEl.createEl('ul', { cls: 'yosuke-im-reflist' });
      for (const s of this.sources) ul.createEl('li', { text: s });
    }
    const btns = contentEl.createDiv({ cls: 'yosuke-im-modal-btns' });
    const ok = btns.createEl('button', { text: this.okLabel, cls: this.danger ? 'mod-warning' : 'mod-cta' });
    ok.addEventListener('click', async () => { this.close(); await this.onConfirm(); });
    const cancel = btns.createEl('button', { text: tr('キャンセル') });
    cancel.addEventListener('click', () => this.close());
  }
  onClose() { this.contentEl.empty(); }
}

// ── 設定タブ ────────────────────────────────────────
class YosukeInsertImageSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  // 「はじめに」：セットアップガイド。手でチェックせず、Vault の実状態から「済み／まだ」を自動で出す
  renderGuide(containerEl) {
    const plugin = this.plugin;
    const files = plugin.getSourceFiles();
    const withPrefix = files.filter((f) => !!splitPrefix(f.basename.replace(/\.excalidraw$/i, '')).prefix);
    const images = files.filter((f) => fileKind(f) === 'image');
    const drawings = files.filter((f) => fileKind(f) === 'excalidraw');
    const hasEA = !!plugin.getEA();
    const goTab = (id) => { this.activeTab = id; this.display(); };

    const intro = containerEl.createDiv({ cls: 'yosuke-ii-guide-intro' });
    intro.createEl('p', { text: tr('ファイル名の頭に「接頭辞 - 」を付けるだけで、画像と Excalidraw の図がカテゴリ分けされ、一覧から選んで挿入できます。設定はこの3つだけ押さえれば使えます。') });

    const card = (n, title, lines, status, btnLabel, tabId) => {
      const el = containerEl.createDiv({ cls: 'yosuke-ii-guide-card' + (status.done ? ' is-done' : '') });
      const head = el.createDiv({ cls: 'yosuke-ii-guide-head' });
      head.createSpan({ text: String(n), cls: 'yosuke-ii-guide-num' });
      head.createSpan({ text: title, cls: 'yosuke-ii-guide-title' });
      const st = head.createSpan({ text: status.text, cls: 'yosuke-ii-guide-status' + (status.done ? ' is-done' : '') });
      st.setAttr('aria-label', status.done ? tr('済み') : tr('まだ'));
      const body = el.createDiv({ cls: 'yosuke-ii-guide-body' });
      for (const line of lines) body.createEl('p', { text: line });
      if (btnLabel) {
        const b = body.createEl('button', { text: btnLabel, cls: 'yosuke-ii-guide-btn' });
        b.addEventListener('click', () => goTab(tabId));
      }
    };

    card(1, tr('名前で分ける'), [
      tr('「icon - 矢印.png」「illustration - 図解の流れ.md」のように、名前の頭に「接頭辞 - 」を付けます。'),
      tr('接頭辞がそのまま一覧のカテゴリになります。まだ付いていないファイルは「画像を管理する」のリネームで付けられます。'),
    ], withPrefix.length > 0
      ? { done: true, text: tr('接頭辞付き {n} 枚', { n: withPrefix.length }) }
      : { done: false, text: tr('接頭辞付きのファイルがまだありません') },
    tr('画像の種類を選ぶ'), 'general');

    card(2, tr('Excalidraw の図も候補にする'), [
      tr('コミュニティプラグイン「Excalidraw」が必要です。'),
      tr('図は接頭辞（icon / illustration など）が付いたものだけ候補になります。作業中の図は一覧に混ざりません。'),
    ], !hasEA
      ? { done: false, text: tr('Excalidraw プラグインが見つかりません') }
      : (drawings.length > 0 ? { done: true, text: tr('候補の図 {n} 枚', { n: drawings.length }) } : { done: false, text: tr('候補になる図がまだありません') }),
    tr('図の候補を選ぶ'), 'general');

    // 3：使う（リボンの2アイコン。実物のアイコンを名前の横に描いて「どれか」を分からせる）
    card(3, tr('使う'), [], { done: images.length + drawings.length > 0, text: tr('画像 {a} 枚 / 図 {b} 枚', { a: images.length, b: drawings.length }) }, null, null);
    const useBody = containerEl.lastElementChild.querySelector('.yosuke-ii-guide-body');
    const tool = (icon, name, steps, items, command) => {
      const box = useBody.createDiv({ cls: 'yosuke-ii-guide-tool' });
      const ic = box.createDiv({ cls: 'yosuke-ii-guide-tool-icon' });
      setIcon(ic, icon);
      box.createDiv({ text: name, cls: 'yosuke-ii-guide-tool-name' });
      const body = box.createDiv({ cls: 'yosuke-ii-guide-tool-body' });
      for (const st of steps) body.createDiv({ text: st, cls: 'yosuke-ii-guide-tool-step' });
      if (items) {
        const ul = body.createEl('ul', { cls: 'yosuke-ii-guide-list' });
        for (const it of items) ul.createEl('li', { text: it });
      }
      body.createDiv({ text: tr('コマンドパレットからも呼べます：「{command}」。ホットキーは 設定 → ホットキー で付けられます。', { command }), cls: 'yosuke-ii-guide-note' });
    };
    tool('image-plus', tr('画像を挿入する'), [
      tr('ノートか Excalidraw を開いて、左のリボンのこのアイコンを押す'),
      tr('→ カテゴリを選ぶ → 1枚選ぶ → その場に入る'),
    ], null, tr('Insert Image Plus: 画像を挿入する'));
    tool('gallery-thumbnails', tr('画像を管理する'), [
      tr('左のリボンのこのアイコンを押すと、画像と図の一覧がタブで開く'),
      tr('1枚ずつ手入れする（一括操作はない）'),
    ], [
      tr('Finder から画像を落とす → 接頭辞を選んで保存'),
      tr('リネーム（接頭辞を付け直す）'),
      tr('フォルダへ移動'),
      tr('WebP に変換（元の画像は残す）'),
      tr('削除（検出できた参照が 0 件のときだけ・Obsidian の削除設定に従う）'),
      tr('どのノートで使っているか（参照）を見る'),
    ], tr('Insert Image Plus: 画像を管理する'));
  }

  display() {
    const root = this.containerEl;
    root.empty();

    // タブ（一般／画像／Excalidraw）。選択はセッション内だけ覚える
    const TABS = [['guide', tr('はじめに')], ['general', tr('一般')], ['insert', tr('挿入')], ['manager', tr('管理')]];
    const tab = this.activeTab || 'guide';
    const bar = root.createDiv({ cls: 'yosuke-ii-tabs' });
    for (const [id, label] of TABS) {
      const btn = bar.createEl('button', { text: label, cls: 'yosuke-ii-tab' + (id === tab ? ' is-active' : '') });
      btn.addEventListener('click', () => { this.activeTab = id; this.display(); });
    }
    const containerEl = root.createDiv({ cls: 'yosuke-ii-pane' });

    // 接頭辞（カテゴリ）：挿入ピッカーと管理画面で別々に持つ
    const prefixSection = (heading, modeKey, listKey, note) => {
      new Setting(containerEl).setName(heading).setHeading();
      new Setting(containerEl)
        .setName(tr('接頭辞の出し方'))
        .setDesc(`${note} ${tr('自動＝ファイル名の「接頭辞 - 内容」から集計。指定のみ＝下のリストにある接頭辞だけ。OFF＝カテゴリを出さない。')}`)
        .addDropdown((d) => {
          d.addOption('auto', tr('自動（全部）'));
          d.addOption('whitelist', tr('指定の接頭辞のみ'));
          d.addOption('off', 'OFF');
          d.setValue(this.plugin.settings[modeKey] || 'auto').onChange(async (v) => {
            this.plugin.settings[modeKey] = v; await this.plugin.saveSettings(); this.display();
          });
        });
      if ((this.plugin.settings[modeKey] || 'auto') === 'whitelist') {
        new Setting(containerEl)
          .setName(tr('指定する接頭辞'))
          .setDesc(tr('1行に1つ書きます（Enterで改行）。ファイル名の「 - 」より前の部分と一致したものだけがカテゴリになります。'))
          .addTextArea((t) => {
            t.setValue((this.plugin.settings[listKey] || []).join('\n'));
            t.setPlaceholder('icon\nlogo\nstick');
            t.inputEl.rows = 5;
            t.onChange(async (v) => {
              this.plugin.settings[listKey] = v.split(/[\n\/,、／]+/).map((x) => x.trim()).filter(Boolean);
              await this.plugin.saveSettings();
            });
          });
      }
    };

    if (tab === 'guide') this.renderGuide(containerEl);

    if (tab === 'general') {
    // 画像：拡張子ごとに ON/OFF（jpg と jpeg は一組）
    new Setting(containerEl).setName(tr('対象にする画像')).setHeading();
    containerEl.createEl('p', { text: tr('OFF にした拡張子は一覧にも、ドラッグ＆ドロップの受付にも出ません。'), cls: 'setting-item-description' });
    const extGroups = [['png'], ['jpg', 'jpeg'], ['svg'], ['webp'], ['gif'], ['avif'], ['bmp']];
    const extRow = containerEl.createDiv({ cls: 'yosuke-ii-extgrid' });
    for (const group of extGroups) {
      const on = group.every((e) => (this.plugin.settings.imageExts || []).includes(e));
      new Setting(extRow)
        .setName(group[0])
        .addToggle((t) => t.setValue(on).onChange(async (v) => {
          const set = new Set(this.plugin.settings.imageExts || []);
          for (const e of group) { if (v) set.add(e); else set.delete(e); }
          this.plugin.settings.imageExts = IMAGE_EXTS.filter((e) => set.has(e));
          await this.plugin.saveSettings();
        }));
    }

    new Setting(containerEl).setName(tr('対象にする Excalidraw')).setHeading();
    const hasEA = !!this.plugin.getEA();
    containerEl.createEl('p', {
      text: hasEA
        ? tr('Excalidraw の図を扱うには、コミュニティプラグイン「Excalidraw」が必要です（このVaultでは有効になっています）。')
        : tr('Excalidraw の図を扱うには、コミュニティプラグイン「Excalidraw」が必要です。このVaultでは見つからないため、図のサムネ表示とキャンバスへの配置は動きません。'),
      cls: 'setting-item-description' + (hasEA ? '' : ' yosuke-ii-warn'),
    });
    new Setting(containerEl)
      .setName(tr('Excalidraw を候補に入れる'))
      .setDesc(tr('埋め込むと図がそのまま描画される。'))
      .addToggle((t) => t.setValue(this.plugin.settings.includeExcalidraw).onChange(async (v) => {
        this.plugin.settings.includeExcalidraw = v; await this.plugin.saveSettings();
      }));
    new Setting(containerEl)
      .setName(tr('接頭辞が付いた図だけ候補にする'))
      .setDesc(tr('ON＝下のリストの接頭辞（例：illustration - ○○）で始まる図だけ候補にします。作業中の図やメモの図が一覧に混ざりません。OFF＝Excalidraw と判定した図を全部出します。'))
      .addToggle((t) => t.setValue(this.plugin.settings.excalidrawPrefixOnly !== false).onChange(async (v) => {
        this.plugin.settings.excalidrawPrefixOnly = v; await this.plugin.saveSettings(); this.display();
      }));
    if (this.plugin.settings.excalidrawPrefixOnly !== false) {
      new Setting(containerEl)
        .setName(tr('候補にする図の接頭辞'))
        .setDesc(tr('1行に1つ書きます（Enterで改行）。ファイル名の「 - 」より前の部分と一致した図だけが候補になります。大文字小文字は区別しません。'))
        .addTextArea((t) => {
          t.setValue((this.plugin.settings.excalidrawPrefixes || []).join('\n'));
          t.setPlaceholder('icon\nillustration\nlogo');
          t.inputEl.rows = 5;
          t.onChange(async (v) => {
            this.plugin.settings.excalidrawPrefixes = v.split(/[\n\/,、／]+/).map((x) => x.trim()).filter(Boolean);
            await this.plugin.saveSettings();
          });
        });
    }
    new Setting(containerEl)
      .setName(tr('Excalidraw の判定'))
      .setDesc(tr('名前だけ＝ファイル名が .excalidraw / .excalidraw.md のものだけ。名前＋frontmatter＝加えて、frontmatter に excalidraw-plugin を持つノートも Excalidraw として拾う（リネームで .excalidraw が消えた図も見つかる）。'))
      .addDropdown((d) => d
        .addOption('frontmatter', tr('名前＋frontmatter'))
        .addOption('name', tr('名前だけ'))
        .setValue(this.plugin.settings.excalidrawDetect || 'frontmatter')
        .onChange(async (v) => {
          this.plugin.settings.excalidrawDetect = v; await this.plugin.saveSettings();
        }));
    new Setting(containerEl)
      .setName(tr('Excalidraw のサムネを表示'))
      .setDesc(tr('一覧のカードに図の中身を表示します。埋め込み画像を含めて 5MB を超える図は、表示が重くなるためサムネを描かず「5MB超」と表示します。一覧からは消えません。'))
      .addToggle((t) => t.setValue(this.plugin.settings.excalidrawThumbnails).onChange(async (v) => {
        this.plugin.settings.excalidrawThumbnails = v; await this.plugin.saveSettings();
      }));

    new Setting(containerEl).setName(tr('スコープ（任意）')).setHeading();
    containerEl.createEl('p', {
      text: tr('空＝Vault全体（既定）。ここに入れると、そのフォルダ配下だけが対象になります。'),
      cls: 'setting-item-description',
    });
    (this.plugin.settings.folders || []).forEach((folder, index) => {
      const s = new Setting(containerEl)
        .addText((text) => {
          text.setValue(folder).setPlaceholder(tr('例：02_Configs/Extra')).onChange(async (v) => {
            this.plugin.settings.folders[index] = v.trim(); await this.plugin.saveSettings();
          });
          text.inputEl.addClass('yosuke-ii-wide');
        })
        .addExtraButton((b) => b.setIcon('trash').setTooltip(tr('削除')).onClick(async () => {
          this.plugin.settings.folders.splice(index, 1); await this.plugin.saveSettings(); this.display();
        }));
      s.infoEl.remove();
    });
    new Setting(containerEl).addButton((b) => {
      b.setButtonText(tr('＋ 絞り込むフォルダを追加')).onClick(async () => {
        this.plugin.settings.folders.push(''); await this.plugin.saveSettings(); this.display();
      });
    });

    }

    if (tab === 'insert') {
    new Setting(containerEl).setName(tr('挿入の仕方')).setHeading();
    new Setting(containerEl)
      .setName(tr('一覧の横並び数（デスクトップ）'))
      .setDesc(tr('挿入ピッカーで1行に並べる枚数。少ないほど1枚が大きく見えます。既定 5。'))
      .addSlider((sl) => sl.setLimits(2, 8, 1).setValue(Math.min(8, Math.max(2, parseInt(this.plugin.settings.pickerColumns, 10) || 5))).setDynamicTooltip()
        .onChange(async (v) => { this.plugin.settings.pickerColumns = v; await this.plugin.saveSettings(); }));
    new Setting(containerEl)
      .setName(tr('一覧の横並び数（スマホ）'))
      .setDesc(tr('スマホ版 Obsidian で開いたときの枚数。画面が狭いので少なめに。既定 3。'))
      .addSlider((sl) => sl.setLimits(2, 6, 1).setValue(Math.min(6, Math.max(2, parseInt(this.plugin.settings.pickerColumnsMobile, 10) || 3))).setDynamicTooltip()
        .onChange(async (v) => { this.plugin.settings.pickerColumnsMobile = v; await this.plugin.saveSettings(); }));
    new Setting(containerEl)
      .setName(tr('挿入形式'))
      .setDesc(tr('トランスクルージョン ![[…]] は埋め込み表示。リンク [[…]] はリンクだけ。'))
      .addDropdown((d) => {
        d.addOption('transclusion', tr('トランスクルージョン ![[…]]'));
        d.addOption('wikilink', tr('リンク [[…]]'));
        d.setValue(this.plugin.settings.insertFormat).onChange(async (v) => {
          this.plugin.settings.insertFormat = v; await this.plugin.saveSettings();
        });
      });
    new Setting(containerEl)
      .setName(tr('既定の幅（px）'))
      .setDesc(tr('入れると ![[name|200]] のように幅つきで挿入。空なら幅なし。'))
      .addText((t) => t.setValue(this.plugin.settings.defaultWidth).setPlaceholder(tr('例：200')).onChange(async (v) => {
        this.plugin.settings.defaultWidth = v.replace(/[^0-9]/g, ''); await this.plugin.saveSettings();
      }));
    new Setting(containerEl)
      .setName(tr('Excalidraw に置くときの大きさ（接頭辞ごと）'))
      .setDesc(tr('キャンバスに配置する画像の長辺（px）。1行に「接頭辞: 数字」。例：icon: 180。書いていない接頭辞は下の既定に従います。'))
      .addTextArea((t) => {
        const map = this.plugin.settings.excalidrawInsertSizes || {};
        t.setValue(Object.keys(map).map((k) => `${k}: ${map[k]}`).join('\n'));
        t.setPlaceholder('icon: 180\nlogo: 240');
        t.inputEl.rows = 4;
        t.onChange(async (v) => {
          const out = {};
          for (const line of v.split(/\n+/)) {
            const m = line.match(/^\s*([^:：]+?)\s*[:：]\s*(\d+)\s*$/);
            if (m) out[m[1]] = parseInt(m[2], 10);
          }
          this.plugin.settings.excalidrawInsertSizes = out; await this.plugin.saveSettings();
        });
      });
    new Setting(containerEl)
      .setName(tr('上に無い接頭辞の大きさ（px）'))
      .setDesc(tr('0（既定）＝Excalidraw に任せる（長辺 500px まで縮小）。'))
      .addText((t) => t.setValue(String(this.plugin.settings.excalidrawInsertSize ?? 0)).setPlaceholder(tr('0＝Excalidraw に任せる')).onChange(async (v) => {
        const n = parseInt(v.replace(/[^0-9]/g, ''), 10); this.plugin.settings.excalidrawInsertSize = isNaN(n) ? 0 : n; await this.plugin.saveSettings();
      }));
    new Setting(containerEl)
      .setName(tr('「最近使った」の保持数'))
      .addText((t) => t.setValue(String(this.plugin.settings.recentLimit)).onChange(async (v) => {
        const n = parseInt(v, 10); this.plugin.settings.recentLimit = isNaN(n) ? 40 : n; await this.plugin.saveSettings();
      }));

    prefixSection(tr('挿入ピッカーの接頭辞'), 'insertPrefixMode', 'insertPrefixWhitelist', tr('「画像を挿入する」のカテゴリ一覧に効きます。'));
    }

    if (tab === 'manager') {
    prefixSection(tr('管理画面の接頭辞'), 'prefixMode', 'prefixWhitelist', tr('「画像を管理する」の上部チップに効きます。'));

    new Setting(containerEl).setName(tr('カードと変換')).setHeading();
    new Setting(containerEl)
      .setName(tr('カードに参照数を表示'))
      .setDesc(tr('Markdown内のリンク・埋め込みから検出できた参照の数。0でも「使っていない」とは限りません。'))
      .addToggle((t) => t.setValue(this.plugin.settings.showRefBadge).onChange(async (v) => {
        this.plugin.settings.showRefBadge = v; await this.plugin.saveSettings();
      }));
    new Setting(containerEl)
      .setName(tr('WebP変換の品質'))
      .setDesc(tr('0.1〜1.0。高いほど綺麗で大きい。既定 0.8。'))
      .addSlider((s) => s.setLimits(0.1, 1, 0.05).setValue(Number(this.plugin.settings.webpQuality) || 0.8).setDynamicTooltip()
        .onChange(async (v) => { this.plugin.settings.webpQuality = v; await this.plugin.saveSettings(); }));
    }
  }
}

/* nosourcemap */