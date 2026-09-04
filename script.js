   function closeAllPanels() {
        Object.values(panels).forEach(p => p.classList.add('hidden'));
    }

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

        QuantumLedger.updateRecord({
            id: id,
            type: editingType,
            amount: amount,
            currency: document.getElementById('editCurrency').value,
            category: editingType === 'transfer' ? '帳戶互轉' : document.getElementById('editCategory').value,
            account: document.getElementById('editAccount').value,
            toAccount: editingType === 'transfer' ? document.getElementById('editToAccount').value : null,
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
        tabAi.className = "flex-1 py-1.5 rounded-lg tab-active font-bold text-xs transition";
        tabManual.className = "flex-1 py-1.5 rounded-lg text-gray-400 font-medium text-xs transition";
        aiContainer.classList.remove('hidden');
        manualContainer.classList.add('hidden');
    });

    tabManual.addEventListener('click', () => {
        tabManual.className = "flex-1 py-1.5 rounded-lg tab-active font-bold text-xs transition";
        tabAi.className = "flex-1 py-1.5 rounded-lg text-gray-400 font-medium text-xs transition";
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

    document.getElementById('exportJsonBtn').addEventListener('click', () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(QuantumLedger.expenses, null, 2));
        const dl = document.createElement('a'); dl.setAttribute("href", dataStr); dl.setAttribute("download", `obsidian_quantum_${new Date().toISOString().slice(0,10)}.json`);
        document.body.appendChild(dl); dl.click(); dl.remove();
    });
    document.getElementById('exportCsvBtn').addEventListener('click', () => {
        let csv = "data:text/csv;charset=utf-8,ID,Type,Category,FromAccount,ToAccount,Amount,Currency,Date,Note,Tags\r\n";
        QuantumLedger.expenses.forEach(i => { csv += [i.id, i.type, `"${i.category}"`, i.account, i.toAccount || '', i.amount, i.currency, i.date, `"${i.note}"`, `"${i.tags}"`].join(",") + "\r\n"; });
        const dl = document.createElement('a'); dl.setAttribute("href", encodeURI(csv)); dl.setAttribute("download", `obsidian_quantum_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(dl); dl.click(); dl.remove();
    });
    document.getElementById('importJsonBtn').addEventListener('click', () => importInput.click());
    
    importInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                try { 
                    QuantumLedger.expenses = QuantumLedger.deduplicate(JSON.parse(ev.target.result)); 
                    QuantumLedger.save(); 
                    render(); 
                    alert('備份還原成功！'); 
                } catch(err) { alert('檔案解析失敗'); }
            };
            reader.readAsText(file);
        }
    });

    document.getElementById('budgetSettingBtn').addEventListener('click', () => {
        const nb = prompt('設定每月總預算上限 (HKD):', QuantumLedger.monthlyBudget);
        if (nb !== null && !isNaN(nb)) { QuantumLedger.monthlyBudget = parseFloat(nb); QuantumLedger.save(); render(); }
    });

    document.getElementById('helpNlpBtn').addEventListener('click', () => {
        alert('🪄 AI 語意手冊：\n可直接輸入：\n- "$38 買Starbucks咖啡 支付寶 #下午茶"\n- "從轉數快轉500到八達通"\n- "收到薪金 18000 轉數快"');
    });

    document.getElementById('clearDataBtn').addEventListener('click', () => {
        if (confirm('警告：確定要清空所有資料嗎？')) { QuantumLedger.clearAll(); render(); }
    });

    document.getElementById('addSubBtn').addEventListener('click', () => {
        const title = document.getElementById('subTitle').value.trim();
        const amount = parseFloat(document.getElementById('subAmount').value);
        if (!title || !amount) return;
        QuantumLedger.subscriptions.push({ id: generateUniqueId(), title, amount });
        QuantumLedger.save();
        document.getElementById('subTitle').value = '';
        document.getElementById('subAmount').value = '';
        renderSubList();
    });

    document.getElementById('addDebtBtn').addEventListener('click', () => {
        const title = document.getElementById('debtTitle').value.trim();
        const amount = parseFloat(document.getElementById('debtAmount').value);
        if (!title || !amount) return;
        QuantumLedger.debts.push({ id: generateUniqueId(), title, amount, paid: 0 });
        QuantumLedger.save();
        document.getElementById('debtTitle').value = '';
        document.getElementById('debtAmount').value = '';
        renderDebtList();
    });

    document.getElementById('addWishBtn').addEventListener('click', () => {
        const title = document.getElementById('wishTitle').value.trim();
        const target = parseFloat(document.getElementById('wishTarget').value);
        if (!title || !target) return;
        QuantumLedger.wishes.push({ id: generateUniqueId(), title, target, current: 0 });
        QuantumLedger.save();
        document.getElementById('wishTitle').value = '';
        document.getElementById('wishTarget').value = '';
        renderWishList();
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

        QuantumLedger.addRecord({
            id: generateUniqueId(),
            type: currentType,
            amount,
            currency: document.getElementById('currency').value,
            category: currentType === 'transfer' ? '帳戶互轉' : document.getElementById('category').value,
            account: document.getElementById('account').value,
            toAccount: currentType === 'transfer' ? document.getElementById('toAccount').value : null,
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
}

function initSmoothMobileDrag() {
    const listContainer = document.getElementById('recordList');
    let activeItem = null;
    let placeholder = null;
    let initialY = 0;
    let itemInitialTop = 0;
    let itemHeight = 0;

    function onPointerDown(e) {
        if (currentSortOrder !== 'manual') return;
        const handle = e.target.closest('.drag-handle');
        if (!handle) return;

        activeItem = handle.closest('.record-item');
        if (!activeItem) return;

        if (window.navigator.vibrate) window.navigator.vibrate(15);

        const rect = activeItem.getBoundingClientRect();
        itemInitialTop = rect.top;
        itemHeight = rect.height;
        initialY = e.clientY;

        placeholder = document.createElement('div');
        placeholder.className = 'drag-placeholder';
        placeholder.style.height = `${itemHeight}px`;
        activeItem.parentNode.insertBefore(placeholder, activeItem);

        activeItem.classList.add('dragging');
        activeItem.style.position = 'fixed';
        activeItem.style.top = `${rect.top}px`;
        activeItem.style.left = `${rect.left}px`;
        activeItem.style.width = `${rect.width}px`;

        window.addEventListener('pointermove', onPointerMove, { passive: false });
        window.addEventListener('pointerup', onPointerEnd);
        window.addEventListener('pointercancel', onPointerEnd);
    }

    function onPointerMove(e) {
        if (!activeItem) return;
        if (e.cancelable) e.preventDefault();

        const deltaY = e.clientY - initialY;
        activeItem.style.transform = `translate3d(0, ${deltaY}px, 0)`;

        const activeCenterY = itemInitialTop + deltaY + itemHeight / 2;
        const siblings = [...listContainer.querySelectorAll('.record-item:not(.dragging)')];

        let targetSibling = null;
        for (const sibling of siblings) {
            const box = sibling.getBoundingClientRect();
            if (activeCenterY < box.top + box.height / 2) {
                targetSibling = sibling;
                break;
            }
        }

        if (targetSibling) {
            listContainer.insertBefore(placeholder, targetSibling);
        } else {
            listContainer.appendChild(placeholder);
        }
    }

    function onPointerEnd() {
        if (!activeItem) return;

        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerEnd);
        window.removeEventListener('pointercancel', onPointerEnd);

        activeItem.classList.remove('dragging');
        activeItem.style.position = '';
        activeItem.style.top = '';
        activeItem.style.left = '';
        activeItem.style.width = '';
        activeItem.style.transform = '';

        if (placeholder && placeholder.parentNode) {
            placeholder.parentNode.insertBefore(activeItem, placeholder);
            placeholder.remove();
        }

        saveDragOrder();
        activeItem = null;
        placeholder = null;
    }

    listContainer.addEventListener('pointerdown', onPointerDown);
}

function saveDragOrder() {
    const currentListIds = [...document.querySelectorAll('#recordList [data-id]')].map(el => String(el.getAttribute('data-id')));
    const newExpensesOrder = [];
    
    currentListIds.forEach(id => {
        const item = QuantumLedger.expenses.find(x => String(x.id) === id);
        if (item) newExpensesOrder.push(item);
    });

    QuantumLedger.expenses.forEach(item => {
        if (!currentListIds.includes(String(item.id))) {
            newExpensesOrder.push(item);
        }
    });

    QuantumLedger.expenses = newExpensesOrder;
    QuantumLedger.save();
}

function switchType(type) {
    currentType = type;
    const exp = document.getElementById('typeExpense');
    const inc = document.getElementById('typeIncome');
    const trf = document.getElementById('typeTransfer');
    const submit = document.getElementById('submitBtn');
    const catSelect = document.getElementById('category');
    const toAccSelect = document.getElementById('toAccount');
    
    updateCategories();

    exp.className = "flex-1 py-1 rounded-lg text-gray-400 font-medium text-[11px]";
    inc.className = "flex-1 py-1 rounded-lg text-gray-400 font-medium text-[11px]";
    trf.className = "flex-1 py-1 rounded-lg text-gray-400 font-medium text-[11px]";

    if (type === 'transfer') {
        catSelect.classList.add('hidden');
        toAccSelect.classList.remove('hidden');
        trf.className = "flex-1 py-1 rounded-lg bg-purple-600 text-white font-bold text-[11px]";
        submit.className = "w-full py-2 bg-gradient-to-r from-purple-500 to-indigo-600 active:scale-[0.98] text-white font-bold rounded-xl text-xs shadow-md transition";
        submit.textContent = "確認帳戶互轉";
    } else {
        catSelect.classList.remove('hidden');
        toAccSelect.classList.add('hidden');
        if (type === 'expense') {
            exp.className = "flex-1 py-1 rounded-lg bg-white/10 text-white font-bold text-[11px]";
            submit.className = "w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 active:scale-[0.98] text-white font-bold rounded-xl text-xs shadow-md transition";
            submit.textContent = "確認記錄支出";
        } else if (type === 'income') {
            inc.className = "flex-1 py-1 rounded-lg bg-emerald-500 text-white font-bold text-[11px]";
            submit.className = "w-full py-2 bg-gradient-to-r from-emerald-400 to-emerald-600 active:scale-[0.98] text-white font-bold rounded-xl text-xs shadow-md transition";
            submit.textContent = "確認記錄收入";
        }
    }
}

function updateCategories() {
    const select = document.getElementById('category');
    select.innerHTML = '';
    const list = currentType === 'income' ? QuantumLedger.incomeCategories : QuantumLedger.expenseCategories;
    list.forEach(item => {
        const opt = document.createElement('option');
        opt.value = item.name;
        opt.textContent = `${item.icon} ${item.name}`;
        select.appendChild(opt);
    });
}

function getAccountDetails(acc) {
    switch(acc) {
        case 'Alipay': return { name: '支付寶', icon: '💙', color: 'text-blue-400' };
        case 'WeChat': return { name: '微信', icon: '💚', color: 'text-emerald-400' };
        case 'FPS': return { name: '轉數快', icon: '⚡', color: 'text-cyan-300' };
        case 'Cash': return { name: '現金', icon: '💵', color: 'text-amber-400' };
        case 'Octopus': return { name: '八達通', icon: '🚇', color: 'text-orange-400' };
        case 'CreditCard': return { name: '信用卡', icon: '💳', color: 'text-purple-400' };
        default: return { name: acc, icon: '💳', color: 'text-gray-300' };
    }
}

function getCategoryIcon(catName) {
    const all = [...QuantumLedger.expenseCategories, ...QuantumLedger.incomeCategories];
    const found = all.find(c => c.name === catName);
    return found ? found.icon : '📦';
}

function renderSubList() {
    const container = document.getElementById('subListContainer');
    container.innerHTML = '';
    if (QuantumLedger.subscriptions.length === 0) {
        container.innerHTML = '<div class="text-center text-gray-500 text-[10px] py-2">尚無定期訂閱項目</div>';
        return;
    }
    QuantumLedger.subscriptions.forEach(s => {
        const div = document.createElement('div');
        div.className = "flex items-center justify-between p-2 bg-white/5 border border-white/10 rounded-xl text-xs";
        div.innerHTML = `
            <div>
                <div class="font-bold text-pink-300 text-[11px]">🔁 ${s.title}</div>
                <div class="text-[9px] text-gray-400">每月固定: $${s.amount}</div>
            </div>
            <button onclick="delSub('${s.id}')" class="text-gray-500 hover:text-rose-400 px-1 font-bold">✕</button>
        `;
        container.appendChild(div);
    });
}

window.delSub = function(id) {
    QuantumLedger.subscriptions = QuantumLedger.subscriptions.filter(s => String(s.id) !== String(id));
    QuantumLedger.save();
    renderSubList();
};

function renderDebtList() {
    const container = document.getElementById('debtListContainer');
    container.innerHTML = '';
    if (QuantumLedger.debts.length === 0) {
        container.innerHTML = '<div class="text-center text-gray-500 text-[10px] py-2">尚無借貸紀錄</div>';
        return;
    }
    QuantumLedger.debts.forEach(d => {
        const div = document.createElement('div');
        div.className = "flex items-center justify-between p-2 bg-white/5 border border-white/10 rounded-xl text-xs";
        div.innerHTML = `
            <div>
                <div class="font-bold text-gray-200 text-[11px]">${d.title}</div>
                <div class="text-[9px] text-gray-400">已還: $${d.paid} / 總額: $${d.amount}</div>
            </div>
            <div class="flex items-center gap-1">
                <button onclick="payDebt('${d.id}')" class="px-2 py-1 bg-amber-500/20 text-amber-300 rounded-lg text-[9px] font-bold active:scale-95 transition">還款</button>
                <button onclick="delDebt('${d.id}')" class="text-gray-500 hover:text-rose-400 px-1">✕</button>
            </div>
        `;
        container.appendChild(div);
    });
}

window.payDebt = function(id) {
    const debt = QuantumLedger.debts.find(d => String(d.id) === String(id));
    if (debt) {
        const amt = parseFloat(prompt(`輸入還款金額 (剩餘 $${debt.amount - debt.paid}):`, '100'));
        if (amt && !isNaN(amt)) {
            debt.paid = Math.min(debt.amount, debt.paid + amt);
            QuantumLedger.save();
            renderDebtList();
        }
    }
};

window.delDebt = function(id) {
    QuantumLedger.debts = QuantumLedger.debts.filter(d => String(d.id) !== String(id));
    QuantumLedger.save();
    renderDebtList();
};

function renderWishList() {
    const container = document.getElementById('wishListContainer');
    container.innerHTML = '';
    if (QuantumLedger.wishes.length === 0) {
        container.innerHTML = '<div class="text-center text-gray-500 text-[10px] py-2">尚無願望儲蓄目標</div>';
        return;
    }
    QuantumLedger.wishes.forEach(w => {
        const pct = Math.min(Math.round((w.current / w.target) * 100), 100);
        const div = document.createElement('div');
        div.className = "p-2 bg-white/5 border border-white/10 rounded-xl space-y-1 text-xs";
        div.innerHTML = `
            <div class="flex justify-between items-center font-bold text-gray-200 text-[11px]">
                <span>🎯 ${w.title}</span>
                <span class="text-purple-300">$${w.current} / $${w.target} (${pct}%)</span>
            </div>
            <div class="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                <div class="bg-gradient-to-r from-purple-500 to-indigo-500 h-full" style="width: ${pct}%"></div>
            </div>
            <div class="flex justify-end gap-1 pt-0.5">
                <button onclick="depositWish('${w.id}')" class="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded-lg text-[9px] font-bold active:scale-95 transition">存錢</button>
                <button onclick="delWish('${w.id}')" class="text-gray-500 hover:text-rose-400 px-1 text-[9px]">刪除</button>
            </div>
        `;
        container.appendChild(div);
    });
}

window.depositWish = function(id) {
    const wish = QuantumLedger.wishes.find(w => String(w.id) === String(id));
    if (wish) {
        const amt = parseFloat(prompt(`存入金額至「${wish.title}」:`, '200'));
        if (amt && !isNaN(amt)) {
            wish.current += amt;
            QuantumLedger.save();
            renderWishList();
        }
    }
};

window.delWish = function(id) {
    QuantumLedger.wishes = QuantumLedger.wishes.filter(w => String(w.id) !== String(id));
    QuantumLedger.save();
    renderWishList();
};

function render() {
    const listEl = document.getElementById('recordList');
    const balanceContainer = document.getElementById('netBalanceContainer');
    const countEl = document.getElementById('recordCount');
    const stats = QuantumLedger.getMonthStats();

    document.getElementById('monthIncome').textContent = `$${stats.income.toFixed(2)}`;
    document.getElementById('monthExpense').textContent = `$${stats.expense.toFixed(2)}`;

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
        div.className = "record-item flex items-center justify-between p-2.5 bg-white/[0.04] active:bg-white/[0.08] border border-white/[0.07] rounded-xl transition-shadow shadow-sm";

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
                <div class="w-8 h-8 rounded-xl flex items-center justify-center text-sm bg-gradient-to-br from-white/10 to-white/5 border border-white/15 shrink-0">
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
                <button data-id="${item.id}" class="edit-btn text-gray-500 hover:text-blue-400 p-1 transition text-xs">✏️</button>
                <button data-id="${item.id}" class="del-btn text-gray-500 hover:text-rose-400 p-1 transition text-xs">✕</button>
            </div>
        `;

        fragment.appendChild(div);
    });

    listEl.appendChild(fragment);

    const balance = QuantumLedger.expenses.reduce((acc, item) => item.type === 'income' ? acc + item.hkdAmount : item.type === 'expense' ? acc - item.hkdAmount : acc, 0);
    balanceContainer.textContent = (balance >= 0 ? '$' : '-$') + Math.abs(balance).toFixed(2);
    balanceContainer.className = `text-base md:text-lg font-black tracking-tight ${balance >= 0 ? 'text-white' : 'text-rose-400'}`;
}

function renderAnalyticsChart() {
    const ctx = document.getElementById('analyticsChart').getContext('2d');
    const now = new Date().toISOString().slice(0, 7);
    const categoryTotals = {};
    QuantumLedger.expenses.forEach(item => {
        if (item.type === 'expense' && item.date.startsWith(now)) {
            categoryTotals[item.category] = (categoryTotals[item.category] || 0) + item.hkdAmount;
        }
    });

    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);

    if (analyticsChartInstance) analyticsChartInstance.destroy();

    analyticsChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels.length ? labels : ['無消費記錄'],
            datasets: [{
                data: data.length ? data : [1],
                backgroundColor: ['#0071e3', '#30d158', '#ff9f0a', '#ff453a', '#bf5af2', '#64d2ff', '#5856d6', '#ff375f', '#ac8e68', '#8e8e93'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { color: '#98989f', font: { size: 9 } } }
            }
        }
    });
}
