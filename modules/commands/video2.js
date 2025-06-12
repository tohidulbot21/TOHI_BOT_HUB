module.exports.config = {
  name: "video2",
  version: "1.0.0",
  hasPermssion: 0,
  usePrefix: true,
  credits: "MD Tohidul Islam",
  description: "Search for videos on YouTube.",
  commandCategory: "Media",
  usages: "[search]",
  cooldowns: 5,
  dependencies: {
    "request": "",
    "fs-extra": "",
    "yt-search": "",
    "node-superfetch": "",
    "axios": ""
  }
};

module.exports.handleReply = async function({ api, event, handleReply }) {
  const ytdl = global.nodemodule["@distube/ytdl-core"];
  const { createReadStream, createWriteStream, unlinkSync, statSync } = global.nodemodule["fs-extra"];

  try {
    // Clean up thumbnail cache files first
    for(let ii = 1; ii < 7; ii++) {
      try {
        unlinkSync(__dirname + `/cache/${ii}.png`);
        console.log(`[VIDEO] Thumbnail cache deleted: ${ii}.png`);
      } catch(err) {
        // File might not exist, ignore error
      }
    }

    const videoId = handleReply.link[event.body - 1];
    const info = await ytdl.getInfo(videoId);
    let body = info.videoDetails.title;

    const processingMsg = await api.sendMessage(`Processing video... \n-----------\n${body}\n-----------\nPlease Wait !`, event.threadID);

    // Use a simpler filename
    const fileName = `video_${Date.now()}.mp4`;
    const filePath = __dirname + `/cache/${fileName}`;

    const stream = ytdl(videoId, { 
      filter: 'videoandaudio',
      quality: 'lowest',
      requestOptions: {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      },
      agent: false,
      debug: false
    });

    stream.pipe(createWriteStream(filePath))
      .on("close", () => {
        try {
          const fileSize = statSync(filePath).size;

          // Remove processing message
          if (processingMsg && processingMsg.messageID) {
            api.unsendMessage(processingMsg.messageID);
          }

          if (fileSize > 26214400) {
            unlinkSync(filePath);
            return api.sendMessage('❌ File cannot be sent because it is larger than 25MB.', event.threadID, event.messageID);
          } else {
            return api.sendMessage({
              body: `✅ ${body}`,
              attachment: createReadStream(filePath)
            }, event.threadID, () => {
              try {
                unlinkSync(filePath);
                console.log(`[VIDEO] Cache file deleted: ${fileName}`);
              } catch(cleanupErr) {
                console.log(`[VIDEO] Cache cleanup error: ${cleanupErr.message}`);
              }
            }, event.messageID);
          }
        } catch(fileError) {
          console.log('File processing error:', fileError);
          api.sendMessage("❌ Error processing video file. Please try again.", event.threadID, event.messageID);
        }
      })
      .on("error", (error) => {
        console.log('Stream error:', error);

        // Remove processing message
        if (processingMsg && processingMsg.messageID) {
          api.unsendMessage(processingMsg.messageID);
        }

        // Clean up partial file
        try {
          unlinkSync(filePath);
        } catch(e) {}

        api.sendMessage(`❌ Download failed: ${error.message}\nPlease try another video.`, event.threadID, event.messageID);
      });
  }
  catch (error) {
    console.log('Video download error:', error);
    api.sendMessage("❌ Unable to process your request! The video may be unavailable or restricted.", event.threadID, event.messageID);
  }

  // Clean up reply handler
  return api.unsendMessage(handleReply.messageID);
}

