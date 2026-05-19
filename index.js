// ============================================================
//   AHMAD-MD WhatsApp Bot — index.js
//   Credits: AHMADTech
// ============================================================

'use strict';

const {
default: makeWASocket,
useMultiFileAuthState,
DisconnectReason,
fetchLatestBaileysVersion,
makeInMemoryStore,
getContentType,
jidNormalizedUser,
PHONENUMBER_MCC,
} = require('@whiskeysockets/baileys');

const { MongoClient } = require('mongodb');
const express        = require('express');
const path           = require('path');
const fs             = require('fs');
const pino           = require('pino');
const { Boom }       = require('@hapi/boom');

const config  = require('./config');
const { cmd, commands } = require('./command');
const { sms }           = require('./lib/msg');
const { saveMessage, saveContact }  = require('./lib/store');
const GroupEvents       = require('./lib/groupevents');
const { lidToPhone }    = require('./lib/functions');

// ── Logger ──────────────────────────────────────────────────
const logger = pino({ level: 'silent' });

// ── Express server (pairing page) ───────────────────────────
const app  = express();
const PORT = process.env.PORT || config.PORT || 8000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve pairing HTML page
app.get('/', (req, res) => {
res.sendFile(path.join(__dirname, 'lib', 'main.html'));
});

// ── MongoDB ──────────────────────────────────────────────────
let db, mongoClient;

async function connectMongo() {
try {
mongoClient = new MongoClient(config.MONGODB_URL, { serverSelectionTimeoutMS: 5000 });
await mongoClient.connect();
db = mongoClient.db(config.DB_NAME);
console.log('✅ MongoDB connected:', config.DB_NAME);
return db;
} catch (err) {
console.error('❌ MongoDB connection failed:', err.message);
return null;
}
}

// ── Session helpers (MongoDB-backed) ─────────────────────────
async function saveSession(number, sessionData) {
if (!db) return;
try {
await db.collection(config.COLLECTIONS.SESSIONS).updateOne(
{ number },
{ $set: { number, sessionData, updatedAt: new Date() } },
{ upsert: true }
);
} catch (err) {
console.error('❌ Session save error:', err.message);
}
}

async function loadSession(number) {
if (!db) return null;
try {
const doc = await db.collection(config.COLLECTIONS.SESSIONS).findOne({ number });
return doc ? doc.sessionData : null;
} catch (err) {
console.error('❌ Session load error:', err.message);
return null;
}
}

// ── Per-number user config (in-memory, optionally persist) ───
const userConfigs = {};

function getUserConfig(number) {
if (!userConfigs[number]) {
userConfigs[number] = { ...config.DEFAULT_SETTINGS };
}
return userConfigs[number];
}

// ── Helper: check if JID is owner/sudo ──────────────────────
function isOwnerJid(jid, userConfig) {
const ownerNum = (userConfig?.OWNER_NUMBER || config.OWNER_NUMBER) + '@s.whatsapp.net';
const sudoList = userConfig?.SUDO || config.SUDO || [];
return jid === ownerNum || sudoList.includes(jid);
}

function isAdminJid(jid, participants) {
const p = participants.find(x => x.id === jid);
return p && (p.admin === 'admin' || p.admin === 'superadmin');
}

// ── Load all plugin files ─────────────────────────────────────
function loadPlugins() {
const pluginDirs = ['plugins', 'commands'];
for (const dir of pluginDirs) {
const fullPath = path.join(__dirname, dir);
if (!fs.existsSync(fullPath)) continue;
const files = fs.readdirSync(fullPath).filter(f => f.endsWith('.js'));
for (const file of files) {
try {
require(path.join(fullPath, file));
console.log(📦 Loaded: ${dir}/${file});
} catch (err) {
console.error(❌ Plugin load error [${file}]:, err.message);
}
}
}
console.log(✅ Total commands loaded: ${commands.length});
}

// ── Active connections map ────────────────────────────────────
//    number (string without @s.whatsapp.net) → { conn, pairingCode }
const connections = new Map();

