import * as cheerio from "cheerio";
import type { APIRoute } from "astro";
import { getHTMLScore, formatScores, getForumData, getFlagEmoji } from "../utils/utils";

const error_template = `
<html>
<head>
  <meta property="og:title" content="Couldn't fetch match data">
</head>
<body></body>
</html>
`;

function getMatchScore($: cheerio.CheerioAPI, path: string) {
    const team1 = $(".match-header-link-name.mod-1 > .wf-title-med")
        .text()
        .replaceAll("\n", "")
        .replaceAll("\t", "");
    const team2 = $(".match-header-link-name.mod-2 > .wf-title-med")
        .text()
        .replaceAll("\n", "")
        .replaceAll("\t", "");

    const scoreSpans = $(".match-header-vs-score .js-spoiler > span");
    const leftScoreText = scoreSpans.eq(0).text().trim();
    const rightScoreText = scoreSpans.eq(2).text().trim();

    const leftScore = Number.parseInt(leftScoreText);
    const rightScore = Number.parseInt(rightScoreText);

    const isLive = Number.isNaN(leftScore) || Number.isNaN(rightScore);

    const upcomingNote = $(".match-header-vs-note.mod-upcoming").text().trim();
    const isUpcoming = Boolean(upcomingNote);

    let score = "LIVE";
    if (!Number.isNaN(leftScore) && !Number.isNaN(rightScore)) {
        score = `${leftScore}:${rightScore}`;
    } else if (isUpcoming) {
        score = `⏳ ${upcomingNote}`;
    }

    const scoresList = $(".score")
        .map((_, el) => ({
            score: Number.parseInt($(el).text().trim()),
            isWin: $(el).hasClass("mod-win"),
        }))
        .get();

    const results = isUpcoming
        ? [`Match starts in ${upcomingNote}`]
        : scoresList.length > 0
            ? formatScores({
                team1,
                team2,
                scores: scoresList,
            })
            : ["Match is live or starting soon."];

    const team1Image = $("a.match-header-link.mod-1 img").attr("src");
    const team2Image = $("a.match-header-link.mod-2 img").attr("src");

    const normalizeUrl = (url?: string) =>
        url?.startsWith("//") ? `https:${url}` : (url ?? "");

    let winnerImage = normalizeUrl(team1Image);
    if (!isLive && rightScore > leftScore) {
        winnerImage = normalizeUrl(team2Image);
    }

    const fullDate = $(".match-header-date .moment-tz-convert")
        .eq(0)
        .text()
        .trim();
    const time = $(".match-header-date .moment-tz-convert").eq(1).text().trim();

    if (!score || !fullDate || !time) {
        return null;
    }

    return getHTMLScore({
        team1,
        team2,
        score,
        results,
        winnerImage,
        fullDate,
        time,
        path,
    });
}

export const GET: APIRoute = async ({ request, url }) => {
    const id = url.pathname.substring(1);
    const path = `https://vlr.gg${url.pathname}`;
    if (!id) {
        return new Response(error_template, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }

    try {
        const res = await fetch(`https://vlr.gg/${id}`);
        const html = await res.text();
        const $ = cheerio.load(html);

        const matchData = getMatchScore($, path);
        if (matchData !== null) {
            return new Response(matchData, {
                headers: { "Content-Type": "text/html; charset=utf-8" },
            });
        }

        const author = $("a.post-header-author").first().text().trim();
        const postTitle = $("h1").first().text().trim();

        const flagElement = $('i.post-header-flag.flag').filter((_, el) => {
            const classList = $(el).attr('class')?.split(/\s+/);
            return classList?.some(cls => cls.startsWith('mod-'));
        }).first();
        const classList = flagElement.attr('class')?.split(/\s+/) || [];
        const modClass = classList.find(cls => cls.startsWith('mod-'));
        const regionCode = modClass?.slice(4);

        const regionName = new Intl.DisplayNames(['en'], { type: 'region' }).of(regionCode?.toUpperCase());
        const postText = $("p", $(".post-body").first()).text().trim();
        const allComents = $(".post").length;
        const fragCount = $("#thread-frag-count").text().trim();

        let totalStars = 0;
        $(".star", $(".post-header-stars").first()).each((_, el) => {
            const classList = $(el).attr("class")?.split(" ");
            const modClass = classList?.find((cls) => cls.startsWith("mod-"));
            const value = Number.parseInt((modClass || "").replace("mod-", ""), 10);
            totalStars += value / 3;
        });

        const roundedStars = Math.round(totalStars * 2) / 2;

        // biome-ignore lint/style/noNonNullAssertion: should be present idk
        const emoji = getFlagEmoji(regionCode!);

        const forumData = getForumData({
            author,
            postTitle,
            postText,
            regionName,
            emoji,
            allComents,
            fragCount,
            roundedStars,
            path,
        });

        return new Response(forumData, {
            headers: { "Content-Type": "text/html; charset=utf-8" },
        });
    } catch (err) {
        console.log("Error fetching or parsing data:", err);
        return new Response(error_template, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }
};
