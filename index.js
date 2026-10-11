const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const axios = require('axios');

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('session');
    
    const sock = makeWASocket({
        printQRInTerminal: true,
        auth: state
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Connection closed. Reconnecting...', shouldReconnect);
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('KUMARJIT T BOT Connected Successfully! 🚀');
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        try {
            const msg = m.messages[0];
            if (!msg.message || msg.key.fromMe) return;

            const from = msg.key.remoteJid;
            const type = Object.keys(msg.message)[0];
            const body = type === 'conversation' ? msg.message.conversation :
                         type === 'extendedTextMessage' ? msg.message.extendedTextMessage.text : '';

            if (!body.startsWith('.')) return;

            const args = body.slice(1).trim().split(/ +/);
            const command = args.shift().toLowerCase();
            const text = args.join(' ');
            const senderNumber = msg.key.participant || msg.key.remoteJid;
            const isOwner = senderNumber.includes('917980435535');

            // MAIN MENU HUB
            if (command === 'menu' || command === 'help') {
                const menuList = `
╭─── 🤖 *KUMARJIT T BOT MENU HUB* ───╮
│
├─ 📂 *.menu1* ➔ Minimal Style (Owner Only)
├─ 📂 *.menu2* ➔ Cyber Tech Style (Owner Only)
├─ 📂 *.menu3* ➔ Modern Card Style (Owner Only)
│
╰────────────────────────────────╯
💡 *নোট:* .menu1, .menu2, .menu3 কমান্ডগুলো শুধুমাত্র বট ওনার ব্যবহার করতে পারবেন।`;
                await sock.sendMessage(from, { text: menuList });
            }

            // MENU 1: ULTRA MINIMAL (OWNER ONLY)
            else if (command === 'menu1') {
                if (!isOwner) return await sock.sendMessage(from, { text: '⚠️ শুধুমাত্র বট ওনার এই কমান্ড ব্যবহার করতে পারবেন।' });
                const menu1Text = `
┌─────────────────────────────┐
│    👑 *KUMARJIT T BOT* 👑   │
│     — OPTION 1: MINIMAL —   │
└─────────────────────────────┘

👑 *[00] ওনার স্পেশাল ড্যাশবোর্ড*
• .km1 - অটো গ্রুপ অ্যাডমিন পাওয়ার
• .owner - বটের ওনারের অফিসিয়াল কন্টাক্ট
• .ping - বটের লাইভ সার্ভার স্পিড চেক

🛠️ *[01-20] ইউটিলিটি ও টুলস কমান্ড*
1. .ping - সিস্টেম লেটেন্সি চেক
2. .runtime - বট আপটাইম কাউন্টার
3. .qc - প্রিমিয়াম কোট জেনারেটর
4. .calc - অ্যাডভান্সড ক্যালকুলেটর
5. .qr - টেক্সট থেকে কিউআর কোড
6. .weather - লাইভ আবহাওয়া আপডেট

📁 *[21-40] মিডিয়া ও ডাউনলোড কমান্ড*
21. .ytmp3 - ইউটিউব অডিও ডাউনলোডার
22. .ytmp4 - ইউটিউব ভিডিও ডাউনলোডার
23. .insta - ইনস্টাগ্রাম ভিডিও/রিলস ডাউনলোডার
24. .fb - ফেসবুক এইচডি ভিডিও ডাউনলোডার

🤖 *[41-60] এআই ও স্মার্ট চ্যাট*
41. .ai - জেমিনি কৃত্রিম বুদ্ধিমত্তা চ্যাট

👥 *[61-80] গ্রুপ ম্যানেজমেন্ট কমান্ড*
61. .tagall - গ্রুপের সবাইকে ট্যাগ
62. .welcome - প্রিমিয়াম ওয়েলকাম কার্ড
63. .goodbye - বিদায় বার্তা সেটআপ

──────────────────────────────
⚡ *Powered By KUMARJIT T BOT*`;
                await sock.sendMessage(from, { text: menu1Text });
            }

            // MENU 2: CYBER TECH (OWNER ONLY)
            else if (command === 'menu2') {
                if (!isOwner) return await sock.sendMessage(from, { text: '⚠️ শুধুমাত্র বট ওনার এই কমান্ড ব্যবহার করতে পারবেন।' });
                const menu2Text = `
⚡ [ *KUMARJIT T BOT - CYBER MENU* ] ⚡
═════════════════════════════════
💻 *SYSTEM STATUS & METRICS*
│ ├ Speed : 0.001s
│ ├ Status: ONLINE 🟢
│ └ Owner : Kumarjit
═════════════════════════════════
👑 *OWNER EXCLUSIVE COMMANDS*
│ ├ 👑 [.km1]     - Auto Admin Hack
│ ├ 👤 [.owner]   - Owner Official Info
│ └ ⚡ [.ping]    - Server Speed Test
═════════════════════════════
🛠️ *UTILITY & SYSTEM TOOLS*
│ ├ 1. [.ping]    - Latency Check
│ ├ 2. [.runtime] - Uptime Counter
│ ├ 3. [.calc]    - Math Calculator
│ ├ 4. [.qr]      - QR Code Maker
│ └ 5. [.weather] - Weather Update
═════════════════════════════
📁 *MEDIA & DOWNLOADS*
│ ├ 21. [.ytmp3] - YouTube Audio
│ ├ 22. [.ytmp4] - YouTube Video
│ ├ 23. [.insta] - Instagram Reels
│ └ 24. [.fb]    - Facebook Video
═════════════════════════════
🤖 *AI & GROUP MANAGEMENT*
│ ├ 41. [.ai]      - Gemini AI Chat
│ ├ 61. [.tagall]  - Tag All Members
│ ├ 62. [.welcome] - Welcome Card
│ └ 63. [.goodbye] - Goodbye Card
═════════════════════════════════
⚡ *POWERED BY KUMARJIT T BOT*`;
                await sock.sendMessage(from, { text: menu2Text });
            }

            // MENU 3: MODERN CARD (OWNER ONLY)
            else if (command === 'menu3') {
                if (!isOwner) return await sock.sendMessage(from, { text: '⚠️ শুধুমাত্র বট ওনার এই কমান্ড ব্যবহার করতে পারবেন।' });
                const menu3Text = `
╔═════════════════════════════╗
║   🪐 *KUMARJIT T BOT* 🪐   ║
║      — MODERN CARD MENU —   ║
╚═════════════════════════════╝

👑 *OWNER PRIVILEGES*
 ├ .km1 ➔ Auto Group Admin
 ├ .owner ➔ Owner Info
 └ .ping ➔ Check Speed

🛠️ *UTILITIES & TOOLS*
 ├ 1. .ping ➔ System Latency
 ├ 2. .runtime ➔ Uptime Counter
 ├ 3. .calc ➔ Math Calculator
 ├ 4. .qr ➔ QR Generator
 └ 5. .weather ➔ Weather Info

📥 *DOWNLOADERS*
 ├ 21. .ytmp3 ➔ YouTube Audio
 ├ 22. .ytmp4 ➔ YouTube Video
 ├ 23. .insta ➔ Instagram Video
 └ 24. .fb ➔ Facebook Video

🤖 *AI & GROUPS*
 ├ 41. .ai ➔ Gemini AI
 ├ 61. .tagall ➔ Tag Everyone
 ├ 62. .welcome ➔ Welcome Banner
 └ 63. .goodbye ➔ Goodbye Banner

───────────────────────────────
✨ *Powered By KUMARJIT T BOT*`;
                await sock.sendMessage(from, { text: menu3Text });
            }            // INSTAGRAM DOWNLOADER
            else if (command === 'insta' || command === 'ig') {
                if (!text) return await sock.sendMessage(from, { text: '⚠️ ইনস্টাগ্রামের ভিডিও/রিলস লিংক দিন। উদাহরণ: .insta <link>' });
                await sock.sendMessage(from, { text: '⏳ ইনস্টাগ্রাম থেকে ভিডিও ডাউনলোড হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...' });
                try {
                    const res = await axios.get(`https://api.vreden.web.id/api/instagram?url=${encodeURIComponent(text)}`);
                    const videoUrl = res.data.result?.url?.[0] || res.data.result?.[0];
                    if (videoUrl) {
                        await sock.sendMessage(from, { video: { url: videoUrl }, caption: '✅ *Instagram Video Downloaded Successful!*' });
                    } else {
                        await sock.sendMessage(from, { text: '❌ ভিডিও পাওয়া যায়নি! লিংকটি সঠিক কি না তা চেক করুন।' });
                    }
                } catch (e) {
                    await sock.sendMessage(from, { text: '❌ ডাউনলোড করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।' });
                }
            }

            // FACEBOOK DOWNLOADER
            else if (command === 'fb' || command === 'facebook') {
                if (!text) return await sock.sendMessage(from, { text: '⚠️ ফেসবুকের ভিডিও লিংক দিন। উদাহরণ: .fb <link>' });
                await sock.sendMessage(from, { text: '⏳ ফেসবুক থেকে ভিডিও ডাউনলোড হচ্ছে...' });
                try {
                    const res = await axios.get(`https://api.vreden.web.id/api/fbdl?url=${encodeURIComponent(text)}`);
                    const videoUrl = res.data.result?.hd || res.data.result?.sd;
                    if (videoUrl) {
                        await sock.sendMessage(from, { video: { url: videoUrl }, caption: '✅ *Facebook Video Downloaded Successful!*' });
                    } else {
                        await sock.sendMessage(from, { text: '❌ ভিডিও পাওয়া যায়নি! ফেসবুক লিংকটি চেক করুন।' });
                    }
                } catch (e) {
                    await sock.sendMessage(from, { text: '❌ ফেসবুক ভিডিও ডাউনলোড করতে সমস্যা হয়েছে।' });
                }
            }

            // GEMINI AI CHAT
            else if (command === 'ai' || command === 'gemini') {
                if (!text) return await sock.sendMessage(from, { text: '⚠️ আপনার প্রশ্নটি লিখুন। উদাহরণ: .ai বাংলাদেশের রাজধানী কি?' });
                try {
                    const res = await axios.get(`https://api.vreden.web.id/api/gemini?text=${encodeURIComponent(text)}`);
                    const reply = res.data.result || res.data.answer || 'কোনো উত্তর পাওয়া যায়নি।';
                    await sock.sendMessage(from, { text: reply });
                } catch (e) {
                    await sock.sendMessage(from, { text: '❌ এআই সার্ভারে সংযোগ করা যাচ্ছে না।' });
                }
            }

            // SYSTEM SPEED PING
            else if (command === 'ping') {
                const start = Date.now();
                await sock.sendMessage(from, { text: '🚀 Pinging...' });
                const end = Date.now();
                await sock.sendMessage(from, { text: `⚡ *Server Speed:* ${end - start} ms` });
            }

            // OWNER INFO
            else if (command === 'owner') {
                await sock.sendMessage(from, { text: '👑 *Bot Owner:* Kumarjit\n📱 *Contact:* https://wa.me/917980435535' });
            }

        } catch (err) {
            console.error('Error handling command:', err);
        }
    });
}

startBot();
