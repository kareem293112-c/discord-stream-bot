import { Client } from "discord.js-selfbot-v13";
import { Streamer } from '@dank074/discord-video-stream';
import express from 'express';

// 1. خادم ويب وهمي لإبقاء الخدمة تعمل مجاناً على رندر
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('سيرفر البث يعمل بنجاح في الخلفية!'));
app.listen(PORT, () => console.log(`Web Server listening on port ${PORT}`));

// 2. إعداد عميل الديسكورد الذاتي ومستقبل حزم الفيديو
const client = new Client();
const streamer = new Streamer(client);
const PREFIX = '!';

client.on('ready', () => {
    console.log(`🚀 تم تشغيل الحساب بنجاح: ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (!message.content.startsWith(PREFIX) || message.author.bot) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'stream') {
        const movieUrl = args[0];
        const subtitleUrl = args[1]; 

        if (!movieUrl) return message.reply("❌ الرجاء كتابة رابط الفيديو! مثال:\n`!stream http://site.com/movie.mp4` ");

        const voiceChannel = message.member?.voice.channel;
        if (!voiceChannel) return message.reply("❌ يجب أن تكون داخل قناة صوتية ليتمكن البوت من فتح الشير!");

        try {
            message.reply("🎬 جاري الاتصال بالقناة الصوتية وفتح بث الشاشة (Go Live)...");
            
            // الانضمام لقناة الصوت
            await streamer.joinVoice(voiceChannel.guild.id, voiceChannel.id);

            // إنشاء اتصال البث المباشر للشاشة بدقة عالية
            const udpConnection = await streamer.createStream({
                width: 1280,
                height: 720,
                fps: 30,
                bitrate: 3500000,
                type: 'go-live' // فتح بث شاشة حقيقي للمستخدمين
            });

            udpConnection.mediaConnection.setSpeaking(true);
            udpConnection.mediaConnection.setVideoStatus(true);

            // إعدادات فلتر FFmpeg للترجمة التلقائية
            let ffmpegOptions = [];
            if (subtitleUrl) {
                ffmpegOptions = ['-vf', `subtitles=${subtitleUrl}`];
            }

            // تشغيل وبث الفيديو
            streamer.playStream(movieUrl, udpConnection, ffmpegOptions);
            message.channel.send(`📺 بدأ البث الآن داخل قنوات **${voiceChannel.name}** مع الترجمة!`);

        } catch (error) {
            console.error(error);
            message.channel.send("⚠️ حدث خطأ أثناء تشغيل البث. تأكد من إعدادات الرابط وحالة السيرفر.");
        }
    }

    if (command === 'stop') {
        streamer.leaveVoice();
        message.reply("🛑 تم إيقاف الشير ومغادرة القناة الصوتية بنجاح.");
    }
});

// تسجيل الدخول بالتوكن الخاص من متغيرات البيئة
client.login(process.env.DISCORD_TOKEN);
