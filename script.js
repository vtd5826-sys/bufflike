const WEBHOOK_URL = "https://discord.com/api/webhooks/1565719904118767646/la3TtguPEf-lKEnvGtj4B9COe5E5d2-WYTJzjQaYln4UMGZGt0n7Kc4nuv0Pri_kSPxG";
let selectedPkg = 50;

function switchTab(tabId, btn) {
    document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    btn.classList.add('active');
}

function selectPackage(pkg, element) {
    selectedPkg = pkg;
    document.querySelectorAll('.package-card').forEach(card => card.classList.remove('active'));
    element.classList.add('active');
}

function showToast(message = "Đã gửi thành công! Vui lòng chờ admin phê duyệt 📢") {
    const toast = document.getElementById("toast");
    toast.innerText = message;
    toast.className = "show";
    setTimeout(() => { toast.className = toast.className.replace("show", ""); }, 3500);
}

// --- XỬ LÝ ĐĂNG NHẬP ADMIN ---
function loginAdmin() {
    const u = document.getElementById('admUser').value.trim();
    const p = document.getElementById('admPass').value.trim();

    if (u === "TDZADMIN" && p === "TDZ2013@") {
        document.getElementById('adminLoginBox').style.display = 'none';
        document.getElementById('adminDashboard').style.display = 'block';
        loadKeyTable();
    } else {
        alert("Sai tài khoản hoặc mật khẩu Admin!");
    }
}

function logoutAdmin() {
    document.getElementById('adminLoginBox').style.display = 'block';
    document.getElementById('adminDashboard').style.display = 'none';
    document.getElementById('admUser').value = '';
    document.getElementById('admPass').value = '';
}

// --- QUẢN LÝ KEY VIP ---
function createKey() {
    const u = document.getElementById('newKeyUser').value.trim();
    const p = document.getElementById('newKeyPass').value.trim();
    const hours = parseInt(document.getElementById('newKeyDuration').value);

    if (!u || !p) {
        alert("Vui lòng nhập đầy đủ tài khoản và mật khẩu VIP!");
        return;
    }

    let keys = JSON.parse(localStorage.getItem('ff_vip_keys')) || [];
    const expiryTime = new Date().getTime() + (hours * 3600 * 1000);

    keys.push({ user: u, pass: p, expiry: expiryTime });
    localStorage.setItem('ff_vip_keys', JSON.stringify(keys));

    document.getElementById('newKeyUser').value = '';
    document.getElementById('newKeyPass').value = '';
    alert("Tạo Key VIP thành công!");
    loadKeyTable();
}

function loadKeyTable() {
    let keys = JSON.parse(localStorage.getItem('ff_vip_keys')) || [];
    const tbody = document.getElementById('keyListBody');
    tbody.innerHTML = '';

    const now = new Date().getTime();
    keys.forEach((k, index) => {
        const isExpired = now > k.expiry;
        const expiryDateStr = new Date(k.expiry).toLocaleString('vi-VN');
        
        let tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${k.user}</td>
            <td>${k.pass}</td>
            <td style="color: ${isExpired ? '#ff3838' : '#10b981'}">${isExpired ? 'Hết hạn' : expiryDateStr}</td>
            <td><button onclick="deleteKey(${index})" style="background: #ef4444; color: #fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;"><i class="fa-solid fa-trash"></i></button></td>
        `;
        tbody.appendChild(tr);
    });
}

function deleteKey(index) {
    let keys = JSON.parse(localStorage.getItem('ff_vip_keys')) || [];
    keys.splice(index, 1);
    localStorage.setItem('ff_vip_keys', JSON.stringify(keys));
    loadKeyTable();
}

// --- XỬ LÝ BUFF LIKE ---
function handleBuff() {
    const ign = document.getElementById('ign').value.trim();
    const ffid = document.getElementById('ffid').value.trim();

    if (!ign) {
        alert("Vui lòng nhập tên nhân vật Free Fire!");
        return;
    }
    if (ffid.length !== 8 || isNaN(ffid)) {
        alert("ID Free Fire phải đúng chính xác 8 chữ số!");
        return;
    }

    // Kiểm tra giới hạn 1 lần mỗi ID
    if (localStorage.getItem('ff_buffed_' + ffid)) {
        alert("ID Free Fire này đã thực hiện buff rồi! Mỗi người chỉ được 1 lần.");
        return;
    }

    if (selectedPkg === 50) {
        sendDiscordWebhook(ign, ffid, "+50 Like (Miễn Phí)", "Không yêu cầu VIP");
        localStorage.setItem('ff_buffed_' + ffid, 'true');
        showToast();
        resetForm();
    } else if (selectedPkg === 200) {
        document.getElementById('vipModal').style.display = 'flex';
    }
}

function closeVipModal() {
    document.getElementById('vipModal').style.display = 'none';
}

function verifyAndBuff200() {
    const ign = document.getElementById('ign').value.trim();
    const ffid = document.getElementById('ffid').value.trim();
    const vUser = document.getElementById('vipUser').value.trim();
    const vPass = document.getElementById('vipPass').value.trim();

    if (!vUser || !vPass) {
        alert("Vui lòng nhập tài khoản và mật khẩu VIP!");
        return;
    }

    let keys = JSON.parse(localStorage.getItem('ff_vip_keys')) || [];
    const now = new Date().getTime();
    let foundKey = keys.find(k => k.user === vUser && k.pass === vPass);

    if (!foundKey) {
        alert("Tài khoản hoặc mật khẩu VIP không chính xác!");
        return;
    }

    if (now > foundKey.expiry) {
        alert("Tài khoản VIP này đã hết thời gian sử dụng!");
        return;
    }

    sendDiscordWebhook(ign, ffid, "+200 Like (VIP)", `Tài khoản VIP: ${vUser}`);
    localStorage.setItem('ff_buffed_' + ffid, 'true');
    
    closeVipModal();
    showToast();
    resetForm();
}

function sendDiscordWebhook(ign, ffid, packageName, note) {
    const payload = {
        embeds: [{
            title: "🚀 YÊU CẦU BUFF LIKE FREE FIRE MỚI",
            color: 16738095,
            fields: [
                { name: "👤 Tên Nhân Vật", value: `\`${ign}\``, inline: true },
                { name: "🆔 ID Free Fire", value: `\`${ffid}\``, inline: true },
                { name: "🎁 Gói Đăng Ký", value: `\`${packageName}\``, inline: false },
                { name: "🔐 Ghi Chú / Xác Thực", value: `\`${note}\``, inline: false },
                { name: "⏰ Thời Gian", value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
            ],
            footer: { text: "Hệ thống tự động Buff Like Free Fire" }
        }]
    };

    fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    }).catch(err => console.error("Lỗi gửi webhook:", err));
}

function resetForm() {
    document.getElementById('ign').value = '';
    document.getElementById('ffid').value = '';
    document.getElementById('vipUser').value = '';
    document.getElementById('vipPass').value = '';
}
