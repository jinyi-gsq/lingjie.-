// ==UserScript==
// @name 灵界灵纹自动洗练
// @namespace https://ling.muge.info
// @version 1.4
// @description 自动十连灵纹，按属性和数值筛选，自动放弃不符合结果，面板始终置顶，手机端紧凑模式，支持拖拽
// @match https://ling.muge.info/*
// @grant GM_getValue
// @grant GM_setValue
// @grant GM_addStyle
// @grant unsafeWindow
// @run-at document-idle
// @downloadURL https://gh-proxy.org/https://raw.githubusercontent.com/smartbear147/ling-monitor/refs/heads/main/ling-inscription.user.js
// @updateURL https://gh-proxy.org/https://raw.githubusercontent.com/smartbear147/ling-monitor/refs/heads/main/ling-inscription.user.js
// ==/UserScript==

(function () {
    'use strict';

    // --- 检测设备类型 ---
    const isMobile = /Android|iPhone|iPad|iPod|webOS/i.test(navigator.userAgent) || window.innerWidth < 768;
    const PANEL_WIDTH = isMobile ? 280 : 340;
    const PANEL_FONT_SIZE = isMobile ? 11 : 12;
    const LOG_MAX_HEIGHT = isMobile ? 100 : 200;
    const STAT_FONT_SIZE = isMobile ? 14 : 16;

    // --- 主题样式 ---
    GM_addStyle(`
        /* === 确保面板始终在最上层 === */
        #inscription-panel {
            isolation: isolate;
        }
        #inscription-panel,
        #inscription-panel * {
            z-index: 2147483647 !important;
        }
        #inscription-panel {
            position: fixed !important;
            z-index: 2147483647 !important;
            pointer-events: auto !important;
        }
        #inscription-panel::before {
            z-index: 0 !important;
        }
        #inscription-panel > * {
            position: relative;
            z-index: 1;
        }
        #inscription-config-panel {
            z-index: 2147483646 !important;
        }
        #inscription-panel button {
            position: relative;
            z-index: 2147483647 !important;
            pointer-events: auto !important;
        }
        #inscription-panel input,
        #inscription-panel select {
            position: relative;
            z-index: 2147483647 !important;
            pointer-events: auto !important;
        }

        /* === 主题变量 === */
        html.theme-dark #inscription-panel,
        html:not(.theme-light) #inscription-panel {
            --ip-bg: #0e1528;
            --ip-bg-section: rgba(100,160,220,0.03);
            --ip-bg-card: rgba(0,0,0,0.25);
            --ip-bg-input: rgba(0,0,0,0.4);
            
            --ip-text: #f0ece4;
            --ip-text-secondary: #8ab8d0;
            --ip-text-muted: #7a9ab0;
            --ip-text-bright: #f5f2eb;
            
            --ip-accent: #4a9ec8;
            --ip-accent-dim: rgba(74,158,200,0.25);
            --ip-accent-glow: rgba(74,158,200,0.15);
            --ip-accent-subtle: rgba(74,158,200,0.05);
            --ip-gold: #ffb450;
            --ip-blue: #4fc3f7;
            --ip-jade: #4ecdc4;
            --ip-red: #ff6b6b;
            --ip-red-glow: rgba(255,107,107,0.2);
            
            --ip-border: rgba(100,160,200,0.08);
            --ip-border-subtle: rgba(100,160,200,0.15);
            --ip-border-strong: rgba(100,160,200,0.25);
            
            --ip-shadow: 0 4px 20px rgba(0,0,0,0.4), 0 0 40px rgba(74,158,200,0.08);
            --ip-shadow-inner: inset 0 1px 0 rgba(100,160,200,0.1);
            
            --ip-header-grad: linear-gradient(180deg, rgba(74,158,200,0.08) 0%, transparent 100%);
            --ip-line: linear-gradient(90deg, transparent 0%, rgba(74,158,200,0.5) 20%, rgba(74,158,200,0.8) 50%, rgba(74,158,200,0.5) 80%, transparent 100%);
            --ip-bg-texture: repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(100,160,200,0.02) 2px, rgba(100,160,200,0.02) 4px);
            
            --ip-log-success: #4ecdc4;
            --ip-log-error: #ff6b6b;
            --ip-log-warn: #f0a050;
            --ip-log-info: #70a0c0;
            --ip-log-action: #4a9ec8;
        }
        html.theme-light #inscription-panel {
            --ip-bg: #f5f3ef;
            --ip-bg-section: #eef4f8;
            --ip-bg-card: rgba(90,122,138,0.05);
            --ip-bg-input: #eaeef2;
            
            --ip-text: #2a3a4a;
            --ip-text-secondary: #4a6a8a;
            --ip-text-muted: #506880;
            --ip-text-bright: #1a2a3a;
            
            --ip-accent: #2a7ab8;
            --ip-accent-dim: rgba(42,122,184,0.2);
            --ip-accent-glow: rgba(42,122,184,0.1);
            --ip-accent-subtle: rgba(42,122,184,0.05);
            --ip-gold: #d4942a;
            --ip-blue: #2a8ab8;
            --ip-jade: #3a8a80;
            --ip-red: #c84040;
            --ip-red-glow: rgba(200,64,64,0.15);
            
            --ip-border: rgba(60,60,60,0.06);
            --ip-border-subtle: rgba(60,60,60,0.12);
            --ip-border-strong: rgba(60,60,60,0.2);
            
            --ip-shadow: 0 4px 16px rgba(0,0,0,0.08);
            --ip-shadow-inner: inset 0 1px 0 rgba(255,255,255,0.5);
            
            --ip-header-grad: linear-gradient(180deg, #f0f4f8 0%, #f5f3ef 100%);
            --ip-line: linear-gradient(90deg, transparent 0%, rgba(42,122,184,0.3) 30%, rgba(42,122,184,0.5) 50%, rgba(42,122,184,0.3) 70%, transparent 100%);
            --ip-bg-texture: none;
            
            --ip-log-success: #3a8a50;
            --ip-log-error: #c84040;
            --ip-log-warn: #b08030;
            --ip-log-info: #3a6a80;
            --ip-log-action: #2a7ab8;
        }

        /* === 面板整体 === */
        #inscription-panel {
            width: ${PANEL_WIDTH}px;
            max-width: calc(100vw - 20px);
            background: var(--ip-bg);
            border: 1px solid var(--ip-border-subtle);
            border-radius: ${isMobile ? '10px' : '12px'};
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            font-size: ${PANEL_FONT_SIZE}px;
            font-weight: 500;
            color: var(--ip-text);
            box-shadow: var(--ip-shadow);
            overflow: hidden;
            pointer-events: auto !important;
            transition: width 0.2s ease, border-radius 0.2s ease;
        }
        #inscription-panel::before {
            content: '';
            position: absolute;
            inset: 0;
            background: var(--ip-bg-texture);
            pointer-events: none;
        }
        .ip-line {
            height: 1px;
            background: var(--ip-line);
            position: relative;
            z-index: 2;
        }
        #inscription-panel.minimized #inscription-body { display: none; }
        #inscription-panel.minimized { 
            width: auto; 
            min-width: ${isMobile ? '150px' : '180px'}; 
        }

        /* === 头部 === */
        #inscription-header {
            cursor: move; 
            padding: ${isMobile ? '6px 10px' : '10px 14px'};
            background: var(--ip-header-grad);
            display: flex; justify-content: space-between; align-items: center;
            border-bottom: none;
            user-select: none;
            position: relative;
            z-index: 1;
        }
        .ip-header-title {
            font-family: 'Space Grotesk', sans-serif;
            font-weight: 600; 
            font-size: ${isMobile ? '12px' : '13px'}; 
            letter-spacing: 1.5px;
            color: var(--ip-text-bright);
        }
        .ip-header-right {
            display: flex; align-items: center; 
            gap: ${isMobile ? '6px' : '12px'};
        }
        #inscription-status {
            font-family: 'Space Grotesk', sans-serif;
            font-size: ${isMobile ? '10px' : '11px'}; 
            font-weight: 600; letter-spacing: 1px;
            padding: ${isMobile ? '1px 6px' : '1px 10px'}; 
            border-radius: 16px;
            display: flex; align-items: center; gap: 4px;
        }
        #inscription-status.status-idle {
            background: var(--ip-bg-card);
            color: var(--ip-text-muted);
            border: 1px solid var(--ip-border);
        }
        #inscription-status.status-running {
            background: rgba(78,205,196,0.15);
            color: var(--ip-jade);
            border: 1px solid rgba(78,205,196,0.3);
            animation: ip-pulse-glow 2s ease-in-out infinite;
        }
        #inscription-status.status-paused {
            background: rgba(240,160,80,0.15);
            color: #f0a050;
            border: 1px solid rgba(240,160,80,0.3);
        }
        #inscription-status.status-discarding {
            background: rgba(255,107,107,0.15);
            color: var(--ip-red);
            border: 1px solid rgba(255,107,107,0.3);
        }
        .ip-status-dot {
            width: 6px; height: 6px; border-radius: 50%;
            background: currentColor;
        }
        #inscription-status.status-running .ip-status-dot {
            animation: ip-pulse-dot 1.5s ease-in-out infinite;
        }
        @keyframes ip-pulse-glow {
            0%, 100% { box-shadow: 0 0 0 rgba(78,205,196,0); }
            50% { box-shadow: 0 0 8px rgba(78,205,196,0.4); }
        }
        @keyframes ip-pulse-dot {
            0%, 100% { transform: scale(1); opacity: 0.8; }
            50% { transform: scale(1.3); opacity: 1; }
        }
        #inscription-minimize {
            cursor: pointer;
            width: ${isMobile ? '20px' : '24px'}; 
            height: ${isMobile ? '20px' : '24px'};
            display: flex; align-items: center; justify-content: center;
            border-radius: 6px;
            color: var(--ip-text-secondary);
            background: transparent;
            border: none;
            font-size: ${isMobile ? '10px' : '12px'};
            transition: all 0.15s ease;
        }
        #inscription-minimize:hover {
            background: var(--ip-accent-subtle);
            color: var(--ip-accent);
        }

        /* === 统计区域 === */
        #inscription-stats {
            padding: ${isMobile ? '4px 8px' : '6px 12px'};
            display: flex; gap: 4px;
            flex-wrap: wrap;
            border-bottom: 1px solid var(--ip-border);
            position: relative;
            z-index: 1;
        }
        .ip-stat {
            flex: 1; min-width: 40px;
            text-align: center;
            padding: 2px;
            background: var(--ip-bg-card);
            border-radius: 6px;
        }
        .ip-stat-value {
            font-family: 'Space Grotesk', sans-serif;
            font-size: ${STAT_FONT_SIZE}px; 
            font-weight: 700;
            color: var(--ip-accent);
        }
        .ip-stat-label {
            font-size: ${isMobile ? '8px' : '9px'}; 
            font-weight: 600;
            color: var(--ip-text-muted);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        /* === 日志区域 === */
        #inscription-log {
            padding: ${isMobile ? '4px 8px' : '8px 12px'}; 
            max-height: ${LOG_MAX_HEIGHT}px; 
            overflow-y: auto;
            background: var(--ip-bg-card);
            scrollbar-width: thin; 
            scrollbar-color: var(--ip-border-subtle) transparent;
            position: relative;
            z-index: 1;
        }
        #inscription-log::-webkit-scrollbar { width: 4px; }
        #inscription-log::-webkit-scrollbar-track { background: transparent; }
        #inscription-log::-webkit-scrollbar-thumb { background: var(--ip-border-subtle); border-radius: 2px; }
        .ip-log-line {
            padding: ${isMobile ? '1px 0 1px 6px' : '3px 0 3px 10px'};
            display: flex; align-items: flex-start; 
            gap: ${isMobile ? '4px' : '8px'};
            font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace;
            font-size: ${isMobile ? '9px' : '11px'}; 
            font-weight: 500;
            line-height: 1.4;
            border-bottom: 1px solid var(--ip-border);
            position: relative;
        }
        .ip-log-line:last-child { border-bottom: none; }
        .ip-log-time {
            color: var(--ip-text-muted);
            font-size: ${isMobile ? '8px' : '10px'}; 
            font-weight: 500;
            min-width: ${isMobile ? '48px' : '60px'}; 
            flex-shrink: 0;
        }
        .ip-log-content {
            color: var(--ip-text-secondary);
            font-weight: 500;
            word-break: break-all;
        }
        .ip-log-line::before {
            content: '';
            position: absolute;
            left: 0; top: 0; bottom: 0;
            width: 2px; border-radius: 1px;
            background: var(--ip-border);
        }
        .ip-log-line.log-success::before { background: var(--ip-log-success); }
        .ip-log-line.log-error::before { background: var(--ip-log-error); }
        .ip-log-line.log-warn::before { background: var(--ip-log-warn); }
        .ip-log-line.log-info::before { background: var(--ip-log-info); }
        .ip-log-line.log-action::before { background: var(--ip-log-action); }
        .ip-log-line.log-success .ip-log-content { color: var(--ip-log-success); }
        .ip-log-line.log-error .ip-log-content { color: var(--ip-log-error); }
        .ip-log-line.log-warn .ip-log-content { color: var(--ip-log-warn); }
        .ip-log-line.log-info .ip-log-content { color: var(--ip-log-info); }
        .ip-log-line.log-action .ip-log-content { color: var(--ip-log-action); }

        /* === 底部按钮栏 === */
        #inscription-body > div:last-child {
            padding: ${isMobile ? '4px 6px' : '8px 12px'};
            border-top: 1px solid var(--ip-border);
            display: flex; 
            gap: ${isMobile ? '3px' : '6px'};
            background: var(--ip-bg);
            flex-wrap: wrap;
            position: relative;
            z-index: 1;
        }
        .ip-btn {
            flex: 1; 
            padding: ${isMobile ? '5px 2px' : '7px 4px'}; 
            min-width: ${isMobile ? '42px' : '55px'};
            border: none; border-radius: 4px;
            cursor: pointer;
            font-family: 'Space Grotesk', sans-serif;
            font-size: ${isMobile ? '10px' : '11px'}; 
            font-weight: 600;
            transition: all 0.15s ease;
            position: relative;
            overflow: hidden;
            pointer-events: auto !important;
            letter-spacing: ${isMobile ? '0' : 'normal'};
        }
        .ip-btn-start {
            background: linear-gradient(135deg, var(--ip-accent) 0%, #2a7ab8 100%);
            color: #fff;
            box-shadow: 0 2px 8px var(--ip-accent-dim), var(--ip-shadow-inner);
        }
        .ip-btn-start:hover { filter: brightness(1.1); transform: translateY(-1px); }
        .ip-btn-start:active { transform: translateY(0) scale(0.97); }
        .ip-btn-stop {
            background: linear-gradient(135deg, var(--ip-red) 0%, #c84040 100%);
            color: #fff;
            box-shadow: 0 2px 8px var(--ip-red-glow);
        }
        .ip-btn-stop:hover { filter: brightness(1.1); transform: translateY(-1px); }
        .ip-btn-stop:active { transform: translateY(0) scale(0.97); }
        .ip-btn-pause {
            background: linear-gradient(135deg, #f0a050 0%, #d08030 100%);
            color: #fff;
        }
        .ip-btn-pause:hover { filter: brightness(1.1); }
        .ip-btn-config {
            background: var(--ip-bg-card);
            color: var(--ip-accent);
            border: 1px solid var(--ip-border-subtle);
        }
        .ip-btn-config:hover {
            background: var(--ip-accent-subtle);
            border-color: var(--ip-accent-dim);
        }
        .ip-btn-clear {
            background: var(--ip-bg-card);
            color: var(--ip-text-muted);
            border: 1px solid var(--ip-border);
        }
        .ip-btn-clear:hover {
            background: var(--ip-bg-section);
            color: var(--ip-text-secondary);
        }

        /* === 配置面板 === */
        #inscription-config-panel {
            width: 100%; 
            max-height: ${isMobile ? '40vh' : '60vh'}; 
            overflow-y: auto;
            background: var(--ip-bg);
            border-top: 1px solid var(--ip-border-subtle);
            font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace;
            font-size: ${PANEL_FONT_SIZE}px;
            color: var(--ip-text);
            padding: ${isMobile ? '8px' : '12px'}; 
            padding-bottom: ${isMobile ? '20px' : '30px'}; 
            box-sizing: border-box;
            position: relative;
            scrollbar-width: thin; 
            scrollbar-color: var(--ip-border-subtle) transparent;
        }
        #inscription-config-panel::-webkit-scrollbar { width: 4px; }
        #inscription-config-panel::-webkit-scrollbar-thumb { background: var(--ip-border-subtle); border-radius: 2px; }
        .ic-header {
            display: flex; justify-content: space-between; align-items: center;
            margin-bottom: ${isMobile ? '10px' : '16px'};
        }
        .ic-title {
            font-family: 'Space Grotesk', sans-serif;
            font-weight: 600; 
            font-size: ${isMobile ? '12px' : '14px'}; 
            letter-spacing: 1px;
            color: var(--ip-text-bright);
        }
        .ic-close {
            cursor: pointer;
            width: ${isMobile ? '24px' : '28px'}; 
            height: ${isMobile ? '24px' : '28px'};
            display: flex; align-items: center; justify-content: center;
            border-radius: 6px;
            color: var(--ip-red); 
            font-size: ${isMobile ? '16px' : '18px'}; 
            font-weight: bold;
            background: transparent;
            transition: all 0.15s;
            pointer-events: auto !important;
        }
        .ic-close:hover { background: var(--ip-red-glow); }
        .ic-section {
            margin-bottom: ${isMobile ? '8px' : '14px'}; 
            padding: ${isMobile ? '6px 8px' : '10px 12px'};
            background: var(--ip-bg-section);
            border: 1px solid var(--ip-border);
            border-radius: 8px;
        }
        .ic-section:last-child { margin-bottom: 0; }
        .ic-section-label {
            font-family: 'Space Grotesk', sans-serif;
            font-size: ${isMobile ? '9px' : '10px'}; 
            font-weight: 700;
            color: var(--ip-text-muted);
            text-transform: uppercase; letter-spacing: 1px;
            margin-bottom: ${isMobile ? '6px' : '10px'};
        }
        .ic-row { margin-bottom: ${isMobile ? '6px' : '10px'}; }
        .ic-row:last-child { margin-bottom: 0; }
        .ic-label {
            display: block;
            font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace;
            font-size: ${isMobile ? '10px' : '12px'}; 
            font-weight: 600;
            color: var(--ip-accent);
            margin-bottom: 4px;
            letter-spacing: 0.3px;
        }
        .ic-hint {
            font-size: ${isMobile ? '8px' : '10px'}; 
            font-weight: 400;
            color: var(--ip-text-muted);
            margin-left: 4px;
        }
        #inscription-config-panel input[type=number],
        #inscription-config-panel input[type=text],
        #inscription-config-panel select {
            width: 100%; 
            padding: ${isMobile ? '3px 6px' : '5px 8px'};
            background: var(--ip-bg-input);
            color: var(--ip-text);
            border: 1px solid var(--ip-border-subtle);
            border-radius: 5px;
            font-family: inherit;
            font-size: ${isMobile ? '10px' : '11px'}; 
            font-weight: 500;
            transition: all 0.15s;
            pointer-events: auto !important;
        }
        #inscription-config-panel input:focus, 
        #inscription-config-panel select:focus {
            outline: none;
            border-color: var(--ip-accent);
            box-shadow: 0 0 0 2px var(--ip-accent-glow);
        }
        #inscription-config-panel input[type=checkbox] {
            width: 16px; height: 16px;
            accent-color: var(--ip-accent);
            pointer-events: auto !important;
        }
        .ic-checkbox-row {
            display: flex; align-items: center; gap: 6px;
        }
        .ic-bottom-bar {
            display: flex; gap: 8px;
            margin-top: ${isMobile ? '10px' : '16px'};
        }
        .ic-btn {
            flex: 1; 
            padding: ${isMobile ? '6px 0' : '8px 0'};
            border-radius: 4px;
            font-family: 'Space Grotesk', sans-serif;
            font-size: ${isMobile ? '11px' : '12px'}; 
            font-weight: 600;
            cursor: pointer;
            transition: all 0.15s;
            pointer-events: auto !important;
        }
        .ic-btn-save {
            background: linear-gradient(135deg, var(--ip-accent) 0%, #2a7ab8 100%);
            color: #fff;
            border: none;
            box-shadow: 0 2px 8px var(--ip-accent-dim);
        }
        .ic-btn-save:hover { filter: brightness(1.1); }
        .ic-btn-reset {
            background: var(--ip-bg-card);
            color: var(--ip-text-secondary);
            border: 1px solid var(--ip-border-subtle);
        }
        .ic-btn-reset:hover {
            background: var(--ip-accent-subtle);
            color: var(--ip-accent);
        }

        /* === 目标属性列表 === */
        .affix-list { display: flex; flex-direction: column; gap: 3px; }
        .affix-row {
            display: flex; align-items: center; gap: 3px;
            background: var(--ip-bg-card);
            border: 1px solid var(--ip-border-subtle);
            border-radius: 6px; 
            padding: ${isMobile ? '3px 5px' : '5px 8px'};
            transition: all 0.15s;
        }
        .affix-row:hover { border-color: var(--ip-text-muted); }
        .affix-row.dragging { opacity: 0.4; }
        .affix-row.drag-over { border-color: var(--ip-accent); background: var(--ip-accent-subtle); }
        .affix-handle {
            cursor: grab; color: var(--ip-text-muted);
            font-size: 12px; user-select: none;
            flex-shrink: 0;
        }
        .target-stat-select {
            flex: 1; min-width: 0;
            padding: 2px 4px;
            background: var(--ip-bg-input) !important;
            color: var(--ip-text);
            border: 1px solid var(--ip-border);
            border-radius: 5px;
            font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace;
            font-size: ${isMobile ? '10px' : '11px'}; 
            font-weight: 500;
            height: ${isMobile ? '24px' : '26px'}; 
            box-sizing: border-box;
            appearance: none; -webkit-appearance: none;
            text-align: center; text-align-last: center;
            pointer-events: auto !important;
        }
        .affix-value {
            width: ${isMobile ? '50px' : '60px'}; 
            min-width: ${isMobile ? '50px' : '60px'};
            background: var(--ip-bg-input) !important;
            color: var(--ip-text);
            border: 1px solid var(--ip-border);
            border-radius: 5px; 
            padding: 2px 4px;
            font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace;
            font-size: ${isMobile ? '10px' : '11px'}; 
            font-weight: 500;
            height: ${isMobile ? '24px' : '26px'}; 
            box-sizing: border-box;
            pointer-events: auto !important;
        }
        .affix-del {
            cursor: pointer; color: var(--ip-red);
            font-size: 14px; font-weight: bold;
            user-select: none;
            width: ${isMobile ? '18px' : '20px'}; 
            height: ${isMobile ? '18px' : '20px'};
            display: flex; align-items: center; justify-content: center;
            border-radius: 5px; transition: all 0.15s;
            flex-shrink: 0;
            pointer-events: auto !important;
        }
        .affix-del:hover { background: var(--ip-red-glow); }
        .affix-add {
            cursor: pointer; color: var(--ip-accent);
            font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace;
            font-size: ${isMobile ? '10px' : '11px'}; 
            font-weight: 500;
            text-align: center; 
            padding: ${isMobile ? '4px' : '6px'};
            border: 1px dashed var(--ip-border-subtle);
            border-radius: 5px; margin-top: 3px;
            transition: all 0.15s;
            pointer-events: auto !important;
        }
        .affix-add:hover { border-color: var(--ip-accent); background: var(--ip-accent-subtle); }

        /* === 手机端面板透明度 === */
        html.theme-dark #inscription-panel.mobile-compact {
            background: rgba(14, 21, 40, 0.92);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
        }
        html.theme-light #inscription-panel.mobile-compact {
            background: rgba(245, 243, 239, 0.92);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
        }
    `);

    // --- 默认配置 ---
    const DEFAULT_CONFIG = {
        // 目标属性（按优先级排序），仅按属性名和数值判断
        targetStats: [
            { stat: '攻击', minValue: 50 },
            { stat: '防御', minValue: 50 },
            { stat: '气血', minValue: 100 },
            { stat: '神识', minValue: 20 }
        ],
        // 停止模式: 'any' = 任一满足即停, 'all' = 全部满足才停, 'manual' = 永不停
        stopMode: 'any',
        // 最大十连次数（0=无限制）
        maxAttempts: 0,
        // 结果动画等待(ms)
        resultAnimationMs: 1500,
        // 放弃后等待(ms)
        discardDelayMs: 2000,
        // 自动关闭弹窗
        autoCloseDialogs: true,
        // 达到目标后浏览器通知
        notifyOnComplete: true,
        // 面板位置
        panelPosition: isMobile ? { top: 60, left: 10 } : { top: 10, left: 10 },
        // 是否迷你模式（手机端默认最小化）
        minimized: isMobile,
    };

    function loadConfig() {
        const defaults = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
        const saved = GM_getValue('inscription_config', null);
        if (saved) {
            try {
                const parsed = typeof saved === 'string' ? JSON.parse(saved) : saved;
                // 移除旧版本可能存在的 minQuality 字段
                delete parsed.minQuality;
                return { ...defaults, ...parsed };
            } catch (e) {}
        }
        return defaults;
    }

    function saveConfig(cfg) {
        GM_setValue('inscription_config', JSON.stringify(cfg));
    }

    let config = loadConfig();

    let stats = {
        totalPulls: 0,
        keptCount: 0,
        discardedCount: 0,
        bestResult: null,
        startTime: null,
    };

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function log(msg, type) {
        console.log(`[灵纹洗练] ${msg}`);
        if (typeof window.__inscriptionLog === 'function') {
            window.__inscriptionLog(msg, type);
        }
    }

    // --- 保持面板置顶 ---
    function ensurePanelOnTop() {
        const panel = document.getElementById('inscription-panel');
        if (!panel) return;

        if (panel.style.position !== 'fixed') {
            panel.style.position = 'fixed';
        }

        const maxZIndex = 2147483647;
        panel.style.setProperty('z-index', maxZIndex, 'important');

        if (panel.style.pointerEvents !== 'auto') {
            panel.style.pointerEvents = 'auto';
        }
    }

    let topMonitorInterval = null;
    function startTopMonitor() {
        if (topMonitorInterval) return;
        topMonitorInterval = setInterval(() => {
            ensurePanelOnTop();
            const panel = document.getElementById('inscription-panel');
            if (panel && panel.parentElement !== document.body) {
                document.body.appendChild(panel);
            }
        }, 1000);
    }

    // --- 解析结果卡片 ---
    function parseResultCards() {
        const grid = document.querySelector('.insc-result-grid');
        if (!grid) return [];

        const cards = grid.querySelectorAll('.insc-result-card');
        const results = [];

        cards.forEach(card => {
            const qualityEl = card.querySelector('.insc-result-card__quality');
            const statEl = card.querySelector('.insc-result-card__stat');
            const valueEl = card.querySelector('.insc-result-card__value');

            if (!statEl || !valueEl) return;

            const quality = qualityEl ? qualityEl.textContent.trim() : '';
            const stat = statEl.textContent.trim();
            const valueText = valueEl.textContent.trim();
            const value = parseInt(valueText.replace(/[+]/g, '')) || 0;

            results.push({
                quality,
                stat,
                value,
                element: card,
                rawText: `${quality ? quality + ' ' : ''}${stat} +${value}`
            });
        });

        return results;
    }

    // --- 检查是否满足目标（仅按属性和数值） ---
    function checkTargetMet(results) {
        if (config.targetStats.length === 0) {
            return { met: true, matches: [], reason: '无目标' };
        }

        const matches = [];
        for (const result of results) {
            for (const target of config.targetStats) {
                if (result.stat.includes(target.stat)) {
                    if (!target.minValue || result.value >= target.minValue) {
                        matches.push({
                            card: result,
                            target: target.stat,
                            quality: result.quality,
                            value: result.value,
                            required: target.minValue || 0
                        });
                        break; // 一个词条只匹配一个规则
                    }
                }
            }
        }

        // 去重
        const uniqueMatches = [];
        const seenCards = new Set();
        for (const match of matches) {
            if (!seenCards.has(match.card.rawText)) {
                seenCards.add(match.card.rawText);
                uniqueMatches.push(match);
            }
        }

        let met = false;
        if (config.stopMode === 'any') {
            met = uniqueMatches.length > 0;
        } else if (config.stopMode === 'all') {
            const matchedStats = new Set(uniqueMatches.map(m => m.target));
            const requiredStats = new Set(config.targetStats.filter(t => t.minValue > 0).map(t => t.stat));
            met = [...requiredStats].every(s => matchedStats.has(s));
        }

        const reason = met ? '目标达成' : (uniqueMatches.length > 0 ? `部分匹配(${uniqueMatches.length})` : '无匹配');

        return { met, matches: uniqueMatches, reason };
    }

    function getBestResult(results) {
        let best = null;
        let bestScore = -1;

        for (const r of results) {
            let score = 0;
            for (const target of config.targetStats) {
                if (r.stat.includes(target.stat)) {
                    score += r.value * 10;
                }
            }
            if (score > bestScore) {
                bestScore = score;
                best = r;
            }
        }
        return best;
    }

    // --- 点击十连灵纹 ---
    function clickTenPull() {
        const buttons = document.querySelectorAll('.modal-action-btn__text');
        for (const btn of buttons) {
            if (btn.textContent.trim() === '十连灵纹') {
                const clickTarget = btn.closest('button') || btn;
                clickTarget.click();
                return true;
            }
        }
        return false;
    }

    // --- 点击全部放弃 ---
    function clickDiscardAll() {
        const buttons = document.querySelectorAll('button.modal-btn--outline');
        for (const btn of buttons) {
            if (btn.textContent.trim() === '全部放弃') {
                btn.click();
                log('已点击「全部放弃」', 'action');
                return true;
            }
        }
        const allBtns = document.querySelectorAll('button');
        for (const btn of allBtns) {
            if (btn.onclick && btn.onclick.toString().includes('discardAllInscriptionsFromTenPull')) {
                btn.click();
                log('已点击「全部放弃」（onclick匹配）', 'action');
                return true;
            }
        }
        return false;
    }

    // --- 处理二次确认弹窗 ---
    async function handleDiscardConfirmDialog(timeout = 3000) {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            const confirmBtnById = document.getElementById('gameDialogConfirmBtn');
            const cancelBtnById = document.getElementById('gameDialogCancelBtn');
            if (confirmBtnById && cancelBtnById) {
                const cText = confirmBtnById.textContent.trim();
                if (cText === '确 定' || cText === '确定') {
                    log('确认弹窗，点击「确定」', 'action');
                    confirmBtnById.click();
                    return true;
                }
            }

            const btnRows = document.querySelectorAll('.modal-btn-row');
            for (const row of btnRows) {
                const cancelBtn = row.querySelector('#gameDialogCancelBtn, .modal-btn--outline');
                const confirmBtn = row.querySelector('#gameDialogConfirmBtn, .modal-btn--gold');
                const cancelText = cancelBtn ? cancelBtn.textContent.trim() : '';
                const confirmText = confirmBtn ? confirmBtn.textContent.trim() : '';
                if ((cancelText === '取 消' || cancelText === '取消') && 
                    (confirmText === '确 定' || confirmText === '确定')) {
                    log('确认弹窗，点击「确定」', 'action');
                    confirmBtn.click();
                    return true;
                }
            }
            await sleep(200);
        }
        log('等待确认弹窗超时', 'warn');
        return false;
    }

    // --- 等待结果面板 ---
    async function waitForResultGrid(timeout = 8000) {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            if (!window.__inscriptionRunning) return false;
            const grid = document.querySelector('.insc-result-grid');
            if (grid && grid.children.length > 0) {
                await sleep(config.resultAnimationMs);
                return true;
            }
            await sleep(300);
        }
        return false;
    }

    async function waitForResultGridGone(timeout = 10000) {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            if (!window.__inscriptionRunning) return false;
            const grid = document.querySelector('.insc-result-grid');
            if (!grid || grid.children.length === 0 || grid.offsetParent === null) {
                return true;
            }
            await sleep(300);
        }
        return false;
    }

    async function waitForTenPullButton(timeout = 8000) {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            if (!window.__inscriptionRunning) return false;
            const buttons = document.querySelectorAll('.modal-action-btn__text');
            for (const btn of buttons) {
                if (btn.textContent.trim() === '十连灵纹') {
                    const parentBtn = btn.closest('button');
                    if (parentBtn && !parentBtn.disabled && parentBtn.offsetParent !== null) {
                        return true;
                    }
                }
            }
            await sleep(500);
        }
        return false;
    }

    // --- 放弃流程 ---
    async function performDiscard() {
        updateStatusUI('discarding');
        log('开始放弃流程...', 'action');

        const discarded = clickDiscardAll();
        if (!discarded) {
            log('未找到「全部放弃」按钮', 'error');
            const closeBtn = document.querySelector('.modal-close, [class*="close"]');
            if (closeBtn) {
                closeBtn.click();
                log('已关闭结果面板', 'info');
            }
            updateStatusUI('running');
            return false;
        }

        await sleep(500);
        const confirmed = await handleDiscardConfirmDialog(3000);
        if (!confirmed) {
            log('未检测到确认弹窗', 'warn');
        } else {
            log('已确认放弃', 'success');
        }

        await sleep(800);

        if (config.autoCloseDialogs) {
            const continueBtns = document.querySelectorAll('button');
            for (const btn of continueBtns) {
                if (btn.textContent.trim() === '继续') {
                    btn.click();
                    await sleep(300);
                }
            }
        }

        stats.discardedCount++;
        log(`已放弃 (累计: ${stats.discardedCount}) | 等待 ${config.discardDelayMs/1000}s`, 'info');
        await sleep(config.discardDelayMs);

        updateStatusUI('running');
        return true;
    }

    // --- 保留流程 ---
    async function performKeep(results, matches) {
        log('🎉 发现符合要求的铭文！', 'success');
        matches.forEach(m => {
            log(`  ✓ ${m.target} +${m.value} (要求≥${m.required})${m.quality ? ' [' + m.quality + ']' : ''}`, 'success');
        });

        const best = getBestResult(results);
        if (best) {
            log(`  最佳: ${best.stat} +${best.value}${best.quality ? ' [' + best.quality + ']' : ''}`, 'success');
            if (!stats.bestResult || best.value > stats.bestResult.value) {
                stats.bestResult = { quality: best.quality, stat: best.stat, value: best.value };
            }
        }

        stats.keptCount++;
        updateStatsDisplay();

        if (config.notifyOnComplete && Notification.permission === 'granted') {
            new Notification('灵纹洗练完成', {
                body: `第${stats.totalPulls}次十连达成！${matches.map(m => `${m.target}+${m.value}`).join(', ')}`,
                icon: 'https://ling.muge.info/favicon.ico'
            });
        }
    }

    // --- 主洗练循环 ---
    async function startPulling() {
        if (window.__inscriptionRunning) {
            log('洗练已在运行中', 'warn');
            return;
        }

        stats = {
            totalPulls: 0,
            keptCount: 0,
            discardedCount: 0,
            bestResult: null,
            startTime: Date.now(),
        };
        updateStatsDisplay();

        window.__inscriptionRunning = true;
        window.__inscriptionPaused = false;
        updateStatusUI('running');
        startTopMonitor();
        log('=== 开始灵纹洗练 ===', 'success');
        log(`目标: ${config.targetStats.map(t => `${t.stat}≥${t.minValue || 0}`).join(', ')}`, 'info');
        log(`模式: ${config.stopMode === 'any' ? '任一满足' : (config.stopMode === 'all' ? '全部满足' : '永不停')}`, 'info');

        try {
            while (window.__inscriptionRunning) {
                if (window.__inscriptionPaused) {
                    await sleep(1000);
                    continue;
                }

                if (config.maxAttempts > 0 && stats.totalPulls >= config.maxAttempts) {
                    log(`达到最大次数 ${config.maxAttempts}，停止`, 'warn');
                    break;
                }

                ensurePanelOnTop();

                if (config.autoCloseDialogs) {
                    const gridGone = await waitForResultGridGone(5000);
                    if (!gridGone) {
                        const closeBtns = document.querySelectorAll('.modal-close, .btn-close, [class*="close-btn"]');
                        for (const btn of closeBtns) {
                            if (btn.offsetParent !== null) {
                                btn.click();
                                break;
                            }
                        }
                        await sleep(500);
                    }
                }

                const btnAvailable = await waitForTenPullButton(5000);
                if (!btnAvailable) {
                    log('十连按钮不可用，请检查材料', 'error');
                    await sleep(3000);
                    continue;
                }

                const clicked = clickTenPull();
                if (!clicked) {
                    log('未找到十连按钮', 'error');
                    await sleep(3000);
                    continue;
                }

                stats.totalPulls++;
                log(`--- 第 ${stats.totalPulls} 次 ---`, 'action');
                ensurePanelOnTop();

                const appeared = await waitForResultGrid(8000);
                if (!appeared) {
                    log('等待结果超时', 'error');
                    continue;
                }
                ensurePanelOnTop();

                const results = parseResultCards();
                if (results.length === 0) {
                    log('解析失败，尝试放弃...', 'error');
                    await performDiscard();
                    ensurePanelOnTop();
                    continue;
                }

                // 输出结果摘要（不区分品质颜色）
                const summary = results.map(r => `${r.stat}+${r.value}`).join(' ');
                log(summary, 'info');

                const { met, matches, reason } = checkTargetMet(results);

                if (met) {
                    await performKeep(results, matches);
                    break;
                } else {
                    log(`无符合 (${reason})，执行放弃`, 'warn');
                    if (matches.length > 0) {
                        matches.forEach(m => log(`  ~ ${m.target}+${m.value} (不满足≥${m.required})`, 'warn'));
                    }
                    await performDiscard();
                }

                ensurePanelOnTop();
                updateStatsDisplay();
            }
        } catch (e) {
            log('出错: ' + e.message, 'error');
            console.error(e);
        } finally {
            window.__inscriptionRunning = false;
            window.__inscriptionPaused = false;
            updateStatusUI('idle');

            const elapsed = stats.startTime ? Math.round((Date.now() - stats.startTime) / 1000) : 0;
            log(`=== 结束 | ${stats.totalPulls}次 | 达成${stats.keptCount} | ${Math.floor(elapsed/60)}分${elapsed%60}秒 ===`, 'info');
            if (stats.bestResult) {
                log(`最佳: ${stats.bestResult.stat}+${stats.bestResult.value}`, 'success');
            }
        }
    }

    function stopPulling() {
        window.__inscriptionRunning = false;
        window.__inscriptionPaused = false;
        log('手动停止', 'warn');
    }

    function pausePulling() {
        window.__inscriptionPaused = !window.__inscriptionPaused;
        if (window.__inscriptionPaused) {
            log('已暂停', 'warn');
            updateStatusUI('paused');
        } else {
            log('已恢复', 'info');
            updateStatusUI('running');
        }
    }

    function updateStatusUI(status) {
        const statusEl = document.getElementById('inscription-status');
        if (!statusEl) return;

        switch (status) {
            case 'running':
                statusEl.innerHTML = '<span class="ip-status-dot"></span>洗练中';
                statusEl.className = 'status-running';
                break;
            case 'paused':
                statusEl.innerHTML = '<span class="ip-status-dot"></span>暂停';
                statusEl.className = 'status-paused';
                break;
            case 'discarding':
                statusEl.innerHTML = '<span class="ip-status-dot"></span>放弃中';
                statusEl.className = 'status-discarding';
                break;
            case 'idle':
            default:
                statusEl.innerHTML = '<span class="ip-status-dot"></span>待命';
                statusEl.className = 'status-idle';
                break;
        }
    }

    function updateStatsDisplay() {
        const totalEl = document.getElementById('inscription-stat-total');
        const keptEl = document.getElementById('inscription-stat-kept');
        const bestEl = document.getElementById('inscription-stat-best');

        if (totalEl) totalEl.textContent = stats.totalPulls;
        if (keptEl) keptEl.textContent = stats.keptCount;
        if (bestEl && stats.bestResult) {
            bestEl.textContent = `${stats.bestResult.stat}+${stats.bestResult.value}`;
        }
    }

    // --- 保存面板位置 ---
    function savePanelPosition(panel) {
        config.panelPosition = {
            top: parseInt(panel.style.top) || panel.offsetTop,
            left: parseInt(panel.style.left) || panel.offsetLeft
        };
        clearTimeout(window.__savePosTimeout);
        window.__savePosTimeout = setTimeout(() => saveConfig(config), 500);
    }

    function toggleMinimized(forceState) {
        const panel = document.getElementById('inscription-panel');
        if (!panel) return;

        if (typeof forceState === 'boolean') {
            config.minimized = forceState;
        } else {
            config.minimized = !config.minimized;
        }

        const body = document.getElementById('inscription-body');
        const arrow = document.getElementById('inscription-minimize');

        if (config.minimized) {
            panel.classList.add('minimized');
            if (arrow) arrow.innerHTML = '&#x25B6;';
            panel.style.width = 'auto';
            panel.style.minWidth = isMobile ? '150px' : '180px';
        } else {
            panel.classList.remove('minimized');
            if (arrow) arrow.innerHTML = '&#x25BC;';
            panel.style.width = PANEL_WIDTH + 'px';
            panel.style.minWidth = '';
        }

        saveConfig(config);
    }

    function createPanel() {
        const existing = document.getElementById('inscription-panel');
        if (existing) existing.remove();

        const panel = document.createElement('div');
        panel.id = 'inscription-panel';
        panel.style.setProperty('z-index', '2147483647', 'important');
        panel.style.setProperty('position', 'fixed', 'important');
        panel.style.setProperty('pointer-events', 'auto', 'important');

        panel.style.top = (config.panelPosition.top || 10) + 'px';
        panel.style.left = (config.panelPosition.left || 10) + 'px';

        panel.innerHTML = `
            <div class="ip-line"></div>
            <div id="inscription-header">
                <span class="ip-header-title">灵纹洗练</span>
                <div class="ip-header-right">
                    <span id="inscription-status" class="status-idle">
                        <span class="ip-status-dot"></span>
                        待命
                    </span>
                    <span id="inscription-minimize" title="缩小">&#x25BC;</span>
                </div>
            </div>
            <div id="inscription-body">
                <div id="inscription-stats">
                    <div class="ip-stat">
                        <div class="ip-stat-value" id="inscription-stat-total">0</div>
                        <div class="ip-stat-label">次数</div>
                    </div>
                    <div class="ip-stat">
                        <div class="ip-stat-value" id="inscription-stat-kept">0</div>
                        <div class="ip-stat-label">达成</div>
                    </div>
                    <div class="ip-stat">
                        <div class="ip-stat-value" id="inscription-stat-best">-</div>
                        <div class="ip-stat-label">最佳</div>
                    </div>
                </div>
                <div id="inscription-log"></div>
                <div>
                    <button id="inscription-start" class="ip-btn ip-btn-start">${isMobile ? '开始' : '开始洗练'}</button>
                    <button id="inscription-pause" class="ip-btn ip-btn-pause">暂停</button>
                    <button id="inscription-stop" class="ip-btn ip-btn-stop">停止</button>
                    <button id="inscription-config-btn" class="ip-btn ip-btn-config">配置</button>
                    <button id="inscription-clear" class="ip-btn ip-btn-clear">清</button>
                </div>
            </div>
        `;
        panel.onclick = function (e) { e.stopPropagation(); };
        document.body.appendChild(panel);

        if (isMobile) {
            panel.classList.add('mobile-compact');
        }

        if (config.minimized) {
            panel.classList.add('minimized');
            panel.style.width = 'auto';
            panel.style.minWidth = isMobile ? '150px' : '180px';
            const arrow = document.getElementById('inscription-minimize');
            if (arrow) arrow.innerHTML = '&#x25B6;';
        }

        window.__inscriptionRunning = false;
        window.__inscriptionPaused = false;

        // --- 拖拽功能 ---
        let isDragging = false;
        let startX, startY, initialLeft, initialTop;
        const header = document.getElementById('inscription-header');

        const startDrag = (clientX, clientY) => {
            isDragging = true;
            startX = clientX;
            startY = clientY;
            initialLeft = panel.offsetLeft;
            initialTop = panel.offsetTop;
            panel.style.left = initialLeft + 'px';
            panel.style.top = initialTop + 'px';
            panel.style.right = 'auto';
        };
        const doDrag = (clientX, clientY) => {
            if (!isDragging) return;
            panel.style.left = (initialLeft + clientX - startX) + 'px';
            panel.style.top = (initialTop + clientY - startY) + 'px';
        };
        const endDrag = () => {
            if (!isDragging) return;
            isDragging = false;
            savePanelPosition(panel);
        };

        header.addEventListener('mousedown', (e) => {
            if (e.target.id && (e.target.id.includes('status') || e.target.id.includes('minimize'))) return;
            startDrag(e.clientX, e.clientY);
            e.preventDefault();
        });
        document.addEventListener('mousemove', (e) => doDrag(e.clientX, e.clientY));
        document.addEventListener('mouseup', endDrag);

        header.addEventListener('touchstart', (e) => {
            if (e.target.id && (e.target.id.includes('status') || e.target.id.includes('minimize'))) return;
            startDrag(e.touches[0].clientX, e.touches[0].clientY);
            e.preventDefault();
        }, { passive: false });
        document.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            doDrag(e.touches[0].clientX, e.touches[0].clientY);
            e.preventDefault();
        }, { passive: false });
        document.addEventListener('touchend', endDrag);

        // 最小化
        document.getElementById('inscription-minimize').addEventListener('click', (e) => {
            toggleMinimized();
            e.stopPropagation();
        });

        // 双击头部切换
        header.addEventListener('dblclick', (e) => {
            if (e.target.id && (e.target.id.includes('status') || e.target.id.includes('minimize'))) return;
            toggleMinimized();
            e.stopPropagation();
        });

        // 日志
        window.__inscriptionLog = function (msg, type) {
            const logEl = document.getElementById('inscription-log');
            if (!logEl) return;
            const line = document.createElement('div');
            line.className = `ip-log-line${type ? ` log-${type}` : ''}`;
            line.innerHTML = `<span class="ip-log-time">[${new Date().toLocaleTimeString()}]</span> <span class="ip-log-content">${msg}</span>`;
            logEl.appendChild(line);
            logEl.scrollTop = logEl.scrollHeight;
            while (logEl.children.length > 100) logEl.removeChild(logEl.firstChild);
        };

        // 按钮事件
        document.getElementById('inscription-start').addEventListener('click', (e) => {
            if (!window.__inscriptionRunning) startPulling();
            e.stopPropagation();
        });
        document.getElementById('inscription-pause').addEventListener('click', (e) => {
            if (window.__inscriptionRunning) pausePulling();
            e.stopPropagation();
        });
        document.getElementById('inscription-stop').addEventListener('click', (e) => {
            stopPulling();
            e.stopPropagation();
        });
        document.getElementById('inscription-clear').addEventListener('click', (e) => {
            const logEl = document.getElementById('inscription-log');
            if (logEl) logEl.innerHTML = '';
            e.stopPropagation();
        });
        document.getElementById('inscription-config-btn').addEventListener('click', (e) => {
            toggleConfigPanel();
            e.stopPropagation();
        });

        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }

        ensurePanelOnTop();
        log('灵纹洗练面板已加载', 'info');
        log('仅按属性名和数值判断，不限品质', 'info');
        if (isMobile) log('手机端 | 双击标题栏折叠 | 拖拽移动', 'info');
    }

    // --- 配置面板 ---
    let configPanelEl = null;
    function toggleConfigPanel() {
        if (configPanelEl) {
            configPanelEl.remove();
            configPanelEl = null;
            return;
        }

        const panel = document.createElement('div');
        panel.id = 'inscription-config-panel';
        const cfg = JSON.parse(JSON.stringify(config));
        panel.innerHTML = `
            <div class="ic-header">
                <span class="ic-title">洗练配置</span>
                <span class="ic-close">&times;</span>
            </div>

            <div class="ic-section">
                <div class="ic-section-label">目标属性（不限品质，只看属性和数值）</div>
                <div id="ic-target-list" class="affix-list">
                    ${cfg.targetStats.map((t, i) => `
                        <div class="affix-row" draggable="true" data-idx="${i}">
                            <span class="affix-handle" title="排序">⠿</span>
                            <select class="target-stat-select">
                                <option value="攻击" ${t.stat === '攻击' ? 'selected' : ''}>攻击</option>
                                <option value="防御" ${t.stat === '防御' ? 'selected' : ''}>防御</option>
                                <option value="气血" ${t.stat === '气血' ? 'selected' : ''}>气血</option>
                                <option value="神识" ${t.stat === '神识' ? 'selected' : ''}>神识</option>
                            </select>
                            <span style="font-size:${isMobile?'9px':'11px'};color:var(--ip-text-muted);">≥</span>
                            <input class="affix-value" type="number" value="${t.minValue || 0}" min="0" placeholder="值">
                            <span class="affix-del" title="删除">&times;</span>
                        </div>
                    `).join('')}
                </div>
                <div class="affix-add" id="ic-target-add">+ 添加</div>
            </div>

            <div class="ic-section">
                <div class="ic-section-label">设置</div>
                <div class="ic-row">
                    <label class="ic-label">停止模式</label>
                    <select id="ic-stopMode" style="width:100%;">
                        <option value="any" ${cfg.stopMode === 'any' ? 'selected' : ''}>任一满足即停</option>
                        <option value="all" ${cfg.stopMode === 'all' ? 'selected' : ''}>全部满足才停</option>
                        <option value="manual" ${cfg.stopMode === 'manual' ? 'selected' : ''}>永不停</option>
                    </select>
                </div>
                <div class="ic-row">
                    <label class="ic-label">最大次数 <span class="ic-hint">0=无限</span></label>
                    <input id="ic-maxAttempts" type="number" value="${cfg.maxAttempts}" min="0">
                </div>
                <div class="ic-row" style="display:flex;gap:4px;">
                    <div style="flex:1;">
                        <label class="ic-label">动画等待(ms)</label>
                        <input id="ic-resultAnim" type="number" value="${cfg.resultAnimationMs}" min="500" max="5000">
                    </div>
                    <div style="flex:1;">
                        <label class="ic-label">放弃等待(ms)</label>
                        <input id="ic-discardDelay" type="number" value="${cfg.discardDelayMs}" min="500" max="10000">
                    </div>
                </div>
            </div>

            <div class="ic-section">
                <div class="ic-section-label">选项</div>
                <div class="ic-row ic-checkbox-row">
                    <input id="ic-autoDialog" type="checkbox" ${cfg.autoCloseDialogs ? 'checked' : ''}>
                    <label class="ic-label" style="margin:0;">自动关闭弹窗</label>
                </div>
                <div class="ic-row ic-checkbox-row">
                    <input id="ic-notify" type="checkbox" ${cfg.notifyOnComplete ? 'checked' : ''}>
                    <label class="ic-label" style="margin:0;">浏览器通知</label>
                </div>
            </div>

            <div class="ic-bottom-bar">
                <button id="ic-save" class="ic-btn ic-btn-save">保存</button>
                <button id="ic-reset" class="ic-btn ic-btn-reset">重置</button>
            </div>
        `;

        const inscriptionPanel = document.getElementById('inscription-panel');
        inscriptionPanel.appendChild(panel);
        configPanelEl = panel;

        panel.querySelector('.ic-close').addEventListener('click', () => {
            autoSave();
            panel.remove();
            configPanelEl = null;
        });

        function autoSave() {
            try {
                config.stopMode = document.getElementById('ic-stopMode').value;
                config.maxAttempts = parseInt(document.getElementById('ic-maxAttempts').value) || 0;
                config.resultAnimationMs = parseInt(document.getElementById('ic-resultAnim').value) || 1500;
                config.discardDelayMs = parseInt(document.getElementById('ic-discardDelay').value) || 2000;
                config.autoCloseDialogs = document.getElementById('ic-autoDialog').checked;
                config.notifyOnComplete = document.getElementById('ic-notify').checked;

                const rows = document.querySelectorAll('#ic-target-list .affix-row');
                const targetStats = [];
                rows.forEach(row => {
                    const stat = row.querySelector('.target-stat-select').value;
                    const minValue = parseInt(row.querySelector('.affix-value').value) || 0;
                    targetStats.push({ stat, minValue });
                });
                if (targetStats.length === 0) {
                    log('请至少添加一个目标属性', 'error');
                    return;
                }
                config.targetStats = targetStats;

                saveConfig(config);
                log('配置已保存', 'success');
            } catch (e) {
                log('保存失败: ' + e.message, 'error');
            }
        }

        ['ic-stopMode', 'ic-maxAttempts', 'ic-resultAnim', 'ic-discardDelay'].forEach(id => {
            document.getElementById(id)?.addEventListener('change', autoSave);
        });
        ['ic-autoDialog', 'ic-notify'].forEach(id => {
            document.getElementById(id)?.addEventListener('change', autoSave);
        });
        document.getElementById('ic-save')?.addEventListener('click', autoSave);
        document.getElementById('ic-reset')?.addEventListener('click', () => {
            config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
            saveConfig(config);
            panel.remove();
            configPanelEl = null;
            log('已重置', 'warn');
        });

        // 目标属性列表
        const list = document.getElementById('ic-target-list');
        const STAT_OPTIONS = ['攻击', '防御', '气血', '神识'];

        function makeTargetRow(stat = '攻击', minValue = 0) {
            const row = document.createElement('div');
            row.className = 'affix-row';
            row.draggable = true;
            row.innerHTML = `
                <span class="affix-handle" title="排序">⠿</span>
                <select class="target-stat-select">
                    ${STAT_OPTIONS.map(s => `<option value="${s}" ${s === stat ? 'selected' : ''}>${s}</option>`).join('')}
                </select>
                <span style="font-size:${isMobile?'9px':'11px'};color:var(--ip-text-muted);">≥</span>
                <input class="affix-value" type="number" value="${minValue}" min="0" placeholder="值">
                <span class="affix-del" title="删除">&times;</span>
            `;
            bindTargetRowEvents(row);
            return row;
        }

        function bindTargetRowEvents(row) {
            row.querySelector('.affix-del').addEventListener('click', () => { row.remove(); autoSave(); });
            row.querySelector('.target-stat-select').addEventListener('change', autoSave);
            row.querySelector('.affix-value').addEventListener('change', autoSave);
            row.addEventListener('dragstart', e => {
                row.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            });
            row.addEventListener('dragend', () => { row.classList.remove('dragging'); autoSave(); });
            row.addEventListener('dragover', e => {
                e.preventDefault();
                const dragging = list.querySelector('.dragging');
                if (dragging && dragging !== row) {
                    const rect = row.getBoundingClientRect();
                    list.insertBefore(dragging, e.clientY < rect.top + rect.height / 2 ? row : row.nextSibling);
                }
            });
        }

        list.querySelectorAll('.affix-row').forEach(bindTargetRowEvents);
        document.getElementById('ic-target-add').addEventListener('click', () => {
            const row = makeTargetRow();
            list.appendChild(row);
        });
    }

    // --- DOM 监控 ---
    function startDOMMonitor() {
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    const panel = document.getElementById('inscription-panel');
                    if (panel && panel.parentElement !== document.body) {
                        document.body.appendChild(panel);
                    }
                }
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    function init() {
        const checkReady = () => {
            if (document.body) {
                createPanel();
                ensurePanelOnTop();
                startDOMMonitor();
                startTopMonitor();
                setTimeout(ensurePanelOnTop, 500);
                setTimeout(ensurePanelOnTop, 2000);
            } else {
                setTimeout(checkReady, 500);
            }
        };
        checkReady();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();