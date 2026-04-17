const axios = require("axios");
const cheerio = require("cheerio");

async function mediafire(url) {
  try {
    const { data } = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept-Language": "en-US,en;q=0.9"
      }
    });

    const $ = cheerio.load(data);

    // selector utama tombol download
    let direct =
      $("#downloadButton").attr("href") ||
      $("a.input.popsok").attr("href");

    // fallback regex kalau selector berubah
    if (!direct) {
      const match = data.match(/https:\/\/download\d+\.mediafire\.com\/[^\s"'<>]+/);
      if (match) direct = match[0];
    }

    if (!direct) {
      return {
        status: false,
        error: "Direct link tidak ditemukan"
      };
    }

    const fileName =
      $("#downloadButton").text().trim() ||
      direct.split("/").pop();

    return {
      status: true,
      original: url,
      filename: fileName,
      direct
    };
  } catch (err) {
    return {
      status: false,
      error: err.message
    };
  }
}

// test langsung
if (require.main === module) {
  (async () => {
    const test =
      "https://www.mediafire.com/file/xxxxxxxx/sample.zip/file";

    console.log(await mediafire(test));
  })();
}

module.exports = mediafire;
