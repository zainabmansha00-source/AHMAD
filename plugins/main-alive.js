const { cmd } = require('../command');
const axios = require('axios');
const os = require('os');
const config = require('../config');
const { runtime } = require('../lib/functions');

cmd({
    pattern: "alive",
    alias: ["darkzone", "status", "irfan", "test", "a"],
    react: "💚",
    desc: "Check if bot is alive with image, video note and live ping",
    category: "main",
    use: ".alive",
    filename: __filename
},
async (conn, mek, m, { from, sender, reply }) => {
    try {
        // Calculate initial ping
        const startTime = Date.now();
        
        // URLs
        const imageUrl = "https://files.catbox.moe/nysjhm.jpg";
        const videoNoteUrl = "https://files.catbox.moe/t9dj8o.mp4";
        
        // Calculate ping
        const ping = Date.now() - startTime;

        // Get system info
        const uptimeString = runtime(process.uptime());
        const usedMemory = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
        const totalMemory = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
        const platform = os.platform();

        // Bot info from config
        const botName = config.BOT_NAME || "DARKZONE-MD";
        const ownerName = config.OWNER_NAME || "DEVELOPER";
        const prefix = config.PREFIX || ".";
        const mode = config.MODE || "public";

        // Create compact alive message
        const aliveMessage = `┏━━━━❰ *${botName}* ❱━━━━┓
┃ ✨ ʙᴏᴛ ɪs ᴏɴʟɪɴᴇ & ᴀᴄᴛɪᴠᴇ
┗━━━━━━━━━━━━━━━━━┛

┏━❰ 📊 sᴛᴀᴛᴜs ❱━┓
┃ ⚡ ᴘɪɴɢ: ${ping}ms
┃ 🚀 sᴛᴀᴛᴜs: ᴏɴʟɪɴᴇ
┃ ⏱️ ᴜᴘᴛɪᴍᴇ: ${uptimeString}
┗━━━━━━━━━━━━━┛

┏━❰ 🤖 ʙᴏᴛ ɪɴғᴏ ❱━┓
┃ 📛 ɴᴀᴍᴇ: ${botName}
┃ 👑 ᴏᴡɴᴇʀ: ${ownerName}
┃ 📝 ᴘʀᴇғɪx: [ ${prefix} ]
┃ 📳 ᴍᴏᴅᴇ: ${mode}
┗━━━━━━━━━━━━━┛

┏━❰ 💻 sʏsᴛᴇᴍ ❱━┓
┃ 🧠 ʀᴀᴍ: ${usedMemory}MB
┃ 💾 ᴛᴏᴛᴀʟ: ${totalMemory}GB
┃ 🖥️ ᴘʟᴀᴛғᴏʀᴍ: ${platform}
┗━━━━━━━━━━━━━┛`;

        // Send alive message with IMAGE and CHANNEL link
        const sentMessage = await conn.sendMessage(from, {
            image: { url: imageUrl },
            caption: aliveMessage,
            contextInfo: {
                mentionedJid: [sender],
                forwardingScore: 1000,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363416743041101@newsletter',
                    newsletterName: '𝐃𝐀𝐑𝐊𝐙𝐎𝐍𝐄-𝐌𝐃',
                    serverMessageId: 143
                }
            }
        }, { quoted: mek });

        // Send Video Note AFTER the image message
        try {
            const videoResponse = await axios({
                method: 'GET',
                url: videoNoteUrl,
                responseType: 'arraybuffer',
                timeout: 30000,
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            
            const videoBuffer = Buffer.from(videoResponse.data);
            
            if (videoBuffer && videoBuffer.length > 0) {
                await conn.sendMessage(from, {
                    video: videoBuffer,
                    ptv: true,
                    gifPlayback: false
                }, { quoted: mek });
                
                console.log("[Alive] Video note sent successfully");
            }
        } catch (videoErr) {
            console.log("[Alive] Video note failed:", videoErr.message);
        }

        // ========== AUTO-EDIT PING FEATURE ==========
        let editCount = 0;
        const maxEdits = 12;

        const pingInterval = setInterval(async () => {
            try {
                editCount++;
                
                if (editCount >= maxEdits) {
                    clearInterval(pingInterval);
                    
                    const finalPing = Date.now() - startTime;
                    const newUptime = runtime(process.uptime());
                    
                    const finalMessage = `┏━━━━❰ *${botName}* ❱━━━━┓
┃ ✅ sᴘᴇᴇᴅ ᴛᴇsᴛ ᴄᴏᴍᴘʟᴇᴛᴇ
┗━━━━━━━━━━━━━━━━━┛

┏━❰ 📊 ғɪɴᴀʟ ʀᴇsᴜʟᴛ ❱━┓
┃ ⚡ ғɪɴᴀʟ ᴘɪɴɢ: ${finalPing}ms
┃ 🚀 sᴛᴀᴛᴜs: ᴏɴʟɪɴᴇ
┃ ✅ ᴛᴇsᴛ: ᴄᴏᴍᴘʟᴇᴛᴇ
┃ ⏱️ ᴜᴘᴛɪᴍᴇ: ${newUptime}
┗━━━━━━━━━━━━━┛

┏━❰ 🤖 ʙᴏᴛ ɪɴғᴏ ❱━┓
┃ 📛 ɴᴀᴍᴇ: ${botName}
┃ 👑 ᴏᴡɴᴇʀ: ${ownerName}
┃ 📝 ᴘʀᴇғɪx: [ ${prefix} ]
┗━━━━━━━━━━━━━┛

> ⌨️ ᴛʏᴘᴇ *${prefix}menu* ғᴏʀ ᴄᴏᴍᴍᴀɴᴅs
> 🌟 *${botName}* - sᴘᴇᴇᴅ ᴛᴇsᴛ ᴅᴏɴᴇ!`;
                    
                    await conn.sendMessage(from, {
                        text: finalMessage,
                        edit: sentMessage.key
                    });
                    
                    return;
                }

                // Calculate real-time ping
                const pingStart = Date.now();
                await conn.sendPresenceUpdate('composing', from);
                const currentPing = Date.now() - pingStart;

                const newUptime = runtime(process.uptime());
                const progress = Math.floor((editCount / maxEdits) * 10);
                const progressBar = '█'.repeat(progress) + '░'.repeat(10 - progress);
                const remainingTime = (maxEdits - editCount) * 5;

                const editedMessage = `┏━━━━❰ *${botName}* ❱━━━━┓
┃ 🔄 ʟɪᴠᴇ sᴘᴇᴇᴅ ᴛᴇsᴛ
┗━━━━━━━━━━━━━━━━━┛

┏━❰ ⚡ ʟɪᴠᴇ ᴘɪɴɢ ❱━┓
┃ 📶 ᴄᴜʀʀᴇɴᴛ: ${currentPing}ms
┃ 🚀 sᴛᴀᴛᴜs: ᴏɴʟɪɴᴇ
┃ 🔄 ᴜᴘᴅᴀᴛᴇ: #${editCount}/${maxEdits}
┗━━━━━━━━━━━━━┛

┏━❰ ⏳ ᴘʀᴏɢʀᴇss ❱━┓
┃ [${progressBar}] ${Math.floor((editCount / maxEdits) * 100)}%
┃ ⏱️ ʀᴇᴍᴀɪɴɪɴɢ: ${remainingTime}s
┗━━━━━━━━━━━━━┛

┏━❰ 🤖 ɪɴғᴏ ❱━┓
┃ 📛 ${botName}
┃ 👑 ${ownerName}
┃ ⏱️ ${newUptime}
┗━━━━━━━━━━━━━┛

> 🔄 ᴀᴜᴛᴏ-ᴜᴘᴅᴀᴛɪɴɢ ᴇᴠᴇʀʏ 5s...`;

                await conn.sendMessage(from, {
                    text: editedMessage,
                    edit: sentMessage.key
                });

            } catch (editErr) {
                console.log("[Alive] Edit error:", editErr.message);
                clearInterval(pingInterval);
            }
        }, 5000);

    } catch (e) {
        console.error("[Alive] Error:", e);
        reply("❌ An error occurred. Please try again.\n\n_DARKZONE-MD_");
    }
});
