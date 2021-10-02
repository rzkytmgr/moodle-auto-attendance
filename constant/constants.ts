import config from "../attendance.conf.json";

export const loginUrl: string = process.env.LOGIN_URL || process.env.WEB_URL + "login/index.php";
export const upcomingUrl: string = process.env.WEB_URL + "calendar/view.php?view=" + config.attendanceOpt.type;
export const productionMode: boolean = true;
