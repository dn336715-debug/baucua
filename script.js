// --- Dữ liệu Client ---
let balance = 100000000;
const BET_AMOUNT = 100000; // Mỗi lần click đặt 10k
const items = { nai: '🦌', bau: '🍐', ga: '🐓', ca: '🐟', cua: '🦀', tom: '🦐' };

let currentBets = { nai: 0, bau: 0, ga: 0, ca: 0, cua: 0, tom: 0 };
let isRolling = false;

// --- Giao diện Client ---
function updateUI() {
    document.getElementById('balance').innerText = balance.toLocaleString();
    for (let key in currentBets) {
        document.getElementById(`bet-${key}`).innerText = currentBets[key].toLocaleString();
    }
}

function logServer(msg) {
    const logs = document.getElementById('logs');
    const time = new Date().toLocaleTimeString();
    logs.innerHTML += `<div>[${time}] ${msg}</div>`;
    logs.scrollTop = logs.scrollHeight;
}

// Client gửi yêu cầu đặt cược
function placeBet(item) {
    if (isRolling) return;
    
    // Client side check (Chỉ check cho vui)
    if (balance >= BET_AMOUNT) {
        // GIẢ LẬP: Gửi gói tin lên Server
        logServer(`[CLIENT] Request bet ${BET_AMOUNT} on ${item}`);
        serverProcessBet(item, BET_AMOUNT);
    } else {
        alert("Không đủ số dư!");
    }
}

function clearBets() {
    if (isRolling) return;
    // Hoàn tiền
    for(let key in currentBets) balance += currentBets[key];
    currentBets = { nai: 0, bau: 0, ga: 0, ca: 0, cua: 0, tom: 0 };
    updateUI();
    logServer("[SERVER] Transaction rolled back. Bets cleared.");
}

// --- GIẢ LẬP SERVER (Authoritative Logic) ---
// Trong thực tế, toàn bộ code dưới đây chạy trên Node.js backend

function serverProcessBet(item, amount) {
    // SECURITY CHECK: Xác thực đầu vào (Ngăn chặn hack âm tiền hoặc cược láo)
    if (amount <= 0 || isNaN(amount)) {
        logServer("<span style='color:red'>[SECURITY ALERT] Invalid bet amount detected.</span>");
        return;
    }
    
    if (balance < amount) {
        logServer("<span style='color:red'>[SECURITY ALERT] Insufficient funds bypass attempt.</span>");
        return;
    }

    // Xử lý an toàn
    balance -= amount;
    currentBets[item] += amount;
    updateUI();
    logServer(`[SERVER] Validated. Balance deducted. Total bet on ${item}: ${currentBets[item]}`);
}

function requestRoll() {
    // Kiem tra xem co cuoc chua
    const totalBet = Object.values(currentBets).reduce((a, b) => a + b, 0);
    if(totalBet === 0) return alert("Vui lòng đặt cược trước khi lắc!");

    isRolling = true;
    document.getElementById('system-msg').innerText = "Máy chủ đang lắc (Server-side RNG)...";
    logServer("[SERVER] Locking bets. Generating secure random sequence.");

    // Giả lập delay mạng và thời gian lắc
    let spinInterval = setInterval(() => {
        const diceEls = document.querySelectorAll('.dice');
        const keys = Object.keys(items);
        diceEls.forEach(d => d.innerText = items[keys[Math.floor(Math.random() * keys.length)]]);
    }, 100);

    // Kết quả cuối cùng sinh ra từ Server
    setTimeout(() => {
        clearInterval(spinInterval);
        serverResolveGame();
    }, 2000);
}

function serverResolveGame() {
    const keys = Object.keys(items);
    // Sinh random an toàn trên Server
    const result = [
        keys[Math.floor(Math.random() * keys.length)],
        keys[Math.floor(Math.random() * keys.length)],
        keys[Math.floor(Math.random() * keys.length)]
    ];

    // Hiển thị kết quả về Client
    const diceEls = document.querySelectorAll('.dice');
    diceEls[0].innerText = items[result[0]];
    diceEls[1].innerText = items[result[1]];
    diceEls[2].innerText = items[result[2]];

    logServer(`[SERVER] Result generated: ${result.join(', ')}`);

    // Tính toán tiền thắng cược trên Server
    let winAmount = 0;
    
    // Trả lại tiền cược gốc nếu đoán trúng
    for (let i = 0; i < result.length; i++) {
        if (currentBets[result[i]] > 0) {
            // Thêm tiền thắng (mỗi viên trúng = x1 tiền cược)
            winAmount += currentBets[result[i]]; 
        }
    }

    // Trả lại vốn cho những ô đã trúng
    const uniqueResults = [...new Set(result)];
    uniqueResults.forEach(item => {
        if (currentBets[item] > 0) {
             winAmount += currentBets[item]; // Hoàn gốc
        }
    });

    if (winAmount > 0) {
        balance += winAmount;
        document.getElementById('system-msg').innerText = `CHÚC MỪNG! Bạn thắng ${winAmount.toLocaleString()} VNĐ`;
        document.getElementById('system-msg').style.color = 'var(--gold)';
        logServer(`[SERVER] Transaction success. Payout: ${winAmount}`);
    } else {
        document.getElementById('system-msg').innerText = "Rất tiếc! Chúc bạn may mắn lần sau.";
        document.getElementById('system-msg').style.color = 'var(--red)';
        logServer(`[SERVER] House wins. Payout: 0`);
    }

    // Reset lượt mới
    currentBets = { nai: 0, bau: 0, ga: 0, ca: 0, cua: 0, tom: 0 };
    updateUI();
    isRolling = false;
}

updateUI();