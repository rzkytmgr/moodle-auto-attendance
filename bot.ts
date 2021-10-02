import cron, { CronJob } from "cron";
import Core from "./core/index";

const bot: CronJob = new CronJob(
	"1 * * * * *",
	async function () {
		console.log("🤖", "Stating Moodle Auto Attendance Bot!");
		// @ts-ignore
		await Core({ username: process.env.USERNAME_LOGIN, password: process.env.PASSWORD_LOGIN });
	},
	null,
	true,
	"Asia/Jakarta",
);

bot.start();
