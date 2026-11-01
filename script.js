const DB_URL = "https://sharehub-feee9-default-rtdb.firebaseio.com";
const WEBHOOK_URL = "https://discord.com/api/webhooks/1565719904118767646/la3TtguPEf-lKEnvGtj4B9COe5E5d2-WYTJzjQaYln4UMGZGt0n7Kc4nuv0Pri_kSPxG";
const LINK4M_API_KEY = "6a3a33c4819a596e7155dd57";

let selectedPkg = 50;

function switchTab(tabId, btn) {
    document.querySelectorAll('.section').forEach(sec => sec.style.display = 'none');
    document.getElementById('buffTab').style.display = 'none';
    document.getElementById('adminTab').style.display = 'none';
    
    document.getElementById('tabBuffBtn').style.background = 'transparent';
    document.getElementById('tabBuffBtn').style.color = '#666';
    document.getElementById('tabAdminBtn').style.background = 'transparent';
    document.getElementById('tabAdminBtn').style.color = '#666';

    document.getElementById(tabId).style.display = 'block';
    btn.style.background = 'rgba(0,255,102,0.1)';
    btn.style.color = '#00ff66';
}

function selectPackage(pkg, element) {
    selectedPkg = pkg;
    document.querySelectorAll('.package-card').forEach(card => card.classList.remove('active'));
    element.classList.add('active');
}

function showToast(message) {
    const toast = document.getElementById("toast");
    toast.innerText = message;
    toast.className = "show";
    setTimeout(() => { toast.className = toast.className.replace("show", ""); }, 3500);
}

// ĐÃ SỬA: Dùng trực tiếp link API Link4M để chuyển hướng mượt mà, không bị lỗi kẹt màn hình trên GitHub Pages
function generateLink4mKey() {
    const currentPath = window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1);
    const destinationUrl = currentPath + 'get-key.html';
    const link4mUrl = `https://link4m.co/api-shorten/v2?api=${LINK4M_API_KEY}&url=${encodeURIComponent(destinationUrl)}`;

    showToast("Đang mở trang lấy Key VIP...");
    window.open(link4mUrl, '_blank');
}

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

function generateRandomKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const part = () => Array.from({length: 4}, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
    return `VIP-${part()}-${part()}-${part()}`;
}

async function createAdminKey() {
    const hours = parseInt(document.getElementById('newKeyDuration').value);
    const keyVal = generateRandomKey();
    const expiryTime = new Date().getTime() + (hours * 3600 * 1000);

    try {
        await fetch(`${DB_URL}/vip_keys/${keyVal}.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: keyVal, expiry: expiryTime, used: false })
        });
        alert(`Tạo Key Thành Công!\nKey: ${keyVal}`);
        loadKeyTable();
    } catch (err) {
        alert("Lỗi khi tạo Key trên Đám Mây!");
    }
}

async function loadKeyTable() {
    const tbody = document.getElementById('keyListBody');
    tbody.innerHTML = '<tr><td colspan="3">Đang tải...</td></tr>';
    try {
        const res = await fetch(`${DB_URL}/vip_keys.json`);
        const data = await res.json() || {};
        tbody.innerHTML = '';
        const now = new Date().getTime();
        Object.keys(data).forEach(k => {
            const item = data[k];
            const isExpired = now > item.expiry;
            let tr = document.createElement('tr');
            tr.innerHTML = `
                <td><code>${item.key || k}</code></td>
                <td style="color:${isExpired ? '#ff3366' : '#00ff66'}">${isExpired ? 'Hết hạn' : new Date(item.expiry).toLocaleDateString()}</td>
                <td><button onclick="deleteKey('${k}')" style="background:#ff3366;color:#fff;border:none;padding:2px 6px;border-radius:4px;cursor:pointer;">Xóa</button></td>
            `;
            tbody.appendChild(tr);
        });
    } catch(e) {
        tbody.innerHTML = '<tr><td colspan="3">Chưa có Key nào!</td></tr>';
    }
}

async function deleteKey(keyId) {
    await fetch(`${DB_URL}/vip_keys/${keyId}.json`, { method: 'DELETE' });
    loadKeyTable();
}

async function handleBuff() {
    const ign = document.getElementById('ign').value.trim();
    const ffid = document.getElementById('ffid').value.trim();

    if (!ign) return alert("Vui lòng nhập Tên Nhân Vật Free Fire!");
    if (ffid.length !== 8 || isNaN(ffid)) return alert("ID Free Fire phải đúng chính xác 8 số!");

    const checkRes = await fetch(`${DB_URL}/buffed_ids/${ffid}.json`);
    if (await checkRes.json() !== null) {
        return alert("ID này đã thực hiện buff rồi! Mỗi ID chỉ được 1 lần.");
    }

    if (selectedPkg === 50) {
        await sendDiscordWebhook(ign, ffid, "+50 Like (FREE)", "Miễn phí");
        await fetch(`${DB_URL}/buffed_ids/${ffid}.json`, { method: 'PUT', body: JSON.stringify({ ign, time: Date.now() }) });
        showToast("Đã gửi thành công! Vui lòng chờ admin phê duyệt 📢");
        resetForm();
    } else {
        document.getElementById('vipModal').style.display = 'flex';
    }
}

function closeVipModal() {
    document.getElementById('vipModal').style.display = 'none';
}

async function verifyAndBuff200() {
    const ign = document.getElementById('ign').value.trim();
    const ffid = document.getElementById('ffid').value.trim();
    const inputKey = document.getElementById('vipKeyInput').value.trim();

    if (!inputKey) return alert("Vui lòng nhập Key VIP!");

    try {
        const res = await fetch(`${DB_URL}/vip_keys/${inputKey}.json`);
        const keyData = await res.json();

        if (!keyData) return alert("Key VIP không chính xác hoặc đã được sử dụng!");
        if (new Date().getTime() > keyData.expiry) return alert("Key VIP này đã hết hạn!");

        await sendDiscordWebhook(ign, ffid, "+200 Like (VIP)", `VIP Key: ${inputKey}`);

        await fetch(`${DB_URL}/buffed_ids/${ffid}.json`, { method: 'PUT', body: JSON.stringify({ ign, time: Date.now() }) });
        await fetch(`${DB_URL}/vip_keys/${inputKey}.json`, { method: 'DELETE' }); // Tự động xóa key sau khi dùng

        closeVipModal();
        showToast("Đã gửi thành công! Vui lòng chờ admin phê duyệt 📢");
        resetForm();
    } catch (err) {
        alert("Lỗi xác thực Key!");
    }
}

function sendDiscordWebhook(ign, ffid, packageName, note) {
    const payload = {
        embeds: [{
            title: "🚀 YÊU CẦU BUFF LIKE FREE FIRE MỚI",
            color: 65280,
            fields: [
                { name: "👤 Tên Nhân Vật", value: `\`${ign}\``, inline: true },
                { name: "🆔 ID Free Fire", value: `\`${ffid}\``, inline: true },
                { name: "🎁 Gói Buff", value: `\`${packageName}\``, inline: false },
                { name: "🔐 Xác Thực Key", value: `\`${note}\``, inline: false }
            ]
        }]
    };
    return fetch(WEBHOOK_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
}

function resetForm() {
    document.getElementById('ign').value = '';
    document.getElementById('ffid').value = '';
    document.getElementById('vipKeyInput').value = '';
}
