import * as cheerio from "cheerio";
import { getHTMLScore, getForumData, formatScores } from "../utils/utils"; // Adjust if needed

const error_template = `
<!DOCTYPE html>
<html>
  <head>
    <meta property="og:title" content="Couldn't fetch match data" />
  </head>
  <body></body>
</html>
`;

function parseMatchData($: cheerio.CheerioAPI, path: string) {
    const team1 = $(".match-header-link-name.mod-1 > .wf-title-med").text().trim();
    const team2 = $(".match-header-link-name.mod-2 > .wf-title-med").text().trim();

    const scoreSpans = $(".match-header-vs-score .js-spoiler > span");
    const leftScore = Number.parseInt(scoreSpans.eq(0).text().trim());
    const rightScore = Number.parseInt(scoreSpans.eq(2).text().trim());

    const isLive = Number.isNaN(leftScore) || Number.isNaN(rightScore);
    const upcomingNote = $(".match-header-vs-note.mod-upcoming").text().trim();
    const isUpcoming = Boolean(upcomingNote);

    const score = !Number.isNaN(leftScore) && !Number.isNaN(rightScore)
        ? `${leftScore}:${rightScore}`
        : isUpcoming
            ? `⏳ ${upcomingNote}`
            : "LIVE";

    const scoresList = $(".score").map((_, el) => ({
        score: Number.parseInt($(el).text().trim()),
        isWin: $(el).hasClass("mod-win"),
    })).get();

    const results = isUpcoming
        ? [`Match starts in ${upcomingNote}`]
        : scoresList.length > 0
            ? formatScores({ team1, team2, scores: scoresList })
            : ["Match is live or starting soon."];

    const normalizeUrl = (url?: string) => url?.startsWith("//") ? `https:${url}` : (url ?? "");

    const team1Image = normalizeUrl($("a.match-header-link.mod-1 img").attr("src"));
    const team2Image = normalizeUrl($("a.match-header-link.mod-2 img").attr("src"));
    const winnerImage = (!isLive && rightScore > leftScore) ? team2Image : team1Image;

    const fullDate = $(".match-header-date .moment-tz-convert")
        .eq(0)
        .text()
        .trim();
    const time = $(".match-header-date .moment-tz-convert").eq(1).text().trim();

    return {
        team1,
        team2,
        score,
        results,
        winnerImage,
        fullDate,
        time,
        path,
    };
}

function tryGetForumData($: cheerio.CheerioAPI, path: string) {
    const author = $(".post-header-author-username").text().trim();
    const postText = $(".post-body").first().text().trim();
    const allComents = $(".vm-comment").length;
    const fragCount = $(".post-frag").text().trim();
    const starsText = $(".rating-full-stars").attr("style") ?? "";
    const roundedStars = Math.round(
        Number.parseFloat(starsText.replace(/[^0-9.]/g, "")) / 20
    ); // convert from percent to 0–5 scale

    if (author && postText) {
        return getForumData({
            author,
            postText,
            allComents,
            fragCount,
            roundedStars,
            path,
        });
    }

    return null;
}

export async function GET({ params }: { params: any }) {
    const slug: string[] = params.slug;
    console.log(slug)
    const path = `https://www.vlr.gg/${slug}`

    try {
        const res = await fetch(path);
        if (!res.ok) throw new Error("Match not found");
        const html = await res.text();

        const $ = cheerio.load(html);
        const forumMeta = tryGetForumData($, path);
        if (forumMeta) {
            return new Response(forumMeta, {
                headers: { "Content-Type": "text/html; charset=utf-8" },
            });
        }

        const matchMeta = parseMatchData($, path);
        const renderedHTML = getHTMLScore(matchMeta);

        return new Response(renderedHTML, {
            headers: { "Content-Type": "text/html; charset=utf-8" },
        });
    } catch (e) {
        return new Response(error_template, {
            headers: { "Content-Type": "text/html; charset=utf-8" },
            status: 500,
        });
    }
}