// ── Start a WhatsApp connection for a given number ────────────
async function startBot(number) {
const sessionDir = path.join(__dirname, 'sessions', number);
fs.mkdirSync(sessionDir, { recursive: true });

const { state, saveCreds } = await useMultiFileAuthState(sessionDir);  
const { version }          = await fetchLatestBaileysVersion();  
const userConfig           = getUserConfig(number);  

const conn = makeWASocket({  
    version,  
    logger,  
    printQRInTerminal: false,  
    auth: state,  
    browser: ['AHMAD-MD', 'Chrome', '1.0.0'],  
    getMessage: async (key) => {  
        const msg = await require('./lib/store').loadMessage(key.id);  
        return msg ? msg.message.message : { conversation: '' };  
    },  
});  

conn.userConfig = userConfig;  

// ── Connection update ─────────────────────────────────────  
conn.ev.on('connection.update', async (update) => {  
    const { connection, lastDisconnect, qr } = update;  

    if (connection === 'close') {  
        const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;  
        console.log(`[${number}] Connection closed. Reason:`, reason);  

        const noReconnect = [  
            DisconnectReason.loggedOut,  
            DisconnectReason.badSession,  
        ];  

        if (noReconnect.includes(reason)) {  
            console.log(`[${number}] Session invalidated. Please re-pair.`);  
            connections.delete(number);  
            fs.rmSync(sessionDir, { recursive: true, force: true });  
        } else {  
            console.log(`[${number}] Reconnecting in 5s...`);  
            setTimeout(() => startBot(number), 5000);  
        }  
    }  

    if (connection === 'open') {  
        console.log(`✅ [${number}] Connected to WhatsApp!`);  

        // Follow configured channels  
        if (config.FOLLOW_CHANNEL_JIDS?.length) {  
            for (const jid of config.FOLLOW_CHANNEL_JIDS) {  
                try { await conn.newsletterFollow(jid); } catch {}  
            }  
        }  

        // Always online  
        if (userConfig.ALWAYS_ONLINE === 'true') {  
            await conn.sendPresenceUpdate('available').catch(() => {});  
        }  
    }  
});  

// ── Save credentials ──────────────────────────────────────  
conn.ev.on('creds.update', async (creds) => {  
    await saveCreds();  
    await saveSession(number, creds);  
});  

// ── Group participant events ───────────────────────────────  
conn.ev.on('group-participants.update', async (update) => {  
    try { await GroupEvents(conn, update); } catch {}  
});  

// ── Incoming calls (anti-call) ────────────────────────────  
conn.ev.on('call', async (calls) => {  
    if (userConfig.ANTI_CALL !== 'true') return;  
    for (const call of calls) {  
        if (call.status === 'offer') {  
            await conn.rejectCall(call.id, call.from).catch(() => {});  
            const msg = userConfig.REJECT_MSG || config.REJECT_MSG;  
            await conn.sendMessage(call.from, { text: msg }).catch(() => {});  
        }  
    }  
});  

// ── Messages ──────────────────────────────────────────────  
conn.ev.on('messages.upsert', async ({ messages, type }) => {  
    if (type !== 'notify') return;  

    for (const rawMsg of messages) {  
        try {  
            // Process and enrich message  
            const m = sms(conn, rawMsg, { loadMessage: require('./lib/store').loadMessage });  

            if (!m || !m.message) continue;  

            // Ignore broadcast/newsletter messages  
            if (m.key?.remoteJid === 'status@broadcast') {  
                if (userConfig.AUTO_VIEW_STATUS === 'true') {  
                    await conn.readMessages([m.key]).catch(() => {});  
                }  
                continue;  
            }  

            // Save message to store  
            await saveMessage(m).catch(() => {});  
            if (m.pushName) await saveContact(m.sender, m.pushName).catch(() => {});  

            // Auto read messages  
            if (userConfig.READ_MESSAGE === 'true') {  
                await conn.readMessages([m.key]).catch(() => {});  
            }  

            // Auto typing simulation  
            if (userConfig.AUTO_TYPING === 'true') {  
                await conn.sendPresenceUpdate('composing', m.chat).catch(() => {});  
            }  

            // Auto recording simulation  
            if (userConfig.AUTO_RECORDING === 'true') {  
                await conn.sendPresenceUpdate('recording', m.chat).catch(() => {});  
            }  

            // Auto react to owner's messages  
            if (userConfig.OWNER_REACT === 'true' && isOwnerJid(m.sender, userConfig)) {  
                const emojis = userConfig.OWNER_EMOJIS || config.OWNER_EMOJIS;  
                const emoji  = emojis[Math.floor(Math.random() * emojis.length)];  
                await m.react(emoji).catch(() => {});  
            }  

            // Auto react to all messages  
            if (userConfig.AUTO_REACT === 'true' && !m.fromMe) {  
                const emojis = userConfig.REACT_EMOJIS || config.REACT_EMOJIS;  
                const emoji  = emojis[Math.floor(Math.random() * emojis.length)];  
                await m.react(emoji).catch(() => {});  
            }  

            const body    = m.body || '';  
            const prefix  = userConfig.PREFIX || config.PREFIX || '.';  
            const isCmd   = body.startsWith(prefix);  
            const cmdName = isCmd ? body.slice(prefix.length).trim().split(' ')[0].toLowerCase() : '';  
            const args    = isCmd ? body.slice(prefix.length + cmdName.length).trim().split(' ') : [];  
            const text    = args.join(' ');  
            const isGroup = m.isGroup;  
            const sender  = m.sender || '';  
            const from    = m.chat;  

            // ── Anti-link (group only) ────────────────────  
            if (isGroup && userConfig.ANTI_LINK === 'true') {  
                const linkRegex = /https?:\/\/|wa\.me\/|chat\.whatsapp\.com\//i;  
                if (linkRegex.test(body)) {  
                    try {  
                        const meta    = await conn.groupMetadata(from);  
                        const botJid  = conn.user.id.split(':')[0] + '@s.whatsapp.net';  
                        const isAdmin = isAdminJid(botJid, meta.participants);  
                        const senderIsAdmin = isAdminJid(sender, meta.participants);  
                        const senderIsOwner = isOwnerJid(sender, userConfig);  

                        if (isAdmin && !senderIsAdmin && !senderIsOwner) {  
                            await conn.sendMessage(from, {  
                                delete: m.key  
                            }).catch(() => {});  
                            await conn.sendMessage(from, {  
                                text: `⚠️ @${sender.split('@')[0]}, links are not allowed in this group!`,  
                                mentions: [sender]  
                            }).catch(() => {});  
                        }  
                    } catch {}  
                }  
            }  

            // ── Command handler ───────────────────────────  
            if (!isCmd) continue;  

            // Find matching command  
            const command = commands.find(c => {  
                if (c.pattern === cmdName) return true;  
                if (c.alias && c.alias.includes(cmdName)) return true;  
                return false;  
            });  

            if (!command) continue;  

            // Determine permissions  
            const isOwner   = isOwnerJid(sender, userConfig);  
            const isSudo    = (userConfig.SUDO || config.SUDO || []).includes(sender);  
            const isBanned  = (userConfig.BANNED || config.BANNED || []).includes(sender);  

            if (isBanned && !isOwner) continue;  

            // Mode check (public / private)  
            const mode = userConfig.MODE || config.MODE || 'public';  
            if (mode === 'private' && !isOwner && !isSudo) continue;  

            // fromMe check  
            if (command.fromMe && !m.fromMe && !isOwner) continue;  

            // React to command  
            if (command.react) {  
                await m.react(command.react).catch(() => {});  
            }  

            // Build reply helper  
            const reply = async (text) => {  
                return conn.sendMessage(from, { text: String(text) }, { quoted: rawMsg });  
            };  

            // Get group admins if in group  
            let groupMetadata = null;  
            let groupAdmins   = [];  
            let isBotAdmin    = false;  
            let isSenderAdmin = false;  

            if (isGroup) {  
                try {  
                    groupMetadata  = await conn.groupMetadata(from);  
                    groupAdmins    = groupMetadata.participants  
                        .filter(p => p.admin)  
                        .map(p => p.id);  
                    const botJid   = conn.user?.id?.split(':')[0] + '@s.whatsapp.net';  
                    isBotAdmin     = groupAdmins.includes(botJid);  
                    isSenderAdmin  = groupAdmins.includes(sender);  
                } catch {}  
            }  

            // Execute command  
            await command.function(conn, rawMsg, m, {  
                from,  
                sender,  
                args,  
                text,  
                isGroup,  
                isOwner,  
                isSudo,  
                isBanned,  
                isBotAdmin,  
                isSenderAdmin,  
                groupMetadata,  
                groupAdmins,  
                reply,  
                prefix,  
                cmdName,  
                userConfig,  
                quoted: m.quoted,  
                mentionedJid: m.mentionedJid || [],  
                conn,  
            });  

        } catch (err) {  
            console.error('❌ Message handler error:', err.message);  
        }  
    }  
});  

connections.set(number, { conn });  
return conn;

}

