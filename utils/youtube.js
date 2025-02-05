const ax = require("axios").default;
const { UserAgent } = require("./index");
const yts = require("yt-search");

/**
 * Search on YouTube
 * @param {String} query query to search
 * @param {"long"|"short"} type search type
 */
const search = async (query, type) => {
    if (!type) type = "short";
    let final, data1, data2;
    if (type === "long") {
        data1 = await yts(query);
        final = data1.videos;
    } else if (type === "short") {
        data2 = await yts(query);
        final = data2.videos.filter((vid) => vid.seconds <= 240);
    }
    data1 = null,
        data2 = null;
    return final;
}

/**
 * Download from YouTube
 * @param {string} url YouTube video URL
 * @param {"video"|"audio"} type download type
 */
const yt = (url, type) => new Promise(async (resolve, reject) => {
    let agent = UserAgent();
    let data;
    const escapeTitle = (text) => {
        return text.replace(/([><:"\/\\\?\|\*])/g, "");
    }
    let { data: postData } = await ax.post("https://yt1s.com/api/ajaxSearch/index", new URLSearchParams(
        Object.entries({
            q: url, vt: "home"
        })
    ), {
        headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "User-Agent": agent,
            "origin": "https://yt1s.com",
            "referer": "https://yt1s.com",
            "accept-language": "id,en-US;q=0.9,en;q=0.8,es;q=0.7,ms;q=0.6"
        }
    });
    if (!postData?.links?.mp4["18"] || !postData?.links?.mp3["mp3128"]) resolve("no_file");
    let { data: convertData } = await ax.post("https://yt1s.com/api/ajaxConvert/convert", new URLSearchParams(
        Object.entries({
            vid: postData?.vid, k: type === "audio" ? postData?.links?.mp3["mp3128"]["k"] : postData?.links?.mp4["18"]["k"]
        })
    ), {
        headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "User-Agent": agent,
            "origin": "https://yt1s.com",
            "referer": "https://yt1s.com",
            "accept-language": "id,en-US;q=0.9,en;q=0.8,es;q=0.7,ms;q=0.6"
        }
    });
    const sizeF = type === "audio" ? postData?.links?.mp3?.mp3128?.size : postData?.links?.mp4?.["18"]?.size;
    data = {
        title: escapeTitle(postData.title),
        sizeF,
        size: parseFloat(sizeF) * (1000 * /MB$/.test(sizeF)),
        id: postData.vid,
        thumb: `https://i.ytimg.com/vi/${postData.vid}/0.jpg`,
        dl_link: convertData.dlink,
        q: type === "audio" ? postData.links.mp3.mp3128.q : postData.links.mp4["18"].q
    }
    resolve(data);
    postData = null,
        convertData = null,
        data = null;
});

module.exports = { yt, search }