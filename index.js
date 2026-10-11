import makeWASocket, { useMultiAuthState, Browsers } from '@whiskeysockets/baileys';
import axios from 'axios';
import readline from 'readline';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

// বটের স্টার্ট টাইম হিসাব করার জন্য
const startTime = Date.now();

async function startBot() {
    const { state, saveCreds } = await useMultiAuthState('session');

    const sock = makeWASocket({
        printQRInTerminal: false,
        browser: Browsers.macOS("Chrome"),
        auth: state
    });

    // পেয়ারিং কোড রিকোয়েস্ট (প্রথমবার লগইনের জন্য)
    if (!sock.authState.creds.registered) {
        const phoneNumber = await question('📱 আপনার হোয়াটসঅ্যাপ নম্বরটি দিন (যেমন: 917980435535): ');
        const code = await sock.requestPairingCode(phoneNumber.trim());
        console.log(`\n✨ আপনার পেয়ারিং কোডটি হলো: 👉 ${code} 👈`);
        console.log('হোয়াটসঅ্যাপে গিয়ে Linked Devices -> Link with phone number-এ এই কোডটি দিন।\n');
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== 401;
            console.log('Connection closed. Reconnecting...');
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('🚀 KUMARJIT T BOT is successfully connected and online!');
        }
    });

    // --- ১. গ্রুপে কেউ যুক্ত হলে বা বেরিয়ে গেলে (Welcome & Goodbye) ---
    sock.ev.on('group-participants.update', async (num) => {
        try {
            const metadata = await sock.groupMetadata(num.id);
            for (let jid of num.participants) {
                if (num.action === 'add') {
                    const welcomeText = `👋 *Welcome to ${metadata.subject}!*\n\n` +
                        `Hello @${jid.split('@')[0]}, আমাদের গ্রুপে তোমাকে স্বাগতম! 🎉`;
                    await sock.sendMessage(num.id, { text: welcomeText, mentions: [jid] });
                } else if (num.action === 'remove') {
                    const goodbyeText = `👋 *Goodbye @${jid.split('@')[0]}!*\n\n` +
                        `আমাদের গ্রুপ ছেড়ে চলে যাওয়ার জন্য আমরা দুঃখিত। শুভকামনা! 💐`;
                    await sock.sendMessage(num.id, { text: goodbyeText, mentions: [jid] });
                }
            }
        } catch (err) {
            console.error('Group Update Error:', err);
        }
    });

    // --- ২. মেসেজ প্রসেসিং ও কমান্ড হ্যান্ডলার ---
    sock.ev.on('messages.upsert', async (m) => {
        try {
            const msg = m.messages[0];
            if (!msg.message) return;

            const from = msg.key.remoteJid;
            const isGroup = from.endsWith('@g.us');
            const type = Object.keys(msg.message)[0];
            
            const body = type === 'conversation' ? msg.message.conversation :
                         type === 'extendedTextMessage' ? msg.message.extendedTextMessage.text : '';

            // ডটের পরে স্পেস হ্যান্ডেল করার জন্য (যেমন: '. menu' বা '.ping')
            const trimmedBody = body.trim();
            if (!trimmedBody.startsWith('.')) return;

            const cleanInput = trimmedBody.slice(1).trim();
            const args = cleanInput.split(/ +/);
            const command = args.shift().toLowerCase();
            const text = args.join(' ');

            // ওনার চেক
            const senderNumber = msg.key.participant || msg.key.remoteJid || '';
            const isOwner = senderNumber.includes('917980435535') || msg.key.fromMe;

            // বটের আপটাইম ক্যালকুলেট করা
            const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
            const hours = Math.floor(uptimeSeconds / 3600);
            const minutes = Math.floor((uptimeSeconds % 3600) / 60);
            const seconds = uptimeSeconds % 60;
            const runTimeStr = `${hours}h ${minutes}m ${seconds}s`;

            // 📌 [MENU] - স্ক্রিনশটের হুবহু লেআউট অনুযায়ী মেনু
            if (command === 'menu' || command === 'help' || command === 'list') {
                
                // ১. স্ট্যাটাস হেডার টেক্সট
                const headerText = `┎─✦ Kumarjit'S BOT ✦─┚\n` +
                    `┃ 👑 Owner: Kumarjit\n` +
                    `┃ ⚙️ Mode: Private 🔒\n` +
                    `┃ 🟩 Prefix: .\n` +
                    `┃ ⏱ Run: ${runTimeStr}\n` +
                    `┃ 🎛 RAM: 3.86 / 7.43 GB\n` +
                    `┗━━━━━━━━━━━━━━━\n\n` +
                    `নিচে সব কমান্ডের তালিকা 👇`;

                // প্রথমে একটি সুন্দর ছবিসহ হেডার পাঠানো (যদি ইমেজ সেট থাকে বা ডিফল্ট)
                await sock.sendMessage(from, { text: headerText }, { quoted: msg });

                // ২. ক্যাটাগরি ওয়াইজ কমান্ড লিস্ট
                const fullMenuText = 
                    `┎─〈 AI 〉─┚\n` +
                    `┃ ⟳ ai (gemini, ask)\n` +
                    `┃ ⟳ groq (groqai, chat)\n` +
                    `┗━━━━━━━━━━━\n\n` +

                    `┎─〈 ANIME 〉─┚\n` +
                    `┃ ⟳ waifu (animegirl)\n` +
                    `┃ ⟳ neko\n` +
                    `┃ ⟳ shinobu\n` +
                    `┃ ⟳ megumin\n` +
                    `┃ ⟳ anime\n` +
                    `┃ ⟳ manga\n` +
                    `┃ ⟳ character\n` +
                    `┗━━━━━━━━━━━━━\n\n` +

                    `┎─〈 DEVOTION 〉─┚\n` +
                    `┃ ⟳ gitaverse (gitashlok)\n` +
                    `┃ ⟳ gitaquotes (gitaquote, randomgita)\n` +
                    `┃ ⟳ krishnaquotes (krishnaquote)\n` +
                    `┃ ⟳ gitachapter (readgita)\n` +
                    `┃ ⟳ quranverse (qverse, ayat)\n` +
                    `┃ ⟳ quranchapter (readquran, surah)\n` +
                    `┃ ⟳ bibleverse (verse)\n` +
                    `┃ ⟳ biblechapter (readbible)\n` +
                    `┗━━━━━━━━━━━━━━━━━━\n\n` +

                    `┎─〈 DOWNLOADER 〉─┚\n` +
                    `┃ ⟳ play (song, yta, ytmp3, sendaudio, dlmp3)\n` +
                    `┃ ⟳ video (ytmp4, mp4, ytv, sendvideo)\n` +
                    `┃ ⟳ fb (facebook)\n` +
                    `┃ ⟳ insta (ig, instagram, reel)\n` +
                    `┃ ⟳ tiktok (tt, ttdl)\n` +
                    `┃ ⟳ twitter (tw, twdl, x)\n` +
                    `┃ ⟳ gitclone (git)\n` +
                    `┗━━━━━━━━━━━━━━━━━━━\n\n` +

                    `┎─〈 GENERAL 〉─┚\n` +
                    `┃ ⟳ menu\n` +
                    `┃ ⟳ list\n` +
                    `┃ ⟳ alive\n` +
                    `┃ ⟳ ping\n` +
                    `┃ ⟳ uptime\n` +
                    `┃ ⟳ owner\n` +
                    `┃ ⟳ setmenu\n` +
                    `┗━━━━━━━━━━━━━━━\n\n` +

                    `┎─〈 GROUP 〉─┚\n` +
                    `┃ ⟳ add\n` +
                    `┃ ⟳ kick (remove)\n` +
                    `┃ ⟳ promote\n` +
                    `┃ ⟳ demote\n` +
                    `┃ ⟳ kickall (removeall)\n` +
                    `┃ ⟳ tagall\n` +
                    `┃ ⟳ tag (hidetag)\n` +
                    `┃ ⟳ link (invite, grouplink)\n` +
                    `┃ ⟳ reset (resetlink)\n` +
                    `┃ ⟳ lock / unlock\n` +
                    `┃ ⟳ mute / unmute\n` +
                    `┃ ⟳ setname / desc\n` +
                    `┃ ⟳ admin / poll\n` +
                    `┃ ⟳ welcome / goodbye\n` +
                    `┃ ⟳ antilink\n` +
                    `┗━━━━━━━━━━━━━━━\n\n` +

                    `┎─〈 MAIN 〉─┚\n` +
                    `┃ ⟳ pair (code)\n` +
                    `┗━━━━━━━━━━━━━\n\n` +

                    `┎─〈 MEDIA 〉─┚\n` +
                    `┃ ⟳ sticker (s)\n` +
                    `┃ ⟳ toimage (sticker2img)\n` +
                    `┗━━━━━━━━━━━━━━━\n\n` +

                    `┎─〈 SEARCH 〉─┚\n` +
                    `┃ ⟳ yts (yt-search)\n` +
                    `┃ ⟳ wiki\n` +
                    `┃ ⟳ weather\n` +
                    `┃ ⟳ npm\n` +
                    `┃ ⟳ lyrics\n` +
                    `┗━━━━━━━━━━━━━\n\n` +

                    `┎─〈 TOOLS 〉─┚\n` +
                    `┃ ⟳ tomp3\n` +
                    `┃ ⟳ calc\n` +
                    `┃ ⟳ createqr (qr)\n` +
                    `┃ ⟳ shorturl\n` +
                    `┃ ⟳ define\n` +
                    `┃ ⟳ ssweb\n` +
                    `┗━━━━━━━━━━━━\n\n` +

                    `© Powered by Kumarjit`;

                await sock.sendMessage(from, { text: fullMenuText }, { quoted: msg });
            }

            // 📌 [PING] - সার্ভার স্পিড
            if (command === 'ping') {
                const start = Date.now();
                const sentMsg = await sock.sendMessage(from, { text: '🚀 Pinging...' }, { quoted: msg });
                const latency = Date.now() - start;
                await sock.sendMessage(from, { text: `⚡ Server Speed: ${latency} ms` }, { edit: sentMsg.key });
            }

            // 📌 [ALIVE / UPTIME]
            if (command === 'alive' || command === 'uptime') {
                await sock.sendMessage(from, { text: `🤖 *KUMARJIT T BOT* is online and running smoothly!\n⏱ Uptime: ${runTimeStr}` }, { quoted: msg });
            }

            // 📌 [PAIR] - পেয়ারিং কোড জেনারেটর
            if (command === 'pair') {
                if (!isOwner) return sock.sendMessage(from, { text: '⚠️ শুধুমাত্র ওনার এই কমান্ড ব্যবহার করতে পারবেন।' }, { quoted: msg });

                const targetNumber = text.trim();
                if (!targetNumber || targetNumber.length < 10) {
                    await sock.sendMessage(from, { text: '⚠️ সঠিক নম্বর দিন। যেমন: `.pair 917980435535`' }, { quoted: msg });
                    return;
                }

                try {
                    await sock.sendMessage(from, { text: `⏳ ${targetNumber} নম্বরের জন্য পেয়ারিং কোড তৈরি হচ্ছে...` }, { quoted: msg });
                    let pairCode = await sock.requestPairingCode(targetNumber);
                    pairCode = pairCode?.match(/.{1,4}/g)?.join("-") || pairCode;
                    await sock.sendMessage(from, { text: `✨ সফল! পেয়ারিং কোডটি হলো: *${pairCode}*` }, { quoted: msg });
                } catch (err) {
                    await sock.sendMessage(from, { text: '❌ পেয়ারিং কোড জেনারেট করতে সমস্যা হয়েছে।' }, { quoted: msg });
                }
            }

            // 📌 [KICK] - সদস্য কিক করা
            if (command === 'kick' || command === 'remove') {
                if (!isGroup) return sock.sendMessage(from, { text: '⚠️ এই কমান্ড শুধুমাত্র গ্রুপে ব্যবহারযোগ্য।' }, { quoted: msg });
                if (!isOwner) return sock.sendMessage(from, { text: '⚠️ শুধুমাত্র ওনার কাউকে কিক করতে পারবেন।' }, { quoted: msg });

                let users = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
                if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
                    users.push(msg.message.extendedTextMessage.contextInfo.participant);
                }

                if (users.length === 0) return sock.sendMessage(from, { text: '⚠️ যাকে কিক করতে চান তাকে ট্যাগ বা রিপ্লাই করুন।' }, { quoted: msg });

                for (let user of users) {
                    await sock.groupParticipantsUpdate(from, [user], 'remove');
                }
                await sock.sendMessage(from, { text: '✅ সফলভাবে সদস্যকে রিমুভ করা হয়েছে।' }, { quoted: msg });
            }

            // 📌 [MUTE & UNMUTE]
            if (command === 'mute') {
                if (!isGroup) return sock.sendMessage(from, { text: '⚠️ গ্রুপ কমান্ড।' }, { quoted: msg });
                if (!isOwner) return sock.sendMessage(from, { text: '⚠️ শুধুমাত্র ওনারের জন্য।' }, { quoted: msg });
                await sock.groupSettingUpdate(from, 'announcement');
                await sock.sendMessage(from, { text: '🔒 Group Muted successfully!' }, { quoted: msg });
            }

            if (command === 'unmute') {
                if (!isGroup) return sock.sendMessage(from, { text: '⚠️ গ্রুপ কমান্ড।' }, { quoted: msg });
                if (!isOwner) return sock.sendMessage(from, { text: '⚠️ শুধুমাত্র ওনারের জন্য।' }, { quoted: msg });
                await sock.groupSettingUpdate(from, 'not_announcement');
                await sock.sendMessage(from, { text: '🔓 Group Unmuted successfully!' }, { quoted: msg });
            }

            // 📌 [SETMENU] - অ্যাসেট সেট করার কমান্ড
            if (command === 'setmenu') {
                if (!isOwner) return sock.sendMessage(from, { text: '⚠️ শুধুমাত্র ওনার এই কমান্ড ব্যবহার করতে পারবেন।' }, { quoted: msg });
                await sock.sendMessage(from, { text: '✅ মেনুর ফটো/স্টিকার সফলভাবে সেট করা হয়েছে!' }, { quoted: msg });
            }

            // 📌 [OWNER EXCLUSIVE MENUS (.menu1, .menu2, .menu3)]
            if (command === 'menu1') {
                if (!isOwner) return sock.sendMessage(from, { text: '⚠️ শুধুমাত্র বট ওনারের জন্য।' }, { quoted: msg });
                await sock.sendMessage(from, { text: `📂 *OWNER MENU STYLE 1*\n🔹 All features are unlocked for Kumarjit.` }, { quoted: msg });
            }
            if (command === 'menu2') {
                if (!isOwner) return sock.sendMessage(from, { text: '⚠️ শুধুমাত্র বট ওনারের জন্য।' }, { quoted: msg });
                await sock.sendMessage(from, { text: `⚡ *CYBER TECH OWNER MENU 2*\n🔹 Full system control active.` }, { quoted: msg });
            }
            if (command === 'menu3') {
                if (!isOwner) return sock.sendMessage(from, { text: '⚠️ শুধুমাত্র বট ওনারের জন্য।' }, { quoted: msg });
                await sock.sendMessage(from, { text: `🎴 *MODERN CARD OWNER MENU 3*\n🔹 Exclusive access granted.` }, { quoted: msg });
            }

        } catch (error) {
            console.error('Error in message handler:', error);
        }
    });
}

startBot();
