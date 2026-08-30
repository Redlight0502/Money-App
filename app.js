// app.js
import { LedgerStorage } from './storage.js';

let currentType = 'expense';
let searchQuery = '';

document.addEventListener('DOMContentLoaded', () => {
    LedgerStorage.init();
    document.getElementById('date').valueAsDate = new Date();
    setupEvents();
    updateCategories();
    render();
});

function setupEvents() {
    const legacyInput = document.getElementById('legacyFileInput');
    const importJsonInput = document.getElementById('importJsonInput');

    // 資料管理面板收合
    const dataMenuBtn = document.getElementById('dataMenuBtn');
    const dataPanel = document.getElementById('dataPanel');
    const closeDataPanel = document.getElementById('closeDataPanel');

    dataMenuBtn.addEventListener('click', () => dataPanel.classList.toggle('hidden'));
    closeDataPanel.addEventListener('click', () => dataPanel.classList.add('hidden'));

    // 匯出與匯入按鈕綁定
    document.getElementById('exportJsonBtn').addEventListener('click', () => LedgerStorage.exportJson());
    document.getElementById('exportCsvBtn').addEventListener('click', () => LedgerStorage.exportCsv());
    
    document.getElementById('importJsonBtn').addEventListener('click', () => importJsonInput.click());
    importJsonInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        LedgerStorage.loadFromLegacyFile(file, (success, msg) => {
            if (success) {
                alert('成功匯入資料！');
                render();
            } else {
                alert('匯入失敗：檔案格式不正確');
            }
        });
    });

    document.getElementById('clearDataBtn').addEventListener('click', () => {
        if (confirm('確定要清空所有記帳記錄嗎？此動作無法復原！')) {
            LedgerStorage.clearAll();
            render();
            alert('已清空所有記錄');
        }
    });

    // 連結檔案
    document.getElementById('connectBtn').addEventListener('click', async () => {
        await LedgerStorage.connectFile(legacyInput, (success, name) => {
            updateStatusBadge(success, name);
        });
    });

    legacyInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        LedgerStorage.loadFromLegacyFile(file, (success, msg) => {
            updateStatusBadge(success, msg);
        });
    });

    // 搜尋即時過濾
    document.getElementById('searchInput').addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        render();
    });

    document.getElementById('typeExpense').addEventListener('click', () => switchType('expense'));
    document.getElementById('typeIncome').addEventListener('click', () => switchType('income'));

    // 快速加減金額按鈕
    document.querySelectorAll('.calc-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            const input = document.getElementById('amount');
            let current = parseFloat(input.value) || 0;
            const val = parseFloat(action);
            
            current += val;
            input.value = current > 0 ? current.toFixed(2) : '';
            input.classList.add('pulse-num');
            setTimeout(() => input.classList.remove('pulse-num'), 300);
        });
    });

    document.getElementById('ledgerForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const amount = parseFloat(document.getElementById('amount').value);
        if (!amount || amount <= 0) return;

        const category = document.getElementById('category').value;
        const date = document.getElementById('date').value;
        const note = document.getElementById('note').value;

        LedgerStorage.addRecord({
            id: Date.now(),
            type: currentType,
            amount,
            category,
            date,
            note
        });

        render();
        document.getElementById('amount').value = '';
        document.getElementById('note').value = '';
        document.getElementById('date').valueAsDate = new Date();
    });
}

