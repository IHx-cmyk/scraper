/*
  • melolo
  • Saluran: https://whatsapp.com/channel/0029Vb08kk8KwqSRh2Y4U20i
*/


const axios = require("axios");
const cheerio = require("cheerio");

const BASE = "https://melolo.com";

const headers = {
  "User-Agent": "Mozilla/5.0",
  "Accept-Language": "en-US,en;q=0.9"
};

const melolo = {
  async fetch(url) {
    const { data } = await axios.get(url, { headers });
    return cheerio.load(data);
  },

  async latest() {
    try {
      const $ = await this.fetch(BASE);
      const results = [];

      $("a").each((_, el) => {
        const title = $(el).text().trim();
        const href = $(el).attr("href");

        if (title && href && !href.startsWith("#") && href !== "/") {
          results.push({
            title,
            link: href.startsWith("http") ? href : BASE + href
          });
        }
      });

      return {
        status: true,
        total: results.length,
        data: [...new Map(results.map(x => [x.link, x])).values()]
      };
    } catch (err) {
      return { status: false, error: err.message };
    }
  },

  async search(query) {
    try {
      const $ = await this.fetch(BASE);
      const results = [];

      $("a").each((_, el) => {
        const title = $(el).text().trim();
        const href = $(el).attr("href");

        if (
          title &&
          title.toLowerCase().includes(query.toLowerCase()) &&
          href
        ) {
          results.push({
            title,
            link: href.startsWith("http") ? href : BASE + href
          });
        }
      });

      return {
        status: true,
        query,
        total: results.length,
        data: [...new Map(results.map(x => [x.link, x])).values()]
      };
    } catch (err) {
      return { status: false, error: err.message };
    }
  },

  async detail(url) {
    try {
      const $ = await this.fetch(url);

      return {
        status: true,
        title: $("h1").first().text().trim(),
        description: $("p").first().text().trim(),
        image: $("img").first().attr("src"),
        canonical: $('link[rel="canonical"]').attr("href") || url
      };
    } catch (err) {
      return { status: false, error: err.message };
    }
  },

  async stream(url) {
    try {
      const { data } = await axios.get(url, { headers });
      const $ = cheerio.load(data);

      const streams = [];

      // watch links
      $("a").each((_, el) => {
        const text = $(el).text().trim();
        const href = $(el).attr("href");

        if (
          href &&
          /watch|stream|play|episode/i.test(text + " " + href)
        ) {
          streams.push({
            type: "watch_link",
            text,
            url: href.startsWith("http")
              ? href
              : new URL(href, url).href
          });
        }
      });

      // iframe
      $("iframe").each((_, el) => {
        const src = $(el).attr("src");
        if (src) {
          streams.push({
            type: "iframe",
            url: src.startsWith("http")
              ? src
              : new URL(src, url).href
          });
        }
      });

      // video
      $("video source").each((_, el) => {
        const src = $(el).attr("src");
        if (src) {
          streams.push({
            type: "video_source",
            url: src.startsWith("http")
              ? src
              : new URL(src, url).href
          });
        }
      });

      return {
        status: true,
        original_url: url,
        total_streams: streams.length,
        streams
      };
    } catch (err) {
      return { status: false, error: err.message };
    }
  }
};

module.exports = melolo;

// ===== TEST =====
if (require.main === module) {
  (async () => {
    const testUrl =
      "https://melolo.com/guides/top-six-suspense-short-dramas";

    console.log("=== LATEST ===");
    console.log(await melolo.latest());

    console.log("\n=== SEARCH ===");
    console.log(await melolo.search("drama"));

    console.log("\n=== DETAIL ===");
    console.log(await melolo.detail(testUrl));

    console.log("\n=== STREAM ===");
    console.log(await melolo.stream(testUrl));
  })();
}
