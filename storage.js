export const LedgerStorage = {
    expenses: [],
    isFileLoaded: false,
    fileName: '',
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
                this.isFileLoaded = true;
                this.fileName = file.name;
                if (callback) callback(true, file.name);
                return;
            } catch (err) {
                console.log('使用者取消或不支援 API');
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
                this.isFileLoaded = true;
                this.fileName = file.name;
                if (callback) callback(true, file.name);
            } catch (err) {
                if (callback) callback(false, '格式錯誤');
            }
        };
        reader.readAsText(file);
    },

    async saveToFile() {
        if (this.fileHandle) {
            try {
                const writable = await this.fileHandle.createWritable();
                await writable.write(JSON.stringify(this.expenses, null, 2));
                await writable.close();
                return;
            } catch (err) {
                console.error('自動存檔失敗', err);
            }
        }
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.expenses, null, 2));
        const dlAnchor = document.createElement('a');
        dlAnchor.setAttribute("href", dataStr);
        dlAnchor.setAttribute("download", this.fileName || "ledger.json");
        document.body.appendChild(dlAnchor);
        dlAnchor.click();
        dlAnchor.remove();
    },

    addRecord(item) {
        this.expenses.unshift(item);
        this.saveToFile();
    },

    deleteRecord(id) {
        this.expenses = this.expenses.filter(item => item.id !== id);
        this.saveToFile();
    },

    calculateBalance() {
        return this.expenses.reduce((acc, item) => {
            return item.type === 'income' ? acc + item.amount : acc - item.amount;
        }, 0);
    }
};