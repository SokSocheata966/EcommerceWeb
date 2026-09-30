const { bot } = require("../config/telegram");

async function sendOtp(chatId, otp) {
    return await bot.sendMessage(
        chatId,
`🔐 PASSWORD RESET OTP

Your OTP: ${otp}

⏰ Valid for 5 minutes`
    );
}

async function sendMessage(chatId, message, options = { parse_mode: 'Markdown' }) {
    if (!bot) throw new Error("Telegram bot is not initialized");
    return await bot.sendMessage(chatId, message, options);
}

module.exports = {
    sendOtp,
    sendMessage
};