// ── Pairing code API route ────────────────────────────────────
app.get('/code', async (req, res) => {
try {
let number = req.query.number;
if (!number) return res.json({ code: 'Please provide a number' });

// Clean number  
    number = number.replace(/[^0-9]/g, '').trim();  
    if (!number) return res.json({ code: 'Invalid number' });  

    // Validate MCC (country code)  
    const countryCode = Object.keys(PHONENUMBER_MCC).find(cc =>  
        number.startsWith(cc)  
    );  
    if (!countryCode) {  
        return res.json({ code: 'Invalid country code in number' });  
    }  

    // Check if already connected  
    if (connections.has(number)) {  
        const { conn } = connections.get(number);  
        if (conn.user) {  
            return res.json({ code: 'Already connected!' });  
        }  
    }  

    // Start new connection  
    const conn = await startBot(number);  

    // Request pairing code  
    if (!conn.authState.creds.registered) {  
        await new Promise(r => setTimeout(r, 1500));  
        const code = await conn.requestPairingCode(number);  
        const formatted = code?.match(/.{1,4}/g)?.join('-') || code;  
        return res.json({ code: formatted });  
    }  

    return res.json({ code: 'Already registered' });  

} catch (err) {  
    console.error('❌ Pairing code error:', err.message);  
    return res.json({ code: 'Service Unavailable' });  
}

});

