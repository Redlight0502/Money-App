let editingType = 'expense';
let currentType = 'expense';
let currentAccountFilter = 'ALL';
let currentSortOrder = 'manual';
let searchQuery = '';
let analyticsChartInstance = null;

const numberCache = {};

/** Smooth Number Rolling Animation Utility */
function animateNumber(elementId, targetValue, duration = 600, prefix = '$', decimals = 2) {
    const el = typeof elementId === 'string' ? document.getElementById(elementId) : elementId;
    if (!el) return;
    
    const startValue = numberCache[elementId] !== undefined ? numberCache[elementId] : 0;
    numberCache[elementId] = targetValue;
    
    const startTime = performance.now();
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const current = startValue + (targetValue - startValue) * easeProgress;
        
        const isNegative = current < 0;
        const formatted = Math.abs(current).toLocaleString(undefined, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
        
        el.textContent = `${isNegative ? '-' : ''}${prefix}${formatted}`;
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    requestAnimationFrame(update);
}

function switchType(type) {
    currentType = type;
    const exp = document.getElementById('typeExpense');
    const inc = document.getElementById('typeIncome');
    const trf = document.getElementById('typeTransfer');
    const catAccGrid = document.getElementById('categoryAccountGrid');
    const trfAccGrid = document.getElementById('transferAccountGrid');
    const submitBtn = document.getElementById('submitBtn');

    exp.className = "flex-1 py-1 rounded-lg text-gray-400 font-medium text-[11px]";
    inc.className = "flex-1 py-1 rounded-lg text-gray-400 font-medium text-[11px]";
    trf.className = "flex-1 py-1 rounded-lg text-gray-400 font-medium text-[11px]";

    if (type === 'transfer') {
        catAccGrid.classList.add('hidden');
        trfAccGrid.classList.remove('hidden');
        trf.className = "flex-1 py-1 rounded-lg bg-purple-600 text-white font-bold text-[11px]";
        submitBtn.textContent = "確認帳戶轉帳";
    } else {
        catAccGrid.classList.remove('hidden');
        trfAccGrid.classList.add('hidden');
        updateCategories();
        if (type === 'expense') {
            exp.className = "flex-1 py-1 rounded-lg bg-white/10 text-white font-bold text-[11px]";
            submitBtn.textContent = "確認記錄支出";
        }
        if (type === 'income') {
            inc.className = "flex-1 py-1 rounded-lg bg-emerald-500 text-white font-bold text-[11px]";
            submitBtn.textContent = "確認記錄收入";
        }
    }
}

function switchEditType(type) {
    editingType = type;
    const exp = document.getElementById('editTypeExpense');
    const inc = document.getElementById('editTypeIncome');
    const trf = document.getElementById('editTypeTransfer');
    const catAccGrid = document.getElementById('editCategoryAccountGrid');
    const trfAccGrid = document.getElementById('editTransferAccountGrid');

    exp.className = "flex-1 py-1 rounded-lg text-gray-400 font-medium text-[11px]";
    inc.className = "flex-1 py-1 rounded-lg text-gray-400 font-medium text-[11px]";
    trf.className = "flex-1 py-1 rounded-lg text-gray-400 font-medium text-[11px]";

    if (type === 'transfer') {
        catAccGrid.classList.add('hidden');
        trfAccGrid.classList.remove('hidden');
        trf.className = "flex-1 py-1 rounded-lg bg-purple-600 text-white font-bold text-[11px]";
    } else {
        catAccGrid.classList.remove('hidden');
        trfAccGrid.classList.add('hidden');
        updateEditCategories();
        if (type === 'expense') exp.className = "flex-1 py-1 rounded-lg bg-white/10 text-white font-bold text-[11px]";
        if (type === 'income') inc.className = "flex-1 py-1 rounded-lg bg-emerald-500 text-white font-bold text-[11px]";
    }
}

function openEditModal(record) {
    document.getElementById('editId').value = record.id;
    document.getElementById('editAmount').value = record.amount;
    document.getElementById('editCurrency').value = record.currency || 'HKD';
    document.getElementById('editDate').value = record.date;
    document.getElementById('editNote').value = record.note || '';
    document.getElementById('editTags').value = record.tags || '';
    
    switchEditType(record.type || 'expense');
    
    if (record.type === 'transfer') {
        document.getElementById('editFromAccount').value = record.account || 'FPS';
        document.getElementById('editToAccount').value = record.toAccount || 'Octopus';
    } else {
        updateEditCategories();
        document.getElementById('editCategory').value = record.category;
        document.getElementById('editAccount').value = record.account;
    }
    document.getElementById('panelEdit').classList.remove('hidden');
}

function closeEditModal() {
    document.getElementById('panelEdit').classList.add('hidden');
}

function updateCategories() {
    const select = document.getElementById('category');
    if (!select) return;
    select.innerHTML = '';
    const list = currentType === 'income' ? QuantumLedger.incomeCategories : QuantumLedger.expenseCategories;
    list.forEach(item => {
        const opt = document.createElement('option');
        opt.value = item.name;
        opt.textContent = `${item.icon} ${item.name}`;
        select.appendChild(opt);
    });
}

function updateEditCategories() {
    const select = document.getElementById('editCategory');
    if (!select) return;
    select.innerHTML = '';
    const list = editingType === 'income' ? QuantumLedger.incomeCategories : QuantumLedger.expenseCategories;
    list.forEach(item => {
        const opt = document.createElement('option');
        opt.value = item.name;
        opt.textContent = `${item.icon} ${item.name}`;
        select.appendChild(opt);
    });
}

function closeAllPanels() {
    const panels = {
        config: document.getElementById('panelConfig'),
        charts: document.getElementById('panelCharts'),
        sub: document.getElementById('panelSub'),
        debt: document.getElementById('panelDebt'),
        wish: document.getElementById('panelWish')
    };
    Object.values(panels).forEach(p => p && p.classList.add('hidden'));
}

document.addEventListener('DOMContentLoaded', () => {
    const panels = {
        config: document.getElementById('panelConfig'),
        charts: document.getElementById('panelCharts'),
        sub: document.getElementById('panelSub'),
        debt: document.getElementById('panelDebt'),
        wish: document.getElementById('panelWish')
    };

    document.getElementById('menuConfig').addEventListener('click', () => { const isOpen = !panels.config.classList.contains('hidden'); closeAllPanels(); if(!isOpen) panels.config.classList.remove('hidden'); });
    document.getElementById('closeConfig').addEventListener('click', () => panels.config.classList.add('hidden'));

    document.getElementById('menuCharts').addEventListener('click', () => { const isOpen = !panels.charts.classList.contains('hidden'); closeAllPanels(); if(!isOpen) { panels.charts.classList.remove('hidden'); renderAnalyticsChart(); } });
    document.getElementById('closeCharts').addEventListener('click', () => panels.charts.classList.add('hidden'));

    document.getElementById('menuSub').addEventListener('click', () => { const isOpen = !panels.sub.classList.contains('hidden'); closeAllPanels(); if(!isOpen) { panels.sub.classList.remove('hidden'); renderSubList(); } });
    document.getElementById('closeSub').addEventListener('click', () => panels.sub.classList.add('hidden'));

    document.getElementById('menuDebt').addEventListener('click', () => { const isOpen = !panels.debt.classList.contains('hidden'); closeAllPanels(); if(!isOpen) { panels.debt.classList.remove('hidden'); renderDebtList(); } });
    document.getElementById('closeDebt').addEventListener('click', () => panels.debt.classList.add('hidden'));

    document.getElementById('menuWish').addEventListener('click', () => { const isOpen = !panels.wish.classList.contains('hidden'); closeAllPanels(); if(!isOpen) { panels.wish.classList.remove('hidden'); renderWishList(); } });
    document.getElementById('closeWish').addEventListener('click', () => panels.wish.classList.add('hidden'));

    // Edit Panel Events
    document.getElementById('closeEdit').addEventListener('click', closeEditModal);
    document.getElementById('editTypeExpense').addEventListener('click', () => switchEditType('expense'));
    document.getElementById('editTypeIncome').addEventListener('click', () => switchEditType('income'));
    document.getElementById('editTypeTransfer').addEventListener('click', () => switchEditType('transfer'));

    document.getElementById('saveEditBtn').addEventListener('click', () => {
        const id = document.getElementById('editId').value;
        const amount = parseFloat(document.getElementById('editAmount').value);
        if (!amount || amount <= 0) {
            alert('請輸入有效金額！');
            return;
        }

        const isTransfer = editingType === 'transfer';
        const fromAccount = isTransfer ? document.getElementById('editFromAccount').value : document.getElementById('editAccount').value;
        const toAccount = isTransfer ? document.getElementById('editToAccount').value : null;

        if (isTransfer && fromAccount === toAccount) {
            alert('轉出與轉入帳戶不能相同！');
            return;
        }

        QuantumLedger.updateRecord({
            id: id,
            type: editingType,
            amount: amount,
            currency: document.getElementById('editCurrency').value,
            category: isTransfer ? '帳戶互轉' : document.getElementById('editCategory').value,
            account: fromAccount,
            toAccount: toAccount,
            date: document.getElementById('editDate').value,
            note: document.getElementById('editNote').value,
            tags: document.getElementById('editTags').value
        });

        closeEditModal();
        render();
    });

    const tabManual = document.getElementById('tabManual');
    const tabAi = document.getElementById('tabAi');
    const manualContainer = document.getElementById('manualInputContainer');
    const aiContainer = document.getElementById('aiInputContainer');

    tabAi.addEventListener('click', () => {
        tabAi.className = "flex-1 py-1 rounded-lg tab-active font-bold text-xs transition";
        tabManual.className = "flex-1 py-1 rounded-lg text-gray-400 font-medium text-xs transition";
        aiContainer.classList.remove('hidden');
        manualContainer.classList.add('hidden');
    });

    tabManual.addEventListener('click', () => {
        tabManual.className = "flex-1 py-1 rounded-lg tab-active font-bold text-xs transition";
        tabAi.className = "flex-1 py-1 rounded-lg text-gray-400 font-medium text-xs transition";
        manualContainer.classList.remove('hidden');
        aiContainer.classList.add('hidden');
    });

    document.getElementById('aiSubmitBtn').addEventListener('click', () => {
        const textVal = document.getElementById('aiText').value;
        const record = parseAiText(textVal);
        if (!record) { alert('無法解析金額！'); return; }
        QuantumLedger.addRecord(record);
        document.getElementById('aiText').value = '';
        render();
    });

    document.getElementById('searchInput').addEventListener('input', (e) => { searchQuery = e.target.value.toLowerCase().trim(); render(); });
    document.getElementById('filterAccount').addEventListener('change', (e) => { currentAccountFilter = e.target.value; render(); });
    document.getElementById('sortOrder').addEventListener('change', (e) => { currentSortOrder = e.target.value; render(); });

    document.getElementById('typeExpense').addEventListener('click', () => switchType('expense'));
    document.getElementById('typeIncome').addEventListener('click', () => switchType('income'));
    document.getElementById('typeTransfer').addEventListener('click', () => switchType('transfer'));

    document.querySelectorAll('.calc-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const input = document.getElementById('amount');
            let val = parseFloat(input.value) || 0;
            val += parseFloat(e.target.dataset.action);
            input.value = val > 0 ? val.toFixed(2) : '';
        });
    });

    document.getElementById('ledgerForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const amount = parseFloat(document.getElementById('amount').value);
        if (!amount || amount <= 0) return;

        const isTransfer = currentType === 'transfer';
        const fromAccount = isTransfer ? document.getElementById('fromAccount').value : document.getElementById('account').value;
        const toAccount = isTransfer ? document.getElementById('toAccount').value : null;

        if (isTransfer && fromAccount === toAccount) {
            alert('轉出與轉入帳戶不能相同！');
            return;
        }

        QuantumLedger.addRecord({
            id: generateUniqueId(),
            type: currentType,
            amount,
            currency: document.getElementById('currency').value,
            category: isTransfer ? '帳戶互轉' : document.getElementById('category').value,
            account: fromAccount,
            toAccount: toAccount,
            date: document.getElementById('date').value,
            note: document.getElementById('note').value,
            tags: document.getElementById('tags').value
        });

        render();
        document.getElementById('amount').value = '';
        document.getElementById('note').value = '';
        document.getElementById('tags').value = '';
        document.getElementById('date').valueAsDate = new Date();
    });

    document.getElementById('recordList').addEventListener('click', (e) => {
        const delBtn = e.target.closest('.del-btn');
        const editBtn = e.target.closest('.edit-btn');

        if (delBtn) {
            e.stopPropagation();
            const id = delBtn.getAttribute('data-id');
            QuantumLedger.deleteRecord(id);
            render();
        } else if (editBtn) {
            e.stopPropagation();
            const id = editBtn.getAttribute('data-id');
            const record = QuantumLedger.expenses.find(x => String(x.id) === String(id));
            if (record) openEditModal(record);
        }
    });

    initSmoothMobileDrag();
    updateCategories();
    document.getElementById('date').valueAsDate = new Date();
    render();
});

