const axios = require("axios");
const fs = require("fs-extra");
module.exports.config = {
  'name': '4k',
  'version': "1.0.0",
  'hasPermssion': 0x0,
  'credits': "nazrul",
  'premium': false,
  usePrefix: true,
  'description': "Enhance Photo",
  'commandCategory': "without prefix",
  'usages': "reply image",
  'cooldowns': 0x5,
  'dependencies': {
    'path': '',
    'fs-extra': ''
  }
};
module.exports.run = async function ({
  api: _0x35648a,
  event: _0xadd78e,
  args: _0x1da3bd
}) {
  const _0x979f8 = __dirname + "/cache/remove_bg.jpg";
  const {
    threadID: _0x505ee2,
    messageID: _0x4c4974
  } = _0xadd78e;
  const _0x37a8cc = _0xadd78e.messageReply ? _0xadd78e.messageReply.attachments[0].url : _0x1da3bd.join(" ");
  if (!_0x37a8cc) {
    _0x35648a.sendMessage("Please reply to a photo ", _0x505ee2, _0x4c4974);
    return;
  }
  try {
    const _0x2a6e15 = await _0x35648a.sendMessage("𝐏𝐥𝐞𝐚𝐬𝐞 𝐖𝐚𝐢𝐭 𝐁𝐚𝐛𝐲...😘", _0xadd78e.threadID);
    const _0x3a6b64 = await axios.get("https://yt-video-production.up.railway.app/upscale?imageUrl=" + encodeURIComponent(_0x37a8cc));
    const _0x2bfc9c = _0x3a6b64.data.imageUrl;
    const _0x4ba5e0 = (await axios.get(_0x2bfc9c, {
      'responseType': "arraybuffer"
    })).data;
    fs.writeFileSync(_0x979f8, Buffer.from(_0x4ba5e0, "binary"));
    _0x35648a.sendMessage({
      'body': "𝐈𝐦𝐚𝐠𝐞 𝐆𝐞𝐧𝐞𝐫𝐚𝐭𝐞𝐝 𝐒𝐮𝐜𝐜𝐞𝐟𝐮𝐥",
      'attachment': fs.createReadStream(_0x979f8)
    }, _0x505ee2, () => {
      // Clean up cache file after sending
      try {
        if (fs.existsSync(_0x979f8)) {
          fs.unlinkSync(_0x979f8);
          console.log(`[4K] Cleaned up cache file: ${_0x979f8}`);
        }
      } catch (cleanupError) {
        console.log(`[4K] Cache cleanup warning: ${cleanupError.message}`);
      }
    }, _0x4c4974);
    _0x35648a.unsendMessage(_0x2a6e15.messageID);
  } catch (_0x5def0b) {
    try {
      _0x35648a.sendMessage("Error processing image: " + _0x5def0b.message, _0x505ee2, _0x4c4974);
    } catch (sendError) {
      // Silent fail if message send fails
      console.log("[4K] Failed to send error message:", sendError.message);
    }
  }
};