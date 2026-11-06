/* 📨 STAFF MAIL — Gmail-style messages between Admin and Reporters
 * One engine, two places:
 *   • news88-adm.html   → MailBox.initAdmin()        (Messages page in the sidebar)
 *   • reporter-panel.html → MailBox.initReporter(..) (Profile menu → Messages overlay)
 * Firestore collection: staff_mail   (rules are in FirebaseRules.txt)
 * Message fields: threadId, from, fromName, to, toName, subject, body, attachments[],
 *                 createdAt, readAt, starredBy[], trashedBy[]
 *   from/to = 'admin'  or  reporter username
 */
(function (global) {
    'use strict';

    var COL = 'staff_mail';
    var ADMIN_ID = 'admin';
    var ME = null;                 // { role:'admin'|'rep', id, name, uploadFn, badgeId }
    var docs = {};                 // message id -> message
    var listeners = [];
    var setsByField = { to: {}, from: {} };
    var state = {
        folder: 'inbox', open: null, search: '', reporters: [],
        compose: null, draft: '', attachments: [], composing: false, mobileRead: false
    };
    var rootEl = null, liveStarted = false, lastUnread = null;

    // Status line (overlay top-la kaattum) — edhu thappu nu udane theriyum
    var lastStatus = '';
    function setStatus(msg) { lastStatus = msg; var el = document.getElementById('mb-status'); if (el) el.textContent = msg; }

    /* ───────── helpers ───────── */
    function fdb() { return firebase.firestore(); }
    function FV() { return firebase.firestore.FieldValue; }
    function esc(s) { var d = document.createElement('div'); d.textContent = (s == null ? '' : String(s)); return d.innerHTML; }
    function myKey() { return ME.role === 'admin' ? 'admin' : 'rep:' + ME.id; }
    function toDate(v) {
        if (!v) return new Date();                         // serverTimestamp still pending → now
        if (typeof v.toDate === 'function') return v.toDate();
        return new Date(v);
    }
    function fmtTime(d) {
        var now = new Date();
        if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    }
    function fmtFull(d) { return d.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
    function initial(name) { return esc(String(name || '?').trim().charAt(0).toUpperCase() || '?'); }
    function newId(p) { return p + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

    /* ───────── styles (namespaced .mb-) ───────── */
    function injectStyle() {
        if (document.getElementById('mb-style')) return;
        var css = '' +
        '.mb-app{display:grid;grid-template-columns:190px minmax(260px,360px) 1fr;height:100%;min-height:520px;background:#fff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;font-family:inherit;color:#0f172a;}' +
        '.mb-side{background:#f8fafc;border-right:1px solid #e2e8f0;padding:12px 8px;display:flex;flex-direction:column;gap:4px;}' +
        '.mb-compose-btn{background:#e11d48;color:#fff;border:none;border-radius:14px;padding:12px;font-weight:800;cursor:pointer;margin-bottom:10px;box-shadow:0 4px 12px rgba(225,29,72,.3);}' +
        '.mb-folder{display:flex;align-items:center;gap:10px;padding:9px 12px;border:none;background:none;border-radius:10px;text-align:left;cursor:pointer;font-weight:600;color:#334155;font-size:.9rem;}' +
        '.mb-folder:hover{background:#eef2f7;}' +
        '.mb-folder.active{background:#fde8ee;color:#be123c;font-weight:800;}' +
        '.mb-count{margin-left:auto;background:#e11d48;color:#fff;border-radius:99px;padding:1px 8px;font-size:.72rem;font-weight:800;}' +
        '.mb-list{border-right:1px solid #e2e8f0;display:flex;flex-direction:column;min-width:0;}' +
        '.mb-toolbar{padding:10px;border-bottom:1px solid #e2e8f0;}' +
        '.mb-search{width:100%;box-sizing:border-box;padding:9px 12px;border:1px solid #e2e8f0;border-radius:10px;font-size:.9rem;outline:none;background:#f8fafc;}' +
        '.mb-threads{overflow-y:auto;flex:1;}' +
        '.mb-item{display:flex;gap:10px;padding:11px 12px;border-bottom:1px solid #f1f5f9;cursor:pointer;align-items:flex-start;}' +
        '.mb-item:hover{background:#f8fafc;}' +
        '.mb-item.sel{background:#fff1f2;}' +
        '.mb-av{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#e11d48,#be123c);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;flex-shrink:0;}' +
        '.mb-meta{flex:1;min-width:0;}' +
        '.mb-row1{display:flex;justify-content:space-between;gap:8px;font-size:.85rem;}' +
        '.mb-from{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}' +
        '.mb-time{color:#94a3b8;font-size:.75rem;white-space:nowrap;}' +
        '.mb-subj{font-size:.88rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}' +
        '.mb-snip{font-size:.78rem;color:#64748b;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}' +
        '.mb-item.unread .mb-from,.mb-item.unread .mb-subj{font-weight:800;color:#0f172a;}' +
        '.mb-star{background:none;border:none;cursor:pointer;font-size:1rem;color:#cbd5e1;padding:0 2px;}' +
        '.mb-star.on{color:#f59e0b;}' +
        '.mb-read{display:flex;flex-direction:column;min-width:0;}' +
        '.mb-empty{margin:auto;color:#94a3b8;text-align:center;padding:30px;}' +
        '.mb-rhead{display:flex;align-items:center;gap:10px;padding:12px 16px;border-bottom:1px solid #e2e8f0;flex-wrap:wrap;}' +
        '.mb-rhead h3{margin:0;font-size:1.05rem;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;}' +
        '.mb-btn{border:1px solid #e2e8f0;background:#fff;border-radius:9px;padding:7px 12px;cursor:pointer;font-weight:700;font-size:.82rem;color:#334155;}' +
        '.mb-btn:hover{background:#f8fafc;}' +
        '.mb-btn.primary{background:#e11d48;border-color:#e11d48;color:#fff;}' +
        '.mb-btn.danger{color:#dc2626;border-color:#fecaca;}' +
        '.mb-back{display:none;}' +
        '.mb-msgs{flex:1;overflow-y:auto;padding:14px 16px;display:flex;flex-direction:column;gap:12px;background:#fbfcfe;}' +
        '.mb-msg{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:12px 14px;}' +
        '.mb-msg.mine{border-color:#fbcfe8;background:#fff7fa;}' +
        '.mb-mhead{display:flex;align-items:center;gap:8px;margin-bottom:6px;font-size:.85rem;flex-wrap:wrap;}' +
        '.mb-mhead b{font-weight:800;}' +
        '.mb-mtime{margin-left:auto;color:#94a3b8;font-size:.75rem;}' +
        '.mb-body{white-space:pre-wrap;word-break:break-word;font-size:.92rem;line-height:1.6;color:#1e293b;}' +
        '.mb-atts{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;}' +
        '.mb-att{display:inline-block;max-width:160px;}' +
        '.mb-att img{width:150px;height:110px;object-fit:cover;border-radius:10px;border:1px solid #e2e8f0;}' +
        '.mb-att span{font-size:.78rem;color:#be123c;font-weight:700;}' +
        '.mb-reply{border-top:1px solid #e2e8f0;padding:12px 16px;display:flex;flex-direction:column;gap:8px;background:#fff;}' +
        '.mb-ta{width:100%;box-sizing:border-box;min-height:84px;border:1px solid #e2e8f0;border-radius:10px;padding:10px 12px;font:inherit;resize:vertical;outline:none;}' +
        '.mb-ta:focus,.mb-input:focus,.mb-select:focus{border-color:#e11d48;}' +
        '.mb-input,.mb-select{width:100%;box-sizing:border-box;border:1px solid #e2e8f0;border-radius:10px;padding:10px 12px;font:inherit;outline:none;background:#fff;}' +
        '.mb-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;}' +
        '.mb-chip{background:#f1f5f9;border-radius:99px;padding:4px 10px;font-size:.78rem;font-weight:600;display:inline-flex;gap:6px;align-items:center;}' +
        '.mb-chip button{background:none;border:none;cursor:pointer;color:#64748b;}' +
        '.mb-compose{padding:16px;display:flex;flex-direction:column;gap:10px;overflow-y:auto;}' +
        '.mb-compose h3{margin:0;font-size:1.05rem;}' +
        '.mb-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#0f172a;color:#fff;padding:10px 16px;border-radius:12px;font-size:.88rem;font-weight:600;z-index:100000;box-shadow:0 10px 30px rgba(0,0,0,.25);}' +
        '.mb-nav-badge{background:#e11d48;color:#fff;border-radius:99px;padding:1px 7px;font-size:.7rem;font-weight:800;margin-left:auto;}' +
        '.mb-overlay{position:fixed;inset:0;background:rgba(15,23,42,.45);z-index:9000;display:flex;align-items:center;justify-content:center;padding:18px;}' +
        '.mb-overlay-box{background:#fff;border-radius:18px;width:min(1100px,100%);height:min(760px,100%);display:flex;flex-direction:column;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.35);}' +
        '.mb-overlay-top{display:flex;align-items:center;gap:10px;padding:12px 16px;border-bottom:1px solid #e2e8f0;font-weight:800;}' +
        '.mb-root{width:100%;height:100%;display:flex;min-width:0;}' +
        '.mb-root>.mb-app{flex:1;min-width:0;}' +
        '#mb-rep-root .mb-app{border:none;border-radius:0;min-height:0;}' +
        '@media (max-width:860px){' +
        '  .mb-app{grid-template-columns:1fr;}' +
        '  .mb-side{flex-direction:row;overflow-x:auto;border-right:none;border-bottom:1px solid #e2e8f0;padding:8px;}' +
        '  .mb-compose-btn{margin:0 6px 0 0;flex-shrink:0;}' +
        '  .mb-folder{flex-shrink:0;}' +
        '  .mb-list{border-right:none;}' +
        '  .mb-app.show-read .mb-list,.mb-app.show-read .mb-side{display:none;}' +
        '  .mb-app:not(.show-read) .mb-read{display:none;}' +
        '  .mb-back{display:inline-block;}' +
        '}';
        var st = document.createElement('style');
        st.id = 'mb-style';
        st.textContent = css;
        document.head.appendChild(st);
    }

    /* ───────── data ───────── */
    function norm(id, d) {
        d = d || {};
        return {
            id: id, threadId: d.threadId || id, from: d.from, fromName: d.fromName || d.from,
            to: d.to, toName: d.toName || d.to, subject: d.subject || '', body: d.body || '',
            attachments: d.attachments || [], createdAt: d.createdAt || null,
            readAt: d.readAt || null, starredBy: d.starredBy || [], trashedBy: d.trashedBy || []
        };
    }
    function stopListeners() { listeners.forEach(function (u) { try { u(); } catch (e) {} }); listeners = []; }
    function startListeners() {
        if (liveStarted || !ME) return;
        liveStarted = true;
        var db = fdb();
        function listen(field) {
            var unsub = db.collection(COL).where(field, '==', ME.id).onSnapshot(function (snap) {
                var seen = {};
                snap.docs.forEach(function (doc) { seen[doc.id] = true; docs[doc.id] = norm(doc.id, doc.data()); });
                Object.keys(setsByField[field]).forEach(function (id) { if (!seen[id]) delete docs[id]; });
                setsByField[field] = seen;
                onData();
            }, function (err) {
                console.warn('staff_mail listen failed:', err);
                setStatus('⚠️ Firestore error: ' + (err && err.message ? err.message : err) + ' — rules publish aagiyaa check pannunga');
            });
            listeners.push(unsub);
        }
        listen('to');
        listen('from');
        setStatus('✅ Connected as ' + ME.name);
    }
    function onData() {
        var unread = unreadCount();
        updateBadge(unread);
        if (lastUnread !== null && unread > lastUnread) {
            var newest = buildThreads().filter(function (t) { return t.unread > 0; })[0];
            if (!rootEl || !rootEl.isConnected || rootEl.offsetParent === null) {
                toast('📨 New message' + (newest ? ' from ' + newest.otherName : ''));
            }
        }
        lastUnread = unread;
        render();
    }
    function updateBadge(n) {
        if (!ME) return;
        var els = document.querySelectorAll('[data-mb-badge="' + (ME.role === 'admin' ? 'admin' : 'rep') + '"]');
        Array.prototype.forEach.call(els, function (el) {
            el.textContent = n > 0 ? String(n) : '';
            el.style.display = n > 0 ? 'inline-block' : 'none';
        });
    }

    function buildThreads() {
        var byId = {};
        Object.keys(docs).forEach(function (id) {
            var m = docs[id];
            var t = byId[m.threadId] || (byId[m.threadId] = { id: m.threadId, msgs: [] });
            t.msgs.push(m);
        });
        var out = Object.keys(byId).map(function (k) {
            var t = byId[k];
            t.msgs.sort(function (a, b) { return toDate(a.createdAt) - toDate(b.createdAt); });
            t.last = t.msgs[t.msgs.length - 1];
            t.subject = t.msgs[0].subject || '(no subject)';
            t.unread = t.msgs.filter(function (m) { return m.to === ME.id && !m.readAt; }).length;
            t.starred = t.msgs.some(function (m) { return m.starredBy.indexOf(myKey()) !== -1; });
            t.trashed = t.msgs.every(function (m) { return m.trashedBy.indexOf(myKey()) !== -1; });
            t.hasInbox = t.msgs.some(function (m) { return m.to === ME.id; });
            t.hasSent = t.msgs.some(function (m) { return m.from === ME.id; });
            var lastFromMe = t.last.from === ME.id;
            t.other = lastFromMe ? t.last.to : t.last.from;
            t.otherName = lastFromMe ? t.last.toName : t.last.fromName;
            t.lastAt = toDate(t.last.createdAt);
            return t;
        }).filter(function (t) { return t.msgs.some(function (m) { return m.from === ME.id || m.to === ME.id; }); });
        out.sort(function (a, b) { return b.lastAt - a.lastAt; });
        return out;
    }
    function unreadCount() {
        return buildThreads().filter(function (t) { return !t.trashed && t.hasInbox; })
            .reduce(function (s, t) { return s + t.unread; }, 0);
    }
    function visibleThreads() {
        var f = state.folder, q = state.search.trim().toLowerCase();
        return buildThreads().filter(function (t) {
            if (f === 'trash') { if (!t.trashed) return false; }
            else if (t.trashed) return false;
            if (f === 'inbox' && !t.hasInbox) return false;
            if (f === 'sent' && !t.hasSent) return false;
            if (f === 'starred' && !t.starred) return false;
            if (q) {
                var hay = (t.subject + ' ' + t.msgs.map(function (m) { return m.body + ' ' + m.fromName + ' ' + m.toName; }).join(' ')).toLowerCase();
                if (hay.indexOf(q) === -1) return false;
            }
            return true;
        });
    }
    function threadById(tid) { return buildThreads().filter(function (t) { return t.id === tid; })[0] || null; }

    /* ───────── actions ───────── */
    function sendMessage(o) {
        return fdb().collection(COL).add({
            threadId: o.threadId || newId('t'), from: ME.id, fromName: ME.name,
            to: o.to, toName: o.toName || o.to, subject: o.subject || '(no subject)', body: o.body || '',
            attachments: o.attachments || [], createdAt: FV().serverTimestamp(), readAt: null,
            starredBy: [], trashedBy: []
        });
    }
    function markThreadRead(t) {
        var ids = t.msgs.filter(function (m) { return m.to === ME.id && !m.readAt; }).map(function (m) { return m.id; });
        ids.forEach(function (id) {
            fdb().collection(COL).doc(id).update({ readAt: FV().serverTimestamp() }).catch(function () {});
            docs[id].readAt = new Date().toISOString();            // instant UI, real value comes back by snapshot
        });
        if (ids.length) { updateBadge(unreadCount()); }
    }
    function setThreadFlag(t, field, on) {
        var arr = field === 'star' ? 'starredBy' : 'trashedBy';
        t.msgs.forEach(function (m) {
            var upd = {};
            upd[arr] = on ? FV().arrayUnion(myKey()) : FV().arrayRemove(myKey());
            fdb().collection(COL).doc(m.id).update(upd).catch(function () {});
            var list = m[arr] || [];
            m[arr] = on ? list.concat(list.indexOf(myKey()) === -1 ? [myKey()] : []) : list.filter(function (x) { return x !== myKey(); });
        });
        render();
    }
    function deleteForever(t) {
        if (!confirm('Permanently delete this conversation?')) return;
        t.msgs.forEach(function (m) { fdb().collection(COL).doc(m.id).delete().catch(function () {}); delete docs[m.id]; });
        state.open = null; render();
    }
    function loadReporters() {
        if (ME.role !== 'admin') return Promise.resolve();
        return fdb().collection('reporters').get().then(function (snap) {
            state.reporters = snap.docs.map(function (d) { var x = d.data(); return { username: d.id, name: x.name || d.id, blocked: !!x.blocked }; })
                .sort(function (a, b) { return a.name.localeCompare(b.name); });
        }).catch(function () { state.reporters = []; });
    }

    /* ───────── UI ───────── */
    function toast(msg) {
        var t = document.createElement('div');
        t.className = 'mb-toast';
        t.textContent = msg;
        document.body.appendChild(t);
        setTimeout(function () { t.remove(); }, 2800);
    }
    function folderBtn(id, icon, label, count) {
        return '<button class="mb-folder' + (state.folder === id ? ' active' : '') + '" data-folder="' + id + '">' + icon + ' ' + label +
            (count ? '<span class="mb-count">' + count + '</span>' : '') + '</button>';
    }
    function snippet(t) {
        var b = (t.last.body || '').replace(/\s+/g, ' ').trim();
        return b.length > 90 ? b.slice(0, 90) + '…' : b;
    }
    function render(opts) {
        if (!rootEl) return;
        var list = visibleThreads();
        var unread = unreadCount();
        var draftEl = rootEl.querySelector('#mb-reply-ta');
        // keep what the user is typing across live refreshes; reset when switching thread/folder
        var keepDraft = (opts && opts.resetDraft) ? '' : (draftEl ? draftEl.value : state.draft);
        state.draft = keepDraft;
        var searchEl = rootEl.querySelector('.mb-search');
        var searchHadFocus = searchEl && document.activeElement === searchEl;
        var caret = searchHadFocus ? searchEl.selectionStart : null;

        var side = '<aside class="mb-side">' +
            '<button class="mb-compose-btn" data-act="compose">✏️ Compose</button>' +
            folderBtn('inbox', '📥', 'Inbox', unread) +
            folderBtn('starred', '⭐', 'Starred') +
            folderBtn('sent', '📤', 'Sent') +
            folderBtn('trash', '🗑️', 'Trash') + '</aside>';

        var listHtml = '<section class="mb-list"><div class="mb-toolbar"><input class="mb-search" placeholder="🔎 Search mail" value="' + esc(state.search) + '"></div>' +
            '<div class="mb-threads">' + (list.length ? list.map(function (t) {
                var sel = state.open === t.id ? ' sel' : '';
                return '<div class="mb-item' + (t.unread ? ' unread' : '') + sel + '" data-tid="' + esc(t.id) + '">' +
                    '<div class="mb-av">' + initial(t.otherName) + '</div>' +
                    '<div class="mb-meta"><div class="mb-row1"><span class="mb-from">' + esc(t.otherName) + '</span><span class="mb-time">' + fmtTime(t.lastAt) + '</span></div>' +
                    '<div class="mb-subj">' + esc(t.subject) + '</div><div class="mb-snip">' + esc(snippet(t)) + '</div></div>' +
                    '<button class="mb-star' + (t.starred ? ' on' : '') + '" data-star="' + esc(t.id) + '" title="Star">' + (t.starred ? '★' : '☆') + '</button></div>';
            }).join('') : '<div class="mb-empty">📭 Mail illa</div>') + '</div></section>';

        var reader;
        if (state.composing) reader = composeHtml();
        else {
            var t = state.open ? threadById(state.open) : null;
            reader = t ? threadHtml(t) : '<section class="mb-read"><div class="mb-empty">📨 Oru conversation select pannunga — illa Compose pannunga</div></section>';
        }

        rootEl.innerHTML = '<div class="mb-app' + (state.mobileRead ? ' show-read' : '') + '">' + side + listHtml + reader + '</div>';

        var s2 = rootEl.querySelector('.mb-search');
        if (s2 && searchHadFocus) { s2.focus(); try { s2.setSelectionRange(caret, caret); } catch (e) {} }
        var ta = rootEl.querySelector('#mb-reply-ta');
        if (ta) ta.value = keepDraft;
    }
    function threadHtml(t) {
        var inTrash = t.trashed;
        var msgs = t.msgs.map(function (m) {
            var mine = m.from === ME.id;
            var atts = (m.attachments || []).map(function (a) {
                return '<a class="mb-att" href="' + esc(a.url) + '" target="_blank" rel="noopener">' +
                    (/image/.test(a.type || '') || /\.(jpe?g|png|gif|webp)$/i.test(a.name || '') ? '<img src="' + esc(a.url) + '" alt="">' : '') +
                    '<span>📎 ' + esc(a.name || 'attachment') + '</span></a>';
            }).join('');
            return '<div class="mb-msg' + (mine ? ' mine' : '') + '">' +
                '<div class="mb-mhead"><span class="mb-av" style="width:26px;height:26px;font-size:.8rem;">' + initial(m.fromName) + '</span>' +
                '<b>' + esc(m.fromName) + '</b><span style="color:#64748b;">→ ' + esc(m.toName) + '</span>' +
                '<span class="mb-mtime">' + fmtFull(toDate(m.createdAt)) + '</span></div>' +
                '<div class="mb-body">' + esc(m.body) + '</div>' + (atts ? '<div class="mb-atts">' + atts + '</div>' : '') + '</div>';
        }).join('');
        var starOn = t.starred;
        var actions = inTrash
            ? '<button class="mb-btn" data-act="restore" data-tid="' + esc(t.id) + '">↩ Restore</button>' +
              (ME.role === 'admin' ? '<button class="mb-btn danger" data-act="delete" data-tid="' + esc(t.id) + '">🗑 Delete forever</button>' : '')
            : '<button class="mb-btn" data-act="trash" data-tid="' + esc(t.id) + '">🗑 Trash</button>';
        return '<section class="mb-read">' +
            '<div class="mb-rhead"><button class="mb-btn mb-back" data-act="back">←</button><h3>' + esc(t.subject) + '</h3>' +
            '<button class="mb-btn" data-act="star" data-tid="' + esc(t.id) + '">' + (starOn ? '★ Starred' : '☆ Star') + '</button>' + actions + '</div>' +
            '<div class="mb-msgs">' + msgs + '</div>' +
            (inTrash ? '' :
            '<div class="mb-reply"><textarea class="mb-ta" id="mb-reply-ta" placeholder="Reply type pannunga…"></textarea>' +
            '<div class="mb-row"><button class="mb-btn primary" data-act="send-reply" data-tid="' + esc(t.id) + '">➤ Send</button>' +
            '<label class="mb-btn" style="cursor:pointer;">📎 Attach<input type="file" accept="image/*" data-att="reply" hidden></label>' +
            attChips() + '</div></div>') + '</section>';
    }
    function attChips() {
        return state.attachments.map(function (a, i) {
            return '<span class="mb-chip">📎 ' + esc(a.name) + '<button data-rm-att="' + i + '">✕</button></span>';
        }).join('');
    }
    function composeHtml() {
        var toField;
        if (ME.role === 'admin') {
            var opts = '<option value="__all__">📢 All reporters (individual mail)</option>' + state.reporters.map(function (r) {
                return '<option value="' + esc(r.username) + '"' + (state.compose && state.compose.to === r.username ? ' selected' : '') + '>' + esc(r.name) + ' (@' + esc(r.username) + ')' + (r.blocked ? ' — blocked' : '') + '</option>';
            }).join('');
            toField = '<select class="mb-select" id="mb-to">' + opts + '</select>';
        } else {
            toField = '<input class="mb-input" value="Admin — EndLess News" disabled>';
        }
        var c = state.compose || { subject: '', body: '' };
        return '<section class="mb-read"><div class="mb-compose">' +
            '<div class="mb-rhead" style="padding:0;border:none;"><h3>✏️ New message</h3></div>' +
            '<label style="font-size:.8rem;font-weight:700;color:#64748b;">To</label>' + toField +
            '<label style="font-size:.8rem;font-weight:700;color:#64748b;">Subject</label>' +
            '<input class="mb-input" id="mb-subj" value="' + esc(c.subject) + '" placeholder="Subject">' +
            '<label style="font-size:.8rem;font-weight:700;color:#64748b;">Message</label>' +
            '<textarea class="mb-ta" id="mb-body" style="min-height:180px;" placeholder="Message type pannunga…">' + esc(c.body) + '</textarea>' +
            '<div class="mb-row"><label class="mb-btn" style="cursor:pointer;">📎 Attach image<input type="file" accept="image/*" data-att="compose" hidden></label>' + attChips() + '</div>' +
            '<div class="mb-row" style="justify-content:flex-end;"><button class="mb-btn" data-act="cancel-compose">Cancel</button>' +
            '<button class="mb-btn primary" data-act="send-compose">➤ Send</button></div></div></section>';
    }

    /* ───────── events ───────── */
    function wire(root) {
        root.addEventListener('click', function (e) {
            var f = e.target.closest('[data-folder]');
            if (f) { state.folder = f.dataset.folder; state.open = null; state.composing = false; state.mobileRead = false; state.draft = ''; render({ resetDraft: true }); return; }
            var st = e.target.closest('[data-star]');
            if (st) { e.stopPropagation(); var tt = threadById(st.dataset.star); if (tt) setThreadFlag(tt, 'star', !tt.starred); return; }
            var ra = e.target.closest('[data-rm-att]');
            if (ra) { state.attachments.splice(+ra.dataset.rmAtt, 1); render(); return; }
            var it = e.target.closest('.mb-item');
            if (it) {
                state.open = it.dataset.tid; state.composing = false; state.mobileRead = true;
                var t = threadById(state.open);
                if (t) markThreadRead(t);
                state.draft = ''; state.attachments = []; render({ resetDraft: true }); return;
            }
            var act = e.target.closest('[data-act]');
            if (!act) return;
            var a = act.dataset.act;
            if (a === 'compose') { state.composing = true; state.open = null; state.mobileRead = true; state.compose = { to: '', subject: '', body: '' }; state.attachments = []; loadReporters().then(render); render(); return; }
            if (a === 'cancel-compose') { state.composing = false; state.mobileRead = false; render(); return; }
            if (a === 'back') { state.mobileRead = false; render(); return; }
            if (a === 'send-compose') return doCompose();
            if (a === 'send-reply') return doReply(act.dataset.tid);
            if (a === 'star') { var s = threadById(act.dataset.tid); if (s) setThreadFlag(s, 'star', !s.starred); return; }
            if (a === 'trash') { var tr = threadById(act.dataset.tid); if (tr) { setThreadFlag(tr, 'trash', true); state.open = null; state.mobileRead = false; toast('🗑 Trash-ku poachu'); } return; }
            if (a === 'restore') { var rs = threadById(act.dataset.tid); if (rs) { setThreadFlag(rs, 'trash', false); toast('↩ Restored'); } return; }
            if (a === 'delete') { var dl = threadById(act.dataset.tid); if (dl) deleteForever(dl); return; }
        });
        root.addEventListener('input', function (e) {
            if (e.target.classList.contains('mb-search')) { state.search = e.target.value; render(); }
        });
        root.addEventListener('change', function (e) {
            var inp = e.target;
            if (inp.dataset && inp.dataset.att) { uploadAttachment(inp.files[0], inp.dataset.att); inp.value = ''; }
            if (inp.id === 'mb-to' && state.compose) state.compose.to = inp.value;
        });
    }
    function uploadAttachment(file, where) {
        if (!file) return;
        if (!ME.uploadFn) { toast('⚠️ Upload setup illa'); return; }
        toast('⏳ Uploading ' + file.name + '…');
        Promise.resolve(ME.uploadFn(file)).then(function (url) {
            if (!url) { toast('⚠️ Upload failed'); return; }
            state.attachments.push({ name: file.name, url: url, type: file.type || 'image/*' });
            toast('📎 Attached');
            render();
        }).catch(function () { toast('⚠️ Upload failed'); });
    }
    function doCompose() {
        var subj = (document.getElementById('mb-subj') || {}).value || '';
        var body = (document.getElementById('mb-body') || {}).value || '';
        var to = ME.role === 'admin' ? ((document.getElementById('mb-to') || {}).value || '') : ADMIN_ID;
        if (!body.trim() && !state.attachments.length) { toast('✍️ Message type pannunga'); return; }
        if (!subj.trim()) subj = '(no subject)';
        var atts = state.attachments.slice();
        var targets = (to === '__all__') ? state.reporters.filter(function (r) { return !r.blocked; }).map(function (r) { return r.username; }) : [to];
        if (!targets.length) { toast('⚠️ Reporters illa'); return; }
        Promise.all(targets.map(function (u) {
            var rep = state.reporters.filter(function (r) { return r.username === u; })[0];
            return sendMessage({ to: u, toName: rep ? rep.name : u, subject: subj, body: body, attachments: atts });
        })).then(function () {
            state.composing = false; state.attachments = []; state.compose = null; state.mobileRead = false;
            state.folder = 'sent'; state.open = null;
            toast('✅ Sent' + (targets.length > 1 ? ' to ' + targets.length + ' reporters' : ''));
            render();
        }).catch(function (err) { toast('⚠️ Send failed: ' + (err && err.message || err)); });
    }
    function doReply(tid) {
        var t = threadById(tid);
        var ta = document.getElementById('mb-reply-ta');
        var body = ta ? ta.value : '';
        if (!t) return;
        if (!body.trim() && !state.attachments.length) { toast('✍️ Reply type pannunga'); return; }
        var subj = /^re:/i.test(t.subject) ? t.subject : 'Re: ' + t.subject;
        var atts = state.attachments.slice();
        if (ta) ta.value = '';
        sendMessage({ threadId: t.id, to: t.other, toName: t.otherName, subject: subj, body: body, attachments: atts }).then(function () {
            state.draft = ''; state.attachments = []; toast('✅ Sent');
        }).catch(function (err) {
            var back = document.getElementById('mb-reply-ta'); if (back) back.value = body;   // send fail → text thirumba
            toast('⚠️ Send failed: ' + (err && err.message || err));
        });
    }

    /* ───────── mounting ───────── */
    function mountInto(container) {
        injectStyle();
        container.innerHTML = '<div class="mb-root"></div>';
        rootEl = container.querySelector('.mb-root');
        wire(rootEl);
        state.composing = false;
        render();
    }

    /* ───────── public API ───────── */
    var MailBox = {
        /* Admin page: called once at load (starts listening + sets the sidebar badge) */
        initAdmin: function () {
            ME = { role: 'admin', id: ADMIN_ID, name: 'EndLess News Admin', uploadFn: global.uploadToCloudinary, badgeId: 'mb-badge-admin' };
            injectStyle();
            // dashboard.js initialises Firebase a bit later → wait until an app exists, then listen
            var tries = 0;
            var waitFb = setInterval(function () {
                tries++;
                if (!(global.firebase && firebase.apps && firebase.apps.length)) { if (tries > 120) clearInterval(waitFb); return; }
                clearInterval(waitFb);
                firebase.auth().onAuthStateChanged(function (u) { if (u) startListeners(); });
            }, 250);
            // Messages page → show the Gmail UI inside #mb-admin-root
            var orig = global.showPageContinue;
            if (typeof orig === 'function' && !orig._mbWrapped) {
                global.showPageContinue = function (page) {
                    orig.apply(this, arguments);
                    if (page === 'messages') MailBox.mountAdmin();
                };
                global.showPageContinue._mbWrapped = true;
            }
        },
        mountAdmin: function () {
            if (!ME || ME.role !== 'admin') return;
            var c = document.getElementById('mb-admin-root');
            if (!c) return;
            if (!c.querySelector('.mb-root')) mountInto(c); else { rootEl = c.querySelector('.mb-root'); render(); }
            loadReporters().then(render);
        },
        /* Reporter panel: called after the reporter session is known */
        initReporter: function (o) {
            ME = { role: 'rep', id: o.username, name: o.name || o.username, uploadFn: o.uploadFn, badgeId: o.badgeId || 'mb-badge-rep' };
            injectStyle();
            startListeners();
        },
        isReporterReady: function () { return !!(ME && ME.role === 'rep'); },
        /* Reporter panel: Profile menu → Messages (full-screen Gmail-like overlay) */
        openReporter: function () {
            if (!ME || ME.role !== 'rep') { toast('⚠️ Login aagalai — refresh pannunga'); return; }
            if (!liveStarted) setStatus('⏳ Connecting…');
            var ov = document.getElementById('mb-overlay');
            if (!ov) {
                ov = document.createElement('div');
                ov.id = 'mb-overlay';
                ov.className = 'mb-overlay';
                ov.innerHTML = '<div class="mb-overlay-box"><div class="mb-overlay-top"><span>📨 Messages — Admin</span>' +
                    '<span id="mb-status" style="font-size:.78rem;color:#64748b;font-weight:600;margin-left:8px;">' + esc(lastStatus) + '</span>' +
                    '<span style="flex:1"></span><button class="mb-btn" id="mb-close">✕ Close</button></div>' +
                    '<div id="mb-rep-root" style="flex:1;min-height:0;display:flex;"></div></div>';
                document.body.appendChild(ov);
                ov.querySelector('#mb-close').addEventListener('click', function () { ov.style.display = 'none'; });
                ov.addEventListener('click', function (e) { if (e.target === ov) ov.style.display = 'none'; });
            }
            ov.style.display = 'flex';
            var host = ov.querySelector('#mb-rep-root');
            if (!host.querySelector('.mb-root')) mountInto(host); else { rootEl = host.querySelector('.mb-root'); render(); }
        }
    };
    global.MailBox = MailBox;
})(window);