module.exports.run = async function({ api, event, args }) {
  const { request, fs, writeFileSync, unlinkSync, readFileSync } = global.nodemodule["fs-extra"];
  const axios = global.nodemodule["axios"];
  const yts = require("yt-search");
  const ytdl = global.nodemodule["@distube/ytdl-core"];
  const { createReadStream, createWriteStream, statSync } = global.nodemodule["fs-extra"];
  const keyword = args.join(" ");
  if (!keyword) return api.sendMessage("Please enter keywords to search.", event.threadID, event.messageID);

  try {
    const searchResults = await yts(keyword);
    const videos = searchResults.videos.slice(0, 6);

    if (videos.length === 0) return api.sendMessage("No video found with that keyword.", event.threadID, event.messageID);

    let messageText = "🔎Here are the top 6 videos matching your search:\n";
    for (let i = 0; i < videos.length; i++) {
      messageText += `\n${i + 1}. ${videos[i].title} (${videos[i].timestamp})`;
    }
    messageText += "\n\nReply to this message with the video number you want to download.";

    const attachments = [];
    for (let i = 0; i < videos.length; i++) {
      const imageUrl = videos[i].thumbnail;
      const imagePath = __dirname + `/cache/${i + 1}.png`;

      const response = await axios({
        url: imageUrl,
        method: 'GET',
        responseType: 'stream'
      });

      response.data.pipe(createWriteStream(imagePath));
      await new Promise((resolve, reject) => {
        response.data.on('end', resolve);
        response.data.on('error', reject);
      });
      attachments.push(createReadStream(imagePath));
    }

    api.sendMessage({
      body: messageText,
      attachment: attachments
    }, event.threadID, (err, messageInfo) => {
      global.client.handleReply.push({
        name: this.config.name,
        messageID: messageInfo.messageID,
        author: event.senderID,
        link: videos.map(v => v.url)
      })
    }, event.messageID);

    // Clean up thumbnail cache files immediately after sending
    setTimeout(() => {
      for(let ii = 1; ii < 7; ii++) {
        try {
          unlinkSync(__dirname + `/cache/${ii}.png`);
          console.log(`[VIDEO] Thumbnail cache deleted: ${ii}.png`);
        } catch(err) {
          // File might not exist, ignore error
        }
      }
    }, 2000); // Clean up after 2 seconds

  } catch (error) {
    console.error(error);
    api.sendMessage("An error occurred while searching for videos.", event.threadID, event.messageID);
  }

  // Direct URL handling
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urlValid = urlRegex.test(args[0]);

  if (urlValid) {
    try {
      var id = args[0].split(/(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/);
      (id[2] !== undefined) ? id = id[2].split(/[^0-9a-z_\-]/i)[0] : id = id[0];

      const processingMsg = await api.sendMessage("⏳ Processing video... Please wait!", event.threadID);

      const fileName = `video_${Date.now()}.mp4`;
      const filePath = __dirname + `/cache/${fileName}`;

      const stream = ytdl(args[0], { 
        filter: 'videoandaudio',
        quality: 'lowest',
        requestOptions: {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        },
        agent: false,
        debug: false
      });

      stream.pipe(createWriteStream(filePath))
        .on("close", () => {
          try {
            const fileSize = statSync(filePath).size;

            // Remove processing message
            if (processingMsg && processingMsg.messageID) {
              api.unsendMessage(processingMsg.messageID);
            }

            if (fileSize > 26214400) {
              unlinkSync(filePath);
              return api.sendMessage('❌ File cannot be sent because it is larger than 25MB.', event.threadID, event.messageID);
            } else {
              return api.sendMessage({
                body: "✅ Video downloaded successfully!",
                attachment: createReadStream(filePath)
              }, event.threadID, () => {
                try {
                  unlinkSync(filePath);
                  console.log(`[VIDEO] Cache file deleted: ${fileName}`);
                } catch(cleanupErr) {
                  console.log(`[VIDEO] Cache cleanup error: ${cleanupErr.message}`);
                }
              }, event.messageID);
            }
          } catch(fileError) {
            console.log('File processing error:', fileError);
            api.sendMessage("❌ Error processing video file. Please try again.", event.threadID, event.messageID);
          }
        })
        .on("error", (error) => {
          console.log('Stream error:', error);

          // Remove processing message
          if (processingMsg && processingMsg.messageID) {
            api.unsendMessage(processingMsg.messageID);
          }

          // Clean up partial file
          try {
            unlinkSync(filePath);
          } catch(e) {}

          api.sendMessage(`❌ Download failed: ${error.message}`, event.threadID, event.messageID);
        });
    }
    catch (error) {
      console.log('Direct download error:', error);
      api.sendMessage("❌ Unable to process your request! Please try another video URL.", event.threadID, event.messageID);
    }
  }
};