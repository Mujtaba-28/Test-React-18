// Analytics Web Worker Code
// This code runs in a separate thread to prevent UI freezing during heavy calculation

const workerCode = `
self.onmessage = function(e) {
    // FIX: Destructure activeContext from worker data.
    const { transactions, currentDateStr, budgets, viewType, EXPENSE_CATEGORIES, INCOME_CATEGORIES, activeContext } = e.data;
    const currentDate = new Date(currentDateStr);
    
    try {
        const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
        const currentMonthKey = currentDate.getFullYear() + '-' + String(currentDate.getMonth() + 1).padStart(2, '0');
        
        // FIX: Use activeContext to construct the correct keys for retrieving the current budget.
        const budgetKey = \`\${activeContext}-\${currentMonthKey}\`;
        const defaultBudgetKey = \`\${activeContext}-default\`;
        const currentBudget = budgets[budgetKey] || budgets[defaultBudgetKey] || 0;

        // --- MONTHLY DATA CALCULATION ---
        const monthlyTransactions = transactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate.getMonth() === currentDate.getMonth() && tDate.getFullYear() === currentDate.getFullYear();
        });

        // Flatten splits
        const flatTransactions = monthlyTransactions.flatMap(t => {
            if (t.splits && t.splits.length > 0) {
                 return t.splits.map(s => ({
                     ...t,
                     category: s.category,
                     amount: s.amount
                 }));
            }
            return [t];
        });

        const activeTransactions = flatTransactions.filter(t => t.type === viewType);
        const activeTotal = activeTransactions.reduce((a, b) => a + b.amount, 0);

        // Daily Trend
        const dailySpending = new Array(daysInMonth).fill(0);
        activeTransactions.forEach(tx => {
            const day = new Date(tx.date).getDate() - 1;
            if(day >= 0 && day < daysInMonth) dailySpending[day] += tx.amount;
        });
        
        // Cumulative
        let cumulativeSpending = [];
        let runningTotal = 0;
        const today = new Date();
        const isCurrentMonth = today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear();
        const currentDayIndex = isCurrentMonth ? today.getDate() : daysInMonth;

        for (let i = 0; i < currentDayIndex; i++) {
            runningTotal += dailySpending[i];
            cumulativeSpending.push(runningTotal);
        }
        
        const daysPassed = Math.max(currentDayIndex, 1); 
        const currentDailyAverage = activeTotal / daysPassed;
        const daysLeft = daysInMonth - daysPassed;
        const predictedTotal = activeTotal + (currentDailyAverage * daysLeft);
        const isOverBudget = viewType === 'expense' && predictedTotal > currentBudget;

        // Categories & Category Budgets
        const categoryList = viewType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
        let categoryData = categoryList.map(cat => {
            const amount = activeTransactions.filter(t => t.category === cat.name).reduce((a, b) => a + b.amount, 0);
            const catBudget = budgets[currentMonthKey + '-category-' + cat.name] || 0;
            return { 
                ...cat, 
                amount, 
                budget: catBudget,
                code: cat.code || '#cbd5e1' 
            };
        }).filter(c => c.amount > 0 || c.budget > 0).sort((a,b) => b.amount - a.amount);
        
        const maxCategoryVal = Math.max(...categoryData.map(c => c.amount), 1); 
        const totalForDonut = categoryData.reduce((a, b) => a + b.amount, 0);

        // --- 6-MONTH CASH FLOW ---
        const cashFlow = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
            const mKey = d.toLocaleString('default', { month: 'short' });
            
            const monthTxs = transactions.filter(t => {
                const tDate = new Date(t.date);
                return tDate.getMonth() === d.getMonth() && tDate.getFullYear() === d.getFullYear();
            });

            const income = monthTxs.filter(t => t.type === 'income').reduce((a, b) => a + b.amount, 0);
            const expense = monthTxs.filter(t => t.type === 'expense').reduce((a, b) => a + b.amount, 0);
            
            cashFlow.push({ month: mKey, income, expense });
        }

        // Send back results
        self.postMessage({
            activeTotal,
            dailySpending,
            cumulativeSpending,
            predictedTotal,
            isOverBudget,
            currentDailyAverage,
            categoryData,
            maxCategoryVal,
            totalForDonut,
            currentBudget,
            daysInMonth,
            runningTotal,
            cashFlow
        });

    } catch (e) {
        self.postMessage({ error: e.message });
    }
};
`;

export const createAnalyticsWorker = () => {
    const blob = new Blob([workerCode], { type: "application/javascript" });
    return new Worker(URL.createObjectURL(blob));
};