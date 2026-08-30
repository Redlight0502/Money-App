// storage.js
const STORAGE_KEY = 'obsidian_ledger_pro_data';

export const LedgerStorage = {
    expenses: [],
    isFileLoaded: true, // 預設直接為 true，透過 localStorage 免重複 attach
    fileName: 'local_storage_cache.json',
    fileHandle: null,

    expenseCategories: [
        { name: '餐費', icon: '🍜' },
        { name: '交通', icon: '🚇' },
        { name: '娛樂', icon: '🎮' },
        { name: '購物', icon: '🛍️' },
        { name: '居住', icon: '🏠' },
        { name: '醫療', icon: '💊' },
        { name: '其他', icon: '📦' }
    ],
    incomeCategories: [
        { name: '薪金', icon: '💰' },
        { name: '投資', icon: '📈' },
        { name: '獎金', icon: '🏆' },
        { name: '兼職', icon: '💻' },
        { name: '其他', icon: '✨' }
    ],

    // 初始化載入：優先從 localStorage 讀取快取，免除每次 Attach
    init() {
        try {
            const cached = localStorage.getItem(STORAGE_KEY);
            if (cached) {
                this.expenses = JSON.parse(cached);
            }
        } catch (e) {
            console.error('讀取本機快取失敗', e);
        }
    },

    // 儲存至 localStorage 與自動同步
    save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.expenses));
        } catch (e) {
            console.error('寫入本機快取失敗', e);
        }
    },

    // 選擇外部檔案掛載 (可選)
    async connectFile(fileInputEl, callback) {
        if ('showOpenFilePicker' in window) {
            try {
                [this.fileHandle] = await window.showOpenFilePicker({
                    types: [{ description: 'JSON Ledger', accept: { 'application/json': ['.json'] } }],
                    multiple: false
                });
                const file = await this.fileHandle.getFile();
                const text = await file.text();
                this.expenses = JSON.parse(text);
                this.fileName = file.name;
                this.save();
                if (callback) callback(true, file.name);
                return;
            } catch (err) {
                console.log('使用者取消檔案掛載');
            }
        }
        fileInputEl.click();
    },

    loadFromLegacyFile(file, callback) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (!Array.isArray(data)) throw new Error();
                this.expenses = data;
                this.fileName = file.name;
                this.save();
                if (callback) callback(true, file.name);
            } catch (err) {
                if (callback) callback(false, '格式錯誤');
            }
        };
        reader.readAsText(file);
    },

    // 匯出 JSON 備份檔案
    exportJson() {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.expenses, null, 2));
        const dlAnchor = document.createElement('a');
        dlAnchor.setAttribute("href", dataStr);
        dlAnchor.setAttribute("download", `ledger_backup_${new Date().toISOString().slice(0,10)}.json`);
        document.body.appendChild(dlAnchor);
        dlAnchor.click();
        dlAnchor.remove();
    },

    // 匯出 CSV 試算表
    exportCsv() {
        let csvContent = "data:text/csv;charset=utf-8,ID,Type,Category,Amount,Date,Note\r\n";
        this.expenses.forEach(item => {
            const row = [item.id, item.type, `"${item.category}"`, item.amount, item.date, `"${item.note || ''}"`];
            csvContent += row.join(",") + "\r\n";
        });
        const encodedUri = encodeURI(csvContent);
        const dlAnchor = document.createElement('a');
        dlAnchor.setAttribute("href", encodedUri);
        dlAnchor.setAttribute("download", `ledger_export_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(dlAnchor);
        dlAnchor.click();
        dlAnchor.remove();
    },

    addRecord(item) {
        this.expenses.unshift(item);
        this.save();
    },

    deleteRecord(id) {
        this.expenses = this.expenses.filter(item => item.id !== id);
        this.save();
    },

    clearAll() {
        this.expenses = [];
        this.save();
    },

    calculateBalance() {
        return this.expenses.reduce((acc, item) => {
            return item.type === 'income' ? acc + item.amount : acc - item.amount;
        }, 0);
    },

    getMonthStats() {
        const now = new Date();
        const currentMonth = now.toISOString().slice(0, 7); // YYYY-MM
        let income = 0;
        let expense = 0;

        this.expenses.forEach(item => {
            if (item.date && item.date.startsWith(currentMonth)) {
                if (item.type === 'income') income += item.amount;
                else expense += item.amount;
            }
        });

        return { income, expense };
    }
};
