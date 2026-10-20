define(function() { return /******/ (function() { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 118:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

/* harmony import */ var _node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(601);
/* harmony import */ var _node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(314);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
// Imports


var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()((_node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default()));
// Module
___CSS_LOADER_EXPORT___.push([module.id, "/*\n * This file is part of Moodle - https://moodle.org/\n *\n * Moodle is free software: you can redistribute it and/or modify\n * it under the terms of the GNU General Public License as published by\n * the Free Software Foundation, either version 3 of the License, or\n * (at your option) any later version.\n *\n * Moodle is distributed in the hope that it will be useful,\n * but WITHOUT ANY WARRANTY; without even the implied warranty of\n * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n * GNU General Public License for more details.\n *\n * You should have received a copy of the GNU General Public License\n * along with Moodle.  If not, see <https://www.gnu.org/licenses/>.\n */\n\n/*\n * Styles of the teacher document management view — shadcn/ui redesign.\n *\n * Uses the same design tokens defined in styles.css (--nexusai-*).\n * If this CSS is loaded without styles.css as the parent scope, the tokens fall\n * back to the hardcoded values in the comments.\n */\n\n.nexusai-documents {\n    display: flex;\n    align-items: flex-start;\n    gap: 24px;\n    max-width: 1200px;\n    margin: 16px 0;\n\n    /* Design tokens — mirrors .nexusai-widget in styles.css.\n       Required because CSS variables are scoped to the element they're defined on,\n       and the documents page root is .nexusai-documents, not .nexusai-widget. */\n    --nexusai-primary:        #6366f1;\n    --nexusai-primary-hover:  #4f46e5;\n    --nexusai-primary-dark:   #3b5bdb;\n    --nexusai-primary-light:  rgba(99, 102, 241, 0.1);\n    --nexusai-primary-ring:   rgba(99, 102, 241, 0.2);\n    --nexusai-primary-subtle:  #e6edfb;\n    --nexusai-bg:             #ffffff;\n    --nexusai-bg-muted:       #f8fafc;\n    --nexusai-bg-subtle:      #f1f5f9;\n    --nexusai-surface:        #f7f8fc;\n    --nexusai-border:         #e2e8f0;\n    --nexusai-border-strong:  #cbd5e1;\n    --nexusai-border-hover:   #c6d4f0;\n    --nexusai-fg:             #0f172a;\n    --nexusai-fg-muted:       #64748b;\n    --nexusai-fg-subtle:      #94a3b8;\n    --nexusai-success-bg:     #f0fdf4;\n    --nexusai-success-fg:     #166534;\n    --nexusai-success-border: #bbf7d0;\n    --nexusai-danger-bg:      #fef2f2;\n    --nexusai-danger-fg:      #991b1b;\n    --nexusai-danger-border:  #fecaca;\n    --nexusai-danger-solid:   #dc2626;\n    --nexusai-warning-bg:     #fef3c7;\n    --nexusai-warning-fg:     #92400e;\n    --nexusai-warning-border: #fde68a;\n    --nexusai-info-bg:        #eff6ff;\n    --nexusai-info-fg:        #1e40af;\n    --nexusai-info-border:    #bfdbfe;\n    --nexusai-radius-sm:      4px;\n    --nexusai-radius:         8px;\n    --nexusai-radius-md:      10px;\n    --nexusai-radius-lg:      12px;\n    --nexusai-radius-xl:      16px;\n    --nexusai-radius-full:    9999px;\n    --nexusai-shadow-sm:      0 1px 2px 0 rgba(0,0,0,0.05);\n    --nexusai-shadow:         0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -1px rgba(0,0,0,0.04);\n    --nexusai-shadow-md:      0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -2px rgba(0,0,0,0.04);\n}\n\n/* ── Nav lateral (RDS-05) — reemplaza .nexusai-doc-tabs ── */\n.nexusai-doc-sidebar {\n    flex-shrink: 0;\n    width: 232px;\n    position: sticky;\n    top: 16px;\n    display: flex;\n    flex-direction: column;\n    gap: 16px;\n}\n.nexusai-doc-sidebar__course {\n    display: flex;\n    flex-direction: column;\n    gap: 2px;\n    padding: 12px 14px;\n    background: var(--nexusai-bg, #fff);\n    border: 1px solid var(--nexusai-border, #e2e8f0);\n    border-radius: var(--nexusai-radius, 8px);\n}\n.nexusai-doc-sidebar__course-label {\n    font-size: 11px;\n    font-weight: 500;\n    color: var(--nexusai-fg-muted, #64748b);\n    text-transform: uppercase;\n    letter-spacing: 0.4px;\n}\n.nexusai-doc-sidebar__course-name {\n    font-size: 14px;\n    font-weight: 600;\n    color: var(--nexusai-fg, #1e293b);\n    line-height: 1.3;\n}\n.nexusai-doc-nav {\n    display: flex;\n    flex-direction: column;\n    gap: 2px;\n}\n.nexusai-doc-nav__item {\n    display: flex;\n    align-items: center;\n    gap: 10px;\n    width: 100%;\n    padding: 9px 12px;\n    font-size: 13.5px;\n    font-weight: 500;\n    color: var(--nexusai-fg-muted, #64748b);\n    background: none;\n    border: none;\n    border-radius: var(--nexusai-radius, 8px);\n    cursor: pointer;\n    text-align: left;\n    transition: background .12s, color .12s;\n}\n.nexusai-doc-nav__item:hover {\n    background: var(--nexusai-bg-subtle, #f1f5f9);\n    color: var(--nexusai-fg, #1e293b);\n}\n.nexusai-doc-nav__item--active {\n    background: var(--nexusai-primary-subtle);\n    color: var(--nexusai-primary, #6366f1);\n}\n.nexusai-doc-nav__item span:first-of-type {\n    flex: 1;\n}\n.nexusai-doc-nav__badge {\n    font-size: 11px;\n    font-weight: 600;\n    padding: 1px 7px;\n    border-radius: var(--nexusai-radius-full, 9999px);\n    background: var(--nexusai-bg-subtle, #f1f5f9);\n    color: var(--nexusai-fg-muted, #64748b);\n}\n.nexusai-doc-nav__item--active .nexusai-doc-nav__badge {\n    background: rgba(99, 102, 241, 0.15);\n    color: var(--nexusai-primary, #6366f1);\n}\n.nexusai-doc-sidebar__status {\n    display: flex;\n    align-items: center;\n    gap: 7px;\n    padding: 9px 12px;\n    font-size: 12.5px;\n    font-weight: 500;\n    color: #166534;\n    background: #f0fdf4;\n    border: 1px solid #bbf7d0;\n    border-radius: var(--nexusai-radius, 8px);\n}\n\n.nexusai-doc-content {\n    flex: 1;\n    min-width: 0;\n}\n\n/* SaaS-style card container (RDS-07) — wraps functional sections\n   (e.g. dropzone + Material table) so they read as a block of their own,\n   consistent with .nexusai-gap-item/.nexusai-analytics__section. */\n.nexusai-doc-card {\n    background: var(--nexusai-bg, #fff);\n    border: 1px solid var(--nexusai-border, #e2e8f0);\n    border-radius: var(--nexusai-radius-lg, 12px);\n    box-shadow: var(--nexusai-shadow-sm, 0 1px 2px rgba(0,0,0,0.05));\n    padding: 20px;\n    min-width: 0;\n}\n.nexusai-doc-card .nexusai-documents__heading:first-child { margin-top: 0; }\n\n.nexusai-documents__intro {\n    font-size: 13.5px;\n    line-height: 1.6;\n    margin-bottom: 20px;\n    padding: 12px 16px;\n    background: var(--nexusai-primary-light, rgba(99,102,241,0.07));\n    border: 1px solid var(--nexusai-primary-ring, rgba(99,102,241,0.2));\n    border-radius: var(--nexusai-radius, 8px);\n    color: var(--nexusai-fg-muted, #475569);\n}\n\n.nexusai-documents__heading {\n    font-size: 15px;\n    font-weight: 600;\n    margin: 28px 0 12px;\n    color: var(--nexusai-fg, #1e293b);\n    letter-spacing: -0.01em;\n}\n\n/* ONB-07 (#430): Help tab — one card per tool. */\n.nexusai-help__card {\n    padding-bottom: 20px;\n    margin-bottom: 20px;\n    border-bottom: 1px solid var(--nexusai-border, #e2e8f0);\n}\n.nexusai-help__card:last-child {\n    padding-bottom: 0;\n    margin-bottom: 0;\n    border-bottom: none;\n}\n.nexusai-help__card-title {\n    margin-top: 0;\n}\n.nexusai-help__card-body {\n    margin: 0;\n    font-size: 13.5px;\n    line-height: 1.6;\n    color: var(--nexusai-fg-muted, #475569);\n}\n\n/* UX-17 (#387): same style as .nexusai-gaps__load-more further below. */\n.nexusai-documents__load-more {\n    display: block;\n    width: 100%;\n    margin-top: 8px;\n    padding: 8px 10px;\n    font-size: 12.5px;\n    font-weight: 600;\n    color: var(--nexusai-primary, #6366f1);\n    background: var(--nexusai-surface);\n    border: 1px solid var(--nexusai-border);\n    border-radius: 6px;\n    cursor: pointer;\n    transition: all .12s;\n}\n.nexusai-documents__load-more:hover {\n    border-color: var(--nexusai-border-hover);\n}\n.nexusai-documents__load-more:disabled {\n    color: var(--nexusai-fg-subtle);\n    cursor: default;\n}\n\n/* ============================================================\n   Upload queue (CONT-06, #320) — individual progress per file\n   when several are dropped/chosen at once.\n============================================================ */\n.nexusai-upload-queue {\n    list-style: none;\n    margin: 10px 0 0;\n    padding: 0;\n    display: flex;\n    flex-direction: column;\n    gap: 6px;\n}\n.nexusai-upload-queue__item {\n    display: flex;\n    align-items: center;\n    gap: 8px;\n    padding: 6px 10px;\n    font-size: 12.5px;\n    background: var(--nexusai-bg-muted, #f8fafc);\n    border: 1px solid var(--nexusai-border, #e2e8f0);\n    border-radius: 6px;\n}\n.nexusai-upload-queue__item--error {\n    background: rgba(220, 38, 38, 0.06);\n    border-color: rgba(220, 38, 38, 0.25);\n}\n.nexusai-upload-queue__name {\n    flex: 1 1 auto;\n    min-width: 0;\n    overflow: hidden;\n    text-overflow: ellipsis;\n    white-space: nowrap;\n    font-weight: 600;\n    color: var(--nexusai-fg, #1e293b);\n}\n.nexusai-upload-queue__status {\n    flex: 0 0 auto;\n    color: var(--nexusai-fg-muted, #64748b);\n}\n.nexusai-upload-queue__item--error .nexusai-upload-queue__status {\n    color: #b91c1c;\n}\n.nexusai-upload-queue__dismiss {\n    flex: 0 0 auto;\n    border: none;\n    background: transparent;\n    color: #b91c1c;\n    font-size: 16px;\n    line-height: 1;\n    cursor: pointer;\n    padding: 0 2px;\n}\n\n/* ============================================================\n   Drop zone\n============================================================ */\n.nexusai-dropzone {\n    border: 2px dashed var(--nexusai-border-strong, #cbd5e1);\n    border-radius: var(--nexusai-radius-lg, 12px);\n    padding: 40px 28px;\n    text-align: center;\n    background: var(--nexusai-bg-muted, #f8fafc);\n    color: var(--nexusai-fg-muted, #475569);\n    cursor: pointer;\n    transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;\n    user-select: none;\n}\n.nexusai-dropzone:hover:not(.nexusai-dropzone--disabled) {\n    border-color: var(--nexusai-primary, #6366f1);\n    background: var(--nexusai-primary-light, rgba(99,102,241,0.07));\n    box-shadow: 0 0 0 4px var(--nexusai-primary-ring, rgba(99,102,241,0.15));\n}\n.nexusai-dropzone--dragover {\n    border-color: var(--nexusai-primary, #6366f1);\n    background: var(--nexusai-primary-light, rgba(99,102,241,0.07));\n    box-shadow: 0 0 0 4px var(--nexusai-primary-ring, rgba(99,102,241,0.15));\n    transform: scale(1.005);\n}\n.nexusai-dropzone--disabled {\n    opacity: 0.55;\n    cursor: not-allowed;\n}\n.nexusai-dropzone__icon {\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    width: 56px;\n    height: 56px;\n    margin: 0 auto 12px;\n    border-radius: var(--nexusai-radius-full, 9999px);\n    background: var(--nexusai-primary-light, rgba(99,102,241,0.1));\n    color: var(--nexusai-primary, #6366f1);\n}\n.nexusai-dropzone__spinner {\n    width: 26px;\n    height: 26px;\n    border: 3px solid var(--nexusai-primary-ring, rgba(99,102,241,0.2));\n    border-top-color: var(--nexusai-primary, #6366f1);\n    border-radius: 50%;\n    animation: nexusai-dropzone-spin .8s linear infinite;\n}\n@keyframes nexusai-dropzone-spin {\n    to { transform: rotate(360deg); }\n}\n.nexusai-dropzone__title {\n    font-size: 15px;\n    font-weight: 600;\n    color: var(--nexusai-fg, #1e293b);\n    margin-bottom: 4px;\n}\n.nexusai-dropzone__hint {\n    font-size: 13px;\n    color: var(--nexusai-fg-muted, #64748b);\n    margin-bottom: 8px;\n}\n.nexusai-dropzone__formats {\n    font-size: 11px;\n    color: var(--nexusai-fg-subtle, #94a3b8);\n    margin-top: 8px;\n    font-family: ui-monospace, \"SF Mono\", Menlo, Consolas, monospace;\n}\n\n/* ============================================================\n   Bulk actions on documents (CONT-09, #358)\n============================================================ */\n.nexusai-bulkbar {\n    display: flex;\n    align-items: center;\n    gap: 14px;\n    padding: 8px 12px;\n    margin-bottom: 8px;\n    background: var(--nexusai-primary-light, rgba(99,102,241,0.07));\n    border: 1px solid var(--nexusai-primary-ring, rgba(99,102,241,0.2));\n    border-radius: var(--nexusai-radius, 8px);\n    font-size: 13px;\n}\n.nexusai-bulkbar__count {\n    font-weight: 600;\n    color: var(--nexusai-fg, #1e293b);\n}\n.nexusai-bulkbar__cancel {\n    margin-left: auto;\n    border: none;\n    background: transparent;\n    color: var(--nexusai-fg-muted, #64748b);\n    font-size: 13px;\n    cursor: pointer;\n    text-decoration: underline;\n}\n.nexusai-bulkbar__cancel:disabled,\n.nexusai-bulkbar .nexusai-link-btn:disabled {\n    opacity: 0.55;\n    cursor: not-allowed;\n}\n.nexusai-table__checkbox-col {\n    width: 36px;\n    padding-right: 0 !important;\n}\n\n/* ============================================================\n   Tabla\n============================================================ */\n.nexusai-table-wrap {\n    border: 1px solid var(--nexusai-border, #e2e8f0);\n    border-radius: var(--nexusai-radius, 8px);\n    overflow-x: auto;\n    background: var(--nexusai-bg, white);\n    box-shadow: var(--nexusai-shadow-sm, 0 1px 2px rgba(0,0,0,0.05));\n}\n.nexusai-table {\n    width: 100%;\n    border-collapse: collapse;\n    font-size: 13.5px;\n}\n.nexusai-table th {\n    text-align: left;\n    padding: 10px 16px;\n    background: var(--nexusai-bg-muted, #f8fafc);\n    border-bottom: 1px solid var(--nexusai-border, #e2e8f0);\n    font-size: 11px;\n    font-weight: 600;\n    color: var(--nexusai-fg-muted, #64748b);\n    text-transform: uppercase;\n    letter-spacing: 0.5px;\n}\n.nexusai-table td {\n    padding: 13px 16px;\n    border-bottom: 1px solid var(--nexusai-border, #e2e8f0);\n    vertical-align: middle;\n    color: var(--nexusai-fg, #1e293b);\n}\n.nexusai-table tr:last-child td { border-bottom: none; }\n\n/* Hover en filas */\n.nexusai-table tbody tr {\n    transition: background 0.1s;\n}\n.nexusai-table tbody tr:hover td {\n    background: var(--nexusai-bg-subtle, #f1f5f9);\n}\n\n/* Per-row state indicator — replaces border-left with a subtle background */\n.nexusai-table__row--error td { background: rgba(239, 68, 68, 0.03); }\n.nexusai-table__row--error:hover td { background: rgba(239, 68, 68, 0.06) !important; }\n.nexusai-table__row--indexing td { background: rgba(99, 102, 241, 0.03); }\n.nexusai-table__row--indexing:hover td { background: rgba(99, 102, 241, 0.06) !important; }\n\n.nexusai-table__filename {\n    font-weight: 500;\n    color: var(--nexusai-fg, #1e293b);\n    display: flex;\n    align-items: center;\n    gap: 7px;\n}\n.nexusai-table__filename-icon {\n    flex-shrink: 0;\n    color: var(--nexusai-fg-muted, #64748b);\n}\n.nexusai-table__progress {\n    height: 3px;\n    background: var(--nexusai-border, #e2e8f0);\n    border-radius: var(--nexusai-radius-full, 9999px);\n    margin-top: 6px;\n    overflow: hidden;\n}\n.nexusai-table__progress-fill {\n    height: 100%;\n    background: linear-gradient(90deg, var(--nexusai-primary, #6366f1) 0%, #8b5cf6 100%);\n    width: 60%;\n    animation: nexusai-progress-pulse 2s ease-in-out infinite;\n}\n@keyframes nexusai-progress-pulse {\n    0%, 100% { width: 30%; }\n    50%       { width: 70%; }\n}\n.nexusai-table__actions {\n    text-align: right;\n    width: 130px;\n    white-space: nowrap;\n}\n.nexusai-table__actions .nexusai-link-btn {\n    display: block;\n    margin-left: auto;\n}\n\n/* ============================================================\n   Preview of the extracted text (CONT-08 / #357)\n============================================================ */\n.nexusai-table__preview-row td {\n    padding: 0 12px 12px !important;\n    background: var(--nexusai-bg-subtle, #f8fafc);\n}\n.nexusai-preview {\n    display: flex;\n    flex-direction: column;\n    gap: 8px;\n}\n.nexusai-preview__label {\n    margin: 0;\n    font-size: 12px;\n    color: var(--nexusai-fg-muted, #64748b);\n    line-height: 1.5;\n}\n.nexusai-preview__text {\n    margin: 0;\n    max-height: 180px;\n    overflow: auto;\n    padding: 10px 12px;\n    background: var(--nexusai-bg);\n    border: 1px solid var(--nexusai-border, #e2e8f0);\n    border-radius: 6px;\n    font-size: 12px;\n    line-height: 1.55;\n    color: var(--nexusai-fg-muted);\n    white-space: pre-wrap;\n    word-break: break-word;\n    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;\n}\n.nexusai-preview__status {\n    margin: 0;\n    padding: 4px 0;\n    font-size: 12px;\n    color: var(--nexusai-fg-muted, #64748b);\n}\n.nexusai-preview__status--error {\n    color: #b91c1c;\n}\n\n/* ============================================================\n   Status badges — shadcn style (filled subtle)\n============================================================ */\n.nexusai-badge {\n    display: inline-flex;\n    align-items: center;\n    gap: 4px;\n    padding: 3px 9px;\n    border-radius: var(--nexusai-radius-full, 9999px);\n    font-size: 11px;\n    font-weight: 500;\n    line-height: 1.4;\n    white-space: nowrap;\n    border: 1px solid transparent;\n}\n.nexusai-badge--pending {\n    background: var(--nexusai-bg-subtle, #f1f5f9);\n    color: var(--nexusai-fg-muted, #64748b);\n    border-color: var(--nexusai-border, #e2e8f0);\n}\n.nexusai-badge--indexing {\n    background: #eff6ff;\n    color: #1e40af;\n    border-color: #bfdbfe;\n}\n.nexusai-badge--indexed {\n    background: #f0fdf4;\n    color: #166534;\n    border-color: #bbf7d0;\n}\n.nexusai-badge--error {\n    background: #fef2f2;\n    color: #991b1b;\n    border-color: #fecaca;\n    cursor: help;\n}\n\n/* Animated dot for the indexing state */\n.nexusai-badge--indexing::before {\n    content: \"\";\n    display: inline-block;\n    width: 6px;\n    height: 6px;\n    border-radius: 50%;\n    background: #3b82f6;\n    animation: nexusai-badge-pulse 1.4s ease-in-out infinite;\n}\n@keyframes nexusai-badge-pulse {\n    0%, 100% { opacity: 0.4; transform: scale(0.85); }\n    50%       { opacity: 1;   transform: scale(1); }\n}\n/* Specificity bumped to table level to beat the Boost theme resets. */\n.nexusai-table .nexusai-badge--pending  { background: var(--nexusai-bg-subtle) !important; color: #64748b !important; }\n.nexusai-table .nexusai-badge--indexing { background: #dbeafe !important; color: #1e40af !important; }\n.nexusai-table .nexusai-badge--indexed  { background: #d1fae5 !important; color: #065f46 !important; }\n.nexusai-table .nexusai-badge--error    { background: #fee2e2 !important; color: #991b1b !important; cursor: help; }\n.nexusai-table .nexusai-badge--unknown  { background: var(--nexusai-bg-muted) !important; color: #475569 !important; }\n\n/* ============================================================\n   Buttons / links\n============================================================ */\n.nexusai-link-btn {\n    background: transparent;\n    border: none;\n    color: var(--nexusai-primary, #6366f1);\n    cursor: pointer;\n    font-size: 13px;\n    padding: 4px 6px;\n    border-radius: var(--nexusai-radius-sm, 4px);\n    font-family: inherit;\n    transition: background 0.15s, color 0.15s;\n    text-decoration: none;\n}\n.nexusai-link-btn:hover {\n    background: var(--nexusai-primary-light, rgba(99,102,241,0.08));\n    color: var(--nexusai-primary-hover, #4f46e5);\n}\n.nexusai-link-btn:disabled {\n    color: var(--nexusai-fg-subtle, #94a3b8);\n    cursor: not-allowed;\n    background: transparent;\n}\n.nexusai-link-btn--danger { color: #dc2626; }\n.nexusai-link-btn--danger:hover { background: #fef2f2; color: #991b1b; }\n\n/* ============================================================\n   Estados generales\n============================================================ */\n.nexusai-loading {\n    text-align: center;\n    padding: 48px 24px;\n    color: var(--nexusai-fg-muted, #64748b);\n    font-size: 13.5px;\n}\n.nexusai-empty {\n    text-align: center;\n    padding: 40px 24px;\n    color: var(--nexusai-fg-muted, #64748b);\n    font-size: 13.5px;\n}\n.nexusai-empty__hint {\n    font-size: 12px;\n    color: var(--nexusai-fg-subtle, #94a3b8);\n    margin-top: 6px;\n}\n.nexusai-alert {\n    margin: 16px 0;\n    padding: 12px 16px;\n    border-radius: var(--nexusai-radius, 8px);\n    font-size: 13px;\n    display: flex;\n    align-items: center;\n    justify-content: space-between;\n    gap: 16px;\n    border: 1px solid transparent;\n}\n.nexusai-alert--error {\n    background: #fef2f2;\n    border-color: #fecaca;\n    color: #991b1b;\n}\n\n/* ============================================================\n   Modals (confirmation and error)\n============================================================ */\n.nexusai-modal-overlay {\n    position: fixed;\n    inset: 0;\n    background: rgba(15, 23, 42, 0.45);\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    z-index: 9999;\n    padding: 24px;\n}\n.nexusai-modal {\n    background: var(--nexusai-bg);\n    border-radius: var(--nexusai-radius-lg);\n    box-shadow: var(--nexusai-shadow-md);\n    padding: 28px 32px;\n    width: 100%;\n    max-width: 440px;\n}\n.nexusai-modal__title {\n    font-size: 17px;\n    font-weight: 700;\n    color: var(--nexusai-fg);\n    margin: 0 0 12px;\n}\n.nexusai-modal__title--error {\n    color: #991b1b;\n}\n.nexusai-modal__body {\n    font-size: 14px;\n    color: var(--nexusai-fg-muted);\n    line-height: 1.6;\n    margin: 0 0 24px;\n}\n.nexusai-modal__body--error {\n    color: #7f1d1d;\n    background: #fef2f2;\n    border: 1px solid #fecaca;\n    border-radius: 6px;\n    padding: 10px 14px;\n}\n.nexusai-modal__actions {\n    display: flex;\n    gap: 10px;\n    justify-content: flex-end;\n}\n.nexusai-modal__actions--end {\n    justify-content: flex-end;\n}\n\n/* ============================================================\n   Toast\n============================================================ */\n.nexusai-toast {\n    position: fixed;\n    bottom: 24px;\n    right: 24px;\n    z-index: 10000;\n    padding: 12px 20px;\n    border-radius: 8px;\n    font-size: 14px;\n    font-weight: 500;\n    font-family: inherit;\n    box-shadow: 0 4px 16px rgba(15, 23, 42, 0.14);\n    animation: nexusai-toast-in 0.22s ease;\n    pointer-events: none;\n}\n.nexusai-toast--success {\n    background: #059669;\n    color: #ffffff !important;\n}\n.nexusai-toast--warning {\n    background: #fef3c7;\n    color: #92400e !important;\n    border: 1px solid #fcd34d;\n}\n@keyframes nexusai-toast-in {\n    from { opacity: 0; transform: translateY(6px); }\n    to   { opacity: 1; transform: translateY(0); }\n}\n\n/* Botones de modal */\n.nexusai-btn {\n    display: inline-flex;\n    align-items: center;\n    justify-content: center;\n    border: none;\n    border-radius: var(--nexusai-radius);\n    font-size: 14px;\n    font-weight: 500;\n    font-family: inherit;\n    padding: 9px 18px;\n    cursor: pointer;\n    transition: background 0.15s ease, box-shadow 0.15s ease;\n}\n.nexusai-btn--secondary {\n    background: var(--nexusai-bg-subtle);\n    color: var(--nexusai-fg-muted);\n    border: 1px solid var(--nexusai-border);\n}\n.nexusai-btn--secondary:hover {\n    background: var(--nexusai-border);\n}\n.nexusai-btn--danger {\n    background: #dc2626;\n    color: #ffffff;\n}\n.nexusai-btn--danger:hover {\n    background: #b91c1c;\n    box-shadow: 0 2px 8px rgba(220, 38, 38, 0.35);\n}\n.nexusai-btn--confirm {\n    background: var(--nexusai-primary);\n    color: #ffffff;\n}\n.nexusai-btn--confirm:hover {\n    background: var(--nexusai-primary-hover);\n}\n.nexusai-btn:disabled {\n    opacity: 0.55;\n    cursor: not-allowed;\n}\n\n/* ── Gaps panel ── */\n.nexusai-gaps__filter {\n    display: flex;\n    flex-wrap: wrap;\n    gap: 6px;\n    align-items: center;\n    margin: 12px 0 16px;\n}\n.nexusai-gaps__filter-label {\n    font-size: 13px;\n    color: var(--nexusai-fg-muted);\n    margin-right: 4px;\n}\n\n/* ── Section selector when uploading material (BUS-05) ── */\n.nexusai-documents__section-picker {\n    display: flex;\n    flex-direction: column;\n    gap: 4px;\n    margin-bottom: 10px;\n    max-width: 280px;\n}\n.nexusai-documents__section-picker label {\n    font-size: 13px;\n    color: var(--nexusai-fg-muted);\n}\n.nexusai-documents__section-select {\n    padding: 6px 10px;\n    font-size: 13px;\n    color: var(--nexusai-fg);\n    background: var(--nexusai-bg);\n    border: 1px solid var(--nexusai-border);\n    border-radius: 6px;\n    cursor: pointer;\n}\n.nexusai-documents__section-select:focus-visible {\n    outline: 2px solid var(--nexusai-primary, #6366f1);\n    outline-offset: 1px;\n}\n.nexusai-gaps__filter-btn {\n    padding: 5px 10px;\n    font-size: 12.5px;\n    color: var(--nexusai-fg-muted);\n    background: var(--nexusai-surface);\n    border: 1px solid var(--nexusai-border);\n    border-radius: 6px;\n    cursor: pointer;\n    transition: all .12s;\n}\n.nexusai-gaps__filter-btn:hover {\n    border-color: var(--nexusai-border-hover);\n    color: var(--nexusai-primary, #6366f1);\n}\n.nexusai-gaps__filter-btn--active {\n    background: var(--nexusai-primary, #6366f1);\n    border-color: var(--nexusai-primary, #6366f1);\n    color: #fff;\n}\n\n.nexusai-gaps__empty {\n    text-align: center;\n    padding: 36px 16px;\n    color: var(--nexusai-fg-muted, #64748b);\n    display: flex;\n    flex-direction: column;\n    align-items: center;\n    gap: 4px;\n}\n.nexusai-gaps__empty-icon {\n    width: 44px;\n    height: 44px;\n    display: inline-flex;\n    align-items: center;\n    justify-content: center;\n    border-radius: 9999px;\n    background: #f0fdf4;\n    color: #166534;\n    margin-bottom: 8px;\n}\n.nexusai-gaps__empty-title {\n    font-size: 13px;\n    color: var(--nexusai-fg, #1e293b);\n    margin: 0;\n    font-weight: 500;\n}\n.nexusai-gaps__empty-sub {\n    font-size: 12px;\n    color: var(--nexusai-fg-subtle, #94a3b8);\n    margin-top: 2px;\n}\n\n.nexusai-gaps__list {\n    display: flex;\n    flex-direction: column;\n    gap: 8px;\n}\n.nexusai-gaps__list-header {\n    display: flex;\n    align-items: center;\n    justify-content: space-between;\n    gap: 12px;\n    flex-wrap: wrap;\n    margin: 16px 0 12px;\n}\n.nexusai-gaps__list-header .nexusai-documents__heading {\n    margin: 0;\n}\n.nexusai-gap-item {\n    background: var(--nexusai-bg);\n    border: 1px solid var(--nexusai-border);\n    border-left: 3px solid var(--nexusai-primary, #6366f1);\n    border-radius: 6px;\n    padding: 10px 14px;\n}\n.nexusai-gap-item__row {\n    display: flex;\n    justify-content: space-between;\n    align-items: flex-start;\n    gap: 12px;\n    margin-bottom: 4px;\n}\n.nexusai-gap-item__question {\n    font-size: 14px;\n    color: var(--nexusai-fg, #1e293b);\n    line-height: 1.45;\n    flex: 1;\n}\n.nexusai-gap-item__count {\n    font-size: 12px;\n    font-weight: 700;\n    color: var(--nexusai-primary, #6366f1);\n    background: var(--nexusai-primary-subtle);\n    padding: 2px 8px;\n    border-radius: 12px;\n    flex-shrink: 0;\n}\n.nexusai-gap-item__meta {\n    font-size: 11.5px;\n    color: var(--nexusai-fg-muted);\n    display: flex;\n    flex-wrap: wrap;\n    gap: 6px;\n    align-items: center;\n}\n.nexusai-gap-item__sep {\n    color: #cbd5e1;\n}\n.nexusai-gap-item__similarity {\n    font-weight: 600;\n}\n.nexusai-gap-item__similarity--low  { color: #65a30d; }\n.nexusai-gap-item__similarity--mid  { color: #d97706; }\n.nexusai-gap-item__similarity--high { color: #dc2626; }\n\n/* ── Archivar/desarchivar (DOC-D08, #383) ── */\n.nexusai-gaps__archived-toggle {\n    display: flex;\n    align-items: center;\n    gap: 5px;\n    font-size: 12.5px;\n    color: var(--nexusai-fg-muted);\n    cursor: pointer;\n    margin-left: auto;\n}\n.nexusai-gaps__archived-toggle input {\n    cursor: pointer;\n}\n.nexusai-gap-item--archived {\n    opacity: 0.6;\n}\n.nexusai-gap-item__archived-badge {\n    display: inline-block;\n    font-size: 10px;\n    font-weight: 700;\n    text-transform: uppercase;\n    letter-spacing: 0.4px;\n    color: var(--nexusai-fg-muted);\n    background: var(--nexusai-bg-subtle);\n    border: 1px solid var(--nexusai-border);\n    border-radius: 999px;\n    padding: 1px 7px;\n    margin-left: 8px;\n    vertical-align: middle;\n}\n.nexusai-gaps__load-more {\n    display: block;\n    width: 100%;\n    margin-top: 4px;\n    padding: 8px 10px;\n    font-size: 12.5px;\n    font-weight: 600;\n    color: var(--nexusai-primary, #6366f1);\n    background: var(--nexusai-surface);\n    border: 1px solid var(--nexusai-border);\n    border-radius: 6px;\n    cursor: pointer;\n    transition: all .12s;\n}\n.nexusai-gaps__load-more:hover {\n    border-color: var(--nexusai-border-hover);\n}\n.nexusai-gaps__load-more:disabled {\n    color: var(--nexusai-fg-subtle);\n    cursor: default;\n}\n\n.nexusai-gap-item__archive-btn {\n    display: inline-flex;\n    align-items: center;\n    gap: 4px;\n    background: none;\n    border: none;\n    color: var(--nexusai-primary, #6366f1);\n    font-size: 11.5px;\n    font-weight: 600;\n    cursor: pointer;\n    padding: 0;\n}\n.nexusai-gap-item__archive-btn:hover {\n    text-decoration: underline;\n}\n.nexusai-gap-item__archive-btn:disabled {\n    color: var(--nexusai-fg-subtle);\n    cursor: default;\n    text-decoration: none;\n}\n\n/* ============================================================\n   FAQ dashboard tab (DOC-D02)\n============================================================ */\n.nexusai-faq__list {\n    display: flex;\n    flex-direction: column;\n    gap: 8px;\n}\n.nexusai-faq-topic {\n    background: var(--nexusai-bg);\n    border: 1px solid var(--nexusai-border);\n    border-left: 3px solid var(--nexusai-primary, #6366f1);\n    border-radius: 6px;\n    padding: 10px 14px;\n}\n.nexusai-faq-topic__row {\n    display: flex;\n    justify-content: space-between;\n    align-items: flex-start;\n    gap: 12px;\n}\n.nexusai-faq-topic__label {\n    font-size: 14px;\n    font-weight: 600;\n    color: var(--nexusai-fg, #1e293b);\n    line-height: 1.45;\n    flex: 1;\n}\n.nexusai-faq-topic__count {\n    font-size: 12px;\n    font-weight: 700;\n    color: var(--nexusai-primary, #6366f1);\n    background: var(--nexusai-primary-subtle);\n    padding: 2px 8px;\n    border-radius: 12px;\n    flex-shrink: 0;\n}\n.nexusai-faq-topic__examples {\n    margin: 6px 0 0;\n    padding-left: 18px;\n    font-size: 12px;\n    color: var(--nexusai-fg-muted);\n    line-height: 1.5;\n}\n\n/* RDS-07: topic cards of the teacher's FAQ tab — own class\n   (nexusai-faq-card, NOT nexusai-faq-topic) so it does not affect the\n   \"Most frequent questions\" list of Analytics (RDS-06), which keeps using\n   nexusai-faq-topic unchanged. */\n.nexusai-faq__grid {\n    display: grid;\n    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));\n    gap: 12px;\n}\n.nexusai-faq-card {\n    background: var(--nexusai-bg, #fff);\n    border: 1px solid var(--nexusai-border, #e2e8f0);\n    border-radius: var(--nexusai-radius-lg, 12px);\n    box-shadow: var(--nexusai-shadow-sm, 0 1px 2px rgba(0,0,0,0.05));\n    padding: 14px 16px;\n    min-width: 0;\n}\n.nexusai-faq-card__row {\n    display: flex;\n    align-items: flex-start;\n    gap: 8px;\n}\n.nexusai-faq-card__row svg {\n    flex-shrink: 0;\n    margin-top: 3px;\n    color: var(--nexusai-primary, #6366f1);\n}\n.nexusai-faq-card__label {\n    font-size: 14px;\n    font-weight: 600;\n    color: var(--nexusai-fg, #1e293b);\n    line-height: 1.45;\n    flex: 1;\n}\n.nexusai-faq-card__count {\n    font-size: 12px;\n    font-weight: 700;\n    color: var(--nexusai-primary, #6366f1);\n    background: var(--nexusai-primary-subtle);\n    padding: 2px 8px;\n    border-radius: var(--nexusai-radius-full, 9999px);\n    flex-shrink: 0;\n}\n.nexusai-faq-card__examples {\n    margin: 8px 0 0;\n    padding-left: 18px;\n    font-size: 12px;\n    color: var(--nexusai-fg-muted, #64748b);\n    line-height: 1.5;\n}\n\n/* ============================================================\n   Search tab — scope toggle + new result elements\n============================================================ */\n\n/* \"This course / All my courses\" toggle */\n.nexusai-search__scope {\n    display: flex;\n    gap: 6px;\n    margin: 10px 0 6px;\n}\n\n.nexusai-search__scope-btn {\n    display: inline-flex;\n    align-items: center;\n    gap: 5px;\n    padding: 4px 12px;\n    border: 1px solid var(--nexusai-border, #e2e8f0);\n    border-radius: 20px;\n    background: transparent;\n    font-size: 12px;\n    font-family: inherit;\n    color: var(--nexusai-fg-muted, #64748b);\n    cursor: pointer;\n    transition: border-color 0.15s, color 0.15s, background 0.15s;\n}\n\n.nexusai-search__scope-btn:hover {\n    border-color: var(--nexusai-primary, #4f6ef7);\n    color: var(--nexusai-primary, #4f6ef7);\n}\n\n.nexusai-search__scope-btn--active {\n    background: var(--nexusai-primary-light, rgba(99,102,241,0.08));\n    border-color: var(--nexusai-primary, #4f6ef7);\n    color: var(--nexusai-primary, #4f6ef7);\n    font-weight: 500;\n}\n\n/* Filename rendered as a clickable download button */\n.nexusai-search__filename--btn {\n    background: none;\n    border: none;\n    padding: 0;\n    font-family: inherit;\n    font-size: inherit;\n    font-weight: inherit;\n    color: inherit;\n    cursor: pointer;\n    text-align: left;\n    display: flex;\n    align-items: center;\n    gap: 5px;\n    text-decoration: underline;\n    text-underline-offset: 3px;\n    text-decoration-color: transparent;\n    transition: color 0.15s, text-decoration-color 0.15s;\n}\n\n.nexusai-search__filename--btn:hover {\n    color: var(--nexusai-primary, #4f6ef7);\n    text-decoration-color: var(--nexusai-primary, #4f6ef7);\n}\n\n/* Course name badge shown in global search results */\n.nexusai-search__course {\n    font-size: 11px;\n    color: var(--nexusai-fg-muted, #64748b);\n    background: var(--nexusai-primary-light, rgba(99,102,241,0.06));\n    border-radius: 4px;\n    padding: 2px 6px;\n    display: inline-block;\n    margin: 3px 0 4px;\n}\n\n/* ============================================================\n   Search form — input + submit button inline\n============================================================ */\n\n.nexusai-search__form {\n    display: flex;\n    gap: 8px;\n    align-items: center;\n}\n\n.nexusai-search__input {\n    flex: 1;\n    min-width: 0;\n}\n\n.nexusai-search__btn {\n    padding: 8px 18px;\n    background: var(--nexusai-primary, #4f6ef7);\n    color: #fff;\n    border: none;\n    border-radius: 6px;\n    font-size: 13px;\n    font-family: inherit;\n    font-weight: 500;\n    cursor: pointer;\n    white-space: nowrap;\n    transition: background 0.15s;\n}\n.nexusai-search__btn:disabled {\n    opacity: 0.5;\n    cursor: not-allowed;\n}\n.nexusai-search__btn:hover:not(:disabled) {\n    background: var(--nexusai-primary-dark, #3b5bdb);\n}\n\n/* ============================================================\n   Analytics dashboard tab (ANALYTICS-01/02)\n============================================================ */\n.nexusai-analytics__grid {\n    display: grid;\n    grid-template-columns: 1fr 1fr;\n    gap: 20px;\n    margin-top: 12px;\n}\n@media (max-width: 900px) {\n    .nexusai-analytics__grid {\n        grid-template-columns: 1fr;\n    }\n}\n.nexusai-analytics__section {\n    background: var(--nexusai-bg);\n    border: 1px solid var(--nexusai-border);\n    border-radius: 8px;\n    padding: 14px 16px;\n    /* UX-16: without this, the grid item's automatic minimum size is computed\n       from the content (the minimum width of the daily bars with many\n       days) and \"blows up\" the whole 1fr column instead of staying\n       inside with a scrollbar. */\n    min-width: 0;\n}\n.nexusai-analytics__section-empty {\n    font-size: 13px;\n    color: var(--nexusai-fg-muted);\n    margin: 4px 0 0;\n}\n.nexusai-analytics__query-list {\n    list-style: none;\n    margin: 8px 0 0;\n    padding: 0;\n    display: flex;\n    flex-direction: column;\n    gap: 6px;\n    /* UX-16: defensive cap — it already comes limited to 10 from the backend,\n       but with long questions that wrap, 10 items can take a lot of height\n       on small screens. */\n    max-height: 280px;\n    overflow-y: auto;\n}\n\n/* Generic bars (daily usage / score distribution) */\n.nexusai-analytics__bars {\n    display: flex;\n    align-items: flex-end;\n    gap: 3px;\n    height: 100px;\n    margin-top: 10px;\n}\n.nexusai-analytics__bars--buckets {\n    gap: 10px;\n}\n/* UX-16: with days=365 the daily bars must not shrink to unreadable\n   lines — they scroll horizontally instead of getting squashed. */\n.nexusai-analytics__bars--daily {\n    overflow-x: auto;\n    overflow-y: hidden;\n}\n.nexusai-analytics__bar-col {\n    flex: 1 1 6px;\n    min-width: 6px;\n    display: flex;\n    align-items: flex-end;\n    height: 100%;\n}\n.nexusai-analytics__bucket-col {\n    flex: 1;\n    display: flex;\n    flex-direction: column;\n    align-items: center;\n    justify-content: flex-end;\n    height: 100%;\n}\n.nexusai-analytics__bar {\n    position: relative;\n    width: 100%;\n    min-height: 3px;\n    background: var(--nexusai-primary, #6366f1);\n    border-radius: 3px 3px 0 0;\n    opacity: 0.85;\n    cursor: default;\n}\n.nexusai-analytics__bar:hover,\n.nexusai-analytics__bar:focus-visible {\n    opacity: 1;\n    outline: none;\n}\n.nexusai-analytics__bar--bucket {\n    opacity: 1;\n}\n/* ANALYTICS-04 (#371): a real tooltip (keyboard accessible via focus),\n   instead of the browser's native `title` — it shows instantly and can be\n   styled consistently with the rest of the plugin. */\n.nexusai-analytics__bar-tooltip {\n    position: absolute;\n    bottom: 100%;\n    left: 50%;\n    transform: translateX(-50%);\n    margin-bottom: 6px;\n    padding: 3px 7px;\n    border-radius: 5px;\n    background: var(--nexusai-fg, #1e293b);\n    color: #fff;\n    font-size: 11px;\n    white-space: nowrap;\n    pointer-events: none;\n    z-index: 5;\n}\n.nexusai-analytics__bucket-label {\n    font-size: 10px;\n    color: var(--nexusai-fg-muted);\n    margin-top: 6px;\n    white-space: nowrap;\n}\n\n/* Resumen de puntaje promedio */\n.nexusai-analytics__score-summary {\n    display: flex;\n    align-items: baseline;\n    gap: 8px;\n    margin-top: 6px;\n}\n.nexusai-analytics__score-avg {\n    font-size: 28px;\n    font-weight: 700;\n    color: var(--nexusai-fg, #1e293b);\n}\n.nexusai-analytics__score-sub {\n    font-size: 12px;\n    color: var(--nexusai-fg-muted);\n}\n\n/* Ratio de gaps */\n.nexusai-analytics__gaps-ratio {\n    margin-top: 8px;\n    padding: 12px 14px;\n    border-radius: 8px;\n    display: flex;\n    flex-direction: column;\n    gap: 4px;\n}\n.nexusai-analytics__gaps-ratio-pct {\n    font-size: 26px;\n    font-weight: 700;\n}\n.nexusai-analytics__gaps-ratio-sub {\n    font-size: 12px;\n    color: var(--nexusai-fg-muted);\n}\n.nexusai-analytics__gaps-ratio--low {\n    background: #f0fdf4;\n}\n.nexusai-analytics__gaps-ratio--low .nexusai-analytics__gaps-ratio-pct {\n    color: #166534;\n}\n.nexusai-analytics__gaps-ratio--mid {\n    background: #fef3c7;\n}\n.nexusai-analytics__gaps-ratio--mid .nexusai-analytics__gaps-ratio-pct {\n    color: #92400e;\n}\n.nexusai-analytics__gaps-ratio--high {\n    background: #fef2f2;\n}\n.nexusai-analytics__gaps-ratio--high .nexusai-analytics__gaps-ratio-pct {\n    color: #991b1b;\n}\n\n/* Stat-cards row (RDS-06) */\n.nexusai-analytics__stats {\n    display: grid;\n    grid-template-columns: repeat(4, 1fr);\n    gap: 12px;\n    margin-top: 12px;\n}\n@media (max-width: 900px) {\n    .nexusai-analytics__stats {\n        grid-template-columns: repeat(2, 1fr);\n    }\n}\n@media (max-width: 480px) {\n    .nexusai-analytics__stats {\n        grid-template-columns: 1fr;\n    }\n}\n.nexusai-analytics__stat-card {\n    display: flex;\n    flex-direction: column;\n    gap: 4px;\n    background: var(--nexusai-bg-muted, #f8fafc);\n    border: 1px solid var(--nexusai-border, #e2e8f0);\n    border-radius: var(--nexusai-radius, 8px);\n    padding: 12px 14px;\n    color: var(--nexusai-primary, #6366f1);\n    /* UX-16: keeps the value from forcing the minimum width of the grid column */\n    min-width: 0;\n}\n.nexusai-analytics__stat-value {\n    font-size: 22px;\n    font-weight: 700;\n    color: var(--nexusai-fg, #0f172a);\n}\n.nexusai-analytics__stat-label {\n    font-size: 12px;\n    color: var(--nexusai-fg-muted, #64748b);\n}\n\n/* Content health (RDS-06) */\n.nexusai-analytics__health {\n    margin-top: 12px;\n    padding: 14px 16px;\n    border: 1px solid var(--nexusai-border);\n    border-radius: 8px;\n    background: var(--nexusai-bg);\n}\n.nexusai-analytics__health-head {\n    display: flex;\n    align-items: baseline;\n    justify-content: space-between;\n}\n.nexusai-analytics__health-title {\n    font-size: 13px;\n    font-weight: 600;\n    color: var(--nexusai-fg, #0f172a);\n}\n.nexusai-analytics__health-pct {\n    font-size: 20px;\n    font-weight: 700;\n}\n.nexusai-analytics__health-bar {\n    height: 8px;\n    background: var(--nexusai-bg-subtle);\n    border-radius: 4px;\n    overflow: hidden;\n    margin-top: 8px;\n}\n.nexusai-analytics__health-fill {\n    height: 100%;\n    border-radius: 4px;\n    transition: width .25s ease-out;\n}\n.nexusai-analytics__health-sub {\n    display: block;\n    font-size: 12px;\n    color: var(--nexusai-fg-muted);\n    margin-top: 6px;\n}\n.nexusai-analytics__health--low .nexusai-analytics__health-pct {\n    color: #166534;\n}\n.nexusai-analytics__health--low .nexusai-analytics__health-fill {\n    background: #22c55e;\n}\n.nexusai-analytics__health--mid .nexusai-analytics__health-pct {\n    color: #92400e;\n}\n.nexusai-analytics__health--mid .nexusai-analytics__health-fill {\n    background: #f59e0b;\n}\n.nexusai-analytics__health--high .nexusai-analytics__health-pct {\n    color: #991b1b;\n}\n.nexusai-analytics__health--high .nexusai-analytics__health-fill {\n    background: #ef4444;\n}\n\n/* ============================================================\n   Teacher exam generator (EVAL-02, issue #235)\n   Moved here from styles.css in RDS-07 (#406) — used only by the\n   teacher panel, never shared with the student chat.\n============================================================ */\n.nexusai-exam__doclist {\n    list-style: none;\n    margin: 0 0 16px;\n    display: flex;\n    flex-direction: column;\n    gap: 4px;\n    max-height: 220px;\n    overflow-y: auto;\n    border: 1px solid var(--nexusai-border);\n    border-radius: var(--nexusai-radius-sm);\n    padding: 8px;\n}\n.nexusai-exam__docitem label {\n    display: flex;\n    align-items: center;\n    gap: 8px;\n    padding: 4px 6px;\n    border-radius: var(--nexusai-radius-sm);\n    font-size: 12.5px;\n    color: var(--nexusai-fg);\n    cursor: pointer;\n}\n.nexusai-exam__docitem label:hover { background: var(--nexusai-bg-subtle); }\n\n/* Wizard step indicator (RDS-07) */\n.nexusai-exam__steps {\n    display: flex;\n    align-items: center;\n    gap: 10px;\n    margin-bottom: 16px;\n}\n.nexusai-exam__step {\n    display: flex;\n    align-items: center;\n    gap: 6px;\n    font-size: 12.5px;\n    font-weight: 600;\n    color: var(--nexusai-fg-subtle, #94a3b8);\n}\n.nexusai-exam__step--active {\n    color: var(--nexusai-primary, #6366f1);\n}\n.nexusai-exam__step-num {\n    display: inline-flex;\n    align-items: center;\n    justify-content: center;\n    width: 18px;\n    height: 18px;\n    border-radius: var(--nexusai-radius-full, 9999px);\n    background: var(--nexusai-bg-subtle, #f1f5f9);\n    color: inherit;\n    font-size: 11px;\n}\n.nexusai-exam__step--active .nexusai-exam__step-num {\n    background: var(--nexusai-primary, #6366f1);\n    color: #fff;\n}\n.nexusai-exam__step-arrow {\n    color: var(--nexusai-border-strong, #cbd5e1);\n    font-size: 12px;\n}\n.nexusai-exam__wizard-actions {\n    display: flex;\n    gap: 8px;\n}\n\n.nexusai-exam__form {\n    display: grid;\n    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));\n    gap: 12px;\n    margin-bottom: 16px;\n}\n.nexusai-exam__field {\n    display: flex;\n    flex-direction: column;\n    gap: 4px;\n    font-size: 11.5px;\n    font-weight: 600;\n    color: var(--nexusai-fg-muted);\n}\n.nexusai-exam__field input,\n.nexusai-exam__field select {\n    font-family: inherit;\n    font-size: 12.5px;\n    font-weight: 400;\n    color: var(--nexusai-fg);\n    padding: 6px 8px;\n    border: 1px solid var(--nexusai-border);\n    border-radius: var(--nexusai-radius-sm);\n    background: var(--nexusai-bg);\n}\n\n/* \"Include topics with detected difficulty\" (Gaps/FAQ) — DOC-D09 (#390) */\n.nexusai-exam__focus {\n    margin-bottom: 16px;\n}\n.nexusai-exam__focus-toggle {\n    display: flex;\n    align-items: center;\n    gap: 8px;\n    font-size: 12.5px;\n    font-weight: 600;\n    color: var(--nexusai-fg);\n    cursor: pointer;\n}\n.nexusai-exam__focus-empty {\n    margin: 8px 0 0;\n    font-size: 12px;\n    color: var(--nexusai-fg-muted);\n}\n.nexusai-exam__focus-list {\n    margin-top: 8px;\n}\n.nexusai-exam__focus-badge {\n    flex-shrink: 0;\n    padding: 1px 6px;\n    font-size: 10px;\n    font-weight: 700;\n    text-transform: uppercase;\n    letter-spacing: 0.02em;\n    border-radius: var(--nexusai-radius-full, 9999px);\n}\n.nexusai-exam__focus-badge--gap {\n    color: #92400e;\n    background: #fef3c7;\n}\n.nexusai-exam__focus-badge--faq {\n    color: #1e40af;\n    background: #dbeafe;\n}\n.nexusai-exam__source--topic {\n    color: var(--nexusai-primary, #6366f1);\n}\n\n.nexusai-exam__preview-header {\n    display: flex;\n    align-items: center;\n    justify-content: space-between;\n    gap: 12px;\n    flex-wrap: wrap;\n    margin-bottom: 12px;\n}\n.nexusai-exam__preview-actions {\n    display: flex;\n    gap: 8px;\n}\n\n.nexusai-exam__question {\n    border: 1px solid var(--nexusai-border);\n    border-radius: var(--nexusai-radius, 8px);\n    box-shadow: var(--nexusai-shadow-sm, 0 1px 2px rgba(0,0,0,0.05));\n    padding: 12px;\n    margin-bottom: 12px;\n    display: flex;\n    flex-direction: column;\n    gap: 8px;\n}\n.nexusai-exam__question-head {\n    display: flex;\n    align-items: center;\n    justify-content: space-between;\n}\n.nexusai-exam__question-number {\n    font-size: 11px;\n    font-weight: 600;\n    color: var(--nexusai-fg-muted);\n    text-transform: uppercase;\n    letter-spacing: 0.02em;\n}\n.nexusai-exam__remove {\n    background: none;\n    border: none;\n    color: var(--nexusai-fg-muted);\n    font-size: 16px;\n    line-height: 1;\n    cursor: pointer;\n    padding: 2px 6px;\n}\n.nexusai-exam__remove:hover { color: #dc2626; }\n\n.nexusai-exam__question-text,\n.nexusai-exam__explanation {\n    width: 100%;\n    font-family: inherit;\n    font-size: 13px;\n    color: var(--nexusai-fg);\n    border: 1px solid var(--nexusai-border);\n    border-radius: var(--nexusai-radius-sm);\n    padding: 6px 8px;\n    resize: vertical;\n}\n.nexusai-exam__explanation { font-size: 12px; color: var(--nexusai-fg-muted); }\n\n.nexusai-exam__options {\n    display: flex;\n    flex-direction: column;\n    gap: 6px;\n}\n.nexusai-exam__option {\n    display: flex;\n    align-items: center;\n    gap: 8px;\n}\n.nexusai-exam__option input[type=\"text\"] {\n    flex: 1;\n    font-family: inherit;\n    font-size: 12.5px;\n    padding: 5px 8px;\n    border: 1px solid var(--nexusai-border);\n    border-radius: var(--nexusai-radius-sm);\n    color: var(--nexusai-fg);\n}\n\n.nexusai-exam__source {\n    font-size: 11px;\n    color: var(--nexusai-fg-muted);\n    font-style: italic;\n}\n\n/* Fix: .nexusai-btn--primary in styles.css is meant for the chat\n   (red, error/retry) — here we repaint it to the teacher panel's indigo,\n   scoped to .nexusai-documents so the chat is not affected. */\n.nexusai-documents .nexusai-btn--primary {\n    background: var(--nexusai-primary, #6366f1);\n    border-color: var(--nexusai-primary, #6366f1);\n}\n.nexusai-documents .nexusai-btn--primary:hover {\n    background: var(--nexusai-primary-hover, #4f46e5);\n    border-color: var(--nexusai-primary-hover, #4f46e5);\n}\n\n/* ============================================================\n   Student questions: Frequent/Unanswered selector (RDS-08)\n============================================================ */\n.nexusai-questions__modebtns {\n    display: flex;\n    gap: 6px;\n    margin-bottom: 16px;\n}\n.nexusai-questions__modebtn {\n    flex: 1;\n    padding: 8px 10px;\n    font-size: 13px;\n    font-weight: 500;\n    color: var(--nexusai-fg-muted, #64748b);\n    background: var(--nexusai-bg-muted, #f8fafc);\n    border: 1px solid var(--nexusai-border, #e2e8f0);\n    border-radius: var(--nexusai-radius, 8px);\n    cursor: pointer;\n    transition: background .12s, color .12s, border-color .12s;\n}\n.nexusai-questions__modebtn:hover { color: var(--nexusai-fg, #1e293b); }\n.nexusai-questions__modebtn--active {\n    color: var(--nexusai-primary, #6366f1);\n    background: var(--nexusai-primary-subtle);\n    border-color: var(--nexusai-primary-ring, rgba(99,102,241,0.2));\n}\n\n/* ============================================================\n   Dark mode (UX-11, #369) — teacher panel\n   Mirror of the styles.css block: redefines the --nexusai-* tokens and\n   adjusts the not yet tokenized semantic colors of the 5 tabs\n   (Material, Questions, Analytics, Exam, Search). Text contrast on a\n   colored background checked, not inverted mechanically.\n============================================================ */\n@media (prefers-color-scheme: dark) {\n    .nexusai-documents {\n        --nexusai-primary:        #818cf8;\n        --nexusai-primary-hover:  #a5b4fc;\n        --nexusai-primary-dark:   #a5b4fc;\n        --nexusai-primary-light:  rgba(129, 140, 248, 0.16);\n        --nexusai-primary-ring:   rgba(129, 140, 248, 0.36);\n        --nexusai-primary-subtle: #24304d;\n\n        --nexusai-bg:             #0f172a;\n        --nexusai-bg-muted:       #1e293b;\n        --nexusai-bg-subtle:      #283548;\n        --nexusai-surface:        #172131;\n\n        --nexusai-border:         #334155;\n        --nexusai-border-strong:  #475569;\n        --nexusai-border-hover:   #4c5a80;\n\n        --nexusai-fg:             #e2e8f0;\n        --nexusai-fg-muted:       #94a3b8;\n        --nexusai-fg-subtle:      #64748b;\n\n        --nexusai-success-bg:     #0f2a1c;\n        --nexusai-success-fg:     #4ade80;\n        --nexusai-success-border: #1f5e3f;\n        --nexusai-danger-bg:      #2c1517;\n        --nexusai-danger-fg:      #f87171;\n        --nexusai-danger-border:  #7f2a2a;\n        --nexusai-danger-solid:   #ef4444;\n        --nexusai-warning-bg:     #2e2410;\n        --nexusai-warning-fg:     #fbbf24;\n        --nexusai-warning-border: #6b5417;\n        --nexusai-info-bg:        #16233d;\n        --nexusai-info-fg:        #93c5fd;\n        --nexusai-info-border:    #2f4a7a;\n\n        --nexusai-shadow-sm:      0 1px 2px 0 rgba(0,0,0,0.4);\n        --nexusai-shadow:         0 4px 6px -1px rgba(0,0,0,0.5), 0 2px 4px -1px rgba(0,0,0,0.4);\n        --nexusai-shadow-md:      0 10px 15px -3px rgba(0,0,0,0.55), 0 4px 6px -2px rgba(0,0,0,0.4);\n    }\n\n    /* ---- Sidebar ---- */\n    .nexusai-documents .nexusai-doc-sidebar__status {\n        color: var(--nexusai-success-fg);\n        background: var(--nexusai-success-bg);\n        border-color: var(--nexusai-success-border);\n    }\n\n    /* ---- Cola de uploads / preview ---- */\n    .nexusai-documents .nexusai-upload-queue__item--error {\n        background: var(--nexusai-danger-bg);\n        border-color: var(--nexusai-danger-border);\n    }\n    .nexusai-documents .nexusai-upload-queue__item--error .nexusai-upload-queue__status,\n    .nexusai-documents .nexusai-upload-queue__dismiss,\n    .nexusai-documents .nexusai-preview__status--error,\n    .nexusai-documents .nexusai-alert--error,\n    .nexusai-documents .nexusai-modal__title--error { color: var(--nexusai-danger-fg); }\n\n    /* ---- Table rows with state ---- */\n    .nexusai-documents .nexusai-table__row--error td { background: rgba(239, 68, 68, 0.08); }\n    .nexusai-documents .nexusai-table__row--error:hover td { background: rgba(239, 68, 68, 0.14) !important; }\n    .nexusai-documents .nexusai-table__row--indexing td { background: rgba(129, 140, 248, 0.08); }\n    .nexusai-documents .nexusai-table__row--indexing:hover td { background: rgba(129, 140, 248, 0.14) !important; }\n\n    /* ---- State badges (includes the !important overrides at table level) ---- */\n    .nexusai-documents .nexusai-badge--indexing {\n        background: var(--nexusai-info-bg);\n        color: var(--nexusai-info-fg);\n        border-color: var(--nexusai-info-border);\n    }\n    .nexusai-documents .nexusai-badge--indexed {\n        background: var(--nexusai-success-bg);\n        color: var(--nexusai-success-fg);\n        border-color: var(--nexusai-success-border);\n    }\n    .nexusai-documents .nexusai-badge--error {\n        background: var(--nexusai-danger-bg);\n        color: var(--nexusai-danger-fg);\n        border-color: var(--nexusai-danger-border);\n    }\n    .nexusai-documents .nexusai-table .nexusai-badge--pending  { background: var(--nexusai-bg-subtle) !important; color: var(--nexusai-fg-muted) !important; }\n    .nexusai-documents .nexusai-table .nexusai-badge--indexing { background: var(--nexusai-info-bg) !important;    color: var(--nexusai-info-fg) !important; }\n    .nexusai-documents .nexusai-table .nexusai-badge--indexed  { background: var(--nexusai-success-bg) !important; color: var(--nexusai-success-fg) !important; }\n    .nexusai-documents .nexusai-table .nexusai-badge--error    { background: var(--nexusai-danger-bg) !important;  color: var(--nexusai-danger-fg) !important; }\n    .nexusai-documents .nexusai-table .nexusai-badge--unknown  { background: var(--nexusai-bg-muted) !important;   color: var(--nexusai-fg-muted) !important; }\n    .nexusai-documents .nexusai-badge--indexing::before { background: var(--nexusai-info-fg); }\n\n    /* ---- Modal de error ---- */\n    .nexusai-documents .nexusai-modal__body--error {\n        color: var(--nexusai-danger-fg);\n        background: var(--nexusai-danger-bg);\n        border-color: var(--nexusai-danger-border);\n    }\n    .nexusai-documents .nexusai-alert--error {\n        background: var(--nexusai-danger-bg);\n        border-color: var(--nexusai-danger-border);\n    }\n\n    /* ---- Botones link ---- */\n    .nexusai-documents .nexusai-link-btn--danger { color: var(--nexusai-danger-solid); }\n    .nexusai-documents .nexusai-link-btn--danger:hover { background: var(--nexusai-danger-bg); color: var(--nexusai-danger-fg); }\n\n    /* ---- Toast ---- */\n    .nexusai-documents .nexusai-toast--warning {\n        background: var(--nexusai-warning-bg);\n        color: var(--nexusai-warning-fg) !important;\n        border-color: var(--nexusai-warning-border);\n    }\n\n    /* ---- Gaps ---- */\n    .nexusai-documents .nexusai-gaps__empty-icon {\n        background: var(--nexusai-success-bg);\n        color: var(--nexusai-success-fg);\n    }\n    .nexusai-documents .nexusai-gap-item__similarity--low  { color: #a3e635; }\n    .nexusai-documents .nexusai-gap-item__similarity--mid  { color: var(--nexusai-warning-fg); }\n    .nexusai-documents .nexusai-gap-item__similarity--high { color: var(--nexusai-danger-fg); }\n    .nexusai-documents .nexusai-gap-item__archived-badge {\n        color: var(--nexusai-fg-muted);\n        background: var(--nexusai-bg-subtle);\n        border-color: var(--nexusai-border);\n    }\n    .nexusai-documents .nexusai-gap-item__sep { color: var(--nexusai-border-strong); }\n\n    /* ---- Analytics: gaps ratio and content health ---- */\n    .nexusai-documents .nexusai-analytics__gaps-ratio--low  { background: var(--nexusai-success-bg); }\n    .nexusai-documents .nexusai-analytics__gaps-ratio--low .nexusai-analytics__gaps-ratio-pct  { color: var(--nexusai-success-fg); }\n    .nexusai-documents .nexusai-analytics__gaps-ratio--mid  { background: var(--nexusai-warning-bg); }\n    .nexusai-documents .nexusai-analytics__gaps-ratio--mid .nexusai-analytics__gaps-ratio-pct  { color: var(--nexusai-warning-fg); }\n    .nexusai-documents .nexusai-analytics__gaps-ratio--high { background: var(--nexusai-danger-bg); }\n    .nexusai-documents .nexusai-analytics__gaps-ratio--high .nexusai-analytics__gaps-ratio-pct { color: var(--nexusai-danger-fg); }\n    .nexusai-documents .nexusai-analytics__health--low .nexusai-analytics__health-pct  { color: var(--nexusai-success-fg); }\n    .nexusai-documents .nexusai-analytics__health--mid .nexusai-analytics__health-pct  { color: var(--nexusai-warning-fg); }\n    .nexusai-documents .nexusai-analytics__health--high .nexusai-analytics__health-pct { color: var(--nexusai-danger-fg); }\n    .nexusai-documents .nexusai-analytics__health-bar { background: var(--nexusai-bg-subtle); }\n\n    /* ---- Examen: badges de foco (gap/faq) ---- */\n    .nexusai-documents .nexusai-exam__focus-badge--gap {\n        color: var(--nexusai-warning-fg);\n        background: var(--nexusai-warning-bg);\n    }\n    .nexusai-documents .nexusai-exam__focus-badge--faq {\n        color: var(--nexusai-info-fg);\n        background: var(--nexusai-info-bg);\n    }\n    .nexusai-documents .nexusai-exam__remove:hover { color: var(--nexusai-danger-fg); }\n\n    /* ---- Modal secondary button ---- */\n    .nexusai-documents .nexusai-btn--danger { background: var(--nexusai-danger-solid); }\n}\n\n/* ============================================================\n   Accessibility — visible keyboard focus (UX-10, #368)\n\n   Same focus state as the chat widget (styles.css), reusing\n   the --nexusai-primary / -ring tokens of the\n   .nexusai-documents root. :focus-visible so clicks are not bothered.\n============================================================ */\n.nexusai-documents a:focus-visible,\n.nexusai-documents button:focus-visible,\n.nexusai-documents input:focus-visible,\n.nexusai-documents select:focus-visible,\n.nexusai-documents textarea:focus-visible,\n.nexusai-documents [tabindex]:focus-visible,\n.nexusai-documents summary:focus-visible {\n    outline: 2px solid var(--nexusai-primary, #6366f1);\n    outline-offset: 2px;\n    box-shadow: 0 0 0 4px var(--nexusai-primary-ring, rgba(99,102,241,0.2));\n}\n\n/* Buttons on an indigo background: light inner halo + dark outline. */\n.nexusai-documents .nexusai-btn--primary:focus-visible {\n    outline: 2px solid var(--nexusai-primary-hover, #4f46e5);\n    outline-offset: 2px;\n    box-shadow: inset 0 0 0 2px #fff, 0 0 0 4px var(--nexusai-primary-ring, rgba(99,102,241,0.2));\n}\n\n@media (forced-colors: active) {\n    .nexusai-documents a:focus-visible,\n    .nexusai-documents button:focus-visible,\n    .nexusai-documents input:focus-visible,\n    .nexusai-documents select:focus-visible,\n    .nexusai-documents textarea:focus-visible,\n    .nexusai-documents [tabindex]:focus-visible {\n        outline: 2px solid CanvasText;\n        box-shadow: none;\n    }\n}\n\n/* ============================================================\n   Loading skeletons — UX-12 (#370)\n   Approximate outline of the content while it loads, instead of the\n   generic centered spinner (.nexusai-loading). Component in\n   components/Skeleton.jsx.\n============================================================ */\n@keyframes nexusai-skeleton-shimmer {\n    from { background-position: -320px 0; }\n    to   { background-position: 320px 0; }\n}\n.nexusai-skeleton {\n    display: block;\n    min-height: 8px;\n    border-radius: var(--nexusai-radius, 8px);\n    background-color: var(--nexusai-bg-subtle, #f1f5f9);\n    background-image: linear-gradient(\n        90deg,\n        var(--nexusai-bg-subtle, #f1f5f9) 0%,\n        var(--nexusai-bg-muted, #f8fafc) 40%,\n        var(--nexusai-border, #e2e8f0) 50%,\n        var(--nexusai-bg-muted, #f8fafc) 60%,\n        var(--nexusai-bg-subtle, #f1f5f9) 100%\n    );\n    background-size: 640px 100%;\n    background-repeat: no-repeat;\n    animation: nexusai-skeleton-shimmer 1.3s ease-in-out infinite;\n}\n.nexusai-skeleton-text {\n    display: flex;\n    flex-direction: column;\n    gap: 8px;\n}\n.nexusai-skeleton-screen {\n    padding: 4px 0 8px;\n}\n.nexusai-sr-only {\n    position: absolute;\n    width: 1px;\n    height: 1px;\n    padding: 0;\n    margin: -1px;\n    overflow: hidden;\n    clip: rect(0 0 0 0);\n    white-space: nowrap;\n    border: 0;\n}\n\n/* Material — rows of the documents table */\n.nexusai-skeleton-doc__intro { margin-bottom: 20px; }\n.nexusai-skeleton-doc__zone {\n    height: 96px;\n    margin-bottom: 20px;\n    border-radius: var(--nexusai-radius, 8px);\n}\n.nexusai-skeleton-doc__rows {\n    display: flex;\n    flex-direction: column;\n    border: 1px solid var(--nexusai-border, #e2e8f0);\n    border-radius: var(--nexusai-radius, 8px);\n    overflow: hidden;\n}\n.nexusai-skeleton-doc__row {\n    display: grid;\n    grid-template-columns: 24px 1fr 90px 70px 60px;\n    gap: 14px;\n    align-items: center;\n    padding: 14px 16px;\n    border-bottom: 1px solid var(--nexusai-border, #e2e8f0);\n}\n.nexusai-skeleton-doc__row:last-child { border-bottom: 0; }\n\n/* Analytics — metric cards + bar sections */\n.nexusai-skeleton-analytics__stats {\n    display: grid;\n    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));\n    gap: 12px;\n    margin-bottom: 16px;\n}\n.nexusai-skeleton-analytics__stat {\n    display: flex;\n    flex-direction: column;\n    gap: 10px;\n    padding: 16px;\n    border: 1px solid var(--nexusai-border, #e2e8f0);\n    border-radius: var(--nexusai-radius, 8px);\n}\n.nexusai-skeleton-analytics__grid {\n    display: grid;\n    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));\n    gap: 16px;\n}\n.nexusai-skeleton-analytics__section {\n    display: flex;\n    flex-direction: column;\n    gap: 12px;\n    padding: 16px;\n    border: 1px solid var(--nexusai-border, #e2e8f0);\n    border-radius: var(--nexusai-radius, 8px);\n}\n.nexusai-skeleton-analytics__bars {\n    display: flex;\n    align-items: flex-end;\n    gap: 8px;\n    height: 90px;\n}\n.nexusai-skeleton-analytics__bars .nexusai-skeleton { flex: 1; }\n\n/* FAQ — cards de tema */\n.nexusai-skeleton-faq__grid {\n    display: grid;\n    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));\n    gap: 12px;\n}\n.nexusai-skeleton-faq__card {\n    display: flex;\n    flex-direction: column;\n    gap: 12px;\n    padding: 16px;\n    border: 1px solid var(--nexusai-border, #e2e8f0);\n    border-radius: var(--nexusai-radius, 8px);\n}\n\n@media (prefers-reduced-motion: reduce) {\n    .nexusai-skeleton { animation-duration: 2.4s; }\n}\n\n/* VIS-03 (#538): where each document lives in the course */\n.nexusai-activity {\n    display: flex;\n    flex-direction: column;\n    align-items: flex-start;\n    gap: 3px;\n    font-size: 0.85em;\n}\n.nexusai-activity__unit {\n    color: var(--nexusai-fg, #1e293b);\n}\n.nexusai-activity__state {\n    font-weight: 600;\n}\n.nexusai-activity__state--visible {\n    color: var(--nexusai-success, #15803d);\n}\n.nexusai-activity__state--hidden {\n    color: var(--nexusai-warning, #b45309);\n}\n.nexusai-activity__state--missing,\n.nexusai-activity__state--none {\n    color: var(--nexusai-danger, #b91c1c);\n}\n.nexusai-visibility-toggle {\n    display: flex;\n    align-items: center;\n    gap: 8px;\n    margin: 10px 0;\n    cursor: pointer;\n}\n.nexusai-documents__hint {\n    margin: 0 0 12px;\n    font-size: 0.85em;\n    color: var(--nexusai-fg-muted, #64748b);\n}\n", ""]);
// Exports
/* harmony default export */ __webpack_exports__.A = (___CSS_LOADER_EXPORT___);


/***/ }),

/***/ 365:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

/* harmony import */ var _node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(601);
/* harmony import */ var _node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(314);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
// Imports


var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()((_node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default()));
// Module
___CSS_LOADER_EXPORT___.push([module.id, "/*\n * This file is part of Moodle - https://moodle.org/\n *\n * Moodle is free software: you can redistribute it and/or modify\n * it under the terms of the GNU General Public License as published by\n * the Free Software Foundation, either version 3 of the License, or\n * (at your option) any later version.\n *\n * Moodle is distributed in the hope that it will be useful,\n * but WITHOUT ANY WARRANTY; without even the implied warranty of\n * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n * GNU General Public License for more details.\n *\n * You should have received a copy of the GNU General Public License\n * along with Moodle.  If not, see <https://www.gnu.org/licenses/>.\n */\n\n/*\n * NexusAI widget styles — shadcn/ui style redesign.\n *\n * Rules:\n *   - `.nexusai-` prefix on ALL classes so they do not clash with Bootstrap/Boost.\n *   - Fixed bottom-right positioning, high z-index to stay above the footer\n *     and Moodle's popovers (which use z-index ~1080 for tooltips).\n *   - Palette based on CSS tokens (--nexusai-*) — change it from one place.\n *   - Smooth but quick animations (150-250ms), nothing distracting.\n */\n\n/* ============================================================\n   Design tokens\n============================================================ */\n.nexusai-widget {\n    /* Colores primarios */\n    --nexusai-primary:        #6366f1;\n    --nexusai-primary-hover:  #4f46e5;\n    --nexusai-primary-light:  rgba(99, 102, 241, 0.1);\n    --nexusai-primary-ring:   rgba(99, 102, 241, 0.2);\n    --nexusai-primary-subtle:  #e6edfb;   /* background tint for the active/selected state */\n\n    /* Fondos */\n    --nexusai-bg:             #ffffff;\n    --nexusai-bg-muted:       #f8fafc;\n    --nexusai-bg-subtle:      #f1f5f9;\n    --nexusai-surface:        #f7f8fc;    /* panels/cards recessed over the base background */\n\n    /* Bordes */\n    --nexusai-border:         #e2e8f0;\n    --nexusai-border-strong:  #cbd5e1;\n    --nexusai-border-hover:   #c6d4f0;    /* border with a primary tint on hover */\n\n    /* Texto */\n    --nexusai-fg:             #0f172a;\n    --nexusai-fg-muted:       #64748b;\n    --nexusai-fg-subtle:      #94a3b8;\n\n    /* Code blocks (dark background in light mode too) */\n    --nexusai-code-bg:        #1e293b;\n    --nexusai-code-fg:        #e2e8f0;\n\n    /* Semantic state colors — background / text / border per family.\n       Redefined in the dark block below (not inverted mechanically). */\n    --nexusai-success-bg:     #f0fdf4;\n    --nexusai-success-fg:     #166534;\n    --nexusai-success-border: #bbf7d0;\n    --nexusai-danger-bg:      #fef2f2;\n    --nexusai-danger-fg:      #991b1b;\n    --nexusai-danger-border:  #fecaca;\n    --nexusai-danger-solid:   #dc2626;\n    --nexusai-warning-bg:     #fef3c7;\n    --nexusai-warning-fg:     #92400e;\n    --nexusai-warning-border: #fde68a;\n    --nexusai-info-bg:        #eff6ff;\n    --nexusai-info-fg:        #1e40af;\n    --nexusai-info-border:    #bfdbfe;\n\n    /* Radios */\n    --nexusai-radius-sm:      4px;\n    --nexusai-radius:         8px;\n    --nexusai-radius-md:      10px;\n    --nexusai-radius-lg:      12px;\n    --nexusai-radius-xl:      16px;\n    --nexusai-radius-full:    9999px;\n\n    /* Sombras */\n    --nexusai-shadow-sm:      0 1px 2px 0 rgba(0,0,0,0.05);\n    --nexusai-shadow:         0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -1px rgba(0,0,0,0.04);\n    --nexusai-shadow-md:      0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -2px rgba(0,0,0,0.04);\n    --nexusai-shadow-fab:     0 4px 14px rgba(99, 102, 241, 0.35);\n\n    /* Typography */\n    font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif;\n    font-size: 14px;\n    line-height: 1.5;\n    color: var(--nexusai-fg);\n    box-sizing: border-box;\n}\n.nexusai-widget *,\n.nexusai-widget *::before,\n.nexusai-widget *::after {\n    box-sizing: border-box;\n}\n\n/* ============================================================\n   Dark mode (UX-11, #369)\n   Redefines the --nexusai-* tokens when the OS/browser is in dark\n   mode. It is not a mechanical inversion: the semantic colors (success,\n   error, warning) are recomputed to keep text readable on a colored\n   background.\n   Covers the whole widget: chat, search, study mode, calendar and\n   quiz. The teacher panel lives in .nexusai-documents (documents.css) and\n   has its own equivalent block.\n============================================================ */\n@media (prefers-color-scheme: dark) {\n    .nexusai-widget {\n        --nexusai-primary:        #818cf8;\n        --nexusai-primary-hover:  #a5b4fc;\n        --nexusai-primary-light:  rgba(129, 140, 248, 0.16);\n        --nexusai-primary-ring:   rgba(129, 140, 248, 0.36);\n        --nexusai-primary-subtle: #24304d;\n\n        --nexusai-bg:             #0f172a;\n        --nexusai-bg-muted:       #1e293b;\n        --nexusai-bg-subtle:      #283548;\n        --nexusai-surface:        #172131;\n\n        --nexusai-border:         #334155;\n        --nexusai-border-strong:  #475569;\n        --nexusai-border-hover:   #4c5a80;\n\n        --nexusai-fg:             #e2e8f0;\n        --nexusai-fg-muted:       #94a3b8;\n        --nexusai-fg-subtle:      #64748b;\n\n        --nexusai-code-bg:        #020617;\n        --nexusai-code-fg:        #e2e8f0;\n\n        --nexusai-success-bg:     #0f2a1c;\n        --nexusai-success-fg:     #4ade80;\n        --nexusai-success-border: #1f5e3f;\n        --nexusai-danger-bg:      #2c1517;\n        --nexusai-danger-fg:      #f87171;\n        --nexusai-danger-border:  #7f2a2a;\n        --nexusai-danger-solid:   #ef4444;\n        --nexusai-warning-bg:     #2e2410;\n        --nexusai-warning-fg:     #fbbf24;\n        --nexusai-warning-border: #6b5417;\n        --nexusai-info-bg:        #16233d;\n        --nexusai-info-fg:        #93c5fd;\n        --nexusai-info-border:    #2f4a7a;\n\n        --nexusai-shadow-sm:      0 1px 2px 0 rgba(0,0,0,0.4);\n        --nexusai-shadow:         0 4px 6px -1px rgba(0,0,0,0.5), 0 2px 4px -1px rgba(0,0,0,0.4);\n        --nexusai-shadow-md:      0 10px 15px -3px rgba(0,0,0,0.55), 0 4px 6px -2px rgba(0,0,0,0.4);\n    }\n\n    /* ---- Specific tweaks of surfaces/colors not tokenized yet ---- */\n\n    /* Inline code in the assistant bubble: the dark violet has no contrast */\n    .nexusai-widget .nexusai-msg__markdown code { color: #c4b5fd; }\n\n    /* Chat error banner */\n    .nexusai-widget .nexusai-error {\n        background: var(--nexusai-danger-bg);\n        border-color: var(--nexusai-danger-border);\n    }\n    .nexusai-widget .nexusai-error__text { color: var(--nexusai-danger-fg); }\n    .nexusai-widget .nexusai-btn--ghost {\n        color: var(--nexusai-danger-fg);\n        border-color: var(--nexusai-danger-border);\n    }\n    .nexusai-widget .nexusai-btn--ghost:hover { background: var(--nexusai-danger-bg); }\n\n    /* Feedback 👍/👎 */\n    .nexusai-widget .nexusai-msg__feedback-btn--active-up   { color: #4ade80; }\n    .nexusai-widget .nexusai-msg__feedback-btn--active-down { color: #f87171; }\n\n    /* Warning toast (success/error ones are already solid and readable) */\n    .nexusai-widget .nexusai-toast--warning {\n        background: var(--nexusai-warning-bg);\n        color: var(--nexusai-warning-fg) !important;\n        border-color: var(--nexusai-warning-border);\n    }\n\n    /* Quiz — opciones y feedback */\n    .nexusai-widget .nexusai-quiz__option--correct {\n        border-color: var(--nexusai-success-border);\n        background: var(--nexusai-success-bg);\n        color: var(--nexusai-success-fg);\n    }\n    .nexusai-widget .nexusai-quiz__option--wrong {\n        border-color: var(--nexusai-danger-border);\n        background: var(--nexusai-danger-bg);\n        color: var(--nexusai-danger-fg);\n    }\n    .nexusai-widget .nexusai-quiz__option--selected .nexusai-quiz__option-letter,\n    .nexusai-widget .nexusai-quiz__option--correct .nexusai-quiz__option-letter,\n    .nexusai-widget .nexusai-quiz__option--wrong .nexusai-quiz__option-letter {\n        background: rgba(255, 255, 255, 0.14);\n    }\n    .nexusai-widget .nexusai-quiz__feedback--correct {\n        background: var(--nexusai-success-bg);\n        border-color: var(--nexusai-success-border);\n        color: var(--nexusai-success-fg);\n    }\n    .nexusai-widget .nexusai-quiz__feedback--wrong {\n        background: var(--nexusai-danger-bg);\n        border-color: var(--nexusai-danger-border);\n        color: var(--nexusai-danger-fg);\n    }\n    .nexusai-widget .nexusai-quiz__input--error,\n    .nexusai-widget .nexusai-quiz__topic-error { border-color: #f87171; color: #f87171; }\n    .nexusai-widget .nexusai-quiz__final-icon--high {\n        background: var(--nexusai-success-bg);\n        color: var(--nexusai-success-fg);\n    }\n    .nexusai-widget .nexusai-quiz__history-diff--easy   { background: var(--nexusai-success-bg); color: var(--nexusai-success-fg); }\n    .nexusai-widget .nexusai-quiz__history-diff--medium { background: var(--nexusai-warning-bg); color: var(--nexusai-warning-fg); }\n    .nexusai-widget .nexusai-quiz__history-diff--hard   { background: var(--nexusai-danger-bg);  color: var(--nexusai-danger-fg); }\n    .nexusai-widget .nexusai-quiz__history-pct--good { background: var(--nexusai-success-bg); color: var(--nexusai-success-fg); }\n    .nexusai-widget .nexusai-quiz__history-pct--mid  { background: var(--nexusai-warning-bg); color: var(--nexusai-warning-fg); }\n    .nexusai-widget .nexusai-quiz__history-pct--low  { background: var(--nexusai-danger-bg);  color: var(--nexusai-danger-fg); }\n\n    /* Review / repaso */\n    .nexusai-widget .nexusai-review__clear-btn {\n        color: var(--nexusai-danger-fg);\n        background: var(--nexusai-danger-bg);\n        border-color: var(--nexusai-danger-border);\n    }\n    .nexusai-widget .nexusai-review__clear-btn:hover { background: var(--nexusai-danger-border); }\n    .nexusai-widget .nexusai-review__opt--correct {\n        background: var(--nexusai-success-bg);\n        border-color: var(--nexusai-success-border);\n        color: var(--nexusai-success-fg);\n    }\n    .nexusai-widget .nexusai-review__opt--wrong {\n        background: var(--nexusai-danger-bg);\n        border-color: var(--nexusai-danger-border);\n        color: var(--nexusai-danger-fg);\n    }\n    .nexusai-widget .nexusai-review__opt-letter { background: rgba(255, 255, 255, 0.1); }\n    .nexusai-widget .nexusai-review__badge--true_false { background: var(--nexusai-info-bg); color: var(--nexusai-info-fg); }\n    .nexusai-widget .nexusai-review__badge--open { background: var(--nexusai-success-bg); color: var(--nexusai-success-fg); }\n    .nexusai-widget .nexusai-review__explanation-label,\n    .nexusai-widget .nexusai-review__suggestions-header { color: var(--nexusai-primary-hover); }\n    .nexusai-widget .nexusai-review__suggestion-count {\n        background: var(--nexusai-danger-bg);\n        color: var(--nexusai-danger-fg);\n    }\n\n    /* Calendario — banner y badge de alerta */\n    .nexusai-widget .nexusai-calendar__alert-banner {\n        background: var(--nexusai-warning-bg);\n        border-color: var(--nexusai-warning-border);\n        color: var(--nexusai-warning-fg);\n    }\n    .nexusai-widget .nexusai-calendar__alert-badge {\n        background: var(--nexusai-warning-bg);\n        border-color: var(--nexusai-warning-border);\n        color: var(--nexusai-warning-fg);\n    }\n    .nexusai-widget .nexusai-calendar__feed-status--error,\n    .nexusai-widget .nexusai-search__summary-text--error { color: var(--nexusai-danger-fg); }\n\n    /* Racha de estudio */\n    .nexusai-widget .nexusai-study__streak { color: #fb923c; }\n\n    /* Teacher onboarding (checklist) */\n    .nexusai-widget .nexusai-onb__alldone,\n    .nexusai-widget .nexusai-onb__status--done,\n    .nexusai-widget .nexusai-onb__step--done .nexusai-onb__step-marker {\n        background: var(--nexusai-success-bg);\n        color: var(--nexusai-success-fg);\n    }\n    .nexusai-widget .nexusai-onb__status--pending {\n        background: var(--nexusai-warning-bg);\n        color: var(--nexusai-warning-fg);\n    }\n\n    /* \"Online\" state of the header — the green stays the same, only the dot */\n    .nexusai-widget .nexusai-panel__status-dot { background: #4ade80; }\n}\n\n/* ============================================================\n   Docked panel (RDS-01) — sidebar docked to the right edge, full height\n   under Moodle's navbar, instead of the floating dropdown anchored under\n   the icon UX-02 used. ChatApp.jsx narrows #page-content via JS when the\n   panel is open (a real push of the course content, not an overlay).\n============================================================ */\n.nexusai-panel {\n    position: fixed;\n    top: 61px;\n    right: 0;\n    bottom: 0;\n    left: auto;\n    width: 400px;\n    background: var(--nexusai-bg);\n    border-radius: 0;\n    border: none;\n    border-left: 1px solid var(--nexusai-border);\n    box-shadow: -4px 0 20px rgba(15, 23, 42, 0.08);\n    display: flex;\n    flex-direction: column;\n    z-index: 9999;\n    overflow: hidden;\n    animation: nexusai-slide-in-right 0.18s ease-out;\n}\n\n@keyframes nexusai-slide-in-right {\n    from { opacity: 0; transform: translateX(24px); }\n    to   { opacity: 1; transform: translateX(0); }\n}\n\n/* ----- Riel colapsado ----- */\n.nexusai-rail {\n    position: fixed;\n    top: 61px;\n    right: 0;\n    bottom: 0;\n    width: 44px;\n    background: var(--nexusai-bg);\n    border: none;\n    border-left: 1px solid var(--nexusai-border);\n    box-shadow: -2px 0 8px rgba(15, 23, 42, 0.05);\n    display: flex;\n    flex-direction: column;\n    align-items: center;\n    gap: 14px;\n    padding: 18px 0;\n    cursor: pointer;\n    z-index: 9998;\n    font-family: inherit;\n    color: var(--nexusai-primary);\n    transition: background 0.15s;\n}\n.nexusai-rail:hover {\n    background: var(--nexusai-bg-subtle);\n}\n.nexusai-rail__icon {\n    display: flex;\n    align-items: center;\n    justify-content: center;\n}\n.nexusai-rail__label {\n    writing-mode: vertical-rl;\n    transform: rotate(180deg);\n    font-size: 11px;\n    font-weight: 600;\n    letter-spacing: 0.3px;\n    color: var(--nexusai-fg-muted);\n    white-space: nowrap;\n}\n\n/* ----- Header ----- */\n.nexusai-panel__header {\n    display: flex;\n    align-items: center;\n    justify-content: space-between;\n    padding: 14px 16px;\n    background: var(--nexusai-bg);\n    border-bottom: 1px solid var(--nexusai-border);\n    flex-shrink: 0;\n}\n.nexusai-panel__title-wrap {\n    display: flex;\n    align-items: center;\n    gap: 10px;\n    min-width: 0;\n}\n.nexusai-panel__avatar {\n    width: 32px;\n    height: 32px;\n    border-radius: var(--nexusai-radius-full);\n    background: var(--nexusai-primary-light);\n    border: 1.5px solid var(--nexusai-primary-ring);\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    flex-shrink: 0;\n}\n.nexusai-panel__avatar svg {\n    color: var(--nexusai-primary);\n}\n.nexusai-panel__title-group {\n    display: flex;\n    flex-direction: column;\n    gap: 1px;\n    min-width: 0;\n}\n.nexusai-panel__title {\n    margin: 0;\n    font-size: 14px;\n    font-weight: 600;\n    color: var(--nexusai-fg);\n    white-space: nowrap;\n    overflow: hidden;\n    text-overflow: ellipsis;\n    line-height: 1.3;\n}\n.nexusai-panel__status {\n    display: flex;\n    align-items: center;\n    gap: 5px;\n    font-size: 11px;\n    color: var(--nexusai-fg-muted);\n    line-height: 1;\n}\n.nexusai-panel__status-dot {\n    width: 6px;\n    height: 6px;\n    border-radius: var(--nexusai-radius-full);\n    background: #22c55e;\n    flex-shrink: 0;\n}\n.nexusai-badge {\n    font-size: 10px;\n    font-weight: 500;\n    padding: 2px 7px;\n    border-radius: var(--nexusai-radius-full);\n    background: var(--nexusai-primary-light);\n    color: var(--nexusai-primary);\n    border: 1px solid var(--nexusai-primary-ring);\n    text-transform: uppercase;\n    letter-spacing: 0.4px;\n    flex-shrink: 0;\n}\n.nexusai-panel__actions {\n    display: flex;\n    gap: 4px;\n    flex-shrink: 0;\n}\n.nexusai-icon-btn {\n    background: transparent;\n    border: none;\n    color: var(--nexusai-fg-muted);\n    cursor: pointer;\n    padding: 6px;\n    min-width: 44px;\n    min-height: 44px;\n    border-radius: var(--nexusai-radius-sm);\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    line-height: 1;\n    transition: color 0.15s, background 0.15s;\n}\n.nexusai-icon-btn:hover {\n    color: var(--nexusai-fg);\n    background: var(--nexusai-bg-subtle);\n}\n\n/* ----- Body / lista de mensajes ----- */\n.nexusai-panel__body {\n    flex: 1;\n    overflow-y: auto;\n    padding: 16px;\n    display: flex;\n    flex-direction: column;\n    gap: 4px;\n    color: var(--nexusai-fg);\n    scrollbar-width: thin;\n    scrollbar-color: var(--nexusai-border-strong) transparent;\n}\n.nexusai-panel__body::-webkit-scrollbar { width: 5px; }\n.nexusai-panel__body::-webkit-scrollbar-track { background: transparent; }\n.nexusai-panel__body::-webkit-scrollbar-thumb {\n    background: var(--nexusai-border-strong);\n    border-radius: var(--nexusai-radius-full);\n}\n.nexusai-panel__body::-webkit-scrollbar-thumb:hover { background: var(--nexusai-fg-subtle); }\n\n/* ----- Empty state outside a course (UX-02) ----- */\n.nexusai-panel__body--empty {\n    align-items: center;\n    justify-content: center;\n    text-align: center;\n    gap: 12px;\n    padding: 28px 16px;\n}\n\n/* ----- Welcome ----- */\n.nexusai-welcome {\n    display: flex;\n    flex-direction: column;\n    align-items: center;\n    padding: 28px 16px 20px;\n    gap: 12px;\n}\n.nexusai-welcome__icon-wrap {\n    width: 48px;\n    height: 48px;\n    border-radius: var(--nexusai-radius-full);\n    background: var(--nexusai-primary-light);\n    border: 1.5px solid var(--nexusai-primary-ring);\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    color: var(--nexusai-primary);\n}\n.nexusai-welcome__text {\n    margin: 0;\n    font-size: 13.5px;\n    color: var(--nexusai-fg-muted);\n    text-align: center;\n    line-height: 1.6;\n    max-width: 280px;\n}\n.nexusai-welcome__chips {\n    display: flex;\n    flex-direction: column;\n    gap: 6px;\n    width: 100%;\n    margin-top: 4px;\n}\n.nexusai-chip {\n    display: flex;\n    align-items: center;\n    gap: 8px;\n    width: 100%;\n    padding: 9px 13px;\n    background: var(--nexusai-bg);\n    border: 1px solid var(--nexusai-border);\n    border-radius: var(--nexusai-radius);\n    font-family: inherit;\n    font-size: 13px;\n    color: var(--nexusai-fg);\n    cursor: pointer;\n    text-align: left;\n    transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;\n    line-height: 1.4;\n}\n.nexusai-chip:hover {\n    border-color: var(--nexusai-primary);\n    background: var(--nexusai-primary-light);\n    box-shadow: 0 0 0 3px var(--nexusai-primary-ring);\n    color: var(--nexusai-primary-hover);\n}\n.nexusai-chip__arrow {\n    margin-left: auto;\n    color: var(--nexusai-fg-subtle);\n    flex-shrink: 0;\n    transition: color 0.15s;\n}\n.nexusai-chip:hover .nexusai-chip__arrow {\n    color: var(--nexusai-primary);\n}\n\n/* ----- Mensajes ----- */\n.nexusai-msg {\n    display: flex;\n    flex-direction: column;\n    max-width: 88%;\n    margin-bottom: 2px;\n    animation: nexusai-fade-in 0.18s ease-out;\n}\n@keyframes nexusai-fade-in {\n    from { opacity: 0; transform: translateY(4px); }\n    to   { opacity: 1; transform: translateY(0); }\n}\n.nexusai-msg--user {\n    align-self: flex-end;\n    align-items: flex-end;\n}\n.nexusai-msg--assistant {\n    align-self: flex-start;\n    align-items: flex-start;\n    max-width: 92%;\n}\n\n/* Layout with avatar for the assistant */\n.nexusai-msg__row {\n    display: flex;\n    align-items: flex-end;\n    gap: 8px;\n}\n.nexusai-msg__avatar {\n    width: 26px;\n    height: 26px;\n    border-radius: var(--nexusai-radius-full);\n    background: var(--nexusai-primary-light);\n    border: 1.5px solid var(--nexusai-primary-ring);\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    flex-shrink: 0;\n    color: var(--nexusai-primary);\n    margin-bottom: 2px;\n}\n\n.nexusai-msg__bubble {\n    padding: 10px 14px;\n    border-radius: var(--nexusai-radius-md);\n    font-size: 13.5px;\n    line-height: 1.6;\n    word-wrap: break-word;\n    overflow-wrap: break-word;\n    white-space: pre-wrap;\n}\n.nexusai-msg--user .nexusai-msg__bubble {\n    background: var(--nexusai-primary);\n    color: white;\n    border-bottom-right-radius: var(--nexusai-radius-sm);\n    white-space: pre-wrap;\n}\n.nexusai-msg--assistant .nexusai-msg__bubble {\n    background: var(--nexusai-bg);\n    color: var(--nexusai-fg);\n    border: 1px solid var(--nexusai-border);\n    border-bottom-left-radius: var(--nexusai-radius-sm);\n    box-shadow: var(--nexusai-shadow-sm);\n    white-space: normal;\n}\n\n/* Markdown in the assistant bubble */\n.nexusai-msg__markdown { white-space: normal; }\n\n/* ── Collapsed long answer (ASIST-06, #384) ── */\n.nexusai-msg__markdown-clamp {\n    position: relative;\n}\n.nexusai-msg__markdown--collapsed {\n    max-height: 320px;\n    overflow: hidden;\n}\n.nexusai-msg__markdown-fade {\n    position: absolute;\n    left: 0;\n    right: 0;\n    bottom: 0;\n    height: 44px;\n    background: linear-gradient(to bottom, transparent, var(--nexusai-bg));\n    pointer-events: none;\n}\n.nexusai-msg__show-more-btn {\n    display: inline-block;\n    margin-top: 6px;\n    background: none;\n    border: none;\n    color: var(--nexusai-primary);\n    font-size: 12px;\n    font-weight: 600;\n    cursor: pointer;\n    padding: 0;\n}\n.nexusai-msg__show-more-btn:hover {\n    text-decoration: underline;\n}\n\n.nexusai-msg__regenerate-btn {\n    display: inline-flex;\n    align-items: center;\n    gap: 4px;\n    margin-top: 6px;\n    background: none;\n    border: none;\n    color: var(--nexusai-fg-muted);\n    font-size: 12px;\n    font-weight: 600;\n    cursor: pointer;\n    padding: 0;\n}\n.nexusai-msg__regenerate-btn:hover {\n    color: var(--nexusai-primary);\n    text-decoration: underline;\n}\n\n/* ASIST-01 (#321): the student's 👍/👎 feedback on one answer. */\n.nexusai-msg__feedback-btn {\n    display: inline-flex;\n    align-items: center;\n    background: none;\n    border: none;\n    color: var(--nexusai-fg-muted);\n    cursor: pointer;\n    padding: 2px;\n    border-radius: var(--nexusai-radius-sm);\n    line-height: 0;\n}\n.nexusai-msg__feedback-btn:hover:not(:disabled) {\n    color: var(--nexusai-primary);\n    background: var(--nexusai-primary-light);\n}\n.nexusai-msg__feedback-btn:disabled {\n    cursor: default;\n    opacity: 0.5;\n}\n.nexusai-msg__feedback-btn--active-up {\n    color: #16a34a;\n}\n.nexusai-msg__feedback-btn--active-down {\n    color: #dc2626;\n}\n.nexusai-msg__feedback-comment {\n    margin-top: 6px;\n    padding-left: 34px;\n    display: flex;\n    gap: 6px;\n    align-items: flex-start;\n}\n.nexusai-msg__feedback-comment textarea {\n    flex: 1;\n    font-size: 12px;\n    font-family: inherit;\n    border: 1px solid var(--nexusai-border);\n    border-radius: var(--nexusai-radius-sm);\n    padding: 6px 8px;\n    resize: vertical;\n    min-height: 36px;\n}\n.nexusai-msg__feedback-comment button {\n    font-size: 12px;\n    font-weight: 600;\n    color: #fff;\n    background: var(--nexusai-primary);\n    border: none;\n    border-radius: var(--nexusai-radius-sm);\n    padding: 6px 10px;\n    cursor: pointer;\n    white-space: nowrap;\n}\n.nexusai-msg__feedback-thanks {\n    padding-left: 34px;\n    font-size: 12px;\n    color: var(--nexusai-fg-muted);\n    margin-top: 4px;\n}\n\n.nexusai-msg__markdown p { margin: 0 0 8px; }\n.nexusai-msg__markdown p:last-child { margin-bottom: 0; }\n.nexusai-msg__markdown ul,\n.nexusai-msg__markdown ol { margin: 4px 0 8px; padding-left: 20px; }\n.nexusai-msg__markdown li { margin-bottom: 3px; }\n.nexusai-msg__markdown code {\n    font-family: ui-monospace, \"SF Mono\", Menlo, Consolas, monospace;\n    font-size: 12px;\n    background: var(--nexusai-primary-light);\n    color: #4c1d95;\n    padding: 1px 5px;\n    border-radius: var(--nexusai-radius-sm);\n}\n.nexusai-msg__markdown pre {\n    position: relative;\n    background: var(--nexusai-code-bg);\n    color: var(--nexusai-code-fg);\n    border-radius: var(--nexusai-radius);\n    padding: 10px 12px;\n    overflow-x: auto;\n    margin: 6px 0 8px;\n    font-size: 12px;\n    line-height: 1.6;\n}\n.nexusai-msg__markdown pre code {\n    background: none;\n    padding: 0;\n    color: inherit;\n    font-size: inherit;\n}\n.nexusai-msg__markdown blockquote {\n    margin: 0 0 8px;\n    padding: 4px 12px;\n    border-left: 3px solid var(--nexusai-border-strong);\n    color: var(--nexusai-fg-muted);\n    background: var(--nexusai-bg-subtle);\n    border-radius: 0 var(--nexusai-radius-sm) var(--nexusai-radius-sm) 0;\n}\n.nexusai-msg__markdown h1,\n.nexusai-msg__markdown h2,\n.nexusai-msg__markdown h3,\n.nexusai-msg__markdown h4 {\n    margin: 10px 0 5px;\n    font-size: 14px;\n    font-weight: 600;\n    color: var(--nexusai-fg);\n}\n.nexusai-msg__markdown h1:first-child,\n.nexusai-msg__markdown h2:first-child,\n.nexusai-msg__markdown h3:first-child { margin-top: 0; }\n.nexusai-msg__markdown a { color: var(--nexusai-primary); text-decoration: underline; }\n.nexusai-msg__markdown a:hover { color: var(--nexusai-primary-hover); }\n.nexusai-msg__markdown hr {\n    border: none;\n    border-top: 1px solid var(--nexusai-border);\n    margin: 8px 0;\n}\n.nexusai-msg__markdown table {\n    border-collapse: collapse;\n    margin: 6px 0;\n    font-size: 12.5px;\n    width: 100%;\n}\n.nexusai-msg__markdown th,\n.nexusai-msg__markdown td {\n    border: 1px solid var(--nexusai-border);\n    padding: 5px 10px;\n    text-align: left;\n}\n.nexusai-msg__markdown th {\n    background: var(--nexusai-bg-subtle);\n    font-weight: 600;\n    font-size: 11.5px;\n    color: var(--nexusai-fg-muted);\n}\n\n/* User bubble: links and inline code on a violet background */\n.nexusai-msg--user .nexusai-msg__bubble code {\n    background: rgba(255,255,255,0.2);\n    color: white;\n}\n.nexusai-msg--user .nexusai-msg__bubble a { color: white; }\n\n/* ----- Copy button in code blocks ----- */\n.nexusai-code-block {\n    position: relative;\n}\n.nexusai-code-block:hover .nexusai-copy-btn,\n.nexusai-copy-btn--copied {\n    opacity: 1;\n}\n.nexusai-copy-btn {\n    position: absolute;\n    top: 6px;\n    right: 6px;\n    padding: 3px 8px;\n    font-size: 10px;\n    font-family: inherit;\n    font-weight: 500;\n    background: rgba(255,255,255,0.1);\n    color: var(--nexusai-fg-subtle);\n    border: 1px solid rgba(255,255,255,0.15);\n    border-radius: var(--nexusai-radius-sm);\n    cursor: pointer;\n    opacity: 0;\n    transition: opacity 0.15s, background 0.15s, color 0.15s;\n    line-height: 1.4;\n}\n.nexusai-copy-btn:hover {\n    background: rgba(255,255,255,0.18);\n    color: var(--nexusai-code-fg);\n}\n.nexusai-copy-btn--copied {\n    color: #4ade80 !important;\n    border-color: rgba(74, 222, 128, 0.3) !important;\n}\n\n/* ----- Source pills ----- */\n.nexusai-msg__sources {\n    display: flex;\n    flex-wrap: wrap;\n    align-items: center;\n    gap: 5px;\n    margin-top: 6px;\n    padding: 0 2px;\n    max-width: 100%;\n}\n.nexusai-msg__sources-label {\n    font-size: 10.5px;\n    color: var(--nexusai-fg-muted);\n    font-weight: 500;\n    margin-right: 1px;\n}\n.nexusai-msg__source-pill {\n    display: inline-flex;\n    align-items: center;\n    gap: 4px;\n    font-size: 10.5px;\n    color: var(--nexusai-primary);\n    background: var(--nexusai-primary-light);\n    border: 1px solid var(--nexusai-primary-ring);\n    border-radius: var(--nexusai-radius-full);\n    padding: 2px 8px;\n    line-height: 1.3;\n    max-width: 100%;\n    overflow: hidden;\n    text-overflow: ellipsis;\n    white-space: nowrap;\n    font-family: ui-monospace, \"SF Mono\", Menlo, Consolas, monospace;\n    cursor: default;\n    transition: background .12s, border-color .12s, box-shadow .12s;\n}\n.nexusai-msg__source-pill--clickable {\n    cursor: pointer;\n}\n.nexusai-msg__source-pill--clickable:hover {\n    background: var(--nexusai-primary-subtle);\n    border-color: var(--nexusai-primary);\n}\n.nexusai-msg__source-pill--active {\n    background: var(--nexusai-primary);\n    color: #fff;\n    border-color: var(--nexusai-primary);\n}\n.nexusai-msg__source-pill--active:hover {\n    background: var(--nexusai-primary);\n}\n.nexusai-msg__source-score {\n    font-size: 9.5px;\n    font-weight: 600;\n    padding: 1px 4px;\n    border-radius: 4px;\n    background: rgba(255, 255, 255, 0.6);\n    color: inherit;\n    margin-left: 2px;\n}\n.nexusai-msg__source-pill--active .nexusai-msg__source-score {\n    background: rgba(255, 255, 255, 0.2);\n}\n\n/* Course name badge inside the pill (multi-course) */\n.nexusai-msg__source-course {\n    font-size: 9.5px;\n    font-weight: 600;\n    padding: 1px 5px;\n    border-radius: 4px;\n    background: rgba(74, 127, 212, 0.15);\n    color: var(--nexusai-primary);\n    letter-spacing: 0.02em;\n    max-width: 100px;\n    overflow: hidden;\n    text-overflow: ellipsis;\n    white-space: nowrap;\n}\n.nexusai-msg__source-pill--active .nexusai-msg__source-course {\n    background: rgba(255, 255, 255, 0.18);\n    color: #fff;\n}\n.nexusai-msg__source-filename {\n    overflow: hidden;\n    text-overflow: ellipsis;\n    white-space: nowrap;\n    max-width: 180px;\n}\n\n/* Course name inside the header of the expanded panel */\n.nexusai-msg__source-panel-course {\n    font-size: 10px;\n    font-weight: 600;\n    padding: 1px 6px;\n    border-radius: 4px;\n    background: var(--nexusai-primary-light);\n    color: var(--nexusai-primary);\n    text-transform: uppercase;\n    letter-spacing: 0.04em;\n    margin-right: 4px;\n}\n\n/* Expanded panel of the cited fragment */\n.nexusai-msg__source-panel {\n    margin-top: 6px;\n    background: var(--nexusai-surface);\n    border: 1px solid var(--nexusai-primary-ring);\n    border-radius: 8px;\n    padding: 8px 10px;\n    animation: nexusai-source-panel-in .15s ease-out;\n}\n@keyframes nexusai-source-panel-in {\n    from { opacity: 0; transform: translateY(-3px); }\n    to   { opacity: 1; transform: translateY(0); }\n}\n.nexusai-msg__source-panel-header {\n    display: flex;\n    justify-content: space-between;\n    align-items: center;\n    margin-bottom: 5px;\n    gap: 8px;\n}\n.nexusai-msg__source-panel-file {\n    display: inline-flex;\n    align-items: center;\n    gap: 6px;\n    font-size: 11px;\n    font-weight: 600;\n    color: var(--nexusai-fg);\n    overflow: hidden;\n    text-overflow: ellipsis;\n    white-space: nowrap;\n    min-width: 0;\n}\n.nexusai-msg__source-panel-close {\n    display: inline-flex;\n    align-items: center;\n    justify-content: center;\n    background: none;\n    border: none;\n    color: var(--nexusai-fg-muted);\n    cursor: pointer;\n    line-height: 1;\n    padding: 2px;\n    border-radius: var(--nexusai-radius-sm);\n    transition: background .12s, color .12s;\n}\n.nexusai-msg__source-panel-close:hover {\n    background: var(--nexusai-bg-subtle);\n    color: var(--nexusai-fg);\n}\n.nexusai-msg__source-panel-content {\n    font-size: 11.5px;\n    color: var(--nexusai-fg-muted);\n    line-height: 1.5;\n    margin: 0;\n    white-space: pre-wrap;\n}\n\n/* ----- Timestamp ----- */\n.nexusai-msg__meta {\n    font-size: 10px;\n    color: var(--nexusai-fg-subtle);\n    margin-top: 3px;\n    padding: 0 2px;\n}\n\n/* ----- Typing indicator ----- */\n.nexusai-typing {\n    display: flex;\n    align-items: center;\n    gap: 8px;\n    padding: 6px 0;\n}\n.nexusai-typing__bubble {\n    display: flex;\n    gap: 4px;\n    padding: 10px 14px;\n    background: var(--nexusai-bg);\n    border: 1px solid var(--nexusai-border);\n    border-radius: var(--nexusai-radius-md);\n    border-bottom-left-radius: var(--nexusai-radius-sm);\n    box-shadow: var(--nexusai-shadow-sm);\n    align-items: center;\n}\n.nexusai-typing__dot {\n    width: 6px;\n    height: 6px;\n    border-radius: var(--nexusai-radius-full);\n    background: var(--nexusai-fg-subtle);\n    animation: nexusai-typing 1.2s infinite ease-in-out;\n}\n.nexusai-typing__dot:nth-child(2) { animation-delay: 0.15s; }\n.nexusai-typing__dot:nth-child(3) { animation-delay: 0.3s; }\n@keyframes nexusai-typing {\n    0%, 60%, 100% { transform: translateY(0); opacity: 0.35; }\n    30%           { transform: translateY(-3px); opacity: 1; }\n}\n\n/* ----- Error banner ----- */\n.nexusai-error {\n    background: #fef2f2;\n    border: 1px solid #fecaca;\n    border-radius: var(--nexusai-radius);\n    padding: 12px 14px;\n    margin: 6px 0;\n}\n.nexusai-error__text {\n    margin: 0 0 8px;\n    font-size: 13px;\n    color: #991b1b;\n    line-height: 1.5;\n}\n.nexusai-error__actions {\n    display: flex;\n    gap: 8px;\n}\n\n/* ============================================================\n   Toast — UX-07\n============================================================ */\n.nexusai-toast {\n    position: fixed;\n    bottom: 24px;\n    right: 24px;\n    z-index: 10000;\n    padding: 12px 20px;\n    border-radius: var(--nexusai-radius);\n    font-size: 14px;\n    font-weight: 500;\n    font-family: inherit;\n    box-shadow: var(--nexusai-shadow-md);\n    animation: nexusai-toast-in 0.22s ease;\n    pointer-events: none;\n}\n.nexusai-toast--success {\n    background: #059669;\n    color: #ffffff !important;\n}\n.nexusai-toast--warning {\n    background: #fef3c7;\n    color: #92400e !important;\n    border: 1px solid #fcd34d;\n}\n.nexusai-toast--error {\n    background: #dc2626;\n    color: #ffffff !important;\n}\n@keyframes nexusai-toast-in {\n    from { opacity: 0; transform: translateY(6px); }\n    to   { opacity: 1; transform: translateY(0); }\n}\n\n/* ----- Botones ----- */\n.nexusai-btn {\n    border: 1px solid transparent;\n    border-radius: var(--nexusai-radius-sm);\n    padding: 5px 12px;\n    font-size: 12.5px;\n    font-weight: 500;\n    font-family: inherit;\n    cursor: pointer;\n    transition: background 0.15s, opacity 0.15s, box-shadow 0.15s;\n    line-height: 1.5;\n}\n.nexusai-btn--primary {\n    background: #ef4444;\n    color: white;\n    border-color: #ef4444;\n}\n.nexusai-btn--primary:hover { background: #dc2626; border-color: #dc2626; }\n.nexusai-btn--ghost {\n    background: transparent;\n    color: #991b1b;\n    border-color: #fecaca;\n}\n.nexusai-btn--ghost:hover { background: #fee2e2; }\n.nexusai-btn--secondary {\n    background: var(--nexusai-bg-subtle);\n    color: var(--nexusai-fg-muted);\n    border: 1px solid var(--nexusai-border);\n}\n.nexusai-btn--secondary:hover {\n    background: var(--nexusai-border);\n}\n.nexusai-btn--danger {\n    background: #dc2626;\n    color: #ffffff;\n    border-color: #dc2626;\n}\n.nexusai-btn--danger:hover {\n    background: #b91c1c;\n    border-color: #b91c1c;\n    box-shadow: 0 2px 8px rgba(220, 38, 38, 0.35);\n}\n.nexusai-btn--confirm {\n    background: var(--nexusai-primary);\n    color: #ffffff;\n    border-color: var(--nexusai-primary);\n}\n.nexusai-btn--confirm:hover {\n    background: var(--nexusai-primary-hover);\n    border-color: var(--nexusai-primary-hover);\n}\n\n/* ============================================================\n   Modals (confirmation) — UX-06\n============================================================ */\n.nexusai-modal-overlay {\n    position: fixed;\n    inset: 0;\n    background: rgba(15, 23, 42, 0.45);\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    z-index: 10010;\n    padding: 24px;\n}\n.nexusai-modal {\n    background: var(--nexusai-bg);\n    border-radius: var(--nexusai-radius-lg);\n    box-shadow: var(--nexusai-shadow-md);\n    padding: 28px 32px;\n    width: 100%;\n    max-width: 440px;\n}\n.nexusai-modal__title {\n    font-size: 17px;\n    font-weight: 700;\n    color: var(--nexusai-fg);\n    margin: 0 0 12px;\n}\n.nexusai-modal__body {\n    font-size: 14px;\n    color: var(--nexusai-fg-muted);\n    line-height: 1.6;\n    margin: 0 0 24px;\n}\n.nexusai-modal__actions {\n    display: flex;\n    gap: 10px;\n    justify-content: flex-end;\n}\n\n/* ============================================================\n   Tooltip — UX-05\n============================================================ */\n.nexusai-tooltip-wrap {\n    position: relative;\n    display: inline-flex;\n}\n.nexusai-tooltip-bubble {\n    position: absolute;\n    left: 50%;\n    transform: translateX(-50%);\n    white-space: nowrap;\n    background: var(--nexusai-fg);\n    color: #ffffff;\n    font-size: 12px;\n    font-weight: 500;\n    line-height: 1.4;\n    padding: 5px 9px;\n    border-radius: var(--nexusai-radius-sm);\n    box-shadow: var(--nexusai-shadow);\n    z-index: 10005;\n    pointer-events: none;\n    animation: nexusai-tooltip-in 0.12s ease;\n}\n.nexusai-tooltip-bubble--bottom {\n    top: calc(100% + 6px);\n}\n.nexusai-tooltip-bubble--top {\n    bottom: calc(100% + 6px);\n}\n@keyframes nexusai-tooltip-in {\n    from { opacity: 0; transform: translateX(-50%) translateY(-2px); }\n    to   { opacity: 1; transform: translateX(-50%) translateY(0); }\n}\n\n/* ============================================================\n   ConfirmModal — confirmation of destructive actions (UX-06, #346)\n   Own namespace (nexusai-confirm*) so it does not clash with the teacher\n   view's .nexusai-modal or the chat's .nexusai-btn. It lives here because\n   both bundles import styles.css.\n============================================================ */\n.nexusai-confirm-overlay {\n    position: fixed;\n    inset: 0;\n    background: rgba(15, 23, 42, 0.45);\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    z-index: 10001;\n    padding: 24px;\n}\n.nexusai-confirm {\n    background: var(--nexusai-bg);\n    border-radius: 12px;\n    box-shadow: 0 20px 60px rgba(15, 23, 42, 0.18), 0 4px 16px rgba(15, 23, 42, 0.08);\n    padding: 28px 32px;\n    width: 100%;\n    max-width: 420px;\n    font-family: inherit;\n}\n.nexusai-confirm__title {\n    font-size: 17px;\n    font-weight: 700;\n    color: var(--nexusai-fg);\n    margin: 0 0 12px;\n}\n.nexusai-confirm__body {\n    font-size: 14px;\n    color: var(--nexusai-fg-muted);\n    line-height: 1.6;\n    margin: 0 0 24px;\n}\n.nexusai-confirm__actions {\n    display: flex;\n    gap: 10px;\n    justify-content: flex-end;\n}\n.nexusai-confirm__btn {\n    display: inline-flex;\n    align-items: center;\n    justify-content: center;\n    border: 1px solid transparent;\n    border-radius: 7px;\n    font-size: 14px;\n    font-weight: 500;\n    font-family: inherit;\n    padding: 9px 18px;\n    cursor: pointer;\n    transition: background 0.15s ease, box-shadow 0.15s ease;\n}\n.nexusai-confirm__btn:disabled {\n    opacity: 0.55;\n    cursor: not-allowed;\n}\n.nexusai-confirm__btn--cancel {\n    background: var(--nexusai-bg-subtle);\n    color: var(--nexusai-fg-muted);\n    border-color: var(--nexusai-border);\n}\n.nexusai-confirm__btn--cancel:hover { background: #e2e8f0; }\n.nexusai-confirm__btn--confirm {\n    background: #2563eb;\n    color: #ffffff;\n}\n.nexusai-confirm__btn--confirm:hover { background: #1d4ed8; }\n.nexusai-confirm__btn--danger {\n    background: #dc2626;\n    color: #ffffff;\n}\n.nexusai-confirm__btn--danger:hover {\n    background: #b91c1c;\n    box-shadow: 0 2px 8px rgba(220, 38, 38, 0.35);\n}\n\n/* ============================================================\n   Input area\n============================================================ */\n.nexusai-input-wrap {\n    flex-shrink: 0;\n    display: flex;\n    flex-direction: column;\n}\n.nexusai-input {\n    display: flex;\n    align-items: flex-end;\n    gap: 8px;\n    padding: 10px 12px;\n    border-top: 1px solid var(--nexusai-border);\n    background: var(--nexusai-bg);\n    flex-shrink: 0;\n}\n\n/* ── Character counter (ASIST-05, #375) — only visible near the limit ── */\n.nexusai-input__counter {\n    padding: 0 12px 8px;\n    font-size: 11.5px;\n    font-weight: 500;\n    text-align: right;\n    background: var(--nexusai-bg);\n}\n.nexusai-input__counter--warning { color: #d97706; }\n.nexusai-input__counter--limit   { color: #dc2626; }\n\n/* ── Pegado largo colapsado (ASIST-06, #384) ── */\n.nexusai-input__pastes {\n    display: flex;\n    flex-wrap: wrap;\n    gap: 6px;\n    padding: 8px 12px 0;\n    background: var(--nexusai-bg);\n}\n.nexusai-input__paste-chip {\n    display: inline-flex;\n    align-items: center;\n    gap: 5px;\n    font-size: 11.5px;\n    color: var(--nexusai-primary);\n    background: var(--nexusai-primary-light);\n    border: 1px solid var(--nexusai-primary-ring);\n    border-radius: var(--nexusai-radius-full);\n    padding: 3px 8px 3px 9px;\n    cursor: pointer;\n}\n.nexusai-input__paste-chip:hover {\n    background: var(--nexusai-primary-subtle);\n    border-color: var(--nexusai-primary);\n}\n.nexusai-input__paste-chip-remove {\n    display: inline-flex;\n    align-items: center;\n    justify-content: center;\n    color: var(--nexusai-fg-muted);\n    margin-left: 2px;\n    border-radius: 50%;\n    padding: 1px;\n}\n.nexusai-input__paste-chip-remove:hover {\n    color: var(--nexusai-fg);\n    background: rgba(0, 0, 0, 0.06);\n}\n.nexusai-input__paste-preview {\n    margin: 8px 12px 0;\n    background: var(--nexusai-surface);\n    border: 1px solid var(--nexusai-primary-ring);\n    border-radius: 8px;\n    padding: 8px 10px;\n    max-height: 160px;\n    display: flex;\n    flex-direction: column;\n}\n.nexusai-input__paste-preview-header {\n    display: flex;\n    align-items: center;\n    justify-content: space-between;\n    font-size: 11px;\n    color: var(--nexusai-fg-muted);\n    font-weight: 600;\n    margin-bottom: 6px;\n    flex-shrink: 0;\n}\n.nexusai-input__paste-preview-close {\n    background: none;\n    border: none;\n    color: var(--nexusai-fg-muted);\n    cursor: pointer;\n    display: flex;\n    padding: 2px;\n}\n.nexusai-input__paste-preview-close:hover { color: var(--nexusai-fg); }\n.nexusai-input__paste-preview-content {\n    font-family: ui-monospace, \"SF Mono\", Menlo, Consolas, monospace;\n    font-size: 11.5px;\n    color: var(--nexusai-fg);\n    white-space: pre-wrap;\n    word-break: break-word;\n    overflow-y: auto;\n    margin: 0;\n}\n.nexusai-input__textarea {\n    flex: 1;\n    border: 1px solid var(--nexusai-border);\n    border-radius: var(--nexusai-radius);\n    padding: 9px 12px;\n    font-family: inherit;\n    font-size: 13.5px;\n    line-height: 1.5;\n    resize: none;\n    outline: none;\n    transition: border-color 0.15s, box-shadow 0.15s;\n    max-height: 120px;\n    background: var(--nexusai-bg-muted);\n    color: var(--nexusai-fg);\n}\n.nexusai-input__textarea::placeholder { color: var(--nexusai-fg-subtle); }\n.nexusai-input__textarea:focus {\n    border-color: var(--nexusai-primary);\n    background: var(--nexusai-bg);\n    box-shadow: 0 0 0 3px var(--nexusai-primary-ring);\n}\n.nexusai-input__textarea:disabled {\n    opacity: 0.55;\n    cursor: not-allowed;\n}\n.nexusai-input__send {\n    flex-shrink: 0;\n    width: 36px;\n    height: 36px;\n    border-radius: var(--nexusai-radius);\n    border: none;\n    background: var(--nexusai-primary);\n    color: white;\n    cursor: pointer;\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    transition: background 0.15s, transform 0.15s, box-shadow 0.15s;\n}\n.nexusai-input__send:hover:not(:disabled) {\n    background: var(--nexusai-primary-hover);\n    box-shadow: 0 0 0 3px var(--nexusai-primary-ring);\n}\n.nexusai-input__send:active:not(:disabled) {\n    transform: scale(0.95);\n}\n.nexusai-input__send:disabled {\n    background: var(--nexusai-border-strong);\n    cursor: not-allowed;\n    opacity: 0.6;\n}\n\n/* ── Microphone (VOICE-01, #314) ── */\n.nexusai-input__mic {\n    flex-shrink: 0;\n    width: 36px;\n    height: 36px;\n    border-radius: var(--nexusai-radius);\n    border: 1px solid var(--nexusai-border);\n    background: var(--nexusai-bg-subtle, transparent);\n    color: var(--nexusai-fg-muted);\n    cursor: pointer;\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    transition: background 0.15s, color 0.15s, border-color 0.15s;\n}\n.nexusai-input__mic:hover:not(:disabled) {\n    background: var(--nexusai-primary-light);\n    color: var(--nexusai-primary);\n    border-color: var(--nexusai-primary-ring);\n}\n.nexusai-input__mic:disabled {\n    opacity: 0.5;\n    cursor: not-allowed;\n}\n.nexusai-input__mic--recording {\n    background: #fee2e2;\n    color: #dc2626;\n    border-color: #fecaca;\n    animation: nexusai-mic-pulse 1.4s ease-in-out infinite;\n}\n@keyframes nexusai-mic-pulse {\n    0%, 100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.35); }\n    50% { box-shadow: 0 0 0 5px rgba(220, 38, 38, 0); }\n}\n.nexusai-input__mic-spinner {\n    width: 14px;\n    height: 14px;\n    border: 2px solid var(--nexusai-border);\n    border-top-color: var(--nexusai-primary);\n    border-radius: 50%;\n    animation: nexusai-quiz-spin .8s linear infinite;\n}\n.nexusai-input__voice-error {\n    padding: 0 12px 8px;\n    font-size: 11.5px;\n    color: #b91c1c;\n}\n\n/* ============================================================\n   Footer\n============================================================ */\n.nexusai-panel__footer {\n    padding: 7px 14px;\n    border-top: 1px solid var(--nexusai-border);\n    color: var(--nexusai-fg-subtle);\n    text-align: center;\n    font-size: 10.5px;\n    flex-shrink: 0;\n    background: var(--nexusai-bg-muted);\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    gap: 5px;\n}\n\n/* ============================================================\n   Responsive\n============================================================ */\n@media (max-width: 767px) {\n    .nexusai-panel {\n        /* top:auto cancels the anchoring under the navbar icon (UX-02) —\n           on mobile the usual full-screen bottom sheet stays. */\n        top: auto;\n        bottom: 0;\n        right: 0;\n        left: 0;\n        width: 100%;\n        max-width: 100%;\n        max-height: calc(100vh - 72px);\n        height: calc(100vh - 72px);\n        border-radius: var(--nexusai-radius-xl) var(--nexusai-radius-xl) 0 0;\n        border-bottom: none;\n    }\n    .nexusai-input__textarea {\n        font-size: 16px; /* evita zoom en iOS */\n    }\n}\n\n/* ── Multi-course toggle (Feature B) ── */\n.nexusai-multicourse-toggle {\n    opacity: 0.55;\n    transition: opacity .15s, color .15s;\n    display: inline-flex;\n    align-items: center;\n    justify-content: center;\n}\n.nexusai-multicourse-toggle:hover { opacity: 0.85; }\n.nexusai-multicourse-toggle--active,\n.nexusai-multicourse-toggle--active:hover {\n    opacity: 1;\n    color: var(--nexusai-primary);\n}\n\n/* ── Toggle historial (Feature E) ── */\n.nexusai-history-toggle {\n    opacity: 0.55;\n    transition: opacity .15s, color .15s;\n    display: inline-flex;\n    align-items: center;\n    justify-content: center;\n}\n.nexusai-history-toggle:hover { opacity: 0.85; }\n\n/* ── Navigation menu toggle (UX-01) ── */\n.nexusai-nav-toggle {\n    opacity: 0.55;\n    transition: opacity .15s, color .15s;\n    display: inline-flex;\n    align-items: center;\n    justify-content: center;\n}\n.nexusai-nav-toggle:hover { opacity: 0.85; }\n.nexusai-nav-toggle--active,\n.nexusai-nav-toggle--active:hover {\n    opacity: 1;\n    color: var(--nexusai-primary);\n}\n\n/* ── \"Back to chat\" button in the contextual header (UX-01) ── */\n.nexusai-panel__back-btn {\n    margin-right: 2px;\n    flex-shrink: 0;\n}\n\n/* ── Buscador (Feature A) ── */\n.nexusai-search { padding: 12px; }\n.nexusai-search__form {\n    display: flex;\n    gap: 8px;\n    margin-bottom: 12px;\n}\n.nexusai-search__input {\n    flex: 1;\n    padding: 8px 12px;\n    border: 1px solid var(--nexusai-border);\n    border-radius: 8px;\n    font-size: 13px;\n    outline: none;\n}\n.nexusai-search__input:focus { border-color: var(--nexusai-primary); }\n.nexusai-search__btn {\n    padding: 8px 14px;\n    background: var(--nexusai-primary);\n    color: #fff;\n    border: none;\n    border-radius: 8px;\n    font-size: 13px;\n    font-weight: 500;\n    cursor: pointer;\n    transition: background .15s, opacity .15s;\n}\n.nexusai-search__btn:hover:not(:disabled) { background: #3d6ec0; }\n.nexusai-search__btn:disabled { opacity: .5; cursor: not-allowed; }\n.nexusai-search__empty {\n    font-size: 13px;\n    color: var(--nexusai-fg-subtle);\n    text-align: center;\n    padding: 24px 16px;\n    line-height: 1.55;\n}\n.nexusai-search__empty-hint {\n    display: inline-block;\n    margin-top: 6px;\n    font-size: 12px;\n}\n\n/* ── No results, with an action (BUS-07, #362) ── */\n.nexusai-search__empty-state {\n    text-align: center;\n    padding: 24px 16px;\n}\n.nexusai-search__empty-icon {\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    width: 40px;\n    height: 40px;\n    margin: 0 auto 10px;\n    border-radius: var(--nexusai-radius-full, 9999px);\n    background: var(--nexusai-primary-light, rgba(99,102,241,0.1));\n    color: var(--nexusai-primary, #6366f1);\n}\n.nexusai-search__empty-title {\n    font-size: 13px;\n    color: var(--nexusai-fg-muted);\n    margin: 0 0 4px;\n    line-height: 1.5;\n}\n.nexusai-search__empty-sub {\n    font-size: 12px;\n    color: var(--nexusai-fg-subtle);\n    margin: 0 0 14px;\n    line-height: 1.5;\n}\n.nexusai-search__empty-cta {\n    padding: 7px 14px;\n    background: var(--nexusai-primary, #6366f1);\n    color: #fff;\n    border: none;\n    border-radius: 8px;\n    font-size: 12.5px;\n    font-weight: 500;\n    cursor: pointer;\n    transition: background .15s;\n}\n.nexusai-search__empty-cta:hover { background: #3d6ec0; }\n\n/* ── Recent searches (BUS-06, #361) ── */\n.nexusai-search__recent {\n    margin: -4px 0 12px;\n    padding: 10px 12px;\n    background: var(--nexusai-surface);\n    border: 1px solid var(--nexusai-border);\n    border-radius: 8px;\n}\n.nexusai-search__recent-label {\n    display: flex;\n    align-items: center;\n    gap: 5px;\n    font-size: 11px;\n    font-weight: 600;\n    color: var(--nexusai-fg-subtle);\n    text-transform: uppercase;\n    letter-spacing: 0.4px;\n    margin-bottom: 8px;\n}\n.nexusai-search__recent-list {\n    display: flex;\n    flex-wrap: wrap;\n    gap: 6px;\n}\n.nexusai-search__recent-item {\n    padding: 5px 10px;\n    background: var(--nexusai-bg);\n    border: 1px solid var(--nexusai-border);\n    border-radius: var(--nexusai-radius-full, 9999px);\n    font-size: 12px;\n    color: var(--nexusai-fg-muted);\n    cursor: pointer;\n    transition: border-color .12s, color .12s;\n}\n.nexusai-search__recent-item:hover {\n    border-color: var(--nexusai-primary, #6366f1);\n    color: var(--nexusai-primary, #6366f1);\n}\n.nexusai-search__result {\n    background: var(--nexusai-surface);\n    border: 1px solid var(--nexusai-border);\n    border-radius: 8px;\n    padding: 10px 12px;\n    margin-bottom: 8px;\n    box-shadow: var(--nexusai-shadow-sm, 0 1px 2px rgba(0,0,0,0.05));\n    transition: box-shadow .12s, border-color .12s;\n}\n.nexusai-search__result:hover {\n    border-color: var(--nexusai-primary-ring, rgba(99,102,241,0.2));\n    box-shadow: var(--nexusai-shadow, 0 4px 6px -1px rgba(0,0,0,0.07));\n}\n.nexusai-search__result-header {\n    display: flex;\n    flex-wrap: wrap;\n    justify-content: space-between;\n    align-items: center;\n    margin-bottom: 6px;\n    gap: 6px 8px;\n}\n.nexusai-search__filename {\n    display: inline-flex;\n    align-items: center;\n    gap: 6px;\n    font-size: 12px;\n    font-weight: 600;\n    color: var(--nexusai-fg);\n    overflow: hidden;\n    text-overflow: ellipsis;\n    white-space: nowrap;\n    min-width: 0;\n    flex: 1 1 120px;\n}\n.nexusai-search__score {\n    font-size: 11px;\n    font-weight: 600;\n    flex-shrink: 0;\n}\n.nexusai-search__result-actions {\n    display: flex;\n    flex-wrap: wrap;\n    align-items: center;\n    gap: 6px;\n    flex-shrink: 0;\n}\n.nexusai-search__open-btn {\n    font-size: 11px;\n    font-weight: 600;\n    color: var(--nexusai-primary, #6366f1);\n    background: none;\n    border: none;\n    cursor: pointer;\n    padding: 2px 4px;\n    white-space: nowrap;\n}\n.nexusai-search__open-btn:hover { text-decoration: underline; }\n.nexusai-search__summarize-btn {\n    font-size: 10.5px;\n    font-weight: 600;\n    color: var(--nexusai-primary, #6366f1);\n    background: var(--nexusai-bg, #fff);\n    border: 1px solid var(--nexusai-primary-ring, rgba(99,102,241,0.2));\n    border-radius: var(--nexusai-radius-full, 9999px);\n    padding: 2px 9px;\n    cursor: pointer;\n    white-space: nowrap;\n    flex-shrink: 0;\n}\n.nexusai-search__summarize-btn:hover { background: var(--nexusai-primary-light, rgba(99,102,241,0.07)); }\n.nexusai-search__summarize-btn:disabled { opacity: .6; cursor: default; }\n.nexusai-search__course {\n    font-size: 11px;\n    color: var(--nexusai-fg-muted, #64748b);\n    margin: 0 0 4px;\n}\n.nexusai-search__content {\n    font-size: 12px;\n    color: var(--nexusai-fg-muted);\n    line-height: 1.5;\n    margin: 0;\n}\n.nexusai-search__content mark {\n    background: var(--nexusai-primary-light);\n    color: inherit;\n    border-radius: 2px;\n}\n.nexusai-search__summary {\n    margin-top: 8px;\n    padding: 8px 10px;\n    background: var(--nexusai-bg, #fff);\n    border: 1px solid var(--nexusai-border, #e2e8f0);\n    border-radius: 6px;\n}\n.nexusai-search__summary-label {\n    margin: 0 0 4px;\n    font-size: 10.5px;\n    font-weight: 700;\n    text-transform: uppercase;\n    letter-spacing: 0.4px;\n    color: var(--nexusai-fg-muted, #64748b);\n}\n.nexusai-search__summary-text {\n    margin: 0;\n    font-size: 12px;\n    line-height: 1.5;\n    color: var(--nexusai-fg, #1e293b);\n}\n.nexusai-search__summary-text--loading { color: var(--nexusai-fg-muted, #64748b); }\n.nexusai-search__summary-text--error { color: #dc2626; }\n\n/* Material type filter (BUS-02) */\n.nexusai-search__typebtns {\n    display: flex;\n    flex-wrap: wrap;\n    gap: 6px;\n    margin-bottom: 12px;\n}\n.nexusai-search__typebtn {\n    padding: 5px 10px;\n    font-size: 12px;\n    font-weight: 500;\n    color: var(--nexusai-fg-muted);\n    background: var(--nexusai-surface);\n    border: 1px solid var(--nexusai-border);\n    border-radius: 999px;\n    cursor: pointer;\n    transition: all .12s;\n}\n.nexusai-search__typebtn:hover {\n    border-color: var(--nexusai-border-hover);\n    color: var(--nexusai-primary);\n}\n.nexusai-search__typebtn--active {\n    background: var(--nexusai-primary);\n    border-color: var(--nexusai-primary);\n    color: #fff;\n}\n.nexusai-search__type-badge {\n    flex-shrink: 0;\n    font-size: 10.5px;\n    font-weight: 600;\n    color: var(--nexusai-fg-muted);\n    background: var(--nexusai-bg-muted);\n    border: 1px solid var(--nexusai-border);\n    border-radius: 999px;\n    padding: 2px 8px;\n}\n\n/* ── Section filter (BUS-05) ── */\n.nexusai-search__sectionselect {\n    width: 100%;\n    padding: 6px 10px;\n    margin-bottom: 12px;\n    font-size: 12.5px;\n    color: var(--nexusai-fg);\n    background: var(--nexusai-bg);\n    border: 1px solid var(--nexusai-border);\n    border-radius: 8px;\n    cursor: pointer;\n}\n.nexusai-search__sectionselect:focus-visible {\n    outline: 2px solid var(--nexusai-primary);\n    outline-offset: 1px;\n}\n\n/* ── Course calendar (CAL-01) ── */\n.nexusai-calendar { padding: 12px; }\n.nexusai-calendar__rangebtns {\n    display: flex;\n    align-items: center;\n    gap: 8px;\n    margin-bottom: 14px;\n}\n.nexusai-calendar__rangebtn {\n    padding: 5px 10px;\n    font-size: 12px;\n    font-weight: 500;\n    color: var(--nexusai-fg-muted);\n    background: var(--nexusai-surface);\n    border: 1px solid var(--nexusai-border);\n    border-radius: 6px;\n    cursor: pointer;\n    transition: all .12s;\n}\n.nexusai-calendar__rangebtn:hover {\n    border-color: var(--nexusai-border-hover);\n    color: var(--nexusai-primary);\n}\n.nexusai-calendar__rangebtn--active {\n    background: var(--nexusai-primary);\n    border-color: var(--nexusai-primary);\n    color: #fff;\n}\n.nexusai-calendar__empty {\n    display: flex;\n    flex-direction: column;\n    align-items: center;\n    gap: 8px;\n    padding: 32px 12px;\n    color: var(--nexusai-fg-subtle);\n    text-align: center;\n    font-size: 13px;\n}\n.nexusai-calendar__empty p { margin: 0; }\n.nexusai-calendar__empty-hint {\n    font-size: 12px;\n    max-width: 300px;\n    line-height: 1.5;\n}\n.nexusai-calendar__list {\n    display: flex;\n    flex-direction: column;\n    gap: 8px;\n}\n.nexusai-calendar-item {\n    display: flex;\n    align-items: flex-start;\n    gap: 10px;\n    background: var(--nexusai-surface);\n    border: 1px solid var(--nexusai-border);\n    border-left: 3px solid var(--nexusai-primary);\n    border-radius: 8px;\n    padding: 10px 12px;\n    text-decoration: none;\n    transition: background .12s, border-color .12s;\n}\n.nexusai-calendar-item:hover {\n    background: var(--nexusai-primary-subtle);\n}\n.nexusai-calendar-item__icon {\n    flex-shrink: 0;\n    color: var(--nexusai-primary);\n    margin-top: 2px;\n}\n.nexusai-calendar-item__body {\n    flex: 1;\n    min-width: 0;\n}\n.nexusai-calendar-item__row {\n    display: flex;\n    justify-content: space-between;\n    align-items: flex-start;\n    gap: 8px;\n}\n.nexusai-calendar-item__name {\n    font-size: 13px;\n    font-weight: 600;\n    color: var(--nexusai-fg);\n    line-height: 1.4;\n}\n.nexusai-calendar-item__badge {\n    flex-shrink: 0;\n    font-size: 10.5px;\n    font-weight: 600;\n    color: var(--nexusai-primary);\n    background: var(--nexusai-primary-light);\n    border-radius: 999px;\n    padding: 2px 8px;\n}\n.nexusai-calendar-item__date {\n    display: block;\n    margin-top: 3px;\n    font-size: 11.5px;\n    color: var(--nexusai-fg-muted);\n}\n\n/* ── CAL-02 · Alertas de calendario ── */\n.nexusai-calendar-item-wrapper {\n    border: 1px solid var(--nexusai-border);\n    border-radius: 8px;\n    overflow: hidden;\n    margin-bottom: 8px;\n}\n.nexusai-calendar-item-wrapper .nexusai-calendar-item {\n    border: none;\n    border-radius: 0;\n    margin-bottom: 0;\n}\n.nexusai-calendar__alert-row {\n    display: flex;\n    align-items: center;\n    gap: 8px;\n    padding: 6px 12px;\n    background: var(--nexusai-bg-muted);\n    border-top: 1px solid var(--nexusai-border);\n}\n.nexusai-calendar__alert-label {\n    font-size: 11.5px;\n    color: var(--nexusai-fg-muted);\n    white-space: nowrap;\n}\n.nexusai-calendar__alert-select {\n    font-size: 12px;\n    padding: 2px 6px;\n    border: 1px solid var(--nexusai-border-strong);\n    border-radius: 5px;\n    background: var(--nexusai-bg);\n    color: var(--nexusai-fg-muted);\n    cursor: pointer;\n}\n.nexusai-calendar__alert-select:disabled {\n    opacity: 0.5;\n    cursor: not-allowed;\n}\n\n/* ----- CAL-05: toggle lista/grilla ----- */\n.nexusai-calendar__viewbtns {\n    display: flex;\n    align-items: center;\n    gap: 8px;\n    margin-bottom: 14px;\n}\n\n/* ----- CAL-05: grilla de mes ----- */\n.nexusai-calendar__grid-wrap { margin-bottom: 8px; }\n.nexusai-calendar__grid-nav {\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    gap: 12px;\n    margin-bottom: 10px;\n}\n.nexusai-calendar__grid-navbtn {\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    width: 24px;\n    height: 24px;\n    padding: 0;\n    background: #f7f8fc;\n    border: 1px solid #e2e8f0;\n    border-radius: 6px;\n    color: #64748b;\n    cursor: pointer;\n}\n.nexusai-calendar__grid-navbtn:hover {\n    border-color: #c6d4f0;\n    color: var(--nexusai-primary, #6366f1);\n}\n.nexusai-calendar__grid-monthlabel {\n    font-size: 13px;\n    font-weight: 600;\n    color: var(--nexusai-fg, #1e293b);\n    text-transform: capitalize;\n    min-width: 130px;\n    text-align: center;\n}\n.nexusai-calendar__grid {\n    display: grid;\n    grid-template-columns: repeat(7, 1fr);\n    gap: 3px;\n}\n.nexusai-calendar__grid-weekday {\n    text-align: center;\n    font-size: 10.5px;\n    font-weight: 600;\n    color: #94a3b8;\n    text-transform: uppercase;\n    padding-bottom: 4px;\n}\n.nexusai-calendar__grid-cell {\n    display: flex;\n    flex-direction: column;\n    align-items: center;\n    gap: 3px;\n    min-height: 40px;\n    padding: 4px 2px;\n    border-radius: 6px;\n    background: #f7f8fc;\n}\n.nexusai-calendar__grid-cell--outside {\n    background: transparent;\n    opacity: 0.35;\n}\n.nexusai-calendar__grid-cell--today {\n    background: var(--nexusai-primary-light, rgba(99,102,241,0.1));\n    box-shadow: inset 0 0 0 1px var(--nexusai-primary, #6366f1);\n}\n.nexusai-calendar__grid-daynum {\n    font-size: 12px;\n    font-weight: 500;\n    color: var(--nexusai-fg, #1e293b);\n}\n.nexusai-calendar__grid-dots {\n    display: flex;\n    align-items: center;\n    gap: 2px;\n}\n.nexusai-calendar__grid-dot {\n    width: 5px;\n    height: 5px;\n    border-radius: 50%;\n    background: var(--nexusai-primary, #6366f1);\n}\n.nexusai-calendar__grid-dot--mod_assign { background: #6366f1; }\n.nexusai-calendar__grid-dot--mod_quiz { background: #dc2626; }\n.nexusai-calendar__grid-dot--course { background: #16a34a; }\n.nexusai-calendar__grid-more {\n    font-size: 9px;\n    font-weight: 600;\n    color: #64748b;\n}\n\n/* ----- CAL-07: feed .ics suscribible ----- */\n.nexusai-calendar__feed {\n    margin-top: 14px;\n    padding-top: 12px;\n    border-top: 1px solid var(--nexusai-border, #e2e8f0);\n}\n.nexusai-calendar__feed-actions {\n    display: flex;\n    align-items: center;\n    gap: 14px;\n}\n.nexusai-calendar__feed-toggle {\n    background: none;\n    border: none;\n    padding: 0;\n    font: inherit;\n    font-size: 12.5px;\n    font-weight: 500;\n    color: var(--nexusai-primary, #6366f1);\n    cursor: pointer;\n}\n.nexusai-calendar__feed-toggle:hover { text-decoration: underline; }\n.nexusai-calendar__export-btn {\n    display: inline-flex;\n    align-items: center;\n    gap: 5px;\n    background: none;\n    border: none;\n    padding: 0;\n    font: inherit;\n    font-size: 12.5px;\n    font-weight: 500;\n    color: var(--nexusai-primary, #6366f1);\n    cursor: pointer;\n}\n.nexusai-calendar__export-btn:hover:not(:disabled) { text-decoration: underline; }\n.nexusai-calendar__export-btn:disabled { opacity: 0.55; cursor: not-allowed; }\n.nexusai-calendar__feed-body {\n    margin-top: 10px;\n    display: flex;\n    flex-direction: column;\n    gap: 8px;\n}\n.nexusai-calendar__feed-help,\n.nexusai-calendar__feed-revoke-hint {\n    margin: 0;\n    font-size: 11.5px;\n    line-height: 1.5;\n    color: var(--nexusai-fg-muted);\n}\n.nexusai-calendar__feed-revoke-hint { margin-top: 4px; }\n.nexusai-calendar__feed-status {\n    margin: 0;\n    font-size: 12px;\n    color: var(--nexusai-fg-muted);\n}\n.nexusai-calendar__feed-status--error { color: #dc2626; }\n.nexusai-calendar__feed-url-row {\n    display: flex;\n    gap: 6px;\n}\n.nexusai-calendar__feed-url {\n    flex: 1;\n    min-width: 0;\n    font-size: 11px;\n    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;\n    padding: 6px 8px;\n    border: 1px solid var(--nexusai-border-strong);\n    border-radius: 5px;\n    background: var(--nexusai-bg-muted);\n    color: var(--nexusai-fg-muted);\n}\n.nexusai-calendar__feed-copy,\n.nexusai-calendar__feed-revoke {\n    background: var(--nexusai-bg-subtle);\n    border: 1px solid var(--nexusai-border);\n    border-radius: 5px;\n    padding: 6px 12px;\n    font: inherit;\n    font-size: 12px;\n    color: var(--nexusai-fg-muted);\n    cursor: pointer;\n    white-space: nowrap;\n}\n.nexusai-calendar__feed-copy:hover,\n.nexusai-calendar__feed-revoke:hover { background: #e2e8f0; }\n.nexusai-calendar__feed-revoke-actions {\n    display: flex;\n    gap: 6px;\n}\n.nexusai-calendar__feed-revoke--danger {\n    background: #dc2626;\n    border-color: #dc2626;\n    color: #fff;\n}\n.nexusai-calendar__feed-revoke--danger:hover { background: #b91c1c; }\n.nexusai-calendar__feed-revoke:disabled { opacity: 0.55; cursor: not-allowed; }\n.nexusai-calendar__alert-banner {\n    display: flex;\n    flex-wrap: wrap;\n    align-items: center;\n    gap: 6px;\n    padding: 8px 12px;\n    margin-bottom: 10px;\n    background: #fef9c3;\n    border: 1px solid #fde68a;\n    border-radius: 8px;\n    font-size: 12.5px;\n    color: #92400e;\n}\n.nexusai-calendar__alert-banner-prefix {\n    font-weight: 600;\n}\n.nexusai-calendar__alert-badge {\n    display: inline-block;\n    padding: 2px 8px;\n    background: #fef3c7;\n    border: 1px solid #fde68a;\n    border-radius: 12px;\n    font-size: 11.5px;\n    color: #78350f;\n}\n\n/* ── Conversation history (Feature E) ──\n   RDS-02 (#401): one more view of the panel (like study/calendar/search), not\n   a floating overlay — the header with the title and the \"back\" arrow are\n   set by ChatApp.jsx, here it only has to fill the available space. */\n.nexusai-history {\n    flex: 1;\n    overflow: hidden;\n    display: flex;\n    flex-direction: column;\n}\n\n.nexusai-history__scope {\n    display: flex;\n    padding: 8px 10px;\n    gap: 6px;\n    border-bottom: 1px solid var(--nexusai-border);\n}\n.nexusai-history__scope-btn {\n    flex: 1;\n    padding: 4px 8px;\n    font-size: 11px;\n    font-weight: 500;\n    color: var(--nexusai-fg-muted);\n    background: var(--nexusai-surface);\n    border: 1px solid transparent;\n    border-radius: 6px;\n    cursor: pointer;\n    transition: background .12s, color .12s, border-color .12s;\n}\n.nexusai-history__scope-btn:hover { color: var(--nexusai-fg); }\n.nexusai-history__scope-btn--active {\n    color: var(--nexusai-primary);\n    background: var(--nexusai-primary-subtle);\n    border-color: var(--nexusai-border-hover);\n}\n\n.nexusai-history__list {\n    overflow-y: auto;\n    padding: 4px 6px 8px;\n    flex: 1;\n}\n.nexusai-history__empty {\n    font-size: 12px;\n    color: var(--nexusai-fg-subtle);\n    text-align: center;\n    margin: 14px 8px;\n}\n.nexusai-history__item {\n    display: block;\n    width: 100%;\n    text-align: left;\n    padding: 8px 10px;\n    margin: 2px 0;\n    background: none;\n    border: 1px solid transparent;\n    border-radius: 8px;\n    cursor: pointer;\n    transition: background .1s, border-color .1s;\n}\n.nexusai-history__item:hover {\n    background: var(--nexusai-surface);\n}\n.nexusai-history__item--active {\n    background: var(--nexusai-primary-subtle);\n    border-color: var(--nexusai-border-hover);\n}\n.nexusai-history__item-row {\n    display: flex;\n    justify-content: space-between;\n    align-items: baseline;\n    gap: 6px;\n}\n.nexusai-history__item-preview {\n    font-size: 12.5px;\n    color: var(--nexusai-fg);\n    overflow: hidden;\n    text-overflow: ellipsis;\n    white-space: nowrap;\n    flex: 1;\n}\n.nexusai-history__item-time {\n    font-size: 10.5px;\n    color: var(--nexusai-fg-subtle);\n    flex-shrink: 0;\n}\n.nexusai-history__item-meta {\n    font-size: 10.5px;\n    color: var(--nexusai-fg-subtle);\n    margin-top: 2px;\n}\n.nexusai-history__item-wrap {\n    position: relative;\n}\n.nexusai-history__item-wrap .nexusai-history__item {\n    padding-right: 32px;\n}\n.nexusai-history__item-delete {\n    position: absolute;\n    top: 6px;\n    right: 6px;\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    width: 22px;\n    height: 22px;\n    background: none;\n    border: none;\n    border-radius: 6px;\n    color: var(--nexusai-fg-subtle);\n    cursor: pointer;\n    opacity: 0;\n    transition: opacity .12s, background .12s, color .12s;\n}\n.nexusai-history__item-wrap:hover .nexusai-history__item-delete {\n    opacity: 1;\n}\n.nexusai-history__item-delete:hover {\n    background: #fef2f2;\n    color: #dc2626;\n}\n.nexusai-history__item-delete:disabled {\n    opacity: 0.4;\n    cursor: not-allowed;\n}\n\n/* UX-18 (#388): with no offset/total in the sessions backend, \"load more\"\n   replaces the list asking for a bigger limit — same visual recipe as\n   .nexusai-gaps__load-more (documents.css), copied here because this\n   dropdown lives in the chatwidget-lazy bundle, not documents-manager-lazy. */\n.nexusai-history__load-more {\n    display: block;\n    width: 100%;\n    margin-top: 4px;\n    padding: 8px 10px;\n    font-size: 12.5px;\n    font-weight: 600;\n    color: var(--nexusai-primary, #6366f1);\n    background: var(--nexusai-surface);\n    border: 1px solid var(--nexusai-border);\n    border-radius: 6px;\n    cursor: pointer;\n    transition: all .12s;\n}\n.nexusai-history__load-more:hover { border-color: var(--nexusai-border-hover); }\n.nexusai-history__load-more:disabled { color: var(--nexusai-fg-subtle); cursor: default; }\n\n/* ── Navigation menu (UX-01) — modeled on .nexusai-history ── */\n.nexusai-navmenu {\n    position: absolute;\n    top: 56px;\n    right: 10px;\n    width: 220px;\n    background: var(--nexusai-bg);\n    border: 1px solid var(--nexusai-border);\n    border-radius: 10px;\n    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);\n    z-index: 1100;\n    display: flex;\n    flex-direction: column;\n    animation: nexusai-source-panel-in .15s ease-out;\n}\n.nexusai-navmenu__header {\n    display: flex;\n    justify-content: space-between;\n    align-items: center;\n    padding: 10px 12px 6px;\n    border-bottom: 1px solid var(--nexusai-border);\n}\n.nexusai-navmenu__title {\n    font-size: 13px;\n    font-weight: 600;\n    color: var(--nexusai-fg);\n}\n.nexusai-navmenu__close {\n    background: none;\n    border: none;\n    font-size: 18px;\n    color: var(--nexusai-fg-subtle);\n    cursor: pointer;\n    line-height: 1;\n    padding: 0 4px;\n}\n.nexusai-navmenu__close:hover { color: var(--nexusai-fg); }\n.nexusai-navmenu__list {\n    padding: 6px;\n}\n.nexusai-navmenu__item {\n    display: flex;\n    align-items: center;\n    gap: 10px;\n    width: 100%;\n    text-align: left;\n    padding: 9px 10px;\n    margin: 2px 0;\n    font-size: 13px;\n    color: var(--nexusai-fg);\n    background: none;\n    border: 1px solid transparent;\n    border-radius: 8px;\n    cursor: pointer;\n    transition: background .1s, border-color .1s, color .1s;\n}\n.nexusai-navmenu__item:hover {\n    background: var(--nexusai-surface);\n}\n.nexusai-navmenu__item--active {\n    background: var(--nexusai-primary-subtle);\n    border-color: var(--nexusai-border-hover);\n    color: var(--nexusai-primary);\n}\n.nexusai-navmenu__item-icon {\n    display: inline-flex;\n    flex-shrink: 0;\n}\n\n/* ── Racha de estudio (SP-16, #354) ── */\n.nexusai-study__streak {\n    display: flex;\n    align-items: center;\n    gap: 6px;\n    padding: 8px 12px 0;\n    font-size: 12.5px;\n    font-weight: 600;\n    color: #ea580c;\n    flex-shrink: 0;\n}\n\n/* ── Selector Practicar/Repaso de Modo Estudio (UX-01) ── */\n.nexusai-study__modebtns {\n    display: flex;\n    padding: 10px 12px 0;\n    gap: 6px;\n    flex-shrink: 0;\n}\n.nexusai-study__modebtn {\n    flex: 1;\n    padding: 7px 8px;\n    font-size: 12.5px;\n    font-weight: 500;\n    color: var(--nexusai-fg-muted);\n    background: var(--nexusai-surface);\n    border: 1px solid transparent;\n    border-radius: 6px;\n    cursor: pointer;\n    transition: background .12s, color .12s, border-color .12s;\n}\n.nexusai-study__modebtn:hover { color: var(--nexusai-fg); }\n.nexusai-study__modebtn--active {\n    color: var(--nexusai-primary);\n    background: var(--nexusai-primary-subtle);\n    border-color: var(--nexusai-border-hover);\n}\n\n/* ── Quiz Generator (Feature F) ── */\n.nexusai-quiz {\n    padding: 14px;\n    display: flex;\n    flex-direction: column;\n    gap: 14px;\n}\n.nexusai-quiz--center {\n    align-items: center;\n    justify-content: center;\n    text-align: center;\n    min-height: 200px;\n}\n\n.nexusai-quiz__intro {\n    text-align: center;\n    padding: 4px 0 6px;\n}\n.nexusai-quiz__intro-title {\n    font-size: 15px;\n    font-weight: 600;\n    color: var(--nexusai-fg);\n    margin: 0 0 4px;\n}\n.nexusai-quiz__intro-text {\n    font-size: 12px;\n    color: var(--nexusai-fg-muted);\n    margin: 0;\n    line-height: 1.5;\n}\n\n.nexusai-quiz__field {\n    display: flex;\n    flex-direction: column;\n    gap: 6px;\n}\n.nexusai-quiz__label {\n    font-size: 11.5px;\n    font-weight: 500;\n    color: var(--nexusai-fg-muted);\n}\n.nexusai-quiz__input {\n    padding: 8px 12px;\n    border: 1px solid var(--nexusai-border);\n    border-radius: 8px;\n    font-size: 13px;\n    outline: none;\n    transition: border-color .12s;\n}\n.nexusai-quiz__input:focus { border-color: var(--nexusai-primary); }\n.nexusai-quiz__input--error { border-color: #e53e3e; }\n.nexusai-quiz__topic-error { margin: 4px 0 0; font-size: 12px; color: #e53e3e; }\n\n.nexusai-quiz__numbtns {\n    display: flex;\n    gap: 6px;\n}\n.nexusai-quiz__numbtn {\n    flex: 1;\n    padding: 7px 0;\n    font-size: 13px;\n    font-weight: 500;\n    color: var(--nexusai-fg-muted);\n    background: var(--nexusai-surface);\n    border: 1px solid var(--nexusai-border);\n    border-radius: 6px;\n    cursor: pointer;\n    transition: all .12s;\n}\n.nexusai-quiz__numbtn:hover {\n    border-color: var(--nexusai-border-hover);\n    color: var(--nexusai-primary);\n}\n.nexusai-quiz__numbtn--active {\n    background: var(--nexusai-primary);\n    border-color: var(--nexusai-primary);\n    color: #fff;\n}\n\n/* Difficulty suggestion based on history (SP-12, #322) */\n.nexusai-quiz__diff-suggestion {\n    margin: 4px 0 6px;\n    padding: 6px 10px;\n    font-size: 11.5px;\n    line-height: 1.4;\n    color: var(--nexusai-primary-hover, #4f46e5);\n    background: var(--nexusai-primary-light, rgba(99,102,241,0.08));\n    border-radius: 6px;\n}\n\n/* Selector de dificultad (SP-08) */\n.nexusai-quiz__diffbtns {\n    display: flex;\n    gap: 6px;\n}\n.nexusai-quiz__diffbtn {\n    flex: 1;\n    padding: 7px 0;\n    font-size: 13px;\n    font-weight: 500;\n    color: var(--nexusai-fg-muted);\n    background: var(--nexusai-surface);\n    border: 1px solid var(--nexusai-border);\n    border-radius: 6px;\n    cursor: pointer;\n    transition: all .12s;\n}\n.nexusai-quiz__diffbtn:hover {\n    border-color: var(--nexusai-border-hover);\n    color: var(--nexusai-primary);\n}\n.nexusai-quiz__diffbtn--active {\n    background: var(--nexusai-primary);\n    border-color: var(--nexusai-primary);\n    color: #fff;\n}\n\n/* Question type selector */\n.nexusai-quiz__typebtns {\n    display: grid;\n    grid-template-columns: 1fr 1fr;\n    gap: 6px;\n}\n.nexusai-quiz__typebtn {\n    padding: 7px 6px;\n    font-size: 12px;\n    font-weight: 500;\n    color: var(--nexusai-fg-muted);\n    background: var(--nexusai-surface);\n    border: 1px solid var(--nexusai-border);\n    border-radius: 6px;\n    cursor: pointer;\n    transition: all .12s;\n    text-align: center;\n    line-height: 1.3;\n}\n.nexusai-quiz__typebtn:hover {\n    border-color: var(--nexusai-border-hover);\n    color: var(--nexusai-primary);\n}\n.nexusai-quiz__typebtn--active {\n    background: var(--nexusai-primary);\n    border-color: var(--nexusai-primary);\n    color: #fff;\n}\n\n/* Compact layout for T/F (only 2 options in a row) */\n.nexusai-quiz__options--tf {\n    flex-direction: row;\n    gap: 10px;\n}\n.nexusai-quiz__options--tf .nexusai-quiz__option {\n    flex: 1;\n    justify-content: center;\n}\n\n/* Preguntas abiertas */\n.nexusai-quiz__open-area {\n    display: flex;\n    flex-direction: column;\n    gap: 6px;\n}\n.nexusai-quiz__open-hint {\n    font-size: 11.5px;\n    color: var(--nexusai-fg-muted);\n    margin: 0;\n    font-style: italic;\n}\n.nexusai-quiz__open-textarea {\n    padding: 10px 12px;\n    border: 1.5px solid var(--nexusai-border);\n    border-radius: 8px;\n    font-size: 13px;\n    color: var(--nexusai-fg);\n    background: var(--nexusai-bg);\n    resize: vertical;\n    outline: none;\n    font-family: inherit;\n    line-height: 1.5;\n    transition: border-color .12s;\n    min-height: 100px;\n}\n.nexusai-quiz__open-textarea:focus { border-color: var(--nexusai-primary); }\n.nexusai-quiz__open-textarea:disabled { background: var(--nexusai-bg-muted); color: var(--nexusai-fg-subtle); }\n\n/* Inline spinner inside the Check button (open questions) */\n.nexusai-quiz__btn-spinner {\n    width: 13px;\n    height: 13px;\n    border: 2px solid rgba(255,255,255,0.4);\n    border-top-color: #fff;\n    border-radius: 50%;\n    animation: nexusai-quiz-spin .7s linear infinite;\n    flex-shrink: 0;\n}\n\n.nexusai-quiz__primary {\n    display: inline-flex;\n    align-items: center;\n    justify-content: center;\n    gap: 6px;\n    padding: 9px 14px;\n    background: var(--nexusai-primary);\n    color: #fff;\n    border: none;\n    border-radius: var(--nexusai-radius);\n    font-size: 13px;\n    font-weight: 500;\n    cursor: pointer;\n    transition: background .12s, opacity .12s;\n}\n.nexusai-quiz__primary:hover:not(:disabled) { background: var(--nexusai-primary-hover); }\n.nexusai-quiz__primary:disabled {\n    opacity: 0.5;\n    cursor: not-allowed;\n}\n.nexusai-quiz__secondary {\n    display: inline-flex;\n    align-items: center;\n    justify-content: center;\n    gap: 6px;\n    padding: 9px 14px;\n    background: none;\n    color: var(--nexusai-fg-muted);\n    border: 1px solid var(--nexusai-border);\n    border-radius: var(--nexusai-radius);\n    font-size: 13px;\n    font-weight: 500;\n    cursor: pointer;\n    transition: background .12s, border-color .12s;\n}\n.nexusai-quiz__secondary:hover {\n    background: var(--nexusai-bg-muted);\n    border-color: var(--nexusai-border-strong);\n}\n\n/* Spinner */\n.nexusai-quiz__spinner {\n    width: 32px;\n    height: 32px;\n    border: 3px solid var(--nexusai-border);\n    border-top-color: var(--nexusai-primary);\n    border-radius: 50%;\n    animation: nexusai-quiz-spin .8s linear infinite;\n}\n@keyframes nexusai-quiz-spin {\n    to { transform: rotate(360deg); }\n}\n.nexusai-quiz__loading-text {\n    font-size: 12.5px;\n    color: var(--nexusai-fg-muted);\n    margin: 6px 0 0;\n}\n\n/* Progress */\n.nexusai-quiz__progress {\n    display: flex;\n    flex-direction: column;\n    gap: 4px;\n}\n.nexusai-quiz__progress-label {\n    font-size: 11px;\n    color: var(--nexusai-fg-subtle);\n    font-weight: 500;\n}\n.nexusai-quiz__progress-bar {\n    height: 4px;\n    background: var(--nexusai-bg-subtle);\n    border-radius: 2px;\n    overflow: hidden;\n}\n.nexusai-quiz__progress-fill {\n    height: 100%;\n    background: var(--nexusai-primary);\n    transition: width .25s ease-out;\n}\n\n/* Question */\n.nexusai-quiz__question {\n    font-size: 14.5px;\n    font-weight: 500;\n    color: var(--nexusai-fg);\n    line-height: 1.45;\n    margin: 0;\n}\n\n.nexusai-quiz__options {\n    display: flex;\n    flex-direction: column;\n    gap: 7px;\n}\n.nexusai-quiz__option {\n    display: flex;\n    align-items: flex-start;\n    gap: 10px;\n    padding: 10px 12px;\n    background: var(--nexusai-bg);\n    border: 1.5px solid var(--nexusai-border);\n    border-radius: 8px;\n    font-size: 13px;\n    color: var(--nexusai-fg);\n    text-align: left;\n    cursor: pointer;\n    transition: border-color .12s, background .12s, transform .08s;\n}\n.nexusai-quiz__option:hover:not(:disabled) {\n    border-color: var(--nexusai-border-hover);\n    background: var(--nexusai-surface);\n}\n.nexusai-quiz__option:active:not(:disabled) {\n    transform: scale(0.98);\n}\n.nexusai-quiz__option:disabled {\n    cursor: default;\n}\n.nexusai-quiz__option--selected {\n    border-color: var(--nexusai-primary);\n    background: var(--nexusai-primary-subtle);\n}\n.nexusai-quiz__option--correct {\n    border-color: #16a34a;\n    background: #dcfce7;\n    color: #14532d;\n}\n.nexusai-quiz__option--wrong {\n    border-color: #dc2626;\n    background: #fee2e2;\n    color: #7f1d1d;\n}\n.nexusai-quiz__option-letter {\n    display: inline-flex;\n    align-items: center;\n    justify-content: center;\n    width: 22px;\n    height: 22px;\n    background: var(--nexusai-bg-subtle);\n    color: var(--nexusai-fg-muted);\n    border-radius: 6px;\n    font-weight: 600;\n    font-size: 11.5px;\n    flex-shrink: 0;\n}\n.nexusai-quiz__option--selected .nexusai-quiz__option-letter,\n.nexusai-quiz__option--correct .nexusai-quiz__option-letter,\n.nexusai-quiz__option--wrong .nexusai-quiz__option-letter {\n    background: rgba(255, 255, 255, 0.6);\n}\n.nexusai-quiz__option-text {\n    flex: 1;\n    line-height: 1.4;\n}\n\n/* Feedback */\n.nexusai-quiz__feedback {\n    padding: 10px 12px;\n    border-radius: var(--nexusai-radius);\n    font-size: 12.5px;\n    line-height: 1.45;\n    animation: nexusai-source-panel-in .15s ease-out;\n}\n.nexusai-quiz__feedback--correct {\n    background: #f0fdf4;\n    border: 1px solid #bbf7d0;\n    color: #166534;\n}\n.nexusai-quiz__feedback--wrong {\n    background: #fef2f2;\n    border: 1px solid #fecaca;\n    color: #991b1b;\n}\n.nexusai-quiz__feedback--flashcard {\n    background: var(--nexusai-bg-muted);\n    border: 1px solid var(--nexusai-border);\n    color: var(--nexusai-fg);\n}\n.nexusai-quiz__feedback-title {\n    display: inline-flex;\n    align-items: center;\n    gap: 6px;\n    font-weight: 600;\n}\n.nexusai-quiz__explanation {\n    margin: 4px 0 0;\n    font-size: 12px;\n    color: inherit;\n    opacity: 0.9;\n    line-height: 1.5;\n}\n.nexusai-quiz__source {\n    display: inline-flex;\n    align-items: center;\n    gap: 4px;\n    margin: 6px 0 0;\n    font-size: 11px;\n    color: inherit;\n    opacity: 0.75;\n}\n\n.nexusai-quiz__actions {\n    display: flex;\n    justify-content: flex-end;\n    gap: 8px;\n}\n.nexusai-quiz__flashcard-actions {\n    display: flex;\n    justify-content: flex-end;\n    gap: 8px;\n}\n\n/* Pantalla final */\n.nexusai-quiz__final {\n    text-align: center;\n    padding: 12px 0 18px;\n    display: flex;\n    flex-direction: column;\n    align-items: center;\n    gap: 6px;\n}\n.nexusai-quiz__final-icon {\n    width: 56px;\n    height: 56px;\n    display: inline-flex;\n    align-items: center;\n    justify-content: center;\n    border-radius: var(--nexusai-radius-full);\n    margin-bottom: 6px;\n}\n.nexusai-quiz__final-icon--high {\n    background: #ecfdf5;\n    color: #047857;\n}\n.nexusai-quiz__final-icon--mid {\n    background: var(--nexusai-primary-light);\n    color: var(--nexusai-primary);\n}\n.nexusai-quiz__final-icon--low {\n    background: var(--nexusai-bg-subtle);\n    color: var(--nexusai-fg-muted);\n}\n.nexusai-quiz__final-title {\n    font-size: 16px;\n    font-weight: 600;\n    color: var(--nexusai-fg);\n    margin: 0;\n}\n.nexusai-quiz__final-score {\n    font-size: 13px;\n    color: var(--nexusai-fg-muted);\n    margin: 0 0 6px;\n}\n.nexusai-quiz__final-pct {\n    font-size: 38px;\n    font-weight: 700;\n    color: var(--nexusai-primary);\n    letter-spacing: -0.02em;\n}\n\n/* ═══════════════════════════════════════════════════════════\n   ReviewPanel — Review based on quiz errors (SP-10)\n   ═══════════════════════════════════════════════════════════ */\n\n.nexusai-review {\n    padding: 14px;\n    display: flex;\n    flex-direction: column;\n    gap: 12px;\n}\n\n/* Empty state */\n.nexusai-review--empty {\n    align-items: center;\n    justify-content: center;\n    text-align: center;\n    min-height: 220px;\n    gap: 10px;\n    color: var(--nexusai-fg-muted);\n}\n.nexusai-review__empty-icon {\n    width: 56px;\n    height: 56px;\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    background: var(--nexusai-bg-subtle);\n    border-radius: var(--nexusai-radius-full);\n    color: var(--nexusai-fg-subtle);\n}\n.nexusai-review__empty-title {\n    font-size: 15px;\n    font-weight: 600;\n    color: var(--nexusai-fg);\n    margin: 0;\n}\n.nexusai-review__empty-hint {\n    font-size: 12px;\n    color: var(--nexusai-fg-muted);\n    margin: 0;\n    max-width: 240px;\n    line-height: 1.5;\n}\n\n/* Header */\n.nexusai-review__header {\n    display: flex;\n    align-items: flex-start;\n    justify-content: space-between;\n    gap: 8px;\n}\n.nexusai-review__title {\n    font-size: 14px;\n    font-weight: 600;\n    color: var(--nexusai-fg);\n    margin: 0 0 2px;\n}\n.nexusai-review__subtitle {\n    font-size: 11.5px;\n    color: var(--nexusai-fg-muted);\n    margin: 0;\n}\n.nexusai-review__clear-btn {\n    flex-shrink: 0;\n    padding: 5px 10px;\n    font-size: 11.5px;\n    color: #dc2626;\n    background: #fef2f2;\n    border: 1px solid #fecaca;\n    border-radius: var(--nexusai-radius-sm);\n    cursor: pointer;\n    transition: background .12s;\n}\n.nexusai-review__clear-btn:hover { background: #fee2e2; }\n\n/* Card list */\n.nexusai-review__list {\n    display: flex;\n    flex-direction: column;\n    gap: 10px;\n}\n\n/* UX-19 (#389): \"load more\" with the backend's real offset/total — same\n   visual recipe as .nexusai-history__load-more above. */\n.nexusai-review__load-more {\n    display: block;\n    width: 100%;\n    margin-top: 4px;\n    padding: 8px 10px;\n    font-size: 12.5px;\n    font-weight: 600;\n    color: var(--nexusai-primary, #6366f1);\n    background: var(--nexusai-surface);\n    border: 1px solid var(--nexusai-border);\n    border-radius: 6px;\n    cursor: pointer;\n    transition: all .12s;\n}\n.nexusai-review__load-more:hover { border-color: var(--nexusai-border-hover); }\n.nexusai-review__load-more:disabled { color: var(--nexusai-fg-subtle); cursor: default; }\n\n/* Individual card */\n.nexusai-review__card {\n    background: var(--nexusai-bg);\n    border: 1.5px solid var(--nexusai-border);\n    border-radius: var(--nexusai-radius-md);\n    padding: 12px;\n    display: flex;\n    flex-direction: column;\n    gap: 8px;\n}\n\n/* Card top: badge + date */\n.nexusai-review__card-top {\n    display: flex;\n    align-items: center;\n    gap: 8px;\n}\n.nexusai-review__badge {\n    padding: 2px 8px;\n    border-radius: var(--nexusai-radius-full);\n    font-size: 10.5px;\n    font-weight: 600;\n    letter-spacing: 0.02em;\n}\n.nexusai-review__badge--multiple_choice {\n    background: var(--nexusai-primary-light);\n    color: var(--nexusai-primary);\n}\n.nexusai-review__badge--true_false {\n    background: #eff6ff;\n    color: #1d4ed8;\n}\n.nexusai-review__badge--open {\n    background: #f0fdf4;\n    color: #15803d;\n}\n.nexusai-review__date {\n    margin-left: auto;\n    font-size: 10.5px;\n    color: var(--nexusai-fg-subtle);\n}\n\n/* Question text */\n.nexusai-review__question {\n    font-size: 13.5px;\n    font-weight: 500;\n    color: var(--nexusai-fg);\n    line-height: 1.45;\n    margin: 0;\n}\n\n/* Options for MC / T/F */\n.nexusai-review__options {\n    display: flex;\n    flex-direction: column;\n    gap: 5px;\n}\n.nexusai-review__opt {\n    display: flex;\n    align-items: center;\n    gap: 8px;\n    padding: 7px 10px;\n    border-radius: 7px;\n    font-size: 12.5px;\n    background: var(--nexusai-bg-muted);\n    border: 1px solid transparent;\n    color: var(--nexusai-fg-muted);\n}\n.nexusai-review__opt--correct {\n    background: #f0fdf4;\n    border-color: #bbf7d0;\n    color: #166534;\n    font-weight: 500;\n}\n.nexusai-review__opt--wrong {\n    background: #fef2f2;\n    border-color: #fecaca;\n    color: #991b1b;\n    font-weight: 500;\n}\n.nexusai-review__opt-letter {\n    display: inline-flex;\n    align-items: center;\n    justify-content: center;\n    width: 20px;\n    height: 20px;\n    background: rgba(0,0,0,0.06);\n    border-radius: 5px;\n    font-weight: 700;\n    font-size: 10.5px;\n    flex-shrink: 0;\n}\n.nexusai-review__opt-text {\n    flex: 1;\n    line-height: 1.4;\n}\n\n/* Open answer */\n.nexusai-review__open-answer {\n    background: var(--nexusai-bg-muted);\n    border-radius: var(--nexusai-radius);\n    padding: 8px 10px;\n    font-size: 12.5px;\n}\n.nexusai-review__open-label {\n    font-weight: 600;\n    color: var(--nexusai-fg-muted);\n    font-size: 11px;\n    display: block;\n    margin-bottom: 3px;\n}\n.nexusai-review__open-text {\n    color: var(--nexusai-fg);\n    margin: 0;\n    line-height: 1.5;\n}\n\n/* Explanation toggle */\n.nexusai-review__toggle {\n    align-self: flex-start;\n    background: none;\n    border: none;\n    padding: 0;\n    font-size: 11.5px;\n    color: var(--nexusai-primary);\n    cursor: pointer;\n    font-weight: 500;\n    text-decoration: underline;\n    text-underline-offset: 2px;\n}\n.nexusai-review__toggle:hover { color: var(--nexusai-primary-hover); }\n\n/* Expanded explanation */\n.nexusai-review__explanation {\n    background: var(--nexusai-surface);\n    border: 1px solid var(--nexusai-primary-ring);\n    border-radius: var(--nexusai-radius);\n    padding: 8px 10px;\n    font-size: 12.5px;\n    line-height: 1.5;\n    animation: nexusai-source-panel-in .15s ease-out;\n}\n.nexusai-review__explanation-label {\n    font-weight: 600;\n    color: #4338ca;\n    font-size: 11px;\n    margin: 0 0 4px;\n}\n.nexusai-review__explanation-text {\n    color: var(--nexusai-fg);\n    margin: 0;\n}\n.nexusai-review__score {\n    margin: 6px 0 0;\n    font-size: 11px;\n    color: var(--nexusai-fg-muted);\n    font-style: italic;\n}\n\n/* Source file */\n.nexusai-review__source {\n    display: inline-flex;\n    align-items: center;\n    gap: 5px;\n    padding: 4px 8px;\n    background: var(--nexusai-bg-subtle);\n    border: 1px solid var(--nexusai-border);\n    border-radius: var(--nexusai-radius-sm);\n    font-size: 11.5px;\n    color: var(--nexusai-fg-muted);\n    cursor: default;\n    align-self: flex-start;\n    max-width: 100%;\n    overflow: hidden;\n    text-overflow: ellipsis;\n    white-space: nowrap;\n}\n.nexusai-review__source--link {\n    cursor: pointer;\n    color: var(--nexusai-primary);\n    border-color: #c7d2fe;\n    background: var(--nexusai-primary-light);\n}\n.nexusai-review__source--link:hover {\n    background: var(--nexusai-primary-ring);\n    border-color: #a5b4fc;\n}\n.nexusai-review__source:disabled {\n    opacity: 0.6;\n}\n\n/* Sugerencias de repaso (SP-10) */\n.nexusai-review__suggestions {\n    background: var(--nexusai-surface);\n    border: 1px solid var(--nexusai-primary-ring);\n    border-radius: var(--nexusai-radius-md);\n    padding: 12px;\n    display: flex;\n    flex-direction: column;\n    gap: 10px;\n}\n.nexusai-review__suggestions-header {\n    display: flex;\n    align-items: flex-start;\n    gap: 8px;\n    color: #4338ca;\n}\n.nexusai-review__suggestions-title {\n    font-size: 13.5px;\n    font-weight: 600;\n    color: var(--nexusai-fg);\n    margin: 0 0 2px;\n}\n.nexusai-review__suggestions-subtitle {\n    font-size: 11.5px;\n    color: var(--nexusai-fg-muted);\n    margin: 0;\n}\n.nexusai-review__suggestions-loading {\n    display: flex;\n    align-items: center;\n    gap: 8px;\n    font-size: 12px;\n    color: var(--nexusai-fg-muted);\n}\n.nexusai-review__suggestions-loading .nexusai-quiz__spinner {\n    width: 14px;\n    height: 14px;\n}\n.nexusai-review__suggestions-empty {\n    font-size: 12px;\n    color: var(--nexusai-fg-muted);\n    margin: 0;\n    line-height: 1.5;\n}\n.nexusai-review__suggestions-list {\n    display: flex;\n    flex-direction: column;\n    gap: 8px;\n}\n.nexusai-review__suggestion-card {\n    background: var(--nexusai-bg);\n    border: 1px solid var(--nexusai-primary-ring);\n    border-radius: var(--nexusai-radius);\n    padding: 10px;\n    display: flex;\n    flex-direction: column;\n    gap: 6px;\n}\n.nexusai-review__suggestion-top {\n    display: flex;\n    align-items: center;\n    justify-content: space-between;\n    gap: 8px;\n}\n.nexusai-review__suggestion-topic {\n    font-size: 12.5px;\n    font-weight: 600;\n    color: var(--nexusai-fg);\n}\n.nexusai-review__suggestion-count {\n    flex-shrink: 0;\n    padding: 2px 8px;\n    border-radius: var(--nexusai-radius-full);\n    font-size: 10.5px;\n    font-weight: 600;\n    background: #fef2f2;\n    color: #b91c1c;\n}\n.nexusai-review__suggestion-text {\n    font-size: 12px;\n    color: var(--nexusai-fg-muted);\n    line-height: 1.5;\n    margin: 0;\n}\n\n/* ── Plan de estudio personalizado ── */\n.nexusai-studyplan {\n    padding: 14px;\n    display: flex;\n    flex-direction: column;\n    gap: 12px;\n}\n.nexusai-studyplan--loading {\n    align-items: center;\n    justify-content: center;\n    min-height: 220px;\n}\n.nexusai-studyplan__banner {\n    display: flex;\n    align-items: center;\n    gap: 8px;\n    padding: 8px 12px;\n    background: var(--nexusai-primary-light);\n    border: 1px solid var(--nexusai-primary-ring);\n    border-radius: var(--nexusai-radius);\n    color: var(--nexusai-primary);\n    font-size: 12.5px;\n    font-weight: 500;\n}\n.nexusai-studyplan__empty {\n    align-items: center;\n    justify-content: center;\n    text-align: center;\n    display: flex;\n    flex-direction: column;\n    min-height: 200px;\n    gap: 10px;\n    color: var(--nexusai-fg-muted);\n}\n.nexusai-studyplan__empty-icon {\n    width: 56px;\n    height: 56px;\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    background: var(--nexusai-bg-subtle);\n    border-radius: var(--nexusai-radius-full);\n    color: var(--nexusai-fg-subtle);\n}\n.nexusai-studyplan__empty-title {\n    font-size: 15px;\n    font-weight: 600;\n    color: var(--nexusai-fg);\n    margin: 0;\n}\n.nexusai-studyplan__empty-hint {\n    font-size: 12px;\n    color: var(--nexusai-fg-muted);\n    margin: 0;\n    max-width: 240px;\n    line-height: 1.5;\n}\n.nexusai-studyplan__list {\n    display: flex;\n    flex-direction: column;\n    gap: 8px;\n}\n.nexusai-studyplan__card {\n    background: var(--nexusai-bg);\n    border: 1px solid var(--nexusai-primary-ring);\n    border-radius: var(--nexusai-radius);\n    padding: 10px;\n    display: flex;\n    flex-direction: column;\n    gap: 6px;\n}\n.nexusai-studyplan__card-top {\n    display: flex;\n    align-items: center;\n    gap: 6px;\n    color: var(--nexusai-primary);\n}\n.nexusai-studyplan__card-topic {\n    font-size: 12.5px;\n    font-weight: 600;\n    color: var(--nexusai-fg);\n}\n.nexusai-studyplan__card-reason {\n    font-size: 12px;\n    color: var(--nexusai-fg-muted);\n    line-height: 1.5;\n    margin: 0;\n}\n.nexusai-studyplan__card-meta {\n    display: flex;\n    gap: 8px;\n    font-size: 11px;\n    color: var(--nexusai-fg-subtle);\n}\n.nexusai-studyplan__card-btn {\n    align-self: flex-start;\n    margin-top: 2px;\n    padding: 5px 10px;\n    font-size: 12px;\n    font-weight: 500;\n    color: var(--nexusai-primary);\n    background: var(--nexusai-primary-light);\n    border: 1px solid var(--nexusai-primary-ring);\n    border-radius: 6px;\n    cursor: pointer;\n    transition: background .12s;\n}\n.nexusai-studyplan__card-btn:hover {\n    background: var(--nexusai-primary-ring);\n}\n.nexusai-studyplan__card-actions {\n    display: flex;\n    gap: 8px;\n    margin-top: 2px;\n}\n.nexusai-studyplan__card-btn--ghost {\n    color: var(--nexusai-fg-muted);\n    background: transparent;\n    border-color: var(--nexusai-border);\n}\n.nexusai-studyplan__card-btn--ghost:hover {\n    background: var(--nexusai-bg-muted);\n}\n.nexusai-studyplan__card-btn:disabled {\n    opacity: .6;\n    cursor: not-allowed;\n}\n\n/* ── Resumen de repaso pre-parcial (BUS-04) ── */\n.nexusai-studyplan__review {\n    background: var(--nexusai-bg-muted);\n    border: 1px solid var(--nexusai-border);\n    border-radius: var(--nexusai-radius);\n    padding: 12px;\n    display: flex;\n    flex-direction: column;\n    gap: 8px;\n}\n.nexusai-studyplan__review-title {\n    font-size: 13px;\n    font-weight: 600;\n    color: var(--nexusai-fg);\n    margin: 0;\n}\n.nexusai-studyplan__review-hint {\n    font-size: 12px;\n    color: var(--nexusai-fg-muted);\n    margin: 0;\n    line-height: 1.4;\n}\n.nexusai-studyplan__review-controls {\n    display: flex;\n    gap: 8px;\n    align-items: center;\n}\n.nexusai-studyplan__review-select {\n    flex: 1;\n    min-width: 0;\n    padding: 6px 8px;\n    font-size: 12px;\n    border: 1px solid var(--nexusai-border);\n    border-radius: 6px;\n    background: var(--nexusai-bg);\n    color: var(--nexusai-fg);\n}\n.nexusai-studyplan__review-btn {\n    padding: 6px 12px;\n    font-size: 12px;\n    font-weight: 500;\n    color: #fff;\n    background: var(--nexusai-primary);\n    border: none;\n    border-radius: 6px;\n    cursor: pointer;\n    white-space: nowrap;\n    transition: background .12s;\n}\n.nexusai-studyplan__review-btn:hover:not(:disabled) {\n    background: var(--nexusai-primary-hover);\n}\n.nexusai-studyplan__review-btn:disabled {\n    opacity: .6;\n    cursor: not-allowed;\n}\n.nexusai-studyplan__review-loading {\n    display: flex;\n    justify-content: center;\n    padding: 10px 0;\n}\n.nexusai-studyplan__review-result {\n    background: var(--nexusai-bg);\n    border: 1px solid var(--nexusai-border);\n    border-radius: 6px;\n    padding: 10px;\n    display: flex;\n    flex-direction: column;\n    gap: 6px;\n}\n.nexusai-studyplan__review-text {\n    font-size: 12.5px;\n    color: var(--nexusai-fg);\n    line-height: 1.55;\n    margin: 0;\n    white-space: pre-line;\n}\n.nexusai-studyplan__review-sources {\n    font-size: 11px;\n    color: var(--nexusai-fg-subtle);\n    margin: 0;\n}\n\n/* ── Caret de streaming ── */\n.nexusai-msg__markdown--streaming::after {\n    content: \"▍\";\n    display: inline-block;\n    margin-left: 2px;\n    color: var(--nexusai-primary);\n    animation: nexusai-blink 1s steps(1) infinite;\n}\n@keyframes nexusai-blink {\n    50% { opacity: 0; }\n}\n\n/* ── Quiz History (SP-09) ───────────────────────────── */\n.nexusai-quiz__history-list {\n    display: flex;\n    flex-direction: column;\n    gap: 8px;\n    max-height: 360px;\n    overflow-y: auto;\n    padding-right: 2px;\n    margin: 2px 0 4px;\n}\n\n.nexusai-quiz__history-card {\n    background: var(--nexusai-bg);\n    border: 1px solid var(--nexusai-border);\n    border-radius: var(--nexusai-radius-md);\n    padding: 10px 12px;\n    display: flex;\n    flex-direction: column;\n    gap: 7px;\n}\n\n.nexusai-quiz__history-header {\n    display: flex;\n    align-items: center;\n    justify-content: space-between;\n    gap: 8px;\n}\n\n.nexusai-quiz__history-badges {\n    display: flex;\n    gap: 5px;\n    align-items: center;\n    flex-wrap: wrap;\n}\n\n.nexusai-quiz__history-type {\n    font-size: 11px;\n    font-weight: 600;\n    color: var(--nexusai-primary);\n    background: var(--nexusai-primary-light);\n    border-radius: var(--nexusai-radius-full);\n    padding: 2px 8px;\n    white-space: nowrap;\n}\n\n.nexusai-quiz__history-diff {\n    font-size: 11px;\n    font-weight: 500;\n    border-radius: var(--nexusai-radius-full);\n    padding: 2px 8px;\n    white-space: nowrap;\n}\n.nexusai-quiz__history-diff--easy   { background: #dcfce7; color: #16a34a; }\n.nexusai-quiz__history-diff--medium { background: #fef3c7; color: #d97706; }\n.nexusai-quiz__history-diff--hard   { background: #fee2e2; color: #dc2626; }\n\n.nexusai-quiz__history-date {\n    font-size: 11px;\n    color: var(--nexusai-fg-subtle);\n    white-space: nowrap;\n    flex-shrink: 0;\n}\n\n.nexusai-quiz__history-topic {\n    font-size: 12px;\n    color: var(--nexusai-fg-muted);\n    margin: 0;\n    font-style: italic;\n    overflow: hidden;\n    text-overflow: ellipsis;\n    white-space: nowrap;\n}\n\n.nexusai-quiz__history-score-row {\n    display: flex;\n    align-items: center;\n    justify-content: space-between;\n}\n\n.nexusai-quiz__history-fraction {\n    display: flex;\n    align-items: baseline;\n    gap: 1px;\n    line-height: 1;\n}\n.nexusai-quiz__history-correct {\n    font-size: 17px;\n    font-weight: 700;\n    color: var(--nexusai-fg);\n}\n.nexusai-quiz__history-slash {\n    font-size: 13px;\n    color: var(--nexusai-fg-subtle);\n    margin: 0 2px;\n}\n.nexusai-quiz__history-total {\n    font-size: 13px;\n    font-weight: 500;\n    color: var(--nexusai-fg-muted);\n}\n\n.nexusai-quiz__history-pct {\n    font-size: 12px;\n    font-weight: 700;\n    border-radius: var(--nexusai-radius-sm);\n    padding: 2px 7px;\n}\n.nexusai-quiz__history-pct--good { background: #dcfce7; color: #16a34a; }\n.nexusai-quiz__history-pct--mid  { background: #fef3c7; color: #d97706; }\n.nexusai-quiz__history-pct--low  { background: #fee2e2; color: #dc2626; }\n\n.nexusai-quiz__history-bar {\n    height: 3px;\n    background: var(--nexusai-bg-subtle);\n    border-radius: 2px;\n    overflow: hidden;\n}\n.nexusai-quiz__history-bar-fill {\n    height: 100%;\n    border-radius: 2px;\n    transition: width .4s ease;\n}\n.nexusai-quiz__history-bar-fill--good { background: #22c55e; }\n.nexusai-quiz__history-bar-fill--mid  { background: #f59e0b; }\n.nexusai-quiz__history-bar-fill--low  { background: #ef4444; }\n\n/* Teacher exam generator (EVAL-02, issue #235) — moved to\n   documents.css in RDS-07 (#406): these classes are only used by\n   ExamGeneratorPanel.jsx, a component exclusive to the teacher panel,\n   never shared with the student chat. */\n\n/* ============================================================\n   Teacher onboarding (ONB-03 / ONB-04, issues #426 / #427)\n   Course setup checklist. Reuses the --nexusai-* tokens.\n   ============================================================ */\n.nexusai-panel__body--onb {\n    display: block;\n    padding: 16px;\n    overflow-y: auto;\n}\n\n.nexusai-onb__intro {\n    margin: 0 0 14px;\n    font-size: 13px;\n    line-height: 1.5;\n    color: var(--nexusai-fg-muted);\n}\n\n.nexusai-onb__alldone {\n    margin-bottom: 14px;\n    padding: 10px 12px;\n    border-radius: var(--nexusai-radius);\n    background: rgba(34, 197, 94, 0.12);\n    color: #15803d;\n    font-size: 13px;\n    font-weight: 600;\n}\n\n.nexusai-onb__list {\n    list-style: none;\n    margin: 0;\n    padding: 0;\n    display: flex;\n    flex-direction: column;\n    gap: 8px;\n}\n\n.nexusai-onb__step {\n    display: flex;\n    gap: 12px;\n    padding: 12px;\n    border: 1px solid var(--nexusai-border);\n    border-radius: var(--nexusai-radius-md);\n    background: var(--nexusai-bg);\n}\n\n.nexusai-onb__step--done {\n    background: var(--nexusai-bg-muted);\n    border-color: var(--nexusai-border);\n}\n\n.nexusai-onb__step--pending {\n    border-color: var(--nexusai-border-strong);\n}\n\n.nexusai-onb__step--skipped {\n    background: var(--nexusai-bg-muted);\n    opacity: 0.75;\n}\n\n.nexusai-onb__step-marker {\n    flex: 0 0 24px;\n    height: 24px;\n    border-radius: var(--nexusai-radius-full);\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    font-size: 12px;\n    font-weight: 700;\n    background: var(--nexusai-primary-light);\n    color: var(--nexusai-primary-hover);\n}\n\n.nexusai-onb__step--done .nexusai-onb__step-marker {\n    background: rgba(34, 197, 94, 0.15);\n    color: #15803d;\n}\n\n.nexusai-onb__step-body {\n    flex: 1 1 auto;\n    min-width: 0;\n}\n\n.nexusai-onb__step-head {\n    display: flex;\n    align-items: center;\n    flex-wrap: wrap;\n    gap: 6px;\n}\n\n.nexusai-onb__step-title {\n    font-size: 13px;\n    font-weight: 600;\n    color: var(--nexusai-fg);\n}\n\n.nexusai-onb__badge {\n    font-size: 10px;\n    text-transform: uppercase;\n    letter-spacing: 0.03em;\n    padding: 1px 6px;\n    border-radius: var(--nexusai-radius-sm);\n    background: var(--nexusai-bg-subtle);\n    color: var(--nexusai-fg-subtle);\n}\n\n.nexusai-onb__status {\n    margin-left: auto;\n    font-size: 11px;\n    font-weight: 600;\n    padding: 1px 8px;\n    border-radius: var(--nexusai-radius-full);\n}\n.nexusai-onb__status--done    { background: rgba(34, 197, 94, 0.15); color: #15803d; }\n.nexusai-onb__status--pending { background: rgba(245, 158, 11, 0.15); color: #b45309; }\n.nexusai-onb__status--skipped { background: var(--nexusai-bg-subtle); color: var(--nexusai-fg-subtle); }\n\n.nexusai-onb__step-why {\n    margin: 4px 0 0;\n    font-size: 12px;\n    line-height: 1.5;\n    color: var(--nexusai-fg-muted);\n}\n\n.nexusai-onb__step-link {\n    display: inline-block;\n    margin-top: 8px;\n    font-size: 12px;\n    font-weight: 600;\n    color: var(--nexusai-primary);\n    text-decoration: none;\n}\n.nexusai-onb__step-link:hover { text-decoration: underline; }\n\n.nexusai-onb__step-skip {\n    display: inline-block;\n    margin-top: 8px;\n    margin-left: 12px;\n    padding: 0;\n    border: none;\n    background: transparent;\n    font-size: 12px;\n    font-weight: 500;\n    color: var(--nexusai-fg-subtle);\n    cursor: pointer;\n    text-decoration: underline;\n}\n.nexusai-onb__step-skip:hover { color: var(--nexusai-fg-muted); }\n\n.nexusai-onb__close-btn {\n    display: block;\n    width: 100%;\n    margin-top: 14px;\n    padding: 8px 12px;\n    border: 1px solid var(--nexusai-border);\n    border-radius: var(--nexusai-radius-md);\n    background: var(--nexusai-bg);\n    color: var(--nexusai-fg-muted);\n    font-size: 13px;\n    font-weight: 600;\n    font-family: inherit;\n    cursor: pointer;\n}\n.nexusai-onb__close-btn:hover {\n    background: var(--nexusai-bg-muted);\n    color: var(--nexusai-fg);\n}\n\n.nexusai-onb__help-link {\n    display: block;\n    margin-top: 16px;\n    padding-top: 12px;\n    border-top: 1px solid var(--nexusai-border);\n    font-size: 12px;\n    font-weight: 600;\n    color: var(--nexusai-primary);\n    text-decoration: none;\n    text-align: center;\n}\n.nexusai-onb__help-link:hover { text-decoration: underline; }\n\n/* ============================================================\n   Accessibility — visible keyboard focus (UX-10, #368)\n\n   A single consistent focus state for every interactive control\n   of the widget, reusing the --nexusai-primary /\n   --nexusai-primary-ring tokens already defined\n   (instead of loose outlines per component). :focus-visible\n   is used so it does not get in the way of mouse clicks.\n============================================================ */\n.nexusai-widget a:focus-visible,\n.nexusai-widget button:focus-visible,\n.nexusai-widget input:focus-visible,\n.nexusai-widget select:focus-visible,\n.nexusai-widget textarea:focus-visible,\n.nexusai-widget [tabindex]:focus-visible,\n.nexusai-widget summary:focus-visible {\n    outline: 2px solid var(--nexusai-primary);\n    outline-offset: 2px;\n    box-shadow: 0 0 0 4px var(--nexusai-primary-ring);\n}\n\n/* ── Weekly forum digest (FOR-06, #367) + urgency badge (FOR-05, #366) ── */\n.nexusai-forumdigest { padding: 12px; }\n.nexusai-forumdigest__intro {\n    font-size: 12.5px;\n    color: var(--nexusai-fg-muted, #64748b);\n    line-height: 1.5;\n    margin: 0 0 14px;\n}\n.nexusai-forumdigest__empty {\n    font-size: 13px;\n    color: #94a3b8;\n    text-align: center;\n    padding: 24px 16px;\n}\n/* FOR-07 (#378): external webhook setting */\n.nexusai-forumdigest__webhook {\n    margin-bottom: 16px;\n    padding: 10px 12px;\n    background: var(--nexusai-bg-subtle, #f1f5f9);\n    border: 1px solid var(--nexusai-border, #e2e8f0);\n    border-radius: 8px;\n}\n.nexusai-forumdigest__webhook-label {\n    display: block;\n    font-size: 12px;\n    font-weight: 600;\n    color: var(--nexusai-fg-muted, #64748b);\n    margin-bottom: 6px;\n}\n.nexusai-forumdigest__webhook-row {\n    display: flex;\n    gap: 8px;\n}\n.nexusai-forumdigest__webhook-input {\n    flex: 1;\n    padding: 8px 12px;\n    border: 1px solid var(--nexusai-border);\n    border-radius: 8px;\n    font-size: 12.5px;\n    outline: none;\n}\n.nexusai-forumdigest__webhook-input:focus { border-color: var(--nexusai-primary); }\n.nexusai-forumdigest__webhook-confirm {\n    display: block;\n    margin-top: 6px;\n    font-size: 11.5px;\n    color: #166534;\n}\n.nexusai-forumdigest__webhook-error {\n    display: block;\n    margin-top: 6px;\n    font-size: 11.5px;\n    color: #b91c1c;\n}\n.nexusai-forumdigest__summary {\n    background: var(--nexusai-primary-light, rgba(99,102,241,0.07));\n    border: 1px solid var(--nexusai-primary-ring, rgba(99,102,241,0.2));\n    border-radius: 8px;\n    padding: 10px 12px;\n    margin-bottom: 14px;\n}\n.nexusai-forumdigest__summary p {\n    margin: 0;\n    font-size: 12.5px;\n    line-height: 1.55;\n    color: var(--nexusai-fg, #1e293b);\n}\n.nexusai-forumdigest__list {\n    display: flex;\n    flex-direction: column;\n    gap: 8px;\n}\n.nexusai-forumdigest__item {\n    display: flex;\n    align-items: center;\n    gap: 10px;\n    padding: 10px 12px;\n    background: #f7f8fc;\n    border: 1px solid #e8edf5;\n    border-radius: 8px;\n}\n.nexusai-forumdigest__item--urgent {\n    background: rgba(220, 38, 38, 0.05);\n    border-color: rgba(220, 38, 38, 0.25);\n}\n.nexusai-forumdigest__item-icon {\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    flex-shrink: 0;\n    width: 28px;\n    height: 28px;\n    border-radius: 50%;\n    background: var(--nexusai-primary-light, rgba(99,102,241,0.1));\n    color: var(--nexusai-primary, #6366f1);\n}\n.nexusai-forumdigest__item-body {\n    flex: 1;\n    min-width: 0;\n    display: flex;\n    flex-direction: column;\n    gap: 2px;\n}\n.nexusai-forumdigest__item-row {\n    display: flex;\n    align-items: center;\n    gap: 8px;\n    flex-wrap: wrap;\n}\n.nexusai-forumdigest__item-name {\n    font-size: 13px;\n    font-weight: 600;\n    color: var(--nexusai-fg, #1e293b);\n}\n.nexusai-forumdigest__item-meta {\n    font-size: 11.5px;\n    color: var(--nexusai-fg-muted, #64748b);\n}\n.nexusai-forumdigest__urgent-badge {\n    display: inline-flex;\n    align-items: center;\n    gap: 3px;\n    padding: 2px 7px;\n    font-size: 10.5px;\n    font-weight: 600;\n    color: #b91c1c;\n    background: rgba(220, 38, 38, 0.1);\n    border-radius: var(--nexusai-radius-full, 9999px);\n}\n.nexusai-forumdigest__item-link {\n    flex-shrink: 0;\n    font-size: 12px;\n    font-weight: 500;\n    color: var(--nexusai-primary, #6366f1);\n    text-decoration: none;\n}\n.nexusai-forumdigest__item-link:hover { text-decoration: underline; }\n\n/* Controls on an indigo background (primary / launcher / FAB):\n   the indigo outline has no contrast against its own background, so\n   a light inner halo + dark outline is used. */\n.nexusai-widget .nexusai-rail:focus-visible,\n.nexusai-widget .nexusai-quiz__primary:focus-visible,\n.nexusai-widget .nexusai-input__send:focus-visible {\n    outline: 2px solid var(--nexusai-primary-hover);\n    outline-offset: 2px;\n    box-shadow: inset 0 0 0 2px #fff, 0 0 0 4px var(--nexusai-primary-ring);\n}\n\n/* High contrast: respects the OS forced mode. */\n@media (forced-colors: active) {\n    .nexusai-widget a:focus-visible,\n    .nexusai-widget button:focus-visible,\n    .nexusai-widget input:focus-visible,\n    .nexusai-widget select:focus-visible,\n    .nexusai-widget textarea:focus-visible,\n    .nexusai-widget [tabindex]:focus-visible {\n        outline: 2px solid CanvasText;\n        box-shadow: none;\n    }\n}\n\n/* DATA-05 (#525): the student's token limit bar */\n.nexusai-budget {\n    display: flex;\n    flex-direction: column;\n    gap: 4px;\n    padding: 6px 14px 0;\n    font-size: 11px;\n    color: var(--nexusai-fg-subtle);\n}\n.nexusai-budget__track {\n    height: 4px;\n    border-radius: 9999px;\n    background: var(--nexusai-border);\n    overflow: hidden;\n}\n.nexusai-budget__fill {\n    height: 100%;\n    background: var(--nexusai-primary, #2563eb);\n    transition: width 0.3s ease;\n}\n.nexusai-budget--warn .nexusai-budget__fill {\n    background: #d97706;\n}\n.nexusai-budget--warn .nexusai-budget__text {\n    color: #b45309;\n}\n.nexusai-budget--out .nexusai-budget__fill {\n    background: #dc2626;\n}\n.nexusai-budget--out .nexusai-budget__text {\n    color: #b91c1c;\n}\n@media (prefers-reduced-motion: reduce) {\n    .nexusai-budget__fill {\n        transition: none;\n    }\n}\n", ""]);
// Exports
/* harmony default export */ __webpack_exports__.A = (___CSS_LOADER_EXPORT___);


/***/ }),

/***/ 314:
/***/ (function(module) {



/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/
module.exports = function (cssWithMappingToString) {
  var list = [];

  // return the list of modules as css string
  list.toString = function toString() {
    return this.map(function (item) {
      var content = "";
      var needLayer = typeof item[5] !== "undefined";
      if (item[4]) {
        content += "@supports (".concat(item[4], ") {");
      }
      if (item[2]) {
        content += "@media ".concat(item[2], " {");
      }
      if (needLayer) {
        content += "@layer".concat(item[5].length > 0 ? " ".concat(item[5]) : "", " {");
      }
      content += cssWithMappingToString(item);
      if (needLayer) {
        content += "}";
      }
      if (item[2]) {
        content += "}";
      }
      if (item[4]) {
        content += "}";
      }
      return content;
    }).join("");
  };

  // import a list of modules into the list
  list.i = function i(modules, media, dedupe, supports, layer) {
    if (typeof modules === "string") {
      modules = [[null, modules, undefined]];
    }
    var alreadyImportedModules = {};
    if (dedupe) {
      for (var k = 0; k < this.length; k++) {
        var id = this[k][0];
        if (id != null) {
          alreadyImportedModules[id] = true;
        }
      }
    }
    for (var _k = 0; _k < modules.length; _k++) {
      var item = [].concat(modules[_k]);
      if (dedupe && alreadyImportedModules[item[0]]) {
        continue;
      }
      if (typeof layer !== "undefined") {
        if (typeof item[5] === "undefined") {
          item[5] = layer;
        } else {
          item[1] = "@layer".concat(item[5].length > 0 ? " ".concat(item[5]) : "", " {").concat(item[1], "}");
          item[5] = layer;
        }
      }
      if (media) {
        if (!item[2]) {
          item[2] = media;
        } else {
          item[1] = "@media ".concat(item[2], " {").concat(item[1], "}");
          item[2] = media;
        }
      }
      if (supports) {
        if (!item[4]) {
          item[4] = "".concat(supports);
        } else {
          item[1] = "@supports (".concat(item[4], ") {").concat(item[1], "}");
          item[4] = supports;
        }
      }
      list.push(item);
    }
  };
  return list;
};

/***/ }),

/***/ 601:
/***/ (function(module) {



module.exports = function (i) {
  return i[1];
};

/***/ }),

/***/ 551:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

/**
 * @license React
 * react-dom.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
/*
 Modernizr 3.0.0pre (Custom Build) | MIT
*/
var aa=__webpack_require__(540),ca=__webpack_require__(982);function p(a){for(var b="https://reactjs.org/docs/error-decoder.html?invariant="+a,c=1;c<arguments.length;c++)b+="&args[]="+encodeURIComponent(arguments[c]);return"Minified React error #"+a+"; visit "+b+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}var da=new Set,ea={};function fa(a,b){ha(a,b);ha(a+"Capture",b)}
function ha(a,b){ea[a]=b;for(a=0;a<b.length;a++)da.add(b[a])}
var ia=!("undefined"===typeof window||"undefined"===typeof window.document||"undefined"===typeof window.document.createElement),ja=Object.prototype.hasOwnProperty,ka=/^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/,la=
{},ma={};function oa(a){if(ja.call(ma,a))return!0;if(ja.call(la,a))return!1;if(ka.test(a))return ma[a]=!0;la[a]=!0;return!1}function pa(a,b,c,d){if(null!==c&&0===c.type)return!1;switch(typeof b){case "function":case "symbol":return!0;case "boolean":if(d)return!1;if(null!==c)return!c.acceptsBooleans;a=a.toLowerCase().slice(0,5);return"data-"!==a&&"aria-"!==a;default:return!1}}
function qa(a,b,c,d){if(null===b||"undefined"===typeof b||pa(a,b,c,d))return!0;if(d)return!1;if(null!==c)switch(c.type){case 3:return!b;case 4:return!1===b;case 5:return isNaN(b);case 6:return isNaN(b)||1>b}return!1}function v(a,b,c,d,e,f,g){this.acceptsBooleans=2===b||3===b||4===b;this.attributeName=d;this.attributeNamespace=e;this.mustUseProperty=c;this.propertyName=a;this.type=b;this.sanitizeURL=f;this.removeEmptyString=g}var z={};
"children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style".split(" ").forEach(function(a){z[a]=new v(a,0,!1,a,null,!1,!1)});[["acceptCharset","accept-charset"],["className","class"],["htmlFor","for"],["httpEquiv","http-equiv"]].forEach(function(a){var b=a[0];z[b]=new v(b,1,!1,a[1],null,!1,!1)});["contentEditable","draggable","spellCheck","value"].forEach(function(a){z[a]=new v(a,2,!1,a.toLowerCase(),null,!1,!1)});
["autoReverse","externalResourcesRequired","focusable","preserveAlpha"].forEach(function(a){z[a]=new v(a,2,!1,a,null,!1,!1)});"allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope".split(" ").forEach(function(a){z[a]=new v(a,3,!1,a.toLowerCase(),null,!1,!1)});
["checked","multiple","muted","selected"].forEach(function(a){z[a]=new v(a,3,!0,a,null,!1,!1)});["capture","download"].forEach(function(a){z[a]=new v(a,4,!1,a,null,!1,!1)});["cols","rows","size","span"].forEach(function(a){z[a]=new v(a,6,!1,a,null,!1,!1)});["rowSpan","start"].forEach(function(a){z[a]=new v(a,5,!1,a.toLowerCase(),null,!1,!1)});var ra=/[\-:]([a-z])/g;function sa(a){return a[1].toUpperCase()}
"accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height".split(" ").forEach(function(a){var b=a.replace(ra,
sa);z[b]=new v(b,1,!1,a,null,!1,!1)});"xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach(function(a){var b=a.replace(ra,sa);z[b]=new v(b,1,!1,a,"http://www.w3.org/1999/xlink",!1,!1)});["xml:base","xml:lang","xml:space"].forEach(function(a){var b=a.replace(ra,sa);z[b]=new v(b,1,!1,a,"http://www.w3.org/XML/1998/namespace",!1,!1)});["tabIndex","crossOrigin"].forEach(function(a){z[a]=new v(a,1,!1,a.toLowerCase(),null,!1,!1)});
z.xlinkHref=new v("xlinkHref",1,!1,"xlink:href","http://www.w3.org/1999/xlink",!0,!1);["src","href","action","formAction"].forEach(function(a){z[a]=new v(a,1,!1,a.toLowerCase(),null,!0,!0)});
function ta(a,b,c,d){var e=z.hasOwnProperty(b)?z[b]:null;if(null!==e?0!==e.type:d||!(2<b.length)||"o"!==b[0]&&"O"!==b[0]||"n"!==b[1]&&"N"!==b[1])qa(b,c,e,d)&&(c=null),d||null===e?oa(b)&&(null===c?a.removeAttribute(b):a.setAttribute(b,""+c)):e.mustUseProperty?a[e.propertyName]=null===c?3===e.type?!1:"":c:(b=e.attributeName,d=e.attributeNamespace,null===c?a.removeAttribute(b):(e=e.type,c=3===e||4===e&&!0===c?"":""+c,d?a.setAttributeNS(d,b,c):a.setAttribute(b,c)))}
var ua=aa.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,va=Symbol.for("react.element"),wa=Symbol.for("react.portal"),ya=Symbol.for("react.fragment"),za=Symbol.for("react.strict_mode"),Aa=Symbol.for("react.profiler"),Ba=Symbol.for("react.provider"),Ca=Symbol.for("react.context"),Da=Symbol.for("react.forward_ref"),Ea=Symbol.for("react.suspense"),Fa=Symbol.for("react.suspense_list"),Ga=Symbol.for("react.memo"),Ha=Symbol.for("react.lazy");Symbol.for("react.scope");Symbol.for("react.debug_trace_mode");
var Ia=Symbol.for("react.offscreen");Symbol.for("react.legacy_hidden");Symbol.for("react.cache");Symbol.for("react.tracing_marker");var Ja=Symbol.iterator;function Ka(a){if(null===a||"object"!==typeof a)return null;a=Ja&&a[Ja]||a["@@iterator"];return"function"===typeof a?a:null}var A=Object.assign,La;function Ma(a){if(void 0===La)try{throw Error();}catch(c){var b=c.stack.trim().match(/\n( *(at )?)/);La=b&&b[1]||""}return"\n"+La+a}var Na=!1;
function Oa(a,b){if(!a||Na)return"";Na=!0;var c=Error.prepareStackTrace;Error.prepareStackTrace=void 0;try{if(b)if(b=function(){throw Error();},Object.defineProperty(b.prototype,"props",{set:function(){throw Error();}}),"object"===typeof Reflect&&Reflect.construct){try{Reflect.construct(b,[])}catch(l){var d=l}Reflect.construct(a,[],b)}else{try{b.call()}catch(l){d=l}a.call(b.prototype)}else{try{throw Error();}catch(l){d=l}a()}}catch(l){if(l&&d&&"string"===typeof l.stack){for(var e=l.stack.split("\n"),
f=d.stack.split("\n"),g=e.length-1,h=f.length-1;1<=g&&0<=h&&e[g]!==f[h];)h--;for(;1<=g&&0<=h;g--,h--)if(e[g]!==f[h]){if(1!==g||1!==h){do if(g--,h--,0>h||e[g]!==f[h]){var k="\n"+e[g].replace(" at new "," at ");a.displayName&&k.includes("<anonymous>")&&(k=k.replace("<anonymous>",a.displayName));return k}while(1<=g&&0<=h)}break}}}finally{Na=!1,Error.prepareStackTrace=c}return(a=a?a.displayName||a.name:"")?Ma(a):""}
function Pa(a){switch(a.tag){case 5:return Ma(a.type);case 16:return Ma("Lazy");case 13:return Ma("Suspense");case 19:return Ma("SuspenseList");case 0:case 2:case 15:return a=Oa(a.type,!1),a;case 11:return a=Oa(a.type.render,!1),a;case 1:return a=Oa(a.type,!0),a;default:return""}}
function Qa(a){if(null==a)return null;if("function"===typeof a)return a.displayName||a.name||null;if("string"===typeof a)return a;switch(a){case ya:return"Fragment";case wa:return"Portal";case Aa:return"Profiler";case za:return"StrictMode";case Ea:return"Suspense";case Fa:return"SuspenseList"}if("object"===typeof a)switch(a.$$typeof){case Ca:return(a.displayName||"Context")+".Consumer";case Ba:return(a._context.displayName||"Context")+".Provider";case Da:var b=a.render;a=a.displayName;a||(a=b.displayName||
b.name||"",a=""!==a?"ForwardRef("+a+")":"ForwardRef");return a;case Ga:return b=a.displayName||null,null!==b?b:Qa(a.type)||"Memo";case Ha:b=a._payload;a=a._init;try{return Qa(a(b))}catch(c){}}return null}
function Ra(a){var b=a.type;switch(a.tag){case 24:return"Cache";case 9:return(b.displayName||"Context")+".Consumer";case 10:return(b._context.displayName||"Context")+".Provider";case 18:return"DehydratedFragment";case 11:return a=b.render,a=a.displayName||a.name||"",b.displayName||(""!==a?"ForwardRef("+a+")":"ForwardRef");case 7:return"Fragment";case 5:return b;case 4:return"Portal";case 3:return"Root";case 6:return"Text";case 16:return Qa(b);case 8:return b===za?"StrictMode":"Mode";case 22:return"Offscreen";
case 12:return"Profiler";case 21:return"Scope";case 13:return"Suspense";case 19:return"SuspenseList";case 25:return"TracingMarker";case 1:case 0:case 17:case 2:case 14:case 15:if("function"===typeof b)return b.displayName||b.name||null;if("string"===typeof b)return b}return null}function Sa(a){switch(typeof a){case "boolean":case "number":case "string":case "undefined":return a;case "object":return a;default:return""}}
function Ta(a){var b=a.type;return(a=a.nodeName)&&"input"===a.toLowerCase()&&("checkbox"===b||"radio"===b)}
function Ua(a){var b=Ta(a)?"checked":"value",c=Object.getOwnPropertyDescriptor(a.constructor.prototype,b),d=""+a[b];if(!a.hasOwnProperty(b)&&"undefined"!==typeof c&&"function"===typeof c.get&&"function"===typeof c.set){var e=c.get,f=c.set;Object.defineProperty(a,b,{configurable:!0,get:function(){return e.call(this)},set:function(a){d=""+a;f.call(this,a)}});Object.defineProperty(a,b,{enumerable:c.enumerable});return{getValue:function(){return d},setValue:function(a){d=""+a},stopTracking:function(){a._valueTracker=
null;delete a[b]}}}}function Va(a){a._valueTracker||(a._valueTracker=Ua(a))}function Wa(a){if(!a)return!1;var b=a._valueTracker;if(!b)return!0;var c=b.getValue();var d="";a&&(d=Ta(a)?a.checked?"true":"false":a.value);a=d;return a!==c?(b.setValue(a),!0):!1}function Xa(a){a=a||("undefined"!==typeof document?document:void 0);if("undefined"===typeof a)return null;try{return a.activeElement||a.body}catch(b){return a.body}}
function Ya(a,b){var c=b.checked;return A({},b,{defaultChecked:void 0,defaultValue:void 0,value:void 0,checked:null!=c?c:a._wrapperState.initialChecked})}function Za(a,b){var c=null==b.defaultValue?"":b.defaultValue,d=null!=b.checked?b.checked:b.defaultChecked;c=Sa(null!=b.value?b.value:c);a._wrapperState={initialChecked:d,initialValue:c,controlled:"checkbox"===b.type||"radio"===b.type?null!=b.checked:null!=b.value}}function ab(a,b){b=b.checked;null!=b&&ta(a,"checked",b,!1)}
function bb(a,b){ab(a,b);var c=Sa(b.value),d=b.type;if(null!=c)if("number"===d){if(0===c&&""===a.value||a.value!=c)a.value=""+c}else a.value!==""+c&&(a.value=""+c);else if("submit"===d||"reset"===d){a.removeAttribute("value");return}b.hasOwnProperty("value")?cb(a,b.type,c):b.hasOwnProperty("defaultValue")&&cb(a,b.type,Sa(b.defaultValue));null==b.checked&&null!=b.defaultChecked&&(a.defaultChecked=!!b.defaultChecked)}
function db(a,b,c){if(b.hasOwnProperty("value")||b.hasOwnProperty("defaultValue")){var d=b.type;if(!("submit"!==d&&"reset"!==d||void 0!==b.value&&null!==b.value))return;b=""+a._wrapperState.initialValue;c||b===a.value||(a.value=b);a.defaultValue=b}c=a.name;""!==c&&(a.name="");a.defaultChecked=!!a._wrapperState.initialChecked;""!==c&&(a.name=c)}
function cb(a,b,c){if("number"!==b||Xa(a.ownerDocument)!==a)null==c?a.defaultValue=""+a._wrapperState.initialValue:a.defaultValue!==""+c&&(a.defaultValue=""+c)}var eb=Array.isArray;
function fb(a,b,c,d){a=a.options;if(b){b={};for(var e=0;e<c.length;e++)b["$"+c[e]]=!0;for(c=0;c<a.length;c++)e=b.hasOwnProperty("$"+a[c].value),a[c].selected!==e&&(a[c].selected=e),e&&d&&(a[c].defaultSelected=!0)}else{c=""+Sa(c);b=null;for(e=0;e<a.length;e++){if(a[e].value===c){a[e].selected=!0;d&&(a[e].defaultSelected=!0);return}null!==b||a[e].disabled||(b=a[e])}null!==b&&(b.selected=!0)}}
function gb(a,b){if(null!=b.dangerouslySetInnerHTML)throw Error(p(91));return A({},b,{value:void 0,defaultValue:void 0,children:""+a._wrapperState.initialValue})}function hb(a,b){var c=b.value;if(null==c){c=b.children;b=b.defaultValue;if(null!=c){if(null!=b)throw Error(p(92));if(eb(c)){if(1<c.length)throw Error(p(93));c=c[0]}b=c}null==b&&(b="");c=b}a._wrapperState={initialValue:Sa(c)}}
function ib(a,b){var c=Sa(b.value),d=Sa(b.defaultValue);null!=c&&(c=""+c,c!==a.value&&(a.value=c),null==b.defaultValue&&a.defaultValue!==c&&(a.defaultValue=c));null!=d&&(a.defaultValue=""+d)}function jb(a){var b=a.textContent;b===a._wrapperState.initialValue&&""!==b&&null!==b&&(a.value=b)}function kb(a){switch(a){case "svg":return"http://www.w3.org/2000/svg";case "math":return"http://www.w3.org/1998/Math/MathML";default:return"http://www.w3.org/1999/xhtml"}}
function lb(a,b){return null==a||"http://www.w3.org/1999/xhtml"===a?kb(b):"http://www.w3.org/2000/svg"===a&&"foreignObject"===b?"http://www.w3.org/1999/xhtml":a}
var mb,nb=function(a){return"undefined"!==typeof MSApp&&MSApp.execUnsafeLocalFunction?function(b,c,d,e){MSApp.execUnsafeLocalFunction(function(){return a(b,c,d,e)})}:a}(function(a,b){if("http://www.w3.org/2000/svg"!==a.namespaceURI||"innerHTML"in a)a.innerHTML=b;else{mb=mb||document.createElement("div");mb.innerHTML="<svg>"+b.valueOf().toString()+"</svg>";for(b=mb.firstChild;a.firstChild;)a.removeChild(a.firstChild);for(;b.firstChild;)a.appendChild(b.firstChild)}});
function ob(a,b){if(b){var c=a.firstChild;if(c&&c===a.lastChild&&3===c.nodeType){c.nodeValue=b;return}}a.textContent=b}
var pb={animationIterationCount:!0,aspectRatio:!0,borderImageOutset:!0,borderImageSlice:!0,borderImageWidth:!0,boxFlex:!0,boxFlexGroup:!0,boxOrdinalGroup:!0,columnCount:!0,columns:!0,flex:!0,flexGrow:!0,flexPositive:!0,flexShrink:!0,flexNegative:!0,flexOrder:!0,gridArea:!0,gridRow:!0,gridRowEnd:!0,gridRowSpan:!0,gridRowStart:!0,gridColumn:!0,gridColumnEnd:!0,gridColumnSpan:!0,gridColumnStart:!0,fontWeight:!0,lineClamp:!0,lineHeight:!0,opacity:!0,order:!0,orphans:!0,tabSize:!0,widows:!0,zIndex:!0,
zoom:!0,fillOpacity:!0,floodOpacity:!0,stopOpacity:!0,strokeDasharray:!0,strokeDashoffset:!0,strokeMiterlimit:!0,strokeOpacity:!0,strokeWidth:!0},qb=["Webkit","ms","Moz","O"];Object.keys(pb).forEach(function(a){qb.forEach(function(b){b=b+a.charAt(0).toUpperCase()+a.substring(1);pb[b]=pb[a]})});function rb(a,b,c){return null==b||"boolean"===typeof b||""===b?"":c||"number"!==typeof b||0===b||pb.hasOwnProperty(a)&&pb[a]?(""+b).trim():b+"px"}
function sb(a,b){a=a.style;for(var c in b)if(b.hasOwnProperty(c)){var d=0===c.indexOf("--"),e=rb(c,b[c],d);"float"===c&&(c="cssFloat");d?a.setProperty(c,e):a[c]=e}}var tb=A({menuitem:!0},{area:!0,base:!0,br:!0,col:!0,embed:!0,hr:!0,img:!0,input:!0,keygen:!0,link:!0,meta:!0,param:!0,source:!0,track:!0,wbr:!0});
function ub(a,b){if(b){if(tb[a]&&(null!=b.children||null!=b.dangerouslySetInnerHTML))throw Error(p(137,a));if(null!=b.dangerouslySetInnerHTML){if(null!=b.children)throw Error(p(60));if("object"!==typeof b.dangerouslySetInnerHTML||!("__html"in b.dangerouslySetInnerHTML))throw Error(p(61));}if(null!=b.style&&"object"!==typeof b.style)throw Error(p(62));}}
function vb(a,b){if(-1===a.indexOf("-"))return"string"===typeof b.is;switch(a){case "annotation-xml":case "color-profile":case "font-face":case "font-face-src":case "font-face-uri":case "font-face-format":case "font-face-name":case "missing-glyph":return!1;default:return!0}}var wb=null;function xb(a){a=a.target||a.srcElement||window;a.correspondingUseElement&&(a=a.correspondingUseElement);return 3===a.nodeType?a.parentNode:a}var yb=null,zb=null,Ab=null;
function Bb(a){if(a=Cb(a)){if("function"!==typeof yb)throw Error(p(280));var b=a.stateNode;b&&(b=Db(b),yb(a.stateNode,a.type,b))}}function Eb(a){zb?Ab?Ab.push(a):Ab=[a]:zb=a}function Fb(){if(zb){var a=zb,b=Ab;Ab=zb=null;Bb(a);if(b)for(a=0;a<b.length;a++)Bb(b[a])}}function Gb(a,b){return a(b)}function Hb(){}var Ib=!1;function Jb(a,b,c){if(Ib)return a(b,c);Ib=!0;try{return Gb(a,b,c)}finally{if(Ib=!1,null!==zb||null!==Ab)Hb(),Fb()}}
function Kb(a,b){var c=a.stateNode;if(null===c)return null;var d=Db(c);if(null===d)return null;c=d[b];a:switch(b){case "onClick":case "onClickCapture":case "onDoubleClick":case "onDoubleClickCapture":case "onMouseDown":case "onMouseDownCapture":case "onMouseMove":case "onMouseMoveCapture":case "onMouseUp":case "onMouseUpCapture":case "onMouseEnter":(d=!d.disabled)||(a=a.type,d=!("button"===a||"input"===a||"select"===a||"textarea"===a));a=!d;break a;default:a=!1}if(a)return null;if(c&&"function"!==
typeof c)throw Error(p(231,b,typeof c));return c}var Lb=!1;if(ia)try{var Mb={};Object.defineProperty(Mb,"passive",{get:function(){Lb=!0}});window.addEventListener("test",Mb,Mb);window.removeEventListener("test",Mb,Mb)}catch(a){Lb=!1}function Nb(a,b,c,d,e,f,g,h,k){var l=Array.prototype.slice.call(arguments,3);try{b.apply(c,l)}catch(m){this.onError(m)}}var Ob=!1,Pb=null,Qb=!1,Rb=null,Sb={onError:function(a){Ob=!0;Pb=a}};function Tb(a,b,c,d,e,f,g,h,k){Ob=!1;Pb=null;Nb.apply(Sb,arguments)}
function Ub(a,b,c,d,e,f,g,h,k){Tb.apply(this,arguments);if(Ob){if(Ob){var l=Pb;Ob=!1;Pb=null}else throw Error(p(198));Qb||(Qb=!0,Rb=l)}}function Vb(a){var b=a,c=a;if(a.alternate)for(;b.return;)b=b.return;else{a=b;do b=a,0!==(b.flags&4098)&&(c=b.return),a=b.return;while(a)}return 3===b.tag?c:null}function Wb(a){if(13===a.tag){var b=a.memoizedState;null===b&&(a=a.alternate,null!==a&&(b=a.memoizedState));if(null!==b)return b.dehydrated}return null}function Xb(a){if(Vb(a)!==a)throw Error(p(188));}
function Yb(a){var b=a.alternate;if(!b){b=Vb(a);if(null===b)throw Error(p(188));return b!==a?null:a}for(var c=a,d=b;;){var e=c.return;if(null===e)break;var f=e.alternate;if(null===f){d=e.return;if(null!==d){c=d;continue}break}if(e.child===f.child){for(f=e.child;f;){if(f===c)return Xb(e),a;if(f===d)return Xb(e),b;f=f.sibling}throw Error(p(188));}if(c.return!==d.return)c=e,d=f;else{for(var g=!1,h=e.child;h;){if(h===c){g=!0;c=e;d=f;break}if(h===d){g=!0;d=e;c=f;break}h=h.sibling}if(!g){for(h=f.child;h;){if(h===
c){g=!0;c=f;d=e;break}if(h===d){g=!0;d=f;c=e;break}h=h.sibling}if(!g)throw Error(p(189));}}if(c.alternate!==d)throw Error(p(190));}if(3!==c.tag)throw Error(p(188));return c.stateNode.current===c?a:b}function Zb(a){a=Yb(a);return null!==a?$b(a):null}function $b(a){if(5===a.tag||6===a.tag)return a;for(a=a.child;null!==a;){var b=$b(a);if(null!==b)return b;a=a.sibling}return null}
var ac=ca.unstable_scheduleCallback,bc=ca.unstable_cancelCallback,cc=ca.unstable_shouldYield,dc=ca.unstable_requestPaint,B=ca.unstable_now,ec=ca.unstable_getCurrentPriorityLevel,fc=ca.unstable_ImmediatePriority,gc=ca.unstable_UserBlockingPriority,hc=ca.unstable_NormalPriority,ic=ca.unstable_LowPriority,jc=ca.unstable_IdlePriority,kc=null,lc=null;function mc(a){if(lc&&"function"===typeof lc.onCommitFiberRoot)try{lc.onCommitFiberRoot(kc,a,void 0,128===(a.current.flags&128))}catch(b){}}
var oc=Math.clz32?Math.clz32:nc,pc=Math.log,qc=Math.LN2;function nc(a){a>>>=0;return 0===a?32:31-(pc(a)/qc|0)|0}var rc=64,sc=4194304;
function tc(a){switch(a&-a){case 1:return 1;case 2:return 2;case 4:return 4;case 8:return 8;case 16:return 16;case 32:return 32;case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return a&4194240;case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:return a&130023424;case 134217728:return 134217728;case 268435456:return 268435456;case 536870912:return 536870912;case 1073741824:return 1073741824;
default:return a}}function uc(a,b){var c=a.pendingLanes;if(0===c)return 0;var d=0,e=a.suspendedLanes,f=a.pingedLanes,g=c&268435455;if(0!==g){var h=g&~e;0!==h?d=tc(h):(f&=g,0!==f&&(d=tc(f)))}else g=c&~e,0!==g?d=tc(g):0!==f&&(d=tc(f));if(0===d)return 0;if(0!==b&&b!==d&&0===(b&e)&&(e=d&-d,f=b&-b,e>=f||16===e&&0!==(f&4194240)))return b;0!==(d&4)&&(d|=c&16);b=a.entangledLanes;if(0!==b)for(a=a.entanglements,b&=d;0<b;)c=31-oc(b),e=1<<c,d|=a[c],b&=~e;return d}
function vc(a,b){switch(a){case 1:case 2:case 4:return b+250;case 8:case 16:case 32:case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return b+5E3;case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:return-1;case 134217728:case 268435456:case 536870912:case 1073741824:return-1;default:return-1}}
function wc(a,b){for(var c=a.suspendedLanes,d=a.pingedLanes,e=a.expirationTimes,f=a.pendingLanes;0<f;){var g=31-oc(f),h=1<<g,k=e[g];if(-1===k){if(0===(h&c)||0!==(h&d))e[g]=vc(h,b)}else k<=b&&(a.expiredLanes|=h);f&=~h}}function xc(a){a=a.pendingLanes&-1073741825;return 0!==a?a:a&1073741824?1073741824:0}function yc(){var a=rc;rc<<=1;0===(rc&4194240)&&(rc=64);return a}function zc(a){for(var b=[],c=0;31>c;c++)b.push(a);return b}
function Ac(a,b,c){a.pendingLanes|=b;536870912!==b&&(a.suspendedLanes=0,a.pingedLanes=0);a=a.eventTimes;b=31-oc(b);a[b]=c}function Bc(a,b){var c=a.pendingLanes&~b;a.pendingLanes=b;a.suspendedLanes=0;a.pingedLanes=0;a.expiredLanes&=b;a.mutableReadLanes&=b;a.entangledLanes&=b;b=a.entanglements;var d=a.eventTimes;for(a=a.expirationTimes;0<c;){var e=31-oc(c),f=1<<e;b[e]=0;d[e]=-1;a[e]=-1;c&=~f}}
function Cc(a,b){var c=a.entangledLanes|=b;for(a=a.entanglements;c;){var d=31-oc(c),e=1<<d;e&b|a[d]&b&&(a[d]|=b);c&=~e}}var C=0;function Dc(a){a&=-a;return 1<a?4<a?0!==(a&268435455)?16:536870912:4:1}var Ec,Fc,Gc,Hc,Ic,Jc=!1,Kc=[],Lc=null,Mc=null,Nc=null,Oc=new Map,Pc=new Map,Qc=[],Rc="mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit".split(" ");
function Sc(a,b){switch(a){case "focusin":case "focusout":Lc=null;break;case "dragenter":case "dragleave":Mc=null;break;case "mouseover":case "mouseout":Nc=null;break;case "pointerover":case "pointerout":Oc.delete(b.pointerId);break;case "gotpointercapture":case "lostpointercapture":Pc.delete(b.pointerId)}}
function Tc(a,b,c,d,e,f){if(null===a||a.nativeEvent!==f)return a={blockedOn:b,domEventName:c,eventSystemFlags:d,nativeEvent:f,targetContainers:[e]},null!==b&&(b=Cb(b),null!==b&&Fc(b)),a;a.eventSystemFlags|=d;b=a.targetContainers;null!==e&&-1===b.indexOf(e)&&b.push(e);return a}
function Uc(a,b,c,d,e){switch(b){case "focusin":return Lc=Tc(Lc,a,b,c,d,e),!0;case "dragenter":return Mc=Tc(Mc,a,b,c,d,e),!0;case "mouseover":return Nc=Tc(Nc,a,b,c,d,e),!0;case "pointerover":var f=e.pointerId;Oc.set(f,Tc(Oc.get(f)||null,a,b,c,d,e));return!0;case "gotpointercapture":return f=e.pointerId,Pc.set(f,Tc(Pc.get(f)||null,a,b,c,d,e)),!0}return!1}
function Vc(a){var b=Wc(a.target);if(null!==b){var c=Vb(b);if(null!==c)if(b=c.tag,13===b){if(b=Wb(c),null!==b){a.blockedOn=b;Ic(a.priority,function(){Gc(c)});return}}else if(3===b&&c.stateNode.current.memoizedState.isDehydrated){a.blockedOn=3===c.tag?c.stateNode.containerInfo:null;return}}a.blockedOn=null}
function Xc(a){if(null!==a.blockedOn)return!1;for(var b=a.targetContainers;0<b.length;){var c=Yc(a.domEventName,a.eventSystemFlags,b[0],a.nativeEvent);if(null===c){c=a.nativeEvent;var d=new c.constructor(c.type,c);wb=d;c.target.dispatchEvent(d);wb=null}else return b=Cb(c),null!==b&&Fc(b),a.blockedOn=c,!1;b.shift()}return!0}function Zc(a,b,c){Xc(a)&&c.delete(b)}function $c(){Jc=!1;null!==Lc&&Xc(Lc)&&(Lc=null);null!==Mc&&Xc(Mc)&&(Mc=null);null!==Nc&&Xc(Nc)&&(Nc=null);Oc.forEach(Zc);Pc.forEach(Zc)}
function ad(a,b){a.blockedOn===b&&(a.blockedOn=null,Jc||(Jc=!0,ca.unstable_scheduleCallback(ca.unstable_NormalPriority,$c)))}
function bd(a){function b(b){return ad(b,a)}if(0<Kc.length){ad(Kc[0],a);for(var c=1;c<Kc.length;c++){var d=Kc[c];d.blockedOn===a&&(d.blockedOn=null)}}null!==Lc&&ad(Lc,a);null!==Mc&&ad(Mc,a);null!==Nc&&ad(Nc,a);Oc.forEach(b);Pc.forEach(b);for(c=0;c<Qc.length;c++)d=Qc[c],d.blockedOn===a&&(d.blockedOn=null);for(;0<Qc.length&&(c=Qc[0],null===c.blockedOn);)Vc(c),null===c.blockedOn&&Qc.shift()}var cd=ua.ReactCurrentBatchConfig,dd=!0;
function ed(a,b,c,d){var e=C,f=cd.transition;cd.transition=null;try{C=1,fd(a,b,c,d)}finally{C=e,cd.transition=f}}function gd(a,b,c,d){var e=C,f=cd.transition;cd.transition=null;try{C=4,fd(a,b,c,d)}finally{C=e,cd.transition=f}}
function fd(a,b,c,d){if(dd){var e=Yc(a,b,c,d);if(null===e)hd(a,b,d,id,c),Sc(a,d);else if(Uc(e,a,b,c,d))d.stopPropagation();else if(Sc(a,d),b&4&&-1<Rc.indexOf(a)){for(;null!==e;){var f=Cb(e);null!==f&&Ec(f);f=Yc(a,b,c,d);null===f&&hd(a,b,d,id,c);if(f===e)break;e=f}null!==e&&d.stopPropagation()}else hd(a,b,d,null,c)}}var id=null;
function Yc(a,b,c,d){id=null;a=xb(d);a=Wc(a);if(null!==a)if(b=Vb(a),null===b)a=null;else if(c=b.tag,13===c){a=Wb(b);if(null!==a)return a;a=null}else if(3===c){if(b.stateNode.current.memoizedState.isDehydrated)return 3===b.tag?b.stateNode.containerInfo:null;a=null}else b!==a&&(a=null);id=a;return null}
function jd(a){switch(a){case "cancel":case "click":case "close":case "contextmenu":case "copy":case "cut":case "auxclick":case "dblclick":case "dragend":case "dragstart":case "drop":case "focusin":case "focusout":case "input":case "invalid":case "keydown":case "keypress":case "keyup":case "mousedown":case "mouseup":case "paste":case "pause":case "play":case "pointercancel":case "pointerdown":case "pointerup":case "ratechange":case "reset":case "resize":case "seeked":case "submit":case "touchcancel":case "touchend":case "touchstart":case "volumechange":case "change":case "selectionchange":case "textInput":case "compositionstart":case "compositionend":case "compositionupdate":case "beforeblur":case "afterblur":case "beforeinput":case "blur":case "fullscreenchange":case "focus":case "hashchange":case "popstate":case "select":case "selectstart":return 1;case "drag":case "dragenter":case "dragexit":case "dragleave":case "dragover":case "mousemove":case "mouseout":case "mouseover":case "pointermove":case "pointerout":case "pointerover":case "scroll":case "toggle":case "touchmove":case "wheel":case "mouseenter":case "mouseleave":case "pointerenter":case "pointerleave":return 4;
case "message":switch(ec()){case fc:return 1;case gc:return 4;case hc:case ic:return 16;case jc:return 536870912;default:return 16}default:return 16}}var kd=null,ld=null,md=null;function nd(){if(md)return md;var a,b=ld,c=b.length,d,e="value"in kd?kd.value:kd.textContent,f=e.length;for(a=0;a<c&&b[a]===e[a];a++);var g=c-a;for(d=1;d<=g&&b[c-d]===e[f-d];d++);return md=e.slice(a,1<d?1-d:void 0)}
function od(a){var b=a.keyCode;"charCode"in a?(a=a.charCode,0===a&&13===b&&(a=13)):a=b;10===a&&(a=13);return 32<=a||13===a?a:0}function pd(){return!0}function qd(){return!1}
function rd(a){function b(b,d,e,f,g){this._reactName=b;this._targetInst=e;this.type=d;this.nativeEvent=f;this.target=g;this.currentTarget=null;for(var c in a)a.hasOwnProperty(c)&&(b=a[c],this[c]=b?b(f):f[c]);this.isDefaultPrevented=(null!=f.defaultPrevented?f.defaultPrevented:!1===f.returnValue)?pd:qd;this.isPropagationStopped=qd;return this}A(b.prototype,{preventDefault:function(){this.defaultPrevented=!0;var a=this.nativeEvent;a&&(a.preventDefault?a.preventDefault():"unknown"!==typeof a.returnValue&&
(a.returnValue=!1),this.isDefaultPrevented=pd)},stopPropagation:function(){var a=this.nativeEvent;a&&(a.stopPropagation?a.stopPropagation():"unknown"!==typeof a.cancelBubble&&(a.cancelBubble=!0),this.isPropagationStopped=pd)},persist:function(){},isPersistent:pd});return b}
var sd={eventPhase:0,bubbles:0,cancelable:0,timeStamp:function(a){return a.timeStamp||Date.now()},defaultPrevented:0,isTrusted:0},td=rd(sd),ud=A({},sd,{view:0,detail:0}),vd=rd(ud),wd,xd,yd,Ad=A({},ud,{screenX:0,screenY:0,clientX:0,clientY:0,pageX:0,pageY:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,getModifierState:zd,button:0,buttons:0,relatedTarget:function(a){return void 0===a.relatedTarget?a.fromElement===a.srcElement?a.toElement:a.fromElement:a.relatedTarget},movementX:function(a){if("movementX"in
a)return a.movementX;a!==yd&&(yd&&"mousemove"===a.type?(wd=a.screenX-yd.screenX,xd=a.screenY-yd.screenY):xd=wd=0,yd=a);return wd},movementY:function(a){return"movementY"in a?a.movementY:xd}}),Bd=rd(Ad),Cd=A({},Ad,{dataTransfer:0}),Dd=rd(Cd),Ed=A({},ud,{relatedTarget:0}),Fd=rd(Ed),Gd=A({},sd,{animationName:0,elapsedTime:0,pseudoElement:0}),Hd=rd(Gd),Id=A({},sd,{clipboardData:function(a){return"clipboardData"in a?a.clipboardData:window.clipboardData}}),Jd=rd(Id),Kd=A({},sd,{data:0}),Ld=rd(Kd),Md={Esc:"Escape",
Spacebar:" ",Left:"ArrowLeft",Up:"ArrowUp",Right:"ArrowRight",Down:"ArrowDown",Del:"Delete",Win:"OS",Menu:"ContextMenu",Apps:"ContextMenu",Scroll:"ScrollLock",MozPrintableKey:"Unidentified"},Nd={8:"Backspace",9:"Tab",12:"Clear",13:"Enter",16:"Shift",17:"Control",18:"Alt",19:"Pause",20:"CapsLock",27:"Escape",32:" ",33:"PageUp",34:"PageDown",35:"End",36:"Home",37:"ArrowLeft",38:"ArrowUp",39:"ArrowRight",40:"ArrowDown",45:"Insert",46:"Delete",112:"F1",113:"F2",114:"F3",115:"F4",116:"F5",117:"F6",118:"F7",
119:"F8",120:"F9",121:"F10",122:"F11",123:"F12",144:"NumLock",145:"ScrollLock",224:"Meta"},Od={Alt:"altKey",Control:"ctrlKey",Meta:"metaKey",Shift:"shiftKey"};function Pd(a){var b=this.nativeEvent;return b.getModifierState?b.getModifierState(a):(a=Od[a])?!!b[a]:!1}function zd(){return Pd}
var Qd=A({},ud,{key:function(a){if(a.key){var b=Md[a.key]||a.key;if("Unidentified"!==b)return b}return"keypress"===a.type?(a=od(a),13===a?"Enter":String.fromCharCode(a)):"keydown"===a.type||"keyup"===a.type?Nd[a.keyCode]||"Unidentified":""},code:0,location:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,repeat:0,locale:0,getModifierState:zd,charCode:function(a){return"keypress"===a.type?od(a):0},keyCode:function(a){return"keydown"===a.type||"keyup"===a.type?a.keyCode:0},which:function(a){return"keypress"===
a.type?od(a):"keydown"===a.type||"keyup"===a.type?a.keyCode:0}}),Rd=rd(Qd),Sd=A({},Ad,{pointerId:0,width:0,height:0,pressure:0,tangentialPressure:0,tiltX:0,tiltY:0,twist:0,pointerType:0,isPrimary:0}),Td=rd(Sd),Ud=A({},ud,{touches:0,targetTouches:0,changedTouches:0,altKey:0,metaKey:0,ctrlKey:0,shiftKey:0,getModifierState:zd}),Vd=rd(Ud),Wd=A({},sd,{propertyName:0,elapsedTime:0,pseudoElement:0}),Xd=rd(Wd),Yd=A({},Ad,{deltaX:function(a){return"deltaX"in a?a.deltaX:"wheelDeltaX"in a?-a.wheelDeltaX:0},
deltaY:function(a){return"deltaY"in a?a.deltaY:"wheelDeltaY"in a?-a.wheelDeltaY:"wheelDelta"in a?-a.wheelDelta:0},deltaZ:0,deltaMode:0}),Zd=rd(Yd),$d=[9,13,27,32],ae=ia&&"CompositionEvent"in window,be=null;ia&&"documentMode"in document&&(be=document.documentMode);var ce=ia&&"TextEvent"in window&&!be,de=ia&&(!ae||be&&8<be&&11>=be),ee=String.fromCharCode(32),fe=!1;
function ge(a,b){switch(a){case "keyup":return-1!==$d.indexOf(b.keyCode);case "keydown":return 229!==b.keyCode;case "keypress":case "mousedown":case "focusout":return!0;default:return!1}}function he(a){a=a.detail;return"object"===typeof a&&"data"in a?a.data:null}var ie=!1;function je(a,b){switch(a){case "compositionend":return he(b);case "keypress":if(32!==b.which)return null;fe=!0;return ee;case "textInput":return a=b.data,a===ee&&fe?null:a;default:return null}}
function ke(a,b){if(ie)return"compositionend"===a||!ae&&ge(a,b)?(a=nd(),md=ld=kd=null,ie=!1,a):null;switch(a){case "paste":return null;case "keypress":if(!(b.ctrlKey||b.altKey||b.metaKey)||b.ctrlKey&&b.altKey){if(b.char&&1<b.char.length)return b.char;if(b.which)return String.fromCharCode(b.which)}return null;case "compositionend":return de&&"ko"!==b.locale?null:b.data;default:return null}}
var le={color:!0,date:!0,datetime:!0,"datetime-local":!0,email:!0,month:!0,number:!0,password:!0,range:!0,search:!0,tel:!0,text:!0,time:!0,url:!0,week:!0};function me(a){var b=a&&a.nodeName&&a.nodeName.toLowerCase();return"input"===b?!!le[a.type]:"textarea"===b?!0:!1}function ne(a,b,c,d){Eb(d);b=oe(b,"onChange");0<b.length&&(c=new td("onChange","change",null,c,d),a.push({event:c,listeners:b}))}var pe=null,qe=null;function re(a){se(a,0)}function te(a){var b=ue(a);if(Wa(b))return a}
function ve(a,b){if("change"===a)return b}var we=!1;if(ia){var xe;if(ia){var ye="oninput"in document;if(!ye){var ze=document.createElement("div");ze.setAttribute("oninput","return;");ye="function"===typeof ze.oninput}xe=ye}else xe=!1;we=xe&&(!document.documentMode||9<document.documentMode)}function Ae(){pe&&(pe.detachEvent("onpropertychange",Be),qe=pe=null)}function Be(a){if("value"===a.propertyName&&te(qe)){var b=[];ne(b,qe,a,xb(a));Jb(re,b)}}
function Ce(a,b,c){"focusin"===a?(Ae(),pe=b,qe=c,pe.attachEvent("onpropertychange",Be)):"focusout"===a&&Ae()}function De(a){if("selectionchange"===a||"keyup"===a||"keydown"===a)return te(qe)}function Ee(a,b){if("click"===a)return te(b)}function Fe(a,b){if("input"===a||"change"===a)return te(b)}function Ge(a,b){return a===b&&(0!==a||1/a===1/b)||a!==a&&b!==b}var He="function"===typeof Object.is?Object.is:Ge;
function Ie(a,b){if(He(a,b))return!0;if("object"!==typeof a||null===a||"object"!==typeof b||null===b)return!1;var c=Object.keys(a),d=Object.keys(b);if(c.length!==d.length)return!1;for(d=0;d<c.length;d++){var e=c[d];if(!ja.call(b,e)||!He(a[e],b[e]))return!1}return!0}function Je(a){for(;a&&a.firstChild;)a=a.firstChild;return a}
function Ke(a,b){var c=Je(a);a=0;for(var d;c;){if(3===c.nodeType){d=a+c.textContent.length;if(a<=b&&d>=b)return{node:c,offset:b-a};a=d}a:{for(;c;){if(c.nextSibling){c=c.nextSibling;break a}c=c.parentNode}c=void 0}c=Je(c)}}function Le(a,b){return a&&b?a===b?!0:a&&3===a.nodeType?!1:b&&3===b.nodeType?Le(a,b.parentNode):"contains"in a?a.contains(b):a.compareDocumentPosition?!!(a.compareDocumentPosition(b)&16):!1:!1}
function Me(){for(var a=window,b=Xa();b instanceof a.HTMLIFrameElement;){try{var c="string"===typeof b.contentWindow.location.href}catch(d){c=!1}if(c)a=b.contentWindow;else break;b=Xa(a.document)}return b}function Ne(a){var b=a&&a.nodeName&&a.nodeName.toLowerCase();return b&&("input"===b&&("text"===a.type||"search"===a.type||"tel"===a.type||"url"===a.type||"password"===a.type)||"textarea"===b||"true"===a.contentEditable)}
function Oe(a){var b=Me(),c=a.focusedElem,d=a.selectionRange;if(b!==c&&c&&c.ownerDocument&&Le(c.ownerDocument.documentElement,c)){if(null!==d&&Ne(c))if(b=d.start,a=d.end,void 0===a&&(a=b),"selectionStart"in c)c.selectionStart=b,c.selectionEnd=Math.min(a,c.value.length);else if(a=(b=c.ownerDocument||document)&&b.defaultView||window,a.getSelection){a=a.getSelection();var e=c.textContent.length,f=Math.min(d.start,e);d=void 0===d.end?f:Math.min(d.end,e);!a.extend&&f>d&&(e=d,d=f,f=e);e=Ke(c,f);var g=Ke(c,
d);e&&g&&(1!==a.rangeCount||a.anchorNode!==e.node||a.anchorOffset!==e.offset||a.focusNode!==g.node||a.focusOffset!==g.offset)&&(b=b.createRange(),b.setStart(e.node,e.offset),a.removeAllRanges(),f>d?(a.addRange(b),a.extend(g.node,g.offset)):(b.setEnd(g.node,g.offset),a.addRange(b)))}b=[];for(a=c;a=a.parentNode;)1===a.nodeType&&b.push({element:a,left:a.scrollLeft,top:a.scrollTop});"function"===typeof c.focus&&c.focus();for(c=0;c<b.length;c++)a=b[c],a.element.scrollLeft=a.left,a.element.scrollTop=a.top}}
var Pe=ia&&"documentMode"in document&&11>=document.documentMode,Qe=null,Re=null,Se=null,Te=!1;
function Ue(a,b,c){var d=c.window===c?c.document:9===c.nodeType?c:c.ownerDocument;Te||null==Qe||Qe!==Xa(d)||(d=Qe,"selectionStart"in d&&Ne(d)?d={start:d.selectionStart,end:d.selectionEnd}:(d=(d.ownerDocument&&d.ownerDocument.defaultView||window).getSelection(),d={anchorNode:d.anchorNode,anchorOffset:d.anchorOffset,focusNode:d.focusNode,focusOffset:d.focusOffset}),Se&&Ie(Se,d)||(Se=d,d=oe(Re,"onSelect"),0<d.length&&(b=new td("onSelect","select",null,b,c),a.push({event:b,listeners:d}),b.target=Qe)))}
function Ve(a,b){var c={};c[a.toLowerCase()]=b.toLowerCase();c["Webkit"+a]="webkit"+b;c["Moz"+a]="moz"+b;return c}var We={animationend:Ve("Animation","AnimationEnd"),animationiteration:Ve("Animation","AnimationIteration"),animationstart:Ve("Animation","AnimationStart"),transitionend:Ve("Transition","TransitionEnd")},Xe={},Ye={};
ia&&(Ye=document.createElement("div").style,"AnimationEvent"in window||(delete We.animationend.animation,delete We.animationiteration.animation,delete We.animationstart.animation),"TransitionEvent"in window||delete We.transitionend.transition);function Ze(a){if(Xe[a])return Xe[a];if(!We[a])return a;var b=We[a],c;for(c in b)if(b.hasOwnProperty(c)&&c in Ye)return Xe[a]=b[c];return a}var $e=Ze("animationend"),af=Ze("animationiteration"),bf=Ze("animationstart"),cf=Ze("transitionend"),df=new Map,ef="abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
function ff(a,b){df.set(a,b);fa(b,[a])}for(var gf=0;gf<ef.length;gf++){var hf=ef[gf],jf=hf.toLowerCase(),kf=hf[0].toUpperCase()+hf.slice(1);ff(jf,"on"+kf)}ff($e,"onAnimationEnd");ff(af,"onAnimationIteration");ff(bf,"onAnimationStart");ff("dblclick","onDoubleClick");ff("focusin","onFocus");ff("focusout","onBlur");ff(cf,"onTransitionEnd");ha("onMouseEnter",["mouseout","mouseover"]);ha("onMouseLeave",["mouseout","mouseover"]);ha("onPointerEnter",["pointerout","pointerover"]);
ha("onPointerLeave",["pointerout","pointerover"]);fa("onChange","change click focusin focusout input keydown keyup selectionchange".split(" "));fa("onSelect","focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" "));fa("onBeforeInput",["compositionend","keypress","textInput","paste"]);fa("onCompositionEnd","compositionend focusout keydown keypress keyup mousedown".split(" "));fa("onCompositionStart","compositionstart focusout keydown keypress keyup mousedown".split(" "));
fa("onCompositionUpdate","compositionupdate focusout keydown keypress keyup mousedown".split(" "));var lf="abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "),mf=new Set("cancel close invalid load scroll toggle".split(" ").concat(lf));
function nf(a,b,c){var d=a.type||"unknown-event";a.currentTarget=c;Ub(d,b,void 0,a);a.currentTarget=null}
function se(a,b){b=0!==(b&4);for(var c=0;c<a.length;c++){var d=a[c],e=d.event;d=d.listeners;a:{var f=void 0;if(b)for(var g=d.length-1;0<=g;g--){var h=d[g],k=h.instance,l=h.currentTarget;h=h.listener;if(k!==f&&e.isPropagationStopped())break a;nf(e,h,l);f=k}else for(g=0;g<d.length;g++){h=d[g];k=h.instance;l=h.currentTarget;h=h.listener;if(k!==f&&e.isPropagationStopped())break a;nf(e,h,l);f=k}}}if(Qb)throw a=Rb,Qb=!1,Rb=null,a;}
function D(a,b){var c=b[of];void 0===c&&(c=b[of]=new Set);var d=a+"__bubble";c.has(d)||(pf(b,a,2,!1),c.add(d))}function qf(a,b,c){var d=0;b&&(d|=4);pf(c,a,d,b)}var rf="_reactListening"+Math.random().toString(36).slice(2);function sf(a){if(!a[rf]){a[rf]=!0;da.forEach(function(b){"selectionchange"!==b&&(mf.has(b)||qf(b,!1,a),qf(b,!0,a))});var b=9===a.nodeType?a:a.ownerDocument;null===b||b[rf]||(b[rf]=!0,qf("selectionchange",!1,b))}}
function pf(a,b,c,d){switch(jd(b)){case 1:var e=ed;break;case 4:e=gd;break;default:e=fd}c=e.bind(null,b,c,a);e=void 0;!Lb||"touchstart"!==b&&"touchmove"!==b&&"wheel"!==b||(e=!0);d?void 0!==e?a.addEventListener(b,c,{capture:!0,passive:e}):a.addEventListener(b,c,!0):void 0!==e?a.addEventListener(b,c,{passive:e}):a.addEventListener(b,c,!1)}
function hd(a,b,c,d,e){var f=d;if(0===(b&1)&&0===(b&2)&&null!==d)a:for(;;){if(null===d)return;var g=d.tag;if(3===g||4===g){var h=d.stateNode.containerInfo;if(h===e||8===h.nodeType&&h.parentNode===e)break;if(4===g)for(g=d.return;null!==g;){var k=g.tag;if(3===k||4===k)if(k=g.stateNode.containerInfo,k===e||8===k.nodeType&&k.parentNode===e)return;g=g.return}for(;null!==h;){g=Wc(h);if(null===g)return;k=g.tag;if(5===k||6===k){d=f=g;continue a}h=h.parentNode}}d=d.return}Jb(function(){var d=f,e=xb(c),g=[];
a:{var h=df.get(a);if(void 0!==h){var k=td,n=a;switch(a){case "keypress":if(0===od(c))break a;case "keydown":case "keyup":k=Rd;break;case "focusin":n="focus";k=Fd;break;case "focusout":n="blur";k=Fd;break;case "beforeblur":case "afterblur":k=Fd;break;case "click":if(2===c.button)break a;case "auxclick":case "dblclick":case "mousedown":case "mousemove":case "mouseup":case "mouseout":case "mouseover":case "contextmenu":k=Bd;break;case "drag":case "dragend":case "dragenter":case "dragexit":case "dragleave":case "dragover":case "dragstart":case "drop":k=
Dd;break;case "touchcancel":case "touchend":case "touchmove":case "touchstart":k=Vd;break;case $e:case af:case bf:k=Hd;break;case cf:k=Xd;break;case "scroll":k=vd;break;case "wheel":k=Zd;break;case "copy":case "cut":case "paste":k=Jd;break;case "gotpointercapture":case "lostpointercapture":case "pointercancel":case "pointerdown":case "pointermove":case "pointerout":case "pointerover":case "pointerup":k=Td}var t=0!==(b&4),J=!t&&"scroll"===a,x=t?null!==h?h+"Capture":null:h;t=[];for(var w=d,u;null!==
w;){u=w;var F=u.stateNode;5===u.tag&&null!==F&&(u=F,null!==x&&(F=Kb(w,x),null!=F&&t.push(tf(w,F,u))));if(J)break;w=w.return}0<t.length&&(h=new k(h,n,null,c,e),g.push({event:h,listeners:t}))}}if(0===(b&7)){a:{h="mouseover"===a||"pointerover"===a;k="mouseout"===a||"pointerout"===a;if(h&&c!==wb&&(n=c.relatedTarget||c.fromElement)&&(Wc(n)||n[uf]))break a;if(k||h){h=e.window===e?e:(h=e.ownerDocument)?h.defaultView||h.parentWindow:window;if(k){if(n=c.relatedTarget||c.toElement,k=d,n=n?Wc(n):null,null!==
n&&(J=Vb(n),n!==J||5!==n.tag&&6!==n.tag))n=null}else k=null,n=d;if(k!==n){t=Bd;F="onMouseLeave";x="onMouseEnter";w="mouse";if("pointerout"===a||"pointerover"===a)t=Td,F="onPointerLeave",x="onPointerEnter",w="pointer";J=null==k?h:ue(k);u=null==n?h:ue(n);h=new t(F,w+"leave",k,c,e);h.target=J;h.relatedTarget=u;F=null;Wc(e)===d&&(t=new t(x,w+"enter",n,c,e),t.target=u,t.relatedTarget=J,F=t);J=F;if(k&&n)b:{t=k;x=n;w=0;for(u=t;u;u=vf(u))w++;u=0;for(F=x;F;F=vf(F))u++;for(;0<w-u;)t=vf(t),w--;for(;0<u-w;)x=
vf(x),u--;for(;w--;){if(t===x||null!==x&&t===x.alternate)break b;t=vf(t);x=vf(x)}t=null}else t=null;null!==k&&wf(g,h,k,t,!1);null!==n&&null!==J&&wf(g,J,n,t,!0)}}}a:{h=d?ue(d):window;k=h.nodeName&&h.nodeName.toLowerCase();if("select"===k||"input"===k&&"file"===h.type)var na=ve;else if(me(h))if(we)na=Fe;else{na=De;var xa=Ce}else(k=h.nodeName)&&"input"===k.toLowerCase()&&("checkbox"===h.type||"radio"===h.type)&&(na=Ee);if(na&&(na=na(a,d))){ne(g,na,c,e);break a}xa&&xa(a,h,d);"focusout"===a&&(xa=h._wrapperState)&&
xa.controlled&&"number"===h.type&&cb(h,"number",h.value)}xa=d?ue(d):window;switch(a){case "focusin":if(me(xa)||"true"===xa.contentEditable)Qe=xa,Re=d,Se=null;break;case "focusout":Se=Re=Qe=null;break;case "mousedown":Te=!0;break;case "contextmenu":case "mouseup":case "dragend":Te=!1;Ue(g,c,e);break;case "selectionchange":if(Pe)break;case "keydown":case "keyup":Ue(g,c,e)}var $a;if(ae)b:{switch(a){case "compositionstart":var ba="onCompositionStart";break b;case "compositionend":ba="onCompositionEnd";
break b;case "compositionupdate":ba="onCompositionUpdate";break b}ba=void 0}else ie?ge(a,c)&&(ba="onCompositionEnd"):"keydown"===a&&229===c.keyCode&&(ba="onCompositionStart");ba&&(de&&"ko"!==c.locale&&(ie||"onCompositionStart"!==ba?"onCompositionEnd"===ba&&ie&&($a=nd()):(kd=e,ld="value"in kd?kd.value:kd.textContent,ie=!0)),xa=oe(d,ba),0<xa.length&&(ba=new Ld(ba,a,null,c,e),g.push({event:ba,listeners:xa}),$a?ba.data=$a:($a=he(c),null!==$a&&(ba.data=$a))));if($a=ce?je(a,c):ke(a,c))d=oe(d,"onBeforeInput"),
0<d.length&&(e=new Ld("onBeforeInput","beforeinput",null,c,e),g.push({event:e,listeners:d}),e.data=$a)}se(g,b)})}function tf(a,b,c){return{instance:a,listener:b,currentTarget:c}}function oe(a,b){for(var c=b+"Capture",d=[];null!==a;){var e=a,f=e.stateNode;5===e.tag&&null!==f&&(e=f,f=Kb(a,c),null!=f&&d.unshift(tf(a,f,e)),f=Kb(a,b),null!=f&&d.push(tf(a,f,e)));a=a.return}return d}function vf(a){if(null===a)return null;do a=a.return;while(a&&5!==a.tag);return a?a:null}
function wf(a,b,c,d,e){for(var f=b._reactName,g=[];null!==c&&c!==d;){var h=c,k=h.alternate,l=h.stateNode;if(null!==k&&k===d)break;5===h.tag&&null!==l&&(h=l,e?(k=Kb(c,f),null!=k&&g.unshift(tf(c,k,h))):e||(k=Kb(c,f),null!=k&&g.push(tf(c,k,h))));c=c.return}0!==g.length&&a.push({event:b,listeners:g})}var xf=/\r\n?/g,yf=/\u0000|\uFFFD/g;function zf(a){return("string"===typeof a?a:""+a).replace(xf,"\n").replace(yf,"")}function Af(a,b,c){b=zf(b);if(zf(a)!==b&&c)throw Error(p(425));}function Bf(){}
var Cf=null,Df=null;function Ef(a,b){return"textarea"===a||"noscript"===a||"string"===typeof b.children||"number"===typeof b.children||"object"===typeof b.dangerouslySetInnerHTML&&null!==b.dangerouslySetInnerHTML&&null!=b.dangerouslySetInnerHTML.__html}
var Ff="function"===typeof setTimeout?setTimeout:void 0,Gf="function"===typeof clearTimeout?clearTimeout:void 0,Hf="function"===typeof Promise?Promise:void 0,Jf="function"===typeof queueMicrotask?queueMicrotask:"undefined"!==typeof Hf?function(a){return Hf.resolve(null).then(a).catch(If)}:Ff;function If(a){setTimeout(function(){throw a;})}
function Kf(a,b){var c=b,d=0;do{var e=c.nextSibling;a.removeChild(c);if(e&&8===e.nodeType)if(c=e.data,"/$"===c){if(0===d){a.removeChild(e);bd(b);return}d--}else"$"!==c&&"$?"!==c&&"$!"!==c||d++;c=e}while(c);bd(b)}function Lf(a){for(;null!=a;a=a.nextSibling){var b=a.nodeType;if(1===b||3===b)break;if(8===b){b=a.data;if("$"===b||"$!"===b||"$?"===b)break;if("/$"===b)return null}}return a}
function Mf(a){a=a.previousSibling;for(var b=0;a;){if(8===a.nodeType){var c=a.data;if("$"===c||"$!"===c||"$?"===c){if(0===b)return a;b--}else"/$"===c&&b++}a=a.previousSibling}return null}var Nf=Math.random().toString(36).slice(2),Of="__reactFiber$"+Nf,Pf="__reactProps$"+Nf,uf="__reactContainer$"+Nf,of="__reactEvents$"+Nf,Qf="__reactListeners$"+Nf,Rf="__reactHandles$"+Nf;
function Wc(a){var b=a[Of];if(b)return b;for(var c=a.parentNode;c;){if(b=c[uf]||c[Of]){c=b.alternate;if(null!==b.child||null!==c&&null!==c.child)for(a=Mf(a);null!==a;){if(c=a[Of])return c;a=Mf(a)}return b}a=c;c=a.parentNode}return null}function Cb(a){a=a[Of]||a[uf];return!a||5!==a.tag&&6!==a.tag&&13!==a.tag&&3!==a.tag?null:a}function ue(a){if(5===a.tag||6===a.tag)return a.stateNode;throw Error(p(33));}function Db(a){return a[Pf]||null}var Sf=[],Tf=-1;function Uf(a){return{current:a}}
function E(a){0>Tf||(a.current=Sf[Tf],Sf[Tf]=null,Tf--)}function G(a,b){Tf++;Sf[Tf]=a.current;a.current=b}var Vf={},H=Uf(Vf),Wf=Uf(!1),Xf=Vf;function Yf(a,b){var c=a.type.contextTypes;if(!c)return Vf;var d=a.stateNode;if(d&&d.__reactInternalMemoizedUnmaskedChildContext===b)return d.__reactInternalMemoizedMaskedChildContext;var e={},f;for(f in c)e[f]=b[f];d&&(a=a.stateNode,a.__reactInternalMemoizedUnmaskedChildContext=b,a.__reactInternalMemoizedMaskedChildContext=e);return e}
function Zf(a){a=a.childContextTypes;return null!==a&&void 0!==a}function $f(){E(Wf);E(H)}function ag(a,b,c){if(H.current!==Vf)throw Error(p(168));G(H,b);G(Wf,c)}function bg(a,b,c){var d=a.stateNode;b=b.childContextTypes;if("function"!==typeof d.getChildContext)return c;d=d.getChildContext();for(var e in d)if(!(e in b))throw Error(p(108,Ra(a)||"Unknown",e));return A({},c,d)}
function cg(a){a=(a=a.stateNode)&&a.__reactInternalMemoizedMergedChildContext||Vf;Xf=H.current;G(H,a);G(Wf,Wf.current);return!0}function dg(a,b,c){var d=a.stateNode;if(!d)throw Error(p(169));c?(a=bg(a,b,Xf),d.__reactInternalMemoizedMergedChildContext=a,E(Wf),E(H),G(H,a)):E(Wf);G(Wf,c)}var eg=null,fg=!1,gg=!1;function hg(a){null===eg?eg=[a]:eg.push(a)}function ig(a){fg=!0;hg(a)}
function jg(){if(!gg&&null!==eg){gg=!0;var a=0,b=C;try{var c=eg;for(C=1;a<c.length;a++){var d=c[a];do d=d(!0);while(null!==d)}eg=null;fg=!1}catch(e){throw null!==eg&&(eg=eg.slice(a+1)),ac(fc,jg),e;}finally{C=b,gg=!1}}return null}var kg=[],lg=0,mg=null,ng=0,og=[],pg=0,qg=null,rg=1,sg="";function tg(a,b){kg[lg++]=ng;kg[lg++]=mg;mg=a;ng=b}
function ug(a,b,c){og[pg++]=rg;og[pg++]=sg;og[pg++]=qg;qg=a;var d=rg;a=sg;var e=32-oc(d)-1;d&=~(1<<e);c+=1;var f=32-oc(b)+e;if(30<f){var g=e-e%5;f=(d&(1<<g)-1).toString(32);d>>=g;e-=g;rg=1<<32-oc(b)+e|c<<e|d;sg=f+a}else rg=1<<f|c<<e|d,sg=a}function vg(a){null!==a.return&&(tg(a,1),ug(a,1,0))}function wg(a){for(;a===mg;)mg=kg[--lg],kg[lg]=null,ng=kg[--lg],kg[lg]=null;for(;a===qg;)qg=og[--pg],og[pg]=null,sg=og[--pg],og[pg]=null,rg=og[--pg],og[pg]=null}var xg=null,yg=null,I=!1,zg=null;
function Ag(a,b){var c=Bg(5,null,null,0);c.elementType="DELETED";c.stateNode=b;c.return=a;b=a.deletions;null===b?(a.deletions=[c],a.flags|=16):b.push(c)}
function Cg(a,b){switch(a.tag){case 5:var c=a.type;b=1!==b.nodeType||c.toLowerCase()!==b.nodeName.toLowerCase()?null:b;return null!==b?(a.stateNode=b,xg=a,yg=Lf(b.firstChild),!0):!1;case 6:return b=""===a.pendingProps||3!==b.nodeType?null:b,null!==b?(a.stateNode=b,xg=a,yg=null,!0):!1;case 13:return b=8!==b.nodeType?null:b,null!==b?(c=null!==qg?{id:rg,overflow:sg}:null,a.memoizedState={dehydrated:b,treeContext:c,retryLane:1073741824},c=Bg(18,null,null,0),c.stateNode=b,c.return=a,a.child=c,xg=a,yg=
null,!0):!1;default:return!1}}function Dg(a){return 0!==(a.mode&1)&&0===(a.flags&128)}function Eg(a){if(I){var b=yg;if(b){var c=b;if(!Cg(a,b)){if(Dg(a))throw Error(p(418));b=Lf(c.nextSibling);var d=xg;b&&Cg(a,b)?Ag(d,c):(a.flags=a.flags&-4097|2,I=!1,xg=a)}}else{if(Dg(a))throw Error(p(418));a.flags=a.flags&-4097|2;I=!1;xg=a}}}function Fg(a){for(a=a.return;null!==a&&5!==a.tag&&3!==a.tag&&13!==a.tag;)a=a.return;xg=a}
function Gg(a){if(a!==xg)return!1;if(!I)return Fg(a),I=!0,!1;var b;(b=3!==a.tag)&&!(b=5!==a.tag)&&(b=a.type,b="head"!==b&&"body"!==b&&!Ef(a.type,a.memoizedProps));if(b&&(b=yg)){if(Dg(a))throw Hg(),Error(p(418));for(;b;)Ag(a,b),b=Lf(b.nextSibling)}Fg(a);if(13===a.tag){a=a.memoizedState;a=null!==a?a.dehydrated:null;if(!a)throw Error(p(317));a:{a=a.nextSibling;for(b=0;a;){if(8===a.nodeType){var c=a.data;if("/$"===c){if(0===b){yg=Lf(a.nextSibling);break a}b--}else"$"!==c&&"$!"!==c&&"$?"!==c||b++}a=a.nextSibling}yg=
null}}else yg=xg?Lf(a.stateNode.nextSibling):null;return!0}function Hg(){for(var a=yg;a;)a=Lf(a.nextSibling)}function Ig(){yg=xg=null;I=!1}function Jg(a){null===zg?zg=[a]:zg.push(a)}var Kg=ua.ReactCurrentBatchConfig;
function Lg(a,b,c){a=c.ref;if(null!==a&&"function"!==typeof a&&"object"!==typeof a){if(c._owner){c=c._owner;if(c){if(1!==c.tag)throw Error(p(309));var d=c.stateNode}if(!d)throw Error(p(147,a));var e=d,f=""+a;if(null!==b&&null!==b.ref&&"function"===typeof b.ref&&b.ref._stringRef===f)return b.ref;b=function(a){var b=e.refs;null===a?delete b[f]:b[f]=a};b._stringRef=f;return b}if("string"!==typeof a)throw Error(p(284));if(!c._owner)throw Error(p(290,a));}return a}
function Mg(a,b){a=Object.prototype.toString.call(b);throw Error(p(31,"[object Object]"===a?"object with keys {"+Object.keys(b).join(", ")+"}":a));}function Ng(a){var b=a._init;return b(a._payload)}
function Og(a){function b(b,c){if(a){var d=b.deletions;null===d?(b.deletions=[c],b.flags|=16):d.push(c)}}function c(c,d){if(!a)return null;for(;null!==d;)b(c,d),d=d.sibling;return null}function d(a,b){for(a=new Map;null!==b;)null!==b.key?a.set(b.key,b):a.set(b.index,b),b=b.sibling;return a}function e(a,b){a=Pg(a,b);a.index=0;a.sibling=null;return a}function f(b,c,d){b.index=d;if(!a)return b.flags|=1048576,c;d=b.alternate;if(null!==d)return d=d.index,d<c?(b.flags|=2,c):d;b.flags|=2;return c}function g(b){a&&
null===b.alternate&&(b.flags|=2);return b}function h(a,b,c,d){if(null===b||6!==b.tag)return b=Qg(c,a.mode,d),b.return=a,b;b=e(b,c);b.return=a;return b}function k(a,b,c,d){var f=c.type;if(f===ya)return m(a,b,c.props.children,d,c.key);if(null!==b&&(b.elementType===f||"object"===typeof f&&null!==f&&f.$$typeof===Ha&&Ng(f)===b.type))return d=e(b,c.props),d.ref=Lg(a,b,c),d.return=a,d;d=Rg(c.type,c.key,c.props,null,a.mode,d);d.ref=Lg(a,b,c);d.return=a;return d}function l(a,b,c,d){if(null===b||4!==b.tag||
b.stateNode.containerInfo!==c.containerInfo||b.stateNode.implementation!==c.implementation)return b=Sg(c,a.mode,d),b.return=a,b;b=e(b,c.children||[]);b.return=a;return b}function m(a,b,c,d,f){if(null===b||7!==b.tag)return b=Tg(c,a.mode,d,f),b.return=a,b;b=e(b,c);b.return=a;return b}function q(a,b,c){if("string"===typeof b&&""!==b||"number"===typeof b)return b=Qg(""+b,a.mode,c),b.return=a,b;if("object"===typeof b&&null!==b){switch(b.$$typeof){case va:return c=Rg(b.type,b.key,b.props,null,a.mode,c),
c.ref=Lg(a,null,b),c.return=a,c;case wa:return b=Sg(b,a.mode,c),b.return=a,b;case Ha:var d=b._init;return q(a,d(b._payload),c)}if(eb(b)||Ka(b))return b=Tg(b,a.mode,c,null),b.return=a,b;Mg(a,b)}return null}function r(a,b,c,d){var e=null!==b?b.key:null;if("string"===typeof c&&""!==c||"number"===typeof c)return null!==e?null:h(a,b,""+c,d);if("object"===typeof c&&null!==c){switch(c.$$typeof){case va:return c.key===e?k(a,b,c,d):null;case wa:return c.key===e?l(a,b,c,d):null;case Ha:return e=c._init,r(a,
b,e(c._payload),d)}if(eb(c)||Ka(c))return null!==e?null:m(a,b,c,d,null);Mg(a,c)}return null}function y(a,b,c,d,e){if("string"===typeof d&&""!==d||"number"===typeof d)return a=a.get(c)||null,h(b,a,""+d,e);if("object"===typeof d&&null!==d){switch(d.$$typeof){case va:return a=a.get(null===d.key?c:d.key)||null,k(b,a,d,e);case wa:return a=a.get(null===d.key?c:d.key)||null,l(b,a,d,e);case Ha:var f=d._init;return y(a,b,c,f(d._payload),e)}if(eb(d)||Ka(d))return a=a.get(c)||null,m(b,a,d,e,null);Mg(b,d)}return null}
function n(e,g,h,k){for(var l=null,m=null,u=g,w=g=0,x=null;null!==u&&w<h.length;w++){u.index>w?(x=u,u=null):x=u.sibling;var n=r(e,u,h[w],k);if(null===n){null===u&&(u=x);break}a&&u&&null===n.alternate&&b(e,u);g=f(n,g,w);null===m?l=n:m.sibling=n;m=n;u=x}if(w===h.length)return c(e,u),I&&tg(e,w),l;if(null===u){for(;w<h.length;w++)u=q(e,h[w],k),null!==u&&(g=f(u,g,w),null===m?l=u:m.sibling=u,m=u);I&&tg(e,w);return l}for(u=d(e,u);w<h.length;w++)x=y(u,e,w,h[w],k),null!==x&&(a&&null!==x.alternate&&u.delete(null===
x.key?w:x.key),g=f(x,g,w),null===m?l=x:m.sibling=x,m=x);a&&u.forEach(function(a){return b(e,a)});I&&tg(e,w);return l}function t(e,g,h,k){var l=Ka(h);if("function"!==typeof l)throw Error(p(150));h=l.call(h);if(null==h)throw Error(p(151));for(var u=l=null,m=g,w=g=0,x=null,n=h.next();null!==m&&!n.done;w++,n=h.next()){m.index>w?(x=m,m=null):x=m.sibling;var t=r(e,m,n.value,k);if(null===t){null===m&&(m=x);break}a&&m&&null===t.alternate&&b(e,m);g=f(t,g,w);null===u?l=t:u.sibling=t;u=t;m=x}if(n.done)return c(e,
m),I&&tg(e,w),l;if(null===m){for(;!n.done;w++,n=h.next())n=q(e,n.value,k),null!==n&&(g=f(n,g,w),null===u?l=n:u.sibling=n,u=n);I&&tg(e,w);return l}for(m=d(e,m);!n.done;w++,n=h.next())n=y(m,e,w,n.value,k),null!==n&&(a&&null!==n.alternate&&m.delete(null===n.key?w:n.key),g=f(n,g,w),null===u?l=n:u.sibling=n,u=n);a&&m.forEach(function(a){return b(e,a)});I&&tg(e,w);return l}function J(a,d,f,h){"object"===typeof f&&null!==f&&f.type===ya&&null===f.key&&(f=f.props.children);if("object"===typeof f&&null!==f){switch(f.$$typeof){case va:a:{for(var k=
f.key,l=d;null!==l;){if(l.key===k){k=f.type;if(k===ya){if(7===l.tag){c(a,l.sibling);d=e(l,f.props.children);d.return=a;a=d;break a}}else if(l.elementType===k||"object"===typeof k&&null!==k&&k.$$typeof===Ha&&Ng(k)===l.type){c(a,l.sibling);d=e(l,f.props);d.ref=Lg(a,l,f);d.return=a;a=d;break a}c(a,l);break}else b(a,l);l=l.sibling}f.type===ya?(d=Tg(f.props.children,a.mode,h,f.key),d.return=a,a=d):(h=Rg(f.type,f.key,f.props,null,a.mode,h),h.ref=Lg(a,d,f),h.return=a,a=h)}return g(a);case wa:a:{for(l=f.key;null!==
d;){if(d.key===l)if(4===d.tag&&d.stateNode.containerInfo===f.containerInfo&&d.stateNode.implementation===f.implementation){c(a,d.sibling);d=e(d,f.children||[]);d.return=a;a=d;break a}else{c(a,d);break}else b(a,d);d=d.sibling}d=Sg(f,a.mode,h);d.return=a;a=d}return g(a);case Ha:return l=f._init,J(a,d,l(f._payload),h)}if(eb(f))return n(a,d,f,h);if(Ka(f))return t(a,d,f,h);Mg(a,f)}return"string"===typeof f&&""!==f||"number"===typeof f?(f=""+f,null!==d&&6===d.tag?(c(a,d.sibling),d=e(d,f),d.return=a,a=d):
(c(a,d),d=Qg(f,a.mode,h),d.return=a,a=d),g(a)):c(a,d)}return J}var Ug=Og(!0),Vg=Og(!1),Wg=Uf(null),Xg=null,Yg=null,Zg=null;function $g(){Zg=Yg=Xg=null}function ah(a){var b=Wg.current;E(Wg);a._currentValue=b}function bh(a,b,c){for(;null!==a;){var d=a.alternate;(a.childLanes&b)!==b?(a.childLanes|=b,null!==d&&(d.childLanes|=b)):null!==d&&(d.childLanes&b)!==b&&(d.childLanes|=b);if(a===c)break;a=a.return}}
function ch(a,b){Xg=a;Zg=Yg=null;a=a.dependencies;null!==a&&null!==a.firstContext&&(0!==(a.lanes&b)&&(dh=!0),a.firstContext=null)}function eh(a){var b=a._currentValue;if(Zg!==a)if(a={context:a,memoizedValue:b,next:null},null===Yg){if(null===Xg)throw Error(p(308));Yg=a;Xg.dependencies={lanes:0,firstContext:a}}else Yg=Yg.next=a;return b}var fh=null;function gh(a){null===fh?fh=[a]:fh.push(a)}
function hh(a,b,c,d){var e=b.interleaved;null===e?(c.next=c,gh(b)):(c.next=e.next,e.next=c);b.interleaved=c;return ih(a,d)}function ih(a,b){a.lanes|=b;var c=a.alternate;null!==c&&(c.lanes|=b);c=a;for(a=a.return;null!==a;)a.childLanes|=b,c=a.alternate,null!==c&&(c.childLanes|=b),c=a,a=a.return;return 3===c.tag?c.stateNode:null}var jh=!1;function kh(a){a.updateQueue={baseState:a.memoizedState,firstBaseUpdate:null,lastBaseUpdate:null,shared:{pending:null,interleaved:null,lanes:0},effects:null}}
function lh(a,b){a=a.updateQueue;b.updateQueue===a&&(b.updateQueue={baseState:a.baseState,firstBaseUpdate:a.firstBaseUpdate,lastBaseUpdate:a.lastBaseUpdate,shared:a.shared,effects:a.effects})}function mh(a,b){return{eventTime:a,lane:b,tag:0,payload:null,callback:null,next:null}}
function nh(a,b,c){var d=a.updateQueue;if(null===d)return null;d=d.shared;if(0!==(K&2)){var e=d.pending;null===e?b.next=b:(b.next=e.next,e.next=b);d.pending=b;return ih(a,c)}e=d.interleaved;null===e?(b.next=b,gh(d)):(b.next=e.next,e.next=b);d.interleaved=b;return ih(a,c)}function oh(a,b,c){b=b.updateQueue;if(null!==b&&(b=b.shared,0!==(c&4194240))){var d=b.lanes;d&=a.pendingLanes;c|=d;b.lanes=c;Cc(a,c)}}
function ph(a,b){var c=a.updateQueue,d=a.alternate;if(null!==d&&(d=d.updateQueue,c===d)){var e=null,f=null;c=c.firstBaseUpdate;if(null!==c){do{var g={eventTime:c.eventTime,lane:c.lane,tag:c.tag,payload:c.payload,callback:c.callback,next:null};null===f?e=f=g:f=f.next=g;c=c.next}while(null!==c);null===f?e=f=b:f=f.next=b}else e=f=b;c={baseState:d.baseState,firstBaseUpdate:e,lastBaseUpdate:f,shared:d.shared,effects:d.effects};a.updateQueue=c;return}a=c.lastBaseUpdate;null===a?c.firstBaseUpdate=b:a.next=
b;c.lastBaseUpdate=b}
function qh(a,b,c,d){var e=a.updateQueue;jh=!1;var f=e.firstBaseUpdate,g=e.lastBaseUpdate,h=e.shared.pending;if(null!==h){e.shared.pending=null;var k=h,l=k.next;k.next=null;null===g?f=l:g.next=l;g=k;var m=a.alternate;null!==m&&(m=m.updateQueue,h=m.lastBaseUpdate,h!==g&&(null===h?m.firstBaseUpdate=l:h.next=l,m.lastBaseUpdate=k))}if(null!==f){var q=e.baseState;g=0;m=l=k=null;h=f;do{var r=h.lane,y=h.eventTime;if((d&r)===r){null!==m&&(m=m.next={eventTime:y,lane:0,tag:h.tag,payload:h.payload,callback:h.callback,
next:null});a:{var n=a,t=h;r=b;y=c;switch(t.tag){case 1:n=t.payload;if("function"===typeof n){q=n.call(y,q,r);break a}q=n;break a;case 3:n.flags=n.flags&-65537|128;case 0:n=t.payload;r="function"===typeof n?n.call(y,q,r):n;if(null===r||void 0===r)break a;q=A({},q,r);break a;case 2:jh=!0}}null!==h.callback&&0!==h.lane&&(a.flags|=64,r=e.effects,null===r?e.effects=[h]:r.push(h))}else y={eventTime:y,lane:r,tag:h.tag,payload:h.payload,callback:h.callback,next:null},null===m?(l=m=y,k=q):m=m.next=y,g|=r;
h=h.next;if(null===h)if(h=e.shared.pending,null===h)break;else r=h,h=r.next,r.next=null,e.lastBaseUpdate=r,e.shared.pending=null}while(1);null===m&&(k=q);e.baseState=k;e.firstBaseUpdate=l;e.lastBaseUpdate=m;b=e.shared.interleaved;if(null!==b){e=b;do g|=e.lane,e=e.next;while(e!==b)}else null===f&&(e.shared.lanes=0);rh|=g;a.lanes=g;a.memoizedState=q}}
function sh(a,b,c){a=b.effects;b.effects=null;if(null!==a)for(b=0;b<a.length;b++){var d=a[b],e=d.callback;if(null!==e){d.callback=null;d=c;if("function"!==typeof e)throw Error(p(191,e));e.call(d)}}}var th={},uh=Uf(th),vh=Uf(th),wh=Uf(th);function xh(a){if(a===th)throw Error(p(174));return a}
function yh(a,b){G(wh,b);G(vh,a);G(uh,th);a=b.nodeType;switch(a){case 9:case 11:b=(b=b.documentElement)?b.namespaceURI:lb(null,"");break;default:a=8===a?b.parentNode:b,b=a.namespaceURI||null,a=a.tagName,b=lb(b,a)}E(uh);G(uh,b)}function zh(){E(uh);E(vh);E(wh)}function Ah(a){xh(wh.current);var b=xh(uh.current);var c=lb(b,a.type);b!==c&&(G(vh,a),G(uh,c))}function Bh(a){vh.current===a&&(E(uh),E(vh))}var L=Uf(0);
function Ch(a){for(var b=a;null!==b;){if(13===b.tag){var c=b.memoizedState;if(null!==c&&(c=c.dehydrated,null===c||"$?"===c.data||"$!"===c.data))return b}else if(19===b.tag&&void 0!==b.memoizedProps.revealOrder){if(0!==(b.flags&128))return b}else if(null!==b.child){b.child.return=b;b=b.child;continue}if(b===a)break;for(;null===b.sibling;){if(null===b.return||b.return===a)return null;b=b.return}b.sibling.return=b.return;b=b.sibling}return null}var Dh=[];
function Eh(){for(var a=0;a<Dh.length;a++)Dh[a]._workInProgressVersionPrimary=null;Dh.length=0}var Fh=ua.ReactCurrentDispatcher,Gh=ua.ReactCurrentBatchConfig,Hh=0,M=null,N=null,O=null,Ih=!1,Jh=!1,Kh=0,Lh=0;function P(){throw Error(p(321));}function Mh(a,b){if(null===b)return!1;for(var c=0;c<b.length&&c<a.length;c++)if(!He(a[c],b[c]))return!1;return!0}
function Nh(a,b,c,d,e,f){Hh=f;M=b;b.memoizedState=null;b.updateQueue=null;b.lanes=0;Fh.current=null===a||null===a.memoizedState?Oh:Ph;a=c(d,e);if(Jh){f=0;do{Jh=!1;Kh=0;if(25<=f)throw Error(p(301));f+=1;O=N=null;b.updateQueue=null;Fh.current=Qh;a=c(d,e)}while(Jh)}Fh.current=Rh;b=null!==N&&null!==N.next;Hh=0;O=N=M=null;Ih=!1;if(b)throw Error(p(300));return a}function Sh(){var a=0!==Kh;Kh=0;return a}
function Th(){var a={memoizedState:null,baseState:null,baseQueue:null,queue:null,next:null};null===O?M.memoizedState=O=a:O=O.next=a;return O}function Uh(){if(null===N){var a=M.alternate;a=null!==a?a.memoizedState:null}else a=N.next;var b=null===O?M.memoizedState:O.next;if(null!==b)O=b,N=a;else{if(null===a)throw Error(p(310));N=a;a={memoizedState:N.memoizedState,baseState:N.baseState,baseQueue:N.baseQueue,queue:N.queue,next:null};null===O?M.memoizedState=O=a:O=O.next=a}return O}
function Vh(a,b){return"function"===typeof b?b(a):b}
function Wh(a){var b=Uh(),c=b.queue;if(null===c)throw Error(p(311));c.lastRenderedReducer=a;var d=N,e=d.baseQueue,f=c.pending;if(null!==f){if(null!==e){var g=e.next;e.next=f.next;f.next=g}d.baseQueue=e=f;c.pending=null}if(null!==e){f=e.next;d=d.baseState;var h=g=null,k=null,l=f;do{var m=l.lane;if((Hh&m)===m)null!==k&&(k=k.next={lane:0,action:l.action,hasEagerState:l.hasEagerState,eagerState:l.eagerState,next:null}),d=l.hasEagerState?l.eagerState:a(d,l.action);else{var q={lane:m,action:l.action,hasEagerState:l.hasEagerState,
eagerState:l.eagerState,next:null};null===k?(h=k=q,g=d):k=k.next=q;M.lanes|=m;rh|=m}l=l.next}while(null!==l&&l!==f);null===k?g=d:k.next=h;He(d,b.memoizedState)||(dh=!0);b.memoizedState=d;b.baseState=g;b.baseQueue=k;c.lastRenderedState=d}a=c.interleaved;if(null!==a){e=a;do f=e.lane,M.lanes|=f,rh|=f,e=e.next;while(e!==a)}else null===e&&(c.lanes=0);return[b.memoizedState,c.dispatch]}
function Xh(a){var b=Uh(),c=b.queue;if(null===c)throw Error(p(311));c.lastRenderedReducer=a;var d=c.dispatch,e=c.pending,f=b.memoizedState;if(null!==e){c.pending=null;var g=e=e.next;do f=a(f,g.action),g=g.next;while(g!==e);He(f,b.memoizedState)||(dh=!0);b.memoizedState=f;null===b.baseQueue&&(b.baseState=f);c.lastRenderedState=f}return[f,d]}function Yh(){}
function Zh(a,b){var c=M,d=Uh(),e=b(),f=!He(d.memoizedState,e);f&&(d.memoizedState=e,dh=!0);d=d.queue;$h(ai.bind(null,c,d,a),[a]);if(d.getSnapshot!==b||f||null!==O&&O.memoizedState.tag&1){c.flags|=2048;bi(9,ci.bind(null,c,d,e,b),void 0,null);if(null===Q)throw Error(p(349));0!==(Hh&30)||di(c,b,e)}return e}function di(a,b,c){a.flags|=16384;a={getSnapshot:b,value:c};b=M.updateQueue;null===b?(b={lastEffect:null,stores:null},M.updateQueue=b,b.stores=[a]):(c=b.stores,null===c?b.stores=[a]:c.push(a))}
function ci(a,b,c,d){b.value=c;b.getSnapshot=d;ei(b)&&fi(a)}function ai(a,b,c){return c(function(){ei(b)&&fi(a)})}function ei(a){var b=a.getSnapshot;a=a.value;try{var c=b();return!He(a,c)}catch(d){return!0}}function fi(a){var b=ih(a,1);null!==b&&gi(b,a,1,-1)}
function hi(a){var b=Th();"function"===typeof a&&(a=a());b.memoizedState=b.baseState=a;a={pending:null,interleaved:null,lanes:0,dispatch:null,lastRenderedReducer:Vh,lastRenderedState:a};b.queue=a;a=a.dispatch=ii.bind(null,M,a);return[b.memoizedState,a]}
function bi(a,b,c,d){a={tag:a,create:b,destroy:c,deps:d,next:null};b=M.updateQueue;null===b?(b={lastEffect:null,stores:null},M.updateQueue=b,b.lastEffect=a.next=a):(c=b.lastEffect,null===c?b.lastEffect=a.next=a:(d=c.next,c.next=a,a.next=d,b.lastEffect=a));return a}function ji(){return Uh().memoizedState}function ki(a,b,c,d){var e=Th();M.flags|=a;e.memoizedState=bi(1|b,c,void 0,void 0===d?null:d)}
function li(a,b,c,d){var e=Uh();d=void 0===d?null:d;var f=void 0;if(null!==N){var g=N.memoizedState;f=g.destroy;if(null!==d&&Mh(d,g.deps)){e.memoizedState=bi(b,c,f,d);return}}M.flags|=a;e.memoizedState=bi(1|b,c,f,d)}function mi(a,b){return ki(8390656,8,a,b)}function $h(a,b){return li(2048,8,a,b)}function ni(a,b){return li(4,2,a,b)}function oi(a,b){return li(4,4,a,b)}
function pi(a,b){if("function"===typeof b)return a=a(),b(a),function(){b(null)};if(null!==b&&void 0!==b)return a=a(),b.current=a,function(){b.current=null}}function qi(a,b,c){c=null!==c&&void 0!==c?c.concat([a]):null;return li(4,4,pi.bind(null,b,a),c)}function ri(){}function si(a,b){var c=Uh();b=void 0===b?null:b;var d=c.memoizedState;if(null!==d&&null!==b&&Mh(b,d[1]))return d[0];c.memoizedState=[a,b];return a}
function ti(a,b){var c=Uh();b=void 0===b?null:b;var d=c.memoizedState;if(null!==d&&null!==b&&Mh(b,d[1]))return d[0];a=a();c.memoizedState=[a,b];return a}function ui(a,b,c){if(0===(Hh&21))return a.baseState&&(a.baseState=!1,dh=!0),a.memoizedState=c;He(c,b)||(c=yc(),M.lanes|=c,rh|=c,a.baseState=!0);return b}function vi(a,b){var c=C;C=0!==c&&4>c?c:4;a(!0);var d=Gh.transition;Gh.transition={};try{a(!1),b()}finally{C=c,Gh.transition=d}}function wi(){return Uh().memoizedState}
function xi(a,b,c){var d=yi(a);c={lane:d,action:c,hasEagerState:!1,eagerState:null,next:null};if(zi(a))Ai(b,c);else if(c=hh(a,b,c,d),null!==c){var e=R();gi(c,a,d,e);Bi(c,b,d)}}
function ii(a,b,c){var d=yi(a),e={lane:d,action:c,hasEagerState:!1,eagerState:null,next:null};if(zi(a))Ai(b,e);else{var f=a.alternate;if(0===a.lanes&&(null===f||0===f.lanes)&&(f=b.lastRenderedReducer,null!==f))try{var g=b.lastRenderedState,h=f(g,c);e.hasEagerState=!0;e.eagerState=h;if(He(h,g)){var k=b.interleaved;null===k?(e.next=e,gh(b)):(e.next=k.next,k.next=e);b.interleaved=e;return}}catch(l){}finally{}c=hh(a,b,e,d);null!==c&&(e=R(),gi(c,a,d,e),Bi(c,b,d))}}
function zi(a){var b=a.alternate;return a===M||null!==b&&b===M}function Ai(a,b){Jh=Ih=!0;var c=a.pending;null===c?b.next=b:(b.next=c.next,c.next=b);a.pending=b}function Bi(a,b,c){if(0!==(c&4194240)){var d=b.lanes;d&=a.pendingLanes;c|=d;b.lanes=c;Cc(a,c)}}
var Rh={readContext:eh,useCallback:P,useContext:P,useEffect:P,useImperativeHandle:P,useInsertionEffect:P,useLayoutEffect:P,useMemo:P,useReducer:P,useRef:P,useState:P,useDebugValue:P,useDeferredValue:P,useTransition:P,useMutableSource:P,useSyncExternalStore:P,useId:P,unstable_isNewReconciler:!1},Oh={readContext:eh,useCallback:function(a,b){Th().memoizedState=[a,void 0===b?null:b];return a},useContext:eh,useEffect:mi,useImperativeHandle:function(a,b,c){c=null!==c&&void 0!==c?c.concat([a]):null;return ki(4194308,
4,pi.bind(null,b,a),c)},useLayoutEffect:function(a,b){return ki(4194308,4,a,b)},useInsertionEffect:function(a,b){return ki(4,2,a,b)},useMemo:function(a,b){var c=Th();b=void 0===b?null:b;a=a();c.memoizedState=[a,b];return a},useReducer:function(a,b,c){var d=Th();b=void 0!==c?c(b):b;d.memoizedState=d.baseState=b;a={pending:null,interleaved:null,lanes:0,dispatch:null,lastRenderedReducer:a,lastRenderedState:b};d.queue=a;a=a.dispatch=xi.bind(null,M,a);return[d.memoizedState,a]},useRef:function(a){var b=
Th();a={current:a};return b.memoizedState=a},useState:hi,useDebugValue:ri,useDeferredValue:function(a){return Th().memoizedState=a},useTransition:function(){var a=hi(!1),b=a[0];a=vi.bind(null,a[1]);Th().memoizedState=a;return[b,a]},useMutableSource:function(){},useSyncExternalStore:function(a,b,c){var d=M,e=Th();if(I){if(void 0===c)throw Error(p(407));c=c()}else{c=b();if(null===Q)throw Error(p(349));0!==(Hh&30)||di(d,b,c)}e.memoizedState=c;var f={value:c,getSnapshot:b};e.queue=f;mi(ai.bind(null,d,
f,a),[a]);d.flags|=2048;bi(9,ci.bind(null,d,f,c,b),void 0,null);return c},useId:function(){var a=Th(),b=Q.identifierPrefix;if(I){var c=sg;var d=rg;c=(d&~(1<<32-oc(d)-1)).toString(32)+c;b=":"+b+"R"+c;c=Kh++;0<c&&(b+="H"+c.toString(32));b+=":"}else c=Lh++,b=":"+b+"r"+c.toString(32)+":";return a.memoizedState=b},unstable_isNewReconciler:!1},Ph={readContext:eh,useCallback:si,useContext:eh,useEffect:$h,useImperativeHandle:qi,useInsertionEffect:ni,useLayoutEffect:oi,useMemo:ti,useReducer:Wh,useRef:ji,useState:function(){return Wh(Vh)},
useDebugValue:ri,useDeferredValue:function(a){var b=Uh();return ui(b,N.memoizedState,a)},useTransition:function(){var a=Wh(Vh)[0],b=Uh().memoizedState;return[a,b]},useMutableSource:Yh,useSyncExternalStore:Zh,useId:wi,unstable_isNewReconciler:!1},Qh={readContext:eh,useCallback:si,useContext:eh,useEffect:$h,useImperativeHandle:qi,useInsertionEffect:ni,useLayoutEffect:oi,useMemo:ti,useReducer:Xh,useRef:ji,useState:function(){return Xh(Vh)},useDebugValue:ri,useDeferredValue:function(a){var b=Uh();return null===
N?b.memoizedState=a:ui(b,N.memoizedState,a)},useTransition:function(){var a=Xh(Vh)[0],b=Uh().memoizedState;return[a,b]},useMutableSource:Yh,useSyncExternalStore:Zh,useId:wi,unstable_isNewReconciler:!1};function Ci(a,b){if(a&&a.defaultProps){b=A({},b);a=a.defaultProps;for(var c in a)void 0===b[c]&&(b[c]=a[c]);return b}return b}function Di(a,b,c,d){b=a.memoizedState;c=c(d,b);c=null===c||void 0===c?b:A({},b,c);a.memoizedState=c;0===a.lanes&&(a.updateQueue.baseState=c)}
var Ei={isMounted:function(a){return(a=a._reactInternals)?Vb(a)===a:!1},enqueueSetState:function(a,b,c){a=a._reactInternals;var d=R(),e=yi(a),f=mh(d,e);f.payload=b;void 0!==c&&null!==c&&(f.callback=c);b=nh(a,f,e);null!==b&&(gi(b,a,e,d),oh(b,a,e))},enqueueReplaceState:function(a,b,c){a=a._reactInternals;var d=R(),e=yi(a),f=mh(d,e);f.tag=1;f.payload=b;void 0!==c&&null!==c&&(f.callback=c);b=nh(a,f,e);null!==b&&(gi(b,a,e,d),oh(b,a,e))},enqueueForceUpdate:function(a,b){a=a._reactInternals;var c=R(),d=
yi(a),e=mh(c,d);e.tag=2;void 0!==b&&null!==b&&(e.callback=b);b=nh(a,e,d);null!==b&&(gi(b,a,d,c),oh(b,a,d))}};function Fi(a,b,c,d,e,f,g){a=a.stateNode;return"function"===typeof a.shouldComponentUpdate?a.shouldComponentUpdate(d,f,g):b.prototype&&b.prototype.isPureReactComponent?!Ie(c,d)||!Ie(e,f):!0}
function Gi(a,b,c){var d=!1,e=Vf;var f=b.contextType;"object"===typeof f&&null!==f?f=eh(f):(e=Zf(b)?Xf:H.current,d=b.contextTypes,f=(d=null!==d&&void 0!==d)?Yf(a,e):Vf);b=new b(c,f);a.memoizedState=null!==b.state&&void 0!==b.state?b.state:null;b.updater=Ei;a.stateNode=b;b._reactInternals=a;d&&(a=a.stateNode,a.__reactInternalMemoizedUnmaskedChildContext=e,a.__reactInternalMemoizedMaskedChildContext=f);return b}
function Hi(a,b,c,d){a=b.state;"function"===typeof b.componentWillReceiveProps&&b.componentWillReceiveProps(c,d);"function"===typeof b.UNSAFE_componentWillReceiveProps&&b.UNSAFE_componentWillReceiveProps(c,d);b.state!==a&&Ei.enqueueReplaceState(b,b.state,null)}
function Ii(a,b,c,d){var e=a.stateNode;e.props=c;e.state=a.memoizedState;e.refs={};kh(a);var f=b.contextType;"object"===typeof f&&null!==f?e.context=eh(f):(f=Zf(b)?Xf:H.current,e.context=Yf(a,f));e.state=a.memoizedState;f=b.getDerivedStateFromProps;"function"===typeof f&&(Di(a,b,f,c),e.state=a.memoizedState);"function"===typeof b.getDerivedStateFromProps||"function"===typeof e.getSnapshotBeforeUpdate||"function"!==typeof e.UNSAFE_componentWillMount&&"function"!==typeof e.componentWillMount||(b=e.state,
"function"===typeof e.componentWillMount&&e.componentWillMount(),"function"===typeof e.UNSAFE_componentWillMount&&e.UNSAFE_componentWillMount(),b!==e.state&&Ei.enqueueReplaceState(e,e.state,null),qh(a,c,e,d),e.state=a.memoizedState);"function"===typeof e.componentDidMount&&(a.flags|=4194308)}function Ji(a,b){try{var c="",d=b;do c+=Pa(d),d=d.return;while(d);var e=c}catch(f){e="\nError generating stack: "+f.message+"\n"+f.stack}return{value:a,source:b,stack:e,digest:null}}
function Ki(a,b,c){return{value:a,source:null,stack:null!=c?c:null,digest:null!=b?b:null}}function Li(a,b){try{console.error(b.value)}catch(c){setTimeout(function(){throw c;})}}var Mi="function"===typeof WeakMap?WeakMap:Map;function Ni(a,b,c){c=mh(-1,c);c.tag=3;c.payload={element:null};var d=b.value;c.callback=function(){Oi||(Oi=!0,Pi=d);Li(a,b)};return c}
function Qi(a,b,c){c=mh(-1,c);c.tag=3;var d=a.type.getDerivedStateFromError;if("function"===typeof d){var e=b.value;c.payload=function(){return d(e)};c.callback=function(){Li(a,b)}}var f=a.stateNode;null!==f&&"function"===typeof f.componentDidCatch&&(c.callback=function(){Li(a,b);"function"!==typeof d&&(null===Ri?Ri=new Set([this]):Ri.add(this));var c=b.stack;this.componentDidCatch(b.value,{componentStack:null!==c?c:""})});return c}
function Si(a,b,c){var d=a.pingCache;if(null===d){d=a.pingCache=new Mi;var e=new Set;d.set(b,e)}else e=d.get(b),void 0===e&&(e=new Set,d.set(b,e));e.has(c)||(e.add(c),a=Ti.bind(null,a,b,c),b.then(a,a))}function Ui(a){do{var b;if(b=13===a.tag)b=a.memoizedState,b=null!==b?null!==b.dehydrated?!0:!1:!0;if(b)return a;a=a.return}while(null!==a);return null}
function Vi(a,b,c,d,e){if(0===(a.mode&1))return a===b?a.flags|=65536:(a.flags|=128,c.flags|=131072,c.flags&=-52805,1===c.tag&&(null===c.alternate?c.tag=17:(b=mh(-1,1),b.tag=2,nh(c,b,1))),c.lanes|=1),a;a.flags|=65536;a.lanes=e;return a}var Wi=ua.ReactCurrentOwner,dh=!1;function Xi(a,b,c,d){b.child=null===a?Vg(b,null,c,d):Ug(b,a.child,c,d)}
function Yi(a,b,c,d,e){c=c.render;var f=b.ref;ch(b,e);d=Nh(a,b,c,d,f,e);c=Sh();if(null!==a&&!dh)return b.updateQueue=a.updateQueue,b.flags&=-2053,a.lanes&=~e,Zi(a,b,e);I&&c&&vg(b);b.flags|=1;Xi(a,b,d,e);return b.child}
function $i(a,b,c,d,e){if(null===a){var f=c.type;if("function"===typeof f&&!aj(f)&&void 0===f.defaultProps&&null===c.compare&&void 0===c.defaultProps)return b.tag=15,b.type=f,bj(a,b,f,d,e);a=Rg(c.type,null,d,b,b.mode,e);a.ref=b.ref;a.return=b;return b.child=a}f=a.child;if(0===(a.lanes&e)){var g=f.memoizedProps;c=c.compare;c=null!==c?c:Ie;if(c(g,d)&&a.ref===b.ref)return Zi(a,b,e)}b.flags|=1;a=Pg(f,d);a.ref=b.ref;a.return=b;return b.child=a}
function bj(a,b,c,d,e){if(null!==a){var f=a.memoizedProps;if(Ie(f,d)&&a.ref===b.ref)if(dh=!1,b.pendingProps=d=f,0!==(a.lanes&e))0!==(a.flags&131072)&&(dh=!0);else return b.lanes=a.lanes,Zi(a,b,e)}return cj(a,b,c,d,e)}
function dj(a,b,c){var d=b.pendingProps,e=d.children,f=null!==a?a.memoizedState:null;if("hidden"===d.mode)if(0===(b.mode&1))b.memoizedState={baseLanes:0,cachePool:null,transitions:null},G(ej,fj),fj|=c;else{if(0===(c&1073741824))return a=null!==f?f.baseLanes|c:c,b.lanes=b.childLanes=1073741824,b.memoizedState={baseLanes:a,cachePool:null,transitions:null},b.updateQueue=null,G(ej,fj),fj|=a,null;b.memoizedState={baseLanes:0,cachePool:null,transitions:null};d=null!==f?f.baseLanes:c;G(ej,fj);fj|=d}else null!==
f?(d=f.baseLanes|c,b.memoizedState=null):d=c,G(ej,fj),fj|=d;Xi(a,b,e,c);return b.child}function gj(a,b){var c=b.ref;if(null===a&&null!==c||null!==a&&a.ref!==c)b.flags|=512,b.flags|=2097152}function cj(a,b,c,d,e){var f=Zf(c)?Xf:H.current;f=Yf(b,f);ch(b,e);c=Nh(a,b,c,d,f,e);d=Sh();if(null!==a&&!dh)return b.updateQueue=a.updateQueue,b.flags&=-2053,a.lanes&=~e,Zi(a,b,e);I&&d&&vg(b);b.flags|=1;Xi(a,b,c,e);return b.child}
function hj(a,b,c,d,e){if(Zf(c)){var f=!0;cg(b)}else f=!1;ch(b,e);if(null===b.stateNode)ij(a,b),Gi(b,c,d),Ii(b,c,d,e),d=!0;else if(null===a){var g=b.stateNode,h=b.memoizedProps;g.props=h;var k=g.context,l=c.contextType;"object"===typeof l&&null!==l?l=eh(l):(l=Zf(c)?Xf:H.current,l=Yf(b,l));var m=c.getDerivedStateFromProps,q="function"===typeof m||"function"===typeof g.getSnapshotBeforeUpdate;q||"function"!==typeof g.UNSAFE_componentWillReceiveProps&&"function"!==typeof g.componentWillReceiveProps||
(h!==d||k!==l)&&Hi(b,g,d,l);jh=!1;var r=b.memoizedState;g.state=r;qh(b,d,g,e);k=b.memoizedState;h!==d||r!==k||Wf.current||jh?("function"===typeof m&&(Di(b,c,m,d),k=b.memoizedState),(h=jh||Fi(b,c,h,d,r,k,l))?(q||"function"!==typeof g.UNSAFE_componentWillMount&&"function"!==typeof g.componentWillMount||("function"===typeof g.componentWillMount&&g.componentWillMount(),"function"===typeof g.UNSAFE_componentWillMount&&g.UNSAFE_componentWillMount()),"function"===typeof g.componentDidMount&&(b.flags|=4194308)):
("function"===typeof g.componentDidMount&&(b.flags|=4194308),b.memoizedProps=d,b.memoizedState=k),g.props=d,g.state=k,g.context=l,d=h):("function"===typeof g.componentDidMount&&(b.flags|=4194308),d=!1)}else{g=b.stateNode;lh(a,b);h=b.memoizedProps;l=b.type===b.elementType?h:Ci(b.type,h);g.props=l;q=b.pendingProps;r=g.context;k=c.contextType;"object"===typeof k&&null!==k?k=eh(k):(k=Zf(c)?Xf:H.current,k=Yf(b,k));var y=c.getDerivedStateFromProps;(m="function"===typeof y||"function"===typeof g.getSnapshotBeforeUpdate)||
"function"!==typeof g.UNSAFE_componentWillReceiveProps&&"function"!==typeof g.componentWillReceiveProps||(h!==q||r!==k)&&Hi(b,g,d,k);jh=!1;r=b.memoizedState;g.state=r;qh(b,d,g,e);var n=b.memoizedState;h!==q||r!==n||Wf.current||jh?("function"===typeof y&&(Di(b,c,y,d),n=b.memoizedState),(l=jh||Fi(b,c,l,d,r,n,k)||!1)?(m||"function"!==typeof g.UNSAFE_componentWillUpdate&&"function"!==typeof g.componentWillUpdate||("function"===typeof g.componentWillUpdate&&g.componentWillUpdate(d,n,k),"function"===typeof g.UNSAFE_componentWillUpdate&&
g.UNSAFE_componentWillUpdate(d,n,k)),"function"===typeof g.componentDidUpdate&&(b.flags|=4),"function"===typeof g.getSnapshotBeforeUpdate&&(b.flags|=1024)):("function"!==typeof g.componentDidUpdate||h===a.memoizedProps&&r===a.memoizedState||(b.flags|=4),"function"!==typeof g.getSnapshotBeforeUpdate||h===a.memoizedProps&&r===a.memoizedState||(b.flags|=1024),b.memoizedProps=d,b.memoizedState=n),g.props=d,g.state=n,g.context=k,d=l):("function"!==typeof g.componentDidUpdate||h===a.memoizedProps&&r===
a.memoizedState||(b.flags|=4),"function"!==typeof g.getSnapshotBeforeUpdate||h===a.memoizedProps&&r===a.memoizedState||(b.flags|=1024),d=!1)}return jj(a,b,c,d,f,e)}
function jj(a,b,c,d,e,f){gj(a,b);var g=0!==(b.flags&128);if(!d&&!g)return e&&dg(b,c,!1),Zi(a,b,f);d=b.stateNode;Wi.current=b;var h=g&&"function"!==typeof c.getDerivedStateFromError?null:d.render();b.flags|=1;null!==a&&g?(b.child=Ug(b,a.child,null,f),b.child=Ug(b,null,h,f)):Xi(a,b,h,f);b.memoizedState=d.state;e&&dg(b,c,!0);return b.child}function kj(a){var b=a.stateNode;b.pendingContext?ag(a,b.pendingContext,b.pendingContext!==b.context):b.context&&ag(a,b.context,!1);yh(a,b.containerInfo)}
function lj(a,b,c,d,e){Ig();Jg(e);b.flags|=256;Xi(a,b,c,d);return b.child}var mj={dehydrated:null,treeContext:null,retryLane:0};function nj(a){return{baseLanes:a,cachePool:null,transitions:null}}
function oj(a,b,c){var d=b.pendingProps,e=L.current,f=!1,g=0!==(b.flags&128),h;(h=g)||(h=null!==a&&null===a.memoizedState?!1:0!==(e&2));if(h)f=!0,b.flags&=-129;else if(null===a||null!==a.memoizedState)e|=1;G(L,e&1);if(null===a){Eg(b);a=b.memoizedState;if(null!==a&&(a=a.dehydrated,null!==a))return 0===(b.mode&1)?b.lanes=1:"$!"===a.data?b.lanes=8:b.lanes=1073741824,null;g=d.children;a=d.fallback;return f?(d=b.mode,f=b.child,g={mode:"hidden",children:g},0===(d&1)&&null!==f?(f.childLanes=0,f.pendingProps=
g):f=pj(g,d,0,null),a=Tg(a,d,c,null),f.return=b,a.return=b,f.sibling=a,b.child=f,b.child.memoizedState=nj(c),b.memoizedState=mj,a):qj(b,g)}e=a.memoizedState;if(null!==e&&(h=e.dehydrated,null!==h))return rj(a,b,g,d,h,e,c);if(f){f=d.fallback;g=b.mode;e=a.child;h=e.sibling;var k={mode:"hidden",children:d.children};0===(g&1)&&b.child!==e?(d=b.child,d.childLanes=0,d.pendingProps=k,b.deletions=null):(d=Pg(e,k),d.subtreeFlags=e.subtreeFlags&14680064);null!==h?f=Pg(h,f):(f=Tg(f,g,c,null),f.flags|=2);f.return=
b;d.return=b;d.sibling=f;b.child=d;d=f;f=b.child;g=a.child.memoizedState;g=null===g?nj(c):{baseLanes:g.baseLanes|c,cachePool:null,transitions:g.transitions};f.memoizedState=g;f.childLanes=a.childLanes&~c;b.memoizedState=mj;return d}f=a.child;a=f.sibling;d=Pg(f,{mode:"visible",children:d.children});0===(b.mode&1)&&(d.lanes=c);d.return=b;d.sibling=null;null!==a&&(c=b.deletions,null===c?(b.deletions=[a],b.flags|=16):c.push(a));b.child=d;b.memoizedState=null;return d}
function qj(a,b){b=pj({mode:"visible",children:b},a.mode,0,null);b.return=a;return a.child=b}function sj(a,b,c,d){null!==d&&Jg(d);Ug(b,a.child,null,c);a=qj(b,b.pendingProps.children);a.flags|=2;b.memoizedState=null;return a}
function rj(a,b,c,d,e,f,g){if(c){if(b.flags&256)return b.flags&=-257,d=Ki(Error(p(422))),sj(a,b,g,d);if(null!==b.memoizedState)return b.child=a.child,b.flags|=128,null;f=d.fallback;e=b.mode;d=pj({mode:"visible",children:d.children},e,0,null);f=Tg(f,e,g,null);f.flags|=2;d.return=b;f.return=b;d.sibling=f;b.child=d;0!==(b.mode&1)&&Ug(b,a.child,null,g);b.child.memoizedState=nj(g);b.memoizedState=mj;return f}if(0===(b.mode&1))return sj(a,b,g,null);if("$!"===e.data){d=e.nextSibling&&e.nextSibling.dataset;
if(d)var h=d.dgst;d=h;f=Error(p(419));d=Ki(f,d,void 0);return sj(a,b,g,d)}h=0!==(g&a.childLanes);if(dh||h){d=Q;if(null!==d){switch(g&-g){case 4:e=2;break;case 16:e=8;break;case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:e=32;break;case 536870912:e=268435456;break;default:e=0}e=0!==(e&(d.suspendedLanes|g))?0:e;
0!==e&&e!==f.retryLane&&(f.retryLane=e,ih(a,e),gi(d,a,e,-1))}tj();d=Ki(Error(p(421)));return sj(a,b,g,d)}if("$?"===e.data)return b.flags|=128,b.child=a.child,b=uj.bind(null,a),e._reactRetry=b,null;a=f.treeContext;yg=Lf(e.nextSibling);xg=b;I=!0;zg=null;null!==a&&(og[pg++]=rg,og[pg++]=sg,og[pg++]=qg,rg=a.id,sg=a.overflow,qg=b);b=qj(b,d.children);b.flags|=4096;return b}function vj(a,b,c){a.lanes|=b;var d=a.alternate;null!==d&&(d.lanes|=b);bh(a.return,b,c)}
function wj(a,b,c,d,e){var f=a.memoizedState;null===f?a.memoizedState={isBackwards:b,rendering:null,renderingStartTime:0,last:d,tail:c,tailMode:e}:(f.isBackwards=b,f.rendering=null,f.renderingStartTime=0,f.last=d,f.tail=c,f.tailMode=e)}
function xj(a,b,c){var d=b.pendingProps,e=d.revealOrder,f=d.tail;Xi(a,b,d.children,c);d=L.current;if(0!==(d&2))d=d&1|2,b.flags|=128;else{if(null!==a&&0!==(a.flags&128))a:for(a=b.child;null!==a;){if(13===a.tag)null!==a.memoizedState&&vj(a,c,b);else if(19===a.tag)vj(a,c,b);else if(null!==a.child){a.child.return=a;a=a.child;continue}if(a===b)break a;for(;null===a.sibling;){if(null===a.return||a.return===b)break a;a=a.return}a.sibling.return=a.return;a=a.sibling}d&=1}G(L,d);if(0===(b.mode&1))b.memoizedState=
null;else switch(e){case "forwards":c=b.child;for(e=null;null!==c;)a=c.alternate,null!==a&&null===Ch(a)&&(e=c),c=c.sibling;c=e;null===c?(e=b.child,b.child=null):(e=c.sibling,c.sibling=null);wj(b,!1,e,c,f);break;case "backwards":c=null;e=b.child;for(b.child=null;null!==e;){a=e.alternate;if(null!==a&&null===Ch(a)){b.child=e;break}a=e.sibling;e.sibling=c;c=e;e=a}wj(b,!0,c,null,f);break;case "together":wj(b,!1,null,null,void 0);break;default:b.memoizedState=null}return b.child}
function ij(a,b){0===(b.mode&1)&&null!==a&&(a.alternate=null,b.alternate=null,b.flags|=2)}function Zi(a,b,c){null!==a&&(b.dependencies=a.dependencies);rh|=b.lanes;if(0===(c&b.childLanes))return null;if(null!==a&&b.child!==a.child)throw Error(p(153));if(null!==b.child){a=b.child;c=Pg(a,a.pendingProps);b.child=c;for(c.return=b;null!==a.sibling;)a=a.sibling,c=c.sibling=Pg(a,a.pendingProps),c.return=b;c.sibling=null}return b.child}
function yj(a,b,c){switch(b.tag){case 3:kj(b);Ig();break;case 5:Ah(b);break;case 1:Zf(b.type)&&cg(b);break;case 4:yh(b,b.stateNode.containerInfo);break;case 10:var d=b.type._context,e=b.memoizedProps.value;G(Wg,d._currentValue);d._currentValue=e;break;case 13:d=b.memoizedState;if(null!==d){if(null!==d.dehydrated)return G(L,L.current&1),b.flags|=128,null;if(0!==(c&b.child.childLanes))return oj(a,b,c);G(L,L.current&1);a=Zi(a,b,c);return null!==a?a.sibling:null}G(L,L.current&1);break;case 19:d=0!==(c&
b.childLanes);if(0!==(a.flags&128)){if(d)return xj(a,b,c);b.flags|=128}e=b.memoizedState;null!==e&&(e.rendering=null,e.tail=null,e.lastEffect=null);G(L,L.current);if(d)break;else return null;case 22:case 23:return b.lanes=0,dj(a,b,c)}return Zi(a,b,c)}var zj,Aj,Bj,Cj;
zj=function(a,b){for(var c=b.child;null!==c;){if(5===c.tag||6===c.tag)a.appendChild(c.stateNode);else if(4!==c.tag&&null!==c.child){c.child.return=c;c=c.child;continue}if(c===b)break;for(;null===c.sibling;){if(null===c.return||c.return===b)return;c=c.return}c.sibling.return=c.return;c=c.sibling}};Aj=function(){};
Bj=function(a,b,c,d){var e=a.memoizedProps;if(e!==d){a=b.stateNode;xh(uh.current);var f=null;switch(c){case "input":e=Ya(a,e);d=Ya(a,d);f=[];break;case "select":e=A({},e,{value:void 0});d=A({},d,{value:void 0});f=[];break;case "textarea":e=gb(a,e);d=gb(a,d);f=[];break;default:"function"!==typeof e.onClick&&"function"===typeof d.onClick&&(a.onclick=Bf)}ub(c,d);var g;c=null;for(l in e)if(!d.hasOwnProperty(l)&&e.hasOwnProperty(l)&&null!=e[l])if("style"===l){var h=e[l];for(g in h)h.hasOwnProperty(g)&&
(c||(c={}),c[g]="")}else"dangerouslySetInnerHTML"!==l&&"children"!==l&&"suppressContentEditableWarning"!==l&&"suppressHydrationWarning"!==l&&"autoFocus"!==l&&(ea.hasOwnProperty(l)?f||(f=[]):(f=f||[]).push(l,null));for(l in d){var k=d[l];h=null!=e?e[l]:void 0;if(d.hasOwnProperty(l)&&k!==h&&(null!=k||null!=h))if("style"===l)if(h){for(g in h)!h.hasOwnProperty(g)||k&&k.hasOwnProperty(g)||(c||(c={}),c[g]="");for(g in k)k.hasOwnProperty(g)&&h[g]!==k[g]&&(c||(c={}),c[g]=k[g])}else c||(f||(f=[]),f.push(l,
c)),c=k;else"dangerouslySetInnerHTML"===l?(k=k?k.__html:void 0,h=h?h.__html:void 0,null!=k&&h!==k&&(f=f||[]).push(l,k)):"children"===l?"string"!==typeof k&&"number"!==typeof k||(f=f||[]).push(l,""+k):"suppressContentEditableWarning"!==l&&"suppressHydrationWarning"!==l&&(ea.hasOwnProperty(l)?(null!=k&&"onScroll"===l&&D("scroll",a),f||h===k||(f=[])):(f=f||[]).push(l,k))}c&&(f=f||[]).push("style",c);var l=f;if(b.updateQueue=l)b.flags|=4}};Cj=function(a,b,c,d){c!==d&&(b.flags|=4)};
function Dj(a,b){if(!I)switch(a.tailMode){case "hidden":b=a.tail;for(var c=null;null!==b;)null!==b.alternate&&(c=b),b=b.sibling;null===c?a.tail=null:c.sibling=null;break;case "collapsed":c=a.tail;for(var d=null;null!==c;)null!==c.alternate&&(d=c),c=c.sibling;null===d?b||null===a.tail?a.tail=null:a.tail.sibling=null:d.sibling=null}}
function S(a){var b=null!==a.alternate&&a.alternate.child===a.child,c=0,d=0;if(b)for(var e=a.child;null!==e;)c|=e.lanes|e.childLanes,d|=e.subtreeFlags&14680064,d|=e.flags&14680064,e.return=a,e=e.sibling;else for(e=a.child;null!==e;)c|=e.lanes|e.childLanes,d|=e.subtreeFlags,d|=e.flags,e.return=a,e=e.sibling;a.subtreeFlags|=d;a.childLanes=c;return b}
function Ej(a,b,c){var d=b.pendingProps;wg(b);switch(b.tag){case 2:case 16:case 15:case 0:case 11:case 7:case 8:case 12:case 9:case 14:return S(b),null;case 1:return Zf(b.type)&&$f(),S(b),null;case 3:d=b.stateNode;zh();E(Wf);E(H);Eh();d.pendingContext&&(d.context=d.pendingContext,d.pendingContext=null);if(null===a||null===a.child)Gg(b)?b.flags|=4:null===a||a.memoizedState.isDehydrated&&0===(b.flags&256)||(b.flags|=1024,null!==zg&&(Fj(zg),zg=null));Aj(a,b);S(b);return null;case 5:Bh(b);var e=xh(wh.current);
c=b.type;if(null!==a&&null!=b.stateNode)Bj(a,b,c,d,e),a.ref!==b.ref&&(b.flags|=512,b.flags|=2097152);else{if(!d){if(null===b.stateNode)throw Error(p(166));S(b);return null}a=xh(uh.current);if(Gg(b)){d=b.stateNode;c=b.type;var f=b.memoizedProps;d[Of]=b;d[Pf]=f;a=0!==(b.mode&1);switch(c){case "dialog":D("cancel",d);D("close",d);break;case "iframe":case "object":case "embed":D("load",d);break;case "video":case "audio":for(e=0;e<lf.length;e++)D(lf[e],d);break;case "source":D("error",d);break;case "img":case "image":case "link":D("error",
d);D("load",d);break;case "details":D("toggle",d);break;case "input":Za(d,f);D("invalid",d);break;case "select":d._wrapperState={wasMultiple:!!f.multiple};D("invalid",d);break;case "textarea":hb(d,f),D("invalid",d)}ub(c,f);e=null;for(var g in f)if(f.hasOwnProperty(g)){var h=f[g];"children"===g?"string"===typeof h?d.textContent!==h&&(!0!==f.suppressHydrationWarning&&Af(d.textContent,h,a),e=["children",h]):"number"===typeof h&&d.textContent!==""+h&&(!0!==f.suppressHydrationWarning&&Af(d.textContent,
h,a),e=["children",""+h]):ea.hasOwnProperty(g)&&null!=h&&"onScroll"===g&&D("scroll",d)}switch(c){case "input":Va(d);db(d,f,!0);break;case "textarea":Va(d);jb(d);break;case "select":case "option":break;default:"function"===typeof f.onClick&&(d.onclick=Bf)}d=e;b.updateQueue=d;null!==d&&(b.flags|=4)}else{g=9===e.nodeType?e:e.ownerDocument;"http://www.w3.org/1999/xhtml"===a&&(a=kb(c));"http://www.w3.org/1999/xhtml"===a?"script"===c?(a=g.createElement("div"),a.innerHTML="<script>\x3c/script>",a=a.removeChild(a.firstChild)):
"string"===typeof d.is?a=g.createElement(c,{is:d.is}):(a=g.createElement(c),"select"===c&&(g=a,d.multiple?g.multiple=!0:d.size&&(g.size=d.size))):a=g.createElementNS(a,c);a[Of]=b;a[Pf]=d;zj(a,b,!1,!1);b.stateNode=a;a:{g=vb(c,d);switch(c){case "dialog":D("cancel",a);D("close",a);e=d;break;case "iframe":case "object":case "embed":D("load",a);e=d;break;case "video":case "audio":for(e=0;e<lf.length;e++)D(lf[e],a);e=d;break;case "source":D("error",a);e=d;break;case "img":case "image":case "link":D("error",
a);D("load",a);e=d;break;case "details":D("toggle",a);e=d;break;case "input":Za(a,d);e=Ya(a,d);D("invalid",a);break;case "option":e=d;break;case "select":a._wrapperState={wasMultiple:!!d.multiple};e=A({},d,{value:void 0});D("invalid",a);break;case "textarea":hb(a,d);e=gb(a,d);D("invalid",a);break;default:e=d}ub(c,e);h=e;for(f in h)if(h.hasOwnProperty(f)){var k=h[f];"style"===f?sb(a,k):"dangerouslySetInnerHTML"===f?(k=k?k.__html:void 0,null!=k&&nb(a,k)):"children"===f?"string"===typeof k?("textarea"!==
c||""!==k)&&ob(a,k):"number"===typeof k&&ob(a,""+k):"suppressContentEditableWarning"!==f&&"suppressHydrationWarning"!==f&&"autoFocus"!==f&&(ea.hasOwnProperty(f)?null!=k&&"onScroll"===f&&D("scroll",a):null!=k&&ta(a,f,k,g))}switch(c){case "input":Va(a);db(a,d,!1);break;case "textarea":Va(a);jb(a);break;case "option":null!=d.value&&a.setAttribute("value",""+Sa(d.value));break;case "select":a.multiple=!!d.multiple;f=d.value;null!=f?fb(a,!!d.multiple,f,!1):null!=d.defaultValue&&fb(a,!!d.multiple,d.defaultValue,
!0);break;default:"function"===typeof e.onClick&&(a.onclick=Bf)}switch(c){case "button":case "input":case "select":case "textarea":d=!!d.autoFocus;break a;case "img":d=!0;break a;default:d=!1}}d&&(b.flags|=4)}null!==b.ref&&(b.flags|=512,b.flags|=2097152)}S(b);return null;case 6:if(a&&null!=b.stateNode)Cj(a,b,a.memoizedProps,d);else{if("string"!==typeof d&&null===b.stateNode)throw Error(p(166));c=xh(wh.current);xh(uh.current);if(Gg(b)){d=b.stateNode;c=b.memoizedProps;d[Of]=b;if(f=d.nodeValue!==c)if(a=
xg,null!==a)switch(a.tag){case 3:Af(d.nodeValue,c,0!==(a.mode&1));break;case 5:!0!==a.memoizedProps.suppressHydrationWarning&&Af(d.nodeValue,c,0!==(a.mode&1))}f&&(b.flags|=4)}else d=(9===c.nodeType?c:c.ownerDocument).createTextNode(d),d[Of]=b,b.stateNode=d}S(b);return null;case 13:E(L);d=b.memoizedState;if(null===a||null!==a.memoizedState&&null!==a.memoizedState.dehydrated){if(I&&null!==yg&&0!==(b.mode&1)&&0===(b.flags&128))Hg(),Ig(),b.flags|=98560,f=!1;else if(f=Gg(b),null!==d&&null!==d.dehydrated){if(null===
a){if(!f)throw Error(p(318));f=b.memoizedState;f=null!==f?f.dehydrated:null;if(!f)throw Error(p(317));f[Of]=b}else Ig(),0===(b.flags&128)&&(b.memoizedState=null),b.flags|=4;S(b);f=!1}else null!==zg&&(Fj(zg),zg=null),f=!0;if(!f)return b.flags&65536?b:null}if(0!==(b.flags&128))return b.lanes=c,b;d=null!==d;d!==(null!==a&&null!==a.memoizedState)&&d&&(b.child.flags|=8192,0!==(b.mode&1)&&(null===a||0!==(L.current&1)?0===T&&(T=3):tj()));null!==b.updateQueue&&(b.flags|=4);S(b);return null;case 4:return zh(),
Aj(a,b),null===a&&sf(b.stateNode.containerInfo),S(b),null;case 10:return ah(b.type._context),S(b),null;case 17:return Zf(b.type)&&$f(),S(b),null;case 19:E(L);f=b.memoizedState;if(null===f)return S(b),null;d=0!==(b.flags&128);g=f.rendering;if(null===g)if(d)Dj(f,!1);else{if(0!==T||null!==a&&0!==(a.flags&128))for(a=b.child;null!==a;){g=Ch(a);if(null!==g){b.flags|=128;Dj(f,!1);d=g.updateQueue;null!==d&&(b.updateQueue=d,b.flags|=4);b.subtreeFlags=0;d=c;for(c=b.child;null!==c;)f=c,a=d,f.flags&=14680066,
g=f.alternate,null===g?(f.childLanes=0,f.lanes=a,f.child=null,f.subtreeFlags=0,f.memoizedProps=null,f.memoizedState=null,f.updateQueue=null,f.dependencies=null,f.stateNode=null):(f.childLanes=g.childLanes,f.lanes=g.lanes,f.child=g.child,f.subtreeFlags=0,f.deletions=null,f.memoizedProps=g.memoizedProps,f.memoizedState=g.memoizedState,f.updateQueue=g.updateQueue,f.type=g.type,a=g.dependencies,f.dependencies=null===a?null:{lanes:a.lanes,firstContext:a.firstContext}),c=c.sibling;G(L,L.current&1|2);return b.child}a=
a.sibling}null!==f.tail&&B()>Gj&&(b.flags|=128,d=!0,Dj(f,!1),b.lanes=4194304)}else{if(!d)if(a=Ch(g),null!==a){if(b.flags|=128,d=!0,c=a.updateQueue,null!==c&&(b.updateQueue=c,b.flags|=4),Dj(f,!0),null===f.tail&&"hidden"===f.tailMode&&!g.alternate&&!I)return S(b),null}else 2*B()-f.renderingStartTime>Gj&&1073741824!==c&&(b.flags|=128,d=!0,Dj(f,!1),b.lanes=4194304);f.isBackwards?(g.sibling=b.child,b.child=g):(c=f.last,null!==c?c.sibling=g:b.child=g,f.last=g)}if(null!==f.tail)return b=f.tail,f.rendering=
b,f.tail=b.sibling,f.renderingStartTime=B(),b.sibling=null,c=L.current,G(L,d?c&1|2:c&1),b;S(b);return null;case 22:case 23:return Hj(),d=null!==b.memoizedState,null!==a&&null!==a.memoizedState!==d&&(b.flags|=8192),d&&0!==(b.mode&1)?0!==(fj&1073741824)&&(S(b),b.subtreeFlags&6&&(b.flags|=8192)):S(b),null;case 24:return null;case 25:return null}throw Error(p(156,b.tag));}
function Ij(a,b){wg(b);switch(b.tag){case 1:return Zf(b.type)&&$f(),a=b.flags,a&65536?(b.flags=a&-65537|128,b):null;case 3:return zh(),E(Wf),E(H),Eh(),a=b.flags,0!==(a&65536)&&0===(a&128)?(b.flags=a&-65537|128,b):null;case 5:return Bh(b),null;case 13:E(L);a=b.memoizedState;if(null!==a&&null!==a.dehydrated){if(null===b.alternate)throw Error(p(340));Ig()}a=b.flags;return a&65536?(b.flags=a&-65537|128,b):null;case 19:return E(L),null;case 4:return zh(),null;case 10:return ah(b.type._context),null;case 22:case 23:return Hj(),
null;case 24:return null;default:return null}}var Jj=!1,U=!1,Kj="function"===typeof WeakSet?WeakSet:Set,V=null;function Lj(a,b){var c=a.ref;if(null!==c)if("function"===typeof c)try{c(null)}catch(d){W(a,b,d)}else c.current=null}function Mj(a,b,c){try{c()}catch(d){W(a,b,d)}}var Nj=!1;
function Oj(a,b){Cf=dd;a=Me();if(Ne(a)){if("selectionStart"in a)var c={start:a.selectionStart,end:a.selectionEnd};else a:{c=(c=a.ownerDocument)&&c.defaultView||window;var d=c.getSelection&&c.getSelection();if(d&&0!==d.rangeCount){c=d.anchorNode;var e=d.anchorOffset,f=d.focusNode;d=d.focusOffset;try{c.nodeType,f.nodeType}catch(F){c=null;break a}var g=0,h=-1,k=-1,l=0,m=0,q=a,r=null;b:for(;;){for(var y;;){q!==c||0!==e&&3!==q.nodeType||(h=g+e);q!==f||0!==d&&3!==q.nodeType||(k=g+d);3===q.nodeType&&(g+=
q.nodeValue.length);if(null===(y=q.firstChild))break;r=q;q=y}for(;;){if(q===a)break b;r===c&&++l===e&&(h=g);r===f&&++m===d&&(k=g);if(null!==(y=q.nextSibling))break;q=r;r=q.parentNode}q=y}c=-1===h||-1===k?null:{start:h,end:k}}else c=null}c=c||{start:0,end:0}}else c=null;Df={focusedElem:a,selectionRange:c};dd=!1;for(V=b;null!==V;)if(b=V,a=b.child,0!==(b.subtreeFlags&1028)&&null!==a)a.return=b,V=a;else for(;null!==V;){b=V;try{var n=b.alternate;if(0!==(b.flags&1024))switch(b.tag){case 0:case 11:case 15:break;
case 1:if(null!==n){var t=n.memoizedProps,J=n.memoizedState,x=b.stateNode,w=x.getSnapshotBeforeUpdate(b.elementType===b.type?t:Ci(b.type,t),J);x.__reactInternalSnapshotBeforeUpdate=w}break;case 3:var u=b.stateNode.containerInfo;1===u.nodeType?u.textContent="":9===u.nodeType&&u.documentElement&&u.removeChild(u.documentElement);break;case 5:case 6:case 4:case 17:break;default:throw Error(p(163));}}catch(F){W(b,b.return,F)}a=b.sibling;if(null!==a){a.return=b.return;V=a;break}V=b.return}n=Nj;Nj=!1;return n}
function Pj(a,b,c){var d=b.updateQueue;d=null!==d?d.lastEffect:null;if(null!==d){var e=d=d.next;do{if((e.tag&a)===a){var f=e.destroy;e.destroy=void 0;void 0!==f&&Mj(b,c,f)}e=e.next}while(e!==d)}}function Qj(a,b){b=b.updateQueue;b=null!==b?b.lastEffect:null;if(null!==b){var c=b=b.next;do{if((c.tag&a)===a){var d=c.create;c.destroy=d()}c=c.next}while(c!==b)}}function Rj(a){var b=a.ref;if(null!==b){var c=a.stateNode;switch(a.tag){case 5:a=c;break;default:a=c}"function"===typeof b?b(a):b.current=a}}
function Sj(a){var b=a.alternate;null!==b&&(a.alternate=null,Sj(b));a.child=null;a.deletions=null;a.sibling=null;5===a.tag&&(b=a.stateNode,null!==b&&(delete b[Of],delete b[Pf],delete b[of],delete b[Qf],delete b[Rf]));a.stateNode=null;a.return=null;a.dependencies=null;a.memoizedProps=null;a.memoizedState=null;a.pendingProps=null;a.stateNode=null;a.updateQueue=null}function Tj(a){return 5===a.tag||3===a.tag||4===a.tag}
function Uj(a){a:for(;;){for(;null===a.sibling;){if(null===a.return||Tj(a.return))return null;a=a.return}a.sibling.return=a.return;for(a=a.sibling;5!==a.tag&&6!==a.tag&&18!==a.tag;){if(a.flags&2)continue a;if(null===a.child||4===a.tag)continue a;else a.child.return=a,a=a.child}if(!(a.flags&2))return a.stateNode}}
function Vj(a,b,c){var d=a.tag;if(5===d||6===d)a=a.stateNode,b?8===c.nodeType?c.parentNode.insertBefore(a,b):c.insertBefore(a,b):(8===c.nodeType?(b=c.parentNode,b.insertBefore(a,c)):(b=c,b.appendChild(a)),c=c._reactRootContainer,null!==c&&void 0!==c||null!==b.onclick||(b.onclick=Bf));else if(4!==d&&(a=a.child,null!==a))for(Vj(a,b,c),a=a.sibling;null!==a;)Vj(a,b,c),a=a.sibling}
function Wj(a,b,c){var d=a.tag;if(5===d||6===d)a=a.stateNode,b?c.insertBefore(a,b):c.appendChild(a);else if(4!==d&&(a=a.child,null!==a))for(Wj(a,b,c),a=a.sibling;null!==a;)Wj(a,b,c),a=a.sibling}var X=null,Xj=!1;function Yj(a,b,c){for(c=c.child;null!==c;)Zj(a,b,c),c=c.sibling}
function Zj(a,b,c){if(lc&&"function"===typeof lc.onCommitFiberUnmount)try{lc.onCommitFiberUnmount(kc,c)}catch(h){}switch(c.tag){case 5:U||Lj(c,b);case 6:var d=X,e=Xj;X=null;Yj(a,b,c);X=d;Xj=e;null!==X&&(Xj?(a=X,c=c.stateNode,8===a.nodeType?a.parentNode.removeChild(c):a.removeChild(c)):X.removeChild(c.stateNode));break;case 18:null!==X&&(Xj?(a=X,c=c.stateNode,8===a.nodeType?Kf(a.parentNode,c):1===a.nodeType&&Kf(a,c),bd(a)):Kf(X,c.stateNode));break;case 4:d=X;e=Xj;X=c.stateNode.containerInfo;Xj=!0;
Yj(a,b,c);X=d;Xj=e;break;case 0:case 11:case 14:case 15:if(!U&&(d=c.updateQueue,null!==d&&(d=d.lastEffect,null!==d))){e=d=d.next;do{var f=e,g=f.destroy;f=f.tag;void 0!==g&&(0!==(f&2)?Mj(c,b,g):0!==(f&4)&&Mj(c,b,g));e=e.next}while(e!==d)}Yj(a,b,c);break;case 1:if(!U&&(Lj(c,b),d=c.stateNode,"function"===typeof d.componentWillUnmount))try{d.props=c.memoizedProps,d.state=c.memoizedState,d.componentWillUnmount()}catch(h){W(c,b,h)}Yj(a,b,c);break;case 21:Yj(a,b,c);break;case 22:c.mode&1?(U=(d=U)||null!==
c.memoizedState,Yj(a,b,c),U=d):Yj(a,b,c);break;default:Yj(a,b,c)}}function ak(a){var b=a.updateQueue;if(null!==b){a.updateQueue=null;var c=a.stateNode;null===c&&(c=a.stateNode=new Kj);b.forEach(function(b){var d=bk.bind(null,a,b);c.has(b)||(c.add(b),b.then(d,d))})}}
function ck(a,b){var c=b.deletions;if(null!==c)for(var d=0;d<c.length;d++){var e=c[d];try{var f=a,g=b,h=g;a:for(;null!==h;){switch(h.tag){case 5:X=h.stateNode;Xj=!1;break a;case 3:X=h.stateNode.containerInfo;Xj=!0;break a;case 4:X=h.stateNode.containerInfo;Xj=!0;break a}h=h.return}if(null===X)throw Error(p(160));Zj(f,g,e);X=null;Xj=!1;var k=e.alternate;null!==k&&(k.return=null);e.return=null}catch(l){W(e,b,l)}}if(b.subtreeFlags&12854)for(b=b.child;null!==b;)dk(b,a),b=b.sibling}
function dk(a,b){var c=a.alternate,d=a.flags;switch(a.tag){case 0:case 11:case 14:case 15:ck(b,a);ek(a);if(d&4){try{Pj(3,a,a.return),Qj(3,a)}catch(t){W(a,a.return,t)}try{Pj(5,a,a.return)}catch(t){W(a,a.return,t)}}break;case 1:ck(b,a);ek(a);d&512&&null!==c&&Lj(c,c.return);break;case 5:ck(b,a);ek(a);d&512&&null!==c&&Lj(c,c.return);if(a.flags&32){var e=a.stateNode;try{ob(e,"")}catch(t){W(a,a.return,t)}}if(d&4&&(e=a.stateNode,null!=e)){var f=a.memoizedProps,g=null!==c?c.memoizedProps:f,h=a.type,k=a.updateQueue;
a.updateQueue=null;if(null!==k)try{"input"===h&&"radio"===f.type&&null!=f.name&&ab(e,f);vb(h,g);var l=vb(h,f);for(g=0;g<k.length;g+=2){var m=k[g],q=k[g+1];"style"===m?sb(e,q):"dangerouslySetInnerHTML"===m?nb(e,q):"children"===m?ob(e,q):ta(e,m,q,l)}switch(h){case "input":bb(e,f);break;case "textarea":ib(e,f);break;case "select":var r=e._wrapperState.wasMultiple;e._wrapperState.wasMultiple=!!f.multiple;var y=f.value;null!=y?fb(e,!!f.multiple,y,!1):r!==!!f.multiple&&(null!=f.defaultValue?fb(e,!!f.multiple,
f.defaultValue,!0):fb(e,!!f.multiple,f.multiple?[]:"",!1))}e[Pf]=f}catch(t){W(a,a.return,t)}}break;case 6:ck(b,a);ek(a);if(d&4){if(null===a.stateNode)throw Error(p(162));e=a.stateNode;f=a.memoizedProps;try{e.nodeValue=f}catch(t){W(a,a.return,t)}}break;case 3:ck(b,a);ek(a);if(d&4&&null!==c&&c.memoizedState.isDehydrated)try{bd(b.containerInfo)}catch(t){W(a,a.return,t)}break;case 4:ck(b,a);ek(a);break;case 13:ck(b,a);ek(a);e=a.child;e.flags&8192&&(f=null!==e.memoizedState,e.stateNode.isHidden=f,!f||
null!==e.alternate&&null!==e.alternate.memoizedState||(fk=B()));d&4&&ak(a);break;case 22:m=null!==c&&null!==c.memoizedState;a.mode&1?(U=(l=U)||m,ck(b,a),U=l):ck(b,a);ek(a);if(d&8192){l=null!==a.memoizedState;if((a.stateNode.isHidden=l)&&!m&&0!==(a.mode&1))for(V=a,m=a.child;null!==m;){for(q=V=m;null!==V;){r=V;y=r.child;switch(r.tag){case 0:case 11:case 14:case 15:Pj(4,r,r.return);break;case 1:Lj(r,r.return);var n=r.stateNode;if("function"===typeof n.componentWillUnmount){d=r;c=r.return;try{b=d,n.props=
b.memoizedProps,n.state=b.memoizedState,n.componentWillUnmount()}catch(t){W(d,c,t)}}break;case 5:Lj(r,r.return);break;case 22:if(null!==r.memoizedState){gk(q);continue}}null!==y?(y.return=r,V=y):gk(q)}m=m.sibling}a:for(m=null,q=a;;){if(5===q.tag){if(null===m){m=q;try{e=q.stateNode,l?(f=e.style,"function"===typeof f.setProperty?f.setProperty("display","none","important"):f.display="none"):(h=q.stateNode,k=q.memoizedProps.style,g=void 0!==k&&null!==k&&k.hasOwnProperty("display")?k.display:null,h.style.display=
rb("display",g))}catch(t){W(a,a.return,t)}}}else if(6===q.tag){if(null===m)try{q.stateNode.nodeValue=l?"":q.memoizedProps}catch(t){W(a,a.return,t)}}else if((22!==q.tag&&23!==q.tag||null===q.memoizedState||q===a)&&null!==q.child){q.child.return=q;q=q.child;continue}if(q===a)break a;for(;null===q.sibling;){if(null===q.return||q.return===a)break a;m===q&&(m=null);q=q.return}m===q&&(m=null);q.sibling.return=q.return;q=q.sibling}}break;case 19:ck(b,a);ek(a);d&4&&ak(a);break;case 21:break;default:ck(b,
a),ek(a)}}function ek(a){var b=a.flags;if(b&2){try{a:{for(var c=a.return;null!==c;){if(Tj(c)){var d=c;break a}c=c.return}throw Error(p(160));}switch(d.tag){case 5:var e=d.stateNode;d.flags&32&&(ob(e,""),d.flags&=-33);var f=Uj(a);Wj(a,f,e);break;case 3:case 4:var g=d.stateNode.containerInfo,h=Uj(a);Vj(a,h,g);break;default:throw Error(p(161));}}catch(k){W(a,a.return,k)}a.flags&=-3}b&4096&&(a.flags&=-4097)}function hk(a,b,c){V=a;ik(a,b,c)}
function ik(a,b,c){for(var d=0!==(a.mode&1);null!==V;){var e=V,f=e.child;if(22===e.tag&&d){var g=null!==e.memoizedState||Jj;if(!g){var h=e.alternate,k=null!==h&&null!==h.memoizedState||U;h=Jj;var l=U;Jj=g;if((U=k)&&!l)for(V=e;null!==V;)g=V,k=g.child,22===g.tag&&null!==g.memoizedState?jk(e):null!==k?(k.return=g,V=k):jk(e);for(;null!==f;)V=f,ik(f,b,c),f=f.sibling;V=e;Jj=h;U=l}kk(a,b,c)}else 0!==(e.subtreeFlags&8772)&&null!==f?(f.return=e,V=f):kk(a,b,c)}}
function kk(a){for(;null!==V;){var b=V;if(0!==(b.flags&8772)){var c=b.alternate;try{if(0!==(b.flags&8772))switch(b.tag){case 0:case 11:case 15:U||Qj(5,b);break;case 1:var d=b.stateNode;if(b.flags&4&&!U)if(null===c)d.componentDidMount();else{var e=b.elementType===b.type?c.memoizedProps:Ci(b.type,c.memoizedProps);d.componentDidUpdate(e,c.memoizedState,d.__reactInternalSnapshotBeforeUpdate)}var f=b.updateQueue;null!==f&&sh(b,f,d);break;case 3:var g=b.updateQueue;if(null!==g){c=null;if(null!==b.child)switch(b.child.tag){case 5:c=
b.child.stateNode;break;case 1:c=b.child.stateNode}sh(b,g,c)}break;case 5:var h=b.stateNode;if(null===c&&b.flags&4){c=h;var k=b.memoizedProps;switch(b.type){case "button":case "input":case "select":case "textarea":k.autoFocus&&c.focus();break;case "img":k.src&&(c.src=k.src)}}break;case 6:break;case 4:break;case 12:break;case 13:if(null===b.memoizedState){var l=b.alternate;if(null!==l){var m=l.memoizedState;if(null!==m){var q=m.dehydrated;null!==q&&bd(q)}}}break;case 19:case 17:case 21:case 22:case 23:case 25:break;
default:throw Error(p(163));}U||b.flags&512&&Rj(b)}catch(r){W(b,b.return,r)}}if(b===a){V=null;break}c=b.sibling;if(null!==c){c.return=b.return;V=c;break}V=b.return}}function gk(a){for(;null!==V;){var b=V;if(b===a){V=null;break}var c=b.sibling;if(null!==c){c.return=b.return;V=c;break}V=b.return}}
function jk(a){for(;null!==V;){var b=V;try{switch(b.tag){case 0:case 11:case 15:var c=b.return;try{Qj(4,b)}catch(k){W(b,c,k)}break;case 1:var d=b.stateNode;if("function"===typeof d.componentDidMount){var e=b.return;try{d.componentDidMount()}catch(k){W(b,e,k)}}var f=b.return;try{Rj(b)}catch(k){W(b,f,k)}break;case 5:var g=b.return;try{Rj(b)}catch(k){W(b,g,k)}}}catch(k){W(b,b.return,k)}if(b===a){V=null;break}var h=b.sibling;if(null!==h){h.return=b.return;V=h;break}V=b.return}}
var lk=Math.ceil,mk=ua.ReactCurrentDispatcher,nk=ua.ReactCurrentOwner,ok=ua.ReactCurrentBatchConfig,K=0,Q=null,Y=null,Z=0,fj=0,ej=Uf(0),T=0,pk=null,rh=0,qk=0,rk=0,sk=null,tk=null,fk=0,Gj=Infinity,uk=null,Oi=!1,Pi=null,Ri=null,vk=!1,wk=null,xk=0,yk=0,zk=null,Ak=-1,Bk=0;function R(){return 0!==(K&6)?B():-1!==Ak?Ak:Ak=B()}
function yi(a){if(0===(a.mode&1))return 1;if(0!==(K&2)&&0!==Z)return Z&-Z;if(null!==Kg.transition)return 0===Bk&&(Bk=yc()),Bk;a=C;if(0!==a)return a;a=window.event;a=void 0===a?16:jd(a.type);return a}function gi(a,b,c,d){if(50<yk)throw yk=0,zk=null,Error(p(185));Ac(a,c,d);if(0===(K&2)||a!==Q)a===Q&&(0===(K&2)&&(qk|=c),4===T&&Ck(a,Z)),Dk(a,d),1===c&&0===K&&0===(b.mode&1)&&(Gj=B()+500,fg&&jg())}
function Dk(a,b){var c=a.callbackNode;wc(a,b);var d=uc(a,a===Q?Z:0);if(0===d)null!==c&&bc(c),a.callbackNode=null,a.callbackPriority=0;else if(b=d&-d,a.callbackPriority!==b){null!=c&&bc(c);if(1===b)0===a.tag?ig(Ek.bind(null,a)):hg(Ek.bind(null,a)),Jf(function(){0===(K&6)&&jg()}),c=null;else{switch(Dc(d)){case 1:c=fc;break;case 4:c=gc;break;case 16:c=hc;break;case 536870912:c=jc;break;default:c=hc}c=Fk(c,Gk.bind(null,a))}a.callbackPriority=b;a.callbackNode=c}}
function Gk(a,b){Ak=-1;Bk=0;if(0!==(K&6))throw Error(p(327));var c=a.callbackNode;if(Hk()&&a.callbackNode!==c)return null;var d=uc(a,a===Q?Z:0);if(0===d)return null;if(0!==(d&30)||0!==(d&a.expiredLanes)||b)b=Ik(a,d);else{b=d;var e=K;K|=2;var f=Jk();if(Q!==a||Z!==b)uk=null,Gj=B()+500,Kk(a,b);do try{Lk();break}catch(h){Mk(a,h)}while(1);$g();mk.current=f;K=e;null!==Y?b=0:(Q=null,Z=0,b=T)}if(0!==b){2===b&&(e=xc(a),0!==e&&(d=e,b=Nk(a,e)));if(1===b)throw c=pk,Kk(a,0),Ck(a,d),Dk(a,B()),c;if(6===b)Ck(a,d);
else{e=a.current.alternate;if(0===(d&30)&&!Ok(e)&&(b=Ik(a,d),2===b&&(f=xc(a),0!==f&&(d=f,b=Nk(a,f))),1===b))throw c=pk,Kk(a,0),Ck(a,d),Dk(a,B()),c;a.finishedWork=e;a.finishedLanes=d;switch(b){case 0:case 1:throw Error(p(345));case 2:Pk(a,tk,uk);break;case 3:Ck(a,d);if((d&130023424)===d&&(b=fk+500-B(),10<b)){if(0!==uc(a,0))break;e=a.suspendedLanes;if((e&d)!==d){R();a.pingedLanes|=a.suspendedLanes&e;break}a.timeoutHandle=Ff(Pk.bind(null,a,tk,uk),b);break}Pk(a,tk,uk);break;case 4:Ck(a,d);if((d&4194240)===
d)break;b=a.eventTimes;for(e=-1;0<d;){var g=31-oc(d);f=1<<g;g=b[g];g>e&&(e=g);d&=~f}d=e;d=B()-d;d=(120>d?120:480>d?480:1080>d?1080:1920>d?1920:3E3>d?3E3:4320>d?4320:1960*lk(d/1960))-d;if(10<d){a.timeoutHandle=Ff(Pk.bind(null,a,tk,uk),d);break}Pk(a,tk,uk);break;case 5:Pk(a,tk,uk);break;default:throw Error(p(329));}}}Dk(a,B());return a.callbackNode===c?Gk.bind(null,a):null}
function Nk(a,b){var c=sk;a.current.memoizedState.isDehydrated&&(Kk(a,b).flags|=256);a=Ik(a,b);2!==a&&(b=tk,tk=c,null!==b&&Fj(b));return a}function Fj(a){null===tk?tk=a:tk.push.apply(tk,a)}
function Ok(a){for(var b=a;;){if(b.flags&16384){var c=b.updateQueue;if(null!==c&&(c=c.stores,null!==c))for(var d=0;d<c.length;d++){var e=c[d],f=e.getSnapshot;e=e.value;try{if(!He(f(),e))return!1}catch(g){return!1}}}c=b.child;if(b.subtreeFlags&16384&&null!==c)c.return=b,b=c;else{if(b===a)break;for(;null===b.sibling;){if(null===b.return||b.return===a)return!0;b=b.return}b.sibling.return=b.return;b=b.sibling}}return!0}
function Ck(a,b){b&=~rk;b&=~qk;a.suspendedLanes|=b;a.pingedLanes&=~b;for(a=a.expirationTimes;0<b;){var c=31-oc(b),d=1<<c;a[c]=-1;b&=~d}}function Ek(a){if(0!==(K&6))throw Error(p(327));Hk();var b=uc(a,0);if(0===(b&1))return Dk(a,B()),null;var c=Ik(a,b);if(0!==a.tag&&2===c){var d=xc(a);0!==d&&(b=d,c=Nk(a,d))}if(1===c)throw c=pk,Kk(a,0),Ck(a,b),Dk(a,B()),c;if(6===c)throw Error(p(345));a.finishedWork=a.current.alternate;a.finishedLanes=b;Pk(a,tk,uk);Dk(a,B());return null}
function Qk(a,b){var c=K;K|=1;try{return a(b)}finally{K=c,0===K&&(Gj=B()+500,fg&&jg())}}function Rk(a){null!==wk&&0===wk.tag&&0===(K&6)&&Hk();var b=K;K|=1;var c=ok.transition,d=C;try{if(ok.transition=null,C=1,a)return a()}finally{C=d,ok.transition=c,K=b,0===(K&6)&&jg()}}function Hj(){fj=ej.current;E(ej)}
function Kk(a,b){a.finishedWork=null;a.finishedLanes=0;var c=a.timeoutHandle;-1!==c&&(a.timeoutHandle=-1,Gf(c));if(null!==Y)for(c=Y.return;null!==c;){var d=c;wg(d);switch(d.tag){case 1:d=d.type.childContextTypes;null!==d&&void 0!==d&&$f();break;case 3:zh();E(Wf);E(H);Eh();break;case 5:Bh(d);break;case 4:zh();break;case 13:E(L);break;case 19:E(L);break;case 10:ah(d.type._context);break;case 22:case 23:Hj()}c=c.return}Q=a;Y=a=Pg(a.current,null);Z=fj=b;T=0;pk=null;rk=qk=rh=0;tk=sk=null;if(null!==fh){for(b=
0;b<fh.length;b++)if(c=fh[b],d=c.interleaved,null!==d){c.interleaved=null;var e=d.next,f=c.pending;if(null!==f){var g=f.next;f.next=e;d.next=g}c.pending=d}fh=null}return a}
function Mk(a,b){do{var c=Y;try{$g();Fh.current=Rh;if(Ih){for(var d=M.memoizedState;null!==d;){var e=d.queue;null!==e&&(e.pending=null);d=d.next}Ih=!1}Hh=0;O=N=M=null;Jh=!1;Kh=0;nk.current=null;if(null===c||null===c.return){T=1;pk=b;Y=null;break}a:{var f=a,g=c.return,h=c,k=b;b=Z;h.flags|=32768;if(null!==k&&"object"===typeof k&&"function"===typeof k.then){var l=k,m=h,q=m.tag;if(0===(m.mode&1)&&(0===q||11===q||15===q)){var r=m.alternate;r?(m.updateQueue=r.updateQueue,m.memoizedState=r.memoizedState,
m.lanes=r.lanes):(m.updateQueue=null,m.memoizedState=null)}var y=Ui(g);if(null!==y){y.flags&=-257;Vi(y,g,h,f,b);y.mode&1&&Si(f,l,b);b=y;k=l;var n=b.updateQueue;if(null===n){var t=new Set;t.add(k);b.updateQueue=t}else n.add(k);break a}else{if(0===(b&1)){Si(f,l,b);tj();break a}k=Error(p(426))}}else if(I&&h.mode&1){var J=Ui(g);if(null!==J){0===(J.flags&65536)&&(J.flags|=256);Vi(J,g,h,f,b);Jg(Ji(k,h));break a}}f=k=Ji(k,h);4!==T&&(T=2);null===sk?sk=[f]:sk.push(f);f=g;do{switch(f.tag){case 3:f.flags|=65536;
b&=-b;f.lanes|=b;var x=Ni(f,k,b);ph(f,x);break a;case 1:h=k;var w=f.type,u=f.stateNode;if(0===(f.flags&128)&&("function"===typeof w.getDerivedStateFromError||null!==u&&"function"===typeof u.componentDidCatch&&(null===Ri||!Ri.has(u)))){f.flags|=65536;b&=-b;f.lanes|=b;var F=Qi(f,h,b);ph(f,F);break a}}f=f.return}while(null!==f)}Sk(c)}catch(na){b=na;Y===c&&null!==c&&(Y=c=c.return);continue}break}while(1)}function Jk(){var a=mk.current;mk.current=Rh;return null===a?Rh:a}
function tj(){if(0===T||3===T||2===T)T=4;null===Q||0===(rh&268435455)&&0===(qk&268435455)||Ck(Q,Z)}function Ik(a,b){var c=K;K|=2;var d=Jk();if(Q!==a||Z!==b)uk=null,Kk(a,b);do try{Tk();break}catch(e){Mk(a,e)}while(1);$g();K=c;mk.current=d;if(null!==Y)throw Error(p(261));Q=null;Z=0;return T}function Tk(){for(;null!==Y;)Uk(Y)}function Lk(){for(;null!==Y&&!cc();)Uk(Y)}function Uk(a){var b=Vk(a.alternate,a,fj);a.memoizedProps=a.pendingProps;null===b?Sk(a):Y=b;nk.current=null}
function Sk(a){var b=a;do{var c=b.alternate;a=b.return;if(0===(b.flags&32768)){if(c=Ej(c,b,fj),null!==c){Y=c;return}}else{c=Ij(c,b);if(null!==c){c.flags&=32767;Y=c;return}if(null!==a)a.flags|=32768,a.subtreeFlags=0,a.deletions=null;else{T=6;Y=null;return}}b=b.sibling;if(null!==b){Y=b;return}Y=b=a}while(null!==b);0===T&&(T=5)}function Pk(a,b,c){var d=C,e=ok.transition;try{ok.transition=null,C=1,Wk(a,b,c,d)}finally{ok.transition=e,C=d}return null}
function Wk(a,b,c,d){do Hk();while(null!==wk);if(0!==(K&6))throw Error(p(327));c=a.finishedWork;var e=a.finishedLanes;if(null===c)return null;a.finishedWork=null;a.finishedLanes=0;if(c===a.current)throw Error(p(177));a.callbackNode=null;a.callbackPriority=0;var f=c.lanes|c.childLanes;Bc(a,f);a===Q&&(Y=Q=null,Z=0);0===(c.subtreeFlags&2064)&&0===(c.flags&2064)||vk||(vk=!0,Fk(hc,function(){Hk();return null}));f=0!==(c.flags&15990);if(0!==(c.subtreeFlags&15990)||f){f=ok.transition;ok.transition=null;
var g=C;C=1;var h=K;K|=4;nk.current=null;Oj(a,c);dk(c,a);Oe(Df);dd=!!Cf;Df=Cf=null;a.current=c;hk(c,a,e);dc();K=h;C=g;ok.transition=f}else a.current=c;vk&&(vk=!1,wk=a,xk=e);f=a.pendingLanes;0===f&&(Ri=null);mc(c.stateNode,d);Dk(a,B());if(null!==b)for(d=a.onRecoverableError,c=0;c<b.length;c++)e=b[c],d(e.value,{componentStack:e.stack,digest:e.digest});if(Oi)throw Oi=!1,a=Pi,Pi=null,a;0!==(xk&1)&&0!==a.tag&&Hk();f=a.pendingLanes;0!==(f&1)?a===zk?yk++:(yk=0,zk=a):yk=0;jg();return null}
function Hk(){if(null!==wk){var a=Dc(xk),b=ok.transition,c=C;try{ok.transition=null;C=16>a?16:a;if(null===wk)var d=!1;else{a=wk;wk=null;xk=0;if(0!==(K&6))throw Error(p(331));var e=K;K|=4;for(V=a.current;null!==V;){var f=V,g=f.child;if(0!==(V.flags&16)){var h=f.deletions;if(null!==h){for(var k=0;k<h.length;k++){var l=h[k];for(V=l;null!==V;){var m=V;switch(m.tag){case 0:case 11:case 15:Pj(8,m,f)}var q=m.child;if(null!==q)q.return=m,V=q;else for(;null!==V;){m=V;var r=m.sibling,y=m.return;Sj(m);if(m===
l){V=null;break}if(null!==r){r.return=y;V=r;break}V=y}}}var n=f.alternate;if(null!==n){var t=n.child;if(null!==t){n.child=null;do{var J=t.sibling;t.sibling=null;t=J}while(null!==t)}}V=f}}if(0!==(f.subtreeFlags&2064)&&null!==g)g.return=f,V=g;else b:for(;null!==V;){f=V;if(0!==(f.flags&2048))switch(f.tag){case 0:case 11:case 15:Pj(9,f,f.return)}var x=f.sibling;if(null!==x){x.return=f.return;V=x;break b}V=f.return}}var w=a.current;for(V=w;null!==V;){g=V;var u=g.child;if(0!==(g.subtreeFlags&2064)&&null!==
u)u.return=g,V=u;else b:for(g=w;null!==V;){h=V;if(0!==(h.flags&2048))try{switch(h.tag){case 0:case 11:case 15:Qj(9,h)}}catch(na){W(h,h.return,na)}if(h===g){V=null;break b}var F=h.sibling;if(null!==F){F.return=h.return;V=F;break b}V=h.return}}K=e;jg();if(lc&&"function"===typeof lc.onPostCommitFiberRoot)try{lc.onPostCommitFiberRoot(kc,a)}catch(na){}d=!0}return d}finally{C=c,ok.transition=b}}return!1}function Xk(a,b,c){b=Ji(c,b);b=Ni(a,b,1);a=nh(a,b,1);b=R();null!==a&&(Ac(a,1,b),Dk(a,b))}
function W(a,b,c){if(3===a.tag)Xk(a,a,c);else for(;null!==b;){if(3===b.tag){Xk(b,a,c);break}else if(1===b.tag){var d=b.stateNode;if("function"===typeof b.type.getDerivedStateFromError||"function"===typeof d.componentDidCatch&&(null===Ri||!Ri.has(d))){a=Ji(c,a);a=Qi(b,a,1);b=nh(b,a,1);a=R();null!==b&&(Ac(b,1,a),Dk(b,a));break}}b=b.return}}
function Ti(a,b,c){var d=a.pingCache;null!==d&&d.delete(b);b=R();a.pingedLanes|=a.suspendedLanes&c;Q===a&&(Z&c)===c&&(4===T||3===T&&(Z&130023424)===Z&&500>B()-fk?Kk(a,0):rk|=c);Dk(a,b)}function Yk(a,b){0===b&&(0===(a.mode&1)?b=1:(b=sc,sc<<=1,0===(sc&130023424)&&(sc=4194304)));var c=R();a=ih(a,b);null!==a&&(Ac(a,b,c),Dk(a,c))}function uj(a){var b=a.memoizedState,c=0;null!==b&&(c=b.retryLane);Yk(a,c)}
function bk(a,b){var c=0;switch(a.tag){case 13:var d=a.stateNode;var e=a.memoizedState;null!==e&&(c=e.retryLane);break;case 19:d=a.stateNode;break;default:throw Error(p(314));}null!==d&&d.delete(b);Yk(a,c)}var Vk;
Vk=function(a,b,c){if(null!==a)if(a.memoizedProps!==b.pendingProps||Wf.current)dh=!0;else{if(0===(a.lanes&c)&&0===(b.flags&128))return dh=!1,yj(a,b,c);dh=0!==(a.flags&131072)?!0:!1}else dh=!1,I&&0!==(b.flags&1048576)&&ug(b,ng,b.index);b.lanes=0;switch(b.tag){case 2:var d=b.type;ij(a,b);a=b.pendingProps;var e=Yf(b,H.current);ch(b,c);e=Nh(null,b,d,a,e,c);var f=Sh();b.flags|=1;"object"===typeof e&&null!==e&&"function"===typeof e.render&&void 0===e.$$typeof?(b.tag=1,b.memoizedState=null,b.updateQueue=
null,Zf(d)?(f=!0,cg(b)):f=!1,b.memoizedState=null!==e.state&&void 0!==e.state?e.state:null,kh(b),e.updater=Ei,b.stateNode=e,e._reactInternals=b,Ii(b,d,a,c),b=jj(null,b,d,!0,f,c)):(b.tag=0,I&&f&&vg(b),Xi(null,b,e,c),b=b.child);return b;case 16:d=b.elementType;a:{ij(a,b);a=b.pendingProps;e=d._init;d=e(d._payload);b.type=d;e=b.tag=Zk(d);a=Ci(d,a);switch(e){case 0:b=cj(null,b,d,a,c);break a;case 1:b=hj(null,b,d,a,c);break a;case 11:b=Yi(null,b,d,a,c);break a;case 14:b=$i(null,b,d,Ci(d.type,a),c);break a}throw Error(p(306,
d,""));}return b;case 0:return d=b.type,e=b.pendingProps,e=b.elementType===d?e:Ci(d,e),cj(a,b,d,e,c);case 1:return d=b.type,e=b.pendingProps,e=b.elementType===d?e:Ci(d,e),hj(a,b,d,e,c);case 3:a:{kj(b);if(null===a)throw Error(p(387));d=b.pendingProps;f=b.memoizedState;e=f.element;lh(a,b);qh(b,d,null,c);var g=b.memoizedState;d=g.element;if(f.isDehydrated)if(f={element:d,isDehydrated:!1,cache:g.cache,pendingSuspenseBoundaries:g.pendingSuspenseBoundaries,transitions:g.transitions},b.updateQueue.baseState=
f,b.memoizedState=f,b.flags&256){e=Ji(Error(p(423)),b);b=lj(a,b,d,c,e);break a}else if(d!==e){e=Ji(Error(p(424)),b);b=lj(a,b,d,c,e);break a}else for(yg=Lf(b.stateNode.containerInfo.firstChild),xg=b,I=!0,zg=null,c=Vg(b,null,d,c),b.child=c;c;)c.flags=c.flags&-3|4096,c=c.sibling;else{Ig();if(d===e){b=Zi(a,b,c);break a}Xi(a,b,d,c)}b=b.child}return b;case 5:return Ah(b),null===a&&Eg(b),d=b.type,e=b.pendingProps,f=null!==a?a.memoizedProps:null,g=e.children,Ef(d,e)?g=null:null!==f&&Ef(d,f)&&(b.flags|=32),
gj(a,b),Xi(a,b,g,c),b.child;case 6:return null===a&&Eg(b),null;case 13:return oj(a,b,c);case 4:return yh(b,b.stateNode.containerInfo),d=b.pendingProps,null===a?b.child=Ug(b,null,d,c):Xi(a,b,d,c),b.child;case 11:return d=b.type,e=b.pendingProps,e=b.elementType===d?e:Ci(d,e),Yi(a,b,d,e,c);case 7:return Xi(a,b,b.pendingProps,c),b.child;case 8:return Xi(a,b,b.pendingProps.children,c),b.child;case 12:return Xi(a,b,b.pendingProps.children,c),b.child;case 10:a:{d=b.type._context;e=b.pendingProps;f=b.memoizedProps;
g=e.value;G(Wg,d._currentValue);d._currentValue=g;if(null!==f)if(He(f.value,g)){if(f.children===e.children&&!Wf.current){b=Zi(a,b,c);break a}}else for(f=b.child,null!==f&&(f.return=b);null!==f;){var h=f.dependencies;if(null!==h){g=f.child;for(var k=h.firstContext;null!==k;){if(k.context===d){if(1===f.tag){k=mh(-1,c&-c);k.tag=2;var l=f.updateQueue;if(null!==l){l=l.shared;var m=l.pending;null===m?k.next=k:(k.next=m.next,m.next=k);l.pending=k}}f.lanes|=c;k=f.alternate;null!==k&&(k.lanes|=c);bh(f.return,
c,b);h.lanes|=c;break}k=k.next}}else if(10===f.tag)g=f.type===b.type?null:f.child;else if(18===f.tag){g=f.return;if(null===g)throw Error(p(341));g.lanes|=c;h=g.alternate;null!==h&&(h.lanes|=c);bh(g,c,b);g=f.sibling}else g=f.child;if(null!==g)g.return=f;else for(g=f;null!==g;){if(g===b){g=null;break}f=g.sibling;if(null!==f){f.return=g.return;g=f;break}g=g.return}f=g}Xi(a,b,e.children,c);b=b.child}return b;case 9:return e=b.type,d=b.pendingProps.children,ch(b,c),e=eh(e),d=d(e),b.flags|=1,Xi(a,b,d,c),
b.child;case 14:return d=b.type,e=Ci(d,b.pendingProps),e=Ci(d.type,e),$i(a,b,d,e,c);case 15:return bj(a,b,b.type,b.pendingProps,c);case 17:return d=b.type,e=b.pendingProps,e=b.elementType===d?e:Ci(d,e),ij(a,b),b.tag=1,Zf(d)?(a=!0,cg(b)):a=!1,ch(b,c),Gi(b,d,e),Ii(b,d,e,c),jj(null,b,d,!0,a,c);case 19:return xj(a,b,c);case 22:return dj(a,b,c)}throw Error(p(156,b.tag));};function Fk(a,b){return ac(a,b)}
function $k(a,b,c,d){this.tag=a;this.key=c;this.sibling=this.child=this.return=this.stateNode=this.type=this.elementType=null;this.index=0;this.ref=null;this.pendingProps=b;this.dependencies=this.memoizedState=this.updateQueue=this.memoizedProps=null;this.mode=d;this.subtreeFlags=this.flags=0;this.deletions=null;this.childLanes=this.lanes=0;this.alternate=null}function Bg(a,b,c,d){return new $k(a,b,c,d)}function aj(a){a=a.prototype;return!(!a||!a.isReactComponent)}
function Zk(a){if("function"===typeof a)return aj(a)?1:0;if(void 0!==a&&null!==a){a=a.$$typeof;if(a===Da)return 11;if(a===Ga)return 14}return 2}
function Pg(a,b){var c=a.alternate;null===c?(c=Bg(a.tag,b,a.key,a.mode),c.elementType=a.elementType,c.type=a.type,c.stateNode=a.stateNode,c.alternate=a,a.alternate=c):(c.pendingProps=b,c.type=a.type,c.flags=0,c.subtreeFlags=0,c.deletions=null);c.flags=a.flags&14680064;c.childLanes=a.childLanes;c.lanes=a.lanes;c.child=a.child;c.memoizedProps=a.memoizedProps;c.memoizedState=a.memoizedState;c.updateQueue=a.updateQueue;b=a.dependencies;c.dependencies=null===b?null:{lanes:b.lanes,firstContext:b.firstContext};
c.sibling=a.sibling;c.index=a.index;c.ref=a.ref;return c}
function Rg(a,b,c,d,e,f){var g=2;d=a;if("function"===typeof a)aj(a)&&(g=1);else if("string"===typeof a)g=5;else a:switch(a){case ya:return Tg(c.children,e,f,b);case za:g=8;e|=8;break;case Aa:return a=Bg(12,c,b,e|2),a.elementType=Aa,a.lanes=f,a;case Ea:return a=Bg(13,c,b,e),a.elementType=Ea,a.lanes=f,a;case Fa:return a=Bg(19,c,b,e),a.elementType=Fa,a.lanes=f,a;case Ia:return pj(c,e,f,b);default:if("object"===typeof a&&null!==a)switch(a.$$typeof){case Ba:g=10;break a;case Ca:g=9;break a;case Da:g=11;
break a;case Ga:g=14;break a;case Ha:g=16;d=null;break a}throw Error(p(130,null==a?a:typeof a,""));}b=Bg(g,c,b,e);b.elementType=a;b.type=d;b.lanes=f;return b}function Tg(a,b,c,d){a=Bg(7,a,d,b);a.lanes=c;return a}function pj(a,b,c,d){a=Bg(22,a,d,b);a.elementType=Ia;a.lanes=c;a.stateNode={isHidden:!1};return a}function Qg(a,b,c){a=Bg(6,a,null,b);a.lanes=c;return a}
function Sg(a,b,c){b=Bg(4,null!==a.children?a.children:[],a.key,b);b.lanes=c;b.stateNode={containerInfo:a.containerInfo,pendingChildren:null,implementation:a.implementation};return b}
function al(a,b,c,d,e){this.tag=b;this.containerInfo=a;this.finishedWork=this.pingCache=this.current=this.pendingChildren=null;this.timeoutHandle=-1;this.callbackNode=this.pendingContext=this.context=null;this.callbackPriority=0;this.eventTimes=zc(0);this.expirationTimes=zc(-1);this.entangledLanes=this.finishedLanes=this.mutableReadLanes=this.expiredLanes=this.pingedLanes=this.suspendedLanes=this.pendingLanes=0;this.entanglements=zc(0);this.identifierPrefix=d;this.onRecoverableError=e;this.mutableSourceEagerHydrationData=
null}function bl(a,b,c,d,e,f,g,h,k){a=new al(a,b,c,h,k);1===b?(b=1,!0===f&&(b|=8)):b=0;f=Bg(3,null,null,b);a.current=f;f.stateNode=a;f.memoizedState={element:d,isDehydrated:c,cache:null,transitions:null,pendingSuspenseBoundaries:null};kh(f);return a}function cl(a,b,c){var d=3<arguments.length&&void 0!==arguments[3]?arguments[3]:null;return{$$typeof:wa,key:null==d?null:""+d,children:a,containerInfo:b,implementation:c}}
function dl(a){if(!a)return Vf;a=a._reactInternals;a:{if(Vb(a)!==a||1!==a.tag)throw Error(p(170));var b=a;do{switch(b.tag){case 3:b=b.stateNode.context;break a;case 1:if(Zf(b.type)){b=b.stateNode.__reactInternalMemoizedMergedChildContext;break a}}b=b.return}while(null!==b);throw Error(p(171));}if(1===a.tag){var c=a.type;if(Zf(c))return bg(a,c,b)}return b}
function el(a,b,c,d,e,f,g,h,k){a=bl(c,d,!0,a,e,f,g,h,k);a.context=dl(null);c=a.current;d=R();e=yi(c);f=mh(d,e);f.callback=void 0!==b&&null!==b?b:null;nh(c,f,e);a.current.lanes=e;Ac(a,e,d);Dk(a,d);return a}function fl(a,b,c,d){var e=b.current,f=R(),g=yi(e);c=dl(c);null===b.context?b.context=c:b.pendingContext=c;b=mh(f,g);b.payload={element:a};d=void 0===d?null:d;null!==d&&(b.callback=d);a=nh(e,b,g);null!==a&&(gi(a,e,g,f),oh(a,e,g));return g}
function gl(a){a=a.current;if(!a.child)return null;switch(a.child.tag){case 5:return a.child.stateNode;default:return a.child.stateNode}}function hl(a,b){a=a.memoizedState;if(null!==a&&null!==a.dehydrated){var c=a.retryLane;a.retryLane=0!==c&&c<b?c:b}}function il(a,b){hl(a,b);(a=a.alternate)&&hl(a,b)}function jl(){return null}var kl="function"===typeof reportError?reportError:function(a){console.error(a)};function ll(a){this._internalRoot=a}
ml.prototype.render=ll.prototype.render=function(a){var b=this._internalRoot;if(null===b)throw Error(p(409));fl(a,b,null,null)};ml.prototype.unmount=ll.prototype.unmount=function(){var a=this._internalRoot;if(null!==a){this._internalRoot=null;var b=a.containerInfo;Rk(function(){fl(null,a,null,null)});b[uf]=null}};function ml(a){this._internalRoot=a}
ml.prototype.unstable_scheduleHydration=function(a){if(a){var b=Hc();a={blockedOn:null,target:a,priority:b};for(var c=0;c<Qc.length&&0!==b&&b<Qc[c].priority;c++);Qc.splice(c,0,a);0===c&&Vc(a)}};function nl(a){return!(!a||1!==a.nodeType&&9!==a.nodeType&&11!==a.nodeType)}function ol(a){return!(!a||1!==a.nodeType&&9!==a.nodeType&&11!==a.nodeType&&(8!==a.nodeType||" react-mount-point-unstable "!==a.nodeValue))}function pl(){}
function ql(a,b,c,d,e){if(e){if("function"===typeof d){var f=d;d=function(){var a=gl(g);f.call(a)}}var g=el(b,d,a,0,null,!1,!1,"",pl);a._reactRootContainer=g;a[uf]=g.current;sf(8===a.nodeType?a.parentNode:a);Rk();return g}for(;e=a.lastChild;)a.removeChild(e);if("function"===typeof d){var h=d;d=function(){var a=gl(k);h.call(a)}}var k=bl(a,0,!1,null,null,!1,!1,"",pl);a._reactRootContainer=k;a[uf]=k.current;sf(8===a.nodeType?a.parentNode:a);Rk(function(){fl(b,k,c,d)});return k}
function rl(a,b,c,d,e){var f=c._reactRootContainer;if(f){var g=f;if("function"===typeof e){var h=e;e=function(){var a=gl(g);h.call(a)}}fl(b,g,a,e)}else g=ql(c,b,a,e,d);return gl(g)}Ec=function(a){switch(a.tag){case 3:var b=a.stateNode;if(b.current.memoizedState.isDehydrated){var c=tc(b.pendingLanes);0!==c&&(Cc(b,c|1),Dk(b,B()),0===(K&6)&&(Gj=B()+500,jg()))}break;case 13:Rk(function(){var b=ih(a,1);if(null!==b){var c=R();gi(b,a,1,c)}}),il(a,1)}};
Fc=function(a){if(13===a.tag){var b=ih(a,134217728);if(null!==b){var c=R();gi(b,a,134217728,c)}il(a,134217728)}};Gc=function(a){if(13===a.tag){var b=yi(a),c=ih(a,b);if(null!==c){var d=R();gi(c,a,b,d)}il(a,b)}};Hc=function(){return C};Ic=function(a,b){var c=C;try{return C=a,b()}finally{C=c}};
yb=function(a,b,c){switch(b){case "input":bb(a,c);b=c.name;if("radio"===c.type&&null!=b){for(c=a;c.parentNode;)c=c.parentNode;c=c.querySelectorAll("input[name="+JSON.stringify(""+b)+'][type="radio"]');for(b=0;b<c.length;b++){var d=c[b];if(d!==a&&d.form===a.form){var e=Db(d);if(!e)throw Error(p(90));Wa(d);bb(d,e)}}}break;case "textarea":ib(a,c);break;case "select":b=c.value,null!=b&&fb(a,!!c.multiple,b,!1)}};Gb=Qk;Hb=Rk;
var sl={usingClientEntryPoint:!1,Events:[Cb,ue,Db,Eb,Fb,Qk]},tl={findFiberByHostInstance:Wc,bundleType:0,version:"18.3.1",rendererPackageName:"react-dom"};
var ul={bundleType:tl.bundleType,version:tl.version,rendererPackageName:tl.rendererPackageName,rendererConfig:tl.rendererConfig,overrideHookState:null,overrideHookStateDeletePath:null,overrideHookStateRenamePath:null,overrideProps:null,overridePropsDeletePath:null,overridePropsRenamePath:null,setErrorHandler:null,setSuspenseHandler:null,scheduleUpdate:null,currentDispatcherRef:ua.ReactCurrentDispatcher,findHostInstanceByFiber:function(a){a=Zb(a);return null===a?null:a.stateNode},findFiberByHostInstance:tl.findFiberByHostInstance||
jl,findHostInstancesForRefresh:null,scheduleRefresh:null,scheduleRoot:null,setRefreshHandler:null,getCurrentFiber:null,reconcilerVersion:"18.3.1-next-f1338f8080-20240426"};if("undefined"!==typeof __REACT_DEVTOOLS_GLOBAL_HOOK__){var vl=__REACT_DEVTOOLS_GLOBAL_HOOK__;if(!vl.isDisabled&&vl.supportsFiber)try{kc=vl.inject(ul),lc=vl}catch(a){}}exports.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED=sl;
exports.createPortal=function(a,b){var c=2<arguments.length&&void 0!==arguments[2]?arguments[2]:null;if(!nl(b))throw Error(p(200));return cl(a,b,null,c)};exports.createRoot=function(a,b){if(!nl(a))throw Error(p(299));var c=!1,d="",e=kl;null!==b&&void 0!==b&&(!0===b.unstable_strictMode&&(c=!0),void 0!==b.identifierPrefix&&(d=b.identifierPrefix),void 0!==b.onRecoverableError&&(e=b.onRecoverableError));b=bl(a,1,!1,null,null,c,!1,d,e);a[uf]=b.current;sf(8===a.nodeType?a.parentNode:a);return new ll(b)};
exports.findDOMNode=function(a){if(null==a)return null;if(1===a.nodeType)return a;var b=a._reactInternals;if(void 0===b){if("function"===typeof a.render)throw Error(p(188));a=Object.keys(a).join(",");throw Error(p(268,a));}a=Zb(b);a=null===a?null:a.stateNode;return a};exports.flushSync=function(a){return Rk(a)};exports.hydrate=function(a,b,c){if(!ol(b))throw Error(p(200));return rl(null,a,b,!0,c)};
exports.hydrateRoot=function(a,b,c){if(!nl(a))throw Error(p(405));var d=null!=c&&c.hydratedSources||null,e=!1,f="",g=kl;null!==c&&void 0!==c&&(!0===c.unstable_strictMode&&(e=!0),void 0!==c.identifierPrefix&&(f=c.identifierPrefix),void 0!==c.onRecoverableError&&(g=c.onRecoverableError));b=el(b,null,a,1,null!=c?c:null,e,!1,f,g);a[uf]=b.current;sf(a);if(d)for(a=0;a<d.length;a++)c=d[a],e=c._getVersion,e=e(c._source),null==b.mutableSourceEagerHydrationData?b.mutableSourceEagerHydrationData=[c,e]:b.mutableSourceEagerHydrationData.push(c,
e);return new ml(b)};exports.render=function(a,b,c){if(!ol(b))throw Error(p(200));return rl(null,a,b,!1,c)};exports.unmountComponentAtNode=function(a){if(!ol(a))throw Error(p(40));return a._reactRootContainer?(Rk(function(){rl(null,null,a,!1,function(){a._reactRootContainer=null;a[uf]=null})}),!0):!1};exports.unstable_batchedUpdates=Qk;
exports.unstable_renderSubtreeIntoContainer=function(a,b,c,d){if(!ol(c))throw Error(p(200));if(null==a||void 0===a._reactInternals)throw Error(p(38));return rl(a,b,c,!1,d)};exports.version="18.3.1-next-f1338f8080-20240426";


/***/ }),

/***/ 338:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

var __webpack_unused_export__;


var m = __webpack_require__(961);
if (true) {
  exports.H = m.createRoot;
  __webpack_unused_export__ = m.hydrateRoot;
} else // removed by dead control flow
{ var i; }


/***/ }),

/***/ 961:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {



function checkDCE() {
  /* global __REACT_DEVTOOLS_GLOBAL_HOOK__ */
  if (
    typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ === 'undefined' ||
    typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE !== 'function'
  ) {
    return;
  }
  if (false) // removed by dead control flow
{}
  try {
    // Verify that the code above has been dead code eliminated (DCE'd).
    __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(checkDCE);
  } catch (err) {
    // DevTools shouldn't crash React, no matter what.
    // We should still report in case we break this code.
    console.error(err);
  }
}

if (true) {
  // DCE check should happen before ReactDOM bundle executes so that
  // DevTools can report bad minification during injection.
  checkDCE();
  module.exports = __webpack_require__(551);
} else // removed by dead control flow
{}


/***/ }),

/***/ 20:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var f=__webpack_require__(540),k=Symbol.for("react.element"),l=Symbol.for("react.fragment"),m=Object.prototype.hasOwnProperty,n=f.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,p={key:!0,ref:!0,__self:!0,__source:!0};
function q(c,a,g){var b,d={},e=null,h=null;void 0!==g&&(e=""+g);void 0!==a.key&&(e=""+a.key);void 0!==a.ref&&(h=a.ref);for(b in a)m.call(a,b)&&!p.hasOwnProperty(b)&&(d[b]=a[b]);if(c&&c.defaultProps)for(b in a=c.defaultProps,a)void 0===d[b]&&(d[b]=a[b]);return{$$typeof:k,type:c,key:e,ref:h,props:d,_owner:n.current}}exports.Fragment=l;exports.jsx=q;exports.jsxs=q;


/***/ }),

/***/ 287:
/***/ (function(__unused_webpack_module, exports) {

/**
 * @license React
 * react.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var l=Symbol.for("react.element"),n=Symbol.for("react.portal"),p=Symbol.for("react.fragment"),q=Symbol.for("react.strict_mode"),r=Symbol.for("react.profiler"),t=Symbol.for("react.provider"),u=Symbol.for("react.context"),v=Symbol.for("react.forward_ref"),w=Symbol.for("react.suspense"),x=Symbol.for("react.memo"),y=Symbol.for("react.lazy"),z=Symbol.iterator;function A(a){if(null===a||"object"!==typeof a)return null;a=z&&a[z]||a["@@iterator"];return"function"===typeof a?a:null}
var B={isMounted:function(){return!1},enqueueForceUpdate:function(){},enqueueReplaceState:function(){},enqueueSetState:function(){}},C=Object.assign,D={};function E(a,b,e){this.props=a;this.context=b;this.refs=D;this.updater=e||B}E.prototype.isReactComponent={};
E.prototype.setState=function(a,b){if("object"!==typeof a&&"function"!==typeof a&&null!=a)throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");this.updater.enqueueSetState(this,a,b,"setState")};E.prototype.forceUpdate=function(a){this.updater.enqueueForceUpdate(this,a,"forceUpdate")};function F(){}F.prototype=E.prototype;function G(a,b,e){this.props=a;this.context=b;this.refs=D;this.updater=e||B}var H=G.prototype=new F;
H.constructor=G;C(H,E.prototype);H.isPureReactComponent=!0;var I=Array.isArray,J=Object.prototype.hasOwnProperty,K={current:null},L={key:!0,ref:!0,__self:!0,__source:!0};
function M(a,b,e){var d,c={},k=null,h=null;if(null!=b)for(d in void 0!==b.ref&&(h=b.ref),void 0!==b.key&&(k=""+b.key),b)J.call(b,d)&&!L.hasOwnProperty(d)&&(c[d]=b[d]);var g=arguments.length-2;if(1===g)c.children=e;else if(1<g){for(var f=Array(g),m=0;m<g;m++)f[m]=arguments[m+2];c.children=f}if(a&&a.defaultProps)for(d in g=a.defaultProps,g)void 0===c[d]&&(c[d]=g[d]);return{$$typeof:l,type:a,key:k,ref:h,props:c,_owner:K.current}}
function N(a,b){return{$$typeof:l,type:a.type,key:b,ref:a.ref,props:a.props,_owner:a._owner}}function O(a){return"object"===typeof a&&null!==a&&a.$$typeof===l}function escape(a){var b={"=":"=0",":":"=2"};return"$"+a.replace(/[=:]/g,function(a){return b[a]})}var P=/\/+/g;function Q(a,b){return"object"===typeof a&&null!==a&&null!=a.key?escape(""+a.key):b.toString(36)}
function R(a,b,e,d,c){var k=typeof a;if("undefined"===k||"boolean"===k)a=null;var h=!1;if(null===a)h=!0;else switch(k){case "string":case "number":h=!0;break;case "object":switch(a.$$typeof){case l:case n:h=!0}}if(h)return h=a,c=c(h),a=""===d?"."+Q(h,0):d,I(c)?(e="",null!=a&&(e=a.replace(P,"$&/")+"/"),R(c,b,e,"",function(a){return a})):null!=c&&(O(c)&&(c=N(c,e+(!c.key||h&&h.key===c.key?"":(""+c.key).replace(P,"$&/")+"/")+a)),b.push(c)),1;h=0;d=""===d?".":d+":";if(I(a))for(var g=0;g<a.length;g++){k=
a[g];var f=d+Q(k,g);h+=R(k,b,e,f,c)}else if(f=A(a),"function"===typeof f)for(a=f.call(a),g=0;!(k=a.next()).done;)k=k.value,f=d+Q(k,g++),h+=R(k,b,e,f,c);else if("object"===k)throw b=String(a),Error("Objects are not valid as a React child (found: "+("[object Object]"===b?"object with keys {"+Object.keys(a).join(", ")+"}":b)+"). If you meant to render a collection of children, use an array instead.");return h}
function S(a,b,e){if(null==a)return a;var d=[],c=0;R(a,d,"","",function(a){return b.call(e,a,c++)});return d}function T(a){if(-1===a._status){var b=a._result;b=b();b.then(function(b){if(0===a._status||-1===a._status)a._status=1,a._result=b},function(b){if(0===a._status||-1===a._status)a._status=2,a._result=b});-1===a._status&&(a._status=0,a._result=b)}if(1===a._status)return a._result.default;throw a._result;}
var U={current:null},V={transition:null},W={ReactCurrentDispatcher:U,ReactCurrentBatchConfig:V,ReactCurrentOwner:K};function X(){throw Error("act(...) is not supported in production builds of React.");}
exports.Children={map:S,forEach:function(a,b,e){S(a,function(){b.apply(this,arguments)},e)},count:function(a){var b=0;S(a,function(){b++});return b},toArray:function(a){return S(a,function(a){return a})||[]},only:function(a){if(!O(a))throw Error("React.Children.only expected to receive a single React element child.");return a}};exports.Component=E;exports.Fragment=p;exports.Profiler=r;exports.PureComponent=G;exports.StrictMode=q;exports.Suspense=w;
exports.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED=W;exports.act=X;
exports.cloneElement=function(a,b,e){if(null===a||void 0===a)throw Error("React.cloneElement(...): The argument must be a React element, but you passed "+a+".");var d=C({},a.props),c=a.key,k=a.ref,h=a._owner;if(null!=b){void 0!==b.ref&&(k=b.ref,h=K.current);void 0!==b.key&&(c=""+b.key);if(a.type&&a.type.defaultProps)var g=a.type.defaultProps;for(f in b)J.call(b,f)&&!L.hasOwnProperty(f)&&(d[f]=void 0===b[f]&&void 0!==g?g[f]:b[f])}var f=arguments.length-2;if(1===f)d.children=e;else if(1<f){g=Array(f);
for(var m=0;m<f;m++)g[m]=arguments[m+2];d.children=g}return{$$typeof:l,type:a.type,key:c,ref:k,props:d,_owner:h}};exports.createContext=function(a){a={$$typeof:u,_currentValue:a,_currentValue2:a,_threadCount:0,Provider:null,Consumer:null,_defaultValue:null,_globalName:null};a.Provider={$$typeof:t,_context:a};return a.Consumer=a};exports.createElement=M;exports.createFactory=function(a){var b=M.bind(null,a);b.type=a;return b};exports.createRef=function(){return{current:null}};
exports.forwardRef=function(a){return{$$typeof:v,render:a}};exports.isValidElement=O;exports.lazy=function(a){return{$$typeof:y,_payload:{_status:-1,_result:a},_init:T}};exports.memo=function(a,b){return{$$typeof:x,type:a,compare:void 0===b?null:b}};exports.startTransition=function(a){var b=V.transition;V.transition={};try{a()}finally{V.transition=b}};exports.unstable_act=X;exports.useCallback=function(a,b){return U.current.useCallback(a,b)};exports.useContext=function(a){return U.current.useContext(a)};
exports.useDebugValue=function(){};exports.useDeferredValue=function(a){return U.current.useDeferredValue(a)};exports.useEffect=function(a,b){return U.current.useEffect(a,b)};exports.useId=function(){return U.current.useId()};exports.useImperativeHandle=function(a,b,e){return U.current.useImperativeHandle(a,b,e)};exports.useInsertionEffect=function(a,b){return U.current.useInsertionEffect(a,b)};exports.useLayoutEffect=function(a,b){return U.current.useLayoutEffect(a,b)};
exports.useMemo=function(a,b){return U.current.useMemo(a,b)};exports.useReducer=function(a,b,e){return U.current.useReducer(a,b,e)};exports.useRef=function(a){return U.current.useRef(a)};exports.useState=function(a){return U.current.useState(a)};exports.useSyncExternalStore=function(a,b,e){return U.current.useSyncExternalStore(a,b,e)};exports.useTransition=function(){return U.current.useTransition()};exports.version="18.3.1";


/***/ }),

/***/ 540:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {



if (true) {
  module.exports = __webpack_require__(287);
} else // removed by dead control flow
{}


/***/ }),

/***/ 848:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {



if (true) {
  module.exports = __webpack_require__(20);
} else // removed by dead control flow
{}


/***/ }),

/***/ 463:
/***/ (function(__unused_webpack_module, exports) {

/**
 * @license React
 * scheduler.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
function f(a,b){var c=a.length;a.push(b);a:for(;0<c;){var d=c-1>>>1,e=a[d];if(0<g(e,b))a[d]=b,a[c]=e,c=d;else break a}}function h(a){return 0===a.length?null:a[0]}function k(a){if(0===a.length)return null;var b=a[0],c=a.pop();if(c!==b){a[0]=c;a:for(var d=0,e=a.length,w=e>>>1;d<w;){var m=2*(d+1)-1,C=a[m],n=m+1,x=a[n];if(0>g(C,c))n<e&&0>g(x,C)?(a[d]=x,a[n]=c,d=n):(a[d]=C,a[m]=c,d=m);else if(n<e&&0>g(x,c))a[d]=x,a[n]=c,d=n;else break a}}return b}
function g(a,b){var c=a.sortIndex-b.sortIndex;return 0!==c?c:a.id-b.id}if("object"===typeof performance&&"function"===typeof performance.now){var l=performance;exports.unstable_now=function(){return l.now()}}else{var p=Date,q=p.now();exports.unstable_now=function(){return p.now()-q}}var r=[],t=[],u=1,v=null,y=3,z=!1,A=!1,B=!1,D="function"===typeof setTimeout?setTimeout:null,E="function"===typeof clearTimeout?clearTimeout:null,F="undefined"!==typeof setImmediate?setImmediate:null;
"undefined"!==typeof navigator&&void 0!==navigator.scheduling&&void 0!==navigator.scheduling.isInputPending&&navigator.scheduling.isInputPending.bind(navigator.scheduling);function G(a){for(var b=h(t);null!==b;){if(null===b.callback)k(t);else if(b.startTime<=a)k(t),b.sortIndex=b.expirationTime,f(r,b);else break;b=h(t)}}function H(a){B=!1;G(a);if(!A)if(null!==h(r))A=!0,I(J);else{var b=h(t);null!==b&&K(H,b.startTime-a)}}
function J(a,b){A=!1;B&&(B=!1,E(L),L=-1);z=!0;var c=y;try{G(b);for(v=h(r);null!==v&&(!(v.expirationTime>b)||a&&!M());){var d=v.callback;if("function"===typeof d){v.callback=null;y=v.priorityLevel;var e=d(v.expirationTime<=b);b=exports.unstable_now();"function"===typeof e?v.callback=e:v===h(r)&&k(r);G(b)}else k(r);v=h(r)}if(null!==v)var w=!0;else{var m=h(t);null!==m&&K(H,m.startTime-b);w=!1}return w}finally{v=null,y=c,z=!1}}var N=!1,O=null,L=-1,P=5,Q=-1;
function M(){return exports.unstable_now()-Q<P?!1:!0}function R(){if(null!==O){var a=exports.unstable_now();Q=a;var b=!0;try{b=O(!0,a)}finally{b?S():(N=!1,O=null)}}else N=!1}var S;if("function"===typeof F)S=function(){F(R)};else if("undefined"!==typeof MessageChannel){var T=new MessageChannel,U=T.port2;T.port1.onmessage=R;S=function(){U.postMessage(null)}}else S=function(){D(R,0)};function I(a){O=a;N||(N=!0,S())}function K(a,b){L=D(function(){a(exports.unstable_now())},b)}
exports.unstable_IdlePriority=5;exports.unstable_ImmediatePriority=1;exports.unstable_LowPriority=4;exports.unstable_NormalPriority=3;exports.unstable_Profiling=null;exports.unstable_UserBlockingPriority=2;exports.unstable_cancelCallback=function(a){a.callback=null};exports.unstable_continueExecution=function(){A||z||(A=!0,I(J))};
exports.unstable_forceFrameRate=function(a){0>a||125<a?console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported"):P=0<a?Math.floor(1E3/a):5};exports.unstable_getCurrentPriorityLevel=function(){return y};exports.unstable_getFirstCallbackNode=function(){return h(r)};exports.unstable_next=function(a){switch(y){case 1:case 2:case 3:var b=3;break;default:b=y}var c=y;y=b;try{return a()}finally{y=c}};exports.unstable_pauseExecution=function(){};
exports.unstable_requestPaint=function(){};exports.unstable_runWithPriority=function(a,b){switch(a){case 1:case 2:case 3:case 4:case 5:break;default:a=3}var c=y;y=a;try{return b()}finally{y=c}};
exports.unstable_scheduleCallback=function(a,b,c){var d=exports.unstable_now();"object"===typeof c&&null!==c?(c=c.delay,c="number"===typeof c&&0<c?d+c:d):c=d;switch(a){case 1:var e=-1;break;case 2:e=250;break;case 5:e=1073741823;break;case 4:e=1E4;break;default:e=5E3}e=c+e;a={id:u++,callback:b,priorityLevel:a,startTime:c,expirationTime:e,sortIndex:-1};c>d?(a.sortIndex=c,f(t,a),null===h(r)&&a===h(t)&&(B?(E(L),L=-1):B=!0,K(H,c-d))):(a.sortIndex=e,f(r,a),A||z||(A=!0,I(J)));return a};
exports.unstable_shouldYield=M;exports.unstable_wrapCallback=function(a){var b=y;return function(){var c=y;y=b;try{return a.apply(this,arguments)}finally{y=c}}};


/***/ }),

/***/ 982:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {



if (true) {
  module.exports = __webpack_require__(463);
} else // removed by dead control flow
{}


/***/ }),

/***/ 72:
/***/ (function(module) {



var stylesInDOM = [];
function getIndexByIdentifier(identifier) {
  var result = -1;
  for (var i = 0; i < stylesInDOM.length; i++) {
    if (stylesInDOM[i].identifier === identifier) {
      result = i;
      break;
    }
  }
  return result;
}
function modulesToDom(list, options) {
  var idCountMap = {};
  var identifiers = [];
  for (var i = 0; i < list.length; i++) {
    var item = list[i];
    var id = options.base ? item[0] + options.base : item[0];
    var count = idCountMap[id] || 0;
    var identifier = "".concat(id, " ").concat(count);
    idCountMap[id] = count + 1;
    var indexByIdentifier = getIndexByIdentifier(identifier);
    var obj = {
      css: item[1],
      media: item[2],
      sourceMap: item[3],
      supports: item[4],
      layer: item[5]
    };
    if (indexByIdentifier !== -1) {
      stylesInDOM[indexByIdentifier].references++;
      stylesInDOM[indexByIdentifier].updater(obj);
    } else {
      var updater = addElementStyle(obj, options);
      options.byIndex = i;
      stylesInDOM.splice(i, 0, {
        identifier: identifier,
        updater: updater,
        references: 1
      });
    }
    identifiers.push(identifier);
  }
  return identifiers;
}
function addElementStyle(obj, options) {
  var api = options.domAPI(options);
  api.update(obj);
  var updater = function updater(newObj) {
    if (newObj) {
      if (newObj.css === obj.css && newObj.media === obj.media && newObj.sourceMap === obj.sourceMap && newObj.supports === obj.supports && newObj.layer === obj.layer) {
        return;
      }
      api.update(obj = newObj);
    } else {
      api.remove();
    }
  };
  return updater;
}
module.exports = function (list, options) {
  options = options || {};
  list = list || [];
  var lastIdentifiers = modulesToDom(list, options);
  return function update(newList) {
    newList = newList || [];
    for (var i = 0; i < lastIdentifiers.length; i++) {
      var identifier = lastIdentifiers[i];
      var index = getIndexByIdentifier(identifier);
      stylesInDOM[index].references--;
    }
    var newLastIdentifiers = modulesToDom(newList, options);
    for (var _i = 0; _i < lastIdentifiers.length; _i++) {
      var _identifier = lastIdentifiers[_i];
      var _index = getIndexByIdentifier(_identifier);
      if (stylesInDOM[_index].references === 0) {
        stylesInDOM[_index].updater();
        stylesInDOM.splice(_index, 1);
      }
    }
    lastIdentifiers = newLastIdentifiers;
  };
};

/***/ }),

/***/ 659:
/***/ (function(module) {



var memo = {};

/* istanbul ignore next  */
function getTarget(target) {
  if (typeof memo[target] === "undefined") {
    var styleTarget = document.querySelector(target);

    // Special case to return head of iframe instead of iframe itself
    if (window.HTMLIFrameElement && styleTarget instanceof window.HTMLIFrameElement) {
      try {
        // This will throw an exception if access to iframe is blocked
        // due to cross-origin restrictions
        styleTarget = styleTarget.contentDocument.head;
      } catch (e) {
        // istanbul ignore next
        styleTarget = null;
      }
    }
    memo[target] = styleTarget;
  }
  return memo[target];
}

/* istanbul ignore next  */
function insertBySelector(insert, style) {
  var target = getTarget(insert);
  if (!target) {
    throw new Error("Couldn't find a style target. This probably means that the value for the 'insert' parameter is invalid.");
  }
  target.appendChild(style);
}
module.exports = insertBySelector;

/***/ }),

/***/ 159:
/***/ (function(module) {



/* istanbul ignore next  */
function insertStyleElement(options) {
  var element = document.createElement("style");
  options.setAttributes(element, options.attributes);
  options.insert(element, options.options);
  return element;
}
module.exports = insertStyleElement;

/***/ }),

/***/ 56:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {



/* istanbul ignore next  */
function setAttributesWithoutAttributes(styleElement) {
  var nonce =  true ? __webpack_require__.nc : 0;
  if (nonce) {
    styleElement.setAttribute("nonce", nonce);
  }
}
module.exports = setAttributesWithoutAttributes;

/***/ }),

/***/ 825:
/***/ (function(module) {



/* istanbul ignore next  */
function apply(styleElement, options, obj) {
  var css = "";
  if (obj.supports) {
    css += "@supports (".concat(obj.supports, ") {");
  }
  if (obj.media) {
    css += "@media ".concat(obj.media, " {");
  }
  var needLayer = typeof obj.layer !== "undefined";
  if (needLayer) {
    css += "@layer".concat(obj.layer.length > 0 ? " ".concat(obj.layer) : "", " {");
  }
  css += obj.css;
  if (needLayer) {
    css += "}";
  }
  if (obj.media) {
    css += "}";
  }
  if (obj.supports) {
    css += "}";
  }
  var sourceMap = obj.sourceMap;
  if (sourceMap && typeof btoa !== "undefined") {
    css += "\n/*# sourceMappingURL=data:application/json;base64,".concat(btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))), " */");
  }

  // For old IE
  /* istanbul ignore if  */
  options.styleTagTransform(css, styleElement, options.options);
}
function removeStyleElement(styleElement) {
  // istanbul ignore if
  if (styleElement.parentNode === null) {
    return false;
  }
  styleElement.parentNode.removeChild(styleElement);
}

/* istanbul ignore next  */
function domAPI(options) {
  if (typeof document === "undefined") {
    return {
      update: function update() {},
      remove: function remove() {}
    };
  }
  var styleElement = options.insertStyleElement(options);
  return {
    update: function update(obj) {
      apply(styleElement, options, obj);
    },
    remove: function remove() {
      removeStyleElement(styleElement);
    }
  };
}
module.exports = domAPI;

/***/ }),

/***/ 113:
/***/ (function(module) {



/* istanbul ignore next  */
function styleTagTransform(css, styleElement) {
  if (styleElement.styleSheet) {
    styleElement.styleSheet.cssText = css;
  } else {
    while (styleElement.firstChild) {
      styleElement.removeChild(styleElement.firstChild);
    }
    styleElement.appendChild(document.createTextNode(css));
  }
}
module.exports = styleTagTransform;

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			id: moduleId,
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	!function() {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = function(module) {
/******/ 			var getter = module && module.__esModule ?
/******/ 				function() { return module['default']; } :
/******/ 				function() { return module; };
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	!function() {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = function(exports, definition) {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	!function() {
/******/ 		__webpack_require__.o = function(obj, prop) { return Object.prototype.hasOwnProperty.call(obj, prop); }
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	!function() {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = function(exports) {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/nonce */
/******/ 	!function() {
/******/ 		__webpack_require__.nc = undefined;
/******/ 	}();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "default": function() { return /* binding */ src_documents; },
  init: function() { return /* binding */ init; }
});

// EXTERNAL MODULE: ./node_modules/react/index.js
var react = __webpack_require__(540);
// EXTERNAL MODULE: ./node_modules/react-dom/client.js
var client = __webpack_require__(338);
;// ./src/api/random.js
// This file is part of Moodle - https://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <https://www.gnu.org/licenses/>.

// Números al azar con el generador criptográfico del navegador (SonarCloud
// javascript:S2245). Se usa para ids de la UI y para las demoras simuladas de
// los dobles de desarrollo: nada sensible, pero así no queda ningún
// Math.random. getRandomValues funciona también fuera de https (Moodle local).

/** Número uniforme en [0, 1). */
function randomFloat() {
  const [value] = globalThis.crypto.getRandomValues(new Uint32Array(1));
  return value / 2 ** 32;
}

/** Id corto e irrepetible para elementos de la UI. */
function randomId() {
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(8));
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
  return `${Date.now()}-${hex}`;
}
;// ./src/documents/api.js
// This file is part of Moodle - https://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <https://www.gnu.org/licenses/>.



/**
 * Part of the NexusAI plugin (local_nexusai).
 *
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * Client of the NexusAI documents API.
 *
 * Calls Moodle's External Functions through core/ajax. Each call goes out
 * signed with Moodle's sesskey (CSRF) and, on the server, the PHP plugin
 * signs it with HMAC and does the POST/GET/DELETE to the Python backend.
 *
 * Mock fallback: when run outside Moodle (standalone dev, Storybook),
 * returns sample data instead of failing — handy for iterating on the UI.
 */

// ============================================================
// Mock state (for dev outside Moodle)
// ============================================================
const MOCK_DOCS = [{
  id: "mock-1",
  course_id: 2,
  uploader_id: 2,
  filename: "apunte-derivadas.pdf",
  mime_type: "application/pdf",
  status: "indexed",
  error_message: null
}, {
  id: "mock-2",
  course_id: 2,
  uploader_id: 2,
  filename: "teorema-fundamental.pdf",
  mime_type: "application/pdf",
  status: "indexed",
  error_message: null
}, {
  id: "mock-3",
  course_id: 2,
  uploader_id: 2,
  filename: "scan-clase-3.pdf",
  mime_type: "application/pdf",
  status: "error",
  error_message: "El PDF no tiene texto extraíble. Solo se admiten PDFs con texto, no escaneados."
}];

// ============================================================
// Helper to get Moodle's core/ajax
// ============================================================
let cachedFetchMany = null;
async function getMoodleAjax() {
  if (cachedFetchMany) return cachedFetchMany;
  if (typeof window === "undefined" || !window.M || !window.M.cfg) {
    return null;
  }
  try {
    const ajax = await new Promise((resolve, reject) => {
      // eslint-disable-next-line no-undef
      window.require(["core/ajax"], resolve, reject);
    });
    cachedFetchMany = ajax.call;
    return cachedFetchMany;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[NexusAI/documents] core/ajax no disponible:", err);
    return null;
  }
}
async function callMoodle(methodname, args) {
  const fetchMany = await getMoodleAjax();
  if (!fetchMany) {
    throw new Error("core/ajax not available (running outside Moodle)");
  }
  const [responsePromise] = fetchMany([{
    methodname,
    args
  }]);
  const response = await responsePromise;
  return response;
}

// ============================================================
// Public operations
// ============================================================

/**
 * Lists the course documents.
 *
 * UX-17 (#387): `limit`/`offset` are optional — without `limit`, the backend
 * returns everything up to its internal cap (used by ExamGeneratorPanel.jsx,
 * which needs to choose among all the indexed documents, not one page).
 *
 * @param {number} courseId
 * @param {number} [limit]  Max items per page. No value: no paging.
 * @param {number} [offset] Position to page from (default 0).
 * @returns {Promise<{total:number, items:Array}>}
 */
async function listDocuments(courseId, limit = null, offset = 0) {
  if (typeof window === "undefined" || !window.M?.cfg) {
    await new Promise(r => setTimeout(r, 300));
    const all = MOCK_DOCS.filter(d => d.course_id === courseId);
    const items = limit != null ? all.slice(offset, offset + limit) : all;
    return {
      total: all.length,
      items
    };
  }
  return callMoodle("local_nexusai_document_list", {
    courseid: courseId,
    limit,
    offset
  });
}

/**
 * Current state of a document (for polling).
 *
 * @param {number} courseId
 * @param {string} documentId
 * @returns {Promise<object>}
 */
async function getDocumentStatus(courseId, documentId) {
  if (typeof window === "undefined" || !window.M?.cfg) {
    await new Promise(r => setTimeout(r, 200));
    return MOCK_DOCS.find(d => d.id === documentId);
  }
  return callMoodle("local_nexusai_document_status", {
    courseid: courseId,
    documentid: documentId
  });
}

/**
 * Preview of the text extracted from a document (CONT-08 / #357).
 *
 * @param {number} courseId
 * @param {string} documentId
 * @returns {Promise<{document_id:string, filename:string, status:string, preview:?string, char_count:number, truncated:boolean}>}
 */
async function getDocumentPreview(courseId, documentId) {
  if (typeof window === "undefined" || !window.M?.cfg) {
    await new Promise(r => setTimeout(r, 200));
    const doc = MOCK_DOCS.find(d => d.id === documentId);
    const sample = "Una derivada mide la tasa de cambio instantánea de una función. " + "Formalmente, f'(x) = lim(h→0) [f(x+h) - f(x)] / h. ".repeat(12);
    return {
      document_id: documentId,
      filename: doc?.filename || "",
      status: doc?.status || "indexed",
      preview: doc?.status === "indexed" ? sample.slice(0, 600) : null,
      char_count: doc?.status === "indexed" ? 600 : 0,
      truncated: doc?.status === "indexed"
    };
  }
  return callMoodle("local_nexusai_document_preview", {
    courseid: courseId,
    documentid: documentId
  });
}

/**
 * Uploads a file — converts it to base64 and calls the External Function.
 *
 * @param {number} courseId
 * @param {File} file  File from the HTML5 input (drag-and-drop or file input)
 * @returns {Promise<object>}  Initial document state (status='pending' or 'indexing')
 */
const ACCEPTED_MIME_TYPES = new Set(["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.presentationml.presentation", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "text/plain", "text/csv", "text/markdown", "text/html"]);

// The browser often sends an empty file.type (or a generic one, e.g. "application/octet-stream")
// for CSV, Markdown and sometimes HTML. When that happens we derive the MIME type from
// the extension instead of rejecting the file.
const EXTENSION_MIME_TYPES = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  txt: "text/plain",
  csv: "text/csv",
  md: "text/markdown",
  markdown: "text/markdown",
  html: "text/html",
  htm: "text/html"
};
function resolveMimeType(file) {
  if (ACCEPTED_MIME_TYPES.has(file.type)) return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase();
  const byExtension = ext ? EXTENSION_MIME_TYPES[ext] : undefined;
  return byExtension || file.type;
}

// `section`: course section where the activity is created (0 = General); it is
// required, because all material becomes a Moodle activity (VIS-03).
// `visible`: whether students see the activity (Moodle's eye icon).
async function uploadDocument(courseId, file, section, visible = true) {
  if (!file) throw new Error("No file provided");
  if (section === null || section === undefined) throw new Error("Choose a unit");
  const mimeType = resolveMimeType(file);
  if (!ACCEPTED_MIME_TYPES.has(mimeType)) {
    throw new Error(`Unsupported format: ${file.type || "unknown"}. ` + "Accepted: PDF, DOCX, PPTX, XLSX, CSV, MD, HTML and TXT.");
  }
  if (file.size > 20 * 1024 * 1024) {
    throw new Error(`File too large (${formatBytes(file.size)}). Maximum: 20 MB`);
  }
  if (file.size === 0) {
    throw new Error("The file is empty");
  }

  // Convert File → base64. FileReader is async but we wrap it in a Promise.
  const contentB64 = await fileToBase64(file);

  // Mock fallback.
  if (typeof window === "undefined" || !window.M?.cfg) {
    await new Promise(r => setTimeout(r, 600));
    const mock = {
      id: `mock-${Date.now()}`,
      course_id: courseId,
      uploader_id: 2,
      filename: file.name,
      mime_type: mimeType,
      section,
      cmid: 1000 + MOCK_DOCS.length,
      visible,
      status: "pending",
      error_message: null
    };
    MOCK_DOCS.unshift(mock);
    // Simulate a state transition for the demo.
    setTimeout(() => {
      mock.status = "indexing";
    }, 1500);
    setTimeout(() => {
      mock.status = "indexed";
    }, 4000);
    return mock;
  }
  return callMoodle("local_nexusai_document_upload", {
    courseid: courseId,
    filename: file.name,
    mimetype: mimeType,
    content_b64: contentB64,
    section,
    visible
  });
}

/**
 * Replaces the file of an existing document without changing its document_id
 * (CONT-07 / #356) — old chat citations keep pointing at the same id.
 *
 * Same type/size validations as `uploadDocument`.
 *
 * @param {number} courseId
 * @param {string} documentId
 * @param {File} file
 * @returns {Promise<object>} Document state after the replacement.
 */
async function replaceDocument(courseId, documentId, file) {
  if (!file) throw new Error("No file provided");
  const mimeType = resolveMimeType(file);
  if (!ACCEPTED_MIME_TYPES.has(mimeType)) {
    throw new Error(`Unsupported format: ${file.type || "unknown"}. ` + "Accepted: PDF, DOCX, PPTX, XLSX, CSV, MD, HTML and TXT.");
  }
  if (file.size > 20 * 1024 * 1024) {
    throw new Error(`File too large (${formatBytes(file.size)}). Maximum: 20 MB`);
  }
  if (file.size === 0) {
    throw new Error("The file is empty");
  }
  const contentB64 = await fileToBase64(file);
  if (typeof window === "undefined" || !window.M?.cfg) {
    await new Promise(r => setTimeout(r, 600));
    const mock = MOCK_DOCS.find(d => d.id === documentId);
    if (mock) {
      mock.filename = file.name;
      mock.mime_type = mimeType;
      mock.status = "pending";
      mock.error_message = null;
      setTimeout(() => {
        mock.status = "indexing";
      }, 1500);
      setTimeout(() => {
        mock.status = "indexed";
      }, 4000);
    }
    return mock || {
      id: documentId,
      filename: file.name,
      mime_type: mimeType,
      status: "pending"
    };
  }
  return callMoodle("local_nexusai_document_replace", {
    courseid: courseId,
    documentid: documentId,
    filename: file.name,
    mimetype: mimeType,
    content_b64: contentB64
  });
}

/**
 * Deletes a document.
 *
 * @param {number} courseId
 * @param {string} documentId
 */
async function deleteDocument(courseId, documentId) {
  if (typeof window === "undefined" || !window.M?.cfg) {
    await new Promise(r => setTimeout(r, 200));
    const idx = MOCK_DOCS.findIndex(d => d.id === documentId);
    if (idx >= 0) MOCK_DOCS.splice(idx, 1);
    return {
      success: true
    };
  }
  return callMoodle("local_nexusai_document_delete", {
    courseid: courseId,
    documentid: documentId
  });
}

/**
 * Re-indexes an already uploaded document, without asking for a new file (CONT-09,
 * #358) — reuses the file already stored on the server.
 *
 * @param {number} courseId
 * @param {string} documentId
 */
async function reindexDocument(courseId, documentId) {
  if (typeof window === "undefined" || !window.M?.cfg) {
    await new Promise(r => setTimeout(r, 300));
    const mock = MOCK_DOCS.find(d => d.id === documentId);
    if (mock) {
      mock.status = "pending";
      mock.error_message = null;
      setTimeout(() => {
        mock.status = "indexing";
      }, 1000);
      setTimeout(() => {
        mock.status = "indexed";
      }, 2500);
    }
    return mock || {
      id: documentId,
      status: "pending"
    };
  }
  return callMoodle("local_nexusai_document_reindex", {
    courseid: courseId,
    documentid: documentId
  });
}

// ============================================================
// Helpers
// ============================================================

/**
 * Converts a File to a base64 string (without the `data:...;base64,` prefix).
 *
 * @param {File} file
 * @returns {Promise<string>}
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // reader.result comes as "data:application/pdf;base64,XXXXX"
      // We strip the data URL prefix to send only the plain base64.
      const result = reader.result;
      const commaIdx = result.indexOf(",");
      resolve(commaIdx >= 0 ? result.substring(commaIdx + 1) : result);
    };
    reader.onerror = () => reject(reader.error || new Error("FileReader failed"));
    reader.readAsDataURL(file);
  });
}
function formatBytes(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1024 / 1024).toFixed(1) + " MB";
}

// ============================================================
// Feature G — Teacher gaps
// ============================================================

const MOCK_GAPS = {
  course_id: 2,
  days: 30,
  total: 3,
  items: [{
    question: "¿cómo se calcula el determinante de una matriz 4x4?",
    count: 5,
    last_asked_at: new Date(Date.now() - 86400000).toISOString(),
    avg_similarity: 0.18,
    question_ids: ["mock-1a", "mock-1b"],
    is_archived: false
  }, {
    question: "¿qué es la regla de la cadena en derivadas parciales?",
    count: 3,
    last_asked_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    avg_similarity: 0.32,
    question_ids: ["mock-2a"],
    is_archived: false
  }, {
    question: "ejercicios resueltos de integrales por partes",
    count: 2,
    last_asked_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    avg_similarity: null,
    question_ids: ["mock-3a"],
    is_archived: false
  }]
};

/**
 * Lists the teacher's gaps — unanswered questions, grouped.
 *
 * @param {number} courseId
 * @param {number} [days]   Time window (default 30).
 * @param {number} [limit]  Max items per page (default 30).
 * @param {boolean} [includeArchived] Include already archived gaps (DOC-D08).
 * @param {number} [offset] Position to page from (UX-15, default 0).
 * @returns {Promise<{course_id:number, days:number, total:number, items:Array}>}
 */
async function listGaps(courseId, days = 30, limit = 30, includeArchived = false, offset = 0) {
  const fetchMany = await getMoodleAjax();
  if (!fetchMany) {
    await new Promise(r => setTimeout(r, 400));
    return {
      ...MOCK_GAPS,
      course_id: courseId,
      days
    };
  }
  const [responsePromise] = fetchMany([{
    methodname: "local_nexusai_gaps_list",
    args: {
      courseid: courseId,
      days,
      limit,
      includearchived: includeArchived,
      offset
    }
  }]);
  const response = await responsePromise;
  return response;
}

/**
 * Archives or unarchives a detected gap (DOC-D08, issue #383).
 *
 * @param {number} courseId
 * @param {string[]} questionIds Row IDs returned by listGaps (not the text).
 * @param {boolean} archived true to archive, false to unarchive.
 * @returns {Promise<{course_id:number, archived:boolean, affected:number}>}
 */
async function archiveGap(courseId, questionIds, archived) {
  const fetchMany = await getMoodleAjax();
  if (!fetchMany) {
    await new Promise(r => setTimeout(r, 300));
    return {
      course_id: courseId,
      archived,
      affected: questionIds.length
    };
  }
  const [responsePromise] = fetchMany([{
    methodname: "local_nexusai_gaps_archive",
    args: {
      courseid: courseId,
      questionids: questionIds,
      archived
    }
  }]);
  const response = await responsePromise;
  return response;
}
const MOCK_FAQ_TOPICS = {
  course_id: 2,
  days: 30,
  total_questions: 14,
  topics: [{
    topic: "Fechas y modalidad del parcial",
    count: 6,
    example_questions: ["¿qué temas entran en el parcial?", "¿el parcial es a libro abierto?"]
  }, {
    topic: "Determinantes y matrices",
    count: 5,
    example_questions: ["¿cómo se calcula el determinante de una matriz 4x4?"]
  }, {
    topic: "Regla de la cadena",
    count: 3,
    example_questions: ["¿qué es la regla de la cadena en derivadas parciales?"]
  }]
};

/**
 * Students' most frequent questions, grouped by topic (DOC-D02).
 *
 * @param {number} courseId
 * @param {number} [days] Time window (default 30).
 * @returns {Promise<{course_id:number, days:number, total_questions:number, topics:Array}>}
 */
async function getFaqTopics(courseId, days = 30) {
  const fetchMany = await getMoodleAjax();
  if (!fetchMany) {
    await new Promise(r => setTimeout(r, 400));
    return {
      ...MOCK_FAQ_TOPICS,
      course_id: courseId,
      days
    };
  }
  const [responsePromise] = fetchMany([{
    methodname: "local_nexusai_analytics_faq_topics",
    args: {
      courseid: courseId,
      days
    }
  }]);
  const response = await responsePromise;
  return response;
}
const MOCK_ANALYTICS_DASHBOARD = {
  course_id: 2,
  period_days: 30,
  top_queries: [{
    question: "¿qué temas entran en el parcial?",
    count: 6
  }, {
    question: "¿cómo se calcula el determinante de una matriz 4x4?",
    count: 5
  }, {
    question: "¿qué es la regla de la cadena en derivadas parciales?",
    count: 3
  }, {
    question: "¿el parcial es a libro abierto?",
    count: 2
  }],
  daily_message_counts: Array.from({
    length: 14
  }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return {
      date: d.toISOString().slice(0, 10),
      message_count: Math.round(3 + randomFloat() * 12)
    };
  }),
  quiz_score_distribution: {
    total_attempts: 27,
    average_score: 68.4,
    buckets: [{
      range: "0-20",
      count: 1
    }, {
      range: "20-40",
      count: 3
    }, {
      range: "40-60",
      count: 6
    }, {
      range: "60-80",
      count: 11
    }, {
      range: "80-100",
      count: 6
    }]
  },
  gaps_ratio: {
    gaps_detected: 12,
    questions_answered: 78,
    ratio: 0.133
  },
  feedback_ratio: {
    helpful_count: 34,
    total_rated: 41,
    useful_pct: 82.9
  },
  topics_consulted: 9
};

/**
 * Aggregated metrics dashboard of a course for the teacher (ANALYTICS-01/02):
 * top queries, daily usage, quiz score distribution and gaps ratio.
 *
 * @param {number} courseId
 * @param {number} [days] Time window (default 30).
 * @returns {Promise<{course_id:number, period_days:number, top_queries:Array,
 *   daily_message_counts:Array, quiz_score_distribution:Object, gaps_ratio:Object,
 *   topics_consulted:number}>}
 */
async function getAnalyticsDashboard(courseId, days = 30) {
  const fetchMany = await getMoodleAjax();
  if (!fetchMany) {
    await new Promise(r => setTimeout(r, 400));
    return {
      ...MOCK_ANALYTICS_DASHBOARD,
      course_id: courseId,
      period_days: days
    };
  }
  const [responsePromise] = fetchMany([{
    methodname: "local_nexusai_analytics_dashboard",
    args: {
      courseid: courseId,
      days
    }
  }]);
  const response = await responsePromise;
  return response;
}
;// ./src/api/courseSections.js
// This file is part of Moodle - https://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <https://www.gnu.org/licenses/>.

/**
 * Part of the NexusAI plugin (local_nexusai).
 *
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * API client of the course sections (BUS-05).
 *
 * Calls `local_nexusai_course_sections_list` — used both by the section
 * selector when uploading material (DocumentsManager.jsx) and by the
 * search filter (SearchPanel.jsx).
 */

async function courseSections_getMoodleAjax() {
  if (typeof window === "undefined" || !window.M?.cfg) return null;
  try {
    const ajax = await new Promise((resolve, reject) => {
      // eslint-disable-next-line no-undef
      window.require(["core/ajax"], resolve, reject);
    });
    return ajax;
  } catch {
    return null;
  }
}

/**
 * Lists the sections (number + name) of a course.
 *
 * @param {number} courseId
 * @returns {Promise<Array<{section: number, name: string}>>}
 */
async function listCourseSections(courseId) {
  const ajax = await courseSections_getMoodleAjax();
  if (!ajax) {
    // Mock fuera de Moodle.
    return [{
      section: 0,
      name: "General"
    }, {
      section: 1,
      name: "Unidad 1"
    }, {
      section: 2,
      name: "Unidad 2"
    }];
  }
  const [responsePromise] = ajax.call([{
    methodname: "local_nexusai_course_sections_list",
    args: {
      courseid: courseId
    }
  }]);
  const response = await responsePromise;
  return response;
}
// EXTERNAL MODULE: ./node_modules/react/jsx-runtime.js
var jsx_runtime = __webpack_require__(848);
;// ./src/components/icons.jsx
/* unused harmony import specifier */ var _jsxs;
/* unused harmony import specifier */ var _jsx;
// This file is part of Moodle - https://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <https://www.gnu.org/licenses/>.

/**
 * Part of the NexusAI plugin (local_nexusai).
 *
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * Inline lucide-style icons (what shadcn/ui uses).
 *
 * Convention:
 *   - viewBox 24x24
 *   - stroke=currentColor, fill=none (except the "filled" ones noted)
 *   - strokeLinecap/Linejoin="round", strokeWidth=2
 *   - default size=16 (overridable with the size prop)
 *
 * They replace emojis so the UI stays consistent with the rest of the
 * shadcn system (no typographic variations, no OS-specific glyphs, the color
 * is inherited from the parent via currentColor).
 */



const baseProps = size => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": "true"
});

// ── Files / documents ──────────────────────────────────────────────────────
const IconFile = ({
  size = 14
}) => /*#__PURE__*/(0,jsx_runtime.jsxs)("svg", {
  ...baseProps(size),
  children: [/*#__PURE__*/(0,jsx_runtime.jsx)("path", {
    d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
  }), /*#__PURE__*/(0,jsx_runtime.jsx)("polyline", {
    points: "14 2 14 8 20 8"
  })]
});
const IconFileText = ({
  size = 14
}) => /*#__PURE__*/(0,jsx_runtime.jsxs)("svg", {
  ...baseProps(size),
  children: [/*#__PURE__*/(0,jsx_runtime.jsx)("path", {
    d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
  }), /*#__PURE__*/(0,jsx_runtime.jsx)("polyline", {
    points: "14 2 14 8 20 8"
  }), /*#__PURE__*/(0,jsx_runtime.jsx)("line", {
    x1: "8",
    y1: "13",
    x2: "16",
    y2: "13"
  }), /*#__PURE__*/(0,jsx_runtime.jsx)("line", {
    x1: "8",
    y1: "17",
    x2: "13",
    y2: "17"
  })]
});

// ── Course / library ───────────────────────────────────────────────────────
const IconBookOpen = ({
  size = 14
}) => /*#__PURE__*/(0,jsx_runtime.jsxs)("svg", {
  ...baseProps(size),
  children: [/*#__PURE__*/(0,jsx_runtime.jsx)("path", {
    d: "M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"
  }), /*#__PURE__*/(0,jsx_runtime.jsx)("path", {
    d: "M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"
  })]
});

// ── Globe (multi-course) ───────────────────────────────────────────────────
const IconGlobe = ({
  size = 14
}) => /*#__PURE__*/(0,jsx_runtime.jsxs)("svg", {
  ...baseProps(size),
  children: [/*#__PURE__*/(0,jsx_runtime.jsx)("circle", {
    cx: "12",
    cy: "12",
    r: "10"
  }), /*#__PURE__*/(0,jsx_runtime.jsx)("line", {
    x1: "2",
    y1: "12",
    x2: "22",
    y2: "12"
  }), /*#__PURE__*/(0,jsx_runtime.jsx)("path", {
    d: "M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
  })]
});

// ── History (reloj) ────────────────────────────────────────────────────────
const IconHistory = ({
  size = 15
}) => /*#__PURE__*/_jsxs("svg", {
  ...baseProps(size),
  children: [/*#__PURE__*/_jsx("path", {
    d: "M3 12a9 9 0 1 0 9-9 9.74 9.74 0 0 0-6.74 2.74L3 8"
  }), /*#__PURE__*/_jsx("polyline", {
    points: "3 3 3 8 8 8"
  }), /*#__PURE__*/_jsx("line", {
    x1: "12",
    y1: "7",
    x2: "12",
    y2: "12"
  }), /*#__PURE__*/_jsx("line", {
    x1: "12",
    y1: "12",
    x2: "15",
    y2: "15"
  })]
});

// ── Clock (modo cronometrado, SP-15) ───────────────────────────────────────
const IconClock = ({
  size = 14
}) => /*#__PURE__*/(0,jsx_runtime.jsxs)("svg", {
  ...baseProps(size),
  children: [/*#__PURE__*/(0,jsx_runtime.jsx)("circle", {
    cx: "12",
    cy: "12",
    r: "9"
  }), /*#__PURE__*/(0,jsx_runtime.jsx)("polyline", {
    points: "12 7 12 12 15.5 14"
  })]
});

// ── RefreshCw (regenerate answer — ASIST-03) ────────────────────────────────
const IconRefreshCw = ({
  size = 14
}) => /*#__PURE__*/_jsxs("svg", {
  ...baseProps(size),
  children: [/*#__PURE__*/_jsx("polyline", {
    points: "23 4 23 10 17 10"
  }), /*#__PURE__*/_jsx("polyline", {
    points: "1 20 1 14 7 14"
  }), /*#__PURE__*/_jsx("path", {
    d: "M3.51 9a9 9 0 0 1 14.85-3.36L23 10"
  }), /*#__PURE__*/_jsx("path", {
    d: "M1 14l4.64 4.36A9 9 0 0 0 20.49 15"
  })]
});

// ── Target (gaps detectados) ───────────────────────────────────────────────
const IconTarget = ({
  size = 14
}) => /*#__PURE__*/(0,jsx_runtime.jsxs)("svg", {
  ...baseProps(size),
  children: [/*#__PURE__*/(0,jsx_runtime.jsx)("circle", {
    cx: "12",
    cy: "12",
    r: "10"
  }), /*#__PURE__*/(0,jsx_runtime.jsx)("circle", {
    cx: "12",
    cy: "12",
    r: "6"
  }), /*#__PURE__*/(0,jsx_runtime.jsx)("circle", {
    cx: "12",
    cy: "12",
    r: "2"
  })]
});

// ── Calendar (exams / due dates — CAL-01) ───────────────────────────────────
const IconCalendar = ({
  size = 14
}) => /*#__PURE__*/_jsxs("svg", {
  ...baseProps(size),
  children: [/*#__PURE__*/_jsx("rect", {
    x: "3",
    y: "4",
    width: "18",
    height: "18",
    rx: "2"
  }), /*#__PURE__*/_jsx("line", {
    x1: "16",
    y1: "2",
    x2: "16",
    y2: "6"
  }), /*#__PURE__*/_jsx("line", {
    x1: "8",
    y1: "2",
    x2: "8",
    y2: "6"
  }), /*#__PURE__*/_jsx("line", {
    x1: "3",
    y1: "10",
    x2: "21",
    y2: "10"
  })]
});

// ── HelpCircle (preguntas frecuentes / dudas) ───────────────────────────────
const IconHelpCircle = ({
  size = 14
}) => /*#__PURE__*/(0,jsx_runtime.jsxs)("svg", {
  ...baseProps(size),
  children: [/*#__PURE__*/(0,jsx_runtime.jsx)("circle", {
    cx: "12",
    cy: "12",
    r: "10"
  }), /*#__PURE__*/(0,jsx_runtime.jsx)("path", {
    d: "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"
  }), /*#__PURE__*/(0,jsx_runtime.jsx)("line", {
    x1: "12",
    y1: "17",
    x2: "12.01",
    y2: "17"
  })]
});

// ── Info (Help tab, ONB-07 — circle with "i", different from HelpCircle's "?") ──
const IconInfo = ({
  size = 14
}) => /*#__PURE__*/(0,jsx_runtime.jsxs)("svg", {
  ...baseProps(size),
  children: [/*#__PURE__*/(0,jsx_runtime.jsx)("circle", {
    cx: "12",
    cy: "12",
    r: "10"
  }), /*#__PURE__*/(0,jsx_runtime.jsx)("line", {
    x1: "12",
    y1: "16",
    x2: "12",
    y2: "11.5"
  }), /*#__PURE__*/(0,jsx_runtime.jsx)("line", {
    x1: "12",
    y1: "8",
    x2: "12.01",
    y2: "8"
  })]
});

// ── Sparkles (intro / empty state positivo) ────────────────────────────────
const IconSparkles = ({
  size = 16
}) => /*#__PURE__*/_jsxs("svg", {
  ...baseProps(size),
  children: [/*#__PURE__*/_jsx("path", {
    d: "M12 3l1.9 5.6L19.5 10.5l-5.6 1.9L12 18l-1.9-5.6L4.5 10.5l5.6-1.9z"
  }), /*#__PURE__*/_jsx("path", {
    d: "M19 3v4"
  }), /*#__PURE__*/_jsx("path", {
    d: "M21 5h-4"
  }), /*#__PURE__*/_jsx("path", {
    d: "M5 17v4"
  }), /*#__PURE__*/_jsx("path", {
    d: "M7 19H3"
  })]
});

// ── Check / X / Alert (feedback) ───────────────────────────────────────────
const IconCheck = ({
  size = 14
}) => /*#__PURE__*/(0,jsx_runtime.jsx)("svg", {
  ...baseProps(size),
  children: /*#__PURE__*/(0,jsx_runtime.jsx)("polyline", {
    points: "20 6 9 17 4 12"
  })
});
const IconArchive = ({
  size = 14
}) => /*#__PURE__*/(0,jsx_runtime.jsxs)("svg", {
  ...baseProps(size),
  children: [/*#__PURE__*/(0,jsx_runtime.jsx)("rect", {
    x: "3",
    y: "4",
    width: "18",
    height: "4",
    rx: "1"
  }), /*#__PURE__*/(0,jsx_runtime.jsx)("path", {
    d: "M4 8v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"
  }), /*#__PURE__*/(0,jsx_runtime.jsx)("line", {
    x1: "10",
    y1: "13",
    x2: "14",
    y2: "13"
  })]
});
const IconX = ({
  size = 14
}) => /*#__PURE__*/_jsxs("svg", {
  ...baseProps(size),
  children: [/*#__PURE__*/_jsx("line", {
    x1: "18",
    y1: "6",
    x2: "6",
    y2: "18"
  }), /*#__PURE__*/_jsx("line", {
    x1: "6",
    y1: "6",
    x2: "18",
    y2: "18"
  })]
});

// ── Trophy (score alto) ────────────────────────────────────────────────────
const IconTrophy = ({
  size = 22
}) => /*#__PURE__*/_jsxs("svg", {
  ...baseProps(size),
  children: [/*#__PURE__*/_jsx("path", {
    d: "M8 21h8"
  }), /*#__PURE__*/_jsx("path", {
    d: "M12 17v4"
  }), /*#__PURE__*/_jsx("path", {
    d: "M7 4h10v4a5 5 0 0 1-10 0z"
  }), /*#__PURE__*/_jsx("path", {
    d: "M7 5H4a2 2 0 0 0-2 2v0a4 4 0 0 0 4 4h1"
  }), /*#__PURE__*/_jsx("path", {
    d: "M17 5h3a2 2 0 0 1 2 2v0a4 4 0 0 1-4 4h-1"
  })]
});

// ── ThumbsUp (score medio) ─────────────────────────────────────────────────
const IconThumbsUp = ({
  size = 22
}) => /*#__PURE__*/(0,jsx_runtime.jsxs)("svg", {
  ...baseProps(size),
  children: [/*#__PURE__*/(0,jsx_runtime.jsx)("path", {
    d: "M7 10v12"
  }), /*#__PURE__*/(0,jsx_runtime.jsx)("path", {
    d: "M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H7V10l4-9a3 3 0 0 1 3 3z"
  })]
});

// ── Flame (SP-16: racha de estudio) ────────────────────────────────────────
const IconFlame = ({
  size = 16
}) => /*#__PURE__*/_jsx("svg", {
  ...baseProps(size),
  children: /*#__PURE__*/_jsx("path", {
    d: "M8.5 14.5A2.5 2.5 0 0 0 11 17a2.5 2.5 0 0 0 2.5-2.5c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2 1.5z"
  })
});

// ── ThumbsDown (ASIST-01: negative feedback on an answer) ──────────────────
const IconThumbsDown = ({
  size = 22
}) => /*#__PURE__*/_jsxs("svg", {
  ...baseProps(size),
  children: [/*#__PURE__*/_jsx("path", {
    d: "M17 14V2"
  }), /*#__PURE__*/_jsx("path", {
    d: "M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H17v12l-4 9a3 3 0 0 1-3-3z"
  })]
});

// ── Book (score bajo, "a estudiar") ────────────────────────────────────────
const IconBook = ({
  size = 22
}) => /*#__PURE__*/_jsxs("svg", {
  ...baseProps(size),
  children: [/*#__PURE__*/_jsx("path", {
    d: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20"
  }), /*#__PURE__*/_jsx("path", {
    d: "M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
  })]
});

// ── Search ─────────────────────────────────────────────────────────────────
const IconSearch = ({
  size = 14
}) => /*#__PURE__*/(0,jsx_runtime.jsxs)("svg", {
  ...baseProps(size),
  children: [/*#__PURE__*/(0,jsx_runtime.jsx)("circle", {
    cx: "11",
    cy: "11",
    r: "8"
  }), /*#__PURE__*/(0,jsx_runtime.jsx)("line", {
    x1: "21",
    y1: "21",
    x2: "16.65",
    y2: "16.65"
  })]
});

// ── Grid (navigation menu — UX-01) ──────────────────────────────────────────
const IconGrid = ({
  size = 16
}) => /*#__PURE__*/_jsxs("svg", {
  ...baseProps(size),
  children: [/*#__PURE__*/_jsx("rect", {
    x: "3",
    y: "3",
    width: "7",
    height: "7",
    rx: "1"
  }), /*#__PURE__*/_jsx("rect", {
    x: "14",
    y: "3",
    width: "7",
    height: "7",
    rx: "1"
  }), /*#__PURE__*/_jsx("rect", {
    x: "3",
    y: "14",
    width: "7",
    height: "7",
    rx: "1"
  }), /*#__PURE__*/_jsx("rect", {
    x: "14",
    y: "14",
    width: "7",
    height: "7",
    rx: "1"
  })]
});

// ── Chevron right (chips, next) ────────────────────────────────────────────
const IconChevronRight = ({
  size = 12
}) => /*#__PURE__*/_jsx("svg", {
  ...baseProps(size),
  children: /*#__PURE__*/_jsx("polyline", {
    points: "9 18 15 12 9 6"
  })
});

// ── Chevron left (CAL-05: month navigation) ────────────────────────────────
const IconChevronLeft = ({
  size = 12
}) => /*#__PURE__*/_jsx("svg", {
  ...baseProps(size),
  children: /*#__PURE__*/_jsx("polyline", {
    points: "15 18 9 12 15 6"
  })
});

// ── ArrowUpRight (links externos) ──────────────────────────────────────────
const IconArrowUpRight = ({
  size = 14
}) => /*#__PURE__*/_jsxs("svg", {
  ...baseProps(size),
  children: [/*#__PURE__*/_jsx("line", {
    x1: "7",
    y1: "17",
    x2: "17",
    y2: "7"
  }), /*#__PURE__*/_jsx("polyline", {
    points: "7 7 17 7 17 17"
  })]
});

// ── ClipboardList (exam generator — DOC-D04) ────────────────────────────────
const IconClipboardList = ({
  size = 14
}) => /*#__PURE__*/(0,jsx_runtime.jsxs)("svg", {
  ...baseProps(size),
  children: [/*#__PURE__*/(0,jsx_runtime.jsx)("rect", {
    x: "8",
    y: "2",
    width: "8",
    height: "4",
    rx: "1"
  }), /*#__PURE__*/(0,jsx_runtime.jsx)("path", {
    d: "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
  }), /*#__PURE__*/(0,jsx_runtime.jsx)("line", {
    x1: "9",
    y1: "12",
    x2: "15",
    y2: "12"
  }), /*#__PURE__*/(0,jsx_runtime.jsx)("line", {
    x1: "9",
    y1: "16",
    x2: "15",
    y2: "16"
  }), /*#__PURE__*/(0,jsx_runtime.jsx)("line", {
    x1: "9",
    y1: "8",
    x2: "10",
    y2: "8"
  })]
});

// ── Download (export GIFT) ───────────────────────────────────────────────────
const IconDownload = ({
  size = 14
}) => /*#__PURE__*/(0,jsx_runtime.jsxs)("svg", {
  ...baseProps(size),
  children: [/*#__PURE__*/(0,jsx_runtime.jsx)("path", {
    d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
  }), /*#__PURE__*/(0,jsx_runtime.jsx)("polyline", {
    points: "7 10 12 15 17 10"
  }), /*#__PURE__*/(0,jsx_runtime.jsx)("line", {
    x1: "12",
    y1: "15",
    x2: "12",
    y2: "3"
  })]
});

// ── Upload (dropzone de material) ────────────────────────────────────────────
const IconUpload = ({
  size = 14
}) => /*#__PURE__*/(0,jsx_runtime.jsxs)("svg", {
  ...baseProps(size),
  children: [/*#__PURE__*/(0,jsx_runtime.jsx)("path", {
    d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
  }), /*#__PURE__*/(0,jsx_runtime.jsx)("polyline", {
    points: "17 8 12 3 7 8"
  }), /*#__PURE__*/(0,jsx_runtime.jsx)("line", {
    x1: "12",
    y1: "3",
    x2: "12",
    y2: "15"
  })]
});

// ── BarChart (dashboard de analytics — ANALYTICS-02) ────────────────────────
const IconBarChart = ({
  size = 14
}) => /*#__PURE__*/(0,jsx_runtime.jsxs)("svg", {
  ...baseProps(size),
  children: [/*#__PURE__*/(0,jsx_runtime.jsx)("line", {
    x1: "12",
    y1: "20",
    x2: "12",
    y2: "10"
  }), /*#__PURE__*/(0,jsx_runtime.jsx)("line", {
    x1: "18",
    y1: "20",
    x2: "18",
    y2: "4"
  }), /*#__PURE__*/(0,jsx_runtime.jsx)("line", {
    x1: "6",
    y1: "20",
    x2: "6",
    y2: "16"
  })]
});

// ── AlertTriangle (FOR-05: hilo de foro urgente/frustrado) ─────────────────
const IconAlertTriangle = ({
  size = 14
}) => /*#__PURE__*/_jsxs("svg", {
  ...baseProps(size),
  children: [/*#__PURE__*/_jsx("path", {
    d: "M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
  }), /*#__PURE__*/_jsx("line", {
    x1: "12",
    y1: "9",
    x2: "12",
    y2: "13"
  }), /*#__PURE__*/_jsx("line", {
    x1: "12",
    y1: "17",
    x2: "12.01",
    y2: "17"
  })]
});

// ── MessageSquare (FOR-06: forum thread in the weekly digest) ──────────────
const IconMessageSquare = ({
  size = 14
}) => /*#__PURE__*/_jsx("svg", {
  ...baseProps(size),
  children: /*#__PURE__*/_jsx("path", {
    d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
  })
});

// ── Mic (VOICE-01: voice input in the chat composer) ───────────────────────
const IconMic = ({
  size = 16
}) => /*#__PURE__*/_jsxs("svg", {
  ...baseProps(size),
  children: [/*#__PURE__*/_jsx("path", {
    d: "M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"
  }), /*#__PURE__*/_jsx("path", {
    d: "M19 10v2a7 7 0 0 1-14 0v-2"
  }), /*#__PURE__*/_jsx("line", {
    x1: "12",
    y1: "19",
    x2: "12",
    y2: "23"
  }), /*#__PURE__*/_jsx("line", {
    x1: "8",
    y1: "23",
    x2: "16",
    y2: "23"
  })]
});
;// ./src/components/Toast.jsx
// This file is part of Moodle - https://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <https://www.gnu.org/licenses/>.

/**
 * Part of the NexusAI plugin (local_nexusai).
 *
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */



// UX-07 (#347): toast reusable across the widget. Before, the pattern
// (`.nexusai-toast`, `--success`/`--warning`) lived duplicated by hand inside
// documents/DocumentsTable.jsx and documents/DocumentsManager.jsx. With a
// context instead of props so any child component (e.g.
// CalendarPanel, several levels inside) can call useToast() directly,
// without prop-drilling.

const ToastContext = /*#__PURE__*/(0,react.createContext)(null);
const DURATION_MS = 3000;
function ToastProvider({
  children
}) {
  const [toast, setToast] = (0,react.useState)(null);
  const timerRef = (0,react.useRef)(null);
  const show = (0,react.useCallback)((message, variant) => {
    clearTimeout(timerRef.current);
    setToast({
      message,
      variant
    });
    timerRef.current = setTimeout(() => setToast(null), DURATION_MS);
  }, []);
  const value = {
    showSuccess: message => show(message, "success"),
    showWarning: message => show(message, "warning"),
    showError: message => show(message, "error")
  };
  return /*#__PURE__*/(0,jsx_runtime.jsxs)(ToastContext.Provider, {
    value: value,
    children: [children, toast && /*#__PURE__*/(0,jsx_runtime.jsx)("div", {
      className: `nexusai-toast nexusai-toast--${toast.variant}`,
      role: "status",
      children: toast.message
    })]
  });
}
function useToast() {
  const ctx = (0,react.useContext)(ToastContext);
  if (!ctx) {
    // Silent fallback if it is used by mistake outside a ToastProvider —
    // better not to break the UI over a toast that could not be shown.
    return {
      showSuccess() {},
      showWarning() {},
      showError() {}
    };
  }
  return ctx;
}
;// ./src/components/errors.js
// This file is part of Moodle - https://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <https://www.gnu.org/licenses/>.

/**
 * Part of the NexusAI plugin (local_nexusai).
 *
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

// UX-08 (#348): friendly error messages, in one place.
//
// The backend builds error messages like this (see classes/external/backend_client.php
// + the plugin's language strings):
//   "NexusAI backend error: HTTP 503: {\"detail\":\"<raw text from the LLM provider>\"}"
//
// Before this, two components (QuizPanel.jsx and DocumentsManager.jsx) had each
// written an almost identical function to strip that format — what was left was
// the backend's `detail`, which can still be technical text from the LLM provider
// (quota exhausted, rate limit, etc.), not a message meant for the end user.
//
// getFriendlyErrorMessage() replaces those two functions:
//   - 5xx / 429 (infrastructure, quota, rate limit): always a curated message,
//     never the provider's raw detail.
//   - Known 4xx (e.g. QuizPanel's 422 "topic not found in the material"):
//     the detail is information meant for the user, it is still shown.
//   - No recognizable HTTP code (network, timeout): the fallback the caller passes.

function extractDetail(raw) {
  const detailMatch = raw.match(/"detail"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (detailMatch) return detailMatch[1].replace(/\\"/g, '"');
  const httpMatch = raw.match(/HTTP\s+\d+[:\s]+(.+)/s);
  if (httpMatch) return httpMatch[1].trim();
  return null;
}

// FEAT-06 (#481, daily limit): unlike an LLM provider's rate limit (429 with
// technical text, not fit to show), the `detail` of OUR own rate limiter
// (services/api/app/shared/rate_limit.py::check_rate_limit) is a structured
// object — {"error":"rate_limit_exceeded","scope":"minute"
// |"daily","message":"<text for the student>",...} — not a string,
// so `extractDetail()` above (which only matches `"detail":"<string>"`)
// never caught it, and `getFriendlyErrorMessage()` sent ANY 429 to the
// generic curated message without looking at the detail. That defeated the
// purpose of the daily limit: the student never saw the difference between
// "wait a minute" and "come back tomorrow", only the same generic text for both.
function extractOwnRateLimitMessage(raw) {
  const match = raw.match(/"detail"\s*:\s*(\{[^}]*\})/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[1]);
    if (parsed.error === "rate_limit_exceeded" && typeof parsed.message === "string") {
      return parsed.message;
    }
  } catch {
    // It was not the JSON we expected (e.g. a 429 from somewhere else) —
    // we go on with the generic curated message.
  }
  return null;
}
const INFRA_MESSAGES = {
  es: {
    rateLimit: "Se alcanzó el límite de uso por ahora. Probá de nuevo en unos minutos.",
    unavailable: "El asistente no está disponible en este momento. Probá de nuevo en unos minutos."
  },
  en: {
    rateLimit: "Usage limit reached for now. Try again in a few minutes.",
    unavailable: "The assistant isn't available right now. Try again in a few minutes."
  }
};
function getFriendlyErrorMessage(err, fallback, lang = "es") {
  const raw = err?.message || String(err || "");
  const statusMatch = raw.match(/HTTP\s+(\d+)/);
  const status = statusMatch ? parseInt(statusMatch[1], 10) : null;
  const msgs = INFRA_MESSAGES[lang] || INFRA_MESSAGES.es;
  if (status === 429) return extractOwnRateLimitMessage(raw) || msgs.rateLimit;
  if (status && status >= 500 && status < 600) return msgs.unavailable;
  if (status && status >= 400 && status < 500) {
    const detail = extractDetail(raw);
    if (detail) return detail;
  }
  return fallback;
}
;// ./src/components/ConfirmModal.jsx
// This file is part of Moodle - https://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <https://www.gnu.org/licenses/>.

/**
 * Part of the NexusAI plugin (local_nexusai).
 *
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * ConfirmModal — reusable confirmation dialog (UX-06, #346).
 *
 * Before, each destructive action handled its confirmation on its own
 * (or had none at all). This component is the only place where the
 * markup + behavior of the modal live, so every irreversible action of
 * the widget looks and behaves the same.
 *
 * Used in both bundles (chat and teacher view): the CSS lives in
 * styles.css, which both entry points import.
 *
 * Behavior:
 *   - Esc or click on the backdrop → cancels (never runs the action).
 *   - Focus goes to "Cancel" (the safe option by default).
 *   - `busy` disables the buttons while the action is running.
 *
 * Props:
 *   title        string           — modal title
 *   children     node             — body: text specific to the action
 *   confirmLabel string           — text of the button that runs it (default "Confirm")
 *   cancelLabel  string           — text of the button that cancels (default "Cancel")
 *   onConfirm    () => void
 *   onCancel     () => void
 *   danger       boolean          — confirm button in red (default true)
 *   busy         boolean          — action in progress: buttons disabled
 */



// Closes an overlay with Escape (UX-06/#346, taken out of ConfirmModal itself
// to reuse it in other modals without their own Esc/click-outside, e.g. ErrorModal
// in documents/DocumentsTable.jsx).

function useDismissable(onDismiss) {
  (0,react.useEffect)(() => {
    const onKeyDown = e => {
      if (e.key === "Escape") onDismiss();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onDismiss]);
}
function ConfirmModal({
  title,
  children,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  onConfirm,
  onCancel,
  danger = true,
  busy = false
}) {
  const cancelRef = (0,react.useRef)(null);
  (0,react.useEffect)(() => {
    cancelRef.current?.focus();
  }, []);
  return (
    /*#__PURE__*/
    // El fondo cierra con un click que cae en él mismo (no en el diálogo) y
    // con Escape: el foco arranca en "Cancelar", así que la tecla llega acá.
    (0,jsx_runtime.jsx)("div", {
      className: "nexusai-confirm-overlay",
      onClick: e => {
        if (e.target === e.currentTarget && !busy) onCancel();
      },
      onKeyDown: e => {
        if (e.key === "Escape" && !busy) onCancel();
      },
      children: /*#__PURE__*/(0,jsx_runtime.jsxs)("div", {
        className: "nexusai-confirm",
        role: "alertdialog",
        "aria-modal": "true",
        "aria-labelledby": "nexusai-confirm-title",
        children: [/*#__PURE__*/(0,jsx_runtime.jsx)("h2", {
          className: "nexusai-confirm__title",
          id: "nexusai-confirm-title",
          children: title
        }), /*#__PURE__*/(0,jsx_runtime.jsx)("div", {
          className: "nexusai-confirm__body",
          children: children
        }), /*#__PURE__*/(0,jsx_runtime.jsxs)("div", {
          className: "nexusai-confirm__actions",
          children: [/*#__PURE__*/(0,jsx_runtime.jsx)("button", {
            type: "button",
            ref: cancelRef,
            className: "nexusai-confirm__btn nexusai-confirm__btn--cancel",
            onClick: onCancel,
            disabled: busy,
            children: cancelLabel
          }), /*#__PURE__*/(0,jsx_runtime.jsx)("button", {
            type: "button",
            className: "nexusai-confirm__btn " + (danger ? "nexusai-confirm__btn--danger" : "nexusai-confirm__btn--confirm"),
            onClick: onConfirm,
            disabled: busy,
            children: confirmLabel
          })]
        })]
      })
    })
  );
}
;// ./src/documents/DocumentsTable.jsx
// This file is part of Moodle - https://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <https://www.gnu.org/licenses/>.

/**
 * Part of the NexusAI plugin (local_nexusai).
 *
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * Documents table.
 *
 * State polling is handled in DocumentsManager (which uses listDocuments).
 * This table only shows the current state received via props and handles the
 * confirmation + execution of deleting and replacing the file (CONT-07).
 */








const STABLE_STATUSES = new Set(["indexed", "error"]);
function DocumentsTable({
  courseId,
  documents,
  onChange,
  lang = "es"
}) {
  const [deletingId, setDeletingId] = (0,react.useState)(null);
  const [confirmDoc, setConfirmDoc] = (0,react.useState)(null);
  const [deleteError, setDeleteError] = (0,react.useState)(null);
  const {
    showSuccess,
    showWarning
  } = useToast();
  const L = lang === "es" ? {
    selected: n => `${n} seleccionado${n === 1 ? "" : "s"}`,
    reindex: "Reindexar",
    delete: "Eliminar",
    cancelSelection: "Cancelar selección",
    discardErrorOf: name => `Descartar error de ${name}`,
    queued: "En cola...",
    running: "Procesando...",
    done: "Listo",
    selectAllAria: "Seleccionar todos los documentos",
    colFile: "Archivo",
    colActivity: "En el aula",
    colStatus: "Estado",
    colDate: "Fecha",
    emptyTitle: "Todavía no subiste material a este curso.",
    emptyHint: "Arrastrá un PDF, DOCX o TXT arriba y NexusAI lo indexa para que el asistente pueda responder sobre su contenido.",
    deleteTitle: "Quitar de NexusAI",
    deleteConfirm: "Quitar",
    cancel: "Cancelar",
    deleteBody: name => /*#__PURE__*/(0,jsx_runtime.jsxs)(jsx_runtime.Fragment, {
      children: ["\xBFQuitar ", /*#__PURE__*/(0,jsx_runtime.jsx)("strong", {
        children: name
      }), " de NexusAI? El asistente deja de usarlo. La actividad sigue en el aula: para borrarla, hacelo desde el curso."]
    }),
    replaceTitle: "Reemplazar documento",
    replaceConfirm: "Reemplazar",
    replaceBody: (oldName, newName) => /*#__PURE__*/(0,jsx_runtime.jsxs)(jsx_runtime.Fragment, {
      children: ["\xBFReemplazar ", /*#__PURE__*/(0,jsx_runtime.jsx)("strong", {
        children: oldName
      }), " por ", /*#__PURE__*/(0,jsx_runtime.jsx)("strong", {
        children: newName
      }), "? El documento se re-indexa desde cero; las citas viejas del chat siguen apuntando a este mismo material."]
    }),
    bulkDeleteTitle: "Eliminar documentos",
    bulkReindexTitle: "Reindexar documentos",
    bulkDeleteBody: n => /*#__PURE__*/(0,jsx_runtime.jsxs)(jsx_runtime.Fragment, {
      children: ["\xBFBorrar ", /*#__PURE__*/(0,jsx_runtime.jsx)("strong", {
        children: n
      }), " documentos? Esto elimina cada uno y todos sus chunks indexados. La acci\xF3n no se puede deshacer."]
    }),
    bulkReindexBody: n => /*#__PURE__*/(0,jsx_runtime.jsxs)(jsx_runtime.Fragment, {
      children: ["\xBFReindexar ", /*#__PURE__*/(0,jsx_runtime.jsx)("strong", {
        children: n
      }), " documentos? Puede tardar unos minutos por archivo."]
    }),
    deleteErrorGeneric: "No se pudo eliminar.",
    reindexErrorGeneric: "No se pudo reindexar.",
    bulkSuccessDelete: ok => `${ok} documento${ok === 1 ? "" : "s"} eliminados correctamente`,
    bulkSuccessReindex: ok => `${ok} documento${ok === 1 ? "" : "s"} reindexados correctamente`,
    bulkPartialDelete: (ok, tot, failed) => `${ok} de ${tot} documentos eliminados — ${failed} con error`,
    bulkPartialReindex: (ok, tot, failed) => `${ok} de ${tot} documentos reindexados — ${failed} con error`,
    replaceErrorGeneric: "No se pudo reemplazar el documento. Intentá de nuevo.",
    deleteSuccess: "Documento eliminado correctamente",
    replaceSuccess: "Documento reemplazado correctamente",
    deleteErrorDoc: "No se pudo eliminar el documento. Intentá de nuevo.",
    errorTitle: "Error",
    close: "Cerrar"
  } : {
    selected: n => `${n} selected`,
    reindex: "Reindex",
    delete: "Delete",
    cancelSelection: "Cancel selection",
    discardErrorOf: name => `Dismiss error for ${name}`,
    queued: "Queued...",
    running: "Processing...",
    done: "Done",
    selectAllAria: "Select all documents",
    colFile: "File",
    colActivity: "In the classroom",
    colStatus: "Status",
    colDate: "Date",
    emptyTitle: "You haven't uploaded any material to this course yet.",
    emptyHint: "Drag a PDF, DOCX or TXT above and NexusAI indexes it so the assistant can answer about its content.",
    deleteTitle: "Remove from NexusAI",
    deleteConfirm: "Remove",
    cancel: "Cancel",
    deleteBody: name => /*#__PURE__*/(0,jsx_runtime.jsxs)(jsx_runtime.Fragment, {
      children: ["Remove ", /*#__PURE__*/(0,jsx_runtime.jsx)("strong", {
        children: name
      }), " from NexusAI? The assistant stops using it. The activity stays in the classroom: delete it from the course if you want it gone."]
    }),
    replaceTitle: "Replace document",
    replaceConfirm: "Replace",
    replaceBody: (oldName, newName) => /*#__PURE__*/(0,jsx_runtime.jsxs)(jsx_runtime.Fragment, {
      children: ["Replace ", /*#__PURE__*/(0,jsx_runtime.jsx)("strong", {
        children: oldName
      }), " with ", /*#__PURE__*/(0,jsx_runtime.jsx)("strong", {
        children: newName
      }), "? The document is re-indexed from scratch; old chat citations keep pointing to this same material."]
    }),
    bulkDeleteTitle: "Delete documents",
    bulkReindexTitle: "Reindex documents",
    bulkDeleteBody: n => /*#__PURE__*/(0,jsx_runtime.jsxs)(jsx_runtime.Fragment, {
      children: ["Delete ", /*#__PURE__*/(0,jsx_runtime.jsx)("strong", {
        children: n
      }), " documents? This removes each one and all its indexed chunks. This action can't be undone."]
    }),
    bulkReindexBody: n => /*#__PURE__*/(0,jsx_runtime.jsxs)(jsx_runtime.Fragment, {
      children: ["Reindex ", /*#__PURE__*/(0,jsx_runtime.jsx)("strong", {
        children: n
      }), " documents? This can take a few minutes per file."]
    }),
    deleteErrorGeneric: "Couldn't delete it.",
    reindexErrorGeneric: "Couldn't reindex it.",
    bulkSuccessDelete: ok => `${ok} document${ok === 1 ? "" : "s"} deleted successfully`,
    bulkSuccessReindex: ok => `${ok} document${ok === 1 ? "" : "s"} reindexed successfully`,
    bulkPartialDelete: (ok, tot, failed) => `${ok} of ${tot} documents deleted — ${failed} with errors`,
    bulkPartialReindex: (ok, tot, failed) => `${ok} of ${tot} documents reindexed — ${failed} with errors`,
    replaceErrorGeneric: "Couldn't replace the document. Try again.",
    deleteSuccess: "Document deleted successfully",
    replaceSuccess: "Document replaced successfully",
    deleteErrorDoc: "Couldn't delete the document. Try again.",
    errorTitle: "Error",
    close: "Close"
  };

  // CONT-09 (#358): bulk actions — multiple selection + re-index/delete
  // several documents at once. SEQUENTIAL execution (not Promise.all), same
  // approach as uploadQueue (SP-13): gives per-item progress feedback and
  // does not flood the backend/LLM at once if many are selected.
  const [selectedIds, setSelectedIds] = (0,react.useState)(() => new Set());
  const [bulkConfirm, setBulkConfirm] = (0,react.useState)(null); // { type: "delete"|"reindex", docs }
  const [bulkRunning, setBulkRunning] = (0,react.useState)(false);
  const [bulkQueue, setBulkQueue] = (0,react.useState)([]); // [{ id, filename, status, error }]

  const allSelected = documents.length > 0 && selectedIds.size === documents.length;
  const someSelected = selectedIds.size > 0 && !allSelected;
  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? new Set() : new Set(documents.map(d => d.id)));
  };
  const toggleSelectOne = id => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);else next.add(id);
      return next;
    });
  };
  const clearSelection = () => setSelectedIds(new Set());
  const requestBulkAction = type => {
    const docs = documents.filter(d => selectedIds.has(d.id));
    if (!docs.length) return;
    setBulkConfirm({
      type,
      docs
    });
  };
  const runBulkAction = async () => {
    const {
      type,
      docs
    } = bulkConfirm;
    setBulkConfirm(null);
    setBulkRunning(true);
    setBulkQueue(docs.map(d => ({
      id: d.id,
      filename: d.filename,
      status: "queued",
      error: null
    })));
    let failed = 0;
    for (const doc of docs) {
      setBulkQueue(prev => prev.map(it => it.id === doc.id ? {
        ...it,
        status: "running"
      } : it));
      try {
        if (type === "delete") {
          await deleteDocument(courseId, doc.id);
          onChange(prev => prev.filter(d => d.id !== doc.id));
        } else {
          const updated = await reindexDocument(courseId, doc.id);
          onChange(prev => prev.map(d => d.id === doc.id ? {
            ...d,
            ...updated
          } : d));
        }
        setBulkQueue(prev => prev.map(it => it.id === doc.id ? {
          ...it,
          status: "done"
        } : it));
      } catch (err) {
        failed += 1;
        const message = getFriendlyErrorMessage(err, type === "delete" ? L.deleteErrorGeneric : L.reindexErrorGeneric, lang);
        setBulkQueue(prev => prev.map(it => it.id === doc.id ? {
          ...it,
          status: "error",
          error: message
        } : it));
      }
    }
    setBulkRunning(false);
    clearSelection();
    const ok = docs.length - failed;
    if (failed === 0) {
      showSuccess(type === "delete" ? L.bulkSuccessDelete(ok) : L.bulkSuccessReindex(ok));
      setBulkQueue([]);
    } else {
      showWarning(type === "delete" ? L.bulkPartialDelete(ok, docs.length, failed) : L.bulkPartialReindex(ok, docs.length, failed));
      // The queue stays visible with the details of what failed (it clears
      // itself on the next run, or the teacher dismisses it by hand).
    }
  };
  const dismissBulkQueue = () => setBulkQueue([]);

  // CONT-07 (#356): replace a document's file without changing its id.
  // Flow: click "Replace" → opens the file picker (hidden input) → after
  // choosing a file, confirmation is asked before calling the backend.
  const [replacingId, setReplacingId] = (0,react.useState)(null);
  const [pendingReplaceDoc, setPendingReplaceDoc] = (0,react.useState)(null);
  const [replaceTarget, setReplaceTarget] = (0,react.useState)(null); // { doc, file }
  const [replaceError, setReplaceError] = (0,react.useState)(null);
  const replaceInputRef = (0,react.useRef)(null);
  const handleReplaceRequest = doc => {
    setPendingReplaceDoc(doc);
    replaceInputRef.current?.click();
  };
  const handleReplaceFileChosen = e => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allows picking the same file again and still firing onChange
    if (file && pendingReplaceDoc) {
      setReplaceTarget({
        doc: pendingReplaceDoc,
        file
      });
    }
    setPendingReplaceDoc(null);
  };
  const handleReplaceConfirm = async () => {
    const {
      doc,
      file
    } = replaceTarget;
    setReplaceTarget(null);
    setReplacingId(doc.id);
    try {
      const updated = await replaceDocument(courseId, doc.id, file);
      onChange(prev => prev.map(d => d.id === doc.id ? {
        ...d,
        ...updated
      } : d));
      showSuccess(L.replaceSuccess);
    } catch (err) {
      setReplaceError(getFriendlyErrorMessage(err, L.replaceErrorGeneric, lang));
    } finally {
      setReplacingId(null);
    }
  };

  // CONT-08 (#357): preview of the extracted text, per document and on demand.
  // { [docId]: { loading, error, data } }
  const [previews, setPreviews] = (0,react.useState)({});
  const [openPreviewId, setOpenPreviewId] = (0,react.useState)(null);
  const togglePreview = async doc => {
    if (openPreviewId === doc.id) {
      setOpenPreviewId(null);
      return;
    }
    setOpenPreviewId(doc.id);
    if (previews[doc.id]?.data || previews[doc.id]?.loading) return;
    setPreviews(prev => ({
      ...prev,
      [doc.id]: {
        loading: true
      }
    }));
    try {
      const data = await getDocumentPreview(courseId, doc.id);
      setPreviews(prev => ({
        ...prev,
        [doc.id]: {
          loading: false,
          data
        }
      }));
    } catch (err) {
      setPreviews(prev => ({
        ...prev,
        [doc.id]: {
          loading: false,
          error: err.message || String(err)
        }
      }));
    }
  };
  const handleDeleteRequest = doc => {
    setConfirmDoc(doc);
  };
  const handleDeleteConfirm = async () => {
    const doc = confirmDoc;
    setConfirmDoc(null);
    setDeletingId(doc.id);
    try {
      await deleteDocument(courseId, doc.id);
      onChange(prev => prev.filter(d => d.id !== doc.id));
      showSuccess(L.deleteSuccess);
    } catch (err) {
      setDeleteError(getFriendlyErrorMessage(err, L.deleteErrorDoc, lang));
    } finally {
      setDeletingId(null);
    }
  };
  if (documents.length === 0) {
    return /*#__PURE__*/(0,jsx_runtime.jsxs)("div", {
      className: "nexusai-empty",
      children: [/*#__PURE__*/(0,jsx_runtime.jsx)("p", {
        children: L.emptyTitle
      }), /*#__PURE__*/(0,jsx_runtime.jsx)("p", {
        className: "nexusai-empty__hint",
        children: L.emptyHint
      })]
    });
  }
  return /*#__PURE__*/(0,jsx_runtime.jsxs)(jsx_runtime.Fragment, {
    children: [selectedIds.size > 0 && /*#__PURE__*/(0,jsx_runtime.jsxs)("div", {
      className: "nexusai-bulkbar",
      children: [/*#__PURE__*/(0,jsx_runtime.jsx)("span", {
        className: "nexusai-bulkbar__count",
        children: L.selected(selectedIds.size)
      }), /*#__PURE__*/(0,jsx_runtime.jsx)("button", {
        type: "button",
        className: "nexusai-link-btn",
        onClick: () => requestBulkAction("reindex"),
        disabled: bulkRunning,
        children: L.reindex
      }), /*#__PURE__*/(0,jsx_runtime.jsx)("button", {
        type: "button",
        className: "nexusai-link-btn nexusai-link-btn--danger",
        onClick: () => requestBulkAction("delete"),
        disabled: bulkRunning,
        children: L.delete
      }), /*#__PURE__*/(0,jsx_runtime.jsx)("button", {
        type: "button",
        className: "nexusai-bulkbar__cancel",
        onClick: clearSelection,
        disabled: bulkRunning,
        children: L.cancelSelection
      })]
    }), bulkQueue.length > 0 && /*#__PURE__*/(0,jsx_runtime.jsx)("ul", {
      className: "nexusai-upload-queue",
      children: bulkQueue.map(item => /*#__PURE__*/(0,jsx_runtime.jsxs)("li", {
        className: `nexusai-upload-queue__item ${item.status === "error" ? "nexusai-upload-queue__item--error" : ""}`,
        children: [/*#__PURE__*/(0,jsx_runtime.jsx)("span", {
          className: "nexusai-upload-queue__name",
          children: item.filename
        }), item.status === "error" ? /*#__PURE__*/(0,jsx_runtime.jsxs)(jsx_runtime.Fragment, {
          children: [/*#__PURE__*/(0,jsx_runtime.jsx)("span", {
            className: "nexusai-upload-queue__status",
            children: item.error
          }), !bulkRunning && /*#__PURE__*/(0,jsx_runtime.jsx)("button", {
            type: "button",
            className: "nexusai-upload-queue__dismiss",
            onClick: dismissBulkQueue,
            "aria-label": L.discardErrorOf(item.filename),
            children: "\xD7"
          })]
        }) : /*#__PURE__*/(0,jsx_runtime.jsx)("span", {
          className: "nexusai-upload-queue__status",
          children: {
            queued: L.queued,
            running: L.running,
            done: L.done
          }[item.status]
        })]
      }, item.id))
    }), /*#__PURE__*/(0,jsx_runtime.jsx)("div", {
      className: "nexusai-table-wrap",
      children: /*#__PURE__*/(0,jsx_runtime.jsxs)("table", {
        className: "nexusai-table",
        children: [/*#__PURE__*/(0,jsx_runtime.jsx)("thead", {
          children: /*#__PURE__*/(0,jsx_runtime.jsxs)("tr", {
            children: [/*#__PURE__*/(0,jsx_runtime.jsx)("th", {
              className: "nexusai-table__checkbox-col",
              children: /*#__PURE__*/(0,jsx_runtime.jsx)("input", {
                type: "checkbox",
                checked: allSelected,
                ref: el => {
                  if (el) el.indeterminate = someSelected;
                },
                onChange: toggleSelectAll,
                "aria-label": L.selectAllAria
              })
            }), /*#__PURE__*/(0,jsx_runtime.jsx)("th", {
              children: L.colFile
            }), /*#__PURE__*/(0,jsx_runtime.jsx)("th", {
              children: L.colActivity
            }), /*#__PURE__*/(0,jsx_runtime.jsx)("th", {
              children: L.colStatus
            }), /*#__PURE__*/(0,jsx_runtime.jsx)("th", {
              children: L.colDate
            }), /*#__PURE__*/(0,jsx_runtime.jsx)("th", {})]
          })
        }), /*#__PURE__*/(0,jsx_runtime.jsx)("tbody", {
          children: documents.map(doc => /*#__PURE__*/(0,jsx_runtime.jsx)(DocumentRow, {
            doc: doc,
            lang: lang,
            selected: selectedIds.has(doc.id),
            onToggleSelect: () => toggleSelectOne(doc.id),
            onDelete: () => handleDeleteRequest(doc),
            deleting: deletingId === doc.id,
            onReplace: () => handleReplaceRequest(doc),
            replacing: replacingId === doc.id,
            previewOpen: openPreviewId === doc.id,
            preview: previews[doc.id],
            onTogglePreview: () => togglePreview(doc)
          }, doc.id))
        })]
      })
    }), /*#__PURE__*/(0,jsx_runtime.jsx)("input", {
      ref: replaceInputRef,
      type: "file",
      style: {
        display: "none"
      },
      onChange: handleReplaceFileChosen
    }), confirmDoc && /*#__PURE__*/(0,jsx_runtime.jsx)(ConfirmModal, {
      title: L.deleteTitle,
      confirmLabel: L.deleteConfirm,
      cancelLabel: L.cancel,
      onConfirm: handleDeleteConfirm,
      onCancel: () => setConfirmDoc(null),
      children: L.deleteBody(confirmDoc.filename)
    }), replaceTarget && /*#__PURE__*/(0,jsx_runtime.jsx)(ConfirmModal, {
      title: L.replaceTitle,
      confirmLabel: L.replaceConfirm,
      cancelLabel: L.cancel,
      onConfirm: handleReplaceConfirm,
      onCancel: () => setReplaceTarget(null),
      children: L.replaceBody(replaceTarget.doc.filename, replaceTarget.file.name)
    }), bulkConfirm && /*#__PURE__*/(0,jsx_runtime.jsx)(ConfirmModal, {
      title: bulkConfirm.type === "delete" ? L.bulkDeleteTitle : L.bulkReindexTitle,
      confirmLabel: bulkConfirm.type === "delete" ? L.delete : L.reindex,
      cancelLabel: L.cancel,
      danger: bulkConfirm.type === "delete",
      onConfirm: runBulkAction,
      onCancel: () => setBulkConfirm(null),
      children: bulkConfirm.type === "delete" ? L.bulkDeleteBody(bulkConfirm.docs.length) : L.bulkReindexBody(bulkConfirm.docs.length)
    }), deleteError && /*#__PURE__*/(0,jsx_runtime.jsx)(ErrorModal, {
      message: deleteError,
      onClose: () => setDeleteError(null),
      lang: lang
    }), replaceError && /*#__PURE__*/(0,jsx_runtime.jsx)(ErrorModal, {
      message: replaceError,
      onClose: () => setReplaceError(null),
      lang: lang
    })]
  });
}

// ============================================================
// Error modal — exported so DocumentsManager can use it
// ============================================================

function ErrorModal({
  message,
  onClose,
  lang = "es"
}) {
  useDismissable(onClose);
  return /*#__PURE__*/(0,jsx_runtime.jsx)("div", {
    className: "nexusai-modal-overlay",
    role: "dialog",
    "aria-modal": "true",
    "aria-labelledby": "nexusai-error-title",
    onMouseDown: e => {
      if (e.target === e.currentTarget) onClose();
    },
    children: /*#__PURE__*/(0,jsx_runtime.jsxs)("div", {
      className: "nexusai-modal",
      children: [/*#__PURE__*/(0,jsx_runtime.jsx)("h2", {
        className: "nexusai-modal__title nexusai-modal__title--error",
        id: "nexusai-error-title",
        children: "Error"
      }), /*#__PURE__*/(0,jsx_runtime.jsx)("p", {
        className: "nexusai-modal__body nexusai-modal__body--error",
        children: message
      }), /*#__PURE__*/(0,jsx_runtime.jsx)("div", {
        className: "nexusai-modal__actions nexusai-modal__actions--end",
        children: /*#__PURE__*/(0,jsx_runtime.jsx)("button", {
          type: "button",
          className: "nexusai-btn nexusai-btn--secondary",
          onClick: onClose,
          children: lang === "es" ? "Cerrar" : "Close"
        })
      })]
    })
  });
}

// ============================================================
// Fila de tabla
// ============================================================

function DocumentRow({
  doc,
  lang,
  selected,
  onToggleSelect,
  onDelete,
  deleting,
  onReplace,
  replacing,
  previewOpen,
  preview,
  onTogglePreview
}) {
  const showDate = STABLE_STATUSES.has(doc.status);
  const canPreview = doc.status === "indexed";
  const L = lang === "es" ? {
    selectAria: name => `Seleccionar ${name}`,
    hideText: "Ocultar texto",
    viewText: "Ver texto extraído",
    replacing: "Reemplazando...",
    replace: "Reemplazar",
    deleting: "Borrando...",
    delete: "Quitar de NexusAI",
    viewInClass: "Ver en el aula",
    visible: "Visible",
    hidden: "Oculta a alumnos",
    missing: "Actividad borrada",
    none: "Sin actividad",
    unit: n => `Unidad ${n}`
  } : {
    selectAria: name => `Select ${name}`,
    hideText: "Hide text",
    viewText: "View extracted text",
    replacing: "Replacing...",
    replace: "Replace",
    deleting: "Deleting...",
    delete: "Remove from NexusAI",
    viewInClass: "View in the classroom",
    visible: "Visible",
    hidden: "Hidden from students",
    missing: "Activity deleted",
    none: "No activity",
    unit: n => `Unit ${n}`
  };
  return /*#__PURE__*/(0,jsx_runtime.jsxs)(jsx_runtime.Fragment, {
    children: [/*#__PURE__*/(0,jsx_runtime.jsxs)("tr", {
      className: `nexusai-table__row nexusai-table__row--${doc.status}`,
      children: [/*#__PURE__*/(0,jsx_runtime.jsx)("td", {
        className: "nexusai-table__checkbox-col",
        children: /*#__PURE__*/(0,jsx_runtime.jsx)("input", {
          type: "checkbox",
          checked: selected,
          onChange: onToggleSelect,
          "aria-label": L.selectAria(doc.filename)
        })
      }), /*#__PURE__*/(0,jsx_runtime.jsxs)("td", {
        children: [/*#__PURE__*/(0,jsx_runtime.jsxs)("div", {
          className: "nexusai-table__filename",
          children: [/*#__PURE__*/(0,jsx_runtime.jsx)("span", {
            className: "nexusai-table__filename-icon",
            children: /*#__PURE__*/(0,jsx_runtime.jsx)(IconFileText, {
              size: 14
            })
          }), doc.filename]
        }), doc.status === "indexing" && /*#__PURE__*/(0,jsx_runtime.jsx)("div", {
          className: "nexusai-table__progress",
          children: /*#__PURE__*/(0,jsx_runtime.jsx)("div", {
            className: "nexusai-table__progress-fill"
          })
        })]
      }), /*#__PURE__*/(0,jsx_runtime.jsx)("td", {
        className: "nexusai-table__activity",
        children: /*#__PURE__*/(0,jsx_runtime.jsx)(ActivityCell, {
          doc: doc,
          L: L
        })
      }), /*#__PURE__*/(0,jsx_runtime.jsx)("td", {
        children: /*#__PURE__*/(0,jsx_runtime.jsx)(StatusBadge, {
          status: doc.status,
          errorMessage: doc.error_message,
          lang: lang
        })
      }), /*#__PURE__*/(0,jsx_runtime.jsx)("td", {
        className: "nexusai-table__date",
        children: showDate ? formatIndexedAt(doc.updated_at, lang) : "—"
      }), /*#__PURE__*/(0,jsx_runtime.jsxs)("td", {
        className: "nexusai-table__actions",
        children: [canPreview && /*#__PURE__*/(0,jsx_runtime.jsx)("button", {
          type: "button",
          className: "nexusai-link-btn",
          onClick: onTogglePreview,
          "aria-expanded": previewOpen,
          children: previewOpen ? L.hideText : L.viewText
        }), /*#__PURE__*/(0,jsx_runtime.jsx)("button", {
          type: "button",
          className: "nexusai-link-btn",
          onClick: onReplace,
          disabled: replacing || deleting,
          children: replacing ? L.replacing : L.replace
        }), /*#__PURE__*/(0,jsx_runtime.jsx)("button", {
          type: "button",
          className: "nexusai-link-btn nexusai-link-btn--danger",
          onClick: onDelete,
          disabled: deleting || replacing,
          children: deleting ? L.deleting : L.delete
        })]
      })]
    }), previewOpen && /*#__PURE__*/(0,jsx_runtime.jsx)("tr", {
      className: "nexusai-table__preview-row",
      children: /*#__PURE__*/(0,jsx_runtime.jsx)("td", {
        colSpan: 6,
        children: /*#__PURE__*/(0,jsx_runtime.jsx)(DocumentPreview, {
          preview: preview,
          lang: lang
        })
      })
    })]
  });
}

// ============================================================
// Where the document lives in the course (VIS-03 / #538)
// ============================================================

/**
 * Section, link to the activity and whether it is visible. The state comes from
 * Moodle (document_list); after uploading, the new document carries cmid and visible.
 */
function ActivityCell({
  doc,
  L
}) {
  const status = doc.activity_status || (doc.cmid ? doc.visible === false ? "hidden" : "visible" : "none");
  const wwwroot = typeof window !== "undefined" ? window.M?.cfg?.wwwroot : "";
  const url = doc.activity_url || (doc.cmid && wwwroot ? `${wwwroot}/mod/resource/view.php?id=${doc.cmid}` : "");
  const unit = doc.section_name || (doc.section !== null && doc.section !== undefined ? L.unit(doc.section) : "");
  return /*#__PURE__*/(0,jsx_runtime.jsxs)("div", {
    className: "nexusai-activity",
    children: [unit && /*#__PURE__*/(0,jsx_runtime.jsx)("span", {
      className: "nexusai-activity__unit",
      children: unit
    }), /*#__PURE__*/(0,jsx_runtime.jsx)("span", {
      className: `nexusai-activity__state nexusai-activity__state--${status}`,
      children: L[status]
    }), url && status !== "missing" && /*#__PURE__*/(0,jsx_runtime.jsx)("a", {
      className: "nexusai-link-btn",
      href: url,
      target: "_blank",
      rel: "noreferrer",
      children: L.viewInClass
    })]
  });
}

// ============================================================
// Preview of the extracted text (CONT-08 / #357)
// ============================================================

function DocumentPreview({
  preview,
  lang = "es"
}) {
  const L = lang === "es" ? {
    loading: "Cargando texto extraído...",
    loadError: e => `No se pudo cargar el texto extraído: ${e}`,
    noText: "No hay texto extraído todavía para este documento.",
    label: "Primeros caracteres del texto que NexusAI indexó de este archivo. Si se ve vacío o con símbolos raros, la extracción falló (típico en PDFs escaneados sin OCR)."
  } : {
    loading: "Loading extracted text...",
    loadError: e => `Couldn't load the extracted text: ${e}`,
    noText: "There's no extracted text yet for this document.",
    label: "First characters of the text NexusAI indexed from this file. If it looks empty or has odd symbols, extraction failed (typical for scanned PDFs without OCR)."
  };
  if (!preview || preview.loading) {
    return /*#__PURE__*/(0,jsx_runtime.jsx)("p", {
      className: "nexusai-preview__status",
      children: L.loading
    });
  }
  if (preview.error) {
    return /*#__PURE__*/(0,jsx_runtime.jsx)("p", {
      className: "nexusai-preview__status nexusai-preview__status--error",
      children: L.loadError(preview.error)
    });
  }
  const {
    preview: text,
    truncated
  } = preview.data || {};
  if (!text) {
    return /*#__PURE__*/(0,jsx_runtime.jsx)("p", {
      className: "nexusai-preview__status",
      children: L.noText
    });
  }
  return /*#__PURE__*/(0,jsx_runtime.jsxs)("div", {
    className: "nexusai-preview",
    children: [/*#__PURE__*/(0,jsx_runtime.jsx)("p", {
      className: "nexusai-preview__label",
      children: L.label
    }), /*#__PURE__*/(0,jsx_runtime.jsxs)("pre", {
      className: "nexusai-preview__text",
      children: [text, truncated ? "…" : ""]
    })]
  });
}
function formatIndexedAt(isoString, lang = "es") {
  if (!isoString) return "—";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "—";
  const pad = n => String(n).padStart(2, "0");
  if (lang === "es") {
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function StatusBadge({
  status,
  errorMessage,
  lang = "es"
}) {
  const labels = lang === "es" ? {
    pending: {
      text: "En cola",
      cls: "pending"
    },
    indexing: {
      text: "Indexando",
      cls: "indexing"
    },
    indexed: {
      text: "Indexado",
      cls: "indexed"
    },
    error: {
      text: "Error",
      cls: "error"
    }
  } : {
    pending: {
      text: "Queued",
      cls: "pending"
    },
    indexing: {
      text: "Indexing",
      cls: "indexing"
    },
    indexed: {
      text: "Indexed",
      cls: "indexed"
    },
    error: {
      text: "Error",
      cls: "error"
    }
  };
  const info = labels[status] || {
    text: status || "—",
    cls: "unknown"
  };
  return /*#__PURE__*/(0,jsx_runtime.jsx)("span", {
    className: `nexusai-badge nexusai-badge--${info.cls}`,
    title: status === "error" ? errorMessage || "" : "",
    children: info.text
  });
}
;// ./src/documents/UploadZone.jsx
// This file is part of Moodle - https://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <https://www.gnu.org/licenses/>.

/**
 * Part of the NexusAI plugin (local_nexusai).
 *
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * Drop zone with HTML5 drag-and-drop + click to open the file picker.
 *
 * CONT-06 (#320): accepts several files at once (drag-and-drop or picker).
 * The parent component (DocumentsManager) passes it `onUpload(files)` — an
 * array, even for a single file —, `busy` (true while an upload queue is in
 * progress) and `disabled` (true while busy, to avoid dropping a second batch
 * before the first one finishes, and while no course unit is chosen). Only
 * `busy` shows "Uploading files..."; disabled without being busy asks for the
 * unit instead.
 */




const ACCEPT_TYPES = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.presentationml.presentation", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "text/plain", "text/csv", "text/markdown", "text/html",
// Some browsers do not resolve these MIME types well by extension;
// they are added explicitly so the file picker always shows them.
".csv", ".md", ".html", ".htm"].join(",");
function UploadZone({
  onUpload,
  disabled,
  busy = false,
  accept = ACCEPT_TYPES,
  lang = "es"
}) {
  const inputRef = (0,react.useRef)(null);
  const [dragOver, setDragOver] = (0,react.useState)(false);
  const L = lang === "es" ? {
    uploading: "Subiendo archivos...",
    drop: "Arrastrá uno o varios archivos acá",
    wait: "Por favor esperá a que termine",
    clickHint: "o hacé click para seleccionar",
    chooseUnit: "Primero elegí una unidad del curso",
    unitHint: "Cada archivo se crea como actividad en esa unidad",
    formats: "Formatos: PDF · DOCX · PPTX · XLSX · CSV · MD · HTML · TXT · Tamaño máximo: 20 MB"
  } : {
    uploading: "Uploading files...",
    drop: "Drag one or more files here",
    wait: "Please wait until it finishes",
    clickHint: "or click to select",
    chooseUnit: "Choose a course unit first",
    unitHint: "Each file is created as an activity in that unit",
    formats: "Formats: PDF · DOCX · PPTX · XLSX · CSV · MD · HTML · TXT · Max size: 20 MB"
  };
  const handleFiles = files => {
    if (!files || !files.length) return;
    onUpload(Array.from(files));
  };
  const onDragOver = e => {
    e.preventDefault();
    if (!disabled) setDragOver(true);
  };
  const onDragLeave = e => {
    e.preventDefault();
    setDragOver(false);
  };
  const onDrop = e => {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    handleFiles(e.dataTransfer.files);
  };
  const onClick = () => {
    if (disabled) return;
    inputRef.current?.click();
  };
  const onInputChange = e => {
    handleFiles(e.target.files);
    // Reset to allow uploading the same file twice in a row (new version).
    e.target.value = "";
  };
  const className = ["nexusai-dropzone", dragOver ? "nexusai-dropzone--dragover" : "", disabled ? "nexusai-dropzone--disabled" : ""].filter(Boolean).join(" ");
  return /*#__PURE__*/(0,jsx_runtime.jsxs)("div", {
    className: className,
    onDragOver: onDragOver,
    onDragLeave: onDragLeave,
    onDrop: onDrop,
    onClick: onClick,
    role: "button",
    tabIndex: 0,
    onKeyDown: e => {
      if (e.key === "Enter" || e.key === " ") onClick();
    },
    "aria-disabled": disabled,
    children: [/*#__PURE__*/(0,jsx_runtime.jsx)("input", {
      ref: inputRef,
      type: "file",
      multiple: true,
      accept: accept,
      onChange: onInputChange,
      style: {
        display: "none"
      },
      disabled: disabled
    }), /*#__PURE__*/(0,jsx_runtime.jsx)("div", {
      className: "nexusai-dropzone__icon",
      children: busy ? /*#__PURE__*/(0,jsx_runtime.jsx)("span", {
        className: "nexusai-dropzone__spinner"
      }) : /*#__PURE__*/(0,jsx_runtime.jsx)(IconUpload, {
        size: 26
      })
    }), /*#__PURE__*/(0,jsx_runtime.jsx)("div", {
      className: "nexusai-dropzone__title",
      children: busy ? L.uploading : disabled ? L.chooseUnit : L.drop
    }), /*#__PURE__*/(0,jsx_runtime.jsx)("div", {
      className: "nexusai-dropzone__hint",
      children: busy ? L.wait : disabled ? L.unitHint : L.clickHint
    }), /*#__PURE__*/(0,jsx_runtime.jsx)("div", {
      className: "nexusai-dropzone__formats",
      children: L.formats
    })]
  });
}
;// ./src/documents/csv.js
// This file is part of Moodle - https://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <https://www.gnu.org/licenses/>.

/**
 * Part of the NexusAI plugin (local_nexusai).
 *
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * Generic CSV exporter (DOC-D07, issue #355).
 *
 * Same approach as gift.js: the conversion and the download happen entirely
 * in the browser — no round-trip to the backend, since the panels that export
 * (Gaps, FAQ) already have the data loaded on screen.
 */

// Escapes a value for a CSV cell: if it contains a comma, double quote or line
// break, it is wrapped in double quotes, doubling the inner ones (RFC 4180).
function escapeCsvCell(value) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

/**
 * Builds a CSV string from headers and rows.
 *
 * @param {string[]} headers
 * @param {Array<Array<string|number>>} rows
 * @returns {string}
 */
function toCsv(headers, rows) {
  const lines = [headers, ...rows].map(row => row.map(escapeCsvCell).join(","));
  // Leading BOM so Excel detects UTF-8 (accents/ñ) without manual configuration.
  return "﻿" + lines.join("\r\n") + "\r\n";
}

/**
 * Fires the download of a .csv file in the browser (no request to the server).
 *
 * @param {string[]} headers
 * @param {Array<Array<string|number>>} rows
 * @param {string} [filename]
 */
function downloadCsvFile(headers, rows, filename = "export-nexusai.csv") {
  const content = toCsv(headers, rows);
  const blob = new Blob([content], {
    type: "text/csv;charset=utf-8"
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
;// ./src/components/Skeleton.jsx
/* unused harmony import specifier */ var Skeleton_jsx;

// This file is part of Moodle - https://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <https://www.gnu.org/licenses/>.

/**
 * Part of the NexusAI plugin (local_nexusai).
 *
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

// UX-12 (#370): reusable loading block. Before, the three teacher panels
// (Material, Analytics, FAQ) showed the same generic centered spinner
// (`.nexusai-loading` → "Loading..."). This small stateless component draws
// bars/blocks with a shimmer to build the approximate outline of the real
// content while it loads. Same lightweight approach as Tooltip.jsx /
// Toast.jsx: zero dependencies, only CSS.

// A single bar/block. `width` and `height` accept any CSS unit
// (by default width 100%, height 12px). `radius` for squares/circles.
function Skeleton({
  width,
  height,
  radius,
  className = "",
  style
}) {
  return /*#__PURE__*/(0,jsx_runtime.jsx)("span", {
    className: `nexusai-skeleton ${className}`,
    "aria-hidden": "true",
    style: {
      width: width ?? "100%",
      height: height ?? 12,
      borderRadius: radius,
      ...style
    }
  });
}

// Container of a full-screen skeleton. Wraps the outline and exposes the
// loading state to screen readers with an sr-only text
// (the individual <Skeleton> elements are `aria-hidden`).
function SkeletonScreen({
  label,
  className = "",
  children
}) {
  return /*#__PURE__*/(0,jsx_runtime.jsxs)("div", {
    className: `nexusai-skeleton-screen ${className}`,
    role: "status",
    "aria-live": "polite",
    children: [/*#__PURE__*/(0,jsx_runtime.jsx)("span", {
      className: "nexusai-sr-only",
      children: label
    }), children]
  });
}

// Group of N text lines of decreasing widths (the last one shorter),
// handy for paragraphs and lists.
function SkeletonText({
  lines = 3,
  className = ""
}) {
  return /*#__PURE__*/Skeleton_jsx("span", {
    className: `nexusai-skeleton-text ${className}`,
    "aria-hidden": "true",
    children: Array.from({
      length: lines
    }, (_, i) => /*#__PURE__*/Skeleton_jsx(Skeleton, {
      height: 11,
      width: i === lines - 1 ? "60%" : "100%"
    }, i))
  });
}
;// ./src/documents/FaqDashboardPanel.jsx
// This file is part of Moodle - https://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <https://www.gnu.org/licenses/>.

/**
 * Part of the NexusAI plugin (local_nexusai).
 *
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * FaqDashboardPanel — teacher view with the questions their students repeat
 * the most, grouped by topic (DOC-D02).
 *
 * There is no semantic clustering in the schema: the questions are first
 * grouped by normalized text and an LLM synthesizes those groups into topics.
 * The data comes from the external function `local_nexusai_analytics_faq_topics`.
 */








// UX-12 (#370): loading skeleton — grid of topic cards, each one with a
// title + a couple of lines of example questions.

function FaqSkeleton({
  lang = "es"
}) {
  return /*#__PURE__*/(0,jsx_runtime.jsx)(SkeletonScreen, {
    label: lang === "es" ? "Cargando preguntas frecuentes..." : "Loading frequently asked questions...",
    children: /*#__PURE__*/(0,jsx_runtime.jsx)("div", {
      className: "nexusai-skeleton-faq__grid",
      children: Array.from({
        length: 6
      }, (_, i) => /*#__PURE__*/(0,jsx_runtime.jsxs)("div", {
        className: "nexusai-skeleton-faq__card",
        children: [/*#__PURE__*/(0,jsx_runtime.jsxs)("div", {
          style: {
            display: "flex",
            alignItems: "center",
            gap: 8
          },
          children: [/*#__PURE__*/(0,jsx_runtime.jsx)(Skeleton, {
            width: 14,
            height: 14,
            radius: "50%"
          }), /*#__PURE__*/(0,jsx_runtime.jsx)(Skeleton, {
            width: "55%",
            height: 13
          }), /*#__PURE__*/(0,jsx_runtime.jsx)(Skeleton, {
            width: 28,
            height: 13,
            style: {
              marginLeft: "auto"
            }
          })]
        }), /*#__PURE__*/(0,jsx_runtime.jsx)(Skeleton, {
          width: "90%",
          height: 10
        }), /*#__PURE__*/(0,jsx_runtime.jsx)(Skeleton, {
          width: "70%",
          height: 10
        })]
      }, i))
    })
  });
}
function FaqDashboardPanel({
  courseId,
  lang = "es"
}) {
  const [topics, setTopics] = (0,react.useState)([]);
  const [totalQuestions, setTotalQuestions] = (0,react.useState)(0);
  const [loading, setLoading] = (0,react.useState)(true);
  const [error, setError] = (0,react.useState)(null);
  const [days, setDays] = (0,react.useState)(30);
  const L = lang === "es" ? {
    intro: "Preguntas más repetidas de tus alumnos, agrupadas por tema. Útil para detectar qué conceptos generan más dudas y priorizar el repaso en clase.",
    filterAria: "Filtrar preguntas frecuentes por período",
    show: "Mostrar:",
    last7: "Últimos 7 días",
    last30: "Último mes",
    last90: "Últimos 3 meses",
    last365: "Último año",
    loadError: "No se pudieron cargar las preguntas frecuentes.",
    emptyTitle: "No hay suficientes preguntas registradas en este período.",
    emptySub: "A medida que tus alumnos usen el chat, vas a ver acá los temas que más consultan.",
    topicsHeading: n => `Temas más consultados (${n} preguntas)`,
    exportCsv: "Exportar CSV",
    csvTopic: "Tema",
    csvCount: "Cantidad de preguntas"
  } : {
    intro: "The most repeated questions from your students, grouped by topic. Useful to spot which concepts cause the most confusion and prioritize what to review in class.",
    filterAria: "Filter frequently asked questions by period",
    show: "Show:",
    last7: "Last 7 days",
    last30: "Last month",
    last90: "Last 3 months",
    last365: "Last year",
    loadError: "Couldn't load the frequently asked questions.",
    emptyTitle: "Not enough questions recorded for this period yet.",
    emptySub: "As your students use the chat, you'll see the topics they ask about most here.",
    topicsHeading: n => `Most consulted topics (${n} questions)`,
    exportCsv: "Export CSV",
    csvTopic: "Topic",
    csvCount: "Number of questions"
  };
  (0,react.useEffect)(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getFaqTopics(courseId, days).then(data => {
      if (!cancelled) {
        setTopics(data?.topics || []);
        setTotalQuestions(data?.total_questions || 0);
        setLoading(false);
      }
    }).catch(err => {
      if (!cancelled) {
        setError(getFriendlyErrorMessage(err, L.loadError, lang));
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [courseId, days]);
  const handleExportCsv = () => {
    const rows = topics.map(t => [t.topic, t.count]);
    downloadCsvFile([L.csvTopic, L.csvCount], rows, `faq-nexusai-curso-${courseId}.csv`);
  };
  return /*#__PURE__*/(0,jsx_runtime.jsxs)("div", {
    className: "nexusai-faq",
    children: [/*#__PURE__*/(0,jsx_runtime.jsx)("p", {
      className: "nexusai-documents__intro",
      children: L.intro
    }), /*#__PURE__*/(0,jsx_runtime.jsxs)("div", {
      className: "nexusai-gaps__filter",
      role: "group",
      "aria-label": L.filterAria,
      children: [/*#__PURE__*/(0,jsx_runtime.jsx)("span", {
        className: "nexusai-gaps__filter-label",
        children: L.show
      }), [7, 30, 90, 365].map(d => /*#__PURE__*/(0,jsx_runtime.jsxs)("button", {
        type: "button",
        className: `nexusai-gaps__filter-btn ${days === d ? "nexusai-gaps__filter-btn--active" : ""}`,
        onClick: () => setDays(d),
        "aria-pressed": days === d,
        children: [d === 7 && L.last7, d === 30 && L.last30, d === 90 && L.last90, d === 365 && L.last365]
      }, d))]
    }), loading && /*#__PURE__*/(0,jsx_runtime.jsx)(FaqSkeleton, {
      lang: lang
    }), error && /*#__PURE__*/(0,jsx_runtime.jsx)("div", {
      className: "nexusai-alert nexusai-alert--error",
      role: "alert",
      children: /*#__PURE__*/(0,jsx_runtime.jsx)("span", {
        children: error
      })
    }), !loading && !error && topics.length === 0 && /*#__PURE__*/(0,jsx_runtime.jsxs)("div", {
      className: "nexusai-gaps__empty",
      children: [/*#__PURE__*/(0,jsx_runtime.jsx)("div", {
        className: "nexusai-gaps__empty-icon",
        children: /*#__PURE__*/(0,jsx_runtime.jsx)(IconHelpCircle, {
          size: 20
        })
      }), /*#__PURE__*/(0,jsx_runtime.jsx)("p", {
        className: "nexusai-gaps__empty-title",
        children: L.emptyTitle
      }), /*#__PURE__*/(0,jsx_runtime.jsx)("p", {
        className: "nexusai-gaps__empty-sub",
        children: L.emptySub
      })]
    }), !loading && !error && topics.length > 0 && /*#__PURE__*/(0,jsx_runtime.jsxs)("div", {
      className: "nexusai-faq__list",
      children: [/*#__PURE__*/(0,jsx_runtime.jsxs)("div", {
        className: "nexusai-gaps__list-header",
        children: [/*#__PURE__*/(0,jsx_runtime.jsx)("h3", {
          className: "nexusai-documents__heading",
          children: L.topicsHeading(totalQuestions)
        }), /*#__PURE__*/(0,jsx_runtime.jsxs)("button", {
          type: "button",
          className: "nexusai-btn",
          onClick: handleExportCsv,
          children: [/*#__PURE__*/(0,jsx_runtime.jsx)(IconDownload, {
            size: 13
          }), L.exportCsv]
        })]
      }), /*#__PURE__*/(0,jsx_runtime.jsx)("div", {
        className: "nexusai-faq__grid",
        children: topics.map((t, i) => /*#__PURE__*/(0,jsx_runtime.jsxs)("div", {
          className: "nexusai-faq-card",
          children: [/*#__PURE__*/(0,jsx_runtime.jsxs)("div", {
            className: "nexusai-faq-card__row",
            children: [/*#__PURE__*/(0,jsx_runtime.jsx)(IconHelpCircle, {
              size: 14
            }), /*#__PURE__*/(0,jsx_runtime.jsx)("span", {
              className: "nexusai-faq-card__label",
              children: t.topic
            }), /*#__PURE__*/(0,jsx_runtime.jsxs)("span", {
              className: "nexusai-faq-card__count",
              children: ["\xD7", t.count]
            })]
          }), t.example_questions?.length > 0 && /*#__PURE__*/(0,jsx_runtime.jsx)("ul", {
            className: "nexusai-faq-card__examples",
            children: t.example_questions.map((q, j) => /*#__PURE__*/(0,jsx_runtime.jsxs)("li", {
              children: ["\"", q, "\""]
            }, j))
          })]
        }, i))
      })]
    })]
  });
}
;// ./src/documents/GapsPanel.jsx
// This file is part of Moodle - https://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <https://www.gnu.org/licenses/>.

/**
 * Part of the NexusAI plugin (local_nexusai).
 *
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * GapsPanel — teacher view with the questions the material did not answer.
 *
 * Teaching feedback loop: shows the topics students ask about but the
 * indexed material does not cover well. The data comes from the external
 * function `local_nexusai_gaps_list`.
 */







function relativeTime(iso, lang = "es") {
  if (!iso) return "";
  try {
    const date = new Date(iso);
    const diffMs = Date.now() - date.getTime();
    const sec = Math.floor(diffMs / 1000);
    const min = Math.floor(sec / 60);
    const hr = Math.floor(min / 60);
    const day = Math.floor(hr / 24);
    if (lang === "es") {
      if (sec < 60) return "hace un instante";
      if (min < 60) return `hace ${min} min`;
      if (hr < 24) return `hace ${hr}h`;
      if (day < 7) return `hace ${day} día${day === 1 ? "" : "s"}`;
      return date.toLocaleDateString("es-AR");
    }
    if (sec < 60) return "just now";
    if (min < 60) return `${min} min ago`;
    if (hr < 24) return `${hr}h ago`;
    if (day < 7) return `${day} day${day === 1 ? "" : "s"} ago`;
    return date.toLocaleDateString("en-US");
  } catch {
    return "";
  }
}
function similarityLabel(sim, lang = "es") {
  if (lang === "es") {
    if (sim === null || sim === undefined) return {
      text: "sin match",
      level: "high"
    };
    if (sim < 0.25) return {
      text: "match nulo",
      level: "high"
    };
    if (sim < 0.4) return {
      text: "match débil",
      level: "mid"
    };
    return {
      text: "match parcial",
      level: "low"
    };
  }
  if (sim === null || sim === undefined) return {
    text: "no match",
    level: "high"
  };
  if (sim < 0.25) return {
    text: "no match",
    level: "high"
  };
  if (sim < 0.4) return {
    text: "weak match",
    level: "mid"
  };
  return {
    text: "partial match",
    level: "low"
  };
}

// UX-15 (#385): number of gaps requested per page, both on the initial
// load and on each "Load more".
const PAGE_SIZE = 30;
function GapsPanel({
  courseId,
  lang = "es"
}) {
  const [items, setItems] = (0,react.useState)([]);
  const [total, setTotal] = (0,react.useState)(0);
  const [loading, setLoading] = (0,react.useState)(true);
  const [loadingMore, setLoadingMore] = (0,react.useState)(false);
  const [error, setError] = (0,react.useState)(null);
  const [days, setDays] = (0,react.useState)(30);
  const [showArchived, setShowArchived] = (0,react.useState)(false);
  const [archivingIdx, setArchivingIdx] = (0,react.useState)(null);
  const L = lang === "es" ? {
    intro: "Preguntas que los alumnos hicieron y que el material indexado no pudo responder bien. Útil para descubrir qué temas pedir o agregar a tus archivos del curso.",
    filterAria: "Filtrar vacíos de contenido por período",
    show: "Mostrar:",
    last7: "Últimos 7 días",
    last30: "Último mes",
    last90: "Últimos 3 meses",
    last365: "Último año",
    viewArchived: "Ver archivadas",
    loading: "Cargando gaps...",
    loadError: "No se pudieron cargar los vacíos de contenido.",
    loadMoreError: "No se pudieron cargar más vacíos de contenido.",
    archiveError: "No se pudo archivar el vacío de contenido.",
    emptyTitle: "No hay gaps registrados en este período.",
    emptySub: "El material respondió bien todas las consultas que llegaron al asistente.",
    heading: n => `Preguntas sin respuesta (${n})`,
    exportCsv: "Exportar CSV",
    archivedBadge: "Archivada",
    avgSim: pct => `similaridad promedio ${pct}%`,
    archive: "Archivar",
    unarchive: "Desarchivar",
    archiveAria: (archived, q) => `${archived ? "Desarchivar" : "Archivar"} la pregunta: ${q}`,
    loadMore: (a, b) => `Cargar más (${a} de ${b})`,
    csvQuestion: "Pregunta",
    csvSimilarity: "Similitud",
    csvLastAsked: "Última consulta",
    noMatch: "sin match"
  } : {
    intro: "Questions your students asked that the indexed material couldn't answer well. Useful to discover which topics to request or add to your course files.",
    filterAria: "Filter content gaps by period",
    show: "Show:",
    last7: "Last 7 days",
    last30: "Last month",
    last90: "Last 3 months",
    last365: "Last year",
    viewArchived: "Show archived",
    loading: "Loading gaps...",
    loadError: "Couldn't load the content gaps.",
    loadMoreError: "Couldn't load more content gaps.",
    archiveError: "Couldn't archive the content gap.",
    emptyTitle: "No gaps recorded for this period.",
    emptySub: "The material answered all the questions that reached the assistant well.",
    heading: n => `Unanswered questions (${n})`,
    exportCsv: "Export CSV",
    archivedBadge: "Archived",
    avgSim: pct => `average similarity ${pct}%`,
    archive: "Archive",
    unarchive: "Unarchive",
    archiveAria: (archived, q) => `${archived ? "Unarchive" : "Archive"} the question: ${q}`,
    loadMore: (a, b) => `Load more (${a} of ${b})`,
    csvQuestion: "Question",
    csvSimilarity: "Similarity",
    csvLastAsked: "Last asked",
    noMatch: "no match"
  };
  (0,react.useEffect)(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    listGaps(courseId, days, PAGE_SIZE, showArchived, 0).then(data => {
      if (!cancelled) {
        setItems(data?.items || []);
        setTotal(data?.total || 0);
        setLoading(false);
      }
    }).catch(err => {
      if (!cancelled) {
        setError(getFriendlyErrorMessage(err, L.loadError, lang));
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [courseId, days, showArchived]);
  const hasMore = items.length < total;
  const handleLoadMore = async () => {
    setLoadingMore(true);
    try {
      const data = await listGaps(courseId, days, PAGE_SIZE, showArchived, items.length);
      setItems(prev => [...prev, ...(data?.items || [])]);
      setTotal(data?.total ?? total);
    } catch (err) {
      setError(getFriendlyErrorMessage(err, L.loadMoreError, lang));
    } finally {
      setLoadingMore(false);
    }
  };
  const handleExportCsv = () => {
    const rows = items.map(g => [g.question, g.avg_similarity === null || g.avg_similarity === undefined ? L.noMatch : `${Math.round(g.avg_similarity * 100)}%`, g.last_asked_at ? new Date(g.last_asked_at).toLocaleString(lang === "es" ? "es-AR" : "en-US") : ""]);
    downloadCsvFile([L.csvQuestion, L.csvSimilarity, L.csvLastAsked], rows, `gaps-nexusai-curso-${courseId}.csv`);
  };
  const handleToggleArchive = async (item, idx) => {
    const nextArchived = !item.is_archived;
    setArchivingIdx(idx);
    try {
      await archiveGap(courseId, item.question_ids, nextArchived);
      if (!showArchived) {
        // Default view: a just archived gap stops matching the
        // filter (archived_at IS NULL), so it leaves the list.
        setItems(prev => prev.filter((_, i) => i !== idx));
        setTotal(prev => Math.max(0, prev - 1));
      } else {
        setItems(prev => prev.map((g, i) => i === idx ? {
          ...g,
          is_archived: nextArchived
        } : g));
      }
    } catch (err) {
      setError(getFriendlyErrorMessage(err, L.archiveError, lang));
    } finally {
      setArchivingIdx(null);
    }
  };
  return /*#__PURE__*/(0,jsx_runtime.jsxs)("div", {
    className: "nexusai-gaps",
    children: [/*#__PURE__*/(0,jsx_runtime.jsx)("p", {
      className: "nexusai-documents__intro",
      children: L.intro
    }), /*#__PURE__*/(0,jsx_runtime.jsxs)("div", {
      className: "nexusai-gaps__filter",
      role: "group",
      "aria-label": L.filterAria,
      children: [/*#__PURE__*/(0,jsx_runtime.jsx)("span", {
        className: "nexusai-gaps__filter-label",
        children: L.show
      }), [7, 30, 90, 365].map(d => /*#__PURE__*/(0,jsx_runtime.jsxs)("button", {
        type: "button",
        className: `nexusai-gaps__filter-btn ${days === d ? "nexusai-gaps__filter-btn--active" : ""}`,
        onClick: () => setDays(d),
        "aria-pressed": days === d,
        children: [d === 7 && L.last7, d === 30 && L.last30, d === 90 && L.last90, d === 365 && L.last365]
      }, d)), /*#__PURE__*/(0,jsx_runtime.jsxs)("label", {
        className: "nexusai-gaps__archived-toggle",
        children: [/*#__PURE__*/(0,jsx_runtime.jsx)("input", {
          type: "checkbox",
          checked: showArchived,
          onChange: e => setShowArchived(e.target.checked)
        }), L.viewArchived]
      })]
    }), loading && /*#__PURE__*/(0,jsx_runtime.jsx)("div", {
      className: "nexusai-loading",
      role: "status",
      children: L.loading
    }), error && /*#__PURE__*/(0,jsx_runtime.jsx)("div", {
      className: "nexusai-alert nexusai-alert--error",
      role: "alert",
      children: /*#__PURE__*/(0,jsx_runtime.jsx)("span", {
        children: error
      })
    }), !loading && !error && items.length === 0 && /*#__PURE__*/(0,jsx_runtime.jsxs)("div", {
      className: "nexusai-gaps__empty",
      children: [/*#__PURE__*/(0,jsx_runtime.jsx)("div", {
        className: "nexusai-gaps__empty-icon",
        children: /*#__PURE__*/(0,jsx_runtime.jsx)(IconCheck, {
          size: 20
        })
      }), /*#__PURE__*/(0,jsx_runtime.jsx)("p", {
        className: "nexusai-gaps__empty-title",
        children: L.emptyTitle
      }), /*#__PURE__*/(0,jsx_runtime.jsx)("p", {
        className: "nexusai-gaps__empty-sub",
        children: L.emptySub
      })]
    }), !loading && !error && items.length > 0 && /*#__PURE__*/(0,jsx_runtime.jsxs)("div", {
      className: "nexusai-gaps__list",
      children: [/*#__PURE__*/(0,jsx_runtime.jsxs)("div", {
        className: "nexusai-gaps__list-header",
        children: [/*#__PURE__*/(0,jsx_runtime.jsx)("h3", {
          className: "nexusai-documents__heading",
          children: L.heading(total)
        }), /*#__PURE__*/(0,jsx_runtime.jsxs)("button", {
          type: "button",
          className: "nexusai-btn",
          onClick: handleExportCsv,
          children: [/*#__PURE__*/(0,jsx_runtime.jsx)(IconDownload, {
            size: 13
          }), L.exportCsv]
        })]
      }), items.map((g, i) => {
        const sim = similarityLabel(g.avg_similarity, lang);
        return /*#__PURE__*/(0,jsx_runtime.jsxs)("div", {
          className: `nexusai-gap-item ${g.is_archived ? "nexusai-gap-item--archived" : ""}`,
          children: [/*#__PURE__*/(0,jsx_runtime.jsxs)("div", {
            className: "nexusai-gap-item__row",
            children: [/*#__PURE__*/(0,jsx_runtime.jsxs)("span", {
              className: "nexusai-gap-item__question",
              children: ["\u201C", g.question, "\u201D", g.is_archived && /*#__PURE__*/(0,jsx_runtime.jsx)("span", {
                className: "nexusai-gap-item__archived-badge",
                children: L.archivedBadge
              })]
            }), /*#__PURE__*/(0,jsx_runtime.jsxs)("span", {
              className: "nexusai-gap-item__count",
              children: ["\xD7", g.count]
            })]
          }), /*#__PURE__*/(0,jsx_runtime.jsxs)("div", {
            className: "nexusai-gap-item__meta",
            children: [/*#__PURE__*/(0,jsx_runtime.jsx)("span", {
              className: `nexusai-gap-item__similarity nexusai-gap-item__similarity--${sim.level}`,
              children: sim.text
            }), /*#__PURE__*/(0,jsx_runtime.jsx)("span", {
              className: "nexusai-gap-item__sep",
              children: "\xB7"
            }), /*#__PURE__*/(0,jsx_runtime.jsx)("span", {
              children: relativeTime(g.last_asked_at, lang)
            }), g.avg_similarity !== null && g.avg_similarity !== undefined && /*#__PURE__*/(0,jsx_runtime.jsxs)(jsx_runtime.Fragment, {
              children: [/*#__PURE__*/(0,jsx_runtime.jsx)("span", {
                className: "nexusai-gap-item__sep",
                children: "\xB7"
              }), /*#__PURE__*/(0,jsx_runtime.jsx)("span", {
                children: L.avgSim(Math.round(g.avg_similarity * 100))
              })]
            }), /*#__PURE__*/(0,jsx_runtime.jsx)("span", {
              className: "nexusai-gap-item__sep",
              children: "\xB7"
            }), /*#__PURE__*/(0,jsx_runtime.jsxs)("button", {
              type: "button",
              className: "nexusai-gap-item__archive-btn",
              onClick: () => handleToggleArchive(g, i),
              disabled: archivingIdx === i,
              "aria-label": L.archiveAria(g.is_archived, g.question),
              children: [/*#__PURE__*/(0,jsx_runtime.jsx)(IconArchive, {
                size: 12
              }), archivingIdx === i ? "..." : g.is_archived ? L.unarchive : L.archive]
            })]
          })]
        }, i);
      }), hasMore && /*#__PURE__*/(0,jsx_runtime.jsx)("button", {
        type: "button",
        className: "nexusai-gaps__load-more",
        onClick: handleLoadMore,
        disabled: loadingMore,
        children: loadingMore ? lang === "es" ? "Cargando..." : "Loading..." : L.loadMore(items.length, total)
      })]
    })]
  });
}
;// ./src/documents/StudentQuestionsPanel.jsx
// This file is part of Moodle - https://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <https://www.gnu.org/licenses/>.

/**
 * Part of the NexusAI plugin (local_nexusai).
 *
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * StudentQuestionsPanel — brings "Frequent questions" and "Detected gaps"
 * under a single navigation destination, with an inner selector
 * (RDS-08, #416). Same pattern as the student's StudyPanel.jsx
 * (Plan/Practice/Review selector wrapping independent sub-panels).
 * It does not change the logic of FaqDashboardPanel or
 * GapsPanel — it only decides which of the two to mount.
 */





function StudentQuestionsPanel({
  courseId,
  lang = "es"
}) {
  const [mode, setMode] = (0,react.useState)("faq"); // "faq" | "gaps"

  const L = lang === "es" ? {
    faq: "Frecuentes",
    gaps: "Sin responder"
  } : {
    faq: "Frequent",
    gaps: "Unanswered"
  };
  return /*#__PURE__*/(0,jsx_runtime.jsxs)("div", {
    className: "nexusai-questions",
    children: [/*#__PURE__*/(0,jsx_runtime.jsxs)("div", {
      className: "nexusai-questions__modebtns",
      children: [/*#__PURE__*/(0,jsx_runtime.jsx)("button", {
        type: "button",
        className: `nexusai-questions__modebtn ${mode === "faq" ? "nexusai-questions__modebtn--active" : ""}`,
        onClick: () => setMode("faq"),
        children: L.faq
      }), /*#__PURE__*/(0,jsx_runtime.jsx)("button", {
        type: "button",
        className: `nexusai-questions__modebtn ${mode === "gaps" ? "nexusai-questions__modebtn--active" : ""}`,
        onClick: () => setMode("gaps"),
        children: L.gaps
      })]
    }), mode === "faq" ? /*#__PURE__*/(0,jsx_runtime.jsx)(FaqDashboardPanel, {
      courseId: courseId,
      lang: lang
    }) : /*#__PURE__*/(0,jsx_runtime.jsx)(GapsPanel, {
      courseId: courseId,
      lang: lang
    })]
  });
}
;// ./src/documents/BarChart.jsx
// This file is part of Moodle - https://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <https://www.gnu.org/licenses/>.

/**
 * Part of the NexusAI plugin (local_nexusai).
 *
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */



/**
 * BarChart — generic bars with a real tooltip on hover/focus (ANALYTICS-04,
 * #371). Replaces the native `title` the "Daily usage" and "Score
 * distribution" sections used before: the browser's `title` takes a while to
 * show, cannot be reached with the keyboard and cannot be styled. Here the
 * tooltip is a positioned `<span>` shown by state, with the same event on
 * mouse (hover) and on focus (keyboard), and the columns are horizontally
 * scrollable bars so they are not squashed with many data points
 * (a 365-day window, for example) — that scroll already existed for the
 * daily section (UX-16); here it is generalized to any `BarChart`.
 *
 * It is not a charting library — it is still pure CSS (height in %), only
 * now with React state for the tooltip instead of `title`.
 */

function BarChart({
  items,
  maxValue,
  variant,
  formatTooltip,
  formatLabel
}) {
  const [activeKey, setActiveKey] = (0,react.useState)(null);
  const colClass = variant === "buckets" ? "nexusai-analytics__bucket-col" : "nexusai-analytics__bar-col";
  return /*#__PURE__*/(0,jsx_runtime.jsx)("div", {
    className: `nexusai-analytics__bars nexusai-analytics__bars--${variant}`,
    children: items.map(item => {
      const pct = Math.max(0, Math.min(100, Math.round(item.value / maxValue * 100)));
      const tooltip = formatTooltip(item);
      const isActive = activeKey === item.key;
      return /*#__PURE__*/(0,jsx_runtime.jsxs)("div", {
        className: colClass,
        onMouseEnter: () => setActiveKey(item.key),
        onMouseLeave: () => setActiveKey(k => k === item.key ? null : k),
        children: [/*#__PURE__*/(0,jsx_runtime.jsx)("div", {
          className: `nexusai-analytics__bar${variant === "buckets" ? " nexusai-analytics__bar--bucket" : ""}`,
          style: {
            height: `${pct}%`
          },
          tabIndex: 0,
          role: "img",
          "aria-label": tooltip,
          onFocus: () => setActiveKey(item.key),
          onBlur: () => setActiveKey(k => k === item.key ? null : k),
          children: isActive && /*#__PURE__*/(0,jsx_runtime.jsx)("span", {
            className: "nexusai-analytics__bar-tooltip",
            role: "tooltip",
            children: tooltip
          })
        }), formatLabel && /*#__PURE__*/(0,jsx_runtime.jsx)("span", {
          className: "nexusai-analytics__bucket-label",
          children: formatLabel(item)
        })]
      }, item.key);
    })
  });
}
;// ./src/documents/AnalyticsDashboardPanel.jsx
// This file is part of Moodle - https://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <https://www.gnu.org/licenses/>.

/**
 * Part of the NexusAI plugin (local_nexusai).
 *
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * AnalyticsDashboardPanel — teacher view with aggregated metrics of the
 * course (ANALYTICS-01/02): most frequent questions, daily usage, quiz score
 * distribution and content gaps ratio.
 *
 * The data comes from the external function `local_nexusai_analytics_dashboard`,
 * which computes it from the plugin's tables. There is no clustering or LLM
 * synthesis here (unlike FaqDashboardPanel) — they are direct aggregations.
 *
 * The "bars" are pure CSS (height/width in %), the same lightweight approach as
 * the rest of the plugin — no charting library is added, only an own
 * component (`BarChart`, ANALYTICS-04 #371) with a real tooltip on
 * hover/focus and horizontal scroll so they are not squashed with many data
 * points (365 days).
 *
 * ANALYTICS-03 (#316): "Export to PDF" reuses the same dependency-free
 * approach as SP-17 (`printQuizAsPdf` in QuizPanel.jsx) — it opens a blank
 * window with self-contained HTML/CSS and fires window.print(), instead of
 * adding a PDF generation library. The printed HTML builds its own static
 * bars (it does not reuse <BarChart>, whose tooltip depends on hover/focus
 * state — it makes no sense in a document).
 */








function daysLabels(lang) {
  return lang === "es" ? {
    7: "Últimos 7 días",
    30: "Último mes",
    90: "Últimos 3 meses",
    365: "Último año"
  } : {
    7: "Last 7 days",
    30: "Last month",
    90: "Last 3 months",
    365: "Last year"
  };
}
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = String(text ?? "");
  return div.innerHTML;
}
function staticBarsHtml(items, maxValue) {
  return items.map(item => {
    const pct = Math.max(0, Math.min(100, Math.round(item.value / maxValue * 100)));
    return `<div class="bar-col"><div class="bar" style="height:${pct}%"></div><span class="bar-val">${item.value}</span><span class="bar-label">${escapeHtml(item.label)}</span></div>`;
  }).join("");
}
function printAnalyticsAsPdf(report, lang = "es") {
  const win = window.open("", "_blank");
  if (!win) return; // popup blocked by the browser

  const {
    courseName,
    days,
    topQueries,
    dailyCounts,
    maxDaily,
    quizDist,
    maxBucket,
    ratioPct,
    gapsRatio,
    feedbackRatio
  } = report;
  const DAYS_LABELS = daysLabels(lang);
  const daysLabel = DAYS_LABELS[days] || (lang === "es" ? `${days} días` : `${days} days`);
  const P = lang === "es" ? {
    defaultTitle: "Reporte de Analytics",
    period: label => `Período: ${label}`,
    topQueries: "Preguntas más frecuentes",
    noQueries: "Sin preguntas registradas en este período.",
    dailyUsage: "Uso diario",
    noActivity: "Sin actividad registrada en este período.",
    quizDist: "Distribución de puntajes de quiz",
    avgOf: (avg, n) => `Promedio: ${avg.toFixed(1)} sobre ${n} intento${n === 1 ? "" : "s"}`,
    noAttempts: "Todavía no hay intentos de quiz registrados.",
    gaps: "Vacíos de contenido",
    gapsStat: (pct, a, b) => `${pct}% — ${a} de ${b} preguntas sin responder bien`,
    noData: "Sin datos suficientes en este período.",
    usefulAnswers: "Respuestas útiles",
    usefulStat: (pct, n) => `${pct}% (${n} votos)`,
    noVotes: "Sin votos registrados."
  } : {
    defaultTitle: "Analytics Report",
    period: label => `Period: ${label}`,
    topQueries: "Most frequent questions",
    noQueries: "No questions recorded for this period.",
    dailyUsage: "Daily usage",
    noActivity: "No activity recorded for this period.",
    quizDist: "Quiz score distribution",
    avgOf: (avg, n) => `Average: ${avg.toFixed(1)} out of ${n} attempt${n === 1 ? "" : "s"}`,
    noAttempts: "No quiz attempts recorded yet.",
    gaps: "Content gaps",
    gapsStat: (pct, a, b) => `${pct}% — ${a} of ${b} questions not answered well`,
    noData: "Not enough data for this period.",
    usefulAnswers: "Helpful answers",
    usefulStat: (pct, n) => `${pct}% (${n} votes)`,
    noVotes: "No votes recorded."
  };
  const dailyItems = dailyCounts.map(d => ({
    value: d.message_count,
    label: d.date
  }));
  const bucketItems = quizDist.buckets.map(b => ({
    value: b.count,
    label: b.range
  }));
  const topQueriesHtml = topQueries.length ? `<ul>${topQueries.map(q => `<li>${escapeHtml(q.question)} <strong>×${q.count}</strong></li>`).join("")}</ul>` : `<p class="empty">${P.noQueries}</p>`;
  win.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${escapeHtml(courseName || P.defaultTitle)}</title>
<style>
    body { font-family: -apple-system, Arial, sans-serif; color: #1e293b; padding: 24px; max-width: 720px; margin: 0 auto; }
    h1 { font-size: 18px; margin-bottom: 2px; }
    h2 { font-size: 13px; margin: 24px 0 8px; }
    .sub { font-size: 12px; color: #64748b; margin: 0 0 20px; }
    .section { page-break-inside: avoid; margin-bottom: 16px; }
    .empty { font-size: 12px; color: #64748b; }
    ul { margin: 0; padding-left: 20px; font-size: 13px; }
    li { margin-bottom: 4px; }
    .bars { display: flex; align-items: flex-end; gap: 4px; height: 90px; }
    .bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%; font-size: 9px; }
    .bar { width: 100%; min-height: 2px; background: #6366f1; }
    .bar-val { margin-top: 2px; }
    .bar-label { color: #64748b; white-space: nowrap; }
    .stat { font-size: 13px; margin: 4px 0; }
    @media print { body { padding: 0; } }
</style>
</head>
<body>
<h1>${escapeHtml(courseName || P.defaultTitle)}</h1>
<p class="sub">${P.period(escapeHtml(daysLabel))}</p>

<div class="section">
    <h2>${P.topQueries}</h2>
    ${topQueriesHtml}
</div>

<div class="section">
    <h2>${P.dailyUsage}</h2>
    ${dailyItems.length ? `<div class="bars">${staticBarsHtml(dailyItems, maxDaily)}</div>` : `<p class="empty">${P.noActivity}</p>`}
</div>

<div class="section">
    <h2>${P.quizDist}</h2>
    ${quizDist.total_attempts > 0 ? `<p class="stat">${P.avgOf(quizDist.average_score, quizDist.total_attempts)}</p><div class="bars">${staticBarsHtml(bucketItems, maxBucket)}</div>` : `<p class="empty">${P.noAttempts}</p>`}
</div>

<div class="section">
    <h2>${P.gaps}</h2>
    <p class="stat">${gapsRatio.gaps_detected + gapsRatio.questions_answered > 0 ? P.gapsStat(ratioPct, gapsRatio.gaps_detected, gapsRatio.gaps_detected + gapsRatio.questions_answered) : P.noData}</p>
</div>

<div class="section">
    <h2>${P.usefulAnswers}</h2>
    <p class="stat">${feedbackRatio.total_rated > 0 ? P.usefulStat(feedbackRatio.useful_pct, feedbackRatio.total_rated) : P.noVotes}</p>
</div>
</body>
</html>`);
  win.document.close();
  win.focus();
  win.print();
}

// UX-12 (#370): loading skeleton — row of metric cards + two sections
// with bars, approximating the real layout below.
function AnalyticsSkeleton({
  lang = "es"
}) {
  return /*#__PURE__*/(0,jsx_runtime.jsxs)(SkeletonScreen, {
    label: lang === "es" ? "Cargando analytics..." : "Loading analytics...",
    children: [/*#__PURE__*/(0,jsx_runtime.jsx)("div", {
      className: "nexusai-skeleton-analytics__stats",
      children: Array.from({
        length: 5
      }, (_, i) => /*#__PURE__*/(0,jsx_runtime.jsxs)("div", {
        className: "nexusai-skeleton-analytics__stat",
        children: [/*#__PURE__*/(0,jsx_runtime.jsx)(Skeleton, {
          width: 16,
          height: 16,
          radius: "50%"
        }), /*#__PURE__*/(0,jsx_runtime.jsx)(Skeleton, {
          width: "40%",
          height: 22
        }), /*#__PURE__*/(0,jsx_runtime.jsx)(Skeleton, {
          width: "80%",
          height: 10
        })]
      }, i))
    }), /*#__PURE__*/(0,jsx_runtime.jsx)("div", {
      className: "nexusai-skeleton-analytics__grid",
      children: Array.from({
        length: 2
      }, (_, i) => /*#__PURE__*/(0,jsx_runtime.jsxs)("div", {
        className: "nexusai-skeleton-analytics__section",
        children: [/*#__PURE__*/(0,jsx_runtime.jsx)(Skeleton, {
          width: "50%",
          height: 14
        }), /*#__PURE__*/(0,jsx_runtime.jsx)("div", {
          className: "nexusai-skeleton-analytics__bars",
          children: Array.from({
            length: 7
          }, (_, j) => /*#__PURE__*/(0,jsx_runtime.jsx)(Skeleton, {
            height: `${30 + j * 37 % 60}%`
          }, j))
        })]
      }, i))
    })]
  });
}
function AnalyticsDashboardPanel({
  courseId,
  courseName,
  lang = "es"
}) {
  const [data, setData] = (0,react.useState)(null);
  const [loading, setLoading] = (0,react.useState)(true);
  const [error, setError] = (0,react.useState)(null);
  const [days, setDays] = (0,react.useState)(30);
  const L = lang === "es" ? {
    intro: "Visión agregada de la actividad del curso: qué preguntan tus alumnos, cuánto usan el asistente, cómo les va en los quizzes de práctica, y cuántas preguntas el material no pudo responder bien.",
    show: "Mostrar:",
    last7: "Últimos 7 días",
    last30: "Último mes",
    last90: "Últimos 3 meses",
    last365: "Último año",
    exportPdf: "Exportar a PDF",
    loadError: "No se pudo cargar el dashboard de analytics.",
    emptyTitle: "Todavía no hay actividad suficiente en este período.",
    emptySub: "A medida que tus alumnos usen el asistente y hagan quizzes, vas a ver acá las métricas del curso.",
    practiceQuizzes: "Quizzes de práctica",
    contentGaps: "Vacíos de contenido",
    questionsAsked: "Preguntas al asistente",
    topicsConsulted: "Temas consultados",
    usefulAnswers: "Respuestas útiles",
    votes: n => ` (${n} votos)`,
    contentHealth: "Salud del contenido",
    healthSub: "Basado en el ratio de vacíos de contenido detectados",
    topQueries: "Preguntas más frecuentes",
    noQueries: "Sin preguntas registradas en este período.",
    dailyUsage: "Uso diario",
    noActivity: "Sin actividad registrada en este período.",
    quizDist: "Distribución de puntajes de quiz",
    noAttempts: "Todavía no hay intentos de quiz registrados.",
    avgOf: n => `promedio sobre ${n} intento${n === 1 ? "" : "s"}`,
    gaps: "Vacíos de contenido",
    noData: "Sin datos suficientes en este período.",
    gapsRatioSub: (a, b) => `${a} de ${b} preguntas sin responder bien`,
    tooltipDate: item => `${item.date}: ${item.value}`,
    tooltipRange: item => `${item.range}: ${item.value}`
  } : {
    intro: "Aggregated view of course activity: what your students ask, how much they use the assistant, how they do on practice quizzes, and how many questions the material couldn't answer well.",
    show: "Show:",
    last7: "Last 7 days",
    last30: "Last month",
    last90: "Last 3 months",
    last365: "Last year",
    exportPdf: "Export to PDF",
    loadError: "Couldn't load the analytics dashboard.",
    emptyTitle: "Not enough activity for this period yet.",
    emptySub: "As your students use the assistant and take quizzes, you'll see the course metrics here.",
    practiceQuizzes: "Practice quizzes",
    contentGaps: "Content gaps",
    questionsAsked: "Questions to the assistant",
    topicsConsulted: "Topics consulted",
    usefulAnswers: "Helpful answers",
    votes: n => ` (${n} votes)`,
    contentHealth: "Content health",
    healthSub: "Based on the ratio of detected content gaps",
    topQueries: "Most frequent questions",
    noQueries: "No questions recorded for this period.",
    dailyUsage: "Daily usage",
    noActivity: "No activity recorded for this period.",
    quizDist: "Quiz score distribution",
    noAttempts: "No quiz attempts recorded yet.",
    avgOf: n => `average over ${n} attempt${n === 1 ? "" : "s"}`,
    gaps: "Content gaps",
    noData: "Not enough data for this period.",
    gapsRatioSub: (a, b) => `${a} of ${b} questions not answered well`,
    tooltipDate: item => `${item.date}: ${item.value}`,
    tooltipRange: item => `${item.range}: ${item.value}`
  };
  (0,react.useEffect)(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getAnalyticsDashboard(courseId, days).then(response => {
      if (!cancelled) {
        setData(response);
        setLoading(false);
      }
    }).catch(err => {
      if (!cancelled) {
        setError(getFriendlyErrorMessage(err, L.loadError, lang));
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [courseId, days]);
  const topQueries = data?.top_queries || [];
  const dailyCounts = data?.daily_message_counts || [];
  const quizDist = data?.quiz_score_distribution || {
    total_attempts: 0,
    average_score: 0,
    buckets: []
  };
  const gapsRatio = data?.gaps_ratio || {
    gaps_detected: 0,
    questions_answered: 0,
    ratio: 0
  };
  // ASIST-01 (#321): % of chat answers students marked as helpful —
  // a signal complementary to the gaps ratio (it covers answers that did
  // find relevant material but were bad anyway).
  const feedbackRatio = data?.feedback_ratio || {
    helpful_count: 0,
    total_rated: 0,
    useful_pct: 0
  };
  const topicsConsulted = data?.topics_consulted || 0;
  const maxDaily = Math.max(1, ...dailyCounts.map(d => d.message_count));
  const maxBucket = Math.max(1, ...quizDist.buckets.map(b => b.count));
  const totalGapsBase = gapsRatio.gaps_detected + gapsRatio.questions_answered;
  const ratioPct = Math.round((gapsRatio.ratio || 0) * 100);
  const ratioLevel = ratioPct >= 30 ? "high" : ratioPct >= 15 ? "mid" : "low";
  const healthPct = 100 - ratioPct;
  const isEmpty = !loading && !error && topQueries.length === 0 && dailyCounts.every(d => d.message_count === 0) && quizDist.total_attempts === 0 && totalGapsBase === 0 && feedbackRatio.total_rated === 0;
  return /*#__PURE__*/(0,jsx_runtime.jsxs)("div", {
    className: "nexusai-analytics",
    children: [/*#__PURE__*/(0,jsx_runtime.jsx)("p", {
      className: "nexusai-documents__intro",
      children: L.intro
    }), /*#__PURE__*/(0,jsx_runtime.jsxs)("div", {
      className: "nexusai-gaps__filter",
      children: [/*#__PURE__*/(0,jsx_runtime.jsx)("span", {
        className: "nexusai-gaps__filter-label",
        children: L.show
      }), [7, 30, 90, 365].map(d => /*#__PURE__*/(0,jsx_runtime.jsxs)("button", {
        type: "button",
        className: `nexusai-gaps__filter-btn ${days === d ? "nexusai-gaps__filter-btn--active" : ""}`,
        onClick: () => setDays(d),
        children: [d === 7 && L.last7, d === 30 && L.last30, d === 90 && L.last90, d === 365 && L.last365]
      }, d)), !loading && !error && !isEmpty && /*#__PURE__*/(0,jsx_runtime.jsxs)("button", {
        type: "button",
        className: "nexusai-btn",
        onClick: () => printAnalyticsAsPdf({
          courseName,
          days,
          topQueries,
          dailyCounts,
          maxDaily,
          quizDist,
          maxBucket,
          ratioPct,
          gapsRatio,
          feedbackRatio
        }, lang),
        children: [/*#__PURE__*/(0,jsx_runtime.jsx)(IconDownload, {
          size: 13
        }), " ", L.exportPdf]
      })]
    }), loading && /*#__PURE__*/(0,jsx_runtime.jsx)(AnalyticsSkeleton, {
      lang: lang
    }), error && /*#__PURE__*/(0,jsx_runtime.jsx)("div", {
      className: "nexusai-alert nexusai-alert--error",
      role: "alert",
      children: /*#__PURE__*/(0,jsx_runtime.jsx)("span", {
        children: error
      })
    }), isEmpty && /*#__PURE__*/(0,jsx_runtime.jsxs)("div", {
      className: "nexusai-gaps__empty",
      children: [/*#__PURE__*/(0,jsx_runtime.jsx)("div", {
        className: "nexusai-gaps__empty-icon",
        children: /*#__PURE__*/(0,jsx_runtime.jsx)(IconBarChart, {
          size: 20
        })
      }), /*#__PURE__*/(0,jsx_runtime.jsx)("p", {
        className: "nexusai-gaps__empty-title",
        children: L.emptyTitle
      }), /*#__PURE__*/(0,jsx_runtime.jsx)("p", {
        className: "nexusai-gaps__empty-sub",
        children: L.emptySub
      })]
    }), !loading && !error && !isEmpty && /*#__PURE__*/(0,jsx_runtime.jsxs)(jsx_runtime.Fragment, {
      children: [/*#__PURE__*/(0,jsx_runtime.jsxs)("div", {
        className: "nexusai-analytics__stats",
        children: [/*#__PURE__*/(0,jsx_runtime.jsxs)("div", {
          className: "nexusai-analytics__stat-card",
          children: [/*#__PURE__*/(0,jsx_runtime.jsx)(IconClipboardList, {
            size: 16
          }), /*#__PURE__*/(0,jsx_runtime.jsx)("span", {
            className: "nexusai-analytics__stat-value",
            children: quizDist.total_attempts
          }), /*#__PURE__*/(0,jsx_runtime.jsx)("span", {
            className: "nexusai-analytics__stat-label",
            children: L.practiceQuizzes
          })]
        }), /*#__PURE__*/(0,jsx_runtime.jsxs)("div", {
          className: "nexusai-analytics__stat-card",
          children: [/*#__PURE__*/(0,jsx_runtime.jsx)(IconTarget, {
            size: 16
          }), /*#__PURE__*/(0,jsx_runtime.jsx)("span", {
            className: "nexusai-analytics__stat-value",
            children: gapsRatio.gaps_detected
          }), /*#__PURE__*/(0,jsx_runtime.jsx)("span", {
            className: "nexusai-analytics__stat-label",
            children: L.contentGaps
          })]
        }), /*#__PURE__*/(0,jsx_runtime.jsxs)("div", {
          className: "nexusai-analytics__stat-card",
          children: [/*#__PURE__*/(0,jsx_runtime.jsx)(IconHelpCircle, {
            size: 16
          }), /*#__PURE__*/(0,jsx_runtime.jsx)("span", {
            className: "nexusai-analytics__stat-value",
            children: gapsRatio.questions_answered
          }), /*#__PURE__*/(0,jsx_runtime.jsx)("span", {
            className: "nexusai-analytics__stat-label",
            children: L.questionsAsked
          })]
        }), /*#__PURE__*/(0,jsx_runtime.jsxs)("div", {
          className: "nexusai-analytics__stat-card",
          children: [/*#__PURE__*/(0,jsx_runtime.jsx)(IconBarChart, {
            size: 16
          }), /*#__PURE__*/(0,jsx_runtime.jsx)("span", {
            className: "nexusai-analytics__stat-value",
            children: topicsConsulted
          }), /*#__PURE__*/(0,jsx_runtime.jsx)("span", {
            className: "nexusai-analytics__stat-label",
            children: L.topicsConsulted
          })]
        }), /*#__PURE__*/(0,jsx_runtime.jsxs)("div", {
          className: "nexusai-analytics__stat-card",
          children: [/*#__PURE__*/(0,jsx_runtime.jsx)(IconThumbsUp, {
            size: 16
          }), /*#__PURE__*/(0,jsx_runtime.jsx)("span", {
            className: "nexusai-analytics__stat-value",
            children: feedbackRatio.total_rated > 0 ? `${feedbackRatio.useful_pct}%` : "—"
          }), /*#__PURE__*/(0,jsx_runtime.jsxs)("span", {
            className: "nexusai-analytics__stat-label",
            children: [L.usefulAnswers, feedbackRatio.total_rated > 0 ? L.votes(feedbackRatio.total_rated) : ""]
          })]
        })]
      }), /*#__PURE__*/(0,jsx_runtime.jsxs)("div", {
        className: `nexusai-analytics__health nexusai-analytics__health--${ratioLevel}`,
        children: [/*#__PURE__*/(0,jsx_runtime.jsxs)("div", {
          className: "nexusai-analytics__health-head",
          children: [/*#__PURE__*/(0,jsx_runtime.jsx)("span", {
            className: "nexusai-analytics__health-title",
            children: L.contentHealth
          }), /*#__PURE__*/(0,jsx_runtime.jsxs)("span", {
            className: "nexusai-analytics__health-pct",
            children: [healthPct, "%"]
          })]
        }), /*#__PURE__*/(0,jsx_runtime.jsx)("div", {
          className: "nexusai-analytics__health-bar",
          children: /*#__PURE__*/(0,jsx_runtime.jsx)("div", {
            className: "nexusai-analytics__health-fill",
            style: {
              width: `${healthPct}%`
            }
          })
        }), /*#__PURE__*/(0,jsx_runtime.jsx)("span", {
          className: "nexusai-analytics__health-sub",
          children: L.healthSub
        })]
      }), /*#__PURE__*/(0,jsx_runtime.jsxs)("div", {
        className: "nexusai-analytics__grid",
        children: [/*#__PURE__*/(0,jsx_runtime.jsxs)("section", {
          className: "nexusai-analytics__section",
          children: [/*#__PURE__*/(0,jsx_runtime.jsx)("h3", {
            className: "nexusai-documents__heading",
            children: L.topQueries
          }), topQueries.length === 0 ? /*#__PURE__*/(0,jsx_runtime.jsx)("p", {
            className: "nexusai-analytics__section-empty",
            children: L.noQueries
          }) : /*#__PURE__*/(0,jsx_runtime.jsx)("ul", {
            className: "nexusai-analytics__query-list",
            children: topQueries.map((q, i) => /*#__PURE__*/(0,jsx_runtime.jsx)("li", {
              className: "nexusai-faq-topic",
              children: /*#__PURE__*/(0,jsx_runtime.jsxs)("div", {
                className: "nexusai-faq-topic__row",
                children: [/*#__PURE__*/(0,jsx_runtime.jsx)("span", {
                  className: "nexusai-faq-topic__label",
                  children: q.question
                }), /*#__PURE__*/(0,jsx_runtime.jsxs)("span", {
                  className: "nexusai-faq-topic__count",
                  children: ["\xD7", q.count]
                })]
              })
            }, i))
          })]
        }), /*#__PURE__*/(0,jsx_runtime.jsxs)("section", {
          className: "nexusai-analytics__section",
          children: [/*#__PURE__*/(0,jsx_runtime.jsx)("h3", {
            className: "nexusai-documents__heading",
            children: L.dailyUsage
          }), dailyCounts.length === 0 ? /*#__PURE__*/(0,jsx_runtime.jsx)("p", {
            className: "nexusai-analytics__section-empty",
            children: L.noActivity
          }) : /*#__PURE__*/(0,jsx_runtime.jsx)(BarChart, {
            variant: "daily",
            maxValue: maxDaily,
            items: dailyCounts.map(d => ({
              key: d.date,
              value: d.message_count,
              date: d.date
            })),
            formatTooltip: L.tooltipDate
          })]
        }), /*#__PURE__*/(0,jsx_runtime.jsxs)("section", {
          className: "nexusai-analytics__section",
          children: [/*#__PURE__*/(0,jsx_runtime.jsx)("h3", {
            className: "nexusai-documents__heading",
            children: L.quizDist
          }), quizDist.total_attempts === 0 ? /*#__PURE__*/(0,jsx_runtime.jsx)("p", {
            className: "nexusai-analytics__section-empty",
            children: L.noAttempts
          }) : /*#__PURE__*/(0,jsx_runtime.jsxs)(jsx_runtime.Fragment, {
            children: [/*#__PURE__*/(0,jsx_runtime.jsxs)("div", {
              className: "nexusai-analytics__score-summary",
              children: [/*#__PURE__*/(0,jsx_runtime.jsx)("span", {
                className: "nexusai-analytics__score-avg",
                children: quizDist.average_score.toFixed(1)
              }), /*#__PURE__*/(0,jsx_runtime.jsx)("span", {
                className: "nexusai-analytics__score-sub",
                children: L.avgOf(quizDist.total_attempts)
              })]
            }), /*#__PURE__*/(0,jsx_runtime.jsx)(BarChart, {
              variant: "buckets",
              maxValue: maxBucket,
              items: quizDist.buckets.map(b => ({
                key: b.range,
                value: b.count,
                range: b.range
              })),
              formatTooltip: L.tooltipRange,
              formatLabel: item => item.range
            })]
          })]
        }), /*#__PURE__*/(0,jsx_runtime.jsxs)("section", {
          className: "nexusai-analytics__section",
          children: [/*#__PURE__*/(0,jsx_runtime.jsx)("h3", {
            className: "nexusai-documents__heading",
            children: L.gaps
          }), totalGapsBase === 0 ? /*#__PURE__*/(0,jsx_runtime.jsx)("p", {
            className: "nexusai-analytics__section-empty",
            children: L.noData
          }) : /*#__PURE__*/(0,jsx_runtime.jsxs)("div", {
            className: `nexusai-analytics__gaps-ratio nexusai-analytics__gaps-ratio--${ratioLevel}`,
            children: [/*#__PURE__*/(0,jsx_runtime.jsxs)("span", {
              className: "nexusai-analytics__gaps-ratio-pct",
              children: [ratioPct, "%"]
            }), /*#__PURE__*/(0,jsx_runtime.jsx)("span", {
              className: "nexusai-analytics__gaps-ratio-sub",
              children: L.gapsRatioSub(gapsRatio.gaps_detected, totalGapsBase)
            })]
          })]
        })]
      })]
    })]
  });
}
;// ./src/api/quiz.js
/* unused harmony import specifier */ var quiz_randomFloat;
// This file is part of Moodle - https://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <https://www.gnu.org/licenses/>.



/**
 * Part of the NexusAI plugin (local_nexusai).
 *
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * API client of the quiz generator (Feature F / SP-03 / SP-05 / SP-10).
 * Calls local_nexusai_quiz_generate, local_nexusai_quiz_evaluate and the
 * error review functions (quiz_errors_*, quiz_review_suggestions)
 * through core/ajax.
 */

const MOCK_QUIZ = {
  course_id: 0,
  topic: null,
  questions: [{
    question_type: "multiple_choice",
    question: "¿Qué estructura de datos usa NexusAI para búsqueda semántica?",
    options: ["Árbol B+", "pgvector con HNSW", "Tabla hash", "Lista enlazada"],
    correct_index: 1,
    explanation: "NexusAI usa pgvector con índice HNSW para búsqueda por similaridad coseno.",
    source_filename: "architecture.md"
  }, {
    question_type: "true_false",
    question: "NexusAI usa gemini-embedding-001 como modelo de embeddings por defecto en el MVP.",
    options: ["Verdadero", "Falso"],
    correct_index: 0,
    explanation: "Correcto. El MVP usa gemini-embedding-001 con 768 dimensiones para representar el contenido del curso.",
    source_filename: "architecture.md"
  }, {
    question_type: "open",
    question: "¿Por qué NexusAI usa pgvector con índice HNSW en lugar de una búsqueda lineal?",
    options: [],
    correct_index: -1,
    explanation: "El índice HNSW (Hierarchical Navigable Small World) permite búsquedas aproximadas de vecinos más cercanos en tiempo sub-lineal (O(log n)), lo que es esencial para mantener tiempos de respuesta bajos con grandes volúmenes de embeddings. Una búsqueda lineal requeriría comparar cada vector del corpus, resultando en O(n) operaciones.",
    source_filename: "architecture.md"
  }, {
    question_type: "flashcard",
    question: "HNSW",
    options: [],
    correct_index: -1,
    explanation: "Hierarchical Navigable Small World — índice de pgvector para búsqueda aproximada de vecinos más cercanos en tiempo sub-lineal.",
    source_filename: "architecture.md"
  }]
};
async function quiz_getMoodleAjax() {
  if (typeof window === "undefined" || !window.M?.cfg) return null;
  try {
    const ajax = await new Promise((resolve, reject) => {
      // eslint-disable-next-line no-undef
      window.require(["core/ajax"], resolve, reject);
    });
    return ajax;
  } catch {
    return null;
  }
}

/**
 * Generates a practice quiz.
 *
 * @param {Object} params
 * @param {number} params.courseId
 * @param {string} [params.topic]           Optional topic (default: a mix).
 * @param {number} [params.numQuestions]    Number of questions (default 5).
 * @param {string} [params.questionType]    Type: multiple_choice | true_false | open | mix | flashcard
 * @param {string} [params.difficulty]      Difficulty: easy | medium | hard (default medium)
 * @returns {Promise<{course_id:number, topic:?string, questions:Array}>}
 */
async function generateQuiz({
  courseId,
  topic = "",
  numQuestions = 5,
  questionType = "multiple_choice",
  difficulty = "medium"
}) {
  const ajax = await quiz_getMoodleAjax();
  if (!ajax) {
    await new Promise(r => setTimeout(r, 800 + quiz_randomFloat() * 800));
    // Filter mock questions by requested type (or return mix)
    let mockQuestions = MOCK_QUIZ.questions;
    if (questionType !== "mix") {
      mockQuestions = MOCK_QUIZ.questions.filter(q => q.question_type === questionType);
      if (!mockQuestions.length) mockQuestions = MOCK_QUIZ.questions.slice(0, 1);
    }
    return {
      ...MOCK_QUIZ,
      course_id: courseId,
      topic: topic || null,
      questions: mockQuestions
    };
  }
  const args = {
    courseid: courseId,
    topic: topic || "",
    numquestions: numQuestions,
    questiontype: questionType,
    difficulty
  };
  const [responsePromise] = ajax.call([{
    methodname: "local_nexusai_quiz_generate",
    args
  }]);
  const response = await responsePromise;
  return response;
}

/**
 * Generates an EXAM question bank for the teacher (EVAL-01, issue #235).
 *
 * Unlike generateQuiz, the teacher explicitly picks which course files the
 * questions come from (documentIds), instead of a free topic or random
 * material from the whole course.
 *
 * @param {Object} params
 * @param {number} params.courseId
 * @param {string[]} params.documentIds     UUIDs of the chosen documents (at least 1).
 * @param {string} [params.topic]           Optional topic to focus the questions.
 * @param {number} [params.numQuestions]    Number of questions (default 10).
 * @param {string} [params.questionType]    Type: multiple_choice | true_false | open | mix
 * @param {string} [params.difficulty]      Difficulty: easy | medium | hard (default medium)
 * @param {Array<{label:string, source:string}>} [params.focusTopics]
 *   Topics with detected difficulty (Gaps/FAQ) to prioritize (DOC-D09, issue #390).
 * @returns {Promise<{course_id:number, topic:?string, questions:Array}>}
 */
async function generateExam({
  courseId,
  documentIds,
  topic = "",
  numQuestions = 10,
  questionType = "multiple_choice",
  difficulty = "medium",
  focusTopics = []
}) {
  const ajax = await quiz_getMoodleAjax();
  if (!ajax) {
    await new Promise(r => setTimeout(r, 800 + randomFloat() * 800));
    let mockQuestions = MOCK_QUIZ.questions.filter(q => q.question_type !== "flashcard");
    if (questionType !== "mix") {
      const filtered = mockQuestions.filter(q => q.question_type === questionType);
      mockQuestions = filtered.length ? filtered : mockQuestions.slice(0, 1);
    }
    if (focusTopics.length) {
      mockQuestions = mockQuestions.map((q, i) => ({
        ...q,
        source_topic: focusTopics[i % focusTopics.length]?.label || null
      }));
    }
    return {
      course_id: courseId,
      topic: topic || null,
      questions: mockQuestions
    };
  }
  const [responsePromise] = ajax.call([{
    methodname: "local_nexusai_exam_generate",
    args: {
      courseid: courseId,
      documentids: documentIds,
      topic: topic || "",
      numquestions: numQuestions,
      questiontype: questionType,
      difficulty,
      topics: focusTopics
    }
  }]);
  const response = await responsePromise;
  return response;
}

/**
 * Grades a student's free answer to an open question (SP-05).
 *
 * @param {Object} params
 * @param {number} params.courseId
 * @param {string} params.question      Question text.
 * @param {string} params.modelAnswer   Model answer (the quiz explanation).
 * @param {string} params.userAnswer    Answer written by the student.
 * @returns {Promise<{correct:boolean, score:number, feedback:string}>}
 */
async function evaluateOpenAnswer({
  courseId,
  question,
  modelAnswer,
  userAnswer
}) {
  const ajax = await quiz_getMoodleAjax();
  if (!ajax) {
    await new Promise(r => setTimeout(r, 600 + quiz_randomFloat() * 400));
    const isCorrect = userAnswer.trim().length > 15;
    return {
      correct: isCorrect,
      score: isCorrect ? 0.8 : 0.2,
      feedback: isCorrect ? "Buena respuesta. Mencionaste los conceptos clave. (Evaluación simulada — en el sistema real la IA compara con el material del curso.)" : "La respuesta es demasiado breve. Desarrollá más el concepto. (Evaluación simulada.)"
    };
  }
  const [responsePromise] = ajax.call([{
    methodname: "local_nexusai_quiz_evaluate",
    args: {
      courseid: courseId,
      question,
      modelanswer: modelAnswer,
      useranswer: userAnswer
    }
  }]);
  const response = await responsePromise;
  return response;
}

/**
 * Stores the questions the student got wrong in a quiz (SP-10).
 * Best effort: if it fails (network, Moodle unavailable), the caller must not
 * block the quiz flow because of it.
 *
 * @param {Object} params
 * @param {number} params.courseId
 * @param {Array}  params.errors  Errors in the shape QuizPanel builds.
 * @returns {Promise<{stored:number}>}
 */
async function recordQuizErrors({
  courseId,
  errors
}) {
  if (!errors?.length) return {
    stored: 0
  };
  const ajax = await quiz_getMoodleAjax();
  if (!ajax) return {
    stored: 0
  };
  const [responsePromise] = ajax.call([{
    methodname: "local_nexusai_quiz_errors_record",
    args: {
      courseid: courseId,
      errors: errors.map(e => ({
        question_type: e.question_type,
        question: e.question,
        explanation: e.explanation || "",
        source_filename: e.source_filename || null,
        source_document_id: e.source_document_id != null ? String(e.source_document_id) : null,
        options: e.options || [],
        correct_index: typeof e.correct_index === "number" ? e.correct_index : -1,
        user_selected_index: typeof e.user_selected_index === "number" ? e.user_selected_index : null,
        user_answer: e.user_answer ?? null,
        ai_feedback: e.ai_feedback ?? null,
        ai_score: typeof e.ai_score === "number" ? e.ai_score : null
      }))
    }
  }]);
  const response = await responsePromise;
  return response;
}

/**
 * Lists the student's quiz error history in the course (SP-10).
 *
 * @param {number} courseId
 * @param {number} [days=90]
 * @param {number} [limit=100]
 * @param {number} [offset=0]
 * @returns {Promise<{course_id:number, total:number, items:Array}>}
 */
async function listQuizErrors(courseId, days = 90, limit = 100, offset = 0) {
  const ajax = await quiz_getMoodleAjax();
  if (!ajax) return {
    course_id: courseId,
    total: 0,
    items: []
  };
  const [responsePromise] = ajax.call([{
    methodname: "local_nexusai_quiz_errors_list",
    args: {
      courseid: courseId,
      days,
      limit,
      offset
    }
  }]);
  const response = await responsePromise;
  return response;
}

/**
 * Deletes the student's quiz error history in the course (SP-10).
 *
 * @param {number} courseId
 * @returns {Promise<{deleted:number}>}
 */
async function clearQuizErrors(courseId) {
  const ajax = await quiz_getMoodleAjax();
  if (!ajax) return {
    deleted: 0
  };
  const [responsePromise] = ajax.call([{
    methodname: "local_nexusai_quiz_errors_clear",
    args: {
      courseid: courseId
    }
  }]);
  const response = await responsePromise;
  return response;
}

/**
 * Stores the result of a quiz the student completed (SP-09).
 * Best effort: the caller must not block the flow if it fails.
 *
 * @param {Object} params
 * @param {number} params.courseId
 * @param {string} params.questionType
 * @param {string} [params.difficulty]
 * @param {string|null} [params.topic]
 * @param {number} params.totalQuestions
 * @param {number} params.correctCount
 * @returns {Promise<{id:string, created_at:string}>}
 */
async function saveQuizAttempt({
  courseId,
  questionType,
  difficulty = "medium",
  topic = null,
  totalQuestions,
  correctCount
}) {
  const ajax = await quiz_getMoodleAjax();
  if (!ajax) return {
    id: "mock",
    created_at: new Date().toISOString()
  };
  const [responsePromise] = ajax.call([{
    methodname: "local_nexusai_quiz_attempt_save",
    args: {
      courseid: courseId,
      questiontype: questionType,
      difficulty,
      topic: topic || "",
      totalquestions: totalQuestions,
      correctcount: correctCount
    }
  }]);
  const response = await responsePromise;
  return response;
}

/**
 * Lists the quizzes the student completed in the course (SP-09).
 *
 * @param {number} courseId
 * @param {number} [days=90]
 * @param {number} [limit=20]
 * @returns {Promise<{course_id:number, total:number, items:Array}>}
 */
async function listQuizAttempts(courseId, days = 90, limit = 20) {
  const ajax = await quiz_getMoodleAjax();
  if (!ajax) {
    return {
      course_id: courseId,
      total: 2,
      items: [{
        id: "mock-1",
        question_type: "multiple_choice",
        difficulty: "medium",
        topic: null,
        total_questions: 5,
        correct_answers: 4,
        score: 0.8,
        created_at: new Date(Date.now() - 86400000).toISOString()
      }, {
        id: "mock-2",
        question_type: "flashcard",
        difficulty: "easy",
        topic: "Fotosíntesis",
        total_questions: 3,
        correct_answers: 2,
        score: 0.6667,
        created_at: new Date(Date.now() - 3600000).toISOString()
      }]
    };
  }
  const [responsePromise] = ajax.call([{
    methodname: "local_nexusai_quiz_attempt_list",
    args: {
      courseid: courseId,
      days,
      limit
    }
  }]);
  const response = await responsePromise;
  return response;
}

/**
 * Review suggestions based on the student's most frequent errors (SP-10).
 *
 * @param {number} courseId
 * @param {number} [days=90]
 * @returns {Promise<{course_id:number, total_errors:number, suggestions:Array}>}
 */
async function getReviewSuggestions(courseId, days = 90) {
  const ajax = await quiz_getMoodleAjax();
  if (!ajax) return {
    course_id: courseId,
    total_errors: 0,
    suggestions: []
  };
  const [responsePromise] = ajax.call([{
    methodname: "local_nexusai_quiz_review_suggestions",
    args: {
      courseid: courseId,
      days
    }
  }]);
  const response = await responsePromise;
  return response;
}

/**
 * Personalized study plan: combines quiz errors + chat gaps.
 *
 * @param {number} courseId
 * @param {number} [days=30]
 * @returns {Promise<{course_id:number, topics:Array}>}
 */
async function getStudyPlan(courseId, days = 30) {
  const ajax = await quiz_getMoodleAjax();
  if (!ajax) {
    return {
      course_id: courseId,
      topics: [{
        topic: "Derivadas de funciones trigonométricas",
        quiz_error_count: 3,
        gap_count: 1,
        reason: "Fallaste 3 preguntas de práctica y preguntaste esto una vez en el chat sin buena respuesta.",
        suggested_quiz_topic: "derivadas trigonométricas",
        quiz_error_ids: ["mock-qe-1", "mock-qe-2", "mock-qe-3"],
        gap_question_ids: ["mock-gq-1"]
      }]
    };
  }
  const [responsePromise] = ajax.call([{
    methodname: "local_nexusai_quiz_study_plan",
    args: {
      courseid: courseId,
      days
    }
  }]);
  const response = await responsePromise;
  return response;
}

/**
 * Dismisses one topic of the study plan (SP-13 / #323) — without deleting
 * the underlying quiz_errors/unanswered_questions history. Works on the real
 * row IDs (`StudyPlanTopic.quiz_error_ids`/`gap_question_ids`), not on the
 * topic text (the LLM generates it on every call, it is not a stable
 * key).
 *
 * @param {number} courseId
 * @param {string[]} quizErrorIds
 * @param {string[]} gapQuestionIds
 * @returns {Promise<{affected:number}>}
 */
async function dismissStudyPlanTopic(courseId, quizErrorIds = [], gapQuestionIds = []) {
  const ajax = await quiz_getMoodleAjax();
  if (!ajax) {
    await new Promise(r => setTimeout(r, 200));
    return {
      affected: quizErrorIds.length + gapQuestionIds.length
    };
  }
  const [responsePromise] = ajax.call([{
    methodname: "local_nexusai_quiz_study_plan_dismiss",
    args: {
      courseid: courseId,
      quizerrorids: quizErrorIds,
      gapquestionids: gapQuestionIds
    }
  }]);
  const response = await responsePromise;
  return response;
}

/**
 * Suggests a starting difficulty for the quiz generator, based on the
 * student's attempt history (SP-12 / #322). It is only a suggestion —
 * the student can always pick another difficulty by hand.
 *
 * @param {number} courseId
 * @param {string} [topic] Chosen topic; empty = general course history.
 * @returns {Promise<{difficulty:?string, reason:?string, based_on_attempts:number, accuracy_pct:?number}>}
 */
async function suggestDifficulty(courseId, topic = "") {
  const ajax = await quiz_getMoodleAjax();
  if (!ajax) {
    await new Promise(r => setTimeout(r, 150));
    return {
      difficulty: null,
      reason: null,
      based_on_attempts: 0,
      accuracy_pct: null
    };
  }
  const [responsePromise] = ajax.call([{
    methodname: "local_nexusai_quiz_suggest_difficulty",
    args: {
      courseid: courseId,
      topic
    }
  }]);
  const response = await responsePromise;
  return {
    difficulty: response.difficulty ?? null,
    reason: response.reason ?? null,
    based_on_attempts: response.basedonattempts ?? 0,
    accuracy_pct: response.accuracypct ?? null
  };
}

/**
 * Spaced repetition of flashcards (SM-2) — SP-11 / #315.
 *
 * How many already generated flashcards are "due today" vs. the total
 * generated so far in the course (stored by generateQuiz when questionType is
 * "flashcard").
 *
 * @param {number} courseId
 * @param {string} [topic]
 * @returns {Promise<{due_count:number, total_count:number}>}
 */
async function getFlashcardsSummary(courseId, topic = "") {
  const ajax = await quiz_getMoodleAjax();
  if (!ajax) {
    await new Promise(r => setTimeout(r, 150));
    return {
      due_count: 0,
      total_count: 0
    };
  }
  const [responsePromise] = ajax.call([{
    methodname: "local_nexusai_quiz_flashcards_summary",
    args: {
      courseid: courseId,
      topic
    }
  }]);
  const response = await responsePromise;
  return {
    due_count: response.duecount ?? 0,
    total_count: response.totalcount ?? 0
  };
}

/**
 * Already generated flashcards that are "due today" (most overdue first), from
 * the stored bank — without calling the LLM (SP-11 / #315).
 *
 * @param {number} courseId
 * @param {string} [topic]
 * @param {number} [limit=10]
 * @returns {Promise<{course_id:number, questions:Array}>}
 */
async function getDueFlashcards(courseId, topic = "", limit = 10) {
  const ajax = await quiz_getMoodleAjax();
  if (!ajax) return {
    course_id: courseId,
    questions: []
  };
  const [responsePromise] = ajax.call([{
    methodname: "local_nexusai_quiz_flashcards_due",
    args: {
      courseid: courseId,
      topic,
      limit
    }
  }]);
  const response = await responsePromise;
  return response;
}

/**
 * Applies spaced repetition (SM-2) to the self-assessment result of a
 * flashcard session. Called ONCE at the end of the session (SP-11 /
 * #315), not per card. Best effort: must not block the flow if it fails.
 *
 * @param {number} courseId
 * @param {Array<{flashcardId:string, knewIt:boolean}>} reviews
 * @returns {Promise<{updated:number}>}
 */
async function submitFlashcardReviews(courseId, reviews) {
  if (!reviews?.length) return {
    updated: 0
  };
  const ajax = await quiz_getMoodleAjax();
  if (!ajax) return {
    updated: 0
  };
  const [responsePromise] = ajax.call([{
    methodname: "local_nexusai_quiz_flashcards_review_batch",
    args: {
      courseid: courseId,
      reviews: reviews.map(r => ({
        flashcardid: r.flashcardId,
        knewit: r.knewIt
      }))
    }
  }]);
  const response = await responsePromise;
  return response;
}

/**
 * Streak of consecutive days of activity of the student in the course (quiz
 * attempts or chat questions) — SP-16 / #354.
 *
 * @param {number} courseId
 * @returns {Promise<{current_streak:number, practiced_today:boolean}>}
 */
async function getStudyStreak(courseId) {
  const ajax = await quiz_getMoodleAjax();
  if (!ajax) return {
    current_streak: 0,
    practiced_today: false
  };
  const [responsePromise] = ajax.call([{
    methodname: "local_nexusai_quiz_streak",
    args: {
      courseid: courseId
    }
  }]);
  const response = await responsePromise;
  return {
    current_streak: response.currentstreak ?? 0,
    practiced_today: response.practicedtoday ?? false
  };
}
;// ./src/documents/gift.js
// This file is part of Moodle - https://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <https://www.gnu.org/licenses/>.

/**
 * Part of the NexusAI plugin (local_nexusai).
 *
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * Converter to Moodle's GIFT format (EVAL-02, issue #235).
 *
 * GIFT is the plain-text format Moodle uses to import questions into a
 * course's question bank (Site administration → Question bank →
 * Import). The conversion and the download happen entirely in the browser —
 * there is no round-trip to the backend for this.
 *
 * Reference: https://docs.moodle.org/en/GIFT_format
 */

// Characters with a special meaning in GIFT that must be escaped inside
// question/answer text: ~ = # { } and the backslash itself.
function escapeGift(text) {
  return String(text ?? "").replace(/[\\~=#{}]/g, ch => `\\${ch}`);
}
const GIFT_TEXT = {
  es: {
    title: n => `Pregunta ${n}`,
    modelAnswer: "Respuesta modelo"
  },
  en: {
    title: n => `Question ${n}`,
    modelAnswer: "Model answer"
  }
};
function questionToGift(q, index, lang) {
  const T = GIFT_TEXT[lang] || GIFT_TEXT.es;
  const title = T.title(index + 1);
  const stem = escapeGift(q.question);
  if (q.question_type === "true_false") {
    const isTrue = q.correct_index === 0;
    const explanation = q.explanation ? `#${escapeGift(q.explanation)}` : "";
    return `::${title}::${stem} {${isTrue ? "TRUE" : "FALSE"}${explanation}}`;
  }
  if (q.question_type === "open") {
    // GIFT has no "open question graded by AI" — it is exported as an
    // essay (manual grading in Moodle). The model answer goes as a
    // teacher comment, not as part of the answer block.
    const modelAnswer = q.explanation ? `\n// ${T.modelAnswer}: ${q.explanation.replace(/\n/g, " ")}` : "";
    return `::${title}::${stem} {}${modelAnswer}`;
  }

  // multiple_choice (and any other type with options, in case "mix" brings something unexpected)
  const options = (q.options || []).map((opt, i) => {
    const marker = i === q.correct_index ? "=" : "~";
    return `${marker}${escapeGift(opt)}`;
  });
  return `::${title}::${stem} {\n${options.join("\n")}\n}`;
}

/**
 * Converts a list of questions (the backend's QuizQuestion shape) to a
 * complete GIFT string, ready to download as .txt.
 *
 * @param {Array} questions
 * @param {string} [lang] 'es' | 'en' — language of the generated titles/comments.
 * @returns {string}
 */
function toGiftFormat(questions, lang = "es") {
  return questions.map((q, i) => questionToGift(q, i, lang)).join("\n\n") + "\n";
}

/**
 * Fires the download of a GIFT .txt file in the browser (no request to the server).
 *
 * @param {Array} questions
 * @param {string} [filename]
 * @param {string} [lang] 'es' | 'en'
 */
function downloadGiftFile(questions, filename, lang = "es") {
  const name = filename || (lang === "es" ? "examen-nexusai.txt" : "exam-nexusai.txt");
  const content = toGiftFormat(questions, lang);
  const blob = new Blob([content], {
    type: "text/plain;charset=utf-8"
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
;// ./src/documents/ExamGeneratorPanel.jsx
// This file is part of Moodle - https://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <https://www.gnu.org/licenses/>.

/**
 * Part of the NexusAI plugin (local_nexusai).
 *
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * ExamGeneratorPanel — exam generator for the teacher (EVAL-02, issue #235 / DOC-D04).
 *
 * The teacher picks course files + question type + difficulty + count,
 * generates a question bank with the same engine as the student's practice
 * quiz (services/api/app/quiz/router.py::generate-exam), previews it with
 * inline editing, and exports it as a .txt in GIFT format to import into
 * Moodle's question bank.
 *
 * States: "setup" (pick files + config) → "loading" → "preview" (editable) → "error".
 */








// DOC-D09 (#390): maximum number of topics with detected difficulty offered
// (combined between Gaps and FAQ) — matches the cap the backend accepts
// (ExamGenerateRequest.focus_topics, max_length=15).

const MAX_FOCUS_TOPICS = 15;

/**
 * Fetches topics with detected difficulty from Gaps (unanswered questions,
 * DOC-D06) and grouped FAQ (analytics), combines them and sorts them by frequency.
 * Archived gaps are excluded by default in listGaps (DOC-D08).
 */
async function fetchFocusTopicCandidates(courseId) {
  const [gapsRes, faqRes] = await Promise.all([listGaps(courseId, 30, 30, false, 0).catch(() => ({
    items: []
  })), getFaqTopics(courseId, 30).catch(() => ({
    topics: []
  }))]);
  const fromGaps = (gapsRes?.items || []).map(g => ({
    label: g.question,
    source: "gap",
    count: g.count
  }));
  const fromFaq = (faqRes?.topics || []).map(t => ({
    label: t.topic,
    source: "faq",
    count: t.count
  }));
  const seen = new Set();
  const merged = [];
  for (const item of [...fromGaps, ...fromFaq]) {
    const key = item.label.trim().toLowerCase();
    if (!item.label.trim() || seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }
  merged.sort((a, b) => b.count - a.count);
  return merged.slice(0, MAX_FOCUS_TOPICS);
}
function questionTypes(lang) {
  return lang === "es" ? [{
    value: "multiple_choice",
    label: "Opción múltiple"
  }, {
    value: "true_false",
    label: "Verdadero / Falso"
  }, {
    value: "open",
    label: "Preguntas abiertas"
  }, {
    value: "mix",
    label: "Mixto"
  }] : [{
    value: "multiple_choice",
    label: "Multiple choice"
  }, {
    value: "true_false",
    label: "True / False"
  }, {
    value: "open",
    label: "Open questions"
  }, {
    value: "mix",
    label: "Mixed"
  }];
}
function difficulties(lang) {
  return lang === "es" ? [{
    value: "easy",
    label: "Fácil"
  }, {
    value: "medium",
    label: "Media"
  }, {
    value: "hard",
    label: "Difícil"
  }] : [{
    value: "easy",
    label: "Easy"
  }, {
    value: "medium",
    label: "Medium"
  }, {
    value: "hard",
    label: "Hard"
  }];
}
function ExamGeneratorPanel({
  courseId,
  lang = "es"
}) {
  const [stage, setStage] = (0,react.useState)("setup"); // setup | loading | preview | error
  const [wizardStep, setWizardStep] = (0,react.useState)("files"); // files | configure (only inside the "setup" stage)
  const [documents, setDocuments] = (0,react.useState)([]);
  const [docsLoading, setDocsLoading] = (0,react.useState)(true);
  const [selectedIds, setSelectedIds] = (0,react.useState)([]);
  const [topic, setTopic] = (0,react.useState)("");
  const [questionType, setQuestionType] = (0,react.useState)("multiple_choice");
  const [difficulty, setDifficulty] = (0,react.useState)("medium");
  const [numQuestions, setNumQuestions] = (0,react.useState)(10);
  const [questions, setQuestions] = (0,react.useState)([]);
  const [error, setError] = (0,react.useState)(null);

  // DOC-D09 (#390): "include topics with detected difficulty" (Gaps/FAQ).
  const [includeFocusTopics, setIncludeFocusTopics] = (0,react.useState)(false);
  const [focusTopics, setFocusTopics] = (0,react.useState)([]); // candidatos {label, source, count}
  const [focusTopicsLoading, setFocusTopicsLoading] = (0,react.useState)(false);
  const [focusTopicsLoaded, setFocusTopicsLoaded] = (0,react.useState)(false);
  const [selectedFocusTopics, setSelectedFocusTopics] = (0,react.useState)({}); // key(label+source) -> bool

  const L = lang === "es" ? {
    intro: "Elegí de qué archivos del curso querés generar preguntas de examen. El banco generado se puede editar acá mismo y exportar como .txt en formato GIFT para importarlo directamente al banco de preguntas de Moodle.",
    stepFiles: "Archivos",
    stepConfigure: "Configurar",
    chooseFiles: n => `Elegí los archivos (${n} seleccionados)`,
    loadingMaterial: "Cargando material del curso...",
    noMaterialTitle: "Todavía no hay material indexado en este curso.",
    noMaterialSub: "Subí archivos en la tab \"Material\" antes de generar un examen.",
    next: "Siguiente",
    configureTitle: "Configurá el examen",
    topicLabel: "Tema (opcional)",
    topicPlaceholder: "Ej: derivadas, unidad 3...",
    questionTypeLabel: "Tipo de pregunta",
    difficultyLabel: "Dificultad",
    numQuestionsLabel: "Cantidad de preguntas",
    includeFocus: "Incluir temas con dificultad detectada (Gaps y preguntas frecuentes)",
    searchingFocus: "Buscando temas con dificultad detectada...",
    noFocusTopics: "No hay suficientes preguntas de alumnos (Gaps o FAQ) todavía para sugerir temas.",
    back: "Atrás",
    generate: "Generar examen",
    loadingExam: "Generando preguntas de examen...",
    goBack: "Volver",
    bankGenerated: n => `Banco generado (${n} preguntas)`,
    backToConfigure: "Volver a configurar",
    exportGift: "Exportar como GIFT (Moodle)",
    removeQuestion: "Eliminar pregunta",
    explanationPlaceholder: "Explicación / respuesta modelo",
    source: name => `Fuente: ${name}`,
    sourceTopic: topic => `Tema con dificultad detectada: ${topic}`,
    genericError: "No se pudo generar el examen. Intentá de nuevo."
  } : {
    intro: "Choose which course files you want to generate exam questions from. You can edit the generated bank right here and export it as a .txt in GIFT format to import directly into Moodle's question bank.",
    stepFiles: "Files",
    stepConfigure: "Configure",
    chooseFiles: n => `Choose the files (${n} selected)`,
    loadingMaterial: "Loading course material...",
    noMaterialTitle: "There's no indexed material in this course yet.",
    noMaterialSub: "Upload files in the \"Material\" tab before generating an exam.",
    next: "Next",
    configureTitle: "Configure the exam",
    topicLabel: "Topic (optional)",
    topicPlaceholder: "E.g.: derivatives, unit 3...",
    questionTypeLabel: "Question type",
    difficultyLabel: "Difficulty",
    numQuestionsLabel: "Number of questions",
    includeFocus: "Include topics with detected difficulty (Gaps and frequently asked questions)",
    searchingFocus: "Looking for topics with detected difficulty...",
    noFocusTopics: "There aren't enough student questions (Gaps or FAQ) yet to suggest topics.",
    back: "Back",
    generate: "Generate exam",
    loadingExam: "Generating exam questions...",
    goBack: "Go back",
    bankGenerated: n => `Bank generated (${n} questions)`,
    backToConfigure: "Back to configuration",
    exportGift: "Export as GIFT (Moodle)",
    removeQuestion: "Remove question",
    explanationPlaceholder: "Explanation / model answer",
    source: name => `Source: ${name}`,
    sourceTopic: topic => `Topic with detected difficulty: ${topic}`,
    genericError: "Couldn't generate the exam. Try again."
  };
  (0,react.useEffect)(() => {
    let cancelled = false;
    listDocuments(courseId).then(data => {
      if (!cancelled) {
        // UX-17 (#387): without limit, listDocuments returns all the
        // course documents (up to the backend's internal cap)
        // — needed here to be able to pick any of them.
        setDocuments((data?.items || []).filter(d => d.status === "indexed"));
        setDocsLoading(false);
      }
    }).catch(() => {
      if (!cancelled) setDocsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [courseId]);
  const toggleDoc = id => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const focusTopicKey = t => `${t.source}:${t.label}`;
  const toggleIncludeFocusTopics = checked => {
    setIncludeFocusTopics(checked);
    if (checked && !focusTopicsLoaded) {
      setFocusTopicsLoading(true);
      // `void`: no rechaza nunca (cada pedido de fetchFocusTopicCandidates
      // tiene su propio catch y devuelve una lista vacía).
      void fetchFocusTopicCandidates(courseId).then(topics => {
        setFocusTopics(topics);
        // All preselected — the teacher can untick the ones they do not want.
        setSelectedFocusTopics(Object.fromEntries(topics.map(t => [focusTopicKey(t), true])));
      }).finally(() => {
        setFocusTopicsLoading(false);
        setFocusTopicsLoaded(true);
      });
    }
  };
  const toggleFocusTopic = t => {
    const key = focusTopicKey(t);
    setSelectedFocusTopics(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  const handleGenerate = async () => {
    if (!selectedIds.length) return;
    setStage("loading");
    setError(null);
    try {
      const chosenFocusTopics = includeFocusTopics ? focusTopics.filter(t => selectedFocusTopics[focusTopicKey(t)]).map(t => ({
        label: t.label,
        source: t.source
      })) : [];
      const result = await generateExam({
        courseId,
        documentIds: selectedIds,
        topic: topic.trim(),
        numQuestions,
        questionType,
        difficulty,
        focusTopics: chosenFocusTopics
      });
      setQuestions(result.questions || []);
      setStage("preview");
    } catch (err) {
      setError(getFriendlyErrorMessage(err, L.genericError, lang));
      setStage("error");
    }
  };
  const updateQuestion = (index, field, value) => {
    setQuestions(prev => prev.map((q, i) => i === index ? {
      ...q,
      [field]: value
    } : q));
  };
  const updateOption = (qIndex, optIndex, value) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qIndex) return q;
      const options = [...q.options];
      options[optIndex] = value;
      return {
        ...q,
        options
      };
    }));
  };
  const removeQuestion = index => {
    setQuestions(prev => prev.filter((_, i) => i !== index));
  };
  const handleExport = () => {
    const filename = lang === "es" ? `examen-nexusai-curso-${courseId}.txt` : `exam-nexusai-course-${courseId}.txt`;
    downloadGiftFile(questions, filename, lang);
  };
  const handleReset = () => {
    setStage("setup");
    setWizardStep("files");
    setQuestions([]);
    setError(null);
  };
  return /*#__PURE__*/(0,jsx_runtime.jsxs)("div", {
    className: "nexusai-exam",
    children: [/*#__PURE__*/(0,jsx_runtime.jsx)("p", {
      className: "nexusai-documents__intro",
      children: L.intro
    }), stage === "setup" && /*#__PURE__*/(0,jsx_runtime.jsxs)("div", {
      className: "nexusai-exam__setup nexusai-doc-card",
      children: [/*#__PURE__*/(0,jsx_runtime.jsxs)("div", {
        className: "nexusai-exam__steps",
        children: [/*#__PURE__*/(0,jsx_runtime.jsxs)("span", {
          className: `nexusai-exam__step ${wizardStep === "files" ? "nexusai-exam__step--active" : ""}`,
          children: [/*#__PURE__*/(0,jsx_runtime.jsx)("span", {
            className: "nexusai-exam__step-num",
            children: "1"
          }), L.stepFiles]
        }), /*#__PURE__*/(0,jsx_runtime.jsx)("span", {
          className: "nexusai-exam__step-arrow",
          children: "\u2192"
        }), /*#__PURE__*/(0,jsx_runtime.jsxs)("span", {
          className: `nexusai-exam__step ${wizardStep === "configure" ? "nexusai-exam__step--active" : ""}`,
          children: [/*#__PURE__*/(0,jsx_runtime.jsx)("span", {
            className: "nexusai-exam__step-num",
            children: "2"
          }), L.stepConfigure]
        })]
      }), wizardStep === "files" ? /*#__PURE__*/(0,jsx_runtime.jsxs)(jsx_runtime.Fragment, {
        children: [/*#__PURE__*/(0,jsx_runtime.jsx)("h3", {
          className: "nexusai-documents__heading",
          children: L.chooseFiles(selectedIds.length)
        }), docsLoading ? /*#__PURE__*/(0,jsx_runtime.jsx)("div", {
          className: "nexusai-loading",
          children: L.loadingMaterial
        }) : documents.length === 0 ? /*#__PURE__*/(0,jsx_runtime.jsxs)("div", {
          className: "nexusai-gaps__empty",
          children: [/*#__PURE__*/(0,jsx_runtime.jsx)("p", {
            className: "nexusai-gaps__empty-title",
            children: L.noMaterialTitle
          }), /*#__PURE__*/(0,jsx_runtime.jsx)("p", {
            className: "nexusai-gaps__empty-sub",
            children: L.noMaterialSub
          })]
        }) : /*#__PURE__*/(0,jsx_runtime.jsx)("ul", {
          className: "nexusai-exam__doclist",
          children: documents.map(doc => /*#__PURE__*/(0,jsx_runtime.jsx)("li", {
            className: "nexusai-exam__docitem",
            children: /*#__PURE__*/(0,jsx_runtime.jsxs)("label", {
              children: [/*#__PURE__*/(0,jsx_runtime.jsx)("input", {
                type: "checkbox",
                checked: selectedIds.includes(doc.id),
                onChange: () => toggleDoc(doc.id)
              }), /*#__PURE__*/(0,jsx_runtime.jsx)(IconFileText, {
                size: 14
              }), /*#__PURE__*/(0,jsx_runtime.jsx)("span", {
                children: doc.filename
              })]
            })
          }, doc.id))
        }), /*#__PURE__*/(0,jsx_runtime.jsx)("button", {
          type: "button",
          className: "nexusai-btn nexusai-btn--primary",
          disabled: !selectedIds.length,
          onClick: () => setWizardStep("configure"),
          children: L.next
        })]
      }) : /*#__PURE__*/(0,jsx_runtime.jsxs)(jsx_runtime.Fragment, {
        children: [/*#__PURE__*/(0,jsx_runtime.jsx)("h3", {
          className: "nexusai-documents__heading",
          children: L.configureTitle
        }), /*#__PURE__*/(0,jsx_runtime.jsxs)("div", {
          className: "nexusai-exam__form",
          children: [/*#__PURE__*/(0,jsx_runtime.jsxs)("label", {
            className: "nexusai-exam__field",
            children: [L.topicLabel, /*#__PURE__*/(0,jsx_runtime.jsx)("input", {
              type: "text",
              value: topic,
              onChange: e => setTopic(e.target.value),
              placeholder: L.topicPlaceholder,
              maxLength: 200
            })]
          }), /*#__PURE__*/(0,jsx_runtime.jsxs)("label", {
            className: "nexusai-exam__field",
            children: [L.questionTypeLabel, /*#__PURE__*/(0,jsx_runtime.jsx)("select", {
              value: questionType,
              onChange: e => setQuestionType(e.target.value),
              children: questionTypes(lang).map(t => /*#__PURE__*/(0,jsx_runtime.jsx)("option", {
                value: t.value,
                children: t.label
              }, t.value))
            })]
          }), /*#__PURE__*/(0,jsx_runtime.jsxs)("label", {
            className: "nexusai-exam__field",
            children: [L.difficultyLabel, /*#__PURE__*/(0,jsx_runtime.jsx)("select", {
              value: difficulty,
              onChange: e => setDifficulty(e.target.value),
              children: difficulties(lang).map(d => /*#__PURE__*/(0,jsx_runtime.jsx)("option", {
                value: d.value,
                children: d.label
              }, d.value))
            })]
          }), /*#__PURE__*/(0,jsx_runtime.jsxs)("label", {
            className: "nexusai-exam__field",
            children: [L.numQuestionsLabel, /*#__PURE__*/(0,jsx_runtime.jsx)("input", {
              type: "number",
              min: 1,
              max: 20,
              value: numQuestions,
              onChange: e => setNumQuestions(Math.max(1, Math.min(20, Number(e.target.value) || 1)))
            })]
          })]
        }), /*#__PURE__*/(0,jsx_runtime.jsxs)("div", {
          className: "nexusai-exam__focus",
          children: [/*#__PURE__*/(0,jsx_runtime.jsxs)("label", {
            className: "nexusai-exam__focus-toggle",
            children: [/*#__PURE__*/(0,jsx_runtime.jsx)("input", {
              type: "checkbox",
              checked: includeFocusTopics,
              onChange: e => toggleIncludeFocusTopics(e.target.checked)
            }), L.includeFocus]
          }), includeFocusTopics && focusTopicsLoading && /*#__PURE__*/(0,jsx_runtime.jsx)("div", {
            className: "nexusai-loading",
            children: L.searchingFocus
          }), includeFocusTopics && !focusTopicsLoading && focusTopicsLoaded && focusTopics.length === 0 && /*#__PURE__*/(0,jsx_runtime.jsx)("p", {
            className: "nexusai-exam__focus-empty",
            children: L.noFocusTopics
          }), includeFocusTopics && !focusTopicsLoading && focusTopics.length > 0 && /*#__PURE__*/(0,jsx_runtime.jsx)("ul", {
            className: "nexusai-exam__doclist nexusai-exam__focus-list",
            children: focusTopics.map(t => /*#__PURE__*/(0,jsx_runtime.jsx)("li", {
              className: "nexusai-exam__docitem",
              children: /*#__PURE__*/(0,jsx_runtime.jsxs)("label", {
                children: [/*#__PURE__*/(0,jsx_runtime.jsx)("input", {
                  type: "checkbox",
                  checked: !!selectedFocusTopics[focusTopicKey(t)],
                  onChange: () => toggleFocusTopic(t)
                }), /*#__PURE__*/(0,jsx_runtime.jsx)("span", {
                  className: `nexusai-exam__focus-badge nexusai-exam__focus-badge--${t.source}`,
                  children: t.source === "gap" ? "Gap" : "FAQ"
                }), /*#__PURE__*/(0,jsx_runtime.jsx)("span", {
                  children: t.label
                })]
              })
            }, focusTopicKey(t)))
          })]
        }), /*#__PURE__*/(0,jsx_runtime.jsxs)("div", {
          className: "nexusai-exam__wizard-actions",
          children: [/*#__PURE__*/(0,jsx_runtime.jsx)("button", {
            type: "button",
            className: "nexusai-btn",
            onClick: () => setWizardStep("files"),
            children: L.back
          }), /*#__PURE__*/(0,jsx_runtime.jsxs)("button", {
            type: "button",
            className: "nexusai-btn nexusai-btn--primary",
            disabled: !selectedIds.length,
            onClick: handleGenerate,
            children: [/*#__PURE__*/(0,jsx_runtime.jsx)(IconClipboardList, {
              size: 15
            }), L.generate]
          })]
        })]
      })]
    }), stage === "loading" && /*#__PURE__*/(0,jsx_runtime.jsx)("div", {
      className: "nexusai-loading",
      children: L.loadingExam
    }), stage === "error" && /*#__PURE__*/(0,jsx_runtime.jsxs)("div", {
      className: "nexusai-alert nexusai-alert--error",
      role: "alert",
      children: [/*#__PURE__*/(0,jsx_runtime.jsx)("span", {
        children: error
      }), /*#__PURE__*/(0,jsx_runtime.jsx)("button", {
        type: "button",
        className: "nexusai-btn",
        onClick: handleReset,
        children: L.goBack
      })]
    }), stage === "preview" && /*#__PURE__*/(0,jsx_runtime.jsxs)("div", {
      className: "nexusai-exam__preview",
      children: [/*#__PURE__*/(0,jsx_runtime.jsxs)("div", {
        className: "nexusai-exam__preview-header",
        children: [/*#__PURE__*/(0,jsx_runtime.jsx)("h3", {
          className: "nexusai-documents__heading",
          children: L.bankGenerated(questions.length)
        }), /*#__PURE__*/(0,jsx_runtime.jsxs)("div", {
          className: "nexusai-exam__preview-actions",
          children: [/*#__PURE__*/(0,jsx_runtime.jsx)("button", {
            type: "button",
            className: "nexusai-btn",
            onClick: handleReset,
            children: L.backToConfigure
          }), /*#__PURE__*/(0,jsx_runtime.jsxs)("button", {
            type: "button",
            className: "nexusai-btn nexusai-btn--primary",
            disabled: !questions.length,
            onClick: handleExport,
            children: [/*#__PURE__*/(0,jsx_runtime.jsx)(IconDownload, {
              size: 15
            }), L.exportGift]
          })]
        })]
      }), questions.map((q, i) => /*#__PURE__*/(0,jsx_runtime.jsxs)("div", {
        className: "nexusai-exam__question",
        children: [/*#__PURE__*/(0,jsx_runtime.jsxs)("div", {
          className: "nexusai-exam__question-head",
          children: [/*#__PURE__*/(0,jsx_runtime.jsxs)("span", {
            className: "nexusai-exam__question-number",
            children: ["#", i + 1, " \xB7 ", q.question_type]
          }), /*#__PURE__*/(0,jsx_runtime.jsx)("button", {
            type: "button",
            className: "nexusai-exam__remove",
            onClick: () => removeQuestion(i),
            "aria-label": L.removeQuestion,
            children: "\xD7"
          })]
        }), /*#__PURE__*/(0,jsx_runtime.jsx)("textarea", {
          className: "nexusai-exam__question-text",
          value: q.question,
          onChange: e => updateQuestion(i, "question", e.target.value),
          rows: 2
        }), q.question_type !== "open" && q.options?.length > 0 && /*#__PURE__*/(0,jsx_runtime.jsx)("div", {
          className: "nexusai-exam__options",
          children: q.options.map((opt, oi) => /*#__PURE__*/(0,jsx_runtime.jsxs)("label", {
            className: "nexusai-exam__option",
            children: [/*#__PURE__*/(0,jsx_runtime.jsx)("input", {
              type: "radio",
              checked: q.correct_index === oi,
              onChange: () => updateQuestion(i, "correct_index", oi)
            }), /*#__PURE__*/(0,jsx_runtime.jsx)("input", {
              type: "text",
              value: opt,
              onChange: e => updateOption(i, oi, e.target.value)
            })]
          }, oi))
        }), /*#__PURE__*/(0,jsx_runtime.jsx)("textarea", {
          className: "nexusai-exam__explanation",
          value: q.explanation,
          onChange: e => updateQuestion(i, "explanation", e.target.value),
          rows: 2,
          placeholder: L.explanationPlaceholder
        }), q.source_filename && /*#__PURE__*/(0,jsx_runtime.jsx)("div", {
          className: "nexusai-exam__source",
          children: L.source(q.source_filename)
        }), q.source_topic && /*#__PURE__*/(0,jsx_runtime.jsx)("div", {
          className: "nexusai-exam__source nexusai-exam__source--topic",
          children: L.sourceTopic(q.source_topic)
        })]
      }, i))]
    })]
  });
}
;// ./src/documents/HelpPanel.jsx

// This file is part of Moodle - https://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <https://www.gnu.org/licenses/>.

/**
 * Part of the NexusAI plugin (local_nexusai).
 *
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * HelpPanel — "Help" tab of NexusAI Materials (ONB-07 / #430).
 *
 * Explains what each of the 5 tools of the teacher panel is and what it is
 * for. Copy taken from `AYUDA_DOCENTE_ONBOARDING.md` section 5
 * (ONB-08 / #431) — direct translation to English, the source doc is only
 * in Spanish.
 *
 * 100% static content, no API calls.
 */

const T = {
  es: {
    intro: "Guía rápida de las herramientas de NexusAI en este curso.",
    cards: [{
      title: "Material",
      body: "Acá subís y gestionás los archivos que alimentan al asistente. Cada archivo pasa por un proceso de indexado (lo ves como “procesando” → “indexado”). Una vez indexado, el asistente puede citarlo en sus respuestas. Podés reemplazar un archivo manteniendo su historial."
    }, {
      title: "Preguntas de alumnos (Gaps + FAQ)",
      body: "Gaps detectados: temas sobre los que tus alumnos preguntan mucho y el material no cubre bien — te señala dónde reforzar. FAQ: las preguntas más frecuentes agrupadas por tema, para que veas qué les cuesta sin leer cada conversación."
    }, {
      title: "Analytics",
      body: "Uso del asistente en tu curso: cuántas consultas, en qué unidades se concentran, evolución en el tiempo. Sirve para ver qué temas generan más dudas."
    }, {
      title: "Generar examen",
      body: "Crea un borrador de examen (múltiple choice, V/F, desarrollo) a partir del material indexado. Exportable en formato GIFT para importar a Moodle. Siempre revisá y editá las preguntas antes de usarlas."
    }, {
      title: "Buscar",
      body: "Búsqueda semántica sobre todo el material del curso: encontrás dónde se explica un concepto aunque no sepas el nombre exacto del archivo."
    }]
  },
  en: {
    intro: "Quick guide to the NexusAI tools in this course.",
    cards: [{
      title: "Material",
      body: "This is where you upload and manage the files that feed the assistant. Each file goes through an indexing process (you'll see “processing” → “indexed”). Once indexed, the assistant can cite it in its answers. You can replace a file while keeping its history."
    }, {
      title: "Student questions (Gaps + FAQ)",
      body: "Detected gaps: topics your students ask about a lot that the material doesn't cover well — flags where to reinforce. FAQ: the most frequent questions grouped by topic, so you can see what's tripping students up without reading every conversation."
    }, {
      title: "Analytics",
      body: "Assistant usage in your course: how many queries, which units they concentrate on, evolution over time. Useful for seeing which topics generate the most doubts."
    }, {
      title: "Generate exam",
      body: "Creates a draft exam (multiple choice, true/false, open-ended) from the indexed material. Exportable as GIFT to import into Moodle. Always review and edit the questions before using them."
    }, {
      title: "Search",
      body: "Semantic search across all the course material: find where a concept is explained even if you don't know the exact file name."
    }]
  }
};
function HelpPanel({
  lang = "es"
}) {
  const t = T[lang] || T.es;
  return /*#__PURE__*/(0,jsx_runtime.jsxs)(jsx_runtime.Fragment, {
    children: [/*#__PURE__*/(0,jsx_runtime.jsx)("p", {
      className: "nexusai-documents__intro",
      children: t.intro
    }), /*#__PURE__*/(0,jsx_runtime.jsx)("div", {
      className: "nexusai-doc-card nexusai-help",
      children: t.cards.map(({
        title,
        body
      }) => /*#__PURE__*/(0,jsx_runtime.jsxs)("div", {
        className: "nexusai-help__card",
        children: [/*#__PURE__*/(0,jsx_runtime.jsx)("h3", {
          className: "nexusai-documents__heading nexusai-help__card-title",
          children: title
        }), /*#__PURE__*/(0,jsx_runtime.jsx)("p", {
          className: "nexusai-help__card-body",
          children: body
        })]
      }, title))
    })]
  });
}
;// ./src/api/search.js
// This file is part of Moodle - https://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <https://www.gnu.org/licenses/>.



/**
 * Part of the NexusAI plugin (local_nexusai).
 *
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * API client of the semantic search (Feature A).
 * Calls `local_nexusai_search_query` through core/ajax. Outside Moodle
 * it falls back to a mock so the UI can be seen in standalone dev.
 */

const MOCK_RESULTS = [{
  document_id: "mock-uuid-1",
  document_filename: "apunte-estructuras.pdf",
  course_id: 0,
  course_name: "",
  chunk_index: 3,
  content: "Los árboles binarios de búsqueda (BST) son estructuras de datos donde cada nodo tiene como máximo dos hijos...",
  similarity: 0.87,
  mime_type: "application/pdf",
  section: 1
}, {
  document_id: "mock-uuid-2",
  document_filename: "tp2-enunciado.pdf",
  course_id: 0,
  course_name: "",
  chunk_index: 1,
  content: "El trabajo práctico consiste en implementar una tabla hash con resolución de colisiones por encadenamiento...",
  similarity: 0.74,
  mime_type: "application/pdf",
  section: 2
}, {
  document_id: "mock-uuid-3",
  document_filename: "diapositivas-unidad2.pptx",
  course_id: 0,
  course_name: "",
  chunk_index: 0,
  content: "Complejidad temporal: notación Big-O para el análisis de algoritmos de búsqueda y ordenamiento...",
  similarity: 0.68,
  mime_type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  section: null
}];
async function search_getMoodleAjax() {
  if (typeof window === "undefined" || !window.M?.cfg) return null;
  try {
    const ajax = await new Promise((resolve, reject) => {
      // eslint-disable-next-line no-undef
      window.require(["core/ajax"], resolve, reject);
    });
    return ajax;
  } catch {
    return null;
  }
}

/**
 * Searches fragments of the course material.
 *
 * @param {Object}  params
 * @param {string}  params.query        Search query.
 * @param {number}  params.courseId     Moodle course ID.
 * @param {number}  [params.topK]       Number of results (default 5).
 * @param {boolean} [params.global]     true to search all the user's courses.
 * @param {string}  [params.materialType] Filter by the document's mime type (BUS-02).
 * @param {number}  [params.section]    Filter by course section (BUS-05).
 * @param {boolean} [params.sectionUnassigned] Filter only material with no section assigned (BUS-05).
 * @returns {Promise<{query:string, total:number, results:Array}>}
 */
async function searchMaterial({
  query,
  courseId,
  topK = 5,
  global: isGlobal = false,
  materialType = "",
  section = null,
  sectionUnassigned = false
}) {
  if (!query?.trim()) {
    throw new Error("The search cannot be empty");
  }
  const ajax = await search_getMoodleAjax();
  if (!ajax) {
    await new Promise(r => setTimeout(r, 600 + randomFloat() * 400));
    let filtered = materialType ? MOCK_RESULTS.filter(r => r.mime_type === materialType) : MOCK_RESULTS;
    if (sectionUnassigned) {
      filtered = filtered.filter(r => r.section === null || r.section === undefined);
    } else if (section !== null && section !== undefined) {
      filtered = filtered.filter(r => r.section === section);
    }
    return {
      query,
      total: filtered.length,
      results: filtered
    };
  }
  const [responsePromise] = ajax.call([{
    methodname: "local_nexusai_search_query",
    args: {
      query: query.trim(),
      courseid: courseId,
      topk: topK,
      global: isGlobal,
      materialtype: materialType,
      section: section === null || section === undefined ? -1 : section,
      sectionunassigned: sectionUnassigned
    }
  }]);
  const response = await responsePromise;
  return response;
}
;// ./src/api/summary.js
/* unused harmony import specifier */ var summary_randomFloat;
// This file is part of Moodle - https://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <https://www.gnu.org/licenses/>.



/**
 * Part of the NexusAI plugin (local_nexusai).
 *
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * API client for the automatic document summary (BUS-03) and for the
 * multi-document pre-exam review summary (BUS-04).
 * Calls local_nexusai_document_summarize / local_nexusai_document_pre_exam_summary
 * through core/ajax.
 */

const _MOCK_SUMMARY = `Este documento aborda los conceptos fundamentales del tema, organizados en secciones temáticas que van desde los fundamentos teóricos hasta la aplicación práctica. Se presentan definiciones clave, ejemplos ilustrativos y ejercicios de aplicación. El material está orientado a estudiantes de nivel universitario y sirve como referencia para las actividades prácticas del curso.`;
const _MOCK_PRE_EXAM_SUMMARY = (/* unused pure expression or super */ null && (`Para este examen, los temas principales a repasar son los fundamentos teóricos, sus aplicaciones prácticas y los ejercicios de referencia (apuntes.pdf). Se recomienda prestar especial atención a las definiciones clave y a los ejemplos resueltos, ya que suelen ser la base de las consignas de evaluación.`));
async function summary_getMoodleAjax() {
  if (typeof window === "undefined" || !window.M?.cfg) return null;
  try {
    return await new Promise((resolve, reject) => window.require(["core/ajax"], resolve, reject));
  } catch {
    return null;
  }
}

/**
 * Generates a summary of the document using the backend's LLM.
 *
 * @param {Object} params
 * @param {string} params.documentId  UUID of the document to summarize.
 * @param {number} params.courseId    Moodle course ID.
 * @returns {Promise<{document_id, document_filename, summary, chunks_used, total_chunks}>}
 */
async function summarizeDocument({
  documentId,
  courseId
}) {
  if (!documentId) throw new Error("document_id es requerido");
  const ajax = await summary_getMoodleAjax();
  if (!ajax) {
    await new Promise(r => setTimeout(r, 1200 + randomFloat() * 600));
    return {
      document_id: documentId,
      document_filename: "documento.pdf",
      summary: _MOCK_SUMMARY,
      chunks_used: 12,
      total_chunks: 15
    };
  }
  const [responsePromise] = ajax.call([{
    methodname: "local_nexusai_document_summarize",
    args: {
      documentid: documentId,
      courseid: courseId
    }
  }]);
  const response = await responsePromise;
  return response;
}

/**
 * Generates a review summary combining all the indexed material relevant
 * for an upcoming exam, optionally limited to one section of the
 * course (BUS-04).
 *
 * @param {number} courseId Moodle course ID.
 * @param {number|null} [section] Optional section (BUS-05).
 * @returns {Promise<{summary:string, documents_used:Array, total_documents:number}>}
 */
async function getPreExamSummary(courseId, section = null) {
  const ajax = await summary_getMoodleAjax();
  if (!ajax) {
    await new Promise(r => setTimeout(r, 1200 + summary_randomFloat() * 600));
    return {
      summary: _MOCK_PRE_EXAM_SUMMARY,
      documents_used: [{
        document_id: "mock-1",
        filename: "apuntes.pdf"
      }],
      total_documents: 1
    };
  }
  const [responsePromise] = ajax.call([{
    methodname: "local_nexusai_document_pre_exam_summary",
    args: {
      courseid: courseId,
      section
    }
  }]);
  const response = await responsePromise;
  return response;
}
;// ./src/components/SearchPanel.jsx
// This file is part of Moodle - https://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <https://www.gnu.org/licenses/>.

/**
 * Part of the NexusAI plugin (local_nexusai).
 *
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * SearchPanel — hybrid search in the course material (Feature A / BUS-02).
 *
 * When isTeacher=true (documents page) the global mode toggle does not show:
 * the teacher always searches their own course.
 * When isTeacher=false (future use from the student view) the toggle switches
 * between "this course" and "all my courses".
 *
 * Material type filter (BUS-02): mime type captured when uploading the
 * file, threaded through to the backend.
 * Section filter (BUS-05): Moodle section assigned (optional) when
 * uploading the file. Hidden in global search mode — section numbers make
 * no sense across courses.
 */







// BUS-06 (#361): the student's latest searches, stored in localStorage
// (no backend needed) — the first localStorage consumer in this plugin.
// Key scoped by course + try/catch on every access, same approach as
// TAB_STORAGE_KEY/sessionStorage in ChatApp.jsx (storage blocked in
// private mode must not break the rest of the panel).

const MAX_RECENT_SEARCHES = 8;
function recentSearchesKey(courseId) {
  return `nexusai_recent_searches_${courseId}`;
}
function loadRecentSearches(courseId) {
  try {
    const raw = localStorage.getItem(recentSearchesKey(courseId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
function saveRecentSearch(courseId, query) {
  const trimmed = query.trim();
  if (!trimmed) return loadRecentSearches(courseId);
  try {
    const existing = loadRecentSearches(courseId).filter(q => q.toLowerCase() !== trimmed.toLowerCase());
    const next = [trimmed, ...existing].slice(0, MAX_RECENT_SEARCHES);
    localStorage.setItem(recentSearchesKey(courseId), JSON.stringify(next));
    return next;
  } catch {
    return loadRecentSearches(courseId);
  }
}
const MATERIAL_TYPE_LABELS = {
  "application/pdf": {
    es: "PDF",
    en: "PDF"
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
    es: "Word",
    en: "Word"
  },
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": {
    es: "PowerPoint",
    en: "PowerPoint"
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
    es: "Excel",
    en: "Excel"
  },
  "text/plain": {
    es: "Texto",
    en: "Text"
  },
  "text/csv": {
    es: "CSV",
    en: "CSV"
  },
  "text/markdown": {
    es: "Markdown",
    en: "Markdown"
  },
  "text/html": {
    es: "HTML",
    en: "HTML"
  }
};
const MATERIAL_TYPE_FILTERS = Object.keys(MATERIAL_TYPE_LABELS);
function FileIcon({
  filename
}) {
  const ext = (filename || "").split(".").pop().toLowerCase();
  if (ext === "txt") return /*#__PURE__*/(0,jsx_runtime.jsx)(IconFileText, {
    size: 14
  });
  return /*#__PURE__*/(0,jsx_runtime.jsx)(IconFile, {
    size: 14
  });
}
function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Highlights the terms of `query` inside `text` by wrapping them in <mark>.
 * Purely client-side (React nodes, not dangerouslySetInnerHTML) — no risk
 * of injecting raw HTML coming from the document content. */
function highlightContent(text, query) {
  const terms = (query || "").split(/\s+/).map(t => t.trim()).filter(t => t.length > 1);
  if (!text || !terms.length) return text;
  const pattern = new RegExp(`(${terms.map(escapeRegExp).join("|")})`, "gi");
  return text.split(pattern).map((part, i) => terms.some(t => t.toLowerCase() === part.toLowerCase()) ? /*#__PURE__*/(0,jsx_runtime.jsx)("mark", {
    children: part
  }, i) : part);
}
function SearchPanel({
  courseId,
  sesskey,
  isTeacher = false,
  lang = "es",
  scopeOverride,
  onGoToChat
}) {
  const [query, setQuery] = (0,react.useState)("");
  const [results, setResults] = (0,react.useState)(null);
  const [lastQuery, setLastQuery] = (0,react.useState)("");
  const [loading, setLoading] = (0,react.useState)(false);
  const [error, setError] = (0,react.useState)(null);
  const [globalMode, setGlobalMode] = (0,react.useState)(false);
  const [materialType, setMaterialType] = (0,react.useState)("");
  const [summaries, setSummaries] = (0,react.useState)({});
  const [section, setSection] = (0,react.useState)(""); // "" = all | "-1" = unassigned | number = real section
  const [sections, setSections] = (0,react.useState)([]);
  // BUS-06 (#361): history of recent searches (localStorage, per course).
  const [recentSearches, setRecentSearches] = (0,react.useState)(() => loadRecentSearches(courseId));
  const [inputFocused, setInputFocused] = (0,react.useState)(false);
  const effectiveGlobal = scopeOverride !== undefined ? scopeOverride : globalMode;
  (0,react.useEffect)(() => {
    let cancelled = false;
    listCourseSections(courseId).then(list => {
      if (!cancelled) setSections(list || []);
    }).catch(() => {
      if (!cancelled) setSections([]);
    });
    return () => {
      cancelled = true;
    };
  }, [courseId]);
  (0,react.useEffect)(() => {
    setRecentSearches(loadRecentSearches(courseId));
  }, [courseId]);
  const L = lang === "es" ? {
    placeholder: "Buscá en el material del curso...",
    button: "Buscar",
    scopeCourse: "Este curso",
    scopeGlobal: "Todos mis cursos",
    typeAll: "Todos",
    sectionAll: "Todas las unidades",
    sectionUnassigned: "Sin unidad asignada",
    noResults: q => `No se encontraron resultados para "${q}".`,
    noResultsHint: "Probá con otras palabras, o preguntale directamente al asistente en el Chat.",
    noResultsCta: "Preguntarle al asistente",
    idleHint: "Buscá un concepto, una definición o un tema y te muestro en qué archivo del curso aparece.",
    error: "No se pudo realizar la búsqueda. Intentá de nuevo.",
    openFile: "Abrir ↗",
    summarize: "Resumir",
    hideSummary: "Ocultar resumen",
    summaryLabel: "Resumen generado por IA",
    summaryError: "No se pudo generar el resumen. Intentá de nuevo.",
    recentLabel: "Búsquedas recientes"
  } : {
    placeholder: "Search in course material...",
    button: "Search",
    scopeCourse: "This course",
    scopeGlobal: "All my courses",
    typeAll: "All",
    sectionAll: "All sections",
    sectionUnassigned: "Unassigned",
    noResults: q => `No results found for "${q}".`,
    noResultsHint: "Try other words, or ask the assistant directly in Chat.",
    noResultsCta: "Ask the assistant",
    idleHint: "Search for a concept, a definition or a topic and I'll show you which course file it appears in.",
    error: "Search failed. Please try again.",
    openFile: "Open ↗",
    summarize: "Summarize",
    hideSummary: "Hide summary",
    summaryLabel: "AI-generated summary",
    summaryError: "Could not generate summary. Try again.",
    recentLabel: "Recent searches"
  };
  const performSearch = async q => {
    setLoading(true);
    setError(null);
    setLastQuery(q);
    setInputFocused(false);
    try {
      const data = await searchMaterial({
        query: q,
        courseId,
        global: effectiveGlobal,
        materialType,
        section: section === "" || section === "-1" ? null : Number(section),
        sectionUnassigned: section === "-1"
      });
      setResults(data);
      setRecentSearches(saveRecentSearch(courseId, q));
    } catch {
      setError(L.error);
    } finally {
      setLoading(false);
      document.activeElement?.blur();
    }
  };
  const handleSearch = async e => {
    e.preventDefault();
    if (!query.trim()) return;
    await performSearch(query.trim());
  };
  const selectRecentSearch = q => {
    setQuery(q);
    void performSearch(q); // maneja sus errores adentro
  };
  const switchScope = toGlobal => {
    setGlobalMode(toGlobal);
    setResults(null);
    setError(null);
  };
  const changeMaterialType = mime => {
    setMaterialType(mime);
    setResults(null);
    setError(null);
  };
  const handleSummarize = async documentId => {
    const current = summaries[documentId];
    if (current?.text) {
      setSummaries(prev => ({
        ...prev,
        [documentId]: {
          ...prev[documentId],
          visible: !prev[documentId].visible
        }
      }));
      return;
    }
    setSummaries(prev => ({
      ...prev,
      [documentId]: {
        loading: true,
        text: null,
        error: null,
        visible: true
      }
    }));
    try {
      const data = await summarizeDocument({
        documentId,
        courseId
      });
      setSummaries(prev => ({
        ...prev,
        [documentId]: {
          loading: false,
          text: data.summary,
          error: null,
          visible: true
        }
      }));
    } catch {
      setSummaries(prev => ({
        ...prev,
        [documentId]: {
          loading: false,
          text: null,
          error: L.summaryError,
          visible: true
        }
      }));
    }
  };
  const changeSection = value => {
    setSection(value);
    setResults(null);
    setError(null);
  };

  // VIS-05: the document opens through its Moodle activity, which applies
  // its own permissions (visibility, restrictions, role).
  const openDownload = (documentId, resultCourseId) => {
    if (!documentId || !sesskey) return;
    const params = new URLSearchParams({
      courseid: String(resultCourseId || courseId || ""),
      document_id: String(documentId),
      sesskey
    });
    window.open(`/local/nexusai/document_download.php?${params}`, "_blank", "noopener,noreferrer");
  };
  return /*#__PURE__*/(0,jsx_runtime.jsxs)("div", {
    className: "nexusai-search",
    children: [/*#__PURE__*/(0,jsx_runtime.jsxs)("form", {
      onSubmit: handleSearch,
      className: "nexusai-search__form",
      children: [/*#__PURE__*/(0,jsx_runtime.jsx)("input", {
        type: "text",
        className: "nexusai-search__input",
        placeholder: L.placeholder,
        value: query,
        onChange: e => setQuery(e.target.value),
        onFocus: () => setInputFocused(true),
        onBlur: () => setInputFocused(false),
        maxLength: 500
      }), /*#__PURE__*/(0,jsx_runtime.jsx)("button", {
        type: "submit",
        className: "nexusai-search__btn",
        disabled: loading || !query.trim(),
        children: loading ? "..." : L.button
      })]
    }), inputFocused && !query.trim() && recentSearches.length > 0 && /*#__PURE__*/(0,jsx_runtime.jsxs)("div", {
      className: "nexusai-search__recent",
      children: [/*#__PURE__*/(0,jsx_runtime.jsxs)("span", {
        className: "nexusai-search__recent-label",
        children: [/*#__PURE__*/(0,jsx_runtime.jsx)(IconClock, {
          size: 12
        }), " ", L.recentLabel]
      }), /*#__PURE__*/(0,jsx_runtime.jsx)("div", {
        className: "nexusai-search__recent-list",
        children: recentSearches.map(q => /*#__PURE__*/(0,jsx_runtime.jsx)("button", {
          type: "button",
          className: "nexusai-search__recent-item",
          onMouseDown: e => e.preventDefault(),
          onClick: () => selectRecentSearch(q),
          children: q
        }, q))
      })]
    }), !isTeacher && scopeOverride === undefined && /*#__PURE__*/(0,jsx_runtime.jsxs)("div", {
      className: "nexusai-search__scope",
      children: [/*#__PURE__*/(0,jsx_runtime.jsxs)("button", {
        type: "button",
        className: `nexusai-search__scope-btn${!globalMode ? " nexusai-search__scope-btn--active" : ""}`,
        onClick: () => switchScope(false),
        children: [/*#__PURE__*/(0,jsx_runtime.jsx)(IconBookOpen, {
          size: 12
        }), L.scopeCourse]
      }), /*#__PURE__*/(0,jsx_runtime.jsxs)("button", {
        type: "button",
        className: `nexusai-search__scope-btn${globalMode ? " nexusai-search__scope-btn--active" : ""}`,
        onClick: () => switchScope(true),
        children: [/*#__PURE__*/(0,jsx_runtime.jsx)(IconGlobe, {
          size: 12
        }), L.scopeGlobal]
      })]
    }), /*#__PURE__*/(0,jsx_runtime.jsxs)("div", {
      className: "nexusai-search__typebtns",
      children: [/*#__PURE__*/(0,jsx_runtime.jsx)("button", {
        type: "button",
        className: `nexusai-search__typebtn ${materialType === "" ? "nexusai-search__typebtn--active" : ""}`,
        onClick: () => changeMaterialType(""),
        children: L.typeAll
      }), MATERIAL_TYPE_FILTERS.map(mime => /*#__PURE__*/(0,jsx_runtime.jsx)("button", {
        type: "button",
        className: `nexusai-search__typebtn ${materialType === mime ? "nexusai-search__typebtn--active" : ""}`,
        onClick: () => changeMaterialType(mime),
        children: MATERIAL_TYPE_LABELS[mime][lang === "es" ? "es" : "en"]
      }, mime))]
    }), !effectiveGlobal && sections.length > 0 && /*#__PURE__*/(0,jsx_runtime.jsxs)("select", {
      className: "nexusai-search__sectionselect",
      value: section,
      onChange: e => changeSection(e.target.value),
      "aria-label": L.sectionAll,
      children: [/*#__PURE__*/(0,jsx_runtime.jsx)("option", {
        value: "",
        children: L.sectionAll
      }), /*#__PURE__*/(0,jsx_runtime.jsx)("option", {
        value: "-1",
        children: L.sectionUnassigned
      }), sections.map(s => /*#__PURE__*/(0,jsx_runtime.jsx)("option", {
        value: s.section,
        children: s.name
      }, s.section))]
    }), error && /*#__PURE__*/(0,jsx_runtime.jsx)("div", {
      className: "nexusai-error",
      role: "alert",
      children: /*#__PURE__*/(0,jsx_runtime.jsx)("p", {
        className: "nexusai-error__text",
        children: error
      })
    }), !loading && !error && !results && /*#__PURE__*/(0,jsx_runtime.jsx)("p", {
      className: "nexusai-search__empty",
      children: L.idleHint
    }), results && results.total === 0 && /*#__PURE__*/(0,jsx_runtime.jsxs)("div", {
      className: "nexusai-search__empty-state",
      children: [/*#__PURE__*/(0,jsx_runtime.jsx)("div", {
        className: "nexusai-search__empty-icon",
        children: /*#__PURE__*/(0,jsx_runtime.jsx)(IconSearch, {
          size: 20
        })
      }), /*#__PURE__*/(0,jsx_runtime.jsx)("p", {
        className: "nexusai-search__empty-title",
        children: L.noResults(lastQuery)
      }), /*#__PURE__*/(0,jsx_runtime.jsx)("p", {
        className: "nexusai-search__empty-sub",
        children: L.noResultsHint
      }), onGoToChat && /*#__PURE__*/(0,jsx_runtime.jsx)("button", {
        type: "button",
        className: "nexusai-search__empty-cta",
        onClick: () => onGoToChat(),
        children: L.noResultsCta
      })]
    }), results && results.results.map((r, i) => {
      const canDownload = !!r.document_id && !!sesskey;
      return /*#__PURE__*/(0,jsx_runtime.jsxs)("div", {
        className: "nexusai-search__result",
        children: [/*#__PURE__*/(0,jsx_runtime.jsxs)("div", {
          className: "nexusai-search__result-header",
          children: [/*#__PURE__*/(0,jsx_runtime.jsxs)("span", {
            className: "nexusai-search__filename",
            children: [/*#__PURE__*/(0,jsx_runtime.jsx)(FileIcon, {
              filename: r.document_filename
            }), r.document_filename]
          }), /*#__PURE__*/(0,jsx_runtime.jsxs)("div", {
            className: "nexusai-search__result-actions",
            children: [r.mime_type && MATERIAL_TYPE_LABELS[r.mime_type] && /*#__PURE__*/(0,jsx_runtime.jsx)("span", {
              className: "nexusai-search__type-badge",
              children: MATERIAL_TYPE_LABELS[r.mime_type][lang === "es" ? "es" : "en"]
            }), canDownload && /*#__PURE__*/(0,jsx_runtime.jsx)("button", {
              type: "button",
              className: "nexusai-search__open-btn",
              onClick: () => openDownload(r.document_id, r.course_id),
              children: L.openFile
            }), r.document_id && /*#__PURE__*/(0,jsx_runtime.jsx)("button", {
              type: "button",
              className: "nexusai-search__summarize-btn",
              onClick: () => handleSummarize(r.document_id),
              disabled: summaries[r.document_id]?.loading,
              children: summaries[r.document_id]?.loading ? "..." : summaries[r.document_id]?.text && summaries[r.document_id]?.visible ? L.hideSummary : L.summarize
            })]
          })]
        }), effectiveGlobal && r.course_name && /*#__PURE__*/(0,jsx_runtime.jsx)("p", {
          className: "nexusai-search__course",
          children: r.course_name
        }), /*#__PURE__*/(0,jsx_runtime.jsx)("p", {
          className: "nexusai-search__content",
          children: highlightContent(r.content, lastQuery)
        }), r.document_id && summaries[r.document_id]?.visible && /*#__PURE__*/(0,jsx_runtime.jsxs)("div", {
          className: "nexusai-search__summary",
          children: [/*#__PURE__*/(0,jsx_runtime.jsx)("p", {
            className: "nexusai-search__summary-label",
            children: L.summaryLabel
          }), summaries[r.document_id].loading && /*#__PURE__*/(0,jsx_runtime.jsx)("p", {
            className: "nexusai-search__summary-text nexusai-search__summary-text--loading",
            children: "..."
          }), summaries[r.document_id].error && /*#__PURE__*/(0,jsx_runtime.jsx)("p", {
            className: "nexusai-search__summary-text nexusai-search__summary-text--error",
            children: summaries[r.document_id].error
          }), summaries[r.document_id].text && /*#__PURE__*/(0,jsx_runtime.jsx)("p", {
            className: "nexusai-search__summary-text",
            children: summaries[r.document_id].text
          })]
        })]
      }, `${r.document_filename}-${r.chunk_index}-${i}`);
    })]
  });
}
;// ./src/components/Tooltip.jsx
// This file is part of Moodle - https://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <https://www.gnu.org/licenses/>.

/**
 * Part of the NexusAI plugin (local_nexusai).
 *
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */



const SHOW_DELAY_MS = 400;

// Wraps a single child (usually a button with no visible text) and adds a
// custom on-hover/on-focus tooltip. The child's native `title=` is NOT
// touched — it is still the safety net for mobile (long-press) and for any
// edge case of this implementation (UX-05).
function Tooltip({
  label,
  placement = "bottom",
  children
}) {
  const [visible, setVisible] = (0,react.useState)(false);
  const timerRef = (0,react.useRef)(null);
  const show = () => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
  };
  const hide = () => {
    clearTimeout(timerRef.current);
    setVisible(false);
  };
  if (!label) return children;
  return /*#__PURE__*/(0,jsx_runtime.jsxs)("span", {
    className: "nexusai-tooltip-wrap",
    onMouseEnter: show,
    onMouseLeave: hide,
    onFocus: show,
    onBlur: hide,
    children: [children, visible && /*#__PURE__*/(0,jsx_runtime.jsx)("span", {
      className: `nexusai-tooltip-bubble nexusai-tooltip-bubble--${placement}`,
      role: "tooltip",
      children: label
    })]
  });
}
;// ./src/documents/DocumentsManager.jsx
// This file is part of Moodle - https://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <https://www.gnu.org/licenses/>.

/**
 * Part of the NexusAI plugin (local_nexusai).
 *
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * Root component of the teacher view.
 *
 * Responsibilities:
 *  - Global state of the document list (initial load + updates).
 *  - Automatic polling: while there are pending/indexing docs, refreshes the whole
 *    list every POLL_INTERVAL_MS using listDocuments (which includes updated_at).
 *  - Upload: adds the new doc to the list only if the backend confirms success
 *    and the id is not there yet (avoids overwriting an existing doc with a null date).
 *  - Upload errors (incl. 409 and duplicates): shows ErrorModal, does not touch the list.
 *  - Tabs Material / Student questions (Gaps + FAQ, RDS-08) / Analytics
 *    (ANALYTICS-01/02) / Generate exam / Search.
 */

















// UX-12 (#370): loading skeleton of the Material tab — intro paragraph,
// upload area and rows of the indexed documents table.

function MaterialSkeleton({
  lang = "es"
}) {
  return /*#__PURE__*/(0,jsx_runtime.jsxs)(SkeletonScreen, {
    label: lang === "es" ? "Cargando documentos..." : "Loading documents...",
    children: [/*#__PURE__*/(0,jsx_runtime.jsx)(Skeleton, {
      className: "nexusai-skeleton-doc__intro",
      height: 32
    }), /*#__PURE__*/(0,jsx_runtime.jsx)(Skeleton, {
      className: "nexusai-skeleton-doc__zone"
    }), /*#__PURE__*/(0,jsx_runtime.jsx)(Skeleton, {
      width: "45%",
      height: 15,
      style: {
        marginBottom: 12
      }
    }), /*#__PURE__*/(0,jsx_runtime.jsx)("div", {
      className: "nexusai-skeleton-doc__rows",
      children: Array.from({
        length: 5
      }, (_, i) => /*#__PURE__*/(0,jsx_runtime.jsxs)("div", {
        className: "nexusai-skeleton-doc__row",
        children: [/*#__PURE__*/(0,jsx_runtime.jsx)(Skeleton, {
          width: 16,
          height: 16,
          radius: 4
        }), /*#__PURE__*/(0,jsx_runtime.jsx)(Skeleton, {
          width: `${55 + i * 13 % 35}%`,
          height: 12
        }), /*#__PURE__*/(0,jsx_runtime.jsx)(Skeleton, {
          height: 10
        }), /*#__PURE__*/(0,jsx_runtime.jsx)(Skeleton, {
          height: 10
        }), /*#__PURE__*/(0,jsx_runtime.jsx)(Skeleton, {
          width: 16,
          height: 16,
          radius: 4
        })]
      }, i))
    })]
  });
}
const DocumentsManager_STABLE_STATUSES = new Set(["indexed", "error"]);
const POLL_INTERVAL_MS = 3000;
// UX-17 (#387): number of documents requested per page, both on the
// initial load and on each "Load more".
const DocumentsManager_PAGE_SIZE = 30;

// RDS-05 (#404): data-driven side nav — replaces the 6 hardcoded tabs
// from before. ONB-07 (#430) adds "help".
function navItems(lang) {
  return lang === "es" ? [{
    key: "material",
    label: "Material",
    Icon: IconBookOpen
  }, {
    key: "questions",
    label: "Preguntas de alumnos",
    Icon: IconHelpCircle
  }, {
    key: "analytics",
    label: "Analytics",
    Icon: IconBarChart
  }, {
    key: "exam",
    label: "Generar examen",
    Icon: IconClipboardList
  }, {
    key: "search",
    label: "Buscar",
    Icon: IconSearch
  }, {
    key: "help",
    label: "Ayuda",
    Icon: IconInfo
  }] : [{
    key: "material",
    label: "Material",
    Icon: IconBookOpen
  }, {
    key: "questions",
    label: "Student questions",
    Icon: IconHelpCircle
  }, {
    key: "analytics",
    label: "Analytics",
    Icon: IconBarChart
  }, {
    key: "exam",
    label: "Generate exam",
    Icon: IconClipboardList
  }, {
    key: "search",
    label: "Search",
    Icon: IconSearch
  }, {
    key: "help",
    label: "Help",
    Icon: IconInfo
  }];
}
const NAV_KEYS = new Set(navItems("es").map(item => item.key));

// UX-05 (#345): short description per tab for the side nav tooltip.
function navTooltips(lang) {
  return lang === "es" ? {
    material: "Subir y gestionar el material indexado del curso",
    questions: "Preguntas frecuentes y sin responder detectadas en el chat",
    analytics: "Estadísticas de uso e interacciones de los alumnos",
    exam: "Generar un examen exportable a partir del material",
    search: "Buscar dentro del material indexado",
    help: "Qué hace cada herramienta de NexusAI"
  } : {
    material: "Upload and manage the course's indexed material",
    questions: "Frequent and unanswered questions detected in the chat",
    analytics: "Usage stats and student interactions",
    exam: "Generate an exportable exam from the material",
    search: "Search within the indexed material",
    help: "What each NexusAI tool does"
  };
}
function DocumentsManagerInner({
  courseid,
  userid,
  sesskey,
  lang = "es",
  courseFullname,
  initialTab
}) {
  const [documents, setDocuments] = (0,react.useState)([]);
  const [total, setTotal] = (0,react.useState)(0);
  const [loading, setLoading] = (0,react.useState)(true);
  const [loadingMore, setLoadingMore] = (0,react.useState)(false);
  const [uploading, setUploading] = (0,react.useState)(false);
  const [error, setError] = (0,react.useState)(null);
  // ONB-07 (#430): documents.php can ask for an initial tab via ?tab=
  // (e.g. the "Help" link of the review checklist) — "material" if it does
  // not come or is not a valid key.
  const [activeTab, setActiveTab] = (0,react.useState)(NAV_KEYS.has(initialTab) ? initialTab : "material"); // "material" | "questions" | "analytics" | "exam" | "search" | "help"
  const [sections, setSections] = (0,react.useState)([]); // BUS-05: course sections for the upload selector
  const [selectedSection, setSelectedSection] = (0,react.useState)("");
  const [visibleToStudents, setVisibleToStudents] = (0,react.useState)(true); // VIS-03: the activity's eye icon
  // CONT-06 (#320): queue of files being uploaded in sequence — one item per
  // file, { key, filename, status: "queued"|"uploading"|"error", error }.
  // "uploading"/"queued" go away on their own when they finish well; "error" stays
  // visible (with a button to dismiss it) because one that fails does not cancel
  // the others.
  const [uploadQueue, setUploadQueue] = (0,react.useState)([]);
  const {
    showWarning
  } = useToast();
  const L = lang === "es" ? {
    loadDocsError: "No se pudieron cargar los documentos.",
    loadMoreError: "No se pudieron cargar más documentos.",
    uploadError: "No se pudo subir el archivo.",
    alreadyIndexed: name => `"${name}" ya se encuentra indexado en este curso.`,
    course: "Curso",
    assistantActive: "Asistente activo",
    intro: "Los archivos que subís acá quedan disponibles para el asistente NexusAI cuando los alumnos de este curso le hacen preguntas. Se aceptan PDF, DOCX, PPTX, XLSX, CSV, MD, HTML y TXT. La indexación tarda aproximadamente 30-60 segundos por archivo.",
    sectionLabel: "Unidad del aula",
    chooseSection: "Elegí una unidad",
    visibleLabel: "Visible para alumnos",
    visibleHint: "Cada archivo se crea como una actividad \"Archivo\" en esa unidad. Si lo dejás oculto, los alumnos no lo ven en el aula ni el asistente lo usa para responderles.",
    uploading: "Subiendo...",
    queued: "En cola...",
    dismissUploadError: name => `Descartar error de ${name}`,
    indexedMaterial: n => `Material indexado (${n})`,
    loading: "Cargando...",
    loadMore: (a, b) => `Cargar más (${a} de ${b})`
  } : {
    loadDocsError: "Couldn't load the documents.",
    loadMoreError: "Couldn't load more documents.",
    uploadError: "Couldn't upload the file.",
    alreadyIndexed: name => `"${name}" is already indexed in this course.`,
    course: "Course",
    assistantActive: "Assistant active",
    intro: "Files you upload here become available to the NexusAI assistant when this course's students ask it questions. PDF, DOCX, PPTX, XLSX, CSV, MD, HTML and TXT are accepted. Indexing takes about 30-60 seconds per file.",
    sectionLabel: "Course unit",
    chooseSection: "Choose a unit",
    visibleLabel: "Visible to students",
    visibleHint: "Each file is created as a \"File\" activity in that unit. If you leave it hidden, students do not see it in the classroom and the assistant does not use it to answer them.",
    uploading: "Uploading...",
    queued: "Queued...",
    dismissUploadError: name => `Dismiss error for ${name}`,
    indexedMaterial: n => `Indexed material (${n})`,
    loading: "Loading...",
    loadMore: (a, b) => `Load more (${a} of ${b})`
  };

  // Ref to read the current state from the setInterval closure without
  // adding it as a dependency of the effect (avoids recreating the interval).
  const documentsRef = (0,react.useRef)([]);
  documentsRef.current = documents;

  // ── Carga inicial ──────────────────────────────────────────────────────
  (0,react.useEffect)(() => {
    let cancelled = false;
    // `void`: la función maneja sus errores adentro (try/catch).
    void (async () => {
      try {
        const data = await listDocuments(courseid, DocumentsManager_PAGE_SIZE, 0);
        if (!cancelled) {
          setDocuments(data?.items || []);
          setTotal(data?.total || 0);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(getFriendlyErrorMessage(err, L.loadDocsError, lang));
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [courseid]);

  // ── Course sections (BUS-05) ────────────────────────────────────────────
  (0,react.useEffect)(() => {
    let cancelled = false;
    listCourseSections(courseid).then(list => {
      if (!cancelled) setSections(list || []);
    }).catch(() => {
      if (!cancelled) setSections([]);
    });
    return () => {
      cancelled = true;
    };
  }, [courseid]);

  // ── Automatic polling ──────────────────────────────────────────────────
  // Fixed setInterval: every POLL_INTERVAL_MS it calls listDocuments if any
  // doc is in an unstable state. It does not depend on `documents` in the dep
  // array, so the interval is not recreated on every update — it uses documentsRef
  // to read the fresh state without creating a dependency.
  //
  // UX-17 (#387): asks for `limit = documentsRef.current.length` instead of
  // paging from zero — so the automatic refresh respects how much the
  // teacher already loaded with "Load more" instead of sending them back to page 1.
  (0,react.useEffect)(() => {
    const intervalId = setInterval(async () => {
      if (!documentsRef.current.some(d => !DocumentsManager_STABLE_STATUSES.has(d.status))) {
        return; // nothing pending, skip this tick
      }
      try {
        const loadedCount = Math.max(documentsRef.current.length, DocumentsManager_PAGE_SIZE);
        const fresh = await listDocuments(courseid, loadedCount, 0);
        setDocuments(fresh?.items || []);
        setTotal(fresh?.total || 0);
      } catch (pollErr) {
        // Log but do not stop polling — it is retried on the next tick.
        // eslint-disable-next-line no-console
        console.warn("[NexusAI/documents] polling failed:", pollErr);
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [courseid]); // only recreated if the course changes

  const hasMore = documents.length < total;

  // UX-17 (#387): setDocuments wrapper for DocumentsTable — today only
  // deletion uses it, which shrinks the list. Keeps `total` in sync with
  // the real number of documents of the course (otherwise it would get
  // stale and "Load more" would offer a page that no longer exists).
  const handleDocumentsChange = updater => {
    setDocuments(prev => {
      const next = updater(prev);
      setTotal(t => t - (prev.length - next.length));
      return next;
    });
  };
  const handleLoadMore = async () => {
    setLoadingMore(true);
    try {
      const data = await listDocuments(courseid, DocumentsManager_PAGE_SIZE, documents.length);
      setDocuments(prev => [...prev, ...(data?.items || [])]);
      setTotal(data?.total ?? total);
    } catch (err) {
      setError(getFriendlyErrorMessage(err, L.loadMoreError, lang));
    } finally {
      setLoadingMore(false);
    }
  };

  // ── Upload ─────────────────────────────────────────────────────────────
  // CONT-06 (#320): receives an array of files and uploads them IN SEQUENCE
  // (not in parallel — simpler and avoids race conditions with the name
  // collision detection and with documentsRef, which assume one upload at
  // a time). If one fails, it goes on with the next one.
  const handleUpload = async files => {
    const items = files.map((file, idx) => ({
      key: `${Date.now()}-${idx}-${file.name}`,
      file,
      filename: file.name,
      status: "queued",
      error: null
    }));
    setUploadQueue(prev => [...prev, ...items]);
    setUploading(true);

    // Without a list of sections (it did not load) it uploads to General (0).
    const section = selectedSection === "" ? 0 : Number(selectedSection);
    for (const item of items) {
      setUploadQueue(prev => prev.map(q => q.key === item.key ? {
        ...q,
        status: "uploading"
      } : q));
      try {
        const newDoc = await uploadDocument(courseid, item.file, section, visibleToStudents);
        // The backend returns 200 with the existing doc when the content
        // is identical (CONT-04). If the id is already in the list, the doc
        // is indexed — do not overwrite it with the response, which may carry a null date.
        if (documentsRef.current.some(d => d.id === newDoc.id)) {
          showWarning(L.alreadyIndexed(item.filename));
        } else {
          setDocuments(prev => [newDoc, ...prev]);
          setTotal(prev => prev + 1);
        }
        setUploadQueue(prev => prev.filter(q => q.key !== item.key));
      } catch (err) {
        const raw = err?.message || String(err);
        if (/HTTP\s+409\b/.test(raw)) {
          showWarning(L.alreadyIndexed(item.filename));
          setUploadQueue(prev => prev.filter(q => q.key !== item.key));
        } else {
          const msg = getFriendlyErrorMessage(err, L.uploadError, lang);
          setUploadQueue(prev => prev.map(q => q.key === item.key ? {
            ...q,
            status: "error",
            error: msg
          } : q));
        }
      }
    }
    setUploading(false);
  };
  const handleDismissUploadError = key => {
    setUploadQueue(prev => prev.filter(q => q.key !== key));
  };

  // ── Render ─────────────────────────────────────────────────────────────

  const NAV_ITEMS = navItems(lang);
  const NAV_TOOLTIPS = navTooltips(lang);
  return /*#__PURE__*/(0,jsx_runtime.jsxs)(jsx_runtime.Fragment, {
    children: [/*#__PURE__*/(0,jsx_runtime.jsxs)("aside", {
      className: "nexusai-doc-sidebar",
      children: [/*#__PURE__*/(0,jsx_runtime.jsxs)("div", {
        className: "nexusai-doc-sidebar__course",
        children: [/*#__PURE__*/(0,jsx_runtime.jsx)("span", {
          className: "nexusai-doc-sidebar__course-label",
          children: L.course
        }), /*#__PURE__*/(0,jsx_runtime.jsx)("span", {
          className: "nexusai-doc-sidebar__course-name",
          children: courseFullname
        })]
      }), /*#__PURE__*/(0,jsx_runtime.jsx)("nav", {
        className: "nexusai-doc-nav",
        children: NAV_ITEMS.map(({
          key,
          label,
          Icon
        }) => /*#__PURE__*/(0,jsx_runtime.jsx)(Tooltip, {
          label: NAV_TOOLTIPS[key],
          placement: "top",
          children: /*#__PURE__*/(0,jsx_runtime.jsxs)("button", {
            type: "button",
            className: `nexusai-doc-nav__item ${activeTab === key ? "nexusai-doc-nav__item--active" : ""}`,
            onClick: () => setActiveTab(key),
            children: [/*#__PURE__*/(0,jsx_runtime.jsx)(Icon, {
              size: 15
            }), /*#__PURE__*/(0,jsx_runtime.jsx)("span", {
              children: label
            }), key === "material" && /*#__PURE__*/(0,jsx_runtime.jsx)("span", {
              className: "nexusai-doc-nav__badge",
              children: total
            })]
          })
        }, key))
      }), /*#__PURE__*/(0,jsx_runtime.jsxs)("div", {
        className: "nexusai-doc-sidebar__status",
        children: [/*#__PURE__*/(0,jsx_runtime.jsx)(IconCheck, {
          size: 12
        }), L.assistantActive]
      })]
    }), /*#__PURE__*/(0,jsx_runtime.jsx)("div", {
      className: "nexusai-doc-content",
      children: activeTab === "search" ? /*#__PURE__*/(0,jsx_runtime.jsx)(SearchPanel, {
        courseId: courseid,
        sesskey: sesskey,
        isTeacher: true,
        lang: lang
      }) : activeTab === "analytics" ? /*#__PURE__*/(0,jsx_runtime.jsx)(AnalyticsDashboardPanel, {
        courseId: courseid,
        courseName: courseFullname,
        lang: lang
      }) : activeTab === "exam" ? /*#__PURE__*/(0,jsx_runtime.jsx)(ExamGeneratorPanel, {
        courseId: courseid,
        lang: lang
      }) : activeTab === "help" ? /*#__PURE__*/(0,jsx_runtime.jsx)(HelpPanel, {
        lang: lang
      }) : activeTab === "material" ? loading ? /*#__PURE__*/(0,jsx_runtime.jsx)(MaterialSkeleton, {
        lang: lang
      }) : /*#__PURE__*/(0,jsx_runtime.jsxs)(jsx_runtime.Fragment, {
        children: [/*#__PURE__*/(0,jsx_runtime.jsx)("p", {
          className: "nexusai-documents__intro",
          children: L.intro
        }), /*#__PURE__*/(0,jsx_runtime.jsxs)("div", {
          className: "nexusai-doc-card",
          children: [sections.length > 0 && /*#__PURE__*/(0,jsx_runtime.jsxs)("div", {
            className: "nexusai-documents__section-picker",
            children: [/*#__PURE__*/(0,jsx_runtime.jsx)("label", {
              htmlFor: "nexusai-upload-section",
              children: L.sectionLabel
            }), /*#__PURE__*/(0,jsx_runtime.jsxs)("select", {
              id: "nexusai-upload-section",
              className: "nexusai-documents__section-select",
              value: selectedSection,
              onChange: e => setSelectedSection(e.target.value),
              disabled: uploading,
              children: [/*#__PURE__*/(0,jsx_runtime.jsx)("option", {
                value: "",
                disabled: true,
                children: L.chooseSection
              }), sections.map(s => /*#__PURE__*/(0,jsx_runtime.jsx)("option", {
                value: s.section,
                children: s.name
              }, s.section))]
            })]
          }), /*#__PURE__*/(0,jsx_runtime.jsxs)("label", {
            className: "nexusai-visibility-toggle",
            htmlFor: "nexusai-upload-visible",
            children: [/*#__PURE__*/(0,jsx_runtime.jsx)("input", {
              id: "nexusai-upload-visible",
              type: "checkbox",
              checked: visibleToStudents,
              onChange: e => setVisibleToStudents(e.target.checked),
              disabled: uploading
            }), /*#__PURE__*/(0,jsx_runtime.jsx)("span", {
              children: L.visibleLabel
            })]
          }), /*#__PURE__*/(0,jsx_runtime.jsx)("p", {
            className: "nexusai-documents__hint",
            children: L.visibleHint
          }), /*#__PURE__*/(0,jsx_runtime.jsx)(UploadZone, {
            onUpload: handleUpload,
            busy: uploading,
            disabled: uploading || sections.length > 0 && selectedSection === "",
            lang: lang
          }), uploadQueue.length > 0 && /*#__PURE__*/(0,jsx_runtime.jsx)("ul", {
            className: "nexusai-upload-queue",
            children: uploadQueue.map(item => /*#__PURE__*/(0,jsx_runtime.jsxs)("li", {
              className: `nexusai-upload-queue__item nexusai-upload-queue__item--${item.status}`,
              children: [/*#__PURE__*/(0,jsx_runtime.jsx)("span", {
                className: "nexusai-upload-queue__name",
                children: item.filename
              }), item.status === "error" ? /*#__PURE__*/(0,jsx_runtime.jsxs)(jsx_runtime.Fragment, {
                children: [/*#__PURE__*/(0,jsx_runtime.jsx)("span", {
                  className: "nexusai-upload-queue__status",
                  children: item.error
                }), /*#__PURE__*/(0,jsx_runtime.jsx)("button", {
                  type: "button",
                  className: "nexusai-upload-queue__dismiss",
                  onClick: () => handleDismissUploadError(item.key),
                  "aria-label": L.dismissUploadError(item.filename),
                  children: "\xD7"
                })]
              }) : /*#__PURE__*/(0,jsx_runtime.jsx)("span", {
                className: "nexusai-upload-queue__status",
                children: item.status === "uploading" ? L.uploading : L.queued
              })]
            }, item.key))
          }), /*#__PURE__*/(0,jsx_runtime.jsx)("h3", {
            className: "nexusai-documents__heading",
            children: L.indexedMaterial(total)
          }), /*#__PURE__*/(0,jsx_runtime.jsx)(DocumentsTable, {
            courseId: courseid,
            documents: documents,
            onChange: handleDocumentsChange,
            lang: lang
          }), hasMore && /*#__PURE__*/(0,jsx_runtime.jsx)("button", {
            type: "button",
            className: "nexusai-documents__load-more",
            onClick: handleLoadMore,
            disabled: loadingMore,
            children: loadingMore ? L.loading : L.loadMore(documents.length, total)
          })]
        }), error && /*#__PURE__*/(0,jsx_runtime.jsx)(ErrorModal, {
          message: error,
          onClose: () => setError(null),
          lang: lang
        })]
      }) : /*#__PURE__*/(0,jsx_runtime.jsx)(StudentQuestionsPanel, {
        courseId: courseid,
        lang: lang
      })
    })]
  });
}
function DocumentsManager(props) {
  return /*#__PURE__*/(0,jsx_runtime.jsx)("div", {
    className: "nexusai-documents",
    children: /*#__PURE__*/(0,jsx_runtime.jsx)(ToastProvider, {
      children: /*#__PURE__*/(0,jsx_runtime.jsx)(DocumentsManagerInner, {
        ...props
      })
    })
  });
}
// EXTERNAL MODULE: ./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js
var injectStylesIntoStyleTag = __webpack_require__(72);
var injectStylesIntoStyleTag_default = /*#__PURE__*/__webpack_require__.n(injectStylesIntoStyleTag);
// EXTERNAL MODULE: ./node_modules/style-loader/dist/runtime/styleDomAPI.js
var styleDomAPI = __webpack_require__(825);
var styleDomAPI_default = /*#__PURE__*/__webpack_require__.n(styleDomAPI);
// EXTERNAL MODULE: ./node_modules/style-loader/dist/runtime/insertBySelector.js
var insertBySelector = __webpack_require__(659);
var insertBySelector_default = /*#__PURE__*/__webpack_require__.n(insertBySelector);
// EXTERNAL MODULE: ./node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js
var setAttributesWithoutAttributes = __webpack_require__(56);
var setAttributesWithoutAttributes_default = /*#__PURE__*/__webpack_require__.n(setAttributesWithoutAttributes);
// EXTERNAL MODULE: ./node_modules/style-loader/dist/runtime/insertStyleElement.js
var insertStyleElement = __webpack_require__(159);
var insertStyleElement_default = /*#__PURE__*/__webpack_require__.n(insertStyleElement);
// EXTERNAL MODULE: ./node_modules/style-loader/dist/runtime/styleTagTransform.js
var styleTagTransform = __webpack_require__(113);
var styleTagTransform_default = /*#__PURE__*/__webpack_require__.n(styleTagTransform);
// EXTERNAL MODULE: ./node_modules/css-loader/dist/cjs.js!./src/styles.css
var styles = __webpack_require__(365);
;// ./src/styles.css

      
      
      
      
      
      
      
      
      

var options = {};

options.styleTagTransform = (styleTagTransform_default());
options.setAttributes = (setAttributesWithoutAttributes_default());
options.insert = insertBySelector_default().bind(null, "head");
options.domAPI = (styleDomAPI_default());
options.insertStyleElement = (insertStyleElement_default());

var update = injectStylesIntoStyleTag_default()(styles/* default */.A, options);




       /* harmony default export */ var src_styles = (styles/* default */.A && styles/* default */.A.locals ? styles/* default */.A.locals : undefined);

// EXTERNAL MODULE: ./node_modules/css-loader/dist/cjs.js!./src/documents/documents.css
var documents = __webpack_require__(118);
;// ./src/documents/documents.css

      
      
      
      
      
      
      
      
      

var documents_options = {};

documents_options.styleTagTransform = (styleTagTransform_default());
documents_options.setAttributes = (setAttributesWithoutAttributes_default());
documents_options.insert = insertBySelector_default().bind(null, "head");
documents_options.domAPI = (styleDomAPI_default());
documents_options.insertStyleElement = (insertStyleElement_default());

var documents_update = injectStylesIntoStyleTag_default()(documents/* default */.A, documents_options);




       /* harmony default export */ var documents_documents = (documents/* default */.A && documents/* default */.A.locals ? documents/* default */.A.locals : undefined);

;// ./src/documents/index.jsx
// This file is part of Moodle - https://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <https://www.gnu.org/licenses/>.

/**
 * Part of the NexusAI plugin (local_nexusai).
 *
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * Entry point of the teacher view bundle.
 *
 * Moodle calls it from plugin/local/nexusai/documents.php:
 *
 *   $PAGE->requires->js_call_amd('local_nexusai/documents-manager-lazy', 'init', [params]);
 *
 * Mounts the DocumentsManager component in the #local-nexusai-documents-app div
 * the PHP page already rendered.
 */




 // We reuse the chat styles for FAB/colors
 // Styles specific to the teacher view

const init = (params = {}) => {
  const container = document.getElementById("local-nexusai-documents-app");
  if (!container) {
    // eslint-disable-next-line no-console
    console.warn("[NexusAI/documents] container #local-nexusai-documents-app not found");
    return;
  }
  try {
    const root = (0,client/* createRoot */.H)(container);
    root.render(/*#__PURE__*/(0,jsx_runtime.jsx)(DocumentsManager, {
      courseid: params.courseid,
      userid: params.userid,
      sesskey: params.sesskey,
      lang: params.lang || "es",
      courseFullname: params.fullname,
      initialTab: params.initialtab
    }));
    // eslint-disable-next-line no-console
    console.log("[NexusAI/documents] mounted", params);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[NexusAI/documents] failed to mount:", err);
  }
};
/* harmony default export */ var src_documents = ({
  init
});
/******/ 	return __webpack_exports__;
/******/ })()
;
});;