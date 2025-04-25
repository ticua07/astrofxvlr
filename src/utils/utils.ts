type getHTMLScoreProps = {
	team1: string;
	team2: string;
	score: string;
	results: string[];
	winnerImage: string;
	fullDate: string;
	time: string;
	path: string;
};

export function getHTMLScore({
	team1,
	team2,
	score,
	results,
	winnerImage,
	fullDate,
	time,
	path,
}: getHTMLScoreProps) {
	const template = `
  <!DOCTYPE html>
  <html>
  <head>
    <title>fxvlr: ${team1} ${score} ${team2}</title>
    <meta http-equiv="refresh" content="0;url=${path}" />
    <meta property="og:title" content="${team1} ${score} ${team2}">
    <meta property="twitter:title" content="${team1} ${score} ${team2}">
    <meta property="og:description" content="${results.join("\n")}\n\n${fullDate} · ${time}">
    <meta property="og:image" content="${winnerImage}">
    <meta property="og:site_name" content="fxvlr" />
    <meta name="theme-color" content="#ff5462">
    <meta name="twitter:card" content="summary" />
  </head>
  <body></body>
  </html>
  `;

	return template;
}

type formatScoresProps = {
	team1: string;
	team2: string;
	scores: {
		score: number;
		isWin: boolean;
	}[];
};

export function formatScores({ team1, team2, scores }: formatScoresProps) {
	const result = [];
	for (let i = 0; i < scores.length; i += 2) {
		const score1 = scores[i];
		const score2 = scores[i + 1];

		if (!score1.isWin && !score2.isWin) {
			result.push(`⚫ ${team1} ${score1.score} - ${score2.score} ${team2} ⚫`);
		} else {
			result.push(
				`${score1.isWin ? "🟢" : "🔴"} ${team1} ${score1.score} - ${score2.score} ${team2} ${score2.isWin ? "🟢" : "🔴"}`,
			);
		}

	}
	return result;
}

type getForumDataProps = {
	author: string;
	postTitle: string;
	postText: string;
	regionName: string;
	emoji: string;
	allComents: number;
	fragCount: string;
	roundedStars: number;
	path: string;
};
export function getForumData({
	author,
	postTitle,
	postText,
	regionName,
	emoji,
	allComents,
	fragCount,
	roundedStars,
	path,
}: getForumDataProps) {
	const template = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta http-equiv="refresh" content="0;url=${path}" />
    <title>fxvlr: @${author}</title>
    <link rel="canonical" href="${path}" />
    <meta property="og:url" content="${path}" />
    <meta property="twitter:site" content="@${author}" />
    <meta property="twitter:creator" content="@${author}" />
    <meta property="theme-color" content="#ff5462" />
    <meta property="twitter:title" content="@${author} - ${postTitle}" />
    <meta property="twitter:image" content="0" />
    <meta property="twitter:card" content="undefined" />
    <meta property="og:title" content="@${author} - ${postTitle}" />
    <meta property="og:description" content="${postText}\n\n${emoji} ${regionName} ⭐ ${roundedStars} 💬 ${allComents} 🗳️ ${fragCount} " />
    <meta property="og:site_name" content="vlr.gg" />
    <link href='https://www.vlr.gg/img/vlr/logo_header.png' rel='icon' sizes='36x36' type='image/png'>
  </head>
  <body>
  </body>
  </html>`;

	return template;
}

// chatgpt made this don't ask me nothing lmao
export function getFlagEmoji(countryCode: string) {
	if (!countryCode || countryCode.length !== 2) return null;
	return countryCode
		.toUpperCase()
		.split('')
		.map(char => String.fromCodePoint(char.charCodeAt(0) + 127397))
		.join('');
}