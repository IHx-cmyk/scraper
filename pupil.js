const axios = require("axios");
const cheerio = require("cheerio");

const BASE = "https://pupilvideo.blogspot.com";

const pupilvideo = {
  async latest() {
    try {
      const { data } = await axios.get(BASE, {
        headers: {
          "User-Agent": "Mozilla/5.0"
        }
      });

      const $ = cheerio.load(data);
      const results = [];

      $("a").each((_, el) => {
        const title = $(el).text().trim();
        const href = $(el).attr("href");

        if (
          title &&
          href &&
          href.includes("blogspot.com") &&
          /\/\d{4}\//.test(href)
        ) {
          results.push({
            title,
            link: href
          });
        }
      });

      const unique = [
        ...new Map(results.map(x => [x.link, x])).values()
      ];

      return {
        status: true,
        total: unique.length,
        data: unique
      };
    } catch (err) {
      return {
        status: false,
        error: err.message
      };
    }
  },

  async search(query) {
    const latest = await this.latest();

    if (!latest.status) return latest;

    const filtered = latest.data.filter(item =>
      item.title.toLowerCase().includes(query.toLowerCase())
    );

    return {
      status: true,
      query,
      total: filtered.length,
      data: filtered
    };
  },

  async detail(url) {
    try {
      const { data } = await axios.get(url, {
        headers: {
          "User-Agent": "Mozilla/5.0"
        }
      });

      const $ = cheerio.load(data);

      const title =
        $("h1").first().text().trim() ||
        $("title").text().trim();

      const description =
        $(".post-body").text().trim() ||
        $("body").text().slice(0, 300).trim();

      const videos = [];

      $("iframe, video source, a").each((_, el) => {
        const src =
          $(el).attr("src") ||
          $(el).attr("href");

        if (
          src &&
          (src.includes("drive.google") ||
            src.includes("youtube") ||
            src.includes("mp4") ||
            src.includes("video"))
        ) {
          videos.push(src);
        }
      });

      return {
        status: true,
        title,
        description,
        videos: [...new Set(videos)]
      };
    } catch (err) {
      return {
        status: false,
        error: err.message
      };
    }
  }
};

module.exports = pupilvideo;

// test
if (require.main === module) {
  (async () => {
    console.log("=== LATEST ===");
    console.log(await pupilvideo.latest());

    console.log("\n=== SEARCH ===");
    console.log(await pupilvideo.search("ben 10"));

    console.log("\n=== DETAIL ===");
    console.log(
      await pupilvideo.detail(
        "https://pupilvideo.blogspot.com/2022/10/ben-10-alien-force-3-seasons.html"
      )
    );
  })();
}
