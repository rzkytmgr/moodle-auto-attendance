import Puppeteer from "puppeteer";

import dotenv from "dotenv";
dotenv.config();

import delay from "../lib/delay";
import { Events, Credential } from "../constant/interface";
import { loginUrl, productionMode, upcomingUrl } from "../constant/constants";

export default async function Core(credentials: Credential): Promise<any> {
	const Browser = await Puppeteer.launch({ headless: productionMode });

	try {
		const Page = await Browser.newPage();

		await Page.goto(loginUrl, { waitUntil: "load" });

		await Page.type("input[name=username]", credentials.username, { delay: 10 });
		await Page.type("input[name=password]", credentials.password, { delay: 10 });

		const [_, navigation] = await Promise.allSettled([Page.click("button[type=submit]", { delay: 10 }), Page.waitForNavigation()]);

		// @ts-ignore
		if (navigation.value._request._url.includes(process.env.LOGIN_URL?.split("/").slice(3).join("/") || "/login/index.php")) {
			console.debug("⚠️", "Username or Password Wrong!");
			await Browser.close();
		}

		await Page.waitForSelector("span.usertext");

		await Page.goto(upcomingUrl, { waitUntil: "load" });
		await Page.waitForSelector("div[data-view=" + upcomingUrl.split("=")[1] + "] div.eventlist");

		const events: Array<Events> = await Page.evaluate(function () {
			return [...document.querySelectorAll("div.card.rounded")].map((element) => {
				const cardBody = element.querySelectorAll("div.card-body div.row");
				return {
					title: element.querySelector("div.card-header h3.name")?.textContent,
					time: cardBody[0].querySelector("div.col-xs-11")?.textContent?.split(",")[1].trim().replace("»", "-"),
					study: cardBody[2].querySelector("div.col-xs-11")?.textContent,
					link: element.querySelector("div.card-footer a.card-link")?.getAttribute("href"),
				};
			});
		});

		if (events.length === 0) {
			await Browser.close();
			return console.debug("🤨", "No Activities\n");
		}

		for (let event of events) {
			if (!event.link?.includes("attendance")) continue;

			const attendance = await Browser.newPage();

			// @ts-ignore
			await attendance.goto(event?.link, { waitUntil: "load" });

			const attendanceLink = await attendance.evaluate(function () {
				const element = document.querySelector("td.statuscol.lastcol a");
				return !element ? undefined : element?.getAttribute("href");
			});

			if (!attendanceLink) {
				attendance.close();
				console.debug("👎", event.study);
				continue;
			}

			// @ts-ignore
			await attendance.goto(attendanceLink, { waitUntil: "load" });

			await attendance.waitForSelector("fieldset div.d-flex.flex-wrap", { timeout: 10000 });

			const meta = await attendance.evaluate(() => {
				let elements = document.querySelectorAll("label.form-check-inline.form-check-label");
				const btn = document.querySelector("input#id_submitbutton");

				if (!elements) return undefined;
				if (!btn) return undefined;

				// @ts-ignore
				[...elements][0].click();
				// @ts-ignore
				btn.click();
			});
			await attendance.waitForNavigation({ waitUntil: "load" });
			await attendance.close();
			console.debug('👍', event.study);
			await delay(3000);
		}

		await Browser.close();
	} catch (Exception: any) {
		await Browser.close();
		console.debug("⚠️","Error: ", Exception);
	}
}
