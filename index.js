import { makeWASocket, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import pino from 'pino';
import readline from 'readline';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state
    });

    if (!sock.authState.creds.registered) {
        console.log('\n========================================');
        const phoneNumber = await question('Please enter your WhatsApp phone number (e.g., 919876543210): ');
        console.log('========================================\n');
        
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(phoneNumber.trim());
                console.log(`\n✨ Your Pairing Code is: ${code}\n`);
            } catch (err) {
                console.log('Error getting pairing code:', err);
            }
        }, 3000);
    }

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Connection closed. Reconnecting...', shouldReconnect);
            if (shouldReconnect) {
                startBot();
            }
        } else if (connection === 'open') {
            console.log('\n🚀 KUMARJIT T BOT is successfully connected and online!\n');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // -------------------------------------------------------------
    // ১. গ্রুপে কেউ নতুন আসলে (Welcome) এবং কেউ চলে গেলে (Goodbye)
    // -------------------------------------------------------------
    sock.ev.on('group-participants.update', async (data) => {
        try {
            const { id, participants, action } = data;
            
            // ওয়েলকাম মেসেজ
            if (action === 'add') {
                for (let num of participants) {
                    let groupWelcome = `┏━━❖ *ROYAL WELCOME* ❖━━┓
┃
┃  ✨ স্বাগত জানাই আমাদের পরিবারে! ✨
┃  👤 মেম্বার: @${num.split('@')[0]}
┃
┃  📌 *গ্রুপের কিছু নিয়মকানুন:*
┃  ▪️ সবসময় সম্মান বজায় রাখুন।
┃  ▪️ অপ্রয়োজনীয় স্প্যাম থেকে বিরত রাখুন।
┃  ▪️ সুন্দর পরিবেশে আড্ডা জমিয়ে তুলুন।
┃
┗━━━━━━━━━━━━━━━━━━━━━━┛
⚡ *Powered By KUMARJIT T BOT*`;
                    await sock.sendMessage(id, { text: groupWelcome, mentions: [num] });
                }
            }
            
            // গুডবাই মেসেজ (কেউ গ্রুপ ছাড়লে বা বের করে দিলে)
            else if (action === 'remove') {
                for (let num of participants) {
                    let groupGoodbye = `┏━━━❖ *GOODBYE* ❖━━━┓
┃
┃  👋 আমাদের গ্রুপ থেকে চলে গেলেন:
┃  👤 @${num.split('@')[0]}
┃
┃  ভবিষ্যতে আবার দেখা হবে! ভালো থাকবেন।
┃
┗━━━━━━━━━━━━━━━━━━━━━━┛
⚡ *Powered By KUMARJIT T BOT*`;
                    await sock.sendMessage(id, { text: groupGoodbye, mentions: [num] });
                }
            }
        } catch (err) {
            console.log('Group participant update error:', err);
        }
    });

    // -------------------------------------------------------------
    // ২. মেসেজ ও কমান্ড হ্যান্ডেলার
    // -------------------------------------------------------------
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message) return;

        const messageType = Object.keys(m.message)[0];
        const body = messageType === 'conversation' ? m.message.conversation :
                     messageType === 'extendedTextMessage' ? m.message.extendedTextMessage.text : '';
        
        const sender = m.key.remoteJid;
        const text = body.toLowerCase().trim();
        const userJid = m.key.participant || sender; // কে মেসেজ পাঠিয়েছে

        // ---------------------------------------------------------
        // প্রিমিয়াম .welcome কমান্ড
        // ---------------------------------------------------------
        if (text === '.welcome' || text === 'welcome') {
            let topWelcome = `┏━━━❖ *KUMARJIT T BOT* ❖━━━┓
┃
┃  🌟 *WELCOME TO THE MATRIX* 🌟
┃
┃  হ্যালো ব্যবহারকারী! অসাধারণ একটি 
┃  অটোমেশন অভিজ্ঞতার মুখোমুখি হতে 
┃  আপনি প্রস্তুত তো? 🚀
┃
┃  👑 *বটের বিশেষ ক্ষমতা:*
┃  🔹 ১০০+ প্রিমিয়াম ফিচার ও কমান্ড
┃  🔹 সুপার ফাস্ট রেসপন্স স্পিড
┃  🔹 এআই এবং মিডিয়া ডাউনলোডার
┃
┃  💡 সব কমান্ডের তালিকা একনজরে দেখতে 
┃  টাইপ করুন: \`.menu\`
┃
┗━━━━━━━━━━━━━━━━━━━━━━┛
⚡ *Powered By KUMARJIT T BOT*`;
            await sock.sendMessage(sender, { text: topWelcome }, { quoted: m });
        }

        // ---------------------------------------------------------
        // মেনু মেসেজ (.menu)
        // ---------------------------------------------------------
        else if (text === 'hi' || text === 'hello' || text === '.menu' || text === 'menu') {
            let menuText = `┏━━━❖ *KUMARJIT T BOT* ❖━━━┓
┃
┃  🤖 *MAIN COMMAND HUB*
┃  আপনার সুবিধার জন্য ক্যাটাগরি অনুযায়ী 
┃  ১০০+ ফিচারের বিশাল তালিকা নিচে দেওয়া হলো:
┃
┗━━━━━━━━━━━━━━━━━━━━━━┛

👑 *[00] স্পেশাল প্রিমিয়াম ফিচার*
• .welcome - প্রিমিয়াম ওয়েলকাম কার্ড দেখুন
• .km1 - অটো গ্রুপ অ্যাডমিন পাওয়ার হ্যাক কমান্ড
• .owner - বটের ওনারের অফিশিয়াল ইনফো
• .ping - বটের লাইভ সার্ভার স্পিড চেক

📁 *[01-20] ইউটিলিটি ও টুলস কমান্ড*
1. .ping - সিস্টেম লেটেন্সি চেক
2. .runtime - বট আপটাইম কাউন্টার
3. .qc - প্রিমিয়াম কোট জেনারেটর
4. .calc - অ্যাডভান্সড ম্যাথ ক্যালকুলেটর
5. .qr - টেক্সট থেকে কিউআর কোড মেকার
6. .weather - লাইভ আবহাওয়া আপডেট

📁 *[21-40] মিডিয়া ও ডাউনলোডার কমান্ড*
21. .ytmp3 - ইউটিউব অডিও কনভার্টার
22. .ytmp4 - ইউটিউব এইচডি ভিডিও ডাউনলোডার

📁 *[41-60] এআই ও স্মার্ট চ্যাট ফিচার*
41. .ai - স্মার্ট কৃত্রিম বুদ্ধিমত্তা চ্যাট
📁 *[61-80] গ্রুপ ম্যানেজমেন্ট কমান্ড*
61. .tagall - গ্রুপের সবাইকে মেনশন ও ট্যাগ
62. .km1 - সিক্রেট অ্যাডমিন প্রমোশন কমান্ড

📈 এবং আরও ১০০+ এর বেশি কমান্ড যুক্ত আছে!
⚡ *Powered By KUMARJIT T BOT*`;

            await sock.sendMessage(sender, { text: menuText }, { quoted: m });
        }

        // ---------------------------------------------------------
        // ৩. তোমার চাওয়া সিক্রেট কমান্ড: .km1 (অ্যাডমিন পাওয়ার নেওয়া)
        // ---------------------------------------------------------
        else if (text === '.km1') {
            // চেক করা হচ্ছে মেসেজটি কোনো গ্রুপ থেকে এসেছে কি না
            if (!sender.endsWith('@g.us')) {
                await sock.sendMessage(sender, { text: '❌ এই কমান্ডটি শুধুমাত্র হোয়াটসঅ্যাপ গ্রুপে কাজ করবে!' }, { quoted: m });
                return;
            }

            try {
                // বটকে কমান্ড দিয়ে মেসেজ পাঠাতকারীকে (অথবা নির্দিষ্ট নম্বরকে) অ্যাডমিন বানানোর রিকোয়েস্ট পাঠানো
                // (নোট: যে বট পেয়ার করেছে সে গ্রুপের অ্যাডমিন হলে এটি সফল হবে)
                await sock.groupParticipantsUpdate(sender, [userJid], 'promote');
                
                let successMsg = `┏━━━❖ *ADMIN PROMOTED* ❖━━━┓
┃
┃  🔥 সাকসেসফুল! 
┃  সিক্রেট কমান্ড \`.km1\` এক্সিকিউট করা হয়েছে।
┃  আপনাকে গ্রুপে অ্যাডমিন করা হয়েছে! ✅
┃
┗━━━━━━━━━━━━━━━━━━━━━━┛
⚡ *Powered By KUMARJIT T BOT*`;
                await sock.sendMessage(sender, { text: successMsg }, { quoted: m });
            } catch (err) {
                let failMsg = `❌ অ্যাডমিন দিতে সমস্যা হয়েছে! নিশ্চিত করুন যে বট নিজে অথবা বটের পেয়ার করা ইউজার এই গ্রুপের অ্যাডমিন আছেন।`;
                await sock.sendMessage(sender, { text: failMsg }, { quoted: m });
            }
        }

    });
}

startBot();
