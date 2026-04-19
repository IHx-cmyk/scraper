const axios = require("axios");
const cheerio = require("cheerio");

const BASE = "https://pupilvideo.blogspot.com";

const pupilvideo = {
  async search(query) {
    try {
      const { data } = await axios.get(
        `${BASE}/feeds/posts/default?alt=json&max-results=500`,
        {
          headers: {
            "User-Agent": "Mozilla/5.0"
          }
        }
      );

      const entries = data.feed?.entry || [];

      const results = entries
        .map(entry => ({
          title: entry.title?.$t || "",
          link:
            entry.link?.find(x => x.rel === "alternate")?.href || null,
          published: entry.published?.$t || null
        }))
        .filter(item =>
          item.title.toLowerCase().includes(query.toLowerCase())
        );

      return {
        status: true,
        query,
        total: results.length,
        data: results
      };
    } catch (err) {
      return {
        status: false,
        error: err.response?.status || err.message
      };
    }
  },

  async download(postUrl) {
    try {
      const { data } = await axios.get(postUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0"
        }
      });

      const $ = cheerio.load(data);

      const title =
        $("h1").first().text().trim() ||
        $("title").text().trim();

      const downloads = [];

      $("a, iframe, video source").each((_, el) => {
        const href =
          $(el).attr("href") ||
          $(el).attr("src");

        if (!href) return;

        // filter link movie / download
        if (
          href.includes("drive.google") ||
          href.includes("mega.nz") ||
          href.includes("pixeldrain") ||
          href.includes("mp4") ||
          href.includes("mkv") ||
          href.includes("video") ||
          href.includes("download")
        ) {
          downloads.push(href);
        }
      });

      return {
        status: true,
        title,
        total_links: downloads.length,
        links: [...new Set(downloads)]
      };
    } catch (err) {
      return {
        status: false,
        error: err.response?.status || err.message
      };
    }
  }
};

module.exports = pupilvideo;

// ===== TEST =====
if (require.main === module) {
  (async () => {
    console.log("=== SEARCH ===");
    const res = await pupilvideo.search("alien");
    console.log(JSON.stringify(res, null, 2));

    if (res.status && res.data.length) {
      console.log("\n=== DOWNLOAD ===");
      const dl = await pupilvideo.download(res.data[0].link);
      console.log(JSON.stringify(dl, null, 2));
    }
  })();
}