function render() {
    const listEl = document.getElementById('recordList');
    const balanceContainer = document.getElementById('netBalanceContainer');
    const countEl = document.getElementById('recordCount');
    const stats = QuantumLedger.getMonthStats();

    animateNumber('monthIncome', stats.income);
    animateNumber('monthExpense', stats.expense);

    const budget = QuantumLedger.monthlyBudget;
    const percent = Math.min(Math.round((stats.expense / budget) * 100), 100);
    document.getElementById('budgetStatusText').textContent = `$${stats.expense.toFixed(0)} / $${budget.toLocaleString()}`;
    document.getElementById('budgetPercentage').textContent = `${percent}%`;
    document.getElementById('budgetProgressBar').style.width = `${percent}%`;

    let items = [...QuantumLedger.expenses];

    if (currentAccountFilter !== 'ALL') {
        items = items.filter(i => i.account === currentAccountFilter || i.toAccount === currentAccountFilter);
    }

    if (searchQuery) {
        items = items.filter(i => 
            i.category.toLowerCase().includes(searchQuery) ||
            (i.note && i.note.toLowerCase().includes(searchQuery)) ||
            (i.tags && i.tags.toLowerCase().includes(searchQuery)) ||
            i.date.includes(searchQuery)
        );
    }

    if (currentSortOrder !== 'manual') {
        items.sort((a, b) => {
            if (currentSortOrder === 'date_desc') {
                if (a.date !== b.date) return b.date.localeCompare(a.date);
                return b.id - a.id;
            } else if (currentSortOrder === 'date_asc') {
                if (a.date !== b.date) return a.date.localeCompare(b.date);
                return a.id - b.id;
            } else if (currentSortOrder === 'amount_desc') {
                return b.hkdAmount - a.hkdAmount;
            } else if (currentSortOrder === 'amount_asc') {
                return a.hkdAmount - b.hkdAmount;
            }
        });
    }

    countEl.textContent = `${items.length} 筆`;
    listEl.innerHTML = '';

    if (items.length === 0) {
        listEl.innerHTML = `<div class="text-center text-gray-500 text-xs py-8">✨ 尚無符合的交易紀錄</div>`;
        return;
    }

    const fragment = document.createDocumentFragment();

    items.forEach((item) => {
        const isInc = item.type === 'income';
        const isTrf = item.type === 'transfer';
        const div = document.createElement('div');
        div.setAttribute('data-id', item.id);
        div.className = "record-item flex items-center justify-between p-2 bg-white/[0.04] active:bg-white/[0.08] border border-white/[0.07] rounded-xl transition-shadow shadow-sm";

        const icon = isTrf ? '⇄' : getCategoryIcon(item.category);
        const accFromInfo = getAccountDetails(item.account);
        const accToInfo = item.toAccount ? getAccountDetails(item.toAccount) : null;

        let accountBadgeHTML = '';
        if (isTrf && accToInfo) {
            accountBadgeHTML = `<span class="text-[8px] px-1.5 py-0.2 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-300 font-bold shrink-0">${accFromInfo.icon} ${accFromInfo.name} ➔ ${accToInfo.icon} ${accToInfo.name}</span>`;
        } else {
            accountBadgeHTML = `<span class="text-[8px] px-1 py-0.2 bg-white/5 border border-white/10 rounded-full ${accFromInfo.color} font-semibold shrink-0">${accFromInfo.icon} ${accFromInfo.name}</span>`;
        }

        div.innerHTML = `
            <div class="flex items-center gap-2 overflow-hidden">
                <div class="drag-handle p-1 -ml-1 text-gray-500 hover:text-white ${currentSortOrder === 'manual' ? 'flex' : 'hidden'} items-center justify-center cursor-grab active:cursor-grabbing select-none shrink-0">
                    <svg class="w-4 h-4 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"></path></svg>
                </div>
                <div class="w-7 h-7 rounded-lg flex items-center justify-center text-xs bg-gradient-to-br from-white/10 to-white/5 border border-white/15 shrink-0">
                    ${icon}
                </div>
                <div class="min-w-0 flex-1">
                    <div class="font-bold text-gray-100 text-xs flex items-center gap-1">
                        <span class="truncate">${isTrf ? '帳戶互轉' : item.category}</span>
                        ${accountBadgeHTML}
                    </div>
                    <div class="text-[9px] text-gray-400 mt-0.5 flex items-center gap-1.5 truncate">
                        <span class="text-gray-300 truncate">${item.note || '無備註'}</span>
                        ${item.tags ? `<span class="text-blue-400 font-medium shrink-0 cursor-pointer" onclick="document.getElementById('searchInput').value='${item.tags}'; searchQuery='${item.tags.toLowerCase()}'; render();">${item.tags}</span>` : ''}
                        <span class="text-[8px] text-gray-500 shrink-0">${item.date}</span>
                    </div>
                </div>
            </div>
            <div class="flex items-center gap-1 shrink-0 pl-1">
                <div class="text-right mr-1">
                    <span class="font-black text-xs tracking-tight ${isInc ? 'text-emerald-400' : isTrf ? 'text-purple-400' : 'text-gray-100'}">
                        ${isInc ? '+' : isTrf ? '⇄ ' : '-'}$${item.hkdAmount.toFixed(2)}
                    </span>
                    ${item.currency !== 'HKD' ? `<span class="block text-[8px] text-gray-500">(${item.currency} ${item.amount})</span>` : ''}
                </div>
                <button data-id="${item.id}" class="edit-btn text-gray-400 hover:text-blue-400 p-1 transition text-xs">✏️</button>
                <button data-id="${item.id}" class="del-btn text-gray-400 hover:text-rose-400 p-1 transition text-xs">✕</button>
            </div>
        `;

        fragment.appendChild(div);
    });

    listEl.appendChild(fragment);

    const balance = QuantumLedger.expenses.reduce((acc, item) => item.type === 'income' ? acc + item.hkdAmount : item.type === 'expense' ? acc - item.hkdAmount : acc, 0);
    animateNumber(balanceContainer, balance);
    balanceContainer.className = `text-base sm:text-lg font-black tracking-tight ${balance >= 0 ? 'text-white' : 'text-rose-400'}`;
}