function updateStatusBadge(success, name) {
    const badge = document.getElementById('statusBadge');
    if (success) {
        badge.className = "flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[11px] font-semibold spring-in";
        badge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> 已同步: ${name}`;
    }
}

function switchType(type) {
    currentType = type;
    const expBtn = document.getElementById('typeExpense');
    const incBtn = document.getElementById('typeIncome');
    const submitBtn = document.getElementById('submitBtn');

    updateCategories();

    if (type === 'expense') {
        expBtn.className = "flex-1 py-1.5 rounded-xl bg-white/10 text-white font-bold shadow-sm transition-all text-xs";
        incBtn.className = "flex-1 py-1.5 rounded-xl text-gray-400 hover:text-white font-medium transition-all text-xs";
        submitBtn.className = "w-full py-3 bg-gradient-to-r from-gray-100 to-gray-300 text-gray-900 font-extrabold rounded-2xl transition hover:opacity-90 tap-effect text-xs tracking-wide shadow-lg shadow-white/5";
        submitBtn.textContent = "確認記錄支出";
    } else {
        incBtn.className = "flex-1 py-1.5 rounded-xl bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-500/20 transition-all text-xs";
        expBtn.className = "flex-1 py-1.5 rounded-xl text-gray-400 hover:text-white font-medium transition-all text-xs";
        submitBtn.className = "w-full py-3 bg-gradient-to-r from-emerald-400 to-emerald-600 text-white font-extrabold rounded-2xl transition hover:opacity-90 tap-effect text-xs tracking-wide shadow-lg shadow-emerald-500/20";
        submitBtn.textContent = "確認記錄收入";
    }
}

function updateCategories() {
    const select = document.getElementById('category');
    select.innerHTML = '';
    const list = currentType === 'expense' ? LedgerStorage.expenseCategories : LedgerStorage.incomeCategories;
    list.forEach(item => {
        const opt = document.createElement('option');
        opt.value = item.name;
        opt.textContent = `${item.icon} ${item.name}`;
        select.appendChild(opt);
    });
}

function createRollingNumber(targetNum) {
    const container = document.createElement('span');
    container.className = "odometer-container";

    const formattedStr = (targetNum < 0 ? '-' : '') + '$' + Math.abs(targetNum).toFixed(2);

    [...formattedStr].forEach(char => {
        const span = document.createElement('span');
        if (!isNaN(char)) {
            span.className = "odometer-digit-col";
            span.innerHTML = `
                <span class="odometer-digit">0</span>
                <span class="odometer-digit">1</span>
                <span class="odometer-digit">2</span>
                <span class="odometer-digit">3</span>
                <span class="odometer-digit">4</span>
                <span class="odometer-digit">5</span>
                <span class="odometer-digit">6</span>
                <span class="odometer-digit">7</span>
                <span class="odometer-digit">8</span>
                <span class="odometer-digit">9</span>
            `;
            setTimeout(() => {
                span.style.transform = `translateY(-${parseInt(char) * 1.1}em)`;
            }, 50);
        } else {
            span.className = "odometer-digit";
            span.style.display = "inline-flex";
            span.textContent = char;
        }
        container.appendChild(span);
    });

    return container;
}

function render() {
    const listEl = document.getElementById('recordList');
    const balanceContainer = document.getElementById('netBalanceContainer');
    const countEl = document.getElementById('recordCount');
    const monthIncomeEl = document.getElementById('monthIncome');
    const monthExpenseEl = document.getElementById('monthExpense');

    listEl.innerHTML = '';
    const balance = LedgerStorage.calculateBalance();
    const stats = LedgerStorage.getMonthStats();
    
    monthIncomeEl.textContent = `$${stats.income.toFixed(2)}`;
    monthExpenseEl.textContent = `$${stats.expense.toFixed(2)}`;

    let items = LedgerStorage.expenses;
    if (searchQuery) {
        items = items.filter(item => 
            item.category.toLowerCase().includes(searchQuery) ||
            (item.note && item.note.toLowerCase().includes(searchQuery)) ||
            item.date.includes(searchQuery)
        );
    }

    countEl.textContent = `${items.length} 筆`;

    if (items.length === 0) {
        listEl.innerHTML = `<div class="text-center text-gray-500 text-xs py-12 spring-in font-medium">✨ 沒有找到相關的交易紀錄</div>`;
        balanceContainer.innerHTML = '';
        balanceContainer.appendChild(createRollingNumber(0));
        balanceContainer.className = `text-3xl font-black tracking-tight text-white`;
        return;
    }

    items.forEach((item, index) => {
        const isInc = item.type === 'income';
        const div = document.createElement('div');
        div.className = "spring-in flex items-center justify-between p-3 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] rounded-2xl transition-all group";
        div.style.animationDelay = `${Math.min(index * 0.03, 0.25)}s`;
        
        div.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-xl flex items-center justify-center text-xs ${isInc ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-gray-800 text-gray-300 border border-white/5'}">
                    ${isInc ? '＋' : '・'}
                </div>
                <div>
                    <div class="font-bold text-gray-200 text-xs flex items-center gap-2">
                        ${item.category} 
                        <span class="text-[10px] text-gray-500 font-normal">${item.date}</span>
                    </div>
                    <div class="text-[11px] text-gray-400 mt-0.5">${item.note || '無備註'}</div>
                </div>
            </div>
            <div class="flex items-center gap-3">
                <span class="font-extrabold text-xs tracking-tight ${isInc ? 'text-emerald-400' : 'text-gray-100'}">
                    ${isInc ? '+' : '-'}$${item.amount.toFixed(2)}
                </span>
                <button data-id="${item.id}" class="del-btn text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1 tap-effect">✕</button>
            </div>
        `;

        div.querySelector('.del-btn').addEventListener('click', () => {
            div.classList.add('slide-out');
            setTimeout(() => {
                LedgerStorage.deleteRecord(item.id);
                render();
            }, 200);
        });

        listEl.appendChild(div);
    });

    balanceContainer.innerHTML = '';
    balanceContainer.appendChild(createRollingNumber(balance));
    balanceContainer.className = `text-3xl font-black tracking-tight ${balance >= 0 ? 'text-white' : 'text-rose-400'}`;
}