// ── Status route ──────────────────────────────────────────────
app.get('/status', (req, res) => {
const active = [];
for (const [num, { conn }] of connections.entries()) {
active.push({
number : num,
connected: !!conn.user,
user  : conn.user?.id || null,
});
}
res.json({
bot    : config.BOT_NAME,
version: config.VERSION,
active,
uptime : Math.floor(process.uptime()) + 's',
});
});

// ── Main entry point ──────────────────────────────────────────
async function main() {
console.log(  ╔════════════════════════════════════╗   ║     AHMAD-MD WhatsApp Bot          ║   ║     Version: ${config.VERSION}         ║   ║     By: AHMADTech                  ║   ╚════════════════════════════════════╝  );

// Connect MongoDB  
await connectMongo();  

// Load all plugins  
loadPlugins();  

// Ensure sessions folder exists  
fs.mkdirSync(path.join(__dirname, 'sessions'), { recursive: true });  

// Auto-restart previously active sessions  
try {  
    const sessionsDir = path.join(__dirname, 'sessions');  
    const existing    = fs.readdirSync(sessionsDir).filter(d =>  
        fs.statSync(path.join(sessionsDir, d)).isDirectory()  
    );  
    for (const num of existing) {  
        console.log(`🔄 Restoring session for: ${num}`);  
        startBot(num).catch(err =>  
            console.error(`❌ Failed to restore session [${num}]:`, err.message)  
        );  
    }  
} catch {}  

// Start Express server  
app.listen(PORT, () => {  
    console.log(`🌐 Server running on port ${PORT}`);  
    console.log(`🔗 Pair your bot at: http://localhost:${PORT}`);  
});

}

// ── Graceful shutdown ─────────────────────────────────────────
process.on('SIGINT', async () => {
console.log('\n🛑 Shutting down...');
if (mongoClient) await mongoClient.close().catch(() => {});
process.exit(0);
});

process.on('uncaughtException', (err) => {
console.error('❌ Uncaught Exception:', err.message);
});

process.on('unhandledRejection', (err) => {
console.error('❌ Unhandled Rejection:', err?.message || err);
});

main();
